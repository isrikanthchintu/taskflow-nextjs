"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, Box, ButtonBase, Collapse, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import ViewKanbanOutlinedIcon from "@mui/icons-material/ViewKanbanOutlined";
import { workspaceInitial } from "@/lib/home-model";
import type { Workspace } from "@/lib/workspace-store";

export const SIDEBAR_WIDTH = 256;

const navItemSx = {
  display: "flex",
  alignItems: "center",
  gap: 1.5,
  width: "100%",
  height: 40,
  px: 1.5,
  borderRadius: 1,
  fontSize: 14,
  fontWeight: 600,
  color: "text.primary",
  textDecoration: "none",
  textAlign: "left",
  justifyContent: "flex-start",
  "&:hover": { bgcolor: "action.hover" },
  "&:focus-visible": {
    outline: "2px solid",
    outlineColor: "primary.main",
    outlineOffset: -2
  }
} as const;

const activeSx = (theme: import("@mui/material").Theme) => ({
  bgcolor: alpha(theme.palette.primary.main, 0.14),
  color: "primary.main",
  "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.2) }
});

export function workspaceLinks(workspaceId: string) {
  return [
    { label: "Boards", href: `/w/${workspaceId}/boards` },
    { label: "Members", href: `/w/${workspaceId}/members` },
    { label: "Settings", href: `/w/${workspaceId}/settings` }
  ];
}

export function HomeSidebar({
  workspaces,
  onNavigate
}: {
  workspaces: Workspace[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname() ?? "/";
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const primary = [
    {
      id: "boards",
      label: "Boards",
      href: "/",
      icon: <ViewKanbanOutlinedIcon fontSize="small" />,
      active: pathname === "/"
    },
    {
      id: "templates",
      label: "Templates",
      href: "/templates",
      icon: <DashboardOutlinedIcon fontSize="small" />,
      active: pathname.startsWith("/templates")
    },
    {
      id: "home",
      label: "Home",
      href: "/",
      icon: <HomeOutlinedIcon fontSize="small" />,
      active: false
    }
  ];

  return (
    <Box
      component="nav"
      aria-label="Home navigation"
      data-testid="home-sidebar"
      sx={{ p: 1.5, display: "flex", flexDirection: "column", gap: 0.5 }}
    >
      {primary.map((item) => (
        <Box
          key={item.id}
          component={Link}
          href={item.href}
          data-testid={`sidebar-${item.id}`}
          aria-current={item.active ? "page" : undefined}
          onClick={onNavigate}
          sx={(theme) => ({
            ...navItemSx,
            ...(item.active ? activeSx(theme) : {})
          })}
        >
          {item.icon}
          {item.label}
        </Box>
      ))}

      {workspaces.length > 0 && (
        <>
          <Typography
            id="sidebar-workspaces-label"
            sx={{
              mt: 2,
              mb: 0.5,
              px: 1.5,
              fontSize: 12,
              fontWeight: 700,
              color: "text.secondary"
            }}
          >
            Workspaces
          </Typography>
          <Box
            component="ul"
            aria-labelledby="sidebar-workspaces-label"
            sx={{ listStyle: "none", m: 0, p: 0 }}
          >
            {workspaces.map((workspace) => {
              const open = expanded[workspace.id] ?? false;
              const panelId = `sidebar-workspace-${workspace.id}`;
              return (
                <Box component="li" key={workspace.id}>
                  <ButtonBase
                    data-testid={`sidebar-workspace-${workspace.id}`}
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() =>
                      setExpanded((current) => ({
                        ...current,
                        [workspace.id]: !open
                      }))
                    }
                    sx={navItemSx}
                  >
                    <Avatar
                      variant="rounded"
                      sx={{
                        width: 24,
                        height: 24,
                        fontSize: 13,
                        fontWeight: 800,
                        bgcolor: "primary.main",
                        color: "primary.contrastText"
                      }}
                    >
                      {workspaceInitial(workspace.name)}
                    </Avatar>
                    <Box
                      component="span"
                      sx={{
                        flex: 1,
                        minWidth: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}
                    >
                      {workspace.name}
                    </Box>
                    {open ? (
                      <ExpandLessIcon fontSize="small" />
                    ) : (
                      <ExpandMoreIcon fontSize="small" />
                    )}
                  </ButtonBase>
                  <Collapse in={open} unmountOnExit id={panelId}>
                    <Box
                      component="ul"
                      sx={{ listStyle: "none", m: 0, py: 0.5, pl: 5, pr: 0 }}
                    >
                      {workspaceLinks(workspace.id).map((link) => (
                        <Box component="li" key={link.href}>
                          <Box
                            component={Link}
                            href={link.href}
                            onClick={onNavigate}
                            sx={{ ...navItemSx, height: 36, fontWeight: 500 }}
                          >
                            {link.label}
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Collapse>
                </Box>
              );
            })}
          </Box>
        </>
      )}
    </Box>
  );
}
