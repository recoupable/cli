import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/client.js", () => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
}));

import { accountsCommand } from "../../src/commands/accounts.js";
import { get, patch } from "../../src/client.js";

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

describe("accounts get", () => {
  it("resolves self id then fetches account", async () => {
    vi.mocked(get)
      .mockResolvedValueOnce({ accountId: "me-1" })
      .mockResolvedValueOnce({ account: { account_id: "me-1", name: "Me" } });

    await accountsCommand.parseAsync(["get"], { from: "user" });

    expect(get).toHaveBeenNthCalledWith(1, "/api/accounts/id");
    expect(get).toHaveBeenNthCalledWith(2, "/api/accounts/me-1");
  });

  it("uses --account override without resolving self", async () => {
    vi.mocked(get).mockResolvedValue({ account: { account_id: "a2" } });

    await accountsCommand.parseAsync(["get", "--account", "a2"], { from: "user" });

    expect(get).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledWith("/api/accounts/a2");
  });
});

describe("accounts credits", () => {
  it("prints credits", async () => {
    vi.mocked(get).mockResolvedValue({
      remaining_credits: 50,
      used_credits: 10,
      total_credits: 60,
      is_pro: true,
    });

    await accountsCommand.parseAsync(["credits", "--account", "a1"], {
      from: "user",
    });

    expect(get).toHaveBeenCalledWith("/api/accounts/a1/credits");
    expect(logSpy).toHaveBeenCalledWith("Remaining: 50");
  });
});

describe("accounts update", () => {
  it("patches provided fields", async () => {
    vi.mocked(patch).mockResolvedValue({ data: {} });

    await accountsCommand.parseAsync(
      ["update", "--name", "New", "--instruction", "Be brief"],
      { from: "user" },
    );

    expect(patch).toHaveBeenCalledWith("/api/accounts", {
      name: "New",
      instruction: "Be brief",
    });
  });

  it("errors when no fields are provided", async () => {
    await accountsCommand.parseAsync(["update"], { from: "user" });
    expect(errorSpy).toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(patch).not.toHaveBeenCalled();
  });
});
