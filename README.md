# sumem

CLI tool for summing application memory usage.

## Installation

```bash
npm install -g sumem
```

## Usage

```bash
sumem [options] <search-key>
```

### Arguments

- `<search-key>` - Case-insensitive whole word to match process names and paths

### Options

- `-l, --list` - List all matched processes
- `-e, --exclude <pattern>` - Exclude processes matching pattern (can be used multiple times)
- `-h, --help` - Show help message

### Examples

```bash
# Sum memory of all processes matching "app"
sumem app

# List and sum memory of all "app" processes
sumem --list app

# Sum "safari" memory excluding "gpu" and "helper" processes
sumem -e gpu -e helper safari

# List "code" processes excluding "helper"
sumem -l -e helper code
```

## How it works

The tool searches for processes where the search key matches as a **whole word** (case-insensitive) in either:

- Process name
- Full command path

Words are considered to be delimited by spaces, special characters, or path separators.

## Development

### Build

```bash
npm run build
```

### Test

```bash
npm test
```
