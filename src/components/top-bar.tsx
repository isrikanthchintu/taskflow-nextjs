"use client";

import { useState } from "react";
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
import SearchIcon from "@mui/icons-material/Search";
import MenuIcon from "@mui/icons-material/Menu";
import AddIcon from "@mui/icons-material/Add";
import SettingsIcon from "@mui/icons-material/Settings";
import TuneIcon from "@mui/icons-material/Tune";
import TerminalIcon from "@mui/icons-material/Terminal";

export const TOP_BAR_HEIGHT = 64;

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
  onOpenCommands,
  onOpenSettings
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
  onOpenSettings?: () => void;
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
        <Box
          component="img"
          src="/taskflow-logo.svg"
          alt="TaskFlow"
          sx={{
            width: 36,
            height: 36,
            objectFit: "contain",
            flexShrink: 0
          }}
        />
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
                <SearchIcon fontSize="small" color="action" />
              </InputAdornment>
            )
          }
        }}
        sx={{
          width: { xs: 120, sm: 280, md: 440 },
          flex: { xs: "1 1 auto", md: "0 1 440px" },
          mx: { md: 1 },
          "& .MuiOutlinedInput-root": {
            height: compact ? 44 : 40,
            bgcolor: "rgba(255,255,255,.22)",
            color: "#fff",
            borderRadius: 1.5,
            "& fieldset": { borderColor: "rgba(255,255,255,.55)" },
            "&:hover fieldset": { borderColor: "rgba(255,255,255,.8)" },
            "&.Mui-focused": { bgcolor: "rgba(255,255,255,.30)", color: "#fff" },
            "&.Mui-focused fieldset": { borderColor: "#fff", borderWidth: 1 },
            "&.Mui-focused svg": { color: "#fff" }
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
            <MenuItem
              sx={{ minHeight: 44 }}
              onClick={() => {
                setMenuAnchor(null);
                onOpenSettings?.();
              }}
            >
              Settings
            </MenuItem>
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
          <IconButton
            color="inherit"
            onClick={onOpenSettings}
            aria-label="Settings"
            data-testid="top-bar-settings"
            sx={{
              width: 36,
              height: 36,
              "&:focus-visible": { outline: "2px solid #fff", outlineOffset: 2 }
            }}
          >
            <SettingsIcon fontSize="small" />
          </IconButton>
          <Avatar
            sx={{
              width: 32,
              height: 32,
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
