"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Avatar,
  Box,
  Button,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Typography,
  useMediaQuery
} from "@mui/material";
import {
  Check,
  Command as CommandIcon,
  Menu as MenuIcon,
  Plus,
  Search,
  Settings,
  SlidersHorizontal
} from "lucide-react";

export const TOP_BAR_HEIGHT = 48;

export function TopBar({
  boardName,
  query,
  onQueryChange,
  activeFilterCount,
  onOpenFilters,
  onNewTask,
  newTaskDisabled = false,
  boardsMenu,
  searchInputRef,
  onOpenCommands
}: {
  boardName: string;
  query: string;
  onQueryChange: (value: string) => void;
  activeFilterCount: number;
  onOpenFilters: (anchor: HTMLElement) => void;
  onNewTask: () => void;
  newTaskDisabled?: boolean;
  boardsMenu?: React.ReactNode;
  searchInputRef?: React.Ref<HTMLInputElement>;
  onOpenCommands?: () => void;
}) {
  const compact = useMediaQuery("(max-width:767.95px)");
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const filterName =
    activeFilterCount > 0 ? `Filters, ${activeFilterCount} active` : "Filters";

  return (
    <Stack
      component="header"
      direction="row"
      sx={{
        height: TOP_BAR_HEIGHT,
        flexShrink: 0,
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1,
        px: 2,
        bgcolor: "rgba(0,0,0,.32)",
        color: "#fff"
      }}
    >
      <Stack
        direction="row"
        spacing={1.25}
        sx={{ alignItems: "center", minWidth: 0 }}
      >
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: 1.5,
            bgcolor: "#fff",
            color: "#172b4d",
            display: "grid",
            placeItems: "center",
            flexShrink: 0
          }}
        >
          <Check size={17} strokeWidth={3} />
        </Box>
        <Typography sx={{ fontWeight: 800, fontSize: 18, letterSpacing: -0.4 }}>
          TaskFlow
        </Typography>
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
              maxWidth: { xs: 100, sm: 200 }
            }}
          >
            {boardName}
          </Typography>
        )}
      </Stack>

      <TextField
        size="small"
        placeholder="Search"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        inputRef={searchInputRef}
        slotProps={{
          htmlInput: { "aria-label": "Search tasks" },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Search size={16} color="#e3f1fa" />
              </InputAdornment>
            )
          }
        }}
        sx={{
          width: { xs: 120, sm: 260, md: 420 },
          "& .MuiOutlinedInput-root": {
            height: compact ? 44 : 34,
            bgcolor: "rgba(255,255,255,.22)",
            color: "#fff",
            borderRadius: 1.5,
            "& fieldset": { borderColor: "rgba(255,255,255,.55)" },
            "&:hover fieldset": { borderColor: "rgba(255,255,255,.8)" },
            "&.Mui-focused": { bgcolor: "#fff", color: "#172b4d" },
            "&.Mui-focused fieldset": { borderColor: "#4c9aff" },
            "&.Mui-focused svg": { color: "#44546f" }
          },
          input: {
            fontSize: 14,
            "&::placeholder": { color: "#e3f1fa", opacity: 1 }
          }
        }}
      />

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
            <MenuIcon size={20} />
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
            <MenuItem sx={{ minHeight: 44 }} component={Link} href="/settings">
              Settings
            </MenuItem>
          </Menu>
        </>
      ) : (
        <Stack
          direction="row"
          spacing={1.5}
          sx={{ alignItems: "center", flexShrink: 0 }}
        >
          <Button
            variant="outlined"
            data-testid="top-bar-filter"
            aria-label={filterName}
            startIcon={<SlidersHorizontal size={16} />}
            onClick={(event) => onOpenFilters(event.currentTarget)}
            sx={{
              height: 32,
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
            startIcon={<Plus size={16} />}
            onClick={onNewTask}
            sx={{
              height: 32,
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
                "&:focus-visible": {
                  outline: "2px solid #fff",
                  outlineOffset: 2
                }
              }}
            >
              <CommandIcon size={20} />
            </IconButton>
          )}
          <IconButton
            component={Link}
            href="/settings"
            color="inherit"
            aria-label="Settings"
            data-testid="top-bar-settings"
            sx={{
              "&:focus-visible": { outline: "2px solid #fff", outlineOffset: 2 }
            }}
          >
            <Settings size={20} />
          </IconButton>
          <Avatar
            sx={{
              width: 30,
              height: 30,
              fontSize: 12,
              fontWeight: 800,
              bgcolor: "#f1e6dc",
              color: "#6f4b36"
            }}
          >
            JD
          </Avatar>
        </Stack>
      )}
    </Stack>
  );
}
