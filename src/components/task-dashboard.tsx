"use client";

import { useMemo, useRef, useState } from "react";
import { Box, Drawer, Typography } from "@mui/material";
import { BannerStack } from "@/components/banner-stack";
import { BoardsMenu } from "@/components/boards-menu";
import { CardDialog } from "@/components/card-dialog";
import { CommandMenu, type Command } from "@/components/command-menu";
import {
  EMPTY_VIEW,
  FilterPanel,
  viewActiveCount,
  type BoardView
} from "@/components/filter-panel";
import {
  ImportExportDialog,
  type ImportExportHandle
} from "@/components/import-export-dialog";
import { KanbanBoard } from "@/components/kanban-board";
import { RulesDialog } from "@/components/rules-dialog";
import { ShortcutHelp } from "@/components/shortcut-help";
import { SwimlaneView } from "@/components/swimlane-view";
import { TopBar } from "@/components/top-bar";
import { UndoSnackbar } from "@/components/undo-snackbar";
import { ArchiveView } from "@/components/archive-view";
import { SettingsPage } from "@/components/settings-page";
import { useBoard } from "@/hooks/use-board";
import { useHotkeys } from "@/hooks/use-hotkeys";
import { checkLimits } from "@/lib/board-ops";
import { activeCards, activeLists, filterCards } from "@/lib/board-query";
import { getBackground } from "@/lib/theme-presets";
import type { Card } from "@/types/board";

interface DialogState {
  open: boolean;
  card: Card | null;
  listId: string;
}

const visuallyHidden = {
  position: "absolute",
  width: 1,
  height: 1,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap"
} as const;

export function TaskDashboard() {
  const {
    data,
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
    resetSavedData
  } = useBoard();
  const [query, setQuery] = useState("");
  const [view, setView] = useState<BoardView>(EMPTY_VIEW);
  const [filterAnchor, setFilterAnchor] = useState<HTMLElement | null>(null);
  const [boardsAnchor, setBoardsAnchor] = useState<HTMLElement | null>(null);
  const [commandsOpen, setCommandsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [dialog, setDialog] = useState<DialogState>({
    open: false,
    card: null,
    listId: ""
  });
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const boardsButtonRef = useRef<HTMLButtonElement | null>(null);
  const transferRef = useRef<ImportExportHandle>(null);
  const mainRef = useRef<HTMLElement | null>(null);

  const lists = useMemo(() => activeLists(board), [board]);
  const fullView = useMemo<BoardView>(
    () => ({ ...view, filter: { ...view.filter, text: query } }),
    [view, query]
  );
  const matchCount = useMemo(
    () => filterCards(activeCards(board), fullView.filter, lists).length,
    [board, fullView, lists]
  );
  const background = getBackground(
    board.backgroundId,
    data.settings.customBackgroundStart,
    data.settings.customBackgroundEnd
  );
  const limits = useMemo(() => checkLimits(data), [data]);
  const canAdd = !dataError && lists.length > 0;
  const filtering = viewActiveCount(view) > 0 || query.trim() !== "";

  function openCreate(listId?: string) {
    const target = listId ?? lists[0]?.id;
    if (!target) return;
    setDialog({ open: true, card: null, listId: target });
  }

  function openEdit(card: Card) {
    setDialog({ open: true, card, listId: card.listId });
  }

  function closeDialog() {
    setDialog((current) => ({ ...current, open: false }));
  }

  function restoreFocusIfLost() {
    setTimeout(() => {
      if (document.activeElement === document.body) mainRef.current?.focus();
    }, 0);
  }

  function newList() {
    document
      .querySelector<HTMLElement>('[data-testid="add-list-tile"]')
      ?.click();
  }

  function focusSearch() {
    searchRef.current?.focus();
  }

  function openBoardsMenu() {
    const button = boardsButtonRef.current;
    if (!button) return;
    button.focus();
    setBoardsAnchor(button);
  }

  function toggleFilters() {
    if (filterAnchor) {
      setFilterAnchor(null);
      return;
    }
    const button = document.querySelector<HTMLElement>(
      '[data-testid="top-bar-filter"], [data-testid="top-bar-menu-button"]'
    );
    if (button) setFilterAnchor(button);
  }

  const commands: Command[] = [
    {
      id: "new-card",
      label: "New card",
      shortcut: "N",
      disabled: !canAdd,
      run: () => openCreate()
    },
    { id: "new-list", label: "New list", shortcut: "L", run: newList },
    {
      id: "focus-search",
      label: "Go to search",
      shortcut: "/",
      run: focusSearch
    },
    {
      id: "switch-board",
      label: "Switch board",
      shortcut: "B",
      run: openBoardsMenu
    },
    {
      id: "open-settings",
      label: "Open settings",
      run: () => setSettingsOpen(true)
    },
    {
      id: "open-archive",
      label: "Open archive",
      run: () => setArchiveOpen(true)
    },
    { id: "toggle-filters", label: "Toggle filters panel", run: toggleFilters },
    {
      id: "export-board",
      label: "Export this board",
      run: () => transferRef.current?.exportBoard()
    },
    {
      id: "import-board",
      label: "Import a board",
      run: () => transferRef.current?.startImport()
    },
    {
      id: "open-rules",
      label: "Open rules for this board",
      run: () => setRulesOpen(true)
    },
    {
      id: "keyboard-shortcuts",
      label: "Show keyboard shortcuts",
      shortcut: "?",
      run: () => setHelpOpen(true)
    }
  ];

  useHotkeys(
    {
      n: canAdd ? () => openCreate() : undefined,
      l: newList,
      "/": focusSearch,
      b: openBoardsMenu,
      "?": () => setHelpOpen(true),
      "mod+k": () => setCommandsOpen(true)
    },
    isReady
  );

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: background.css,
        color: background.textColor,
        overflow: "hidden"
      }}
    >
      <Box
        component="a"
        href="#board-main"
        data-testid="skip-link"
        onClick={(event: React.MouseEvent) => {
          event.preventDefault();
          mainRef.current?.focus();
        }}
        sx={{
          ...visuallyHidden,
          "&:focus": {
            position: "fixed",
            top: 8,
            left: 8,
            zIndex: 2000,
            width: "auto",
            height: "auto",
            clip: "auto",
            p: 1.5,
            bgcolor: "#fff",
            color: "#172b4d",
            fontWeight: 700,
            borderRadius: 1,
            outline: "2px solid #0c66e4"
          }
        }}
      >
        Skip to board
      </Box>

      <TopBar
        boardName={board.name}
        query={query}
        onQueryChange={setQuery}
        activeFilterCount={viewActiveCount(view)}
        onOpenFilters={setFilterAnchor}
        onNewTask={() => openCreate()}
        newTaskDisabled={!canAdd}
        searchInputRef={searchRef}
        onOpenCommands={() => setCommandsOpen(true)}
        boardsMenu={
          <BoardsMenu
            anchorEl={boardsAnchor}
            onOpen={setBoardsAnchor}
            onClose={() => setBoardsAnchor(null)}
            buttonRef={boardsButtonRef}
            onExport={() => transferRef.current?.exportBoard()}
            onImport={() => transferRef.current?.startImport()}
            onOpenRules={() => setRulesOpen(true)}
            onOpenArchive={() => setArchiveOpen(true)}
          />
        }
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <BannerStack
        dataError={dataError}
        saveError={saveError}
        notice={notice}
        limits={limits}
        onDismissSaveError={dismissSaveError}
        onDismissNotice={dismissNotice}
        onBackupData={backupSavedData}
        onResetData={resetSavedData}
      />

      <Box
        component="main"
        id="board-main"
        tabIndex={-1}
        ref={mainRef}
        sx={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          outline: "none"
        }}
      >
        {fullView.swimlane ? (
          <SwimlaneView board={board} view={fullView} onEditTask={openEdit} />
        ) : (
          <KanbanBoard
            board={board}
            view={fullView}
            disabled={Boolean(dataError)}
            onEditTask={openEdit}
            onAddCard={canAdd ? openCreate : undefined}
          />
        )}
      </Box>

      <FilterPanel
        anchorEl={filterAnchor}
        onClose={() => setFilterAnchor(null)}
        labels={board.labels}
        view={view}
        onChange={setView}
        matchCount={matchCount}
      />

      <CardDialog
        open={dialog.open}
        card={dialog.card}
        listId={dialog.listId}
        onClose={closeDialog}
        onExited={restoreFocusIfLost}
      />

      <CommandMenu
        open={commandsOpen}
        onClose={() => setCommandsOpen(false)}
        commands={commands}
      />
      <ShortcutHelp open={helpOpen} onClose={() => setHelpOpen(false)} />
      <RulesDialog
        open={rulesOpen}
        onClose={() => setRulesOpen(false)}
        onExited={() => boardsButtonRef.current?.focus()}
      />
      <ImportExportDialog ref={transferRef} />

      <UndoSnackbar entry={undoEntry} onUndo={undo} />

      <Drawer
        anchor="right"
        open={archiveOpen}
        onClose={() => setArchiveOpen(false)}
        ModalProps={{ keepMounted: false }}
        sx={{
          "& .MuiDrawer-paper": {
            width: { xs: "100%", sm: 420 },
            height: "100vh",
            bgcolor: "background.paper",
            boxShadow: "-12px 0 32px rgba(9,30,66,.18)",
            overflow: "hidden"
          }
        }}
      >
        <ArchiveView embedded onClose={() => setArchiveOpen(false)} />
      </Drawer>

      <Drawer
        anchor="right"
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        ModalProps={{ keepMounted: false }}
        sx={{
          "& .MuiDrawer-paper": {
            width: { xs: "100%", md: 520 },
            height: "100vh",
            bgcolor: "background.paper",
            boxShadow: "-12px 0 32px rgba(9,30,66,.18)",
            overflow: "hidden"
          }
        }}
      >
        <SettingsPage embedded onClose={() => setSettingsOpen(false)} />
      </Drawer>
    </Box>
  );
}

function StatPill({
  label,
  value,
  testId
}: {
  label: string;
  value: number;
  testId?: string;
}) {
  return (
    <Box
      data-testid={testId ?? "count-pill-total"}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 1,
        bgcolor: "rgba(0,0,0,.32)",
        color: "#fff",
        borderRadius: 1.5,
        px: 1.5,
        height: 30
      }}
    >
      <Typography component="span" sx={{ fontSize: 13 }}>
        {label}
      </Typography>
      <Typography
        component="span"
        data-testid="count-pill-value"
        sx={{ fontSize: 13, fontWeight: 800 }}
      >
        {value}
      </Typography>
    </Box>
  );
}
