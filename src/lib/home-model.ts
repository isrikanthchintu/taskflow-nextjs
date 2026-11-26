import type { MetaMap } from "@/lib/board-meta-store";
import type { Workspace } from "@/lib/workspace-store";
import type { Board } from "@/types/board";

export const RECENT_LIMIT = 4;
export const BOARD_PAGE_SIZE = 24;
export const BOARD_TITLE_MAX = 100;
export const TITLE_REQUIRED = "Board title is required";

export function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "board";
}

export function boardPath(board: Pick<Board, "id" | "name">): string {
  return `/b/${board.id}/${slugify(board.name)}`;
}

export function validateBoardTitle(raw: string): string | null {
  const title = raw.trim();
  if (title.length === 0) return TITLE_REQUIRED;
  if (title.length > BOARD_TITLE_MAX) {
    return `Use ${BOARD_TITLE_MAX} characters or fewer.`;
  }
  return null;
}

export function workspaceOf(
  board: Board,
  meta: MetaMap,
  workspaces: Workspace[]
): Workspace | undefined {
  const assigned = meta[board.id]?.workspaceId;
  const found = assigned
    ? workspaces.find((workspace) => workspace.id === assigned)
    : undefined;
  return found ?? workspaces[0];
}

export function openBoards(boards: Board[]): Board[] {
  return boards.filter((board) => !board.archived);
}

export function closedBoards(boards: Board[]): Board[] {
  return boards.filter((board) => board.archived);
}

export function boardsInWorkspace(
  boards: Board[],
  meta: MetaMap,
  workspaces: Workspace[],
  workspaceId: string
): Board[] {
  return openBoards(boards).filter(
    (board) => workspaceOf(board, meta, workspaces)?.id === workspaceId
  );
}

export function recentBoards(
  boards: Board[],
  meta: MetaMap,
  limit = RECENT_LIMIT
): Board[] {
  const seen = new Set<string>();
  return openBoards(boards)
    .filter((board) => (meta[board.id]?.lastViewedAt ?? 0) > 0)
    .sort(
      (a, b) =>
        (meta[b.id]?.lastViewedAt ?? 0) - (meta[a.id]?.lastViewedAt ?? 0)
    )
    .filter((board) => {
      if (seen.has(board.id)) return false;
      seen.add(board.id);
      return true;
    })
    .slice(0, limit);
}

export function workspaceInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "W";
}
