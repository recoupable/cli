import { Command } from "commander";
import { get, post } from "../client.js";
import { getErrorMessage } from "../getErrorMessage.js";
import { printError, printJson } from "../output.js";

const ALLOWED_CAPTION_LENGTHS = new Set(["short", "medium", "long"]);

const parsePositiveInt = (value: string, flag: string): number => {
  const parsed = parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${flag} must be a positive integer`);
  }
  return parsed;
};

export const contentCommand = new Command("content")
  .description("Content-creation pipeline commands");

const templatesCommand = new Command("templates")
  .description("List available content templates")
  .option("--json", "Output as JSON")
  .action(async opts => {
    try {
      const data = await get("/api/content/templates");
      if (opts.json) {
        printJson(data);
        return;
      }

      const templates = Array.isArray(data.templates) ? data.templates : [];
      if (templates.length === 0) {
        console.log("No templates available.");
        return;
      }

      for (const template of templates as Array<Record<string, unknown>>) {
        console.log(`- ${template.name}: ${template.description}`);
      }
    } catch (err) {
      printError(getErrorMessage(err));
    }
  });

const validateCommand = new Command("validate")
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

const estimateCommand = new Command("estimate")
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

const createCommand = new Command("create")
  .description("Trigger content creation pipeline")
  .requiredOption("--artist <id>", "Artist account ID")
  .option("--template <name>", "Template name", "artist-caption-bedroom")
  .option("--lipsync", "Enable lipsync mode")
  .option("--caption-length <length>", "Caption length: short, medium, long", "short")
  .option("--upscale", "Upscale image and video for higher quality")
  .option("--batch <count>", "Generate multiple videos in parallel", "1")
  .option("--json", "Output as JSON")
  .action(async opts => {
    try {
      const batch = parsePositiveInt(String(opts.batch ?? "1"), "--batch");
      if (!ALLOWED_CAPTION_LENGTHS.has(opts.captionLength)) {
        throw new Error("--caption-length must be one of: short, medium, long");
      }

      const data = await post("/api/content/create", {
        artist_account_id: opts.artist,
        template: opts.template,
        lipsync: !!opts.lipsync,
        caption_length: opts.captionLength,
        upscale: !!opts.upscale,
        batch,
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

contentCommand.addCommand(templatesCommand);
contentCommand.addCommand(validateCommand);
contentCommand.addCommand(estimateCommand);
contentCommand.addCommand(createCommand);
