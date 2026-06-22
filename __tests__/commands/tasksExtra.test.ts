import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/client.js", () => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
}));

import { tasksCommand } from "../../src/commands/tasks.js";
import { get, post, patch, del } from "../../src/client.js";

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("tasks list", () => {
  it("passes filters", async () => {
    vi.mocked(get).mockResolvedValue({ status: "success", tasks: [] });
    await tasksCommand.parseAsync(["list", "--artist", "a1"], { from: "user" });
    expect(get).toHaveBeenCalledWith("/api/tasks", { artist_account_id: "a1" });
  });
});

describe("tasks create", () => {
  it("posts required fields", async () => {
    vi.mocked(post).mockResolvedValue({ status: "success", tasks: [{ id: "t1" }] });
    await tasksCommand.parseAsync(
      [
        "create",
        "--title",
        "Daily",
        "--prompt",
        "Summarize",
        "--schedule",
        "0 9 * * *",
        "--artist",
        "a1",
      ],
      { from: "user" },
    );
    expect(post).toHaveBeenCalledWith("/api/tasks", {
      title: "Daily",
      prompt: "Summarize",
      schedule: "0 9 * * *",
      artist_account_id: "a1",
    });
  });
});

describe("tasks update", () => {
  it("coerces --enabled to boolean", async () => {
    vi.mocked(patch).mockResolvedValue({ status: "success", tasks: [] });
    await tasksCommand.parseAsync(["update", "--id", "t1", "--enabled", "false"], {
      from: "user",
    });
    expect(patch).toHaveBeenCalledWith("/api/tasks", { id: "t1", enabled: false });
  });
});

describe("tasks delete", () => {
  it("deletes by id", async () => {
    vi.mocked(del).mockResolvedValue({ status: "success" });
    await tasksCommand.parseAsync(["delete", "--id", "t1"], { from: "user" });
    expect(del).toHaveBeenCalledWith("/api/tasks", { id: "t1" });
  });
});

describe("tasks runs", () => {
  it("lists runs with limit", async () => {
    vi.mocked(get).mockResolvedValue({ status: "success", runs: [] });
    await tasksCommand.parseAsync(["runs", "--limit", "10"], { from: "user" });
    expect(get).toHaveBeenCalledWith("/api/tasks/runs", { limit: "10" });
  });
});
