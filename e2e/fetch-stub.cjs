/* Preloaded via `node --require`. Replaces global.fetch so the real CLI binary
 * runs end-to-end without any network. Logs each request to E2E_LOG. */
const fs = require("node:fs");
const LOG = process.env.E2E_LOG;

function canned(p) {
  const base = { status: "success" };
  if (p === "/api/accounts/id") return { accountId: "acc_test" };
  if (/^\/api\/accounts\/[^/]+\/credits$/.test(p)) return { remaining_credits: 50, used_credits: 10, total_credits: 60, is_pro: true };
  if (/^\/api\/accounts\/[^/]+\/subscription$/.test(p)) return { isPro: true, status: "active", plan: "pro", source: "account" };
  if (/^\/api\/accounts\/[^/]+\/catalogs$/.test(p)) return { ...base, catalogs: [] };
  if (/^\/api\/accounts\/[^/]+$/.test(p)) return { ...base, account: { account_id: "acc_test", name: "Test" } };
  if (p === "/api/accounts") return { data: { account_id: "acc_test", name: "Test" } };
  if (p === "/api/artists") return { ...base, artists: [{ account_id: "a1", name: "Daft Punk", label: "Columbia" }], artist: { account_id: "a1" } };
  if (/^\/api\/artists\/[^/]+\/fans$/.test(p)) return { ...base, fans: [], pagination: { page: 1, total_pages: 1, total_count: 0 } };
  if (/^\/api\/artists\/[^/]+$/.test(p)) return { ...base, artist: { account_id: "a1" }, success: true, artistId: "a1" };
  if (p === "/api/artist/socials/scrape") return [{ runId: "r1" }];
  if (p === "/api/chats") return { ...base, chats: [{ id: "c1", topic: "T", updated_at: "2026-06-21" }], chat: { id: "c1" } };
  if (/^\/api\/chats\/[^/]+\/messages$/.test(p)) return { data: [] };
  if (/^\/api\/chats\/[^/]+\/artist$/.test(p)) return { ...base, room_id: "c1", artist_id: "a1", artist_exists: true };
  if (p === "/api/chats/compact") return { chats: [{ chatId: "c1", compacted: true }] };
  if (p === "/api/chat/generate") return { ...base, text: "Generated answer.", roomId: "c1" };
  if (p === "/api/tasks") return { ...base, tasks: [{ id: "t1", title: "Daily", schedule: "0 9 * * *", enabled: true }] };
  if (p === "/api/tasks/runs") return { ...base, runs: [{ id: "run_1", status: "COMPLETED", createdAt: "2026-06-21" }] };
  if (p === "/api/pulses") return { ...base, pulses: [{ account_id: "acc_test", active: true }] };
  if (p === "/api/connectors") return { success: true, connectors: [{ slug: "googlesheets", connected: false }], data: { redirectUrl: "https://auth" } };
  if (p === "/api/connectors/actions") return { success: true, actions: [{ slug: "GMAIL_FETCH_EMAILS", connectorSlug: "gmail", isConnected: true }], result: { ok: true } };
  if (p === "/api/research") return { ...base, results: [{ id: "x", name: "Daft Punk" }] };
  if (p.startsWith("/api/research/")) return { ...base, content: "Deep answer", citations: [], results: [], tracks: [] };
  if (p.startsWith("/api/spotify/")) return { ...base, items: [] };
  if (p === "/api/songs") return { ...base, songs: [{ isrc: "US1", name: "Track", album: "Album" }] };
  if (p === "/api/songs/analyze/presets") return { ...base, presets: [{ name: "catalog_metadata", description: "x", requiresAudio: false, responseFormat: "json" }] };
  if (p === "/api/catalogs") return { ...base, catalog: { id: "cat1" }, songs_added: 3 };
  if (p === "/api/catalogs/songs") return { ...base, songs: [{ isrc: "US1", name: "Track", album: "Album" }] };
  if (p === "/api/ai/models") return { models: [{ id: "m1", name: "Model One" }] };
  if (p === "/api/organizations") return { ...base, organizations: [{ organization_id: "o1", organization_name: "Label" }], organization: { id: "o1" } };
  if (p === "/api/organizations/artists") return { ...base, id: "link1" };
  if (p === "/api/workspaces") return { workspace: { id: "w1", name: "Q1" } };
  if (p === "/api/agents/templates") return { ...base, templates: [{ id: "tpl1", title: "Recap", is_private: false, is_favourite: false }], template: { id: "tpl1" } };
  if (/^\/api\/agents\/templates\/[^/]+\/favorite$/.test(p)) return { ...base };
  if (/^\/api\/agents\/templates\/[^/]+$/.test(p)) return { ...base, template: { id: "tpl1" } };
  if (p === "/api/sandboxes") return { ...base, sandboxes: [{ sandboxId: "sb1", sandboxStatus: "running", createdAt: "2026-06-21" }] };
  if (p === "/api/sandboxes/file") return { ...base, content: "file contents\n" };
  if (p === "/api/sandboxes/files") return { ...base, uploaded: [{ path: "a.png", sha: "abc" }] };
  if (p === "/api/sandboxes/setup") return { ...base, runId: "setup1" };
  if (p === "/api/sessions") return { session: { id: "s1", title: "Build" }, chat: { id: "c1" } };
  if (/^\/api\/sessions\/[^/]+$/.test(p)) return { session: { id: "s1", title: "Build", status: "running" } };
  if (p === "/api/content/templates") return { ...base, templates: [{ name: "tpl", description: "d" }] };
  if (/^\/api\/content\/templates\/[^/]+$/.test(p)) return { id: "tpl", name: "tpl" };
  if (p === "/api/content/caption") return { content: "A great caption" };
  if (p === "/api/content/image") return { imageUrl: "https://img/1.png", images: ["https://img/1.png"] };
  if (p === "/api/content/transcribe") return { transcript: "hello world" };
  if (p === "/api/content") return { runId: "edit1", status: "triggered" };
  if (p === "/api/notifications") return { ...base, message: "Notification sent." };
  return base;
}

global.fetch = async (url, opts = {}) => {
  const u = new URL(url);
  fs.appendFileSync(
    LOG,
    JSON.stringify({
      method: opts.method || "GET",
      path: u.pathname,
      query: Object.fromEntries(u.searchParams.entries()),
      body: opts.body ? JSON.parse(opts.body) : null,
      apiKey: (opts.headers && (opts.headers["x-api-key"] || opts.headers["X-Api-Key"])) || null,
    }) + "\n",
  );
  const data = canned(u.pathname);
  return {
    ok: true,
    status: 200,
    text: async () => JSON.stringify(data),
    json: async () => data,
  };
};
