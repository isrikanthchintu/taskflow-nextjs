import { checklistComplete, ruleBroken, runRules } from "@/lib/board-rules";
import {
  createDefaultData,
  newCard,
  newChecklist,
  newLabel
} from "@/lib/board-schema";
import type { AppData, Board, Card, Rule } from "@/types/board";

function setup(
  rules: (ids: {
    todo: string;
    progress: string;
    completed: string;
    label: string;
  }) => Rule[]
) {
  const data: AppData = createDefaultData();
  const board = data.boards[0];
  const [todo, progress, completed] = board.lists;
  const label = newLabel("Done", "#2e7d32");
  const cardOne = newCard(todo.id, { title: "One" });
  const built: Board = {
    ...board,
    labels: [label],
    cards: [cardOne],
    rules: rules({
      todo: todo.id,
      progress: progress.id,
      completed: completed.id,
      label: label.id
    })
  };
  return {
    data: { ...data, boards: [built] },
    boardId: board.id,
    card: cardOne,
    todo,
    progress,
    completed,
    label
  };
}

function find(data: AppData, id: string): Card {
  return data.boards[0].cards.find((card) => card.id === id) as Card;
}

describe("runRules", () => {
  it("FR11.1 a rule adds a label when a card enters the chosen list", () => {
    const ctx = setup((ids) => [
      {
        id: "r1",
        name: "Label done",
        enabled: true,
        trigger: { kind: "card-enters-list", listId: ids.completed },
        action: { kind: "add-label", labelId: ids.label }
      }
    ]);
    const result = runRules(ctx.data, ctx.boardId, {
      kind: "card-entered-list",
      cardId: ctx.card.id,
      listId: ctx.completed.id
    });
    expect(find(result.data, ctx.card.id).labelIds).toEqual([ctx.label.id]);
    expect(result.applied).toEqual(["r1"]);
  });

  it("FR11.1 a rule sets a priority and a rule moves a card", () => {
    const ctx = setup((ids) => [
      {
        id: "p",
        name: "Raise",
        enabled: true,
        trigger: { kind: "card-enters-list", listId: ids.progress },
        action: { kind: "set-priority", priority: "high" }
      },
      {
        id: "m",
        name: "Move on",
        enabled: true,
        trigger: { kind: "card-enters-list", listId: ids.progress },
        action: { kind: "move-to-list", listId: ids.completed }
      }
    ]);
    const result = runRules(ctx.data, ctx.boardId, {
      kind: "card-entered-list",
      cardId: ctx.card.id,
      listId: ctx.progress.id
    });
    const updated = find(result.data, ctx.card.id);
    expect(updated.priority).toBe("high");
    expect(updated.listId).toBe(ctx.completed.id);
  });

  it("FR11.1 a checklist-complete trigger fires on checklist completion only", () => {
    const ctx = setup((ids) => [
      {
        id: "c",
        name: "Checked",
        enabled: true,
        trigger: { kind: "checklist-complete" },
        action: { kind: "move-to-list", listId: ids.completed }
      }
    ]);
    const entered = runRules(ctx.data, ctx.boardId, {
      kind: "card-entered-list",
      cardId: ctx.card.id,
      listId: ctx.todo.id
    });
    expect(entered.applied).toEqual([]);
    const completed = runRules(ctx.data, ctx.boardId, {
      kind: "checklist-completed",
      cardId: ctx.card.id
    });
    expect(find(completed.data, ctx.card.id).listId).toBe(ctx.completed.id);
  });

  it("FR11.1 a disabled rule does nothing", () => {
    const ctx = setup((ids) => [
      {
        id: "r",
        name: "Off",
        enabled: false,
        trigger: { kind: "card-enters-list", listId: ids.completed },
        action: { kind: "set-priority", priority: "high" }
      }
    ]);
    const result = runRules(ctx.data, ctx.boardId, {
      kind: "card-entered-list",
      cardId: ctx.card.id,
      listId: ctx.completed.id
    });
    expect(result.applied).toEqual([]);
    expect(result.data).toBe(ctx.data);
  });

  it("FR11.2 a rule's own action never triggers another rule, so two bouncing rules move a card once", () => {
    const ctx = setup((ids) => [
      {
        id: "a",
        name: "To progress",
        enabled: true,
        trigger: { kind: "card-enters-list", listId: ids.todo },
        action: { kind: "move-to-list", listId: ids.progress }
      },
      {
        id: "b",
        name: "Back to todo",
        enabled: true,
        trigger: { kind: "card-enters-list", listId: ids.progress },
        action: { kind: "move-to-list", listId: ids.todo }
      }
    ]);
    const result = runRules(ctx.data, ctx.boardId, {
      kind: "card-entered-list",
      cardId: ctx.card.id,
      listId: ctx.todo.id
    });
    expect(result.applied).toEqual(["a"]);
    expect(find(result.data, ctx.card.id).listId).toBe(ctx.progress.id);
  });

  it("FR11.3 a rule pointing at an archived list is broken and does nothing", () => {
    const ctx = setup((ids) => [
      {
        id: "r",
        name: "Broken",
        enabled: true,
        trigger: { kind: "card-enters-list", listId: ids.todo },
        action: { kind: "move-to-list", listId: ids.completed }
      }
    ]);
    const board = ctx.data.boards[0];
    const archivedData: AppData = {
      ...ctx.data,
      boards: [
        {
          ...board,
          lists: board.lists.map((list) =>
            list.id === ctx.completed.id ? { ...list, archived: true } : list
          )
        }
      ]
    };
    expect(ruleBroken(archivedData.boards[0], board.rules[0])).toBe(true);
    const result = runRules(archivedData, ctx.boardId, {
      kind: "card-entered-list",
      cardId: ctx.card.id,
      listId: ctx.todo.id
    });
    expect(result.applied).toEqual([]);
    expect(result.skipped).toEqual(["r"]);
    expect(find(result.data, ctx.card.id).listId).toBe(ctx.todo.id);
  });

  it("FR11.3 a rule whose label was deleted is broken and does nothing", () => {
    const ctx = setup((ids) => [
      {
        id: "r",
        name: "Gone label",
        enabled: true,
        trigger: { kind: "card-enters-list", listId: ids.todo },
        action: { kind: "add-label", labelId: ids.label }
      }
    ]);
    const board = ctx.data.boards[0];
    const noLabel: AppData = {
      ...ctx.data,
      boards: [{ ...board, labels: [] }]
    };
    expect(ruleBroken(noLabel.boards[0], board.rules[0])).toBe(true);
    const result = runRules(noLabel, ctx.boardId, {
      kind: "card-entered-list",
      cardId: ctx.card.id,
      listId: ctx.todo.id
    });
    expect(result.applied).toEqual([]);
    expect(find(result.data, ctx.card.id).labelIds).toEqual([]);
  });

  it("FR11.1 adding a label twice does not duplicate it", () => {
    const ctx = setup((ids) => [
      {
        id: "r",
        name: "Label",
        enabled: true,
        trigger: { kind: "card-enters-list", listId: ids.todo },
        action: { kind: "add-label", labelId: ids.label }
      }
    ]);
    const event = {
      kind: "card-entered-list" as const,
      cardId: ctx.card.id,
      listId: ctx.todo.id
    };
    const once = runRules(ctx.data, ctx.boardId, event);
    const twice = runRules(once.data, ctx.boardId, event);
    expect(find(twice.data, ctx.card.id).labelIds).toEqual([ctx.label.id]);
  });
});

describe("checklistComplete", () => {
  it("FR11.1 is true only when there are items and all are checked", () => {
    const { todo } = setup(() => []);
    const checklist = newChecklist("Steps", ["a", "b"]);
    const base = newCard(todo.id, { title: "x", checklists: [checklist] });
    expect(checklistComplete(base)).toBe(false);
    const done = {
      ...base,
      checklists: [
        {
          ...checklist,
          items: checklist.items.map((item) => ({ ...item, checked: true }))
        }
      ]
    };
    expect(checklistComplete(done)).toBe(true);
    expect(checklistComplete({ ...base, checklists: [] })).toBe(false);
  });
});
