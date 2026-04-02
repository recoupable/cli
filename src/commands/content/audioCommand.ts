import { createPrimitiveCommand } from "./createPrimitiveCommand.js";

export const audioCommand = createPrimitiveCommand(
  "transcribe-audio",
  "Transcribe audio into timestamped text",
  "/api/content/transcribe-audio",
  [
    { flag: "--url <urls>", description: "Comma-separated audio URLs to transcribe" },
    { flag: "--model <id>", description: "Model ID (default: fal-ai/whisper)" },
  ],
  (opts) => {
    const audioUrls: string[] = opts.url
      ? String(opts.url).split(",").map((s: string) => s.trim()).filter(Boolean)
      : [];
    return {
      audio_urls: audioUrls,
      ...(opts.model && { model: opts.model }),
    };
  },
);
