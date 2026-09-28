# Marketing and App Domain Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Phát hành homepage KidHabit dạng static HTML trên Cloudflare Pages và giữ ứng dụng, checkout PayOS, API và PWA trên Cloudflare Worker hiện tại với hành trình chọn gói liền mạch.

**Architecture:** Một repository tạo hai artifact độc lập. Marketing artifact là HTML/CSS/JS tĩnh và chỉ điều hướng top-level tới app; app artifact giữ auth, cookie, API, checkout, webhook và PWA cùng origin. Subscription tiếp tục thuộc `family_id`, còn `user_id` là tài khoản thực hiện mua; email không phải khóa entitlement.

**Tech Stack:** Next.js 16, React 19, TypeScript, Vitest, Playwright, Cloudflare Workers/OpenNext, Cloudflare Pages static assets, Supabase Auth/Postgres, PayOS.

**Spec:** `docs/superpowers/specs/2026-09-28-marketing-app-domain-split-design.md`

## Global Constraints

- Domain app tạm giữ nguyên `https://goodhabittracking.vanhoa2191.workers.dev` để không mất session, PWA, QR và callback hiện tại.
- Domain homepage mong muốn là `https://kidhabit-home.pages.dev`; xác minh tên project trước khi deploy.
- Homepage phải hiển thị trực tiếp ba gói `solo_monthly`, `monthly`, `yearly`; không có gói miễn phí hoặc trọn đời trong bảng giá bán.
- Homepage không nhận Supabase, PayOS, service-role, pairing hoặc lifecycle secret.
- Mọi OAuth, tạo đơn, PayOS return/cancel/webhook, caregiver invite, QR và API chạy trên app origin.
- Không tạo API subdomain, không mở CORS credentialed và không chia sẻ auth cookie với marketing origin.
- Selling point phải nói về kết quả của gia đình, không nói về cách tổ chức hoặc độ dài của website.
- Tất cả thay đổi hành vi dùng TDD: test fail đúng lý do trước, code tối thiểu, rồi test xanh.
- Production app hiện tại không đổi root behavior trước khi homepage và checkout mới đã được chứng nhận.
- Không thay schema subscription nếu không có bằng chứng contract hiện tại thiếu; schema hiện tại đã unique theo `family_id`.

## Review Focus

- `plan` không hợp lệ hoặc bị sửa tay phải bị từ chối và không mở checkout sai gói; test ở Task 2.
- OAuth quay lại phải giữ đúng ý định mua mà không cho phép open redirect; test ở Task 2.
- Payment link cũ trả về root vẫn phải đọc trạng thái được trong cửa sổ tương thích; test ở Task 3.
- Marketing build không được chứa endpoint API, manifest, service worker hoặc secret marker; test ở Task 4.
- App phải `noindex` nhưng auth, QR camera, PWA và API vẫn hoạt động; test ở Task 5 và Task 6.

---

### Task 1: Origin Contract and Deployment Boundaries

**Files:**
- Modify: `src/lib/site.ts`
- Modify: `scripts/cloudflare-build-environment.mjs`
- Modify: `.env.example`
- Test: `tests/unit/site-origin.test.ts`
- Test: `tests/unit/cloudflare-build-environment.test.ts`

**Interfaces:**
- Produces: `getAppOrigin(): URL`, `getMarketingOrigin(): URL`, `getDeployTarget(): 'combined' | 'marketing' | 'app'` for target-aware build validation.
- Produces: validated public configuration `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_MARKETING_URL`.
- Consumes: current `productionOrigin` as temporary app fallback only outside strict production validation.

- [ ] **Step 1: Write failing origin-contract tests**

Add tests asserting:

```ts
expect(getAppOrigin().origin).toBe('https://app.example');
expect(getMarketingOrigin().origin).toBe('https://www.example');
expect(getDeployTarget()).toBe('app');
```

Also assert malformed URLs and unsupported deploy targets fail in production validation rather than silently producing the legacy canonical.

- [ ] **Step 2: Run the origin tests and verify RED**

Run: `npm run test:unit -- tests/unit/site-origin.test.ts tests/unit/cloudflare-build-environment.test.ts`  
Expected: FAIL because marketing origin and target interfaces do not exist.

- [ ] **Step 3: Implement the target-aware origin contract**

Add the exact interfaces above. Keep existing metadata callers compiling, but route public canonical generation through `getMarketingOrigin()` and app operational URLs through `getAppOrigin()` in later tasks.

- [ ] **Step 4: Run focused tests and typecheck**

Run: `npm run test:unit -- tests/unit/site-origin.test.ts tests/unit/cloudflare-build-environment.test.ts && npm run typecheck`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/site.ts scripts/cloudflare-build-environment.mjs .env.example tests/unit/site-origin.test.ts tests/unit/cloudflare-build-environment.test.ts
git commit -m "feat(config): separate marketing and app origins"
```

### Task 2: Resumable App Checkout Entry

**Files:**
- Create: `src/app/checkout/page.tsx`
- Create: `src/components/CheckoutEntry.tsx`
- Modify: `src/lib/supabase.ts`
- Modify: `src/lib/store.tsx`
- Modify: `src/components/CheckoutModal.tsx`
- Test: `tests/unit/checkout-intent.test.ts`
- Test: `tests/e2e/checkout-entry.spec.ts`

**Interfaces:**
- Consumes: paid `SubscriptionPlan` values `solo_monthly | monthly | yearly` and `getPricingPlan()`.
- Produces: `parseCheckoutPlan(value: string | null): PaidPlan | null`.
- Produces: `/checkout?plan=<paid-plan>` with same-origin Google OAuth return and automatic checkout continuation after session restoration.
- Produces: `signInWithGoogle(returnPath?: string): Promise<{ error: Error | null }>` where `returnPath` accepts same-origin relative paths only.

- [ ] **Step 1: Write failing unit tests for plan and return-path validation**

Assert three paid plan IDs pass, `trial`, `lifetime`, unknown values and duplicate/empty values fail, and external return URLs are rejected or normalized to `/`.

- [ ] **Step 2: Run unit tests and verify RED**

Run: `npm run test:unit -- tests/unit/checkout-intent.test.ts`  
Expected: FAIL because `parseCheckoutPlan` and the safe return-path contract do not exist.

- [ ] **Step 3: Implement checkout intent and OAuth continuation**

`CheckoutEntry` must:

- show the selected plan summary before payment;
- offer one primary “Đăng nhập để thanh toán” action when signed out;
- return to the same sanitized `/checkout?plan=...` URL after Google OAuth;
- open the existing checkout surface automatically after auth/family readiness;
- show a recoverable invalid-plan state linking back to marketing pricing;
- never create a payment request before an authenticated parent context exists.

- [ ] **Step 4: Write and run failing E2E tests**

Add scenarios for valid plan summary, invalid plan recovery, signed-out login intent preservation, authenticated automatic checkout and mobile layout.  
Run: `npm run test:e2e -- tests/e2e/checkout-entry.spec.ts --project=chromium`  
Expected: FAIL until route behavior and selectors are complete.

- [ ] **Step 5: Complete the route and make focused tests GREEN**

Run: `npm run test:unit -- tests/unit/checkout-intent.test.ts && npm run test:e2e -- tests/e2e/checkout-entry.spec.ts --project=chromium`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/checkout src/components/CheckoutEntry.tsx src/components/CheckoutModal.tsx src/lib/supabase.ts src/lib/store.tsx tests/unit/checkout-intent.test.ts tests/e2e/checkout-entry.spec.ts
git commit -m "feat(billing): add resumable checkout entry"
```

### Task 3: PayOS Return and Entitlement Compatibility

**Files:**
- Modify: `src/lib/billing/payos-server.ts`
- Modify: `src/app/page.tsx`
- Modify: `src/app/checkout/page.tsx`
- Test: `tests/unit/payos-server.test.ts`
- Test: `tests/e2e/payment-return.spec.ts`
- Test: `tests/integration/migrations/family-tenancy.test.ts`

**Interfaces:**
- Consumes: `getAppOrigin()` from Task 1.
- Produces: new PayOS return/cancel URLs on `/checkout`, while the legacy root handler remains functional for already-created links.
- Preserves: `payment_orders.family_id`, `payment_orders.user_id`, unique `user_subscriptions.family_id` and idempotent webhook upsert.

- [ ] **Step 1: Extend PayOS URL and legacy-return tests**

Assert newly created URLs are:

```text
https://app.example/checkout?payment=success&orderCode=<code>
https://app.example/checkout?payment=cancel&orderCode=<code>
```

Keep an E2E assertion that `/?payment=success&orderCode=...` still resolves payment state.

- [ ] **Step 2: Run tests and verify RED**

Run: `npm run test:unit -- tests/unit/payos-server.test.ts && npm run test:e2e -- tests/e2e/payment-return.spec.ts --project=chromium`  
Expected: new `/checkout` URL assertion FAILS while legacy behavior remains green.

- [ ] **Step 3: Route new payment returns through checkout**

Use `getAppOrigin()`, centralize payment-return parsing so both root compatibility and `/checkout` use the same validated status lookup, and never activate entitlement from query parameters alone.

- [ ] **Step 4: Verify schema ownership contract**

Add/retain assertions that subscription ownership is unique by family, payer is recorded by user ID and email is not an entitlement key.

- [ ] **Step 5: Run billing verification**

Run: `npm run test:unit -- tests/unit/payos-server.test.ts && npm run test:api -- tests/api/payment-create.test.ts tests/api/payment-status.test.ts tests/api/payment-webhook.test.ts && npm run test:integration -- tests/integration/migrations/family-tenancy.test.ts`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/billing/payos-server.ts src/app/page.tsx src/app/checkout/page.tsx tests/unit/payos-server.test.ts tests/e2e/payment-return.spec.ts tests/integration/migrations/family-tenancy.test.ts
git commit -m "feat(billing): preserve checkout across domain split"
```

### Task 4: Static Marketing Site with Selling Points and Inline Pricing

**Files:**
- Create: `apps/marketing/site-content.mjs`
- Create: `apps/marketing/render-site.mjs`
- Create: `apps/marketing/styles.css`
- Create: `apps/marketing/client.js`
- Create: `scripts/build-marketing.mjs`
- Modify: `package.json`
- Test: `tests/unit/marketing-build.test.ts`

**Interfaces:**
- Consumes: `NEXT_PUBLIC_APP_URL` as a validated HTTPS origin at build time.
- Produces: `dist/marketing/` static artifact with homepage and public information pages.
- Produces: pricing CTA URLs `/checkout?plan=solo_monthly|monthly|yearly` on the app origin.

- [ ] **Step 1: Write failing static-artifact tests**

Build fixture assertions must verify:

- headline/copy communicates KidHabit family outcomes;
- the removed phrase “Xem đúng phần bạn cần, không phải đọc một trang thật dài” is absent;
- all three plan prices and exact checkout links are present;
- no `trial` or `lifetime` sales card is present;
- canonical, Open Graph, robots and sitemap use marketing origin;
- no `/api/`, Supabase key marker, service worker registration or manifest link is present;
- HTML landmarks, focusable CTAs and minimum readable viewport metadata exist.

- [ ] **Step 2: Run tests and verify RED**

Run: `npm run test:unit -- tests/unit/marketing-build.test.ts`  
Expected: FAIL because the marketing builder and artifact do not exist.

- [ ] **Step 3: Implement the dependency-free static builder**

Generate semantic HTML using shared page templates and escaped content. Create a light, high-contrast, mobile-first homepage with:

- product promise and primary demo/app CTA;
- three outcome-led selling points: know what to build, assign clearly, see daily progress;
- an explicit three-step parent-child loop;
- inline three-tier pricing with one CTA per plan;
- risk reducers, FAQ, approved legal/support navigation and app login link.

Use Lucide-compatible inline SVG or existing brand assets, not emoji structural icons. Keep JavaScript limited to mobile navigation and optional consent-safe UI behavior.

- [ ] **Step 4: Add build commands and validate artifact**

Add `build:marketing`, `preview:marketing` and `deploy:marketing` scripts.  
Run: `npm run build:marketing && npm run test:unit -- tests/unit/marketing-build.test.ts`  
Expected: PASS and `dist/marketing/index.html` exists.

- [ ] **Step 5: Commit**

```bash
git add apps/marketing scripts/build-marketing.mjs package.json tests/unit/marketing-build.test.ts
git commit -m "feat(marketing): build static sales site"
```

### Task 5: App-Only Entry, Public Links and PWA Ownership

**Files:**
- Create: `src/components/AppEntryGate.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/robots.ts`
- Modify: `src/app/sitemap.ts`
- Modify: `src/components/Header.tsx`
- Modify: `src/components/ParentSettingsTab.tsx`
- Modify: `src/components/CheckoutModal.tsx`
- Modify: `src/lib/safe-achievement-share.ts`
- Test: `tests/e2e/entry-journey.spec.ts`
- Test: `tests/e2e/public-discovery.spec.ts`
- Test: `tests/e2e/pwa-installability.spec.ts`

**Interfaces:**
- Consumes: `getMarketingOrigin()` and `getDeployTarget()` from Task 1.
- Produces: app root with parent/child/caregiver/demo/session resolution and a compact signed-out gateway.
- Produces: absolute marketing links for pricing, docs, framework, roadmaps, legal and generic public sharing.
- Preserves: manifest/service worker/PWA on app target only.

- [ ] **Step 1: Update journey tests first**

Assert:

- returning parent and paired child never see a sales page;
- signed-out app root offers Google login and manual/camera pairing entry;
- “Trang chủ” navigates to marketing origin;
- app pages emit `noindex` and no public sitemap entries;
- PWA remains installable on app origin.

- [ ] **Step 2: Run E2E tests and verify RED**

Run: `npm run test:e2e -- tests/e2e/entry-journey.spec.ts tests/e2e/public-discovery.spec.ts tests/e2e/pwa-installability.spec.ts --project=chromium --workers=1`  
Expected: FAIL on app-only entry, external public links and app noindex.

- [ ] **Step 3: Implement app-only root and target-specific metadata**

Replace the root marketing branch with `AppEntryGate`; keep legacy payment return handling. Remove `LandingPage` from the app bundle after marketing parity is confirmed. Point public information links to marketing origin. Keep sensitive routes and PWA scoped to app.

- [ ] **Step 4: Run focused E2E and accessibility tests**

Run: `npm run test:e2e -- tests/e2e/entry-journey.spec.ts tests/e2e/public-discovery.spec.ts tests/e2e/pwa-installability.spec.ts --project=chromium --workers=1 && npm run test:a11y -- --project=chromium --workers=1`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/AppEntryGate.tsx src/app/page.tsx src/app/layout.tsx src/app/robots.ts src/app/sitemap.ts src/components/Header.tsx src/components/ParentSettingsTab.tsx src/components/CheckoutModal.tsx src/lib/safe-achievement-share.ts tests/e2e/entry-journey.spec.ts tests/e2e/public-discovery.spec.ts tests/e2e/pwa-installability.spec.ts
git commit -m "feat(app): separate authenticated entry from marketing"
```

### Task 6: Independent CI, Deploy and Release Verification

**Files:**
- Create: `.github/workflows/marketing.yml`
- Create: `scripts/verify-marketing-release.mjs`
- Modify: `.github/workflows/ci.yml`
- Modify: `scripts/verify-release-candidate.mjs`
- Modify: `scripts/verify-live-family-lifecycle.mjs`
- Modify: `docs/deployment.md`
- Modify: `docs/architecture.md`
- Modify: `plans/260927-1352-audit-remediation-growth-readiness/phase-03-seo-share-and-public-information-architecture.md`
- Modify: `plans/260927-1352-audit-remediation-growth-readiness/phase-09-localization-and-maintainability.md`
- Modify: `plans/260927-1352-audit-remediation-growth-readiness/phase-10-release-certification-and-production-rollout.md`
- Test: `tests/unit/marketing-release.test.ts`

**Interfaces:**
- Produces: `npm run verify:marketing-release` for static artifact/link/headers smoke checks.
- Produces: separate CI jobs and deployment targets for marketing Pages and app Worker.
- Preserves: app health, lifecycle cron, observability and live-family verification against app origin only.

- [ ] **Step 1: Write failing release-contract tests**

Assert marketing release validation rejects HTTP failures, wrong canonical, checkout links outside the configured app origin, exposed API routes and missing plan CTAs. Assert app release validation still requires `/api/health` readiness and all dependency checks.

- [ ] **Step 2: Run tests and verify RED**

Run: `npm run test:unit -- tests/unit/marketing-release.test.ts`  
Expected: FAIL because the release verifier does not exist.

- [ ] **Step 3: Implement independent build/deploy jobs and docs**

Marketing deploy builds only `dist/marketing` and deploys to Pages project `kidhabit-home`. App deploy keeps OpenNext Worker configuration and secrets. Parameterize smoke URLs without logging credentials. Document Cloudflare Pages setup, Supabase redirect allowlist, PayOS callback ownership, rollout and rollback.

- [ ] **Step 4: Reconcile the existing 10-phase plan**

Record the split under Phase 3, module/artifact separation under Phase 9 and two-surface certification under Phase 10. Do not create a new phase number or mark release gates complete without evidence.

- [ ] **Step 5: Run repository quality gates**

Run: `npm run ci && NEXT_PUBLIC_MARKETING_URL=http://127.0.0.1:4173 npm run build:marketing && npm run verify:marketing-release -- --dir dist/marketing --app-origin https://goodhabittracking.vanhoa2191.workers.dev --marketing-origin http://127.0.0.1:4173`  
Expected: PASS with no secrets in output.

- [ ] **Step 6: Commit**

```bash
git add .github/workflows/marketing.yml .github/workflows/ci.yml scripts/verify-marketing-release.mjs scripts/verify-release-candidate.mjs scripts/verify-live-family-lifecycle.mjs docs/deployment.md docs/architecture.md plans/260927-1352-audit-remediation-growth-readiness tests/unit/marketing-release.test.ts
git commit -m "ci(release): split marketing and app delivery"
```

### Task 7: Visual QA, Temporary-Domain Cutover and Production Evidence

**Files:**
- Modify only if QA reveals a proven defect in files owned by Tasks 2-6.
- Evidence: `plans/260927-1352-audit-remediation-growth-readiness/reports/domain-split-release-evidence.md`

**Interfaces:**
- Consumes: static marketing artifact, app Worker release candidate and release verifiers.
- Produces: live homepage URL, live app URL, exact commit SHA, Cloudflare deployment IDs and sanitized QA evidence.

- [ ] **Step 1: Run local two-surface QA**

Start one deterministic app server and one deterministic static marketing server after checking ports. Verify desktop 1440px, mobile 375px and mobile landscape for homepage selling points, all three plan CTAs, checkout login continuation, payment summary, parent entry, child manual/camera entry and PWA install surface. Stop both servers after QA.

- [ ] **Step 2: Run full pre-deploy verification**

Run exact-SHA lint, typecheck, unit/API/integration tests, Cloudflare build, marketing build, Chromium desktop/mobile E2E, accessibility, secret scan and `git diff --check`.  
Expected: all required gates PASS; pre-existing unrelated failures are documented, not hidden.

- [ ] **Step 3: Deploy homepage first**

Create or reuse Cloudflare Pages project `kidhabit-home`, deploy `dist/marketing`, record the returned production URL and run `verify:marketing-release` against it. Do not change app root yet if live marketing verification fails.

- [ ] **Step 4: Configure provider allowlists and deploy app**

Confirm Supabase allows the exact app checkout return URL. Keep PayOS webhook on app origin. Deploy the app Worker only after homepage verification, then run `/api/health`, public-to-app checkout, legacy payment return, QR/manual pairing and caregiver invite smoke checks.

- [ ] **Step 5: Execute one real payment certification with explicit confirmation**

Because this spends money, pause for the user's explicit confirmation immediately before creating/settling the real PayOS order. After confirmation, test one lowest-priced order, verify webhook idempotency and entitlement on the correct family, and redact account/payment data from evidence.

- [ ] **Step 6: Record release evidence and update plan status**

Write only sanitized evidence. Phase 3/9 implementation can be marked complete when their checks pass; Phase 10 remains open for any device, legal, payment or observation gate not actually certified.

- [ ] **Step 7: Commit and push final evidence**

```bash
git add plans/260927-1352-audit-remediation-growth-readiness/reports/domain-split-release-evidence.md plans/260927-1352-audit-remediation-growth-readiness
git commit -m "docs(release): record domain split verification"
git push origin codex/audit-remediation-growth-readiness
```

## Self-Review Result

- Spec coverage: homepage selling points, inline pricing, resumable checkout, family-owned subscription, route ownership, auth/QR/PayOS compatibility, SEO/PWA, CI, rollback and temporary-domain deployment all map to Tasks 1-7.
- Step scan: every task has one RED/GREEN cycle and an independently reviewable deliverable.
- Type consistency: paid plan IDs and origin functions are defined once and consumed by later tasks.
- Review focus: all five high-risk conditions have an explicit owning test.
- Proportion: plan stays interface/test oriented; it does not embed component implementations.
