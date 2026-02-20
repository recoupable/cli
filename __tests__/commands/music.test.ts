import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../../src/client.js", () => ({
  get: vi.fn(),
  post: vi.fn(),
}));

import { musicCommand } from "../../src/commands/music.js";
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

describe("music analyze", () => {
  it("sends custom prompt to /api/music/analyze", async () => {
    vi.mocked(post).mockResolvedValue({
      status: "success",
      response: "This is jazz music.",
      elapsed_seconds: 3.2,
    });

    await musicCommand.parseAsync(
      ["analyze", "What genre is this?"],
      { from: "user" },
    );

    expect(post).toHaveBeenCalledWith("/api/music/analyze", {
      prompt: "What genre is this?",
    });
  });

  it("sends preset to /api/music/analyze", async () => {
    vi.mocked(post).mockResolvedValue({
      status: "success",
      preset: "catalog_metadata",
      response: { genre: "pop", tempo_bpm: 120 },
      elapsed_seconds: 8.0,
    });

    await musicCommand.parseAsync(
      ["analyze", "--preset", "catalog_metadata", "--audio", "https://example.com/song.mp3"],
      { from: "user" },
    );

    expect(post).toHaveBeenCalledWith("/api/music/analyze", {
      preset: "catalog_metadata",
      audio_url: "https://example.com/song.mp3",
    });
  });

  it("prints text response plainly", async () => {
    vi.mocked(post).mockResolvedValue({
      status: "success",
      response: "This is a jazz piece in Bb major.",
      elapsed_seconds: 2.5,
    });

    await musicCommand.parseAsync(
      ["analyze", "Describe this track."],
      { from: "user" },
    );

    expect(logSpy).toHaveBeenCalledWith("This is a jazz piece in Bb major.");
  });

  it("prints JSON preset response as formatted JSON", async () => {
    vi.mocked(post).mockResolvedValue({
      status: "success",
      response: { genre: "pop", tempo_bpm: 96 },
      elapsed_seconds: 10.0,
    });

    await musicCommand.parseAsync(
      ["analyze", "--preset", "catalog_metadata", "--audio", "https://example.com/song.mp3"],
      { from: "user" },
    );

    expect(logSpy).toHaveBeenCalledWith(
      JSON.stringify({ genre: "pop", tempo_bpm: 96 }, null, 2),
    );
  });

  it("prints full JSON with --json flag", async () => {
    const data = {
      status: "success",
      response: "Jazz in Bb major.",
      elapsed_seconds: 3.0,
    };
    vi.mocked(post).mockResolvedValue(data);

    await musicCommand.parseAsync(
      ["analyze", "Describe this.", "--json"],
      { from: "user" },
    );

    expect(logSpy).toHaveBeenCalledWith(JSON.stringify(data, null, 2));
  });

  it("includes audio_url when --audio is provided", async () => {
    vi.mocked(post).mockResolvedValue({
      status: "success",
      response: "Upbeat pop.",
      elapsed_seconds: 10.0,
    });

    await musicCommand.parseAsync(
      ["analyze", "Describe this.", "--audio", "https://example.com/song.mp3"],
      { from: "user" },
    );

    expect(post).toHaveBeenCalledWith("/api/music/analyze", {
      prompt: "Describe this.",
      audio_url: "https://example.com/song.mp3",
    });
  });

  it("prints error on failure", async () => {
    vi.mocked(post).mockRejectedValue(new Error("Service Unavailable"));

    await musicCommand.parseAsync(
      ["analyze", "Describe this."],
      { from: "user" },
    );

    expect(errorSpy).toHaveBeenCalledWith("Error: Service Unavailable");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("exits with error when no prompt or preset given", async () => {
    await musicCommand.parseAsync(["analyze"], { from: "user" });

    expect(errorSpy).toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});

describe("music presets", () => {
  it("lists presets from /api/music/presets", async () => {
    vi.mocked(get).mockResolvedValue({
      status: "success",
      presets: [
        { name: "catalog_metadata", description: "Catalog enrichment", requiresAudio: true, responseFormat: "json" },
        { name: "mood_tags", description: "Mood tags", requiresAudio: true, responseFormat: "json" },
      ],
    });

    await musicCommand.parseAsync(["presets"], { from: "user" });

    expect(get).toHaveBeenCalledWith("/api/music/presets");
    expect(logSpy).toHaveBeenCalled();
  });

  it("prints JSON with --json flag", async () => {
    const presets = [
      { name: "catalog_metadata", description: "Catalog enrichment" },
    ];
    vi.mocked(get).mockResolvedValue({ status: "success", presets });

    await musicCommand.parseAsync(["presets", "--json"], { from: "user" });

    expect(logSpy).toHaveBeenCalledWith(JSON.stringify(presets, null, 2));
  });
});
