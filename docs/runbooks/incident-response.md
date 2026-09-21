# Incident Response

## Triage

1. Xác định correlation ID, operation, reason code, route và thời điểm; không thu thập payload/PII.
2. Phân loại: cross-family/privacy, payment/entitlement, pairing abuse, sync/data loss, availability.
3. P0: cross-family access, unsigned webhook accepted, secret exposure hoặc data loss đang diễn ra. Chặn mutation/rollback ngay.

## Containment

- Payment: disable checkout UI, giữ webhook fail-closed, không cấp entitlement thủ công ngoài audited DB transaction.
- Pairing: revoke device sessions, rotate pairing HMAC secret nếu cần, giữ challenge TTL/rate limit.
- Privacy: tắt public leaderboard RPC/feature, giữ database snapshot và audit evidence.
- Availability: rollback Worker deployment; không reset database.

## Recovery

Chạy health, auth, two-family isolation, payment idempotency, pairing revoke và domain concurrency smoke tests. Chỉ mở lại traffic khi invariant tương ứng được chứng minh.

Sau sự cố lộ PayOS credential, rotate đủ Client ID, API key và checksum key. `/api/health` phải trả `billingConfig: true`; `npm run release:verify` phải qua preflight trước khi mở checkout. Fingerprint bị thu hồi nằm trong `config/compromised-credential-fingerprints.json`, không lưu giá trị secret gốc.

## Post-incident

Ghi timeline, impact, root cause, detection gap, fix owner và regression test. Rotate credential đã lộ và thông báo theo yêu cầu pháp lý của thị trường phát hành.
