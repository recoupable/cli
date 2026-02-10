import { Command } from "commander";
import { whoamiCommand } from "./commands/whoami.js";
import { artistsCommand } from "./commands/artists.js";
import { chatsCommand } from "./commands/chats.js";
import { sandboxesCommand } from "./commands/sandboxes.js";
import { orgsCommand } from "./commands/orgs.js";

const program = new Command();

program
  .name("recoup")
  .description("Recoup platform CLI")
  .version("0.1.0");

program.addCommand(whoamiCommand);
program.addCommand(artistsCommand);
program.addCommand(chatsCommand);
program.addCommand(sandboxesCommand);
program.addCommand(orgsCommand);

program.parse();
