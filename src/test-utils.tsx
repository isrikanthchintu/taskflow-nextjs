import { AppShell } from "@/components/app-shell";
import { render, type RenderResult } from "@testing-library/react";
import { ThemeProvider } from "@mui/material";
import { DATA_KEY, readAppData } from "@/lib/board-storage";
import { DEFAULT_SETTINGS } from "@/lib/theme-presets";
import { createAppTheme } from "@/theme";
import type { AppData, Settings } from "@/types/board";

export function renderWithTheme(
  ui: React.ReactElement,
  settings: Settings = DEFAULT_SETTINGS
): RenderResult {
  return render(
    <ThemeProvider theme={createAppTheme(settings)}>{ui}</ThemeProvider>
  );
}

export function seedData(data: AppData): void {
  window.localStorage.setItem(DATA_KEY, JSON.stringify(data));
}

export function storedData(): AppData {
  const result = readAppData();
  if (result.status !== "ok") throw new Error("No readable stored data");
  return result.data;
}

export function renderApp(
  ui: React.ReactElement,
  settings: Settings = DEFAULT_SETTINGS
): RenderResult {
  return renderWithTheme(<AppShell>{ui}</AppShell>, settings);
}

export function routerMock() {
  return (globalThis as unknown as { __mockRouter: Record<string, jest.Mock> })
    .__mockRouter;
}

export function setMockPathname(pathname: string | null): void {
  Object.assign(globalThis, { __mockPathname: pathname });
}
