"use client";

import Link from "next/link";
import {
  Box,
  FormControl,
  FormControlLabel,
  FormLabel,
  IconButton,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloseIcon from "@mui/icons-material/Close";
import { BannerStack } from "@/components/banner-stack";
import { useBoard } from "@/hooks/use-board";
import {
  ACCENT_PRESETS,
  BACKGROUND_PRESETS,
  CORNER_OPTIONS,
  DENSITIES,
  THEME_MODES,
  getAccent,
  getBackground
} from "@/lib/theme-presets";
import type { Corners, Density, ThemeMode } from "@/types/board";

const MODE_LABELS: Record<ThemeMode, string> = {
  system: "System",
  light: "Light",
  dark: "Dark"
};

const DENSITY_LABELS: Record<Density, string> = {
  comfortable: "Comfortable",
  compact: "Compact"
};

const CORNER_LABELS: Record<Corners, string> = {
  xs: "Extra small",
  sm: "Small",
  md: "Medium",
  xl: "Extra large"
};

function Swatch({
  background,
  checked,
  testId
}: {
  background: string;
  checked: boolean;
  testId: string;
}) {
  return (
    <Box
      data-testid={testId}
      aria-hidden="true"
      sx={{
        width: 28,
        height: 28,
        borderRadius: "50%",
        background,
        display: "grid",
        placeItems: "center",
        color: "#fff",
        border: "2px solid",
        borderColor: checked ? "text.primary" : "transparent",
        boxShadow: "0 0 0 1px rgba(9,30,66,.25)"
      }}
    >
      {checked && <CheckIcon sx={{ fontSize: 16 }} />}
    </Box>
  );
}

function SettingsGroup({
  legend,
  children
}: {
  legend: string;
  children: React.ReactNode;
}) {
  return (
    <FormControl component="fieldset" sx={{ mb: 3, display: "block" }}>
      <FormLabel
        component="legend"
        sx={{ fontWeight: 700, color: "text.primary", mb: 0.5 }}
      >
        {legend}
      </FormLabel>
      {children}
    </FormControl>
  );
}

export function SettingsPage({
  embedded = false,
  onClose
}: {
  embedded?: boolean;
  onClose?: () => void;
} = {}) {
  const {
    data,
    board,
    isReady,
    dataError,
    saveError,
    notice,
    dismissNotice,
    dismissSaveError,
    backupSavedData,
    resetSavedData,
    updateSettings,
    setBoardBackground
  } = useBoard();
  const { settings } = data;
  const accent = getAccent(settings.accentId, settings.customAccentColor);
  const background = getBackground(
    board.backgroundId,
    settings.customBackgroundStart,
    settings.customBackgroundEnd
  );
  const locked = Boolean(dataError);

  return (
    <Box
      sx={{
        height: embedded ? "100%" : "100vh",
        bgcolor: "background.default",
        color: "text.primary",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden"
      }}
    >
      <Box
        component="header"
        sx={{ display: "flex", alignItems: "center", gap: 2, px: 2, py: 1.5 }}
      >
        {!embedded && (
          <Link
            href="/"
            data-testid="back-to-board"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: "inherit",
              fontWeight: 700
            }}
          >
            <ArrowBackIcon />
            Back to board
          </Link>
        )}
        <Typography component="h1" sx={{ fontSize: 24, fontWeight: 700 }}>
          Settings
        </Typography>
        {embedded && (
          <IconButton onClick={onClose} sx={{ ml: "auto" }} aria-label="Close settings">
            <CloseIcon />
          </IconButton>
        )}
      </Box>

      <BannerStack
        dataError={dataError}
        saveError={saveError}
        notice={notice}
        onDismissSaveError={dismissSaveError}
        onBackupData={backupSavedData}
        onResetData={resetSavedData}
        onDismissNotice={dismissNotice}
      />

      <Box
        component="main"
        sx={{
          display: "grid",
          gridTemplateColumns: embedded ? "1fr" : { xs: "1fr", md: "1fr 1fr" },
          gap: 4,
          px: embedded ? 2 : 3,
          pb: 6,
          flex: 1,
          overflowY: "auto"
        }}
      >
        {!isReady ? (
          <Typography>Loading your settings...</Typography>
        ) : (
          <>
            <Box sx={{ order: { xs: 2, md: 1 } }}>
              <Typography
                component="h2"
                sx={{ fontSize: 18, fontWeight: 700, mb: 2 }}
              >
                Appearance
              </Typography>

              <SettingsGroup legend="Mode">
                <RadioGroup
                  row
                  aria-label="Mode"
                  value={settings.mode}
                  onChange={(event) =>
                    updateSettings({ mode: event.target.value as ThemeMode })
                  }
                >
                  {THEME_MODES.map((mode) => (
                    <FormControlLabel
                      key={mode}
                      value={mode}
                      disabled={locked}
                      control={
                        <Radio
                          slotProps={{
                            input: {
                              "data-testid": `setting-mode-${mode}`
                            } as React.InputHTMLAttributes<HTMLInputElement>
                          }}
                        />
                      }
                      label={MODE_LABELS[mode]}
                    />
                  ))}
                </RadioGroup>
                <Typography
                  role="status"
                  aria-live="polite"
                  data-testid="setting-mode-status"
                  variant="body2"
                  color="text.secondary"
                >
                  {MODE_LABELS[settings.mode]} mode selected
                </Typography>
              </SettingsGroup>

              <SettingsGroup legend="Accent color">
                <RadioGroup
                  row
                  aria-label="Accent color"
                  value={settings.accentId}
                  onChange={(event) =>
                    updateSettings({ accentId: event.target.value })
                  }
                >
                  {ACCENT_PRESETS.map((preset) => (
                    <FormControlLabel
                      key={preset.id}
                      value={preset.id}
                      disabled={locked}
                      control={
                        <Radio
                          icon={
                            <Swatch
                              background={preset.light.main}
                              checked={false}
                              testId={`accent-swatch-${preset.id}`}
                            />
                          }
                          checkedIcon={
                            <Swatch
                              background={preset.light.main}
                              checked
                              testId={`accent-swatch-${preset.id}`}
                            />
                          }
                          slotProps={{
                            input: {
                              "data-testid": `setting-accent-${preset.id}`
                            } as React.InputHTMLAttributes<HTMLInputElement>
                          }}
                        />
                      }
                      label={preset.name}
                    />
                  ))}
                </RadioGroup>
                <Typography variant="body2" color="text.secondary">
                  Selected: {accent.name}
                </Typography>

                <Stack
                  direction="row"
                  spacing={1.5}
                  sx={{ alignItems: "center", mt: 1.5 }}
                >
                  <TextField
                    type="color"
                    label="Custom accent RGB"
                    size="small"
                    disabled={locked}
                    value={settings.customAccentColor ?? "#0079bf"}
                    onChange={(event) =>
                      updateSettings({
                        accentId: "custom",
                        customAccentColor: event.target.value
                      })
                    }
                    slotProps={{ htmlInput: { "aria-label": "Custom accent RGB" } }}
                    sx={{ width: 92 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {settings.customAccentColor ?? "#0079bf"}
                  </Typography>
                </Stack>
              </SettingsGroup>

              <SettingsGroup legend="Density">
                <RadioGroup
                  row
                  aria-label="Density"
                  value={settings.density}
                  onChange={(event) =>
                    updateSettings({ density: event.target.value as Density })
                  }
                >
                  {DENSITIES.map((density) => (
                    <FormControlLabel
                      key={density}
                      value={density}
                      disabled={locked}
                      control={
                        <Radio
                          slotProps={{
                            input: {
                              "data-testid": `setting-density-${density}`
                            } as React.InputHTMLAttributes<HTMLInputElement>
                          }}
                        />
                      }
                      label={DENSITY_LABELS[density]}
                    />
                  ))}
                </RadioGroup>
              </SettingsGroup>

              <SettingsGroup legend="Corners">
                <RadioGroup
                  row
                  aria-label="Corners"
                  value={settings.corners}
                  onChange={(event) =>
                    updateSettings({ corners: event.target.value as Corners })
                  }
                  sx={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(72px, 1fr))", gap: 1 }}
                >
                  {CORNER_OPTIONS.map((corners) => {
                    const radius =
                      corners === "xs" ? 4 : corners === "sm" ? 8 : corners === "md" ? 12 : 20;
                    return (
                      <FormControlLabel
                        key={corners}
                        value={corners}
                        disabled={locked}
                        sx={{ m: 0 }}
                        control={
                          <Radio
                            slotProps={{
                              input: {
                                "data-testid": `setting-corners-${corners}`
                              } as React.InputHTMLAttributes<HTMLInputElement>
                            }}
                          />
                        }
                        label={
                          <Stack spacing={0.75} sx={{ alignItems: "center", py: 0.5 }}>
                            <Box
                              sx={{
                                width: 44,
                                height: 44,
                                border: "1px solid",
                                borderColor: "text.secondary",
                                borderRadius: `${radius}px`,
                                bgcolor: "background.default"
                              }}
                            />
                            <Typography variant="caption">{CORNER_LABELS[corners]}</Typography>
                          </Stack>
                        }
                      />
                    );
                  })}
                </RadioGroup>
              </SettingsGroup>

              <Typography
                component="h2"
                sx={{ fontSize: 18, fontWeight: 700, mb: 2 }}
              >
                Board background
              </Typography>
              <SettingsGroup legend={`Background for '${board.name}'`}>
                <RadioGroup
                  row
                  aria-label="Board background"
                  value={board.backgroundId}
                  onChange={(event) => setBoardBackground(event.target.value)}
                >
                  {BACKGROUND_PRESETS.map((preset) => (
                    <FormControlLabel
                      key={preset.id}
                      value={preset.id}
                      disabled={locked}
                      control={
                        <Radio
                          icon={
                            <Swatch
                              background={preset.css}
                              checked={false}
                              testId={`background-swatch-${preset.id}`}
                            />
                          }
                          checkedIcon={
                            <Swatch
                              background={preset.css}
                              checked
                              testId={`background-swatch-${preset.id}`}
                            />
                          }
                          slotProps={{
                            input: {
                              "data-testid": `setting-background-${preset.id}`
                            } as React.InputHTMLAttributes<HTMLInputElement>
                          }}
                        />
                      }
                      label={`${preset.name} background`}
                    />
                  ))}
                </RadioGroup>
                <Typography variant="body2" color="text.secondary">
                  Selected: {background.name}
                </Typography>

                <Stack
                  direction="row"
                  spacing={1.5}
                  sx={{ alignItems: "center", mt: 1.5 }}
                >
                  <TextField
                    type="color"
                    label="Start RGB"
                    size="small"
                    disabled={locked}
                    value={settings.customBackgroundStart ?? "#0079bf"}
                    onChange={(event) => {
                      setBoardBackground("custom");
                      updateSettings({ customBackgroundStart: event.target.value });
                    }}
                    sx={{ width: 92 }}
                  />
                  <TextField
                    type="color"
                    label="End RGB"
                    size="small"
                    disabled={locked}
                    value={settings.customBackgroundEnd ?? "#026aa7"}
                    onChange={(event) => {
                      setBoardBackground("custom");
                      updateSettings({ customBackgroundEnd: event.target.value });
                    }}
                    sx={{ width: 92 }}
                  />
                </Stack>
              </SettingsGroup>
            </Box>

            <Box sx={{ order: { xs: 1, md: 2 } }}>
              <Typography
                component="h2"
                sx={{ fontSize: 18, fontWeight: 700, mb: 2 }}
              >
                Preview
              </Typography>
              <Box
                data-testid="settings-preview"
                sx={{
                  background: background.css,
                  color: background.textColor,
                  p: 3,
                  borderRadius: (theme) => `${theme.board.radiusList}px`
                }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    width: 260,
                    maxWidth: "100%",
                    p: 1.5,
                    bgcolor: (theme) => theme.board.listSurface,
                    color: (theme) => theme.board.textPrimary,
                    borderRadius: (theme) => `${theme.board.radiusList}px`
                  }}
                >
                  <Typography sx={{ fontSize: 14, fontWeight: 700, mb: 1 }}>
                    Sample list
                  </Typography>
                  <Stack sx={{ gap: (theme) => `${theme.board.cardGap}px` }}>
                    {["Write the plan", "Review the plan"].map((title) => (
                      <Box
                        key={title}
                        sx={{
                          p: (theme) => `${theme.board.cardPadding}px`,
                          bgcolor: (theme) => theme.board.cardSurface,
                          borderRadius: (theme) =>
                            `${theme.board.radiusCard}px`,
                          boxShadow:
                            "0 1px 1px rgba(9,30,66,.25), 0 0 0 1px rgba(9,30,66,.08)",
                          fontSize: 14
                        }}
                      >
                        {title}
                      </Box>
                    ))}
                  </Stack>
                  <Box
                    component="span"
                    sx={{
                      display: "inline-block",
                      mt: 1.5,
                      px: 1.5,
                      py: 0.5,
                      fontSize: 13,
                      fontWeight: 700,
                      bgcolor: "primary.main",
                      color: "primary.contrastText",
                      borderRadius: (theme) => `${theme.board.radiusButton}px`
                    }}
                  >
                    Add a card
                  </Box>
                </Paper>
              </Box>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
}
