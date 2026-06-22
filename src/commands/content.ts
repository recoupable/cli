import { Command } from "commander";
import { templatesCommand } from "./content/templatesCommand.js";
import { validateCommand } from "./content/validateCommand.js";
import { estimateCommand } from "./content/estimateCommand.js";
import { createCommand } from "./content/createCommand.js";
import {
  templateCommand,
  captionCommand,
  imageCommand,
  videoCommand,
  analyzeCommand,
  transcribeCommand,
  upscaleCommand,
  editCommand,
} from "./content/mediaCommands.js";

export const contentCommand = new Command("content")
  .description("Content creation: captions, images, video, transcription, editing")
  .addCommand(templatesCommand)
  .addCommand(templateCommand)
  .addCommand(validateCommand)
  .addCommand(estimateCommand)
  .addCommand(createCommand)
  .addCommand(captionCommand)
  .addCommand(imageCommand)
  .addCommand(videoCommand)
  .addCommand(analyzeCommand)
  .addCommand(transcribeCommand)
  .addCommand(upscaleCommand)
  .addCommand(editCommand)
  .addHelpText(
    "after",
    `
Examples:
  recoup content templates
  recoup content caption --topic "summer tour announcement"
  recoup content image --prompt "neon synthwave album cover" --aspect 1:1
  recoup content transcribe --audio https://example.com/song.mp3
  recoup content create --artist <id> --songs hiccups,adhd
`,
  );
