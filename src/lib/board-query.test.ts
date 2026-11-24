import {
  EMPTY_FILTER,
  activeFilterCount,
  dueState,
  filterCards,
  groupCards,
  listCounts,
  overLimit,
  sortCards,
  swimlanes
} from "@/lib/board-query";
import { defaultBoard, newCard, newLabel } from "@/lib/board-schema";
import type { Board, Card } from "@/types/board";

const NOW = new Date(2026, 10, 24, 15, 30);

function setup() {
  const board: Board = defaultBoard();
  const [todo, progress, completed] = board.lists;
  const bug = newLabel("Bug", "#c62828");
  const ui = newLabel("UI", "#6a3fb5");
  board.labels = [bug, ui];
  return { board, todo, progress, completed, bug, ui };
}

function card(listId: string, title: string, extra: Partial<Card> = {}): Card {
  return newCard(listId, {
    title,
    createdAt: "2026-11-01T09:00:00.000Z",
    ...extra
  });
}

describe("dueState", () => {
  it("FR3.3 yesterday is overdue", () => {
    const { todo } = setup();
    expect(
      dueState(card(todo.id, "a", { dueDate: "2026-11-23" }), todo, NOW)
    ).toBe("overdue");
  });

  it("FR3.3 today and tomorrow are due soon", () => {
    const { todo } = setup();
    expect(
      dueState(card(todo.id, "a", { dueDate: "2026-11-24" }), todo, NOW)
    ).toBe("due-soon");
    expect(
      dueState(card(todo.id, "a", { dueDate: "2026-11-25" }), todo, NOW)
    ).toBe("due-soon");
  });

  it("FR3.3 two days ahead and no date are none", () => {
    const { todo } = setup();
    expect(
      dueState(card(todo.id, "a", { dueDate: "2026-11-26" }), todo, NOW)
    ).toBe("none");
    expect(dueState(card(todo.id, "a"), todo, NOW)).toBe("none");
  });

  it("FR3.3 a card in the done list does not show overdue", () => {
    const { completed } = setup();
    expect(
      dueState(
        card(completed.id, "a", { dueDate: "2026-11-01" }),
        completed,
        NOW
      )
    ).toBe("none");
  });

  it("FR3.3 with no list flagged done, overdue is never suppressed", () => {
    const { board, progress } = setup();
    const lists = board.lists.map((list) => ({ ...list, done: false }));
    expect(
      dueState(card(progress.id, "a", { dueDate: "2026-11-01" }), lists[2], NOW)
    ).toBe("overdue");
  });

  it("FR3.3 the day boundary uses the local date at month end", () => {
    const { todo } = setup();
    const monthEnd = new Date(2026, 10, 30, 23, 59);
    expect(
      dueState(card(todo.id, "a", { dueDate: "2026-12-01" }), todo, monthEnd)
    ).toBe("due-soon");
    expect(
      dueState(card(todo.id, "a", { dueDate: "2026-11-29" }), todo, monthEnd)
    ).toBe("overdue");
  });

  it("FR3.3 uses a mocked clock when no date is passed", () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 10, 24, 9, 0));
    try {
      const { todo } = setup();
      expect(
        dueState(card(todo.id, "a", { dueDate: "2026-11-23" }), todo)
      ).toBe("overdue");
    } finally {
      jest.useRealTimers();
    }
  });
});

describe("filterCards", () => {
  it("FR4.1 filters by text over title and description", () => {
    const { board, todo } = setup();
    const cards = [
      card(todo.id, "Write docs"),
      card(todo.id, "Fix", { description: "update DOCS site" }),
      card(todo.id, "Other")
    ];
    expect(
      filterCards(cards, { ...EMPTY_FILTER, text: "docs" }, board.lists, NOW)
    ).toHaveLength(2);
  });

  it("FR4.1 filters by label, priority and due state", () => {
    const { board, todo, bug } = setup();
    const cards = [
      card(todo.id, "a", {
        labelIds: [bug.id],
        priority: "high",
        dueDate: "2026-11-23"
      }),
      card(todo.id, "b", { priority: "high" }),
      card(todo.id, "c", { labelIds: [bug.id], priority: "low" })
    ];
    expect(
      filterCards(
        cards,
        { ...EMPTY_FILTER, labelIds: [bug.id] },
        board.lists,
        NOW
      ).map((c) => c.title)
    ).toEqual(["a", "c"]);
    expect(
      filterCards(
        cards,
        { ...EMPTY_FILTER, priorities: ["high"] },
        board.lists,
        NOW
      ).map((c) => c.title)
    ).toEqual(["a", "b"]);
    expect(
      filterCards(
        cards,
        { ...EMPTY_FILTER, dueStates: ["overdue"] },
        board.lists,
        NOW
      ).map((c) => c.title)
    ).toEqual(["a"]);
  });

  it("FR4.1 combined filters need every dimension to match", () => {
    const { board, todo, bug } = setup();
    const cards = [
      card(todo.id, "both", { labelIds: [bug.id], priority: "high" }),
      card(todo.id, "label only", { labelIds: [bug.id], priority: "low" }),
      card(todo.id, "priority only", { priority: "high" })
    ];
    const filter = {
      ...EMPTY_FILTER,
      labelIds: [bug.id],
      priorities: ["high" as const]
    };
    expect(
      filterCards(cards, filter, board.lists, NOW).map((c) => c.title)
    ).toEqual(["both"]);
    expect(activeFilterCount(filter)).toBe(2);
    expect(activeFilterCount(EMPTY_FILTER)).toBe(0);
  });

  it("FR4.4 filtering does not change the input order or the cards", () => {
    const { board, todo } = setup();
    const cards = [card(todo.id, "b"), card(todo.id, "a")];
    const snapshot = [...cards];
    filterCards(cards, { ...EMPTY_FILTER, text: "a" }, board.lists, NOW);
    expect(cards).toEqual(snapshot);
    expect(
      filterCards(cards, { ...EMPTY_FILTER, text: "zzz" }, board.lists, NOW)
    ).toEqual([]);
    expect(filterCards(cards, EMPTY_FILTER, board.lists, NOW)).toEqual(cards);
  });
});

describe("sortCards", () => {
  it("FR4.2 sorts by due date ascending and descending with empty dates last", () => {
    const { todo } = setup();
    const cards = [
      card(todo.id, "none"),
      card(todo.id, "late", { dueDate: "2026-12-20" }),
      card(todo.id, "early", { dueDate: "2026-11-02" })
    ];
    expect(
      sortCards(cards, { key: "due", direction: "asc" }).map((c) => c.title)
    ).toEqual(["early", "late", "none"]);
    expect(
      sortCards(cards, { key: "due", direction: "desc" }).map((c) => c.title)
    ).toEqual(["late", "early", "none"]);
  });

  it("FR4.2 sorts by priority and by creation time", () => {
    const { todo } = setup();
    const cards = [
      card(todo.id, "m", {
        priority: "medium",
        createdAt: "2026-11-03T00:00:00.000Z"
      }),
      card(todo.id, "h", {
        priority: "high",
        createdAt: "2026-11-01T00:00:00.000Z"
      }),
      card(todo.id, "l", {
        priority: "low",
        createdAt: "2026-11-02T00:00:00.000Z"
      })
    ];
    expect(
      sortCards(cards, { key: "priority", direction: "desc" }).map(
        (c) => c.title
      )
    ).toEqual(["h", "m", "l"]);
    expect(
      sortCards(cards, { key: "priority", direction: "asc" }).map(
        (c) => c.title
      )
    ).toEqual(["l", "m", "h"]);
    expect(
      sortCards(cards, { key: "created", direction: "asc" }).map((c) => c.title)
    ).toEqual(["h", "l", "m"]);
    expect(
      sortCards(cards, { key: "created", direction: "desc" }).map(
        (c) => c.title
      )
    ).toEqual(["m", "l", "h"]);
  });

  it("FR4.2 ties break by creation time, older first, in both directions", () => {
    const { todo } = setup();
    const older = card(todo.id, "older", {
      dueDate: "2026-12-01",
      createdAt: "2026-11-01T00:00:00.000Z"
    });
    const newer = card(todo.id, "newer", {
      dueDate: "2026-12-01",
      createdAt: "2026-11-02T00:00:00.000Z"
    });
    for (const direction of ["asc", "desc"] as const) {
      expect(
        sortCards([newer, older], { key: "due", direction }).map((c) => c.title)
      ).toEqual(["older", "newer"]);
      expect(
        sortCards([older, newer], { key: "due", direction }).map((c) => c.title)
      ).toEqual(["older", "newer"]);
    }
  });

  it("FR4.4 sorting returns a new array and null leaves the saved order", () => {
    const { todo } = setup();
    const cards = [
      card(todo.id, "b", { dueDate: "2026-12-02" }),
      card(todo.id, "a", { dueDate: "2026-12-01" })
    ];
    const sorted = sortCards(cards, { key: "due", direction: "asc" });
    expect(sorted).not.toBe(cards);
    expect(cards.map((c) => c.title)).toEqual(["b", "a"]);
    expect(sortCards(cards, null)).toBe(cards);
  });
});

describe("groupCards and swimlanes", () => {
  it("FR4.3 groups by priority from high to low and skips empty groups", () => {
    const { board, todo } = setup();
    const cards = [
      card(todo.id, "l", { priority: "low" }),
      card(todo.id, "h", { priority: "high" })
    ];
    const groups = groupCards(
      cards,
      "priority",
      board.labels,
      board.lists,
      NOW
    );
    expect(groups.map((g) => g.title)).toEqual(["High", "Low"]);
  });

  it("FR4.3 a card with two labels appears under both and a card with none under No label", () => {
    const { board, todo, bug, ui } = setup();
    const cards = [
      card(todo.id, "both", { labelIds: [bug.id, ui.id] }),
      card(todo.id, "none")
    ];
    const groups = groupCards(cards, "label", board.labels, board.lists, NOW);
    expect(groups.map((g) => [g.title, g.cards.map((c) => c.title)])).toEqual([
      ["Bug", ["both"]],
      ["UI", ["both"]],
      ["No label", ["none"]]
    ]);
  });

  it("FR4.3 groups by due state", () => {
    const { board, todo } = setup();
    const cards = [
      card(todo.id, "late", { dueDate: "2026-11-01" }),
      card(todo.id, "soon", { dueDate: "2026-11-25" }),
      card(todo.id, "open")
    ];
    const groups = groupCards(cards, "due", board.labels, board.lists, NOW);
    expect(groups.map((g) => g.title)).toEqual([
      "Overdue",
      "Due soon",
      "No due date"
    ]);
  });

  it("FR10.2 swimlanes by priority span every active list", () => {
    const { board, todo, progress } = setup();
    board.cards = [
      card(todo.id, "a", { priority: "high" }),
      card(progress.id, "b", { priority: "high" }),
      card(todo.id, "c", { priority: "low" })
    ];
    const bands = swimlanes(board, "priority");
    expect(bands.map((band) => band.title)).toEqual(["High", "Low"]);
    expect(bands[0].lists).toHaveLength(3);
    expect(
      bands[0].lists.map((entry) => entry.cards.map((c) => c.title))
    ).toEqual([["a"], ["b"], []]);
  });

  it("FR10.2 swimlanes by label place a multi-label card in each band and others under No label", () => {
    const { board, todo, bug, ui } = setup();
    board.cards = [
      card(todo.id, "both", { labelIds: [bug.id, ui.id] }),
      card(todo.id, "none")
    ];
    const bands = swimlanes(board, "label");
    expect(bands.map((band) => band.title)).toEqual(["Bug", "UI", "No label"]);
    expect(bands[2].lists[0].cards.map((c) => c.title)).toEqual(["none"]);
  });
});

describe("listCounts and limits", () => {
  it("FR4.1 counts the total plus one entry per active list and ignores archived cards", () => {
    const { board, todo, progress } = setup();
    board.cards = [
      card(todo.id, "a"),
      card(todo.id, "b", { archived: true }),
      card(progress.id, "c")
    ];
    const counts = listCounts(board);
    expect(counts.total).toBe(2);
    expect(counts.perList.map((entry) => [entry.name, entry.count])).toEqual([
      ["To do", 1],
      ["In progress", 1],
      ["Completed", 0]
    ]);
  });

  it("FR10.1 reports a list over its limit in numbers", () => {
    const { board, todo } = setup();
    const limited = { ...todo, limit: 3 };
    board.lists = [limited, ...board.lists.slice(1)];
    board.cards = Array.from({ length: 4 }, (_, index) =>
      card(todo.id, `c${index}`)
    );
    expect(overLimit(board, limited)).toEqual({
      over: true,
      count: 4,
      limit: 3
    });
    board.cards = board.cards.slice(0, 3);
    expect(overLimit(board, limited).over).toBe(false);
  });
});
