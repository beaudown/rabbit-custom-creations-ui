# HTTPS Relay Test - 2026-08-19

## Status

- State: testing only
- Release QR allowed: false
- Testing QR allowed: true
- Preferred substitute route: authenticated public HTTPS relay
- Public relay URL: `https://michaels-macbook-pro.tailcfaeac.ts.net`
- Hosted app URL for testing: `https://beaudown.github.io/rabbit-custom-creations-ui/?creation=A1BrokerTestV2&broker=https%3A%2F%2Fmichaels-macbook-pro.tailcfaeac.ts.net`
- Relay token: stored locally only at `/private/tmp/rabbit-https-relay-token.txt`

Do not commit or publish the relay token. Do not embed it in QR codes.

## Current Evidence

- GitHub Pages run `32218104789` completed successfully.
- Hosted `broker/release-gate.json` now declares the HTTPS relay substitute and keeps `releaseQrAllowed=false`.
- Existing Mac broker responds on `http://100.80.216.88:8792/health`.
- Temporary launchd job `rabbit.https.relay` runs `scripts/gateway-relay.mjs`.
- Relay listens on `127.0.0.1:8794`.
- Tailscale Funnel proxies `https://michaels-macbook-pro.tailcfaeac.ts.net/` to `http://127.0.0.1:8794`.
- Public `/relay/health` returns `relay_configured_for_https_test`.
- Authenticated public `/health` forwards to the Mac broker.
- Verified flags remain false: `privilegedExecutionPerformed`, `persistentChange`, and `otaBreakingChange`.

## Rabbit Test Instructions

1. Scan the testing QR for the hosted app URL above.
2. Confirm Broker endpoint is `https://michaels-macbook-pro.tailcfaeac.ts.net`.
3. Enter the relay token manually from `/private/tmp/rabbit-https-relay-token.txt`.
4. Tap Step 1 only.
5. Tap Step 2 only.
6. Stop and record the exact Step 2 output.

Do not press service, approval, gateway, skill upload, lease, action, reboot, ADB,
root, install, recovery, fastboot, shell, or cleanup controls during this test.

## Pass Criteria

- Step 1 reports assets ready.
- Step 2 reports the broker route is reachable through HTTPS.
- The response still shows no privileged execution.
- No token appears in any QR, GitHub file, screenshot, or shared memory.

## Fail Criteria

- Step 2 reports broker offline or route unreachable.
- Rabbit cannot load the hosted app.
- The app asks for a token-bearing QR.
- Any response claims privileged execution during this route test.

## Next Update Required

After Rabbit testing, update:

- `public/broker/release-gate.json`
- `public/broker/remote-broker-config.json`
- this note
- `/Users/z3k3z/Documents/AgentSharedMemory/shared/inbox/codex-chatgpt.md`
- `/Users/z3k3z/Documents/AgentSharedMemory/shared/session-index.json`

Keep release QR blocked until Rabbit route, service status, approval dialog, and
gateway relay checks all return controlled responses.
