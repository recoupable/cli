import { Command } from "commander";
import { get, post, patch } from "../client.js";
import { printJson } from "../output.js";
import { runAction, emit } from "../runAction.js";

const createCommand = new Command("create")
  .description("Create a coding/agent session (with an initial chat)")
  .option("--title <title>", "Session title")
  .option("--artist <id>", "Artist account ID")
  .option("--org <id>", "Organization ID")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const body: Record<string, unknown> = {};
      if (opts.title) body.title = opts.title;
      if (opts.artist) body.artistId = opts.artist;
      if (opts.org) body.organizationId = opts.org;
      const data = await post("/api/sessions", body);
      const session = (data.session as Record<string, unknown>) || {};
      emit(opts, data, () => console.log(`Created session: ${session.id}`));
    }),
  );

const getCommand = new Command("get")
  .description("Show a session")
  .argument("<id>", "Session ID")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (id, opts) => {
      const data = await get(`/api/sessions/${id}`);
      const session = (data.session as Record<string, unknown>) || data;
      emit(opts, session, () => printJson(session));
    }),
  );

const updateCommand = new Command("update")
  .description("Update a session")
  .argument("<id>", "Session ID")
  .option("--title <title>", "Session title")
  .option("--status <status>", "running | completed | failed | archived")
  .option("--lines-added <n>", "Lines added count")
  .option("--lines-removed <n>", "Lines removed count")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (id, opts) => {
      const body: Record<string, unknown> = {};
      if (opts.title !== undefined) body.title = opts.title;
      if (opts.status !== undefined) body.status = opts.status;
      if (opts.linesAdded !== undefined) body.linesAdded = Number(opts.linesAdded);
      if (opts.linesRemoved !== undefined)
        body.linesRemoved = Number(opts.linesRemoved);
      if (Object.keys(body).length === 0) {
        throw new Error("Provide at least one field to update");
      }
      const data = await patch(`/api/sessions/${id}`, body);
      emit(opts, data.session ?? data, () => console.log(`Updated session: ${id}`));
    }),
  );

export const sessionsCommand = new Command("sessions")
  .description("Manage agent/coding sessions")
  .addCommand(createCommand)
  .addCommand(getCommand)
  .addCommand(updateCommand)
  .addHelpText(
    "after",
    `
Examples:
  recoup sessions create --title "Build pipeline" --artist <id>
  recoup sessions get <id>
  recoup sessions update <id> --status completed
`,
  );
