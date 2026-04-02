import { createPrimitiveCommand } from "./createPrimitiveCommand.js";

export const videoCommand = createPrimitiveCommand(
  "generate-video",
  "Generate a video from an image (or audio-driven for lipsync)",
  "/api/content/generate-video",
  [
    { flag: "--image <url>", description: "Image URL to animate" },
    { flag: "--lipsync", description: "Use audio-to-video mode (requires --audio)" },
    { flag: "--audio <url>", description: "Audio URL for lipsync mode" },
    { flag: "--motion <text>", description: "Custom motion prompt" },
    { flag: "--model <id>", description: "Model ID (default: fal-ai/veo3.1/fast/image-to-video)" },
  ],
  (opts) => ({
    image_url: opts.image,
    lipsync: !!opts.lipsync,
    ...(opts.audio && { audio_url: opts.audio }),
    ...(opts.motion && { motion_prompt: opts.motion }),
    ...(opts.model && { model: opts.model }),
  }),
);
