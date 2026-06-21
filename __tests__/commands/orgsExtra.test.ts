import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/client.js", () => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
}));

import { orgsCommand } from "../../src/commands/orgs.js";
import { post } from "../../src/client.js";

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("orgs create", () => {
  it("posts name and accountId", async () => {
    vi.mocked(post).mockResolvedValue({ organization: { id: "o1" } });
    await orgsCommand.parseAsync(
      ["create", "--name", "Label", "--account", "a1"],
      { from: "user" },
    );
    expect(post).toHaveBeenCalledWith("/api/organizations", {
      name: "Label",
      accountId: "a1",
    });
  });
});

describe("orgs add-artist", () => {
  it("posts artist and org IDs", async () => {
    vi.mocked(post).mockResolvedValue({ status: "success", id: "x" });
    await orgsCommand.parseAsync(
      ["add-artist", "--artist", "a1", "--org", "o1"],
      { from: "user" },
    );
    expect(post).toHaveBeenCalledWith("/api/organizations/artists", {
      artistId: "a1",
      organizationId: "o1",
    });
  });
});
