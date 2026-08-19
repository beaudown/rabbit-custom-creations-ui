import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);

test("relay preflight reports the approved substitute without requiring exposure", async () => {
  const repoRoot = fileURLToPath(new URL("..", import.meta.url));
  const { stdout } = await execFileAsync(process.execPath, ["scripts/relay-preflight.mjs"], {
    cwd: repoRoot,
    env: {
      ...process.env,
      RABBIT_RELAY_PUBLIC_URL: "",
      RABBIT_RELAY_TOKEN: "",
    },
  });
  const result = JSON.parse(stdout);

  assert.equal(result.status, "testing_only");
  assert.equal(result.recommendedSubstitute, "authenticated_public_https_relay");
  assert.equal(result.releaseQrAllowed, false);
  assert.equal(result.testingQrAllowed, true);
  assert.equal(result.env.relayPublicUrlConfigured, false);
  assert.equal(result.env.relayTokenConfigured, false);
  assert.equal(result.relayProbe.attempted, false);
  assert.equal(result.nextManualTestRequired, true);
  assert.ok(result.doNotUse.includes("raw_http_100_x_tailscale_url_from_hosted_creation"));
  assert.ok(
    result.acceptableSubstitutes.some(
      (item) => item.id === "authenticated_public_https_relay" && item.requiresRabbitTest === true,
    ),
  );
});
