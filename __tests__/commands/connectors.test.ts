import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/client.js", () => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
}));
vi.mock("../../src/stdin.js", async (orig) => {
  const actual = (await orig()) as object;
  return { ...actual, valueOrStdin: vi.fn() };
});

import { connectorsCommand } from "../../src/commands/connectors.js";
import { get, post, del } from "../../src/client.js";
import { valueOrStdin } from "../../src/stdin.js";

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("connectors list", () => {
  it("lists connectors", async () => {
    vi.mocked(get).mockResolvedValue({ success: true, connectors: [] });
    await connectorsCommand.parseAsync(["list"], { from: "user" });
    expect(get).toHaveBeenCalledWith("/api/connectors", {});
  });
});

describe("connectors connect", () => {
  it("posts connector slug", async () => {
    vi.mocked(post).mockResolvedValue({ success: true, data: { redirectUrl: "u" } });
    await connectorsCommand.parseAsync(
      ["connect", "--connector", "googlesheets"],
      { from: "user" },
    );
    expect(post).toHaveBeenCalledWith("/api/connectors", {
      connector: "googlesheets",
    });
  });
});

describe("connectors disconnect", () => {
  it("deletes by connected_account_id", async () => {
    vi.mocked(del).mockResolvedValue({ success: true, message: "ok" });
    await connectorsCommand.parseAsync(["disconnect", "--id", "ca1"], {
      from: "user",
    });
    expect(del).toHaveBeenCalledWith("/api/connectors", {
      connected_account_id: "ca1",
    });
  });
});

describe("connectors run", () => {
  it("parses --params JSON", async () => {
    vi.mocked(valueOrStdin).mockResolvedValue('{"max_results":10}');
    vi.mocked(post).mockResolvedValue({ success: true, result: {} });
    await connectorsCommand.parseAsync(
      ["run", "--action", "GMAIL_FETCH_EMAILS", "--params", '{"max_results":10}'],
      { from: "user" },
    );
    expect(post).toHaveBeenCalledWith("/api/connectors/actions", {
      actionSlug: "GMAIL_FETCH_EMAILS",
      parameters: { max_results: 10 },
    });
  });

  it("defaults params to {} when none provided", async () => {
    vi.mocked(valueOrStdin).mockResolvedValue(undefined);
    vi.mocked(post).mockResolvedValue({ success: true, result: {} });
    await connectorsCommand.parseAsync(["run", "--action", "X"], {
      from: "user",
    });
    expect(post).toHaveBeenCalledWith("/api/connectors/actions", {
      actionSlug: "X",
      parameters: {},
    });
  });
});
