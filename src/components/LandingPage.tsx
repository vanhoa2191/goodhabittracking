'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  Trophy,
  ShieldCheck,
  BookOpen,
  ArrowRight,
  Star,
  Zap,
  Flame,
  Compass,
  ChevronRight,
  Smartphone,
  Upload,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';
import { useAppStore } from '@/lib/store';
import { WEEKLY_JOURNEY_PLANS, MONTHLY_JOURNEY_PLANS } from '@/lib/constants';
import { getJourneyHabitText } from '@/lib/i18n/journey-content';
import { getJourneyPeriodLabel, journeyCopy } from '@/lib/i18n/journey-copy';
import { getLandingUiCopy } from '@/lib/i18n/landing-ui-copy';

interface LandingPageProps {
  onStartDemo: () => void;
  onStartLocalSetup: () => void;
  onLoginGoogle: () => void;
  isLoggedIn?: boolean;
}

const FRAMEWORK_PILLARS = [
  {
    id: 'wisdom',
    icon: '🧠',
    badge: {
      vi: 'Trí Tuệ & Sức Học Tập',
      en: 'Wisdom & Lifelong Learning',
      zh: '智慧与自主学习力',
      ja: '知恵と自学自習の力',
      ko: '지혜와 자기주도 학습력',
    },
    title: {
      vi: 'Khai mở trí tuệ, say mê khám phá & đúc kết bài học mỗi ngày',
      en: 'Cultivate sharp intellect, scientific curiosity & key takeaways',
      zh: '启迪敏锐心智，激发探索求知欲与总结感悟',
      ja: '柔軟な知性と探求心を育み、毎日の学びを深める',
      ko: '지혜로운 사고력과 호기심을 키우고 매일의 배움을 정리하기',
    },
    meaning: {
      vi: 'Giúp con hình thành tư duy độc lập, không xem việc học là áp lực mà là niềm say mê. Con biết đúc kết "Bài học tâm đắc ngộ ra" mỗi ngày để trưởng thành vượt bậc.',
      en: 'Empowers kids to think independently and view learning not as a chore, but as an adventure of daily insights and reflection.',
      zh: '引导孩子独立思考，将学习视为充满趣味的探索，学会总结每日收获，获得飞跃成长。',
      ja: '子どもが自立して考え、勉強を義務ではなく楽しい発見と感じられるよう、日々の気づきと振り返りを促します。',
      ko: '스스로 생각하는 힘을 기르고, 공부를 의무가 아닌 즐거운 배움으로 느끼도록 매일의 깨달음을 정리합니다.',
    },
    badgeBg: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    examples: [
      {
        icon: '💡',
        title: {
          vi: 'Bài học tâm đắc: Chia sẻ 1 điều ngộ ra trong ngày',
          en: 'Daily Key Insight: Share 1 meaningful lesson learned',
          zh: '感悟与收获：每天分享一个所学到的新体会',
          ja: '今日のひらめき：今日学んだことを1つ話す',
          ko: '오늘의 배움: 오늘 새롭게 깨달은 점 1가지 이야기하기',
        },
        desc: {
          vi: 'Sau bữa cơm tối, con kể lại cho bố mẹ một bài học hay hoặc kinh nghiệm rút ra từ việc ở trường/ở nhà.',
          en: 'At dinner, child shares one inspiring lesson or insight learned during the day.',
          zh: '晚饭后与父母分享一件学校或生活中有价值的感悟心得。',
          ja: '夕食後などに、学校や日常で学んだ新しい発見や気づきを話します。',
          ko: '저녁 식사 후 학교나 일상에서 얻은 뜻깊은 배움 한 가지를 나눕니다.',
        },
        points: 20,
        timeOfDay: 'evening',
      },
      {
        icon: '📚',
        title: {
          vi: 'Sức học tập: Đọc sách nuôi dưỡng tâm hồn 15 phút',
          en: 'Mind Nourishment: Read good books for 15 minutes',
          zh: '心灵滋养：专注阅读有益书籍15分钟',
          ja: '心の栄養：本を15分間集中して読む',
          ko: '마음의 양식: 15분 동안 좋은 책 읽기',
        },
        desc: {
          vi: 'Đọc truyện tranh đạo đức, sách khoa học khám phá thế giới hoặc truyện cổ tích giáo dục.',
          en: 'Read moral stories, science books, or educational folk tales with joy.',
          zh: '自主阅读品德故事、科普读物或启迪心智的好书。',
          ja: '科学の本や心温まる物語、歴史マンガなどを集中して読みます。',
          ko: '인성 동화, 과학 책, 역사 만화 등을 흥미롭게 읽습니다.',
        },
        points: 20,
        timeOfDay: 'afternoon',
        duration: 15,
      },
      {
        icon: '✍️',
        title: {
          vi: 'Chủ động hoàn thành bài tập về nhà không cần nhắc',
          en: 'Independent Homework: Finish study tasks without nagging',
          zh: '自觉自律：主动专注完成课后作业无需催促',
          ja: '自主学習：言われなくても宿題をしっかり終わらせる',
          ko: '스스로 공부: 잔소리 없이 스스로 숙제 끝내기',
        },
        desc: {
          vi: 'Đến giờ học là tự giác ngồi vào bàn, bật đồng hồ Pomodoro tập trung làm xong bài dứt điểm.',
          en: 'Sits at the desk on time and uses the Pomodoro timer to focus until homework is done.',
          zh: '按时端坐书桌前，开启专注番茄钟高效完成全部功课。',
          ja: '時間になったら机に向かい、ポモドーロタイマーで集中して終わらせます。',
          ko: '시간에 맞춰 책상에 앉아 뽀모도로 타이머로 집중해서 숙제를 끝마칩니다.',
        },
        points: 25,
        timeOfDay: 'afternoon',
        duration: 30,
      },
    ],
  },
  {
    id: 'mindset',
    icon: '☀️',
    badge: {
      vi: 'Tâm Thái An Vui & Biết Ơn',
      en: 'Peaceful & Grateful Mindset',
      zh: '喜悦包容与感恩心态',
      ja: '安心・笑顔と感謝の心',
      ko: '평온하고 감사하는 마음가짐',
    },
    title: {
      vi: 'Nội tâm an vui, bao dung khác biệt & trân trọng biết ơn',
      en: 'Inner joy, acceptance of differences & daily gratitude',
      zh: '内心喜乐平和，尊重差异并常怀感恩之念',
      ja: 'おだやかな心、他者への寛容、そして日々の「ありがとう」',
      ko: '마음의 평온, 다름을 인정하는 포용력과 매일의 감사',
    },
    meaning: {
      vi: 'Giúp con rèn luyện trí tuệ cảm xúc (EQ), không cáu gắt mè nheo vào buổi sáng, biết nói lời cảm ơn chân thành và luôn nhìn thấy điều tốt đẹp ở mọi người.',
      en: 'Nurtures emotional intelligence (EQ). Kids wake up smiling instead of throwing tantrums, embrace gratitude, and cultivate tolerance towards others.',
      zh: '提升孩子的情商EQ。清晨告别任性哭闹，学会诚挚道谢，懂得包容并发现他人的闪光点。',
      ja: '感情のコントロール（EQ）を育みます。朝のぐずりをなくし、感謝を言葉にし、友達の違いを認め合います。',
      ko: '아이의 감성지능(EQ)을 키워줍니다. 아침 투정을 줄이고, 감사 인사를 자연스럽게 건네며 타인을 존중합니다.',
    },
    badgeBg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    examples: [
      {
        icon: '🌈',
        title: {
          vi: 'Tâm thái An vui: Mỉm cười bắt đầu ngày mới',
          en: 'Joyful Awakening: Wake up with a morning smile',
          zh: '清晨欢喜心：微笑迎接充满希望的新一天',
          ja: '笑顔でスタート：起きたら笑顔で「おはよう」',
          ko: '기분 좋은 아침: 미소로 상쾌하게 하루 시작하기',
        },
        desc: {
          vi: 'Tự giác mở mắt dậy, giữ tâm trạng vui vẻ, không mè nheo hay nhăn nhó với ba mẹ.',
          en: 'Wakes up happily without morning fuss or grumpiness towards parents.',
          zh: '自主醒来保持心情愉悦，不赖床、不发脾气闹情绪。',
          ja: '朝起きたときに機嫌よく笑顔で目覚め、気持ちよく一日を始めます。',
          ko: '투정 부리지 않고 스스로 기분 좋게 일어나 아침을 맞이합니다.',
        },
        points: 15,
        timeOfDay: 'morning',
      },
      {
        icon: '💖',
        title: {
          vi: 'Trân trọng biết ơn: Viết hoặc nói 3 điều biết ơn mỗi tối',
          en: 'Gratitude Reflection: Share 3 things grateful for',
          zh: '心怀感恩：睡前写下或诉说3件感恩的小事',
          ja: '3つの感謝：寝る前に今日ありがたかったことを3つ話す',
          ko: '감사하는 마음: 잠들기 전 고마운 일 3가지 말하기',
        },
        desc: {
          vi: 'Trước khi đi ngủ, con chia sẻ 3 điều biết ơn: biết ơn mẹ nấu cơm ngon, cảm ơn bạn cho mượn đồ chơi, cảm ơn chiếc giường êm ái.',
          en: 'Before bedtime, shares 3 genuine gratitudes: warm meal, helpful friends, cozy bed.',
          zh: '睡前分享3件感恩之事：感谢妈妈准备的美味饭菜、朋友的帮助与温暖的家。',
          ja: 'おやすみ前に「ごはんが美味しかった」「友達が優しかった」など3つの感謝を言葉にします。',
          ko: '잠들기 전 맛있는 식사, 친구의 도움 등 감사했던 일 3가지를 이야기합니다.',
        },
        points: 20,
        timeOfDay: 'evening',
      },
      {
        icon: '🌿',
        title: {
          vi: 'Tâm thái Bao dung: Tôn trọng sự khác biệt của bạn',
          en: 'Tolerant Mind: Respect peer differences kindly',
          zh: '宽厚包容：尊重伙伴的个性与兴趣差异',
          ja: '寛容の心：友達の個性や考えの違いを尊重する',
          ko: '너그러운 마음: 친구의 다른 점을 존중하고 배려하기',
        },
        desc: {
          vi: 'Chấp nhận và tôn trọng sở thích riêng của bạn bè, không trêu chọc hay giận hờn vô cớ.',
          en: 'Respects others’ unique hobbies and opinions without mocking or taking petty offense.',
          zh: '接纳并包容同伴不同的兴趣与习惯，不嘲笑、不轻易生气动怒。',
          ja: '友達の好みの違いをからかわず、温かい気持ちで受け入れます。',
          ko: '친구의 서로 다른 취향과 생각을 놀리지 않고 너그럽게 인정합니다.',
        },
        points: 20,
        timeOfDay: 'anytime',
      },
    ],
  },
  {
    id: 'personality',
    icon: '👑',
    badge: {
      vi: 'Kiện Toàn Nhân Cách',
      en: 'Inspiring Personality',
      zh: '健全人格魅力',
      ja: '豊かな人間性と人格',
      ko: '온전하고 바른 인격',
    },
    title: {
      vi: 'Vui vẻ, khiêm tốn, chân thật & truyền niềm tin hy vọng',
      en: 'Joy, humility, truthfulness & contagious optimism',
      zh: '乐观愉悦、谦逊倾听、勇于担当与真挚诚实',
      ja: '明るい笑顔、謙虚な聞き上手、素直で正直な心',
      ko: '밝은 웃음, 겸손한 경청, 솔직함과 희망 전하기',
    },
    meaning: {
      vi: 'Rèn luyện cho con một tính cách dễ mến, trung thực nhận lỗi khi làm sai, biết lắng nghe người khác mà không ngắt lời và lan tỏa tiếng cười ấm áp cho cả gia đình.',
      en: 'Builds a warm and trustworthy character: courageous enough to admit mistakes, modest enough to listen without interrupting, and cheerful enough to brighten any room.',
      zh: '培养亲和真诚的品格魅力：犯错时敢于坦诚承认，耐心倾听长辈与同伴发言，成为全家的开心果。',
      ja: '素直に非を認める勇気、人の話を遮らず聞く謙虚さ、家族を明るく照らす朗らかな人柄を育てます。',
      ko: '실수를 솔직히 인정하는 용기, 말을 끊지 않고 경청하는 겸손함, 가정에 웃음을 전하는 밝은 인성을 기릅니다.',
    },
    badgeBg: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    examples: [
      {
        icon: '😄',
        title: {
          vi: 'Nhân cách Vui vẻ: Mang lại tiếng cười cho gia đình',
          en: 'Joyful Spirit: Bring smiles and warmth home',
          zh: '欢喜人格：主动为家庭带来欢声笑语与关心',
          ja: '明るい笑顔：家族に笑いと元気を届ける',
          ko: '유쾌한 웃음: 가족에게 밝은 웃음과 활력 선물하기',
        },
        desc: {
          vi: 'Hỏi thăm bố mẹ sau giờ làm việc mệt mỏi, kể một mẩu chuyện vui hoặc hát một bài hát đáng yêu.',
          en: 'Asks parents about their day, sings a cheerful tune, or shares a funny joke.',
          zh: '在父母下班回家时送上贴心问候，讲个幽默故事舒缓身心。',
          ja: 'お仕事帰りの親に「お疲れさま！」と声をかけ、楽しいお話を共有します。',
          ko: '퇴근한 부모님께 다정하게 인사하고, 재미있는 이야기로 피로를 덜어드립니다.',
        },
        points: 15,
        timeOfDay: 'evening',
      },
      {
        icon: '👂',
        title: {
          vi: 'Nhân cách Khiêm tốn: Chăm chú lắng nghe không ngắt lời',
          en: 'Humility: Attentive listening without interrupting',
          zh: '谦逊美德：专注倾听他人表达绝不插话打断',
          ja: '謙虚な姿勢：人の話を途中で遮らずしっかり聞く',
          ko: '겸손한 태도: 다른 사람 말 중간에 끊지 않고 끝까지 듣기',
        },
        desc: {
          vi: 'Khi ông bà, bố mẹ hoặc bạn bè đang nói chuyện, con kiên nhẫn lắng nghe hết câu rồi mới phát biểu.',
          en: 'Listens patiently until adults or peers finish speaking before chiming in.',
          zh: '长辈或同伴发言时耐心完整听完，不抢话插嘴，礼貌交流。',
          ja: '大人の話や友達の意見を途中で遮らず、最後までじっくり耳を傾けます。',
          ko: '어른이나 친구가 이야기할 때 끼어들지 않고 끝까지 귀 기울여 듣습니다.',
        },
        points: 15,
        timeOfDay: 'anytime',
      },
      {
        icon: '🛡️',
        title: {
          vi: 'Nhân cách Chân thật: Dũng cảm nhận lỗi khi làm sai',
          en: 'Integrity & Truth: Courage to admit mistakes sincerely',
          zh: '真诚正直：勇于直面过失并坦诚认错改正',
          ja: '誠実な心：間違えたらごまかさず素直に謝る',
          ko: '정직과 용기: 잘못했을 때 변명하지 않고 솔직하게 인정하기',
        },
        desc: {
          vi: 'Nếu lỡ làm đổ vỡ đồ chơi hay quên làm bài, con dũng cảm nói thật với bố mẹ, không giấu giếm đổ lỗi.',
          en: 'Bravely tells the truth without hiding or blaming others when a mishap happens.',
          zh: '遇到打碎物品或疏漏时，坦白说出真相，不找借口推卸责任。',
          ja: '失敗したときも隠したり誰かのせいにせず、素直に「ごめんなさい」と言えます。',
          ko: '실수로 물건을 망가뜨렸을 때 숨기거나 남 탓하지 않고 정직하게 털어놓습니다.',
        },
        points: 25,
        timeOfDay: 'anytime',
      },
    ],
  },
  {
    id: 'virtue',
    icon: '💎',
    badge: {
      vi: '5 Phẩm Chất Vàng',
      en: '5 Golden Virtues',
      zh: '五大立身核心品德',
      ja: '5つの黄金の徳（仁・礼・義・智・信）',
      ko: '5대 핵심 미덕 (인·예·의·지·신)',
    },
    title: {
      vi: 'Nhân (Yêu thương), Lễ (Lễ phép), Nghĩa (Trách nhiệm), Trí (Sáng suốt), Tín (Đúng hẹn)',
      en: 'Compassion (Love), Respect (Etiquette), Duty, Wisdom & Trust (Punctuality)',
      zh: '仁（仁爱关怀）、礼（礼貌恭敬）、义（担当感恩）、智（敏锐洞察）、信（守诺守信）',
      ja: '仁（思いやり）・礼（礼儀）・義（責任感）・智（知恵探求）・信（約束を守る）',
      ko: '인(사랑과 배려)·예(예절과 인사)·의(책임감)·지(지혜로운 탐구)·신(약속과 신뢰)',
    },
    meaning: {
      vi: '5 phẩm chất vàng là kim chỉ nam định hình một công dân có uy tín và nhân cách lớn. Con học cách giữ lời hứa, đi thưa về trình và sống có trách nhiệm.',
      en: 'The five pillar virtues build an honorable, dependable individual. Kids learn to honor their promises, show deep respect, and own their responsibilities.',
      zh: '中华优秀传统美德与现代教育相融合。教会孩子一诺千金、待人谦和有礼、勇于承担义务。',
      ja: '古今東西の教育の基本となる5つの徳。約束を破らない、きちんと挨拶する、頼まれたことをやり遂げる力を培います。',
      ko: '신뢰받는 어른으로 자라나는 5가지 핵심 덕목입니다. 약속을 지키고, 바르게 인사하며, 맡은 일에 책임을 다합니다.',
    },
    badgeBg: 'bg-yellow-50 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
    examples: [
      {
        icon: '❤️',
        title: {
          vi: 'Phẩm chất Nhân: Yêu thương & chia sẻ món ngon cho em',
          en: 'Virtue Love: Share treats and care for younger siblings',
          zh: '仁爱之德：懂得关怀呵护幼小并分享美味食物',
          ja: '仁の心：美味しいものを独り占めせず兄弟や友達と分ける',
          ko: '인(사랑): 맛있는 음식을 동생이나 친구와 기쁘게 나누기',
        },
        desc: {
          vi: 'Nuôi dưỡng tình thương, biết nhường phần hoa quả bánh kẹo cho em nhỏ và chăm sóc mọi người.',
          en: 'Cultivates deep compassion by sharing snacks and protecting younger siblings.',
          zh: '不吃独食，把新鲜水果或零食欣然分给弟弟妹妹，关怀身边人。',
          ja: 'おやつを独り占めせず、分け合う喜びと思いやりを行動で示します。',
          ko: '과일이나 간식을 혼자 다 먹지 않고 동생이나 가족에게 먼저 권합니다.',
        },
        points: 15,
        timeOfDay: 'afternoon',
      },
      {
        icon: '🙇',
        title: {
          vi: 'Phẩm chất Lễ: Đi thưa về trình, khoanh tay chào người lớn',
          en: 'Virtue Respect: Polite greetings, bowing respectfully',
          zh: '礼貌之德：出必告返必面，双臂交叠恭敬问候长辈',
          ja: '礼の心：お出かけと帰りの挨拶、お辞儀して元気におはよう',
          ko: '예(예절): 나갈 때와 돌아왔을 때 공손히 인사하기',
        },
        desc: {
          vi: 'Khi ra khỏi nhà chào bố mẹ, khi về tới nhà chào ông bà, luôn nói năng dạ vâng tròn câu.',
          en: 'Greets elders when leaving or arriving home, speaks with polite honorifics.',
          zh: '离家进门主动问安，长辈问话恭敬回应“好的”、“谢谢”。',
          ja: '「行ってきます」「ただいま」をはっきり言い、大人の言葉に素直に返事します。',
          ko: '외출할 때와 다녀왔을 때 어른들께 바르게 인사하고 예의 바르게 대답합니다.',
        },
        points: 15,
        timeOfDay: 'morning',
      },
      {
        icon: '⏳',
        title: {
          vi: 'Phẩm chất Tín: Giữ đúng lời hứa & ngủ đúng giờ trước 21h30',
          en: 'Virtue Trust: Keep bedtime promises before 21:30',
          zh: '守信之德：信守承诺，每晚21:30前按时自觉就寝',
          ja: '信の心：約束を守り、夜21:30までに自分からお布団に入る',
          ko: '신(신뢰): 약속을 지키고 21시 30분 전에 스스로 잠자리에 들기',
        },
        desc: {
          vi: 'Làm đúng những gì đã giao ước với ba mẹ, không kì kèo xem tivi quá giờ, bảo vệ chữ Tín của bản thân.',
          en: 'Honors commitments without begging for extra screen time, keeping one’s word.',
          zh: '言出必行，说好放下手机就不再拖延，按时上床睡觉积累信誉。',
          ja: '親と交わした約束を守り、時間になったらテレビを消して布団に向かいます。',
          ko: '부모님과의 약속을 가볍게 여기지 않고, 정해진 시간에 스스로 잠자리에 듭니다.',
        },
        points: 25,
        timeOfDay: 'evening',
      },
    ],
  },
  {
    id: 'capacity',
    icon: '⚡',
    badge: {
      vi: 'Năng Lực & Tinh Thần Gánh Vác',
      en: 'Capacity & Responsibility',
      zh: '独立自理与担当力',
      ja: 'やり抜く力とお手伝いの自立',
      ko: '역량 강화와 책임감 분담',
    },
    title: {
      vi: 'Tự lập cá nhân, gánh vác việc nhà & kiên trì vượt khó',
      en: 'Personal autonomy, domestic teamwork & resilient persistence',
      zh: '生活自立自强，主动为家庭分忧并坚持到底',
      ja: '身の回りの自立、進んで家事を手伝い、最後までやり切る力',
      ko: '스스로 해내는 자립심, 집안일 분담과 끈기 있는 도전',
    },
    meaning: {
      vi: 'Bé không ỷ lại vào người lớn, chủ động làm các việc vệ sinh cá nhân, gấp chăn màn, dọn đồ chơi và rèn luyện tính kiên nhẫn không bỏ cuộc giữa chừng.',
      en: 'Frees kids from dependence on parents. They tidy their rooms, fold blankets, pack schoolbags, and build grit through deliberate practice.',
      zh: '告别衣来伸手饭来张口的依赖心理。孩子主动整理床铺、收拾玩具、整理书包，练就百折不挠的坚毅品质。',
      ja: '何でも親に頼るのをやめ、自分の布団たたみやおもちゃの片付けを率先して行い、粘り強い根気を身につけます。',
      ko: '부모에게 의존하지 않고 자신의 이불 정리, 장난감 정리, 책가방 챙기기를 스스로 하며 끝까지 해내는 끈기를 기릅니다.',
    },
    badgeBg: 'bg-cyan-50 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
    examples: [
      {
        icon: '🛏️',
        title: {
          vi: 'Tự gấp chăn màn & sắp xếp giường ngăn nắp',
          en: 'Make Own Bed: Fold blankets and arrange pillows neatly',
          zh: '主动担当：早起自主整齐折叠被褥并收拾床铺',
          ja: '布団たたみ：起きたら自分の布団をきちんと整える',
          ko: '이불 개기: 일어난 후 스스로 이불을 개고 베개 정리하기',
        },
        desc: {
          vi: 'Ngay khi thức dậy, con tự tay kéo phẳng drap giường, gấp chăn gọn gàng, tạo thói quen ngăn nắp suốt đời.',
          en: 'Immediately folds blanket and straightens bed upon rising, creating a lifelong habit of neatness.',
          zh: '起床后第一件事将床铺整理平整，从小建立井井有条的生活好习惯。',
          ja: '朝起きたらすぐに枕の位置を整え、布団をきれいにたたんで一日を始めます。',
          ko: '기상 직후 스스로 침대를 정돈하여 평생 가는 단정한 생활 습관을 만듭니다.',
        },
        points: 15,
        timeOfDay: 'morning',
      },
      {
        icon: '🎨',
        title: {
          vi: 'Kiên trì: Luyện tập nhạc cụ / vẽ tranh / viết chữ 20 phút',
          en: 'Grit Practice: 20 mins musical instrument, art or writing',
          zh: '坚韧不拔：坚持练习书法/乐器/绘画专注20分钟',
          ja: 'やり抜く練習：ピアノ・絵画・文字の練習を20分間諦めず続ける',
          ko: '끈기 연습: 악기, 그림, 글씨 연습 20분간 몰입하기',
        },
        desc: {
          vi: 'Dù gặp bài nhạc khó hay nét vẽ chưa đẹp, con vẫn kiên nhẫn luyện tập đến hết giờ Pomodoro, không nản chí.',
          en: 'Even when parts are challenging, presses forward until timer rings with steadfast focus.',
          zh: '哪怕遇到难点也不气馁放弃，伴随番茄钟耐心练习直至达成目标。',
          ja: '難しいところがあっても途中で放り出さず、タイマーが終わるまで粘り強く取り組みます。',
          ko: '어려운 부분이 있어도 포기하지 않고 타이머가 끝날 때까지 끈기 있게 연습합니다.',
        },
        points: 20,
        timeOfDay: 'afternoon',
        duration: 20,
      },
      {
        icon: '🚀',
        title: {
          vi: 'Dũng cảm thay đổi: Tự giác hạn chế xem điện thoại/tivi',
          en: 'Brave Change: Voluntarily step away from screens',
          zh: '自我突破：主动远离电子游戏与动画屏幕，转为阅读',
          ja: '脱スマホ・ゲーム：自分から画面を消して読書やお手伝いに切り替える',
          ko: '용기 있는 절제: 스스로 스마트폰·TV를 끄고 다른 활동하기',
        },
        desc: {
          vi: 'Tự giác tắt tivi hoặc trả điện thoại cho bố mẹ đúng giờ thỏa thuận để đi phụ việc nhà hoặc đọc sách.',
          en: 'Voluntarily switches off screen on time to help around the house or read books.',
          zh: '约定时间一到，立即自觉交还手机或关闭电视，协助家务。',
          ja: '決めた時間が来たらダラダラ続けず、スパッと消して次の行動に移ります。',
          ko: '약속한 시간이 되면 스스로 전원을 끄고 책을 읽거나 집안일을 돕습니다.',
        },
        points: 30,
        timeOfDay: 'evening',
      },
    ],
  },
  {
    id: 'physical',
    icon: '🏃',
    badge: {
      vi: 'Thể Chất & Sức Khỏe Bền Bỉ',
      en: 'Physical Vitality & Health',
      zh: '健康体魄与活力作息',
      ja: '元気な体と体力づくり',
      ko: '건강한 체력과 신체 활력',
    },
    title: {
      vi: 'Vận động thể thao, vệ sinh đúng chuẩn & nhịp sinh học khỏe',
      en: 'Active movement, hygiene discipline & biological wellness',
      zh: '坚持阳光体育运动，严守卫生标准与规律生理节律',
      ja: '毎朝の運動、正しい歯みがき、健康的な体内リズム',
      ko: '규칙적인 아침 운동, 올바른 위생과 건강한 생체 리듬',
    },
    meaning: {
      vi: 'Thân thể khỏe mạnh là bệ phóng cho trí tuệ và tinh thần. Con rèn thói quen tập thể dục sáng, đánh răng đủ 2 phút và nói không với thức uống có hại.',
      en: 'A sound body hosts a vibrant mind. Kids develop morning exercise routines, master standard 2-minute brushing, and choose healthy hydration.',
      zh: '强健体魄是一切成长的基石。培养早起晨练、科学两分钟刷牙及少喝含糖饮料的好习惯。',
      ja: '健康な体があってこそ心も知恵も育ちます。朝の軽い運動と2分間の正しい歯みがきを身につけます。',
      ko: '건강한 신체는 모든 성장의 기본입니다. 아침 가벼운 스트레칭과 2분 양치 습관을 자연스럽게 체득합니다.',
    },
    badgeBg: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    examples: [
      {
        icon: '🏃',
        title: {
          vi: 'Vận động thể thao / Thể dục buổi sáng 15 phút',
          en: 'Morning Exercise: 15 mins stretching, jumping or running',
          zh: '早操锻炼：早起晨跑、跳绳或做体操活力15分钟',
          ja: '朝の運動：15分間のストレッチや縄跳びで体を目覚めさせる',
          ko: '아침 운동: 15분 스트레칭, 줄넘기로 활기차게 몸 깨우기',
        },
        desc: {
          vi: 'Hít thở không khí trong lành, khởi động các khớp cơ, tăng cường sức đề kháng và chiều cao.',
          en: 'Boosts circulation, flexibility, natural immunity, and positive energy for the day.',
          zh: '呼吸新鲜空气，活动全身关节，增强免疫力与身体体能。',
          ja: '深い呼吸とともに体を動かし、免疫力と一日の集中力を高めます。',
          ko: '상쾌한 공기를 마시며 관절을 풀고 면역력과 하루 활력을 높입니다.',
        },
        points: 15,
        timeOfDay: 'morning',
        duration: 15,
      },
      {
        icon: '🪥',
        title: {
          vi: 'Đánh răng sáng & tối đúng 2 phút theo đồng hồ cát',
          en: 'Dental Care: Brush teeth for full 2 mins morning & night',
          zh: '科学洁牙：早晚使用倒计时认真刷牙满2分钟',
          ja: '正しい歯みがき：朝と夜、タイマーに合わせて2分間しっかり磨く',
          ko: '올바른 양치: 아침저녁 2분 타이머에 맞춰 구석구석 양치질하기',
        },
        desc: {
          vi: 'Bé mở đồng hồ Pomodoro trong app, chải kỹ mặt trong, mặt ngoài và mặt nhai, giữ răng chắc khỏe không sâu.',
          en: 'Runs app timer to thoroughly clean outer, inner and chewing surfaces for strong cavities-free teeth.',
          zh: '跟随APP中的刷牙倒计时，细致清洁每个牙齿死角，保持牙齿健康洁白。',
          ja: 'アプリのカウントダウンに合わせて、磨き残しのないよう丁寧に歯みがきします。',
          ko: '앱 타이머에 맞춰 치아 안쪽과 씹는 면까지 꼼꼼하게 닦아 충치를 예방합니다.',
        },
        points: 10,
        timeOfDay: 'morning',
        duration: 2,
      },
      {
        icon: '💧',
        title: {
          vi: 'Uống đủ nước ấm, không uống nước ngọt có ga',
          en: 'Hydration Choice: Drink warm water, skip sugary sodas',
          zh: '健康补水：每天适量饮用温开水，拒绝高糖碳酸饮料',
          ja: '水分補給：ジュースを控え、白湯やお茶をしっかり飲む',
          ko: '건강한 수분 섭취: 탄산음료 대신 따뜻한 물 자주 마시기',
        },
        desc: {
          vi: 'Chủ động mang bình nước lọc đi học và uống nước ấm thanh lọc cơ thể sau bữa ăn.',
          en: 'Brings water bottle to school and chooses pure water over carbonated sweet drinks.',
          zh: '随身携带水壶，饭后适量补充温开水，养成少喝含糖饮料的健康习惯。',
          ja: '甘いジュースに頼らず、水筒のお茶や水をこまめに飲んで体を健やかに保ちます。',
          ko: '당분이 많은 탄산음료를 멀리하고 따뜻한 물로 건강하게 수분을 보충합니다.',
        },
        points: 10,
        timeOfDay: 'afternoon',
      },
    ],
  },
  {
    id: 'dining',
    icon: '🍱',
    badge: {
      vi: 'Văn Hóa Bàn Ăn & Trân Quý Vật Chất',
      en: 'Dining Etiquette & Material Values',
      zh: '餐桌文明与惜物美德',
      ja: '食事マナーと命への感謝',
      ko: '식사 예절과 음식에 대한 감사',
    },
    title: {
      vi: 'Khoanh tay mời cơm, bàn ăn không màn hình, ăn hết rau & tự dọn bát',
      en: 'Table invitation, screen-free meals, finishing veggies & clearing dishes',
      zh: '餐前长幼有序请饭、就餐杜绝电子屏幕、吃完蔬菜自主洗碗',
      ja: '「いただきます」の挨拶、スマホなし食事、野菜完食とお片付け',
      ko: '식사 전 인사, 화면 없는 식탁, 골고루 먹기와 식기 정리하기',
    },
    meaning: {
      vi: 'Bàn ăn là trường học đầu tiên về văn hóa gia đình. Con học được lòng biết ơn người nấu nướng, tác phong ăn uống sạch sẽ, không kén ăn và tự lập phụ mẹ.',
      en: 'The dining table is a child’s first social classroom. They learn gratitude for food, hygienic dining manners, vegetable enjoyment, and post-meal tidy up.',
      zh: '餐桌是最好的家教现场。培养孩子感恩一粥一饭，养成不挑食、专注进食并主动收拾碗筷的优良习惯。',
      ja: '食卓は大切な家庭教育の場。「いただきます」の感謝、好き嫌いの克服、食べ終わった後の片付けまでを自然に学びます。',
      ko: '식탁은 아이의 첫 번째 사회성 배움터입니다. 음식을 준비해주신 분께 감사하고, 골고루 먹으며 스스로 그릇을 치웁니다.',
    },
    badgeBg: 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    examples: [
      {
        icon: '🥢',
        title: {
          vi: 'Khoanh tay mời cả nhà trước khi cầm đũa ăn cơm',
          en: 'Meal Blessing: Invite family warmly before eating',
          zh: '长幼有序：开动前双臂交叠礼貌请全家人用餐',
          ja: '食事の挨拶：食べる前に「いただきます」と家族全員に声をかける',
          ko: '식사 인사: 숟가락을 들기 전 어른들께 "맛있게 드세요" 인사하기',
        },
        desc: {
          vi: 'Mời ông bà, mời bố mẹ dùng bữa, thể hiện nét đẹp văn hóa tôn kính người lớn tuổi.',
          en: 'Politely invites elders to start the meal, honoring traditional family respect.',
          zh: '长辈动筷后再开始进食，双手合掌或礼貌称呼“爷爷奶奶爸爸妈妈请吃饭”。',
          ja: '目上の人が席に着いてから手を合わせ、心を込めて「いただきます」を言います。',
          ko: '어른들이 먼저 드신 후 두 손 모아 공손하게 식사 인사를 올립니다.',
        },
        points: 15,
        timeOfDay: 'afternoon',
      },
      {
        icon: '📵',
        title: {
          vi: 'Bàn ăn không màn hình: Ngồi ngay ngắn, không xem điện thoại/TV',
          en: 'Screen-Free Meals: Focus on food and family conversation',
          zh: '专注就餐：饭桌远离电视与手机，静心品味食物',
          ja: '食事中ノー画面：テレビやスマホを見ずに食事に集中する',
          ko: '화면 없는 식사: 스마트폰이나 TV 없이 식사와 대화에 집중하기',
        },
        desc: {
          vi: 'Tập trung nhai kỹ, trò chuyện vui vẻ cùng gia đình, bảo vệ thị lực và hệ tiêu hóa khỏe mạnh.',
          en: 'Chews food thoroughly, enjoys family conversations, and protects eyesight and digestion.',
          zh: '进餐时端正坐姿，细嚼慢咽，和爸爸妈妈愉快交流一天见闻。',
          ja: '画面を見ずに家族とおしゃべりしながら、よく噛んで美味しく味わいます。',
          ko: '스마트폰을 보지 않고 음식의 맛을 음미하며 가족과 정답게 대화를 나눕니다.',
        },
        points: 20,
        timeOfDay: 'afternoon',
      },
      {
        icon: '🥦',
        title: {
          vi: 'Ăn hết phần rau xanh & tự bưng bát đĩa cất vào bồn rửa',
          en: 'Eat Veggies & Clear Table: Finish greens and bring dish to sink',
          zh: '不挑食爱劳动：愉快吃完盘中绿叶蔬菜并主动收碗',
          ja: '野菜完食とお片付け：お野菜を残さず食べ、自分で食器を下げる',
          ko: '골고루 먹고 그릇 치우기: 채소도 남김없이 먹고 스스로 싱크대에 그릇 가져다 놓기',
        },
        desc: {
          vi: 'Không kén ăn, ăn hết phần rau bổ dưỡng. Ăn xong tự bưng chén dĩa vào bồn và lau bàn phụ mẹ.',
          en: 'Overcomes picky eating, clears own plate into sink, and wipes dining table clean.',
          zh: '摄取丰富维生素，餐后主动将碗筷端回水槽并用抹布擦拭餐桌。',
          ja: '苦手な野菜も一口挑戦して完食し、食べ終わったら自分の食器を流しへ運びます。',
          ko: '편식하지 않고 채소를 다 먹은 후, 자신의 그릇을 싱크대에 옮겨놓고 식탁을 정리합니다.',
        },
        points: 20,
        timeOfDay: 'evening',
      },
    ],
  },
  {
    id: 'giving',
    icon: '🎁',
    badge: {
      vi: '7 Bố Thí Đời Người - Việc Tốt Cho Đi',
      en: '7 Daily Acts of Giving',
      zh: '每日七项善行布施',
      ja: '7つの思いやり善行',
      ko: '매일 실천하는 7가지 선행',
    },
    title: {
      vi: 'Nhan thí (Nụ cười), Nhãn thí (Ánh mắt), Ngôn thí (Ái ngữ), Thân thí (Hành động giúp đỡ), Tọa thí (Nhường nhịn)',
      en: 'Smiles, Kind Eyes, Encouraging Words, Practical Help & Sharing Seats/Toys',
      zh: '颜施（微笑）、眼施（善目）、言施（赞美）、心施（感恩）、房施（包容）、身施（援手）、座施（谦让）',
      ja: '笑顔・温かい眼差し・優しい言葉・心からの感謝・寛容・手助け・席や場所の譲り合い',
      ko: '미소·따뜻한 눈빛·칭찬의 말·감사·포용·직접 돕는 손길·양보와 나눔',
    },
    meaning: {
      vi: 'Dạy con hiểu rằng "cho đi" không nhất thiết phải bằng tiền tài. Một nụ cười tươi, một ánh mắt ghi nhận, một lời khen chân thành hay việc xách túi đồ giúp mẹ chính là tài sản vô giá.',
      en: 'Teaches children that true giving requires no money: a bright smile, an admiring gaze, gentle praise, or lending a helping hand creates boundless goodwill.',
      zh: '告诉孩子“付出与善良”无需财富。一个真诚的微笑、一句肯定的话语、一次伸手扶助，皆是福报与品格的种子。',
      ja: 'お金がなくてもできる7つの思いやり。笑顔や優しい言葉、席を譲る優しさが、誰かの心を温かくします。',
      ko: '돈이 없어도 실천할 수 있는 아름다운 나눔입니다. 밝은 미소, 다정한 말 한마디, 짐을 들어드리는 손길이 따뜻한 세상을 만듭니다.',
    },
    badgeBg: 'bg-pink-50 text-pink-800 dark:bg-pink-950/60 dark:text-pink-300 border-pink-200 dark:border-pink-800',
    examples: [
      {
        icon: '😊',
        title: {
          vi: 'Nhan thí & Nhãn thí: Nụ cười rạng rỡ & Ánh mắt yêu thương',
          en: 'Kind Face & Eyes: Bright smile & affectionate glances',
          zh: '颜施与眼施：清晨展露灿烂笑颜，投以关怀肯定目光',
          ja: '笑顔と温かい眼差し：出会った人にニッコリ笑顔で挨拶する',
          ko: '미소와 눈빛: 밝은 미소와 따뜻한 눈빛으로 인사 건네기',
        },
        desc: {
          vi: 'Mỗi sáng gặp ông bà, bố mẹ và thầy cô bạn bè, con trao tặng nụ cười tươi tắn và ánh mắt công nhận điểm tốt.',
          en: 'Bestows genuine smiles and loving recognition upon meeting teachers, friends, and family.',
          zh: '遇到师长同伴主动微笑打招呼，用充满信任赞赏的目光对待他人。',
          ja: '朝一番、先生やお友達、家族に温かい笑顔と目を見て挨拶を交わします。',
          ko: '선생님과 친구들, 가족을 만날 때 밝은 미소와 애정 어린 눈빛으로 반갑게 맞이합니다.',
        },
        points: 15,
        timeOfDay: 'morning',
      },
      {
        icon: '🗣️',
        title: {
          vi: 'Ngôn thí: Nói lời ái ngữ, khích lệ & khen ngợi bạn bè',
          en: 'Encouraging Words: Speak kind, uplifting compliments',
          zh: '言施善言：说温柔赞美之语，常为同伴鼓劲加油',
          ja: '優しい言葉：お友達を褒めたり励ましたりする言葉をかける',
          ko: '따뜻한 말 한마디: 친구에게 힘이 되는 칭찬과 격려 건네기',
        },
        desc: {
          vi: 'Nói những lời mang lại niềm tin và hy vọng: "Bạn làm tốt lắm!", "Con cảm ơn mẹ!", không dùng lời chê bai trêu chọc.',
          en: 'Uses words that inspire confidence and joy: "You did great!", "Thank you mom!" without sarcasm.',
          zh: '使用给予他人信心与希望的语言：“你真棒！”、“太感谢你了！”，远离恶语中伤。',
          ja: '「すごいね！」「ありがとう！」など、相手の心が明るくなる言葉を積極的に使います。',
          ko: '"정말 잘했어!", "고마워!"와 같이 상대방에게 힘과 위로를 주는 따뜻한 말을 건넵니다.',
        },
        points: 15,
        timeOfDay: 'anytime',
      },
      {
        icon: '🤝',
        title: {
          vi: 'Thân thí & Tọa thí: Tận tay giúp mẹ xách đồ & Nhường chỗ, đồ chơi',
          en: 'Helpful Hands & Seating: Carry bags & share toys/seats',
          zh: '身施与座施：主动分担提重物，礼让座位与心爱玩具',
          ja: '手助けと譲り合い：荷物持ちを手伝い、おもちゃや席を譲る',
          ko: '직접 돕기와 양보: 무거운 짐 들어드리기와 장난감·자리 양보하기',
        },
        desc: {
          vi: 'Chủ động xách túi đồ giúp mẹ khi đi chợ về, nhường đồ chơi cho em bé và nhường chỗ cho người lớn tuổi.',
          en: 'Carries grocery bags for mom, gladly shares favorite toys, and offers seats to elders.',
          zh: '妈妈买菜回家主动上前分担提袋，玩游戏时大度将心爱玩具让给弟弟妹妹。',
          ja: 'お買い物の荷物を率先して持ち、小さい子にはおもちゃや座席を優しく譲ります。',
          ko: '엄마의 장난감이나 장바구니를 함께 들어드리고, 동생에게 장난감이나 자리를 먼저 양보합니다.',
        },
        points: 20,
        timeOfDay: 'afternoon',
      },
    ],
  },
];

export function LandingPage({ onStartDemo, onStartLocalSetup, onLoginGoogle, isLoggedIn }: LandingPageProps) {
  const { t, language } = useTranslation();
  const roadmapCopy = journeyCopy[language];
  const uiCopy = getLandingUiCopy(language);
  const { openConnectModal, importData } = useAppStore();
  const [activePillarIndex, setActivePillarIndex] = useState(0);
  const [roadmapType, setRoadmapType] = useState<'weekly' | 'monthly'>('weekly');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('week-1');
  const [restoreNotice, setRestoreNotice] = useState<string | null>(null);

  const handleRestore = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = typeof event.target?.result === 'string' ? event.target.result : '';
      setRestoreNotice(content && importData(content) ? null : uiCopy.backupInvalid);
    };
    reader.onerror = () => setRestoreNotice(uiCopy.backupReadError);
    reader.readAsText(file);
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-indigo-50/50 via-white to-amber-50/30 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 text-slate-800 dark:text-slate-100 transition-colors">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-8 pb-16 sm:pt-16 sm:pb-24 px-4 sm:px-6 max-w-6xl mx-auto">
        {/* Ambient background glow */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-72 sm:w-[500px] h-72 sm:h-[350px] bg-gradient-to-tr from-amber-300/20 via-indigo-400/20 to-pink-400/20 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="text-center max-w-3xl mx-auto space-y-5">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 text-xs sm:text-sm font-bold shadow-xs animate-fade-in">
            <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
            <span>{t.landingHeroBadge}</span>
          </div>

          {/* Main Headline */}
          <h1 className={`text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15] text-slate-900 dark:text-white ${language === 'ko' ? 'break-keep' : '[word-break:auto-phrase]'}`}>
            {t.landingHeroTitle.split('–')[0]}
            {t.landingHeroTitle.includes('–') && (
              <span className="block mt-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-amber-500 bg-clip-text text-transparent">
                – {t.landingHeroTitle.split('–')[1]}
              </span>
            )}
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto pt-1 font-medium">
            {t.landingHeroDesc}
          </p>

          {/* CTA Action Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3.5 max-w-lg mx-auto flex-wrap">
            {/* Google Sign In */}
            {!isLoggedIn ? (
              <button
                type="button"
                onClick={onLoginGoogle}
                className="w-full sm:w-auto py-3.5 px-5 rounded-2xl bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-white text-sm font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2.5 active:scale-95 cursor-pointer"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.02 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>{t.landingCtaGoogle}</span>
              </button>
            ) : null}

            {!isLoggedIn && (
              <button
                type="button"
                onClick={onStartLocalSetup}
                className="w-full sm:w-auto py-3.5 px-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm font-bold transition-all shadow-xs flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{t.landingCtaLocalSetup}</span>
              </button>
            )}

            {!isLoggedIn && (
              <label className="w-full sm:w-auto py-3.5 px-5 rounded-2xl bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-slate-200 text-sm font-bold transition-all shadow-xs flex items-center justify-center gap-2 active:scale-95 cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>{t.importData}</span>
                <input
                  type="file"
                  accept="application/json,.json"
                  className="sr-only"
                  aria-label={t.importData}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) handleRestore(file);
                    event.target.value = '';
                  }}
                />
              </label>
            )}

            {/* Child Enter with Code */}
            {!isLoggedIn && (
              <button
                type="button"
                onClick={openConnectModal}
                className="w-full sm:w-auto py-3.5 px-5 rounded-2xl bg-purple-50 hover:bg-purple-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-purple-200/80 dark:border-zinc-700 text-purple-700 dark:text-purple-300 text-sm font-bold transition-all shadow-xs flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                title={uiCopy.childCodeTitle}
              >
                <Smartphone className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                <span>{uiCopy.childCodeButton}</span>
              </button>
            )}

            {/* Direct Try Demo / Back to App */}
            <button
              type="button"
              onClick={onStartDemo}
              className="w-full sm:w-auto py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-extrabold transition-all shadow-lg hover:shadow-indigo-500/25 flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
            >
              <span>{isLoggedIn ? t.landingBackToApp : t.landingCtaDemo}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {restoreNotice && (
            <p role="alert" className="text-xs font-semibold text-rose-600 dark:text-rose-400">
              {restoreNotice}
            </p>
          )}

          {/* Trust Social Proof */}
          <div className="pt-6 flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex -space-x-1.5 overflow-hidden">
              {['🦁', '🐰', '🐼', '🦊', '🦄'].map((mascot, idx) => (
                <span
                  key={idx}
                  className="inline-block w-6 h-6 rounded-full bg-white dark:bg-zinc-800 text-xs border border-slate-200 dark:border-zinc-700 text-center leading-5 shadow-xs"
                >
                  {mascot}
                </span>
              ))}
            </div>
            <span className="font-semibold">{t.landingTrustedBy}</span>
          </div>
        </div>

        {/* Hero Interactive App Mockup Preview */}
        <div className="mt-10 sm:mt-14 max-w-4xl mx-auto bg-white/90 dark:bg-zinc-900/90 rounded-3xl p-4 sm:p-7 shadow-2xl border border-slate-200/80 dark:border-zinc-800 backdrop-blur-md">
          {/* Header Bar in Mockup */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-indigo-600 flex items-center justify-center text-xl shadow-xs">
                🦁
              </div>
              <div>
                <div className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <span>{uiCopy.mockChildName}</span>
                  <span className="text-amber-500 text-xs font-black bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full">
                    {t.levelPrefix} 3
                  </span>
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                  <span>🔥 {uiCopy.streak(7)}</span>
                  <span>•</span>
                  <span className="text-amber-600 font-bold">⭐ 145 sao</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onStartDemo}
              className="hidden sm:inline-flex py-2 px-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-all items-center gap-1 cursor-pointer"
            >
              <span>{t.landingExploreDemo}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Routine Demo Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Morning Sample */}
            <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-zinc-800/60 border border-amber-200/60 dark:border-zinc-700/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <span>🌅</span>
                  <span>{t.morning}</span>
                </span>
                <span className="text-xs font-black text-amber-600 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-full">
                  {uiCopy.doneCount(2, 2)}
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700/50 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🛏️</span>
                    <span className="font-semibold line-through text-slate-400">{uiCopy.makeBed}</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-600">✓ +5 ⭐</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700/50 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🪥</span>
                    <span className="font-semibold line-through text-slate-400">{uiCopy.brushTeeth}</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-600">✓ +10 ⭐</span>
                </div>
              </div>
            </div>

            {/* Afternoon Sample */}
            <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-zinc-800/60 border border-indigo-200/60 dark:border-zinc-700/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-800 dark:text-indigo-300 flex items-center gap-1.5">
                  <span>☀️</span>
                  <span>{t.afternoon}</span>
                </span>
                <span className="text-xs font-black text-indigo-600 bg-indigo-100 dark:bg-indigo-950 px-2 py-0.5 rounded-full">
                  {uiCopy.taskCount(1, 2)}
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700/50 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🎒</span>
                    <span className="font-semibold line-through text-slate-400">{uiCopy.packBag}</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-600">✓ +5 ⭐</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📚</span>
                    <span className="font-bold text-indigo-700 dark:text-indigo-300">{uiCopy.readBooks}</span>
                  </div>
                  <span className="text-xs font-black text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded-md">
                    +15 ⭐
                  </span>
                </div>
              </div>
            </div>

            {/* Evening / Reward Sample */}
            <div className="p-3.5 rounded-2xl bg-pink-50/60 dark:bg-zinc-800/60 border border-pink-200/60 dark:border-zinc-700/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-pink-800 dark:text-pink-300 flex items-center gap-1.5">
                  <span>🎁</span>
                  <span>{t.rewards}</span>
                </span>
                <span className="text-xs font-black text-pink-600 bg-pink-100 dark:bg-pink-950 px-2 py-0.5 rounded-full">
                  {uiCopy.rewardStore}
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700/50 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🎬</span>
                    <span className="font-semibold">{uiCopy.weekendMovie}</span>
                  </div>
                  <span className="text-xs font-bold text-amber-600">50 ⭐</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700/50 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🍦</span>
                    <span className="font-semibold">{uiCopy.iceCream}</span>
                  </div>
                  <span className="text-xs font-bold text-amber-600">30 ⭐</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. BEFORE VS AFTER (CHẠM NỖI ĐAU PHỤ HUYNH) */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 bg-slate-50/80 dark:bg-zinc-900/60 border-y border-slate-100 dark:border-zinc-800">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              {t.landingComparisonTitle}
            </h2>
            <p className="text-xs sm:text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              {t.landingComparisonDesc}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Before Card */}
            <div className="bg-white dark:bg-zinc-800/90 rounded-3xl p-6 sm:p-8 border border-rose-100 dark:border-rose-950/60 shadow-sm space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-rose-500">
                  <XCircle className="w-6 h-6" />
                </div>
                <h3 className="text-base sm:text-lg font-extrabold text-rose-700 dark:text-rose-400">
                  {t.landingBeforeTitle}
                </h3>
              </div>
              <ul className="space-y-3.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold mt-0.5">✕</span>
                  <span>{t.landingBeforeP1}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold mt-0.5">✕</span>
                  <span>{t.landingBeforeP2}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold mt-0.5">✕</span>
                  <span>{t.landingBeforeP3}</span>
                </li>
              </ul>
            </div>

            {/* After Card */}
            <div className="bg-white dark:bg-zinc-800/90 rounded-3xl p-6 sm:p-8 border border-emerald-200 dark:border-emerald-900/60 shadow-md ring-2 ring-emerald-500/20 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-500">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-base sm:text-lg font-extrabold text-emerald-700 dark:text-emerald-400">
                  {t.landingAfterTitle}
                </h3>
              </div>
              <ul className="space-y-3.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                  <span>{t.landingAfterP1}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                  <span>{t.landingAfterP2}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                  <span>{t.landingAfterP3}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 3. BỘ KHUNG THÓI QUEN TOÀN DIỆN (7 KHÍA CẠNH TRƯỞNG THÀNH & 7 VIỆC TỐT) */}
      <section className="py-14 sm:py-24 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="text-center space-y-3 mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
            <span>{t.landingFrameworkBadge}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            {t.landingFrameworkTitle}
          </h2>
          <p className="text-xs sm:text-base text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            {t.landingFrameworkSubtitle}
          </p>

          {/* Convenience highlight card */}
          <div className="mt-4 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-purple-500/10 border border-amber-300/40 dark:border-zinc-700 max-w-3xl mx-auto text-left flex items-start gap-3 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-900 font-black flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
              ⚡
            </div>
            <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
              {t.landingConvenienceHighlight}
            </div>
          </div>
        </div>

        {/* 8 Pillars Tab Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 sm:pb-4 scrollbar-none sm:justify-center">
          {FRAMEWORK_PILLARS.map((pillar, idx) => {
            const isActive = activePillarIndex === idx;
            const pTitle = pillar.badge[language as keyof typeof pillar.badge] || pillar.badge.en || pillar.badge.vi;
            return (
              <button
                key={pillar.id}
                type="button"
                onClick={() => setActivePillarIndex(idx)}
                className={`shrink-0 px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md scale-102 border-transparent'
                    : 'bg-white dark:bg-zinc-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-700 border-slate-200 dark:border-zinc-700'
                }`}
              >
                <span className="text-base">{pillar.icon}</span>
                <span>{pTitle.split('&')[0].trim()}</span>
              </button>
            );
          })}
        </div>

        {/* Active Pillar Showcase Detail Card */}
        {(() => {
          const currentPillar = FRAMEWORK_PILLARS[activePillarIndex];
          const cBadge = currentPillar.badge[language as keyof typeof currentPillar.badge] || currentPillar.badge.en || currentPillar.badge.vi;
          const cTitle = currentPillar.title[language as keyof typeof currentPillar.title] || currentPillar.title.en || currentPillar.title.vi;
          const cMeaning = currentPillar.meaning[language as keyof typeof currentPillar.meaning] || currentPillar.meaning.en || currentPillar.meaning.vi;

          return (
            <div className="mt-5 bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-9 border border-slate-200/80 dark:border-zinc-800 shadow-xl space-y-6 animate-fade-in transition-all">
              {/* Pillar Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-zinc-800">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-100 to-indigo-50 dark:from-zinc-800 dark:to-zinc-700 flex items-center justify-center text-3xl shadow-sm shrink-0">
                    {currentPillar.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${currentPillar.badgeBg}`}>
                        {cBadge}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">{uiCopy.pillar(activePillarIndex + 1)}</span>
                    </div>
                    <h3 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                      {cTitle}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-zinc-800/80 px-3.5 py-2 rounded-xl border border-slate-100 dark:border-zinc-700/60 self-start md:self-auto">
                  <span className="text-amber-500 font-black text-sm">✓</span>
                  <span>{uiCopy.oneTap}</span>
                </div>
              </div>

              {/* Core Meaning & Pedagogical Value */}
              <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800/80">
                <div className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{uiCopy.meaning}</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                  {cMeaning}
                </p>
              </div>

              {/* Concrete Examples Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                    <span>{t.habitTemplates}</span>
                  </div>
                  <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                    {uiCopy.habitCount(currentPillar.examples.length)}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {currentPillar.examples.map((item, exIdx) => {
                    const exTitle = item.title[language as keyof typeof item.title] || item.title.en || item.title.vi;
                    const exDesc = item.desc[language as keyof typeof item.desc] || item.desc.en || item.desc.vi;
                    const timeTag =
                      item.timeOfDay === 'morning'
                        ? t.morning
                        : item.timeOfDay === 'afternoon'
                        ? t.afternoon
                        : item.timeOfDay === 'evening'
                        ? t.evening
                        : t.anytime;

                    return (
                      <div
                        key={exIdx}
                        className="bg-slate-50/60 dark:bg-zinc-800/70 hover:bg-white dark:hover:bg-zinc-800 p-4 rounded-2xl border border-slate-100 dark:border-zinc-700/60 hover:border-indigo-300 dark:hover:border-indigo-800 transition-all shadow-xs hover:shadow-md flex flex-col justify-between space-y-3"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="w-9 h-9 rounded-xl bg-white dark:bg-zinc-700 flex items-center justify-center text-xl shadow-xs">
                              {item.icon}
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 flex items-center gap-1">
                              <span>+{item.points}</span>
                              <span>⭐</span>
                            </span>
                          </div>

                          <h4 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 leading-snug">
                            {exTitle}
                          </h4>
                          <p className="text-xs sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            {exDesc}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-200/50 dark:border-zinc-700/50 flex items-center justify-between text-xs text-slate-400 font-medium">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{timeTag}</span>
                          </span>
                          {item.duration ? (
                            <span className="px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-zinc-700 font-bold text-xs text-slate-600 dark:text-slate-300">
                              ⏱️ {item.duration}p
                            </span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}
      </section>

      {/* 4. LỘ TRÌNH MẪU ÁP DỤNG 1-CHẠM (SAMPLE ROADMAPS) */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 bg-slate-50/70 dark:bg-zinc-900/50 border-y border-slate-200/80 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold shadow-xs">
              <Flame className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.landingRoadmapsBadge}</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              {t.landingRoadmapsTitle}
            </h2>
            <p className="text-xs sm:text-base text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              {t.landingRoadmapsSubtitle}
            </p>

            {/* Roadmaps Tab Switcher */}
            <div className="inline-flex items-center p-1 rounded-2xl bg-slate-200/80 dark:bg-zinc-800 border border-slate-300/60 dark:border-zinc-700 mt-2">
              <button
                type="button"
                onClick={() => {
                  setRoadmapType('weekly');
                  setSelectedPlanId('week-1');
                }}
                className={`px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                  roadmapType === 'weekly'
                    ? 'bg-white dark:bg-zinc-900 text-indigo-700 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {t.landingTab4Weeks}
              </button>
              <button
                type="button"
                onClick={() => {
                  setRoadmapType('monthly');
                  setSelectedPlanId('month-1');
                }}
                className={`px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                  roadmapType === 'monthly'
                    ? 'bg-white dark:bg-zinc-900 text-indigo-700 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {t.landingTabMonthly}
              </button>
            </div>
          </div>

          {/* Roadmaps Content */}
          {roadmapType === 'weekly' ? (
            <div className="space-y-6">
              {/* 4-Week Progress Timeline Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {WEEKLY_JOURNEY_PLANS.map((plan) => {
                  const isSelected = selectedPlanId === plan.id;
                  const pTitle = plan.title[language as keyof typeof plan.title] || plan.title.en || plan.title.vi || '';
                  const pDesc = plan.description[language as keyof typeof plan.description] || plan.description.en || plan.description.vi || '';

                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`text-left p-4 sm:p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                        isSelected
                          ? 'bg-white dark:bg-zinc-800 border-indigo-500 shadow-lg ring-2 ring-indigo-500/20'
                          : 'bg-white/80 dark:bg-zinc-800/60 border-slate-200/80 dark:border-zinc-700/60 hover:bg-white dark:hover:bg-zinc-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-2xl">{plan.icon}</span>
                          <span
                            className="px-2.5 py-0.5 rounded-full text-xs font-black text-slate-950"
                            style={{ backgroundColor: plan.themeColor }}
                          >
                          {getJourneyPeriodLabel(language, plan.type, plan.id)}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight [word-break:auto-phrase]">
                          {pTitle.replace(/^.*?[：:]\s*/, '')}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {pDesc}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-zinc-700/50 flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-semibold">{roadmapCopy.habitsPerDay(plan.habits.length)}</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-0.5">
                          <span>{roadmapCopy.details}</span>
                          <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selected Week Detailed Habits List */}
              {(() => {
                const currentPlan =
                  WEEKLY_JOURNEY_PLANS.find((p) => p.id === selectedPlanId) || WEEKLY_JOURNEY_PLANS[0];
                const pTitle = currentPlan.title[language as keyof typeof currentPlan.title] || currentPlan.title.en || currentPlan.title.vi || '';
                const pDesc = currentPlan.description[language as keyof typeof currentPlan.description] || currentPlan.description.en || currentPlan.description.vi || '';

                return (
                  <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-zinc-800 shadow-xl space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-zinc-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className="px-2.5 py-0.5 rounded-full text-slate-950 text-xs font-black"
                            style={{ backgroundColor: currentPlan.themeColor }}
                          >
                            {getJourneyPeriodLabel(language, currentPlan.type, currentPlan.id)}
                          </span>
                          <h3 className="text-base sm:text-xl font-black text-slate-900 dark:text-white [word-break:auto-phrase]">
                            {pTitle}
                          </h3>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                          {pDesc}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={onStartDemo}
                        className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold transition-all shadow-md flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                      >
                        <span>{t.landingApplyRoadmapBtn}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                      {currentPlan.habits.map((habit, hIdx) => {
                        const localizedHabit = getJourneyHabitText(currentPlan, hIdx, language);
                        const timeTag =
                          habit.timeOfDay === 'morning'
                            ? t.morning
                            : habit.timeOfDay === 'afternoon'
                            ? t.afternoon
                            : habit.timeOfDay === 'evening'
                            ? t.evening
                            : t.anytime;

                        return (
                          <div
                            key={hIdx}
                            className="p-4 rounded-2xl bg-slate-50/70 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-700/60 space-y-2.5 flex flex-col justify-between"
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-2xl">{habit.icon}</span>
                                <span className="text-xs font-black text-amber-600 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
                                  +{habit.points} ⭐
                                </span>
                              </div>
                              <h5 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 leading-snug">
                                {localizedHabit.title}
                              </h5>
                              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                {localizedHabit.description}
                              </p>
                            </div>

                            <div className="pt-2 border-t border-slate-200/50 dark:border-zinc-700/40 flex items-center justify-between text-xs text-slate-400 font-semibold">
                              <span>⏱️ {timeTag}</span>
                              {habit.durationMinutes ? (
                                <span>{roadmapCopy.minutes(habit.durationMinutes)}</span>
                              ) : (
                                <span>{timeTag}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            /* Monthly Thematic Roadmap View */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {MONTHLY_JOURNEY_PLANS.map((plan) => {
                const pTitle = plan.title[language as keyof typeof plan.title] || plan.title.en || plan.title.vi || '';
                const pDesc = plan.description[language as keyof typeof plan.description] || plan.description.en || plan.description.vi || '';

                return (
                  <div
                    key={plan.id}
                    className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-200 dark:border-zinc-800 shadow-md space-y-5 flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-2xl shadow-xs">
                          {plan.icon}
                        </div>
                        <span
                          className="px-3 py-1 rounded-full text-xs font-black text-slate-950"
                          style={{ backgroundColor: plan.themeColor }}
                        >
                          {getJourneyPeriodLabel(language, plan.type, plan.id)}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white [word-break:auto-phrase]">
                          {pTitle}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                          {pDesc}
                        </p>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          {roadmapCopy.focusTasks}
                        </div>
                        {plan.habits.slice(0, 4).map((h, hIdx) => {
                          const localizedHabit = getJourneyHabitText(plan, hIdx, language);
                          return (
                          <div
                            key={hIdx}
                            className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-800 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span>{h.icon}</span>
                              <span className="font-semibold truncate text-slate-700 dark:text-slate-200">
                                {localizedHabit.title}
                              </span>
                            </div>
                            <span className="text-xs font-bold text-amber-600 shrink-0">
                              +{h.points}⭐
                            </span>
                          </div>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={onStartDemo}
                      className="w-full py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>{uiCopy.exploreJourney}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Roadmap Convenience Callout Tip */}
          <div className="p-4 sm:p-5 rounded-2xl bg-indigo-950/5 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800 text-xs sm:text-sm text-indigo-900 dark:text-indigo-200 flex items-start gap-3">
            <span className="text-xl">💡</span>
            <div className="leading-relaxed">
              <span className="font-extrabold mr-1">{uiCopy.noPlanning}</span>
              {t.landingRoadmapConvenienceTip}
            </div>
          </div>
        </div>
      </section>

      {/* 5. 4 TRỤ CỘT TÍNH NĂNG NỔI BẬT */}
      <section className="py-14 sm:py-24 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="text-center space-y-3 mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-bold">
            <Zap className="w-3.5 h-3.5" />
            <span>{uiCopy.practiceTools}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            {t.landingPillarsTitle}
          </h2>
          <p className="text-xs sm:text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            {t.landingPillarsSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Pillar 1: Biorhythm */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100">
              {t.landingPillar1Title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {t.landingPillar1Desc}
            </p>
          </div>

          {/* Pillar 2: Gamification */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600">
              <Trophy className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100">
              {t.landingPillar2Title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {t.landingPillar2Desc}
            </p>
          </div>

          {/* Pillar 3: Privacy & Security */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100">
              {t.landingPillar3Title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {t.landingPillar3Desc}
            </p>
          </div>

          {/* Pillar 4: Holistic Habits */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-pink-50 dark:bg-pink-950/60 flex items-center justify-center text-pink-600">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100">
              {t.landingPillar4Title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {t.landingPillar4Desc}
            </p>
          </div>
        </div>
      </section>

      {/* 4. 3 BƯỚC BẮT ĐẦU ĐƠN GIẢN */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 bg-indigo-900 text-white rounded-3xl max-w-5xl mx-auto my-6 shadow-xl">
        <div className="text-center space-y-3 mb-10 sm:mb-14">
          <span className="text-xs uppercase font-extrabold tracking-widest text-indigo-300">
            {uiCopy.gentleStart}
          </span>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
            {t.landingStepsTitle}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Step 1 */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/15 space-y-3">
            <div className="text-3xl">🦁</div>
            <h3 className="font-bold text-base text-white">{t.landingStep1Title}</h3>
            <p className="text-xs text-indigo-200 leading-relaxed">{t.landingStep1Desc}</p>
          </div>

          {/* Step 2 */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/15 space-y-3">
            <div className="text-3xl">📅</div>
            <h3 className="font-bold text-base text-white">{t.landingStep2Title}</h3>
            <p className="text-xs text-indigo-200 leading-relaxed">{t.landingStep2Desc}</p>
          </div>

          {/* Step 3 */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/15 space-y-3">
            <div className="text-3xl">⭐</div>
            <h3 className="font-bold text-base text-white">{t.landingStep3Title}</h3>
            <p className="text-xs text-indigo-200 leading-relaxed">{t.landingStep3Desc}</p>
          </div>
        </div>

        <div className="text-center pt-10">
          <button
            type="button"
            onClick={onStartDemo}
            className="py-3.5 px-8 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold text-sm shadow-xl transition-transform active:scale-95 cursor-pointer"
          >
            {t.landingStartNow}
          </button>
        </div>
      </section>

      <section className="py-14 sm:py-20 px-4 sm:px-6 bg-gradient-to-tr from-indigo-50 via-white to-amber-50 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900 border-t border-slate-200 dark:border-zinc-800 text-center">
        <div className="max-w-2xl mx-auto space-y-5">
          <div className="text-3xl sm:text-4xl">🌟🚀💎</div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            {t.landingCtaBottomTitle}
          </h2>
          <p className="text-xs sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-lg mx-auto">
            {t.landingCtaBottomDesc}
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={onStartDemo}
              className="w-full sm:w-auto py-3.5 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-xl transition-all active:scale-95 cursor-pointer"
            >
              {t.landingStartNow}
            </button>
            {!isLoggedIn && (
              <button
                type="button"
                onClick={onLoginGoogle}
                className="w-full sm:w-auto py-3.5 px-6 rounded-2xl bg-white dark:bg-zinc-800 hover:bg-slate-50 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-slate-200 font-bold text-sm transition-all active:scale-95 cursor-pointer"
              >
                {t.landingCtaGoogle}
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
