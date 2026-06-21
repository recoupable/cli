import { Command } from "commander";
import { get, patch } from "../client.js";
import { printJson } from "../output.js";
import { runAction, emit } from "../runAction.js";

async function resolveAccountId(override?: string): Promise<string> {
  if (override) return override;
  const data = await get("/api/accounts/id");
  return data.accountId as string;
}

const getCommand = new Command("get")
  .description("Show account details (defaults to the authenticated account)")
  .option("--account <id>", "Account ID (defaults to your own)")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const id = await resolveAccountId(opts.account);
      const data = await get(`/api/accounts/${id}`);
      const account = (data.account as Record<string, unknown>) || data;
      emit(opts, account, () => {
        console.log(`ID:           ${account.account_id ?? account.id ?? id}`);
        console.log(`Name:         ${account.name ?? ""}`);
        console.log(`Email:        ${account.email ?? ""}`);
        console.log(`Organization: ${account.organization ?? ""}`);
      });
    }),
  );

const creditsCommand = new Command("credits")
  .description("Show remaining, used, and total credits for an account")
  .option("--account <id>", "Account ID (defaults to your own)")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const id = await resolveAccountId(opts.account);
      const data = await get(`/api/accounts/${id}/credits`);
      emit(opts, data, () => {
        console.log(`Remaining: ${data.remaining_credits}`);
        console.log(`Used:      ${data.used_credits}`);
        console.log(`Total:     ${data.total_credits}`);
        console.log(`Pro:       ${data.is_pro}`);
      });
    }),
  );

const subscriptionCommand = new Command("subscription")
  .description("Show subscription/pro status for an account")
  .option("--account <id>", "Account ID (defaults to your own)")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const id = await resolveAccountId(opts.account);
      const data = await get(`/api/accounts/${id}/subscription`);
      emit(opts, data, () => {
        console.log(`Pro:    ${data.isPro}`);
        console.log(`Status: ${data.status}`);
        console.log(`Plan:   ${data.plan ?? ""}`);
        console.log(`Source: ${data.source ?? ""}`);
      });
    }),
  );

const updateCommand = new Command("update")
  .description("Update the authenticated account's profile")
  .option("--name <name>", "Display name")
  .option("--instruction <text>", "Custom AI instruction / system prompt")
  .option("--organization <name>", "Organization name")
  .option("--image <url>", "Profile image URL (empty string clears it)")
  .option("--job-title <title>", "Job title")
  .option("--role-type <role>", "Role type")
  .option("--company-name <name>", "Company name")
  .option("--account <id>", "Account ID override (org keys only)")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const body: Record<string, unknown> = {};
      if (opts.name !== undefined) body.name = opts.name;
      if (opts.instruction !== undefined) body.instruction = opts.instruction;
      if (opts.organization !== undefined) body.organization = opts.organization;
      if (opts.image !== undefined) body.image = opts.image;
      if (opts.jobTitle !== undefined) body.jobTitle = opts.jobTitle;
      if (opts.roleType !== undefined) body.roleType = opts.roleType;
      if (opts.companyName !== undefined) body.companyName = opts.companyName;
      if (opts.account) body.accountId = opts.account;

      if (Object.keys(body).filter((k) => k !== "accountId").length === 0) {
        throw new Error(
          "Provide at least one field to update, e.g. accounts update --name 'New Name'",
        );
      }

      const data = await patch("/api/accounts", body);
      emit(opts, data.data ?? data, () => console.log("Account updated."));
    }),
  );

const catalogsCommand = new Command("catalogs")
  .description("List catalogs owned by an account")
  .option("--account <id>", "Account ID (defaults to your own)")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const id = await resolveAccountId(opts.account);
      const data = await get(`/api/accounts/${id}/catalogs`);
      const catalogs = (data.catalogs as Record<string, unknown>[]) || [];
      emit(opts, catalogs, () => printJson(catalogs));
    }),
  );

export const accountsCommand = new Command("accounts")
  .description("View and update account details, credits, and subscription")
  .addCommand(getCommand)
  .addCommand(creditsCommand)
  .addCommand(subscriptionCommand)
  .addCommand(updateCommand)
  .addCommand(catalogsCommand)
  .addHelpText(
    "after",
    `
Examples:
  recoup accounts get
  recoup accounts credits --json
  recoup accounts subscription
  recoup accounts update --name "Jane Doe" --instruction "Always be concise"
`,
  );
