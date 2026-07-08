import { Command } from "commander";
import { get } from "../client.js";
import { printJson, printTable, printError } from "../output.js";

const listCommand = new Command("list")
  .description("List past engagement predictions")
  .option("--json", "Output as JSON")
  .option("--limit <limit>", "Maximum results to return", "20")
  .option("--offset <offset>", "Number of results to skip", "0")
  .action(async (opts) => {
    try {
      const params: Record<string, string> = {};
      if (opts.limit) params.limit = opts.limit;
      if (opts.offset) params.offset = opts.offset;

      const data = await get("/api/predictions", params);
      const predictions =
        (data.predictions as Record<string, unknown>[]) || [];

      if (opts.json) {
        printJson(predictions);
      } else {
        printTable(predictions, [
          { key: "id", label: "ID" },
          { key: "modality", label: "MODALITY" },
          { key: "engagement_score", label: "SCORE" },
          { key: "created_at", label: "CREATED" },
        ]);
      }
    } catch (err) {
      printError((err as Error).message);
    }
  });

const getCommand = new Command("get")
  .description("Get a specific prediction by ID")
  .argument("<id>", "Prediction UUID")
  .option("--json", "Output as JSON")
  .action(async (id: string, opts) => {
    try {
      const data = await get(`/api/predictions/${id}`);

      if (opts.json) {
        printJson(data);
        return;
      }

      console.log();
      console.log(`  ID:               ${data.id}`);
      console.log(`  Engagement Score: ${data.engagement_score}`);
      console.log(`  Modality:         ${data.modality}`);
      console.log(`  File URL:         ${data.file_url}`);
      console.log(
        `  Duration:         ${data.total_duration_seconds}s`,
      );
      console.log(`  Inference Time:   ${data.elapsed_seconds}s`);
      console.log(`  Created:          ${data.created_at}`);
      console.log();

      const peaks = data.peak_moments as
        | { time_seconds: number; score: number }[]
        | undefined;
      if (peaks && peaks.length > 0) {
        console.log("  Peak Moments:");
        for (const p of peaks) {
          console.log(`    ${p.time_seconds}s  →  ${p.score}`);
        }
        console.log();
      }

      const weak = data.weak_spots as
        | { time_seconds: number; score: number }[]
        | undefined;
      if (weak && weak.length > 0) {
        console.log("  Weak Spots:");
        for (const w of weak) {
          console.log(`    ${w.time_seconds}s  →  ${w.score}`);
        }
        console.log();
      }
    } catch (err) {
      printError((err as Error).message);
    }
  });

/**
 * `recoup predictions` — manage engagement prediction history.
 *
 * Subcommands:
 *   list  — List past predictions with scores
 *   get   — Get full prediction detail by ID
 */
export const predictionsCommand = new Command("predictions")
  .description("Manage engagement prediction history")
  .addCommand(listCommand)
  .addCommand(getCommand);
