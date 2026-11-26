"use client";

import { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField
} from "@mui/material";
import {
  createWorkspace,
  validateWorkspaceName,
  WORKSPACE_NAME_MAX,
  WORKSPACE_TYPES,
  type Workspace
} from "@/lib/workspace-store";

interface FieldErrors {
  name?: string;
  type?: string;
  form?: string;
}

export function CreateWorkspaceDialog({
  open,
  onClose,
  onExited,
  onCreated
}: {
  open: boolean;
  onClose: () => void;
  onExited?: () => void;
  onCreated?: (workspace: Workspace) => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nameError = validateWorkspaceName(name);
    const typeError = type ? undefined : "Choose a workspace type.";
    if (nameError || typeError) {
      setErrors({ name: nameError ?? undefined, type: typeError });
      return;
    }
    const result = createWorkspace({ name, type, description });
    if (!result.ok) {
      setErrors({ [result.field]: result.error });
      return;
    }
    onCreated?.(result.workspace);
    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{ transition: { onExited } }}
      aria-labelledby="create-workspace-title"
    >
      <form onSubmit={submit} noValidate>
        <DialogTitle id="create-workspace-title">Create Workspace</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              autoFocus
              required
              fullWidth
              size="small"
              label="Name"
              value={name}
              error={Boolean(errors.name)}
              helperText={errors.name ?? " "}
              slotProps={{
                htmlInput: {
                  "data-testid": "workspace-name-input",
                  maxLength: WORKSPACE_NAME_MAX + 50
                }
              }}
              onChange={(event) => {
                setName(event.target.value);
                setErrors((current) => ({ ...current, name: undefined }));
              }}
            />
            <TextField
              select
              required
              fullWidth
              size="small"
              label="Type"
              value={type}
              error={Boolean(errors.type)}
              helperText={errors.type ?? " "}
              slotProps={{
                htmlInput: { "data-testid": "workspace-type-input" }
              }}
              onChange={(event) => {
                setType(event.target.value);
                setErrors((current) => ({ ...current, type: undefined }));
              }}
            >
              {WORKSPACE_TYPES.map((item) => (
                <MenuItem key={item} value={item}>
                  {item}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              multiline
              minRows={2}
              size="small"
              label="Description (optional)"
              value={description}
              slotProps={{
                htmlInput: { "data-testid": "workspace-description-input" }
              }}
              onChange={(event) => setDescription(event.target.value)}
              helperText={errors.form ?? " "}
              error={Boolean(errors.form)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="text" color="inherit" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            data-testid="workspace-submit"
          >
            Create workspace
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
