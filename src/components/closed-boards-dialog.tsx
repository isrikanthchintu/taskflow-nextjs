"use client";

import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography
} from "@mui/material";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useHome } from "@/hooks/use-home";
import type { Board } from "@/types/board";

type RowAction = "reopen" | "delete";

interface RowError {
  action: RowAction;
  message: string;
}

export const DELETE_TITLE = "Delete board permanently?";
export const DELETE_MESSAGE =
  "All lists, cards and attachments will be removed. This can’t be undone.";

export function ClosedBoardsDialog({
  open,
  onClose,
  onExited
}: {
  open: boolean;
  onClose: () => void;
  onExited?: () => void;
}) {
  const {
    isReady,
    dataError,
    retryLoad,
    closed,
    workspaceNameOf,
    canAdminister,
    reopen,
    deleteClosed
  } = useHome();
  const [errors, setErrors] = useState<Record<string, RowError>>({});
  const [pendingDelete, setPendingDelete] = useState<Board | null>(null);

  function clearError(boardId: string) {
    setErrors((current) => {
      const { [boardId]: _removed, ...rest } = current;
      return rest;
    });
  }

  function fail(boardId: string, action: RowAction, message: string) {
    setErrors((current) => ({ ...current, [boardId]: { action, message } }));
  }

  function runReopen(board: Board) {
    const result = reopen(board.id);
    if (result.ok) clearError(board.id);
    else fail(board.id, "reopen", result.error);
  }

  function runDelete(board: Board) {
    const result = deleteClosed(board.id);
    if (result.ok) clearError(board.id);
    else fail(board.id, "delete", result.error);
  }

  function retry(board: Board, action: RowAction) {
    if (action === "reopen") runReopen(board);
    else runDelete(board);
  }

  function confirmDelete() {
    const board = pendingDelete;
    setPendingDelete(null);
    if (board) runDelete(board);
  }

  let body: React.ReactNode;
  if (!isReady) {
    body = (
      <Typography role="status" color="text.secondary">
        Loading closed boards...
      </Typography>
    );
  } else if (dataError) {
    body = (
      <Alert
        severity="error"
        data-testid="closed-boards-error"
        action={
          <Button
            color="inherit"
            size="small"
            data-testid="closed-boards-retry"
            onClick={() => retryLoad()}
          >
            Retry
          </Button>
        }
      >
        We couldn’t load your closed boards.
      </Alert>
    );
  } else if (closed.length === 0) {
    body = (
      <Typography data-testid="closed-boards-empty" color="text.secondary">
        You have no closed boards.
      </Typography>
    );
  } else {
    body = (
      <List disablePadding aria-label="Closed boards">
        {closed.map((board) => {
          const rowError = errors[board.id];
          const admin = canAdminister(board.id);
          return (
            <ListItem
              key={board.id}
              data-testid="closed-board-row"
              divider
              sx={{ flexDirection: "column", alignItems: "stretch", gap: 1 }}
            >
              <Stack
                direction="row"
                sx={{ alignItems: "center", gap: 1, flexWrap: "wrap" }}
              >
                <ListItemText
                  sx={{ minWidth: 0, flex: "1 1 160px", m: 0 }}
                  primary={board.name}
                  secondary={workspaceNameOf(board) ?? "No workspace"}
                  slotProps={{
                    primary: { noWrap: true, sx: { fontWeight: 600 } }
                  }}
                />
                {admin && (
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      variant="outlined"
                      data-testid="closed-board-reopen"
                      aria-label={`Reopen ${board.name}`}
                      onClick={() => runReopen(board)}
                    >
                      Reopen
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      data-testid="closed-board-delete"
                      aria-label={`Delete ${board.name}`}
                      onClick={() => setPendingDelete(board)}
                    >
                      Delete
                    </Button>
                  </Stack>
                )}
              </Stack>
              {rowError && (
                <Alert
                  severity="error"
                  data-testid="closed-board-error"
                  action={
                    <Button
                      color="inherit"
                      size="small"
                      data-testid="closed-board-retry"
                      onClick={() => retry(board, rowError.action)}
                    >
                      Retry
                    </Button>
                  }
                >
                  {rowError.message}
                </Alert>
              )}
            </ListItem>
          );
        })}
      </List>
    );
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        scroll="paper"
        slotProps={{ transition: { onExited } }}
        aria-labelledby="closed-boards-title"
      >
        <DialogTitle id="closed-boards-title">Closed boards</DialogTitle>
        <DialogContent dividers>
          <Box>{body}</Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} data-testid="closed-boards-close">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={pendingDelete !== null}
        title={DELETE_TITLE}
        message={DELETE_MESSAGE}
        confirmLabel="Delete board"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}
