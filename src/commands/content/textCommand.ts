import { createPrimitiveCommand } from "./createPrimitiveCommand.js";

export const textCommand = createPrimitiveCommand(
  "generate-caption",
  "Generate on-screen caption text for a social video",
  "/api/content/generate-caption",
  [
    { flag: "--artist <id>", description: "Artist account ID" },
    { flag: "--song <name>", description: "Song name or slug" },
    { flag: "--template <name>", description: "Template name for text style" },
    { flag: "--length <size>", description: "Text length: short, medium, long", defaultValue: "short" },
  ],
  (opts) => ({
    artist_account_id: opts.artist,
    song: opts.song,
    ...(opts.template && { template: opts.template }),
    length: opts.length,
  }),
);
