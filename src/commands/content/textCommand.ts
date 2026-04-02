import { createPrimitiveCommand } from "./createPrimitiveCommand.js";

export const textCommand = createPrimitiveCommand(
  "generate-caption",
  "Generate on-screen caption text for a social video",
  "/api/content/generate-caption",
  [
    { flag: "--topic <text>", description: "Subject or theme for caption generation" },
    { flag: "--length <size>", description: "Text length: short, medium, long", defaultValue: "short" },
  ],
  (opts) => ({
    topic: opts.topic,
    length: opts.length,
  }),
);
