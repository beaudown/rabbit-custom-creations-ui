import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";

const root = process.cwd();
const manifestPath = join(root, "public/broker/audit-manifest.json");

function parseArgs(argv) {
  const args = {
    mode: "status",
    query: "",
    out: "",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--archive") {
      args.mode = "archive";
    } else if (arg === "--status") {
      args.mode = "status";
    } else if (arg === "--query") {
      args.mode = "query";
      args.query = argv[index + 1] || "";
      index += 1;
    } else if (arg === "--out") {
      args.out = argv[index + 1] || "";
      index += 1;
    }
  }

  return args;
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

function parseJsonl(text) {
  return text
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        throw new Error(`Invalid JSONL at line ${index + 1}: ${error.message}`);
      }
    });
}

function recordId(record) {
  return record.recordId || record.id || record.request?.id || "unknown";
}

function recordTime(record) {
  return record.createdAt || record.timestamp || null;
}

function sha256(text) {
  return createHash("sha256").update(text).digest("hex");
}

function stringifyJsonl(records) {
  return records.map((record) => JSON.stringify(record)).join("\n") + (records.length ? "\n" : "");
}

function summarizeRecords(records) {
  return {
    recordCount: records.length,
    firstRecordId: records.length ? recordId(records[0]) : null,
    lastRecordId: records.length ? recordId(records[records.length - 1]) : null,
    startTime: records.length ? recordTime(records[0]) : null,
    endTime: records.length ? recordTime(records[records.length - 1]) : null,
  };
}

async function loadAuditState() {
  const manifest = await readJson(manifestPath);
  const activePath = join(root, "public", manifest.activeLog);
  const activeText = existsSync(activePath) ? await readFile(activePath, "utf8") : "";
  const activeRecords = parseJsonl(activeText);

  return {
    manifest,
    activePath,
    activeText,
    activeRecords,
  };
}

async function writeManifest(manifest) {
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

async function archiveIfNeeded() {
  const { manifest, activePath, activeRecords } = await loadAuditState();
  const { activeRecordTarget, archiveChunkSize } = manifest.retention;

  if (activeRecords.length <= activeRecordTarget) {
    const activeText = stringifyJsonl(activeRecords);
    manifest.active = {
      ...summarizeRecords(activeRecords),
      sha256: sha256(activeText),
    };
    await writeManifest(manifest);
    return {
      status: "no_archive_needed",
      active: manifest.active,
      archived: null,
    };
  }

  const archiveRecords = activeRecords.slice(0, archiveChunkSize);
  const remainingRecords = activeRecords.slice(archiveChunkSize);
  const archiveText = stringifyJsonl(archiveRecords);
  const remainingText = stringifyJsonl(remainingRecords);
  const archiveSummary = summarizeRecords(archiveRecords);
  const archiveName = `audit-archive-${archiveSummary.firstRecordId}-${archiveSummary.lastRecordId}.jsonl`;
  const archiveRelativePath = `${manifest.archiveDir}/${archiveName}`;
  const archivePath = join(root, "public", archiveRelativePath);

  await mkdir(dirname(archivePath), { recursive: true });
  await writeFile(`${archivePath}.tmp`, archiveText, { flag: "wx" });
  await rename(`${archivePath}.tmp`, archivePath);
  await writeFile(activePath, remainingText);

  const archiveEntry = {
    file: archiveRelativePath,
    ...archiveSummary,
    sha256: sha256(archiveText),
    tags: ["broker-audit", "retention-archive"],
    summary: `Archived ${archiveSummary.recordCount} oldest audit records.`,
  };

  manifest.archives = [...(manifest.archives || []), archiveEntry];
  manifest.active = {
    ...summarizeRecords(remainingRecords),
    sha256: sha256(remainingText),
  };
  await writeManifest(manifest);

  return {
    status: "archived",
    active: manifest.active,
    archived: archiveEntry,
  };
}

async function queryAudit(term) {
  const { manifest, activeRecords } = await loadAuditState();
  const normalized = term.toLowerCase();
  const matches = [];

  for (const record of activeRecords) {
    if (JSON.stringify(record).toLowerCase().includes(normalized)) {
      matches.push({
        source: manifest.activeLog,
        recordId: recordId(record),
        createdAt: recordTime(record),
        eventKind: record.eventKind || record.action || "unknown",
        requestId: record.request?.id || record.requestId || null,
        status: record.result?.status || record.status || null,
      });
    }
  }

  for (const archive of manifest.archives || []) {
    const archivePath = join(root, "public", archive.file);
    if (!existsSync(archivePath)) {
      continue;
    }
    const records = parseJsonl(await readFile(archivePath, "utf8"));
    for (const record of records) {
      if (JSON.stringify(record).toLowerCase().includes(normalized)) {
        matches.push({
          source: archive.file,
          recordId: recordId(record),
          createdAt: recordTime(record),
          eventKind: record.eventKind || record.action || "unknown",
          requestId: record.request?.id || record.requestId || null,
          status: record.result?.status || record.status || null,
        });
      }
    }
  }

  return {
    query: term,
    matchCount: matches.length,
    matches,
  };
}

async function status() {
  const { manifest, activeRecords } = await loadAuditState();
  return {
    activeLog: manifest.activeLog,
    archiveDir: manifest.archiveDir,
    activeRecordCount: activeRecords.length,
    warningThreshold: manifest.retention.warningThreshold,
    activeRecordTarget: manifest.retention.activeRecordTarget,
    archiveChunkSize: manifest.retention.archiveChunkSize,
    archiveCount: manifest.archives?.length || 0,
    needsArchive: activeRecords.length > manifest.retention.activeRecordTarget,
  };
}

const args = parseArgs(process.argv.slice(2));
let result;

if (args.mode === "archive") {
  result = await archiveIfNeeded();
} else if (args.mode === "query") {
  result = await queryAudit(args.query);
} else {
  result = await status();
}

const output = `${JSON.stringify(result, null, 2)}\n`;
if (args.out) {
  await writeFile(args.out, output);
}
process.stdout.write(output);

