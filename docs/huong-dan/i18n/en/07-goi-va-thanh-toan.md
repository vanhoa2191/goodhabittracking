# 7. Plans and payment

[← 6. The science of habits](06-khoa-hoc-thoi-quen.md) · [Table of contents](README.md) · [Next: 8. Referrals →](08-gioi-thieu-ban-be.md)

<!--op-->## In this guide

[7-day free trial](#dung-thu) · [Plans](#cac-goi) · [Where to buy](#noi-mua) · [Payment steps](#thanh-toan) · [Activation and reconciliation](#kich-hoat) · [Time extensions](#cong-don) · [Gift codes (coupons)](#coupon) · [Discount for referred families](#giam-gia) · [Refunds and cancellation](#hoan-tien) · [Emails sent to you](#email) · [When a plan expires](#het-han) · [Related](#lien-quan)<!--/op-->

<a id="dung-thu"></a>
## 7-day free trial

- **Free: 0 VND**, no credit card required, and **no automatic charge** when it ends.
- Unlocks all features in the family plan, with **no limit on the number of children**.
- **Once per family only.** If you have already used the trial, the start button will say: “This family has already used a trial. Choose a plan to continue.”
- How to start: (a) automatically at the final step of [family setup](01-bat-dau.md#thiet-lap) if you do not have a plan; (b) on `/start` (“Start your 7-day trial”): sign in with Google, set up your family, and tap start; (c) in the trial panel in the pricing window. Only a parent in the family can start it.
- The trial panel **will not appear again** after the family has paid.
- As the trial nears its end, the system sends a reminder email ([email](#email)).

<a id="cac-goi"></a>
## Plans

| Plan | Price | Children | Best for |
|---|---|---|---|
| **7-Day Free Trial** | 0 VND | Up to 5 (same as Pro) | Trying everything before you decide |
| **1-Child Plan · Monthly** | 39,000 VND / month | 1 child | Families starting with one child |
| **1-Child Plan · Yearly** | 399,000 VND / year (saves 69,000 VND, 15% compared with paying monthly) | 1 child | One child, paid once for 12 months |
| **Pro Plan · Monthly** | 59,000 VND / month | Up to 5 children | Families with several children, flexible by the month |
| **Pro Plan · Yearly** | 590,000 VND / year (saves 118,000 VND, 17% compared with paying monthly) | Up to 5 children | Staying with it long enough for small steps to become habits |
| **Lifetime** | Not sold | Unlimited | Granted manually by an administrator only<!--op--> ([10](10-quan-tri-va-van-hanh.md#khach-hang))<!--/op--> |

The monthly and yearly versions of the same plan include exactly the same benefits and differ only in price and term. All payments are **one-time payments** with no automatic renewal. The pricing screen also lists extra benefits for the paid plans (weekly tracking reports, family competitions, and faster technical support); the ebook is **not yet available**.

**Names on the website** are the same as in the app: *1-Child Plan* and *Pro Plan* (monthly and yearly), at the same prices.

**The number of children per plan** is checked by the database when you **add** a new child profile: the 1-Child Plan allows up to 1 child; the Pro Plan and the trial allow up to 5; the lifetime plan is unlimited; without an active plan, you cannot add a new child profile. A family that already has more profiles than its plan allows **keeps its existing profiles**; the limit only blocks adding new ones.

**Pro Plus Plan and the Habit Coach (in development).** The Pro Plus Plan (79,000 VND / month or 790,000 VND / year) includes everything in the Pro Plan plus the **Habit Coach** (AI small-step suggestions and a weekly summary), for up to 5 children. This plan is **in development**: it cannot be bought, has no buy button and has no launch date; the current plans do not change. See [AI suggestions](09-bao-mat-va-rieng-tu.md#goi-y-ai) for what data is sent.

**Launch offer.** The first 10 families to successfully pay for the **Pro Plan yearly** before Pro Plus launches are upgraded to Pro Plus for free for the rest of the year they paid for. Each family gets at most 1 slot, counted in the order of successful payment; when all 10 are taken, the page says “No slots left”. A slot is withdrawn if that order is refunded.

<a id="noi-mua"></a>
## Where to buy

| Entry point | Description |
|---|---|
| **Upgrade Pro** button in the top bar | Opens the “KidHabit Hero Pro Pricing” window, where you can choose a plan |
| Pricing window when a plan is required | For example, after a plan expires |
| `/pricing` page and the plan-selection button on the [website](11-website-va-trang-cong-khai.md#trang-chinh) | Takes you to `/checkout?plan=…` in the app |
| `/checkout` page | Loads the selected plan: sign in, set up your family if needed, then pay |

An invalid plan link (outdated or missing information) displays “Invalid payment plan” with a button to view pricing. Entitlements belong to the **family**, not to an email address.

<a id="thanh-toan"></a>
## Payment steps

Payments are processed through **PayOS (VietQR)**:

1. Choose a plan → sign in with Google if needed → “Continue to payment.” Enter your full name and phone number if your profile is incomplete; details are remembered for future payments. Offers are optional and off by default. Next confirm the terms if requested, then enter a referral code only if your family is eligible. Creating the order is disabled while the code is being submitted. Codes can only be entered before creating the QR because the server calculates the amount when creating the order; this window does not replace an existing order after applying a code.
2. The payment screen shows a **VietQR code** and transfer details: beneficiary name, bank, account number, **exact amount**, and **transfer memo (required)**. It includes buttons to copy each item, a **Download QR code** button (so you can open your banking app and choose to scan an image from your gallery), and a link to open PayOS’s secure payment page. If copying fails, press and hold to select the text and copy it manually. There is no countdown because the server does not enforce a 15-minute payment deadline.
3. Scan with your banking app or MoMo. **Keep the exact amount and transfer memo.**
4. Tap **“I Have Transferred”** if needed; the app checks the status automatically. Status errors are shown in your selected language and automatic checks continue. When complete, it shows “🎉 Upgrade Successful!” and the plan is unlocked immediately.

If the payment is pending, **do not pay again right away**. The price is set by the server and cannot be changed in the browser. Only a parent in the family can pay, and creating a payment requires the [PIN](05-gia-dinh-va-cai-dat.md#pin) if one has been set. Returning to the app from the PayOS page will show the payment result.

<a id="kich-hoat"></a>
## Activation and reconciliation

The plan is activated when the system **confirms** the payment through one of three independent routes; whichever arrives first wins, and the payment is never counted twice:

1. PayOS’s **webhook** calls `/api/payment/webhook` (with signature, amount, transfer memo, and order-owner verification).
2. **PayOS lookup:** while a parent is on the payment screen, the app asks PayOS directly about the order. This does not depend on the webhook.
3. **Background reconciliation:** every 10 minutes, a background task reviews pending orders and asks PayOS.

If you have transferred the money but do not see the plan: wait a few minutes, reopen `/checkout`, then contact support with the order code. <!--op-->The operations team can view the order in [Admin → Payments](10-quan-tri-va-van-hanh.md#thanh-toan-admin).<!--/op-->

<a id="cong-don"></a>
## Time extensions

If you buy while your current plan is still active, the time is **added to the end of the current term**, including any trial time remaining: the monthly version adds 1 month, and the yearly version adds 1 year. Buying a lower plan than the one you already have **keeps the higher plan**. A lifetime plan is not replaced by another plan.

<a id="coupon"></a>
## Gift codes (coupons)

Gift codes are created by the operations team. Enter one in `Settings → Account → Coupon code → Apply code`.

- A gift code adds **extra days** of access; discount-only codes cannot be used here. If the family does not yet have a paid plan, it switches to the Pro Plan · Monthly for the corresponding number of days; if it already has a plan, the days are added to the end of the current term and the plan stays the same. Gift codes cannot be applied to the Lifetime plan.
- Each code can be used **once per family**; a family can use different codes. An expired, fully used, or disabled code shows: “Code not found, already used, or expired.”
- After **more than 10 failed attempts within 15 minutes**, access is temporarily locked for a few minutes.

<a id="giam-gia"></a>
## Discount for referred families

A family that enters a referral code (through a `?ref=` link or by entering it manually) gets **10% off its first order of either yearly plan**: Pro Plan · Yearly 590,000 VND becomes 531,000 VND, and 1-Child Plan · Yearly 399,000 VND becomes 359,100 VND; only if the family has no previously paid order. The payment screen shows “10% off thanks to the referral code.” Details: [8. Referrals](08-gioi-thieu-ban-be.md#giam-10).

<a id="hoan-tien"></a>
## Refunds and cancellation

- **30-day refund:** if you are not satisfied, send the order code and payment time to the support email within 30 days of payment. Refunds are processed manually; once the refund is confirmed, the referral commission for that order, if still pending, is reclaimed ([8](08-gioi-thieu-ban-be.md#hoan-tien-hoa-hong)).
- A **pending payment link** can be canceled by the support team; the order changes to “canceled” only after PayOS confirms it.
- **Plan cancellation** is handled by the support team and confirmed by email. No automatic charges are created.

<!--op-->Internal process: [Email operations and refunds](../runbooks/lifecycle-and-refunds.md) and [10. Admin](10-quan-tri-va-van-hanh.md#phieu-ho-tro).<!--/op-->

<a id="email"></a>
## Emails sent to you

There are two groups of emails:

- **Sign-in emails** (sent by Supabase): sign-up confirmation, sign-in links, recovery, invitations, email changes, and reauthentication. The email interface is predesigned ([templates](../../supabase/email-templates/README.md)).
- **Lifecycle emails** (which can be turned on or off): welcome and setup instructions (`welcome_setup`), trial-ending reminders (`trial_ending`), payment receipts (`payment_receipt`), support-request updates (`support_status`), refunds (`refund_status`), and plan-cancellation confirmations (`subscription_cancelled`).

Lifecycle emails **do not contain children’s data**. Promotional emails are sent only if you have agreed to receive offers; turning off consent stops them immediately. Bounced, complained-about, or unsubscribed addresses will not receive further messages.

<a id="het-han"></a>
## When a plan expires

When the trial or plan expires without renewal, the family is no longer considered to have a plan: you cannot add a new child profile, and the app suggests choosing a plan. **Data is not deleted**; buy a plan or use a gift code to continue.

<a id="lien-quan"></a>
## Related

- 10% discount and commissions: [8. Referrals](08-gioi-thieu-ban-be.md).
- Starting a trial during setup: [1. Getting started](01-bat-dau.md#thiet-lap).
- Child limits and adding profiles: [5. Children’s profiles](05-gia-dinh-va-cai-dat.md#ho-so).
- The operations team’s handling of orders, refunds, and plan changes: [10. Admin and operations](10-quan-tri-va-van-hanh.md).
- PayOS, webhook, and reconciliation configuration: [Deployment](../deployment.md).
