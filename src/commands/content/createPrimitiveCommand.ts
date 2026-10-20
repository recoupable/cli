import { Command } from "commander";
import { post } from "../../client.js";
import { getErrorMessage } from "../../getErrorMessage.js";
import { printError, printJson } from "../../output.js";

interface PrimitiveOption {
  flag: string;
  description: string;
  defaultValue?: string;
}

/**
 * Creates a CLI command that POSTs to a content primitive endpoint.
 * Each primitive only defines what is unique: name, endpoint, and options.
 */
export function createPrimitiveCommand(
  name: string,
  description: string,
  endpoint: string,
  options: PrimitiveOption[],
  buildBody: (opts: Record<string, unknown>) => Record<string, unknown>,
): Command {
  const cmd = new Command(name).description(description);

  for (const opt of options) {
    if (opt.defaultValue !== undefined) {
      cmd.option(opt.flag, opt.description, opt.defaultValue);
    } else {
      cmd.option(opt.flag, opt.description);
    }
  }

  cmd.option("--json", "Output as JSON");

  cmd.action(async (opts: Record<string, unknown>) => {
    try {
      const body = buildBody(opts);
      const data = await post(endpoint, body);

      if (opts.json) {
        printJson(data);
        return;
      }

      if (data.runId) {
        console.log(`Run started: ${data.runId}`);
        console.log("Use `recoup tasks status --run <runId>` to check progress.");
      } else {
        printJson(data);
      }
    } catch (err) {
      printError(getErrorMessage(err));
    }
  });

  return cmd;
}
