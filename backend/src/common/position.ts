const ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const BASE = ALPHABET.length;
const FIRST = ALPHABET[0];

function digit(key: string, index: number): number {
  return index < key.length ? ALPHABET.indexOf(key[index]) : 0;
}

export function isValidPosition(key: unknown): key is string {
  if (typeof key !== "string" || key.length === 0 || key.length > 256) {
    return false;
  }
  if (key[key.length - 1] === FIRST) {
    return false;
  }
  for (const char of key) {
    if (ALPHABET.indexOf(char) === -1) {
      return false;
    }
  }
  return true;
}

export function positionBetween(before: string | null, after: string | null): string {
  if (before !== null && after !== null && before >= after) {
    throw new Error("before must sort strictly before after");
  }
  let result = "";
  let index = 0;
  let upperBounded = after !== null;
  for (;;) {
    const low = before === null ? 0 : digit(before, index);
    const high = upperBounded && after !== null ? digit(after, index) : BASE;
    if (high - low > 1) {
      return result + ALPHABET[Math.floor((low + high) / 2)];
    }
    result += ALPHABET[low];
    if (high !== low) {
      upperBounded = false;
    }
    index += 1;
  }
}

export function positionAfter(last: string | null): string {
  return positionBetween(last, null);
}

export function needsRebalance(key: string, threshold: number): boolean {
  return key.length >= threshold;
}

function encode(value: number, length: number): string {
  let out = "";
  let remaining = value;
  for (let i = 0; i < length; i += 1) {
    out = ALPHABET[remaining % BASE] + out;
    remaining = Math.floor(remaining / BASE);
  }
  return out;
}

export function evenlySpacedPositions(count: number): string[] {
  if (count <= 0) {
    return [];
  }
  let length = 1;
  while (Math.pow(BASE, length) < (count + 1) * 4) {
    length += 1;
  }
  const step = Math.floor(Math.pow(BASE, length) / (count + 1));
  const keys: string[] = [];
  for (let i = 1; i <= count; i += 1) {
    const key = encode(step * i, length);
    keys.push(key.endsWith(FIRST) ? `${key}${ALPHABET[BASE / 2]}` : key);
  }
  return keys;
}
