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
      artist_slug: "gatsby-grace",
      ready: true,
      missing: [],
    });

    await contentCommand.parseAsync(["validate", "--artist", "gatsby-grace"], { from: "user" });

    expect(get).toHaveBeenCalledWith("/api/content/validate", {
      artist_slug: "gatsby-grace",
    });
    expect(logSpy).toHaveBeenCalledWith("Artist: gatsby-grace");
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
      runId: "run_abc123",
      status: "triggered",
    });

    await contentCommand.parseAsync(
      ["create", "--artist", "gatsby-grace", "--template", "artist-caption-bedroom"],
      { from: "user" },
    );

    expect(post).toHaveBeenCalledWith("/api/content/create", {
      artist_slug: "gatsby-grace",
      template: "artist-caption-bedroom",
      lipsync: false,
      caption_length: "short",
      upscale: false,
      batch: 1,
    });
    expect(logSpy).toHaveBeenCalledWith("Run started: run_abc123");
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

