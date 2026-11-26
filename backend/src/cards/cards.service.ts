import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { ClientSession, Model, Types } from "mongoose";
import { AccessService } from "@/access/access.service";
import { ActivityService } from "@/activity/activity.service";
import { AuthUser } from "@/auth/auth.guard";
import { CardUserDto, CreateCardDto, MoveCardDto, UpdateCardDto } from "@/cards/cards.dto";
import { conflict, notFound, validationError } from "@/common/errors";
import { oid } from "@/common/object-id";
import { evenlySpacedPositions, isValidPosition, needsRebalance, positionAfter } from "@/common/position";
import { sanitizeRichText } from "@/common/sanitize";
import { AppEnv } from "@/config/env";
import { Activity, Notification } from "@/database/schemas/activity.schema";
import { BoardMember } from "@/database/schemas/board.schema";
import {
  Attachment,
  Checklist,
  ChecklistItem,
  Comment,
  Reaction
} from "@/database/schemas/card-content.schema";
import { Card, CardDocument, CardLabel, CardMember, CardWatcher } from "@/database/schemas/card.schema";
import { User } from "@/database/schemas/identity.schema";
import { Label } from "@/database/schemas/label.schema";
import { BoardList } from "@/database/schemas/list.schema";
import { TransactionService } from "@/database/transaction.service";

const iso = (value: Date | null | undefined) => (value ? value.toISOString() : null);

@Injectable()
export class CardsService {
  constructor(
    @InjectModel(Card.name) private readonly cards: Model<Card>,
    @InjectModel(BoardList.name) private readonly lists: Model<BoardList>,
    @InjectModel(BoardMember.name) private readonly boardMembers: Model<BoardMember>,
    @InjectModel(CardMember.name) private readonly cardMembers: Model<CardMember>,
    @InjectModel(CardWatcher.name) private readonly cardWatchers: Model<CardWatcher>,
    @InjectModel(CardLabel.name) private readonly cardLabels: Model<CardLabel>,
    @InjectModel(Label.name) private readonly labels: Model<Label>,
    @InjectModel(Checklist.name) private readonly checklists: Model<Checklist>,
    @InjectModel(ChecklistItem.name) private readonly checklistItems: Model<ChecklistItem>,
    @InjectModel(Attachment.name) private readonly attachments: Model<Attachment>,
    @InjectModel(Comment.name) private readonly comments: Model<Comment>,
    @InjectModel(Reaction.name) private readonly reactions: Model<Reaction>,
    @InjectModel(Activity.name) private readonly activities: Model<Activity>,
    @InjectModel(Notification.name) private readonly notifications: Model<Notification>,
    @InjectModel(User.name) private readonly users: Model<User>,
    private readonly access: AccessService,
    private readonly activity: ActivityService,
    private readonly transactions: TransactionService,
    private readonly config: ConfigService
  ) {}

  private view(card: CardDocument) {
    return {
      id: String(card._id),
      boardId: String(card.boardId),
      listId: String(card.listId),
      title: card.title,
      description: card.description,
      position: card.position,
      version: card.version,
      isComplete: card.isComplete,
      completedAt: iso(card.completedAt),
      startAt: iso(card.startAt),
      dueAt: iso(card.dueAt),
      dueComplete: card.dueComplete,
      coverAttachmentId: card.coverAttachmentId ? String(card.coverAttachmentId) : null,
      isArchived: card.isArchived,
      createdBy: String(card.createdBy),
      createdAt: iso((card as unknown as { createdAt: Date }).createdAt),
      updatedAt: iso((card as unknown as { updatedAt: Date }).updatedAt),
      lastActivityAt: iso(card.lastActivityAt)
    };
  }

  private assertPosition(position: string): void {
    if (!isValidPosition(position)) {
      throw validationError([{ field: "position", code: "INVALID", message: "Position key is not valid." }]);
    }
  }

  private async load(id: string, userId: Types.ObjectId, permission: "read" | "comment" | "edit") {
    const card = await this.cards.findById(oid(id));
    if (!card) {
      throw notFound();
    }
    await this.access.requireBoard(userId, card.boardId, permission);
    return card;
  }

  private async activeList(listId: Types.ObjectId, boardId: Types.ObjectId, session?: ClientSession) {
    const list = await this.lists.findById(listId, null, { session });
    if (!list || !list.boardId.equals(boardId)) {
      throw validationError([{ field: "listId", code: "INVALID", message: "List does not belong to this board." }]);
    }
    if (list.isArchived) {
      throw conflict("LIST_ARCHIVED", "The destination list is archived.");
    }
    return list;
  }

  async create(user: AuthUser, boardId: string, dto: CreateCardDto) {
    const userId = oid(user.id);
    const { board } = await this.access.requireBoard(userId, oid(boardId), "edit");
    if (dto.position !== undefined) {
      this.assertPosition(dto.position);
    }
    const card = await this.transactions.run(async (session) => {
      const list = await this.activeList(oid(dto.listId), board._id, session);
      const last = await this.cards
        .findOne({ listId: list._id, isArchived: false }, "position", { session })
        .sort({ position: -1 });
      const [doc] = await this.cards.create(
        [
          {
            boardId: board._id,
            listId: list._id,
            title: dto.title,
            description: sanitizeRichText(dto.description ?? ""),
            position: dto.position ?? positionAfter(last?.position ?? null),
            createdBy: userId
          }
        ],
        { session }
      );
      await this.activity.record(session, {
        boardId: board._id,
        cardId: doc._id,
        actorId: userId,
        type: "card_created",
        payload: { cardId: String(doc._id), cardTitle: doc.title, listId: String(list._id), listName: list.name }
      });
      return (await this.cards.findById(doc._id, null, { session })) as CardDocument;
    });
    return this.view(card);
  }

  async get(user: AuthUser, id: string) {
    const card = await this.load(id, oid(user.id), "read");
    const [labelLinks, memberRows, watcherRows, checklists, attachments] = await Promise.all([
      this.cardLabels.find({ cardId: card._id }).lean(),
      this.cardMembers.find({ cardId: card._id }).lean(),
      this.cardWatchers.find({ cardId: card._id }).lean(),
      this.checklists.find({ cardId: card._id }).sort({ position: 1, _id: 1 }).lean(),
      this.attachments.find({ cardId: card._id }).sort({ createdAt: 1 }).lean()
    ]);
    const [labels, items] = await Promise.all([
      this.labels.find({ _id: { $in: labelLinks.map((l) => l.labelId) } }).lean(),
      this.checklistItems.find({ checklistId: { $in: checklists.map((c) => c._id) } }).sort({ position: 1, _id: 1 }).lean()
    ]);
    return {
      ...this.view(card),
      labels: labels.map((l) => ({ id: String(l._id), name: l.name, color: l.color })),
      memberIds: memberRows.map((m) => String(m.userId)),
      watcherIds: watcherRows.map((w) => String(w.userId)),
      checklists: checklists.map((c) => ({
        id: String(c._id),
        title: c.title,
        position: c.position,
        items: items
          .filter((i) => String(i.checklistId) === String(c._id))
          .map((i) => ({ id: String(i._id), text: i.text, isChecked: i.isChecked, position: i.position }))
      })),
      attachments: attachments.map((a) => ({
        id: String(a._id),
        name: a.name,
        mimeType: a.mimeType,
        size: a.size,
        uploadedBy: String(a.uploadedBy)
      }))
    };
  }

  async update(user: AuthUser, id: string, dto: UpdateCardDto) {
    const userId = oid(user.id);
    const card = await this.load(id, userId, "edit");
    const set: Record<string, unknown> = {};
    if (dto.title !== undefined) set.title = dto.title;
    if (dto.description !== undefined) set.description = sanitizeRichText(dto.description);
    if (dto.startAt !== undefined) set.startAt = dto.startAt;
    if (dto.dueAt !== undefined) set.dueAt = dto.dueAt;
    if (dto.dueComplete !== undefined) set.dueComplete = dto.dueComplete;

    const dueChanged = dto.dueAt !== undefined && iso(dto.dueAt) !== iso(card.dueAt);
    const filter: Record<string, unknown> = { _id: card._id };
    if (dto.expectedVersion !== undefined) filter.version = dto.expectedVersion;

    const updated = await this.transactions.run(async (session) => {
      const doc = await this.cards.findOneAndUpdate(
        filter,
        { $set: set, $inc: { version: 1 } },
        { new: true, session }
      );
      if (!doc) {
        throw conflict("VERSION_CONFLICT", "The card was modified by someone else. Reload and try again.");
      }
      await this.activity.record(session, {
        boardId: card.boardId,
        cardId: card._id,
        actorId: userId,
        type: dueChanged ? "due_changed" : "card_updated",
        payload: dueChanged
          ? { cardId: String(card._id), cardTitle: doc.title, from: iso(card.dueAt), to: iso(doc.dueAt) }
          : { cardId: String(card._id), cardTitle: doc.title, fields: Object.keys(set) }
      });
      return (await this.cards.findById(doc._id, null, { session })) as CardDocument;
    });
    return this.view(updated);
  }

  async remove(user: AuthUser, id: string): Promise<void> {
    const userId = oid(user.id);
    const card = await this.load(id, userId, "edit");
    await this.transactions.run(async (session) => {
      const checklistIds = (await this.checklists.find({ cardId: card._id }, "_id", { session }).lean()).map((c) => c._id);
      const commentIds = (await this.comments.find({ cardId: card._id }, "_id", { session }).lean()).map((c) => c._id);
      await this.reactions.deleteMany({ commentId: { $in: commentIds } }, { session });
      await this.comments.deleteMany({ cardId: card._id }, { session });
      await this.checklistItems.deleteMany({ checklistId: { $in: checklistIds } }, { session });
      await this.checklists.deleteMany({ cardId: card._id }, { session });
      await this.attachments.deleteMany({ cardId: card._id }, { session });
      await this.cardLabels.deleteMany({ cardId: card._id }, { session });
      const recipients = [
        ...(await this.cardMembers.find({ cardId: card._id }, null, { session }).lean()).map((m) => m.userId)
      ];
      await this.activity.record(session, {
        boardId: card.boardId,
        actorId: userId,
        type: "card_deleted",
        payload: { cardId: String(card._id), cardTitle: card.title },
        notify: recipients
      });
      await this.cardMembers.deleteMany({ cardId: card._id }, { session });
      await this.cardWatchers.deleteMany({ cardId: card._id }, { session });
      await this.cards.deleteOne({ _id: card._id }, { session });
    });
  }

  private async rebalance(listId: Types.ObjectId, session: ClientSession): Promise<void> {
    const rows = await this.cards
      .find({ listId, isArchived: false }, "_id", { session })
      .sort({ position: 1, _id: 1 });
    const keys = evenlySpacedPositions(rows.length);
    await this.cards.bulkWrite(
      rows.map((row, index) => ({ updateOne: { filter: { _id: row._id }, update: { $set: { position: keys[index] } } } })),
      { session }
    );
  }

  async move(user: AuthUser, id: string, dto: MoveCardDto) {
    const userId = oid(user.id);
    const card = await this.load(id, userId, "edit");
    this.assertPosition(dto.position);
    const threshold = this.config.getOrThrow<AppEnv>("app").positionRebalanceThreshold;

    const updated = await this.transactions.run(async (session) => {
      const destination = await this.activeList(oid(dto.listId), card.boardId, session);
      const origin = await this.lists.findById(card.listId, null, { session });
      const filter: Record<string, unknown> = { _id: card._id };
      if (dto.expectedVersion !== undefined) filter.version = dto.expectedVersion;
      const doc = await this.cards.findOneAndUpdate(
        filter,
        { $set: { listId: destination._id, position: dto.position }, $inc: { version: 1 } },
        { new: true, session }
      );
      if (!doc) {
        throw conflict("VERSION_CONFLICT", "The card was moved or modified by someone else. Reload and try again.");
      }
      if (needsRebalance(dto.position, threshold)) {
        await this.rebalance(destination._id, session);
      }
      await this.activity.record(session, {
        boardId: card.boardId,
        cardId: card._id,
        actorId: userId,
        type: "card_moved",
        payload: {
          cardId: String(card._id),
          cardTitle: card.title,
          fromList: { id: String(card.listId), name: origin?.name ?? null },
          toList: { id: String(destination._id), name: destination.name }
        }
      });
      return (await this.cards.findById(doc._id, null, { session })) as CardDocument;
    });
    return this.view(updated);
  }

  private async setComplete(user: AuthUser, id: string, isComplete: boolean) {
    const userId = oid(user.id);
    const card = await this.load(id, userId, "edit");
    const completedAt = isComplete ? new Date() : null;
    const updated = await this.transactions.run(async (session) => {
      const doc = await this.cards.findByIdAndUpdate(
        card._id,
        { $set: { isComplete, completedAt }, $inc: { version: 1 } },
        { new: true, session }
      );
      await this.activity.record(session, {
        boardId: card.boardId,
        cardId: card._id,
        actorId: userId,
        type: isComplete ? "card_completed" : "card_uncompleted",
        payload: isComplete
          ? { cardId: String(card._id), cardTitle: card.title, completedAt: completedAt?.toISOString() }
          : { cardId: String(card._id), cardTitle: card.title }
      });
      return (await this.cards.findById(doc?._id, null, { session })) as CardDocument;
    });
    return this.view(updated);
  }

  complete(user: AuthUser, id: string) {
    return this.setComplete(user, id, true);
  }

  uncomplete(user: AuthUser, id: string) {
    return this.setComplete(user, id, false);
  }

  private async setArchived(user: AuthUser, id: string, isArchived: boolean) {
    const userId = oid(user.id);
    const card = await this.load(id, userId, "edit");
    const updated = await this.transactions.run(async (session) => {
      if (!isArchived) {
        await this.activeList(card.listId, card.boardId, session);
      }
      const doc = await this.cards.findByIdAndUpdate(
        card._id,
        { $set: { isArchived }, $inc: { version: 1 } },
        { new: true, session }
      );
      await this.activity.record(session, {
        boardId: card.boardId,
        cardId: card._id,
        actorId: userId,
        type: isArchived ? "card_archived" : "card_restored",
        payload: { cardId: String(card._id), cardTitle: card.title }
      });
      return (await this.cards.findById(doc?._id, null, { session })) as CardDocument;
    });
    return this.view(updated);
  }

  archive(user: AuthUser, id: string) {
    return this.setArchived(user, id, true);
  }

  restore(user: AuthUser, id: string) {
    return this.setArchived(user, id, false);
  }

  async activityFeed(user: AuthUser, id: string, options: { cursor?: string; limit?: number; types?: string[] }) {
    const card = await this.load(id, oid(user.id), "read");
    return this.activity.list({ cardId: card._id }, options);
  }

  async listMembers(user: AuthUser, id: string) {
    const card = await this.load(id, oid(user.id), "read");
    const rows = await this.cardMembers.find({ cardId: card._id }).lean();
    const users = await this.users.find({ _id: { $in: rows.map((r) => r.userId) } }).lean();
    const byId = new Map(users.map((u) => [String(u._id), u]));
    return rows.map((r) => ({ userId: String(r.userId), name: byId.get(String(r.userId))?.name ?? null }));
  }

  async addMember(user: AuthUser, id: string, dto: CardUserDto) {
    const userId = oid(user.id);
    const card = await this.load(id, userId, "edit");
    const targetId = oid(dto.userId);
    if (!(await this.boardMembers.exists({ boardId: card.boardId, userId: targetId }))) {
      throw validationError([{ field: "userId", code: "NOT_BOARD_MEMBER", message: "User is not a board member." }]);
    }
    if (await this.cardMembers.exists({ cardId: card._id, userId: targetId })) {
      throw conflict("ALREADY_ASSIGNED", "User is already assigned to this card.");
    }
    await this.transactions.run(async (session) => {
      await this.cardMembers.create([{ cardId: card._id, userId: targetId }], { session });
      await this.activity.record(session, {
        boardId: card.boardId,
        cardId: card._id,
        actorId: userId,
        type: "member_added",
        payload: { cardId: String(card._id), cardTitle: card.title, userId: String(targetId) },
        notify: [targetId]
      });
    });
    return { userId: String(targetId) };
  }

  async removeMember(user: AuthUser, id: string, userIdParam: string): Promise<void> {
    const userId = oid(user.id);
    const card = await this.load(id, userId, "edit");
    const targetId = oid(userIdParam);
    await this.transactions.run(async (session) => {
      const result = await this.cardMembers.deleteOne({ cardId: card._id, userId: targetId }, { session });
      if (result.deletedCount === 0) {
        throw notFound();
      }
      await this.activity.record(session, {
        boardId: card.boardId,
        cardId: card._id,
        actorId: userId,
        type: "member_removed",
        payload: { cardId: String(card._id), cardTitle: card.title, userId: String(targetId) },
        notify: [targetId]
      });
    });
  }

  async listWatchers(user: AuthUser, id: string) {
    const card = await this.load(id, oid(user.id), "read");
    const rows = await this.cardWatchers.find({ cardId: card._id }).lean();
    return rows.map((r) => ({ userId: String(r.userId) }));
  }

  async addWatcher(user: AuthUser, id: string, dto: CardUserDto) {
    const userId = oid(user.id);
    const card = await this.load(id, userId, "read");
    const targetId = oid(dto.userId);
    if (!targetId.equals(userId)) {
      await this.access.requireBoard(userId, card.boardId, "edit");
    }
    if (!(await this.access.canRead(targetId, card.boardId))) {
      throw validationError([{ field: "userId", code: "NO_ACCESS", message: "User cannot access this board." }]);
    }
    await this.cardWatchers.updateOne(
      { cardId: card._id, userId: targetId },
      { $setOnInsert: { cardId: card._id, userId: targetId } },
      { upsert: true }
    );
    return { userId: String(targetId) };
  }

  async removeWatcher(user: AuthUser, id: string, userIdParam: string): Promise<void> {
    const userId = oid(user.id);
    const card = await this.load(id, userId, "read");
    const targetId = oid(userIdParam);
    if (!targetId.equals(userId)) {
      await this.access.requireBoard(userId, card.boardId, "edit");
    }
    await this.cardWatchers.deleteOne({ cardId: card._id, userId: targetId });
  }
}
