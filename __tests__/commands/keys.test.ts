import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../../src/client.js", () => ({
  get: vi.fn(),
  post: vi.fn(),
  del: vi.fn(),
}));

import { keysCommand } from "../../src/commands/keys.js";
import { get, post, del } from "../../src/client.js";

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

describe("keys list", () => {
  it("prints API keys table", async () => {
    vi.mocked(get).mockResolvedValue({
      keys: [
        { id: "key-1", name: "My Key", created_at: "2024-01-01T00:00:00Z", last_used: null },
        { id: "key-2", name: "CI Key", created_at: "2024-02-01T00:00:00Z", last_used: "2024-03-01T00:00:00Z" },
      ],
    });

    await keysCommand.parseAsync(["list"], { from: "user" });

    expect(get).toHaveBeenCalledWith("/api/keys");
    expect(logSpy).toHaveBeenCalledTimes(4); // header + separator + 2 rows
  });

  it("prints JSON with --json flag", async () => {
    const keys = [
      { id: "key-1", name: "My Key", created_at: "2024-01-01T00:00:00Z", last_used: null },
    ];
    vi.mocked(get).mockResolvedValue({ keys });

    await keysCommand.parseAsync(["list", "--json"], { from: "user" });

    expect(logSpy).toHaveBeenCalledWith(JSON.stringify(keys, null, 2));
  });

  it("handles empty key list", async () => {
    vi.mocked(get).mockResolvedValue({ keys: [] });

    await keysCommand.parseAsync(["list"], { from: "user" });

    expect(logSpy).toHaveBeenCalledWith("No results.");
  });

  it("prints error on failure", async () => {
    vi.mocked(get).mockRejectedValue(new Error("Unauthorized"));

    await keysCommand.parseAsync(["list"], { from: "user" });

    expect(errorSpy).toHaveBeenCalledWith("Error: Unauthorized");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});

describe("keys create", () => {
  it("creates an API key and prints it", async () => {
    vi.mocked(post).mockResolvedValue({ key: "recoup_sk_abc123" });

    await keysCommand.parseAsync(["create", "--name", "My Key"], {
      from: "user",
    });

    expect(post).toHaveBeenCalledWith("/api/keys", { key_name: "My Key" });
    expect(logSpy).toHaveBeenCalledWith("recoup_sk_abc123");
  });

  it("prints JSON with --json flag", async () => {
    const response = { key: "recoup_sk_abc123" };
    vi.mocked(post).mockResolvedValue(response);

    await keysCommand.parseAsync(["create", "--name", "My Key", "--json"], {
      from: "user",
    });

    expect(logSpy).toHaveBeenCalledWith(JSON.stringify(response, null, 2));
  });

  it("prints error when key is missing from response", async () => {
    vi.mocked(post).mockResolvedValue({});

    await keysCommand.parseAsync(["create", "--name", "My Key"], {
      from: "user",
    });

    expect(errorSpy).toHaveBeenCalledWith("Error: No key returned from API");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("prints error when --name is missing", async () => {
    await keysCommand.parseAsync(["create"], { from: "user" });

    expect(errorSpy).toHaveBeenCalledWith(
      "Error: --name is required",
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("prints error on API failure", async () => {
    vi.mocked(post).mockRejectedValue(new Error("Unauthorized"));

    await keysCommand.parseAsync(["create", "--name", "My Key"], {
      from: "user",
    });

    expect(errorSpy).toHaveBeenCalledWith("Error: Unauthorized");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});

describe("keys delete", () => {
  it("deletes an API key by id and prints confirmation", async () => {
    vi.mocked(del).mockResolvedValue({
      status: "success",
      message: "API key deleted successfully",
    });

    await keysCommand.parseAsync(["delete", "--id", "key-123"], {
      from: "user",
    });

    expect(del).toHaveBeenCalledWith("/api/keys", { id: "key-123" });
    expect(logSpy).toHaveBeenCalledWith("API key deleted successfully");
  });

  it("prints JSON with --json flag", async () => {
    const response = { status: "success", message: "API key deleted successfully" };
    vi.mocked(del).mockResolvedValue(response);

    await keysCommand.parseAsync(["delete", "--id", "key-123", "--json"], {
      from: "user",
    });

    expect(logSpy).toHaveBeenCalledWith(JSON.stringify(response, null, 2));
  });

  it("prints error when --id is missing", async () => {
    await keysCommand.parseAsync(["delete"], { from: "user" });

    expect(errorSpy).toHaveBeenCalledWith(
      "Error: --id is required",
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("prints error on API failure", async () => {
    vi.mocked(del).mockRejectedValue(new Error("API key not found"));

    await keysCommand.parseAsync(["delete", "--id", "key-123"], {
      from: "user",
    });

    expect(errorSpy).toHaveBeenCalledWith("Error: API key not found");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
