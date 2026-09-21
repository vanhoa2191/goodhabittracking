# KidHabit experience refresh design

## Outcome

KidHabit should feel bright, readable, reassuring, and easy to operate on a phone. Parents must be able to understand payment details and connect a child device without technical knowledge. Children must be able to understand each task and receive immediate, calm feedback when they complete it.

## Product decisions

- Light mode is the default for every new visitor, regardless of operating-system preference.
- Appearance offers three explicit choices: Light, Dark, and System. A saved choice is respected on later visits.
- The default text scale is increased. User-facing secondary text must not be smaller than 13px; normal body copy targets 15–17px; touch controls remain at least 44px high.
- User-facing copy says “đồng bộ đám mây”, “tài khoản gia đình”, and “kết nối thiết bị”. Vendor, database, tenancy, RLS, and backend terminology is removed from normal product screens.
- Technical details remain available only in maintainer documentation or a clearly labelled technical FAQ section.

## Bright visual system

The existing indigo, amber, emerald, and warm neutral identity remains. Light mode uses white and lightly tinted cards over a pale warm background, with dark slate text and restrained shadows. Dark mode remains available but is no longer selected automatically for new users.

The appearance control is available from the header and parent settings. Theme application happens before the app paints so the page does not flash between themes.

## Typography

The global default stays rounded and friendly. The current font-size preference is retained, but its scale names become easier to understand and the default becomes the larger readable option. Explicit `text-[10px]` and `text-[11px]` styles on essential product copy are replaced with readable semantic sizes. Tiny labels are reserved for non-essential badges only.

## Payment experience

The server continues to create payment requests and verify payment completion. The checkout surface uses only values returned by payOS:

- `accountName` for account holder;
- `accountNumber` for account number;
- `bin` for bank identifier;
- `amount`, `description`, `qrCode`, and `checkoutUrl` for the exact transaction.

The UI must not invent a bank name. It presents bank/BIN, account holder, account number, exact amount, transfer description, QR, and an “Open secure payment page” fallback. Copy buttons provide visible confirmation. Payment activation remains driven by verified webhook/status data, never by a client-only success button.

Return and cancel query parameters show a clear result state and then remove themselves from the URL. Errors are written in plain language.

## Fixed child QR and manual code

Each child has a stable pairing credential that remains valid until the parent refreshes it. The parent management screen shows:

- the child’s QR code;
- a manual code;
- copy and enlarge actions;
- “Refresh connection code”, with confirmation that the previous QR and code will stop working;
- a list of connected devices and revoke controls.

The QR encodes an application deep link containing a high-entropy pairing token. Scanning it with a normal phone camera opens KidHabit and starts the connection flow. The child connection screen also has an in-app “Scan QR” camera button and a manual-code input. Camera permission denial or unsupported browsers always fall back to manual entry.

Pairing credentials are stored server-side as hashes, are scoped to one child, are rate-limited, and are never logged. Refreshing rotates the credential atomically. A successfully connected device receives its own revocable child session, so later QR rotation does not unexpectedly disconnect already approved devices.

## Mobile modal behavior

A shared modal shell renders through a portal attached to `document.body`. It owns:

- fixed viewport positioning using dynamic viewport height;
- centered desktop layout and bottom-sheet-like mobile layout where appropriate;
- internal scrolling only;
- body scroll locking;
- safe-area padding;
- focus trap, Escape handling, focus restoration, and accessible labelling.

All current dialogs migrate to this shell. This prevents transformed or animated ancestors from moving a fixed dialog to the bottom of a long page.

## Help and documentation

A public `/docs` area is linked from the header, footer, onboarding, and parent settings. The first release contains:

1. Quick start for parents.
2. Create a child profile and choose habits.
3. Connect a child device by QR or manual code.
4. Complete, approve, and review tasks.
5. Rewards and star balances.
6. Payment and plan activation.
7. Cloud sync, backup, and device management.
8. Troubleshooting and FAQ.

The default docs copy is Vietnamese and follows the app locale when translations exist. Instructions use screenshots or compact illustrations only when they materially reduce confusion.

## Task cards and completion feedback

Task cards show their full title and description without truncation. The completion control remains separate from the card’s detail action so a child cannot complete a task accidentally.

Selecting the card opens task details with:

- purpose/meaning;
- how to do it;
- duration and timer, when configured;
- points and parent-approval requirement.

Activities gain an optional structured `instructions` field. Existing activities remain valid without it. Parent task editing exposes both “Meaning” and “How to do it”; templates supply reviewed instructions where available.

On successful completion, the card changes state immediately, the checkmark animates, earned stars float briefly near the control, progress updates, and a short success sound plays. Confetti is reserved for meaningful milestones. Reduced-motion preference disables movement and uses color/icon/text feedback only. Failed saves restore the prior state and show a clear retry message.

## Delivery slices

1. Theme, typography, and plain-language copy.
2. Shared portal modal and migration of every dialog.
3. Fixed QR credential, deep link, camera scanner, manual entry, rotation, and device tests.
4. payOS response alignment and checkout/return-state improvements.
5. Task detail model, full cards, completion feedback, and parent editing.
6. `/docs` information architecture and localized user guidance.
7. Full mobile/desktop visual QA, accessibility, API tests, migration checks, and production verification.

## Acceptance criteria

- A new browser opens in light mode even when the operating system is dark.
- Users can choose Light, Dark, or System and the choice persists.
- Essential copy is readable without 10–11px text.
- Every dialog remains within a 375px-wide viewport, opens at the current viewport position, and scrolls internally.
- Checkout displays non-empty account holder, account number, bank/BIN, amount, description, and a scannable QR from a real payOS create response.
- Parent QR and manual code connect the intended child; camera denial falls back to manual input; rotation invalidates only the previous pairing credential.
- Product screens contain no “Supabase”, “RLS”, “tenant”, or backend implementation language.
- `/docs` is reachable without signing in and covers all eight sections.
- Task cards show full descriptions; task details expose purpose and instructions when present.
- Successful task completion has observable feedback; failed completion does not leave a false completed state.
- Unit/API/E2E tests, Cloudflare build, 375/768/1280 visual captures, keyboard navigation, and reduced-motion checks pass.

## Non-goals

- Replacing the existing brand palette or navigation architecture.
- Adding a second payment provider.
- Exposing internal infrastructure dashboards to customers.
- Disconnecting existing child devices merely because a pairing QR was refreshed.

## Rollback

UI slices can be reverted independently. The pairing migration is additive: existing one-time challenges remain readable during rollout, while new stable credentials are enabled after the server and UI are deployed. If camera scanning fails, manual code entry remains the supported fallback. Payment changes preserve the existing verified webhook entitlement path.
