import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../../src/client.js", () => ({
  get: vi.fn(),
  post: vi.fn(),
}));

import { whoamiCommand } from "../../src/commands/whoami.js";
import { get } from "../../src/client.js";

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

describe("whoami command", () => {
  it("prints account ID", async () => {
    vi.mocked(get).mockResolvedValue({
      status: "success",
      accountId: "abc-123",
    });

    await whoamiCommand.parseAsync([], { from: "user" });

    expect(get).toHaveBeenCalledWith("/api/accounts/id");
    expect(logSpy).toHaveBeenCalledWith("abc-123");
  });

  it("prints JSON with --json flag", async () => {
    vi.mocked(get).mockResolvedValue({
      status: "success",
      accountId: "abc-123",
    });

    await whoamiCommand.parseAsync(["--json"], { from: "user" });

    expect(logSpy).toHaveBeenCalledWith(
      JSON.stringify({ status: "success", accountId: "abc-123" }, null, 2),
    );
  });

  it("prints error on failure", async () => {
    vi.mocked(get).mockRejectedValue(new Error("Unauthorized"));

    await whoamiCommand.parseAsync([], { from: "user" });

    expect(errorSpy).toHaveBeenCalledWith("Error: Unauthorized");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
