import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

test("broker sync export script writes portable bundle", async () => {
  const repoRoot = fileURLToPath(new URL("..", import.meta.url));
  const sandbox = await mkdtemp(join(tmpdir(), "rabbit-sync-export-"));
  const outputPath = join(sandbox, "broker-sync-export.json");
  const result = spawnSync(
    process.execPath,
    [join(repoRoot, "scripts/export-broker-sync.mjs"), "--out", outputPath],
    {
      cwd: repoRoot,
      encoding: "utf8",
    },
  );

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Wrote broker sync export/);

  const bundle = JSON.parse(await readFile(outputPath, "utf8"));
  assert.equal(bundle.schemaVersion, 1);
  assert.equal(bundle.syncManifest.paths.inbox, "broker/queue/inbox");
  assert.equal(bundle.syncManifest.paths.gatewayTopology, "broker/gateway-topology.json");
  assert.equal(bundle.syncManifest.paths.walkthroughGuide, "broker/walkthrough-guide.json");
  assert.ok(bundle.gatewayTopologySummary.included.includes("rabbit_bridge"));
  assert.ok(bundle.gatewayTopologySummary.included.includes("openclaw_gateway"));
  assert.ok(bundle.gatewayTopologySummary.included.includes("hermes_gateway"));
  assert.equal(bundle.gatewayTopologySummary.rules.githubIsStorageNotExecutor, true);
  assert.equal(bundle.walkthroughGuideSummary.entryCount, 6);
  assert.ok(bundle.walkthroughGuideSummary.defaultOrder.includes("pair_brokers"));
  assert.equal(bundle.walkthroughGuideSummary.rules.stopConditionMustBeShown, true);
  assert.equal(bundle.leasePairingSummary.defaultLeaseTtlSeconds, 259200);
  assert.equal(bundle.leasePairingSummary.qrTarget, "broker/lease-pairing.json");
  assert.equal(bundle.leasePairingSummary.rabbitConnectorAutoRetrieve, true);
  assert.ok(bundle.files.templates.some((file) => file.path.includes("adb-enable-request.json")));
  assert.equal(bundle.promptSummary.promptCount, 5);
  assert.equal(bundle.files.queue.inbox.length, 0);
});
