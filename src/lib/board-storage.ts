import {
  DATA_VERSION,
  defaultBoard,
  newId,
  validateAppData
} from "@/lib/board-schema";
import { DEFAULT_SETTINGS } from "@/lib/theme-presets";
import type { AppData, Card, Priority } from "@/types/board";
import type { Task, TaskStatus } from "@/types/task";

export const DATA_KEY = "taskflow.data.v2";
export const LEGACY_KEY = "taskflow.tasks.v1";

export type ReadResult =
  | { status: "ok"; data: AppData; migrated: boolean }
  | { status: "missing" }
  | { status: "unreadable"; reason: string };

export type WriteResult = "ok" | "full" | "unavailable" | "blocked";

const STATUS_LIST_INDEX: Record<TaskStatus, number> = {
  todo: 0,
  "in-progress": 1,
  done: 2
};

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function asPriority(value: unknown): Priority {
  return value === "low" || value === "medium" || value === "high"
    ? value
    : "medium";
}

function asStatus(value: unknown): TaskStatus {
  return value === "in-progress" || value === "done" ? value : "todo";
}

export function convertV1(tasks: Task[]): AppData {
  const board = defaultBoard();
  const cards: Card[] = [];
  for (const raw of tasks as unknown[]) {
    if (typeof raw !== "object" || raw === null) continue;
    const task = raw as Record<string, unknown>;
    const status = asStatus(task.status);
    cards.push({
      id: asString(task.id, newId()),
      listId: board.lists[STATUS_LIST_INDEX[status]].id,
      title: asString(task.title, ""),
      description: asString(task.description, ""),
      priority: asPriority(task.priority),
      dueDate: asString(task.dueDate, ""),
      labelIds: [],
      checklists: [],
      archived: false,
      createdAt: asString(task.createdAt, new Date().toISOString())
    });
  }
  board.cards = cards;
  return {
    version: DATA_VERSION,
    activeBoardId: board.id,
    boards: [board],
    settings: { ...DEFAULT_SETTINGS }
  };
}

function parseJson(raw: string): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch {
    return { ok: false };
  }
}

function classifyWriteError(error: unknown): WriteResult {
  if (error instanceof DOMException) {
    if (
      error.name === "QuotaExceededError" ||
      error.name === "NS_ERROR_DOM_QUOTA_REACHED"
    )
      return "full";
    if (error.code === 22 || error.code === 1014) return "full";
  }
  if (typeof error === "object" && error !== null) {
    const named = error as { name?: string; code?: number };
    if (named.name === "QuotaExceededError" || named.code === 22) return "full";
  }
  return "unavailable";
}

export function writeAppData(data: AppData): WriteResult {
  if (typeof window === "undefined") return "unavailable";

  try {
    const existing = window.localStorage.getItem(DATA_KEY);
    if (existing !== null) {
      const parsed = parseJson(existing);
      if (!parsed.ok || !validateAppData(parsed.value).ok) return "blocked";
    }
    window.localStorage.setItem(DATA_KEY, JSON.stringify(data));
    return "ok";
  } catch (error) {
    return classifyWriteError(error);
  }
}

export function readAppData(): ReadResult {
  if (typeof window === "undefined") return { status: "missing" };

  let current: string | null;
  let legacy: string | null;
  try {
    current = window.localStorage.getItem(DATA_KEY);
    legacy = current === null ? window.localStorage.getItem(LEGACY_KEY) : null;
  } catch {
    return {
      status: "unreadable",
      reason: "Browser storage could not be opened."
    };
  }

  if (current !== null) {
    const parsed = parseJson(current);
    if (!parsed.ok)
      return {
        status: "unreadable",
        reason: "The saved data is not valid JSON."
      };
    const result = validateAppData(parsed.value);
    if (!result.ok) return { status: "unreadable", reason: result.reason };
    return { status: "ok", data: result.data, migrated: false };
  }

  if (legacy === null) return { status: "missing" };

  const parsedLegacy = parseJson(legacy);
  if (!parsedLegacy.ok || !Array.isArray(parsedLegacy.value)) {
    return {
      status: "unreadable",
      reason: "The earlier saved tasks could not be read."
    };
  }
  const converted = convertV1(parsedLegacy.value as Task[]);
  writeAppData(converted);
  return { status: "ok", data: converted, migrated: true };
}
