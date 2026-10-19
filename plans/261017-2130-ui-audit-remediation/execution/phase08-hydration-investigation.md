# Phase 08 — Hydration mismatch follow-up

Status: Chromium production comparison passed; original development warning remains unattributed. WebKit comparison belongs to its verification lane.

## Observed symptom

`/tmp/phase08-webkit-server.log:34` contains a React recoverable hydration error at `Home` (`src/app/page.tsx:136`). The client expected the app's initial loading surface (`data-testid=app-surface`, `data-app-mode=loading`, `app-mode-parent`), but encountered a hidden div containing a Suspense boundary. Nearby browser log entries mention a state update before mount and a script tag during client rendering. These are actual observed warnings and must not be silently ignored.

The difference is not evidence of a parent/kid-mode race: the expected client markup is the stable loading/gateway shell (`page.tsx:127–136`). `isEntryReady` starts from false (`src/lib/store.tsx:258–260`), while session snapshots use `useSyncExternalStore` with a false server snapshot (`page.tsx:82–91`). The hidden div/Suspense side of the diff is consistent with React streaming machinery, but that is an interpretation of the log, not an established cause.

## Attribution limits and fixture review

The server log has no test identifier or timestamp attached to the browser warning. Chromium and WebKit checks overlapped on the same development server; the WebKit investigator cannot tie the warning to its first failed test. Do not label this a WebKit-specific failure.

Audit fixture/spec search found API interception and local/session-storage initialization, with no `page.setContent`, HTML document fulfillment, or other explicit rewrite of server-rendered HTML. `public/sw.js:70–72` fetches navigations from network and falls back to offline HTML only on fetch failure; static chunks may be cached (`sw.js:74–81`). This does not prove service-worker involvement. Fresh-context probes below explicitly blocked service workers to remove that variable.

## Bounded reproduction attempt

Using Node v26.11.1 and installed Playwright Chromium, headless fresh browser contexts (`vi-VN`, `serviceWorkers: block`) navigated to the existing shared development server at `http://127.0.0.1:3111`. Each meaningful probe waited until `app-surface[data-app-mode]` was no longer `loading`, then collected all `pageerror` and `console.error` messages. The demo probe additionally waited for a visible `kid-hero` and all three repeated probes waited one further second.

| Probe | Route | Ready state | Console errors / page errors |
| --- | --- | --- | --- |
| Initial full-hydration check | `/` | gateway | 0 / 0 |
| Repeat fresh context 1 | `/` | gateway | 0 / 0 |
| Repeat fresh context 2 | `/?demo=1` | kid, hero visible | 0 / 0 |
| Repeat fresh context 3 | `/` | gateway | 0 / 0 |

Three earlier short probes waited only network-idle plus 500 ms and were still in loading mode; they are excluded from clean-hydration evidence. Waiting for network-idle alone is insufficient to prove application hydration completed.

A native WebKit launch could not run on this Oracle Linux host because of missing/incompatible dependencies. The WebKit lane has an independent supported Docker runtime (`mcr.microsoft.com/playwright:v1.63.0-noble`) for its matrix; no package installation or shared server restart was performed in this investigation.

## Disposition / next decisive check

No source change is justified by the current evidence. The original warning is unreproduced, and four clean development navigations do not prove production behavior or explain the original event. After the leader provides a production build/server, repeat the fresh-context `/` and `/?demo=1` checks in Chromium and the supported WebKit runtime, assert actual gateway/kid readiness, collect console/page errors and stream/CSP diagnostics, and compare against development. Only then decide whether this is a development streaming artifact or a reproducible release defect. Do not suppress hydration warnings or remove streaming containers as a speculative fix.

## Production-build comparison

The leader supplied a built production server at `http://localhost:3111` using the same E1 feature manifest (environment fingerprint `.omx/ui-execution/phase08-final-gates/production-environment.json`). A fresh Chromium context per entry route, `vi-VN` locale and service workers blocked, captured all console errors and page errors. Each navigation waited for the precise gateway/kid mode and one additional second; demo entry additionally waited for a visible `kid-hero`. Each context then reloaded and waited for its precise ready mode again.

| Route | Step | Ready mode | Console/page errors |
| --- | --- | --- | --- |
| `/` | fresh navigation | gateway | 0 |
| `/` | reload | gateway | 0 |
| `/?demo=1` | fresh navigation | kid, hero visible | 0 |
| `/?demo=1` | reload | kid | 0 |

Raw result: `/tmp/phase08-production-hydration.json`. All four checks passed. No hydration-source change was required. This reduces release concern for these entry flows, but does not prove the cause of the original shared-dev-server error or cover every browser/session. WebKit production results are tracked by the dedicated lane; no macOS/iOS/real-screen-reader claim follows from this check.
