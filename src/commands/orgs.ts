import { Command } from "commander";
import { get } from "../client.js";
import { printJson, printTable, printError } from "../output.js";

const listCommand = new Command("list")
  .description("List organizations for the current account")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    try {
      const data = await get("/api/organizations");
      const orgs = (data.organizations as Record<string, unknown>[]) || [];

      if (opts.json) {
        printJson(orgs);
      } else {
        printTable(orgs, [
          { key: "organization_id", label: "ID" },
          { key: "organization_name", label: "NAME" },
        ]);
      }
    } catch (err) {
      printError((err as Error).message);
    }
  });

export const orgsCommand = new Command("orgs")
  .description("Manage organizations")
  .addCommand(listCommand);
