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
- `src/bin.ts` — CLI entrypoint
- `src/client.ts` — HTTP client (GET/POST to Recoup API)
- `src/config.ts` — Reads RECOUP_API_KEY from env
- `src/output.ts` — Formatters (table, json, error)
- `src/commands/` — One file per command group

## API Base URL
Default: `https://recoup-api.vercel.app`
Override: `RECOUP_API_URL` env var

## Code Principles
- SRP: One exported function per file
- TDD: Tests first, then implementation
- Keep it simple — this is a thin CLI wrapper over REST endpoints
