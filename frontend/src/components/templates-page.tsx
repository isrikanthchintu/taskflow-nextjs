"use client";

import Link from "next/link";
import { Box, Button, Typography } from "@mui/material";
import { HomeSidebar, SIDEBAR_WIDTH } from "@/components/home-sidebar";
import { TOP_BAR_HEIGHT } from "@/components/global-top-bar";
import { useWorkspaces } from "@/lib/workspace-store";

export function TemplatesPage() {
  const workspaces = useWorkspaces();

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
        <HomeSidebar workspaces={workspaces} />
      </Box>
      <Box
        component="main"
        id="main"
        tabIndex={-1}
        data-testid="templates-page"
        sx={{ flex: 1, px: 4, py: 6, outline: "none" }}
      >
        <Box sx={{ maxWidth: 860, mx: "auto" }}>
          <Typography component="h1" sx={{ fontSize: 22, fontWeight: 700 }}>
            Templates
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
            Board templates are coming soon. For now, start from a blank board.
          </Typography>
          <Button component={Link} href="/" variant="contained">
            Back to boards
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
