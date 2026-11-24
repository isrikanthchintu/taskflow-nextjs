import type { Board, Card, Label, List, Priority } from "@/types/board";

export type DueState = "overdue" | "due-soon" | "none";
export type SortKey = "due" | "priority" | "created";
export type SortDirection = "asc" | "desc";
export type GroupKey = "priority" | "label" | "due";
export type SwimlaneKey = "priority" | "label";

export interface CardFilter {
  text: string;
  labelIds: string[];
  priorities: Priority[];
  dueStates: DueState[];
}

export interface SortSpec {
  key: SortKey;
  direction: SortDirection;
}

export interface CardGroup {
  key: string;
  title: string;
  cards: Card[];
}

export interface Swimlane {
  key: string;
  title: string;
  lists: { listId: string; cards: Card[] }[];
}

export interface ListCounts {
  total: number;
  perList: { listId: string; name: string; count: number }[];
}

export const EMPTY_FILTER: CardFilter = {
  text: "",
  labelIds: [],
  priorities: [],
  dueStates: []
};
export const NO_LABEL_KEY = "no-label";
export const NO_LABEL_TITLE = "No label";

const PRIORITY_RANK: Record<Priority, number> = { low: 1, medium: 2, high: 3 };
const PRIORITY_ORDER: Priority[] = ["high", "medium", "low"];
const PRIORITY_TITLES: Record<Priority, string> = {
  high: "High",
  medium: "Medium",
  low: "Low"
};
const DUE_ORDER: DueState[] = ["overdue", "due-soon", "none"];
const DUE_TITLES: Record<DueState, string> = {
  overdue: "Overdue",
  "due-soon": "Due soon",
  none: "No due date"
};

export function activeLists(board: Board): List[] {
  return board.lists.filter((list) => !list.archived);
}

export function activeCards(board: Board): Card[] {
  const activeListIds = new Set(activeLists(board).map((list) => list.id));
  return board.cards.filter(
    (card) => !card.archived && activeListIds.has(card.listId)
  );
}

export function cardsInList(board: Board, listId: string): Card[] {
  return activeCards(board).filter((card) => card.listId === listId);
}

export function archivedCards(board: Board): Card[] {
  return board.cards.filter((card) => card.archived);
}

export function formatDay(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function dueState(
  card: Card,
  list: List | null | undefined,
  now: Date = new Date()
): DueState {
  if (!card.dueDate || !/^\d{4}-\d{2}-\d{2}$/.test(card.dueDate)) return "none";
  if (list?.done) return "none";
  const today = formatDay(now);
  const tomorrowDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1
  );
  const tomorrow = formatDay(tomorrowDate);
  if (card.dueDate < today) return "overdue";
  if (card.dueDate === today || card.dueDate === tomorrow) return "due-soon";
  return "none";
}

export function isFilterActive(filter: CardFilter): boolean {
  return (
    filter.text.trim() !== "" ||
    filter.labelIds.length > 0 ||
    filter.priorities.length > 0 ||
    filter.dueStates.length > 0
  );
}

export function activeFilterCount(filter: CardFilter): number {
  return (
    (filter.text.trim() !== "" ? 1 : 0) +
    (filter.labelIds.length > 0 ? 1 : 0) +
    (filter.priorities.length > 0 ? 1 : 0) +
    (filter.dueStates.length > 0 ? 1 : 0)
  );
}

export function filterCards(
  cards: Card[],
  filter: CardFilter,
  lists: List[],
  now: Date = new Date()
): Card[] {
  const text = filter.text.trim().toLowerCase();
  const listById = new Map(lists.map((list) => [list.id, list]));
  return cards.filter((card) => {
    if (
      text &&
      !`${card.title} ${card.description}`.toLowerCase().includes(text)
    )
      return false;
    if (
      filter.labelIds.length > 0 &&
      !card.labelIds.some((id) => filter.labelIds.includes(id))
    )
      return false;
    if (
      filter.priorities.length > 0 &&
      !filter.priorities.includes(card.priority)
    )
      return false;
    if (
      filter.dueStates.length > 0 &&
      !filter.dueStates.includes(dueState(card, listById.get(card.listId), now))
    ) {
      return false;
    }
    return true;
  });
}

function compareText(first: string, second: string): number {
  if (first < second) return -1;
  if (first > second) return 1;
  return 0;
}

function tieBreak(first: Card, second: Card): number {
  return (
    compareText(first.createdAt, second.createdAt) ||
    compareText(first.id, second.id)
  );
}

export function sortCards(cards: Card[], sort: SortSpec | null): Card[] {
  if (!sort) return cards;
  const sign = sort.direction === "asc" ? 1 : -1;
  return [...cards].sort((first, second) => {
    if (sort.key === "due") {
      if (!first.dueDate && !second.dueDate) return tieBreak(first, second);
      if (!first.dueDate) return 1;
      if (!second.dueDate) return -1;
      return (
        sign * compareText(first.dueDate, second.dueDate) ||
        tieBreak(first, second)
      );
    }
    if (sort.key === "priority") {
      return (
        sign *
          (PRIORITY_RANK[first.priority] - PRIORITY_RANK[second.priority]) ||
        tieBreak(first, second)
      );
    }
    return (
      sign * compareText(first.createdAt, second.createdAt) ||
      compareText(first.id, second.id)
    );
  });
}

function bucketCards(
  cards: Card[],
  keys: { key: string; title: string }[],
  keysFor: (card: Card) => string[]
): CardGroup[] {
  return keys
    .map((entry) => ({
      key: entry.key,
      title: entry.title,
      cards: cards.filter((card) => keysFor(card).includes(entry.key))
    }))
    .filter((group) => group.cards.length > 0);
}

function labelKeys(labels: Label[]): { key: string; title: string }[] {
  return [
    ...labels.map((label) => ({ key: label.id, title: label.name })),
    { key: NO_LABEL_KEY, title: NO_LABEL_TITLE }
  ];
}

function labelKeysFor(card: Card, labels: Label[]): string[] {
  const known = new Set(labels.map((label) => label.id));
  const present = card.labelIds.filter((id) => known.has(id));
  return present.length > 0 ? present : [NO_LABEL_KEY];
}

export function groupCards(
  cards: Card[],
  by: GroupKey,
  labels: Label[],
  lists: List[],
  now: Date = new Date()
): CardGroup[] {
  if (by === "priority") {
    return bucketCards(
      cards,
      PRIORITY_ORDER.map((priority) => ({
        key: priority,
        title: PRIORITY_TITLES[priority]
      })),
      (card) => [card.priority]
    );
  }
  if (by === "label") {
    return bucketCards(cards, labelKeys(labels), (card) =>
      labelKeysFor(card, labels)
    );
  }
  const listById = new Map(lists.map((list) => [list.id, list]));
  return bucketCards(
    cards,
    DUE_ORDER.map((state) => ({ key: state, title: DUE_TITLES[state] })),
    (card) => [dueState(card, listById.get(card.listId), now)]
  );
}

export function swimlanes(
  board: Board,
  by: SwimlaneKey,
  cards: Card[] = activeCards(board)
): Swimlane[] {
  const lists = activeLists(board);
  const groups = groupCards(cards, by, board.labels, lists);
  return groups.map((group) => ({
    key: group.key,
    title: group.title,
    lists: lists.map((list) => ({
      listId: list.id,
      cards: group.cards.filter((card) => card.listId === list.id)
    }))
  }));
}

export function listCounts(
  board: Board,
  cards: Card[] = activeCards(board)
): ListCounts {
  const lists = activeLists(board);
  const perList = lists.map((list) => ({
    listId: list.id,
    name: list.name,
    count: cards.filter((card) => card.listId === list.id).length
  }));
  return {
    total: perList.reduce((sum, entry) => sum + entry.count, 0),
    perList
  };
}

export function overLimit(
  board: Board,
  list: List
): { over: boolean; count: number; limit: number | null } {
  const count = cardsInList(board, list.id).length;
  return {
    over: list.limit !== null && count > list.limit,
    count,
    limit: list.limit
  };
}
