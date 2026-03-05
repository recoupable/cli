import { Command } from "commander";
import { get, post } from "../client.js";
import { printError, printJson } from "../output.js";

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
      printError((err as Error).message);
    }
  });

const validateCommand = new Command("validate")
  .description("Validate whether an artist is ready for content creation")
  .requiredOption("--artist <slug>", "Artist slug")
  .option("--json", "Output as JSON")
  .action(async opts => {
    try {
      const data = await get("/api/content/validate", {
        artist_slug: opts.artist,
      });

      if (opts.json) {
        printJson(data);
        return;
      }

      console.log(`Artist: ${data.artist_slug}`);
      console.log(`Ready: ${data.ready ? "yes" : "no"}`);
      if (Array.isArray(data.missing) && data.missing.length > 0) {
        console.log("Missing:");
        for (const item of data.missing as Array<Record<string, unknown>>) {
          console.log(`- ${item.file}`);
        }
      }
    } catch (err) {
      printError((err as Error).message);
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
      const data = await get("/api/content/estimate", {
        lipsync: opts.lipsync ? "true" : "false",
        batch: String(opts.batch || "1"),
        compare: opts.compare ? "true" : "false",
      });

      if (opts.json) {
        printJson(data);
        return;
      }

      console.log(`Per video: $${data.per_video_estimate_usd}`);
      console.log(`Total: $${data.total_estimate_usd}`);
    } catch (err) {
      printError((err as Error).message);
    }
  });

const createCommand = new Command("create")
  .description("Trigger content creation pipeline")
  .requiredOption("--artist <slug>", "Artist slug")
  .option("--template <name>", "Template name", "artist-caption-bedroom")
  .option("--lipsync", "Enable lipsync mode")
  .option("--caption-length <length>", "Caption length: short, medium, long", "short")
  .option("--upscale", "Upscale image and video for higher quality")
  .option("--batch <count>", "Generate multiple videos in parallel", "1")
  .option("--json", "Output as JSON")
  .action(async opts => {
    try {
      const data = await post("/api/content/create", {
        artist_slug: opts.artist,
        template: opts.template,
        lipsync: !!opts.lipsync,
        caption_length: opts.captionLength,
        upscale: !!opts.upscale,
        batch: parseInt(opts.batch, 10),
      });

      if (opts.json) {
        printJson(data);
        return;
      }

      const runIds = data.runIds as string[];
      if (runIds.length === 1) {
        console.log(`Run started: ${runIds[0]}`);
      } else {
        console.log(`Batch started: ${runIds.length} videos`);
        for (const id of runIds) {
          console.log(`  - ${id}`);
        }
      }
      console.log("Use `recoup content status --run <runId>` to poll status.");
    } catch (err) {
      printError((err as Error).message);
    }
  });

const statusCommand = new Command("status")
  .description("Poll content creation run status")
  .requiredOption("--run <runId>", "Trigger.dev run ID")
  .option("--json", "Output as JSON")
  .action(async opts => {
    try {
      const data = await get("/api/tasks/runs", { runId: opts.run });
      if (opts.json) {
        printJson(data);
        return;
      }

      const runs = Array.isArray(data.runs) ? data.runs : [];
      const run = runs[0] as Record<string, unknown> | undefined;
      if (!run) {
        console.log("Run not found.");
        return;
      }

      console.log(`Run: ${run.id}`);
      console.log(`Status: ${run.status}`);

      const output = run.output as Record<string, unknown> | undefined;
      const video = (output?.video || null) as Record<string, unknown> | null;
      if (video?.signedUrl) {
        console.log(`Video URL: ${video.signedUrl}`);
      }
    } catch (err) {
      printError((err as Error).message);
    }
  });

contentCommand.addCommand(templatesCommand);
contentCommand.addCommand(validateCommand);
contentCommand.addCommand(estimateCommand);
contentCommand.addCommand(createCommand);
contentCommand.addCommand(statusCommand);

