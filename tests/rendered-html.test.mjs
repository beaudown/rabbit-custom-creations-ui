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
  assert.match(source, /Rabbit Broker/);
  assert.match(source, /On-device target/);
  assert.match(source, /always-with-device/);
  assert.match(source, /Mac broker/);
  assert.match(source, /fallback bootstrap authority/);
  assert.match(source, /restart-scoped SU bootstrap/);
  assert.match(source, /Broker Log/);
  assert.match(source, /1,500 active records/);
  assert.match(source, /Until reboot/);
  assert.match(source, /Warn at 1,200/);
  assert.match(source, /Archive 500/);
  assert.match(source, /No secrets/);
  assert.match(source, /USB Storage/);
  assert.match(source, /guided mount help/);
  assert.match(source, /Creation buttons call broker requests/);
  assert.match(source, /Prompt Guide/);
  assert.match(source, /Suggested prompts/);
  assert.match(source, /View all prompt details/);
  assert.match(source, /Temporary SU Bootstrap/);
  assert.match(source, /lease_holder/);
  assert.match(source, /device_state/);
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
  assert.equal(manifest.usbStorageGuide, "usb-storage-guide.md");
  assert.equal(manifest.remoteBrokerConfig, "../broker/remote-broker-config.json");
  assert.equal(manifest.rabbitNativeBrokerSpec, "../broker/rabbit-native-broker-spec.json");
  assert.equal(manifest.macLocalFallbackBrokerConfig, "../broker/mac-local-broker-config.json");
  assert.equal(manifest.brokerCoordination, "../broker/broker-coordination.json");
  assert.equal(manifest.promptLibrary, "../broker/prompt-library.json");
  assert.ok(
    manifest.requestTemplates.some((template) =>
      template.includes("usb-mass-storage-request.json"),
    ),
  );
  assert.match(instructions, /Creation-side escalated privilege request/);
  assert.match(instructions, /USB mass-storage or supported storage exposure/);
  assert.match(instructions, /prompt library/);
});

test("remote broker config marks executor as not deployed", async () => {
  const config = JSON.parse(
    await readFile(
      new URL("../public/broker/remote-broker-config.json", import.meta.url),
      "utf8",
    ),
  );

  assert.equal(config.status, "not_deployed");
  assert.equal(config.githubPagesIsStaticOnly, true);
  assert.equal(config.execution.macbookRequired, false);
  assert.equal(config.execution.macLocalFallbackAvailable, true);
  assert.equal(config.execution.privilegedExecutionEnabled, false);
  assert.equal(config.recommendedRuntime, "rabbit_native_service");
  assert.equal(config.macLocalFallbackBrokerConfig, "broker/mac-local-broker-config.json");
  assert.equal(config.coordinationManifest, "broker/broker-coordination.json");
  assert.equal(config.featureFlags.remoteRequests, true);
  assert.equal(config.featureFlags.remoteExecution, false);
});

test("rabbit-native broker spec is explicit about install status", async () => {
  const spec = JSON.parse(
    await readFile(
      new URL("../public/broker/rabbit-native-broker-spec.json", import.meta.url),
      "utf8",
    ),
  );

  assert.equal(spec.status, "specified_not_installed");
  assert.equal(spec.intendedHost, "rabbit_r1");
  assert.equal(spec.macbookRequired, false);
  assert.equal(spec.installStatus.installedOnRabbit, false);
  assert.equal(spec.installStatus.privilegedExecutionAvailable, false);
  assert.equal(spec.safetyDefaults.defaultSessionLifetime, "until_reboot");
  assert.equal(spec.safetyDefaults.initialAuthorizationTiming, "after_device_restart");
  assert.equal(spec.safetyDefaults.rebootClearsTemporaryPrivilege, true);
  assert.ok(spec.privilegedRequestClasses.includes("prepare_adb_tcpip_request"));
});

test("mac local broker config is fallback-only and coordinated", async () => {
  const config = JSON.parse(
    await readFile(
      new URL("../public/broker/mac-local-broker-config.json", import.meta.url),
      "utf8",
    ),
  );
  const coordination = JSON.parse(
    await readFile(
      new URL("../public/broker/broker-coordination.json", import.meta.url),
      "utf8",
    ),
  );

  assert.equal(config.status, "specified_not_running");
  assert.equal(config.intendedHost, "mac");
  assert.equal(config.role, "fallback_lab_bootstrap_coordinator");
  assert.equal(config.bootstrapRole.mayCoordinateRabbitNativeInstall, true);
  assert.equal(config.bootstrapRole.mayBootstrapRestartScopedPrivilegeSession, true);
  assert.equal(config.bootstrapRole.containsRootPayload, false);
  assert.equal(config.executionPolicy.privilegedExecutionEnabled, false);
  assert.equal(config.executionPolicy.temporaryPrivilegeLifetime, "until_reboot");
  assert.equal(coordination.singleWriterPolicy.enabled, true);
  assert.equal(coordination.rules.macBrokerMayBootstrapRabbitBroker, true);
  assert.equal(coordination.rules.macBrokerMayBootstrapRestartScopedPrivilegeSession, true);
  assert.equal(coordination.rules.macBrokerMayNotOverrideActiveRabbitBroker, true);
});

test("temporary privilege template is restart-scoped", async () => {
  const template = JSON.parse(
    await readFile(
      new URL("../public/broker/request-templates/temporary-privilege-dry-run.json", import.meta.url),
      "utf8",
    ),
  );

  assert.equal(template.action, "request_temporary_privilege_session");
  assert.equal(template.ttlSeconds, 0);
  assert.equal(template.sessionScope.lifetime, "until_reboot");
  assert.equal(template.sessionScope.initialAuthorizationTiming, "after_device_restart");
  assert.equal(template.sessionScope.rabbitNativeBrokerMayUseAfterBootstrap, true);
  assert.equal(template.sessionScope.macLocalBrokerBootstrapRequiredInitially, true);
  assert.equal(template.persistenceExpected, false);
});

test("prompt library explains variables and prompt behavior", async () => {
  const library = JSON.parse(
    await readFile(
      new URL("../public/broker/prompt-library.json", import.meta.url),
      "utf8",
    ),
  );

  assert.equal(library.schemaVersion, 1);
  assert.ok(library.variables.length >= 5);
  assert.ok(library.prompts.length >= 5);
  assert.ok(
    library.variables.every(
      (variable) => variable.name && variable.source && variable.meaning,
    ),
  );
  assert.ok(
    library.prompts.every(
      (prompt) =>
        prompt.title &&
        prompt.summary &&
        prompt.does.length &&
        prompt.variables.length &&
        prompt.prompt.includes("{{"),
    ),
  );
  assert.ok(library.prompts.some((prompt) => prompt.id === "temporary-su-bootstrap"));
  assert.ok(library.prompts.some((prompt) => prompt.id === "usb-storage-discovery"));
});
