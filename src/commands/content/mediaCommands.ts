import { Command } from "commander";
import { get, post, patch } from "../../client.js";
import { printJson } from "../../output.js";
import { runAction, emit } from "../../runAction.js";
import { parseJsonFlag, valueOrStdin } from "../../stdin.js";

export const templateCommand = new Command("template")
  .description("Show a single content template by ID")
  .argument("<id>", "Template ID")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (id, opts) => {
      const data = await get(`/api/content/templates/${id}`);
      emit(opts, data, () => printJson(data));
    }),
  );

export const captionCommand = new Command("caption")
  .description("Generate a caption for a topic")
  .requiredOption("--topic <text>", "Caption topic")
  .option("--template <name>", "Template ID")
  .option("--length <len>", "short | medium | long (default short)")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const body: Record<string, unknown> = { topic: opts.topic };
      if (opts.template) body.template = opts.template;
      if (opts.length) body.length = opts.length;
      const data = await post("/api/content/caption", body);
      if (opts.json) {
        printJson(data);
      } else {
        console.log(data.content ?? "");
      }
    }),
  );

export const imageCommand = new Command("image")
  .description("Generate an image")
  .option("--prompt <text>", "Image prompt")
  .option("--template <name>", "Template ID")
  .option("--reference <url>", "Reference image URL")
  .option("--image <url>", "Input image URL (repeatable)", (v: string, p: string[]) => p.concat(v), [] as string[])
  .option("--num <n>", "Number of images (1-4, default 1)")
  .option("--aspect <ratio>", "Aspect ratio (e.g. 1:1, 16:9, default auto)")
  .option("--resolution <res>", "0.5K | 1K | 2K | 4K (default 1K)")
  .option("--model <id>", "Model ID")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const body: Record<string, unknown> = {};
      if (opts.prompt) body.prompt = opts.prompt;
      if (opts.template) body.template = opts.template;
      if (opts.reference) body.reference_image_url = opts.reference;
      if (opts.image && opts.image.length) body.images = opts.image;
      if (opts.num) body.num_images = Number(opts.num);
      if (opts.aspect) body.aspect_ratio = opts.aspect;
      if (opts.resolution) body.resolution = opts.resolution;
      if (opts.model) body.model = opts.model;
      const data = await post("/api/content/image", body);
      if (opts.json) {
        printJson(data);
      } else {
        console.log(data.imageUrl ?? "");
        for (const url of (data.images as string[]) || []) {
          if (url !== data.imageUrl) console.log(url);
        }
      }
    }),
  );

export const videoCommand = new Command("video")
  .description("Generate a video")
  .option("--prompt <text>", "Video prompt")
  .option("--template <name>", "Template ID")
  .option("--mode <mode>", "prompt | animate | reference | extend | first-last | lipsync")
  .option("--image <url>", "Input image URL")
  .option("--end-image <url>", "End image URL (first-last mode)")
  .option("--video <url>", "Input video URL")
  .option("--audio <url>", "Input audio URL (lipsync mode)")
  .option("--aspect <ratio>", "auto | 16:9 | 9:16 (default auto)")
  .option("--duration <d>", "4s | 6s | 7s | 8s (default 8s)")
  .option("--resolution <res>", "720p | 1080p | 4k (default 720p)")
  .option("--negative <text>", "Negative prompt")
  .option("--generate-audio", "Generate audio track")
  .option("--model <id>", "Model ID")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const body: Record<string, unknown> = {};
      if (opts.prompt) body.prompt = opts.prompt;
      if (opts.template) body.template = opts.template;
      if (opts.mode) body.mode = opts.mode;
      if (opts.image) body.image_url = opts.image;
      if (opts.endImage) body.end_image_url = opts.endImage;
      if (opts.video) body.video_url = opts.video;
      if (opts.audio) body.audio_url = opts.audio;
      if (opts.aspect) body.aspect_ratio = opts.aspect;
      if (opts.duration) body.duration = opts.duration;
      if (opts.resolution) body.resolution = opts.resolution;
      if (opts.negative) body.negative_prompt = opts.negative;
      if (opts.generateAudio) body.generate_audio = true;
      if (opts.model) body.model = opts.model;
      const data = await post("/api/content/video", body);
      emit(opts, data, () => printJson(data));
    }),
  );

export const analyzeCommand = new Command("analyze")
  .description("Analyze a video with a prompt (vision model)")
  .requiredOption("--video <url>", "Video URL")
  .option("--prompt <text>", "Analysis prompt (or pipe via stdin)")
  .option("--temperature <n>", "Sampling temperature (0-1, default 0.2)")
  .option("--max-tokens <n>", "Max output tokens")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const prompt = await valueOrStdin(opts.prompt);
      if (!prompt) throw new Error("Provide --prompt <text> or pipe it via stdin");
      const body: Record<string, unknown> = {
        video_url: opts.video,
        prompt,
      };
      if (opts.temperature) body.temperature = Number(opts.temperature);
      if (opts.maxTokens) body.max_tokens = Number(opts.maxTokens);
      const data = await post("/api/content/analyze", body);
      if (opts.json) {
        printJson(data);
      } else {
        console.log(data.text ?? "");
      }
    }),
  );

export const transcribeCommand = new Command("transcribe")
  .description("Transcribe one or more audio files")
  .requiredOption(
    "--audio <url>",
    "Audio URL (repeatable)",
    (v: string, p: string[]) => p.concat(v),
    [] as string[],
  )
  .option("--language <code>", "Language code (default en)")
  .option("--chunk-level <level>", "none | segment | word (default word)")
  .option("--diarize", "Enable speaker diarization")
  .option("--model <id>", "Model ID")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const body: Record<string, unknown> = { audio_urls: opts.audio };
      if (opts.language) body.language = opts.language;
      if (opts.chunkLevel) body.chunk_level = opts.chunkLevel;
      if (opts.diarize) body.diarize = true;
      if (opts.model) body.model = opts.model;
      const data = await post("/api/content/transcribe", body);
      if (opts.json) {
        printJson(data);
      } else {
        console.log(data.transcript ?? "");
      }
    }),
  );

export const upscaleCommand = new Command("upscale")
  .description("Upscale an image or video")
  .requiredOption("--url <url>", "Source media URL")
  .requiredOption("--type <type>", "image | video")
  .option("--factor <n>", "Upscale factor (1-4, default 2)")
  .option("--target <res>", "720p | 1080p | 1440p | 2160p")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const body: Record<string, unknown> = { url: opts.url, type: opts.type };
      if (opts.factor) body.upscale_factor = Number(opts.factor);
      if (opts.target) body.target_resolution = opts.target;
      const data = await post("/api/content/upscale", body);
      if (opts.json) {
        printJson(data);
      } else {
        console.log(data.url ?? "");
      }
    }),
  );

export const editCommand = new Command("edit")
  .description("Edit a video via a template or explicit operations (async)")
  .requiredOption("--video <url>", "Source video URL")
  .option("--template <name>", "Edit template ID")
  .option(
    "--operations <json>",
    "JSON array of edit operations (or pipe via stdin)",
  )
  .option("--output-format <fmt>", "mp4 | webm | mov (default mp4)")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const body: Record<string, unknown> = { video_url: opts.video };
      if (opts.template) body.template = opts.template;
      const rawOps = await valueOrStdin(opts.operations);
      if (rawOps) body.operations = parseJsonFlag(rawOps, "--operations");
      if (opts.outputFormat) body.output_format = opts.outputFormat;
      if (!opts.template && !rawOps) {
        throw new Error("Provide --template or --operations");
      }
      const data = await patch("/api/content", body);
      emit(opts, data, () => console.log(`Edit triggered: ${data.runId}`));
    }),
  );
