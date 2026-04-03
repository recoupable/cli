import { Command } from "commander";
import { patch } from "../../client.js";
import { getErrorMessage } from "../../getErrorMessage.js";
import { printError, printJson } from "../../output.js";

interface EditOperation {
  type: string;
  [key: string]: unknown;
}

export const editCommand = new Command("edit")
  .description("Edit content — trim, crop, resize, overlay text, or add audio")
  .option("--video <url>", "Input video URL")
  .option("--audio <url>", "Input audio URL")
  .option("--template <name>", "Template name for deterministic edit config")
  .option("--trim-start <seconds>", "Trim start time in seconds")
  .option("--trim-duration <seconds>", "Trim duration in seconds")
  .option("--crop-aspect <ratio>", "Crop to aspect ratio (e.g. 9:16)")
  .option("--overlay-text <content>", "Overlay text content")
  .option("--text-color <color>", "Text color", "white")
  .option("--text-position <pos>", "Text position: top, center, bottom", "bottom")
  .option("--mux-audio <url>", "Mux audio URL into video")
  .option("--output-format <format>", "Output format: mp4, webm, mov", "mp4")
  .option("--json", "Output as JSON")
  .action(async (opts: Record<string, unknown>) => {
    try {
      const operations: EditOperation[] = [];

      if (opts.trimStart || opts.trimDuration) {
        operations.push({
          type: "trim",
          start: Number(opts.trimStart ?? 0),
          duration: Number(opts.trimDuration ?? 15),
        });
      }

      if (opts.cropAspect) {
        operations.push({ type: "crop", aspect: opts.cropAspect });
      }

      if (opts.overlayText) {
        operations.push({
          type: "overlay_text",
          content: opts.overlayText,
          color: opts.textColor ?? "white",
          position: opts.textPosition ?? "bottom",
        });
      }

      if (opts.muxAudio) {
        operations.push({
          type: "mux_audio",
          audio_url: opts.muxAudio,
          replace: true,
        });
      }

      const body: Record<string, unknown> = {
        ...(opts.video && { video_url: opts.video }),
        ...(opts.audio && { audio_url: opts.audio }),
        ...(opts.template && { template: opts.template }),
        ...(operations.length > 0 && { operations }),
        output_format: opts.outputFormat ?? "mp4",
      };

      const data = await patch("/api/content", body);

      if (opts.json) {
        printJson(data);
        return;
      }

      if (data.runId) {
        console.log(`Run started: ${data.runId}`);
        console.log("Use `recoup tasks status --run <runId>` to check progress.");
      } else {
        printJson(data);
      }
    } catch (err) {
      printError(getErrorMessage(err));
    }
  });
