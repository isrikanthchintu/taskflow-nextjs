import {
  DATA_KEY,
  LEGACY_KEY,
  convertV1,
  readAppData,
  writeAppData
} from "@/lib/board-storage";
import { createStarterData } from "@/lib/board-schema";
import type { Task } from "@/types/task";

const legacyTasks: Task[] = [
  {
    id: "a",
    title: "First",
    description: "one",
    status: "done",
    priority: "low",
    dueDate: "2026-11-14",
    createdAt: "2026-11-08T09:00:00.000Z"
  },
  {
    id: "b",
    title: "Second",
    description: "two",
    status: "todo",
    priority: "high",
    dueDate: "2026-11-24",
    createdAt: "2026-11-12T09:00:00.000Z"
  },
  {
    id: "c",
    title: "Third",
    description: "three",
    status: "todo",
    priority: "medium",
    dueDate: "",
    createdAt: "2026-11-13T09:00:00.000Z"
  },
  {
    id: "d",
    title: "Fourth",
    description: "four",
    status: "in-progress",
    priority: "medium",
    dueDate: "2026-11-30",
    createdAt: "2026-11-14T09:00:00.000Z"
  }
];

describe("board-storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.restoreAllMocks();
  });

  it("FR1.1 writes data under the v2 key and reads it back", () => {
    const data = createStarterData();
    expect(writeAppData(data)).toBe("ok");
    expect(window.localStorage.getItem(DATA_KEY)).not.toBeNull();
    const result = readAppData();
    expect(result.status).toBe("ok");
    if (result.status === "ok") expect(result.data).toEqual(data);
  });

  it("FR1.1 reports missing when nothing is stored", () => {
    expect(readAppData()).toEqual({ status: "missing" });
  });

  it("FR1.2 converts v1 cards into the default board keeping order and fields", () => {
    window.localStorage.setItem(LEGACY_KEY, JSON.stringify(legacyTasks));
    const result = readAppData();
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.migrated).toBe(true);
    const board = result.data.boards[0];
    expect(board.lists.map((list) => list.name)).toEqual([
      "To do",
      "In progress",
      "Completed"
    ]);
    expect(board.lists[2].done).toBe(true);
    expect(board.cards.map((card) => card.id)).toEqual(["a", "b", "c", "d"]);
    const listName = (listId: string) =>
      board.lists.find((list) => list.id === listId)?.name;
    expect(board.cards.map((card) => listName(card.listId))).toEqual([
      "Completed",
      "To do",
      "To do",
      "In progress"
    ]);
    expect(board.cards[1]).toMatchObject({
      title: "Second",
      description: "two",
      priority: "high",
      dueDate: "2026-11-24",
      createdAt: "2026-11-12T09:00:00.000Z"
    });
  });

  it("FR1.2 never deletes or changes the v1 data", () => {
    const raw = JSON.stringify(legacyTasks);
    window.localStorage.setItem(LEGACY_KEY, raw);
    readAppData();
    expect(window.localStorage.getItem(LEGACY_KEY)).toBe(raw);
  });

  it("FR1.2 a second load does not duplicate cards", () => {
    window.localStorage.setItem(LEGACY_KEY, JSON.stringify(legacyTasks));
    const first = readAppData();
    const second = readAppData();
    expect(first.status).toBe("ok");
    expect(second.status).toBe("ok");
    if (first.status === "ok" && second.status === "ok") {
      expect(second.migrated).toBe(false);
      expect(second.data.boards).toHaveLength(1);
      expect(second.data.boards[0].cards).toHaveLength(4);
      expect(second.data).toEqual(first.data);
    }
  });

  it("FR1.2 v2 wins over v1 when both exist", () => {
    window.localStorage.setItem(LEGACY_KEY, JSON.stringify(legacyTasks));
    const data = createStarterData();
    writeAppData(data);
    const result = readAppData();
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.migrated).toBe(false);
      expect(result.data.boards[0].cards).toHaveLength(4);
      expect(result.data.boards[0].cards.map((card) => card.id)).not.toContain(
        "a"
      );
    }
  });

  it("FR1.2 convertV1 tolerates missing fields and skips non-objects", () => {
    const data = convertV1([
      { id: "x" } as unknown as Task,
      null as unknown as Task
    ]);
    expect(data.boards[0].cards).toHaveLength(1);
    expect(data.boards[0].cards[0]).toMatchObject({
      id: "x",
      title: "",
      priority: "medium"
    });
  });

  it("FR1.3 damaged v2 JSON is reported unreadable and left untouched", () => {
    window.localStorage.setItem(DATA_KEY, "{not json");
    const result = readAppData();
    expect(result.status).toBe("unreadable");
    expect(window.localStorage.getItem(DATA_KEY)).toBe("{not json");
  });

  it("FR1.3 wrong-shape v2 data is unreadable and writes are refused", () => {
    const raw = JSON.stringify({ version: 2, boards: "nope" });
    window.localStorage.setItem(DATA_KEY, raw);
    expect(readAppData().status).toBe("unreadable");
    expect(writeAppData(createStarterData())).toBe("blocked");
    expect(window.localStorage.getItem(DATA_KEY)).toBe(raw);
  });

  it("FR1.3 damaged v1 data is unreadable and no v2 data is written", () => {
    window.localStorage.setItem(LEGACY_KEY, "[[[");
    expect(readAppData().status).toBe("unreadable");
    expect(window.localStorage.getItem(DATA_KEY)).toBeNull();
  });

  it("FR1.4 NFR4 a full storage reports full and keeps the earlier data", () => {
    const first = createStarterData();
    writeAppData(first);
    const before = window.localStorage.getItem(DATA_KEY);
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("full", "QuotaExceededError");
    });
    expect(writeAppData({ ...first, activeBoardId: first.activeBoardId })).toBe(
      "full"
    );
    expect(window.localStorage.getItem(DATA_KEY)).toBe(before);
  });

  it("FR1.4 other storage errors report unavailable", () => {
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("denied");
    });
    expect(writeAppData(createStarterData())).toBe("unavailable");
  });
});

describe("board-storage when window is undefined", () => {
  const originalWindow = globalThis.window;

  beforeEach(() => {
    delete (globalThis as { window?: Window }).window;
  });

  afterEach(() => {
    globalThis.window = originalWindow;
  });

  it("FR1.1 readAppData returns missing and writeAppData does not throw", () => {
    expect(typeof window).toBe("undefined");
    expect(readAppData()).toEqual({ status: "missing" });
    expect(writeAppData(createStarterData())).toBe("unavailable");
  });
});
