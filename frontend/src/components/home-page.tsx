"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Drawer,
  IconButton,
  Snackbar,
  Stack,
  Typography,
  useMediaQuery
} from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import MenuIcon from "@mui/icons-material/Menu";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import {
  BoardTile,
  CreateBoardTile,
  SkeletonRow,
  tileGridSx
} from "@/components/board-tile";
import { ClosedBoardsDialog } from "@/components/closed-boards-dialog";
import { CreateBoardFlow } from "@/components/create-board-dialog";
import { CreateWorkspaceDialog } from "@/components/create-workspace-dialog";
import { TOP_BAR_HEIGHT } from "@/components/global-top-bar";
import {
  HomeSidebar,
  SIDEBAR_WIDTH,
  workspaceLinks
} from "@/components/home-sidebar";
import { useHome } from "@/hooks/use-home";
import { BOARD_PAGE_SIZE, workspaceInitial } from "@/lib/home-model";
import type { Workspace } from "@/lib/workspace-store";

export const CONTENT_MAX_WIDTH = 860;

function SectionError({
  message,
  onRetry
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <Alert
      severity="error"
      data-testid="section-error"
      action={
        <Button
          color="inherit"
          size="small"
          data-testid="section-retry"
          onClick={onRetry}
        >
          Retry
        </Button>
      }
    >
      {message}
    </Alert>
  );
}

function WorkspaceSection({
  workspace,
  onCreateBoard,
  onPremium
}: {
  workspace: Workspace;
  onCreateBoard: (workspaceId: string) => void;
  onPremium: () => void;
}) {
  const home = useHome();
  const [limit, setLimit] = useState(BOARD_PAGE_SIZE);
  const boards = home.boardsFor(workspace.id);
  const [boardsLink, membersLink, settingsLink] = workspaceLinks(workspace.id);
  const headingId = `workspace-heading-${workspace.id}`;

  let grid: React.ReactNode;
  if (!home.isReady) {
    grid = <SkeletonRow />;
  } else if (home.dataError) {
    grid = (
      <SectionError
        message={`We couldn’t load the boards in ${workspace.name}.`}
        onRetry={() => home.retryLoad()}
      />
    );
  } else {
    const shown = boards.slice(0, limit);
    grid = (
      <>
        {boards.length === 0 && (
          <Typography
            data-testid="workspace-empty"
            color="text.secondary"
            sx={{ mb: 1.5, fontSize: 14 }}
          >
            This workspace has no boards yet. Create one to get started.
          </Typography>
        )}
        <Box sx={tileGridSx}>
          {shown.map((board) => (
            <BoardTile
              key={board.id}
              board={board}
              settings={home.settings}
              favorite={home.meta[board.id]?.favorite ?? false}
              onToggleFavorite={home.toggleFavorite}
            />
          ))}
          <CreateBoardTile onClick={() => onCreateBoard(workspace.id)} />
        </Box>
        {boards.length > shown.length && (
          <Button
            variant="text"
            data-testid="show-more-boards"
            onClick={() => setLimit((current) => current + BOARD_PAGE_SIZE)}
            sx={{ mt: 1.5 }}
          >
            Show more boards ({boards.length - shown.length} remaining)
          </Button>
        )}
      </>
    );
  }

  return (
    <Box
      component="section"
      aria-labelledby={headingId}
      data-testid="workspace-section"
      sx={{ mb: 4 }}
    >
      <Stack
        direction="row"
        sx={{
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1,
          mb: 1.5
        }}
      >
        <Stack
          direction="row"
          sx={{ alignItems: "center", gap: 1.5, minWidth: 0 }}
        >
          <Avatar
            variant="rounded"
            sx={{
              width: 32,
              height: 32,
              fontWeight: 800,
              bgcolor: "primary.main",
              color: "primary.contrastText"
            }}
          >
            {workspaceInitial(workspace.name)}
          </Avatar>
          <Typography
            id={headingId}
            component="h3"
            noWrap
            sx={{ fontSize: 16, fontWeight: 700 }}
          >
            {workspace.name}
          </Typography>
        </Stack>
        <Stack
          direction="row"
          sx={{ flexWrap: "wrap", gap: 1, justifyContent: "flex-end" }}
        >
          <Button
            component={Link}
            href={boardsLink.href}
            size="small"
            variant="outlined"
            color="inherit"
            data-testid="workspace-boards-link"
          >
            Boards
          </Button>
          <Button
            component={Link}
            href={membersLink.href}
            size="small"
            variant="outlined"
            color="inherit"
            data-testid="workspace-members-link"
          >
            Members
          </Button>
          <Button
            component={Link}
            href={settingsLink.href}
            size="small"
            variant="outlined"
            color="inherit"
            data-testid="workspace-settings-link"
          >
            Settings
          </Button>
          <Button
            size="small"
            variant="contained"
            color="secondary"
            startIcon={<WorkspacePremiumOutlinedIcon fontSize="small" />}
            data-testid="workspace-premium"
            onClick={onPremium}
          >
            Try Premium
          </Button>
        </Stack>
      </Stack>
      {grid}
    </Box>
  );
}

export function HomePage() {
  const home = useHome();
  const compact = useMediaQuery("(max-width:899.95px)");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [boardFlow, setBoardFlow] = useState<{
    key: number;
    open: boolean;
    workspaceId?: string;
  }>({ key: 0, open: false });
  const [closedOpen, setClosedOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [workspaceKey, setWorkspaceKey] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);

  function openBoardFlow(workspaceId?: string) {
    setBoardFlow((current) => ({
      key: current.key + 1,
      open: true,
      workspaceId
    }));
  }

  function openWorkspaceDialog() {
    setWorkspaceKey((key) => key + 1);
    setWorkspaceOpen(true);
  }

  const sidebar = <HomeSidebar workspaces={home.workspaces} />;

  let recentBody: React.ReactNode;
  if (!home.isReady) {
    recentBody = <SkeletonRow />;
  } else if (home.dataError) {
    recentBody = (
      <SectionError
        message="We couldn’t load your recently viewed boards."
        onRetry={() => home.retryLoad()}
      />
    );
  } else if (home.recent.length === 0) {
    recentBody = (
      <Typography
        data-testid="recent-empty"
        color="text.secondary"
        sx={{ fontSize: 14 }}
      >
        Boards you open will show up here.
      </Typography>
    );
  } else {
    recentBody = (
      <Box sx={tileGridSx} data-testid="recent-grid">
        {home.recent.map((board) => (
          <BoardTile key={board.id} board={board} settings={home.settings} />
        ))}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: `calc(100vh - ${TOP_BAR_HEIGHT}px)`,
        bgcolor: "background.default"
      }}
    >
      {!compact && (
        <Box
          data-testid="home-sidebar-column"
          sx={{
            width: SIDEBAR_WIDTH,
            flexShrink: 0,
            position: "sticky",
            top: TOP_BAR_HEIGHT,
            alignSelf: "flex-start",
            height: `calc(100vh - ${TOP_BAR_HEIGHT}px)`,
            overflowY: "auto",
            borderRight: 1,
            borderColor: "divider"
          }}
        >
          {sidebar}
        </Box>
      )}

      <Box
        component="main"
        id="main"
        tabIndex={-1}
        sx={{
          flex: 1,
          minWidth: 0,
          px: { xs: 2, md: 4 },
          py: 3,
          outline: "none"
        }}
      >
        <Box
          data-testid="home-content"
          sx={{ maxWidth: CONTENT_MAX_WIDTH, mx: "auto", width: "100%" }}
        >
          {compact && (
            <IconButton
              aria-label="Open navigation"
              data-testid="home-menu-button"
              onClick={() => setDrawerOpen(true)}
              sx={{ mb: 1, ml: -1 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Box
            component="section"
            aria-labelledby="recent-heading"
            sx={{ mb: 4 }}
          >
            <Stack
              direction="row"
              sx={{ alignItems: "center", gap: 1, mb: 1.5 }}
            >
              <AccessTimeIcon fontSize="small" />
              <Typography
                id="recent-heading"
                component="h2"
                sx={{ fontSize: 16, fontWeight: 700 }}
              >
                Recently viewed
              </Typography>
            </Stack>
            {recentBody}
          </Box>

          <Typography
            component="h2"
            sx={{
              mb: 2,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: ".06em",
              color: "text.secondary"
            }}
          >
            YOUR WORKSPACES
          </Typography>

          {home.workspaces.length === 0 ? (
            <Box
              data-testid="no-workspaces"
              sx={{
                textAlign: "center",
                py: 6,
                px: 2,
                mb: 4,
                border: 1,
                borderStyle: "dashed",
                borderColor: "divider",
                borderRadius: 2
              }}
            >
              <Typography component="h3" sx={{ fontSize: 18, fontWeight: 700 }}>
                Create your first workspace
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
                Workspaces keep related boards together.
              </Typography>
              <Button
                variant="contained"
                data-testid="create-first-workspace"
                onClick={openWorkspaceDialog}
              >
                Create workspace
              </Button>
            </Box>
          ) : (
            home.workspaces.map((workspace) => (
              <WorkspaceSection
                key={workspace.id}
                workspace={workspace}
                onCreateBoard={openBoardFlow}
                onPremium={() => setNotice("Premium isn’t available yet")}
              />
            ))
          )}

          <Button
            variant="outlined"
            color="inherit"
            data-testid="view-closed-boards"
            onClick={() => setClosedOpen(true)}
          >
            View all closed boards
          </Button>
        </Box>
      </Box>

      <Drawer
        open={compact && drawerOpen}
        onClose={() => setDrawerOpen(false)}
        slotProps={{ paper: { sx: { width: SIDEBAR_WIDTH } } }}
      >
        <HomeSidebar
          workspaces={home.workspaces}
          onNavigate={() => setDrawerOpen(false)}
        />
      </Drawer>

      <CreateBoardFlow
        key={`board-${boardFlow.key}`}
        open={boardFlow.open}
        defaultWorkspaceId={boardFlow.workspaceId}
        onClose={() => setBoardFlow((current) => ({ ...current, open: false }))}
      />
      <ClosedBoardsDialog
        open={closedOpen}
        onClose={() => setClosedOpen(false)}
      />
      <CreateWorkspaceDialog
        key={`workspace-${workspaceKey}`}
        open={workspaceOpen}
        onClose={() => setWorkspaceOpen(false)}
      />
      <Snackbar
        open={notice !== null}
        autoHideDuration={4000}
        message={notice}
        onClose={() => setNotice(null)}
      />
    </Box>
  );
}
