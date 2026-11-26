export const LOGIN_PATH = "/login";

export function loginUrl(returnUrl: string): string {
  return `${LOGIN_PATH}?returnUrl=${encodeURIComponent(returnUrl)}`;
}

export function redirectToLogin(): void {
  if (typeof window === "undefined") return;
  const { pathname, search, hash } = window.location;
  window.location.assign(loginUrl(`${pathname}${search}${hash}`));
}
