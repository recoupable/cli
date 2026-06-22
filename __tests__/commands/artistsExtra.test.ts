import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/client.js", () => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
}));

import { artistsCommand } from "../../src/commands/artists.js";
import { get, post, patch, del } from "../../src/client.js";

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("artists create", () => {
  it("posts name and org", async () => {
    vi.mocked(post).mockResolvedValue({ artist: { account_id: "a1" } });
    await artistsCommand.parseAsync(
      ["create", "--name", "Daft Punk", "--org", "o1"],
      { from: "user" },
    );
    expect(post).toHaveBeenCalledWith("/api/artists", {
      name: "Daft Punk",
      organization_id: "o1",
    });
  });
});

describe("artists update", () => {
  it("patches fields including --pinned", async () => {
    vi.mocked(patch).mockResolvedValue({ artist: {} });
    await artistsCommand.parseAsync(
      ["update", "a1", "--label", "Columbia", "--pinned"],
      { from: "user" },
    );
    expect(patch).toHaveBeenCalledWith("/api/artists/a1", {
      label: "Columbia",
      pinned: true,
    });
  });
});

describe("artists delete", () => {
  it("calls DELETE", async () => {
    vi.mocked(del).mockResolvedValue({ success: true });
    await artistsCommand.parseAsync(["delete", "a1"], { from: "user" });
    expect(del).toHaveBeenCalledWith("/api/artists/a1");
  });
});

describe("artists fans", () => {
  it("passes pagination params", async () => {
    vi.mocked(get).mockResolvedValue({ fans: [], pagination: {} });
    await artistsCommand.parseAsync(["fans", "a1", "--limit", "50"], {
      from: "user",
    });
    expect(get).toHaveBeenCalledWith("/api/artists/a1/fans", { limit: "50" });
  });
});

describe("artists scrape", () => {
  it("posts artist_account_id", async () => {
    vi.mocked(post).mockResolvedValue({});
    await artistsCommand.parseAsync(["scrape", "--artist", "a1"], {
      from: "user",
    });
    expect(post).toHaveBeenCalledWith("/api/artist/socials/scrape", {
      artist_account_id: "a1",
    });
  });
});
