"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import {
  Box,
  Button,
  IconButton,
  Paper,
  Stack,
  Typography
} from "@mui/material";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { Plus, TriangleAlert } from "lucide-react";
import { ListMenu } from "@/components/list-menu";
import { TaskCard } from "@/components/task-card";
import type { CardGroup } from "@/lib/board-query";
import type { Card, Label, List } from "@/types/board";

export const COLUMN_WIDTH = 284;
const DUPLICATE_SEPARATOR = "::";

export function columnDroppableId(listId: string): string {
  return `column-${listId}`;
}

export function listSortableId(listId: string): string {
  return `list-${listId}`;
}

export function baseCardId(dragId: string): string {
  return dragId.split(DUPLICATE_SEPARATOR)[0];
}

interface Entry {
  dragId: string;
  card: Card;
}

interface Section {
  key: string;
  title: string | null;
  entries: Entry[];
}

function buildSections(cards: Card[], groups: CardGroup[] | null): Section[] {
  if (!groups)
    return [
      {
        key: "all",
        title: null,
        entries: cards.map((card) => ({ dragId: card.id, card }))
      }
    ];
  const seen = new Set<string>();
  return groups.map((group) => ({
    key: group.key,
    title: group.title,
    entries: group.cards.map((card) => {
      const dragId = seen.has(card.id)
        ? `${card.id}${DUPLICATE_SEPARATOR}${group.key}`
        : card.id;
      seen.add(card.id);
      return { dragId, card };
    })
  }));
}

export function KanbanColumn({
  list,
  index,
  listCount,
  totalCount,
  cards,
  groups = null,
  lists,
  labels,
  reorderNote = null,
  disabled = false,
  onEditTask,
  onAddCard
}: {
  list: List;
  index: number;
  listCount: number;
  totalCount: number;
  cards: Card[];
  groups?: CardGroup[] | null;
  lists: List[];
  labels: Label[];
  reorderNote?: string | null;
  disabled?: boolean;
  onEditTask: (task: Card) => void;
  onAddCard?: (listId: string) => void;
}) {
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: columnDroppableId(list.id),
    data: { type: "column", listId: list.id }
  });
  const {
    attributes,
    listeners,
    setNodeRef: setSortRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: listSortableId(list.id),
    data: { type: "list", listId: list.id }
  });

  const sections = buildSections(cards, groups);
  const entries = sections.flatMap((section) => section.entries);
  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    transition
  };
  const cardWord = totalCount === 1 ? "card" : "cards";
  const isOverLimit = list.limit !== null && totalCount > list.limit;
  const limitText =
    list.limit === null
      ? ""
      : isOverLimit
        ? `Over limit: ${totalCount} of ${list.limit}`
        : `Limit: ${list.limit}`;

  function renderCard(entry: Entry) {
    return (
      <TaskCard
        key={entry.dragId}
        task={entry.card}
        list={list}
        lists={lists}
        labels={labels}
        dragId={entry.dragId}
        onEditTask={onEditTask}
      />
    );
  }

  return (
    <Paper
      ref={setSortRef}
      style={style}
      component="section"
      elevation={0}
      data-testid={`kanban-column-${list.id}`}
      aria-label={`${list.name} list`}
      sx={{
        width: COLUMN_WIDTH,
        flex: `0 0 ${COLUMN_WIDTH}px`,
        bgcolor: (theme) => theme.board.listSurface,
        color: (theme) => theme.board.textPrimary,
        borderRadius: (theme) => `${theme.board.radiusList}px`,
        display: "flex",
        flexDirection: "column",
        maxHeight: "100%",
        opacity: isDragging ? 0.6 : 1,
        boxShadow: (theme) =>
          isOver
            ? `0 0 0 3px ${theme.board.ring}`
            : "0 1px 1px rgba(9,30,66,.25)",
        transition: "box-shadow .2s ease"
      }}
    >
      <Stack
        direction="row"
        sx={{
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          minHeight: (theme) => theme.board.listHeaderHeight,
          pt: 0.5,
          pb: 0.5
        }}
      >
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: "center", minWidth: 0 }}
        >
          <IconButton
            size="small"
            data-testid={`kanban-column-${list.id}-drag-handle`}
            aria-label={`Drag list ${list.name}`}
            sx={{
              p: 0.25,
              color: (theme) => theme.board.textSecondary,
              "&:focus-visible": {
                outline: (theme) => `2px solid ${theme.board.ring}`
              }
            }}
            {...attributes}
            {...listeners}
          >
            <DragIndicatorIcon sx={{ fontSize: 18 }} />
          </IconButton>
          <Typography
            component="h2"
            sx={{
              fontSize: 14,
              fontWeight: 700,
              color: (theme) => theme.board.textPrimary,
              overflowWrap: "anywhere"
            }}
          >
            {list.name}
          </Typography>
          <Typography
            data-testid={`kanban-column-${list.id}-count`}
            aria-label={`${totalCount} ${cardWord}`}
            sx={{
              fontSize: 13,
              fontWeight: 600,
              color: (theme) => theme.board.textSecondary
            }}
          >
            {totalCount}
          </Typography>
        </Stack>
        <ListMenu list={list} index={index} listCount={listCount} />
      </Stack>
      <Box
        role="status"
        aria-live="polite"
        data-testid={`kanban-column-${list.id}-limit-status`}
        sx={{ px: 2, pb: limitText ? 0.5 : 0 }}
      >
        {limitText && (
          <Stack
            direction="row"
            spacing={0.5}
            data-testid={
              isOverLimit ? `kanban-column-${list.id}-over-limit` : undefined
            }
            sx={{
              alignItems: "center",
              fontSize: 12,
              fontWeight: isOverLimit ? 700 : 500,
              color: (theme) =>
                isOverLimit
                  ? theme.palette.error.main
                  : theme.board.textSecondary
            }}
          >
            {isOverLimit && <TriangleAlert size={14} aria-hidden="true" />}
            <span>{limitText}</span>
          </Stack>
        )}
      </Box>
      {reorderNote && (
        <Typography
          variant="caption"
          data-testid={`kanban-column-${list.id}-note`}
          sx={{
            px: 2,
            pb: 0.5,
            color: (theme) => theme.board.textSecondary
          }}
        >
          {reorderNote}
        </Typography>
      )}
      <Box
        ref={setDropRef}
        sx={{
          flex: "1 1 auto",
          overflowY: "auto",
          px: 1,
          pb: 0.5,
          minHeight: 12
        }}
      >
        <SortableContext
          items={entries.map((entry) => entry.dragId)}
          strategy={verticalListSortingStrategy}
        >
          {entries.length === 0 ? (
            <Typography
              variant="caption"
              data-testid={`kanban-column-${list.id}-empty`}
              sx={{
                display: "block",
                textAlign: "center",
                color: (theme) => theme.board.textSecondary,
                py: 2
              }}
            >
              {totalCount === 0 ? "No cards yet" : "No matching cards"}
            </Typography>
          ) : (
            <Stack spacing={groups ? 1.5 : 0}>
              {sections.map((section) => (
                <Box key={section.key}>
                  {section.title !== null && (
                    <Typography
                      component="h3"
                      sx={{
                        fontSize: 12,
                        fontWeight: 700,
                        mb: 0.5,
                        color: (theme) => theme.board.textSecondary
                      }}
                    >
                      {section.title} ({section.entries.length})
                    </Typography>
                  )}
                  <Stack sx={{ gap: (theme) => `${theme.board.cardGap}px` }}>
                    {section.entries.map(renderCard)}
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </SortableContext>
      </Box>
      {onAddCard && (
        <Box sx={{ px: 1, pb: 1, pt: 0.5 }}>
          <Button
            fullWidth
            disabled={disabled}
            data-testid={`kanban-column-${list.id}-add-card`}
            startIcon={<Plus size={16} />}
            onClick={() => onAddCard(list.id)}
            sx={{
              justifyContent: "flex-start",
              color: (theme) => theme.board.textSecondary,
              fontWeight: 500,
              fontSize: 14,
              px: 1.25,
              py: 0.75,
              "&:hover": { bgcolor: "rgba(9,30,66,.14)", transform: "none" }
            }}
          >
            Add a card
          </Button>
        </Box>
      )}
    </Paper>
  );
}
