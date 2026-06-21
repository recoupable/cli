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

import { researchCommand } from "../../src/commands/research.js";
import { get, post } from "../../src/client.js";
import { valueOrStdin } from "../../src/stdin.js";

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("research search", () => {
  it("passes q and type", async () => {
    vi.mocked(get).mockResolvedValue({ status: "success", results: [] });
    await researchCommand.parseAsync(
      ["search", "--q", "Daft Punk", "--type", "artists"],
      { from: "user" },
    );
    expect(get).toHaveBeenCalledWith("/api/research", {
      q: "Daft Punk",
      type: "artists",
    });
  });
});

describe("research profile (artist-keyed)", () => {
  it("requires artist and calls profile path", async () => {
    vi.mocked(get).mockResolvedValue({ status: "success" });
    await researchCommand.parseAsync(["profile", "--artist", "Daft Punk"], {
      from: "user",
    });
    expect(get).toHaveBeenCalledWith("/api/research/profile", {
      artist: "Daft Punk",
    });
  });
});

describe("research metrics", () => {
  it("passes artist and source", async () => {
    vi.mocked(get).mockResolvedValue({ status: "success" });
    await researchCommand.parseAsync(
      ["metrics", "--artist", "x", "--source", "spotify"],
      { from: "user" },
    );
    expect(get).toHaveBeenCalledWith("/api/research/metrics", {
      artist: "x",
      source: "spotify",
    });
  });
});

describe("research track-stats", () => {
  it("requires a track identifier", async () => {
    await researchCommand.parseAsync(["track-stats", "--source", "spotify"], {
      from: "user",
    });
    expect(get).not.toHaveBeenCalled();
  });

  it("maps --isrc to isrc", async () => {
    vi.mocked(get).mockResolvedValue({ status: "success" });
    await researchCommand.parseAsync(
      ["track-stats", "--isrc", "US123", "--source", "spotify"],
      { from: "user" },
    );
    expect(get).toHaveBeenCalledWith("/api/research/track/stats", {
      isrc: "US123",
      source: "spotify",
    });
  });
});

describe("research deep", () => {
  it("posts query from stdin helper", async () => {
    vi.mocked(valueOrStdin).mockResolvedValue("my query");
    vi.mocked(post).mockResolvedValue({ status: "success", content: "answer" });
    await researchCommand.parseAsync(["deep", "--query", "my query"], {
      from: "user",
    });
    expect(post).toHaveBeenCalledWith("/api/research/deep", { query: "my query" });
  });
});

describe("research snapshots", () => {
  it("requires a scope", async () => {
    await researchCommand.parseAsync(["snapshots"], { from: "user" });
    expect(post).not.toHaveBeenCalled();
  });

  it("splits comma lists", async () => {
    vi.mocked(post).mockResolvedValue({ snapshot_id: "s1", cost_estimate: 1 });
    await researchCommand.parseAsync(["snapshots", "--isrcs", "a,b"], {
      from: "user",
    });
    expect(post).toHaveBeenCalledWith("/api/research/snapshots", {
      isrcs: ["a", "b"],
    });
  });
});
