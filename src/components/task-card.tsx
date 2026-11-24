"use client";

import { useSortable } from "@dnd-kit/sortable";
import { Box, Card as MuiCard, IconButton, Typography } from "@mui/material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ChecklistIcon from "@mui/icons-material/Checklist";
import CheckIcon from "@mui/icons-material/Check";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import ErrorOutlinedIcon from "@mui/icons-material/ErrorOutlined";
import NotesIcon from "@mui/icons-material/Notes";
import ScheduleIcon from "@mui/icons-material/Schedule";
import { useBoard } from "@/hooks/use-board";
import { dueState } from "@/lib/board-query";
import { labelTextColor } from "@/lib/label-colors";
import type { Card, Label, List } from "@/types/board";

const priorityStyle: Record<Card["priority"], { bg: string; color: string }> = {
  high: { bg: "#c9372c", color: "#ffffff" },
  medium: { bg: "#f2d600", color: "#172b4d" },
  low: { bg: "#1f845a", color: "#ffffff" }
};

function formatDate(date: string) {
  if (!date) return "No due date";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric"
  }).format(new Date(`${date}T00:00:00`));
}

export function focusNeighbour(from: HTMLElement): void {
  const column = from.closest("section");
  const own = from.closest("article");
  if (!column || !own) return;
  const cards = Array.from(column.querySelectorAll<HTMLElement>("article"));
  const index = cards.indexOf(own);
  const target =
    cards[index + 1] ??
    cards[index - 1] ??
    column.querySelector<HTMLElement>('[data-testid$="-add-card"]') ??
    column.querySelector<HTMLElement>('[data-testid$="-button"]');
  target?.focus();
}

export function checklistProgress(card: Card): {
  done: number;
  total: number;
} {
  const items = card.checklists.flatMap((checklist) => checklist.items);
  return {
    done: items.filter((item) => item.checked).length,
    total: items.length
  };
}

export function TaskCard({
  task,
  list,
  lists,
  labels,
  onEditTask,
  dragId
}: {
  task: Card;
  list: List | undefined;
  lists: List[];
  labels: Label[];
  onEditTask: (task: Card) => void;
  dragId?: string;
}) {
  const { deleteCard, moveCard } = useBoard();
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useSortable({
      id: dragId ?? task.id,
      data: { type: "card", cardId: task.id }
    });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;
  const isDone = Boolean(list?.done);
  const listIndex = lists.findIndex((item) => item.id === task.listId);
  const nextList =
    lists.length > 1 && listIndex >= 0
      ? lists[(listIndex + 1) % lists.length]
      : null;
  const state = dueState(task, list);
  const progress = checklistProgress(task);
  const cardLabels = task.labelIds
    .map((id) => labels.find((label) => label.id === id))
    .filter((label): label is Label => Boolean(label));

  function handleCardClick(event: React.MouseEvent<HTMLElement>) {
    if ((event.target as HTMLElement).closest("[data-no-edit]")) return;
    onEditTask(task);
  }

  function handleCardKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (event.target !== event.currentTarget) return;
    if (event.key === "Enter") {
      event.preventDefault();
      onEditTask(task);
    }
  }

  return (
    <MuiCard
      ref={setNodeRef}
      component="article"
      style={style}
      tabIndex={0}
      aria-label={`Card ${task.title}`}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      data-testid={`task-card-${task.id}`}
      elevation={0}
      sx={{
        position: "relative",
        p: (theme) => `${theme.board.cardPadding}px`,
        pl: (theme) => `${theme.board.cardPadding + 4}px`,
        borderRadius: (theme) => `${theme.board.radiusCard}px`,
        bgcolor: (theme) => theme.board.cardSurface,
        color: (theme) => theme.board.textPrimary,
        cursor: "pointer",
        boxShadow: "0 1px 1px rgba(9,30,66,.25), 0 0 0 1px rgba(9,30,66,.08)",
        opacity: isDragging ? 0.6 : 1,
        transition: "box-shadow .15s ease, background-color .15s ease",
        "&:hover": {
          bgcolor: (theme) => theme.board.cardHover,
          boxShadow: (theme) =>
            `0 1px 1px rgba(9,30,66,.25), 0 0 0 2px ${theme.board.ring}`
        },
        "&:focus-visible": {
          outline: (theme) => `2px solid ${theme.board.ring}`,
          outlineOffset: 2
        },
        "&:hover .card-drag-handle": { opacity: 1 },
        "&:focus-within .card-drag-handle": { opacity: 1 }
      }}
    >
      <IconButton
        size="small"
        className="card-drag-handle"
        data-testid={`task-card-${task.id}-drag-handle`}
        data-no-edit="true"
        aria-label={`Drag ${task.title}`}
        onClick={(event) => event.stopPropagation()}
        sx={{
          position: "absolute",
          right: 4,
          top: 4,
          p: 0.25,
          opacity: { xs: 1, md: 0 },
          color: (theme) => theme.board.textSecondary,
          transition: "opacity .15s ease",
          "&:focus-visible": {
            opacity: 1,
            outline: (theme) => `2px solid ${theme.board.ring}`
          },
          "&:hover": { color: (theme) => theme.board.ring }
        }}
        {...attributes}
        {...listeners}
      >
        <DragIndicatorIcon sx={{ fontSize: 18 }} />
      </IconButton>

      {cardLabels.length > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 0.75 }}>
          {cardLabels.map((label) => (
            <Box
              key={label.id}
              component="span"
              data-testid={`task-card-${task.id}-label-${label.id}`}
              sx={{
                bgcolor: label.color,
                color: labelTextColor(label.color),
                fontSize: 11,
                fontWeight: 700,
                lineHeight: "16px",
                px: 1,
                borderRadius: 1,
                maxWidth: "100%",
                overflowWrap: "anywhere"
              }}
            >
              {label.name}
            </Box>
          ))}
        </Box>
      )}

      <Box sx={{ display: "flex", mb: 0.75 }}>
        <Box
          component="span"
          sx={{
            bgcolor: priorityStyle[task.priority].bg,
            color: priorityStyle[task.priority].color,
            fontSize: 11,
            fontWeight: 700,
            lineHeight: "16px",
            px: 1,
            borderRadius: 1,
            textTransform: "capitalize"
          }}
        >
          {task.priority}
        </Box>
      </Box>

      <Typography
        variant="body2"
        className={isDone ? "completed-title" : undefined}
        sx={{
          fontWeight: 500,
          fontSize: 14,
          lineHeight: 1.45,
          pr: 1.5,
          overflowWrap: "anywhere",
          color: (theme) =>
            isDone ? theme.board.textSecondary : theme.board.textPrimary,
          ...(isDone ? { textDecoration: "line-through" } : {})
        }}
      >
        {task.title}
      </Typography>

      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          gap: 0.75,
          mt: 0.75,
          color: (theme) => theme.board.textSecondary
        }}
      >
        <NotesIcon sx={{ fontSize: 15, mt: "2px", flexShrink: 0 }} />
        <Typography
          variant="caption"
          sx={{
            fontSize: 12,
            lineHeight: 1.45,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            overflowWrap: "anywhere"
          }}
        >
          {task.description || "No description added"}
        </Typography>
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mt: 1.25,
          gap: 0.5
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            flexWrap: "wrap",
            minWidth: 0
          }}
        >
          {nextList && (
            <IconButton
              size="small"
              data-testid={`task-card-${task.id}-cycle`}
              data-no-edit="true"
              aria-label={`Mark ${task.title} as ${nextList.name}`}
              onClick={(event) => {
                event.stopPropagation();
                moveCard(task.id, nextList.id);
              }}
              sx={{
                width: 18,
                height: 18,
                border: "2px solid",
                borderColor: isDone ? "#1f845a" : "#8590a2",
                bgcolor: isDone ? "#1f845a" : "transparent",
                color: "#fff",
                transition:
                  "background-color .15s ease, border-color .15s ease",
                "&:hover": { borderColor: "#1f845a" },
                "&:focus-visible": {
                  outline: (theme) => `2px solid ${theme.board.ring}`,
                  outlineOffset: 2
                }
              }}
            >
              {isDone && <CheckIcon sx={{ fontSize: 12 }} />}
            </IconButton>
          )}
          {progress.total > 0 && (
            <Box
              data-testid={`task-card-${task.id}-checklist`}
              aria-label={`Checklist: ${progress.done} of ${progress.total} done`}
              role="img"
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.5,
                color: (theme) => theme.board.textSecondary,
                fontSize: 12
              }}
            >
              <ChecklistIcon sx={{ fontSize: 14 }} />
              <span>
                {progress.done}/{progress.total}
              </span>
            </Box>
          )}
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              color: (theme) => theme.board.textSecondary,
              bgcolor: "rgba(9,30,66,.08)",
              borderRadius: 1,
              px: 0.75,
              height: 20
            }}
          >
            <CalendarMonthIcon sx={{ fontSize: 13 }} />
            <Typography component="span" sx={{ fontSize: 12 }}>
              {formatDate(task.dueDate)}
            </Typography>
          </Box>
          {state !== "none" && (
            <Box
              data-testid={`task-card-${task.id}-due-state`}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.25,
                fontSize: 12,
                fontWeight: 700,
                color: (theme) =>
                  state === "overdue"
                    ? theme.palette.error.main
                    : theme.board.textPrimary
              }}
            >
              {state === "overdue" ? (
                <ErrorOutlinedIcon sx={{ fontSize: 14 }} />
              ) : (
                <ScheduleIcon sx={{ fontSize: 14 }} />
              )}
              <span>{state === "overdue" ? "Overdue" : "Due soon"}</span>
            </Box>
          )}
        </Box>
        <IconButton
          size="small"
          data-testid={`task-card-${task.id}-delete`}
          data-no-edit="true"
          aria-label={`Delete ${task.title}`}
          onClick={(event) => {
            event.stopPropagation();
            focusNeighbour(event.currentTarget);
            deleteCard(task.id);
          }}
          sx={{
            p: 0.25,
            color: (theme) => theme.board.textSecondary,
            "&:hover": { color: (theme) => theme.palette.error.main },
            "&:focus-visible": {
              outline: (theme) => `2px solid ${theme.board.ring}`
            }
          }}
        >
          <DeleteOutlineIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>
    </MuiCard>
  );
}
