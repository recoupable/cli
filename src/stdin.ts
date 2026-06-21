/**
 * Read piped stdin to a trimmed string. Returns "" when nothing is piped
 * (e.g. an interactive terminal) so callers can fall back to flags.
 */
export async function readStdin(): Promise<string> {
  if (process.stdin.isTTY) {
    return "";
  }
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString("utf-8").trim();
}

/**
 * Resolve a value that may come from a flag or piped stdin. Flag wins; stdin is
 * the fallback. Returns undefined when neither is provided.
 */
export async function valueOrStdin(
  flag: string | undefined,
): Promise<string | undefined> {
  if (flag !== undefined && flag !== "") {
    return flag;
  }
  const piped = await readStdin();
  return piped === "" ? undefined : piped;
}

/**
 * Parse a JSON string from a flag, throwing a clear error on malformed input.
 */
export function parseJsonFlag(raw: string, flagName: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(
      `${flagName} must be valid JSON. Received: ${raw.slice(0, 80)}`,
    );
  }
}
