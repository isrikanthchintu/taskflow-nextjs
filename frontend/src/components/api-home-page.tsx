"use client";

import { useCallback, useEffect, useState } from "react";
import NextLink from "next/link";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CircularProgress,
  Container,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import {
  api,
  type ApiBoardSummary,
  type ApiWorkspace,
  type BoardVisibility
} from "@/lib/api/endpoints";
import { errorMessage } from "@/lib/api/client";
import { boardPath } from "@/lib/home-model";

interface WorkspaceBoards {
  workspace: ApiWorkspace;
  boards: ApiBoardSummary[];
  closed: ApiBoardSummary[];
}

function NewBoardForm({ workspaceId, onCreated }: { workspaceId: string; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [visibility, setVisibility] = useState<BoardVisibility>("workspace");
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await api.createBoard({ workspaceId, name, visibility });
      setName("");
      onCreated();
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }

  return (
    <Box component="form" onSubmit={submit} sx={{ mt: 2 }}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: "flex-start" }}>
        <TextField
          size="small"
          label="New board title"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={Boolean(error)}
          helperText={error ?? undefined}
        />
        <TextField
          select
          size="small"
          label="Visibility"
          value={visibility}
          onChange={(event) => setVisibility(event.target.value as BoardVisibility)}
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="private">Private</MenuItem>
          <MenuItem value="workspace">Workspace</MenuItem>
          <MenuItem value="public">Public</MenuItem>
        </TextField>
        <Button type="submit" variant="contained" disabled={name.trim().length === 0}>
          Create board
        </Button>
      </Stack>
    </Box>
  );
}

function BoardTile({
  board,
  onChanged,
  onError
}: {
  board: ApiBoardSummary;
  onChanged: () => void;
  onError: (message: string) => void;
}) {
  async function run(action: () => Promise<unknown>) {
    try {
      await action();
      onChanged();
    } catch (caught) {
      onError(errorMessage(caught));
    }
  }

  return (
    <Card sx={{ width: 220 }} data-testid={`api-board-${board.id}`}>
      <CardActionArea
        component={NextLink}
        href={boardPath({ id: board.id, name: board.name })}
        sx={{ p: 2, minHeight: 80, bgcolor: board.background, color: "#fff" }}
      >
        <Typography sx={{ fontWeight: 700 }}>{board.name}</Typography>
        <Typography variant="caption">{board.visibility}</Typography>
      </CardActionArea>
      <Stack direction="row" sx={{ px: 1, justifyContent: "space-between", alignItems: "center" }}>
        <IconButton
          size="small"
          aria-label={board.starred ? `Unstar ${board.name}` : `Star ${board.name}`}
          onClick={() => run(() => (board.starred ? api.unstarBoard(board.id) : api.starBoard(board.id)))}
        >
          {board.starred ? "★" : "☆"}
        </IconButton>
        {board.isClosed ? (
          <Button size="small" onClick={() => run(() => api.reopenBoard(board.id))}>
            Reopen
          </Button>
        ) : (
          board.role === "admin" && (
            <Button size="small" onClick={() => run(() => api.closeBoard(board.id))}>
              Close
            </Button>
          )
        )}
      </Stack>
    </Card>
  );
}

export function ApiHomePage() {
  const [items, setItems] = useState<WorkspaceBoards[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState("");

  const load = useCallback(async () => {
    try {
      const workspaces = await api.workspaces();
      const loaded = await Promise.all(
        workspaces.map(async (workspace) => ({
          workspace,
          boards: await api.workspaceBoards(workspace.id),
          closed: await api.workspaceBoards(workspace.id, true)
        }))
      );
      setItems(loaded);
      setError(null);
    } catch (caught) {
      setError(errorMessage(caught));
      setItems((current) => current ?? []);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createWorkspace(event: React.FormEvent) {
    event.preventDefault();
    try {
      await api.createWorkspace({ name: workspaceName });
      setWorkspaceName("");
      await load();
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }

  if (items === null) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", minHeight: "50vh" }}>
        <CircularProgress aria-label="Loading your workspaces" />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }} data-testid="api-home">
      <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 2 }}>
        Your workspaces
      </Typography>
      {error && (
        <Alert severity="error" role="alert" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      <Box component="form" onSubmit={createWorkspace} sx={{ mb: 4 }}>
        <Stack direction="row" spacing={1}>
          <TextField
            size="small"
            label="New workspace name"
            value={workspaceName}
            onChange={(event) => setWorkspaceName(event.target.value)}
          />
          <Button type="submit" variant="contained" disabled={workspaceName.trim().length === 0}>
            Create workspace
          </Button>
        </Stack>
      </Box>
      {items.length === 0 && <Typography>You have no workspaces yet. Create one to get started.</Typography>}
      {items.map(({ workspace, boards, closed }) => (
        <Box key={workspace.id} component="section" sx={{ mb: 5 }} aria-label={workspace.name}>
          <Typography variant="h6" component="h2" sx={{ fontWeight: 700, mb: 1 }}>
            {workspace.name}
          </Typography>
          <Stack direction="row" sx={{ flexWrap: "wrap", gap: 2 }}>
            {boards.map((board) => (
              <BoardTile key={board.id} board={board} onChanged={load} onError={setError} />
            ))}
            {boards.length === 0 && <Typography color="text.secondary">No boards yet.</Typography>}
          </Stack>
          <NewBoardForm workspaceId={workspace.id} onCreated={load} />
          {closed.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Closed boards
              </Typography>
              <Stack direction="row" sx={{ flexWrap: "wrap", gap: 2 }}>
                {closed.map((board) => (
                  <BoardTile key={board.id} board={board} onChanged={load} onError={setError} />
                ))}
              </Stack>
            </Box>
          )}
        </Box>
      ))}
    </Container>
  );
}
