import { describe, it, expect } from "vitest";
import { valueOrStdin, parseJsonFlag } from "../src/stdin.js";

describe("valueOrStdin", () => {
  it("returns the flag value when provided (no stdin read)", async () => {
    expect(await valueOrStdin("hello")).toBe("hello");
  });

  it("returns undefined for empty flag on a TTY", async () => {
    const original = process.stdin.isTTY;
    (process.stdin as { isTTY?: boolean }).isTTY = true;
    try {
      expect(await valueOrStdin(undefined)).toBeUndefined();
      expect(await valueOrStdin("")).toBeUndefined();
    } finally {
      (process.stdin as { isTTY?: boolean }).isTTY = original;
    }
  });
});

describe("parseJsonFlag", () => {
  it("parses valid JSON", () => {
    expect(parseJsonFlag('{"a":1}', "--x")).toEqual({ a: 1 });
  });

  it("throws a clear error on invalid JSON", () => {
    expect(() => parseJsonFlag("{bad", "--x")).toThrow("--x must be valid JSON");
  });
});
