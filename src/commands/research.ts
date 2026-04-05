import { Command } from "commander";
import { get, post } from "../client.js";
import { printJson, printTable, printError } from "../output.js";

const EXAMPLES = `
Examples:
  recoup research "Drake"
  recoup research "Drake" --json
  recoup research cities "Drake"
  recoup research metrics "Drake" --source spotify
  recoup research similar "Drake" --audience high --genre high
  recoup research web "Drake brand partnerships"
  recoup research deep "Tell me about Drake"
  recoup research people "A&R reps Atlantic Records"
  recoup research extract "https://en.wikipedia.org/wiki/Drake_(musician)"
  recoup research enrich "Drake" --schema '{"properties":{"label":{"type":"string"}}}'`;

const searchCommand = new Command("research")
  .description("Music industry research — streaming metrics, audience, playlists, competitive analysis, web intelligence")
  .argument("[query]", "Artist name to search for")
  .option("--json", "Output as JSON")
  .option("--limit <n>", "Max results", "10")
  .option("--type <type>", "Entity type: artists, tracks, albums", "artists")
  .addHelpText("after", EXAMPLES)
  .action(async (query, opts) => {
    if (!query) {
      searchCommand.help();
      return;
    }
    try {
      const data = await get("/api/research", { q: query, type: opts.type, limit: opts.limit });
      const results = (data.results as Record<string, unknown>[]) || [];
      if (opts.json) return printJson(results);
      printTable(results, [
        { key: "name", label: "NAME" },
        { key: "id", label: "ID" },
        { key: "sp_monthly_listeners", label: "LISTENERS" },
        { key: "sp_followers", label: "FOLLOWERS" },
      ]);
    } catch (err) { printError((err as Error).message); }
  });

const profileCommand = new Command("profile")
  .description("Full artist profile — bio, genres, social URLs, label")
  .argument("<artist>", "Artist name or Recoup ID")
  .option("--json", "Output as JSON")
  .addHelpText("after", `
Examples:
  recoup research profile "Drake"
  recoup research profile "Drake" --json`)
  .action(async (artist, opts) => {
    try {
      const data = await get("/api/research/profile", { artist });
      if (opts.json) return printJson(data);
      console.log(`${data.name} (${(data as Record<string, unknown>).country_code || "unknown"})`);
      const genres = data.genres as Record<string, unknown> | undefined;
      if (genres?.primary) console.log(`Genre: ${(genres.primary as Record<string, unknown>).name}`);
      console.log(`CM Score: ${data.cm_artist_score}`);
    } catch (err) { printError((err as Error).message); }
  });

const metricsCommand = new Command("metrics")
  .description("Platform metrics over time (14 platforms)")
  .argument("<artist>", "Artist name or Recoup ID")
  .requiredOption("--source <source>", "Platform: spotify, instagram, tiktok, youtube_channel, etc.")
  .option("--json", "Output as JSON")
  .addHelpText("after", `
Examples:
  recoup research metrics "Drake" --source spotify
  recoup research metrics "Drake" --source tiktok --json
  recoup research metrics "Drake" --source youtube_channel

Valid sources: spotify, instagram, tiktok, twitter, facebook, youtube_channel,
  youtube_artist, soundcloud, deezer, twitch, line, melon, wikipedia, bandsintown`)
  .action(async (artist, opts) => {
    try {
      const data = await get("/api/research/metrics", { artist, source: opts.source });
      if (opts.json) return printJson(data);
      printJson(data);
    } catch (err) { printError((err as Error).message); }
  });

const audienceCommand = new Command("audience")
  .description("Audience demographics — age, gender, country")
  .argument("<artist>", "Artist name or Recoup ID")
  .option("--platform <platform>", "instagram (default), tiktok, youtube", "instagram")
  .option("--json", "Output as JSON")
  .addHelpText("after", `
Examples:
  recoup research audience "Drake"
  recoup research audience "Drake" --platform tiktok
  recoup research audience "Drake" --platform youtube --json`)
  .action(async (artist, opts) => {
    try {
      const data = await get("/api/research/audience", { artist, platform: opts.platform });
      if (opts.json) return printJson(data);
      printJson(data);
    } catch (err) { printError((err as Error).message); }
  });

const citiesCommand = new Command("cities")
  .description("Top cities by listener concentration")
  .argument("<artist>", "Artist name or Recoup ID")
  .option("--json", "Output as JSON")
  .addHelpText("after", `
Examples:
  recoup research cities "Drake"
  recoup research cities "Drake" --json`)
  .action(async (artist, opts) => {
    try {
      const data = await get("/api/research/cities", { artist });
      const cities = (data.cities as Record<string, unknown>[]) || [];
      if (opts.json) return printJson(cities);
      printTable(cities, [
        { key: "name", label: "CITY" },
        { key: "country", label: "COUNTRY" },
        { key: "listeners", label: "LISTENERS" },
      ]);
    } catch (err) { printError((err as Error).message); }
  });

const similarCommand = new Command("similar")
  .description("Find similar artists for competitive analysis")
  .argument("<artist>", "Artist name or Recoup ID")
  .option("--audience <level>", "high, medium, low")
  .option("--genre <level>", "high, medium, low")
  .option("--mood <level>", "high, medium, low")
  .option("--musicality <level>", "high, medium, low")
  .option("--limit <n>", "Max results", "10")
  .option("--json", "Output as JSON")
  .addHelpText("after", `
Examples:
  recoup research similar "Drake"
  recoup research similar "Drake" --audience high --genre high --limit 20
  recoup research similar "Drake" --musicality high --json`)
  .action(async (artist, opts) => {
    try {
      const params: Record<string, string> = { artist, limit: opts.limit };
      if (opts.audience) params.audience = opts.audience;
      if (opts.genre) params.genre = opts.genre;
      if (opts.mood) params.mood = opts.mood;
      if (opts.musicality) params.musicality = opts.musicality;
      const data = await get("/api/research/similar", params);
      const artists = (data.artists as Record<string, unknown>[]) || [];
      if (opts.json) return printJson(artists);
      printTable(artists, [
        { key: "name", label: "NAME" },
        { key: "career_stage", label: "STAGE" },
        { key: "recent_momentum", label: "MOMENTUM" },
        { key: "sp_monthly_listeners", label: "LISTENERS" },
      ]);
    } catch (err) { printError((err as Error).message); }
  });

const urlsCommand = new Command("urls")
  .description("All social and streaming links")
  .argument("<artist>", "Artist name or Recoup ID")
  .option("--json", "Output as JSON")
  .addHelpText("after", `
Examples:
  recoup research urls "Drake"
  recoup research urls "Drake" --json`)
  .action(async (artist, opts) => {
    try {
      const data = await get("/api/research/urls", { artist });
      if (opts.json) return printJson(data);
      printJson(data);
    } catch (err) { printError((err as Error).message); }
  });

const instagramPostsCommand = new Command("instagram-posts")
  .description("Top Instagram posts and reels by engagement")
  .argument("<artist>", "Artist name or Recoup ID")
  .option("--json", "Output as JSON")
  .addHelpText("after", `
Examples:
  recoup research instagram-posts "Drake"
  recoup research instagram-posts "Drake" --json`)
  .action(async (artist, opts) => {
    try {
      const data = await get("/api/research/instagram-posts", { artist });
      if (opts.json) return printJson(data);
      printJson(data);
    } catch (err) { printError((err as Error).message); }
  });

const playlistsCommand = new Command("playlists")
  .description("Playlist placements across platforms")
  .argument("<artist>", "Artist name or Recoup ID")
  .option("--platform <p>", "spotify, applemusic, deezer, amazon, youtube", "spotify")
  .option("--status <s>", "current or past", "current")
  .option("--editorial", "Only editorial playlists")
  .option("--since <date>", "Filter by date (YYYY-MM-DD)")
  .option("--sort <field>", "Sort field (e.g., followers)")
  .option("--limit <n>", "Max results", "20")
  .option("--json", "Output as JSON")
  .addHelpText("after", `
Examples:
  recoup research playlists "Drake"
  recoup research playlists "Drake" --editorial --sort followers
  recoup research playlists "Drake" --status past --since 2025-01-01
  recoup research playlists "Drake" --platform applemusic --json`)
  .action(async (artist, opts) => {
    try {
      const params: Record<string, string> = { artist, platform: opts.platform, status: opts.status, limit: opts.limit };
      if (opts.editorial) params.editorial = "true";
      if (opts.since) params.since = opts.since;
      if (opts.sort) params.sort = opts.sort;
      const data = await get("/api/research/playlists", params);
      const placements = (data.placements as Record<string, unknown>[]) || [];
      if (opts.json) return printJson(placements);
      printJson(placements);
    } catch (err) { printError((err as Error).message); }
  });

const albumsCommand = new Command("albums")
  .description("Full discography")
  .argument("<artist>", "Artist name or Recoup ID")
  .option("--json", "Output as JSON")
  .addHelpText("after", `
Examples:
  recoup research albums "Drake"
  recoup research albums "Drake" --json`)
  .action(async (artist, opts) => {
    try {
      const data = await get("/api/research/albums", { artist });
      const albums = (data.albums as Record<string, unknown>[]) || [];
      if (opts.json) return printJson(albums);
      printTable(albums, [
        { key: "name", label: "ALBUM" },
        { key: "release_date", label: "RELEASED" },
      ]);
    } catch (err) { printError((err as Error).message); }
  });

const tracksCommand = new Command("tracks")
  .description("All tracks with popularity")
  .argument("<artist>", "Artist name or Recoup ID")
  .option("--json", "Output as JSON")
  .addHelpText("after", `
Examples:
  recoup research tracks "Drake"
  recoup research tracks "Drake" --json`)
  .action(async (artist, opts) => {
    try {
      const data = await get("/api/research/tracks", { artist });
      const tracks = (data.tracks as Record<string, unknown>[]) || [];
      if (opts.json) return printJson(tracks);
      printTable(tracks, [
        { key: "name", label: "TRACK" },
        { key: "id", label: "ID" },
      ]);
    } catch (err) { printError((err as Error).message); }
  });

const careerCommand = new Command("career")
  .description("Career timeline and milestones")
  .argument("<artist>", "Artist name or Recoup ID")
  .option("--json", "Output as JSON")
  .addHelpText("after", `
Examples:
  recoup research career "Drake"
  recoup research career "Drake" --json`)
  .action(async (artist, opts) => {
    try {
      const data = await get("/api/research/career", { artist });
      if (opts.json) return printJson(data);
      printJson(data);
    } catch (err) { printError((err as Error).message); }
  });

const insightsCommand = new Command("insights")
  .description("AI-generated observations and trends")
  .argument("<artist>", "Artist name or Recoup ID")
  .option("--json", "Output as JSON")
  .addHelpText("after", `
Examples:
  recoup research insights "Drake"
  recoup research insights "Drake" --json`)
  .action(async (artist, opts) => {
    try {
      const data = await get("/api/research/insights", { artist });
      const insights = (data.insights as Record<string, unknown>[]) || [];
      if (opts.json) return printJson(insights);
      for (const i of insights) {
        const text = (i as Record<string, unknown>).insight || (i as Record<string, unknown>).text || JSON.stringify(i);
        console.log(`  • ${String(text).substring(0, 120)}`);
      }
    } catch (err) { printError((err as Error).message); }
  });

const lookupCommand = new Command("lookup")
  .description("Find artist by Spotify URL or platform ID")
  .argument("<url>", "Spotify URL or platform ID")
  .option("--json", "Output as JSON")
  .addHelpText("after", `
Examples:
  recoup research lookup "https://open.spotify.com/artist/3TVXtAsR1Inumwj472S9r4"
  recoup research lookup "3TVXtAsR1Inumwj472S9r4" --json`)
  .action(async (url, opts) => {
    try {
      const data = await get("/api/research/lookup", { url });
      if (opts.json) return printJson(data);
      printJson(data);
    } catch (err) { printError((err as Error).message); }
  });

const trackCommand = new Command("track")
  .description("Track metadata by name or Spotify URL")
  .argument("<query>", "Track name or Spotify URL")
  .option("--json", "Output as JSON")
  .addHelpText("after", `
Examples:
  recoup research track "God's Plan"
  recoup research track "https://open.spotify.com/track/..." --json`)
  .action(async (query, opts) => {
    try {
      const data = await get("/api/research/track", { q: query });
      if (opts.json) return printJson(data);
      printJson(data);
    } catch (err) { printError((err as Error).message); }
  });

const playlistCommand = new Command("playlist")
  .description("Playlist metadata")
  .argument("<platform>", "spotify, applemusic, deezer, amazon, youtube")
  .argument("<id>", "Playlist ID")
  .option("--json", "Output as JSON")
  .addHelpText("after", `
Examples:
  recoup research playlist spotify 1645080
  recoup research playlist spotify 1645080 --json`)
  .action(async (platform, id, opts) => {
    try {
      const data = await get("/api/research/playlist", { platform, id });
      if (opts.json) return printJson(data);
      printJson(data);
    } catch (err) { printError((err as Error).message); }
  });

const curatorCommand = new Command("curator")
  .description("Curator profile")
  .argument("<platform>", "spotify, applemusic, deezer, amazon, youtube")
  .argument("<id>", "Curator ID")
  .option("--json", "Output as JSON")
  .addHelpText("after", `
Examples:
  recoup research curator spotify 1
  recoup research curator spotify 1 --json`)
  .action(async (platform, id, opts) => {
    try {
      const data = await get("/api/research/curator", { platform, id });
      if (opts.json) return printJson(data);
      printJson(data);
    } catch (err) { printError((err as Error).message); }
  });

const discoverCommand = new Command("discover")
  .description("Discover artists by criteria")
  .option("--country <code>", "ISO country code (US, BR, GB)")
  .option("--genre <id>", "Genre ID (use 'recoup research genres' to list)")
  .option("--spotify-listeners <range>", "min,max monthly listeners (e.g., 100000,500000)")
  .option("--tiktok-followers <range>", "min,max followers")
  .option("--sort <field>", "Sort field")
  .option("--limit <n>", "Max results", "20")
  .option("--json", "Output as JSON")
  .addHelpText("after", `
Examples:
  recoup research discover --country US --spotify-listeners 100000,500000
  recoup research discover --genre 86 --sort weekly_diff.sp_monthly_listeners
  recoup research discover --tiktok-followers 1000000,10000000 --spotify-listeners 0,100000`)
  .action(async (opts) => {
    try {
      const params: Record<string, string> = { limit: opts.limit };
      if (opts.country) params.country = opts.country;
      if (opts.genre) params.genre = opts.genre;
      if (opts.sort) params.sort = opts.sort;
      if (opts.spotifyListeners) {
        const [min, max] = opts.spotifyListeners.split(",");
        if (min) params.sp_monthly_listeners_min = min;
        if (max) params.sp_monthly_listeners_max = max;
      }
      const data = await get("/api/research/discover", params);
      const artists = (data.artists as Record<string, unknown>[]) || [];
      if (opts.json) return printJson(artists);
      printTable(artists, [
        { key: "name", label: "NAME" },
        { key: "sp_monthly_listeners", label: "LISTENERS" },
        { key: "country", label: "COUNTRY" },
      ]);
    } catch (err) { printError((err as Error).message); }
  });

const genresCommand = new Command("genres")
  .description("List all genre IDs and names")
  .option("--json", "Output as JSON")
  .addHelpText("after", `
Examples:
  recoup research genres
  recoup research genres --json`)
  .action(async (opts) => {
    try {
      const data = await get("/api/research/genres");
      const genres = (data.genres as Record<string, unknown>[]) || [];
      if (opts.json) return printJson(genres);
      printTable(genres, [
        { key: "name", label: "GENRE" },
        { key: "id", label: "ID" },
      ]);
    } catch (err) { printError((err as Error).message); }
  });

const festivalsCommand = new Command("festivals")
  .description("List music festivals")
  .option("--json", "Output as JSON")
  .addHelpText("after", `
Examples:
  recoup research festivals
  recoup research festivals --json`)
  .action(async (opts) => {
    try {
      const data = await get("/api/research/festivals");
      const festivals = (data.festivals as Record<string, unknown>[]) || [];
      if (opts.json) return printJson(festivals);
      printTable(festivals, [
        { key: "name", label: "FESTIVAL" },
        { key: "city", label: "CITY" },
        { key: "country", label: "COUNTRY" },
      ]);
    } catch (err) { printError((err as Error).message); }
  });

const webCommand = new Command("web")
  .description("Web search for real-time information")
  .argument("<query>", "Search query")
  .option("--max-results <n>", "Max results", "10")
  .option("--country <code>", "ISO country code")
  .option("--json", "Output as JSON")
  .addHelpText("after", `
Examples:
  recoup research web "Drake brand partnerships sync licensing"
  recoup research web "Drake fan community" --max-results 5
  recoup research web "indie R&B trends 2026" --json`)
  .action(async (query, opts) => {
    try {
      const maxResults = parseInt(opts.maxResults, 10);
      if (Number.isNaN(maxResults) || maxResults < 1) {
        printError("--max-results must be a positive number");
        return;
      }
      const body: Record<string, unknown> = { query, max_results: maxResults };
      if (opts.country) body.country = opts.country;
      const data = await post("/api/research/web", body);
      const results = (data.results as Record<string, unknown>[]) || [];
      if (opts.json) return printJson(results);
      for (const r of results) {
        console.log(`  ${r.title}`);
        console.log(`  ${r.url}`);
        console.log(`  ${String(r.snippet || "").substring(0, 120)}`);
        console.log();
      }
    } catch (err) { printError((err as Error).message); }
  });

const deepCommand = new Command("deep")
  .description("Deep web research with citations (uses Perplexity deep-research)")
  .argument("<query>", "Research query")
  .option("--json", "Output as JSON")
  .addHelpText("after", `
Examples:
  recoup research deep "Tell me everything about Drake"
  recoup research deep "Competitive landscape for independent R&B artists in 2026" --json`)
  .action(async (query, opts) => {
    try {
      const data = await post("/api/research/deep", { query });
      if (opts.json) return printJson(data);
      console.log(data.content);
      const citations = (data.citations as string[]) || [];
      if (citations.length > 0) {
        console.log("\nCitations:");
        citations.forEach((c, i) => console.log(`  [${i + 1}] ${c}`));
      }
    } catch (err) { printError((err as Error).message); }
  });

const peopleCommand = new Command("people")
  .description("Search for people in the music industry")
  .argument("<query>", "Search query (e.g., 'A&R reps at Atlantic Records')")
  .option("--num-results <n>", "Max results", "10")
  .option("--json", "Output as JSON")
  .addHelpText("after", `
Examples:
  recoup research people "A&R reps at Atlantic Records"
  recoup research people "music managers in Los Angeles R&B"
  recoup research people "Drake manager" --json`)
  .action(async (query, opts) => {
    try {
      const numResults = parseInt(opts.numResults, 10);
      if (Number.isNaN(numResults) || numResults < 1) {
        printError("--num-results must be a positive number");
        return;
      }
      const data = await post("/api/research/people", { query, num_results: numResults });
      const results = (data.results as Record<string, unknown>[]) || [];
      if (opts.json) return printJson(results);
      for (const r of results) {
        console.log(`  ${r.title}`);
        console.log(`  ${r.url}`);
        if (r.summary) console.log(`  ${String(r.summary).substring(0, 120)}`);
        console.log();
      }
    } catch (err) { printError((err as Error).message); }
  });

const extractCommand = new Command("extract")
  .description("Extract clean markdown from URLs")
  .argument("<urls...>", "URLs to extract (max 10)")
  .option("--objective <text>", "What information to focus on")
  .option("--full-content", "Return full page instead of excerpts")
  .option("--json", "Output as JSON")
  .addHelpText("after", `
Examples:
  recoup research extract "https://en.wikipedia.org/wiki/Drake_(musician)"
  recoup research extract "https://example.com/page" --objective "funding and investors"
  recoup research extract "https://a.com" "https://b.com" --full-content --json`)
  .action(async (urls, opts) => {
    try {
      const body: Record<string, unknown> = { urls };
      if (opts.objective) body.objective = opts.objective;
      if (opts.fullContent) body.full_content = true;
      const data = await post("/api/research/extract", body);
      const results = (data.results as Record<string, unknown>[]) || [];
      if (opts.json) return printJson(results);
      for (const r of results) {
        console.log(`--- ${r.title || r.url} ---`);
        const excerpts = (r.excerpts as string[]) || [];
        const content = r.full_content as string | undefined;
        if (content) {
          console.log(content);
        } else {
          for (const e of excerpts) console.log(e);
        }
        console.log();
      }
    } catch (err) { printError((err as Error).message); }
  });

const enrichCommand = new Command("enrich")
  .description("Structured data enrichment from web research")
  .argument("<input>", "What to research (e.g., 'Drake rapper')")
  .requiredOption("--schema <json>", "JSON schema for output fields")
  .option("--processor <tier>", "base (fast), core (balanced), ultra (deep)", "base")
  .option("--json", "Output as JSON")
  .addHelpText("after", `
Examples:
  recoup research enrich "Drake rapper" --schema '{"properties":{"real_name":{"type":"string"},"label":{"type":"string"},"hometown":{"type":"string"}}}'
  recoup research enrich "Atlantic Records" --schema '{"properties":{"ceo":{"type":"string"},"artists":{"type":"array","items":{"type":"string"}}}}' --processor core`)
  .action(async (input, opts) => {
    try {
      let schema: Record<string, unknown>;
      try { schema = JSON.parse(opts.schema); } catch { printError("--schema must be valid JSON"); return; }
      const data = await post("/api/research/enrich", { input, schema, processor: opts.processor });
      if (opts.json) return printJson(data);
      printJson(data.output);
    } catch (err) { printError((err as Error).message); }
  });

const milestonesCommand = new Command("milestones")
  .description("Artist activity feed — playlist adds, chart entries, notable events")
  .argument("<artist>", "Artist name or Recoup ID")
  .option("--json", "Output as JSON")
  .addHelpText("after", `
Examples:
  recoup research milestones "Drake"
  recoup research milestones "Drake" --json`)
  .action(async (artist, opts) => {
    try {
      const data = await get("/api/research/milestones", { artist });
      const milestones = (data.milestones as Record<string, unknown>[]) || [];
      if (opts.json) return printJson(milestones);
      printTable(milestones, [
        { key: "date", label: "DATE" },
        { key: "summary", label: "EVENT" },
        { key: "platform", label: "PLATFORM" },
        { key: "track_name", label: "TRACK" },
        { key: "stars", label: "STARS" },
      ]);
    } catch (err) { printError((err as Error).message); }
  });

const venuesCommand = new Command("venues")
  .description("Venues the artist has performed at")
  .argument("<artist>", "Artist name or Recoup ID")
  .option("--json", "Output as JSON")
  .addHelpText("after", `
Examples:
  recoup research venues "Drake"
  recoup research venues "Drake" --json`)
  .action(async (artist, opts) => {
    try {
      const data = await get("/api/research/venues", { artist });
      const venues = (data.venues as Record<string, unknown>[]) || [];
      if (opts.json) return printJson(venues);
      printTable(venues, [
        { key: "venue_name", label: "VENUE" },
        { key: "venue_capacity", label: "CAPACITY" },
        { key: "city_name", label: "CITY" },
        { key: "country", label: "COUNTRY" },
      ]);
    } catch (err) { printError((err as Error).message); }
  });

const rankCommand = new Command("rank")
  .description("Global artist ranking")
  .argument("<artist>", "Artist name or Recoup ID")
  .option("--json", "Output as JSON")
  .addHelpText("after", `
Examples:
  recoup research rank "Drake"
  recoup research rank "Drake" --json`)
  .action(async (artist, opts) => {
    try {
      const data = await get("/api/research/rank", { artist });
      if (opts.json) return printJson(data);
      console.log(`Global rank: ${data.rank ?? "N/A"}`);
    } catch (err) { printError((err as Error).message); }
  });

const chartsCommand = new Command("charts")
  .description("Global chart positions by platform")
  .requiredOption("--platform <name>", "Chart platform: spotify, applemusic, tiktok, youtube, itunes, shazam")
  .option("--country <code>", "ISO country code (US, GB, DE)")
  .option("--interval <interval>", "Time interval (daily, weekly)")
  .option("--type <type>", "Chart type (varies by platform)")
  .option("--json", "Output as JSON")
  .addHelpText("after", `
Examples:
  recoup research charts --platform spotify
  recoup research charts --platform spotify --country US --json
  recoup research charts --platform applemusic --country GB --interval weekly`)
  .action(async (opts) => {
    try {
      const params: Record<string, string> = { platform: opts.platform };
      if (opts.country) params.country = opts.country;
      if (opts.interval) params.interval = opts.interval;
      if (opts.type) params.type = opts.type;
      const data = await get("/api/research/charts", params);
      if (opts.json) return printJson(data);
      printJson(data);
    } catch (err) { printError((err as Error).message); }
  });

const radioCommand = new Command("radio")
  .description("List radio stations")
  .option("--json", "Output as JSON")
  .addHelpText("after", `
Examples:
  recoup research radio
  recoup research radio --json`)
  .action(async (opts) => {
    try {
      const data = await get("/api/research/radio");
      const stations = (data.stations as Record<string, unknown>[]) || [];
      if (opts.json) return printJson(stations);
      printJson(stations);
    } catch (err) { printError((err as Error).message); }
  });

// Register all subcommands
searchCommand.addCommand(profileCommand);
searchCommand.addCommand(metricsCommand);
searchCommand.addCommand(audienceCommand);
searchCommand.addCommand(citiesCommand);
searchCommand.addCommand(similarCommand);
searchCommand.addCommand(urlsCommand);
searchCommand.addCommand(instagramPostsCommand);
searchCommand.addCommand(playlistsCommand);
searchCommand.addCommand(albumsCommand);
searchCommand.addCommand(tracksCommand);
searchCommand.addCommand(careerCommand);
searchCommand.addCommand(insightsCommand);
searchCommand.addCommand(lookupCommand);
searchCommand.addCommand(trackCommand);
searchCommand.addCommand(playlistCommand);
searchCommand.addCommand(curatorCommand);
searchCommand.addCommand(discoverCommand);
searchCommand.addCommand(genresCommand);
searchCommand.addCommand(festivalsCommand);
searchCommand.addCommand(webCommand);
searchCommand.addCommand(deepCommand);
searchCommand.addCommand(peopleCommand);
searchCommand.addCommand(extractCommand);
searchCommand.addCommand(enrichCommand);
searchCommand.addCommand(milestonesCommand);
searchCommand.addCommand(venuesCommand);
searchCommand.addCommand(rankCommand);
searchCommand.addCommand(chartsCommand);
searchCommand.addCommand(radioCommand);

export const researchCommand = searchCommand;
