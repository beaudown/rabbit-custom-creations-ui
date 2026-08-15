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
  assert.match(source, /Superuser Management/);
  assert.match(source, /One Creation should manage superuser actions/);
  assert.match(source, /Hosted PWA/);
  assert.match(source, /On-device management/);
  assert.match(source, /Broker API client/);
  assert.match(source, /No browser root/);
  assert.match(source, /Actionable flow/);
  assert.match(source, /Response Playbook/);
  assert.match(source, /Do this first/);
  assert.match(source, /Provoke a\s+broker response/);
  assert.match(source, /Required Gates/);
  assert.match(source, /Dependency checklist/);
  assert.match(source, /Hosted manifest/);
  assert.match(source, /Live device gate/);
  assert.match(source, /Stop/);
  assert.match(source, /Scan skill QR/);
  assert.match(source, /Pick workflow/);
  assert.match(source, /Approve live/);
  assert.match(source, /expected outcome/);
  assert.match(source, /On-device target/);
  assert.match(source, /always-with-device/);
  assert.match(source, /Rabbit bridge/);
  assert.match(source, /Rabbit gateway connector/);
  assert.match(source, /OpenClaw gateway/);
  assert.match(source, /Hermes gateway/);
  assert.match(source, /Gateway Mesh/);
  assert.match(source, /Broker bridge stack/);
  assert.match(source, /Bridge Routing/);
  assert.match(source, /Broker selection/);
  assert.match(source, /Mac broker if local lease is reachable/);
  assert.match(source, /Detect broker bridge/);
  assert.match(source, /brokerEndpoint/);
  assert.match(source, /detectBrokerBridge/);
  assert.match(source, /\/bridge\/route/);
  assert.match(source, /\/adb\/status/);
  assert.match(source, /Service Control/);
  assert.match(source, /requestServiceControl/);
  assert.match(source, /\/broker\/service/);
  assert.match(source, /Skill Uploader/);
  assert.match(source, /Custom imports/);
  assert.match(source, /parseSkillUpload/);
  assert.match(source, /queueSkillUpload/);
  assert.match(source, /\/skills\/upload/);
  assert.match(source, /Claude/);
  assert.match(source, /ChatGPT\/Codex/);
  assert.match(source, /Mac broker/);
  assert.match(source, /fallback bootstrap authority/);
  assert.match(source, /bootstrap only; Rabbit SU stays local/);
  assert.match(source, /Broker Log/);
  assert.match(source, /1,500 active records/);
  assert.match(source, /Until reboot/);
  assert.match(source, /72 hours/);
  assert.match(source, /Lease Pairing/);
  assert.match(source, /72-hour ownership/);
  assert.match(source, /Superuser lease controls/);
  assert.match(source, /Ownership controls/);
  assert.match(source, /Reconnect from QR/);
  assert.match(source, /runLeaseAction/);
  assert.match(source, /SU unaffected/);
  assert.match(source, /lease-pairing\.json/);
  assert.match(source, /Rabbit connector auto-retrieves/);
  assert.match(source, /Warn at 1,200/);
  assert.match(source, /Archive 500/);
  assert.match(source, /No secrets/);
  assert.match(source, /USB Storage Mode/);
  assert.match(source, /Device Modes/);
  assert.match(source, /Reboot targets/);
  assert.match(source, /ADB Control/);
  assert.match(source, /System auth prompt/);
  assert.match(source, /Awareness broadcast/);
  assert.match(source, /Offline Recovery/);
  assert.match(source, /Audit \+ rollback/);
  assert.match(source, /guided mount help/);
  assert.match(source, /Creation buttons call broker requests/);
  assert.match(source, /Common workflows/);
  assert.match(source, /Prompt Guide/);
  assert.match(source, /Suggested prompts/);
  assert.match(source, /View all prompt details/);
  assert.match(source, /Temporary SU Bootstrap/);
  assert.match(source, /ADB Mode Preflight/);
  assert.match(source, /Audit Lookup and Rollback Clues/);
  assert.match(source, /Send review bundle/);
  assert.match(source, /Rabbit LLM/);
  assert.match(source, /Rabbit intern/);
  assert.match(source, /DLAM/);
  assert.match(source, /downloadAuditHandoff/);
  assert.match(source, /Request Composer/);
  assert.match(source, /Queue to Mac broker/);
  assert.match(source, /Missing required values/);
  assert.match(source, /requestPreview/);
  assert.match(source, /lease_holder/);
  assert.match(source, /device_state/);
  assert.match(source, /Mac broker unavailable at \$\{brokerEndpoint\}/);
  assert.match(source, /GitHub Sync/);
  assert.match(source, /Shared queue/);
  assert.match(source, /Download sync export/);
  assert.match(source, /broker\/queue\/inbox/);
  assert.match(source, /dead_letter/);
  assert.match(source, /not gated by Mac reachability after bootstrap/);
  assert.match(source, /creation-skill\/manifest\.json/);
});

test("hosted app exposes installable PWA metadata and offline cache", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const manifest = JSON.parse(
    await readFile(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"),
  );
  const serviceWorker = await readFile(new URL("../public/sw.js", import.meta.url), "utf8");
  const main = await readFile(new URL("../src/main.tsx", import.meta.url), "utf8");

  assert.match(html, /manifest\.webmanifest/);
  assert.equal(manifest.name, "Rabbit Superuser Management");
  assert.equal(manifest.display, "standalone");
  assert.ok(manifest.shortcuts.some((shortcut) => shortcut.name === "Audit Review"));
  assert.match(serviceWorker, /broker\/rabbit-native-broker-spec\.json/);
  assert.match(serviceWorker, /broker\/request-templates\/adb-enable-request\.json/);
  assert.match(serviceWorker, /broker\/request-templates\/custom-skill-upload-request\.json/);
  assert.match(serviceWorker, /creation-skill\/execution-checklist\.md/);
  assert.match(serviceWorker, /creation-skill\/custom-skill-uploader\.md/);
  assert.match(main, /serviceWorker/);
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
  assert.equal(manifest.rules.reviewBundlesMayBeSentToAssistantClients, true);
  assert.equal(manifest.rules.assistantClientsMayExecutePrivilegedActions, false);
  assert.ok(manifest.reviewTargets.includes("rabbit_llm"));
  assert.ok(manifest.reviewTargets.includes("chatgpt_codex_client"));
  assert.ok(manifest.reviewTargets.includes("dlam_synthesis"));
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
  assert.equal(manifest.rules.singleCreationEntrypoint, true);
  assert.equal(manifest.rules.creationMayUploadCustomSkills, true);
  assert.equal(manifest.rules.customSkillHooksRequireBrokerApproval, true);
  assert.equal(manifest.creationLauncher, "creation-launcher.json");
  assert.equal(manifest.brokerServiceGuide, "broker-service-guide.md");
  assert.equal(manifest.customSkillUploader, "custom-skill-uploader.md");
  assert.equal(manifest.usbStorageGuide, "usb-storage-guide.md");
  assert.equal(manifest.walkthroughGuide, "walkthrough-guide.md");
  assert.equal(manifest.executionChecklist, "execution-checklist.md");
  assert.equal(manifest.remoteBrokerConfig, "../broker/remote-broker-config.json");
  assert.equal(manifest.rabbitNativeBrokerSpec, "../broker/rabbit-native-broker-spec.json");
  assert.equal(manifest.macLocalFallbackBrokerConfig, "../broker/mac-local-broker-config.json");
  assert.equal(manifest.brokerCoordination, "../broker/broker-coordination.json");
  assert.equal(manifest.gatewayTopology, "../broker/gateway-topology.json");
  assert.equal(manifest.walkthroughGuideData, "../broker/walkthrough-guide.json");
  assert.equal(manifest.executionChecklistData, "../broker/execution-checklist.json");
  assert.equal(manifest.leasePairing, "../broker/lease-pairing.json");
  assert.equal(manifest.promptLibrary, "../broker/prompt-library.json");
  assert.equal(manifest.syncManifest, "../broker/sync-manifest.json");
  assert.ok(
    manifest.requestTemplates.some((template) =>
      template.includes("usb-mass-storage-request.json"),
    ),
  );
  assert.ok(
    manifest.requestTemplates.some((template) =>
      template.includes("custom-skill-upload-request.json"),
    ),
  );
  assert.match(instructions, /Creation-side escalated privilege request/);
  assert.match(instructions, /USB mass-storage or supported storage exposure/);
  assert.match(instructions, /prompt library/);
  assert.match(instructions, /broker\/gateway-topology\.json/);
  assert.match(instructions, /broker\/walkthrough-guide\.json/);
  assert.match(instructions, /broker\/execution-checklist\.json/);
  assert.match(instructions, /Rabbit bridge/);
  assert.match(instructions, /OpenClaw gateway/);
  assert.match(instructions, /Hermes gateway/);
  assert.match(instructions, /hosted PWA/);
  assert.match(instructions, /not the privileged executor/);
  assert.match(instructions, /ADB over USB/);
  assert.match(instructions, /Android system authorization prompt/);
  assert.match(instructions, /Rabbit LLM/);
  assert.match(instructions, /DLAM/);
  assert.match(instructions, /single Custom Creation entrypoint/);
  assert.match(instructions, /custom-skill-uploader\.md/);
  assert.match(instructions, /Hook activation requires broker/);

  const walkthrough = await readFile(
    new URL("../public/creation-skill/walkthrough-guide.md", import.meta.url),
    "utf8",
  );
  assert.match(walkthrough, /Superuser Management Walkthrough/);
  assert.match(walkthrough, /Do first/);
  assert.match(walkthrough, /Expect/);
  assert.match(walkthrough, /Stop if/);

  const checklist = await readFile(
    new URL("../public/creation-skill/execution-checklist.md", import.meta.url),
    "utf8",
  );
  assert.match(checklist, /Superuser Management Execution Checklist/);
  assert.match(checklist, /Hosted Manifest Ready/);
  assert.match(checklist, /Live Device Gate Ready/);
  assert.match(checklist, /Blocks if missing/);
});

test("sync manifest defines shared GitHub queue contract", async () => {
  const manifest = JSON.parse(
    await readFile(
      new URL("../public/broker/sync-manifest.json", import.meta.url),
      "utf8",
    ),
  );

  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.paths.inbox, "broker/queue/inbox");
  assert.equal(manifest.paths.outbox, "broker/queue/outbox");
  assert.equal(manifest.paths.gatewayTopology, "broker/gateway-topology.json");
  assert.equal(manifest.paths.walkthroughGuide, "broker/walkthrough-guide.json");
  assert.equal(manifest.paths.executionChecklist, "broker/execution-checklist.json");
  assert.equal(manifest.rules.oneRequestPerFile, true);
  assert.equal(manifest.rules.githubMayNotExecuteRequests, true);
  assert.equal(manifest.paths.leasePairing, "broker/lease-pairing.json");
  assert.equal(manifest.rules.defaultLeaseTtlSeconds, 259200);
  assert.equal(manifest.rules.leasePairingQrTarget, "broker/lease-pairing.json");
  assert.equal(manifest.rules.rabbitConnectorAutoRetrievesLeasePairing, true);
  assert.equal(manifest.rules.rabbitNativeBrokerMayRenewWithoutMacAfterBootstrap, true);
  assert.equal(manifest.rules.leaseControlsExecutionResultWritesOnly, true);
  assert.equal(manifest.rules.leaseDoesNotGateRabbitNativeSuperuserSession, true);
  assert.ok(manifest.requestStates.includes("queued"));
  assert.ok(manifest.requestStates.includes("dead_letter"));
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
  assert.equal(config.gatewayTopology, "broker/gateway-topology.json");
  assert.equal(config.execution.rabbitBridgeIncluded, true);
  assert.equal(config.execution.rabbitBridgeRole, "route_validate_dry_run_and_select_broker");
  assert.equal(config.execution.rabbitGatewayConnectorIncluded, true);
  assert.equal(config.execution.openClawGatewayAware, true);
  assert.equal(config.execution.hermesGatewayAware, true);
  assert.equal(config.execution.assistantClientsMayExecutePrivilegedActions, false);
  assert.equal(config.featureFlags.remoteRequests, true);
  assert.equal(config.featureFlags.remoteExecution, false);
  assert.equal(config.featureFlags.adbAuthorizationPromptRequest, true);
  assert.equal(config.featureFlags.adbAwarenessBroadcast, true);
  assert.equal(config.featureFlags.usbStorageRebootMode, true);
  assert.equal(config.featureFlags.brokerServiceControl, true);
  assert.equal(config.featureFlags.customSkillUploader, true);
  assert.equal(config.featureFlags.hostedPwaInstall, true);
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
  assert.equal(spec.bridgeRole, "local_creation_to_on_device_broker_api");
  assert.equal(spec.gatewayTopology, "broker/gateway-topology.json");
  assert.ok(spec.gatewayIntegrations.includes("rabbit_gateway_connector"));
  assert.ok(spec.gatewayIntegrations.includes("openclaw_gateway"));
  assert.ok(spec.gatewayIntegrations.includes("hermes_gateway"));
  assert.ok(spec.gatewayIntegrations.includes("chatgpt_codex_client"));
  assert.ok(spec.localApi.endpoints.includes("GET /gateways"));
  assert.ok(spec.localApi.endpoints.includes("GET /bridge/status"));
  assert.ok(spec.localApi.endpoints.includes("GET /bridge/route"));
  assert.ok(spec.localApi.endpoints.includes("POST /adb/authorize"));
  assert.ok(spec.localApi.endpoints.includes("POST /device/reboot-mode"));
  assert.ok(spec.localApi.endpoints.includes("POST /broker/service"));
  assert.ok(spec.localApi.endpoints.includes("POST /skills/upload"));
  assert.equal(spec.bridgeRoutingPolicy.bridgeIsRouterNotExecutor, true);
  assert.equal(spec.bridgeRoutingPolicy.fallbackToRabbitNativeBrokerWhenMacUnavailable, true);
  assert.equal(spec.adbPolicy.systemAuthorizationPromptTracked, true);
  assert.equal(spec.adbPolicy.broadcastTransportAwareness, true);
  assert.equal(spec.deviceModePolicy.usbStorageModeReboot, true);
  assert.equal(spec.offlineRecoveryPolicy.rollbackHelpOffline, true);
  assert.equal(spec.customSkillUploadPolicy.automaticHookActivation, false);
  assert.equal(spec.customSkillUploadPolicy.hookActivationRequiresBrokerApproval, true);
  assert.equal(spec.installStatus.installedOnRabbit, false);
  assert.equal(spec.installStatus.privilegedExecutionAvailable, false);
  assert.equal(spec.safetyDefaults.defaultSessionLifetime, "until_reboot");
  assert.equal(spec.safetyDefaults.initialAuthorizationTiming, "after_device_restart");
  assert.equal(spec.safetyDefaults.rebootClearsTemporaryPrivilege, true);
  assert.equal(spec.leasePolicy.defaultLeaseTtlSeconds, 259200);
  assert.equal(spec.leasePolicy.leaseLabel, "72_hour_lease");
  assert.equal(spec.leasePolicy.leasePairingPath, "broker/lease-pairing.json");
  assert.equal(spec.leasePolicy.rabbitConnectorAutoRetrievesLeasePairing, true);
  assert.equal(spec.leasePolicy.macLocalBrokerRequiredAfterBootstrap, false);
  assert.equal(spec.leasePolicy.rabbitNativeBrokerMayRenewWithoutMacAfterBootstrap, true);
  assert.equal(spec.leasePolicy.leaseControlsExecutionResultWritesOnly, true);
  assert.equal(spec.superuserSessionPolicy.scope, "current_boot_cycle_ram_only");
  assert.equal(spec.superuserSessionPolicy.independentOfBrokerLeaseExpiry, true);
  assert.equal(spec.superuserSessionPolicy.independentOfMacReachabilityAfterBootstrap, true);
  assert.equal(spec.superuserSessionPolicy.rabbitNativeBrokerMayRequestTemporarySuperuserWithoutMacAfterBootstrap, true);
  assert.ok(spec.privilegedRequestClasses.includes("prepare_adb_tcpip_request"));
  assert.ok(spec.privilegedRequestClasses.includes("prepare_custom_skill_upload_request"));
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
  assert.equal(config.leasePairing, "broker/lease-pairing.json");
  assert.equal(config.defaultLeaseTtlSeconds, 259200);
  assert.equal(config.executionPolicy.defaultLeaseTtlSeconds, 259200);
  assert.equal(config.executionPolicy.regenerateLeaseOnMacBrokerStartup, true);
  assert.equal(config.executionPolicy.leaseRefreshSupported, true);
  assert.equal(config.executionPolicy.leaseRenewSupported, true);
  assert.equal(config.executionPolicy.leaseReleaseSupported, true);
  assert.equal(config.executionPolicy.leaseActionsAffectSuperuserSession, false);
  assert.equal(config.bootstrapRole.rabbitNativeBrokerMayOperateWithoutMacAfterBootstrap, true);
  assert.equal(coordination.singleWriterPolicy.enabled, true);
  assert.equal(coordination.singleWriterPolicy.leaseTtlSeconds, 259200);
  assert.equal(coordination.singleWriterPolicy.leaseLabel, "72_hour_lease");
  assert.equal(coordination.leasePairing.path, "broker/lease-pairing.json");
  assert.equal(coordination.gatewayTopology.path, "broker/gateway-topology.json");
  assert.equal(coordination.gatewayTopology.rabbitBridgeIncluded, true);
  assert.equal(coordination.gatewayTopology.rabbitGatewayConnectorIncluded, true);
  assert.equal(coordination.gatewayTopology.openClawGatewayAware, true);
  assert.equal(coordination.gatewayTopology.hermesGatewayAware, true);
  assert.equal(coordination.gatewayTopology.gatewaysMayNotOverrideActiveBroker, true);
  assert.equal(coordination.leasePairing.rabbitConnectorAutoRetrieve, true);
  assert.equal(coordination.singleWriterPolicy.rabbitNativeBrokerMayRenewWithoutMacAfterBootstrap, true);
  assert.equal(coordination.singleWriterPolicy.leaseControlsExecutionResultWritesOnly, true);
  assert.equal(coordination.singleWriterPolicy.leaseDoesNotGateRabbitNativeSuperuserSession, true);
  assert.equal(coordination.rules.macBrokerMayBootstrapRabbitBroker, true);
  assert.equal(coordination.rules.macBrokerMayBootstrapRestartScopedPrivilegeSession, true);
  assert.equal(coordination.rules.rabbitBrokerMayOperateWithoutMacAfterBootstrap, true);
  assert.equal(coordination.rules.temporaryPrivilegeIndependentOfLeaseExpiry, true);
  assert.equal(coordination.rules.temporaryPrivilegeIndependentOfMacReachabilityAfterBootstrap, true);
  assert.equal(coordination.rules.macBrokerMayNotOverrideActiveRabbitBroker, true);
});

test("gateway topology defines unified superuser routing", async () => {
  const topology = JSON.parse(
    await readFile(
      new URL("../public/broker/gateway-topology.json", import.meta.url),
      "utf8",
    ),
  );

  assert.equal(topology.schemaVersion, 1);
  assert.equal(topology.rules.singleUserFacingTool, "superuser_management");
  assert.ok(topology.superuserManagementIncludes.includes("rabbit_bridge"));
  assert.ok(topology.superuserManagementIncludes.includes("rabbit_native_broker"));
  assert.ok(topology.superuserManagementIncludes.includes("rabbit_gateway_connector"));
  assert.ok(topology.superuserManagementIncludes.includes("openclaw_gateway"));
  assert.ok(topology.superuserManagementIncludes.includes("hermes_gateway"));
  assert.ok(topology.superuserManagementIncludes.includes("chatgpt_codex_client"));
  assert.ok(topology.superuserManagementIncludes.includes("dlam_synthesis"));
  assert.equal(topology.rules.githubIsStorageNotExecutor, true);
  assert.equal(topology.rules.creationIsCallerNotExecutor, true);
  assert.equal(topology.rules.bridgeIsRouterNotExecutor, true);
  assert.equal(topology.rules.rabbitBridgeConnectsCreationToOnDeviceBroker, true);
  assert.equal(topology.rules.assistantClientsMayReviewAuditBundles, true);
  assert.equal(topology.rules.assistantClientsMayExecutePrivilegedActions, false);
  assert.equal(topology.rules.gatewayClaimsRequireEvidence, true);
  assert.equal(topology.rules.noDeviceCommandFromGatewayTopology, true);
});

test("walkthrough guide defines expected response order", async () => {
  const guide = JSON.parse(
    await readFile(
      new URL("../public/broker/walkthrough-guide.json", import.meta.url),
      "utf8",
    ),
  );

  assert.equal(guide.schemaVersion, 1);
  assert.equal(guide.rules.dryRunBeforeLiveAction, true);
  assert.equal(guide.rules.expectedResponseMustBeShownBeforeQueueing, true);
  assert.equal(guide.rules.stopConditionMustBeShown, true);
  assert.equal(guide.rules.bridgeMustShowRouteTarget, true);
  assert.equal(guide.rules.adbAuthorizationPromptMustBeTracked, true);
  assert.equal(guide.rules.offlineRecoveryHelpMustBeAvailable, true);
  assert.ok(guide.defaultOrder.includes("import_tool"));
  assert.ok(guide.defaultOrder.includes("dry_run_elevated_action"));
  assert.ok(guide.entries.every((entry) => entry.doFirst));
  assert.ok(guide.entries.every((entry) => entry.expectedResponse));
  assert.ok(guide.entries.every((entry) => entry.stopCondition));
});

test("execution checklist defines dependency gates", async () => {
  const checklist = JSON.parse(
    await readFile(
      new URL("../public/broker/execution-checklist.json", import.meta.url),
      "utf8",
    ),
  );

  assert.equal(checklist.schemaVersion, 1);
  assert.equal(checklist.globalRules.showBeforeQueueing, true);
  assert.equal(checklist.globalRules.liveDeviceAuthorizationRequiredForDeviceAffectingActions, true);
  assert.equal(checklist.globalRules.bridgeMustSelectRouteBeforeQueueing, true);
  assert.equal(checklist.globalRules.adbAuthorizationPromptMustBeTracked, true);
  assert.equal(checklist.globalRules.offlineRecoveryHelpMustBeAvailable, true);
  assert.equal(checklist.globalRules.persistentChangeDefault, "blocked");
  assert.ok(checklist.items.some((item) => item.id === "hosted_manifest_ready"));
  assert.ok(checklist.items.some((item) => item.id === "live_device_gate_ready"));
  assert.ok(checklist.items.every((item) => item.dependencies.length));
  assert.ok(checklist.items.every((item) => item.evidence.length));
  assert.ok(checklist.items.every((item) => item.blocksIfMissing));
});

test("lease pairing manifest supports QR and connector retrieval", async () => {
  const pairing = JSON.parse(
    await readFile(
      new URL("../public/broker/lease-pairing.json", import.meta.url),
      "utf8",
    ),
  );

  assert.equal(pairing.schemaVersion, 1);
  assert.equal(pairing.lease.defaultLeaseTtlSeconds, 259200);
  assert.equal(pairing.lease.doesNotGateRabbitNativeSuperuserSession, true);
  assert.equal(pairing.pairing.qrTarget, "broker/lease-pairing.json");
  assert.equal(pairing.pairing.rabbitConnectorAutoRetrieve, true);
  assert.equal(pairing.pairing.refreshOnMacBrokerStartup, true);
  assert.equal(pairing.pairing.leaseActionsAffectSuperuserSession, false);
  assert.ok(pairing.pairing.leaseManagerEndpoints.includes("POST /lease/renew"));
  assert.ok(pairing.pairing.leaseManagerEndpoints.includes("POST /lease/release"));
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
  assert.ok(library.variables.some((variable) => variable.name === "route_target"));
});

test("ADB and USB storage templates include route, auth, and mode contracts", async () => {
  const adbUsb = JSON.parse(
    await readFile(
      new URL("../public/broker/request-templates/adb-enable-request.json", import.meta.url),
      "utf8",
    ),
  );
  const adbTcp = JSON.parse(
    await readFile(
      new URL("../public/broker/request-templates/adb-tcpip-request.json", import.meta.url),
      "utf8",
    ),
  );
  const usbStorage = JSON.parse(
    await readFile(
      new URL("../public/broker/request-templates/usb-mass-storage-request.json", import.meta.url),
      "utf8",
    ),
  );

  assert.equal(adbUsb.routePolicy.routeTargetRequired, true);
  assert.equal(adbUsb.adb.transport, "usb");
  assert.equal(adbUsb.adb.systemAuthorizationPrompt.requested, true);
  assert.equal(adbUsb.adb.awarenessBroadcast.enabled, true);
  assert.equal(adbTcp.adb.transport, "tcpip");
  assert.equal(adbTcp.adb.requiresUsbOrPriorAuthorization, true);
  assert.equal(adbTcp.adb.awarenessBroadcast.enabled, true);
  assert.equal(usbStorage.deviceMode.requestedMode, "usb_storage_mode");
  assert.equal(usbStorage.deviceMode.externalHostShouldSeeStorage, true);
  assert.equal(usbStorage.deviceMode.requiresDiscoveryBeforeExecution, true);
});

test("custom skill upload template is broker gated", async () => {
  const template = JSON.parse(
    await readFile(
      new URL("../public/broker/request-templates/custom-skill-upload-request.json", import.meta.url),
      "utf8",
    ),
  );
  const launcher = JSON.parse(
    await readFile(
      new URL("../public/creation-skill/creation-launcher.json", import.meta.url),
      "utf8",
    ),
  );

  assert.equal(template.action, "prepare_custom_skill_upload_request");
  assert.equal(template.skillUpload.hookPolicy.automaticSystemHooking, false);
  assert.equal(template.skillUpload.hookPolicy.requiresBrokerApproval, true);
  assert.ok(template.skillUpload.acceptedExtensions.includes(".md"));
  assert.ok(template.skillUpload.acceptedExtensions.includes(".zip"));
  assert.equal(launcher.resourcePolicy.singleCreationOnly, true);
  assert.equal(launcher.customSkillUploader.automaticHookActivation, false);
});
