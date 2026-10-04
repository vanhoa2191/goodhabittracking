# KidHabit Hero 用户指南

本指南介绍用户看到并使用的 **KidHabit Hero 全部功能**，并说明各项功能如何**相互关联**。每个文件都以“本指南内容”开头，以“相关内容”结尾，方便您从一项功能继续查看相关功能，无需重新搜索。

KidHabit Hero 通过每天的小行动帮助家长和儿童培养良好习惯：家长分配任务，儿童标记完成，家长审批，儿童收集星星以兑换家长选择的奖励。应用不会用星星比较儿童或评判品格（[查看原则](06-khoa-hoc-thoi-quen.md#nguyen-tac)）。

## 按角色阅读

| 您的身份 | 建议阅读顺序 |
|---|---|
| 想要开始使用的新家长 | [1. 开始使用](01-bat-dau.md) → [2. 儿童界面](02-man-hinh-be.md) → [3. 今天与审批](03-hom-nay-va-duyet-viec.md) |
| 想要设计习惯的家长 | [4. 习惯设计](04-thiet-ke-thoi-quen.md) → [6. 习惯科学](06-khoa-hoc-thoi-quen.md) |
| 管理家庭和设备的家长 | [5. 家庭和设置](05-gia-dinh-va-cai-dat.md) → [9. 安全与隐私](09-bao-mat-va-rieng-tu.md) |
| 关注计划和付款的家长 | [7. 计划和付款](07-goi-va-thanh-toan.md) → [8. 推荐朋友](08-gioi-thieu-ban-be.md) |
| 运营人员或客服 | [10. 管理与运营](10-quan-tri-va-van-hanh.md) |
| 网站访客或内容撰写者 | [11. 网站和公开页面](11-website-va-trang-cong-khai.md) |
| 想了解整体概况的人 | [12. 关联地图和场景](12-ban-do-lien-ket.md)和[13. 术语表](13-thuat-ngu.md) |

## 目录

1. [开始使用](01-bat-dau.md)：进入应用的方式、登录、设置家庭、角色、语言和演示。
2. [儿童界面](02-man-hinh-be.md)：任务、完成、延期、计时器、星星、等级、连续记录、徽章、奖励、排名、吉祥物、早晨来信、日记和梦想之城。
3. [今天与审批](03-hom-nay-va-duyet-viec.md)：待审批任务和奖励、每名儿童的进度、每周回顾、统计、打印和分享。
4. [习惯设计](04-thiet-ke-thoi-quen.md)：任务管理、资料库、47 项习惯框架、计划和提示、年龄路线及奖励资料库。
5. [家庭和设置](05-gia-dinh-va-cai-dat.md)：儿童档案、设备配对、照护者、账户、PIN、外观、隐私、提醒、安装应用、数据和休息。
6. [习惯科学](06-khoa-hoc-thoi-quen.md)：原则、四个阶段、建议逻辑、16 种人物优势和 7 种给予方式。
7. [计划和付款](07-goi-va-thanh-toan.md)：试用、计划、PayOS、启用、优惠码、退款和电子邮件。
8. [推荐朋友](08-gioi-thieu-ban-be.md)：推荐码、九折优惠、30% 佣金和提现。
9. [安全与隐私](09-bao-mat-va-rieng-tu.md)：PIN、配对码、同意、儿童数据和数据删除。
10. [管理与运营](10-quan-tri-va-van-hanh.md)：管理页面、角色、客服、后台任务和技术文档。
11. [网站和公开页面](11-website-va-trang-cong-khai.md)：落地页、博客、框架、路线、科学和法律页面。
12. [关联地图和场景](12-ban-do-lien-ket.md)：依赖关系图、端到端流程和故障排查。
13. [术语表](13-thuat-ngu.md)。

<!--op-->## 两个使用界面和三类用户

KidHabit Hero 提供两个独立入口，各自有不同网址：

| 入口 | 地址 | 用途 | 文档 |
|---|---|---|---|
| **应用** | `app.kidhabithero.com` | 登录、管理家庭、儿童完成任务、付款和管理操作 | 1 至 10 |
| **落地网站** | `kidhabithero.com` | 产品介绍、价格、博客、习惯框架和条款 | [11](11-website-va-trang-cong-khai.md) |

应用有三类用户，每类用户都只会看到自己的区域：

- **家长**（家庭所有者、父母、监护人）：使用 Google 登录并查看“今天”“设计”和“家庭”区域。
- **儿童**：输入家长提供的代码或 QR 码进入（无需账户），并且只能看到自己的区域。
- **照护者**（祖父母或亲属）：由家长邀请，只能查看进度，不能编辑任何内容。<!--/op-->

## 功能目录

“状态”列显示功能是否已对所有用户开放（**已开启**）或尚不可用（**已关闭**）。<!--op-->状态取自当前版本的配置变量；运营人员可在[部署文档](../deployment.md)中更改。<!--/op-->

| 功能 | 使用者 | 位置 | 要求 | 状态 | 相关章节 |
|---|---|---|---|---|---|
| Google 登录 | 家长 | 入口页面 | 无 | 开启 | [1](01-bat-dau.md#dang-nhap) |
| 使用电子邮件验证码登录 | 家长 | 入口页面 | 暂不可用<!--op-->（`emailCodeLogin` flag）<!--/op--> | **关闭** | [1](01-bat-dau.md#dang-nhap) |
| 演示（示例数据） | 所有人 | 入口页面 | 无 | 开启 | [1](01-bat-dau.md#demo) |
| 创建第一个儿童档案 | 家长 | 首次使用 | 同意数据管理 | 开启 | [1](01-bat-dau.md#thiet-lap) |
| 九种语言和自动检测 | 所有人 | 全部页面 | 无 | 开启 | [1](01-bat-dau.md#ngon-ngu) |
| 儿童使用家庭代码或 QR 码进入 | 儿童 | 入口页面 | 家长已创建儿童档案 | 开启 | [5](05-gia-dinh-va-cai-dat.md#ghep-thiet-bi)、[9](09-bao-mat-va-rieng-tu.md#ma-ghep) |
| 按时段安排每日任务 | 儿童 | 儿童界面 | 已分配任务 | 开启 | [2](02-man-hinh-be.md#nhiem-vu) |
| 滑动以完成或延期 | 儿童 | 儿童界面 | 无 | 开启 | [2](02-man-hinh-be.md#hoan-thanh) |
| 有时长任务的计时器 | 儿童 | 儿童界面 | 任务设有分钟数 | 开启 | [2](02-man-hinh-be.md#dem-gio) |
| 朗读任务 | 儿童 | 儿童界面 | 设备支持此功能 | 开启 | [2](02-man-hinh-be.md#doc-to) |
| 星星、等级和连续记录 | 儿童、家长 | 两种界面 | 无 | 开启 | [2](02-man-hinh-be.md#sao-cap-chuoi) |
| 徽章（5 个基础和 16 枚人物徽章） | 儿童 | 儿童界面 | 完成任务 | 开启 | [2](02-man-hinh-be.md#huy-hieu)、[6](06-khoa-hoc-thoi-quen.md#chan-dung) |
| 兑换奖励并设置奖励目标 | 儿童、家长 | 两种界面 | 家长已创建奖励资料库 | 开启 | [2](02-man-hinh-be.md#qua)、[4](04-thiet-ke-thoi-quen.md#kho-qua) |
| 家庭和小组排名 | 儿童 | 儿童界面 | 无 | 开启 | [2](02-man-hinh-be.md#bang-xep-hang) |
| 公开排名 | 儿童 | 儿童界面 | 家长开启并选择儿童 | 开启（每个家庭默认关闭） | [5](05-gia-dinh-va-cai-dat.md#rieng-tu)、[9](09-bao-mat-va-rieng-tu.md#bxh-cong-khai) |
| 吉祥物和颜色 | 儿童 | 儿童界面 | 吉祥物每 7 天可更换一次 | 开启 | [2](02-man-hinh-be.md#linh-vat) |
| 吉祥物的早晨来信 | 儿童 | 儿童界面 | 07:00 起 | **开启** | [2](02-man-hinh-be.md#thu-buoi-sang) |
| 一句话日记 | 儿童、家长 | 两种界面 | 无 | **开启** | [2](02-man-hinh-be.md#nhat-ky)、[3](03-hom-nay-va-duyet-viec.md#thong-ke) |
| 梦想之城 | 儿童 | 儿童界面 | 使用星星建造 | **开启** | [2](02-man-hinh-be.md#thanh-pho) |
| 适龄外观 | 儿童、家长 | 两种界面 | 家长可固定设置 | **开启** | [2](02-man-hinh-be.md#giao-dien-tuoi)、[5](05-gia-dinh-va-cai-dat.md#ho-so) |
| 审批任务和奖励 | 家长 | 今天 | 如已设置则需要 PIN | 开启 | [3](03-hom-nay-va-duyet-viec.md#duyet) |
| 手动增减星星 | 家长 | 儿童档案 | 如已设置则需要 PIN | 开启 | [3](03-hom-nay-va-duyet-viec.md#chinh-sao) |
| 儿童“今天”视图（任务数、连续记录、7 天）、进度和每周回顾 | 家长 | 今天 | 进度和每周回顾需要启用习惯计划 | **开启** | [3](03-hom-nay-va-duyet-viec.md#hom-nay) |
| 记录儿童的完成方式（独立、提醒、一起完成） | 家长、15 岁及以上儿童 | 今天、儿童界面 | 已启用习惯计划 | **开启** | [3](03-hom-nay-va-duyet-viec.md#muc-ho-tro)、[6](06-khoa-hoc-thoi-quen.md#bon-pha) |
| 7 天统计、每周打印和里程碑分享 | 家长 | 今天 → 统计 | 无 | 开启 | [3](03-hom-nay-va-duyet-viec.md#thong-ke) |
| 管理任务和创建自定义任务 | 家长 | 设计 → 任务管理 | 有计划 | 开启 | [4](04-thiet-ke-thoi-quen.md#quan-ly-viec) |
| 适用于 0–18 岁的 47 项习惯框架 | 家长 | 任务管理 → 资料库 | 有计划 | 开启 | [4](04-thiet-ke-thoi-quen.md#khung-47)、[6](06-khoa-hoc-thoi-quen.md#khung) |
| 计划和“如果……就……”提示 | 家长 | 任务管理 | 已启用习惯计划 | **开启** | [4](04-thiet-ke-thoi-quen.md#chuong-trinh)、[6](06-khoa-hoc-thoi-quen.md#logic) |
| 适龄路线（5 个阶段） | 家长 | 设计 → 路线 | 有计划 | 开启 | [4](04-thiet-ke-thoi-quen.md#lo-trinh) |
| 16 种人物优势和 7 种给予方式指南 | 家长 | 顶部栏 | 无 | 开启 | [6](06-khoa-hoc-thoi-quen.md#chan-dung) |
| 奖励资料库和奖励建议 | 家长 | 设计 → 奖励 | 有计划 | 开启 | [4](04-thiet-ke-thoi-quen.md#kho-qua) |
| 儿童档案和适龄计划包 | 家长 | 家庭 → 儿童档案 | 儿童人数取决于计划 | 开启 | [5](05-gia-dinh-va-cai-dat.md#ho-so) |
| 配对和撤销设备 | 家长 | 儿童档案、设置 | 如已设置则需要 PIN | 开启 | [5](05-gia-dinh-va-cai-dat.md#ghep-thiet-bi) |
| 邀请照护者（只读） | 家长 | 设置 | 链接有效 72 小时 | 开启 | [5](05-gia-dinh-va-cai-dat.md#nguoi-cham-soc) |
| 家长 PIN | 家长 | 设置 | 无 | 开启 | [5](05-gia-dinh-va-cai-dat.md#pin)、[9](09-bao-mat-va-rieng-tu.md#pin) |
| 全家休息 | 家长 | 设置 | 无 | 开启 | [5](05-gia-dinh-va-cai-dat.md#tam-nghi) |
| 家长提醒 | 家长 | 设置 | 家长同意 | **开启** | [5](05-gia-dinh-va-cai-dat.md#nhac-viec) |
| 安装应用（PWA） | 所有人 | 设置、浏览器 | 无 | 开启 | [5](05-gia-dinh-va-cai-dat.md#pwa) |
| 下载和恢复家庭数据 | 家长 | 设置 | 无 | 开启 | [5](05-gia-dinh-va-cai-dat.md#du-lieu) |
| 永久删除家庭数据 | 家庭所有者 | 统计 | 输入 `DELETE FAMILY` | 开启 | [9](09-bao-mat-va-rieng-tu.md#xoa-du-lieu) |
| 7 天试用 | 家长 | `/start`、价格、设置 | 每个家庭一次 | 开启 | [7](07-goi-va-thanh-toan.md#dung-thu) |
| 通过 PayOS 使用 VietQR 付款 | 家长 | 价格、`/checkout` | 登录 | 开启 | [7](07-goi-va-thanh-toan.md#thanh-toan) |
| 礼品码（优惠码） | 家长 | 家庭 → 账户 | 有效代码 | 开启 | [7](07-goi-va-thanh-toan.md#coupon) |
| 推荐朋友、10% 折扣、30% 佣金 | 家长 | 设置、`?ref=` 链接 | 提现需要 PIN | 开启 | [8](08-gioi-thieu-ban-be.md) |
| 生命周期邮件 | 家长 | 收件箱 | 电子邮件配置 | 依配置而定 | [7](07-goi-va-thanh-toan.md#email) |
| 管理员页面（6 个部分） | 管理员 | `/admin` | 角色和两步验证 | 开启 | [10](10-quan-tri-va-van-hanh.md#admin) |

## 本指南的约定

- **应用内路径**使用 `区域 → 项目` 格式，例如 `Family → Settings`。
- “有计划”表示家庭正在试用，或计划尚未到期（[7](07-goi-va-thanh-toan.md)）。
- “如已设置 PIN”表示此操作仅在当前浏览器输入了正确且有效的家长 PIN 后执行（[5](05-gia-dinh-va-cai-dat.md#pin)）。
- 价格、阈值和时限均为编写时的数值；权威来源是每个文件末尾链接的技术文档。

<!--op-->## 保持指南准确

- 添加或更改功能时，请更新上方的**功能目录**和对应说明文件；并在文件末尾的“相关内容”中添加相关功能链接。
- 每个章节都有锚点 `<a id="…"></a>` 供链接使用；请勿重命名已在使用的锚点。`tests/unit/user-guide-links.test.ts` 测试会在内部链接或锚点失效时报告错误。
- 价格、阈值和发布标志以源代码为准；若两者不一致，应更新指南以匹配源代码。
- 最后更新：10/03/2026。
- 第 1 至 9、12 和 13 章也显示在应用中（`/docs` 和家长区域中的 ?）。编辑 Markdown 后，请运行 `npm run guide:build` 重新构建 `public/guide`；若遗漏，`tests/unit/guide-build.test.ts` 测试会报告错误。仅供运营人员阅读的内容应放在 HTML 注释对 `<!-- op -->` 和 `<!-- /op -->` 之间（本文以不带空格的形式书写；此处加空格，因此不会产生效果），不会显示在应用中。
- **译文：**在 `docs/huong-dan/i18n/<language code>/` 中按原文件名保存各章译文，并保留每条 `<a id="…"></a>`、链接目标以及表格行数、列数和列表项数量；将语言代码加入 `src/lib/guide/guide-locale.ts` 的 `GUIDE_TRANSLATIONS`，然后运行 `npm run guide:build`。`tests/unit/guide-translations.test.ts` 测试会将每份译文与越南语版本的结构进行比较。编辑越南语章节时，也要更新对应译文。
- 新功能需要 ? 帮助提示时：将其代码加入 `src/lib/guide/help-topic-id.ts`，在 `src/lib/guide/help-topics.ts` 中用越南语和英语编写指向指南现有章节的说明，然后将 `<HelpTip topic="…" />` 放在对应屏幕标题旁。

## 相关技术文档

[架构](../architecture.md) · [安全与隐私](../security-privacy.md) · [习惯科学与自适应逻辑](../habit-science-and-adaptive-logic.md) · [习惯框架数据契约](../habit-framework-data-contract.md) · [推荐计划](../affiliate-program.md) · [产品分析](../product-analytics.md) · [部署](../deployment.md) · [数据恢复](../data-recovery.md) · [主张台账](../claims-ledger.md) · [博客发布指南](../blog-guide.md) · [生命周期邮件和退款](../runbooks/lifecycle-and-refunds.md)<!--/op-->
