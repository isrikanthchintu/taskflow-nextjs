import { useCallback, useMemo } from "react";
import { useBoard } from "@/hooks/use-board";
import {
  removeBoardMeta,
  toggleFavorite,
  updateBoardMeta,
  useBoardMeta,
  type Visibility
} from "@/lib/board-meta-store";
import {
  boardPath,
  closedBoards,
  recentBoards,
  boardsInWorkspace,
  workspaceOf
} from "@/lib/home-model";
import { useWorkspaces } from "@/lib/workspace-store";
import type { Board } from "@/types/board";

export interface NewBoardInput {
  title: string;
  backgroundId: string;
  workspaceId: string;
  visibility: Visibility;
}

export type CreateBoardResult =
  { ok: true; board: Board; path: string } | { ok: false; error: string };

export type ActionResult = { ok: true } | { ok: false; error: string };

export function useHome() {
  const {
    data,
    isReady,
    dataError,
    createBoardWithBackground,
    restoreBoard,
    deleteArchivedBoard,
    retryLoad
  } = useBoard();
  const meta = useBoardMeta();
  const workspaces = useWorkspaces();
  const boards = data.boards;

  const recent = useMemo(() => recentBoards(boards, meta), [boards, meta]);
  const closed = useMemo(() => closedBoards(boards), [boards]);

  const boardsFor = useCallback(
    (workspaceId: string) =>
      boardsInWorkspace(boards, meta, workspaces, workspaceId),
    [boards, meta, workspaces]
  );

  const workspaceNameOf = useCallback(
    (board: Board) => workspaceOf(board, meta, workspaces)?.name ?? null,
    [meta, workspaces]
  );

  const createBoard = useCallback(
    (input: NewBoardInput): CreateBoardResult => {
      const result = createBoardWithBackground(input.title, input.backgroundId);
      if (!result.ok) return { ok: false, error: result.error };
      const board = result.data.boards.find((item) => item.id === result.id);
      if (!board)
        return { ok: false, error: "The board could not be created." };
      const saved = updateBoardMeta(board.id, {
        workspaceId: input.workspaceId,
        visibility: input.visibility
      });
      if (!saved) {
        return {
          ok: false,
          error: "The board was created but its settings could not be saved."
        };
      }
      return { ok: true, board, path: boardPath(board) };
    },
    [createBoardWithBackground]
  );

  const reopen = useCallback(
    (boardId: string): ActionResult => {
      const result = restoreBoard(boardId);
      return result.ok ? { ok: true } : { ok: false, error: result.error };
    },
    [restoreBoard]
  );

  const deleteClosed = useCallback(
    (boardId: string): ActionResult => {
      const result = deleteArchivedBoard(boardId);
      if (!result.ok) return { ok: false, error: result.error };
      removeBoardMeta(boardId);
      return { ok: true };
    },
    [deleteArchivedBoard]
  );

  return {
    isReady,
    dataError,
    retryLoad,
    settings: data.settings,
    workspaces,
    meta,
    recent,
    closed,
    boardsFor,
    workspaceNameOf,
    canAdminister: (_boardId: string) => true,
    toggleFavorite,
    createBoard,
    reopen,
    deleteClosed
  };
}
