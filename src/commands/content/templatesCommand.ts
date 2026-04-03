import { Command } from "commander";
import { get } from "../../client.js";
import { getErrorMessage } from "../../getErrorMessage.js";
import { printError, printJson } from "../../output.js";

export const templatesCommand = new Command("templates")
  .description("List available content creation templates. Templates are optional — every primitive works without one. Templates provide curated creative recipes.")
  .option("--json", "Output as JSON")
  .action(async opts => {
    try {
      const data = await get("/api/content/templates");
      if (opts.json) {
        printJson(data);
        return;
      }

      const templates = Array.isArray(data.templates) ? data.templates : [];
      if (templates.length === 0) {
        console.log("No templates available.");
        return;
      }

      for (const template of templates as Array<Record<string, unknown>>) {
        console.log(`- ${template.name}: ${template.description}`);
      }
    } catch (err) {
      printError(getErrorMessage(err));
    }
  });
