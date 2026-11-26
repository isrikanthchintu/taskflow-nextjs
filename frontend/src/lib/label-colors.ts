import { contrastRatio } from "@/lib/theme-presets";

export interface LabelColor {
  value: string;
  name: string;
}

export const LABEL_COLORS: LabelColor[] = [
  { value: "#ffd2cc", name: "Red" },
  { value: "#fedec8", name: "Orange" },
  { value: "#f5e6a0", name: "Yellow" },
  { value: "#bfeccd", name: "Green" },
  { value: "#b6e8ee", name: "Teal" },
  { value: "#c9def9", name: "Blue" },
  { value: "#e0d4f7", name: "Purple" },
  { value: "#fdd3e8", name: "Pink" },
  { value: "#d9dde3", name: "Gray" }
];

export const DEFAULT_LABEL_COLOR = LABEL_COLORS[5].value;
const DARK_INK = "#172b4d";
const LIGHT_INK = "#ffffff";

export function labelColorName(value: string): string {
  return (
    LABEL_COLORS.find((color) => color.value === value.toLowerCase())?.name ??
    "Custom"
  );
}

export function labelTextColor(background: string): string {
  if (!/^#[0-9a-f]{6}$/i.test(background)) return DARK_INK;
  return contrastRatio(DARK_INK, background) >=
    contrastRatio(LIGHT_INK, background)
    ? DARK_INK
    : LIGHT_INK;
}
