"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  Avatar,
  Box,
  Chip,
  Divider,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  Typography
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import GroupAddOutlinedIcon from "@mui/icons-material/GroupAddOutlined";
import HelpOutlinedIcon from "@mui/icons-material/HelpOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import KeyboardOutlinedIcon from "@mui/icons-material/KeyboardOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PaletteOutlinedIcon from "@mui/icons-material/PaletteOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import SwitchAccountOutlinedIcon from "@mui/icons-material/SwitchAccountOutlined";
import ViewKanbanOutlinedIcon from "@mui/icons-material/ViewKanbanOutlined";
import { useThemePreference } from "@/hooks/use-theme-preference";
import { HELP_CENTRE_URL } from "@/lib/announcements";
import type { CurrentUser } from "@/lib/current-user";
import { ACCOUNT_URL, FEATURES, type FeatureFlags } from "@/lib/feature-flags";
import { logout } from "@/lib/session";
import { THEME_MODES } from "@/lib/theme-presets";
import type { ThemeMode } from "@/types/board";

export const ACCOUNT_MENU_WIDTH = 300;
export const ACCOUNT_MENU_VIEWPORT_GAP = 64;

const THEME_LABELS: Record<ThemeMode, string> = {
  light: "Light",
  dark: "Dark",
  system: "Match System"
};

const SWATCHES: Record<ThemeMode, string> = {
  light: "#ffffff",
  dark: "#1d2125",
  system: "linear-gradient(135deg, #ffffff 50%, #1d2125 50%)"
};

export interface AccountMenuExtraItem {
  id: string;
  label: string;
  onSelect: () => void;
}

function ThemeSwatch({ mode }: { mode: ThemeMode }) {
  return (
    <Box
      aria-hidden
      data-testid={`theme-swatch-${mode}`}
      sx={{
        width: 20,
        height: 20,
        borderRadius: 0.5,
        border: 1,
        borderColor: "divider",
        background: SWATCHES[mode],
        flexShrink: 0
      }}
    />
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <ListSubheader
      component="li"
      role="presentation"
      sx={{
        bgcolor: "transparent",
        lineHeight: "28px",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: ".06em",
        textTransform: "uppercase",
        color: "text.secondary"
      }}
    >
      {children}
    </ListSubheader>
  );
}

export function AccountMenu({
  anchorEl,
  open,
  onClose,
  user,
  features = FEATURES,
  accountUrl = ACCOUNT_URL,
  helpUrl = HELP_CENTRE_URL,
  extraItems = [],
  onOpenShortcuts,
  onCreateWorkspace,
  onSwitchAccounts,
  onLogout = () => void logout(),
  onToast
}: {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: (event?: unknown, reason?: string) => void;
  user: CurrentUser;
  features?: FeatureFlags;
  accountUrl?: string;
  helpUrl?: string;
  extraItems?: AccountMenuExtraItem[];
  onOpenShortcuts: () => void;
  onCreateWorkspace: () => void;
  onSwitchAccounts?: () => void;
  onLogout?: () => void;
  onToast: (message: string, retry?: () => void) => void;
}) {
  const { mode, select } = useThemePreference(onToast);
  const [themeOpen, setThemeOpen] = useState(false);
  const themeItemRef = useRef<HTMLLIElement | null>(null);
  const displayName = user.name.trim() || "Account";
  const initials = user.initials || displayName.charAt(0).toUpperCase();

  function closeTheme() {
    setThemeOpen(false);
    setTimeout(() => themeItemRef.current?.focus(), 0);
  }

  function chooseTheme(next: ThemeMode) {
    select(next);
    closeTheme();
  }

  function run(action: () => void) {
    onClose();
    action();
  }

  const items: React.ReactNode[] = [
    <SectionLabel key="account-label">Account</SectionLabel>,
    <Stack
      key="account-user"
      component="li"
      role="presentation"
      direction="row"
      data-testid="account-menu-user"
      sx={{ alignItems: "center", gap: 1.5, px: 2, py: 1 }}
    >
      <Avatar
        src={user.imageUrl}
        alt=""
        sx={{
          width: 40,
          height: 40,
          fontSize: 14,
          fontWeight: 800,
          bgcolor: "#f1e6dc",
          color: "#6f4b36"
        }}
      >
        {initials}
      </Avatar>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          noWrap
          data-testid="account-menu-name"
          sx={{ fontSize: 14, fontWeight: 600 }}
        >
          {displayName}
        </Typography>
        {user.email && (
          <Tooltip title={user.email} placement="bottom-start">
            <Typography
              noWrap
              data-testid="account-menu-email"
              sx={{ fontSize: 13, color: "text.secondary" }}
            >
              {user.email}
            </Typography>
          </Tooltip>
        )}
      </Box>
    </Stack>
  ];

  if (features.switchAccounts) {
    items.push(
      <MenuItem
        key="switch-accounts"
        data-testid="account-switch"
        onClick={() => run(() => onSwitchAccounts?.())}
      >
        <ListItemIcon>
          <SwitchAccountOutlinedIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Switch Accounts</ListItemText>
      </MenuItem>
    );
  }

  items.push(
    <MenuItem
      key="manage-account"
      component="a"
      href={accountUrl || undefined}
      target="_blank"
      rel="noopener noreferrer"
      disabled={!accountUrl}
      data-testid="account-manage"
      onClick={() => onClose()}
    >
      <ListItemIcon>
        <PersonOutlinedIcon fontSize="small" />
      </ListItemIcon>
      <ListItemText>Manage Account</ListItemText>
      <OpenInNewIcon fontSize="small" sx={{ ml: 1, opacity: 0.7 }} />
    </MenuItem>,
    <Divider key="d-account" component="li" />,
    <SectionLabel key="product-label">TaskFlow</SectionLabel>
  );

  const links = [
    {
      id: "profile",
      label: "Profile and visibility",
      href: "/profile",
      icon: <PersonOutlinedIcon fontSize="small" />
    },
    {
      id: "activity",
      label: "Activity",
      href: "/activity",
      icon: <HistoryOutlinedIcon fontSize="small" />
    },
    {
      id: "cards",
      label: "Cards",
      href: "/cards",
      icon: <ViewKanbanOutlinedIcon fontSize="small" />
    },
    {
      id: "settings",
      label: "Settings",
      href: "/settings",
      icon: <SettingsOutlinedIcon fontSize="small" />
    },
    ...(features.labs
      ? [
          {
            id: "labs",
            label: "Labs",
            href: "/labs",
            icon: <ScienceOutlinedIcon fontSize="small" />,
            badge: "Labs"
          }
        ]
      : [])
  ];

  for (const link of links) {
    items.push(
      <MenuItem
        key={link.id}
        component={Link}
        href={link.href}
        data-testid={`account-${link.id}`}
        onClick={() => onClose()}
      >
        <ListItemIcon>{link.icon}</ListItemIcon>
        <ListItemText>{link.label}</ListItemText>
        {"badge" in link && (
          <Chip
            size="small"
            color="secondary"
            label={link.badge}
            data-testid="account-labs-badge"
            sx={{ ml: 1, height: 20, fontSize: 11, fontWeight: 700 }}
          />
        )}
      </MenuItem>
    );
  }

  items.push(
    <MenuItem
      key="theme"
      ref={themeItemRef}
      aria-haspopup="menu"
      aria-expanded={themeOpen ? "true" : undefined}
      data-testid="account-theme"
      onClick={() => setThemeOpen(true)}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") {
          event.preventDefault();
          event.stopPropagation();
          setThemeOpen(true);
        }
      }}
    >
      <ListItemIcon>
        <PaletteOutlinedIcon fontSize="small" />
      </ListItemIcon>
      <ListItemText>Theme</ListItemText>
      <ChevronRightIcon fontSize="small" />
    </MenuItem>,
    <Divider key="d-product" component="li" />,
    <MenuItem
      key="create-workspace"
      data-testid="account-create-workspace"
      onClick={() => run(onCreateWorkspace)}
    >
      <ListItemIcon>
        <GroupAddOutlinedIcon fontSize="small" />
      </ListItemIcon>
      <ListItemText>Create Workspace</ListItemText>
    </MenuItem>,
    <Divider key="d-workspace" component="li" />
  );

  for (const extra of extraItems) {
    items.push(
      <MenuItem
        key={extra.id}
        data-testid={`account-${extra.id}`}
        onClick={extra.onSelect}
      >
        <ListItemText inset>{extra.label}</ListItemText>
      </MenuItem>
    );
  }

  items.push(
    <MenuItem
      key="help"
      component="a"
      href={helpUrl || undefined}
      target="_blank"
      rel="noopener noreferrer"
      disabled={!helpUrl}
      data-testid="account-help"
      onClick={() => onClose()}
    >
      <ListItemIcon>
        <HelpOutlinedIcon fontSize="small" />
      </ListItemIcon>
      <ListItemText>Help</ListItemText>
      <OpenInNewIcon fontSize="small" sx={{ ml: 1, opacity: 0.7 }} />
    </MenuItem>,
    <MenuItem
      key="shortcuts"
      data-testid="account-shortcuts"
      onClick={() => run(onOpenShortcuts)}
    >
      <ListItemIcon>
        <KeyboardOutlinedIcon fontSize="small" />
      </ListItemIcon>
      <ListItemText>Shortcuts</ListItemText>
    </MenuItem>,
    <Divider key="d-help" component="li" />,
    <MenuItem
      key="logout"
      data-testid="account-logout"
      onClick={() => run(onLogout)}
    >
      <ListItemIcon>
        <LogoutOutlinedIcon fontSize="small" />
      </ListItemIcon>
      <ListItemText>Log out</ListItemText>
    </MenuItem>
  );

  return (
    <>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={onClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          list: { "aria-label": "Account", dense: true },
          paper: {
            sx: {
              width: ACCOUNT_MENU_WIDTH,
              maxWidth: "calc(100vw - 16px)",
              maxHeight: `calc(100vh - ${ACCOUNT_MENU_VIEWPORT_GAP}px)`,
              overflowY: "auto"
            }
          }
        }}
      >
        {items}
      </Menu>

      <Menu
        anchorEl={themeItemRef.current}
        open={open && themeOpen}
        onClose={closeTheme}
        anchorOrigin={{ vertical: "top", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          list: {
            "aria-label": "Theme",
            onKeyDown: (event: React.KeyboardEvent) => {
              if (event.key === "ArrowLeft") {
                event.preventDefault();
                event.stopPropagation();
                closeTheme();
              }
            }
          }
        }}
      >
        {THEME_MODES.map((item) => (
          <MenuItem
            key={item}
            role="menuitemradio"
            aria-checked={item === mode}
            selected={item === mode}
            data-testid={`theme-option-${item}`}
            onClick={() => chooseTheme(item)}
            sx={{ minWidth: 200 }}
          >
            <ListItemIcon>
              <ThemeSwatch mode={item} />
            </ListItemIcon>
            <ListItemText>{THEME_LABELS[item]}</ListItemText>
            {item === mode && <CheckIcon fontSize="small" />}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
