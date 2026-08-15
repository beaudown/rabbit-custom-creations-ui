import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("build emits the Rabbit custom creations shell", async () => {
  const html = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");
  assert.match(html, /Rabbit Custom Creations/);
  assert.match(html, /src="\/assets\//);
});

test("source includes the requested management affordances", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.match(source, /Media Tools/);
  assert.match(source, /Developer Tools/);
  assert.match(source, /Custom Category 1/);
  assert.match(source, /Date installed: newest/);
  assert.match(source, /Date installed: oldest/);
  assert.match(source, /Confirm uninstall/);
  assert.match(source, /GitHub Pages/);
  assert.match(source, /Import Skill/);
  assert.match(source, /create-qr-code/);
  assert.match(source, /Broker Log/);
  assert.match(source, /1,500 active records/);
  assert.match(source, /Warn at 1,200/);
  assert.match(source, /Archive 500/);
  assert.match(source, /No secrets/);
  assert.match(source, /USB Storage/);
  assert.match(source, /Creation buttons call broker requests/);
  assert.match(source, /creation-skill\/manifest\.json/);
});

test("broker audit manifest enforces bounded append-only logging", async () => {
  const manifest = JSON.parse(
    await readFile(
      new URL("../public/broker/audit-manifest.json", import.meta.url),
      "utf8",
    ),
  );
  const log = await readFile(
    new URL("../public/broker/audit-log.jsonl", import.meta.url),
    "utf8",
  );
  const records = log.trim().split("\n").map((line) => JSON.parse(line));

  assert.equal(manifest.retention.activeRecordTarget, 1500);
  assert.equal(manifest.retention.warningThreshold, 1200);
  assert.equal(manifest.retention.archiveChunkSize, 500);
  assert.equal(manifest.rules.appendOnly, true);
  assert.equal(manifest.rules.noSecrets, true);
  assert.equal(manifest.rules.requiresExplicitApprovalForPrivilegedActions, true);
  assert.equal(records.length, manifest.active.recordCount);
  assert.ok(records.every((record) => record.result.persistentChange === false));
});

test("creation skill exposes broker request templates", async () => {
  const manifest = JSON.parse(
    await readFile(
      new URL("../public/creation-skill/manifest.json", import.meta.url),
      "utf8",
    ),
  );
  const instructions = await readFile(
    new URL("../public/creation-skill/instructions.md", import.meta.url),
    "utf8",
  );

  assert.equal(manifest.rules.creationMayRequestEscalatedPrivileges, true);
  assert.equal(manifest.rules.brokerExecutesEscalatedPrivileges, true);
  assert.ok(
    manifest.requestTemplates.some((template) =>
      template.includes("usb-mass-storage-request.json"),
    ),
  );
  assert.match(instructions, /Creation-side escalated privilege request/);
  assert.match(instructions, /USB mass-storage or supported storage exposure/);
});
