import { Command } from "commander";
import { get, post, del } from "../client.js";
import { printJson, printTable, printError } from "../output.js";

const listCommand = new Command("list")
  .description("List API keys for the current account")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    try {
      const data = await get("/api/keys");
      const keys = (data.keys as Record<string, unknown>[]) || [];

      if (opts.json) {
        printJson(keys);
      } else {
        printTable(keys, [
          { key: "id", label: "ID" },
          { key: "name", label: "NAME" },
          { key: "created_at", label: "CREATED" },
          { key: "last_used", label: "LAST USED" },
        ]);
      }
    } catch (err) {
      printError((err as Error).message);
    }
  });

const createCommand = new Command("create")
  .description("Create a new API key")
  .option("--name <name>", "Name for the API key")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    if (!opts.name) {
      printError("--name is required");
      return;
    }

    try {
      const data = await post("/api/keys", { key_name: opts.name });

      if (opts.json) {
        printJson(data);
      } else {
        if (!data.key) {
          printError("No key returned from API");
          return;
        }
        console.log(data.key);
      }
    } catch (err) {
      printError((err as Error).message);
    }
  });

const deleteCommand = new Command("delete")
  .description("Delete an API key by ID")
  .option("--id <id>", "ID of the API key to delete")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    if (!opts.id) {
      printError("--id is required");
      return;
    }

    try {
      const data = await del("/api/keys", { id: opts.id });

      if (opts.json) {
        printJson(data);
      } else {
        console.log(data.message ?? data.error ?? JSON.stringify(data));
      }
    } catch (err) {
      printError((err as Error).message);
    }
  });

export const keysCommand = new Command("keys")
  .description("Manage API keys")
  .addCommand(listCommand)
  .addCommand(createCommand)
  .addCommand(deleteCommand);
