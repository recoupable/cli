import { Command } from "commander";
import { post } from "../client.js";
import { runAction, emit } from "../runAction.js";

const createCommand = new Command("create")
  .description("Create a workspace")
  .option("--name <name>", "Workspace name (default 'Untitled')")
  .option("--account <id>", "Account ID override (org keys only)")
  .option("--org <id>", "Organization ID")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const body: Record<string, unknown> = {};
      if (opts.name) body.name = opts.name;
      if (opts.account) body.account_id = opts.account;
      if (opts.org) body.organization_id = opts.org;
      const data = await post("/api/workspaces", body);
      const workspace = (data.workspace as Record<string, unknown>) || {};
      emit(opts, workspace, () =>
        console.log(`Created workspace: ${workspace.id}`),
      );
    }),
  );

export const workspacesCommand = new Command("workspaces")
  .description("Manage workspaces")
  .addCommand(createCommand)
  .addHelpText(
    "after",
    `
Examples:
  recoup workspaces create --name "Q1 Campaign"
`,
  );
