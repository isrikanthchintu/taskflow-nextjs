import { DEFAULT_SETTINGS } from "@/lib/theme-presets";
import type { Settings } from "@/types/board";

export const REMOTE_SETTINGS_KEY = "taskflow.api-settings.v1";

export function readRemoteSettings(): Settings {
  if (typeof window === "undefined") return { ...DEFAULT_SETTINGS };
  try {
    const raw = window.localStorage.getItem(REMOTE_SETTINGS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return { ...DEFAULT_SETTINGS, ...(parsed as Partial<Settings>) };
    }
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
  return { ...DEFAULT_SETTINGS };
}

export function writeRemoteSettings(settings: Settings): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(REMOTE_SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}
