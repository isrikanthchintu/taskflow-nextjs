"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Box, Button, Typography } from "@mui/material";
import { TaskDashboard } from "@/components/task-dashboard";
import { useBoard } from "@/hooks/use-board";
import { recordBoardView } from "@/lib/board-meta-store";
import { boardPath } from "@/lib/home-model";

export function BoardPage({ boardId }: { boardId: string }) {
  const router = useRouter();
  const { data, isReady, switchBoard } = useBoard();
  const synced = useRef(false);
  const target = data.boards.find((item) => item.id === boardId);
  const available = Boolean(target && !target.archived);
  const activeId = data.activeBoardId;

  useEffect(() => {
    synced.current = false;
  }, [boardId]);

  useEffect(() => {
    if (!isReady || !available) return;
    if (activeId !== boardId) switchBoard(boardId);
  }, [isReady, available, boardId, activeId, switchBoard]);

  useEffect(() => {
    if (!isReady || !available) return;
    if (!synced.current) {
      if (activeId === boardId) synced.current = true;
      return;
    }
    if (activeId !== boardId) {
      const next = data.boards.find((item) => item.id === activeId);
      if (next && !next.archived) router.replace(boardPath(next));
    }
  }, [isReady, available, activeId, boardId, data.boards, router]);

  useEffect(() => {
    if (isReady && available) recordBoardView(boardId);
  }, [isReady, available, boardId]);

  if (isReady && !available) {
    return (
      <Box
        component="main"
        tabIndex={-1}
        data-testid="board-not-found"
        sx={{ textAlign: "center", py: 10, px: 2, pt: 14 }}
      >
        <Typography component="h1" sx={{ fontSize: 22, fontWeight: 700 }}>
          Board not found
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
          This board may have been closed or deleted.
        </Typography>
        <Button component={Link} href="/" variant="contained">
          Back to Home
        </Button>
      </Box>
    );
  }

  return <TaskDashboard />;
}
