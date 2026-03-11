#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const key = argv[i].replace(/^--/, "");
    const next = argv[i + 1];
    if (argv[i].startsWith("--") && next && !next.startsWith("--")) {
      args[key] = next;
      i++;
    } else if (argv[i].startsWith("--")) {
      args[key] = true;
    }
  }
  return args;
}

function findInfisicalJson(startDir) {
  let dir = startDir;
  while (true) {
    const candidate = path.join(dir, ".infisical.json");
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

function parseEnvFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  return content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => /^\w+=\S/.test(l) && !l.startsWith("#"));
}

function printHelp() {
  console.log(`
  infisical-env-push — push .env secrets to Infisical

  Usage:
    infisical-env-push [options]

  Options:
    --env-file   <file>       .env file to read (default: .env)
    --env        <env,...>    One or more environments, comma-separated (default: .infisical.json → "dev")
    --path       <path>       Secret path (default: /)
    --project-id <id>         Project ID (default: .infisical.json)
    --dry-run                 Show keys without pushing
    --help                    Show this help

  Examples:
    infisical-env-push --path /backend
    infisical-env-push --env dev,prod --path /backend
  `);
}

const args = parseArgs(process.argv);

if (args.help) {
  printHelp();
  process.exit(0);
}

const envFile = args["env-file"] || ".env";
const secretPath = args["path"] || "/";
const dryRun = args["dry-run"] === true;

const jsonPath = findInfisicalJson(process.cwd());
if (!jsonPath) {
  console.error(
    'ERROR: .infisical.json not found. Run "infisical init" first.',
  );
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
const projectId = args["project-id"] || config.workspaceId;
const envArg = args["env"] || config.defaultEnvironment || "dev";
const envs = String(envArg)
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

console.log(`Config  : ${jsonPath}`);
console.log(`Project : ${projectId}`);
console.log(`Envs    : ${envs.join(", ")}`);
console.log(`Path    : ${secretPath}`);

if (!fs.existsSync(envFile)) {
  console.error(`ERROR: ${envFile} not found`);
  process.exit(1);
}

const pairs = parseEnvFile(envFile);
if (pairs.length === 0) {
  console.error(`ERROR: No valid KEY=VALUE pairs found in ${envFile}`);
  process.exit(1);
}

console.log(
  `\nPushing ${pairs.length} secrets to ${envs.length} environment(s)...\n`,
);

if (dryRun) {
  console.log("--- DRY RUN ---");
  pairs.forEach((p) => console.log(" ", p.split("=")[0]));
  process.exit(0);
}

let exitCode = 0;
for (const env of envs) {
  console.log(`\n--- ${env} ---`);
  const result = spawnSync(
    "infisical",
    [
      "secrets",
      "set",
      ...pairs,
      `--env=${env}`,
      `--projectId=${projectId}`,
      `--path=${secretPath}`,
    ],
    { stdio: "inherit", shell: true },
  );
  if ((result.status ?? 1) !== 0) exitCode = result.status ?? 1;
}

process.exit(exitCode);
