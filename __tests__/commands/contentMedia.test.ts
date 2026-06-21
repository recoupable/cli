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

import { contentCommand } from "../../src/commands/content.js";
import { get, post, patch } from "../../src/client.js";
import { valueOrStdin } from "../../src/stdin.js";

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("content caption", () => {
  it("posts topic", async () => {
    vi.mocked(post).mockResolvedValue({ content: "caption!" });
    await contentCommand.parseAsync(["caption", "--topic", "tour"], {
      from: "user",
    });
    expect(post).toHaveBeenCalledWith("/api/content/caption", { topic: "tour" });
  });
});

describe("content image", () => {
  it("posts prompt and numeric num", async () => {
    vi.mocked(post).mockResolvedValue({ imageUrl: "u", images: ["u"] });
    await contentCommand.parseAsync(
      ["image", "--prompt", "cover art", "--num", "2", "--aspect", "1:1"],
      { from: "user" },
    );
    expect(post).toHaveBeenCalledWith("/api/content/image", {
      prompt: "cover art",
      num_images: 2,
      aspect_ratio: "1:1",
    });
  });
});

describe("content transcribe", () => {
  it("collects repeated --audio into audio_urls", async () => {
    vi.mocked(post).mockResolvedValue({ transcript: "t" });
    await contentCommand.parseAsync(
      ["transcribe", "--audio", "a.mp3", "--audio", "b.mp3"],
      { from: "user" },
    );
    expect(post).toHaveBeenCalledWith("/api/content/transcribe", {
      audio_urls: ["a.mp3", "b.mp3"],
    });
  });
});

describe("content analyze", () => {
  it("requires a prompt", async () => {
    vi.mocked(valueOrStdin).mockResolvedValue(undefined);
    await contentCommand.parseAsync(["analyze", "--video", "v.mp4"], {
      from: "user",
    });
    expect(post).not.toHaveBeenCalled();
  });

  it("posts video and prompt", async () => {
    vi.mocked(valueOrStdin).mockResolvedValue("describe");
    vi.mocked(post).mockResolvedValue({ text: "ok" });
    await contentCommand.parseAsync(
      ["analyze", "--video", "v.mp4", "--prompt", "describe"],
      { from: "user" },
    );
    expect(post).toHaveBeenCalledWith("/api/content/analyze", {
      video_url: "v.mp4",
      prompt: "describe",
    });
  });
});

describe("content upscale", () => {
  it("posts url and type", async () => {
    vi.mocked(post).mockResolvedValue({ url: "out" });
    await contentCommand.parseAsync(
      ["upscale", "--url", "in.png", "--type", "image"],
      { from: "user" },
    );
    expect(post).toHaveBeenCalledWith("/api/content/upscale", {
      url: "in.png",
      type: "image",
    });
  });
});

describe("content edit", () => {
  it("requires template or operations", async () => {
    vi.mocked(valueOrStdin).mockResolvedValue(undefined);
    await contentCommand.parseAsync(["edit", "--video", "v.mp4"], {
      from: "user",
    });
    expect(patch).not.toHaveBeenCalled();
  });

  it("patches with a template", async () => {
    vi.mocked(valueOrStdin).mockResolvedValue(undefined);
    vi.mocked(patch).mockResolvedValue({ runId: "r1", status: "triggered" });
    await contentCommand.parseAsync(
      ["edit", "--video", "v.mp4", "--template", "social-cut"],
      { from: "user" },
    );
    expect(patch).toHaveBeenCalledWith("/api/content", {
      video_url: "v.mp4",
      template: "social-cut",
    });
  });
});

describe("content template (get one)", () => {
  it("fetches by id", async () => {
    vi.mocked(get).mockResolvedValue({ id: "t1" });
    await contentCommand.parseAsync(["template", "t1"], { from: "user" });
    expect(get).toHaveBeenCalledWith("/api/content/templates/t1");
  });
});
