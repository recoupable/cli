import { createPrimitiveCommand } from "./createPrimitiveCommand.js";

export const videoCommand = createPrimitiveCommand(
  "video",
  "Generate a video from an image (or audio-to-video for lipsync)",
  "/api/content/create/video",
  [
    { flag: "--image <url>", description: "Image URL to animate" },
    { flag: "--template <name>", description: "Template name for motion prompt" },
    { flag: "--lipsync", description: "Use audio-to-video mode (requires --song-url)" },
    { flag: "--song-url <url>", description: "Song URL for lipsync mode" },
    { flag: "--start <seconds>", description: "Audio start time in seconds" },
    { flag: "--duration <seconds>", description: "Audio duration in seconds" },
    { flag: "--motion <text>", description: "Custom motion prompt" },
  ],
  (opts) => ({
    image_url: opts.image,
    ...(opts.template && { template: opts.template }),
    lipsync: !!opts.lipsync,
    ...(opts.songUrl && { song_url: opts.songUrl }),
    ...(opts.start && { audio_start_seconds: Number(opts.start) }),
    ...(opts.duration && { audio_duration_seconds: Number(opts.duration) }),
    ...(opts.motion && { motion_prompt: opts.motion }),
  }),
);
