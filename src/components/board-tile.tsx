"use client";

import Link from "next/link";
import {
  Box,
  ButtonBase,
  IconButton,
  Skeleton,
  Typography
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import StarIcon from "@mui/icons-material/Star";
import { boardPath } from "@/lib/home-model";
import { getBackground } from "@/lib/theme-presets";
import type { Board, Settings } from "@/types/board";

export const TILE_WIDTH = 220;
export const TILE_HEIGHT = 104;
export const THUMB_HEIGHT = 72;

export const tileGridSx = {
  display: "grid",
  gap: 2,
  gridTemplateColumns: {
    xs: "repeat(2, minmax(0, 1fr))",
    sm: `repeat(auto-fill, ${TILE_WIDTH}px)`
  }
} as const;

const tileSize = {
  width: { xs: "100%", sm: TILE_WIDTH },
  height: TILE_HEIGHT
} as const;

export function BoardTile({
  board,
  settings,
  favorite = false,
  onToggleFavorite
}: {
  board: Board;
  settings: Pick<Settings, "customBackgroundStart" | "customBackgroundEnd">;
  favorite?: boolean;
  onToggleFavorite?: (boardId: string) => void;
}) {
  const background = getBackground(
    board.backgroundId,
    settings.customBackgroundStart,
    settings.customBackgroundEnd
  );

  return (
    <Box
      data-testid="board-tile"
      sx={{
        ...tileSize,
        position: "relative",
        borderRadius: 1.5,
        overflow: "hidden",
        border: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
        "&:hover .tile-thumb::after, &:focus-within .tile-thumb::after": {
          opacity: 1
        },
        "&:hover .tile-star, &:focus-within .tile-star": { opacity: 1 }
      }}
    >
      <Box
        component={Link}
        href={boardPath(board)}
        data-testid="board-tile-link"
        sx={{
          display: "block",
          width: "100%",
          height: "100%",
          color: "text.primary",
          textDecoration: "none",
          "&:focus-visible": {
            outline: "2px solid",
            outlineColor: "primary.main",
            outlineOffset: -2
          }
        }}
      >
        <Box
          className="tile-thumb"
          data-testid="board-tile-thumb"
          sx={{
            height: THUMB_HEIGHT,
            background: background.css,
            position: "relative",
            "&::after": {
              content: '""',
              position: "absolute",
              inset: 0,
              bgcolor: "rgba(0,0,0,.28)",
              opacity: 0,
              transition: "opacity 120ms"
            }
          }}
        />
        <Box
          sx={{
            height: TILE_HEIGHT - THUMB_HEIGHT - 2,
            px: 1.5,
            display: "flex",
            alignItems: "center"
          }}
        >
          <Typography noWrap sx={{ fontSize: 14, fontWeight: 600 }}>
            {board.name}
          </Typography>
        </Box>
      </Box>
      {onToggleFavorite && (
        <IconButton
          className="tile-star"
          size="small"
          aria-label={favorite ? `Unstar ${board.name}` : `Star ${board.name}`}
          aria-pressed={favorite}
          data-testid="board-tile-star"
          onClick={() => onToggleFavorite(board.id)}
          sx={{
            position: "absolute",
            top: 4,
            right: 4,
            color: favorite ? "#f5c542" : "#fff",
            bgcolor: "rgba(0,0,0,.35)",
            opacity: favorite ? 1 : 0,
            "&:hover": { bgcolor: "rgba(0,0,0,.55)" },
            "&:focus-visible": {
              opacity: 1,
              outline: "2px solid #fff",
              outlineOffset: 1
            }
          }}
        >
          {favorite ? (
            <StarIcon fontSize="small" />
          ) : (
            <StarBorderIcon fontSize="small" />
          )}
        </IconButton>
      )}
    </Box>
  );
}

export function BoardTileSkeleton() {
  return (
    <Skeleton
      variant="rounded"
      data-testid="board-tile-skeleton"
      sx={{ ...tileSize, transform: "none" }}
    />
  );
}

export function SkeletonRow({ count = 4 }: { count?: number }) {
  return (
    <Box
      role="status"
      aria-label="Loading boards"
      aria-busy="true"
      sx={tileGridSx}
    >
      {Array.from({ length: count }, (_, index) => (
        <BoardTileSkeleton key={index} />
      ))}
    </Box>
  );
}

export function CreateBoardTile({ onClick }: { onClick: () => void }) {
  return (
    <ButtonBase
      onClick={onClick}
      data-testid="create-board-tile"
      sx={{
        ...tileSize,
        flexDirection: "column",
        gap: 0.5,
        borderRadius: 1.5,
        bgcolor: "action.hover",
        color: "text.secondary",
        border: 1,
        borderStyle: "dashed",
        borderColor: "divider",
        fontSize: 14,
        fontWeight: 600,
        "&:hover": { bgcolor: "action.selected" },
        "&:focus-visible": {
          outline: "2px solid",
          outlineColor: "primary.main",
          outlineOffset: 2
        }
      }}
    >
      <AddIcon fontSize="small" />
      Create new board
    </ButtonBase>
  );
}
