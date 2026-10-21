const { appendFileSync } = require("node:fs");

globalThis.fetch = async (input, options = {}) => {
  const url = new URL(String(input));
  if (url.origin !== "https://cli-fixture.invalid") {
    throw new Error("Unexpected fixture origin");
  }
  appendFileSync(process.env.CLI_FIXTURE_REQUEST_LOG, JSON.stringify({
    method: options.method,
    path: url.pathname,
    body: options.body ? JSON.parse(options.body) : null,
  }) + "\n");
  return new Response(JSON.stringify({
    message: "Synthetic email response",
    response: "Synthetic analysis response",
    elapsed_seconds: 0,
    presets: [],
  }), { status: 200, headers: { "Content-Type": "application/json" } });
};
