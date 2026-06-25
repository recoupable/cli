import { Command } from "commander";
import { post } from "../client.js";
import { printJson, printError } from "../output.js";

export const emailsCommand = new Command("emails")
  .description("Send an email to the account owner. The recipient is automatically resolved from your API key — no --to flag needed. --subject is optional (defaults from the body).")
  .option("--subject <text>", "Email subject line (optional; defaults from the body)")
  .option("--text <body>", "Plain text or Markdown body")
  .option("--html <body>", "Raw HTML body (takes precedence over --text)")
  .option("--cc <email>", "CC recipient (repeatable)", (val: string, prev: string[]) => prev.concat(val), [] as string[])
  .option("--chat-id <id>", "Chat ID for chat link in footer")
  .option("--account <accountId>", "Send to a specific account (org keys only)")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    try {
      const body: Record<string, unknown> = {};
      if (opts.subject) body.subject = opts.subject;
      if (opts.text) body.text = opts.text;
      if (opts.html) body.html = opts.html;
      if (opts.cc && opts.cc.length > 0) body.cc = opts.cc;
      if (opts.chatId) body.chat_id = opts.chatId;
      if (opts.account) body.account_id = opts.account;

      const data = await post("/api/emails", body);

      if (opts.json) {
        printJson(data);
      } else {
        console.log(data.message || "Email sent.");
      }
    } catch (err) {
      printError((err as Error).message);
    }
  });
