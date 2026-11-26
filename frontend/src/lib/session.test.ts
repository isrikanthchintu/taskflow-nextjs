import {
  clearClientSession,
  loginUrl,
  logout,
  SESSION_KEYS
} from "@/lib/session";
import { DATA_KEY } from "@/lib/board-storage";

describe("session", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it("FR-14 calls the logout service, clears session data and redirects to Login", async () => {
    const service = jest.fn(async () => undefined);
    const navigate = jest.fn();
    window.sessionStorage.setItem("token", "secret");
    window.localStorage.setItem(SESSION_KEYS[0], "secret");

    await logout(service, navigate);

    expect(service).toHaveBeenCalledTimes(1);
    expect(window.sessionStorage.length).toBe(0);
    expect(window.localStorage.getItem(SESSION_KEYS[0])).toBeNull();
    expect(navigate).toHaveBeenCalledWith("/login");
  });

  it("6.3 still clears local state and redirects when the logout request fails", async () => {
    const navigate = jest.fn();
    window.sessionStorage.setItem("token", "secret");

    await logout(async () => {
      throw new Error("network down");
    }, navigate);

    expect(window.sessionStorage.length).toBe(0);
    expect(navigate).toHaveBeenCalledWith("/login");
  });

  it("logs out and redirects even when no service is configured", async () => {
    const navigate = jest.fn();

    await logout(undefined, navigate);

    expect(navigate).toHaveBeenCalledWith("/login");
  });

  it("leaves the user's saved boards alone", async () => {
    window.localStorage.setItem(DATA_KEY, "boards");

    await clearClientSession();

    expect(window.localStorage.getItem(DATA_KEY)).toBe("boards");
  });

  it("deletes cached responses when the Cache API is available", async () => {
    const deleted: string[] = [];
    Object.defineProperty(window, "caches", {
      configurable: true,
      value: {
        keys: async () => ["a", "b"],
        delete: async (name: string) => {
          deleted.push(name);
          return true;
        }
      }
    });

    await clearClientSession();

    expect(deleted).toEqual(["a", "b"]);
    Reflect.deleteProperty(window, "caches");
  });

  it("encodes the return URL on the login redirect", () => {
    expect(loginUrl("/a b")).toBe("/login?returnUrl=%2Fa%20b");
  });
});
