"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Avatar,
  Badge,
  Box,
  Button,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Popover,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AppsIcon from "@mui/icons-material/Apps";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import CloseIcon from "@mui/icons-material/Close";
import HelpOutlinedIcon from "@mui/icons-material/HelpOutlined";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import SearchIcon from "@mui/icons-material/Search";
import { AccountMenu } from "@/components/account-menu";
import { NameDialog } from "@/components/boards-menu";
import { CreateWorkspaceDialog } from "@/components/create-workspace-dialog";
import { useGlobalSearch } from "@/components/search-context";
import { ShortcutHelp } from "@/components/shortcut-help";
import { useBoard } from "@/hooks/use-board";
import { useSeenIndicator } from "@/hooks/use-seen-indicator";
import {
  ANNOUNCEMENTS,
  ANNOUNCEMENTS_VERSION,
  HELP_CENTRE_URL,
  HELP_VERSION
} from "@/lib/announcements";
import { CURRENT_USER, type CurrentUser } from "@/lib/current-user";
import { ACCOUNT_URL, FEATURES, type FeatureFlags } from "@/lib/feature-flags";
import { formatBadge, useUnreadNotifications } from "@/lib/notifications-store";
import { redirectToLogin } from "@/lib/session";

export const TOP_BAR_HEIGHT = 48;

export type TopBarVariant = "board" | "light";
export type PopoverId =
  "apps" | "create" | "announcements" | "notifications" | "help" | "account";

interface Toast {
  message: string;
  retry?: () => void;
}

interface ActivePopover {
  id: PopoverId;
  anchor: HTMLElement;
}

export function variantForPath(pathname: string | null): TopBarVariant {
  return pathname === null || pathname === "/" ? "board" : "light";
}

const APP_LINKS = [
  { label: "Board", href: "/" },
  { label: "Archive", href: "/archive" },
  { label: "Settings", href: "/settings" }
];

export function GlobalTopBar({
  user = CURRENT_USER,
  variant,
  onSessionExpired = redirectToLogin,
  onStartFromTemplate,
  onCreateWorkspace,
  onSwitchAccounts,
  onLogout,
  features = FEATURES,
  accountUrl = ACCOUNT_URL
}: {
  user?: CurrentUser;
  variant?: TopBarVariant;
  onSessionExpired?: () => void;
  onStartFromTemplate?: () => void;
  onCreateWorkspace?: () => void;
  onSwitchAccounts?: () => void;
  onLogout?: () => void;
  features?: FeatureFlags;
  accountUrl?: string;
}) {
  const pathname = usePathname();
  const resolved = variant ?? variantForPath(pathname);
  const isBoard = resolved === "board";
  const collapsedSearch = useMediaQuery("(max-width:1023.95px)");
  const mobile = useMediaQuery("(max-width:599.95px)");
  const { query, setQuery, inputRef, registerFocusHandler } = useGlobalSearch();
  const { createBoard } = useBoard();
  const { unreadCount } = useUnreadNotifications(onSessionExpired);
  const announcements = useSeenIndicator(
    "announcements",
    ANNOUNCEMENTS_VERSION
  );
  const help = useSeenIndicator("help", HELP_VERSION);
  const markAnnouncementsSeen = announcements.markSeen;
  const markHelpSeen = help.markSeen;

  const [active, setActive] = useState<ActivePopover | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [boardDialogKey, setBoardDialogKey] = useState(0);
  const [boardDialogOpen, setBoardDialogOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [workspaceDialogOpen, setWorkspaceDialogOpen] = useState(false);
  const [workspaceDialogKey, setWorkspaceDialogKey] = useState(0);
  const searchButtonRef = useRef<HTMLButtonElement | null>(null);
  const createButtonRef = useRef<HTMLButtonElement | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const activeId = active?.id ?? null;
  const badge = formatBadge(unreadCount);

  useEffect(() => {
    if (activeId === "announcements") markAnnouncementsSeen();
    if (activeId === "help") markHelpSeen();
  }, [activeId, markAnnouncementsSeen, markHelpSeen]);

  useEffect(() => {
    if (!collapsedSearch) setSearchOpen(false);
  }, [collapsedSearch]);

  useEffect(() => {
    registerFocusHandler(() => {
      if (collapsedSearch) setSearchOpen(true);
      else inputRef.current?.focus();
    });
    return () => registerFocusHandler(null);
  }, [collapsedSearch, inputRef, registerFocusHandler]);

  const toggle = useCallback((id: PopoverId, anchor: HTMLElement) => {
    setSearchOpen(false);
    setActive((current) => (current?.id === id ? null : { id, anchor }));
  }, []);

  const close = useCallback(
    (_event?: unknown, reason?: string) => {
      const anchor = active?.anchor;
      setActive(null);
      if (reason === "escapeKeyDown" && anchor) {
        setTimeout(() => anchor.focus(), 0);
      }
    },
    [active]
  );

  function switchTo(id: PopoverId) {
    setActive((current) => (current ? { id, anchor: current.anchor } : null));
  }

  function createBoardFlow() {
    setActive(null);
    setBoardDialogKey((key) => key + 1);
    setBoardDialogOpen(true);
  }

  function showToast(message: string, retry?: () => void) {
    setToast({ message, retry });
  }

  function unavailable(message: string, handler?: () => void) {
    setActive(null);
    if (handler) handler();
    else showToast(message);
  }

  function openWorkspaceFlow() {
    returnFocusRef.current = active?.anchor ?? createButtonRef.current ?? null;
    setActive(null);
    if (onCreateWorkspace) {
      onCreateWorkspace();
      return;
    }
    setWorkspaceDialogKey((key) => key + 1);
    setWorkspaceDialogOpen(true);
  }

  function closeSearch() {
    setSearchOpen(false);
    setTimeout(() => searchButtonRef.current?.focus(), 0);
  }

  const focusRing = {
    outline: "2px solid",
    outlineColor: isBoard ? "#fff" : "primary.main",
    outlineOffset: 2
  };

  const iconSx = (pressed: boolean) => ({
    width: 32,
    height: 32,
    color: "inherit",
    borderRadius: 1,
    bgcolor: pressed
      ? isBoard
        ? "rgba(255,255,255,.28)"
        : "action.selected"
      : "transparent",
    "&:hover": {
      bgcolor: isBoard ? "rgba(255,255,255,.2)" : "action.hover"
    },
    "&:focus-visible": focusRing
  });

  function dotted(visible: boolean, children: React.ReactNode) {
    return (
      <Badge
        variant="dot"
        overlap="circular"
        invisible={!visible}
        data-testid={visible ? "unseen-dot" : undefined}
        sx={{
          "& .MuiBadge-badge": {
            bgcolor: "#8270DB",
            border: "1px solid #fff"
          }
        }}
      >
        {children}
      </Badge>
    );
  }

  const searchField = (overlay: boolean) => (
    <TextField
      size="small"
      placeholder="Search"
      value={query}
      onChange={(event) => setQuery(event.target.value)}
      inputRef={inputRef}
      autoFocus={overlay}
      onKeyDown={(event) => {
        if (overlay && event.key === "Escape") {
          event.stopPropagation();
          closeSearch();
        }
      }}
      slotProps={{
        htmlInput: { "aria-label": "Search tasks" },
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" sx={{ color: "inherit" }} />
            </InputAdornment>
          )
        }
      }}
      sx={{
        flex: 1,
        minWidth: 0,
        maxWidth: 780,
        "& .MuiOutlinedInput-root": {
          height: 32,
          color: isBoard ? "#fff" : "text.primary",
          bgcolor: isBoard ? "rgba(255,255,255,.2)" : "action.hover",
          borderRadius: 1,
          "& fieldset": {
            borderColor: isBoard ? "rgba(255,255,255,.55)" : "divider"
          },
          "&:hover fieldset": {
            borderColor: isBoard ? "rgba(255,255,255,.85)" : "text.secondary"
          },
          "&.Mui-focused fieldset": {
            borderColor: isBoard ? "#fff" : "primary.main",
            borderWidth: 2
          }
        },
        input: {
          fontSize: 14,
          "&::placeholder": {
            color: isBoard ? "#fff" : "text.secondary",
            opacity: isBoard ? 0.85 : 1
          }
        }
      }}
    />
  );

  const createTrigger = mobile ? (
    <Tooltip title="Create">
      <IconButton
        ref={createButtonRef}
        aria-label="Create"
        aria-haspopup="menu"
        aria-expanded={activeId === "create" ? "true" : undefined}
        data-testid="top-bar-create"
        onClick={(event) => toggle("create", event.currentTarget)}
        sx={{
          ...iconSx(activeId === "create"),
          flexShrink: 0,
          bgcolor: isBoard ? "rgba(255,255,255,.22)" : "primary.main",
          color: isBoard ? "#fff" : "primary.contrastText",
          "&:hover": {
            bgcolor: isBoard ? "rgba(255,255,255,.32)" : "primary.dark"
          }
        }}
      >
        <AddIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  ) : (
    <Button
      ref={createButtonRef}
      variant="contained"
      aria-haspopup="menu"
      aria-expanded={activeId === "create" ? "true" : undefined}
      data-testid="top-bar-create"
      onClick={(event) => toggle("create", event.currentTarget)}
      sx={{
        height: 32,
        minHeight: 32,
        px: 1.5,
        fontSize: 14,
        flexShrink: 0,
        ...(isBoard && {
          bgcolor: "rgba(255,255,255,.22)",
          color: "#fff",
          "&:hover": { bgcolor: "rgba(255,255,255,.32)", transform: "none" }
        }),
        "&:focus-visible": focusRing
      }}
    >
      Create
    </Button>
  );

  const bellLabel = badge
    ? `Notifications, ${unreadCount} unread`
    : "Notifications";
  const announcementsLabel = announcements.unseen
    ? "Announcements, new"
    : "Announcements";
  const helpLabel = help.unseen ? "Help, new content" : "Help";

  return (
    <>
      <Stack
        component="header"
        direction="row"
        data-testid="global-top-bar"
        data-variant={resolved}
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: TOP_BAR_HEIGHT,
          zIndex: (theme) => theme.zIndex.appBar,
          alignItems: "center",
          gap: 1,
          px: { xs: 1, sm: 1.5 },
          boxSizing: "border-box",
          ...(isBoard
            ? {
                bgcolor: "rgba(9,30,66,.72)",
                color: "#fff",
                backdropFilter: "blur(8px)"
              }
            : {
                bgcolor: "background.paper",
                color: "text.primary",
                borderBottom: 1,
                borderColor: "divider"
              })
        }}
      >
        <Stack
          direction="row"
          sx={{ alignItems: "center", gap: 0.5, flexShrink: 0 }}
        >
          <Tooltip title="App switcher">
            <IconButton
              aria-label="App switcher"
              aria-haspopup="menu"
              aria-expanded={activeId === "apps" ? "true" : undefined}
              data-testid="top-bar-apps"
              onClick={(event) => toggle("apps", event.currentTarget)}
              sx={iconSx(activeId === "apps")}
            >
              <AppsIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Box
            component={Link}
            href="/"
            aria-label="TaskFlow home"
            data-testid="top-bar-logo"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.75,
              px: 0.75,
              height: 32,
              borderRadius: 1,
              color: "inherit",
              textDecoration: "none",
              "&:hover": {
                bgcolor: isBoard ? "rgba(255,255,255,.2)" : "action.hover"
              },
              "&:focus-visible": focusRing
            }}
          >
            <Box
              component="img"
              src="/taskflow-logo.svg"
              alt=""
              sx={{ width: 24, height: 24, objectFit: "contain" }}
            />
            <Typography
              component="span"
              sx={{
                display: { xs: "none", sm: "inline" },
                fontSize: 16,
                fontWeight: 800
              }}
            >
              TaskFlow
            </Typography>
          </Box>
        </Stack>

        <Stack
          direction="row"
          role="search"
          sx={{
            flex: 1,
            minWidth: 0,
            alignItems: "center",
            justifyContent: "center",
            gap: 1
          }}
        >
          {collapsedSearch ? (
            <Box sx={{ flex: 1 }}>
              <Tooltip title="Search">
                <IconButton
                  ref={searchButtonRef}
                  aria-label="Search"
                  data-testid="top-bar-search-button"
                  onClick={() => {
                    setActive(null);
                    setSearchOpen(true);
                  }}
                  sx={iconSx(searchOpen)}
                >
                  <SearchIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          ) : (
            searchField(false)
          )}
          {createTrigger}
        </Stack>

        <Stack
          direction="row"
          sx={{ alignItems: "center", gap: 1, flexShrink: 0 }}
        >
          {!mobile && (
            <Tooltip title="Announcements">
              <IconButton
                aria-label={announcementsLabel}
                aria-haspopup="dialog"
                aria-expanded={
                  activeId === "announcements" ? "true" : undefined
                }
                data-testid="top-bar-announcements"
                onClick={(event) =>
                  toggle("announcements", event.currentTarget)
                }
                sx={iconSx(activeId === "announcements")}
              >
                {dotted(
                  announcements.unseen,
                  <CampaignOutlinedIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Notifications">
            <IconButton
              aria-label={bellLabel}
              aria-haspopup="dialog"
              aria-expanded={activeId === "notifications" ? "true" : undefined}
              data-testid="top-bar-notifications"
              onClick={(event) => toggle("notifications", event.currentTarget)}
              sx={iconSx(activeId === "notifications")}
            >
              <Badge
                badgeContent={badge}
                invisible={badge === null}
                data-testid="notification-badge"
                sx={{
                  "& .MuiBadge-badge": {
                    bgcolor: "#C9372C",
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 700,
                    minWidth: 16,
                    height: 16,
                    px: 0.5
                  }
                }}
              >
                <NotificationsNoneIcon fontSize="small" />
              </Badge>
            </IconButton>
          </Tooltip>
          {!mobile && (
            <Tooltip title="Help">
              <IconButton
                aria-label={helpLabel}
                aria-haspopup="menu"
                aria-expanded={activeId === "help" ? "true" : undefined}
                data-testid="top-bar-help"
                onClick={(event) => toggle("help", event.currentTarget)}
                sx={iconSx(activeId === "help")}
              >
                {dotted(help.unseen, <HelpOutlinedIcon fontSize="small" />)}
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title={user.name}>
            <IconButton
              aria-label={`Account, ${user.name}`}
              aria-haspopup="menu"
              aria-expanded={activeId === "account" ? "true" : undefined}
              data-testid="top-bar-account"
              onClick={(event) => toggle("account", event.currentTarget)}
              sx={{ ...iconSx(activeId === "account"), p: 0 }}
            >
              <Avatar
                src={user.imageUrl}
                alt=""
                sx={{
                  width: 28,
                  height: 28,
                  fontSize: 12,
                  fontWeight: 800,
                  bgcolor: "#f1e6dc",
                  color: "#6f4b36"
                }}
              >
                {user.initials}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Stack>

        {collapsedSearch && searchOpen && (
          <Stack
            direction="row"
            data-testid="top-bar-search-overlay"
            sx={{
              position: "absolute",
              inset: 0,
              alignItems: "center",
              gap: 1,
              px: { xs: 1, sm: 1.5 },
              bgcolor: isBoard ? "rgb(9,30,66)" : "background.paper",
              color: isBoard ? "#fff" : "text.primary"
            }}
          >
            {searchField(true)}
            <Tooltip title="Close search">
              <IconButton
                aria-label="Close search"
                onClick={closeSearch}
                sx={iconSx(false)}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        )}
      </Stack>

      <Menu
        anchorEl={activeId === "apps" ? active?.anchor : null}
        open={activeId === "apps"}
        onClose={close}
        slotProps={{ list: { "aria-label": "App switcher" } }}
      >
        {APP_LINKS.map((item) => (
          <MenuItem
            key={item.href}
            component={Link}
            href={item.href}
            onClick={() => setActive(null)}
          >
            {item.label}
          </MenuItem>
        ))}
      </Menu>

      <Menu
        anchorEl={activeId === "create" ? active?.anchor : null}
        open={activeId === "create"}
        onClose={close}
        slotProps={{ list: { "aria-label": "Create" } }}
      >
        <MenuItem data-testid="create-board" onClick={createBoardFlow}>
          Create Board
        </MenuItem>
        <MenuItem
          data-testid="create-template"
          onClick={() =>
            unavailable("Templates are not available yet", onStartFromTemplate)
          }
        >
          Start with a Template
        </MenuItem>
        <MenuItem data-testid="create-workspace" onClick={openWorkspaceFlow}>
          Create Workspace
        </MenuItem>
      </Menu>

      <Popover
        anchorEl={activeId === "announcements" ? active?.anchor : null}
        open={activeId === "announcements"}
        onClose={close}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            role: "dialog",
            "aria-label": "What's new",
            sx: { width: 340, maxWidth: "calc(100vw - 16px)", p: 2 }
          }
        }}
      >
        <Typography component="h2" variant="subtitle1" sx={{ fontWeight: 700 }}>
          What&apos;s new
        </Typography>
        <Stack spacing={1.5} sx={{ mt: 1.5 }}>
          {ANNOUNCEMENTS.map((item) => (
            <Box key={item.id}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {item.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {item.body}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Popover>

      <Popover
        anchorEl={activeId === "notifications" ? active?.anchor : null}
        open={activeId === "notifications"}
        onClose={close}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            role: "dialog",
            "aria-label": "Notifications",
            sx: { width: 360, maxWidth: "calc(100vw - 16px)", p: 2 }
          }
        }}
      >
        <Typography component="h2" variant="subtitle1" sx={{ fontWeight: 700 }}>
          Notifications
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          data-testid="notifications-panel-summary"
          sx={{ mt: 1 }}
        >
          {badge ? `${unreadCount} unread` : "You are all caught up."}
        </Typography>
      </Popover>

      <Menu
        anchorEl={activeId === "help" ? active?.anchor : null}
        open={activeId === "help"}
        onClose={close}
        slotProps={{ list: { "aria-label": "Help" } }}
      >
        <MenuItem
          component="a"
          href={HELP_CENTRE_URL || undefined}
          target="_blank"
          rel="noopener noreferrer"
          disabled={!HELP_CENTRE_URL}
          data-testid="help-centre"
          onClick={() => setActive(null)}
        >
          Help Centre
        </MenuItem>
        <MenuItem
          data-testid="help-shortcuts"
          onClick={() => {
            returnFocusRef.current = active?.anchor ?? null;
            setActive(null);
            setShortcutsOpen(true);
          }}
        >
          Keyboard Shortcuts
        </MenuItem>
      </Menu>

      <AccountMenu
        anchorEl={activeId === "account" ? (active?.anchor ?? null) : null}
        open={activeId === "account"}
        onClose={close}
        user={user}
        features={features}
        accountUrl={accountUrl}
        extraItems={
          mobile
            ? [
                {
                  id: "announcements",
                  label: announcements.unseen
                    ? "What's new (new)"
                    : "What's new",
                  onSelect: () => switchTo("announcements")
                }
              ]
            : []
        }
        onOpenShortcuts={() => {
          returnFocusRef.current = active?.anchor ?? null;
          setShortcutsOpen(true);
        }}
        onCreateWorkspace={openWorkspaceFlow}
        onSwitchAccounts={onSwitchAccounts}
        onLogout={onLogout}
        onToast={showToast}
      />

      <NameDialog
        key={`board-${boardDialogKey}`}
        kind={boardDialogOpen ? "create" : null}
        initial=""
        onSubmit={createBoard}
        onClose={() => setBoardDialogOpen(false)}
        onExited={() => createButtonRef.current?.focus()}
      />

      <ShortcutHelp
        open={shortcutsOpen}
        onClose={() => {
          setShortcutsOpen(false);
          setTimeout(() => returnFocusRef.current?.focus(), 0);
        }}
      />

      <CreateWorkspaceDialog
        key={`workspace-${workspaceDialogKey}`}
        open={workspaceDialogOpen}
        onClose={() => setWorkspaceDialogOpen(false)}
        onExited={() => returnFocusRef.current?.focus()}
        onCreated={(workspace) =>
          showToast(`Workspace "${workspace.name}" created`)
        }
      />

      <Snackbar
        open={toast !== null}
        autoHideDuration={6000}
        message={toast?.message}
        onClose={(_event, reason) => {
          if (reason !== "clickaway") setToast(null);
        }}
        action={
          toast?.retry ? (
            <Button
              color="inherit"
              size="small"
              data-testid="toast-retry"
              onClick={() => {
                const retry = toast.retry;
                setToast(null);
                retry?.();
              }}
            >
              Retry
            </Button>
          ) : undefined
        }
      />
    </>
  );
}
