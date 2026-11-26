"use client";

import Link from "next/link";
import { Box, Button, Typography } from "@mui/material";
import {
  BoardTile,
  CreateBoardTile,
  SkeletonRow,
  tileGridSx
} from "@/components/board-tile";
import { CreateBoardFlow } from "@/components/create-board-dialog";
import { TOP_BAR_HEIGHT } from "@/components/global-top-bar";
import { HomeSidebar, SIDEBAR_WIDTH } from "@/components/home-sidebar";
import { useHome } from "@/hooks/use-home";
import { useState } from "react";

const SECTIONS = ["boards", "members", "settings"] as const;
type Section = (typeof SECTIONS)[number];

function isSection(value: string): value is Section {
  return SECTIONS.includes(value as Section);
}

export function WorkspacePage({
  workspaceId,
  section
}: {
  workspaceId: string;
  section: string;
}) {
  const home = useHome();
  const [creating, setCreating] = useState(false);
  const workspace = home.workspaces.find((item) => item.id === workspaceId);
  const known = isSection(section);

  let content: React.ReactNode;
  if (!workspace || !known) {
    content = (
      <>
        <Typography component="h1" sx={{ fontSize: 22, fontWeight: 700 }}>
          Workspace not found
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
          This workspace doesn’t exist or you no longer have access to it.
        </Typography>
        <Button component={Link} href="/" variant="contained">
          Back to Home
        </Button>
      </>
    );
  } else if (section === "boards") {
    const boards = home.boardsFor(workspace.id);
    content = (
      <>
        <Typography
          component="h1"
          sx={{ fontSize: 22, fontWeight: 700, mb: 2 }}
        >
          {workspace.name} boards
        </Typography>
        {!home.isReady ? (
          <SkeletonRow />
        ) : (
          <Box sx={tileGridSx}>
            {boards.map((board) => (
              <BoardTile
                key={board.id}
                board={board}
                settings={home.settings}
                favorite={home.meta[board.id]?.favorite ?? false}
                onToggleFavorite={home.toggleFavorite}
              />
            ))}
            <CreateBoardTile onClick={() => setCreating(true)} />
          </Box>
        )}
        <CreateBoardFlow
          key={String(creating)}
          open={creating}
          defaultWorkspaceId={workspace.id}
          onClose={() => setCreating(false)}
        />
      </>
    );
  } else {
    content = (
      <>
        <Typography component="h1" sx={{ fontSize: 22, fontWeight: 700 }}>
          {workspace.name} {section}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
          Workspace {section} aren’t available yet.
        </Typography>
        <Button component={Link} href="/" variant="contained">
          Back to Home
        </Button>
      </>
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
      <Box
        sx={{
          display: { xs: "none", md: "block" },
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          borderRight: 1,
          borderColor: "divider"
        }}
      >
        <HomeSidebar workspaces={home.workspaces} />
      </Box>
      <Box
        component="main"
        id="main"
        tabIndex={-1}
        data-testid="workspace-page"
        sx={{
          flex: 1,
          minWidth: 0,
          px: { xs: 2, md: 4 },
          py: 4,
          outline: "none"
        }}
      >
        <Box sx={{ maxWidth: 860, mx: "auto" }}>{content}</Box>
      </Box>
    </Box>
  );
}
