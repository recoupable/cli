import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/client.js", () => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
}));

import { chatsCommand } from "../../src/commands/chats.js";
import { get, patch, del, post } from "../../src/client.js";

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("chats update", () => {
  it("patches topic", async () => {
    vi.mocked(patch).mockResolvedValue({ status: "success", chat: {} });
    await chatsCommand.parseAsync(
      ["update", "--chat", "c1", "--topic", "New topic"],
      { from: "user" },
    );
    expect(patch).toHaveBeenCalledWith("/api/chats", {
      chatId: "c1",
      topic: "New topic",
    });
  });
});

describe("chats delete", () => {
  it("deletes by id", async () => {
    vi.mocked(del).mockResolvedValue({ status: "success" });
    await chatsCommand.parseAsync(["delete", "--chat", "c1"], { from: "user" });
    expect(del).toHaveBeenCalledWith("/api/chats", { id: "c1" });
  });
});

describe("chats messages", () => {
  it("gets messages for a chat", async () => {
    vi.mocked(get).mockResolvedValue({ data: [] });
    await chatsCommand.parseAsync(["messages", "--chat", "c1"], { from: "user" });
    expect(get).toHaveBeenCalledWith("/api/chats/c1/messages");
  });
});

describe("chats compact", () => {
  it("collects repeated --chat into an array", async () => {
    vi.mocked(post).mockResolvedValue({ chats: [] });
    await chatsCommand.parseAsync(
      ["compact", "--chat", "c1", "--chat", "c2"],
      { from: "user" },
    );
    expect(post).toHaveBeenCalledWith("/api/chats/compact", {
      chatId: ["c1", "c2"],
    });
  });
});
