import { createPrimitiveCommand } from "./createPrimitiveCommand.js";

export const videoCommand = createPrimitiveCommand(
  "generate-video",
  "Generate a video, optionally from a reference image or audio",
  "/api/content/generate-video",
  [
    { flag: "--prompt <text>", description: "Text prompt describing the video" },
    { flag: "--image <url>", description: "Optional reference image URL" },
    { flag: "--lipsync", description: "Use audio-driven lipsync mode (requires --audio)" },
    { flag: "--audio <url>", description: "Audio URL for lipsync mode" },
    { flag: "--motion <text>", description: "Motion prompt (overrides --prompt for motion)" },
    { flag: "--model <id>", description: "Model ID (default: fal-ai/veo3.1/fast/image-to-video)" },
  ],
  (opts) => ({
    ...(opts.prompt && { prompt: opts.prompt }),
    ...(opts.image && { image_url: opts.image }),
    lipsync: !!opts.lipsync,
    ...(opts.audio && { audio_url: opts.audio }),
    ...(opts.motion && { motion_prompt: opts.motion }),
    ...(opts.model && { model: opts.model }),
  }),
);
