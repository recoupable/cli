import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/client.js", () => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
}));

import { pulsesCommand } from "../../src/commands/pulses.js";
import { get, patch } from "../../src/client.js";

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("pulses list", () => {
  it("passes active filter", async () => {
    vi.mocked(get).mockResolvedValue({ status: "success", pulses: [] });
    await pulsesCommand.parseAsync(["list", "--active", "true"], { from: "user" });
    expect(get).toHaveBeenCalledWith("/api/pulses", { active: "true" });
  });
});

describe("pulses set", () => {
  it("coerces --active to a boolean", async () => {
    vi.mocked(patch).mockResolvedValue({ status: "success", pulses: [] });
    await pulsesCommand.parseAsync(["set", "--active", "true"], { from: "user" });
    expect(patch).toHaveBeenCalledWith("/api/pulses", { active: true });
  });

  it("coerces false correctly", async () => {
    vi.mocked(patch).mockResolvedValue({ status: "success", pulses: [] });
    await pulsesCommand.parseAsync(["set", "--active", "false", "--account", "a1"], {
      from: "user",
    });
    expect(patch).toHaveBeenCalledWith("/api/pulses", {
      active: false,
      account_id: "a1",
    });
  });
});
