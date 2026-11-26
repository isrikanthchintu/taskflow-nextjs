import "@testing-library/jest-dom";
import { randomUUID } from "node:crypto";

if (typeof globalThis.crypto === "undefined") {
  Object.defineProperty(globalThis, "crypto", { value: { randomUUID } });
} else if (typeof globalThis.crypto.randomUUID === "undefined") {
  Object.defineProperty(globalThis.crypto, "randomUUID", { value: randomUUID });
}

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn()
};

Object.assign(globalThis, { __mockRouter: mockRouter, __mockPathname: null });

jest.mock("next/navigation", () => ({
  ...jest.requireActual("next/navigation"),
  useRouter: () => mockRouter,
  usePathname: () =>
    (globalThis as { __mockPathname?: string | null }).__mockPathname ?? null
}));

beforeEach(() => {
  Object.values(mockRouter).forEach((fn) => fn.mockClear());
  Object.assign(globalThis, { __mockPathname: null });
});
