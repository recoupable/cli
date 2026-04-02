import { createPrimitiveCommand } from "./createPrimitiveCommand.js";

export const imageCommand = createPrimitiveCommand(
  "generate-image",
  "Generate an AI image from a prompt and optional reference image",
  "/api/content/generate-image",
  [
    { flag: "--prompt <text>", description: "Image generation prompt" },
    { flag: "--reference-image <url>", description: "Reference image URL for conditioning" },
    { flag: "--model <id>", description: "Model ID (default: fal-ai/nano-banana-pro/edit)" },
  ],
  (opts) => ({
    ...(opts.prompt && { prompt: opts.prompt }),
    ...(opts.referenceImage && { reference_image_url: opts.referenceImage }),
    ...(opts.model && { model: opts.model }),
  }),
);
