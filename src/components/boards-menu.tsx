"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  ListItemText,
  Menu,
  MenuItem,
  TextField
} from "@mui/material";
import { Check, ChevronDown } from "lucide-react";
import { useBoard } from "@/hooks/use-board";
import { LIMITS } from "@/lib/board-ops";
import type { OpResult } from "@/lib/board-ops";

type NameDialogKind = "create" | "rename";

function NameDialog({
  kind,
  initial,
  onSubmit,
  onClose,
  onExited
}: {
  kind: NameDialogKind | null;
  initial: string;
  onSubmit: (name: string) => OpResult;
  onClose: () => void;
  onExited: () => void;
}) {
  const [name, setName] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const title = kind === "rename" ? "Rename this board" : "New board";

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = onSubmit(name);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onClose();
  }

  return (
    <Dialog
      open={kind !== null}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{ transition: { onExited } }}
      aria-labelledby="board-name-dialog-title"
    >
      <form onSubmit={submit}>
        <DialogTitle id="board-name-dialog-title">{title}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            margin="dense"
            size="small"
            label="Board name"
            value={name}
            error={Boolean(error)}
            helperText={error ?? " "}
            slotProps={{ htmlInput: { "data-testid": "board-name-input" } }}
            onChange={(event) => setName(event.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button variant="text" color="inherit" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            data-testid="board-name-submit"
          >
            {kind === "rename" ? "Rename" : "Create board"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export function BoardsMenu({
  anchorEl,
  onOpen,
  onClose,
  buttonRef,
  onExport,
  onImport,
  onOpenRules
}: {
  anchorEl: HTMLElement | null;
  onOpen: (anchor: HTMLElement) => void;
  onClose: () => void;
  buttonRef?: React.RefObject<HTMLButtonElement | null>;
  onExport: () => void;
  onImport: () => void;
  onOpenRules?: () => void;
}) {
  const { data, board, createBoard, renameBoard, switchBoard, archiveBoard } =
    useBoard();
  const ownRef = useRef<HTMLButtonElement | null>(null);
  const [dialog, setDialog] = useState<NameDialogKind | null>(null);
  const [dialogKey, setDialogKey] = useState(0);

  const openBoards = data.boards.filter((item) => !item.archived);
  const atLimit = openBoards.length >= LIMITS.boards;
  const lastBoard = openBoards.length <= 1;

  function setButton(element: HTMLButtonElement | null) {
    ownRef.current = element;
    if (buttonRef) buttonRef.current = element;
  }

  function run(action: () => void) {
    onClose();
    action();
  }

  function openDialog(kind: NameDialogKind) {
    onClose();
    setDialogKey((key) => key + 1);
    setDialog(kind);
  }

  return (
    <>
      <Button
        ref={setButton}
        color="inherit"
        data-testid="boards-menu-button"
        aria-haspopup="menu"
        aria-expanded={anchorEl ? "true" : undefined}
        aria-label={`Boards menu, ${board.name} is open`}
        endIcon={<ChevronDown size={16} aria-hidden="true" />}
        onClick={(event) => onOpen(event.currentTarget)}
        sx={{
          minHeight: 44,
          minWidth: 44,
          maxWidth: { xs: 140, sm: 240 },
          bgcolor: "rgba(255,255,255,.18)",
          fontSize: 14,
          fontWeight: 600,
          "&:hover": { bgcolor: "rgba(255,255,255,.28)", transform: "none" },
          "&:focus-visible": { outline: "2px solid #fff", outlineOffset: 2 }
        }}
      >
        <span
          data-testid="top-bar-board-name"
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap"
          }}
        >
          {board.name}
        </span>
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={onClose}
        slotProps={{ list: { "aria-label": "Boards" } }}
      >
        {openBoards.map((item) => (
          <MenuItem
            key={item.id}
            role="menuitemradio"
            aria-checked={item.id === data.activeBoardId}
            data-testid={`boards-menu-board-${item.id}`}
            onClick={() => run(() => switchBoard(item.id))}
          >
            <ListItemText>{item.name}</ListItemText>
            {item.id === data.activeBoardId && (
              <Check size={16} aria-hidden="true" />
            )}
          </MenuItem>
        ))}
        <Divider component="li" />
        <MenuItem
          disabled={atLimit}
          data-testid="boards-menu-new"
          onClick={() => openDialog("create")}
        >
          <ListItemText
            secondary={
              atLimit ? `Board limit reached (${LIMITS.boards})` : null
            }
          >
            New board ({openBoards.length} of {LIMITS.boards})
          </ListItemText>
        </MenuItem>
        <MenuItem
          data-testid="boards-menu-rename"
          onClick={() => openDialog("rename")}
        >
          <ListItemText>Rename this board</ListItemText>
        </MenuItem>
        <MenuItem
          data-testid="boards-menu-export"
          onClick={() => run(onExport)}
        >
          <ListItemText>Export this board</ListItemText>
        </MenuItem>
        <MenuItem
          data-testid="boards-menu-import"
          onClick={() => run(onImport)}
        >
          <ListItemText>Import a board</ListItemText>
        </MenuItem>
        {onOpenRules && (
          <MenuItem
            data-testid="boards-menu-rules"
            onClick={() => run(onOpenRules)}
          >
            <ListItemText>Rules for this board</ListItemText>
          </MenuItem>
        )}
        <MenuItem
          disabled={lastBoard}
          data-testid="boards-menu-archive-board"
          onClick={() => run(() => archiveBoard(board.id))}
        >
          <ListItemText
            secondary={lastBoard ? "Keep at least one board open" : null}
          >
            Archive this board
          </ListItemText>
        </MenuItem>
        <MenuItem
          component={Link}
          href="/archive"
          data-testid="boards-menu-archive-link"
          onClick={onClose}
        >
          <ListItemText>Archive</ListItemText>
        </MenuItem>
      </Menu>
      <NameDialog
        key={dialogKey}
        kind={dialog}
        initial={dialog === "rename" ? board.name : ""}
        onSubmit={(name) =>
          dialog === "rename" ? renameBoard(board.id, name) : createBoard(name)
        }
        onClose={() => setDialog(null)}
        onExited={() => ownRef.current?.focus()}
      />
    </>
  );
}
