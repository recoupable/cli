# @recoupable/cli

Command-line interface for the [Recoup](https://recoupable.com) platform.

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

## Commands

### Account

```bash
recoup whoami              # Show your account ID
recoup whoami --json       # Output as JSON
```

### Artists

```bash
recoup artists list        # List your artists
recoup artists list --json
```

### Chats

```bash
recoup chats list                    # List your chats
recoup chats create --name "Topic"   # Create a new chat
recoup chats create --artist <id>    # Create a chat with an artist
```

### Sandboxes

```bash
recoup sandboxes list                       # List your sandboxes
recoup sandboxes create                     # Create a new sandbox
recoup sandboxes create --command "ls -la"  # Create and run a command
```

### Organizations

```bash
recoup orgs list           # List your organizations
```

### Songs

```bash
recoup songs presets
recoup songs analyze --audio "https://example.com/track.mp3" --preset catalog_metadata
recoup songs analyze --audio "https://example.com/track.mp3" --prompt "Describe the production style"
```

Replace the example URL with your public audio URL. Every analysis requires audio
and exactly one of `--preset` or `--prompt`.

### Emails

```bash
recoup emails --text "Here is your weekly summary."
recoup emails --text "Here is the update." --subject "Update" --chat-id <chat-id>
```

The recipient is resolved from your API key. `--subject` is optional; `--chat-id`
adds a chat link. Use `recoup emails --help` for HTML, CC and organization-account options.

### Content

```bash
recoup content templates
recoup content validate --artist <artist-id>
recoup content estimate --batch 2 --compare
recoup content create --artist <artist-id> --template artist-caption-bedroom
```

Estimates use GET and do not start generation. `content create` starts the pipeline
and returns run IDs; use those IDs with `tasks status` to check progress.

### Tasks

```bash
recoup tasks status --run <run-id>
recoup tasks status --run <run-id> --json
```

### Global Flags

All commands support `--json` for machine-readable JSON output.

This command reference follows the source in this checkout. Run `recoup --version`
and `recoup --help` to inspect your installed package; source changes alone do not
establish that a new npm version has been published.

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `RECOUP_API_KEY` | Yes | Your Recoup API key |
| `RECOUP_API_URL` | No | API base URL (default: `https://recoup-api.vercel.app`) |

## License

MIT
