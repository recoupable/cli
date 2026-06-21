import { Command } from "commander";
import { get, post, del } from "../client.js";
import { printJson, printTable } from "../output.js";
import { runAction, emit } from "../runAction.js";
import { parseJsonFlag, valueOrStdin } from "../stdin.js";

const listCommand = new Command("list")
  .description("List available connectors and their connection status")
  .option("--account <id>", "Account ID override (org keys only)")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const params: Record<string, string> = {};
      if (opts.account) params.account_id = opts.account;
      const data = await get("/api/connectors", params);
      const connectors = (data.connectors as Record<string, unknown>[]) || [];
      emit(opts, connectors, () =>
        printTable(connectors, [
          { key: "slug", label: "SLUG" },
          { key: "connected", label: "CONNECTED" },
        ]),
      );
    }),
  );

const connectCommand = new Command("connect")
  .description("Start an OAuth connection flow for a connector")
  .requiredOption("--connector <slug>", "Connector slug (e.g. googlesheets, tiktok)")
  .option("--callback-url <url>", "Redirect URL after authorization")
  .option("--account <id>", "Account ID override (org keys only)")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const body: Record<string, unknown> = { connector: opts.connector };
      if (opts.callbackUrl) body.callback_url = opts.callbackUrl;
      if (opts.account) body.account_id = opts.account;
      const data = await post("/api/connectors", body);
      const result = (data.data as Record<string, unknown>) || {};
      emit(opts, data, () =>
        console.log(`Authorize at: ${result.redirectUrl}`),
      );
    }),
  );

const disconnectCommand = new Command("disconnect")
  .description("Disconnect a connected account")
  .requiredOption("--id <id>", "Connected account ID")
  .option("--account <id>", "Account ID override (org keys only)")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const body: Record<string, unknown> = { connected_account_id: opts.id };
      if (opts.account) body.account_id = opts.account;
      const data = await del("/api/connectors", body);
      emit(opts, data, () => console.log(data.message || "Connector disconnected."));
    }),
  );

const actionsCommand = new Command("actions")
  .description("List available connector actions (tools)")
  .option("--account <id>", "Account ID override (org keys only)")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const params: Record<string, string> = {};
      if (opts.account) params.account_id = opts.account;
      const data = await get("/api/connectors/actions", params);
      const actions = (data.actions as Record<string, unknown>[]) || [];
      emit(opts, actions, () =>
        printTable(actions, [
          { key: "slug", label: "SLUG" },
          { key: "connectorSlug", label: "CONNECTOR" },
          { key: "isConnected", label: "CONNECTED" },
        ]),
      );
    }),
  );

const runCommand = new Command("run")
  .description("Execute a connector action")
  .requiredOption("--action <slug>", "Action slug (e.g. GMAIL_FETCH_EMAILS)")
  .option(
    "--params <json>",
    "Action parameters as JSON (or pipe via stdin)",
  )
  .option("--account <id>", "Account ID override (org keys only)")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const raw = await valueOrStdin(opts.params);
      const parameters = raw ? parseJsonFlag(raw, "--params") : {};
      const body: Record<string, unknown> = {
        actionSlug: opts.action,
        parameters,
      };
      if (opts.account) body.account_id = opts.account;
      const data = await post("/api/connectors/actions", body);
      emit(opts, data, () => printJson(data.result ?? data));
    }),
  );

const uploadCommand = new Command("upload")
  .description("Upload a public image URL for use by a connector tool")
  .requiredOption("--url <url>", "Public image URL")
  .requiredOption("--tool <slug>", "Tool slug (e.g. LINKEDIN_CREATE_LINKED_IN_POST)")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const data = await post("/api/connectors/files", {
        url: opts.url,
        toolSlug: opts.tool,
      });
      emit(opts, data, () => console.log(`Uploaded: ${data.s3key}`));
    }),
  );

export const connectorsCommand = new Command("connectors")
  .description("Connect third-party integrations and run their actions")
  .addCommand(listCommand)
  .addCommand(connectCommand)
  .addCommand(disconnectCommand)
  .addCommand(actionsCommand)
  .addCommand(runCommand)
  .addCommand(uploadCommand)
  .addHelpText(
    "after",
    `
Examples:
  recoup connectors list
  recoup connectors connect --connector googlesheets
  recoup connectors actions --json
  recoup connectors run --action GMAIL_FETCH_EMAILS --params '{"max_results":10}'
  echo '{"max_results":10}' | recoup connectors run --action GMAIL_FETCH_EMAILS
`,
  );
