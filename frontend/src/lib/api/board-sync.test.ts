import {
  BoardSyncer,
  dueDateToIso,
  fromSnapshot,
  isoToDueDate,
  planSync,
  type BoardSnapshot,
  type SyncApi
} from "@/lib/api/board-sync";
import { newObjectId, isObjectId } from "@/lib/api/object-id";
import { assignPositions } from "@/lib/api/position";
import type { Board, Card } from "@/types/board";

const snapshot: BoardSnapshot = {
  id: "b1",
  name: "Roadmap",
  background: "ocean",
  isClosed: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  extra: {
    labels: [{ id: "lb1", name: "Bug", color: "red" }],
    templates: [],
    rules: []
  },
  lists: [
    { id: "l1", name: "Todo", position: "V", isArchived: false, extra: { done: false, limit: 5 } },
    { id: "l2", name: "Done", position: "k", isArchived: false, extra: { done: true, limit: null } }
  ],
  cards: [
    {
      id: "c1",
      listId: "l1",
      title: "One",
      description: "first",
      position: "G",
      dueAt: "2026-12-01T00:00:00.000Z",
      isArchived: false,
      extra: { priority: "high", labelIds: ["lb1"], checklists: [], createdAt: "2026-01-02T00:00:00.000Z" },
      createdAt: "2026-01-02T00:00:00.000Z"
    },
    {
      id: "c2",
      listId: "l1",
      title: "Two",
      description: "",
      position: "V",
      dueAt: null,
      isArchived: false,
      extra: {},
      createdAt: "2026-01-03T00:00:00.000Z"
    },
    {
      id: "c3",
      listId: "l1",
      title: "Three",
      description: "",
      position: "k",
      dueAt: null,
      isArchived: false,
      extra: {},
      createdAt: "2026-01-04T00:00:00.000Z"
    }
  ]
};

function loaded() {
  return fromSnapshot(snapshot);
}

function newCard(id: string, listId: string, title: string): Card {
  return {
    id,
    listId,
    title,
    description: "",
    priority: "medium",
    dueDate: "",
    labelIds: [],
    checklists: [],
    archived: false,
    createdAt: "2026-02-01T00:00:00.000Z"
  };
}

function labels(board: Board, positions: ReturnType<typeof loaded>["positions"]) {
  return planSync(board, positions, board).ops.map((op) => op.label);
}

describe("snapshot mapping", () => {
  it("maps the API shape to the board model", () => {
    const { board } = loaded();
    expect(board.backgroundId).toBe("ocean");
    expect(board.lists.map((l) => [l.id, l.done, l.limit])).toEqual([
      ["l1", false, 5],
      ["l2", true, null]
    ]);
    expect(board.cards[0]).toMatchObject({
      priority: "high",
      dueDate: "2026-12-01",
      labelIds: ["lb1"]
    });
    expect(board.cards[1].priority).toBe("medium");
    expect(board.labels).toHaveLength(1);
  });

  it("converts due dates both ways and rejects bad values", () => {
    expect(dueDateToIso("2026-12-01")).toBe("2026-12-01T00:00:00.000Z");
    expect(dueDateToIso("")).toBeNull();
    expect(dueDateToIso("nope")).toBeNull();
    expect(isoToDueDate("2026-12-01T00:00:00.000Z")).toBe("2026-12-01");
    expect(isoToDueDate(null)).toBe("");
  });

  it("produces no operations when nothing changed", () => {
    const { board, positions } = loaded();
    expect(labels(board, positions)).toEqual([]);
  });
});

describe("planSync", () => {
  it("creates a list at the end with a client id", () => {
    const { board, positions } = loaded();
    const id = newObjectId();
    const target: Board = {
      ...board,
      lists: [...board.lists, { id, name: "Review", done: false, limit: null, archived: false }]
    };
    const plan = planSync(board, positions, target);
    expect(plan.ops.map((op) => op.label)).toEqual(["create list Review"]);
    expect(plan.positions.lists[id] > positions.lists.l2).toBe(true);
  });

  it("creates a card between existing cards", () => {
    const { board, positions } = loaded();
    const calls: Record<string, unknown>[] = [];
    const target: Board = {
      ...board,
      cards: [board.cards[0], newCard("c9", "l1", "Between"), board.cards[1], board.cards[2]]
    };
    const plan = planSync(board, positions, target);
    const api = {
      createCard: async (_b: string, body: Record<string, unknown>) => {
        calls.push(body);
      }
    } as unknown as SyncApi;
    return plan.ops[0].run(api).then(() => {
      expect(calls[0].id).toBe("c9");
      const position = calls[0].position as string;
      expect(position > "G" && position < "V").toBe(true);
      expect(plan.ops).toHaveLength(1);
    });
  });

  it("moves only the moved card when reordering", () => {
    const { board, positions } = loaded();
    const target: Board = { ...board, cards: [board.cards[2], board.cards[0], board.cards[1]] };
    const plan = planSync(board, positions, target);
    expect(plan.ops.map((op) => op.label)).toEqual(["move card Three"]);
  });

  it("moves a card to another list", () => {
    const { board, positions } = loaded();
    const target: Board = {
      ...board,
      cards: board.cards.map((card) => (card.id === "c2" ? { ...card, listId: "l2" } : card))
    };
    expect(planSync(board, positions, target).ops.map((op) => op.label)).toEqual(["move card Two"]);
  });

  it("updates changed fields only", () => {
    const { board, positions } = loaded();
    const bodies: Array<[string, Record<string, unknown>]> = [];
    const target: Board = {
      ...board,
      name: "Renamed",
      cards: board.cards.map((card) => (card.id === "c1" ? { ...card, title: "Uno", priority: "low" } : card))
    };
    const plan = planSync(board, positions, target);
    const api = {
      patchBoard: async (id: string, body: Record<string, unknown>) => {
        bodies.push([id, body]);
      },
      patchCard: async (id: string, body: Record<string, unknown>) => {
        bodies.push([id, body]);
      }
    } as unknown as SyncApi;
    return Promise.all(plan.ops.map((op) => op.run(api))).then(() => {
      expect(bodies[0]).toEqual(["b1", { name: "Renamed" }]);
      expect(bodies[1][0]).toBe("c1");
      expect(bodies[1][1].title).toBe("Uno");
      expect((bodies[1][1].extra as { priority: string }).priority).toBe("low");
    });
  });

  it("archives and restores", () => {
    const { board, positions } = loaded();
    const archived: Board = {
      ...board,
      cards: board.cards.map((card) => (card.id === "c1" ? { ...card, archived: true } : card)),
      lists: board.lists.map((list) => (list.id === "l2" ? { ...list, archived: true } : list))
    };
    expect(planSync(board, positions, archived).ops.map((op) => op.label)).toEqual([
      "archive card One",
      "archive list Done"
    ]);
    const server = fromSnapshot({
      ...snapshot,
      cards: snapshot.cards.map((card) => (card.id === "c1" ? { ...card, isArchived: true } : card))
    });
    expect(planSync(server.board, server.positions, board).ops.map((op) => op.label)).toEqual([
      "restore card One"
    ]);
  });

  it("deletes cards before their list and closes a board", () => {
    const { board, positions } = loaded();
    const target: Board = {
      ...board,
      archived: true,
      lists: board.lists.filter((list) => list.id !== "l2"),
      cards: board.cards.filter((card) => card.id !== "c3")
    };
    expect(planSync(board, positions, target).ops.map((op) => op.label)).toEqual([
      "close board",
      "delete card Three",
      "delete list Done"
    ]);
  });
});

describe("assignPositions", () => {
  it("keeps valid keys and fills gaps", () => {
    const result = assignPositions(["a", "b", "c"], { a: "G", c: "V" });
    expect(result.a).toBe("G");
    expect(result.c).toBe("V");
    expect(result.b > "G" && result.b < "V").toBe(true);
  });

  it("generates valid object ids", () => {
    expect(isObjectId(newObjectId())).toBe(true);
    expect(newObjectId()).not.toBe(newObjectId());
  });
});

function fakeApi(overrides: Partial<Record<keyof SyncApi, jest.Mock>> = {}) {
  const calls: string[] = [];
  const handler = (name: string) =>
    jest.fn(async () => {
      calls.push(name);
      return undefined;
    });
  const api = {
    snapshot: jest.fn(async () => snapshot),
    patchBoard: handler("patchBoard"),
    closeBoard: handler("closeBoard"),
    reopenBoard: handler("reopenBoard"),
    createList: handler("createList"),
    patchList: handler("patchList"),
    moveList: handler("moveList"),
    archiveList: handler("archiveList"),
    restoreList: handler("restoreList"),
    deleteList: handler("deleteList"),
    createCard: handler("createCard"),
    patchCard: handler("patchCard"),
    moveCard: handler("moveCard"),
    archiveCard: handler("archiveCard"),
    restoreCard: handler("restoreCard"),
    deleteCard: handler("deleteCard"),
    ...overrides
  } as unknown as SyncApi;
  return { api, calls };
}

describe("BoardSyncer", () => {
  it("pushes changes and reports success", async () => {
    const { api, calls } = fakeApi();
    const status = jest.fn();
    const syncer = new BoardSyncer(api, loaded(), status);
    const { board } = loaded();
    syncer.push({ ...board, cards: [...board.cards, newCard("c9", "l1", "New")] });
    await syncer.whenIdle();
    expect(calls).toEqual(["createCard"]);
    expect(status).toHaveBeenLastCalledWith(null);
  });

  it("does not resend operations that already succeeded", async () => {
    const { api, calls } = fakeApi();
    const syncer = new BoardSyncer(api, loaded(), jest.fn());
    const { board } = loaded();
    const next = { ...board, cards: [...board.cards, newCard("c9", "l1", "New")] };
    syncer.push(next);
    await syncer.whenIdle();
    syncer.push(next);
    await syncer.whenIdle();
    expect(calls).toEqual(["createCard"]);
  });

  it("resyncs from the server and retries after a failure", async () => {
    let first = true;
    const createCard = jest.fn(async () => {
      if (first) {
        first = false;
        throw new Error("boom");
      }
      return undefined;
    });
    const { api } = fakeApi({ createCard });
    const status = jest.fn();
    const syncer = new BoardSyncer(api, loaded(), status);
    const { board } = loaded();
    syncer.push({ ...board, cards: [...board.cards, newCard("c9", "l1", "New")] });
    await syncer.whenIdle();
    expect(createCard).toHaveBeenCalledTimes(2);
    expect(api.snapshot).toHaveBeenCalledTimes(1);
    expect(status).toHaveBeenLastCalledWith(null);
  });

  it("reports an error when the server keeps failing", async () => {
    const createCard = jest.fn(async () => {
      throw new Error("down");
    });
    const { api } = fakeApi({ createCard });
    const status = jest.fn();
    const syncer = new BoardSyncer(api, loaded(), status);
    const { board } = loaded();
    syncer.push({ ...board, cards: [...board.cards, newCard("c9", "l1", "New")] });
    await syncer.whenIdle();
    expect(status).toHaveBeenLastCalledWith("Your latest changes could not be saved to the server.");
  });

  it("applies only the latest of several quick changes", async () => {
    const { api, calls } = fakeApi();
    const syncer = new BoardSyncer(api, loaded(), jest.fn());
    const { board } = loaded();
    syncer.push({ ...board, name: "A" });
    syncer.push({ ...board, name: "B" });
    await syncer.whenIdle();
    expect(calls.filter((call) => call === "patchBoard").length).toBeLessThanOrEqual(2);
    expect((api.patchBoard as jest.Mock).mock.calls.at(-1)?.[1]).toEqual({ name: "B" });
  });
});
