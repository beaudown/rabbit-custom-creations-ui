import assert from "node:assert/strict";
import { cp, mkdir, readFile, writeFile, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

function record(index) {
  return {
    schemaVersion: 1,
    recordId: `audit-test-${String(index).padStart(4, "0")}`,
    eventKind: index % 2 === 0 ? "dry_run_completed" : "request_created",
    createdAt: `2026-08-15T00:${String(index % 60).padStart(2, "0")}:00Z`,
    request: {
      id: `req-test-${index}`,
      action: index === 42 ? "target_query_action" : "routine_audit_action",
    },
    result: {
      status: "recorded",
      persistentChange: false,
    },
  };
}

test("audit management script reports status, archives, and queries records", async () => {
  const repoRoot = fileURLToPath(new URL("..", import.meta.url));
  const sandbox = await mkdtemp(join(tmpdir(), "rabbit-audit-management-"));
  await mkdir(join(sandbox, "public"), { recursive: true });
  await cp(join(repoRoot, "public/broker"), join(sandbox, "public/broker"), {
    recursive: true,
  });

  const records = Array.from({ length: 1501 }, (_, index) => record(index + 1));
  await writeFile(
    join(sandbox, "public/broker/audit-log.jsonl"),
    records.map((item) => JSON.stringify(item)).join("\n") + "\n",
  );

  const status = spawnSync(
    process.execPath,
    [join(repoRoot, "scripts/manage-audit-log.mjs"), "--status"],
    { cwd: sandbox, encoding: "utf8" },
  );
  assert.equal(status.status, 0, status.stderr);
  const statusBody = JSON.parse(status.stdout);
  assert.equal(statusBody.activeRecordCount, 1501);
  assert.equal(statusBody.needsArchive, true);

  const archive = spawnSync(
    process.execPath,
    [join(repoRoot, "scripts/manage-audit-log.mjs"), "--archive"],
    { cwd: sandbox, encoding: "utf8" },
  );
  assert.equal(archive.status, 0, archive.stderr);
  const archiveBody = JSON.parse(archive.stdout);
  assert.equal(archiveBody.status, "archived");
  assert.equal(archiveBody.archived.recordCount, 500);
  assert.equal(archiveBody.active.recordCount, 1001);

  const manifest = JSON.parse(
    await readFile(join(sandbox, "public/broker/audit-manifest.json"), "utf8"),
  );
  assert.equal(manifest.archives.length, 1);
  assert.equal(manifest.active.recordCount, 1001);

  const query = spawnSync(
    process.execPath,
    [join(repoRoot, "scripts/manage-audit-log.mjs"), "--query", "target_query_action"],
    { cwd: sandbox, encoding: "utf8" },
  );
  assert.equal(query.status, 0, query.stderr);
  const queryBody = JSON.parse(query.stdout);
  assert.equal(queryBody.matchCount, 1);
  assert.equal(queryBody.matches[0].recordId, "audit-test-0042");
  assert.match(queryBody.matches[0].source, /archive/);
});

