"use client";

import { useMemo } from "react";
import { Box, Typography } from "@mui/material";
import { SWIMLANE_LABELS, type BoardView } from "@/components/filter-panel";
import {
  activeCards,
  activeLists,
  filterCards,
  sortCards,
  swimlanes
} from "@/lib/board-query";
import { labelTextColor } from "@/lib/label-colors";
import type { Board, Card } from "@/types/board";

export function SwimlaneView({
  board,
  view,
  onEditTask
}: {
  board: Board;
  view: BoardView;
  onEditTask: (task: Card) => void;
}) {
  const lists = useMemo(() => activeLists(board), [board]);
  const bands = useMemo(() => {
    if (!view.swimlane) return [];
    const filtered = sortCards(
      filterCards(activeCards(board), view.filter, lists),
      view.sort
    );
    return swimlanes(board, view.swimlane, filtered);
  }, [board, view.filter, view.sort, view.swimlane, lists]);

  if (!view.swimlane) return null;

  const bandCount = bands.reduce(
    (sum, band) =>
      sum + band.lists.reduce((inner, cell) => inner + cell.cards.length, 0),
    0
  );

  return (
    <Box
      data-testid="swimlane-view"
      sx={{ flex: 1, minHeight: 0, overflow: "auto", px: 2, pb: 2 }}
    >
      <Typography
        role="status"
        aria-live="polite"
        data-testid="swimlane-status"
        sx={{ color: "#fff", fontSize: 13, mb: 1 }}
      >
        Swimlanes by {SWIMLANE_LABELS[view.swimlane]}: {bandCount}{" "}
        {bandCount === 1 ? "card" : "cards"} shown
      </Typography>
      {bands.length === 0 && (
        <Typography
          data-testid="swimlane-empty"
          sx={{ color: "#fff", fontSize: 14 }}
        >
          No matching cards
        </Typography>
      )}
      {bands.map((band) => (
        <Box
          component="section"
          key={band.key}
          aria-label={`${band.title} band`}
          data-testid={`swimlane-band-${band.key}`}
          sx={{
            mb: 1.5,
            borderRadius: (theme) => `${theme.board.radiusList}px`,
            bgcolor: (theme) => theme.board.listSurface,
            color: (theme) => theme.board.textPrimary,
            p: 1.5
          }}
        >
          <Typography component="h2" sx={{ fontSize: 14, fontWeight: 700 }}>
            {band.title}
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridAutoFlow: "column",
              gridAutoColumns: "minmax(220px, 1fr)",
              gap: 1.5,
              mt: 1,
              overflowX: "auto"
            }}
          >
            {band.lists.map((cell) => {
              const list = lists.find((item) => item.id === cell.listId);
              return (
                <Box
                  key={cell.listId}
                  data-testid={`swimlane-cell-${band.key}-${cell.listId}`}
                >
                  <Typography
                    component="h3"
                    sx={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: (theme) => theme.board.textSecondary,
                      mb: 0.5
                    }}
                  >
                    {list?.name ?? "List"} ({cell.cards.length})
                  </Typography>
                  <Box
                    component="ul"
                    sx={{
                      listStyle: "none",
                      m: 0,
                      p: 0,
                      display: "grid",
                      gap: 0.75
                    }}
                  >
                    {cell.cards.map((card) => (
                      <li key={card.id}>
                        <Box
                          component="button"
                          type="button"
                          data-testid={`swimlane-card-${band.key}-${card.id}`}
                          aria-label={`Edit card ${card.title}`}
                          onClick={() => onEditTask(card)}
                          sx={{
                            width: "100%",
                            textAlign: "left",
                            border: 0,
                            cursor: "pointer",
                            p: 1,
                            borderRadius: (theme) =>
                              `${theme.board.radiusCard}px`,
                            bgcolor: (theme) => theme.board.cardSurface,
                            color: (theme) => theme.board.textPrimary,
                            font: "inherit",
                            fontSize: 13,
                            "&:focus-visible": {
                              outline: (theme) =>
                                `2px solid ${theme.board.ring}`
                            }
                          }}
                        >
                          <Box component="span" sx={{ fontWeight: 700 }}>
                            {card.title}
                          </Box>
                          <Box
                            component="span"
                            sx={{ display: "block", fontSize: 12 }}
                          >
                            {card.priority} priority
                          </Box>
                          <Box
                            component="span"
                            sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}
                          >
                            {card.labelIds.map((id) => {
                              const label = board.labels.find(
                                (item) => item.id === id
                              );
                              return label ? (
                                <Box
                                  component="span"
                                  key={id}
                                  sx={{
                                    bgcolor: label.color,
                                    color: labelTextColor(label.color),
                                    px: 0.75,
                                    borderRadius: 1,
                                    fontSize: 12,
                                    fontWeight: 700
                                  }}
                                >
                                  {label.name}
                                </Box>
                              ) : null;
                            })}
                          </Box>
                        </Box>
                      </li>
                    ))}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
