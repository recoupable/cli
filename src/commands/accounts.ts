import { Command } from "commander";
import { post } from "../client.js";
import { printJson, printError } from "../output.js";

const createCommand = new Command("create")
  .description("Create a new account or retrieve an existing one by email or wallet")
  .option("--email <email>", "Email address for the account")
  .option("--wallet <wallet>", "Wallet address for the account")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    if (!opts.email && !opts.wallet) {
      printError("at least one of --email or --wallet is required");
      return;
    }

    try {
      const body: Record<string, unknown> = {};
      if (opts.email) body.email = opts.email;
      if (opts.wallet) body.wallet = opts.wallet;

      const data = await post("/api/accounts", body);

      if (opts.json) {
        printJson(data);
      } else {
        const account = data.data as Record<string, unknown> | undefined;
        if (!account || !account.account_id) {
          printError("Account ID not found in API response");
          return;
        }
        console.log(account.account_id);
      }
    } catch (err) {
      printError((err as Error).message);
    }
  });

const upgradeCommand = new Command("upgrade")
  .description("Upgrade your account to Pro")
  .action(() => {
    console.log("To upgrade to Pro, visit: https://chat.recoupable.com/settings");
  });

export const accountsCommand = new Command("accounts")
  .description("Manage your account")
  .addCommand(createCommand)
  .addCommand(upgradeCommand);
