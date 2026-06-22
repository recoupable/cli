import { Command } from "commander";
import { get, post, patch, del } from "../client.js";
import { printJson, printTable } from "../output.js";
import { runAction, emit } from "../runAction.js";

const listCommand = new Command("list")
  .description("List artists for the current account")
  .option("--json", "Output as JSON")
  .option("--org <orgId>", "Filter by organization ID")
  .option("--account <accountId>", "Filter by account ID (org keys only)")
  .action(
    runAction(async (opts) => {
      const params: Record<string, string> = {};
      if (opts.org) params.org_id = opts.org;
      if (opts.account) params.account_id = opts.account;
      const data = await get("/api/artists", params);
      const artists = (data.artists as Record<string, unknown>[]) || [];
      emit(opts, artists, () =>
        printTable(artists, [
          { key: "account_id", label: "ID" },
          { key: "name", label: "NAME" },
          { key: "label", label: "LABEL" },
        ]),
      );
    }),
  );

const createCommand = new Command("create")
  .description("Create a new artist")
  .requiredOption("--name <name>", "Artist name")
  .option("--org <orgId>", "Link the artist to an organization")
  .option("--account <accountId>", "Account ID override (org keys only)")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const body: Record<string, unknown> = { name: opts.name };
      if (opts.org) body.organization_id = opts.org;
      if (opts.account) body.account_id = opts.account;
      const data = await post("/api/artists", body);
      const artist = (data.artist as Record<string, unknown>) || {};
      emit(opts, artist, () =>
        console.log(`Created artist: ${artist.account_id ?? artist.id}`),
      );
    }),
  );

const updateCommand = new Command("update")
  .description("Update an artist's profile")
  .argument("<id>", "Artist account ID")
  .option("--name <name>", "Artist name")
  .option("--image <url>", "Profile image URL (empty string clears it)")
  .option("--instruction <text>", "Custom AI instruction")
  .option("--label <label>", "Record label")
  .option("--pinned", "Pin the artist")
  .option("--no-pinned", "Unpin the artist")
  .option(
    "--profile-urls <json>",
    'JSON object of social profile URLs, e.g. \'{"spotify":"https://..."}\'',
  )
  .option("--json", "Output as JSON")
  .action(
    runAction(async (id, opts) => {
      const body: Record<string, unknown> = {};
      if (opts.name !== undefined) body.name = opts.name;
      if (opts.image !== undefined) body.image = opts.image;
      if (opts.instruction !== undefined) body.instruction = opts.instruction;
      if (opts.label !== undefined) body.label = opts.label;
      if (opts.pinned !== undefined) body.pinned = opts.pinned;
      if (opts.profileUrls) body.profileUrls = JSON.parse(opts.profileUrls);

      if (Object.keys(body).length === 0) {
        throw new Error(
          "Provide at least one field to update, e.g. artists update <id> --name 'New Name'",
        );
      }

      const data = await patch(`/api/artists/${id}`, body);
      emit(opts, data.artist ?? data, () =>
        console.log(`Updated artist: ${id}`),
      );
    }),
  );

const deleteCommand = new Command("delete")
  .description("Delete an artist")
  .argument("<id>", "Artist account ID")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (id, opts) => {
      const data = await del(`/api/artists/${id}`);
      emit(opts, data, () => console.log(`Deleted artist: ${id}`));
    }),
  );

function paginatedListCommand(
  name: string,
  path: (id: string) => string,
  key: string,
  columns: { key: string; label: string }[],
): Command {
  return new Command(name)
    .description(`List ${name} for an artist`)
    .argument("<id>", "Artist account ID")
    .option("--page <n>", "Page number (default 1)")
    .option("--limit <n>", "Results per page (default 20, max 100)")
    .option("--json", "Output as JSON")
    .action(
      runAction(async (id, opts) => {
        const params: Record<string, string> = {};
        if (opts.page) params.page = String(opts.page);
        if (opts.limit) params.limit = String(opts.limit);
        const data = await get(path(id), params);
        const rows = (data[key] as Record<string, unknown>[]) || [];
        emit(opts, data, () => {
          printTable(rows, columns);
          const p = data.pagination as Record<string, unknown> | undefined;
          if (p) {
            console.log(
              `\nPage ${p.page}/${p.total_pages} (${p.total_count} total)`,
            );
          }
        });
      }),
    );
}

const fansCommand = paginatedListCommand(
  "fans",
  (id) => `/api/artists/${id}/fans`,
  "fans",
  [
    { key: "username", label: "USERNAME" },
    { key: "region", label: "REGION" },
    { key: "follower_count", label: "FOLLOWERS" },
  ],
);

const postsCommand = paginatedListCommand(
  "posts",
  (id) => `/api/artists/${id}/posts`,
  "posts",
  [
    { key: "post_url", label: "URL" },
    { key: "type", label: "TYPE" },
    { key: "updated_at", label: "UPDATED" },
  ],
);

const socialsCommand = paginatedListCommand(
  "socials",
  (id) => `/api/artists/${id}/socials`,
  "socials",
  [
    { key: "id", label: "ID" },
    { key: "username", label: "USERNAME" },
    { key: "profile_url", label: "PROFILE" },
  ],
);

const scrapeCommand = new Command("scrape")
  .description("Trigger a scrape of an artist's social profiles")
  .requiredOption("--artist <id>", "Artist account ID")
  .option("--json", "Output as JSON")
  .action(
    runAction(async (opts) => {
      const data = await post("/api/artist/socials/scrape", {
        artist_account_id: opts.artist,
      });
      emit(opts, data, () => printJson(data));
    }),
  );

export const artistsCommand = new Command("artists")
  .description("Manage artists and view their fans, posts, and socials")
  .addCommand(listCommand)
  .addCommand(createCommand)
  .addCommand(updateCommand)
  .addCommand(deleteCommand)
  .addCommand(fansCommand)
  .addCommand(postsCommand)
  .addCommand(socialsCommand)
  .addCommand(scrapeCommand)
  .addHelpText(
    "after",
    `
Examples:
  recoup artists list
  recoup artists create --name "Daft Punk"
  recoup artists update <id> --label "Columbia" --pinned
  recoup artists fans <id> --limit 50
  recoup artists scrape --artist <id>
`,
  );
