import { Command } from "commander";
import { post } from "../client.js";
import { printJson } from "../output.js";
import { runAction } from "../runAction.js";
import { valueOrStdin } from "../stdin.js";

export const generateCommand = new Command("generate")
  .description(
    "Run the Recoup AI agent and return the final text (non-streaming). " +
      "Reads the prompt from --prompt or piped stdin.",
  )
  .option("--prompt <text>", "Prompt for the agent (or pipe via stdin)")
  .option("--artist <id>", "Artist account ID for context")
  .option("--room <id>", "Existing chat/room ID to continue")
  .option("--topic <text>", "Topic for a newly created room")
  .option("--model <id>", "Model ID (see 'recoup models list')")
  .option(
    "--exclude-tools <list>",
    "Comma-separated tool names to disable",
    (val: string) => val.split(",").map((s) => s.trim()),
  )
  .option("--account <id>", "Account ID override (org keys only)")
  .option("--json", "Output full response as JSON")
  .action(
    runAction(async (opts) => {
      const prompt = await valueOrStdin(opts.prompt);
      if (!prompt) {
        throw new Error(
          "No prompt provided. Use --prompt <text> or pipe it via stdin:\n" +
            '  recoup generate --prompt "Summarize this artist"\n' +
            '  echo "Summarize this artist" | recoup generate',
        );
      }

      const body: Record<string, unknown> = { prompt };
      if (opts.room) body.roomId = opts.room;
      if (opts.topic) body.topic = opts.topic;
      if (opts.artist) body.artistId = opts.artist;
      if (opts.model) body.model = opts.model;
      if (opts.excludeTools) body.excludeTools = opts.excludeTools;
      if (opts.account) body.accountId = opts.account;

      const data = await post("/api/chat/generate", body);

      if (opts.json) {
        printJson(data);
      } else {
        console.log(data.text ?? "");
      }
    }),
  )
  .addHelpText(
    "after",
    `
Examples:
  recoup generate --prompt "What are this artist's top markets?" --artist <id>
  echo "Draft a release announcement" | recoup generate --json
  recoup generate --prompt "Continue" --room <chatId>
`,
  );
