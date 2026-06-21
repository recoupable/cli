import { Command } from "commander";
import { get, post } from "../client.js";
import { printTable } from "../output.js";
import { runAction, emit } from "../runAction.js";

const listCommand = new Command("list")
  .description("List organizations for the current account")
  .option("--json", "Output as JSON")
  .option("--account <accountId>", "Filter by account ID")
  .action(
    runAction(async (opts) => {
      const params: Record<string, string> = {};
      if (opts.account) params.account_id = opts.account;
      const data = await get("/api/organizations", params);
      const orgs = (data.organizations as Record<string, unknown>[]) || [];
      emit(opts, orgs, () =>
        printTable(orgs, [
          { key: "organization_id", label: "ID" },
          { key: "organization_name", label: "NAME" },
        ]),
      );
    }),
  );

const createCommand = new Command("create")
  .description("Create an organization")
  .requiredOption("--name <name>", "Organization name")
  .requiredOption("--account <accountId>", "Owner account ID")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const data = await post("/api/organizations", {
        name: opts.name,
        accountId: opts.account,
      });
      const org = (data.organization as Record<string, unknown>) || {};
      emit(opts, org, () => console.log(`Created organization: ${org.id}`));
    }),
  );

const addArtistCommand = new Command("add-artist")
  .description("Add an artist to an organization")
  .requiredOption("--artist <id>", "Artist account ID")
  .requiredOption("--org <id>", "Organization ID")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const data = await post("/api/organizations/artists", {
        artistId: opts.artist,
        organizationId: opts.org,
      });
      emit(opts, data, () =>
        console.log(`Added artist ${opts.artist} to org ${opts.org}`),
      );
    }),
  );

export const orgsCommand = new Command("orgs")
  .description("Manage organizations and their artists")
  .addCommand(listCommand)
  .addCommand(createCommand)
  .addCommand(addArtistCommand)
  .addHelpText(
    "after",
    `
Examples:
  recoup orgs list
  recoup orgs create --name "My Label" --account <accountId>
  recoup orgs add-artist --artist <id> --org <orgId>
`,
  );
