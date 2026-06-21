import { Command } from "commander";
import { get, post } from "../client.js";
import { printJson, printTable } from "../output.js";
import { runAction, emit } from "../runAction.js";
import { parseJsonFlag, valueOrStdin } from "../stdin.js";

const listCommand = new Command("list")
  .description("List sandboxes for the current account")
  .option("--sandbox <id>", "Filter by sandbox ID")
  .option("--account <id>", "Filter by account ID (org keys only)")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const params: Record<string, string> = {};
      if (opts.sandbox) params.sandbox_id = opts.sandbox;
      if (opts.account) params.account_id = opts.account;
      const data = await get("/api/sandboxes", params);
      const sandboxes = (data.sandboxes as Record<string, unknown>[]) || [];
      emit(opts, sandboxes, () =>
        printTable(sandboxes, [
          { key: "sandboxId", label: "ID" },
          { key: "sandboxStatus", label: "STATUS" },
          { key: "createdAt", label: "CREATED" },
        ]),
      );
    }),
  );

const createCommand = new Command("create")
  .description("Create a new sandbox")
  .option("--command <cmd>", "Command to run in the sandbox")
  .option("--arg <value>", "Command argument (repeatable)", (v: string, prev: string[]) => prev.concat(v), [] as string[])
  .option("--cwd <dir>", "Working directory")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const body: Record<string, unknown> = {};
      if (opts.command) body.command = opts.command;
      if (opts.arg && opts.arg.length > 0) body.args = opts.arg;
      if (opts.cwd) body.cwd = opts.cwd;
      const data = await post("/api/sandboxes", body);
      const sandboxes = (data.sandboxes as Record<string, unknown>[]) || [];
      emit(opts, sandboxes, () => {
        for (const sb of sandboxes) console.log(`Created sandbox: ${sb.sandboxId}`);
      });
    }),
  );

const fileCommand = new Command("file")
  .description("Read a file from the sandbox repository")
  .requiredOption("--path <path>", "File path in the repository")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const data = await get("/api/sandboxes/file", { path: opts.path });
      if (opts.json) {
        printJson(data);
      } else if (data.encoding === "base64") {
        process.stdout.write(
          Buffer.from(String(data.content), "base64").toString("utf-8"),
        );
      } else {
        process.stdout.write(String(data.content ?? ""));
      }
    }),
  );

const uploadCommand = new Command("upload")
  .description("Upload files (by URL) into the sandbox repository")
  .option(
    "--files <json>",
    'JSON array of {url,name}, e.g. \'[{"url":"https://...","name":"a.png"}]\' (or stdin)',
  )
  .option("--path <dir>", "Target directory (default repo root)")
  .option("--message <msg>", "Commit message")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const raw = await valueOrStdin(opts.files);
      if (!raw) throw new Error("Provide --files <json> or pipe it via stdin");
      const body: Record<string, unknown> = {
        files: parseJsonFlag(raw, "--files"),
      };
      if (opts.path) body.path = opts.path;
      if (opts.message) body.message = opts.message;
      const data = await post("/api/sandboxes/files", body);
      emit(opts, data, () => printJson(data.uploaded ?? data));
    }),
  );

const setupCommand = new Command("setup")
  .description("Run sandbox setup for an account")
  .option("--account <id>", "Account ID override (org keys only)")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const body: Record<string, unknown> = {};
      if (opts.account) body.account_id = opts.account;
      const data = await post("/api/sandboxes/setup", body);
      emit(opts, data, () => console.log(`Setup triggered: ${data.runId}`));
    }),
  );

export const sandboxesCommand = new Command("sandboxes")
  .description("Manage sandboxes and their files")
  .addCommand(listCommand)
  .addCommand(createCommand)
  .addCommand(fileCommand)
  .addCommand(uploadCommand)
  .addCommand(setupCommand)
  .addHelpText(
    "after",
    `
Examples:
  recoup sandboxes list
  recoup sandboxes create --command "pnpm build"
  recoup sandboxes file --path README.md
  recoup sandboxes upload --files '[{"url":"https://x/a.png","name":"a.png"}]'
`,
  );
