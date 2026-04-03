import { Command } from "commander";
import { templatesCommand } from "./content/templatesCommand.js";
import { validateCommand } from "./content/validateCommand.js";
import { estimateCommand } from "./content/estimateCommand.js";
import { createCommand } from "./content/createCommand.js";
import { imageCommand } from "./content/imageCommand.js";
import { videoCommand } from "./content/videoCommand.js";
import { textCommand } from "./content/textCommand.js";
import { audioCommand } from "./content/audioCommand.js";
import { editCommand } from "./content/editCommand.js";
import { upscaleCommand } from "./content/upscaleCommand.js";
import { analyzeCommand } from "./content/analyzeCommand.js";

export const contentCommand = new Command("content")
  .description("Content-creation pipeline commands");

contentCommand.addCommand(templatesCommand);
contentCommand.addCommand(validateCommand);
contentCommand.addCommand(estimateCommand);
contentCommand.addCommand(createCommand);
contentCommand.addCommand(imageCommand);
contentCommand.addCommand(videoCommand);
contentCommand.addCommand(textCommand);
contentCommand.addCommand(audioCommand);
contentCommand.addCommand(editCommand);
contentCommand.addCommand(upscaleCommand);
contentCommand.addCommand(analyzeCommand);
