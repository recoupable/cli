import { createPrimitiveCommand } from "./createPrimitiveCommand.js";

export const audioCommand = createPrimitiveCommand(
  "transcribe-audio",
  "Transcribe a song into timestamped lyrics",
  "/api/content/transcribe-audio",
  [
    { flag: "--artist <id>", description: "Artist account ID" },
    { flag: "--song <slugs>", description: "Comma-separated song slugs or URLs" },
    { flag: "--lipsync", description: "Prefer clips with lyrics for lipsync" },
  ],
  (opts) => {
    const songs: string[] | undefined = opts.song
      ? String(opts.song).split(",").map((s: string) => s.trim()).filter(Boolean)
      : undefined;
    return {
      artist_account_id: opts.artist,
      lipsync: !!opts.lipsync,
      ...(songs && { songs }),
    };
  },
);
