# infisical-env-push

A CLI tool that pushes `.env` secrets to [Infisical](https://infisical.com) using the nearest `.infisical.json` config file — no hardcoded project IDs or environment names.

## Installation

```bash
# Install globally
npm install -g infisical-env-push

# Or run without installing
npx infisical-env-push
```

## Usage

```bash
# Push .env in current directory using .infisical.json config
infisical-env-push

# Specify a secret path (useful for monorepos)
infisical-env-push --path /backend
infisical-env-push --path /frontend

# Use a different .env file and target environment
infisical-env-push --env-file .env.production --env prod

# Preview which keys would be pushed (no actual push)
infisical-env-push --dry-run
```

## Options

| Option | Default | Description |
|---|---|---|
| `--env-file` | `.env` | Path to the .env file to read |
| `--env` | `.infisical.json` → `dev` | Target Infisical environment |
| `--path` | `/` | Secret path in Infisical |
| `--project-id` | `.infisical.json` | Override the project ID |
| `--dry-run` | — | Print key names without pushing |

## Requirements

- [Infisical CLI](https://infisical.com/docs/cli/overview) installed and authenticated via `infisical login`
- A `.infisical.json` file in the current or any parent directory (created by `infisical init`)
