import { act, render, screen } from "@testing-library/react";
import { useTheme } from "@mui/material";
import { ThemeRegistry } from "@/theme-registry";
import { createDefaultData } from "@/lib/board-schema";
import { seedData } from "@/test-utils";

type Listener = () => void;

function installSystemScheme(initialDark: boolean) {
  let dark = initialDark;
  const listeners = new Set<Listener>();
  window.matchMedia = ((query: string) => ({
    get matches() {
      return query.includes("prefers-color-scheme: dark") ? dark : false;
    },
    media: query,
    addEventListener: (_type: string, listener: Listener) =>
      listeners.add(listener),
    removeEventListener: (_type: string, listener: Listener) =>
      listeners.delete(listener),
    addListener: (listener: Listener) => listeners.add(listener),
    removeListener: (listener: Listener) => listeners.delete(listener),
    dispatchEvent: jest.fn(),
    onchange: null
  })) as unknown as typeof window.matchMedia;
  return {
    set(next: boolean) {
      dark = next;
      listeners.forEach((listener) => listener());
    }
  };
}

function Mode() {
  return <output data-testid="mode">{useTheme().palette.mode}</output>;
}

describe("ThemeRegistry", () => {
  const original = window.matchMedia;

  beforeEach(() => window.localStorage.clear());
  afterEach(() => {
    window.matchMedia = original;
  });

  it("FR-10 follows OS colour scheme changes live while set to Match System", async () => {
    const system = installSystemScheme(false);
    const data = createDefaultData();
    seedData({ ...data, settings: { ...data.settings, mode: "system" } });

    render(
      <ThemeRegistry>
        <Mode />
      </ThemeRegistry>
    );
    expect(await screen.findByTestId("mode")).toHaveTextContent("light");

    act(() => system.set(true));
    expect(screen.getByTestId("mode")).toHaveTextContent("dark");

    act(() => system.set(false));
    expect(screen.getByTestId("mode")).toHaveTextContent("light");
  });

  it("FR-10 ignores the OS scheme when a fixed theme is chosen", async () => {
    const system = installSystemScheme(false);
    const data = createDefaultData();
    seedData({ ...data, settings: { ...data.settings, mode: "light" } });

    render(
      <ThemeRegistry>
        <Mode />
      </ThemeRegistry>
    );
    await screen.findByTestId("mode");
    act(() => system.set(true));

    expect(screen.getByTestId("mode")).toHaveTextContent("light");
  });
});
