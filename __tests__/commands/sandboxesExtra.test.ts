import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/client.js", () => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
}));
vi.mock("../../src/stdin.js", async (orig) => {
  const actual = (await orig()) as object;
  return { ...actual, valueOrStdin: vi.fn() };
});

import { sandboxesCommand } from "../../src/commands/sandboxes.js";
import { get, post } from "../../src/client.js";
import { valueOrStdin } from "../../src/stdin.js";

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("sandboxes file", () => {
  it("gets a file by path", async () => {
    vi.mocked(get).mockResolvedValue({ status: "success", content: "hi" });
    await sandboxesCommand.parseAsync(["file", "--path", "README.md"], {
      from: "user",
    });
    expect(get).toHaveBeenCalledWith("/api/sandboxes/file", { path: "README.md" });
  });

  it("decodes base64 content", async () => {
    const writeSpy = process.stdout.write as unknown as ReturnType<typeof vi.fn>;
    vi.mocked(get).mockResolvedValue({
      status: "success",
      content: Buffer.from("hello").toString("base64"),
      encoding: "base64",
    });
    await sandboxesCommand.parseAsync(["file", "--path", "a.txt"], {
      from: "user",
    });
    expect(writeSpy).toHaveBeenCalledWith("hello");
  });
});

describe("sandboxes upload", () => {
  it("parses files JSON", async () => {
    vi.mocked(valueOrStdin).mockResolvedValue('[{"url":"u","name":"n"}]');
    vi.mocked(post).mockResolvedValue({ status: "success", uploaded: [] });
    await sandboxesCommand.parseAsync(
      ["upload", "--files", '[{"url":"u","name":"n"}]'],
      { from: "user" },
    );
    expect(post).toHaveBeenCalledWith("/api/sandboxes/files", {
      files: [{ url: "u", name: "n" }],
    });
  });
});

describe("sandboxes setup", () => {
  it("posts setup", async () => {
    vi.mocked(post).mockResolvedValue({ status: "success", runId: "r1" });
    await sandboxesCommand.parseAsync(["setup"], { from: "user" });
    expect(post).toHaveBeenCalledWith("/api/sandboxes/setup", {});
  });
});
