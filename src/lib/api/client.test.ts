import { ApiError, apiRequest, AUTH_KEY, dropSession, errorMessage, getSession, setSession } from "@/lib/api/client";
import { positionAtEnd, positionBetween } from "@/lib/api/position";

const session = {
  accessToken: "token-123",
  user: { id: "u1", email: "a@b.c", name: "A", organisationId: "o1" }
};

function mockFetch(status: number, body: unknown) {
  const fn = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body
  });
  global.fetch = fn as unknown as typeof fetch;
  return fn;
}

describe("api client", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("stores and clears the session", () => {
    expect(getSession()).toBeNull();
    setSession(session);
    expect(getSession()?.accessToken).toBe("token-123");
    dropSession();
    expect(getSession()).toBeNull();
    expect(window.localStorage.getItem(AUTH_KEY)).toBeNull();
  });

  it("ignores a corrupt stored session", () => {
    window.localStorage.setItem(AUTH_KEY, "{nope");
    expect(getSession()).toBeNull();
  });

  it("sends the bearer token and parses json", async () => {
    setSession(session);
    const fetchMock = mockFetch(200, { ok: true });
    await expect(apiRequest("/workspaces")).resolves.toEqual({ ok: true });
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer token-123");
  });

  it("maps structured errors", async () => {
    mockFetch(400, {
      error: {
        code: "VALIDATION_ERROR",
        message: "The submitted data is invalid.",
        fields: [{ field: "title", code: "REQUIRED", message: "Title is required." }]
      }
    });
    const error = await apiRequest("/x", { method: "POST", body: {} }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).code).toBe("VALIDATION_ERROR");
    expect(errorMessage(error)).toBe("Title is required.");
  });

  it("drops the session on 401", async () => {
    setSession(session);
    mockFetch(401, { error: { code: "UNAUTHORIZED", message: "Authentication is required.", fields: [] } });
    await expect(apiRequest("/workspaces")).rejects.toMatchObject({ status: 401 });
    expect(getSession()).toBeNull();
  });

  it("keeps the session on a failed login attempt", async () => {
    setSession(session);
    mockFetch(401, { error: { code: "UNAUTHORIZED", message: "Invalid email or password.", fields: [] } });
    await expect(apiRequest("/auth/login", { method: "POST", body: {}, auth: false })).rejects.toMatchObject({
      message: "Invalid email or password."
    });
    expect(getSession()).not.toBeNull();
  });

  it("returns undefined for 204", async () => {
    mockFetch(204, null);
    await expect(apiRequest("/boards/1/star", { method: "DELETE" })).resolves.toBeUndefined();
  });

  it("reports an unreachable server", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("offline")) as unknown as typeof fetch;
    await expect(apiRequest("/workspaces")).rejects.toMatchObject({ code: "NETWORK_ERROR", status: 0 });
  });
});

describe("position keys", () => {
  it("appends after the last position", () => {
    const first = positionAtEnd([]);
    const second = positionAtEnd([first]);
    expect(second > first).toBe(true);
    expect(positionAtEnd(["b", "a", "c"]) > "c").toBe(true);
  });

  it("inserts between keys", () => {
    const mid = positionBetween("a", "b");
    expect(mid > "a" && mid < "b").toBe(true);
  });
});
