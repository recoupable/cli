export function printJson(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}

export function printTable(
  rows: Record<string, unknown>[],
  columns: { key: string; label: string }[],
): void {
  if (rows.length === 0) {
    console.log("No results.");
    return;
  }

  const widths = columns.map((col) =>
    Math.max(
      col.label.length,
      ...rows.map((row) => String(row[col.key] ?? "").length),
    ),
  );

  const header = columns
    .map((col, i) => col.label.padEnd(widths[i]))
    .join("  ");
  const separator = widths.map((w) => "-".repeat(w)).join("  ");

  console.log(header);
  console.log(separator);

  for (const row of rows) {
    const line = columns
      .map((col, i) => String(row[col.key] ?? "").padEnd(widths[i]))
      .join("  ");
    console.log(line);
  }
}

export function printError(message: string): void {
  console.error(`Error: ${message}`);
  process.exit(1);
}
