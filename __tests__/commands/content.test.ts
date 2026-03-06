import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/client.js", () => ({
  get: vi.fn(),
  post: vi.fn(),
}));

import { contentCommand } from "../../src/commands/content.js";
import { get, post } from "../../src/client.js";

let logSpy: ReturnType<typeof vi.spyOn>;
let errorSpy: ReturnType<typeof vi.spyOn>;
let exitSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  exitSpy = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("content command", () => {
  it("lists templates", async () => {
    vi.mocked(get).mockResolvedValue({
      status: "success",
      templates: [
        { name: "artist-caption-bedroom", description: "Moody purple bedroom setting" },
      ],
    });

    await contentCommand.parseAsync(["templates"], { from: "user" });

    expect(get).toHaveBeenCalledWith("/api/content/templates");
    expect(logSpy).toHaveBeenCalledWith(
      "- artist-caption-bedroom: Moody purple bedroom setting",
    );
  });

  it("validates an artist", async () => {
    vi.mocked(get).mockResolvedValue({
      status: "success",
      artist_account_id: "550e8400-e29b-41d4-a716-446655440000",
      ready: true,
      missing: [],
    });

    await contentCommand.parseAsync(["validate", "--artist", "550e8400-e29b-41d4-a716-446655440000"], { from: "user" });

    expect(get).toHaveBeenCalledWith("/api/content/validate", {
      artist_account_id: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(logSpy).toHaveBeenCalledWith("Ready: yes");
  });

  it("estimates content cost", async () => {
    vi.mocked(get).mockResolvedValue({
      status: "success",
      per_video_estimate_usd: 0.82,
      total_estimate_usd: 1.64,
    });

    await contentCommand.parseAsync(["estimate", "--batch", "2"], { from: "user" });

    expect(get).toHaveBeenCalledWith("/api/content/estimate", {
      lipsync: "false",
      batch: "2",
      compare: "false",
    });
    expect(logSpy).toHaveBeenCalledWith("Per video: $0.82");
  });

  it("creates content run", async () => {
    vi.mocked(post).mockResolvedValue({
      runIds: ["run_abc123"],
      status: "triggered",
    });

    await contentCommand.parseAsync(
      ["create", "--artist", "550e8400-e29b-41d4-a716-446655440000", "--template", "artist-caption-bedroom"],
      { from: "user" },
    );

    expect(post).toHaveBeenCalledWith("/api/content/create", {
      artist_account_id: "550e8400-e29b-41d4-a716-446655440000",
      template: "artist-caption-bedroom",
      lipsync: false,
      caption_length: "short",
      upscale: false,
      batch: 1,
    });
    expect(logSpy).toHaveBeenCalledWith(`Run started: run_abc123`);
  });

  it("creates content run with custom flags", async () => {
    vi.mocked(post).mockResolvedValue({
      runId: "run_xyz789",
      status: "triggered",
    });

    await contentCommand.parseAsync(
      ["create", "--artist", "test-artist", "--caption-length", "long", "--upscale", "--batch", "3"],
      { from: "user" },
    );

    expect(post).toHaveBeenCalledWith("/api/content/create", {
      artist_account_id: "test-artist",
      template: "artist-caption-bedroom",
      lipsync: false,
      caption_length: "long",
      upscale: true,
      batch: 3,
    });
  });

  it("shows run status and video URL", async () => {
    vi.mocked(get).mockResolvedValue({
      status: "success",
      runs: [
        {
          id: "run_abc123",
          status: "COMPLETED",
          output: {
            video: {
              signedUrl: "https://example.com/video.mp4",
            },
          },
        },
      ],
    });

    await contentCommand.parseAsync(["status", "--run", "run_abc123"], { from: "user" });

    expect(get).toHaveBeenCalledWith("/api/tasks/runs", { runId: "run_abc123" });
    expect(logSpy).toHaveBeenCalledWith("Video URL: https://example.com/video.mp4");
  });

  it("prints error when API call fails", async () => {
    vi.mocked(get).mockRejectedValue(new Error("Request failed"));

    await contentCommand.parseAsync(["templates"], { from: "user" });

    expect(errorSpy).toHaveBeenCalledWith("Error: Request failed");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});

