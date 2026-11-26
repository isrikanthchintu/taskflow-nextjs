"use client";

import { usePathname } from "next/navigation";
import { Box } from "@mui/material";
import {
  GlobalTopBar,
  TOP_BAR_HEIGHT,
  variantForPath
} from "@/components/global-top-bar";
import { SearchProvider } from "@/components/search-context";

const visuallyHidden = {
  position: "absolute",
  width: 1,
  height: 1,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap"
} as const;

function focusMain(event: React.MouseEvent) {
  event.preventDefault();
  document.querySelector<HTMLElement>("main")?.focus();
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const onBoard = variantForPath(pathname) === "board";

  return (
    <SearchProvider>
      <Box
        component="a"
        href="#board-main"
        data-testid="skip-link"
        onClick={focusMain}
        sx={{
          ...visuallyHidden,
          "&:focus": {
            position: "fixed",
            top: 8,
            left: 8,
            zIndex: 2000,
            width: "auto",
            height: "auto",
            clip: "auto",
            p: 1.5,
            bgcolor: "#fff",
            color: "#172b4d",
            fontWeight: 700,
            borderRadius: 1,
            outline: "2px solid #0c66e4"
          }
        }}
      >
        Skip to board
      </Box>
      <GlobalTopBar />
      <Box sx={{ pt: onBoard ? 0 : `${TOP_BAR_HEIGHT}px` }}>{children}</Box>
    </SearchProvider>
  );
}
