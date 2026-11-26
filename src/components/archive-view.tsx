"use client";

import { TOP_BAR_HEIGHT } from "@/components/global-top-bar";
import { useState } from "react";
import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  IconButton,
  Stack,
  Tab,
  Tabs,
  Typography
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloseIcon from "@mui/icons-material/Close";
import { BannerStack } from "@/components/banner-stack";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { UndoSnackbar } from "@/components/undo-snackbar";
import { useBoard } from "@/hooks/use-board";
import { archivedCards } from "@/lib/board-query";

type Pending =
  | { kind: "list"; id: string; name: string; count: number }
  | { kind: "card"; id: string; title: string };

function cardsWord(count: number): string {
  return count === 1 ? "card" : "cards";
}

export function ArchiveView({
  embedded = false,
  onClose
}: {
  embedded?: boolean;
  onClose?: () => void;
} = {}) {
  const {
    board,
    isReady,
    dataError,
    saveError,
    notice,
    undoEntry,
    undo,
    dismissNotice,
    dismissSaveError,
    backupSavedData,
    resetSavedData,
    restoreList,
    restoreCard,
    deleteArchivedList,
    deleteArchivedCard
  } = useBoard();
  const [tab, setTab] = useState<"lists" | "cards">("lists");
  const [pending, setPending] = useState<Pending | null>(null);
  const [error, setError] = useState<string | null>(null);

  const archivedLists = board.lists.filter((list) => list.archived);
  const cards = archivedCards(board);
  const locked = Boolean(dataError);

  function report(result: { ok: boolean } & { error?: string }) {
    setError(result.ok ? null : (result.error ?? "That did not work."));
  }

  function confirmDelete() {
    if (!pending) return;
    const result =
      pending.kind === "list"
        ? deleteArchivedList(pending.id)
        : deleteArchivedCard(pending.id);
    report(result);
    setPending(null);
  }

  const confirmCount = pending?.kind === "list" ? pending.count : 1;

  return (
    <Box
      sx={{
        height: embedded ? "100%" : `calc(100vh - ${TOP_BAR_HEIGHT}px)`,
        bgcolor: "background.default",
        color: "text.primary",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden"
      }}
    >
      <Box
        component="header"
        sx={{ display: "flex", alignItems: "center", gap: 2, px: 2, py: 1.5 }}
      >
        {!embedded && (
          <Link
            href="/"
            data-testid="back-to-board"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: "inherit",
              fontWeight: 700
            }}
          >
            <ArrowBackIcon />
            Back to board
          </Link>
        )}
        <Typography component="h1" sx={{ fontSize: 24, fontWeight: 700 }}>
          Archive
        </Typography>
        {embedded && (
          <IconButton
            onClick={onClose}
            sx={{ ml: "auto" }}
            aria-label="Close archive"
          >
            <CloseIcon />
          </IconButton>
        )}
      </Box>

      <BannerStack
        dataError={dataError}
        saveError={saveError}
        notice={notice}
        onDismissSaveError={dismissSaveError}
        onBackupData={backupSavedData}
        onResetData={resetSavedData}
        onDismissNotice={dismissNotice}
      />

      <Box
        component="main"
        sx={{ px: embedded ? 2 : 3, pb: 6, flex: 1, overflowY: "auto" }}
      >
        <Tabs
          value={tab}
          onChange={(_event, value) => setTab(value)}
          aria-label="Archive sections"
        >
          <Tab
            value="lists"
            label="Lists"
            id="archive-tab-lists"
            aria-controls="archive-panel-lists"
            data-testid="archive-tab-lists"
          />
          <Tab
            value="cards"
            label="Cards"
            id="archive-tab-cards"
            aria-controls="archive-panel-cards"
            data-testid="archive-tab-cards"
          />
        </Tabs>

        {error && (
          <Alert severity="error" role="alert" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {!isReady ? (
          <Typography sx={{ mt: 2 }}>Loading your archive...</Typography>
        ) : tab === "lists" ? (
          <Box
            role="tabpanel"
            id="archive-panel-lists"
            aria-labelledby="archive-tab-lists"
            sx={{ mt: 2 }}
          >
            {archivedLists.length === 0 ? (
              <Typography data-testid="archive-empty">
                Nothing archived here yet
              </Typography>
            ) : (
              <Stack spacing={1}>
                {archivedLists.map((list) => {
                  const count = board.cards.filter(
                    (card) => card.listId === list.id
                  ).length;
                  return (
                    <Stack
                      key={list.id}
                      direction="row"
                      spacing={1}
                      data-testid={`archive-list-${list.id}`}
                      sx={{ alignItems: "center", flexWrap: "wrap" }}
                    >
                      <Typography
                        sx={{ flex: 1, fontWeight: 600, minWidth: 160 }}
                      >
                        {list.name} ({count} {cardsWord(count)})
                      </Typography>
                      <Button
                        variant="outlined"
                        disabled={locked}
                        data-testid={`archive-list-${list.id}-restore`}
                        aria-label={`Restore list ${list.name}`}
                        onClick={() => report(restoreList(list.id))}
                      >
                        Restore
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        disabled={locked}
                        data-testid={`archive-list-${list.id}-delete`}
                        aria-label={`Delete list ${list.name} permanently`}
                        onClick={() =>
                          setPending({
                            kind: "list",
                            id: list.id,
                            name: list.name,
                            count
                          })
                        }
                      >
                        Delete permanently
                      </Button>
                    </Stack>
                  );
                })}
              </Stack>
            )}
          </Box>
        ) : (
          <Box
            role="tabpanel"
            id="archive-panel-cards"
            aria-labelledby="archive-tab-cards"
            sx={{ mt: 2 }}
          >
            {cards.length === 0 ? (
              <Typography data-testid="archive-empty">
                Nothing archived here yet
              </Typography>
            ) : (
              <Stack spacing={1}>
                {cards.map((card) => {
                  const list = board.lists.find(
                    (item) => item.id === card.listId
                  );
                  const listArchived = !list || list.archived;
                  return (
                    <Stack
                      key={card.id}
                      direction="row"
                      spacing={1}
                      data-testid={`archive-card-${card.id}`}
                      sx={{ alignItems: "center", flexWrap: "wrap" }}
                    >
                      <Typography sx={{ flex: 1, minWidth: 160 }}>
                        <strong>{card.title}</strong> in{" "}
                        {list?.name ?? "a removed list"}
                      </Typography>
                      {listArchived ? (
                        <Typography
                          variant="body2"
                          data-testid={`archive-card-${card.id}-restore-list-first`}
                        >
                          Restore the list first
                        </Typography>
                      ) : (
                        <Button
                          variant="outlined"
                          disabled={locked}
                          data-testid={`archive-card-${card.id}-restore`}
                          aria-label={`Restore card ${card.title}`}
                          onClick={() => report(restoreCard(card.id))}
                        >
                          Restore
                        </Button>
                      )}
                      <Button
                        variant="outlined"
                        color="error"
                        disabled={locked}
                        data-testid={`archive-card-${card.id}-delete`}
                        aria-label={`Delete card ${card.title} permanently`}
                        onClick={() =>
                          setPending({
                            kind: "card",
                            id: card.id,
                            title: card.title
                          })
                        }
                      >
                        Delete permanently
                      </Button>
                    </Stack>
                  );
                })}
              </Stack>
            )}
          </Box>
        )}
      </Box>

      <ConfirmDialog
        open={pending !== null}
        title={
          pending
            ? `Delete '${pending.kind === "list" ? pending.name : pending.title}' permanently?`
            : ""
        }
        message={
          pending?.kind === "list"
            ? `This deletes the list and its ${pending.count} ${cardsWord(pending.count)}. This cannot be undone.`
            : "This deletes 1 card permanently. This cannot be undone."
        }
        confirmLabel={
          pending?.kind === "list" && pending.count === 0
            ? "Delete list"
            : `Delete ${confirmCount} ${cardsWord(confirmCount)}`
        }
        onConfirm={confirmDelete}
        onCancel={() => setPending(null)}
      />

      <UndoSnackbar entry={undoEntry} onUndo={undo} />
    </Box>
  );
}
