"use client";

import { Button, Snackbar } from "@mui/material";
import type { UndoState } from "@/hooks/use-board";

export function UndoSnackbar({
  entry,
  onUndo
}: {
  entry: UndoState | null;
  onUndo: () => void;
}) {
  return (
    <Snackbar
      open={entry !== null}
      message={entry?.message ?? ""}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      slotProps={{
        content: {
          role: "status",
          "aria-live": "polite",
          "data-testid": "undo-snackbar"
        } as Record<string, string>
      }}
      action={
        <Button
          color="inherit"
          size="small"
          data-testid="undo-button"
          onClick={onUndo}
        >
          Undo
        </Button>
      }
    />
  );
}
