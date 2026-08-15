# Broker Service Guide

Use this guide inside the single Superuser Management Custom Creation.

The Creation may request broker bridge, Rabbit on-device broker, and Mac
fallback broker service actions. It must send those actions through the broker
service-control request path. The Creation must not claim it directly started,
stopped, restarted, or escalated any service.

## Startup

1. Load `creation-launcher.json`.
2. Before accepting new requests, close or yield any previous broker instance
   that owns the same route.
3. Clear previous transient broker configuration: route cache, stale endpoint
   selection, presence claims, pending service-control state, and stale
   capability detection.
4. Preserve audit history, queue files, rollback records, published templates,
   and any Rabbit-local current-boot superuser state.
5. Write an audit record proving the cleanup happened.
6. Open or embed the hosted PWA.
7. Load cached guides and templates.
8. Detect the broker bridge.
9. Check Mac fallback reachability.
10. Check Rabbit on-device broker status.
11. Show route target, expected output, blockers, and hints.

## Service Actions

- `status`: read bridge and broker status.
- `start_bridge`: request bridge startup through the broker.
- `restart_bridge`: request bridge restart through the broker.
- `stop_bridge`: request bridge stop through the broker.
- `start_on_device_broker`: request Rabbit broker startup.
- `restart_on_device_broker`: request Rabbit broker restart.
- `stop_on_device_broker`: request Rabbit broker stop.
- `clear_previous_broker_configurations`: clear stale transient route,
  endpoint, presence, pending service-control, and capability-detection state
  before starting a new broker.
- `refresh_routes`: recompute bridge route and ADB status.

## Required Output

Every service-control response must show:

- route target
- expected output
- blockers
- hints
- audit ID or queue path
- startup cleanup evidence
- `privilegedExecutionPerformed`

If the broker cannot prove the action happened, label it as dry-run, queued,
blocked, or unknown.
