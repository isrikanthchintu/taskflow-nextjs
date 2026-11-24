import * as ops from "@/lib/board-ops";
import { createDefaultData, newCard, newChecklist } from "@/lib/board-schema";
import { activeCards, cardsInList } from "@/lib/board-query";
import type { AppData, Board, Card } from "@/types/board";

function unwrap(result: ops.OpResult): AppData {
  if (!result.ok) throw new Error(result.error);
  return result.data;
}

function unwrapId(result: ops.OpResult): string {
  if (!result.ok || !result.id) throw new Error("expected an id");
  return result.id;
}

function boardOf(data: AppData, id: string = data.activeBoardId): Board {
  const board = data.boards.find((item) => item.id === id);
  if (!board) throw new Error("missing board");
  return board;
}

function titles(data: AppData, listId: string): string[] {
  return cardsInList(boardOf(data), listId).map((card) => card.title);
}

function seed() {
  let data = createDefaultData();
  const boardId = data.activeBoardId;
  const [todo, progress, completed] = boardOf(data).lists;
  for (const title of ["A", "B", "C"]) {
    data = unwrap(ops.addCard(data, boardId, todo.id, { title }));
  }
  return { data, boardId, todo, progress, completed };
}

describe("lists", () => {
  it("FR2.1 adds a list after the last one", () => {
    const { data, boardId } = seed();
    const next = unwrap(ops.addList(data, boardId, "Review"));
    const lists = boardOf(next).lists;
    expect(lists[lists.length - 1].name).toBe("Review");
    expect(lists[lists.length - 1]).toMatchObject({
      done: false,
      limit: null,
      archived: false
    });
  });

  it("FR2.1 refuses blank and whitespace-only names", () => {
    const { data, boardId } = seed();
    expect(ops.addList(data, boardId, "   ").ok).toBe(false);
    expect(ops.addList(data, boardId, "").ok).toBe(false);
  });

  it("FR2.2 renames a list and leaves its cards unchanged", () => {
    const { data, boardId, todo } = seed();
    const next = unwrap(ops.renameList(data, boardId, todo.id, "Testing"));
    expect(boardOf(next).lists[0].name).toBe("Testing");
    expect(titles(next, todo.id)).toEqual(titles(data, todo.id));
    expect(ops.renameList(data, boardId, todo.id, " ").ok).toBe(false);
  });

  it("FR2.3 reorders lists and keeps the cards", () => {
    const { data, boardId, completed, todo } = seed();
    const next = unwrap(ops.reorderList(data, boardId, completed.id, 0));
    expect(boardOf(next).lists.map((list) => list.name)).toEqual([
      "Completed",
      "To do",
      "In progress"
    ]);
    expect(titles(next, todo.id)).toEqual(["C", "B", "A"]);
  });

  it("FR2.4 archives a list with its cards and restores them in the same order", () => {
    const { data, boardId, todo } = seed();
    const archived = unwrap(ops.archiveList(data, boardId, todo.id));
    expect(activeCards(boardOf(archived))).toHaveLength(0);
    expect(
      boardOf(archived).lists.find((list) => list.id === todo.id)?.archived
    ).toBe(true);
    const restored = unwrap(ops.restoreList(archived, boardId, todo.id));
    expect(titles(restored, todo.id)).toEqual(["C", "B", "A"]);
  });

  it("FR2.5 deletes only an archived list and reports its card count first", () => {
    const { data, boardId, todo } = seed();
    expect(ops.deleteArchivedList(data, boardId, todo.id).ok).toBe(false);
    const archived = unwrap(ops.archiveList(data, boardId, todo.id));
    expect(ops.listCardCount(boardOf(archived), todo.id)).toBe(3);
    const deleted = unwrap(ops.deleteArchivedList(archived, boardId, todo.id));
    expect(boardOf(deleted).lists.some((list) => list.id === todo.id)).toBe(
      false
    );
    expect(boardOf(deleted).cards).toHaveLength(0);
  });

  it("FR10.1 sets and clears a list limit and rejects invalid limits", () => {
    const { data, boardId, todo } = seed();
    const limited = unwrap(ops.setListLimit(data, boardId, todo.id, 3));
    expect(boardOf(limited).lists[0].limit).toBe(3);
    expect(
      boardOf(unwrap(ops.setListLimit(limited, boardId, todo.id, null)))
        .lists[0].limit
    ).toBeNull();
    expect(ops.setListLimit(data, boardId, todo.id, 0).ok).toBe(false);
    expect(ops.setListLimit(data, boardId, todo.id, 1.5).ok).toBe(false);
  });

  it("FR3.3 marks a list as the done list", () => {
    const { data, boardId, progress } = seed();
    const next = unwrap(ops.setListDone(data, boardId, progress.id, true));
    expect(boardOf(next).lists[1].done).toBe(true);
  });
});

describe("limits", () => {
  it("FR1.5 refuses an 11th list and names the limit", () => {
    let data = createDefaultData();
    const boardId = data.activeBoardId;
    for (let index = 0; index < 7; index += 1)
      data = unwrap(ops.addList(data, boardId, `L${index}`));
    expect(boardOf(data).lists).toHaveLength(10);
    const result = ops.addList(data, boardId, "Eleventh");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("10 lists per board");
  });

  it("FR1.5 FR7.1 refuses a sixth board and names the limit", () => {
    let data = createDefaultData();
    for (let index = 0; index < 4; index += 1)
      data = unwrap(ops.createBoard(data, `Board ${index}`));
    const result = ops.createBoard(data, "Sixth");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("5 boards");
  });

  it("FR1.5 refuses card 201 across all boards and warns at 90%", () => {
    let data = createDefaultData();
    data = unwrap(ops.createBoard(data, "Second"));
    const [first, second] = data.boards;
    const bulk = (board: Board, count: number): Board => ({
      ...board,
      cards: Array.from({ length: count }, (_, index) =>
        newCard(board.lists[0].id, { title: `c${index}` })
      )
    });
    data = { ...data, boards: [bulk(first, 100), bulk(second, 79)] };
    expect(ops.checkLimits(data).cards).toMatchObject({
      count: 179,
      warn: false,
      reached: false
    });
    data = unwrap(
      ops.addCard(data, first.id, first.lists[0].id, { title: "x" })
    );
    expect(ops.checkLimits(data).cards).toMatchObject({
      count: 180,
      warn: true,
      reached: false
    });
    for (let index = 0; index < 20; index += 1) {
      data = unwrap(
        ops.addCard(data, first.id, first.lists[0].id, { title: `y${index}` })
      );
    }
    const result = ops.addCard(data, first.id, first.lists[0].id, {
      title: "over"
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("200 cards");
  });

  it("FR1.5 archived cards and templates do not count toward the card limit", () => {
    const { data, boardId } = seed();
    const first = boardOf(data).cards[0];
    const archived = unwrap(ops.archiveCard(data, boardId, first.id));
    expect(ops.checkLimits(archived).cards.count).toBe(2);
  });

  it("FR1.5 reports list usage at 90% of 10 lists", () => {
    let data = createDefaultData();
    for (let index = 0; index < 6; index += 1)
      data = unwrap(ops.addList(data, data.activeBoardId, `L${index}`));
    expect(ops.checkLimits(data).lists).toMatchObject({
      count: 9,
      warn: true,
      reached: false
    });
  });
});

describe("cards", () => {
  it("FR3.4 refuses a blank title and over-long text", () => {
    const { data, boardId, todo } = seed();
    expect(ops.addCard(data, boardId, todo.id, { title: "  " }).ok).toBe(false);
    expect(
      ops.addCard(data, boardId, todo.id, { title: "x".repeat(101) }).ok
    ).toBe(false);
    expect(
      ops.addCard(data, boardId, todo.id, {
        title: "ok",
        description: "y".repeat(501)
      }).ok
    ).toBe(false);
  });

  it("FR3.4 adds a card to the top of its list and updates its fields", () => {
    const { data, boardId, todo } = seed();
    const withCard = unwrap(
      ops.addCard(data, boardId, todo.id, { title: "Top", priority: "high" })
    );
    expect(titles(withCard, todo.id)[0]).toBe("Top");
    const id = cardsInList(boardOf(withCard), todo.id)[0].id;
    const updated = unwrap(
      ops.updateCard(withCard, boardId, id, {
        title: "New",
        dueDate: "2026-12-01"
      })
    );
    expect(boardOf(updated).cards.find((card) => card.id === id)).toMatchObject(
      {
        title: "New",
        dueDate: "2026-12-01",
        priority: "high"
      }
    );
    expect(ops.updateCard(withCard, boardId, id, { title: " " }).ok).toBe(
      false
    );
  });

  it("FR1.1 moves a card to the end of another list and reorders within a list", () => {
    const { data, boardId, todo, progress } = seed();
    const cardA = boardOf(data).cards.find(
      (card) => card.title === "A"
    ) as Card;
    const moved = unwrap(ops.moveCard(data, boardId, cardA.id, progress.id));
    expect(titles(moved, progress.id)).toEqual(["A"]);
    expect(titles(moved, todo.id)).toEqual(["C", "B"]);
    const reordered = unwrap(ops.reorderCard(data, boardId, cardA.id, 0));
    expect(titles(reordered, todo.id)).toEqual(["A", "C", "B"]);
  });

  it("FR1.1 moves a card to a chosen index in another list", () => {
    const { data, boardId, progress } = seed();
    const first = unwrap(
      ops.addCard(data, boardId, progress.id, { title: "P1" })
    );
    const second = unwrap(
      ops.addCard(first, boardId, progress.id, { title: "P2" })
    );
    const cardC = boardOf(second).cards.find(
      (card) => card.title === "C"
    ) as Card;
    const moved = unwrap(
      ops.moveCard(second, boardId, cardC.id, progress.id, 1)
    );
    expect(titles(moved, progress.id)).toEqual(["P2", "C", "P1"]);
  });

  it("FR6.1 archives a card and restores it to its place", () => {
    const { data, boardId, todo } = seed();
    const cardB = boardOf(data).cards.find(
      (card) => card.title === "B"
    ) as Card;
    const archived = unwrap(ops.archiveCard(data, boardId, cardB.id));
    expect(titles(archived, todo.id)).toEqual(["C", "A"]);
    const restored = unwrap(ops.restoreCard(archived, boardId, cardB.id));
    expect(titles(restored, todo.id)).toEqual(["C", "B", "A"]);
  });

  it("FR6.1 refuses to restore a card whose list is archived", () => {
    const { data, boardId, todo } = seed();
    const cardB = boardOf(data).cards.find(
      (card) => card.title === "B"
    ) as Card;
    const archivedCard = unwrap(ops.archiveCard(data, boardId, cardB.id));
    const archivedList = unwrap(
      ops.archiveList(archivedCard, boardId, todo.id)
    );
    const result = ops.restoreCard(archivedList, boardId, cardB.id);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/Restore the list first/);
  });

  it("FR6.2 deletes a card and can put it back at its index", () => {
    const { data, boardId } = seed();
    const index = boardOf(data).cards.findIndex((card) => card.title === "B");
    const card = boardOf(data).cards[index];
    const deleted = unwrap(ops.deleteCard(data, boardId, card.id));
    expect(boardOf(deleted).cards).toHaveLength(2);
    const back = unwrap(ops.reinsertCard(deleted, boardId, card, index));
    expect(boardOf(back).cards).toEqual(boardOf(data).cards);
  });

  it("FR6.3 duplicates a card right after the original with unchecked items", () => {
    const { data, boardId, todo } = seed();
    const original = boardOf(data).cards.find(
      (card) => card.title === "B"
    ) as Card;
    let withItems = unwrap(
      ops.addChecklist(data, boardId, original.id, "Steps")
    );
    const created = boardOf(withItems).cards.find(
      (card) => card.id === original.id
    )?.checklists[0];
    if (!created) throw new Error("missing checklist");
    const itemResult = ops.addChecklistItem(
      withItems,
      boardId,
      original.id,
      created.id,
      "Step one"
    );
    withItems = unwrap(itemResult);
    const itemId = unwrapId(itemResult);
    withItems = unwrap(
      ops.updateChecklistItem(
        withItems,
        boardId,
        original.id,
        created.id,
        itemId,
        { checked: true }
      )
    );
    withItems = unwrap(
      ops.updateCard(withItems, boardId, original.id, {
        labelIds: ["l1"],
        dueDate: "2026-12-05"
      })
    );
    const copied = unwrap(ops.duplicateCard(withItems, boardId, original.id));
    const names = titles(copied, todo.id);
    expect(names).toEqual(["C", "B", "B (copy)", "A"]);
    const copy = boardOf(copied).cards.find(
      (card) => card.title === "B (copy)"
    ) as Card;
    expect(copy.dueDate).toBe("2026-12-05");
    expect(copy.labelIds).toEqual(["l1"]);
    expect(copy.checklists[0].items.map((item) => item.checked)).toEqual([
      false
    ]);
    expect(copy.checklists[0].id).not.toBe(created.id);
    expect(copy.id).not.toBe(original.id);
  });
});

describe("labels and checklists", () => {
  it("FR3.1 creates, renames, recolors and deletes a label and removes it from cards", () => {
    const { data, boardId } = seed();
    const created = ops.addLabel(data, boardId, " Bug ", "#c62828");
    const labelId = unwrapId(created);
    let next = unwrap(created);
    expect(boardOf(next).labels[0]).toMatchObject({
      name: "Bug",
      color: "#c62828"
    });
    next = unwrap(ops.renameLabel(next, boardId, labelId, "Defect"));
    next = unwrap(ops.recolorLabel(next, boardId, labelId, "#2e7d32"));
    expect(boardOf(next).labels[0]).toMatchObject({
      name: "Defect",
      color: "#2e7d32"
    });
    const cardId = boardOf(next).cards[0].id;
    next = unwrap(
      ops.updateCard(next, boardId, cardId, { labelIds: [labelId] })
    );
    next = unwrap(ops.deleteLabel(next, boardId, labelId));
    expect(boardOf(next).labels).toHaveLength(0);
    expect(boardOf(next).cards[0].labelIds).toEqual([]);
    expect(ops.addLabel(data, boardId, "  ", "#fff").ok).toBe(false);
  });

  it("FR3.2 adds, checks, renames, reorders and deletes checklist items", () => {
    const { data, boardId } = seed();
    const cardId = boardOf(data).cards[0].id;
    const created = ops.addChecklist(data, boardId, cardId, "Steps");
    const checklistId = unwrapId(created);
    let next = unwrap(created);
    const ids: string[] = [];
    for (const text of ["one", "two", "three", "four"]) {
      const result = ops.addChecklistItem(
        next,
        boardId,
        cardId,
        checklistId,
        text
      );
      ids.push(unwrapId(result));
      next = unwrap(result);
    }
    next = unwrap(
      ops.updateChecklistItem(next, boardId, cardId, checklistId, ids[0], {
        checked: true
      })
    );
    const checklist = () =>
      boardOf(next).cards.find((card) => card.id === cardId)?.checklists[0];
    expect(checklist()?.items.filter((item) => item.checked)).toHaveLength(1);
    expect(checklist()?.items).toHaveLength(4);
    next = unwrap(
      ops.updateChecklistItem(next, boardId, cardId, checklistId, ids[1], {
        text: "second"
      })
    );
    expect(checklist()?.items[1].text).toBe("second");
    next = unwrap(
      ops.reorderChecklistItem(next, boardId, cardId, checklistId, ids[3], 0)
    );
    expect(checklist()?.items.map((item) => item.text)).toEqual([
      "four",
      "one",
      "second",
      "three"
    ]);
    next = unwrap(
      ops.deleteChecklistItem(next, boardId, cardId, checklistId, ids[2])
    );
    expect(checklist()?.items).toHaveLength(3);
    next = unwrap(
      ops.renameChecklist(next, boardId, cardId, checklistId, "Plan")
    );
    expect(checklist()?.title).toBe("Plan");
    expect(
      ops.addChecklistItem(next, boardId, cardId, checklistId, " ").ok
    ).toBe(false);
    next = unwrap(ops.deleteChecklist(next, boardId, cardId, checklistId));
    expect(
      boardOf(next).cards.find((card) => card.id === cardId)?.checklists
    ).toEqual([]);
  });
});

describe("templates", () => {
  it("FR6.4 saves a template without the due date and creates a card from it", () => {
    const { data, boardId, progress } = seed();
    const card = boardOf(data).cards[0];
    let next = unwrap(
      ops.updateCard(data, boardId, card.id, {
        description: "Details",
        priority: "high",
        dueDate: "2026-12-10",
        labelIds: ["l1"],
        checklists: [newChecklist("Steps", ["one"])]
      })
    );
    const saved = ops.saveAsTemplate(next, boardId, card.id);
    const templateId = unwrapId(saved);
    next = unwrap(saved);
    expect(boardOf(next).templates[0]).not.toHaveProperty("dueDate");
    const created = ops.createCardFromTemplate(
      next,
      boardId,
      templateId,
      progress.id
    );
    const createdCard = boardOf(unwrap(created)).cards.find(
      (item) => item.id === unwrapId(created)
    ) as Card;
    expect(createdCard).toMatchObject({
      title: card.title,
      description: "Details",
      priority: "high",
      dueDate: "",
      labelIds: ["l1"],
      listId: progress.id
    });
    expect(createdCard.checklists[0].items[0].checked).toBe(false);
    const removed = unwrap(ops.deleteTemplate(next, boardId, templateId));
    expect(boardOf(removed).templates).toEqual([]);
    expect(
      ops.createCardFromTemplate(removed, boardId, templateId, progress.id).ok
    ).toBe(false);
  });
});

describe("boards", () => {
  it("FR7.1 creates, renames and switches boards and rejects blank names", () => {
    const data = createDefaultData();
    const created = ops.createBoard(data, "  Work ");
    const workId = unwrapId(created);
    let next = unwrap(created);
    expect(boardOf(next, workId).name).toBe("Work");
    next = unwrap(ops.renameBoard(next, workId, "Office"));
    next = unwrap(ops.switchBoard(next, workId));
    expect(next.activeBoardId).toBe(workId);
    expect(boardOf(next, workId).name).toBe("Office");
    expect(ops.createBoard(data, " ").ok).toBe(false);
    expect(ops.switchBoard(next, "missing").ok).toBe(false);
  });

  it("FR7.3 keeps lists, cards and labels separate per board", () => {
    const { data, boardId } = seed();
    const labelled = unwrap(ops.addLabel(data, boardId, "Bug", "#c62828"));
    const created = ops.createBoard(labelled, "Other");
    const otherId = unwrapId(created);
    const next = unwrap(created);
    expect(boardOf(next, otherId).labels).toEqual([]);
    expect(boardOf(next, otherId).cards).toEqual([]);
    expect(boardOf(next, boardId).labels).toHaveLength(1);
  });

  it("FR7.4 archives a board, restores it and deletes it only when archived", () => {
    const first = createDefaultData();
    const created = ops.createBoard(first, "Second");
    const secondId = unwrapId(created);
    const data = unwrap(created);
    expect(ops.deleteArchivedBoard(data, secondId).ok).toBe(false);
    const archived = unwrap(ops.archiveBoard(data, secondId));
    expect(boardOf(archived, secondId).archived).toBe(true);
    expect(ops.switchBoard(archived, secondId).ok).toBe(false);
    expect(ops.boardCounts(boardOf(archived, secondId))).toEqual({
      lists: 3,
      cards: 0
    });
    const restored = unwrap(ops.restoreBoard(archived, secondId));
    expect(boardOf(restored, secondId).archived).toBe(false);
    const deleted = unwrap(ops.deleteArchivedBoard(archived, secondId));
    expect(deleted.boards.some((board) => board.id === secondId)).toBe(false);
  });

  it("FR7.2 archiving the open board moves to another open board and the last board cannot be archived", () => {
    const first = createDefaultData();
    const created = ops.createBoard(first, "Second");
    const secondId = unwrapId(created);
    const data = unwrap(created);
    const archived = unwrap(ops.archiveBoard(data, first.activeBoardId));
    expect(archived.activeBoardId).toBe(secondId);
    expect(ops.archiveBoard(archived, secondId).ok).toBe(false);
  });

  it("FR5.3 changes only one board's background and rejects unknown presets", () => {
    const first = createDefaultData();
    const created = ops.createBoard(first, "Second");
    const secondId = unwrapId(created);
    const next = unwrap(
      ops.setBoardBackground(unwrap(created), secondId, "forest")
    );
    expect(boardOf(next, secondId).backgroundId).toBe("forest");
    expect(boardOf(next, first.activeBoardId).backgroundId).toBe(
      "blue-gradient"
    );
    expect(ops.setBoardBackground(next, secondId, "image-url").ok).toBe(false);
  });

  it("FR5.1 FR5.2 FR5.4 updates settings without touching boards", () => {
    const data = createDefaultData();
    const next = unwrap(
      ops.updateSettings(data, {
        mode: "dark",
        accentId: "green",
        density: "compact"
      })
    );
    expect(next.settings).toMatchObject({
      mode: "dark",
      accentId: "green",
      density: "compact",
      corners: "rounded"
    });
    expect(next.boards).toBe(data.boards);
  });
});

describe("rules management", () => {
  it("FR11.1 adds, renames, disables, enables and deletes a rule", () => {
    const { data, boardId, progress } = seed();
    const created = ops.addRule(data, boardId, {
      name: "Start",
      trigger: { kind: "card-enters-list", listId: progress.id },
      action: { kind: "set-priority", priority: "high" }
    });
    const ruleId = unwrapId(created);
    let next = unwrap(created);
    expect(boardOf(next).rules[0]).toMatchObject({
      name: "Start",
      enabled: true
    });
    next = unwrap(ops.setRuleEnabled(next, boardId, ruleId, false));
    expect(boardOf(next).rules[0].enabled).toBe(false);
    next = unwrap(ops.renameRule(next, boardId, ruleId, "Begin"));
    expect(boardOf(next).rules[0].name).toBe("Begin");
    next = unwrap(ops.deleteRule(next, boardId, ruleId));
    expect(boardOf(next).rules).toEqual([]);
    expect(
      ops.addRule(data, boardId, {
        name: " ",
        trigger: { kind: "checklist-complete" },
        action: { kind: "set-priority", priority: "low" }
      }).ok
    ).toBe(false);
  });
});

describe("performance", () => {
  it("NFR2 adding, moving and reordering with 200 cards completes well under 200 ms", () => {
    let data = createDefaultData();
    const boardId = data.activeBoardId;
    const [todo, progress] = boardOf(data).lists;
    data = {
      ...data,
      boards: [
        {
          ...boardOf(data),
          cards: Array.from({ length: 199 }, (_, index) =>
            newCard(todo.id, { title: `c${index}` })
          )
        }
      ]
    };
    const started = performance.now();
    data = unwrap(ops.addCard(data, boardId, todo.id, { title: "last" }));
    const moving = boardOf(data).cards[5];
    data = unwrap(ops.moveCard(data, boardId, moving.id, progress.id));
    data = unwrap(
      ops.reorderCard(data, boardId, boardOf(data).cards[10].id, 0)
    );
    expect(performance.now() - started).toBeLessThan(200);
  });
});
