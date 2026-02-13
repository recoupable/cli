import { Command } from "commander";
import { get } from "../client.js";
import { printJson, printTable, printError } from "../output.js";

const listCommand = new Command("list")
  .description("List artists for the current account")
  .option("--json", "Output as JSON")
  .option("--org <orgId>", "Filter by organization ID")
  .option("--account <accountId>", "Filter by account ID")
  .action(async (opts) => {
    try {
      const params: Record<string, string> = {};
      if (opts.org) params.org_id = opts.org;
      if (opts.account) params.account_id = opts.account;
      const data = await get("/api/artists", params);
      const artists = (data.artists as Record<string, unknown>[]) || [];

      if (opts.json) {
        printJson(artists);
      } else {
        printTable(artists, [
          { key: "account_id", label: "ID" },
          { key: "name", label: "NAME" },
          { key: "label", label: "LABEL" },
        ]);
      }
    } catch (err) {
      printError((err as Error).message);
    }
  });

export const artistsCommand = new Command("artists")
  .description("Manage artists")
  .addCommand(listCommand);
