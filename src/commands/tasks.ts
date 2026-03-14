import { Command } from "commander";
import { statusCommand } from "./tasks/statusCommand.js";

export const tasksCommand = new Command("tasks").description(
  "Check the status of background task runs",
);

tasksCommand.addCommand(statusCommand);
