"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { useHome, type CreateBoardResult } from "@/hooks/use-home";
import {
  DEFAULT_VISIBILITY,
  VISIBILITIES,
  VISIBILITY_LABELS,
  type Visibility
} from "@/lib/board-meta-store";
import { BOARD_TITLE_MAX, validateBoardTitle } from "@/lib/home-model";
import { BACKGROUND_PRESETS } from "@/lib/theme-presets";
import type { Workspace } from "@/lib/workspace-store";

export interface BoardFormValues {
  title: string;
  backgroundId: string;
  workspaceId: string;
  visibility: Visibility;
}

export function CreateBoardDialog({
  open,
  onClose,
  onExited,
  workspaces,
  defaultWorkspaceId,
  onSubmit
}: {
  open: boolean;
  onClose: () => void;
  onExited?: () => void;
  workspaces: Workspace[];
  defaultWorkspaceId?: string;
  onSubmit: (values: BoardFormValues) => Promise<string | null> | string | null;
}) {
  const initialWorkspace =
    workspaces.find((item) => item.id === defaultWorkspaceId)?.id ??
    workspaces[0]?.id ??
    "";
  const [title, setTitle] = useState("");
  const [touched, setTouched] = useState(false);
  const [backgroundId, setBackgroundId] = useState(BACKGROUND_PRESETS[0].id);
  const [chosenWorkspaceId, setWorkspaceId] = useState(initialWorkspace);
  const workspaceId = workspaces.some((item) => item.id === chosenWorkspaceId)
    ? chosenWorkspaceId
    : initialWorkspace;
  const [visibility, setVisibility] = useState<Visibility>(DEFAULT_VISIBILITY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const titleError = validateBoardTitle(title);
  const noWorkspace = workspaces.length === 0;
  const valid = titleError === null && workspaceId !== "" && !noWorkspace;
  const showTitleError = touched && titleError !== null;
  const preview = BACKGROUND_PRESETS.find((item) => item.id === backgroundId);

  async function submit(event?: React.FormEvent) {
    event?.preventDefault();
    setTouched(true);
    if (!valid || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const failure = await onSubmit({
        title: title.trim(),
        backgroundId,
        workspaceId,
        visibility
      });
      if (failure) setError(failure);
    } catch {
      setError("The board could not be created. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      scroll="paper"
      slotProps={{ transition: { onExited } }}
      aria-labelledby="create-board-title"
    >
      <form onSubmit={submit} noValidate>
        <DialogTitle id="create-board-title">Create board</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            {error && (
              <Alert
                severity="error"
                data-testid="create-board-error"
                action={
                  <Button
                    color="inherit"
                    size="small"
                    data-testid="create-board-retry"
                    onClick={() => void submit()}
                  >
                    Retry
                  </Button>
                }
              >
                {error}
              </Alert>
            )}

            <Box
              data-testid="create-board-preview"
              sx={{
                height: 96,
                borderRadius: 1.5,
                background: preview?.css,
                color: preview?.textColor ?? "#fff",
                display: "flex",
                alignItems: "center",
                px: 2
              }}
            >
              <Typography noWrap sx={{ fontWeight: 700 }}>
                {title.trim() || "Board title"}
              </Typography>
            </Box>

            <Box>
              <Typography
                id="create-board-background-label"
                variant="caption"
                sx={{ fontWeight: 700, color: "text.secondary" }}
              >
                Board background
              </Typography>
              <Box
                role="radiogroup"
                aria-labelledby="create-board-background-label"
                sx={{
                  mt: 0.5,
                  display: "grid",
                  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                  gap: 1
                }}
              >
                {BACKGROUND_PRESETS.map((item) => {
                  const selected = item.id === backgroundId;
                  return (
                    <Box
                      key={item.id}
                      component="button"
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      aria-label={item.name}
                      data-testid={`background-${item.id}`}
                      onClick={() => setBackgroundId(item.id)}
                      sx={{
                        height: 40,
                        borderRadius: 1,
                        border: "2px solid",
                        borderColor: selected ? "primary.main" : "transparent",
                        outline: selected ? "2px solid" : "none",
                        outlineColor: "background.paper",
                        outlineOffset: -4,
                        background: item.css,
                        cursor: "pointer",
                        "&:focus-visible": {
                          outline: "2px solid",
                          outlineColor: "primary.main",
                          outlineOffset: 2
                        }
                      }}
                    />
                  );
                })}
              </Box>
            </Box>

            <TextField
              autoFocus
              required
              fullWidth
              size="small"
              label="Board title"
              value={title}
              error={showTitleError}
              helperText={showTitleError ? titleError : " "}
              onBlur={() => setTouched(true)}
              onChange={(event) => {
                setTitle(event.target.value);
                setTouched(true);
              }}
              slotProps={{
                htmlInput: {
                  "data-testid": "board-title-input",
                  maxLength: BOARD_TITLE_MAX + 50
                }
              }}
            />

            <TextField
              select
              required
              fullWidth
              size="small"
              label="Workspace"
              value={workspaceId}
              disabled={noWorkspace}
              helperText={noWorkspace ? "Create a workspace first." : " "}
              onChange={(event) => setWorkspaceId(event.target.value)}
              slotProps={{
                htmlInput: { "data-testid": "board-workspace-input" }
              }}
            >
              {workspaces.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              required
              fullWidth
              size="small"
              label="Visibility"
              value={visibility}
              onChange={(event) =>
                setVisibility(event.target.value as Visibility)
              }
              slotProps={{
                htmlInput: { "data-testid": "board-visibility-input" }
              }}
            >
              {VISIBILITIES.map((item) => (
                <MenuItem key={item} value={item}>
                  {VISIBILITY_LABELS[item]}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="text" color="inherit" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!valid || submitting}
            data-testid="create-board-submit"
          >
            Create
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export function CreateBoardFlow({
  open,
  onClose,
  onExited,
  defaultWorkspaceId
}: {
  open: boolean;
  onClose: () => void;
  onExited?: () => void;
  defaultWorkspaceId?: string;
}) {
  const router = useRouter();
  const { workspaces, createBoard } = useHome();

  function submit(values: BoardFormValues): string | null {
    const result: CreateBoardResult = createBoard(values);
    if (!result.ok) return result.error;
    onClose();
    router.push(result.path);
    return null;
  }

  return (
    <CreateBoardDialog
      open={open}
      onClose={onClose}
      onExited={onExited}
      workspaces={workspaces}
      defaultWorkspaceId={defaultWorkspaceId}
      onSubmit={submit}
    />
  );
}
