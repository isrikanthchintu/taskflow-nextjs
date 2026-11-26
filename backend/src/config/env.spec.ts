import { loadEnv } from "@/config/env";

const base = {
  MONGO_URI: "mongodb://u:p@localhost:27017/db",
  JWT_SECRET: "x".repeat(32)
};

describe("loadEnv", () => {
  it("applies defaults", () => {
    const env = loadEnv(base);
    expect(env.port).toBe(4000);
    expect(env.apiPrefix).toBe("api/v1");
    expect(env.maxAttachmentBytes).toBe(10 * 1024 * 1024);
  });

  it("reports missing required variables", () => {
    expect(() => loadEnv({})).toThrow(/MONGO_URI, JWT_SECRET/);
  });

  it("rejects a short JWT secret", () => {
    expect(() => loadEnv({ ...base, JWT_SECRET: "short" })).toThrow(/JWT_SECRET/);
  });

  it("rejects non numeric numbers", () => {
    expect(() => loadEnv({ ...base, PORT: "abc" })).toThrow(/PORT/);
  });
});
