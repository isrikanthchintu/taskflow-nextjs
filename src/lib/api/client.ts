import { useSyncExternalStore } from "react";

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
export const AUTH_KEY = "taskflow.auth";

export function isApiConfigured(): boolean {
  return API_URL.length > 0;
}

export interface ApiFieldError {
  field: string;
  code: string;
  message: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields: ApiFieldError[];

  constructor(status: number, code: string, message: string, fields: ApiFieldError[] = []) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

export interface ApiUser {
  id: string;
  email: string;
  name: string;
  organisationId: string;
}

export interface ApiSession {
  accessToken: string;
  user: ApiUser;
}

const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cachedSession: ApiSession | null = null;

function emit() {
  listeners.forEach((listener) => listener());
}

export function getSession(): ApiSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(AUTH_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      const parsed: unknown = raw ? JSON.parse(raw) : null;
      const candidate = parsed as Partial<ApiSession> | null;
      cachedSession =
        candidate && typeof candidate.accessToken === "string" && candidate.user
          ? (candidate as ApiSession)
          : null;
    } catch {
      cachedSession = null;
    }
  }
  return cachedSession;
}

export function setSession(session: ApiSession): void {
  window.localStorage.setItem(AUTH_KEY, JSON.stringify(session));
  emit();
}

export function dropSession(): void {
  window.localStorage.removeItem(AUTH_KEY);
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === AUTH_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useApiSession(): ApiSession | null {
  return useSyncExternalStore(subscribe, getSession, () => null);
}

export async function apiRequest<T>(
  path: string,
  options: { method?: string; body?: unknown; auth?: boolean } = {}
): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (options.auth !== false) {
    const session = getSession();
    if (session) headers.Authorization = `Bearer ${session.accessToken}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body)
    });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "Cannot reach the server. Check that the API is running.");
  }

  if (response.status === 204) return undefined as T;

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const error = (payload as { error?: { code?: string; message?: string; fields?: ApiFieldError[] } } | null)
      ?.error;
    if (response.status === 401 && options.auth !== false) dropSession();
    throw new ApiError(
      response.status,
      error?.code ?? "ERROR",
      error?.message ?? "Something went wrong.",
      error?.fields ?? []
    );
  }
  return payload as T;
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.fields.length > 0
      ? error.fields.map((field) => field.message).join(" ")
      : error.message;
  }
  return "Something went wrong.";
}
