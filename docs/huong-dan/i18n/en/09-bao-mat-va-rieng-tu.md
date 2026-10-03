# 9. Security and Privacy

[← 8. Refer a Friend](08-gioi-thieu-ban-be.md) · [Table of contents](README.md) · [Next: 10. Administration and Operations →](10-quan-tri-va-van-hanh.md)

<!--op-->## In this guide

[What data is stored](#du-lieu) · [Who can see what](#ai-thay) · [Your child’s pairing code](#ma-ghep) · [PIN](#pin) · [Consent](#dong-thuan) · [Public leaderboard](#bxh-cong-khai) · [Milestone sharing](#chia-se) · [Referral program](#gioi-thieu-rieng-tu) · [Analytics and reminders](#do-luong) · [Download and delete data](#xoa-du-lieu) · [Technical safeguards](#ky-thuat) · [Legal limitations](#phap-ly) · [Related topics](#lien-quan)<!--/op-->

This page explains in plain language what KidHabit does to keep your child’s data safe. For technical details, see [Security and Privacy](../security-privacy.md).

<a id="du-lieu"></a>
## What data is stored

The app stores your child’s profile (name, nickname, age), habits, progress, points, rewards, paired devices, subscription plan, and the parent’s contact details (full name, phone number, email). Optional features may also include a one-sentence journal, a cue plan, how your child completes each attempt, and a wishlist. **We never** send your child’s data, session codes, PINs, PayOS keys, or webhook contents to any analytics system.

<a id="ai-thay"></a>
## Who can see what

| Person | Can see | Cannot see |
|---|---|---|
| Parent | All data belonging to their own family | Data from other families |
| Caregiver | Child names, active habits, and each child's total completed or approved attempts, in read-only mode | Cannot make changes; cannot see individual attempts, notes, age, nicknames, rewards, groups, subscriptions, payments, settings, or other members |
| Child (paired device) | Their own data | Other children’s profiles, payments, settings, or PIN |
| Operator | Parent profiles (name, email, phone), subscription plans, orders; every action is logged | Child profiles, tasks, or the child’s journal |

Each family is kept in its own separate “compartment” at the database level: one account cannot read or write another family’s data, even if the app has a UI bug. Every piece of data belongs to a `family_id`; plans and benefits belong to the family, not to an email address.

<a id="ma-ghep"></a>
## Your child’s pairing code

- Each code opens **exactly one child’s profile** and contains no PIN or family data. The database stores only a hash of the code.
- Your child’s device session is stored in an HTTP-only cookie that page scripts cannot read; each request returns data for only one child.
- Repeated incorrect code entries are subject to **rate limiting**.
- Parents can **refresh the code** (the old code becomes invalid) and **revoke individual devices** at any time ([5](05-gia-dinh-va-cai-dat.md#ghep-thiet-bi)). Viewing, changing, or revoking a code requires the PIN.

<a id="pin"></a>
## PIN

The 4-digit PIN is checked by the **server**. After the correct PIN is entered, the browser receives a signed unlock cookie tied to the parent and family. It remains valid for **2 hours** and is deleted when you lock again. For families that have set a PIN, sensitive actions are refused until unlocked: deleting the family, revoking devices, viewing or changing pairing codes, creating payments, approving tasks and rewards, manually adding or deducting stars, and viewing referral payout information. A child can tap to complete a task on the parent’s device without entering the PIN. For instructions on setting a PIN, see [5](05-gia-dinh-va-cai-dat.md#pin).

<a id="dong-thuan"></a>
## Consent

- During [family setup](01-bat-dau.md#thiet-lap), the adult must confirm that they are a parent or legal guardian and agree to the storage of the child’s data. Consent is stored with the **policy version**.
- The public leaderboard, anonymous analytics, reminders, and promotional offers are all **optional choices**, **off by default**, and can be turned off again. Withdrawals are retained as a timestamp rather than deleting the consent history.
- Caregivers can enter the family only through a one-time invitation created by a parent (expires after 72 hours); it can be revoked ([5](05-gia-dinh-va-cai-dat.md#nguoi-cham-soc)).

<a id="bxh-cong-khai"></a>
## Public leaderboard

A child appears on the public leaderboard only when **both** of these conditions are true: the family has enabled sharing (off by default and changeable only by a parent) **and** the child’s profile has been marked as participating (new profiles are private by default). The leaderboard shows only the nickname (or “Super Kid”), avatar, points earned during the period, streak, and rank; it contains **no** child code, family code, real name, or age. Points are earned from confirmed logs during the period, not the current balance, so redeeming stars for rewards does not change the ranking. The Family and Group boards use only data within their respective scopes. Settings: [5](05-gia-dinh-va-cai-dat.md#rieng-tu); the child’s experience: [2](02-man-hinh-be.md#bang-xep-hang).

<a id="chia-se"></a>
## Milestone sharing

“Share a positive milestone” ([3](03-hom-nay-va-duyet-viec.md#thong-ke)) always gives parents **a preview and the chance to confirm** before opening the device’s sharing panel. By default, the content contains no child’s name, age, photo, or tasks and has no tracking code.

<a id="gioi-thieu-rieng-tu"></a>
## Referral program

The referral code is stored in the `kidhabit_ref` cookie for 60 days (and deleted after it has been recorded). Only authorized administrators can view the referrer’s banking information; the referrer can see only the last 4 digits. Referrers **never** see information about the referred family ([8](08-gioi-thieu-ban-be.md)).

<a id="do-luong"></a>
## Analytics and reminders

- **Anonymous analytics** has strict boundaries: events contain no names, habit content, child/family/user codes, pairing codes, payment data, or exact timestamps. **No collection destination is currently configured**, so nothing leaves the device, even when a parent gives consent. No metrics (DAU, retention, NPS, etc.) will be published without real measurement. See [Product Analytics](../product-analytics.md).
- **Reminders** are only used to notify you about tasks that need approval; they are not used for advertising.
- Data about how your child completes each attempt and cue plans are **only used to give parents suggestions**; they are not used to rank or compare children ([6](06-khoa-hoc-thoi-quen.md#logic)).

<a id="xoa-du-lieu"></a>
## Download and delete data

- **Download**: a JSON copy of your family data ([5](05-gia-dinh-va-cai-dat.md#du-lieu)) and a CSV of one-sentence journal entries ([3](03-hom-nay-va-duyet-viec.md#thong-ke)). Keep these files private because they contain your child’s data.
- **Permanent deletion**: only the **family owner** can do this, from `Today → Analytics`, by entering `DELETE FAMILY` exactly (a PIN is required if one has been set). This deletes child profiles, habits, progress, rewards, paired devices, and paired sessions; it cannot be undone. Restoring the login account **does not** restore deleted data ([Data Recovery](../data-recovery.md)).

<a id="ky-thuat"></a>
## Technical safeguards

| Safeguard | What it means for you |
|---|---|
| Family isolation and row-level locks in transactions | Data from different families cannot get mixed |
| All cookie-based write commands reject cross-origin requests | An unfamiliar site cannot act on your behalf |
| PayOS “fail closed”: signature, amount, content, order owner, and duplicate-processing checks | A fake notification cannot activate a plan |
| One-time trial and database-level plan checks | Limits cannot be bypassed by changing the interface |
| Content Security Policy (CSP), frame protections, and minimal browser permissions | Reduced risk from malicious code |
| Sensitive functions are server-only; new functions are closed by default | A smaller abuse surface |
| Administrators need two-step verification, and every action is logged with a reason | Traceability and control |

<a id="phap-ly"></a>
## Legal limitations

The defaults are designed **conservatively** for children’s data, but this is **not a certification** of COPPA or GDPR-K compliance. Before enabling the public leaderboard in a specific market, obtain a legal review covering the age of consent, retention period, access rights, and deletion rights. The `Privacy`, `Terms`, and `Contact` pages on the [website](11-website-va-trang-cong-khai.md#phap-ly-web) may remain drafts (not indexed and not shown in the footer or checkout) until the legal approval flag is enabled. To report an incident, do not send secrets or children’s data through a public channel.

<a id="lien-quan"></a>
## Related topics

- PINs, devices, and caregivers: [5. Family and Settings](05-gia-dinh-va-cai-dat.md).
- Leaderboards: [2. Child Screen](02-man-hinh-be.md#bang-xep-hang).
- Administration and action logs: [10. Administration and Operations](10-quan-tri-va-van-hanh.md).
- Incident response: [Incident response](../runbooks/incident-response.md).
