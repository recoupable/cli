import { Command } from "commander";
import { get } from "../client.js";
import { printError, printJson } from "../output.js";

export const tasksCommand = new Command("tasks")
  .description("Check the status of background task runs");

const statusCommand = new Command("status")
  .description("Check the status of a task run")
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

tasksCommand.addCommand(statusCommand);
