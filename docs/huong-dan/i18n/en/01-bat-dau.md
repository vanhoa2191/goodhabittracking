# 1. Getting started

[← Table of contents](README.md) · [Next: 2. Child screen →](02-man-hinh-be.md)

<!--op-->## In this guide

[Three ways to enter the app](#cach-vao) · [Sign in](#dang-nhap) · [Set up your family](#thiet-lap) · [Customer information](#thong-tin) · [Roles](#vai-tro) · [Demo](#demo) · [Language](#ngon-ngu) · [Find help in the app](#tro-giup) · [Related](#lien-quan)<!--/op-->

<a id="cach-vao"></a>
## Three ways to enter the app

When you open `app.kidhabithero.com` for the first time, the screen “How would you like to enter KidHabit?” offers three options: two buttons in view and one folded block for children. The parent and child areas are separate: children never see payments or family settings.

| Entry option | For | What happens |
|---|---|---|
| **Continue as a parent** (signs in with Google) | Parents and guardians | Opens the family dashboard ([3](03-hom-nay-va-duyet-viec.md)). The first time, you will go through [family setup](#thiet-lap). |
| **Is this a child’s device?** (open it, then choose “Enter code or scan QR”) | Children | The device is paired with exactly one child and opens the [child screen](02-man-hinh-be.md) directly. The child does not need an account. |
| **Explore the demo** (in view, below the parent button) | Everyone | Uses sample data and does not require an account ([demo](#demo)). |

Parents who are already signed in go straight to the dashboard. To view the landing page again, choose “Home” or “View the Landing Page”. Once a child’s device has been paired, it always opens the child interface directly and does not show the parent dashboard or pricing page.

<a id="dang-nhap"></a>
## Sign in

- **Google** is the main sign-in method for parents.
- **A one-time code sent by email** is the second option and is currently **turned off** until enabled<!--op--> (the `emailCodeLogin` flag, [how to enable it](../deployment.md))<!--/op-->. When enabled, a folded “Other ways to sign in” block appears on the entry screen; opening it shows the “Or get a sign-in code by email” field. With the flag off, the block does not exist. Parents enter their email, receive a short numeric code, and enter it to sign in. They can request another code after a few seconds; too many requests will require waiting a few minutes.
- If sign-in fails, the app shows a brief message and a retry button. Nothing is saved.

Parents who sign in through a referral link (`?ref=`) are automatically recorded as referrals ([8](08-gioi-thieu-ban-be.md#ghi-nhan)). People invited as caregivers sign in with Google and then accept the invitation ([5](05-gia-dinh-va-cai-dat.md#nguoi-cham-soc)).

<a id="thiet-lap"></a>
## Create your first child profile

The first time you enter, the “Create Your Family’s Age-Based Plan” window only creates a child profile:

- Enter the **child’s full name** (required), nickname (optional), and age (5 by default).
- Open **More customization** to read about the age stage, change the mascot (Leo by default), preview six starter habits, or turn off adding starter habits (on by default). Parents can edit these later.

You must **confirm that you are the child’s parent or legal guardian** and agree that KidHabit may store the child’s profile, habits, and progress. Consent is recorded under the policy version ([9](09-bao-mat-va-rieng-tu.md#dong-thuan)). Public leaderboards are off by default.

If the family does not have a plan, completing setup will **automatically start a 7-day free trial** (the button says “Start 7-day trial”). Each family can use the trial only once ([7](07-goi-va-thanh-toan.md#dung-thu)).

You can open `/start` (“Start your 7-day trial”) directly from the website: sign in with Google, set up your family, then click start.

<a id="thong-tin"></a>
## Customer information

Parents only need to enter their **full name and phone number at checkout**, before the terms and referral steps. Phone numbers must have 9 to 15 digits. Details are saved on the server for future payments; complete profiles skip this step. Signing in and creating a child profile are not blocked by this requirement. Receiving guidance and offers is optional and off by default. Parents can edit their details later under `Family → Settings → Account` ([5](05-gia-dinh-va-cai-dat.md#tai-khoan)); opting out stops promotional emails immediately ([7](07-goi-va-thanh-toan.md#email)). If loading or saving fails, tap **Try again**.

<a id="vai-tro"></a>
## Family roles

| Role | Can do | Cannot do |
|---|---|---|
| **Family owner** (creator) | Everything parents can do, payments, and deleting family data | Nothing |
| **Parent or guardian** | Manage children, tasks, rewards, approvals, and devices | Owner-only actions (deleting the family) |
| **Caregiver** | View progress in “Caregiver view” | Edit profiles, tasks, stars, or the plan |
| **Child** (paired device) | Complete their own tasks, request rewards, and keep a journal | See payments, settings, or other children’s profiles |

Only parents in the family can start a trial or make payments. Sensitive actions also require a [PIN](05-gia-dinh-va-cai-dat.md#pin).

<a id="demo"></a>
## Demo

“Explore the demo” opens the app with three sample children (ages 8, 4, and 1), along with sample tasks, rewards, and groups. Demo data is stored in the current browser tab, so it remains after reloading the page. When you set up a real family or sign in, the demo data is deleted and **does not** mix with real data. The demo does not send anything to the server and does not require payment.

<a id="ngon-ngu"></a>
## Language

The app supports nine languages: Vietnamese, English, French, German, Italian, Spanish, Chinese, Japanese, and Korean. The initial language is selected in this order: your saved choice, country (from Cloudflare), browser language, then English. Change it with the language selector in the top bar. Your choice is saved so the page, titles, and interface stay in the same language.

Some detailed content, including age-based journeys and the Today screen, has not yet been translated into all nine languages and will appear in English when a translation is unavailable.

<a id="tro-giup"></a>
## Find help in the app

This guide is built into the app in two forms:

- **A ? next to each item.** In the parent area, a small **?** appears next to the title of each feature, such as approvals, cues, PINs, pairing codes, and payments. Hover over it, tap it, or reach it with the Tab key to read a brief one- or two-sentence explanation. Click **See details** to open the relevant part of the guide right on the current screen without leaving what you are doing. In that window, click a link to another section to continue reading, or click **Back** to return. Press **Esc** or tap outside to close the explanation.
- **A dedicated guide page.** The **User guide** button in the top bar (or `Family → Settings → Open user guide`) opens `/docs`: a list of chapters, a **search** box (you can type with or without accents), an **“I want…”** shortcut group for common tasks, and a table of contents for each chapter. The **Open the full guide** button in the detail window also takes you to the matching location on this page.

The full guide is available in Vietnamese and translated versions, currently including English. In languages without a translation, the ? explanation appears in English while the detailed section is in Vietnamese, with a quick summary on `/docs`.

<a id="lien-quan"></a>
## Related

- Create a child profile and pair their device: [5. Child profiles and device pairing](05-gia-dinh-va-cai-dat.md#ho-so).
- What children do after entering: [2. Child screen](02-man-hinh-be.md).
- Trial plans and pricing: [7. Plans and payments](07-goi-va-thanh-toan.md).
- Privacy of children’s data: [9. Security and privacy](09-bao-mat-va-rieng-tu.md).
- The website landing page: [11. Website and public pages](11-website-va-trang-cong-khai.md).
