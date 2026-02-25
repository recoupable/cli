import { Command } from "commander";
import { post } from "../client.js";
import { printJson, printError } from "../output.js";

export const notificationsCommand = new Command("notifications")
  .description("Send an email to the account owner. The recipient is automatically resolved from your API key — no --to flag needed. Only --subject is required.")
  .requiredOption("--subject <text>", "Email subject line")
  .option("--text <body>", "Plain text or Markdown body")
  .option("--html <body>", "Raw HTML body (takes precedence over --text)")
  .option("--cc <email>", "CC recipient (repeatable)", (val: string, prev: string[]) => prev.concat(val), [] as string[])
  .option("--room-id <id>", "Room ID for chat link in footer")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    try {
      const body: Record<string, unknown> = {
        subject: opts.subject,
      };
      if (opts.text) body.text = opts.text;
      if (opts.html) body.html = opts.html;
      if (opts.cc && opts.cc.length > 0) body.cc = opts.cc;
      if (opts.roomId) body.room_id = opts.roomId;

      const data = await post("/api/notifications", body);

      if (opts.json) {
        printJson(data);
      } else {
        console.log(data.message || "Notification sent.");
      }
    } catch (err) {
      printError((err as Error).message);
    }
  });
