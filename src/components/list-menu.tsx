"use client";

import { useRef, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  ListItemText,
  Menu,
  MenuItem,
  TextField
} from "@mui/material";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { useBoard } from "@/hooks/use-board";
import type { List } from "@/types/board";

export function ListMenu({
  list,
  index,
  listCount
}: {
  list: List;
  index: number;
  listCount: number;
}) {
  const { renameList, reorderList, setListDone, archiveList, setListLimit } =
    useBoard();
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(list.name);
  const [error, setError] = useState<string | null>(null);
  const [limiting, setLimiting] = useState(false);
  const [limitText, setLimitText] = useState("");
  const [limitError, setLimitError] = useState<string | null>(null);

  function closeMenu() {
    setAnchor(null);
  }

  function returnFocus() {
    buttonRef.current?.focus();
  }

  function openLimit() {
    closeMenu();
    setLimitText(list.limit === null ? "" : String(list.limit));
    setLimitError(null);
    setLimiting(true);
  }

  function submitLimit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = limitText.trim();
    const value = trimmed === "" ? null : Number(trimmed);
    if (value !== null && (!Number.isInteger(value) || value < 1)) {
      setLimitError("Enter a whole number of 1 or more, or leave it blank.");
      return;
    }
    const result = setListLimit(list.id, value);
    if (!result.ok) {
      setLimitError(result.error);
      return;
    }
    setLimiting(false);
  }

  function openRename() {
    closeMenu();
    setName(list.name);
    setError(null);
    setRenaming(true);
  }

  function submitRename(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = renameList(list.id, name);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setRenaming(false);
  }

  function run(action: () => unknown) {
    closeMenu();
    action();
  }

  return (
    <>
      <IconButton
        ref={buttonRef}
        size="small"
        data-testid={`list-menu-${list.id}-button`}
        aria-label={`List actions for ${list.name}`}
        aria-haspopup="menu"
        aria-expanded={anchor ? "true" : undefined}
        onClick={(event) => setAnchor(event.currentTarget)}
        sx={{
          color: (theme) => theme.board.textSecondary,
          "&:focus-visible": {
            outline: (theme) => `2px solid ${theme.board.ring}`
          }
        }}
      >
        <MoreHorizIcon fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={closeMenu}
        slotProps={{ list: { "aria-label": `${list.name} list actions` } }}
      >
        <MenuItem
          data-testid={`list-menu-${list.id}-rename`}
          onClick={openRename}
        >
          <ListItemText>Rename list</ListItemText>
        </MenuItem>
        <MenuItem
          data-testid={`list-menu-${list.id}-move-left`}
          disabled={index <= 0}
          onClick={() => run(() => reorderList(list.id, index - 1))}
        >
          <ListItemText>Move left</ListItemText>
        </MenuItem>
        <MenuItem
          data-testid={`list-menu-${list.id}-move-right`}
          disabled={index >= listCount - 1}
          onClick={() => run(() => reorderList(list.id, index + 1))}
        >
          <ListItemText>Move right</ListItemText>
        </MenuItem>
        <MenuItem
          data-testid={`list-menu-${list.id}-done`}
          onClick={() => run(() => setListDone(list.id, !list.done))}
        >
          <ListItemText>
            {list.done ? "Unmark as done list" : "Mark as done list"}
          </ListItemText>
        </MenuItem>
        <MenuItem
          data-testid={`list-menu-${list.id}-limit`}
          onClick={openLimit}
        >
          <ListItemText>
            {list.limit === null ? "Set card limit" : "Change card limit"}
          </ListItemText>
        </MenuItem>
        <MenuItem
          data-testid={`list-menu-${list.id}-archive`}
          onClick={() => run(() => archiveList(list.id))}
        >
          <ListItemText>Archive list</ListItemText>
        </MenuItem>
      </Menu>
      <Dialog
        open={renaming}
        onClose={() => setRenaming(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{ transition: { onExited: returnFocus } }}
      >
        <form onSubmit={submitRename}>
          <DialogTitle>Rename list</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              fullWidth
              margin="dense"
              size="small"
              label="List name"
              value={name}
              error={Boolean(error)}
              helperText={error ?? " "}
              onChange={(event) => setName(event.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button
              variant="text"
              color="inherit"
              onClick={() => setRenaming(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="contained">
              Rename
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      <Dialog
        open={limiting}
        onClose={() => setLimiting(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{ transition: { onExited: returnFocus } }}
      >
        <form onSubmit={submitLimit}>
          <DialogTitle>Card limit for {list.name}</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              fullWidth
              margin="dense"
              size="small"
              label="Card limit"
              value={limitText}
              error={Boolean(limitError)}
              helperText={
                limitError ??
                "Leave blank for no limit. A list over its limit shows a warning but still takes cards."
              }
              slotProps={{
                htmlInput: {
                  inputMode: "numeric",
                  "data-testid": `list-menu-${list.id}-limit-input`
                }
              }}
              onChange={(event) => setLimitText(event.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button
              variant="text"
              color="inherit"
              onClick={() => setLimiting(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              data-testid={`list-menu-${list.id}-limit-save`}
            >
              Save limit
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}
