import { Command } from "commander";
import { post } from "../../client.js";
import { getErrorMessage } from "../../getErrorMessage.js";
import { printError, printJson } from "../../output.js";
import { parsePositiveInt } from "./parsePositiveInt.js";

const ALLOWED_CAPTION_LENGTHS = new Set(["short", "medium", "long"]);

export const createCommand = new Command("create")
  .description("Trigger content creation pipeline")
  .requiredOption("--artist <id>", "Artist account ID")
  .option("--template <name>", "Template name", "artist-caption-bedroom")
  .option("--lipsync", "Enable lipsync mode")
  .option("--caption-length <length>", "Caption length: short, medium, long", "short")
  .option("--upscale", "Upscale image and video for higher quality")
  .option("--batch <count>", "Generate multiple videos in parallel", "1")
  .option("--songs <slugs>", "Comma-separated song slugs to pick from (e.g. hiccups,adhd)")
  .option("--json", "Output as JSON")
  .action(async opts => {
    try {
      const batch = parsePositiveInt(String(opts.batch ?? "1"), "--batch");
      if (!ALLOWED_CAPTION_LENGTHS.has(opts.captionLength)) {
        throw new Error("--caption-length must be one of: short, medium, long");
      }

      const songs: string[] | undefined = opts.songs
        ? (opts.songs as string).split(",").map((s: string) => s.trim()).filter(Boolean)
        : undefined;

      const data = await post("/api/content/create", {
        artist_account_id: opts.artist,
        template: opts.template,
        lipsync: !!opts.lipsync,
        caption_length: opts.captionLength,
        upscale: !!opts.upscale,
        batch,
        ...(songs && { songs }),
      });

      if (opts.json) {
        printJson(data);
        return;
      }

      const runIds = Array.isArray(data.runIds)
        ? data.runIds.filter((id): id is string => typeof id === "string")
        : [];
      if (runIds.length === 0) {
        throw new Error("Response did not include any run IDs");
      }

      if (runIds.length === 1) {
        console.log(`Run started: ${runIds[0]}`);
      } else {
        console.log(`Batch started: ${runIds.length} videos`);
        for (const id of runIds) {
          console.log(`  - ${id}`);
        }
      }
      console.log("Use `recoup tasks status --run <runId>` to check progress.");
    } catch (err) {
      printError(getErrorMessage(err));
    }
  });
