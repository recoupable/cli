# E2E smoke harness

Drives the **real built CLI binary** (`dist/bin.cjs`) end-to-end with a preloaded
`fetch` stub (`node --require ./e2e/fetch-stub.cjs`). No network or sockets — the
stub records each outbound request and returns canned JSON, so the test exercises
the genuine argument parsing, HTTP client (method/path/query/body + `x-api-key`),
output formatting, and fast-fail validation paths.

```bash
pnpm e2e        # builds, then runs e2e/run-stub.cjs
```

- `cases.cjs` — `[name, argv, expectedMethod, expectedPath, expectOk]` matrix
  covering every command group plus validation/fast-fail cases.
- `fetch-stub.cjs` — global `fetch` replacement: logs requests, returns canned
  responses.
- `run-stub.cjs` — spawns the binary per case, asserts the recorded request and
  exit behavior, writes a report to `/tmp/e2e-report.txt`.

A happy-path case passes when the binary exits 0, makes exactly the expected
`METHOD /path` call, and sends `x-api-key`. A validation case passes when the
binary exits non-zero with an error message **before** making any network call.
