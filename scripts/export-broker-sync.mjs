import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";

const root = process.cwd();
const outArgIndex = process.argv.indexOf("--out");
const outputPath =
  outArgIndex >= 0 && process.argv[outArgIndex + 1]
    ? process.argv[outArgIndex + 1]
    : join(root, "dist/broker-sync-export.json");

const brokerRoot = join(root, "public/broker");

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function listFiles(path) {
  const entries = await readdir(path, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = join(path, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(absolute)));
    } else if (entry.name !== ".gitkeep") {
      files.push(absolute);
    }
  }
  return files.sort();
}

async function hashFile(path) {
  const buffer = await readFile(path);
  return createHash("sha256").update(buffer).digest("hex");
}

async function indexFiles(label, path) {
  const files = await listFiles(path);
  return Promise.all(
    files.map(async (file) => ({
      path: relative(brokerRoot, file).replaceAll("\\", "/"),
      kind: label,
      sha256: await hashFile(file),
    })),
  );
}

const syncManifest = await readJson(join(brokerRoot, "sync-manifest.json"));
const coordination = await readJson(join(brokerRoot, "broker-coordination.json"));
const promptLibrary = await readJson(join(brokerRoot, "prompt-library.json"));
const auditManifest = await readJson(join(brokerRoot, "audit-manifest.json"));

const [templates, inbox, outbox, processed, deadLetter] = await Promise.all([
  indexFiles("request_template", join(brokerRoot, "request-templates")),
  indexFiles("queue_inbox", join(brokerRoot, "queue/inbox")),
  indexFiles("queue_outbox", join(brokerRoot, "queue/outbox")),
  indexFiles("queue_processed", join(brokerRoot, "queue/processed")),
  indexFiles("queue_dead_letter", join(brokerRoot, "queue/dead-letter")),
]);

const exportBundle = {
  schemaVersion: 1,
  createdAt: new Date().toISOString(),
  source: "rabbit-custom-creations-ui",
  syncManifest,
  coordinationSummary: {
    status: coordination.status,
    activeLease: coordination.activeLease,
    knownBrokers: coordination.knownBrokers.map((broker) => ({
      id: broker.id,
      role: broker.role,
      status: broker.status,
      canExecutePrivilegedRequests: broker.canExecutePrivilegedRequests,
    })),
  },
  promptSummary: {
    name: promptLibrary.name,
    promptCount: promptLibrary.prompts.length,
    variableCount: promptLibrary.variables.length,
  },
  auditSummary: auditManifest.active,
  files: {
    templates,
    queue: {
      inbox,
      outbox,
      processed,
      deadLetter,
    },
  },
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(exportBundle, null, 2)}\n`);
console.log(`Wrote broker sync export: ${outputPath}`);
