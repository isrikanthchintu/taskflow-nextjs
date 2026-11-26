import { useCallback, useEffect, useState } from "react";

export const SEEN_KEY = "taskflow.topbar.seen.v1";

type SeenMap = Record<string, string>;

function readSeen(): SeenMap {
  try {
    const raw = window.localStorage.getItem(SEEN_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? (parsed as SeenMap) : {};
  } catch {
    return {};
  }
}

function writeSeen(map: SeenMap) {
  try {
    window.localStorage.setItem(SEEN_KEY, JSON.stringify(map));
  } catch {
    return;
  }
}

export function useSeenIndicator(key: string, version: string) {
  const [unseen, setUnseen] = useState(false);

  useEffect(() => {
    setUnseen(readSeen()[key] !== version);
  }, [key, version]);

  const markSeen = useCallback(() => {
    setUnseen(false);
    writeSeen({ ...readSeen(), [key]: version });
  }, [key, version]);

  return { unseen, markSeen };
}
