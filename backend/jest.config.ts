import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: ".",
  testMatch: ["<rootDir>/src/**/*.spec.ts", "<rootDir>/test/**/*.e2e-spec.ts"],
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/src/$1" },
  testTimeout: 120000,
  setupFiles: ["<rootDir>/test/env-setup.ts"],
  globalSetup: "<rootDir>/test/global-setup.ts",
  globalTeardown: "<rootDir>/test/global-teardown.ts"
};

export default config;
