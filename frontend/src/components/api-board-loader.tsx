"use client";

import { useCallback, useEffect, useState } from "react";
import NextLink from "next/link";
import { Alert, Box, Button, CircularProgress } from "@mui/material";
import { BoardPage } from "@/components/board-page";
import { attachRemoteBoard, detachRemoteBoard, setRemoteSaveError } from "@/hooks/use-board";
import { BoardSyncer, fromSnapshot } from "@/lib/api/board-sync";
import { ApiError, errorMessage } from "@/lib/api/client";
import { api } from "@/lib/api/endpoints";
import { newObjectId } from "@/lib/api/object-id";
import { readRemoteSettings } from "@/lib/api/remote-settings";
import { httpSyncApi } from "@/lib/api/sync-http";
import { setIdFactory } from "@/lib/board-schema";

type LoadState = { kind: "loading" } | { kind: "ready" } | { kind: "missing" } | { kind: "error"; message: string };

export function ApiBoardLoader({ boardId }: { boardId: string }) {
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setIdFactory(newObjectId);
    setState({ kind: "loading" });

    (async () => {
      try {
        const snapshot = await httpSyncApi.snapshot(boardId);
        if (cancelled) return;
        const loaded = fromSnapshot(snapshot);
        const syncer = new BoardSyncer(httpSyncApi, loaded, setRemoteSaveError);
        attachRemoteBoard({ board: loaded.board, syncer, settings: readRemoteSettings() });
        void api.recordView(boardId).catch(() => undefined);
        setState({ kind: "ready" });
      } catch (caught) {
        if (cancelled) return;
        if (caught instanceof ApiError && caught.status === 404) {
          setState({ kind: "missing" });
          return;
        }
        setState({ kind: "error", message: errorMessage(caught) });
      }
    })();

    return () => {
      cancelled = true;
      detachRemoteBoard();
      setIdFactory(null);
    };
  }, [boardId, attempt]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  if (state.kind === "ready") return <BoardPage boardId={boardId} />;

  if (state.kind === "missing") {
    return (
      <Box sx={{ p: 4, pt: 14, textAlign: "center" }} data-testid="board-not-found">
        <Alert severity="warning" sx={{ maxWidth: 480, mx: "auto" }}>
          This board does not exist or you do not have access.
        </Alert>
        <Button component={NextLink} href="/" variant="contained" sx={{ mt: 2 }}>
          Back to Home
        </Button>
      </Box>
    );
  }

  if (state.kind === "error") {
    return (
      <Box sx={{ p: 4, pt: 14, textAlign: "center" }}>
        <Alert severity="error" sx={{ maxWidth: 480, mx: "auto" }}>
          {state.message}
        </Alert>
        <Button onClick={retry} variant="contained" sx={{ mt: 2 }}>
          Try again
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "grid", placeItems: "center", minHeight: "60vh" }}>
      <CircularProgress aria-label="Loading board" />
    </Box>
  );
}
