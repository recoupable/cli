import { Command } from "commander";
import { get, post, patch, del } from "../client.js";
import { printJson, printTable } from "../output.js";
import { runAction, emit } from "../runAction.js";

const listCommand = new Command("list")
  .description("List chats for the current account")
  .option("--account <id>", "Account ID override (org keys only)")
  .option("--artist <id>", "Filter by artist account ID")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const params: Record<string, string> = {};
      if (opts.account) params.account_id = opts.account;
      if (opts.artist) params.artist_account_id = opts.artist;
      const data = await get("/api/chats", params);
      const chats = (data.chats as Record<string, unknown>[]) || [];
      emit(opts, chats, () =>
        printTable(chats, [
          { key: "id", label: "ID" },
          { key: "topic", label: "TOPIC" },
          { key: "updated_at", label: "UPDATED" },
        ]),
      );
    }),
  );

const createCommand = new Command("create")
  .description("Create a new chat")
  .option("--name <topic>", "Chat topic")
  .option("--artist <id>", "Artist account ID")
  .option("--message <text>", "First message")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const body: Record<string, unknown> = {};
      if (opts.name) body.topic = opts.name;
      if (opts.artist) body.artistId = opts.artist;
      if (opts.message) body.firstMessage = opts.message;
      const data = await post("/api/chats", body);
      const chat = (data.chat as Record<string, unknown>) || {};
      emit(opts, chat, () => console.log(`Created chat: ${chat.id}`));
    }),
  );

const updateCommand = new Command("update")
  .description("Rename a chat")
  .requiredOption("--chat <id>", "Chat ID")
  .requiredOption("--topic <text>", "New topic (3-50 chars)")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const data = await patch("/api/chats", {
        chatId: opts.chat,
        topic: opts.topic,
      });
      emit(opts, data.chat ?? data, () => console.log(`Renamed chat: ${opts.chat}`));
    }),
  );

const deleteCommand = new Command("delete")
  .description("Delete a chat")
  .requiredOption("--chat <id>", "Chat ID")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const data = await del("/api/chats", { id: opts.chat });
      emit(opts, data, () => console.log(`Deleted chat: ${opts.chat}`));
    }),
  );

const messagesCommand = new Command("messages")
  .description("List messages in a chat")
  .requiredOption("--chat <id>", "Chat ID")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const data = await get(`/api/chats/${opts.chat}/messages`);
      const messages = (data.data as Record<string, unknown>[]) || [];
      emit(opts, messages, () => printJson(messages));
    }),
  );

const artistCommand = new Command("artist")
  .description("Show the artist linked to a chat")
  .requiredOption("--chat <id>", "Chat ID")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const data = await get(`/api/chats/${opts.chat}/artist`);
      emit(opts, data, () => {
        console.log(`Room:   ${data.room_id}`);
        console.log(`Artist: ${data.artist_id} (exists: ${data.artist_exists})`);
      });
    }),
  );

const compactCommand = new Command("compact")
  .description("Compact (summarize) one or more chats to reduce context size")
  .requiredOption(
    "--chat <id>",
    "Chat ID (repeatable)",
    (val: string, prev: string[]) => prev.concat(val),
    [] as string[],
  )
  .option("--prompt <text>", "Custom compaction prompt")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const body: Record<string, unknown> = { chatId: opts.chat };
      if (opts.prompt) body.prompt = opts.prompt;
      const data = await post("/api/chats/compact", body);
      emit(opts, data, () => printJson(data.chats ?? data));
    }),
  );

export const chatsCommand = new Command("chats")
  .description("Manage chats, messages, and compaction")
  .addCommand(listCommand)
  .addCommand(createCommand)
  .addCommand(updateCommand)
  .addCommand(deleteCommand)
  .addCommand(messagesCommand)
  .addCommand(artistCommand)
  .addCommand(compactCommand)
  .addHelpText(
    "after",
    `
Examples:
  recoup chats list --artist <id>
  recoup chats create --name "Tour planning" --artist <id>
  recoup chats messages --chat <id> --json
  recoup chats compact --chat <id> --chat <id2>
`,
  );
