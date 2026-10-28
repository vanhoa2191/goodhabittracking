# Cloudflare 1101 runtime diagnosis — 2026-10-23

## Reproduction and cause

On production merge `516729e7`, root observed all app requests return HTTP 500 / Cloudflare 1101 after deployment. This debugger made no production changes; root owns rollback and deployment.

Using the existing Next 16.4.2 / OpenNext Cloudflare 1.20.7 build, started installed Wrangler locally on `127.0.0.1:8799` and requested `/api/health`. It returned HTTP 500 with:

```text
Error: Unexpected loadManifest(/.next/server/preview-props.json) call!
  at loadManifest
  at NextNodeServer.getPreviewProps
  at new Server
  at new NextNodeServer
```

This fails while the bundled server is constructed, before route/DB configuration. The old adapter only inlines `*-manifest`, `required-server-files` and `prefetch-hints` JSON. Next 16.4 loads the new mandatory `server/preview-props.json`, so builds pass but the Worker crashes on its first dynamic request.

Local raw log: `/tmp/codex-resume-20261023/runtime-local.log`. The reproduction server was stopped by its exact PID before rebuilding. No AI or other provider request was made by the health probe.

## Primary-source verification

- [Upstream issue #1355](https://github.com/opennextjs/opennextjs-cloudflare/issues/1355) describes this same constructor crash.
- Live GitHub API for [PR #1356](https://github.com/opennextjs/opennextjs-cloudflare/pull/1356) confirms it merged at `2026-10-15T06:35:28Z`. Search-index results saying the PR remains open are stale.
- [Official release 1.20.12](https://github.com/opennextjs/opennextjs-cloudflare/releases/tag/%40opennextjs%2Fcloudflare%401.20.12), published `2026-10-15T07:51:55Z`, explicitly adds Next 16.4 support via AWS adapter 4.1.11 and PR #1356 / commit `f993c8c` to inline `preview-props.json`.
- Downloaded official npm tarballs for 1.20.12 and 1.20.13 into `/tmp/codex-opennext-inspect/`. Both actual `dist/cli/build/patches/plugins/load-manifest.js` files contain the additional `join(dotNextDir, "server/preview-props.json")` glob entry.
- Latest 1.20.13 also includes AWS 4.1.12, server-action redirect and named-chunk changes. Exact 1.20.12 is the smaller supported upgrade addressing the observed regression.

## Proposed repair and acceptance gate

Upgrade the existing `@opennextjs/cloudflare` dependency from exact 1.20.7 to exact 1.20.12, regenerate the lockfile without broad audit fixes, rebuild, and probe the resulting bundle with actual local workerd. Do not apply a handwritten dependency/worker patch or downgrade Next to the vulnerable 16.3 line.

Local runtime must return route responses instead of the constructor exception before any redeploy. A local health `503` with synthetic/missing configuration may establish only successful route loading, not production readiness. Production health must separately be `ready` on the intended SHA after deployment.

## Implemented repair and observed validation

Root authorized and the executor installed exact OpenNext1.20.12. Its required dependency/peer closure also updates AWS adapter4.1.11 and Wrangler4.152.0/workerd1.20261019.1. Root independently reviewed the lockfile: 75 package-version changes, 18 added paths and 81 removed paths; the original executor verified the affected entries belong to the old/new adapter dependency/peer closure. Next16.4.2, React and Supabase constraints are unchanged; no new direct dependency was added.

The first audit correctly blocked the adapter's `@node-minify/core@9.0.2` dependency, which pins vulnerable glob10.3.3. Adapter1.20.13 retains the same pin and would not remove the blocker. Root independently verified the [official glob advisory](https://github.com/isaacs/node-glob/security/advisories/GHSA-5j98-mcp5-4vw2), then authorized only a parent-scoped override to glob10.5.0 under `@node-minify/core`. Existing sharp0.35.5 and the audit policy remain unchanged. Revisit the scoped override when upstream fixes its pin.

Both native executors subsequently hit usage limits. Root completed review, validation and integration directly, without substituting another model/provider. The failing Worker bundle was archived outside the repository at `/tmp/codex-opennext-before/open-next-1.20.7-failing.tar` before rebuilding.

Fresh root results with Node26.11.1 and normal TLS verification (the inherited TLS-disable variable was removed for these commands):

- `npm run check:audit`: exit0.
- `npm run ci`: exit0. Includes full lint/typecheck, **344 files / 3730 tests**, habit framework/translations, secrets, audit, Cloudflare build and performance. Full test duration94.57s; no timeout change or retry required.
- Performance: largest initial route1,346,767 bytes; all chunks4,685,864 bytes; largest chunk258,446 bytes.
- New real-Worker gate on the old bundle: executor observed exit1 / HTTP500. Root had independently observed the same production1101 failure.
- New real-Worker gate on the rebuilt fixed bundle: root observed **exit0**, HTTP503 and application health JSON `unavailable`, with `scope:local-worker-bootstrap` and `productionReadiness:not-verified`. The runtime now initializes and loads the health route without secrets; production readiness is a separate post-deploy check.

Logs: `/tmp/codex-resume-20261023/adapter-final-ci.log`, `adapter-final-audit.log`, `runtime-gate-negative.log`, `runtime-gate-positive.log`. Final pipeline deployment remains pending at this pre-push checkpoint.
