import { Command } from "commander";
import { get, post, patch, put, del } from "../client.js";
import { printTable } from "../output.js";
import { runAction, emit } from "../runAction.js";

const listCommand = new Command("list")
  .description("List agent prompt templates")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const data = await get("/api/agents/templates");
      const templates = (data.templates as Record<string, unknown>[]) || [];
      emit(opts, templates, () =>
        printTable(templates, [
          { key: "id", label: "ID" },
          { key: "title", label: "TITLE" },
          { key: "is_private", label: "PRIVATE" },
          { key: "is_favourite", label: "FAV" },
        ]),
      );
    }),
  );

const createCommand = new Command("create")
  .description("Create an agent prompt template")
  .requiredOption("--title <title>", "Title (3-50 chars)")
  .requiredOption("--description <text>", "Description (10-200 chars)")
  .requiredOption("--prompt <text>", "Prompt (20-10000 chars)")
  .option("--tags <list>", "Comma-separated tags", (v: string) => v.split(","))
  .option("--private", "Make the template private")
  .option("--share <emails>", "Comma-separated emails to share with", (v: string) => v.split(","))
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const body: Record<string, unknown> = {
        title: opts.title,
        description: opts.description,
        prompt: opts.prompt,
        tags: opts.tags || [],
        is_private: Boolean(opts.private),
      };
      if (opts.share) body.share_emails = opts.share;
      const data = await post("/api/agents/templates", body);
      const template = (data.template as Record<string, unknown>) || {};
      emit(opts, template, () => console.log(`Created template: ${template.id}`));
    }),
  );

const updateCommand = new Command("update")
  .description("Update an agent prompt template (creator only)")
  .argument("<id>", "Template ID")
  .option("--title <title>", "Title (3-50 chars)")
  .option("--description <text>", "Description (10-200 chars)")
  .option("--prompt <text>", "Prompt (20-10000 chars)")
  .option("--tags <list>", "Comma-separated tags", (v: string) => v.split(","))
  .option("--private <bool>", "Private (true/false)")
  .option("--share <emails>", "Comma-separated emails", (v: string) => v.split(","))
  .option("--json", "Output as JSON")
  .action(
    runAction(async (id, opts) => {
      const body: Record<string, unknown> = {};
      if (opts.title !== undefined) body.title = opts.title;
      if (opts.description !== undefined) body.description = opts.description;
      if (opts.prompt !== undefined) body.prompt = opts.prompt;
      if (opts.tags !== undefined) body.tags = opts.tags;
      if (opts.private !== undefined) body.is_private = opts.private === "true";
      if (opts.share !== undefined) body.share_emails = opts.share;
      if (Object.keys(body).length === 0) {
        throw new Error("Provide at least one field to update");
      }
      const data = await patch(`/api/agents/templates/${id}`, body);
      emit(opts, data.template ?? data, () =>
        console.log(`Updated template: ${id}`),
      );
    }),
  );

const deleteCommand = new Command("delete")
  .description("Delete an agent prompt template (creator only)")
  .argument("<id>", "Template ID")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (id, opts) => {
      const data = await del(`/api/agents/templates/${id}`);
      emit(opts, data, () => console.log(`Deleted template: ${id}`));
    }),
  );

const favoriteCommand = new Command("favorite")
  .description("Favorite or unfavorite a template")
  .argument("<id>", "Template ID")
  .option("--off", "Unfavorite instead of favorite")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (id, opts) => {
      const data = await put(`/api/agents/templates/${id}/favorite`, {
        is_favourite: !opts.off,
      });
      emit(opts, data, () =>
        console.log(`Template ${id} favourite=${!opts.off}`),
      );
    }),
  );

export const templatesCommand = new Command("templates")
  .description("Manage reusable agent prompt templates")
  .addCommand(listCommand)
  .addCommand(createCommand)
  .addCommand(updateCommand)
  .addCommand(deleteCommand)
  .addCommand(favoriteCommand)
  .addHelpText(
    "after",
    `
Examples:
  recoup templates list
  recoup templates create --title "Weekly recap" \\
    --description "Summarize the week's streaming performance" \\
    --prompt "Produce a concise weekly streaming performance recap" --tags analytics,weekly
  recoup templates favorite <id>
  recoup templates delete <id>
`,
  );
