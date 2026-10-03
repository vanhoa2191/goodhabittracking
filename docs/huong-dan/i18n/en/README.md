# KidHabit Hero User Guide

This guide describes **all KidHabit Hero features** as users see and use them, then shows which features **connect** to one another. Each file begins with “In this guide” and ends with “Related,” so you can move from one feature to the features that go with it without starting your search again.

KidHabit Hero helps parents and children build good habits through small daily actions: parents assign tasks, children mark them complete, parents approve them, and children collect stars to redeem rewards chosen by their parents. The app does not use stars to compare children or judge their character ([see the principles](06-khoa-hoc-thoi-quen.md#nguyen-tac)).

## Read by role

| You are | Read in this order |
|---|---|
| A new parent who wants to get started | [1. Getting started](01-bat-dau.md) → [2. Child screen](02-man-hinh-be.md) → [3. Today and approvals](03-hom-nay-va-duyet-viec.md) |
| A parent who wants to design habits | [4. Designing habits](04-thiet-ke-thoi-quen.md) → [6. Habit science](06-khoa-hoc-thoi-quen.md) |
| A parent managing the family and devices | [5. Family and settings](05-gia-dinh-va-cai-dat.md) → [9. Security and privacy](09-bao-mat-va-rieng-tu.md) |
| A parent interested in plans and payment | [7. Plans and payment](07-goi-va-thanh-toan.md) → [8. Refer a friend](08-gioi-thieu-ban-be.md) |
| An operator or customer support agent | [10. Administration and operations](10-quan-tri-va-van-hanh.md) |
| A website viewer or content writer | [11. Website and public pages](11-website-va-trang-cong-khai.md) |
| Someone who wants the big picture | [12. Connection map and scenarios](12-ban-do-lien-ket.md) and [13. Glossary](13-thuat-ngu.md) |

## Contents

1. [Getting started](01-bat-dau.md): ways to enter the app, sign in, set up a family, roles, language, and the demo.
2. [Child screen](02-man-hinh-be.md): tasks, completion, postponing, timers, stars, levels, streaks, badges, rewards, rankings, mascots, morning letters, journals, and dream city.
3. [Today and approvals](03-hom-nay-va-duyet-viec.md): tasks awaiting approval, rewards awaiting approval, each child’s progress, weekly review, statistics, printing, and sharing.
4. [Designing habits](04-thiet-ke-thoi-quen.md): task management, the library, the 47-habit framework, programmes and cues, age-based roadmaps, and the reward library.
5. [Family and settings](05-gia-dinh-va-cai-dat.md): child profiles, device pairing, caregivers, account, PIN, appearance, privacy, reminders, app installation, data, and taking a break.
6. [Habit science](06-khoa-hoc-thoi-quen.md): principles, the four phases, suggestion logic, 16 character profiles, and 7 ways of giving.
7. [Plans and payment](07-goi-va-thanh-toan.md): trials, plans, PayOS, activation, coupons, refunds, and email.
8. [Refer a friend](08-gioi-thieu-ban-be.md): referral codes, 10% discounts, 30% commissions, and withdrawals.
9. [Security and privacy](09-bao-mat-va-rieng-tu.md): PINs, pairing codes, consent, children’s data, and data deletion.
10. [Administration and operations](10-quan-tri-va-van-hanh.md): the admin page, roles, customer support, background tasks, and technical documentation.
11. [Website and public pages](11-website-va-trang-cong-khai.md): the landing page, blog, framework, roadmap, science, and legal pages.
12. [Connection map and scenarios](12-ban-do-lien-ket.md): dependency diagrams, end-to-end journeys, and troubleshooting.
13. [Glossary](13-thuat-ngu.md).

<!--op-->## Two surfaces and three user groups

KidHabit Hero has two separate places, each with its own address:

| Place | Address | Used for | Documentation |
|---|---|---|---|
| **App** | `app.kidhabithero.com` | Signing in, managing the family, children completing tasks, payment, and administration | 1 to 10 |
| **Landing website** | `kidhabithero.com` | Introduction, pricing, blog, habit framework, and terms | [11](11-website-va-trang-cong-khai.md) |

The app has three user groups, and each group sees its own area:

- **Parents** (family owners, parents, guardians): sign in with Google and see the Today, Design, and Family areas.
- **Children**: enter with a code or QR code provided by a parent (no account required) and see only their own area.
- **Caregivers** (grandparents or relatives): are invited by parents and can only view progress; they cannot edit anything.<!--/op-->

## Feature catalogue

The “Status” column shows whether a feature is enabled for all users (**On**) or not yet available to users (**Off**).<!--op--> The status comes from the configuration variables for the current release; operators can change it in [deployment](../deployment.md).<!--/op-->

| Feature | Who uses it | Where | Requirement | Status | Related |
|---|---|---|---|---|---|
| Google sign-in | Parents | Entry screen | None | On | [1](01-bat-dau.md#dang-nhap) |
| Sign in with a code sent by email | Parents | Entry screen | Not available<!--op--> (`emailCodeLogin` flag)<!--/op--> | **Off** | [1](01-bat-dau.md#dang-nhap) |
| Demo (sample data) | Everyone | Entry screen | None | On | [1](01-bat-dau.md#demo) |
| Two-step family setup | Parents | First time | Consent to data management | On | [1](01-bat-dau.md#thiet-lap) |
| Nine languages with automatic detection | Everyone | Everywhere | None | On | [1](01-bat-dau.md#ngon-ngu) |
| Child enters with a family code or QR code | Children | Entry screen | A parent has created the child’s profile | On | [5](05-gia-dinh-va-cai-dat.md#ghep-thiet-bi), [9](09-bao-mat-va-rieng-tu.md#ma-ghep) |
| Daily tasks by time of day | Children | Child screen | Assigned tasks | On | [2](02-man-hinh-be.md#nhiem-vu) |
| Swipe to complete or postpone | Children | Child screen | None | On | [2](02-man-hinh-be.md#hoan-thanh) |
| Timer for tasks with a duration | Children | Child screen | A task with a number of minutes | On | [2](02-man-hinh-be.md#dem-gio) |
| Read tasks aloud | Children | Child screen | A supported device | On | [2](02-man-hinh-be.md#doc-to) |
| Stars, levels, and streaks | Children, parents | Both | None | On | [2](02-man-hinh-be.md#sao-cap-chuoi) |
| Badges (5 basic and 16 character profiles) | Children | Child screen | Completed tasks | On | [2](02-man-hinh-be.md#huy-hieu), [6](06-khoa-hoc-thoi-quen.md#chan-dung) |
| Redeem rewards and set reward goals | Children, parents | Both | The parent has a reward library | On | [2](02-man-hinh-be.md#qua), [4](04-thiet-ke-thoi-quen.md#kho-qua) |
| Family and group rankings | Children | Child screen | None | On | [2](02-man-hinh-be.md#bang-xep-hang) |
| Public ranking | Children | Child screen | A parent enables it and chooses the child | On (off by default for each family) | [5](05-gia-dinh-va-cai-dat.md#rieng-tu), [9](09-bao-mat-va-rieng-tu.md#bxh-cong-khai) |
| Mascots and colors | Children | Child screen | Change the mascot once every 7 days | On | [2](02-man-hinh-be.md#linh-vat) |
| Morning letter from the mascot | Children | Child screen | From 07:00 | **On** | [2](02-man-hinh-be.md#thu-buoi-sang) |
| One-sentence journal | Children, parents | Both | None | **On** | [2](02-man-hinh-be.md#nhat-ky), [3](03-hom-nay-va-duyet-viec.md#thong-ke) |
| Dream city | Children | Child screen | Use stars to build it | **On** | [2](02-man-hinh-be.md#thanh-pho) |
| Age-based appearance | Children, parents | Both | Parents can pin it | **On** | [2](02-man-hinh-be.md#giao-dien-tuoi), [5](05-gia-dinh-va-cai-dat.md#ho-so) |
| Approve tasks and rewards | Parents | Today | PIN if one has been set | On | [3](03-hom-nay-va-duyet-viec.md#duyet) |
| Manually add or deduct stars | Parents | Child profiles | PIN if one has been set | On | [3](03-hom-nay-va-duyet-viec.md#chinh-sao) |
| Child’s Today view (task count, streak, 7 days), progress, and weekly review | Parents | Today | Progress and weekly review require the habit programme to be enabled | **On** | [3](03-hom-nay-va-duyet-viec.md#hom-nay) |
| Record how the child did it (alone, prompted, together) | Parents, children aged 15 and over | Today, child screen | The habit programme is enabled | **On** | [3](03-hom-nay-va-duyet-viec.md#muc-ho-tro), [6](06-khoa-hoc-thoi-quen.md#bon-pha) |
| 7-day statistics, weekly printing, and milestone sharing | Parents | Today → Statistics | None | On | [3](03-hom-nay-va-duyet-viec.md#thong-ke) |
| Manage tasks and create custom tasks | Parents | Design → Task management | A plan | On | [4](04-thiet-ke-thoi-quen.md#quan-ly-viec) |
| Framework of 47 habits for ages 0–18 | Parents | Task management → Library | A plan | On | [4](04-thiet-ke-thoi-quen.md#khung-47), [6](06-khoa-hoc-thoi-quen.md#khung) |
| Programme and “if… then…” cues | Parents | Task management | The habit programme is enabled | **On** | [4](04-thiet-ke-thoi-quen.md#chuong-trinh), [6](06-khoa-hoc-thoi-quen.md#logic) |
| Age-based roadmap (5 stages) | Parents | Design → Roadmaps | A plan | On | [4](04-thiet-ke-thoi-quen.md#lo-trinh) |
| Guide to 16 character profiles and 7 ways of giving | Parents | Top bar | None | On | [6](06-khoa-hoc-thoi-quen.md#chan-dung) |
| Reward library and reward suggestions | Parents | Design → Rewards | A plan | On | [4](04-thiet-ke-thoi-quen.md#kho-qua) |
| Child profiles and age-based plan packs | Parents | Family → Child profiles | The number of children depends on the plan | On | [5](05-gia-dinh-va-cai-dat.md#ho-so) |
| Pair and revoke devices | Parents | Child profiles, Settings | PIN if one has been set | On | [5](05-gia-dinh-va-cai-dat.md#ghep-thiet-bi) |
| Invite a caregiver (view only) | Parents | Settings | A 72-hour link | On | [5](05-gia-dinh-va-cai-dat.md#nguoi-cham-soc) |
| Parent PIN | Parents | Settings | None | On | [5](05-gia-dinh-va-cai-dat.md#pin), [9](09-bao-mat-va-rieng-tu.md#pin) |
| Take a break for the whole family | Parents | Settings | None | On | [5](05-gia-dinh-va-cai-dat.md#tam-nghi) |
| Parent reminders | Parents | Settings | Parent consent | **On** | [5](05-gia-dinh-va-cai-dat.md#nhac-viec) |
| Install the app (PWA) | Everyone | Settings, browser | None | On | [5](05-gia-dinh-va-cai-dat.md#pwa) |
| Download and restore family data | Parents | Settings | None | On | [5](05-gia-dinh-va-cai-dat.md#du-lieu) |
| Permanently delete family data | Family owner | Statistics | Type `DELETE FAMILY` | On | [9](09-bao-mat-va-rieng-tu.md#xoa-du-lieu) |
| 7-day trial | Parents | `/start`, pricing, setup | Once per family | On | [7](07-goi-va-thanh-toan.md#dung-thu) |
| VietQR payment through PayOS | Parents | Pricing, `/checkout` | Sign-in | On | [7](07-goi-va-thanh-toan.md#thanh-toan) |
| Gift code (coupon) | Parents | Family → Account | A valid code | On | [7](07-goi-va-thanh-toan.md#coupon) |
| Refer a friend, 10% discount, 30% commission | Parents | Settings, `?ref=` link | PIN required to withdraw money | On | [8](08-gioi-thieu-ban-be.md) |
| Lifecycle email | Parents | Inbox | Email configuration | According to configuration | [7](07-goi-va-thanh-toan.md#email) |
| Admin page (6 sections) | Administrators | `/admin` | Role and two-step verification | On | [10](10-quan-tri-va-van-hanh.md#admin) |

## Conventions in this guide

- **In-app paths** use the form `Area → Item`, for example `Family → Settings`.
- “A plan” means the family is in a trial period or has a plan that has not expired ([7](07-goi-va-thanh-toan.md)).
- “PIN if one has been set” means the action runs only after this browser has entered the correct, valid parent PIN ([5](05-gia-dinh-va-cai-dat.md#pin)).
- Prices, thresholds, and time limits are the values at the time of writing; the authoritative source is in the technical documentation linked at the end of each file.

<!--op-->## Keeping the guide accurate

- When adding or changing a feature, update the **feature catalogue above** and the file describing it; add links to related features at the end of the file (“Related”).
- Each section has an anchor `<a id="…"></a>` for linking; do not rename anchors already in use. The `tests/unit/user-guide-links.test.ts` test reports an error if an internal link or anchor is broken.
- Prices, thresholds, and release flags come from the source code; when they differ, the source code is correct, so update the guide to match.
- Last updated: 10/03/2026.
- Chapters 1 to 9, 12, and 13 also appear in the app (`/docs` and the ? in the parent area). After editing Markdown, run `npm run guide:build` to rebuild `public/guide`; the `tests/unit/guide-build.test.ts` test reports an error if you forget. Content intended only for operators goes between the HTML comment pair `<!-- op -->` and `<!-- /op -->` (written without spaces; spaces are added here so this example has no effect) and does not appear in the app.
- **Translations:** put each chapter’s translation (with the same filename, preserving every `<a id="…"></a>` line, link target, and number of table rows, columns, and list items) in `docs/huong-dan/i18n/<language code>/`, add the code to `GUIDE_TRANSLATIONS` in `src/lib/guide/guide-locale.ts`, then run `npm run guide:build`. The `tests/unit/guide-translations.test.ts` test compares each translation’s structure with the Vietnamese version. When you edit a Vietnamese chapter, update the corresponding translations.
- Add a ? for a new feature: add its code to `src/lib/guide/help-topic-id.ts`, write an explanation (in Vietnamese and English) in `src/lib/guide/help-topics.ts` that points to an existing section of the guide, then place `<HelpTip topic="…" />` beside the heading on the screen.

## Related technical documentation

[Architecture](../architecture.md) · [Security and privacy](../security-privacy.md) · [Habit science and adaptive logic](../habit-science-and-adaptive-logic.md) · [Habit framework data contract](../habit-framework-data-contract.md) · [Referral programme](../affiliate-program.md) · [Product analytics](../product-analytics.md) · [Deployment](../deployment.md) · [Data recovery](../data-recovery.md) · [Claims ledger](../claims-ledger.md) · [Blog publishing guide](../blog-guide.md) · [Lifecycle email and refunds](../runbooks/lifecycle-and-refunds.md)<!--/op-->
