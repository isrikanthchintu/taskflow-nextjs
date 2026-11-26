import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { ClientSession, Model, Types } from "mongoose";
import { AccessService } from "@/access/access.service";
import { ActivityService } from "@/activity/activity.service";
import { AuthUser } from "@/auth/auth.guard";
import { AppEnv } from "@/config/env";
import { conflict, notFound, validationError } from "@/common/errors";
import { oid } from "@/common/object-id";
import { evenlySpacedPositions, isValidPosition, needsRebalance, positionAfter } from "@/common/position";
import { Card } from "@/database/schemas/card.schema";
import { BoardList, BoardListDocument } from "@/database/schemas/list.schema";
import { TransactionService } from "@/database/transaction.service";
import { CreateListDto, MoveListDto, UpdateListDto } from "@/lists/lists.dto";

@Injectable()
export class ListsService {
  constructor(
    @InjectModel(BoardList.name) private readonly lists: Model<BoardList>,
    @InjectModel(Card.name) private readonly cards: Model<Card>,
    private readonly access: AccessService,
    private readonly activity: ActivityService,
    private readonly transactions: TransactionService,
    private readonly config: ConfigService
  ) {}

  private view(list: BoardListDocument) {
    return {
      id: String(list._id),
      boardId: String(list.boardId),
      name: list.name,
      position: list.position,
      isArchived: list.isArchived,
      createdAt: (list as unknown as { createdAt: Date }).createdAt.toISOString(),
      updatedAt: (list as unknown as { updatedAt: Date }).updatedAt.toISOString()
    };
  }

  private assertPosition(position: string): void {
    if (!isValidPosition(position)) {
      throw validationError([{ field: "position", code: "INVALID", message: "Position key is not valid." }]);
    }
  }

  private async load(id: string, userId: Types.ObjectId, permission: "read" | "edit") {
    const list = await this.lists.findById(oid(id));
    if (!list) {
      throw notFound();
    }
    await this.access.requireBoard(userId, list.boardId, permission);
    return list;
  }

  async create(user: AuthUser, boardId: string, dto: CreateListDto) {
    const userId = oid(user.id);
    const { board } = await this.access.requireBoard(userId, oid(boardId), "edit");
    if (dto.position !== undefined) {
      this.assertPosition(dto.position);
    }
    const list = await this.transactions.run(async (session) => {
      const last = await this.lists
        .findOne({ boardId: board._id }, "position", { session })
        .sort({ position: -1 });
      const [doc] = await this.lists.create(
        [{ boardId: board._id, name: dto.name, position: dto.position ?? positionAfter(last?.position ?? null) }],
        { session }
      );
      await this.activity.record(session, {
        boardId: board._id,
        actorId: userId,
        type: "list_created",
        payload: { listId: String(doc._id), listName: doc.name }
      });
      return doc;
    });
    return this.view(list);
  }

  async listForBoard(user: AuthUser, boardId: string) {
    const { board } = await this.access.requireBoard(oid(user.id), oid(boardId), "read");
    const lists = await this.lists.find({ boardId: board._id, isArchived: false }).sort({ position: 1, _id: 1 });
    return lists.map((l) => this.view(l));
  }

  async update(user: AuthUser, id: string, dto: UpdateListDto) {
    const userId = oid(user.id);
    const list = await this.load(id, userId, "edit");
    const previousName = list.name;
    const updated = await this.transactions.run(async (session) => {
      const doc = await this.lists.findByIdAndUpdate(list._id, { $set: dto }, { new: true, session });
      await this.activity.record(session, {
        boardId: list.boardId,
        actorId: userId,
        type: "list_updated",
        payload: { listId: String(list._id), from: previousName, to: dto.name ?? previousName }
      });
      return doc as BoardListDocument;
    });
    return this.view(updated);
  }

  async remove(user: AuthUser, id: string): Promise<void> {
    const list = await this.load(id, oid(user.id), "edit");
    if (await this.cards.exists({ listId: list._id })) {
      throw conflict("LIST_NOT_EMPTY", "Move or delete the cards in this list, or archive the list instead.");
    }
    await this.lists.deleteOne({ _id: list._id });
  }

  private async rebalance(boardId: Types.ObjectId, session: ClientSession): Promise<void> {
    const rows = await this.lists.find({ boardId, isArchived: false }, "_id", { session }).sort({ position: 1, _id: 1 });
    const keys = evenlySpacedPositions(rows.length);
    await this.lists.bulkWrite(
      rows.map((row, index) => ({ updateOne: { filter: { _id: row._id }, update: { $set: { position: keys[index] } } } })),
      { session }
    );
  }

  async move(user: AuthUser, id: string, dto: MoveListDto) {
    const userId = oid(user.id);
    const list = await this.load(id, userId, "edit");
    this.assertPosition(dto.position);
    const threshold = this.config.getOrThrow<AppEnv>("app").positionRebalanceThreshold;
    const updated = await this.transactions.run(async (session) => {
      const doc = await this.lists.findByIdAndUpdate(
        list._id,
        { $set: { position: dto.position } },
        { new: true, session }
      );
      if (needsRebalance(dto.position, threshold)) {
        await this.rebalance(list.boardId, session);
      }
      await this.activity.record(session, {
        boardId: list.boardId,
        actorId: userId,
        type: "list_moved",
        payload: { listId: String(list._id), listName: list.name }
      });
      return (await this.lists.findById(doc?._id, null, { session })) as BoardListDocument;
    });
    return this.view(updated);
  }

  private async setArchived(user: AuthUser, id: string, isArchived: boolean) {
    const userId = oid(user.id);
    const list = await this.load(id, userId, "edit");
    const updated = await this.transactions.run(async (session) => {
      const doc = await this.lists.findByIdAndUpdate(list._id, { $set: { isArchived } }, { new: true, session });
      await this.activity.record(session, {
        boardId: list.boardId,
        actorId: userId,
        type: isArchived ? "list_archived" : "list_restored",
        payload: { listId: String(list._id), listName: list.name }
      });
      return doc as BoardListDocument;
    });
    return this.view(updated);
  }

  archive(user: AuthUser, id: string) {
    return this.setArchived(user, id, true);
  }

  restore(user: AuthUser, id: string) {
    return this.setArchived(user, id, false);
  }
}
