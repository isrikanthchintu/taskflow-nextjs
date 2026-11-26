"use client";

import { useState } from "react";
import {
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Typography,
  useMediaQuery
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import AddIcon from "@mui/icons-material/Add";
import TuneIcon from "@mui/icons-material/Tune";
import TerminalIcon from "@mui/icons-material/Terminal";

export const BOARD_TOOLBAR_HEIGHT = 56;

export function BoardToolbar({
  boardName,
  activeFilterCount,
  onOpenFilters,
  onNewTask,
  newTaskDisabled = false,
  boardsMenu,
  onOpenCommands
}: {
  boardName: string;
  activeFilterCount: number;
  onOpenFilters: (anchor: HTMLElement) => void;
  onNewTask: () => void;
  newTaskDisabled?: boolean;
  boardsMenu?: React.ReactNode;
  onOpenCommands?: () => void;
}) {
  const compact = useMediaQuery("(max-width:767.95px)");
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const filterName =
    activeFilterCount > 0 ? `Filters, ${activeFilterCount} active` : "Filters";

  return (
    <Stack
      direction="row"
      data-testid="board-toolbar"
      sx={{
        height: BOARD_TOOLBAR_HEIGHT,
        flexShrink: 0,
        alignItems: "center",
        gap: 2,
        px: { xs: 2, md: 3 },
        bgcolor: "rgba(0,0,0,.32)",
        color: "#fff"
      }}
    >
      <Stack
        direction="row"
        spacing={{ xs: 1, md: 2 }}
        sx={{ alignItems: "center", minWidth: 0 }}
      >
        {boardsMenu ?? (
          <Typography
            data-testid="top-bar-board-name"
            sx={{
              fontSize: 14,
              fontWeight: 600,
              px: 1,
              py: 0.25,
              borderRadius: 1,
              bgcolor: "rgba(255,255,255,.18)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: { xs: 160, sm: 280 }
            }}
          >
            {boardName}
          </Typography>
        )}
      </Stack>

      <Box sx={{ flex: 1 }} />

      {compact ? (
        <>
          <IconButton
            color="inherit"
            aria-label="More actions"
            aria-haspopup="menu"
            data-testid="top-bar-menu-button"
            onClick={(event) => setMenuAnchor(event.currentTarget)}
            sx={{ width: 44, height: 44 }}
          >
            <MenuIcon fontSize="small" />
          </IconButton>
          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={() => setMenuAnchor(null)}
            slotProps={{ list: { "aria-label": "More actions" } }}
          >
            <MenuItem
              sx={{ minHeight: 44 }}
              onClick={() => {
                const anchor = menuAnchor;
                setMenuAnchor(null);
                if (anchor) onOpenFilters(anchor);
              }}
            >
              {filterName}
            </MenuItem>
            <MenuItem
              sx={{ minHeight: 44 }}
              disabled={newTaskDisabled}
              onClick={() => {
                setMenuAnchor(null);
                onNewTask();
              }}
            >
              New task
            </MenuItem>
            {onOpenCommands && (
              <MenuItem
                sx={{ minHeight: 44 }}
                data-testid="top-bar-commands-menu-item"
                onClick={() => {
                  setMenuAnchor(null);
                  onOpenCommands();
                }}
              >
                Commands
              </MenuItem>
            )}
          </Menu>
        </>
      ) : (
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: "center", flexShrink: 0 }}
        >
          <Button
            variant="outlined"
            data-testid="top-bar-filter"
            aria-label={filterName}
            startIcon={<TuneIcon fontSize="small" />}
            onClick={(event) => onOpenFilters(event.currentTarget)}
            sx={{
              height: 36,
              px: 1.75,
              fontSize: 14,
              color: "#fff",
              borderColor: "rgba(255,255,255,.6)",
              "&:hover": {
                borderColor: "#fff",
                bgcolor: "rgba(255,255,255,.14)",
                transform: "none"
              }
            }}
          >
            Filter{activeFilterCount > 0 ? ` ${activeFilterCount}` : ""}
          </Button>
          <Button
            variant="contained"
            disabled={newTaskDisabled}
            startIcon={<AddIcon fontSize="small" />}
            onClick={onNewTask}
            sx={{
              height: 36,
              px: 1.75,
              fontSize: 14,
              bgcolor: "#fff",
              color: "#172b4d",
              "&:hover": { bgcolor: "#e9f2ff", transform: "none" },
              "&.Mui-disabled": {
                bgcolor: "rgba(255,255,255,.5)",
                color: "#172b4d"
              }
            }}
          >
            New task
          </Button>
          {onOpenCommands && (
            <IconButton
              color="inherit"
              aria-label="Open the command menu"
              data-testid="top-bar-commands"
              onClick={onOpenCommands}
              sx={{
                width: 36,
                height: 36,
                "&:focus-visible": {
                  outline: "2px solid #fff",
                  outlineOffset: 2
                }
              }}
            >
              <TerminalIcon fontSize="small" />
            </IconButton>
          )}
        </Stack>
      )}
    </Stack>
  );
}
