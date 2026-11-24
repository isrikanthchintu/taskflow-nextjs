"use client";

import { useMemo } from "react";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { CssBaseline, ThemeProvider, useMediaQuery } from "@mui/material";
import { useBoard } from "@/hooks/use-board";
import { createAppTheme } from "@/theme";

export function ThemeRegistry({ children }: { children: React.ReactNode }) {
  const { data } = useBoard();
  const systemDark = useMediaQuery("(prefers-color-scheme: dark)");
  const { mode, accentId, density, corners } = data.settings;
  const theme = useMemo(
    () => createAppTheme({ mode, accentId, density, corners }, systemDark),
    [mode, accentId, density, corners, systemDark]
  );

  return (
    <AppRouterCacheProvider options={{ key: "mui" }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
