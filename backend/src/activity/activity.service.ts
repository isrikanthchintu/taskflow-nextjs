import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ClientSession, FilterQuery, Model, Types } from "mongoose";
import { AccessService } from "@/access/access.service";
import { validationError } from "@/common/errors";
import {
  ACTIVITY_TYPES,
  Activity,
  ActivityType,
  Notification,
  OutboxEvent
} from "@/database/schemas/activity.schema";
import { Card, CardMember, CardWatcher } from "@/database/schemas/card.schema";

export interface RecordActivityInput {
  boardId: Types.ObjectId;
  cardId?: Types.ObjectId | null;
  actorId: Types.ObjectId | null;
  type: ActivityType;
  payload: Record<string, unknown>;
  notify?: Types.ObjectId[];
}

export interface ActivityPage {
  items: Array<{
    id: string;
    boardId: string;
    cardId: string | null;
    actorId: string | null;
    type: ActivityType;
    payload: Record<string, unknown>;
    createdAt: string;
  }>;
  nextCursor: string | null;
}

@Injectable()
export class ActivityService {
  constructor(
    @InjectModel(Activity.name) private readonly activities: Model<Activity>,
    @InjectModel(Notification.name) private readonly notifications: Model<Notification>,
    @InjectModel(OutboxEvent.name) private readonly outbox: Model<OutboxEvent>,
    @InjectModel(Card.name) private readonly cards: Model<Card>,
    @InjectModel(CardMember.name) private readonly cardMembers: Model<CardMember>,
    @InjectModel(CardWatcher.name) private readonly cardWatchers: Model<CardWatcher>,
    private readonly access: AccessService
  ) {}

  async record(session: ClientSession, input: RecordActivityInput): Promise<Types.ObjectId> {
    const cardId = input.cardId ?? null;
    const [activity] = await this.activities.create(
      [
        {
          boardId: input.boardId,
          cardId,
          actorId: input.actorId,
          type: input.type,
          payload: input.payload
        }
      ],
      { session }
    );

    if (cardId) {
      await this.cards.updateOne({ _id: cardId }, { $set: { lastActivityAt: (activity as unknown as { createdAt: Date }).createdAt } }, { session });
    }

    await this.outbox.create(
      [
        {
          boardId: input.boardId,
          type: input.type.replace("_", "."),
          payload: { activityId: String(activity._id), cardId: cardId ? String(cardId) : null, ...input.payload }
        }
      ],
      { session }
    );

    await this.fanOut(session, activity._id, input, cardId);
    return activity._id;
  }

  private async fanOut(
    session: ClientSession,
    activityId: Types.ObjectId,
    input: RecordActivityInput,
    cardId: Types.ObjectId | null
  ): Promise<void> {
    const candidates = new Map<string, Types.ObjectId>();
    const add = (id: Types.ObjectId) => candidates.set(String(id), id);

    if (cardId) {
      const [members, watchers] = await Promise.all([
        this.cardMembers.find({ cardId }, null, { session }),
        this.cardWatchers.find({ cardId }, null, { session })
      ]);
      members.forEach((m) => add(m.userId));
      watchers.forEach((w) => add(w.userId));
    }
    (input.notify ?? []).forEach(add);
    if (input.actorId) {
      candidates.delete(String(input.actorId));
    }

    const recipients: Types.ObjectId[] = [];
    for (const userId of candidates.values()) {
      if (await this.access.canRead(userId, input.boardId, session)) {
        recipients.push(userId);
      }
    }
    if (recipients.length === 0) {
      return;
    }
    await this.notifications.insertMany(
      recipients.map((userId) => ({ userId, activityId })),
      { session }
    );
  }

  async list(
    scope: { boardId?: Types.ObjectId; cardId?: Types.ObjectId },
    options: { cursor?: string; limit?: number; types?: string[] }
  ): Promise<ActivityPage> {
    const limit = Math.min(Math.max(options.limit ?? 25, 1), 100);
    const filter: FilterQuery<Activity> = { ...scope };
    if (options.types?.length) {
      const invalid = options.types.filter((t) => !(ACTIVITY_TYPES as readonly string[]).includes(t));
      if (invalid.length) {
        throw validationError([{ field: "types", code: "INVALID", message: `Unknown types: ${invalid.join(", ")}` }]);
      }
      filter.type = { $in: options.types as ActivityType[] };
    }
    if (options.cursor) {
      if (!Types.ObjectId.isValid(options.cursor)) {
        throw validationError([{ field: "cursor", code: "INVALID", message: "Invalid cursor." }]);
      }
      filter._id = { $lt: new Types.ObjectId(options.cursor) };
    }
    const rows = await this.activities.find(filter).sort({ _id: -1 }).limit(limit + 1).lean();
    const page = rows.slice(0, limit);
    return {
      items: page.map((row) => ({
        id: String(row._id),
        boardId: String(row.boardId),
        cardId: row.cardId ? String(row.cardId) : null,
        actorId: row.actorId ? String(row.actorId) : null,
        type: row.type,
        payload: row.payload,
        createdAt: (row as unknown as { createdAt: Date }).createdAt.toISOString()
      })),
      nextCursor: rows.length > limit ? String(page[page.length - 1]._id) : null
    };
  }
}
