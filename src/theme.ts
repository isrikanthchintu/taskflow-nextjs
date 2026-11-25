import { createTheme } from "@mui/material/styles";
import {
  CORNER_TOKENS,
  DENSITY_TOKENS,
  getAccent,
  getPalette
} from "@/lib/theme-presets";
import type { Settings } from "@/types/board";

export interface BoardTokens {
  mode: "light" | "dark";
  listSurface: string;
  cardSurface: string;
  cardHover: string;
  textPrimary: string;
  textSecondary: string;
  ring: string;
  cardPadding: number;
  cardGap: number;
  listHeaderHeight: number;
  radiusCard: number;
  radiusList: number;
  radiusButton: number;
}

declare module "@mui/material/styles" {
  interface Theme {
    board: BoardTokens;
  }
  interface ThemeOptions {
    board?: BoardTokens;
  }
}

export function resolveMode(
  settings: Settings,
  systemDark: boolean
): "light" | "dark" {
  if (settings.mode === "system") return systemDark ? "dark" : "light";
  return settings.mode;
}

export function createAppTheme(settings: Settings, systemDark = false) {
  const mode = resolveMode(settings, systemDark);
  const accent = getAccent(settings.accentId, settings.customAccentColor)[mode];
  const palette = getPalette(mode);
  const density = DENSITY_TOKENS[settings.density];
  const corners = CORNER_TOKENS[settings.corners];
  const dark = mode === "dark";

  return createTheme({
    palette: {
      mode,
      primary: { main: accent.main, contrastText: accent.contrastText },
      error: { main: dark ? "#ef6b6b" : "#c9372c" },
      warning: { main: "#f2d600", contrastText: "#172b4d" },
      success: { main: dark ? "#66bb6a" : "#1f845a" },
      background: {
        default: palette.pageBackground,
        paper: palette.cardSurface
      },
      text: {
        primary: palette.textPrimary,
        secondary: palette.textSecondary
      }
    },
    board: {
      mode,
      listSurface: palette.listSurface,
      cardSurface: palette.cardSurface,
      cardHover: dark ? "#2c333a" : "#f7f8f9",
      textPrimary: palette.textPrimary,
      textSecondary: palette.textSecondary,
      ring: dark ? "#85b8ff" : "#0c66e4",
      cardPadding: density.cardPadding,
      cardGap: density.cardGap,
      listHeaderHeight: density.listHeaderHeight,
      radiusCard: corners.card,
      radiusList: corners.list,
      radiusButton: corners.button
    },
    shape: { borderRadius: corners.button },
    typography: {
      fontFamily:
        "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    },
    transitions: {
      duration: {
        shortest: 120,
        shorter: 160,
        short: 200,
        standard: 240,
        complex: 280
      }
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          "@media (prefers-reduced-motion: reduce)": {
            "*, *::before, *::after": {
              animationDuration: "0.01ms !important",
              animationIterationCount: "1 !important",
              transitionDuration: "0.01ms !important"
            }
          }
        }
      },
      MuiButtonBase: {
        defaultProps: { disableRipple: true }
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            textTransform: "none",
            fontWeight: 700,
            borderRadius: corners.button,
            "&:focus-visible": {
              outline: "2px solid",
              outlineColor: "primary.main",
              outlineOffset: 2
            },
            transition:
              "background-color .2s ease, box-shadow .2s ease, transform .15s ease"
          },
          contained: {
            "&:hover": { transform: "translateY(-1px)" }
          }
        }
      },
      MuiPaper: {
        styleOverrides: {
          root: { transition: "box-shadow .2s ease, transform .2s ease" }
        }
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 700, transition: "transform .15s ease" }
        }
      },
      MuiDialog: {
        defaultProps: { transitionDuration: { enter: 260, exit: 180 } },
        styleOverrides: {
          paper: {
            borderRadius: corners.list,
            boxShadow: "0 18px 48px rgba(9,30,66,.24)",
            border: "1px solid rgba(9,30,66,.08)"
          }
        }
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            borderRadius: corners.button,
            boxShadow: "0 12px 32px rgba(9,30,66,.22)",
            border: "1px solid rgba(9,30,66,.10)"
          }
        }
      }
    }
  });
}
