import { Command } from "commander";
import { get, post } from "../client.js";
import { printJson } from "../output.js";
import { runAction, emit } from "../runAction.js";
import { parseJsonFlag, valueOrStdin } from "../stdin.js";

/** Build a simple artist-keyed GET research command (artist required, id optional). */
function artistResearch(name: string, path: string, desc: string): Command {
  return new Command(name)
    .description(desc)
    .requiredOption("--artist <name>", "Artist name or provider ID")
    .option("--id <id>", "Provider-neutral artist ID (alternative to --artist)")
    .option("--json", "Output as JSON")
    .action(
      runAction(async (opts) => {
        const params: Record<string, string> = { artist: opts.artist };
        if (opts.id) params.id = opts.id;
        const data = await get(path, params);
        emit(opts, data, () => printJson(data));
      }),
    );
}

const searchCommand = new Command("search")
  .description("Search for artists, tracks, or labels")
  .requiredOption("--q <query>", "Search query")
  .option("--type <type>", "artists | tracks | labels | albums (default artists)")
  .option("--limit <n>", "Result count (default 10)")
  .option("--offset <n>", "Pagination offset")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const params: Record<string, string> = { q: opts.q };
      if (opts.type) params.type = opts.type;
      if (opts.limit) params.limit = String(opts.limit);
      if (opts.offset) params.offset = String(opts.offset);
      const data = await get("/api/research", params);
      emit(opts, data, () => printJson(data.results ?? data));
    }),
  );

const lookupCommand = new Command("lookup")
  .description("Resolve a Spotify artist URL/ID to cross-platform IDs")
  .option("--url <url>", "Spotify artist URL")
  .option("--spotify-id <id>", "Spotify artist ID")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      if (!opts.url && !opts.spotifyId) {
        throw new Error("Provide --url or --spotify-id");
      }
      const params: Record<string, string> = {};
      if (opts.url) params.url = opts.url;
      if (opts.spotifyId) params.spotifyId = opts.spotifyId;
      const data = await get("/api/research/lookup", params);
      emit(opts, data, () => printJson(data));
    }),
  );

const metricsCommand = new Command("metrics")
  .description("Platform-specific streaming/social metrics for an artist")
  .requiredOption("--artist <name>", "Artist name or provider ID")
  .requiredOption("--source <platform>", "spotify, instagram, tiktok, youtube_channel, ...")
  .option("--id <id>", "Provider-neutral artist ID")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const params: Record<string, string> = {
        artist: opts.artist,
        source: opts.source,
      };
      if (opts.id) params.id = opts.id;
      const data = await get("/api/research/metrics", params);
      emit(opts, data, () => printJson(data));
    }),
  );

const similarCommand = new Command("similar")
  .description("Find similar artists by audience, genre, mood, or musicality")
  .requiredOption("--artist <name>", "Artist name or provider ID")
  .option("--id <id>", "Provider-neutral artist ID")
  .option("--audience <level>", "high | medium | low")
  .option("--genre <level>", "high | medium | low")
  .option("--mood <level>", "high | medium | low")
  .option("--musicality <level>", "high | medium | low")
  .option("--limit <n>", "Result count")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const params: Record<string, string> = { artist: opts.artist };
      for (const k of ["id", "audience", "genre", "mood", "musicality", "limit"]) {
        if (opts[k]) params[k] = String(opts[k]);
      }
      const data = await get("/api/research/similar", params);
      emit(opts, data, () => printJson(data));
    }),
  );

const playlistsCommand = new Command("playlists")
  .description("Playlists featuring an artist")
  .requiredOption("--artist <name>", "Artist name or provider ID")
  .option("--id <id>", "Provider-neutral artist ID")
  .option("--platform <p>", "spotify | applemusic | deezer | amazon | youtube")
  .option("--status <s>", "current | past (default current)")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const params: Record<string, string> = { artist: opts.artist };
      for (const k of ["id", "platform", "status"]) {
        if (opts[k]) params[k] = String(opts[k]);
      }
      const data = await get("/api/research/playlists", params);
      emit(opts, data, () => printJson(data));
    }),
  );

const albumsCommand = new Command("albums")
  .description("Album discography for a provider artist ID")
  .requiredOption("--artist-id <id>", "Provider artist ID")
  .option("--primary <bool>", "Only primary albums (true/false, default true)")
  .option("--limit <n>", "Pagination limit")
  .option("--offset <n>", "Pagination offset")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const params: Record<string, string> = { artist_id: opts.artistId };
      if (opts.primary) params.is_primary = opts.primary;
      if (opts.limit) params.limit = String(opts.limit);
      if (opts.offset) params.offset = String(opts.offset);
      const data = await get("/api/research/albums", params);
      emit(opts, data, () => printJson(data));
    }),
  );

const albumMeasurementsCommand = new Command("album-measurements")
  .description("Latest measured play count per track on an album")
  .requiredOption("--album <id>", "Spotify album ID")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const data = await get(
        `/api/research/albums/${opts.album}/measurements`,
      );
      emit(opts, data, () => printJson(data));
    }),
  );

const playcountsCommand = new Command("playcounts")
  .description("Latest displayed play counts for every track on an album")
  .requiredOption("--album <id>", "Spotify album ID")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const data = await get("/api/research/playcounts", {
        spotify_album_id: opts.album,
      });
      emit(opts, data, () => printJson(data));
    }),
  );

const trackCommand = new Command("track")
  .description("Full provider track details by ID")
  .requiredOption("--id <id>", "Provider track ID")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const data = await get("/api/research/track", { id: opts.id });
      emit(opts, data, () => printJson(data));
    }),
  );

/** Shared track-identifier flags for stats endpoints (one of four). */
function trackIdParams(opts: Record<string, string>): Record<string, string> {
  const params: Record<string, string> = {};
  if (opts.isrc) params.isrc = opts.isrc;
  if (opts.spotifyId) params.spotify_track_id = opts.spotifyId;
  if (opts.appleId) params.apple_music_track_id = opts.appleId;
  if (opts.songstatsId) params.songstats_track_id = opts.songstatsId;
  if (Object.keys(params).length === 0) {
    throw new Error(
      "Provide a track identifier: --isrc, --spotify-id, --apple-id, or --songstats-id",
    );
  }
  return params;
}

const trackStatsCommand = new Command("track-stats")
  .description("Current per-track, per-source stats (incl. total streams)")
  .requiredOption("--source <platform>", "Platform source")
  .option("--isrc <isrc>", "ISRC code")
  .option("--spotify-id <id>", "Spotify track ID")
  .option("--apple-id <id>", "Apple Music track ID")
  .option("--songstats-id <id>", "Songstats track ID")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const params = { ...trackIdParams(opts), source: opts.source };
      const data = await get("/api/research/track/stats", params);
      emit(opts, data, () => printJson(data));
    }),
  );

const trackHistoricCommand = new Command("track-historic")
  .description("Historic daily per-track, per-source stats")
  .requiredOption("--source <platform>", "Platform source")
  .option("--isrc <isrc>", "ISRC code")
  .option("--spotify-id <id>", "Spotify track ID")
  .option("--apple-id <id>", "Apple Music track ID")
  .option("--songstats-id <id>", "Songstats track ID")
  .option("--start <date>", "Start date (YYYY-MM-DD)")
  .option("--end <date>", "End date (YYYY-MM-DD)")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const params: Record<string, string> = {
        ...trackIdParams(opts),
        source: opts.source,
      };
      if (opts.start) params.start_date = opts.start;
      if (opts.end) params.end_date = opts.end;
      const data = await get("/api/research/track/historic-stats", params);
      emit(opts, data, () => printJson(data));
    }),
  );

const trackDeltasCommand = new Command("track-deltas")
  .description("Change in displayed play counts between captures + run-rate")
  .requiredOption("--isrc <isrc>", "ISRC code")
  .requiredOption("--since <date>", "Start date (YYYY-MM-DD)")
  .option("--until <date>", "End date (YYYY-MM-DD)")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const params: Record<string, string> = {
        isrc: opts.isrc,
        since: opts.since,
      };
      if (opts.until) params.until = opts.until;
      const data = await get("/api/research/track/playcount-deltas", params);
      emit(opts, data, () => printJson(data));
    }),
  );

const trackMeasurementsCommand = new Command("track-measurements")
  .description("A track's measured series or run-rate projection")
  .requiredOption("--track <id>", "Provider-neutral track ID")
  .option("--platform <p>", "Measurement platform (default spotify)")
  .option("--metric <m>", "Metric name")
  .option("--aggregate <a>", "run_rate (projection)")
  .option("--window <w>", "Window like 30d or 365 (default 365)")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const params: Record<string, string> = {};
      if (opts.platform) params.platform = opts.platform;
      if (opts.metric) params.metric = opts.metric;
      if (opts.aggregate) params.aggregate = opts.aggregate;
      if (opts.window) params.window = opts.window;
      const data = await get(
        `/api/research/tracks/${opts.track}/measurements`,
        params,
      );
      emit(opts, data, () => printJson(data));
    }),
  );

const trackPlaylistsCommand = new Command("track-playlists")
  .description("Playlists featuring a specific track")
  .option("--id <id>", "Provider track ID")
  .option("--q <name>", "Track name (alternative to --id)")
  .option("--artist <name>", "Artist filter")
  .option("--platform <p>", "spotify | applemusic | deezer | amazon")
  .option("--status <s>", "current | past")
  .option("--limit <n>", "Pagination limit")
  .option("--offset <n>", "Pagination offset")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      if (!opts.id && !opts.q) throw new Error("Provide --id or --q");
      const params: Record<string, string> = {};
      for (const k of ["id", "q", "artist", "platform", "status", "limit", "offset"]) {
        if (opts[k]) params[k] = String(opts[k]);
      }
      const data = await get("/api/research/track/playlists", params);
      emit(opts, data, () => printJson(data));
    }),
  );

const deepCommand = new Command("deep")
  .description("Deep research with citations (costs 25 credits)")
  .option("--query <text>", "Research query (or pipe via stdin)")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const query = await valueOrStdin(opts.query);
      if (!query) throw new Error("Provide --query <text> or pipe it via stdin");
      const data = await post("/api/research/deep", { query });
      if (opts.json) {
        printJson(data);
      } else {
        console.log(data.content ?? "");
      }
    }),
  );

const webCommand = new Command("web")
  .description("Search the web for real-time info (costs 5 credits)")
  .option("--query <text>", "Search query (or pipe via stdin)")
  .option("--max-results <n>", "Max results (default 10, max 20)")
  .option("--country <code>", "2-letter country code")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const query = await valueOrStdin(opts.query);
      if (!query) throw new Error("Provide --query <text> or pipe it via stdin");
      const body: Record<string, unknown> = { query };
      if (opts.maxResults) body.max_results = Number(opts.maxResults);
      if (opts.country) body.country = opts.country;
      const data = await post("/api/research/web", body);
      if (opts.json) {
        printJson(data);
      } else {
        console.log(data.formatted ?? JSON.stringify(data.results, null, 2));
      }
    }),
  );

const enrichCommand = new Command("enrich")
  .description("Enrich an entity with structured web research data")
  .requiredOption("--input <text>", "URL or text to enrich")
  .requiredOption("--schema <json>", "JSON schema for structured extraction")
  .option("--processor <p>", "base (5) | core (10) | ultra (25) credits")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const body: Record<string, unknown> = {
        input: opts.input,
        schema: parseJsonFlag(opts.schema, "--schema"),
      };
      if (opts.processor) body.processor = opts.processor;
      const data = await post("/api/research/enrich", body);
      emit(opts, data, () => printJson(data));
    }),
  );

const extractCommand = new Command("extract")
  .description("Extract clean markdown from up to 10 URLs (5 credits/URL)")
  .requiredOption(
    "--url <url>",
    "URL to extract (repeatable)",
    (val: string, prev: string[]) => prev.concat(val),
    [] as string[],
  )
  .option("--objective <text>", "Extraction objective/prompt")
  .option("--full-content", "Extract full page content")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const body: Record<string, unknown> = { urls: opts.url };
      if (opts.objective) body.objective = opts.objective;
      if (opts.fullContent) body.full_content = true;
      const data = await post("/api/research/extract", body);
      emit(opts, data, () => printJson(data));
    }),
  );

const peopleCommand = new Command("people")
  .description("Search for people in the music industry")
  .option("--query <text>", "Search query (or pipe via stdin)")
  .option("--num-results <n>", "Max results (max 100)")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const query = await valueOrStdin(opts.query);
      if (!query) throw new Error("Provide --query <text> or pipe it via stdin");
      const body: Record<string, unknown> = { query };
      if (opts.numResults) body.num_results = Number(opts.numResults);
      const data = await post("/api/research/people", body);
      emit(opts, data, () => printJson(data));
    }),
  );

const snapshotsCommand = new Command("snapshots")
  .description("Capture displayed play counts for a catalog/albums/ISRCs (async)")
  .option("--catalog <id>", "Catalog ID")
  .option("--album-ids <list>", "Comma-separated Spotify album IDs")
  .option("--isrcs <list>", "Comma-separated ISRCs")
  .option("--platforms <list>", "Comma-separated platforms (default spotify)")
  .option("--schedule <s>", "once | monthly (default once)")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const body: Record<string, unknown> = {};
      if (opts.catalog) body.catalog_id = opts.catalog;
      if (opts.albumIds) body.album_ids = opts.albumIds.split(",");
      if (opts.isrcs) body.isrcs = opts.isrcs.split(",");
      if (opts.platforms) body.platforms = opts.platforms.split(",");
      if (opts.schedule) body.schedule = opts.schedule;
      if (!opts.catalog && !opts.albumIds && !opts.isrcs) {
        throw new Error("Provide one of --catalog, --album-ids, or --isrcs");
      }
      const data = await post("/api/research/snapshots", body);
      emit(opts, data, () =>
        console.log(
          `Snapshot job: ${data.snapshot_id} (estimated cost: ${data.cost_estimate})`,
        ),
      );
    }),
  );

const measurementJobsCommand = new Command("measurement-jobs")
  .description("Create an async playcount ingest job (current or historical)")
  .requiredOption("--source <s>", "current | historical")
  .option("--catalog <id>", "Catalog ID")
  .option("--album-ids <list>", "Comma-separated Spotify album IDs")
  .option("--isrcs <list>", "Comma-separated ISRCs")
  .option("--platforms <list>", "Comma-separated platforms (default spotify)")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const scope: Record<string, unknown> = {};
      if (opts.catalog) scope.catalog_id = opts.catalog;
      if (opts.albumIds) scope.album_ids = opts.albumIds.split(",");
      if (opts.isrcs) scope.isrcs = opts.isrcs.split(",");
      if (Object.keys(scope).length === 0) {
        throw new Error("Provide one of --catalog, --album-ids, or --isrcs");
      }
      const body: Record<string, unknown> = { scope, source: opts.source };
      if (opts.platforms) body.platforms = opts.platforms.split(",");
      const data = await post("/api/research/measurement-jobs", body);
      emit(opts, data, () => console.log(`Measurement job: ${data.job_id}`));
    }),
  );

export const researchCommand = new Command("research")
  .description("Artist, track, audience, and web research (Songstats + web)")
  .addCommand(searchCommand)
  .addCommand(artistResearch("profile", "/api/research/profile", "Full artist profile"))
  .addCommand(artistResearch("audience", "/api/research/audience", "Audience demographics"))
  .addCommand(artistResearch("career", "/api/research/career", "Career history and milestones"))
  .addCommand(artistResearch("insights", "/api/research/insights", "Trending highlights"))
  .addCommand(artistResearch("milestones", "/api/research/milestones", "Activity feed"))
  .addCommand(artistResearch("urls", "/api/research/urls", "All known platform URLs"))
  .addCommand(artistResearch("tracks", "/api/research/tracks", "All tracks for an artist"))
  .addCommand(metricsCommand)
  .addCommand(similarCommand)
  .addCommand(lookupCommand)
  .addCommand(playlistsCommand)
  .addCommand(albumsCommand)
  .addCommand(albumMeasurementsCommand)
  .addCommand(playcountsCommand)
  .addCommand(trackCommand)
  .addCommand(trackStatsCommand)
  .addCommand(trackHistoricCommand)
  .addCommand(trackDeltasCommand)
  .addCommand(trackMeasurementsCommand)
  .addCommand(trackPlaylistsCommand)
  .addCommand(deepCommand)
  .addCommand(webCommand)
  .addCommand(enrichCommand)
  .addCommand(extractCommand)
  .addCommand(peopleCommand)
  .addCommand(snapshotsCommand)
  .addCommand(measurementJobsCommand)
  .addHelpText(
    "after",
    `
Examples:
  recoup research search --q "Daft Punk" --type artists
  recoup research profile --artist "Daft Punk"
  recoup research metrics --artist "Daft Punk" --source spotify
  recoup research web --query "latest music industry news" --max-results 5
  recoup research deep --query "Impact of TikTok on music discovery"
  recoup research track-stats --isrc USUM71807100 --source spotify
`,
  );
