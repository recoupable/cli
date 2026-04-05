import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { tasksCommand } from "../../src/commands/tasks.js";
import { get } from "../../src/client.js";

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

describe("tasks command", () => {
  it("shows run status", async () => {
    vi.mocked(get).mockResolvedValue({
      status: "success",
      runs: [
        {
          id: "run_abc123",
          status: "COMPLETED",
          output: {},
        },
      ],
    });

    await tasksCommand.parseAsync(["status", "--run", "run_abc123"], { from: "user" });

    expect(get).toHaveBeenCalledWith("/api/tasks/runs", { runId: "run_abc123" });
    expect(logSpy).toHaveBeenCalledWith("Run: run_abc123");
    expect(logSpy).toHaveBeenCalledWith("Status: COMPLETED");
  });

  it("shows video URL when available", async () => {
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

    await tasksCommand.parseAsync(["status", "--run", "run_abc123"], { from: "user" });

    expect(logSpy).toHaveBeenCalledWith("Video URL: https://example.com/video.mp4");
  });

  it("shows run not found", async () => {
    vi.mocked(get).mockResolvedValue({
      status: "success",
      runs: [],
    });

    await tasksCommand.parseAsync(["status", "--run", "run_missing"], { from: "user" });

    expect(logSpy).toHaveBeenCalledWith("Run not found.");
  });

  it("prints error when API call fails", async () => {
    vi.mocked(get).mockRejectedValue(new Error("Request failed"));

    await tasksCommand.parseAsync(["status", "--run", "run_abc123"], { from: "user" });

    expect(errorSpy).toHaveBeenCalledWith("Error: Request failed");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("handles non-Error thrown values gracefully", async () => {
    vi.mocked(get).mockRejectedValue("plain string error");

    await tasksCommand.parseAsync(["status", "--run", "run_abc123"], { from: "user" });

    expect(errorSpy).toHaveBeenCalledWith("Error: plain string error");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
