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

import { catalogsCommand } from "../../src/commands/catalogs.js";
import { get, post, del } from "../../src/client.js";
import { valueOrStdin } from "../../src/stdin.js";

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("catalogs create", () => {
  it("requires name or snapshot", async () => {
    await catalogsCommand.parseAsync(["create"], { from: "user" });
    expect(post).not.toHaveBeenCalled();
  });

  it("posts name", async () => {
    vi.mocked(post).mockResolvedValue({ catalog: { id: "c1" }, songs_added: 0 });
    await catalogsCommand.parseAsync(["create", "--name", "2024"], {
      from: "user",
    });
    expect(post).toHaveBeenCalledWith("/api/catalogs", { name: "2024" });
  });
});

describe("catalogs songs", () => {
  it("lists with catalog_id", async () => {
    vi.mocked(get).mockResolvedValue({ status: "success", songs: [] });
    await catalogsCommand.parseAsync(["songs", "--catalog", "c1"], {
      from: "user",
    });
    expect(get).toHaveBeenCalledWith("/api/catalogs/songs", { catalog_id: "c1" });
  });
});

describe("catalogs add-songs", () => {
  it("injects catalog_id into each song", async () => {
    vi.mocked(valueOrStdin).mockResolvedValue('[{"isrc":"US1","name":"T"}]');
    vi.mocked(post).mockResolvedValue({ status: "success", songs: [] });
    await catalogsCommand.parseAsync(
      ["add-songs", "--catalog", "c1", "--songs", '[{"isrc":"US1","name":"T"}]'],
      { from: "user" },
    );
    expect(post).toHaveBeenCalledWith("/api/catalogs/songs", {
      songs: [{ catalog_id: "c1", isrc: "US1", name: "T" }],
    });
  });
});

describe("catalogs remove-songs", () => {
  it("builds song delete payload from repeated --isrc", async () => {
    vi.mocked(del).mockResolvedValue({ status: "success", songs: [] });
    await catalogsCommand.parseAsync(
      ["remove-songs", "--catalog", "c1", "--isrc", "US1", "--isrc", "US2"],
      { from: "user" },
    );
    expect(del).toHaveBeenCalledWith("/api/catalogs/songs", {
      songs: [
        { catalog_id: "c1", isrc: "US1" },
        { catalog_id: "c1", isrc: "US2" },
      ],
    });
  });
});
