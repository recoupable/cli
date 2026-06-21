/* E2E: runs the real built CLI binary with a preloaded fetch stub (no sockets).
 * Verifies method+path+x-api-key per command, and fast-fail validation. */
const path = require("node:path");
const fs = require("node:fs");
const { spawnSync } = require("node:child_process");

const ROOT = path.join(__dirname, "..");
const BIN = path.join(ROOT, "dist", "bin.cjs");
const STUB = path.join(__dirname, "fetch-stub.cjs");
const LOG = "/tmp/e2e-requests.log";

const cases = require("./cases.cjs");

function run(args) {
  fs.writeFileSync(LOG, "");
  const env = { ...process.env, RECOUP_API_KEY: "test-key", E2E_LOG: LOG };
  const r = spawnSync("node", ["--require", STUB, BIN, ...args], {
    env, input: "", encoding: "utf8", timeout: 15000,
  });
  const log = fs.readFileSync(LOG, "utf8").trim();
  const reqs = log ? log.split("\n").map((l) => JSON.parse(l)) : [];
  return { code: r.status, stdout: r.stdout || "", stderr: r.stderr || "", reqs };
}

let pass = 0, fail = 0;
const rows = [];
for (const [name, args, m, p, expectOk] of cases) {
  const { code, stdout, stderr, reqs } = run(args);
  let ok = true, note = "";
  if (expectOk) {
    if (code !== 0) { ok = false; note = `exit ${code}: ${stderr.trim().slice(0, 50)}`; }
    else if (reqs.length === 0) { ok = false; note = "no request made"; }
    else {
      const req = reqs[reqs.length - 1];
      if (req.method !== m) { ok = false; note = `method ${req.method}!=${m}`; }
      else if (req.path !== p) { ok = false; note = `path ${req.path}!=${p}`; }
      else if (req.apiKey !== "test-key") { ok = false; note = "missing x-api-key"; }
      else note = `${req.method} ${req.path}  out:${stdout.trim().split("\n")[0].slice(0, 22)}`;
    }
  } else {
    // Accept both runAction's "Error:" and Commander's built-in "error:" — both
    // are correct fast-fails (non-zero exit, no network call made).
    if (code === 0) { ok = false; note = "expected failure, exit 0"; }
    else if (!/error:/i.test(stderr)) { ok = false; note = `no error msg (${stderr.slice(0, 30)})`; }
    else if (reqs.length > 0) { ok = false; note = "made network call before validating"; }
    else note = "fast-fail: " + stderr.trim().split("\n")[0].replace(/^error:\s*/i, "").slice(0, 46);
  }
  rows.push([ok ? "PASS" : "FAIL", name, note]);
  ok ? pass++ : fail++;
}
const w = Math.max(...rows.map((x) => x[1].length));
const out = rows.map(([s, n, note]) => `${s}  ${n.padEnd(w)}  ${note}`).join("\n") + `\n\n${pass}/${pass + fail} passed, ${fail} failed`;
fs.writeFileSync("/tmp/e2e-report.txt", out + "\n");
process.stdout.write(out + "\n");
process.exit(fail ? 1 : 0);
