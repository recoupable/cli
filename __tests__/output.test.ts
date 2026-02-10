import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { printJson, printTable, printError } from "../src/output.js";

let logSpy: ReturnType<typeof vi.spyOn>;
let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("printJson", () => {
  it("prints formatted JSON", () => {
    printJson({ foo: "bar", count: 42 });
    expect(logSpy).toHaveBeenCalledWith(
      JSON.stringify({ foo: "bar", count: 42 }, null, 2),
    );
  });
});

describe("printTable", () => {
  it("prints column-aligned table", () => {
    const rows = [
      { id: "1", name: "Alice" },
      { id: "2", name: "Bob" },
    ];
    const columns = [
      { key: "id", label: "ID" },
      { key: "name", label: "NAME" },
    ];

    printTable(rows, columns);

    expect(logSpy).toHaveBeenCalledTimes(4); // header + separator + 2 rows
    expect(logSpy.mock.calls[0][0]).toContain("ID");
    expect(logSpy.mock.calls[0][0]).toContain("NAME");
    expect(logSpy.mock.calls[1][0]).toMatch(/^-+\s+-+$/);
    expect(logSpy.mock.calls[2][0]).toContain("1");
    expect(logSpy.mock.calls[2][0]).toContain("Alice");
  });

  it("prints 'No results.' for empty rows", () => {
    printTable([], [{ key: "id", label: "ID" }]);
    expect(logSpy).toHaveBeenCalledWith("No results.");
  });

  it("handles null values", () => {
    const rows = [{ id: "1", name: null }];
    const columns = [
      { key: "id", label: "ID" },
      { key: "name", label: "NAME" },
    ];

    printTable(rows, columns);
    expect(logSpy.mock.calls[2][0]).toContain("1");
  });
});

describe("printError", () => {
  it("prints error to stderr and exits", () => {
    const exitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation(() => undefined as never);

    printError("something failed");

    expect(errorSpy).toHaveBeenCalledWith("Error: something failed");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
