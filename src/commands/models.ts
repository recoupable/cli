import { Command } from "commander";
import { get } from "../client.js";
import { printTable } from "../output.js";
import { runAction, emit } from "../runAction.js";

const listCommand = new Command("list")
  .description("List available AI models")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const data = await get("/api/ai/models");
      const models = (data.models as Record<string, unknown>[]) || [];
      emit(opts, models, () =>
        printTable(models, [
          { key: "id", label: "ID" },
          { key: "name", label: "NAME" },
        ]),
      );
    }),
  );

export const modelsCommand = new Command("models")
  .description("List AI models usable with 'generate' and tasks")
  .addCommand(listCommand)
  .addHelpText(
    "after",
    `
Examples:
  recoup models list
  recoup models list --json
`,
  );
