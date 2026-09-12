# Bug-fix verification, 2026-09-13

Fix commit: `14e09ed`.

## Requirement-to-evidence map

| Change / expected behavior | Concrete check | Observed result |
| --- | --- | --- |
| Failed exit-node lookup must not report a successful negative Tor detection | Regression test `failed Tor exit-list lookup is an error, not a negative detection`; live Firefox collector with CSP denying Tor and proxy endpoints while permitting IP lookup | Test failed before fix and passed after. Real `collectTorData()` returned `Failed (Exit Node List Unavailable)`, `warning: true`, and zero cached nodes. |
| New exit-list failure message must reach the UI | Fed the real browser collector result into the mounted app's existing reactive `privacyData` state | Actual Vue DOM displayed `Tor NetworkFailed (Exit Node List Unavailable)` with the warning CSS class. |
| HTTP errors / missing IP must not become successful Tor checks | Tests `unsuccessful IP lookup cannot produce a successful Tor check` and `a successful HTTP response without an IP is still a failed lookup` | Failed response regression was red before fix. Both now report `error: true` and `ip: unknown`. HTTP payloads are mocked in these tests. |
| IP-unavailable UI must remain distinct from list-unavailable UI | Live Firefox CSP `connect-src 'self'`, real `collectTorData()` and mounted Vue rendering | Returned and rendered `Failed (IP Unknown)` with warning styling, unknown IP, and zero nodes. No fetch implementation was replaced. |
| Empty list cannot establish non-Tor status | Test `an empty Tor exit list cannot rule out Tor usage` | Returns an error. |
| Successful non-Tor detection must continue working | Normal app startup in Firefox, with real browser APIs and real external services | `Tor Network: Not Detected`, `Exit Nodes Cached: 1328`, `VPN/Proxy: Not Detected (Residential IP)`. All loading indicators disappeared and no card-level error messages remained. No IP addresses or fingerprint values retained in this report. |
| Positive Tor detection must continue working | Test `successful lookup detects Tor exit node` | Returns `isTor: true` with one node. This machine was not connected through Tor, so a real positive-network acceptance check was not performed. |
| An obsolete GeoIP failure must not evict its replacement | Test `an obsolete failed GeoIP request does not evict a newer cached request` | Before fix: 3 requests, expected 2. After fix: exactly 2. Controlled deferred promises reproduce the race, not live network timing. |
| GeoIP callers must still share requests and retry failures | Test `GeoIP shares concurrent lookups and retries after failure`; browser Performance resource entries on normal app startup | Concurrent failure used one request, retry succeeded, subsequent read reused it. Real application made exactly one `https://ipapi.co/json/` request across network/privacy collectors. |
| Clean installs must work from committed manifests | `npm ci --ignore-scripts --no-audit --no-fund` | Previously rejected stale lockfile. After synchronization, installed 163 packages successfully. |
| Regression command and production build must work | `npm test`, `npm run build`, `git diff --check` | Eight tests passed, Vite production build succeeded, diff check passed. |

## Method and limits

The real application was served using its existing `npm run dev -- --host 127.0.0.1` command and opened in Firefox. Normal startup ran without mocks or source changes. Failure-path browser checks used real CSP enforcement to deny network requests, fresh imports of the actual Tor module, and the mounted application's reactive state to observe actual rendering. These are collector-to-component integration checks, not reload-based full-page outage tests. The CSP changes existed only in the test page and were removed by navigation afterward.

Live success and browser-enforced failure checks supplement, rather than replace, the deterministic mocked regression tests. The stale-request race and malformed HTTP response cases remain synthetic boundary checks. No production deployment or real Tor-positive connection was tested.

Full-project lint remains at its measured pre-fix baseline: 49 errors and 8 warnings. The new test file and changed GeoIP utility pass ESLint. This work does not claim the entire codebase is bug-free.
