# CLAUDE.md — @recoupable/cli

## Overview
CLI for the Recoup platform. Installed globally in sandboxes via `npm install -g @recoupable/cli`.

## Commands
```bash
pnpm install        # Install dependencies
pnpm build          # Build with tsup
pnpm test           # Run tests with vitest
```

## Architecture
- **Framework**: Commander.js for subcommands
- **Bundler**: tsup → CJS dist for global install compat
- **HTTP**: Native fetch (Node 22)
- **Auth**: `RECOUP_API_KEY` env var → `x-api-key` header
- **Output**: Plain text default, `--json` flag for raw JSON

## Key Files
- `src/bin.ts` — CLI entrypoint; registers every command group
- `src/client.ts` — HTTP client: `get`, `post`, `patch`, `put`, `del` (all send `x-api-key`)
- `src/config.ts` — Reads RECOUP_API_KEY from env
- `src/output.ts` — Formatters (table, json, error)
- `src/runAction.ts` — `runAction(fn)` wraps actions with uniform try/catch +
  `printError`; `emit(opts, data, plainFn)` handles the shared `--json` branch
- `src/stdin.ts` — `valueOrStdin(flag)` (flag wins, else piped stdin),
  `parseJsonFlag(raw, name)` for `--params`/`--schema`-style JSON flags
- `src/commands/` — One file per command group

## Agent-first conventions (see cli-for-agents skill)
- **Non-interactive**: never prompt. Every input is a flag; freeform text/JSON
  may also come from piped stdin via `valueOrStdin`.
- **Predictable structure**: `recoup <resource> <verb>` (e.g. `artists create`,
  `tasks list`). Primary resource IDs are positional `<id>`; everything else is a
  named flag.
- **Layered help**: each command group calls `.addHelpText("after", ...)` with
  copy-pasteable `Examples:`.
- **Fail fast**: validate required combinations up front and `throw new Error`
  with a corrected example invocation. `runAction` turns it into `Error: ...`
  + exit 1.
- **Structured success**: print IDs/URLs in plain mode; `--json` prints the raw
  API response.
- Wrap every `.action` in `runAction(async (...) => { ... })`.

## API Base URL
Default: `https://recoup-api.vercel.app`
Override: `RECOUP_API_URL` env var

## Code Principles
- SRP: One exported function per file
- TDD: Tests first, then implementation. Mock `../../src/client.js` (and
  `../../src/stdin.js` when a command reads stdin); drive commands with
  `command.parseAsync([...], { from: "user" })`.
- Keep it simple — this is a thin CLI wrapper over REST endpoints
- The CLI targets full parity with the Recoup REST API surface
