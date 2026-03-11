#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

// ── Yardımcılar ───────────────────────────────────────────────────────────────

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

// Infisical binary'yi bul — önce npm kurulum yollarına bak, sonra PATH'e düş
function findInfisicalBin() {
  const candidates =
    process.platform === "win32"
      ? [
          // npm global prefix'e göre
          path.join(
            process.execPath, // node.exe
            "../../node_modules/@infisical/cli/bin/infisical.exe",
          ),
          "C:\\Program Files\\nodejs\\node_modules\\@infisical\\cli\\bin\\infisical.exe",
          path.join(
            process.env.APPDATA || "",
            "npm/node_modules/@infisical/cli/bin/infisical.exe",
          ),
        ]
      : ["/usr/local/bin/infisical", "/usr/bin/infisical"];

  for (const c of candidates) {
    try {
      if (fs.existsSync(c)) return c;
    } catch {}
  }
  // Bulamazsak PATH'ten dene
  return process.platform === "win32" ? "infisical.exe" : "infisical";
}

// .env satırlarını KEY=VALUE array'ine çevirir (yorum & boş satır atlar)
function parseEnvFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  return content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => /^\w+=\S/.test(l) && !l.startsWith("#"));
}

function printHelp() {
  console.log(`
  infisical-env-push — .env dosyasını Infisical'a push eder

  Kullanım:
    infisical-env-push [seçenekler]

  Seçenekler:
    --env-file   <dosya>   .env dosyası (varsayılan: .env)
    --env        <env>     Infisical ortamı (varsayılan: .infisical.json > "dev")
    --path       <path>    Secret path (varsayılan: /)
    --project-id <id>      Project ID (varsayılan: .infisical.json)
    --dry-run              Push etmeden hangi keyleri göndereceğini gösterir
    --help                 Bu yardımı gösterir
  `);
}

// ── Ana akış ──────────────────────────────────────────────────────────────────

const args = parseArgs(process.argv);

if (args.help) {
  printHelp();
  process.exit(0);
}

const envFile = args["env-file"] || ".env";
const secretPath = args["path"] || "/";
const dryRun = args["dry-run"] === true;

// .infisical.json'ı bul
const jsonPath = findInfisicalJson(process.cwd());
if (!jsonPath) {
  console.error('HATA: .infisical.json bulunamadı. "infisical init" çalıştır.');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
const projectId = args["project-id"] || config.workspaceId;
const env = args["env"] || config.defaultEnvironment || "dev";

console.log(`Config  : ${jsonPath}`);
console.log(`Project : ${projectId}`);
console.log(`Env     : ${env}`);
console.log(`Path    : ${secretPath}`);

// .env dosyasını parse et
if (!fs.existsSync(envFile)) {
  console.error(`HATA: ${envFile} bulunamadı`);
  process.exit(1);
}

const pairs = parseEnvFile(envFile);
if (pairs.length === 0) {
  console.error(`HATA: ${envFile} içinde geçerli KEY=VALUE bulunamadı`);
  process.exit(1);
}

console.log(`\nPushing ${pairs.length} secret...\n`);

if (dryRun) {
  console.log("--- DRY RUN ---");
  pairs.forEach((p) => console.log(" ", p.split("=")[0]));
  process.exit(0);
}

const bin = findInfisicalBin();

const result = spawnSync(
  bin,
  [
    "secrets",
    "set",
    ...pairs,
    `--env=${env}`,
    `--projectId=${projectId}`,
    `--path=${secretPath}`,
  ],
  { stdio: "inherit", shell: false },
);

process.exit(result.status ?? 1);
