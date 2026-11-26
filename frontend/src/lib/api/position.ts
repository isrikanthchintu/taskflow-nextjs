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
  const last = positions.length > 0 ? ([...positions].sort().at(-1) ?? null) : null;
  return positionBetween(last, null);
}

function longestIncreasing(keys: Array<string | undefined>): Set<number> {
  const length = keys.length;
  const best = new Array<number>(length).fill(0);
  const previous = new Array<number>(length).fill(-1);
  let bestEnd = -1;
  let bestLength = 0;
  for (let i = 0; i < length; i += 1) {
    const current = keys[i];
    if (current === undefined) continue;
    best[i] = 1;
    for (let j = 0; j < i; j += 1) {
      const earlier = keys[j];
      if (earlier !== undefined && earlier < current && best[j] + 1 > best[i]) {
        best[i] = best[j] + 1;
        previous[i] = j;
      }
    }
    if (best[i] > bestLength) {
      bestLength = best[i];
      bestEnd = i;
    }
  }
  const keep = new Set<number>();
  for (let i = bestEnd; i >= 0; i = previous[i]) keep.add(i);
  return keep;
}

export function assignPositions(
  ids: string[],
  existing: Record<string, string>
): Record<string, string> {
  const keep = longestIncreasing(ids.map((id) => existing[id]));
  const result: Record<string, string> = {};
  let previous: string | null = null;
  for (let index = 0; index < ids.length; index += 1) {
    const id = ids[index];
    if (keep.has(index)) {
      result[id] = existing[id];
      previous = existing[id];
      continue;
    }
    let next: string | null = null;
    for (let ahead = index + 1; ahead < ids.length; ahead += 1) {
      if (keep.has(ahead)) {
        next = existing[ids[ahead]];
        break;
      }
    }
    const key = positionBetween(previous, next);
    result[id] = key;
    previous = key;
  }
  return result;
}
