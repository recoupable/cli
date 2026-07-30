import { createPrimitiveCommand } from "./createPrimitiveCommand.js";

export const upscaleCommand = createPrimitiveCommand(
  "upscale",
  "Upscale an image or video",
  "/api/content/upscale",
  [
    { flag: "--url <url>", description: "URL of the image or video to upscale" },
    { flag: "--type <type>", description: "Type: image or video", defaultValue: "image" },
  ],
  (opts) => ({
    url: opts.url,
    type: opts.type,
  }),
);
