# Configuration

rustfava can be configured through environment variables and config files.

## Config File

rustfava looks for a config file at:

| Platform | Path |
|----------|------|
| Linux | `~/.config/rustfava/config.toml` |
| macOS | `~/Library/Application Support/rustfava/config.toml` |
| Windows | `%APPDATA%\rustfava\config.toml` |

## Options

### General

```toml
[general]
# Default file to open on launch
default_file = "~/ledger/main.beancount"

# Theme: "dark" or "light"
theme = "dark"

# Language for UI
language = "en"
```

### Editor

```toml
[editor]
# Font size in pixels
font_size = 14

# Font family
font_family = "monospace"

# Show line numbers
line_numbers = true
```

### Window

```toml
[window]
# Remember window size and position
remember_position = true

# Start maximized
start_maximized = false
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `RUSTFAVA_CONFIG` | Path to config file |
| `RUSTFAVA_LOG` | Log level (error, warn, info, debug, trace) |

## Command Line

```bash
# Open a specific file
rustfava /path/to/ledger.beancount

# Specify port for web server
rustfava --port 5001 /path/to/ledger.beancount
```
