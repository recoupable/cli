import { Command } from "commander";
import { get } from "../client.js";
import { printJson } from "../output.js";
import { runAction, emit } from "../runAction.js";

const searchCommand = new Command("search")
  .description("Search Spotify for tracks, albums, or artists")
  .requiredOption("--q <query>", "Search query")
  .requiredOption("--type <type>", "track | album | artist | playlist")
  .option("--market <code>", "Market code (e.g. US)")
  .option("--limit <n>", "Number of results")
  .option("--offset <n>", "Pagination offset")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const params: Record<string, string> = { q: opts.q, type: opts.type };
      for (const k of ["market", "limit", "offset"]) {
        if (opts[k]) params[k] = String(opts[k]);
      }
      const data = await get("/api/spotify/search", params);
      emit(opts, data, () => printJson(data));
    }),
  );

const artistCommand = new Command("artist")
  .description("Get a Spotify artist by ID")
  .requiredOption("--id <id>", "Spotify artist ID")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const data = await get("/api/spotify/artist", { id: opts.id });
      emit(opts, data, () => printJson(data));
    }),
  );

const albumsCommand = new Command("albums")
  .description("Get a Spotify artist's albums")
  .requiredOption("--id <id>", "Spotify artist ID")
  .option("--include-groups <list>", "Comma-separated album types")
  .option("--market <code>", "Market code")
  .option("--limit <n>", "Number of results")
  .option("--offset <n>", "Pagination offset")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const params: Record<string, string> = { id: opts.id };
      if (opts.includeGroups) params.include_groups = opts.includeGroups;
      for (const k of ["market", "limit", "offset"]) {
        if (opts[k]) params[k] = String(opts[k]);
      }
      const data = await get("/api/spotify/artist/albums", params);
      emit(opts, data, () => printJson(data));
    }),
  );

const topTracksCommand = new Command("top-tracks")
  .description("Get a Spotify artist's top tracks")
  .requiredOption("--id <id>", "Spotify artist ID")
  .option("--market <code>", "Market code")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const params: Record<string, string> = { id: opts.id };
      if (opts.market) params.market = opts.market;
      const data = await get("/api/spotify/artist/topTracks", params);
      emit(opts, data, () => printJson(data));
    }),
  );

const albumCommand = new Command("album")
  .description("Get a Spotify album by ID")
  .requiredOption("--id <id>", "Spotify album ID")
  .option("--market <code>", "Market code")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const params: Record<string, string> = { id: opts.id };
      if (opts.market) params.market = opts.market;
      const data = await get("/api/spotify/album", params);
      emit(opts, data, () => printJson(data));
    }),
  );

export const spotifyCommand = new Command("spotify")
  .description("Query Spotify catalog data")
  .addCommand(searchCommand)
  .addCommand(artistCommand)
  .addCommand(albumsCommand)
  .addCommand(topTracksCommand)
  .addCommand(albumCommand)
  .addHelpText(
    "after",
    `
Examples:
  recoup spotify search --q "Daft Punk" --type artist
  recoup spotify artist --id 4tZwfgrHOc3mvqYlEYSvVi
  recoup spotify top-tracks --id 4tZwfgrHOc3mvqYlEYSvVi --market US
`,
  );
