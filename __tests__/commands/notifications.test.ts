import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { notificationsCommand } from "../../src/commands/notifications.js";
import { post } from "../../src/client.js";

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

describe("notifications command", () => {
  it("sends notification with subject and text", async () => {
    vi.mocked(post).mockResolvedValue({
      success: true,
      message: "Email sent successfully.",
      id: "email-123",
    });

    await notificationsCommand.parseAsync(["--subject", "Test Subject", "--text", "Hello world"], {
      from: "user",
    });

    expect(post).toHaveBeenCalledWith("/api/notifications", {
      subject: "Test Subject",
      text: "Hello world",
    });
    expect(logSpy).toHaveBeenCalledWith("Email sent successfully.");
  });

  it("sends notification with html body", async () => {
    vi.mocked(post).mockResolvedValue({
      success: true,
      message: "Email sent successfully.",
      id: "email-456",
    });

    await notificationsCommand.parseAsync(
      ["--subject", "Weekly Pulse", "--html", "<h1>Report</h1>"],
      { from: "user" },
    );

    expect(post).toHaveBeenCalledWith("/api/notifications", {
      subject: "Weekly Pulse",
      html: "<h1>Report</h1>",
    });
  });

  it("passes cc and room-id options", async () => {
    vi.mocked(post).mockResolvedValue({
      success: true,
      message: "Email sent successfully.",
      id: "email-789",
    });

    await notificationsCommand.parseAsync(
      ["--subject", "Update", "--text", "Hello", "--cc", "cc@example.com", "--room-id", "room-abc"],
      { from: "user" },
    );

    expect(post).toHaveBeenCalledWith("/api/notifications", {
      subject: "Update",
      text: "Hello",
      cc: ["cc@example.com"],
      room_id: "room-abc",
    });
  });

  it("supports multiple cc recipients", async () => {
    vi.mocked(post).mockResolvedValue({
      success: true,
      message: "Email sent successfully.",
      id: "email-multi",
    });

    await notificationsCommand.parseAsync(
      ["--subject", "Update", "--cc", "a@example.com", "--cc", "b@example.com"],
      { from: "user" },
    );

    expect(post).toHaveBeenCalledWith("/api/notifications", {
      subject: "Update",
      cc: ["a@example.com", "b@example.com"],
    });
  });

  it("prints JSON with --json flag", async () => {
    const response = {
      success: true,
      message: "Email sent successfully.",
      id: "email-123",
    };
    vi.mocked(post).mockResolvedValue(response);

    await notificationsCommand.parseAsync(["--subject", "Test", "--json"], { from: "user" });

    expect(logSpy).toHaveBeenCalledWith(JSON.stringify(response, null, 2));
  });

  it("passes account_id when --account flag is provided", async () => {
    vi.mocked(post).mockResolvedValue({
      success: true,
      message: "Email sent successfully.",
      id: "email-account",
    });

    await notificationsCommand.parseAsync(
      [
        "--subject",
        "Override Test",
        "--text",
        "Hello member",
        "--account",
        "550e8400-e29b-41d4-a716-446655440000",
      ],
      { from: "user" },
    );

    expect(post).toHaveBeenCalledWith("/api/notifications", {
      subject: "Override Test",
      text: "Hello member",
      account_id: "550e8400-e29b-41d4-a716-446655440000",
    });
  });

  it("does not include account_id when --account is omitted", async () => {
    vi.mocked(post).mockResolvedValue({
      success: true,
      message: "Email sent successfully.",
      id: "email-no-account",
    });

    await notificationsCommand.parseAsync(["--subject", "Test"], { from: "user" });

    expect(post).toHaveBeenCalledWith("/api/notifications", {
      subject: "Test",
    });
  });

  it("prints error on failure", async () => {
    vi.mocked(post).mockRejectedValue(new Error("No email address found"));

    await notificationsCommand.parseAsync(["--subject", "Test"], { from: "user" });

    expect(errorSpy).toHaveBeenCalledWith("Error: No email address found");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
