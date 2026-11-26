import { LIMITS, totalActiveCards } from "@/lib/board-ops";
import { activeCards, activeLists } from "@/lib/board-query";
import { newId, validateBoard } from "@/lib/board-schema";
import type { AppData, Board } from "@/types/board";

export const EXPORT_FORMAT = "taskflow-board";
export const EXPORT_VERSION = 1;
export const IMPORT_SUFFIX = " (imported)";

export type ImportResult =
  { ok: true; data: AppData; id: string } | { ok: false; error: string };

const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

function sanitize(value: unknown): unknown {
  if (typeof value === "string") return value.replace(CONTROL_CHARACTERS, "");
  if (Array.isArray(value)) return value.map(sanitize);
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, sanitize(entry)])
    );
  }
  return value;
}

export function exportBoard(data: AppData, boardId: string): string {
  const board = data.boards.find((item) => item.id === boardId);
  if (!board) throw new Error("That board was not found.");
  return JSON.stringify(
    {
      format: EXPORT_FORMAT,
      version: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      board
    },
    null,
    2
  );
}

export function exportFileName(board: Board): string {
  const slug = board.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${slug || "board"}.taskflow.json`;
}

function failure(error: string): ImportResult {
  return { ok: false, error };
}

export function importBoard(data: AppData, text: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return failure(
      "This file is not a board export. It could not be read as JSON."
    );
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return failure("This file is not a board export.");
  }
  const file = parsed as Record<string, unknown>;
  if (file.format !== EXPORT_FORMAT)
    return failure("This file is not a board export from this app.");
  if (typeof file.version !== "number")
    return failure("This file has no format version.");
  if (file.version > EXPORT_VERSION) {
    return failure(
      "This file was made by a newer version of the app. Update the app to import it."
    );
  }
  const validated = validateBoard(sanitize(file.board));
  if (!validated.ok)
    return failure(
      `This file is not a valid board export. ${validated.reason}`
    );

  if (data.boards.filter((board) => !board.archived).length >= LIMITS.boards) {
    return failure(`Limit reached: ${LIMITS.boards} boards.`);
  }
  const incoming = validated.data;
  if (activeLists(incoming).length > LIMITS.lists) {
    return failure(
      `This board has more than the limit of ${LIMITS.lists} lists per board.`
    );
  }
  if (totalActiveCards(data) + activeCards(incoming).length > LIMITS.cards) {
    return failure(
      `Importing would go past the limit of ${LIMITS.cards} cards in total.`
    );
  }

  const names = new Set(data.boards.map((board) => board.name));
  let name = incoming.name.trim();
  if (names.has(name)) name = `${name}${IMPORT_SUFFIX}`;
  while (names.has(name)) name = `${name}${IMPORT_SUFFIX}`;

  const board: Board = { ...incoming, id: newId(), name, archived: false };
  return {
    ok: true,
    data: { ...data, boards: [...data.boards, board] },
    id: board.id
  };
}
