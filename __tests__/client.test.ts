import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { get, post } from "../src/client.js";

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
  vi.stubEnv("RECOUP_API_KEY", "test-key");
  vi.stubEnv("RECOUP_API_URL", "https://api.test.com");
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("get", () => {
  it("sends GET with api key header", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: "success", data: "test" }),
    });

    const result = await get("/api/test");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.test.com/api/test",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({ "x-api-key": "test-key" }),
      }),
    );
    expect(result).toEqual({ status: "success", data: "test" });
  });

  it("appends query params", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: "success" }),
    });

    await get("/api/test", { foo: "bar", baz: "qux" });

    const calledUrl = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain("foo=bar");
    expect(calledUrl).toContain("baz=qux");
  });

  it("skips empty query params", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: "success" }),
    });

    await get("/api/test", { foo: "bar", empty: "" });

    const calledUrl = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain("foo=bar");
    expect(calledUrl).not.toContain("empty");
  });

  it("throws on HTTP error", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ status: "error", error: "Unauthorized" }),
    });

    await expect(get("/api/test")).rejects.toThrow("Unauthorized");
  });

  it("throws on API error status", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ status: "error", error: "Something went wrong" }),
    });

    await expect(get("/api/test")).rejects.toThrow("Something went wrong");
  });
});

describe("post", () => {
  it("sends POST with body and api key header", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: "success", id: "123" }),
    });

    const result = await post("/api/test", { name: "test" });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.test.com/api/test",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "x-api-key": "test-key" }),
        body: JSON.stringify({ name: "test" }),
      }),
    );
    expect(result).toEqual({ status: "success", id: "123" });
  });

  it("throws on error response", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: () =>
        Promise.resolve({ status: "error", message: "Bad request" }),
    });

    await expect(post("/api/test", {})).rejects.toThrow("Bad request");
  });
});
