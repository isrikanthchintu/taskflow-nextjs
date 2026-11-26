import {
  evenlySpacedPositions,
  isValidPosition,
  needsRebalance,
  positionAfter,
  positionBetween
} from "@/common/position";

describe("position keys", () => {
  it("creates a first key and keys that sort after the previous one", () => {
    const first = positionAfter(null);
    const second = positionAfter(first);
    expect(isValidPosition(first)).toBe(true);
    expect(second > first).toBe(true);
  });

  it("inserts between two keys without touching neighbours", () => {
    const before = "a";
    const after = "b";
    const mid = positionBetween(before, after);
    expect(mid > before && mid < after).toBe(true);
  });

  it("inserts between adjacent keys by extending length", () => {
    const mid = positionBetween("a", "a1");
    expect(mid > "a" && mid < "a1").toBe(true);
    expect(isValidPosition(mid)).toBe(true);
  });

  it("keeps order when inserting repeatedly at the same spot", () => {
    let before = "V";
    const after = "W";
    const keys: string[] = [];
    for (let i = 0; i < 20; i += 1) {
      const next = positionBetween(before, after);
      expect(next > before && next < after).toBe(true);
      keys.push(next);
      before = next;
    }
    expect([...keys].sort()).toEqual(keys);
  });

  it("inserts before the first key", () => {
    const key = positionBetween(null, "V");
    expect(key < "V").toBe(true);
    expect(isValidPosition(key)).toBe(true);
  });

  it("rejects an invalid ordering", () => {
    expect(() => positionBetween("b", "a")).toThrow();
    expect(() => positionBetween("a", "a")).toThrow();
  });

  it("validates keys", () => {
    expect(isValidPosition("")).toBe(false);
    expect(isValidPosition("a0")).toBe(false);
    expect(isValidPosition("a-b")).toBe(false);
    expect(isValidPosition(12)).toBe(false);
    expect(isValidPosition("x".repeat(257))).toBe(false);
  });

  it("detects when rebalancing is needed", () => {
    expect(needsRebalance("a".repeat(48), 48)).toBe(true);
    expect(needsRebalance("abc", 48)).toBe(false);
  });

  it("produces strictly increasing, valid, evenly spaced keys", () => {
    for (const count of [1, 2, 10, 500]) {
      const keys = evenlySpacedPositions(count);
      expect(keys).toHaveLength(count);
      expect([...keys].sort()).toEqual(keys);
      expect(new Set(keys).size).toBe(count);
      expect(keys.every(isValidPosition)).toBe(true);
    }
    expect(evenlySpacedPositions(0)).toEqual([]);
  });
});
