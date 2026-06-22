import { Command } from "commander";
import { get, post, del } from "../client.js";
import { printJson, printTable } from "../output.js";
import { runAction, emit } from "../runAction.js";
import { parseJsonFlag, valueOrStdin } from "../stdin.js";

const createCommand = new Command("create")
  .description("Create a catalog (optionally seeded from a playcount snapshot)")
  .option("--name <name>", "Catalog name")
  .option("--snapshot <id>", "Playcount snapshot ID to materialize from")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      if (!opts.name && !opts.snapshot) {
        throw new Error("Provide --name and/or --snapshot");
      }
      const body: Record<string, unknown> = {};
      if (opts.name) body.name = opts.name;
      if (opts.snapshot) body.snapshot = opts.snapshot;
      const data = await post("/api/catalogs", body);
      const catalog = (data.catalog as Record<string, unknown>) || {};
      emit(opts, data, () =>
        console.log(
          `Created catalog: ${catalog.id} (${data.songs_added ?? 0} songs added)`,
        ),
      );
    }),
  );

const songsCommand = new Command("songs")
  .description("List songs in a catalog")
  .requiredOption("--catalog <id>", "Catalog ID")
  .option("--artist-name <name>", "Filter by artist name")
  .option("--page <n>", "Page number (default 1)")
  .option("--limit <n>", "Results per page (default 20, max 100)")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const params: Record<string, string> = { catalog_id: opts.catalog };
      if (opts.artistName) params.artistName = opts.artistName;
      if (opts.page) params.page = String(opts.page);
      if (opts.limit) params.limit = String(opts.limit);
      const data = await get("/api/catalogs/songs", params);
      const songs = (data.songs as Record<string, unknown>[]) || [];
      emit(opts, data, () =>
        printTable(songs, [
          { key: "isrc", label: "ISRC" },
          { key: "name", label: "NAME" },
          { key: "album", label: "ALBUM" },
        ]),
      );
    }),
  );

const addSongsCommand = new Command("add-songs")
  .description("Add songs to a catalog")
  .requiredOption("--catalog <id>", "Catalog ID")
  .option(
    "--songs <json>",
    'JSON array of songs, e.g. \'[{"isrc":"US...","name":"Track"}]\' (or stdin)',
  )
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const raw = await valueOrStdin(opts.songs);
      if (!raw) throw new Error("Provide --songs <json> or pipe it via stdin");
      const songs = parseJsonFlag(raw, "--songs") as Record<string, unknown>[];
      const withCatalog = songs.map((s) => ({ catalog_id: opts.catalog, ...s }));
      const data = await post("/api/catalogs/songs", { songs: withCatalog });
      emit(opts, data, () =>
        console.log(`Catalog now has ${(data.songs as unknown[])?.length ?? 0} songs`),
      );
    }),
  );

const removeSongsCommand = new Command("remove-songs")
  .description("Remove songs from a catalog by ISRC")
  .requiredOption("--catalog <id>", "Catalog ID")
  .requiredOption(
    "--isrc <isrc>",
    "ISRC to remove (repeatable)",
    (val: string, prev: string[]) => prev.concat(val),
    [] as string[],
  )
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const songs = (opts.isrc as string[]).map((isrc) => ({
        catalog_id: opts.catalog,
        isrc,
      }));
      const data = await del("/api/catalogs/songs", { songs });
      emit(opts, data, () => printJson(data.songs ?? data));
    }),
  );

export const catalogsCommand = new Command("catalogs")
  .description("Manage song catalogs")
  .addCommand(createCommand)
  .addCommand(songsCommand)
  .addCommand(addSongsCommand)
  .addCommand(removeSongsCommand)
  .addHelpText(
    "after",
    `
Examples:
  recoup catalogs create --name "2024 Releases"
  recoup catalogs songs --catalog <id>
  recoup catalogs add-songs --catalog <id> --songs '[{"isrc":"USUM71807100","name":"Track"}]'
  recoup catalogs remove-songs --catalog <id> --isrc USUM71807100
`,
  );
