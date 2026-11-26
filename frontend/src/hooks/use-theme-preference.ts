import { useCallback } from "react";
import { currentSaveError, useBoard } from "@/hooks/use-board";
import type { ThemeMode } from "@/types/board";

export const THEME_SAVE_FAILED = "Couldn't save theme preference";

export function useThemePreference(
  onSaveFailed: (message: string, retry: () => void) => void
) {
  const { data, updateSettings } = useBoard();
  const mode = data.settings.mode;

  const select = useCallback(
    function apply(next: ThemeMode) {
      const result = updateSettings({ mode: next });
      if (!result.ok || currentSaveError()) {
        onSaveFailed(THEME_SAVE_FAILED, () => apply(next));
      }
    },
    [updateSettings, onSaveFailed]
  );

  return { mode, select };
}
