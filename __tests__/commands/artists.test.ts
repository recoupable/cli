import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../../src/client.js", () => ({
  get: vi.fn(),
  post: vi.fn(),
}));

import { artistsCommand } from "../../src/commands/artists.js";
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

describe("artists list", () => {
  it("prints artists table", async () => {
    vi.mocked(get).mockResolvedValue({
      status: "success",
      artists: [
        { account_id: "a1", name: "Artist One", label: "Label A" },
        { account_id: "a2", name: "Artist Two", label: null },
      ],
    });

    await artistsCommand.parseAsync(["list"], { from: "user" });

    expect(get).toHaveBeenCalledWith("/api/artists");
    // header + separator + 2 data rows
    expect(logSpy).toHaveBeenCalledTimes(4);
  });

  it("prints JSON with --json flag", async () => {
    const artists = [{ account_id: "a1", name: "Artist One", label: "Label" }];
    vi.mocked(get).mockResolvedValue({ status: "success", artists });

    await artistsCommand.parseAsync(["list", "--json"], {
      from: "user",
    });

    expect(logSpy).toHaveBeenCalledWith(JSON.stringify(artists, null, 2));
  });

  it("handles empty list", async () => {
    vi.mocked(get).mockResolvedValue({ status: "success", artists: [] });

    await artistsCommand.parseAsync(["list"], { from: "user" });

    expect(logSpy).toHaveBeenCalledWith("No results.");
  });

  it("prints error on failure", async () => {
    vi.mocked(get).mockRejectedValue(new Error("Forbidden"));

    await artistsCommand.parseAsync(["list"], { from: "user" });

    expect(errorSpy).toHaveBeenCalledWith("Error: Forbidden");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
