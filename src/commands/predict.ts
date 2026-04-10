import { Command } from "commander";
import { post } from "../client.js";
import { printJson, printError } from "../output.js";

/**
 * `recoup predict` — run a neural engagement prediction on content.
 *
 * Sends the file URL and modality to POST /api/predictions, then
 * displays the engagement score, peak moments, and weak spots.
 */
export const predictCommand = new Command("predict")
  .description("Run a neural engagement prediction on video, audio, or text content")
  .requiredOption("--url <fileUrl>", "Public URL to the content file")
  .requiredOption(
    "--modality <modality>",
    "Content type: video, audio, or text",
  )
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    try {
      const data = await post("/api/predictions", {
        file_url: opts.url,
        modality: opts.modality,
      });

      if (opts.json) {
        printJson(data);
        return;
      }

      console.log();
      console.log(`  Engagement Score: ${data.engagement_score}`);
      console.log(`  Modality:         ${data.modality}`);
      console.log(
        `  Duration:         ${data.total_duration_seconds}s`,
      );
      console.log(`  Inference Time:   ${data.elapsed_seconds}s`);
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

      console.log(`  ID: ${data.id}`);
      console.log();
    } catch (err) {
      printError((err as Error).message);
    }
  });
