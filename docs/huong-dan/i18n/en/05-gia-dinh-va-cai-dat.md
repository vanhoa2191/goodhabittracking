# 5. Family and settings

[← 4. Designing habits](04-thiet-ke-thoi-quen.md) · [Table of contents](README.md) · [Next: 6. The science of habits →](06-khoa-hoc-thoi-quen.md)

<!--op-->## In this guide

[Child profiles](#ho-so) · [Pair a child's device](#ghep-thiet-bi) · [Manage devices](#thiet-bi) · [Invite a caregiver](#nguoi-cham-soc) · [Settings groups](#cai-dat) · [Account and sync](#tai-khoan) · [Privacy and notifications](#rieng-tu) · [Reminders](#nhac-viec) · [Appearance](#giao-dien) · [PIN](#pin) · [Take a break](#tam-nghi) · [Install the app](#pwa) · [Family data](#du-lieu) · [Offers and referrals](#uu-dai) · [Related](#lien-quan)<!--/op-->

The **Family** area has two sections: `Family → Child profiles` and `Family → Settings`.

<a id="ho-so"></a>
## Child profiles

Each child has a separate profile with:

| Information | Notes |
|---|---|
| Real name | Used for parents; not shown publicly unless you choose to share it |
| Nickname | The name shown on the leaderboard; if left blank, the public leaderboard uses "Super Child" |
| Age (0 to 18) | Slider; automatically determines the **stage** (0–3, 3–6, 6–12, 12–18) with a description. This determines recommendations, the [journey](04-thiet-ke-thoi-quen.md#lo-trinh), and the [age-based interface](02-man-hinh-be.md#giao-dien-tuoi) |
| Mascot and color | Six [mascots](02-man-hinh-be.md#linh-vat) |
| Leaderboard | Choose whether to join the public leaderboard and whether to show the real name or only the nickname (recommended: nickname). New children are **private** by default |
| Age-based interface | When editing a profile: **Automatic by age**, pin the 3–8 or 9–12 range, from 13, or **keep the current interface**. The parent's choice takes priority over the choice on the child's device |

From the profile card, parents can:

- **Add, edit, or delete** a child profile. The number of children depends on the [plan](07-goi-va-thanh-toan.md#cac-goi): the Single Child plan allows up to 1 child; the trial and family plans have no limit. After a plan expires, you cannot add a new profile without a plan.
- **Load the age-based pack** ("Automatically add 6 age-appropriate habits…") to get six starter tasks right away.
- **[Manually reward or deduct stars](03-hom-nay-va-duyet-viec.md#chinh-sao)**.
- View stars, level, streak, and whether the child is hidden from the leaderboard.
- Open the child's **connection code and QR code** ([below](#ghep-thiet-bi)).

<a id="ghep-thiet-bi"></a>
## Pair a child's device

Each child has **one persistent connection code** (and a matching QR code). The code grants access only to that child, contains no PIN or family data, and stays the same until a parent refreshes it.

1. **Get the child's code**: in `Family → Child profiles`, copy the code or tap "Show QR code". You need the [PIN](#pin) if one has been set.
2. **Open the child's device**: open the app and open "Is this a child’s device?" and choose "Enter code or scan QR" (or "Child code" in the top bar).
3. **Scan the QR code or enter the code**: the device automatically signs in to the correct child profile. It shows "Connected successfully!" and the child taps "Start the child's tasks".

After pairing, the device always opens directly to the [child screen](02-man-hinh-be.md), without showing the parent dashboard or sales pages.

- **Refresh the code** for one child ("Create a new code for this child") or **for all children** ("Create new child codes"): the old codes stop working. Do this only if you suspect a code has been exposed. A PIN is required.
- If the camera does not open: grant camera permission, use a secure connection (https), or enter the code manually.
- Too many incorrect attempts will trigger rate limiting ([9](09-bao-mat-va-rieng-tu.md#ma-ghep)).

<a id="thiet-bi"></a>
## Manage devices

`Settings → Devices & family rhythm → Children's devices` lists paired devices: which child they belong to, when they were last seen, and whether access has expired. **Revoke access** immediately if a device is lost or no longer used (PIN required). Each device can access only **one** child's profile.

<a id="nguoi-cham-soc"></a>
## Invite a caregiver

For grandparents or relatives who want to follow progress but **cannot change anything**.

1. In `Settings`, tap **Create caregiver invitation**. The **one-time** invitation link appears only when it is created and **expires after 72 hours**. Copy and send it to the person.
2. The invited person opens the link, signs in with Google, and taps accept. If the invitation has expired, was revoked, or the account already belongs to another family, they see "Invalid invitation…".
3. They open the **Caregiver corner**: view each child's progress with read-only access (recorded completions and each child's habits).
4. Parents can **Revoke invitation** at any time from the "Active invitations" list.

<a id="cai-dat"></a>
## Settings groups

`Family → Settings` is divided into groups; the "Settings groups" bar jumps to each section:

| Group | Contents |
|---|---|
| **Devices & family rhythm** | Children's devices, app installation, caregivers, [family break](#tam-nghi) |
| **Account & sync** | Customer information, gift codes, family data |
| **Privacy & notifications** | Public leaderboard, anonymous measurement, reminders |
| **Appearance** | Light, dark, device settings |
| **Protect the parent area** | PIN |
| **Offers & referrals** | Referral code field, Refer a friend card (at the bottom of the page, shown only when signed in) |

The address bar remembers the open section (for example `?section=settings#settings-security`): reloading keeps you on the same section, and the browser's Back button returns to the previous one. The link only picks a section inside the parent area and unlocks nothing: in child mode, the `section` part is ignored.
At the bottom of the page, you will find "Open user guide" (the `/docs` page in the app; see [find help in the app](01-bat-dau.md#tro-giup)) and links to Privacy, Terms, and Contact support ([11](11-website-va-trang-cong-khai.md)).

<a id="tai-khoan"></a>
## Account and sync

- **Status**: "Family account", verified, "Cloud ready". Family data syncs automatically across phones, tablets, and computers, with no technical setup required.
- **Customer information**: full name, phone number (9 to 15 digits), email (read-only), and the option to receive guides and offers. Used to support your account and payments.
- **Coupon code**: enter a gift code to add extra days to your access ([7](07-goi-va-thanh-toan.md#coupon)).

<a id="rieng-tu"></a>
## Privacy and notifications

- **Share to the public leaderboard**: a family-wide toggle, **off by default**, which only a parent can change. When enabled, only the children selected in the [profile](#ho-so) appear, and only with their nickname, avatar, period score, streak, and rank. Turn it off at any time ([9](09-bao-mat-va-rieng-tu.md#bxh-cong-khai)).
- **Anonymous measurement**: a parent consent toggle, off by default. No collection destination is currently configured, so events do not leave the device ([product analytics](../product-analytics.md)).
- **Reminders**: see [below](#nhac-viec).

<a id="nhac-viec"></a>
### Parent reminders

Turn on "Allow reminders for items needing attention" to receive reminders when a task or reward needs approval. Reminders are only for items needing approval, not advertising, and can be turned off at any time. To receive notifications outside the app, tap "Allow notifications on this device"; if the device blocks them, reminders still appear in the app (see the [Today banner](03-hom-nay-va-duyet-viec.md#nhac-viec-ngan)).

<a id="giao-dien"></a>
## Appearance

- **Light, Dark, Device settings** in the Appearance group.
- **Font and size**: open the "Font & Size Settings" window from the top bar to make text as easy for your child to read as possible.
- **Language**: the language selector in the top bar ([1](01-bat-dau.md#ngon-ngu)).
- **Child interface by age**: pin it while [editing the child profile](#ho-so).

<a id="pin"></a>
## Parent PIN

The PIN contains **exactly 4 digits** and protects the family management area. Do not share it with children.

- **Create**: enter the PIN, then enter it again to confirm. **Change**: enter the current PIN, then the new PIN twice.
- When a PIN is set, switching from the child screen to Parent mode requires the PIN. After you enter it correctly, this browser stays unlocked for **2 hours**; locking it again clears the unlock.
- These sensitive actions require this unlock: viewing or changing a child's connection code, revoking a device, approving tasks and rewards, manually rewarding or deducting stars, creating a payment, deleting the family, saving bank details, or withdrawing referral money. If the area is not unlocked, the app returns to the lock screen.
- Withdrawing referral money requires the family to **have a PIN set** ([8](08-gioi-thieu-ban-be.md#rut-tien)).
- After too many incorrect attempts, you must wait a few minutes ("You have tried too many times").
- A child tapping complete on the parent's device **does not** require a PIN.

<a id="tam-nghi"></a>
## Take a break as a family

In `Settings → Family break`, tap **Take a break**, then confirm when the whole family needs time off (illness, travel, or holidays). During the break:

- the child screen hides progress reminders, streaks, and the leaderboard, and shows a gentle message ([2](02-man-hinh-be.md#tam-nghi-be));
- children can still complete tasks; stars, rewards, and tasks are not deleted;
- break days do not break the [streak](02-man-hinh-be.md#sao-cap-chuoi) and are not counted as missed when [calculating habit stages](06-khoa-hoc-thoi-quen.md#logic);
- [reminders](#nhac-viec) are paused.

Tap **Resume** when you are ready.

<a id="pwa"></a>
## Install the app

The "Install KidHabit Hero" card lets you open the app quickly like an app while continuing to receive new versions from the web. On Android/Chrome, tap "Install now"; on iPhone, open it in Safari → Share → Add to Home Screen. There is also a "Refresh app data" button when needed.

<a id="du-lieu"></a>
## Family data

The "Family data" card lets you **download a JSON copy** containing child profiles, habits, completion history, rewards, groups, journals, signals, and records of how the child worked. The file **does not contain the PIN or payment information**, but it contains your child's data, so keep it private. "Restore from JSON file" is only for data stored on this device (it replaces all local data); for Google accounts, data is stored on the family's server. Export a child's journal separately from [Statistics](03-hom-nay-va-duyet-viec.md#thong-ke). Permanent deletion: [9](09-bao-mat-va-rieng-tu.md#xoa-du-lieu).

<a id="uu-dai"></a>
## Offers and referrals

The last group on `Settings`, shown only when signed in:

- **Referral code**: the "Have a referral code from a friend?" field (shown only while the family is eligible).
- **Refer a friend**: the card for getting a link, tracking commissions, and withdrawing money ([8](08-gioi-thieu-ban-be.md)).

<a id="lien-quan"></a>
## Related

- Where children use the code and what they see: [2. Child screen](02-man-hinh-be.md).
- Child limits by plan, buying a plan, coupons: [7. Plans and payments](07-goi-va-thanh-toan.md).
- Why connection codes and PINs are safe: [9. Security and privacy](09-bao-mat-va-rieng-tu.md).
- Referral withdrawals require a PIN: [8. Refer a friend](08-gioi-thieu-ban-be.md).
