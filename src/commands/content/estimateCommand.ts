import { Command } from "commander";
import { get } from "../../client.js";
import { getErrorMessage } from "../../getErrorMessage.js";
import { printError, printJson } from "../../output.js";
import { parsePositiveInt } from "./parsePositiveInt.js";

export const estimateCommand = new Command("estimate")
  .description("Estimate content creation cost")
  .option("--lipsync", "Estimate for lipsync mode")
  .option("--batch <count>", "Number of videos", "1")
  .option("--compare", "Include comparison profiles")
  .option("--json", "Output as JSON")
  .action(async opts => {
    try {
      const batch = parsePositiveInt(String(opts.batch ?? "1"), "--batch");
      const data = await get("/api/content/estimate", {
        lipsync: opts.lipsync ? "true" : "false",
        batch: String(batch),
        compare: opts.compare ? "true" : "false",
      });

      if (opts.json) {
        printJson(data);
        return;
      }

      console.log(`Per video: $${data.per_video_estimate_usd}`);
      console.log(`Total: $${data.total_estimate_usd}`);
    } catch (err) {
      printError(getErrorMessage(err));
    }
  });
