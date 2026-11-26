"use client";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography
} from "@mui/material";

export const SHORTCUTS: { keys: string; action: string }[] = [
  { keys: "N", action: "New card" },
  { keys: "L", action: "New list" },
  { keys: "/", action: "Go to search" },
  { keys: "B", action: "Switch board" },
  { keys: "Ctrl+K or Cmd+K", action: "Open the command menu" },
  { keys: "?", action: "Show this list of shortcuts" },
  { keys: "Escape", action: "Close a menu or dialog" }
];

export function ShortcutHelp({
  open,
  onClose
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      aria-labelledby="shortcut-help-title"
    >
      <DialogTitle id="shortcut-help-title">Keyboard shortcuts</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 1.5 }}>
          Single-key shortcuts do not work while you type in a field or while a
          dialog is open.
        </Typography>
        <Stack
          component="dl"
          spacing={1}
          data-testid="shortcut-help-list"
          sx={{ m: 0 }}
        >
          {SHORTCUTS.map((shortcut) => (
            <Stack
              key={shortcut.keys}
              direction="row"
              sx={{ justifyContent: "space-between", gap: 2 }}
            >
              <Typography component="dt" variant="body2">
                {shortcut.action}
              </Typography>
              <Typography
                component="dd"
                variant="body2"
                sx={{ m: 0, fontWeight: 700, whiteSpace: "nowrap" }}
              >
                <kbd>{shortcut.keys}</kbd>
              </Typography>
            </Stack>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button
          autoFocus
          variant="contained"
          data-testid="shortcut-help-close"
          onClick={onClose}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
