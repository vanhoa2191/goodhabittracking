/**
 * Thinking Games Vietnamese Copy Inventory
 *
 * Implements authoritative peer voice "mình – bạn" for child-facing daily thinking games.
 * Per locked Decision D15 & D29:
 * - Initial release is 'vi' only.
 * - Other locales are deferred and require reviewed native content.
 * - Unsupported locales are explicitly rejected (no silent fallbacks or fake coverage).
 */

export const SUPPORTED_THINKING_GAME_LOCALES = ['vi'] as const;
export type SupportedThinkingGameLocale = (typeof SUPPORTED_THINKING_GAME_LOCALES)[number];

export function isThinkingGameLocaleSupported(locale: string): locale is SupportedThinkingGameLocale {
  return (SUPPORTED_THINKING_GAME_LOCALES as readonly string[]).includes(locale);
}

export interface ThinkingGamesCopy {
  readonly invitation: {
    readonly mainTitle: string;
    readonly bonusTitle: string;
    readonly mainBody: string;
    readonly bonusBody: string;
    readonly startAction: string;
    readonly laterAction: string;
  };
  readonly tutorial: {
    readonly title: string;
    readonly defaultGuidance: string;
    readonly understandAction: string;
    readonly readAloudAction: string;
    readonly stopReadAloudAction: string;
    readonly coPlayNote: string;
  };
  readonly playing: {
    readonly pauseAction: string;
    readonly hintAction: string;
    readonly exitAction: string;
    readonly soundOnAction: string;
    readonly soundOffAction: string;
    readonly hintsRemaining: (remaining: number) => string;
  };
  readonly paused: {
    readonly title: string;
    readonly body: string;
    readonly resumeAction: string;
    readonly exitAction: string;
  };
  readonly hints: {
    readonly level1Title: string;
    readonly level2Title: string;
    readonly defaultHint1: string;
    readonly defaultHint2: string;
    readonly closeAction: string;
    readonly nextHintAction: string;
    readonly noMoreHints: string;
  };
  readonly wrong: {
    readonly title: string;
    readonly body: string;
    readonly retryAction: string;
    readonly hintAction: string;
  };
  readonly retry: {
    readonly title: string;
    readonly body: string;
    readonly confirmAction: string;
    readonly cancelAction: string;
  };
  readonly finish: {
    readonly title: string;
    readonly persistPraise: string;
    readonly strategyPraise: string;
    readonly explanationAction: string;
    readonly homeAction: string;
  };
  readonly explanation: {
    readonly title: string;
    readonly defaultBody: string;
    readonly understandAction: string;
  };
  readonly exit: {
    readonly title: string;
    readonly body: string;
    readonly confirmAction: string;
    readonly cancelAction: string;
  };
  readonly loading: {
    readonly title: string;
    readonly body: string;
  };
  readonly error: {
    readonly title: string;
    readonly defaultBody: string;
    readonly retryAction: string;
    readonly closeAction: string;
    readonly codes: Readonly<Record<string, string>>;
  };
  readonly networkPending: {
    readonly title: string;
    readonly body: string;
    readonly retryAction: string;
    readonly laterAction: string;
  };
  readonly approvalWaiting: {
    readonly title: string;
    readonly body: string;
    readonly understandAction: string;
  };
  readonly bonusLocked: {
    readonly title: string;
    readonly body: string;
    readonly viewTasksAction: string;
    readonly closeAction: string;
  };
  readonly bedtime: {
    readonly title: string;
    readonly body: string;
    readonly goodnightAction: string;
  };
  readonly missingContent: {
    readonly title: string;
    readonly body: string;
    readonly laterAction: string;
  };
  readonly labels: {
    readonly close: string;
    readonly mainSlotBadge: string;
    readonly bonusSlotBadge: string;
    readonly dayBadge: (day: number) => string;
    readonly companionAria: (name: string) => string;
    readonly hintButtonAria: (used: number, max: number) => string;
    readonly muteButtonAria: (muted: boolean) => string;
    readonly readAloudAria: (reading: boolean) => string;
  };
}

export const THINKING_GAMES_VI_COPY: ThinkingGamesCopy = {
  invitation: {
    mainTitle: 'Thử thách tư duy hôm nay',
    bonusTitle: 'Câu đố thưởng thêm',
    mainBody: 'Mình có một thử thách mới hôm nay. Bạn cùng khám phá nhé?',
    bonusBody: 'Bạn đã hoàn thành các nhiệm vụ đúng giờ! Mình có thêm một câu đố thưởng cho bạn đây.',
    startAction: 'Cùng thử nhé',
    laterAction: 'Để sau',
  },
  tutorial: {
    title: 'Hướng dẫn cách chơi',
    defaultGuidance: 'Bạn xem hình mẫu nhé: quy luật thay đổi theo hướng mũi tên này.',
    understandAction: 'Mình hiểu rồi',
    readAloudAction: 'Nghe mình đọc',
    stopReadAloudAction: 'Dừng đọc',
    coPlayNote: 'Dành cho người lớn: hãy ngồi cạnh bạn nhỏ, đọc to hướng dẫn rồi để bạn tự chạm nhé.',
  },
  playing: {
    pauseAction: 'Tạm dừng',
    hintAction: 'Gợi ý',
    exitAction: 'Nghỉ chút',
    soundOnAction: 'Bật âm thanh',
    soundOffAction: 'Tắt âm thanh',
    hintsRemaining: (remaining: number) => `Còn ${remaining} gợi ý`,
  },
  paused: {
    title: 'Nghỉ ngơi một chút',
    body: 'Mình dừng ở đây nhé. Bạn cho mắt nghỉ ngơi một lát nào!',
    resumeAction: 'Chơi tiếp',
    exitAction: 'Nghỉ ngơi',
  },
  hints: {
    level1Title: 'Gợi ý 1: Quan sát kỹ',
    level2Title: 'Gợi ý 2: Thu hẹp phạm vi',
    defaultHint1: 'Bạn thử nhìn kỹ hai hình đầu tiên xem màu sắc thay đổi thế nào nhé.',
    defaultHint2: 'Hình tiếp theo sẽ có cùng hình dạng nhưng đổi màu. Bạn tìm hình phù hợp nhé.',
    closeAction: 'Đã hiểu gợi ý',
    nextHintAction: 'Xem gợi ý tiếp theo',
    noMoreHints: 'Đã hết gợi ý cho câu đố này rồi.',
  },
  wrong: {
    title: 'Chưa khớp rồi',
    body: 'Cách này chưa khớp rồi. Không sao cả, mình cùng thử một cách khác nhé!',
    retryAction: 'Thử lại cách khác',
    hintAction: 'Xem gợi ý',
  },
  retry: {
    title: 'Làm lại từ đầu?',
    body: 'Bạn có muốn xếp lại câu đố này từ đầu không?',
    confirmAction: 'Làm lại',
    cancelAction: 'Giữ nguyên',
  },
  finish: {
    title: 'Chúc mừng bạn!',
    persistPraise: 'Bạn rất kiên trì thử nhiều cách khác nhau để tìm lời giải!',
    strategyPraise: 'Bạn đã quan sát rất nhanh manh mối và hoàn thành câu đố!',
    explanationAction: 'Xem giải thích',
    homeAction: 'Về trang chủ',
  },
  explanation: {
    title: 'Vì sao lại như vậy?',
    defaultBody: 'Vì mỗi bước hình xoay một góc theo chiều kim đồng hồ, nên hình cuối cùng sẽ ở vị trí này.',
    understandAction: 'Đã hiểu rồi!',
  },
  exit: {
    title: 'Bạn muốn nghỉ chút à?',
    body: 'Tiến trình của bạn được giữ nguyên. Bạn có thể quay lại bất cứ lúc nào trước giờ nghỉ ngơi.',
    confirmAction: 'Nghỉ một lát',
    cancelAction: 'Chơi tiếp',
  },
  loading: {
    title: 'Đang chuẩn bị câu đố…',
    body: 'Bạn chờ mình một chút xíu nhé!',
  },
  error: {
    title: 'Chưa mở được câu đố',
    defaultBody: 'Đã có chút trục trặc nhỏ. Bạn thử tải lại hoặc quay lại sau nhé!',
    retryAction: 'Thử lại',
    closeAction: 'Đóng',
    codes: {
      feature_off: 'Tính năng trò chơi tư duy hiện chưa được kích hoạt.',
      settings_required: 'Ba mẹ chưa hoàn tất thiết lập trò chơi cho gia đình.',
      timezone_required: 'Hệ thống cần múi giờ gia đình để mở câu đố đúng ngày.',
      timezone_invalid: 'Múi giờ gia đình chưa hợp lệ. Nhờ ba mẹ kiểm tra lại nhé.',
      age_track_unavailable: 'Câu đố cho độ tuổi của bạn đang được chuẩn bị. Bạn đón chờ các phiên bản sau nhé!',
      content_unavailable: 'Câu đố mới chưa sẵn sàng. Bạn quay lại sau nhé!',
      content_not_approved: 'Câu đố đang được hoàn thiện nội dung. Bạn quay lại sau nhé!',
      bedtime: 'Đã đến giờ nghỉ ngơi rồi. Chúc bạn ngủ ngon, mai mình lại cùng chơi nhé!',
      outside_play_window: 'Hiện chưa đến giờ mở câu đố hôm nay. Bạn quay lại sau nhé!',
      bonus_locked: 'Bạn hoàn thành các nhiệm vụ đúng giờ để mở câu đố thưởng nhé!',
      bonus_not_eligible: 'Hôm nay không có lượt thưởng bổ sung. Bạn hãy làm tốt các nhiệm vụ nhé!',
      bonus_pending_approval: 'Nhiệm vụ đã gửi ba mẹ rồi! Khi ba mẹ duyệt xong, lượt thưởng sẽ mở nhé.',
      bonus_quiet_hours: 'Nhiệm vụ đã được duyệt! Bây giờ là giờ nghỉ ngơi rồi, mai bạn cùng mình khám phá nhé.',
      day_changed: 'Đã bước sang ngày mới rồi. Mình cùng bắt đầu câu đố hôm nay nhé!',
      attempt_expired: 'Câu đố này thuộc về ngày hôm qua rồi. Mình cùng chơi câu đố hôm nay nhé!',
      attempt_not_found: 'Không tìm thấy lượt chơi. Bạn thử mở lại từ trang chủ nhé.',
      already_finished: 'Bạn đã hoàn thành câu đố này rồi!',
      duplicate: 'Yêu cầu đang được xử lý, bạn chờ một chút nhé.',
      offline_no_entitlement: 'Mình đang cần kết nối mạng để tải câu đố mới. Bạn kiểm tra lại mạng nhé.',
      session_invalid: 'Phiên kết nối của thiết bị đã hết hạn. Nhờ ba mẹ kết nối lại nhé.',
      family_mismatch: 'Không tìm thấy thông tin gia đình phù hợp.',
      rate_limited: 'Bạn thao tác hơi nhanh rồi. Mình nghỉ vài giây rồi thử lại nhé.',
      internal: 'Hệ thống gặp sự cố bất ngờ. Bạn thử lại sau ít phút nhé.',
    },
  },
  networkPending: {
    title: 'Đang chờ kết nối mạng',
    body: 'Mình đang chờ kết nối mạng để tải câu đố mới. Bạn đợi mình một lát nhé.',
    retryAction: 'Kiểm tra lại',
    laterAction: 'Để sau',
  },
  approvalWaiting: {
    title: 'Chờ ba mẹ duyệt nhiệm vụ',
    body: 'Nhiệm vụ đã gửi ba mẹ rồi! Khi ba mẹ duyệt xong, lượt thưởng sẽ mở nhé.',
    understandAction: 'Mình biết rồi',
  },
  bonusLocked: {
    title: 'Lượt thưởng đang khóa',
    body: 'Để mở lượt thưởng, bạn hãy hoàn thành các nhiệm vụ hôm nay trước giờ quy định nhé!',
    viewTasksAction: 'Xem nhiệm vụ',
    closeAction: 'Đóng',
  },
  bedtime: {
    title: 'Đến giờ nghỉ ngơi rồi',
    body: 'Đã đến giờ nghỉ ngơi rồi. Chúc bạn ngủ ngon, mai mình lại cùng chơi nhé!',
    goodnightAction: 'Chúc ngủ ngon',
  },
  missingContent: {
    title: 'Câu đố đang chuẩn bị',
    body: 'Câu đố mới cho hôm nay đang được chuẩn bị. Bạn quay lại sau một chút nhé!',
    laterAction: 'Quay lại sau',
  },
  labels: {
    close: 'Đóng',
    mainSlotBadge: 'Câu đố chính',
    bonusSlotBadge: 'Lượt thưởng',
    dayBadge: (day: number) => `Ngày ${day}`,
    companionAria: (name: string) => `Bạn đồng hành ${name}`,
    hintButtonAria: (used: number, max: number) => `Gợi ý (${used}/${max})`,
    muteButtonAria: (muted: boolean) => (muted ? 'Bật âm thanh' : 'Tắt âm thanh'),
    readAloudAria: (reading: boolean) => (reading ? 'Dừng đọc hướng dẫn' : 'Nghe mình đọc hướng dẫn'),
  },
};

/**
 * Returns thinking games copy for a requested locale.
 * Rejects unreviewed locales explicitly by returning null.
 */
export function getThinkingGamesCopy(locale: string): ThinkingGamesCopy | null {
  if (!isThinkingGameLocaleSupported(locale)) {
    return null;
  }
  return THINKING_GAMES_VI_COPY;
}

/**
 * Convenience getter for Vietnamese copy.
 */
export function getThinkingGamesViCopy(): ThinkingGamesCopy {
  return THINKING_GAMES_VI_COPY;
}
