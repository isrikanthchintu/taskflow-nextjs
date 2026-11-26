export const LOGIN_PATH = "/login";

export function loginUrl(returnUrl: string): string {
  return `${LOGIN_PATH}?returnUrl=${encodeURIComponent(returnUrl)}`;
}

export function redirectToLogin(): void {
  if (typeof window === "undefined") return;
  const { pathname, search, hash } = window.location;
  window.location.assign(loginUrl(`${pathname}${search}${hash}`));
}

export const SESSION_KEYS = ["taskflow.session", "taskflow.auth"];

export type LogoutService = () => Promise<void>;

export async function clearClientSession(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.clear();
    for (const key of SESSION_KEYS) window.localStorage.removeItem(key);
  } catch {
    return;
  }
  try {
    if ("caches" in window) {
      const names = await window.caches.keys();
      await Promise.all(names.map((name) => window.caches.delete(name)));
    }
  } catch {
    return;
  }
}

export async function logout(
  service?: LogoutService,
  navigate: (url: string) => void = (url) => window.location.replace(url)
): Promise<void> {
  try {
    if (service) await service();
  } catch {
  } finally {
    await clearClientSession();
    navigate(LOGIN_PATH);
  }
}
