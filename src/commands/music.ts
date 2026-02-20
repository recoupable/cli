import { Command } from "commander";
import { get, post } from "../client.js";
import { printJson, printError } from "../output.js";

const analyzeCommand = new Command("analyze")
  .description("Analyze music using a preset or custom prompt")
  .argument("[prompt]", "Custom text prompt (omit when using --preset)")
  .option("--preset <name>", "Use a curated analysis preset (e.g. catalog_metadata, full_report)")
  .option("--audio <url>", "Public URL to an audio file (MP3, WAV, FLAC)")
  .option("--max-tokens <n>", "Max tokens to generate (default 512)", parseInt)
  .option("--json", "Output as JSON")
  .action(async (prompt: string | undefined, opts) => {
    try {
      if (!prompt && !opts.preset) {
        console.error("Error: Provide a prompt or use --preset <name>. Run 'recoup music presets' to see available presets.");
        process.exit(1);
      }

      const body: Record<string, unknown> = {};
      if (opts.preset) body.preset = opts.preset;
      if (prompt) body.prompt = prompt;
      if (opts.audio) body.audio_url = opts.audio;
      if (opts.maxTokens) body.max_new_tokens = opts.maxTokens;

      const data = await post("/api/music/analyze", body);

      if (opts.json) {
        printJson(data);
      } else if (data.report) {
        // full_report mode — print each section
        const report = data.report as Record<string, unknown>;
        for (const [key, value] of Object.entries(report)) {
          console.log(`\n${"=".repeat(50)}`);
          console.log(`  ${key.toUpperCase().replace(/_/g, " ")}`);
          console.log(`${"=".repeat(50)}`);
          if (typeof value === "string") {
            console.log(value);
          } else {
            console.log(JSON.stringify(value, null, 2));
          }
        }
        console.log(`\n(${data.elapsed_seconds}s total)`);
      } else if (typeof data.response === "object") {
        // JSON preset — pretty print
        console.log(JSON.stringify(data.response, null, 2));
        console.log(`\n(${data.elapsed_seconds}s)`);
      } else {
        // Text response
        console.log(data.response as string);
        console.log(`\n(${data.elapsed_seconds}s)`);
      }
    } catch (err) {
      printError((err as Error).message);
    }
  });

const presetsCommand = new Command("presets")
  .description("List available analysis presets")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    try {
      const data = await get("/api/music/presets");
      const presets = (data.presets as Record<string, unknown>[]) || [];

      if (opts.json) {
        printJson(presets);
      } else {
        for (const p of presets) {
          const audio = p.requiresAudio ? " [requires audio]" : "";
          const format = p.responseFormat === "json" ? " (JSON)" : " (text)";
          console.log(`  ${p.name}${format}${audio}`);
          console.log(`    ${p.description}\n`);
        }
      }
    } catch (err) {
      printError((err as Error).message);
    }
  });

export const musicCommand = new Command("music")
  .description("Music analysis tools")
  .addCommand(analyzeCommand)
  .addCommand(presetsCommand);
