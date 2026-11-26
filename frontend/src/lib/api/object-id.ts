function randomHex(bytes: number): string {
  const values = new Uint8Array(bytes);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(values);
  } else {
    for (let index = 0; index < bytes; index += 1) {
      values[index] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(values, (value) => value.toString(16).padStart(2, "0")).join("");
}

export function newObjectId(): string {
  const seconds = Math.floor(Date.now() / 1000)
    .toString(16)
    .padStart(8, "0");
  return `${seconds}${randomHex(8)}`;
}

export function isObjectId(value: string): boolean {
  return /^[0-9a-f]{24}$/.test(value);
}
