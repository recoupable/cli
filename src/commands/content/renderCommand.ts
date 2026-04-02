import { createPrimitiveCommand } from "./createPrimitiveCommand.js";

export const renderCommand = createPrimitiveCommand(
  "render",
  "Combine video + audio + text into a final social video",
  "/api/content/create/render",
  [
    { flag: "--video <url>", description: "Video URL" },
    { flag: "--audio <url>", description: "Song URL" },
    { flag: "--start <seconds>", description: "Audio start time in seconds" },
    { flag: "--duration <seconds>", description: "Audio duration in seconds" },
    { flag: "--text <content>", description: "On-screen text content" },
    { flag: "--font <name>", description: "Font file name" },
    { flag: "--has-audio", description: "Video already has audio baked in" },
  ],
  (opts) => ({
    video_url: opts.video,
    song_url: opts.audio,
    audio_start_seconds: Number(opts.start ?? 0),
    audio_duration_seconds: Number(opts.duration ?? 15),
    text: {
      content: opts.text ?? "",
      ...(opts.font && { font: opts.font }),
    },
    has_audio: !!opts.hasAudio,
  }),
);
