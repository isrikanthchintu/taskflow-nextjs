import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ClientSession, Model, Types } from "mongoose";
import { AccessService, roleAllows } from "@/access/access.service";
import { ActivityService } from "@/activity/activity.service";
import { AuthUser } from "@/auth/auth.guard";
import { conflict, notFound, validationError } from "@/common/errors";
import { assertExtra } from "@/common/extra";
import { oid } from "@/common/object-id";
import { Activity, Notification, OutboxEvent } from "@/database/schemas/activity.schema";
import {
  Board,
  BoardDocument,
  BoardMember,
  BoardRole,
  BoardStar,
  BoardView
} from "@/database/schemas/board.schema";
import {
  Attachment,
  Checklist,
  ChecklistItem,
  Comment,
  Reaction
} from "@/database/schemas/card-content.schema";
import { Card, CardLabel, CardMember, CardWatcher } from "@/database/schemas/card.schema";
import { User } from "@/database/schemas/identity.schema";
import { Label } from "@/database/schemas/label.schema";
import { BoardList } from "@/database/schemas/list.schema";
import { WorkspaceMember } from "@/database/schemas/workspace.schema";
import { TransactionService } from "@/database/transaction.service";
import {
  AddBoardMemberDto,
  CopyBoardDto,
  CreateBoardDto,
  UpdateBoardDto
} from "@/boards/boards.dto";

const iso = (value: Date | null | undefined) => (value ? value.toISOString() : null);
const created = (doc: unknown) => (doc as { createdAt: Date }).createdAt;
const updated = (doc: unknown) => (doc as { updatedAt: Date }).updatedAt;

@Injectable()
export class BoardsService {
  constructor(
    @InjectModel(Board.name) private readonly boards: Model<Board>,
    @InjectModel(BoardMember.name) private readonly members: Model<BoardMember>,
    @InjectModel(BoardStar.name) private readonly stars: Model<BoardStar>,
    @InjectModel(BoardView.name) private readonly views: Model<BoardView>,
    @InjectModel(BoardList.name) private readonly lists: Model<BoardList>,
    @InjectModel(Card.name) private readonly cards: Model<Card>,
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
    @InjectModel(OutboxEvent.name) private readonly outbox: Model<OutboxEvent>,
    @InjectModel(User.name) private readonly users: Model<User>,
    @InjectModel(WorkspaceMember.name) private readonly workspaceMembers: Model<WorkspaceMember>,
    private readonly access: AccessService,
    private readonly activity: ActivityService,
    private readonly transactions: TransactionService
  ) {}

  private summary(board: BoardDocument, role: BoardRole) {
    return {
      id: String(board._id),
      workspaceId: String(board.workspaceId),
      name: board.name,
      background: board.background,
      visibility: board.visibility,
      isClosed: board.isClosed,
      createdBy: String(board.createdBy),
      role,
      createdAt: iso(created(board)),
      updatedAt: iso(updated(board))
    };
  }

  async create(user: AuthUser, dto: CreateBoardDto) {
    const userId = oid(user.id);
    const workspaceId = oid(dto.workspaceId);
    await this.access.requireWorkspaceRole(userId, workspaceId);
    const board = await this.transactions.run(async (session) => {
      const [doc] = await this.boards.create(
        [
          {
            workspaceId,
            name: dto.name,
            background: dto.background ?? "#0079bf",
            visibility: dto.visibility ?? "workspace",
            createdBy: userId
          }
        ],
        { session }
      );
      await this.members.create([{ boardId: doc._id, userId, role: "admin" }], { session });
      await this.activity.record(session, {
        boardId: doc._id,
        actorId: userId,
        type: "board_created",
        payload: { boardId: String(doc._id), boardName: doc.name }
      });
      return doc;
    });
    return this.summary(board, "admin");
  }

  async get(user: AuthUser, id: string) {
    const userId = oid(user.id);
    const { board, role } = await this.access.requireBoard(userId, oid(id), "read");

    const [memberRows, lists, cards, labels] = await Promise.all([
      this.members.find({ boardId: board._id }).lean(),
      this.lists.find({ boardId: board._id, isArchived: false }).sort({ position: 1, _id: 1 }).lean(),
      this.cards.find({ boardId: board._id, isArchived: false }).sort({ position: 1, _id: 1 }).lean(),
      this.labels.find({ boardId: board._id }).sort({ position: 1, _id: 1 }).lean()
    ]);

    const cardIds = cards.map((c) => c._id);
    const [cardLabelRows, cardMemberRows, checklistRows, attachmentCounts, covers, userRows] = await Promise.all([
      this.cardLabels.find({ cardId: { $in: cardIds } }).lean(),
      this.cardMembers.find({ cardId: { $in: cardIds } }).lean(),
      this.checklists.find({ cardId: { $in: cardIds } }).lean(),
      this.attachments.aggregate<{ _id: Types.ObjectId; count: number }>([
        { $match: { cardId: { $in: cardIds } } },
        { $group: { _id: "$cardId", count: { $sum: 1 } } }
      ]),
      this.attachments
        .find({ _id: { $in: cards.map((c) => c.coverAttachmentId).filter((v): v is Types.ObjectId => !!v) } })
        .lean(),
      this.users.find({ _id: { $in: memberRows.map((m) => m.userId) } }).lean()
    ]);

    const checklistCardById = new Map(checklistRows.map((c) => [String(c._id), String(c.cardId)]));
    const itemCounts = await this.checklistItems.aggregate<{
      _id: { checklistId: Types.ObjectId; isChecked: boolean };
      count: number;
    }>([
      { $match: { checklistId: { $in: checklistRows.map((c) => c._id) } } },
      { $group: { _id: { checklistId: "$checklistId", isChecked: "$isChecked" }, count: { $sum: 1 } } }
    ]);
    const checklistTotals = new Map<string, { total: number; done: number }>();
    for (const row of itemCounts) {
      const cardId = checklistCardById.get(String(row._id.checklistId));
      if (!cardId) continue;
      const entry = checklistTotals.get(cardId) ?? { total: 0, done: 0 };
      entry.total += row.count;
      if (row._id.isChecked) entry.done += row.count;
      checklistTotals.set(cardId, entry);
    }

    const labelById = new Map(labels.map((l) => [String(l._id), l]));
    const labelsByCard = new Map<string, Array<{ id: string; name: string; color: string }>>();
    for (const row of cardLabelRows) {
      const label = labelById.get(String(row.labelId));
      if (!label) continue;
      const list = labelsByCard.get(String(row.cardId)) ?? [];
      list.push({ id: String(label._id), name: label.name, color: label.color });
      labelsByCard.set(String(row.cardId), list);
    }
    const membersByCard = new Map<string, string[]>();
    for (const row of cardMemberRows) {
      const list = membersByCard.get(String(row.cardId)) ?? [];
      list.push(String(row.userId));
      membersByCard.set(String(row.cardId), list);
    }
    const attachmentCountByCard = new Map(attachmentCounts.map((a) => [String(a._id), a.count]));
    const coverById = new Map(covers.map((c) => [String(c._id), c]));
    const userById = new Map(userRows.map((u) => [String(u._id), u]));

    return {
      ...this.summary(board, role),
      permissions: {
        read: true,
        comment: roleAllows(role, "comment"),
        edit: roleAllows(role, "edit"),
        manage: roleAllows(role, "manage"),
        admin: roleAllows(role, "admin")
      },
      members: memberRows.map((m) => ({
        userId: String(m.userId),
        name: userById.get(String(m.userId))?.name ?? null,
        role: m.role
      })),
      labels: labels.map((l) => ({ id: String(l._id), name: l.name, color: l.color, position: l.position })),
      lists: lists.map((list) => ({
        id: String(list._id),
        name: list.name,
        position: list.position,
        cards: cards
          .filter((c) => String(c.listId) === String(list._id))
          .map((card) => {
            const cover = card.coverAttachmentId ? coverById.get(String(card.coverAttachmentId)) : undefined;
            const checklist = checklistTotals.get(String(card._id)) ?? { total: 0, done: 0 };
            return {
              id: String(card._id),
              title: card.title,
              listId: String(card.listId),
              position: card.position,
              version: card.version,
              labels: labelsByCard.get(String(card._id)) ?? [],
              memberIds: membersByCard.get(String(card._id)) ?? [],
              checklistCount: checklist.total,
              checklistCompletedCount: checklist.done,
              attachmentCount: attachmentCountByCard.get(String(card._id)) ?? 0,
              coverThumbnail: cover
                ? { attachmentId: String(cover._id), key: cover.thumbnailKey ?? cover.storageKey }
                : null,
              startAt: iso(card.startAt),
              dueAt: iso(card.dueAt),
              dueComplete: card.dueComplete,
              isComplete: card.isComplete,
              lastActivityAt: iso(card.lastActivityAt)
            };
          })
      }))
    };
  }

  async snapshot(user: AuthUser, id: string) {
    const { board, role } = await this.access.requireBoard(oid(user.id), oid(id), "read");
    const [lists, cards] = await Promise.all([
      this.lists.find({ boardId: board._id }).sort({ position: 1, _id: 1 }).lean(),
      this.cards.find({ boardId: board._id }).sort({ position: 1, _id: 1 }).lean()
    ]);
    return {
      ...this.summary(board, role),
      extra: board.extra ?? {},
      lists: lists.map((list) => ({
        id: String(list._id),
        name: list.name,
        position: list.position,
        isArchived: list.isArchived,
        extra: list.extra ?? {}
      })),
      cards: cards.map((card) => ({
        id: String(card._id),
        listId: String(card.listId),
        title: card.title,
        description: card.description,
        position: card.position,
        dueAt: iso(card.dueAt),
        isArchived: card.isArchived,
        extra: card.extra ?? {},
        version: card.version,
        createdAt: iso((card as unknown as { createdAt: Date }).createdAt)
      }))
    };
  }

  async update(user: AuthUser, id: string, dto: UpdateBoardDto) {
    const userId = oid(user.id);
    assertExtra(dto.extra);
    const permission = dto.visibility !== undefined ? "admin" : "edit";
    const { board } = await this.access.requireBoard(userId, oid(id), permission);
    const changes: Record<string, unknown> = {};
    for (const key of ["name", "background", "visibility"] as const) {
      if (dto[key] !== undefined && dto[key] !== board[key]) {
        changes[key] = { from: board[key], to: dto[key] };
      }
    }
    const result = await this.transactions.run(async (session) => {
      const doc = await this.boards.findByIdAndUpdate(board._id, { $set: dto }, { new: true, session });
      if (Object.keys(changes).length > 0) {
        await this.activity.record(session, {
          boardId: board._id,
          actorId: userId,
          type: "board_updated",
          payload: { boardId: String(board._id), changes }
        });
      }
      return doc as BoardDocument;
    });
    return this.summary(result, (await this.access.boardRole(userId, result)) as BoardRole);
  }

  private async setClosed(user: AuthUser, id: string, isClosed: boolean) {
    const userId = oid(user.id);
    const { board } = await this.access.requireBoard(userId, oid(id), "admin");
    if (board.isClosed === isClosed) {
      return this.summary(board, "admin");
    }
    const result = await this.transactions.run(async (session) => {
      const doc = await this.boards.findByIdAndUpdate(board._id, { $set: { isClosed } }, { new: true, session });
      await this.activity.record(session, {
        boardId: board._id,
        actorId: userId,
        type: isClosed ? "board_closed" : "board_reopened",
        payload: { boardId: String(board._id), boardName: board.name }
      });
      return doc as BoardDocument;
    });
    return this.summary(result, "admin");
  }

  close(user: AuthUser, id: string) {
    return this.setClosed(user, id, true);
  }

  reopen(user: AuthUser, id: string) {
    return this.setClosed(user, id, false);
  }

  async remove(user: AuthUser, id: string): Promise<void> {
    const { board } = await this.access.requireBoard(oid(user.id), oid(id), "admin");
    await this.transactions.run(async (session) => {
      const boardId = board._id;
      const cardIds = (await this.cards.find({ boardId }, "_id", { session }).lean()).map((c) => c._id);
      const checklistIds = (await this.checklists.find({ cardId: { $in: cardIds } }, "_id", { session }).lean()).map(
        (c) => c._id
      );
      const commentIds = (await this.comments.find({ cardId: { $in: cardIds } }, "_id", { session }).lean()).map(
        (c) => c._id
      );
      const activityIds = (await this.activities.find({ boardId }, "_id", { session }).lean()).map((a) => a._id);
      await this.reactions.deleteMany({ commentId: { $in: commentIds } }, { session });
      await this.comments.deleteMany({ cardId: { $in: cardIds } }, { session });
      await this.checklistItems.deleteMany({ checklistId: { $in: checklistIds } }, { session });
      await this.checklists.deleteMany({ cardId: { $in: cardIds } }, { session });
      await this.attachments.deleteMany({ cardId: { $in: cardIds } }, { session });
      await this.cardLabels.deleteMany({ cardId: { $in: cardIds } }, { session });
      await this.cardMembers.deleteMany({ cardId: { $in: cardIds } }, { session });
      await this.cardWatchers.deleteMany({ cardId: { $in: cardIds } }, { session });
      await this.notifications.deleteMany({ activityId: { $in: activityIds } }, { session });
      await this.activities.deleteMany({ boardId }, { session });
      await this.outbox.deleteMany({ boardId }, { session });
      await this.cards.deleteMany({ boardId }, { session });
      await this.lists.deleteMany({ boardId }, { session });
      await this.labels.deleteMany({ boardId }, { session });
      await this.stars.deleteMany({ boardId }, { session });
      await this.views.deleteMany({ boardId }, { session });
      await this.members.deleteMany({ boardId }, { session });
      await this.boards.deleteOne({ _id: boardId }, { session });
    });
  }

  async star(user: AuthUser, id: string) {
    const userId = oid(user.id);
    const { board } = await this.access.requireBoard(userId, oid(id), "read");
    await this.stars.updateOne({ userId, boardId: board._id }, { $setOnInsert: { userId, boardId: board._id } }, { upsert: true });
    return { boardId: String(board._id), starred: true };
  }

  async unstar(user: AuthUser, id: string): Promise<void> {
    const userId = oid(user.id);
    const { board } = await this.access.requireBoard(userId, oid(id), "read");
    await this.stars.deleteOne({ userId, boardId: board._id });
  }

  async recordView(user: AuthUser, id: string) {
    const userId = oid(user.id);
    const { board } = await this.access.requireBoard(userId, oid(id), "read");
    const viewedAt = new Date();
    await this.views.updateOne({ userId, boardId: board._id }, { $set: { viewedAt } }, { upsert: true });
    return { boardId: String(board._id), viewedAt: viewedAt.toISOString() };
  }

  private async accessibleSummaries(userId: Types.ObjectId, boardIds: Types.ObjectId[]) {
    const boards = await this.boards.find({ _id: { $in: boardIds } });
    const byId = new Map(boards.map((b) => [String(b._id), b]));
    const out: Array<ReturnType<BoardsService["summary"]>> = [];
    for (const boardId of boardIds) {
      const board = byId.get(String(boardId));
      if (!board) continue;
      const role = await this.access.boardRole(userId, board);
      if (role) out.push(this.summary(board, role));
    }
    return out;
  }

  async listForWorkspace(user: AuthUser, workspaceIdParam: string, closed: boolean) {
    const userId = oid(user.id);
    const workspaceId = oid(workspaceIdParam);
    await this.access.requireWorkspaceRole(userId, workspaceId);
    const boards = await this.boards.find({ workspaceId, isClosed: closed }).sort({ name: 1 });
    const starred = new Set(
      (await this.stars.find({ userId, boardId: { $in: boards.map((b) => b._id) } }).lean()).map((s) => String(s.boardId))
    );
    const out: Array<ReturnType<BoardsService["summary"]> & { starred: boolean }> = [];
    for (const board of boards) {
      const role = await this.access.boardRole(userId, board);
      if (role) out.push({ ...this.summary(board, role), starred: starred.has(String(board._id)) });
    }
    return out;
  }

  async recent(user: AuthUser, limit = 8) {
    const userId = oid(user.id);
    const rows = await this.views.find({ userId }).sort({ viewedAt: -1 }).limit(Math.min(limit, 50)).lean();
    const summaries = await this.accessibleSummaries(userId, rows.map((r) => r.boardId));
    const viewedAt = new Map(rows.map((r) => [String(r.boardId), r.viewedAt]));
    return summaries.map((s) => ({ ...s, viewedAt: iso(viewedAt.get(s.id)) }));
  }

  async starred(user: AuthUser) {
    const userId = oid(user.id);
    const rows = await this.stars.find({ userId }).sort({ _id: -1 }).lean();
    return this.accessibleSummaries(userId, rows.map((r) => r.boardId));
  }

  async copy(user: AuthUser, id: string, dto: CopyBoardDto) {
    const userId = oid(user.id);
    const { board: source } = await this.access.requireBoard(userId, oid(id), "read");
    const workspaceId = dto.workspaceId ? oid(dto.workspaceId) : source.workspaceId;
    await this.access.requireWorkspaceRole(userId, workspaceId);

    const copy = await this.transactions.run(async (session) => {
      const [created] = await this.boards.create(
        [
          {
            workspaceId,
            name: dto.name ?? `${source.name} (copy)`,
            background: source.background,
            visibility: source.visibility,
            createdBy: userId
          }
        ],
        { session }
      );
      await this.members.create([{ boardId: created._id, userId, role: "admin" }], { session });

      const labelMap = new Map<string, Types.ObjectId>();
      const sourceLabels = await this.labels.find({ boardId: source._id }, null, { session }).lean();
      for (const label of sourceLabels) {
        const [copied] = await this.labels.create(
          [{ boardId: created._id, name: label.name, color: label.color, position: label.position }],
          { session }
        );
        labelMap.set(String(label._id), copied._id);
      }

      const listMap = new Map<string, Types.ObjectId>();
      const sourceLists = await this.lists.find({ boardId: source._id, isArchived: false }, null, { session }).lean();
      for (const list of sourceLists) {
        const [copied] = await this.lists.create(
          [{ boardId: created._id, name: list.name, position: list.position }],
          { session }
        );
        listMap.set(String(list._id), copied._id);
      }

      const sourceCards = await this.cards.find({ boardId: source._id, isArchived: false }, null, { session }).lean();
      const links = await this.cardLabels.find({ cardId: { $in: sourceCards.map((c) => c._id) } }, null, { session }).lean();
      for (const card of sourceCards) {
        const listId = listMap.get(String(card.listId));
        if (!listId) continue;
        const [copied] = await this.cards.create(
          [
            {
              boardId: created._id,
              listId,
              title: card.title,
              description: card.description,
              position: card.position,
              startAt: card.startAt,
              dueAt: card.dueAt,
              createdBy: userId
            }
          ],
          { session }
        );
        const copiedLinks = links
          .filter((l) => String(l.cardId) === String(card._id) && labelMap.has(String(l.labelId)))
          .map((l) => ({ cardId: copied._id, labelId: labelMap.get(String(l.labelId)) as Types.ObjectId }));
        if (copiedLinks.length) await this.cardLabels.insertMany(copiedLinks, { session });
      }

      await this.activity.record(session, {
        boardId: created._id,
        actorId: userId,
        type: "board_created",
        payload: { boardId: String(created._id), boardName: created.name, copiedFrom: String(source._id) }
      });
      return created;
    });
    return this.summary(copy, "admin");
  }

  async listMembers(user: AuthUser, id: string) {
    const { board } = await this.access.requireBoard(oid(user.id), oid(id), "read");
    const rows = await this.members.find({ boardId: board._id }).sort({ _id: 1 }).lean();
    const users = await this.users.find({ _id: { $in: rows.map((r) => r.userId) } }).lean();
    const byId = new Map(users.map((u) => [String(u._id), u]));
    return rows.map((r) => ({
      userId: String(r.userId),
      name: byId.get(String(r.userId))?.name ?? null,
      email: byId.get(String(r.userId))?.email ?? null,
      role: r.role,
      joinedAt: iso((r as unknown as { joinedAt: Date }).joinedAt)
    }));
  }

  async addMember(user: AuthUser, id: string, dto: AddBoardMemberDto) {
    const userId = oid(user.id);
    const { board } = await this.access.requireBoard(userId, oid(id), "manage");
    const targetId = oid(dto.userId);
    if (!(await this.users.exists({ _id: targetId }))) {
      throw validationError([{ field: "userId", code: "NOT_FOUND", message: "User does not exist." }]);
    }
    if (!(await this.workspaceMembers.exists({ workspaceId: board.workspaceId, userId: targetId }))) {
      throw validationError([
        { field: "userId", code: "NOT_WORKSPACE_MEMBER", message: "User must be a member of the workspace first." }
      ]);
    }
    if (await this.members.exists({ boardId: board._id, userId: targetId })) {
      throw conflict("ALREADY_MEMBER", "User is already a member of this board.");
    }
    const role = dto.role ?? "member";
    await this.transactions.run(async (session) => {
      await this.members.create([{ boardId: board._id, userId: targetId, role }], { session });
      await this.activity.record(session, {
        boardId: board._id,
        actorId: userId,
        type: targetId.equals(userId) ? "member_joined" : "member_added",
        payload: { userId: String(targetId), role },
        notify: [targetId]
      });
    });
    return { userId: String(targetId), role };
  }

  private async assertKeepsAdmin(boardId: Types.ObjectId, targetId: Types.ObjectId, session?: ClientSession) {
    const target = await this.members.findOne({ boardId, userId: targetId }, null, { session });
    if (!target) throw notFound();
    if (target.role === "admin" && (await this.members.countDocuments({ boardId, role: "admin" }, { session })) <= 1) {
      throw conflict("LAST_ADMIN", "A board must keep at least one admin.");
    }
  }

  async updateMember(user: AuthUser, id: string, userIdParam: string, role: BoardRole) {
    const userId = oid(user.id);
    const { board } = await this.access.requireBoard(userId, oid(id), "manage");
    const targetId = oid(userIdParam);
    if (role !== "admin") await this.assertKeepsAdmin(board._id, targetId);
    const member = await this.members.findOneAndUpdate(
      { boardId: board._id, userId: targetId },
      { $set: { role } },
      { new: true }
    );
    if (!member) throw notFound();
    return { userId: String(member.userId), role: member.role };
  }

  async removeMember(user: AuthUser, id: string, userIdParam: string): Promise<void> {
    const userId = oid(user.id);
    const targetId = oid(userIdParam);
    const self = targetId.equals(userId);
    const { board } = await this.access.requireBoard(userId, oid(id), self ? "read" : "manage");
    await this.transactions.run(async (session) => {
      await this.assertKeepsAdmin(board._id, targetId, session);
      const cardIds = (await this.cards.find({ boardId: board._id }, "_id", { session }).lean()).map((c) => c._id);
      await this.cardMembers.deleteMany({ cardId: { $in: cardIds }, userId: targetId }, { session });
      await this.cardWatchers.deleteMany({ cardId: { $in: cardIds }, userId: targetId }, { session });
      await this.members.deleteOne({ boardId: board._id, userId: targetId }, { session });
      await this.activity.record(session, {
        boardId: board._id,
        actorId: userId,
        type: "member_removed",
        payload: { userId: String(targetId) }
      });
    });
  }

  async activityFeed(user: AuthUser, id: string, options: { cursor?: string; limit?: number; types?: string[] }) {
    const { board } = await this.access.requireBoard(oid(user.id), oid(id), "read");
    return this.activity.list({ boardId: board._id }, options);
  }
}
