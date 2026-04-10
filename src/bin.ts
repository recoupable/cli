import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Command } from "commander";
import { whoamiCommand } from "./commands/whoami.js";
import { artistsCommand } from "./commands/artists.js";
import { chatsCommand } from "./commands/chats.js";
import { sandboxesCommand } from "./commands/sandboxes.js";
import { songsCommand } from "./commands/songs.js";
import { notificationsCommand } from "./commands/notifications.js";
import { orgsCommand } from "./commands/orgs.js";
import { contentCommand } from "./commands/content.js";
import { tasksCommand } from "./commands/tasks.js";
import { predictCommand } from "./commands/predict.js";
import { predictionsCommand } from "./commands/predictions.js";

const pkgPath = join(__dirname, "..", "package.json");
const { version } = JSON.parse(readFileSync(pkgPath, "utf-8"));

const program = new Command();

program
  .name("recoup")
  .description("Recoup platform CLI")
  .version(version);

program.addCommand(whoamiCommand);
program.addCommand(artistsCommand);
program.addCommand(chatsCommand);
program.addCommand(songsCommand);
program.addCommand(notificationsCommand);
program.addCommand(sandboxesCommand);
program.addCommand(orgsCommand);
program.addCommand(tasksCommand);
program.addCommand(contentCommand);
program.addCommand(predictCommand);
program.addCommand(predictionsCommand);

program.parse();
