import { createPrimitiveCommand } from "./createPrimitiveCommand.js";

export const imageCommand = createPrimitiveCommand(
  "generate-image",
  "Generate an AI image from a template and face guide",
  "/api/content/generate-image",
  [
    { flag: "--artist <id>", description: "Artist account ID" },
    { flag: "--template <name>", description: "Template name", defaultValue: "artist-caption-bedroom" },
    { flag: "--face-guide <url>", description: "Face guide image URL (overrides artist default)" },
    { flag: "--prompt <text>", description: "Custom image prompt (overrides template)" },
  ],
  (opts) => ({
    artist_account_id: opts.artist,
    template: opts.template,
    ...(opts.faceGuide && { face_guide_url: opts.faceGuide }),
    ...(opts.prompt && { prompt: opts.prompt }),
  }),
);
