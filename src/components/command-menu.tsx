"use client";

import { useRef, useState } from "react";
import {
  Box,
  Dialog,
  InputAdornment,
  TextField,
  Typography
} from "@mui/material";
import { Search } from "lucide-react";

export interface Command {
  id: string;
  label: string;
  shortcut?: string;
  disabled?: boolean;
  run: () => void;
}

export function filterCommands(commands: Command[], query: string): Command[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return commands;
  return commands.filter((command) =>
    command.label.toLowerCase().includes(needle)
  );
}

export function CommandMenu({
  open,
  onClose,
  commands
}: {
  open: boolean;
  onClose: () => void;
  commands: Command[];
}) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const pending = useRef<Command | null>(null);
  const matches = filterCommands(commands, query);
  const safeIndex = Math.min(activeIndex, Math.max(matches.length - 1, 0));
  const activeCommand = matches[safeIndex];

  function choose(command: Command | undefined) {
    if (!command || command.disabled) return;
    pending.current = command;
    onClose();
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex(
        matches.length === 0 ? 0 : (safeIndex + 1) % matches.length
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex(
        matches.length === 0
          ? 0
          : (safeIndex - 1 + matches.length) % matches.length
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      choose(activeCommand);
    }
  }

  function handleExited() {
    setQuery("");
    setActiveIndex(0);
    const command = pending.current;
    pending.current = null;
    if (command) command.run();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        transition: { onExited: handleExited },
        paper: {
          "aria-label": "Command menu",
          sx: { alignSelf: "flex-start", mt: 8 }
        } as Record<string, unknown>
      }}
    >
      <Box sx={{ p: 2 }}>
        <TextField
          autoFocus
          fullWidth
          size="small"
          label="Type a command"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={handleKeyDown}
          slotProps={{
            htmlInput: {
              role: "combobox",
              "aria-expanded": true,
              "aria-controls": "command-menu-list",
              "aria-autocomplete": "list",
              "aria-activedescendant": activeCommand
                ? `command-option-${activeCommand.id}`
                : undefined,
              "data-testid": "command-menu-input"
            },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={16} aria-hidden="true" />
                </InputAdornment>
              )
            }
          }}
        />
        <Box
          component="ul"
          role="listbox"
          id="command-menu-list"
          aria-label="Commands"
          sx={{ listStyle: "none", m: 0, mt: 1, p: 0 }}
        >
          {matches.map((command, index) => (
            <Box
              component="li"
              key={command.id}
              role="option"
              id={`command-option-${command.id}`}
              aria-selected={index === safeIndex}
              aria-disabled={command.disabled || undefined}
              data-testid={`command-${command.id}`}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => choose(command)}
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                px: 1.5,
                minHeight: 40,
                borderRadius: 1,
                cursor: command.disabled ? "default" : "pointer",
                opacity: command.disabled ? 0.6 : 1,
                bgcolor: index === safeIndex ? "action.selected" : "transparent"
              }}
            >
              <Typography component="span" sx={{ fontSize: 14 }}>
                {command.label}
              </Typography>
              {command.shortcut && (
                <Typography
                  component="kbd"
                  sx={{ fontSize: 12, fontWeight: 700 }}
                >
                  {command.shortcut}
                </Typography>
              )}
            </Box>
          ))}
        </Box>
        {matches.length === 0 && (
          <Typography
            role="status"
            data-testid="command-menu-empty"
            variant="body2"
            sx={{ mt: 1.5 }}
          >
            No command matches that.
          </Typography>
        )}
      </Box>
    </Dialog>
  );
}
