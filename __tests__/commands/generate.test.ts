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

import { generateCommand } from "../../src/commands/generate.js";
import { post } from "../../src/client.js";
import { valueOrStdin } from "../../src/stdin.js";

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

describe("generate", () => {
  it("posts the prompt and prints text", async () => {
    vi.mocked(valueOrStdin).mockResolvedValue("Hello agent");
    vi.mocked(post).mockResolvedValue({ status: "success", text: "Hi there" });

    await generateCommand.parseAsync(
      ["--prompt", "Hello agent", "--artist", "a1"],
      { from: "user" },
    );

    expect(post).toHaveBeenCalledWith("/api/chat/generate", {
      prompt: "Hello agent",
      artistId: "a1",
    });
    expect(logSpy).toHaveBeenCalledWith("Hi there");
  });

  it("errors when no prompt is provided", async () => {
    vi.mocked(valueOrStdin).mockResolvedValue(undefined);

    await generateCommand.parseAsync([], { from: "user" });

    expect(errorSpy).toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(post).not.toHaveBeenCalled();
  });

  it("passes excludeTools as an array", async () => {
    vi.mocked(valueOrStdin).mockResolvedValue("p");
    vi.mocked(post).mockResolvedValue({ status: "success", text: "" });

    await generateCommand.parseAsync(
      ["--prompt", "p", "--exclude-tools", "a,b , c"],
      { from: "user" },
    );

    expect(post).toHaveBeenCalledWith("/api/chat/generate", {
      prompt: "p",
      excludeTools: ["a", "b", "c"],
    });
  });
});
