const ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const BASE = ALPHABET.length;

function digit(key: string, index: number): number {
  return index < key.length ? ALPHABET.indexOf(key[index]) : 0;
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

export function positionAtEnd(positions: string[]): string {
  const last = positions.length > 0 ? [...positions].sort().at(-1) ?? null : null;
  return positionBetween(last, null);
}
