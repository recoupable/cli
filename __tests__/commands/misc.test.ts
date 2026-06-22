import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/client.js", () => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
}));

import { spotifyCommand } from "../../src/commands/spotify.js";
import { modelsCommand } from "../../src/commands/models.js";
import { workspacesCommand } from "../../src/commands/workspaces.js";
import { sessionsCommand } from "../../src/commands/sessions.js";
import { templatesCommand } from "../../src/commands/templates.js";
import { get, post, patch, put, del } from "../../src/client.js";

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("spotify", () => {
  it("search passes q and type", async () => {
    vi.mocked(get).mockResolvedValue({ status: "success" });
    await spotifyCommand.parseAsync(
      ["search", "--q", "Daft Punk", "--type", "artist"],
      { from: "user" },
    );
    expect(get).toHaveBeenCalledWith("/api/spotify/search", {
      q: "Daft Punk",
      type: "artist",
    });
  });

  it("top-tracks passes id and market", async () => {
    vi.mocked(get).mockResolvedValue({ status: "success" });
    await spotifyCommand.parseAsync(
      ["top-tracks", "--id", "x", "--market", "US"],
      { from: "user" },
    );
    expect(get).toHaveBeenCalledWith("/api/spotify/artist/topTracks", {
      id: "x",
      market: "US",
    });
  });
});

describe("models list", () => {
  it("fetches models", async () => {
    vi.mocked(get).mockResolvedValue({ models: [] });
    await modelsCommand.parseAsync(["list"], { from: "user" });
    expect(get).toHaveBeenCalledWith("/api/ai/models");
  });
});

describe("workspaces create", () => {
  it("posts name", async () => {
    vi.mocked(post).mockResolvedValue({ workspace: { id: "w1" } });
    await workspacesCommand.parseAsync(["create", "--name", "Q1"], {
      from: "user",
    });
    expect(post).toHaveBeenCalledWith("/api/workspaces", { name: "Q1" });
  });
});

describe("sessions", () => {
  it("create posts fields", async () => {
    vi.mocked(post).mockResolvedValue({ session: { id: "s1" } });
    await sessionsCommand.parseAsync(["create", "--title", "Build"], {
      from: "user",
    });
    expect(post).toHaveBeenCalledWith("/api/sessions", { title: "Build" });
  });

  it("get fetches a session", async () => {
    vi.mocked(get).mockResolvedValue({ session: { id: "s1" } });
    await sessionsCommand.parseAsync(["get", "s1"], { from: "user" });
    expect(get).toHaveBeenCalledWith("/api/sessions/s1");
  });

  it("update patches a session", async () => {
    vi.mocked(patch).mockResolvedValue({ session: {} });
    await sessionsCommand.parseAsync(["update", "s1", "--status", "completed"], {
      from: "user",
    });
    expect(patch).toHaveBeenCalledWith("/api/sessions/s1", {
      status: "completed",
    });
  });
});

describe("templates", () => {
  it("create posts with defaults", async () => {
    vi.mocked(post).mockResolvedValue({ template: { id: "t1" } });
    await templatesCommand.parseAsync(
      [
        "create",
        "--title",
        "Recap",
        "--description",
        "Weekly recap of streams",
        "--prompt",
        "Produce a weekly streaming recap report",
        "--tags",
        "a,b",
      ],
      { from: "user" },
    );
    expect(post).toHaveBeenCalledWith("/api/agents/templates", {
      title: "Recap",
      description: "Weekly recap of streams",
      prompt: "Produce a weekly streaming recap report",
      tags: ["a", "b"],
      is_private: false,
    });
  });

  it("favorite uses PUT with is_favourite true", async () => {
    vi.mocked(put).mockResolvedValue({ status: "success" });
    await templatesCommand.parseAsync(["favorite", "t1"], { from: "user" });
    expect(put).toHaveBeenCalledWith("/api/agents/templates/t1/favorite", {
      is_favourite: true,
    });
  });

  it("favorite --off uses PUT with false", async () => {
    vi.mocked(put).mockResolvedValue({ status: "success" });
    await templatesCommand.parseAsync(["favorite", "t1", "--off"], {
      from: "user",
    });
    expect(put).toHaveBeenCalledWith("/api/agents/templates/t1/favorite", {
      is_favourite: false,
    });
  });

  it("delete uses DELETE", async () => {
    vi.mocked(del).mockResolvedValue({ status: "success" });
    await templatesCommand.parseAsync(["delete", "t1"], { from: "user" });
    expect(del).toHaveBeenCalledWith("/api/agents/templates/t1");
  });
});
