import type { Corners, Density, Settings, ThemeMode } from "@/types/board";

export interface AccentPreset {
  id: string;
  name: string;
  light: { main: string; contrastText: string };
  dark: { main: string; contrastText: string };
}

export interface BackgroundPreset {
  id: string;
  name: string;
  kind: "solid" | "gradient";
  colors: string[];
  textColor: string;
  css: string;
}

export interface ModePalette {
  pageBackground: string;
  listSurface: string;
  cardSurface: string;
  textPrimary: string;
  textSecondary: string;
}

export interface DensityTokens {
  cardPadding: number;
  cardGap: number;
  listHeaderHeight: number;
}

export interface CornerTokens {
  card: number;
  list: number;
  button: number;
}

export const DEFAULT_ACCENT_ID = "blue";
export const DEFAULT_BACKGROUND_ID = "blue-gradient";
export const THEME_MODES: ThemeMode[] = ["light", "dark", "system"];
export const DENSITIES: Density[] = ["comfortable", "compact"];
export const CORNER_OPTIONS: Corners[] = ["square", "rounded", "very-rounded"];

export const DEFAULT_SETTINGS: Settings = {
  mode: "system",
  accentId: DEFAULT_ACCENT_ID,
  density: "comfortable",
  corners: "rounded"
};

export const ACCENT_PRESETS: AccentPreset[] = [
  {
    id: "blue",
    name: "Blue",
    light: { main: "#0079bf", contrastText: "#ffffff" },
    dark: { main: "#5aa9f0", contrastText: "#0b1220" }
  },
  {
    id: "green",
    name: "Green",
    light: { main: "#2e7d32", contrastText: "#ffffff" },
    dark: { main: "#66bb6a", contrastText: "#0b1220" }
  },
  {
    id: "purple",
    name: "Purple",
    light: { main: "#6a3fb5", contrastText: "#ffffff" },
    dark: { main: "#b794f4", contrastText: "#0b1220" }
  },
  {
    id: "orange",
    name: "Orange",
    light: { main: "#b45309", contrastText: "#ffffff" },
    dark: { main: "#f59e0b", contrastText: "#0b1220" }
  },
  {
    id: "red",
    name: "Red",
    light: { main: "#c62828", contrastText: "#ffffff" },
    dark: { main: "#ef6b6b", contrastText: "#0b1220" }
  },
  {
    id: "slate",
    name: "Slate",
    light: { main: "#44546f", contrastText: "#ffffff" },
    dark: { main: "#9fb3c8", contrastText: "#0b1220" }
  }
];

function solid(id: string, name: string, color: string): BackgroundPreset {
  return {
    id,
    name,
    kind: "solid",
    colors: [color],
    textColor: "#ffffff",
    css: color
  };
}

function gradient(
  id: string,
  name: string,
  from: string,
  to: string
): BackgroundPreset {
  return {
    id,
    name,
    kind: "gradient",
    colors: [from, to],
    textColor: "#ffffff",
    css: `linear-gradient(135deg, ${from}, ${to})`
  };
}

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  gradient("blue-gradient", "Blue gradient", "#0079bf", "#026aa7"),
  solid("blue", "Blue", "#0b66a8"),
  solid("green", "Green", "#2e7d32"),
  solid("purple", "Purple", "#6a3fb5"),
  solid("slate", "Slate", "#44546f"),
  gradient("sunset", "Sunset", "#b45309", "#c62828"),
  gradient("forest", "Forest", "#2e7d32", "#00695c"),
  gradient("dusk", "Dusk", "#6a3fb5", "#a02c7a")
];

export const LIGHT_PALETTE: ModePalette = {
  pageBackground: "#f8f8fb",
  listSurface: "#f1f2f4",
  cardSurface: "#ffffff",
  textPrimary: "#172b4d",
  textSecondary: "#5b677d"
};

export const DARK_PALETTE: ModePalette = {
  pageBackground: "#101417",
  listSurface: "#161a1d",
  cardSurface: "#22272b",
  textPrimary: "#b6c2cf",
  textSecondary: "#9fadbc"
};

export const DENSITY_TOKENS: Record<Density, DensityTokens> = {
  comfortable: { cardPadding: 12, cardGap: 8, listHeaderHeight: 44 },
  compact: { cardPadding: 8, cardGap: 4, listHeaderHeight: 36 }
};

export const CORNER_TOKENS: Record<Corners, CornerTokens> = {
  square: { card: 0, list: 0, button: 0 },
  rounded: { card: 8, list: 12, button: 8 },
  "very-rounded": { card: 16, list: 20, button: 999 }
};

export function getAccent(id: string): AccentPreset {
  return ACCENT_PRESETS.find((accent) => accent.id === id) ?? ACCENT_PRESETS[0];
}

export function getBackground(id: string): BackgroundPreset {
  return (
    BACKGROUND_PRESETS.find((background) => background.id === id) ??
    BACKGROUND_PRESETS[0]
  );
}

export function getPalette(mode: "light" | "dark"): ModePalette {
  return mode === "dark" ? DARK_PALETTE : LIGHT_PALETTE;
}

function channel(value: number): number {
  const scaled = value / 255;
  return scaled <= 0.03928
    ? scaled / 12.92
    : Math.pow((scaled + 0.055) / 1.055, 2.4);
}

function luminance(hex: string): number {
  const match = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) throw new Error(`Invalid hex color: ${hex}`);
  const value = parseInt(match[1], 16);
  const red = channel((value >> 16) & 255);
  const green = channel((value >> 8) & 255);
  const blue = channel(value & 255);
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

export function contrastRatio(foreground: string, background: string): number {
  const first = luminance(foreground);
  const second = luminance(background);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}
