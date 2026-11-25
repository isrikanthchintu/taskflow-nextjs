"use client";

import { useMemo, useState } from "react";
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent
} from "@dnd-kit/core";
import {
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates
} from "@dnd-kit/sortable";
import {
  Box,
  Button,
  Card as MuiCard,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import ViewListIcon from "@mui/icons-material/ViewList";
import AddIcon from "@mui/icons-material/Add";
import {
  baseCardId,
  columnDroppableId,
  KanbanColumn,
  listSortableId
} from "@/components/kanban-column";
import {
  GROUP_LABELS,
  SORT_LABELS,
  type BoardView
} from "@/components/filter-panel";
import { useBoard } from "@/hooks/use-board";
import { LIMITS } from "@/lib/board-ops";
import {
  activeCards,
  activeLists,
  filterCards,
  groupCards,
  sortCards
} from "@/lib/board-query";
import type { Board, Card } from "@/types/board";

export type DragColumns = Record<string, string[]>;

export type DragOutcome =
  | { kind: "move"; id: string; listId: string }
  | { kind: "reorder"; id: string; newIndex: number }
  | { kind: "none" };

function columnIdToListId(id: string, columns: DragColumns): string | null {
  return (
    Object.keys(columns).find((listId) => columnDroppableId(listId) === id) ??
    null
  );
}

function computeInsertionIndex(params: {
  activeId: string;
  overCardId: string;
  fullGroupWithoutActive: string[];
  visibleGroup: string[];
}): number {
  const { activeId, overCardId, fullGroupWithoutActive, visibleGroup } = params;
  const anchorIndex = fullGroupWithoutActive.indexOf(overCardId);
  if (anchorIndex === -1) return fullGroupWithoutActive.length;

  const activeVisibleIndex = visibleGroup.indexOf(activeId);
  const overVisibleIndex = visibleGroup.indexOf(overCardId);
  const movingForward =
    activeVisibleIndex !== -1 && overVisibleIndex !== -1
      ? activeVisibleIndex < overVisibleIndex
      : true;

  return movingForward ? anchorIndex + 1 : anchorIndex;
}

export function resolveDragOutcome(params: {
  activeId: string;
  overId: string | null;
  sourceListId: string;
  fullColumns: DragColumns;
  visibleColumns: DragColumns;
  reorderEnabled?: boolean;
}): DragOutcome {
  const {
    activeId,
    overId,
    sourceListId,
    fullColumns,
    visibleColumns,
    reorderEnabled = true
  } = params;

  if (!overId || overId === activeId) return { kind: "none" };

  const columnTargetId = columnIdToListId(overId, fullColumns);
  const targetListId =
    columnTargetId ??
    Object.keys(fullColumns).find((listId) =>
      fullColumns[listId].includes(overId)
    ) ??
    null;
  if (!targetListId) return { kind: "none" };

  if (targetListId !== sourceListId) {
    return { kind: "move", id: activeId, listId: targetListId };
  }

  if (!reorderEnabled) return { kind: "none" };

  const fullGroup = fullColumns[targetListId];
  const originalIndex = fullGroup.indexOf(activeId);
  if (originalIndex === -1) return { kind: "none" };

  const fullGroupWithoutActive = fullGroup.filter((id) => id !== activeId);
  const overCardId = columnTargetId ? null : overId;
  const newIndex =
    overCardId === null
      ? fullGroupWithoutActive.length
      : computeInsertionIndex({
          activeId,
          overCardId,
          fullGroupWithoutActive,
          visibleGroup: visibleColumns[targetListId] ?? []
        });

  if (newIndex === originalIndex) return { kind: "none" };

  return { kind: "reorder", id: activeId, newIndex };
}

const collisionDetection: CollisionDetection = (args) => {
  const isList = args.active.data.current?.type === "list";
  const containers = args.droppableContainers.filter((container) =>
    isList
      ? container.data.current?.type === "list"
      : container.data.current?.type !== "list"
  );
  return closestCenter({ ...args, droppableContainers: containers });
};

function AddListTile({
  disabled,
  limitReached
}: {
  disabled: boolean;
  limitReached: boolean;
}) {
  const { addList } = useBoard();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = addList(name);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setName("");
    setError(null);
    setOpen(false);
  }

  function cancel() {
    setName("");
    setError(null);
    setOpen(false);
  }

  if (!open) {
    return (
      <Button
        data-testid="add-list-tile"
        disabled={disabled || limitReached}
        startIcon={<AddIcon />}
        onClick={() => setOpen(true)}
        sx={{
          flex: "0 0 auto",
          width: 284,
          justifyContent: "flex-start",
          color: "#fff",
          bgcolor: "rgba(255,255,255,.24)",
          px: 2,
          py: 1.25,
          "&:hover": { bgcolor: "rgba(255,255,255,.34)", transform: "none" },
          "&.Mui-disabled": { color: "#fff", opacity: 0.8 }
        }}
      >
        {limitReached ? `List limit reached (${LIMITS.lists})` : "Add a list"}
      </Button>
    );
  }

  return (
    <MuiCard
      component="form"
      onSubmit={submit}
      elevation={0}
      sx={{
        flex: "0 0 auto",
        width: 284,
        p: 1.5,
        bgcolor: (theme) => theme.board.listSurface,
        borderRadius: (theme) => `${theme.board.radiusList}px`
      }}
    >
      <TextField
        autoFocus
        fullWidth
        size="small"
        label="List name"
        value={name}
        error={Boolean(error)}
        helperText={error ?? " "}
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") cancel();
        }}
      />
      <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
        <Button variant="text" color="inherit" onClick={cancel}>
          Cancel
        </Button>
        <Button type="submit" variant="contained">
          Add list
        </Button>
      </Stack>
    </MuiCard>
  );
}

export function KanbanBoard({
  board,
  view,
  disabled = false,
  onEditTask,
  onAddCard
}: {
  board: Board;
  view: BoardView;
  disabled?: boolean;
  onEditTask: (task: Card) => void;
  onAddCard?: (listId: string) => void;
}) {
  const { moveCard, reorderCard, reorderList } = useBoard();
  const [dragTitle, setDragTitle] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const lists = useMemo(() => activeLists(board), [board]);
  const cards = useMemo(() => activeCards(board), [board]);
  const cardsById = useMemo(
    () => new Map(cards.map((card) => [card.id, card])),
    [cards]
  );
  const reorderEnabled = !view.sort && !view.group;

  const fullColumns = useMemo<DragColumns>(() => {
    const columns: DragColumns = {};
    lists.forEach((list) => {
      columns[list.id] = cards
        .filter((card) => card.listId === list.id)
        .map((card) => card.id);
    });
    return columns;
  }, [lists, cards]);

  const visible = useMemo(() => {
    const filtered = filterCards(cards, view.filter, lists);
    const perList = new Map<string, Card[]>();
    lists.forEach((list) => {
      const inList = filtered.filter((card) => card.listId === list.id);
      perList.set(list.id, sortCards(inList, view.sort));
    });
    return perList;
  }, [cards, lists, view.filter, view.sort]);

  const visibleColumns = useMemo<DragColumns>(() => {
    const columns: DragColumns = {};
    lists.forEach((list) => {
      columns[list.id] = (visible.get(list.id) ?? []).map((card) => card.id);
    });
    return columns;
  }, [lists, visible]);

  let reorderNote: string | null = null;
  if (view.sort)
    reorderNote = `Sorted by ${SORT_LABELS[view.sort.key]}: reordering is off`;
  else if (view.group)
    reorderNote = `Grouped by ${GROUP_LABELS[view.group]}: reordering is off`;

  function handleDragStart(event: DragStartEvent) {
    const type = event.active.data.current?.type;
    if (type === "list") {
      const listId = String(event.active.data.current?.listId);
      setDragTitle(lists.find((list) => list.id === listId)?.name ?? null);
      return;
    }
    const card = cardsById.get(baseCardId(String(event.active.id)));
    setDragTitle(card?.title ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setDragTitle(null);
    const type = event.active.data.current?.type;

    if (type === "list") {
      const activeListId = String(event.active.data.current?.listId);
      const overListId = event.over?.data.current?.listId;
      if (typeof overListId !== "string" || overListId === activeListId) return;
      const newIndex = lists.findIndex((list) => list.id === overListId);
      if (newIndex >= 0) reorderList(activeListId, newIndex);
      return;
    }

    const activeId = baseCardId(String(event.active.id));
    const sourceCard = cardsById.get(activeId);
    if (!sourceCard) return;
    const overId = event.over ? baseCardId(String(event.over.id)) : null;
    const outcome = resolveDragOutcome({
      activeId,
      overId,
      sourceListId: sourceCard.listId,
      fullColumns,
      visibleColumns,
      reorderEnabled
    });

    if (outcome.kind === "move") moveCard(outcome.id, outcome.listId);
    if (outcome.kind === "reorder") reorderCard(outcome.id, outcome.newIndex);
  }

  if (lists.length === 0) {
    return (
      <Box
        data-testid="board-empty"
        sx={{
          flex: 1,
          display: "grid",
          placeItems: "center",
          color: "#fff",
          textAlign: "center",
          px: 2
        }}
      >
        <Stack spacing={1.5} sx={{ alignItems: "center" }}>
          <ViewListIcon sx={{ fontSize: 36 }} aria-hidden="true" />
          <Typography component="p" sx={{ fontSize: 18, fontWeight: 700 }}>
            This board has no lists yet
          </Typography>
          <Typography sx={{ fontSize: 14 }}>
            Lists are the stages your cards move through.
          </Typography>
          <AddListTile disabled={disabled} limitReached={false} />
        </Stack>
      </Box>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setDragTitle(null)}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          gap: 2,
          flex: 1,
          minHeight: 0,
          overflowX: "auto",
          overflowY: "hidden",
          px: 2,
          pb: 2,
          pt: 2
        }}
      >
        <SortableContext
          items={lists.map((list) => listSortableId(list.id))}
          strategy={horizontalListSortingStrategy}
        >
          {lists.map((list, index) => {
            const listVisible = visible.get(list.id) ?? [];
            return (
              <KanbanColumn
                key={list.id}
                list={list}
                index={index}
                listCount={lists.length}
                totalCount={fullColumns[list.id].length}
                cards={listVisible}
                groups={
                  view.group
                    ? groupCards(listVisible, view.group, board.labels, lists)
                    : null
                }
                lists={lists}
                labels={board.labels}
                reorderNote={reorderNote}
                disabled={disabled}
                onEditTask={onEditTask}
                onAddCard={onAddCard}
              />
            );
          })}
        </SortableContext>
        <AddListTile
          disabled={disabled}
          limitReached={lists.length >= LIMITS.lists}
        />
      </Box>
      <DragOverlay
        dropAnimation={{ duration: 200, easing: "cubic-bezier(.2,.9,.3,1.3)" }}
      >
        {dragTitle && (
          <MuiCard
            elevation={6}
            sx={{
              p: 1.25,
              pl: 1.75,
              borderRadius: 2,
              rotate: "3deg",
              cursor: "grabbing",
              width: 260
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {dragTitle}
            </Typography>
          </MuiCard>
        )}
      </DragOverlay>
    </DndContext>
  );
}
