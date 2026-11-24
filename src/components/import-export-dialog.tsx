"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from "@mui/material";
import { useBoard } from "@/hooks/use-board";
import { importBoard as previewImport } from "@/lib/board-transfer";

export interface ImportExportHandle {
  exportBoard: () => void;
  startImport: () => void;
}

interface PendingImport {
  fileName: string;
  text: string;
  newName: string | null;
  error: string | null;
}

export function downloadTextFile(fileName: string, text: string): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("The file could not be read."));
    reader.readAsText(file);
  });
}

export const ImportExportDialog = forwardRef<ImportExportHandle>(
  function ImportExportDialog(_props, ref) {
    const { data, exportBoardFile, importBoard, switchBoard } = useBoard();
    const inputRef = useRef<HTMLInputElement>(null);
    const [pending, setPending] = useState<PendingImport | null>(null);
    const [open, setOpen] = useState(false);
    const [status, setStatus] = useState("");

    useImperativeHandle(ref, () => ({
      exportBoard() {
        const file = exportBoardFile();
        if (!file) {
          setStatus("That board could not be exported.");
          return;
        }
        downloadTextFile(file.fileName, file.text);
        setStatus(`Exported ${file.fileName}`);
      },
      startImport() {
        inputRef.current?.click();
      }
    }));

    async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;
      let text: string;
      try {
        text = await readFile(file);
      } catch (caught) {
        setPending({
          fileName: file.name,
          text: "",
          newName: null,
          error: caught instanceof Error ? caught.message : "Read failed."
        });
        setOpen(true);
        return;
      }
      const preview = previewImport(data, text);
      setPending(
        preview.ok
          ? {
              fileName: file.name,
              text,
              newName:
                preview.data.boards.find((board) => board.id === preview.id)
                  ?.name ?? null,
              error: null
            }
          : { fileName: file.name, text, newName: null, error: preview.error }
      );
      setOpen(true);
    }

    function confirm() {
      if (!pending) return;
      const result = importBoard(pending.text);
      if (!result.ok) {
        setPending({ ...pending, newName: null, error: result.error });
        return;
      }
      if (result.id) switchBoard(result.id);
      setStatus(`Imported ${pending.newName ?? "a board"}`);
      setOpen(false);
    }

    return (
      <>
        <input
          ref={inputRef}
          type="file"
          accept=".json,application/json"
          hidden
          tabIndex={-1}
          aria-label="Board file to import"
          data-testid="import-file-input"
          onChange={handleFile}
        />
        <Box
          role="status"
          aria-live="polite"
          data-testid="transfer-status"
          sx={{
            position: "absolute",
            width: 1,
            height: 1,
            overflow: "hidden",
            clip: "rect(0 0 0 0)",
            whiteSpace: "nowrap"
          }}
        >
          {status}
        </Box>
        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          maxWidth="xs"
          fullWidth
          aria-labelledby="import-dialog-title"
          aria-describedby="import-dialog-message"
        >
          <DialogTitle id="import-dialog-title">
            {pending?.error
              ? "This file cannot be imported"
              : `Import '${pending?.fileName ?? ""}'?`}
          </DialogTitle>
          <DialogContent>
            {pending?.error ? (
              <Alert
                severity="error"
                role="alert"
                data-testid="import-error"
                id="import-dialog-message"
              >
                {pending.error}
              </Alert>
            ) : (
              <DialogContentText id="import-dialog-message">
                {`Adds a new board named '${pending?.newName}'. Your existing boards are not changed.`}
              </DialogContentText>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              autoFocus={Boolean(pending?.error)}
              variant="text"
              color="inherit"
              data-testid="import-cancel"
              onClick={() => setOpen(false)}
            >
              {pending?.error ? "Close" : "Cancel"}
            </Button>
            {!pending?.error && (
              <Button
                autoFocus
                variant="contained"
                data-testid="import-confirm"
                onClick={confirm}
              >
                Import
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </>
    );
  }
);
