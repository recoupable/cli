import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { contentCommand } from "../../src/commands/content.js";
import { get, post } from "../../src/client.js";

vi.mock("../../src/client.js", () => ({
  get: vi.fn(),
  post: vi.fn(),
}));

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
      templates: [{ name: "artist-caption-bedroom", description: "Moody purple bedroom setting" }],
    });

    await contentCommand.parseAsync(["templates"], { from: "user" });

    expect(get).toHaveBeenCalledWith("/api/content/templates");
    expect(logSpy).toHaveBeenCalledWith("- artist-caption-bedroom: Moody purple bedroom setting");
  });

  it("validates an artist", async () => {
    vi.mocked(get).mockResolvedValue({
      status: "success",
      artist_account_id: "550e8400-e29b-41d4-a716-446655440000",
      ready: true,
      missing: [],
    });

    await contentCommand.parseAsync(
      ["validate", "--artist", "550e8400-e29b-41d4-a716-446655440000"],
      { from: "user" },
    );

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
      [
        "create",
        "--artist",
        "550e8400-e29b-41d4-a716-446655440000",
        "--template",
        "artist-caption-bedroom",
      ],
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

  it("shows tasks status hint after create", async () => {
    vi.mocked(post).mockResolvedValue({
      runIds: ["run_abc123"],
      status: "triggered",
    });

    await contentCommand.parseAsync(
      ["create", "--artist", "550e8400-e29b-41d4-a716-446655440000"],
      { from: "user" },
    );

    expect(logSpy).toHaveBeenCalledWith(
      "Use `recoup tasks status --run <runId>` to check progress.",
    );
  });

  it("handles non-Error thrown values gracefully", async () => {
    vi.mocked(get).mockRejectedValue("plain string error");

    await contentCommand.parseAsync(["templates"], { from: "user" });

    expect(errorSpy).toHaveBeenCalledWith("Error: plain string error");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("prints error when API call fails", async () => {
    vi.mocked(get).mockRejectedValue(new Error("Request failed"));

    await contentCommand.parseAsync(["templates"], { from: "user" });

    expect(errorSpy).toHaveBeenCalledWith("Error: Request failed");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("errors when --batch is not a positive integer", async () => {
    await contentCommand.parseAsync(["create", "--artist", "test-artist", "--batch", "abc"], {
      from: "user",
    });

    expect(errorSpy).toHaveBeenCalledWith("Error: --batch must be a positive integer");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("errors when --caption-length is invalid", async () => {
    await contentCommand.parseAsync(
      ["create", "--artist", "test-artist", "--caption-length", "huge"],
      { from: "user" },
    );

    expect(errorSpy).toHaveBeenCalledWith(
      "Error: --caption-length must be one of: short, medium, long",
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("errors when API returns no runIds", async () => {
    vi.mocked(post).mockResolvedValue({
      status: "error",
    });

    await contentCommand.parseAsync(["create", "--artist", "test-artist"], { from: "user" });

    expect(errorSpy).toHaveBeenCalledWith("Error: Response did not include any run IDs");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("creates content run with batch flag and shows batch output", async () => {
    vi.mocked(post).mockResolvedValue({
      runIds: ["run_1", "run_2", "run_3"],
      status: "triggered",
    });

    await contentCommand.parseAsync(
      [
        "create",
        "--artist",
        "test-artist",
        "--caption-length",
        "long",
        "--upscale",
        "--batch",
        "3",
      ],
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
    expect(logSpy).toHaveBeenCalledWith("Batch started: 3 videos");
  });
});
