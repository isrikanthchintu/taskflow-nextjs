"use client";

import { ApiBoardPage } from "@/components/api-board-page";
import { ApiGate } from "@/components/api-gate";
import { ApiHomePage } from "@/components/api-home-page";
import { BoardPage } from "@/components/board-page";
import { HomePage } from "@/components/home-page";
import { isApiConfigured } from "@/lib/api/client";

export function HomeEntry() {
  if (!isApiConfigured()) return <HomePage />;
  return (
    <ApiGate>
      <ApiHomePage />
    </ApiGate>
  );
}

export function BoardEntry({ boardId }: { boardId: string }) {
  if (!isApiConfigured()) return <BoardPage boardId={boardId} />;
  return (
    <ApiGate>
      <ApiBoardPage boardId={boardId} />
    </ApiGate>
  );
}
