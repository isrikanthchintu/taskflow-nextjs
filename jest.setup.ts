import "@testing-library/jest-dom";
import { randomUUID } from "node:crypto";

if (typeof globalThis.crypto === "undefined") {
  Object.defineProperty(globalThis, "crypto", { value: { randomUUID } });
} else if (typeof globalThis.crypto.randomUUID === "undefined") {
  Object.defineProperty(globalThis.crypto, "randomUUID", { value: randomUUID });
}
