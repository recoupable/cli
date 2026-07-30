import { Command } from "commander";
import { post } from "../../client.js";
import { getErrorMessage } from "../../getErrorMessage.js";
import { printError, printJson } from "../../output.js";

function parsePositiveInt(value: string): number {
  const n = parseInt(value, 10);
  if (Number.isNaN(n) || n <= 0) {
    throw new Error(`Expected a positive integer, got "${value}"`);
  }
  return n;
}

export const analyzeCommand = new Command("analyze")
  .description(
    "Analyze a video with AI — describe scenes, check quality, evaluate content",
  )
  .requiredOption("--video <url>", "Video URL to analyze")
  .requiredOption("--prompt <text>", "What to analyze")
  .option("--temperature <number>", "Sampling temperature (default: 0.2)", parseFloat)
  .option("--max-tokens <number>", "Maximum output tokens", parsePositiveInt)
  .option("--json", "Output raw JSON")
  .action(async (opts: Record<string, unknown>) => {
    try {
      const body: Record<string, unknown> = {
        video_url: opts.video,
        prompt: opts.prompt,
      };

      if (opts.temperature !== undefined) {
        body.temperature = opts.temperature;
      } else {
        body.temperature = 0.2;
      }

      if (opts.maxTokens !== undefined) {
        body.max_tokens = opts.maxTokens;
      }

      const data = await post("/api/content/analyze", body);

      if (opts.json) {
        printJson(data);
        return;
      }

      const text = (data as Record<string, unknown>).text;
      if (typeof text === "string") {
        console.log(text);
      } else {
        printJson(data);
      }
    } catch (err) {
      printError(getErrorMessage(err));
    }
  });
