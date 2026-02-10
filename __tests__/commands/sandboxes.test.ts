import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../../src/client.js", () => ({
  get: vi.fn(),
  post: vi.fn(),
}));

import { sandboxesCommand } from "../../src/commands/sandboxes.js";
import { get, post } from "../../src/client.js";

let logSpy: ReturnType<typeof vi.spyOn>;
let errorSpy: ReturnType<typeof vi.spyOn>;
let exitSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  exitSpy = vi
    .spyOn(process, "exit")
    .mockImplementation(() => undefined as never);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("sandboxes list", () => {
  it("prints sandboxes table", async () => {
    vi.mocked(get).mockResolvedValue({
      status: "success",
      sandboxes: [
        {
          sandboxId: "sb-1",
          sandboxStatus: "running",
          createdAt: "2025-01-01T00:00:00Z",
        },
      ],
    });

    await sandboxesCommand.parseAsync(["list"], { from: "user" });

    expect(get).toHaveBeenCalledWith("/api/sandboxes");
    expect(logSpy).toHaveBeenCalledTimes(3);
  });

  it("prints JSON with --json flag", async () => {
    const sandboxes = [
      { sandboxId: "sb-1", sandboxStatus: "running", createdAt: "2025-01-01" },
    ];
    vi.mocked(get).mockResolvedValue({ status: "success", sandboxes });

    await sandboxesCommand.parseAsync(["list", "--json"], { from: "user" });

    expect(logSpy).toHaveBeenCalledWith(JSON.stringify(sandboxes, null, 2));
  });
});

describe("sandboxes create", () => {
  it("creates a sandbox", async () => {
    vi.mocked(post).mockResolvedValue({
      status: "success",
      sandboxes: [{ sandboxId: "sb-new" }],
    });

    await sandboxesCommand.parseAsync(["create"], { from: "user" });

    expect(post).toHaveBeenCalledWith("/api/sandboxes", {});
    expect(logSpy).toHaveBeenCalledWith("Created sandbox: sb-new");
  });

  it("creates a sandbox with command", async () => {
    vi.mocked(post).mockResolvedValue({
      status: "success",
      sandboxes: [{ sandboxId: "sb-new" }],
    });

    await sandboxesCommand.parseAsync(
      ["create", "--command", "echo hello"],
      { from: "user" },
    );

    expect(post).toHaveBeenCalledWith("/api/sandboxes", {
      command: "echo hello",
    });
  });

  it("prints JSON with --json flag", async () => {
    const sandboxes = [{ sandboxId: "sb-new" }];
    vi.mocked(post).mockResolvedValue({ status: "success", sandboxes });

    await sandboxesCommand.parseAsync(["create", "--json"], { from: "user" });

    expect(logSpy).toHaveBeenCalledWith(JSON.stringify(sandboxes, null, 2));
  });

  it("prints error on failure", async () => {
    vi.mocked(post).mockRejectedValue(new Error("Quota exceeded"));

    await sandboxesCommand.parseAsync(["create"], { from: "user" });

    expect(errorSpy).toHaveBeenCalledWith("Error: Quota exceeded");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
