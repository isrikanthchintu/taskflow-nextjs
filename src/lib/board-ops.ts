import { defaultBoard, newId } from "@/lib/board-schema";
import { activeCards, activeLists } from "@/lib/board-query";
import { BACKGROUND_PRESETS } from "@/lib/theme-presets";
import type {
  AppData,
  Board,
  Card,
  CardTemplate,
  Checklist,
  Priority,
  Rule,
  RuleAction,
  RuleTrigger,
  Settings
} from "@/types/board";

export type OpResult =
  { ok: true; data: AppData; id?: string } | { ok: false; error: string };

export interface LimitStatus {
  count: number;
  limit: number;
  warn: boolean;
  reached: boolean;
}

export interface LimitReport {
  boards: LimitStatus;
  lists: LimitStatus;
  cards: LimitStatus;
}

export interface CardInput {
  title: string;
  description?: string;
  priority?: Priority;
  dueDate?: string;
  labelIds?: string[];
  checklists?: Checklist[];
}

export type CardUpdates = Partial<
  Pick<
    Card,
    "title" | "description" | "priority" | "dueDate" | "labelIds" | "checklists"
  >
>;

export const LIMITS = { boards: 5, lists: 10, cards: 200 } as const;
export const TITLE_MAX = 100;
export const DESCRIPTION_MAX = 500;
export const COPY_SUFFIX = " (copy)";

function success(data: AppData, id?: string): OpResult {
  return id === undefined ? { ok: true, data } : { ok: true, data, id };
}

function failure(error: string): OpResult {
  return { ok: false, error };
}

function status(count: number, limit: number): LimitStatus {
  return {
    count,
    limit,
    warn: count * 10 >= limit * 9,
    reached: count >= limit
  };
}

export function totalActiveCards(data: AppData): number {
  return data.boards
    .filter((board) => !board.archived)
    .reduce((sum, board) => sum + activeCards(board).length, 0);
}

export function checkLimits(
  data: AppData,
  boardId: string = data.activeBoardId
): LimitReport {
  const board = data.boards.find((item) => item.id === boardId);
  return {
    boards: status(
      data.boards.filter((item) => !item.archived).length,
      LIMITS.boards
    ),
    lists: status(board ? activeLists(board).length : 0, LIMITS.lists),
    cards: status(totalActiveCards(data), LIMITS.cards)
  };
}

export function listCardCount(board: Board, listId: string): number {
  return board.cards.filter((card) => card.listId === listId).length;
}

export function boardCounts(board: Board): { lists: number; cards: number } {
  return { lists: board.lists.length, cards: board.cards.length };
}

function editBoard(
  data: AppData,
  boardId: string,
  change: (board: Board) => Board | string,
  id?: string
): OpResult {
  const board = data.boards.find((item) => item.id === boardId);
  if (!board) return failure("That board was not found.");
  const next = change(board);
  if (typeof next === "string") return failure(next);
  return success(
    {
      ...data,
      boards: data.boards.map((item) => (item.id === boardId ? next : item))
    },
    id
  );
}

function editCard(
  data: AppData,
  boardId: string,
  cardId: string,
  change: (card: Card, board: Board) => Card | string
): OpResult {
  return editBoard(data, boardId, (board) => {
    const card = board.cards.find((item) => item.id === cardId);
    if (!card) return "That card was not found.";
    const next = change(card, board);
    if (typeof next === "string") return next;
    return {
      ...board,
      cards: board.cards.map((item) => (item.id === cardId ? next : item))
    };
  });
}

function cleanName(value: string, what: string): string | { error: string } {
  const name = value.trim();
  return name ? name : { error: `${what} cannot be blank.` };
}

function checkCardText(title: string, description: string): string | null {
  if (title.length > TITLE_MAX)
    return `The title can be up to ${TITLE_MAX} characters.`;
  if (description.length > DESCRIPTION_MAX)
    return `The description can be up to ${DESCRIPTION_MAX} characters.`;
  return null;
}

export function reorderSubset<T extends { id: string }>(
  items: T[],
  inSubset: (item: T) => boolean,
  id: string,
  newIndex: number
): T[] {
  const subset = items.filter(inSubset);
  const moving = subset.find((item) => item.id === id);
  if (!moving) return items;
  const rest = subset.filter((item) => item.id !== id);
  const index = Math.max(0, Math.min(newIndex, rest.length));
  const reordered = [...rest.slice(0, index), moving, ...rest.slice(index)];
  let cursor = 0;
  return items.map((item) => (inSubset(item) ? reordered[cursor++] : item));
}

function insertIntoGroup(
  cards: Card[],
  card: Card,
  index: number | undefined
): Card[] {
  const group = cards.filter(
    (item) => item.listId === card.listId && !item.archived
  );
  if (index === undefined || index >= group.length) {
    const last =
      group.length > 0
        ? cards.indexOf(group[group.length - 1])
        : cards.length - 1;
    return [...cards.slice(0, last + 1), card, ...cards.slice(last + 1)];
  }
  const at = cards.indexOf(group[Math.max(0, index)]);
  return [...cards.slice(0, at), card, ...cards.slice(at)];
}

function cloneChecklists(
  checklists: Checklist[],
  keepChecks: boolean
): Checklist[] {
  return checklists.map((checklist) => ({
    id: newId(),
    title: checklist.title,
    items: checklist.items.map((item) => ({
      id: newId(),
      text: item.text,
      checked: keepChecks ? item.checked : false
    }))
  }));
}

export function addList(
  data: AppData,
  boardId: string,
  name: string
): OpResult {
  const cleaned = cleanName(name, "A list name");
  if (typeof cleaned !== "string") return failure(cleaned.error);
  const id = newId();
  return editBoard(
    data,
    boardId,
    (board) => {
      if (activeLists(board).length >= LIMITS.lists)
        return `Limit reached: ${LIMITS.lists} lists per board.`;
      return {
        ...board,
        lists: [
          ...board.lists,
          { id, name: cleaned, done: false, limit: null, archived: false }
        ]
      };
    },
    id
  );
}

export function renameList(
  data: AppData,
  boardId: string,
  listId: string,
  name: string
): OpResult {
  const cleaned = cleanName(name, "A list name");
  if (typeof cleaned !== "string") return failure(cleaned.error);
  return editBoard(data, boardId, (board) => {
    if (!board.lists.some((list) => list.id === listId))
      return "That list was not found.";
    return {
      ...board,
      lists: board.lists.map((list) =>
        list.id === listId ? { ...list, name: cleaned } : list
      )
    };
  });
}

export function reorderList(
  data: AppData,
  boardId: string,
  listId: string,
  newIndex: number
): OpResult {
  return editBoard(data, boardId, (board) => {
    if (!board.lists.some((list) => list.id === listId))
      return "That list was not found.";
    return {
      ...board,
      lists: reorderSubset(
        board.lists,
        (list) => !list.archived,
        listId,
        newIndex
      )
    };
  });
}

export function setListLimit(
  data: AppData,
  boardId: string,
  listId: string,
  limit: number | null
): OpResult {
  if (limit !== null && (!Number.isInteger(limit) || limit < 1))
    return failure("A list limit must be a whole number of 1 or more.");
  return editBoard(data, boardId, (board) => {
    if (!board.lists.some((list) => list.id === listId))
      return "That list was not found.";
    return {
      ...board,
      lists: board.lists.map((list) =>
        list.id === listId ? { ...list, limit } : list
      )
    };
  });
}

export function setListDone(
  data: AppData,
  boardId: string,
  listId: string,
  done: boolean
): OpResult {
  return editBoard(data, boardId, (board) => {
    if (!board.lists.some((list) => list.id === listId))
      return "That list was not found.";
    return {
      ...board,
      lists: board.lists.map((list) =>
        list.id === listId ? { ...list, done } : list
      )
    };
  });
}

export function archiveList(
  data: AppData,
  boardId: string,
  listId: string
): OpResult {
  return editBoard(data, boardId, (board) => {
    if (!board.lists.some((list) => list.id === listId))
      return "That list was not found.";
    return {
      ...board,
      lists: board.lists.map((list) =>
        list.id === listId ? { ...list, archived: true } : list
      )
    };
  });
}

export function restoreList(
  data: AppData,
  boardId: string,
  listId: string
): OpResult {
  return editBoard(data, boardId, (board) => {
    if (!board.lists.some((list) => list.id === listId))
      return "That list was not found.";
    if (activeLists(board).length >= LIMITS.lists)
      return `Limit reached: ${LIMITS.lists} lists per board.`;
    return {
      ...board,
      lists: board.lists.map((list) =>
        list.id === listId ? { ...list, archived: false } : list
      )
    };
  });
}

export function deleteArchivedList(
  data: AppData,
  boardId: string,
  listId: string
): OpResult {
  return editBoard(data, boardId, (board) => {
    const list = board.lists.find((item) => item.id === listId);
    if (!list) return "That list was not found.";
    if (!list.archived)
      return "Only an archived list can be deleted permanently.";
    return {
      ...board,
      lists: board.lists.filter((item) => item.id !== listId),
      cards: board.cards.filter((card) => card.listId !== listId)
    };
  });
}

export function addCard(
  data: AppData,
  boardId: string,
  listId: string,
  input: CardInput
): OpResult {
  const title = input.title.trim();
  if (!title) return failure("A card title cannot be blank.");
  const description = input.description ?? "";
  const textError = checkCardText(title, description);
  if (textError) return failure(textError);
  if (totalActiveCards(data) >= LIMITS.cards)
    return failure(`Limit reached: ${LIMITS.cards} cards in total.`);
  const card: Card = {
    id: newId(),
    listId,
    title,
    description,
    priority: input.priority ?? "medium",
    dueDate: input.dueDate ?? "",
    labelIds: input.labelIds ?? [],
    checklists: input.checklists ?? [],
    archived: false,
    createdAt: new Date().toISOString()
  };
  return editBoard(
    data,
    boardId,
    (board) => {
      const list = board.lists.find((item) => item.id === listId);
      if (!list || list.archived) return "That list was not found.";
      const first = board.cards.findIndex((item) => item.listId === listId);
      const at = first === -1 ? board.cards.length : first;
      return {
        ...board,
        cards: [...board.cards.slice(0, at), card, ...board.cards.slice(at)]
      };
    },
    card.id
  );
}

export function reinsertCard(
  data: AppData,
  boardId: string,
  card: Card,
  index: number
): OpResult {
  return editBoard(data, boardId, (board) => {
    if (!board.lists.some((list) => list.id === card.listId))
      return "That card's list no longer exists.";
    const at = Math.max(0, Math.min(index, board.cards.length));
    return {
      ...board,
      cards: [...board.cards.slice(0, at), card, ...board.cards.slice(at)]
    };
  });
}

export function updateCard(
  data: AppData,
  boardId: string,
  cardId: string,
  updates: CardUpdates
): OpResult {
  return editCard(data, boardId, cardId, (card) => {
    const title =
      updates.title !== undefined ? updates.title.trim() : card.title;
    if (!title) return "A card title cannot be blank.";
    const description = updates.description ?? card.description;
    const textError = checkCardText(title, description);
    if (textError) return textError;
    return { ...card, ...updates, title, description };
  });
}

export function reorderCard(
  data: AppData,
  boardId: string,
  cardId: string,
  newIndex: number
): OpResult {
  return editBoard(data, boardId, (board) => {
    const card = board.cards.find((item) => item.id === cardId);
    if (!card) return "That card was not found.";
    return {
      ...board,
      cards: reorderSubset(
        board.cards,
        (item) => item.listId === card.listId && !item.archived,
        cardId,
        newIndex
      )
    };
  });
}

export function moveCard(
  data: AppData,
  boardId: string,
  cardId: string,
  toListId: string,
  index?: number
): OpResult {
  return editBoard(data, boardId, (board) => {
    const card = board.cards.find((item) => item.id === cardId);
    if (!card) return "That card was not found.";
    const target = board.lists.find((item) => item.id === toListId);
    if (!target || target.archived) return "That list was not found.";
    if (card.listId === toListId) {
      if (index === undefined) return board;
      return {
        ...board,
        cards: reorderSubset(
          board.cards,
          (item) => item.listId === toListId && !item.archived,
          cardId,
          index
        )
      };
    }
    const without = board.cards.filter((item) => item.id !== cardId);
    return {
      ...board,
      cards: insertIntoGroup(without, { ...card, listId: toListId }, index)
    };
  });
}

export function archiveCard(
  data: AppData,
  boardId: string,
  cardId: string
): OpResult {
  return editCard(data, boardId, cardId, (card) => ({
    ...card,
    archived: true
  }));
}

export function restoreCard(
  data: AppData,
  boardId: string,
  cardId: string
): OpResult {
  return editCard(data, boardId, cardId, (card, board) => {
    const list = board.lists.find((item) => item.id === card.listId);
    if (!list || list.archived)
      return "Restore the list first, then restore this card.";
    return { ...card, archived: false };
  });
}

export function deleteCard(
  data: AppData,
  boardId: string,
  cardId: string
): OpResult {
  return editBoard(data, boardId, (board) => {
    if (!board.cards.some((card) => card.id === cardId))
      return "That card was not found.";
    return {
      ...board,
      cards: board.cards.filter((card) => card.id !== cardId)
    };
  });
}

export function duplicateCard(
  data: AppData,
  boardId: string,
  cardId: string
): OpResult {
  if (totalActiveCards(data) >= LIMITS.cards)
    return failure(`Limit reached: ${LIMITS.cards} cards in total.`);
  const copyId = newId();
  return editBoard(
    data,
    boardId,
    (board) => {
      const card = board.cards.find((item) => item.id === cardId);
      if (!card) return "That card was not found.";
      const copy: Card = {
        ...card,
        id: copyId,
        title: `${card.title}${COPY_SUFFIX}`,
        labelIds: [...card.labelIds],
        checklists: cloneChecklists(card.checklists, false),
        archived: false,
        createdAt: new Date().toISOString()
      };
      const at = board.cards.indexOf(card) + 1;
      return {
        ...board,
        cards: [...board.cards.slice(0, at), copy, ...board.cards.slice(at)]
      };
    },
    copyId
  );
}

export function addLabel(
  data: AppData,
  boardId: string,
  name: string,
  color: string
): OpResult {
  const cleaned = cleanName(name, "A label name");
  if (typeof cleaned !== "string") return failure(cleaned.error);
  const id = newId();
  return editBoard(
    data,
    boardId,
    (board) => ({
      ...board,
      labels: [...board.labels, { id, name: cleaned, color }]
    }),
    id
  );
}

export function renameLabel(
  data: AppData,
  boardId: string,
  labelId: string,
  name: string
): OpResult {
  const cleaned = cleanName(name, "A label name");
  if (typeof cleaned !== "string") return failure(cleaned.error);
  return editBoard(data, boardId, (board) => {
    if (!board.labels.some((label) => label.id === labelId))
      return "That label was not found.";
    return {
      ...board,
      labels: board.labels.map((label) =>
        label.id === labelId ? { ...label, name: cleaned } : label
      )
    };
  });
}

export function recolorLabel(
  data: AppData,
  boardId: string,
  labelId: string,
  color: string
): OpResult {
  return editBoard(data, boardId, (board) => {
    if (!board.labels.some((label) => label.id === labelId))
      return "That label was not found.";
    return {
      ...board,
      labels: board.labels.map((label) =>
        label.id === labelId ? { ...label, color } : label
      )
    };
  });
}

export function deleteLabel(
  data: AppData,
  boardId: string,
  labelId: string
): OpResult {
  return editBoard(data, boardId, (board) => {
    if (!board.labels.some((label) => label.id === labelId))
      return "That label was not found.";
    const strip = (ids: string[]) => ids.filter((id) => id !== labelId);
    return {
      ...board,
      labels: board.labels.filter((label) => label.id !== labelId),
      cards: board.cards.map((card) => ({
        ...card,
        labelIds: strip(card.labelIds)
      })),
      templates: board.templates.map((template) => ({
        ...template,
        labelIds: strip(template.labelIds)
      }))
    };
  });
}

function editChecklist(
  data: AppData,
  boardId: string,
  cardId: string,
  checklistId: string,
  change: (checklist: Checklist) => Checklist
): OpResult {
  return editCard(data, boardId, cardId, (card) => {
    if (!card.checklists.some((checklist) => checklist.id === checklistId))
      return "That checklist was not found.";
    return {
      ...card,
      checklists: card.checklists.map((checklist) =>
        checklist.id === checklistId ? change(checklist) : checklist
      )
    };
  });
}

export function addChecklist(
  data: AppData,
  boardId: string,
  cardId: string,
  title: string
): OpResult {
  const cleaned = cleanName(title, "A checklist title");
  if (typeof cleaned !== "string") return failure(cleaned.error);
  const id = newId();
  const result = editCard(data, boardId, cardId, (card) => ({
    ...card,
    checklists: [...card.checklists, { id, title: cleaned, items: [] }]
  }));
  return result.ok ? { ...result, id } : result;
}

export function renameChecklist(
  data: AppData,
  boardId: string,
  cardId: string,
  checklistId: string,
  title: string
): OpResult {
  const cleaned = cleanName(title, "A checklist title");
  if (typeof cleaned !== "string") return failure(cleaned.error);
  return editChecklist(data, boardId, cardId, checklistId, (checklist) => ({
    ...checklist,
    title: cleaned
  }));
}

export function deleteChecklist(
  data: AppData,
  boardId: string,
  cardId: string,
  checklistId: string
): OpResult {
  return editCard(data, boardId, cardId, (card) => {
    if (!card.checklists.some((checklist) => checklist.id === checklistId))
      return "That checklist was not found.";
    return {
      ...card,
      checklists: card.checklists.filter(
        (checklist) => checklist.id !== checklistId
      )
    };
  });
}

export function addChecklistItem(
  data: AppData,
  boardId: string,
  cardId: string,
  checklistId: string,
  text: string
): OpResult {
  const cleaned = cleanName(text, "An item");
  if (typeof cleaned !== "string") return failure(cleaned.error);
  const id = newId();
  const result = editChecklist(
    data,
    boardId,
    cardId,
    checklistId,
    (checklist) => ({
      ...checklist,
      items: [...checklist.items, { id, text: cleaned, checked: false }]
    })
  );
  return result.ok ? { ...result, id } : result;
}

export function updateChecklistItem(
  data: AppData,
  boardId: string,
  cardId: string,
  checklistId: string,
  itemId: string,
  updates: { text?: string; checked?: boolean }
): OpResult {
  let text: string | undefined;
  if (updates.text !== undefined) {
    const cleaned = cleanName(updates.text, "An item");
    if (typeof cleaned !== "string") return failure(cleaned.error);
    text = cleaned;
  }
  return editChecklist(data, boardId, cardId, checklistId, (checklist) => ({
    ...checklist,
    items: checklist.items.map((item) =>
      item.id === itemId
        ? {
            ...item,
            text: text ?? item.text,
            checked: updates.checked ?? item.checked
          }
        : item
    )
  }));
}

export function reorderChecklistItem(
  data: AppData,
  boardId: string,
  cardId: string,
  checklistId: string,
  itemId: string,
  newIndex: number
): OpResult {
  return editChecklist(data, boardId, cardId, checklistId, (checklist) => ({
    ...checklist,
    items: reorderSubset(checklist.items, () => true, itemId, newIndex)
  }));
}

export function deleteChecklistItem(
  data: AppData,
  boardId: string,
  cardId: string,
  checklistId: string,
  itemId: string
): OpResult {
  return editChecklist(data, boardId, cardId, checklistId, (checklist) => ({
    ...checklist,
    items: checklist.items.filter((item) => item.id !== itemId)
  }));
}

export function saveAsTemplate(
  data: AppData,
  boardId: string,
  cardId: string
): OpResult {
  const id = newId();
  return editBoard(
    data,
    boardId,
    (board) => {
      const card = board.cards.find((item) => item.id === cardId);
      if (!card) return "That card was not found.";
      const template: CardTemplate = {
        id,
        title: card.title,
        description: card.description,
        priority: card.priority,
        labelIds: [...card.labelIds],
        checklists: cloneChecklists(card.checklists, false)
      };
      return { ...board, templates: [...board.templates, template] };
    },
    id
  );
}

export function createCardFromTemplate(
  data: AppData,
  boardId: string,
  templateId: string,
  listId: string
): OpResult {
  const board = data.boards.find((item) => item.id === boardId);
  const template = board?.templates.find((item) => item.id === templateId);
  if (!template) return failure("That template was not found.");
  return addCard(data, boardId, listId, {
    title: template.title,
    description: template.description,
    priority: template.priority,
    dueDate: "",
    labelIds: [...template.labelIds],
    checklists: cloneChecklists(template.checklists, false)
  });
}

export function deleteTemplate(
  data: AppData,
  boardId: string,
  templateId: string
): OpResult {
  return editBoard(data, boardId, (board) => {
    if (!board.templates.some((template) => template.id === templateId))
      return "That template was not found.";
    return {
      ...board,
      templates: board.templates.filter(
        (template) => template.id !== templateId
      )
    };
  });
}

export function createBoard(data: AppData, name: string): OpResult {
  const cleaned = cleanName(name, "A board name");
  if (typeof cleaned !== "string") return failure(cleaned.error);
  if (data.boards.filter((board) => !board.archived).length >= LIMITS.boards) {
    return failure(`Limit reached: ${LIMITS.boards} boards.`);
  }
  const board = defaultBoard(cleaned);
  return success({ ...data, boards: [...data.boards, board] }, board.id);
}

export function renameBoard(
  data: AppData,
  boardId: string,
  name: string
): OpResult {
  const cleaned = cleanName(name, "A board name");
  if (typeof cleaned !== "string") return failure(cleaned.error);
  return editBoard(data, boardId, (board) => ({ ...board, name: cleaned }));
}

export function switchBoard(data: AppData, boardId: string): OpResult {
  const board = data.boards.find((item) => item.id === boardId);
  if (!board || board.archived) return failure("That board was not found.");
  return success({ ...data, activeBoardId: boardId });
}

export function archiveBoard(data: AppData, boardId: string): OpResult {
  const board = data.boards.find((item) => item.id === boardId);
  if (!board) return failure("That board was not found.");
  const others = data.boards.filter(
    (item) => item.id !== boardId && !item.archived
  );
  if (others.length === 0)
    return failure("Keep at least one board open. Create another board first.");
  return success({
    ...data,
    activeBoardId:
      data.activeBoardId === boardId ? others[0].id : data.activeBoardId,
    boards: data.boards.map((item) =>
      item.id === boardId ? { ...item, archived: true } : item
    )
  });
}

export function restoreBoard(data: AppData, boardId: string): OpResult {
  if (!data.boards.some((board) => board.id === boardId))
    return failure("That board was not found.");
  if (data.boards.filter((board) => !board.archived).length >= LIMITS.boards) {
    return failure(`Limit reached: ${LIMITS.boards} boards.`);
  }
  return success({
    ...data,
    boards: data.boards.map((board) =>
      board.id === boardId ? { ...board, archived: false } : board
    )
  });
}

export function deleteArchivedBoard(data: AppData, boardId: string): OpResult {
  const board = data.boards.find((item) => item.id === boardId);
  if (!board) return failure("That board was not found.");
  if (!board.archived)
    return failure("Only an archived board can be deleted permanently.");
  return success({
    ...data,
    boards: data.boards.filter((item) => item.id !== boardId)
  });
}

export function setBoardBackground(
  data: AppData,
  boardId: string,
  backgroundId: string
): OpResult {
  if (!BACKGROUND_PRESETS.some((preset) => preset.id === backgroundId))
    return failure("That background is not available.");
  return editBoard(data, boardId, (board) => ({ ...board, backgroundId }));
}

export function updateSettings(
  data: AppData,
  updates: Partial<Settings>
): OpResult {
  return success({ ...data, settings: { ...data.settings, ...updates } });
}

export function addRule(
  data: AppData,
  boardId: string,
  input: { name: string; trigger: RuleTrigger; action: RuleAction }
): OpResult {
  const cleaned = cleanName(input.name, "A rule name");
  if (typeof cleaned !== "string") return failure(cleaned.error);
  const rule: Rule = {
    id: newId(),
    name: cleaned,
    enabled: true,
    trigger: input.trigger,
    action: input.action
  };
  return editBoard(
    data,
    boardId,
    (board) => ({ ...board, rules: [...board.rules, rule] }),
    rule.id
  );
}

export function renameRule(
  data: AppData,
  boardId: string,
  ruleId: string,
  name: string
): OpResult {
  const cleaned = cleanName(name, "A rule name");
  if (typeof cleaned !== "string") return failure(cleaned.error);
  return editBoard(data, boardId, (board) => {
    if (!board.rules.some((rule) => rule.id === ruleId))
      return "That rule was not found.";
    return {
      ...board,
      rules: board.rules.map((rule) =>
        rule.id === ruleId ? { ...rule, name: cleaned } : rule
      )
    };
  });
}

export function setRuleEnabled(
  data: AppData,
  boardId: string,
  ruleId: string,
  enabled: boolean
): OpResult {
  return editBoard(data, boardId, (board) => {
    if (!board.rules.some((rule) => rule.id === ruleId))
      return "That rule was not found.";
    return {
      ...board,
      rules: board.rules.map((rule) =>
        rule.id === ruleId ? { ...rule, enabled } : rule
      )
    };
  });
}

export function deleteRule(
  data: AppData,
  boardId: string,
  ruleId: string
): OpResult {
  return editBoard(data, boardId, (board) => {
    if (!board.rules.some((rule) => rule.id === ruleId))
      return "That rule was not found.";
    return {
      ...board,
      rules: board.rules.filter((rule) => rule.id !== ruleId)
    };
  });
}
