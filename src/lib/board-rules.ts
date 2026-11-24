import { moveCard } from "@/lib/board-ops";
import type { AppData, Board, Card, Rule } from "@/types/board";

export type RuleEvent =
  | { kind: "card-entered-list"; cardId: string; listId: string }
  | { kind: "checklist-completed"; cardId: string };

export interface RuleRun {
  data: AppData;
  applied: string[];
  skipped: string[];
}

export function ruleBroken(board: Board, rule: Rule): boolean {
  const listUsable = (listId: string) =>
    board.lists.some((list) => list.id === listId && !list.archived);
  if (
    rule.trigger.kind === "card-enters-list" &&
    !listUsable(rule.trigger.listId)
  )
    return true;
  if (rule.action.kind === "move-to-list" && !listUsable(rule.action.listId))
    return true;
  if (rule.action.kind === "add-label") {
    const labelId = rule.action.labelId;
    if (!board.labels.some((label) => label.id === labelId)) return true;
  }
  return false;
}

export function checklistComplete(card: Card): boolean {
  const items = card.checklists.flatMap((checklist) => checklist.items);
  return items.length > 0 && items.every((item) => item.checked);
}

function matches(rule: Rule, event: RuleEvent): boolean {
  if (rule.trigger.kind === "card-enters-list") {
    return (
      event.kind === "card-entered-list" && event.listId === rule.trigger.listId
    );
  }
  return event.kind === "checklist-completed";
}

export function runRules(
  data: AppData,
  boardId: string,
  event: RuleEvent
): RuleRun {
  const board = data.boards.find((item) => item.id === boardId);
  if (!board) return { data, applied: [], skipped: [] };

  let current = data;
  const applied: string[] = [];
  const skipped: string[] = [];

  for (const rule of board.rules) {
    if (!rule.enabled || !matches(rule, event)) continue;
    if (ruleBroken(board, rule)) {
      skipped.push(rule.id);
      continue;
    }
    const action = rule.action;
    if (action.kind === "move-to-list") {
      const moved = moveCard(current, boardId, event.cardId, action.listId);
      if (!moved.ok) {
        skipped.push(rule.id);
        continue;
      }
      current = moved.data;
    } else {
      const currentBoard = current.boards.find((item) => item.id === boardId);
      if (
        !currentBoard ||
        !currentBoard.cards.some((card) => card.id === event.cardId)
      ) {
        skipped.push(rule.id);
        continue;
      }
      const cards = currentBoard.cards.map((card) => {
        if (card.id !== event.cardId) return card;
        if (action.kind === "add-label") {
          return card.labelIds.includes(action.labelId)
            ? card
            : { ...card, labelIds: [...card.labelIds, action.labelId] };
        }
        return { ...card, priority: action.priority };
      });
      current = {
        ...current,
        boards: current.boards.map((item) =>
          item.id === boardId ? { ...item, cards } : item
        )
      };
    }
    applied.push(rule.id);
  }

  return { data: current, applied, skipped };
}
