import { printError, printJson } from "./output.js";
import { getErrorMessage } from "./getErrorMessage.js";

/**
 * Wraps a command action with uniform error handling so every command fails
 * fast with a clear `Error: <message>` and a non-zero exit code.
 */
export function runAction<A extends unknown[]>(
  fn: (...args: A) => Promise<void>,
): (...args: A) => Promise<void> {
  return async (...args: A) => {
    try {
      await fn(...args);
    } catch (err) {
      printError(getErrorMessage(err));
    }
  };
}

/**
 * Emit a result as raw JSON when `--json` is set, otherwise run the plain-text
 * formatter. Keeps the `--json` branch identical across every command.
 */
export function emit(
  opts: { json?: boolean },
  data: unknown,
  plain: () => void,
): void {
  if (opts.json) {
    printJson(data);
  } else {
    plain();
  }
}
