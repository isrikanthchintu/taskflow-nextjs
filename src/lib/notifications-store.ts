import { useEffect, useSyncExternalStore } from "react";

export const UNREAD_POLL_MS = 30000;
export const UNREAD_STORAGE_KEY = "taskflow.notifications.unread";

export class SessionExpiredError extends Error {
  constructor() {
    super("Session expired");
    this.name = "SessionExpiredError";
  }
}

export type UnreadFetcher = () => Promise<number>;

export async function localUnreadFetcher(): Promise<number> {
  const raw = window.localStorage.getItem(UNREAD_STORAGE_KEY);
  if (raw === null) return 0;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) {
    throw new Error("Unread count unavailable");
  }
  return value;
}

export function formatBadge(count: number | null): string | null {
  if (count === null || count <= 0) return null;
  return count > 9 ? "9+" : String(count);
}

let fetcher: UnreadFetcher = localUnreadFetcher;
let count: number | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
let generation = 0;
const listeners = new Set<() => void>();
const expiredListeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function setCount(next: number | null) {
  if (next === count) return;
  count = next;
  emit();
}

export async function refreshUnread(): Promise<void> {
  const current = generation;
  try {
    const next = await fetcher();
    if (current === generation) setCount(next);
  } catch (error) {
    if (current !== generation) return;
    setCount(null);
    if (error instanceof SessionExpiredError) {
      expiredListeners.forEach((listener) => listener());
    }
  }
}

function start() {
  void refreshUnread();
  timer = setInterval(() => void refreshUnread(), UNREAD_POLL_MS);
}

function stop() {
  if (timer) clearInterval(timer);
  timer = null;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) start();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) stop();
  };
}

export function setUnreadFetcher(next: UnreadFetcher): void {
  fetcher = next;
  generation += 1;
  if (listeners.size > 0) void refreshUnread();
}

export function resetNotificationsStore(): void {
  stop();
  fetcher = localUnreadFetcher;
  count = null;
  generation += 1;
  listeners.clear();
  expiredListeners.clear();
}

export function useUnreadNotifications(onSessionExpired?: () => void) {
  const value = useSyncExternalStore(
    subscribe,
    () => count,
    () => null
  );

  useEffect(() => {
    if (!onSessionExpired) return;
    expiredListeners.add(onSessionExpired);
    return () => {
      expiredListeners.delete(onSessionExpired);
    };
  }, [onSessionExpired]);

  return { unreadCount: value, refresh: refreshUnread };
}
