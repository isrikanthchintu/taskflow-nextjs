import { validationError } from "@/common/errors";

export const EXTRA_MAX_BYTES = 262144;

export function assertExtra(extra: unknown, field = "extra"): void {
  if (extra === undefined) {
    return;
  }
  if (typeof extra !== "object" || extra === null || Array.isArray(extra)) {
    throw validationError([{ field, code: "INVALID", message: "Must be an object." }]);
  }
  if (Buffer.byteLength(JSON.stringify(extra), "utf8") > EXTRA_MAX_BYTES) {
    throw validationError([{ field, code: "TOO_LONG", message: "Too large." }]);
  }
}
