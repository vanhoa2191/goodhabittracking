# 8. Refer a friend

[← 7. Plans and payment](07-goi-va-thanh-toan.md) · [Contents](README.md) · [Next: 9. Security and privacy →](09-bao-mat-va-rieng-tu.md)

<!--op-->## In this guide

[Overview](#tong-quan) · [For referrers: join and share](#tham-gia) · [For referred families](#giam-10) · [Recording referrals](#ghi-nhan) · [Commissions](#hoa-hong) · [Withdrawals](#rut-tien) · [Refunds and commissions](#hoan-tien-hoa-hong) · [Rules and limits](#quy-tac) · [Related](#lien-quan)<!--/op-->

<a id="tong-quan"></a>
## Overview

The programme has two sides, connected by an **8-character referral code** attached to the link `https://kidhabithero.com/?ref=<MÃ>`:

| Side | What they get |
|---|---|
| **Referrer** (a parent using KidHabit) | **30% commission** on the amount the referred family actually pays |
| **Referred family** | **10% off** their first order of either yearly plan (Pro Plan · Yearly 590,000 VND becomes 531,000 VND; 1-Child Plan · Yearly 399,000 VND becomes 359,100 VND) |

Public terms: the `/gioi-thieu/` page on the [website](11-website-va-trang-cong-khai.md#trang-chinh). <!--op-->Technical and operational rules: [Referral programme](../affiliate-program.md).<!--/op-->

<a id="tham-gia"></a>
## For referrers: join and share

1. Go to `Family → Settings → Offers & referrals`, then open the **Refer a friend** card. Read the rules, tick to accept the terms, and click **Join the programme**.
2. Copy or **Share** "Your referral link". You can send the referral code as a link or tell your friend the code so they can enter it manually.
3. Track the numbers for families signed up, families that paid, money **held**, **available**, **withdrawal requested**, and **paid out**, along with recent commissions and their statuses: Held, Available, Withdrawal requested, Paid out, and Reversed.

You **cannot** see the referred family's name, email, or family code; you only see counts and amounts.

<a id="giam-10"></a>
## For referred families

- Open your friend's `?ref=` link, then sign in and set up your family as usual, or **enter the code manually** in the "Have a referral code from a friend?" field (in `Settings` or directly in the checkout window).
- The referral is recorded, and you see "You get 10% off your first yearly plan".
- When you pay for a **yearly plan** (1-Child or Pro) for the first time, the checkout shows the discounted price and the line "10% off with your referral code". The monthly and Lifetime plans are not discounted.
- Conditions: the family is new (within 60 days of creation), has no paid orders, has not already been referred, and this is not your own code.

<a id="ghi-nhan"></a>
## Recording referrals

There are two ways to enter a code. They follow the same rule, so a referral cannot be recorded twice:

1. **Link**: the website reads `?ref=` and stores the `kidhabit_ref` cookie (60 days). After the parent signs in, the app sends the code for recording and then deletes the cookie.
2. **Manual entry**: the code entry field in Settings or the checkout window.

The result appears immediately: recorded; code is invalid; you cannot use your own code; a referral code is already recorded for the family; the code only applies to new families that have not paid; the programme is paused. Only parents who can manage the family can enter a code.

<a id="hoa-hong"></a>
## Commissions

- **30%** of the amount actually paid (after discounts), on every payment during the **first 12 months** after the referred family was created. For example, a discounted Pro Plan · Yearly payment of 531,000 VND earns 159,300 VND in commission.
- Each amount is **held for 35 days** (past the 30-day refund window) before becoming "Available".
- The system creates the commission automatically when an order succeeds ([plan activation](07-goi-va-thanh-toan.md#kich-hoat)); an error at this step never prevents the customer's plan from being activated.

<a id="rut-tien"></a>
## Withdrawals

1. Set a [parent PIN](05-gia-dinh-va-cai-dat.md#pin) (required), then enter the PIN in this browser.
2. On the **Get your commission** card, enter the bank, account number, and account holder name, then click **Save details**. Only the last four digits of the account number are shown. If you change your payout details, you must wait **24 hours** before requesting a withdrawal.
3. When the "Available" amount reaches the **minimum of 200,000 VND**, click **Request withdrawal**.
4. The operations team makes the bank transfer **manually** and lets you know; the request changes to "Paid out". <!--op-->For admin-side processing: [10. Admin and operations](10-quan-tri-va-van-hanh.md#gioi-thieu-admin).<!--/op-->

Commissions may be subject to personal income tax; recipients are responsible for declaring them.

<a id="hoan-tien-hoa-hong"></a>
## Refunds and commissions

When an order is refunded (after manual confirmation), its commission is **reversed** if it is still within the holding period (status "Reversed"). If the commission is already part of a withdrawal request or has already been paid out, the operations team handles it manually. See [refunds](07-goi-va-thanh-toan.md#hoan-tien).

<a id="quy-tac"></a>
## Rules and limits

- Do not refer yourself or send spam. Self-referrals using the same account or family are blocked.
- Each family can be recorded only once; it must be new and have not paid.
- Someone can create two accounts to refer themselves; the system does not block this completely, but transfers are manual and reviewed before payment.
- A referral account may be suspended for violations (currently done manually by an administrator).
- Commission and discount percentages, holding periods, and minimum withdrawal amounts are stored in the programme configuration and may change; commissions already created keep the rate in effect when they were created.
- Some items are still pending: legal and tax review, email notifications for referrers, and automatic bank transfers.

<a id="lien-quan"></a>
## Related

- Discount on the checkout screen: [7. Plans and payment](07-goi-va-thanh-toan.md#giam-gia).
- PIN: [5. Settings](05-gia-dinh-va-cai-dat.md#pin).
- Programme privacy: [9. Security and privacy](09-bao-mat-va-rieng-tu.md#gioi-thieu-rieng-tu).
- Operations review and payouts: [10. Admin and operations](10-quan-tri-va-van-hanh.md#gioi-thieu-admin).
