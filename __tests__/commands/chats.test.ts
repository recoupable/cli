import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../../src/client.js", () => ({
  get: vi.fn(),
  post: vi.fn(),
}));

import { chatsCommand } from "../../src/commands/chats.js";
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

describe("chats list", () => {
  it("prints chats table", async () => {
    vi.mocked(get).mockResolvedValue({
      status: "success",
      chats: [
        {
          id: "c1",
          topic: "Marketing plan",
          updated_at: "2025-01-01T00:00:00Z",
        },
      ],
    });

    await chatsCommand.parseAsync(["list"], { from: "user" });

    expect(get).toHaveBeenCalledWith("/api/chats");
    expect(logSpy).toHaveBeenCalledTimes(3); // header + separator + 1 row
  });

  it("prints JSON with --json flag", async () => {
    const chats = [{ id: "c1", topic: "Test", updated_at: "2025-01-01" }];
    vi.mocked(get).mockResolvedValue({ status: "success", chats });

    await chatsCommand.parseAsync(["list", "--json"], {
      from: "user",
    });

    expect(logSpy).toHaveBeenCalledWith(JSON.stringify(chats, null, 2));
  });
});

describe("chats create", () => {
  it("creates a chat with topic", async () => {
    vi.mocked(post).mockResolvedValue({
      status: "success",
      chat: { id: "new-chat-id", topic: "My Topic" },
    });

    await chatsCommand.parseAsync(["create", "--name", "My Topic"], {
      from: "user",
    });

    expect(post).toHaveBeenCalledWith("/api/chats", { topic: "My Topic" });
    expect(logSpy).toHaveBeenCalledWith("Created chat: new-chat-id");
  });

  it("creates a chat with artist", async () => {
    vi.mocked(post).mockResolvedValue({
      status: "success",
      chat: { id: "new-chat-id" },
    });

    await chatsCommand.parseAsync(["create", "--artist", "artist-123"], {
      from: "user",
    });

    expect(post).toHaveBeenCalledWith("/api/chats", {
      artistId: "artist-123",
    });
  });

  it("prints JSON with --json flag", async () => {
    const chat = { id: "new-chat-id", topic: "Test" };
    vi.mocked(post).mockResolvedValue({ status: "success", chat });

    await chatsCommand.parseAsync(["create", "--json"], {
      from: "user",
    });

    expect(logSpy).toHaveBeenCalledWith(JSON.stringify(chat, null, 2));
  });

  it("prints error on failure", async () => {
    vi.mocked(post).mockRejectedValue(new Error("Failed to create chat"));

    await chatsCommand.parseAsync(["create"], { from: "user" });

    expect(errorSpy).toHaveBeenCalledWith("Error: Failed to create chat");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
