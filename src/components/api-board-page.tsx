"use client";

import { useCallback, useEffect, useState } from "react";
import NextLink from "next/link";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import {
  api,
  type ApiActivity,
  type ApiBoard,
  type ApiCardSummary,
  type ApiListWithCards
} from "@/lib/api/endpoints";
import { ApiError, errorMessage } from "@/lib/api/client";
import { positionAtEnd } from "@/lib/api/position";

function describe(activity: ApiActivity): string {
  const payload = activity.payload as {
    cardTitle?: string;
    listName?: string;
    boardName?: string;
    fromList?: { name?: string };
    toList?: { name?: string };
  };
  const subject = payload.cardTitle ?? payload.listName ?? payload.boardName ?? "";
  if (activity.type === "card_moved") {
    return `moved "${subject}" from ${payload.fromList?.name ?? "?"} to ${payload.toList?.name ?? "?"}`;
  }
  return `${activity.type.replace(/_/g, " ")} ${subject ? `"${subject}"` : ""}`.trim();
}

function AddForm({
  label,
  buttonLabel,
  onSubmit
}: {
  label: string;
  buttonLabel: string;
  onSubmit: (value: string) => Promise<void>;
}) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (value.trim().length === 0) return;
    setBusy(true);
    try {
      await onSubmit(value.trim());
      setValue("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box component="form" onSubmit={submit} sx={{ mt: 1 }}>
      <Stack direction="row" spacing={1}>
        <TextField
          size="small"
          fullWidth
          label={label}
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
        <Button type="submit" size="small" variant="contained" disabled={busy || value.trim().length === 0}>
          {buttonLabel}
        </Button>
      </Stack>
    </Box>
  );
}

function CardItem({
  card,
  lists,
  canEdit,
  run
}: {
  card: ApiCardSummary;
  lists: ApiListWithCards[];
  canEdit: boolean;
  run: (action: () => Promise<unknown>) => Promise<void>;
}) {
  return (
    <Paper variant="outlined" sx={{ p: 1.5, mb: 1 }} data-testid={`api-card-${card.id}`}>
      <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
        <Checkbox
          size="small"
          checked={card.isComplete}
          disabled={!canEdit}
          slotProps={{ input: { "aria-label": `Complete ${card.title}` } }}
          onChange={(event) => run(() => api.setCardComplete(card.id, event.target.checked))}
        />
        <Typography sx={{ textDecoration: card.isComplete ? "line-through" : "none", flex: 1 }}>
          {card.title}
        </Typography>
      </Stack>
      {card.labels.length > 0 && (
        <Stack direction="row" sx={{ mt: 0.5, gap: 0.5, flexWrap: "wrap" }}>
          {card.labels.map((label) => (
            <Chip key={label.id} size="small" label={label.name || " "} sx={{ bgcolor: label.color }} />
          ))}
        </Stack>
      )}
      {canEdit && (
        <Stack direction="row" spacing={1} sx={{ mt: 1, alignItems: "center" }}>
          <TextField
            select
            size="small"
            label="Move to"
            value={card.listId}
            onChange={(event) => {
              const target = lists.find((list) => list.id === event.target.value);
              if (!target || target.id === card.listId) return;
              void run(() =>
                api.moveCard(card.id, {
                  listId: target.id,
                  position: positionAtEnd(target.cards.map((item) => item.position)),
                  expectedVersion: card.version
                })
              );
            }}
            sx={{ minWidth: 130 }}
          >
            {lists.map((list) => (
              <MenuItem key={list.id} value={list.id}>
                {list.name}
              </MenuItem>
            ))}
          </TextField>
          <Button size="small" onClick={() => run(() => api.archiveCard(card.id))}>
            Archive
          </Button>
        </Stack>
      )}
    </Paper>
  );
}

export function ApiBoardPage({ boardId }: { boardId: string }) {
  const [board, setBoard] = useState<ApiBoard | null>(null);
  const [activity, setActivity] = useState<ApiActivity[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    try {
      const [loaded, feed] = await Promise.all([api.board(boardId), api.boardActivity(boardId)]);
      setBoard(loaded);
      setActivity(feed.items);
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 404) {
        setNotFound(true);
        return;
      }
      setError(errorMessage(caught));
    }
  }, [boardId]);

  useEffect(() => {
    void load();
    void api.recordView(boardId).catch(() => undefined);
  }, [load, boardId]);

  const run = useCallback(
    async (action: () => Promise<unknown>) => {
      try {
        await action();
        setError(null);
      } catch (caught) {
        setError(
          caught instanceof ApiError && caught.status === 409
            ? "Someone else changed this card. The board was refreshed."
            : errorMessage(caught)
        );
      }
      await load();
    },
    [load]
  );

  if (notFound) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="warning">This board does not exist or you do not have access.</Alert>
        <Button component={NextLink} href="/" sx={{ mt: 2 }}>
          Back to boards
        </Button>
      </Box>
    );
  }

  if (!board) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", minHeight: "50vh" }}>
        {error ? <Alert severity="error">{error}</Alert> : <CircularProgress aria-label="Loading board" />}
      </Box>
    );
  }

  const canEdit = board.permissions.edit && !board.isClosed;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: board.background, p: 3 }} data-testid="api-board">
      <Stack direction="row" spacing={2} sx={{ mb: 2, color: "#fff", alignItems: "center" }}>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
          {board.name}
        </Typography>
        <Chip size="small" label={board.visibility} />
        {board.isClosed && <Chip size="small" color="warning" label="Closed" />}
        <Box sx={{ flex: 1 }} />
        <Button component={NextLink} href="/" color="inherit">
          All boards
        </Button>
        {board.permissions.admin && (
          <Button
            color="inherit"
            onClick={() => run(() => (board.isClosed ? api.reopenBoard(board.id) : api.closeBoard(board.id)))}
          >
            {board.isClosed ? "Reopen board" : "Close board"}
          </Button>
        )}
      </Stack>
      {error && (
        <Alert severity="error" role="alert" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      <Stack direction="row" spacing={2} sx={{ overflowX: "auto", pb: 2, alignItems: "flex-start" }}>
        {board.lists.map((list) => (
          <Paper key={list.id} sx={{ width: 300, flexShrink: 0, p: 1.5 }} data-testid={`api-list-${list.id}`}>
            <Typography sx={{ fontWeight: 700, mb: 1 }}>
              {list.name} ({list.cards.length})
            </Typography>
            {list.cards.map((card) => (
              <CardItem key={card.id} card={card} lists={board.lists} canEdit={canEdit} run={run} />
            ))}
            {canEdit && (
              <AddForm
                label="Add a card"
                buttonLabel="Add"
                onSubmit={(title) => run(() => api.createCard(board.id, { listId: list.id, title }))}
              />
            )}
          </Paper>
        ))}
        {canEdit && (
          <Paper sx={{ width: 300, flexShrink: 0, p: 1.5 }}>
            <AddForm label="Add a list" buttonLabel="Add list" onSubmit={(name) => run(() => api.createList(board.id, name))} />
          </Paper>
        )}
        <Paper sx={{ width: 300, flexShrink: 0, p: 1.5 }} data-testid="api-activity">
          <Typography sx={{ fontWeight: 700, mb: 1 }}>Activity</Typography>
          {activity.length === 0 && <Typography color="text.secondary">No activity yet.</Typography>}
          {activity.map((item) => (
            <Typography key={item.id} variant="body2" sx={{ mb: 0.5 }}>
              {describe(item)}
            </Typography>
          ))}
        </Paper>
      </Stack>
    </Box>
  );
}
