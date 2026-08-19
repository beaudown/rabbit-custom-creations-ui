import { readFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const requireReleaseReady =
  process.argv.includes("--require-release-ready") ||
  process.env.RABBIT_PREFLIGHT_REQUIRE_RELEASE_READY === "true";

function redactUrl(value) {
  if (!value) {
    return "";
  }
  try {
    const url = new URL(value);
    url.username = "";
    url.password = "";
    url.search = "";
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return "invalid_url";
  }
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function probeRelay(publicUrl) {
  if (!publicUrl) {
    return {
      attempted: false,
      ok: false,
      status: "not_configured",
    };
  }

  try {
    const response = await fetch(`${publicUrl.replace(/\/$/, "")}/relay/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    const body = await response.json().catch(() => ({}));
    return {
      attempted: true,
      ok: response.ok,
      httpStatus: response.status,
      status: body.status ?? "unknown",
      requiresAuth: body.requiresAuth === true,
      releaseReady: body.releaseReady === true,
      publicUrlUsesHttps: body.publicUrlUsesHttps === true,
      privilegedExecutionEnabled: body.privilegedExecutionEnabled === true,
    };
  } catch (error) {
    return {
      attempted: true,
      ok: false,
      status: "unreachable",
      error: error.message,
    };
  }
}

const [releaseGate, remoteBrokerConfig] = await Promise.all([
  readJson(join(root, "public", "broker", "release-gate.json")),
  readJson(join(root, "public", "broker", "remote-broker-config.json")),
]);

const configuredPublicUrl = redactUrl(process.env.RABBIT_RELAY_PUBLIC_URL || "");
const tokenConfigured = Boolean(process.env.RABBIT_RELAY_TOKEN);
const publicUrlUsesHttps = configuredPublicUrl.startsWith("https://");
const relayProbe = await probeRelay(configuredPublicUrl);

const substitutes = remoteBrokerConfig.routeSubstitutes ?? [];
const recommended = substitutes.find((item) => item.recommendation === "preferred_next_test");
const releaseReady =
  releaseGate.releaseQrAllowed === true &&
  tokenConfigured &&
  publicUrlUsesHttps &&
  relayProbe.ok &&
  relayProbe.requiresAuth === true &&
  relayProbe.privilegedExecutionEnabled === false;

const result = {
  schemaVersion: 1,
  status: releaseReady ? "release_route_ready" : "testing_only",
  recommendedSubstitute: recommended?.id ?? "authenticated_public_https_relay",
  explanation: releaseReady
    ? "Relay route has the minimum preflight signals for a Rabbit test."
    : "Release QR remains blocked until a token-authenticated HTTPS relay or validated Rabbit-native route is tested from Rabbit.",
  currentBlocker: releaseGate.currentBlocker?.id ?? "unknown",
  releaseQrAllowed: releaseGate.releaseQrAllowed === true,
  testingQrAllowed: releaseGate.testingQrAllowed === true,
  env: {
    relayPublicUrlConfigured: Boolean(configuredPublicUrl),
    relayPublicUrl: configuredPublicUrl || "not_configured",
    relayPublicUrlUsesHttps: publicUrlUsesHttps,
    relayTokenConfigured: tokenConfigured,
  },
  relayProbe,
  acceptableSubstitutes: substitutes.map((item) => ({
    id: item.id,
    recommendation: item.recommendation,
    requiresExplicitApproval: item.requiresExplicitApproval,
    requiresRabbitTest: item.requiresRabbitTest,
    deviceAffecting: item.deviceAffecting,
    releaseReadyNow: item.releaseReadyNow,
  })),
  doNotUse: releaseGate.substituteDecision?.doNotUse ?? remoteBrokerConfig.blockedRouteSubstitutes ?? [],
  nextManualTestRequired: !releaseReady,
  nextManualTest:
    "After explicit approval for an HTTPS route, scan only a testing QR, set Broker endpoint to the HTTPS relay URL, enter the relay token, and run steps 1 and 2 only. Stop if route fails.",
};

console.log(JSON.stringify(result, null, 2));

if (requireReleaseReady && !releaseReady) {
  process.exit(1);
}
