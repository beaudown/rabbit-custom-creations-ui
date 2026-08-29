import assert from "node:assert/strict";
import { mkdtemp, readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const scriptPath = join(
  repoRoot,
  "skills/rabbit-custom-creation-local-qr/scripts/create_local_creation_qr.mjs",
);

test("local QR skill generates Rabbit-format Creation payload and PNG", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "rabbit-local-creation-qr-"));
  const result = spawnSync(
    process.execPath,
    [
      scriptPath,
      "--title",
      "A1 Broker Test",
      "--url",
      "https://michaels-macbook-pro.tailcfaeac.ts.net/rabbit-custom-creations-ui/?creation=A1BrokerTestLocal",
      "--description",
      "Testing-only Rabbit r1 broker route check. Run Step 1 and Step 2 only.",
      "--icon-url",
      "https://michaels-macbook-pro.tailcfaeac.ts.net/rabbit-custom-creations-ui/favicon.svg",
      "--theme-color",
      "#FE5000",
      "--out",
      outputDir,
      "--name",
      "a1-local",
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
    },
  );

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Rabbit Custom Creation QR ready/);

  const payload = JSON.parse(await readFile(join(outputDir, "a1-local.creation.json"), "utf8"));
  assert.deepEqual(Object.keys(payload), ["title", "url", "description", "iconUrl", "themeColor"]);
  assert.equal(payload.title, "A1 Broker Test");
  assert.match(payload.url, /creation=A1BrokerTestLocal/);
  assert.equal(payload.themeColor, "#FE5000");

  const png = await stat(join(outputDir, "a1-local.qr.png"));
  assert.ok(png.size > 1000);

  const reviewHtml = await readFile(join(outputDir, "a1-local.scan.html"), "utf8");
  assert.match(reviewHtml, /Scan this QR only from Rabbit r1 Creations add via QR/);
  assert.doesNotMatch(reviewHtml, /x-rabbit-relay-token/);
});

test("local QR skill refuses secret-looking QR payloads", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "rabbit-local-creation-qr-secret-"));
  const result = spawnSync(
    process.execPath,
    [
      scriptPath,
      "--title",
      "A1 Broker Test",
      "--url",
      "https://michaels-macbook-pro.tailcfaeac.ts.net/rabbit-custom-creations-ui/?relayToken=abc123",
      "--description",
      "Testing-only Rabbit r1 broker route check.",
      "--icon-url",
      "https://michaels-macbook-pro.tailcfaeac.ts.net/rabbit-custom-creations-ui/favicon.svg",
      "--out",
      outputDir,
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
    },
  );

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Refusing to encode secret-looking/);
});
