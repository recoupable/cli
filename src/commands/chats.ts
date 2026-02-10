import { Command } from "commander";
import { get, post } from "../client.js";
import { printJson, printTable, printError } from "../output.js";

const listCommand = new Command("list")
  .description("List chats for the current account")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    try {
      const data = await get("/api/chats");
      const chats = (data.chats as Record<string, unknown>[]) || [];

      if (opts.json) {
        printJson(chats);
      } else {
        printTable(chats, [
          { key: "id", label: "ID" },
          { key: "topic", label: "TOPIC" },
          { key: "updated_at", label: "UPDATED" },
        ]);
      }
    } catch (err) {
      printError((err as Error).message);
    }
  });

const createCommand = new Command("create")
  .description("Create a new chat")
  .option("--name <topic>", "Chat topic")
  .option("--artist <id>", "Artist ID")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    try {
      const body: Record<string, unknown> = {};
      if (opts.name) body.topic = opts.name;
      if (opts.artist) body.artistId = opts.artist;

      const data = await post("/api/chats", body);

      if (opts.json) {
        printJson(data.chat);
      } else {
        const chat = data.chat as Record<string, unknown>;
        console.log(`Created chat: ${chat.id}`);
      }
    } catch (err) {
      printError((err as Error).message);
    }
  });

export const chatsCommand = new Command("chats")
  .description("Manage chats")
  .addCommand(listCommand)
  .addCommand(createCommand);
