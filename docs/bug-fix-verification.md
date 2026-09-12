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

## Full-page production acceptance follow-up

Served the unmodified `dist/` output through Vite's public `preview()` API on three separate localhost origins. Port 4173 had no added policy, port 4174 sent `Content-Security-Policy: connect-src 'self' https://api.ipify.org https://ipapi.co`, and port 4175 sent `Content-Security-Policy: connect-src 'self'`. Each scenario was a fresh page navigation. These checks did not import collectors manually, write Vue state, replace fetch, or substitute response payloads. The actual production asset `/assets/index-COrY5bGx.js` drove startup, collection, and rendering.

- **Exit-list outage, port 4174:** DOM assertion passed for `Failed (Exit Node List Unavailable)` and warning styling. Zero pending loading indicators and zero card-level errors. This supersedes the earlier limitation concerning manually connecting collector results to the UI.
- **IP outage, port 4175:** DOM assertions passed for `Failed (IP Unknown)`, IP `unknown`, cached nodes `0`, and warning styling. Zero pending loading indicators and zero card-level errors. Privacy actions remained rendered.
- **Unrestricted production, port 4173:** An assertion expecting a successful negative lookup failed because the external exit list was unavailable on this run. The actual UI instead displayed the corrected `Failed (Exit Node List Unavailable)` warning with zero nodes. Follow-up assertions verified that warning, exactly one GeoIP request, zero loading indicators, and zero card-level errors. Earlier unrestricted development runs successfully loaded 1328 nodes. External list availability is therefore a constraint, not evidence of a successful production Tor-list lookup.
- The report download button was clicked in the list-outage scenario, but no downloaded artifact was located in the default Downloads directory. Export contents are therefore not claimed as verified.


## Final whole-result rerun (23:53–23:54 UTC)

After the requirement map was complete, reran `npm ci --ignore-scripts --no-audit --no-fund`, all eight named tests in the map, `npm run build`, `git diff --check`, and full lint. Clean install, every regression check, production build, and diff validation passed. Lint remained at 49 errors and 8 warnings. The freshly rebuilt production asset hash was unchanged.

Then navigated through all three production origins again. List-outage assertions passed for the exact failure message, warning styling, known IP, and zero nodes. A broader assertion also requiring every unrelated card to finish failed: `Enumerating devices...` was still pending after the bounded wait. This is an observed browser/media-enumeration limitation, so completion of every card is not claimed for every run. The corrected privacy outputs were independently asserted and passed. IP-outage assertions passed for the exact message, warning, unknown IP, and zero nodes, with no pending cards. Unrestricted production again encountered an unavailable exit list and correctly reported its failure, made exactly one GeoIP request, and had no pending or error cards.

Every changed public output was re-observed on the final build. The successful real Tor-list network path remains externally unavailable on the last production runs, while the two membership outcomes, failed/missing HTTP IP responses, empty lists, shared/retry caching, and stale-request race all passed their named deterministic checks again. Earlier differential verification against exact pre-fix source produced five failures and three passes using the identical suite, versus eight passes on the fix.

Full-project lint remains at its measured pre-fix baseline: 49 errors and 8 warnings. The new test file and changed GeoIP utility pass ESLint. This work does not claim the entire codebase is bug-free.
