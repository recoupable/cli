import { Command } from "commander";
import { get, patch } from "../client.js";
import { printJson } from "../output.js";
import { runAction, emit } from "../runAction.js";

const listCommand = new Command("list")
  .description("List pulses (automated daily briefings)")
  .option("--account <id>", "Filter by account ID (org keys only)")
  .option("--active <bool>", "Filter by active status (true/false)")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const params: Record<string, string> = {};
      if (opts.account) params.account_id = opts.account;
      if (opts.active) params.active = opts.active;
      const data = await get("/api/pulses", params);
      const pulses = (data.pulses as Record<string, unknown>[]) || [];
      emit(opts, pulses, () => printJson(pulses));
    }),
  );

const setCommand = new Command("set")
  .description("Enable or disable pulses for an account")
  .requiredOption("--active <bool>", "Active state (true/false)")
  .option("--account <id>", "Account ID override (org keys only)")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const body: Record<string, unknown> = { active: opts.active === "true" };
      if (opts.account) body.account_id = opts.account;
      const data = await patch("/api/pulses", body);
      emit(opts, data.pulses ?? data, () =>
        console.log(`Pulses set to active=${opts.active === "true"}`),
      );
    }),
  );

export const pulsesCommand = new Command("pulses")
  .description("Manage pulses (automated daily artist briefings)")
  .addCommand(listCommand)
  .addCommand(setCommand)
  .addHelpText(
    "after",
    `
Examples:
  recoup pulses list
  recoup pulses set --active true
  recoup pulses set --active false --account <id>
`,
  );
