import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../../src/client.js", () => ({
  get: vi.fn(),
  post: vi.fn(),
}));

import { orgsCommand } from "../../src/commands/orgs.js";
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

describe("orgs list", () => {
  it("prints organizations table", async () => {
    vi.mocked(get).mockResolvedValue({
      status: "success",
      organizations: [
        { organization_id: "org-1", organization_name: "My Org" },
        { organization_id: "org-2", organization_name: "Other Org" },
      ],
    });

    await orgsCommand.parseAsync(["list"], { from: "user" });

    expect(get).toHaveBeenCalledWith("/api/organizations", {});
    expect(logSpy).toHaveBeenCalledTimes(4); // header + separator + 2 rows
  });

  it("passes account_id when --account is provided", async () => {
    vi.mocked(get).mockResolvedValue({
      status: "success",
      organizations: [{ organization_id: "org-1", organization_name: "My Org" }],
    });

    await orgsCommand.parseAsync(["list", "--account", "acc-123"], {
      from: "user",
    });

    expect(get).toHaveBeenCalledWith("/api/organizations", { account_id: "acc-123" });
  });

  it("prints JSON with --json flag", async () => {
    const orgs = [{ organization_id: "org-1", organization_name: "My Org" }];
    vi.mocked(get).mockResolvedValue({
      status: "success",
      organizations: orgs,
    });

    await orgsCommand.parseAsync(["list", "--json"], { from: "user" });

    expect(logSpy).toHaveBeenCalledWith(JSON.stringify(orgs, null, 2));
  });

  it("handles empty list", async () => {
    vi.mocked(get).mockResolvedValue({
      status: "success",
      organizations: [],
    });

    await orgsCommand.parseAsync(["list"], { from: "user" });

    expect(logSpy).toHaveBeenCalledWith("No results.");
  });

  it("prints error on failure", async () => {
    vi.mocked(get).mockRejectedValue(new Error("Server error"));

    await orgsCommand.parseAsync(["list"], { from: "user" });

    expect(errorSpy).toHaveBeenCalledWith("Error: Server error");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
