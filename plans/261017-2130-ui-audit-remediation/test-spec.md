# Test specification — UI audit remediation

Status: planned; không có kết quả pass nào được suy ra từ tài liệu này. Bổ sung vào test hiện hữu trước khi tạo suite mới. Regression cho behavior quan trọng phải có trước cleanup; style-only thay đổi dùng kiểm tra computed/browser phù hợp, không thêm unit test chỉ khẳng định chuỗi class.

## Test matrix có giới hạn

| Trục | Mẫu bắt buộc | Cách tránh nhân toàn bộ tích Descartes |
|---|---|---|
| Role/data | demo, paired child, cloud-like parent fixture;2bé có pending task/reward;empty/many/long-name | Scope/mutation chạy đầy đủ trên parent fixture; demo/paired chạy primary child flow |
| Flags | D0: optional flags off; E1: cấu hình regression-on trong playwright.config.ts; ageTheme off/on riêng | Public flags compile-time: dùng build/server/process tách, lưu manifest; không localStorage giả flag |
| Age |0–3 caregiver,3–8,9–12,13+,unknown | Mỗi age có kiểm tra task/label/companion; screenshot đại diện young+teen, không mọi tổ hợp |
| Viewport |375×812,768×1024,1280×900 | Kiểm geometry/overflow cả3; visual capture mobile+desktop trong một vòng |
| Font |100/108/118%;browser zoom200% | Bounds/reflow các control chạm tới; không bắt above-fold ở zoom200% |
| Theme/motion |light,dark,system;normal,reduce | Contrast/state riêng; screenshot light/dark đại diện; test static result trong reduce |
| Locale |vi,en,fr,de,it,es,zh,ja,ko | Label/parity test cả9; runtime dài vi/en/de/ja trên affected screens và smoke9locale |
| Engine/device |Chromium desktop/mobile;WebKit desktop/mobile nếu engine sẵn;physical iOS/Android riêng | Automated result ghi engine + emulation/touch synthesis; manual pending không gộp pass |

## Behavioral acceptance cases

- **A02 scope:** BéA vàB đều có pending task và reward. ChọnB chỉ đổi summary nếu contract vẫn family queue; heading ghi all-family, mỗi row có child name và batch summary liệt kê đúng trẻ. Nếu contract03 đổi sang filter, queue/count/selected IDs cùng lọc; test cho cảsingle/bulk. Không mix hai semantics.
- **A04 mutation:** delay response, double click cùng row, reject approve/deliver, server failure, retry, stale row do session khác. Assert request count/payload, native disabled+handler guard, giữ context khi lỗi, status/error announcements, điểm/trạng thái authoritative; không chấp nhận test chỉ đếm toast. Task review một request/logical operation; redemption delivery có thể hai command, kiểm sequence và không duplicate cả workflow. Thêm approve-success/deliver-fail (row approved/unfulfilled vẫn recoverable), deliver-success/refresh-fail (không retry command mù), đủ unit local/cloud/outcome và caller typecheck khi đổi async contract.
- **A01 hierarchy:** assert rectangle tên task+nút nằm trong vùng usable viewport375×812 trừ sticky header/bottomnav. Chạy demo và paired fixtures;empty state có CTA/giải thích thay vì assert task tồn tại; không screenshot assertion mù.
- **A06 labels/content:** nhìn thấy label trạng thái open/saving/pending/completed/read-only; accessible name cùng nghĩa. Giữ task details chứa taxonomy/meaning có thật; persisted activity title không bị rewrite ngoài scope; error prose không chứa raw failureCode.
- **Child preservation:** completion/undo, pending approval, deferred restore, today/history boundary, timer completion, reward goal/balance, bottomnav scroll, read-aloud, swipe fallback. Reuse `task-card`, `quest-deferral`, `kid-history`, `habit-fire`, `kid-bottom-nav`, `phase-five-daily-experience` trước khi thêm tests.
- **Child recovery/age:** failure/unknown result/retry cho completion, timer-save và reward claim; no duplicate request trước rerender; anticipatory praise rollback, haptic success chờ authority, balance không thay giả. Above-fold geometry áp dụng nhánh trẻ tự thao tác;0–3 caregiver-led và unknown-age có primary actor/action riêng trong brief03, không bị áp checklist trẻ tự dùng.
- **Bulk recovery:** xác minh batch atomicity/outcome thật; test timeout/unknown response, mixed approved/skipped, PIN/auth expiry và concurrent second-device review. Reconcile authoritative pending IDs trước retry, không gửi lại toàn bộ selection cũ hay suy per-ID success từ aggregate; context/selection recovery không bypass PIN.
- **A03/A05:** contrast computed sau font/theme/transition ổn định cho timer Pause/Complete, approve, confirm points và footer/callout; ratios theo loại text/component, alpha composite. Change theme viaUI, system emulation và reload; không chỉ ép .dark.
- **A07:** getBoundingClientRect controls affected≥44×44 CSSpx ở mọi font size; focus ring không bị clip, không overlap và không tràn ngang. Không tự coi mọi control dưới44 làWCAG AA fail; đây là product touch target.
- **A08:** kiểm labels9locale, không dùng translated IDs; load saved settings cũ, đổi font/size rồi reload vẫn đúng; name/sample không bị split/truncate mất nghĩa.
- **A09/V02:** reduced motion giữ text result/loading và timer announce; timer control biến mất không mất focus vào body; Escape và focus restore đúng. Freeze/advance clock, không sleep chờ phút thật.
- **V01:** headings có hierarchy có nghĩa, landmarks/dialog label đúng; axe serious/critical=0 trên affected states. Không sửa bằng role giả che native structure.
- **V03/V04:** tofu repro theo font/OS, essential icons có fallback hệ hiện hữu; fresh prod build/reload thu console errors trước injection detector để không trộn extension/dev tool noise.

## Commands và sequencing

Các lệnh dưới là runbook cho thực thi, chưa chạy ở lượt lập plan. Dùng Node≥24 và package-lock hiện hữu; đọc Next guides liên quan trước edit. Dùng `rtk` theo RTK.md; không tự nâng packages.

```bash
rtk npm run lint
rtk npm run typecheck
rtk npm run test
rtk npm run build
rtk npm run check:performance
```

Budget chỉ chạy sau build thành công, kiểm tra `config/performance-budget.json`; không chỉnh ceiling để xanh. Nếu build strategy của project cần OpenNext manifest, dùng đúng path đang được script/release verify hỗ trợ và ghi rõ. Với Cloudflare release candidate: `rtk npm run build:cloudflare` và gate hiện hữu, không thay bằng nhận định từ dev server.

E2E trọng yếu sau khi build/server prerequisites thỏa:

```bash
rtk npx playwright test tests/e2e/parent-today.spec.ts tests/e2e/task-card.spec.ts tests/e2e/appearance.spec.ts tests/e2e/accessibility.spec.ts tests/e2e/phase-five-daily-experience.spec.ts --project=chromium --project=mobile-chromium
```

Đây là bộ khởi đầu, không thay suite mới do phase00 chọn. Mặc định config bật nhiều flags; để test D0 phải chạy server riêng với allowlist flags off rồi dùng `PLAYWRIGHT_BASE_URL`; environment ở test command không sửa bundle server đã build. Dùng fixture endpoints giả, không key production. Set locale qua cookie/init trước navigation để tránh hydrate noise do reload sai thời điểm.

Chạy focused WebKit cho navigation, theme, modal/timer focus và touch-sensitive flow, không nhất thiết toàn suite nếu không liên quan. Kiểm tra engine installed trước khi chạy; nếu cần cài chỉ browser tooling đã có trong devDependencies, không thêm dependency mới. Full relevant E2E và existing required static/security/content gates theo CI ở Phase07; testSQL/production smoke không chạy nếu không thay backend/schema và không có môi trường phù hợp.

Production-like checks dùng start server trên port trống và stop đúng PID sau kiểm tra; check budget dựa build mới. Nếu Lighthouse không có, báo chưa đoLCP/INP thay vì cài package hoặc giả score. Thu artifact/route chunk bytes và ảnh tải là bằng chứng tối thiểu cho V05.

## Evidence và gate

Mỗi kết quả: exact command, exit code, build SHA/diff fingerprint, server/flag manifest, locale/age/viewport/engine, log path. Mỗi failure phân loại introduced/pre-existing/infra bằng tái hiện, không auto dismiss. Handoff chỉ accepted khi required automated gates pass; manual external gates còn pending phải nêu rõ trong release packet. Không đặt mục tiêu UX score tùy ý thay cho acceptance. Không mở visual polish loop quá2vòng mỗi lát.
