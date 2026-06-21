import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runAction, emit } from "../src/runAction.js";

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

describe("runAction", () => {
  it("runs the wrapped function", async () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    await runAction(fn)({ a: 1 });
    expect(fn).toHaveBeenCalledWith({ a: 1 });
  });

  it("prints error and exits on throw", async () => {
    await runAction(async () => {
      throw new Error("boom");
    })({});
    expect(errorSpy).toHaveBeenCalledWith("Error: boom");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("handles non-Error throws", async () => {
    await runAction(async () => {
      throw "plain";
    })({});
    expect(errorSpy).toHaveBeenCalledWith("Error: plain");
  });
});

describe("emit", () => {
  it("prints JSON when --json is set", () => {
    emit({ json: true }, { a: 1 }, () => console.log("plain"));
    expect(logSpy).toHaveBeenCalledWith(JSON.stringify({ a: 1 }, null, 2));
  });

  it("runs the plain formatter otherwise", () => {
    const plain = vi.fn();
    emit({ json: false }, { a: 1 }, plain);
    expect(plain).toHaveBeenCalled();
  });
});
