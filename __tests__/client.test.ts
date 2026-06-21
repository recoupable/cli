import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { get, post, patch, put, del } from "../src/client.js";

const mockFetch = vi.fn();

/** Build a fetch-like Response whose body is the JSON-encoded `obj`. */
function mockRes(obj: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    text: () => Promise.resolve(obj === undefined ? "" : JSON.stringify(obj)),
  };
}

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
    mockFetch.mockResolvedValue(mockRes({ status: "success", data: "test" }));

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
    mockFetch.mockResolvedValue(mockRes({ status: "success" }));

    await get("/api/test", { foo: "bar", baz: "qux" });

    const calledUrl = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain("foo=bar");
    expect(calledUrl).toContain("baz=qux");
  });

  it("skips empty query params", async () => {
    mockFetch.mockResolvedValue(mockRes({ status: "success" }));

    await get("/api/test", { foo: "bar", empty: "" });

    const calledUrl = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain("foo=bar");
    expect(calledUrl).not.toContain("empty");
  });

  it("throws on HTTP error", async () => {
    mockFetch.mockResolvedValue(
      mockRes({ status: "error", error: "Unauthorized" }, false, 401),
    );

    await expect(get("/api/test")).rejects.toThrow("Unauthorized");
  });

  it("throws on API error status", async () => {
    mockFetch.mockResolvedValue(
      mockRes({ status: "error", error: "Something went wrong" }),
    );

    await expect(get("/api/test")).rejects.toThrow("Something went wrong");
  });
});

describe("post", () => {
  it("sends POST with body and api key header", async () => {
    mockFetch.mockResolvedValue(mockRes({ status: "success", id: "123" }));

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
    mockFetch.mockResolvedValue(
      mockRes({ status: "error", message: "Bad request" }, false, 400),
    );

    await expect(post("/api/test", {})).rejects.toThrow("Bad request");
  });
});

describe("patch / put / del", () => {
  it("sends PATCH with body", async () => {
    mockFetch.mockResolvedValue(mockRes({ status: "success" }));
    await patch("/api/test", { a: 1 });
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.test.com/api/test",
      expect.objectContaining({ method: "PATCH", body: JSON.stringify({ a: 1 }) }),
    );
  });

  it("sends PUT with body", async () => {
    mockFetch.mockResolvedValue(mockRes({ status: "success" }));
    await put("/api/test", { a: 1 });
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.test.com/api/test",
      expect.objectContaining({ method: "PUT" }),
    );
  });

  it("sends DELETE, optionally with a body", async () => {
    mockFetch.mockResolvedValue(mockRes({ status: "success" }));
    await del("/api/test", { id: "x" });
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.test.com/api/test",
      expect.objectContaining({ method: "DELETE", body: JSON.stringify({ id: "x" }) }),
    );
  });

  it("handles an empty (204-style) body", async () => {
    mockFetch.mockResolvedValue(mockRes(undefined));
    const result = await del("/api/test");
    expect(result).toEqual({});
  });
});
