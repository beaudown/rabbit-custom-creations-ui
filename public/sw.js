const CACHE_NAME = "rabbit-superuser-management-v1";

const scopedPath = (path) => new URL(path, self.registration.scope).pathname;

const STATIC_ASSETS = [
  scopedPath("./"),
  scopedPath("manifest.webmanifest"),
  scopedPath("qr-launch-sheet.html"),
  scopedPath("imessage-hermes-qr-sheet.html"),
  scopedPath("imessage-broker.html"),
  scopedPath("imessage-broker-actions.html"),
  scopedPath("favicon.svg"),
  scopedPath("creation-skill/manifest.json"),
  scopedPath("creation-skill/creation-launcher.json"),
  scopedPath("creation-skill/first-run-readiness.md"),
  scopedPath("creation-skill/enablement-guide.md"),
  scopedPath("creation-skill/broker-service-guide.md"),
  scopedPath("creation-skill/custom-skill-uploader.md"),
  scopedPath("creation-skill/instructions.md"),
  scopedPath("creation-skill/walkthrough-guide.md"),
  scopedPath("creation-skill/execution-checklist.md"),
  scopedPath("creation-skill/usb-storage-guide.md"),
  scopedPath("creation-skill/settings.json"),
  scopedPath("broker/sync-manifest.json"),
  scopedPath("broker/gateway-topology.json"),
  scopedPath("broker/rabbit-native-broker-spec.json"),
  scopedPath("broker/remote-broker-config.json"),
  scopedPath("broker/mac-local-broker-config.json"),
  scopedPath("broker/broker-coordination.json"),
  scopedPath("broker/lease-pairing.json"),
  scopedPath("broker/prompt-library.json"),
  scopedPath("broker/walkthrough-guide.json"),
  scopedPath("broker/execution-checklist.json"),
  scopedPath("broker/audit-manifest.json"),
  scopedPath("broker/audit-log.jsonl"),
  scopedPath("broker/request-templates/temporary-privilege-dry-run.json"),
  scopedPath("broker/request-templates/adb-enable-request.json"),
  scopedPath("broker/request-templates/adb-tcpip-request.json"),
  scopedPath("broker/request-templates/broker-service-control-request.json"),
  scopedPath("broker/request-templates/custom-skill-upload-request.json"),
  scopedPath("broker/request-templates/normal-reboot-request.json"),
  scopedPath("broker/request-templates/fastboot-reboot-request.json"),
  scopedPath("broker/request-templates/recovery-reboot-request.json"),
  scopedPath("broker/request-templates/storage-export-request.json"),
  scopedPath("broker/request-templates/usb-mass-storage-request.json")
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((match) => match || caches.match(scopedPath("./"))),
      ),
  );
});
