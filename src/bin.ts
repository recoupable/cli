import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Command } from "commander";
import { whoamiCommand } from "./commands/whoami.js";
import { accountsCommand } from "./commands/accounts.js";
import { artistsCommand } from "./commands/artists.js";
import { chatsCommand } from "./commands/chats.js";
import { generateCommand } from "./commands/generate.js";
import { sandboxesCommand } from "./commands/sandboxes.js";
import { songsCommand } from "./commands/songs.js";
import { catalogsCommand } from "./commands/catalogs.js";
import { notificationsCommand } from "./commands/notifications.js";
import { orgsCommand } from "./commands/orgs.js";
import { workspacesCommand } from "./commands/workspaces.js";
import { contentCommand } from "./commands/content.js";
import { researchCommand } from "./commands/research.js";
import { spotifyCommand } from "./commands/spotify.js";
import { connectorsCommand } from "./commands/connectors.js";
import { pulsesCommand } from "./commands/pulses.js";
import { tasksCommand } from "./commands/tasks.js";
import { sessionsCommand } from "./commands/sessions.js";
import { templatesCommand } from "./commands/templates.js";
import { modelsCommand } from "./commands/models.js";

const pkgPath = join(__dirname, "..", "package.json");
const { version } = JSON.parse(readFileSync(pkgPath, "utf-8"));

const program = new Command();

program
  .name("recoup")
  .description(
    "Recoup platform CLI — agent-first access to the full Recoup API.\n\n" +
      "Auth: set RECOUP_API_KEY (sent as x-api-key).\n" +
      "Every command supports --json for machine-readable output.\n" +
      "Run `recoup <command> --help` for command-specific flags and examples.",
  )
  .version(version);

// Account & identity
program.addCommand(whoamiCommand);
program.addCommand(accountsCommand);
program.addCommand(orgsCommand);
program.addCommand(workspacesCommand);

// Artists & catalog
program.addCommand(artistsCommand);
program.addCommand(songsCommand);
program.addCommand(catalogsCommand);

// AI & agents
program.addCommand(generateCommand);
program.addCommand(chatsCommand);
program.addCommand(sessionsCommand);
program.addCommand(tasksCommand);
program.addCommand(templatesCommand);
program.addCommand(modelsCommand);
program.addCommand(pulsesCommand);

// Content & media
program.addCommand(contentCommand);

// Research & data
program.addCommand(researchCommand);
program.addCommand(spotifyCommand);

// Integrations & infra
program.addCommand(connectorsCommand);
program.addCommand(sandboxesCommand);
program.addCommand(notificationsCommand);

program.addHelpText(
  "after",
  `
Examples:
  recoup whoami
  recoup generate --prompt "Summarize this artist's momentum" --artist <id>
  recoup research profile --artist "Daft Punk" --json
  recoup artists list --json
  recoup tasks create --title "Daily" --prompt "..." --schedule "0 9 * * *" --artist <id>

Tip: pipe data between commands, e.g.
  echo "What are the top markets?" | recoup generate --json
`,
);

program.parse();
