import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../../src/client.js", () => ({
  get: vi.fn(),
  post: vi.fn(),
  del: vi.fn(),
}));

import { accountsCommand } from "../../src/commands/accounts.js";
import { post } from "../../src/client.js";

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

describe("accounts create", () => {
  it("creates account with email and prints account_id", async () => {
    vi.mocked(post).mockResolvedValue({
      data: { account_id: "acc-123", email: "test@example.com" },
    });

    await accountsCommand.parseAsync(
      ["create", "--email", "test@example.com"],
      { from: "user" },
    );

    expect(post).toHaveBeenCalledWith("/api/accounts", {
      email: "test@example.com",
    });
    expect(logSpy).toHaveBeenCalledWith("acc-123");
  });

  it("creates account with wallet and prints account_id", async () => {
    vi.mocked(post).mockResolvedValue({
      data: { account_id: "acc-456", wallet: "0xabc123" },
    });

    await accountsCommand.parseAsync(
      ["create", "--wallet", "0xabc123"],
      { from: "user" },
    );

    expect(post).toHaveBeenCalledWith("/api/accounts", {
      wallet: "0xabc123",
    });
    expect(logSpy).toHaveBeenCalledWith("acc-456");
  });

  it("prints JSON with --json flag", async () => {
    const response = {
      data: { account_id: "acc-123", email: "test@example.com" },
    };
    vi.mocked(post).mockResolvedValue(response);

    await accountsCommand.parseAsync(
      ["create", "--email", "test@example.com", "--json"],
      { from: "user" },
    );

    expect(logSpy).toHaveBeenCalledWith(JSON.stringify(response, null, 2));
  });

  it("prints error when no email or wallet provided", async () => {
    await accountsCommand.parseAsync(["create"], { from: "user" });

    expect(errorSpy).toHaveBeenCalledWith(
      "Error: at least one of --email or --wallet is required",
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("prints error when account_id is missing from response", async () => {
    vi.mocked(post).mockResolvedValue({ data: {} });

    await accountsCommand.parseAsync(
      ["create", "--email", "test@example.com"],
      { from: "user" },
    );

    expect(errorSpy).toHaveBeenCalledWith(
      "Error: Account ID not found in API response",
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("prints error on API failure", async () => {
    vi.mocked(post).mockRejectedValue(new Error("Request failed"));

    await accountsCommand.parseAsync(
      ["create", "--email", "test@example.com"],
      { from: "user" },
    );

    expect(errorSpy).toHaveBeenCalledWith("Error: Request failed");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});

describe("accounts upgrade", () => {
  it("prints the upgrade URL", async () => {
    await accountsCommand.parseAsync(["upgrade"], { from: "user" });

    expect(logSpy).toHaveBeenCalledWith(
      "To upgrade to Pro, visit: https://chat.recoupable.com/settings",
    );
  });
});
