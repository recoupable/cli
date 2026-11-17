import { readFileSync } from "node:fs";
import { afterEach, expect, it, vi } from "vitest";
import { getBaseUrl } from "../src/config.js";

afterEach(() => vi.unstubAllEnvs());
it("defaults to the canonical API origin", () => {
  vi.stubEnv("RECOUP_API_URL", "");
  expect(getBaseUrl()).toBe("https://api.recoupable.dev");
});
it("retains the explicit API URL override", () => {
  vi.stubEnv("RECOUP_API_URL", "http://127.0.0.1:12345");
  expect(getBaseUrl()).toBe("http://127.0.0.1:12345");
});

it.skipIf(!process.env.RECOUP_CLI_REFERENCE_PATH)(
  "keeps the candidate guide default aligned with source",
  () => {
    vi.stubEnv("RECOUP_API_URL", "");
    const guide = readFileSync(process.env.RECOUP_CLI_REFERENCE_PATH!, "utf8");
    expect(guide).toContain(
      `| \`RECOUP_API_URL\` | No | \`${getBaseUrl()}\` |`,
    );
  },
);
