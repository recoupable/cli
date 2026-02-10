import { Command } from "commander";
import { get, post } from "../client.js";
import { printJson, printTable, printError } from "../output.js";

const listCommand = new Command("list")
  .description("List sandboxes for the current account")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    try {
      const data = await get("/api/sandboxes");
      const sandboxes = (data.sandboxes as Record<string, unknown>[]) || [];

      if (opts.json) {
        printJson(sandboxes);
      } else {
        printTable(sandboxes, [
          { key: "sandboxId", label: "ID" },
          { key: "sandboxStatus", label: "STATUS" },
          { key: "createdAt", label: "CREATED" },
        ]);
      }
    } catch (err) {
      printError((err as Error).message);
    }
  });

const createCommand = new Command("create")
  .description("Create a new sandbox")
  .option("--command <cmd>", "Command to run in sandbox")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    try {
      const body: Record<string, unknown> = {};
      if (opts.command) body.command = opts.command;

      const data = await post("/api/sandboxes", body);
      const sandboxes = (data.sandboxes as Record<string, unknown>[]) || [];

      if (opts.json) {
        printJson(sandboxes);
      } else {
        for (const sb of sandboxes) {
          console.log(`Created sandbox: ${sb.sandboxId}`);
        }
      }
    } catch (err) {
      printError((err as Error).message);
    }
  });

export const sandboxesCommand = new Command("sandboxes")
  .description("Manage sandboxes")
  .addCommand(listCommand)
  .addCommand(createCommand);
