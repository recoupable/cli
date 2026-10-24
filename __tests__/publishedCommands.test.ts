import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import provenance from "./fixtures/published-guide/provenance.json";

const fixtures = join(__dirname, "fixtures", "published-guide");
const snapshot = readFileSync(join(fixtures, "cli.mdx"), "utf8");
// Documentation owners can run the same guard against a candidate guide.
const guide = process.env.RECOUP_CLI_REFERENCE_PATH
  ? readFileSync(process.env.RECOUP_CLI_REFERENCE_PATH, "utf8")
  : snapshot;

function section(name: string) {
  const heading = `### ${name}\n`;
  expect(guide.split(heading)).toHaveLength(2);
  return guide.split(heading)[1].split(/^#{1,3} /m)[0];
}

function examples(name: string) {
  return [...section(name).matchAll(/```bash\n([\s\S]*?)```/g)]
    .flatMap((match) => match[1].trim().split("\n"));
}

function run(command: string) {
  // These published examples use double-quoted arguments, without shell expansion.
  // Reject unsupported syntax rather than accidentally executing a shell.
  const tokens = command.match(/"[^"\n]*"|[^\s"]+/g) ?? [];
  expect(tokens[0]).toBe("recoup");
  expect(tokens.join(" ")).toBe(command);
  const args = tokens.slice(1).map((token) => token.replace(/^"|"$/g, ""));
  const directory = mkdtempSync(join(tmpdir(), "recoup-cli-guide-"));
  const log = join(directory, "requests.jsonl");
  try {
    const result = spawnSync(process.execPath, [
      "--require", join(fixtures, "intercept.cjs"),
      join(__dirname, "..", "dist", "bin.cjs"), ...args,
    ], {
      encoding: "utf8",
      timeout: 10000,
      env: {
        RECOUP_API_KEY: "fixture-not-a-real-key",
        RECOUP_API_URL: "https://cli-fixture.invalid",
        CLI_FIXTURE_REQUEST_LOG: log,
      },
    });
    expect(result.error).toBeUndefined();
    const requests = existsSync(log)
      ? readFileSync(log, "utf8").trim().split("\n").map((line) => JSON.parse(line))
      : [];
    return { ...result, requests };
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

describe("published command contract (built CLI, intercepted requests)", () => {
  it("pins the unmodified maintained guide to its recorded source", () => {
    expect(createHash("sha256").update(snapshot).digest("hex")).toBe(provenance.sha256);
  });

  it("runs every email example from the guide", () => {
    const commands = examples("emails");
    expect(commands).toHaveLength(2);
    const expected = [
      { subject: "Pulse Report", text: "Here's your weekly summary." },
      { subject: "Update", html: "<h1>Report</h1><p>Details here.</p>" },
    ];
    commands.forEach((command, index) => {
      const result = run(command);
      expect(result.status).toBe(0);
      expect(result.requests).toEqual([{ method: "POST", path: "/api/emails", body: expected[index] }]);
    });
  });

  it("maps the published chat link option to chat_id", () => {
    const option = section("emails").match(/\| `(--[^`]+)` \| No \| Chat ID for a chat link/);
    expect(option).not.toBeNull();
    const result = run(`${examples("emails")[0]} ${option![1].replace("<id>", "fixture-chat")}`);
    expect(result.status).toBe(0);
    expect(result.requests).toEqual([{ method: "POST", path: "/api/emails", body: {
      subject: "Pulse Report", text: "Here's your weekly summary.", chat_id: "fixture-chat",
    } }]);
  });

  it("rejects retired --room-id before any request", () => {
    const result = run(`${examples("emails")[0]} --room-id fixture-chat`);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("unknown option '--room-id'");
    expect(result.requests).toEqual([]);
  });

  it("runs every song example from the guide", () => {
    const commands = examples("songs");
    expect(commands).toHaveLength(3);
    const expected = [
      { method: "GET", path: "/api/songs/analyze/presets", body: null },
      { method: "POST", path: "/api/songs/analyze", body: { preset: "catalog_metadata", audio_url: "https://example.com/track.mp3" } },
      { method: "POST", path: "/api/songs/analyze", body: { prompt: "Describe the production style", audio_url: "https://example.com/track.mp3" } },
    ];
    commands.forEach((command, index) => {
      const result = run(command);
      expect(result.status).toBe(0);
      expect(result.requests).toEqual([expected[index]]);
    });
  });
});
