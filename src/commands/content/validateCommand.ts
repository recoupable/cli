import { Command } from "commander";
import { get } from "../../client.js";
import { getErrorMessage } from "../../getErrorMessage.js";
import { printError, printJson } from "../../output.js";

export const validateCommand = new Command("validate")
  .description("Validate whether an artist is ready for content creation")
  .requiredOption("--artist <id>", "Artist account ID")
  .option("--json", "Output as JSON")
  .action(async opts => {
    try {
      const data = await get("/api/content/validate", {
        artist_account_id: opts.artist,
      });

      if (opts.json) {
        printJson(data);
        return;
      }

      console.log(`Ready: ${data.ready ? "yes" : "no"}`);
      if (Array.isArray(data.missing) && data.missing.length > 0) {
        console.log("Missing:");
        for (const item of data.missing as Array<Record<string, unknown>>) {
          console.log(`- ${item.file}`);
        }
      }
    } catch (err) {
      printError(getErrorMessage(err));
    }
  });
