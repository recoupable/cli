import { Command } from "commander";
import { templatesCommand } from "./content/templatesCommand.js";
import { validateCommand } from "./content/validateCommand.js";
import { estimateCommand } from "./content/estimateCommand.js";
import { createCommand } from "./content/createCommand.js";

export const contentCommand = new Command("content")
  .description("Content-creation pipeline commands");

contentCommand.addCommand(templatesCommand);
contentCommand.addCommand(validateCommand);
contentCommand.addCommand(estimateCommand);
contentCommand.addCommand(createCommand);
