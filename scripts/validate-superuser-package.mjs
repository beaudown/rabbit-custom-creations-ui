import { access, readdir, readFile } from "node:fs/promises";
import { join, normalize } from "node:path";

const root = process.cwd();
const publicRoot = join(root, "public");
const brokerRoot = join(publicRoot, "broker");
const skillRoot = join(publicRoot, "creation-skill");

const failures = [];

function fail(message) {
  failures.push(message);
}

async function readJson(path) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    fail(`JSON failed: ${path} (${error.message})`);
    return null;
  }
}

async function assertFile(path, label) {
  try {
    await access(path);
  } catch {
    fail(`Missing ${label}: ${path}`);
  }
}

function resolvePublicReference(fromDirectory, reference) {
  return normalize(join(fromDirectory, reference));
}

function assert(condition, message) {
  if (!condition) {
    fail(message);
  }
}

const creationManifestPath = join(skillRoot, "manifest.json");
const syncManifestPath = join(brokerRoot, "sync-manifest.json");

const [
  creationManifest,
  syncManifest,
  gatewayTopology,
  walkthroughGuide,
  executionChecklist,
  promptLibrary,
  auditManifest,
  releaseGate,
] = await Promise.all([
  readJson(creationManifestPath),
  readJson(syncManifestPath),
  readJson(join(brokerRoot, "gateway-topology.json")),
  readJson(join(brokerRoot, "walkthrough-guide.json")),
  readJson(join(brokerRoot, "execution-checklist.json")),
  readJson(join(brokerRoot, "prompt-library.json")),
  readJson(join(brokerRoot, "audit-manifest.json")),
  readJson(join(brokerRoot, "release-gate.json")),
]);

if (creationManifest) {
  const localSkillRefs = [
    ["entrypoint", creationManifest.entrypoint],
    ["creationLauncher", creationManifest.creationLauncher],
    ["firstRunReadiness", creationManifest.firstRunReadiness],
    ["enablementGuide", creationManifest.enablementGuide],
    ["brokerServiceGuide", creationManifest.brokerServiceGuide],
    ["customSkillUploader", creationManifest.customSkillUploader],
    ["usbStorageGuide", creationManifest.usbStorageGuide],
    ["walkthroughGuide", creationManifest.walkthroughGuide],
    ["executionChecklist", creationManifest.executionChecklist],
    ["settings", creationManifest.settings],
  ];

  await Promise.all(
    localSkillRefs.map(([label, reference]) =>
      assertFile(resolvePublicReference(skillRoot, reference), label),
    ),
  );

  const publicRefs = [
    ["remoteBrokerConfig", creationManifest.remoteBrokerConfig],
    ["rabbitNativeBrokerSpec", creationManifest.rabbitNativeBrokerSpec],
    ["macLocalFallbackBrokerConfig", creationManifest.macLocalFallbackBrokerConfig],
    ["brokerCoordination", creationManifest.brokerCoordination],
    ["gatewayTopology", creationManifest.gatewayTopology],
    ["releaseGate", creationManifest.releaseGate],
    ["walkthroughGuideData", creationManifest.walkthroughGuideData],
    ["executionChecklistData", creationManifest.executionChecklistData],
    ["leasePairing", creationManifest.leasePairing],
    ["promptLibrary", creationManifest.promptLibrary],
    ["syncManifest", creationManifest.syncManifest],
    ["auditManifest", creationManifest.auditManifest],
  ];

  await Promise.all(
    publicRefs.map(([label, reference]) =>
      assertFile(resolvePublicReference(skillRoot, reference), label),
    ),
  );

  assert(
    creationManifest.rules?.defaultDryRun === true,
    "Creation manifest must default to dry run.",
  );
  assert(
    creationManifest.rules?.requiresLiveDeviceCheck === true,
    "Creation manifest must require live device checks.",
  );
  assert(
    creationManifest.rules?.noSecretsInGitHub === true,
    "Creation manifest must forbid secrets in GitHub.",
  );
  assert(
    creationManifest.rules?.releaseQrRequiresPassingBrokerRoute === true,
    "Creation manifest must block release QR until broker route passes.",
  );
  assert(
    creationManifest.rules?.testingQrMustBeLabeled === true,
    "Creation manifest must require testing QR labels.",
  );

  const templates = creationManifest.requestTemplates ?? [];
  assert(templates.length >= 8, "Creation manifest should expose all request templates.");
  await Promise.all(
    templates.map((reference) =>
      assertFile(resolvePublicReference(skillRoot, reference), `request template ${reference}`),
    ),
  );
}

if (syncManifest) {
  const requiredPaths = [
    "promptLibrary",
    "coordination",
    "gatewayTopology",
    "walkthroughGuide",
    "executionChecklist",
    "leasePairing",
    "auditLog",
    "auditManifest",
    "requestTemplates",
  ];

  for (const key of requiredPaths) {
    assert(syncManifest.paths?.[key], `Sync manifest missing paths.${key}.`);
  }

  assert(
    syncManifest.rules?.githubMayNotExecuteRequests === true,
    "Sync manifest must state GitHub may not execute requests.",
  );
  assert(
    syncManifest.rules?.dryRunDefault === true,
    "Sync manifest must default requests to dry run.",
  );
  assert(
    syncManifest.exportIncludes?.includes("execution-checklist.json"),
    "Sync export must include execution-checklist.json.",
  );
}

if (gatewayTopology) {
  const includes = gatewayTopology.superuserManagementIncludes ?? [];
  for (const id of [
    "creation_ui",
    "rabbit_bridge",
    "rabbit_native_broker",
    "rabbit_gateway_connector",
    "openclaw_gateway",
    "hermes_gateway",
    "mac_local_fallback_broker",
    "github_storage",
  ]) {
    assert(includes.includes(id), `Gateway topology missing ${id}.`);
  }
  assert(
    gatewayTopology.rules?.gatewayClaimsRequireEvidence === true,
    "Gateway topology must require evidence for gateway claims.",
  );
}

if (walkthroughGuide) {
  assert(walkthroughGuide.entries?.length === 6, "Walkthrough guide must contain six entries.");
  assert(
    walkthroughGuide.rules?.expectedResponseMustBeShownBeforeQueueing === true,
    "Walkthrough guide must require expected responses before queueing.",
  );
  for (const entry of walkthroughGuide.entries ?? []) {
    assert(entry.doFirst, `Walkthrough entry ${entry.id} missing doFirst.`);
    assert(entry.expectedResponse, `Walkthrough entry ${entry.id} missing expectedResponse.`);
    assert(entry.nextAction, `Walkthrough entry ${entry.id} missing nextAction.`);
    assert(entry.stopCondition, `Walkthrough entry ${entry.id} missing stopCondition.`);
  }
}

if (executionChecklist) {
  assert(
    executionChecklist.globalRules?.showBeforeQueueing === true,
    "Execution checklist must be shown before queueing.",
  );
  assert(
    executionChecklist.globalRules?.liveDeviceAuthorizationRequiredForDeviceAffectingActions === true,
    "Execution checklist must require live authorization for device-affecting actions.",
  );
  assert(executionChecklist.items?.length === 7, "Execution checklist must contain seven gates.");
  for (const item of executionChecklist.items ?? []) {
    assert(item.dependencies?.length, `Checklist item ${item.id} missing dependencies.`);
    assert(item.evidence?.length, `Checklist item ${item.id} missing evidence.`);
    assert(item.blocksIfMissing, `Checklist item ${item.id} missing blocker.`);
  }
}

if (promptLibrary) {
  assert(promptLibrary.prompts?.length >= 5, "Prompt library must expose at least five prompts.");
  assert(promptLibrary.variables?.length >= 5, "Prompt library must expose required variables.");
}

if (auditManifest) {
  assert(auditManifest.retention?.activeRecordTarget === 1500, "Audit active target must be 1500.");
  assert(auditManifest.rules?.noSecrets === true, "Audit manifest must forbid secrets.");
}

if (releaseGate) {
  assert(
    releaseGate.status === "testing_only",
    "Release gate must remain testing_only until broker route is fixed.",
  );
  assert(
    releaseGate.releaseQrAllowed === false,
    "Release gate must block release QR while broker route is unreachable.",
  );
  assert(
    releaseGate.testingQrAllowed === true,
    "Release gate must allow explicitly labeled testing QR.",
  );
  assert(
    releaseGate.currentBlocker?.id === "broker_route_unreachable_from_rabbit",
    "Release gate must name the Rabbit broker-route blocker.",
  );
  assert(
    releaseGate.releaseRequirements?.some((requirement) =>
      requirement.includes("HTTPS"),
    ),
    "Release gate must require HTTPS or validated local broker route.",
  );
}

const requestTemplateFiles = await readdir(join(brokerRoot, "request-templates"));
const jsonTemplates = requestTemplateFiles.filter((file) => file.endsWith(".json"));
assert(jsonTemplates.length >= 8, "Expected at least eight request template JSON files.");

if (failures.length) {
  console.error("Superuser package validation failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Superuser package is ready:");
console.log(`- ${jsonTemplates.length} request templates`);
console.log(`- ${walkthroughGuide?.entries?.length ?? 0} walkthrough entries`);
console.log(`- ${executionChecklist?.items?.length ?? 0} execution gates`);
