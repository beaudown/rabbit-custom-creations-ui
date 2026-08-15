import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

test("superuser package readiness validator passes", () => {
  const repoRoot = fileURLToPath(new URL("..", import.meta.url));
  const result = spawnSync("npm", ["run", "broker:validate"], {
    cwd: repoRoot,
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Superuser package is ready/);
  assert.match(result.stdout, /request templates/);
  assert.match(result.stdout, /walkthrough entries/);
  assert.match(result.stdout, /execution gates/);
});
