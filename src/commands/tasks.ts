import { Command } from "commander";
import { get, post, patch, del } from "../client.js";
import { printTable } from "../output.js";
import { runAction, emit } from "../runAction.js";
import { statusCommand } from "./tasks/statusCommand.js";

const listCommand = new Command("list")
  .description("List scheduled tasks")
  .option("--account <id>", "Filter by account ID")
  .option("--artist <id>", "Filter by artist account ID")
  .option("--enabled <bool>", "Filter by enabled status (true/false)")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const params: Record<string, string> = {};
      if (opts.account) params.account_id = opts.account;
      if (opts.artist) params.artist_account_id = opts.artist;
      if (opts.enabled) params.enabled = opts.enabled;
      const data = await get("/api/tasks", params);
      const tasks = (data.tasks as Record<string, unknown>[]) || [];
      emit(opts, tasks, () =>
        printTable(tasks, [
          { key: "id", label: "ID" },
          { key: "title", label: "TITLE" },
          { key: "schedule", label: "SCHEDULE" },
          { key: "enabled", label: "ENABLED" },
        ]),
      );
    }),
  );

const createCommand = new Command("create")
  .description("Create a scheduled task")
  .requiredOption("--title <title>", "Task title")
  .requiredOption("--prompt <text>", "Task prompt / instruction")
  .requiredOption("--schedule <cron>", "Cron expression (e.g. '0 9 * * *')")
  .requiredOption("--artist <id>", "Artist account ID")
  .option("--model <id>", "Model ID")
  .option("--account <id>", "Account ID override (org keys only)")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const body: Record<string, unknown> = {
        title: opts.title,
        prompt: opts.prompt,
        schedule: opts.schedule,
        artist_account_id: opts.artist,
      };
      if (opts.model) body.model = opts.model;
      if (opts.account) body.account_id = opts.account;
      const data = await post("/api/tasks", body);
      const tasks = (data.tasks as Record<string, unknown>[]) || [];
      emit(opts, tasks, () =>
        console.log(`Created task: ${tasks[0]?.id ?? "(unknown)"}`),
      );
    }),
  );

const updateCommand = new Command("update")
  .description("Update a scheduled task")
  .requiredOption("--id <id>", "Task ID")
  .option("--title <title>", "Task title")
  .option("--prompt <text>", "Task prompt")
  .option("--schedule <cron>", "Cron expression")
  .option("--artist <id>", "Artist account ID")
  .option("--model <id>", "Model ID")
  .option("--enabled <bool>", "Enable/disable (true/false)")
  .option("--account <id>", "Account ID override (org keys only)")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const body: Record<string, unknown> = { id: opts.id };
      if (opts.title !== undefined) body.title = opts.title;
      if (opts.prompt !== undefined) body.prompt = opts.prompt;
      if (opts.schedule !== undefined) body.schedule = opts.schedule;
      if (opts.artist !== undefined) body.artist_account_id = opts.artist;
      if (opts.model !== undefined) body.model = opts.model;
      if (opts.enabled !== undefined) body.enabled = opts.enabled === "true";
      if (opts.account) body.account_id = opts.account;
      const data = await patch("/api/tasks", body);
      emit(opts, data.tasks ?? data, () => console.log(`Updated task: ${opts.id}`));
    }),
  );

const deleteCommand = new Command("delete")
  .description("Delete a scheduled task")
  .requiredOption("--id <id>", "Task ID")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const data = await del("/api/tasks", { id: opts.id });
      emit(opts, data, () => console.log(`Deleted task: ${opts.id}`));
    }),
  );

const runsCommand = new Command("runs")
  .description("List recent task runs")
  .option("--limit <n>", "Number of runs (1-100, default 20)")
  .option("--account <id>", "Filter by account ID")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const params: Record<string, string> = {};
      if (opts.limit) params.limit = String(opts.limit);
      if (opts.account) params.account_id = opts.account;
      const data = await get("/api/tasks/runs", params);
      const runs = (data.runs as Record<string, unknown>[]) || [];
      emit(opts, runs, () =>
        printTable(runs, [
          { key: "id", label: "RUN ID" },
          { key: "status", label: "STATUS" },
          { key: "createdAt", label: "CREATED" },
        ]),
      );
    }),
  );

export const tasksCommand = new Command("tasks")
  .description("Create, schedule, and monitor background tasks")
  .addCommand(listCommand)
  .addCommand(createCommand)
  .addCommand(updateCommand)
  .addCommand(deleteCommand)
  .addCommand(runsCommand)
  .addCommand(statusCommand)
  .addHelpText(
    "after",
    `
Examples:
  recoup tasks list
  recoup tasks create --title "Daily report" --prompt "Summarize streams" \\
    --schedule "0 9 * * *" --artist <id>
  recoup tasks status --run <runId>
  recoup tasks runs --limit 10
`,
  );
