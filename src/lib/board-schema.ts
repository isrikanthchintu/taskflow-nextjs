import {
  CORNER_OPTIONS,
  DEFAULT_BACKGROUND_ID,
  DEFAULT_SETTINGS,
  DENSITIES,
  THEME_MODES
} from "@/lib/theme-presets";
import type {
  AppData,
  Board,
  Card,
  CardTemplate,
  Checklist,
  ChecklistItem,
  Label,
  List,
  Priority,
  Rule,
  Settings
} from "@/types/board";

export const DATA_VERSION = 2;
export const PRIORITIES: Priority[] = ["low", "medium", "high"];

export type ValidationResult<T> =
  { ok: true; data: T } | { ok: false; reason: string };

type RandomSource = Partial<Pick<Crypto, "randomUUID" | "getRandomValues">>;

function randomBytes(length: number, source: RandomSource | undefined) {
  const bytes = new Uint8Array(length);
  if (source && typeof source.getRandomValues === "function") {
    source.getRandomValues(bytes);
    return bytes;
  }
  for (let index = 0; index < length; index += 1) {
    bytes[index] = Math.floor(Math.random() * 256);
  }
  return bytes;
}

export function buildId(source: RandomSource | undefined): string {
  if (source && typeof source.randomUUID === "function") {
    return source.randomUUID();
  }
  const bytes = randomBytes(16, source);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
  return [
    hex.slice(0, 4).join(""),
    hex.slice(4, 6).join(""),
    hex.slice(6, 8).join(""),
    hex.slice(8, 10).join(""),
    hex.slice(10).join("")
  ].join("-");
}

export function newId(): string {
  return buildId(typeof crypto === "undefined" ? undefined : crypto);
}

export function newList(
  name: string,
  options: { done?: boolean; limit?: number | null } = {}
): List {
  return {
    id: newId(),
    name,
    done: options.done ?? false,
    limit: options.limit ?? null,
    archived: false
  };
}

export function newCard(
  listId: string,
  input: Partial<Omit<Card, "id" | "listId">> & { title: string }
): Card {
  return {
    id: newId(),
    listId,
    title: input.title,
    description: input.description ?? "",
    priority: input.priority ?? "medium",
    dueDate: input.dueDate ?? "",
    labelIds: input.labelIds ?? [],
    checklists: input.checklists ?? [],
    archived: input.archived ?? false,
    createdAt: input.createdAt ?? new Date().toISOString()
  };
}

export function newLabel(name: string, color: string): Label {
  return { id: newId(), name, color };
}

export function newChecklist(title: string, items: string[] = []): Checklist {
  return {
    id: newId(),
    title,
    items: items.map((text) => ({ id: newId(), text, checked: false }))
  };
}

export function emptyBoard(name: string): Board {
  return {
    id: newId(),
    name,
    backgroundId: DEFAULT_BACKGROUND_ID,
    lists: [],
    cards: [],
    labels: [],
    templates: [],
    rules: [],
    archived: false,
    createdAt: new Date().toISOString()
  };
}

export function defaultBoard(name = "My board"): Board {
  const board = emptyBoard(name);
  board.lists = [
    newList("To do"),
    newList("In progress"),
    newList("Completed", { done: true })
  ];
  return board;
}

export function createDefaultData(): AppData {
  const board = defaultBoard();
  return {
    version: DATA_VERSION,
    activeBoardId: board.id,
    boards: [board],
    settings: { ...DEFAULT_SETTINGS }
  };
}

export function createPlaceholderData(): AppData {
  const createdAt = "1970-01-01T00:00:00.000Z";
  const list = (id: string, name: string, done = false): List => ({
    id,
    name,
    done,
    limit: null,
    archived: false
  });
  const board: Board = {
    id: "placeholder-board",
    name: "My board",
    backgroundId: DEFAULT_BACKGROUND_ID,
    lists: [
      list("placeholder-list-todo", "To do"),
      list("placeholder-list-progress", "In progress"),
      list("placeholder-list-done", "Completed", true)
    ],
    cards: [],
    labels: [],
    templates: [],
    rules: [],
    archived: false,
    createdAt
  };
  return {
    version: DATA_VERSION,
    activeBoardId: board.id,
    boards: [board],
    settings: { ...DEFAULT_SETTINGS }
  };
}

export function createStarterData(): AppData {
  const data = createDefaultData();
  const board = data.boards[0];
  const [todo, progress] = board.lists;
  board.cards = [
    newCard(progress.id, {
      title: "Review the product roadmap",
      description: "Align the next sprint with the product milestones.",
      priority: "high",
      dueDate: "2026-11-20",
      createdAt: "2026-11-10T09:00:00.000Z"
    }),
    newCard(todo.id, {
      title: "Update component documentation",
      description: "Document reusable UI patterns and usage examples.",
      priority: "medium",
      dueDate: "2026-11-22",
      createdAt: "2026-11-11T09:00:00.000Z"
    }),
    newCard(board.lists[2].id, {
      title: "Fix mobile navigation spacing",
      description: "Check the sidebar and header at small breakpoints.",
      priority: "low",
      dueDate: "2026-11-14",
      createdAt: "2026-11-08T09:00:00.000Z"
    }),
    newCard(todo.id, {
      title: "Prepare sprint planning notes",
      description: "Collect open questions before the team planning session.",
      priority: "high",
      dueDate: "2026-11-24",
      createdAt: "2026-11-12T09:00:00.000Z"
    })
  ];
  return data;
}

type Fail = { ok: false; reason: string };

function fail(reason: string): Fail {
  return { ok: false, reason };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

function isPriority(value: unknown): value is Priority {
  return PRIORITIES.includes(value as Priority);
}

function isItem(value: unknown): value is ChecklistItem {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.text) &&
    typeof value.checked === "boolean"
  );
}

function isChecklist(value: unknown): value is Checklist {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.title) &&
    Array.isArray(value.items) &&
    value.items.every(isItem)
  );
}

function isLabel(value: unknown): value is Label {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.name) &&
    isString(value.color)
  );
}

function isList(value: unknown): value is List {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.name) &&
    typeof value.done === "boolean" &&
    typeof value.archived === "boolean" &&
    (value.limit === null ||
      (typeof value.limit === "number" &&
        Number.isInteger(value.limit) &&
        value.limit > 0))
  );
}

function isCard(value: unknown): value is Card {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.listId) &&
    isString(value.title) &&
    isString(value.description) &&
    isPriority(value.priority) &&
    isString(value.dueDate) &&
    isStringArray(value.labelIds) &&
    Array.isArray(value.checklists) &&
    value.checklists.every(isChecklist) &&
    typeof value.archived === "boolean" &&
    isString(value.createdAt)
  );
}

function isTemplate(value: unknown): value is CardTemplate {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.title) &&
    isString(value.description) &&
    isPriority(value.priority) &&
    isStringArray(value.labelIds) &&
    Array.isArray(value.checklists) &&
    value.checklists.every(isChecklist)
  );
}

function isRule(value: unknown): value is Rule {
  if (
    !isRecord(value) ||
    !isString(value.id) ||
    !isString(value.name) ||
    typeof value.enabled !== "boolean"
  ) {
    return false;
  }
  const { trigger, action } = value;
  if (!isRecord(trigger) || !isRecord(action)) return false;
  const triggerOk =
    trigger.kind === "checklist-complete" ||
    (trigger.kind === "card-enters-list" && isString(trigger.listId));
  const actionOk =
    (action.kind === "move-to-list" && isString(action.listId)) ||
    (action.kind === "add-label" && isString(action.labelId)) ||
    (action.kind === "set-priority" && isPriority(action.priority));
  return triggerOk && actionOk;
}

function allArray<T>(
  value: unknown,
  guard: (item: unknown) => item is T
): value is T[] {
  return Array.isArray(value) && value.every(guard);
}

export function validateBoard(value: unknown): ValidationResult<Board> {
  if (!isRecord(value)) return fail("A board must be an object.");
  if (!isString(value.id) || !value.id) return fail("A board needs an id.");
  if (!isString(value.name) || !value.name.trim())
    return fail("A board needs a name.");
  if (!isString(value.backgroundId)) return fail("A board needs a background.");
  if (!allArray(value.lists, isList))
    return fail("The board's lists are not valid.");
  if (!allArray(value.cards, isCard))
    return fail("The board's cards are not valid.");
  if (!allArray(value.labels, isLabel))
    return fail("The board's labels are not valid.");
  if (!allArray(value.templates, isTemplate))
    return fail("The board's templates are not valid.");
  if (!allArray(value.rules, isRule))
    return fail("The board's rules are not valid.");
  if (typeof value.archived !== "boolean")
    return fail("A board needs an archived flag.");
  if (!isString(value.createdAt)) return fail("A board needs a creation time.");
  const listIds = new Set(value.lists.map((list) => list.id));
  if (listIds.size !== value.lists.length)
    return fail("The board has duplicate list ids.");
  if (value.cards.some((card) => !listIds.has(card.listId)))
    return fail("A card points to a list that is missing.");
  return { ok: true, data: value as unknown as Board };
}

function validateSettings(value: unknown): ValidationResult<Settings> {
  if (!isRecord(value)) return fail("Settings are missing.");
  if (!THEME_MODES.includes(value.mode as Settings["mode"]))
    return fail("The theme mode is not valid.");
  if (!isString(value.accentId)) return fail("The accent is not valid.");
  if (!DENSITIES.includes(value.density as Settings["density"]))
    return fail("The density is not valid.");
  if (!CORNER_OPTIONS.includes(value.corners as Settings["corners"]))
    return fail("The corner style is not valid.");
  return { ok: true, data: value as unknown as Settings };
}

export function validateAppData(value: unknown): ValidationResult<AppData> {
  if (!isRecord(value)) return fail("The saved data is not an object.");
  if (typeof value.version !== "number")
    return fail("The saved data has no version.");
  if (value.version > DATA_VERSION)
    return fail("The saved data was written by a newer version of the app.");
  if (!isString(value.activeBoardId))
    return fail("The saved data has no open board.");
  if (!Array.isArray(value.boards) || value.boards.length === 0)
    return fail("The saved data has no boards.");
  const boards: Board[] = [];
  for (const candidate of value.boards) {
    const result = validateBoard(candidate);
    if (!result.ok) return result;
    boards.push(result.data);
  }
  if (
    !boards.some((board) => board.id === value.activeBoardId && !board.archived)
  ) {
    return fail("The open board is missing or archived.");
  }
  const settings = validateSettings(value.settings);
  if (!settings.ok) return settings;
  return {
    ok: true,
    data: {
      version: value.version,
      activeBoardId: value.activeBoardId,
      boards,
      settings: settings.data
    }
  };
}
