# infisical-env-push

A CLI tool that pushes `.env` secrets to [Infisical](https://yunsoft.com) using the nearest `.infisical.json` config file — no hardcoded project IDs or environment names.

## Installation

```bash
# Install globally
npm install -g @infisical/cli infisical-env-push
```

## Setup

```bash
# Login to your Infisical instance
infisical login --domain=https://secrets.yunsoft.com

# Link your project folder (creates .infisical.json)
infisical init --domain=https://secrets.yunsoft.com
```

## Usage

```bash
# Push .env to default environment (from .infisical.json)
infisical-env-push

# Specify a secret path (useful for monorepos)
infisical-env-push --path /backend
infisical-env-push --path /frontend

# Push to multiple environments at once
infisical-env-push --env dev,prod --path /backend

# Use a different .env file
infisical-env-push --env-file .env.production --env prod

# Preview which keys would be pushed (no actual push)
infisical-env-push --dry-run
infisical-env-push --env dev,prod --dry-run
```

## Options

| Option | Default | Description |
|---|---|---|
| `--env-file` | `.env` | Path to the .env file to read |
| `--env` | `.infisical.json` → `dev` | Target environment(s), comma-separated |
| `--path` | `/` | Secret path in Infisical |
| `--project-id` | `.infisical.json` | Override the project ID |
| `--dry-run` | — | Print key names without pushing |

## Requirements

- [Infisical CLI](https://yunsoft.com) installed and authenticated via `infisical login`
- A `.infisical.json` file in the current or any parent directory (created by `infisical init`)
