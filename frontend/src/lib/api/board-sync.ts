import { assignPositions } from "@/lib/api/position";
import type {
  Board,
  Card,
  CardTemplate,
  Checklist,
  Label,
  List,
  Priority,
  Rule
} from "@/types/board";

export interface SnapshotList {
  id: string;
  name: string;
  position: string;
  isArchived: boolean;
  extra: Record<string, unknown>;
}

export interface SnapshotCard {
  id: string;
  listId: string;
  title: string;
  description: string;
  position: string;
  dueAt: string | null;
  isArchived: boolean;
  extra: Record<string, unknown>;
  createdAt: string | null;
}

export interface BoardSnapshot {
  id: string;
  name: string;
  background: string;
  isClosed: boolean;
  createdAt: string | null;
  extra: Record<string, unknown>;
  lists: SnapshotList[];
  cards: SnapshotCard[];
}

export interface Positions {
  lists: Record<string, string>;
  cards: Record<string, string>;
}

export interface LoadedBoard {
  board: Board;
  positions: Positions;
}

export interface SyncApi {
  snapshot(boardId: string): Promise<BoardSnapshot>;
  patchBoard(boardId: string, body: Record<string, unknown>): Promise<unknown>;
  closeBoard(boardId: string): Promise<unknown>;
  reopenBoard(boardId: string): Promise<unknown>;
  createList(boardId: string, body: Record<string, unknown>): Promise<unknown>;
  patchList(listId: string, body: Record<string, unknown>): Promise<unknown>;
  moveList(listId: string, position: string): Promise<unknown>;
  archiveList(listId: string): Promise<unknown>;
  restoreList(listId: string): Promise<unknown>;
  deleteList(listId: string): Promise<unknown>;
  createCard(boardId: string, body: Record<string, unknown>): Promise<unknown>;
  patchCard(cardId: string, body: Record<string, unknown>): Promise<unknown>;
  moveCard(cardId: string, listId: string, position: string): Promise<unknown>;
  archiveCard(cardId: string): Promise<unknown>;
  restoreCard(cardId: string): Promise<unknown>;
  deleteCard(cardId: string): Promise<unknown>;
}

const PRIORITIES: Priority[] = ["low", "medium", "high"];
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export function dueDateToIso(value: string): string | null {
  if (!DATE_ONLY.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function isoToDueDate(value: string | null): string {
  return value ? value.slice(0, 10) : "";
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function asPriority(value: unknown): Priority {
  return PRIORITIES.includes(value as Priority) ? (value as Priority) : "medium";
}

function listExtra(list: List): Record<string, unknown> {
  return { done: list.done, limit: list.limit };
}

function cardExtra(card: Card): Record<string, unknown> {
  return {
    priority: card.priority,
    labelIds: card.labelIds,
    checklists: card.checklists,
    createdAt: card.createdAt
  };
}

function boardExtra(board: Board): Record<string, unknown> {
  return { labels: board.labels, templates: board.templates, rules: board.rules };
}

export function fromSnapshot(snapshot: BoardSnapshot): LoadedBoard {
  const positions: Positions = { lists: {}, cards: {} };
  const lists: List[] = snapshot.lists.map((list) => {
    positions.lists[list.id] = list.position;
    return {
      id: list.id,
      name: list.name,
      done: list.extra.done === true,
      limit: typeof list.extra.limit === "number" ? list.extra.limit : null,
      archived: list.isArchived
    };
  });
  const cards: Card[] = snapshot.cards.map((card) => {
    positions.cards[card.id] = card.position;
    return {
      id: card.id,
      listId: card.listId,
      title: card.title,
      description: card.description,
      priority: asPriority(card.extra.priority),
      dueDate: isoToDueDate(card.dueAt),
      labelIds: asArray<string>(card.extra.labelIds),
      checklists: asArray<Checklist>(card.extra.checklists),
      archived: card.isArchived,
      createdAt:
        typeof card.extra.createdAt === "string"
          ? card.extra.createdAt
          : (card.createdAt ?? new Date().toISOString())
    };
  });
  const board: Board = {
    id: snapshot.id,
    name: snapshot.name,
    backgroundId: snapshot.background,
    lists,
    cards,
    labels: asArray<Label>(snapshot.extra.labels),
    templates: asArray<CardTemplate>(snapshot.extra.templates),
    rules: asArray<Rule>(snapshot.extra.rules),
    archived: snapshot.isClosed,
    createdAt: snapshot.createdAt ?? new Date().toISOString()
  };
  return { board, positions };
}

function same(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function cardsByList(board: Board): Map<string, string[]> {
  const grouped = new Map<string, string[]>();
  for (const card of board.cards) {
    const ids = grouped.get(card.listId) ?? [];
    ids.push(card.id);
    grouped.set(card.listId, ids);
  }
  return grouped;
}

export type SyncOp = { label: string; run: (api: SyncApi) => Promise<unknown> };

export function planSync(
  server: Board,
  serverPositions: Positions,
  target: Board
): { ops: SyncOp[]; positions: Positions } {
  const boardId = target.id;
  const ops: SyncOp[] = [];

  const listPositions = assignPositions(
    target.lists.map((list) => list.id),
    serverPositions.lists
  );
  const cardPositions: Record<string, string> = {};
  for (const ids of cardsByList(target).values()) {
    Object.assign(cardPositions, assignPositions(ids, serverPositions.cards));
  }

  const boardChanges: Record<string, unknown> = {};
  if (server.name !== target.name) boardChanges.name = target.name;
  if (server.backgroundId !== target.backgroundId) boardChanges.background = target.backgroundId;
  if (!same(boardExtra(server), boardExtra(target))) boardChanges.extra = boardExtra(target);
  if (Object.keys(boardChanges).length > 0) {
    ops.push({ label: "update board", run: (api) => api.patchBoard(boardId, boardChanges) });
  }
  if (server.archived !== target.archived) {
    ops.push({
      label: target.archived ? "close board" : "reopen board",
      run: (api) => (target.archived ? api.closeBoard(boardId) : api.reopenBoard(boardId))
    });
  }

  const serverLists = new Map(server.lists.map((list) => [list.id, list]));
  const serverCards = new Map(server.cards.map((card) => [card.id, card]));
  const targetListIds = new Set(target.lists.map((list) => list.id));
  const targetCardIds = new Set(target.cards.map((card) => card.id));

  const listArchives: SyncOp[] = [];
  for (const list of target.lists) {
    const before = serverLists.get(list.id);
    if (!before) {
      ops.push({
        label: `create list ${list.name}`,
        run: (api) =>
          api.createList(boardId, {
            id: list.id,
            name: list.name,
            position: listPositions[list.id],
            extra: listExtra(list)
          })
      });
      if (list.archived) {
        listArchives.push({ label: `archive list ${list.name}`, run: (api) => api.archiveList(list.id) });
      }
      continue;
    }
    const changes: Record<string, unknown> = {};
    if (before.name !== list.name) changes.name = list.name;
    if (!same(listExtra(before), listExtra(list))) changes.extra = listExtra(list);
    if (Object.keys(changes).length > 0) {
      ops.push({ label: `update list ${list.name}`, run: (api) => api.patchList(list.id, changes) });
    }
    if (listPositions[list.id] !== serverPositions.lists[list.id]) {
      ops.push({
        label: `move list ${list.name}`,
        run: (api) => api.moveList(list.id, listPositions[list.id])
      });
    }
    if (before.archived && !list.archived) {
      ops.push({ label: `restore list ${list.name}`, run: (api) => api.restoreList(list.id) });
    } else if (!before.archived && list.archived) {
      listArchives.push({ label: `archive list ${list.name}`, run: (api) => api.archiveList(list.id) });
    }
  }

  const cardArchives: SyncOp[] = [];
  for (const card of target.cards) {
    const before = serverCards.get(card.id);
    if (!before) {
      ops.push({
        label: `create card ${card.title}`,
        run: (api) =>
          api.createCard(boardId, {
            id: card.id,
            listId: card.listId,
            title: card.title,
            description: card.description,
            position: cardPositions[card.id],
            dueAt: dueDateToIso(card.dueDate),
            extra: cardExtra(card)
          })
      });
      if (card.archived) {
        cardArchives.push({ label: `archive card ${card.title}`, run: (api) => api.archiveCard(card.id) });
      }
      continue;
    }
    if (before.archived && !card.archived) {
      ops.push({ label: `restore card ${card.title}`, run: (api) => api.restoreCard(card.id) });
    }
    const changes: Record<string, unknown> = {};
    if (before.title !== card.title) changes.title = card.title;
    if (before.description !== card.description) changes.description = card.description;
    if (before.dueDate !== card.dueDate) changes.dueAt = dueDateToIso(card.dueDate);
    if (!same(cardExtra(before), cardExtra(card))) changes.extra = cardExtra(card);
    if (Object.keys(changes).length > 0) {
      ops.push({ label: `update card ${card.title}`, run: (api) => api.patchCard(card.id, changes) });
    }
    if (before.listId !== card.listId || cardPositions[card.id] !== serverPositions.cards[card.id]) {
      ops.push({
        label: `move card ${card.title}`,
        run: (api) => api.moveCard(card.id, card.listId, cardPositions[card.id])
      });
    }
    if (!before.archived && card.archived) {
      cardArchives.push({ label: `archive card ${card.title}`, run: (api) => api.archiveCard(card.id) });
    }
  }

  ops.push(...cardArchives);
  for (const card of server.cards) {
    if (!targetCardIds.has(card.id)) {
      ops.push({ label: `delete card ${card.title}`, run: (api) => api.deleteCard(card.id) });
    }
  }
  ops.push(...listArchives);
  for (const list of server.lists) {
    if (!targetListIds.has(list.id)) {
      ops.push({ label: `delete list ${list.name}`, run: (api) => api.deleteList(list.id) });
    }
  }

  return { ops, positions: { lists: listPositions, cards: cardPositions } };
}

export class BoardSyncer {
  readonly boardId: string;
  private server: Board;
  private positions: Positions;
  private pending: Board | null = null;
  private running = false;
  private idle: Array<() => void> = [];

  constructor(
    private readonly api: SyncApi,
    loaded: LoadedBoard,
    private readonly onStatus: (error: string | null) => void
  ) {
    this.boardId = loaded.board.id;
    this.server = loaded.board;
    this.positions = loaded.positions;
  }

  push(board: Board): void {
    this.pending = board;
    if (!this.running) void this.drain();
  }

  whenIdle(): Promise<void> {
    if (!this.running && this.pending === null) return Promise.resolve();
    return new Promise((resolve) => this.idle.push(resolve));
  }

  private async drain(): Promise<void> {
    this.running = true;
    try {
      while (this.pending) {
        const target = this.pending;
        this.pending = null;
        const ok = await this.reconcile(target);
        this.onStatus(ok ? null : "Your latest changes could not be saved to the server.");
      }
    } finally {
      this.running = false;
      const waiting = this.idle;
      this.idle = [];
      waiting.forEach((resolve) => resolve());
    }
  }

  private async reconcile(target: Board): Promise<boolean> {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const plan = planSync(this.server, this.positions, target);
      try {
        for (const op of plan.ops) await op.run(this.api);
        this.server = target;
        this.positions = plan.positions;
        return true;
      } catch {
        try {
          const loaded = fromSnapshot(await this.api.snapshot(this.boardId));
          this.server = loaded.board;
          this.positions = loaded.positions;
        } catch {
          return false;
        }
      }
    }
    return false;
  }
}
