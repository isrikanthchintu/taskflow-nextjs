import { useSyncExternalStore } from "react";

export const BOARD_META_KEY = "taskflow.board-meta.v1";

export const VISIBILITIES = ["private", "workspace", "public"] as const;
export type Visibility = (typeof VISIBILITIES)[number];
export const DEFAULT_VISIBILITY: Visibility = "workspace";

export const VISIBILITY_LABELS: Record<Visibility, string> = {
  private: "Private",
  workspace: "Workspace",
  public: "Public"
};

export interface BoardMeta {
  workspaceId?: string;
  visibility: Visibility;
  favorite: boolean;
  lastViewedAt?: number;
}

export type MetaMap = Record<string, BoardMeta>;

const EMPTY: MetaMap = {};
const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cachedMap: MetaMap = EMPTY;

function emit() {
  listeners.forEach((listener) => listener());
}

function isVisibility(value: unknown): value is Visibility {
  return VISIBILITIES.includes(value as Visibility);
}

function parse(raw: string | null): MetaMap {
  if (!raw) return EMPTY;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return EMPTY;
    }
    const map: MetaMap = {};
    for (const [id, entry] of Object.entries(value)) {
      if (!entry || typeof entry !== "object") continue;
      const item = entry as Partial<BoardMeta>;
      map[id] = {
        workspaceId:
          typeof item.workspaceId === "string" ? item.workspaceId : undefined,
        visibility: isVisibility(item.visibility)
          ? item.visibility
          : DEFAULT_VISIBILITY,
        favorite: item.favorite === true,
        lastViewedAt:
          typeof item.lastViewedAt === "number" ? item.lastViewedAt : undefined
      };
    }
    return map;
  } catch {
    return EMPTY;
  }
}

export function readBoardMeta(): MetaMap {
  if (typeof window === "undefined") return EMPTY;
  const raw = window.localStorage.getItem(BOARD_META_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedMap = parse(raw);
  }
  return cachedMap;
}

function write(map: MetaMap): boolean {
  try {
    window.localStorage.setItem(BOARD_META_KEY, JSON.stringify(map));
  } catch {
    return false;
  }
  emit();
  return true;
}

export function updateBoardMeta(
  boardId: string,
  patch: Partial<BoardMeta>
): boolean {
  const current = readBoardMeta();
  const existing: BoardMeta = current[boardId] ?? {
    visibility: DEFAULT_VISIBILITY,
    favorite: false
  };
  return write({ ...current, [boardId]: { ...existing, ...patch } });
}

export function toggleFavorite(boardId: string): boolean {
  const current = readBoardMeta()[boardId];
  return updateBoardMeta(boardId, { favorite: !(current?.favorite ?? false) });
}

export function recordBoardView(boardId: string, now = Date.now()): boolean {
  const map = readBoardMeta();
  const latest = Object.values(map).reduce(
    (max, item) => Math.max(max, item.lastViewedAt ?? 0),
    0
  );
  const own = map[boardId]?.lastViewedAt ?? 0;
  if (own !== 0 && own === latest) return true;
  return updateBoardMeta(boardId, { lastViewedAt: Math.max(now, latest + 1) });
}

export function removeBoardMeta(boardId: string): boolean {
  const current = readBoardMeta();
  if (!(boardId in current)) return true;
  const { [boardId]: _removed, ...rest } = current;
  return write(rest);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === BOARD_META_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useBoardMeta(): MetaMap {
  return useSyncExternalStore(subscribe, readBoardMeta, () => EMPTY);
}
