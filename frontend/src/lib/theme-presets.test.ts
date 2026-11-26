import {
  ACCENT_PRESETS,
  BACKGROUND_PRESETS,
  CORNER_TOKENS,
  DARK_PALETTE,
  DEFAULT_BACKGROUND_ID,
  DENSITY_TOKENS,
  LIGHT_PALETTE,
  contrastRatio,
  getAccent,
  getBackground,
  getPalette
} from "@/lib/theme-presets";

const MINIMUM = 4.5;

describe("contrastRatio", () => {
  it("NFR3 returns 21 for black on white and 1 for identical colors", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#336699", "#336699")).toBeCloseTo(1, 5);
  });

  it("NFR3 is symmetric and rejects invalid colors", () => {
    expect(contrastRatio("#0079bf", "#ffffff")).toBeCloseTo(
      contrastRatio("#ffffff", "#0079bf"),
      8
    );
    expect(() => contrastRatio("blue", "#ffffff")).toThrow();
  });
});

describe("presets", () => {
  it("FR5.2 offers six accents with unique ids and names, the first being the current blue", () => {
    expect(ACCENT_PRESETS).toHaveLength(6);
    expect(new Set(ACCENT_PRESETS.map((accent) => accent.id)).size).toBe(6);
    expect(new Set(ACCENT_PRESETS.map((accent) => accent.name)).size).toBe(6);
    expect(ACCENT_PRESETS[0].light.main).toBe("#0079bf");
  });

  it("FR5.3 offers eight backgrounds, four solid and four gradient, defaulting to the blue gradient", () => {
    expect(BACKGROUND_PRESETS).toHaveLength(8);
    expect(
      BACKGROUND_PRESETS.filter((preset) => preset.kind === "solid")
    ).toHaveLength(4);
    expect(
      BACKGROUND_PRESETS.filter((preset) => preset.kind === "gradient")
    ).toHaveLength(4);
    expect(BACKGROUND_PRESETS[0].id).toBe(DEFAULT_BACKGROUND_ID);
    expect(BACKGROUND_PRESETS[0].colors).toEqual(["#0079bf", "#026aa7"]);
    expect(
      BACKGROUND_PRESETS.every((preset) => !/url\(/i.test(preset.css))
    ).toBe(true);
  });

  it("FR5.3 falls back to the default for an unknown background or accent", () => {
    expect(getBackground("nope").id).toBe(DEFAULT_BACKGROUND_ID);
    expect(getAccent("nope").id).toBe("blue");
    expect(getAccent("green").id).toBe("green");
  });

  it("FR5.4 defines density and corner tokens", () => {
    expect(DENSITY_TOKENS.compact.cardPadding).toBeLessThan(
      DENSITY_TOKENS.comfortable.cardPadding
    );
    expect(DENSITY_TOKENS.compact.cardGap).toBeLessThan(
      DENSITY_TOKENS.comfortable.cardGap
    );
    expect(CORNER_TOKENS.xs.card).toBeLessThan(CORNER_TOKENS.sm.card);
    expect(CORNER_TOKENS.sm.card).toBeLessThan(CORNER_TOKENS.md.card);
    expect(CORNER_TOKENS.md.card).toBeLessThan(CORNER_TOKENS.xl.card);
  });

  it("FR5.1 returns the light and dark palettes", () => {
    expect(getPalette("light")).toBe(LIGHT_PALETTE);
    expect(getPalette("dark")).toBe(DARK_PALETTE);
  });
});

describe("contrast of every preset pair", () => {
  it.each(ACCENT_PRESETS.map((accent) => [accent.name, accent] as const))(
    "NFR3 accent %s keeps primary button text at 4.5 to 1 or better in light and dark mode",
    (_name, accent) => {
      expect(
        contrastRatio(accent.light.contrastText, accent.light.main)
      ).toBeGreaterThanOrEqual(MINIMUM);
      expect(
        contrastRatio(accent.dark.contrastText, accent.dark.main)
      ).toBeGreaterThanOrEqual(MINIMUM);
    }
  );

  it.each(BACKGROUND_PRESETS.map((preset) => [preset.name, preset] as const))(
    "NFR3 background %s keeps top bar text at 4.5 to 1 or better on every color stop",
    (_name, preset) => {
      for (const color of preset.colors) {
        expect(contrastRatio(preset.textColor, color)).toBeGreaterThanOrEqual(
          MINIMUM
        );
      }
    }
  );

  it.each([
    ["light", LIGHT_PALETTE],
    ["dark", DARK_PALETTE]
  ] as const)(
    "NFR3 %s mode text meets 4.5 to 1 on the page, list and card surfaces",
    (_mode, palette) => {
      for (const surface of [
        palette.pageBackground,
        palette.listSurface,
        palette.cardSurface
      ]) {
        expect(
          contrastRatio(palette.textPrimary, surface)
        ).toBeGreaterThanOrEqual(MINIMUM);
        expect(
          contrastRatio(palette.textSecondary, surface)
        ).toBeGreaterThanOrEqual(MINIMUM);
      }
    }
  );
});
