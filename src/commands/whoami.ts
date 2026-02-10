import { Command } from "commander";
import { get } from "../client.js";
import { printJson, printError } from "../output.js";

export const whoamiCommand = new Command("whoami")
  .description("Show the current authenticated account")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    try {
      const data = await get("/api/accounts/id");
      if (opts.json) {
        printJson(data);
      } else {
        console.log(data.accountId);
      }
    } catch (err) {
      printError((err as Error).message);
    }
  });
