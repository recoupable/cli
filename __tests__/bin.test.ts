import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

describe("CLI version", () => {
  it("reports the version from package.json", () => {
    const pkg = JSON.parse(
      readFileSync(join(__dirname, "..", "package.json"), "utf-8"),
    );

    const output = execFileSync(
      "node",
      [join(__dirname, "..", "dist", "bin.cjs"), "--version"],
      { encoding: "utf-8" },
    ).trim();

    expect(output).toBe(pkg.version);
  });
});
