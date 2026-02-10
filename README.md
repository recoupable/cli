# @recoupable/cli

Command-line interface for the [Recoup](https://recoupable.com) platform.

## Quick Start

### Install

```bash
npm install -g @recoupable/cli
```

### Authenticate

Set your API key as an environment variable:

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

### Global Flags

All commands support `--json` for machine-readable JSON output.

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `RECOUP_API_KEY` | Yes | Your Recoup API key |
| `RECOUP_API_URL` | No | API base URL (default: `https://recoup-api.vercel.app`) |

## License

MIT
