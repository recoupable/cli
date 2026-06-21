# @recoupable/cli

Command-line interface for the [Recoup](https://recoupable.com) platform.

The CLI is **agent-first**: every command is non-interactive, accepts all input
as flags (or piped stdin), supports `--json` for machine-readable output, fails
fast with actionable errors, and ships layered `--help` with examples. It aims
for full parity with the Recoup REST API.

## Quick Start

### Install

```bash
npm install -g @recoupable/cli
```

### Authenticate

Get your API key from the [Recoup Developer Dashboard](https://developers.recoupable.com/api-reference/introduction#getting-your-api-key), then set it as an environment variable:

```bash
export RECOUP_API_KEY=your-api-key
```

To persist it across sessions, add it to your shell profile:

```bash
echo 'export RECOUP_API_KEY=your-api-key' >> ~/.zshrc
source ~/.zshrc
```

> Use `~/.bashrc` instead if you use bash.

### Verify

```bash
recoup whoami
```

## Discovering commands

Agents should discover commands incrementally rather than reading everything up
front:

```bash
recoup --help                 # top-level command groups
recoup research --help        # subcommands within a group
recoup research metrics --help  # flags + examples for one command
```

## Command groups

| Group | What it does |
|-------|--------------|
| `whoami` | Show the authenticated account ID |
| `accounts` | Account details, credits, subscription, profile updates, catalogs |
| `orgs` | List/create organizations, add artists |
| `workspaces` | Create workspaces |
| `artists` | List/create/update/delete artists; fans, posts, socials, scrape |
| `songs` | List songs, run audio analysis (presets or custom prompts) |
| `catalogs` | Create catalogs, add/remove/list songs |
| `generate` | Run the AI agent and get the final text (non-streaming) |
| `chats` | List/create/rename/delete chats, read messages, compact |
| `sessions` | Create/get/update agent & coding sessions |
| `tasks` | Create/update/delete scheduled tasks; list and check runs |
| `templates` | Manage reusable agent prompt templates |
| `models` | List available AI models |
| `pulses` | Enable/disable automated daily artist briefings |
| `content` | Captions, images, video, transcription, analysis, upscaling, editing |
| `research` | Artist/track/audience research, web search, deep research, enrichment |
| `spotify` | Query Spotify catalog data |
| `connectors` | Connect integrations and run their actions |
| `sandboxes` | Manage sandboxes and their files |
| `notifications` | Email the account owner |

### Examples

```bash
# Identity & account
recoup whoami
recoup accounts credits --json
recoup accounts update --name "Jane Doe" --instruction "Always be concise"

# Run the agent (flags or stdin)
recoup generate --prompt "What are this artist's top markets?" --artist <id>
echo "Draft a release announcement" | recoup generate --json

# Artists
recoup artists create --name "Daft Punk"
recoup artists fans <id> --limit 50 --json
recoup artists scrape --artist <id>

# Research
recoup research search --q "Daft Punk" --type artists
recoup research profile --artist "Daft Punk" --json
recoup research metrics --artist "Daft Punk" --source spotify
recoup research web --query "latest music industry news" --max-results 5
recoup research deep --query "Impact of TikTok on music discovery"
recoup research track-stats --isrc USUM71807100 --source spotify

# Content
recoup content caption --topic "summer tour announcement"
recoup content image --prompt "neon synthwave album cover" --aspect 1:1
recoup content transcribe --audio https://example.com/song.mp3

# Tasks
recoup tasks create --title "Daily report" --prompt "Summarize streams" \
  --schedule "0 9 * * *" --artist <id>
recoup tasks status --run <runId>

# Connectors
recoup connectors list
recoup connectors run --action GMAIL_FETCH_EMAILS --params '{"max_results":10}'
```

### Pipelines & stdin

Commands that take freeform text or JSON accept piped stdin, so they compose in
shell pipelines:

```bash
echo "What changed this week?" | recoup generate --json
cat songs.json | recoup catalogs add-songs --catalog <id>
echo '{"max_results":10}' | recoup connectors run --action GMAIL_FETCH_EMAILS
```

### Global flags

All commands support `--json` for machine-readable JSON output. On success,
commands print machine-useful values (IDs, URLs); with `--json` they print the
raw API response.

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `RECOUP_API_KEY` | Yes | Your Recoup API key (sent as `x-api-key`) |
| `RECOUP_API_URL` | No | API base URL (default: `https://recoup-api.vercel.app`) |

## License

MIT
