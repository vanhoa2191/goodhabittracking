import type { Language } from '@/types';

export type PublicRoadmapsCopy = {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly newHabits: string;
  readonly age: string;
  readonly stages: readonly { readonly title: string; readonly adultRole: string }[];
  readonly plans: readonly { readonly title: string; readonly description: string; readonly habit: string; readonly period: string }[];
};

export const COPY: Record<Language, PublicRoadmapsCopy> = {
  "vi": {
    "eyebrow": "Bắt đầu vừa sức",
    "title": "Lộ trình theo độ tuổi, mỗi bước chỉ thêm một thói quen",
    "description": "Mỗi giai đoạn tuổi có một lộ trình khoảng 12 tuần gồm ba bước. Bước nào cũng giữ các thói quen trước và chỉ thêm một thói quen mới; ở lại một bước bao lâu tùy nhịp của con. Thời gian hình thành thói quen khác nhau giữa từng người nên tuần lễ chỉ là gợi ý, không phải hạn chót.",
    "newHabits": "Thói quen mới ở bước này",
    "age": "tuổi",
    "stages": [
      {
        "title": "An toàn và giác quan",
        "adultRole": "Ba mẹ làm mẫu và mô tả"
      },
      {
        "title": "Khám phá và ý chí",
        "adultRole": "Ba mẹ làm cùng và nhắc nhẹ"
      },
      {
        "title": "Cần cù và kỹ năng",
        "adultRole": "Ba mẹ theo dõi và cùng làm"
      },
      {
        "title": "Bản sắc và cảm xúc",
        "adultRole": "Ba mẹ đồng hành, cùng tuân luật chung"
      },
      {
        "title": "Định hướng và trách nhiệm",
        "adultRole": "Ba mẹ làm cố vấn và hậu thuẫn"
      }
    ],
    "plans": [
      {
        "title": "Bước 1 · Nếp ngày êm và ngủ lành",
        "description": "Bước đầu chỉ thêm MỘT thói quen mới. Hai tuần đầu làm cùng con và giữ một tín hiệu cố định (cùng giờ, cùng chỗ); hai tuần sau để con làm nhiều hơn, bớt nhắc. Cuối mỗi tuần dành vài phút nhìn lại. Bỏ lỡ một ngày thì cứ tiếp tục; bỏ lỡ nhiều ngày liền thì làm nhỏ hơn.",
        "habit": "Nghi thức trước giờ ngủ, cùng giờ mỗi tối",
        "period": "Tuần 1–4"
      },
      {
        "title": "Bước 2 · Được đáp lại mỗi ngày",
        "description": "Giữ thói quen của bước 1 rồi thêm MỘT thói quen mới. Chỉ thêm khi bước 1 đã khá đều; chưa đều thì ở lại thêm vài tuần, không cần chạy theo lịch.",
        "habit": "Nhìn – chờ – đáp khi bé phát tiếng",
        "period": "Tuần 5–8"
      },
      {
        "title": "Bước 3 · Sách và vui chơi",
        "description": "Thêm thói quen thứ ba và bắt đầu rút dần nhắc nhở ở các thói quen cũ. Hết bước này mỗi thói quen đã lặp lại nhiều tuần, nhưng nhiều bé cần lâu hơn: cứ tiếp tục theo nhịp của con và chỉ chuyển sang giai đoạn tuổi kế tiếp khi cả nhà thấy vững.",
        "habit": "Mỗi ngày một cuốn sách và một câu chuyện",
        "period": "Tuần 9–12"
      },
      {
        "title": "Bước 1 · Cảm xúc bình yên",
        "description": "Bước đầu chỉ thêm MỘT thói quen mới. Hai tuần đầu làm cùng con và giữ một tín hiệu cố định (cùng giờ, cùng chỗ); hai tuần sau để con làm nhiều hơn, bớt nhắc. Cuối mỗi tuần dành vài phút nhìn lại. Bỏ lỡ một ngày thì cứ tiếp tục; bỏ lỡ nhiều ngày liền thì làm nhỏ hơn.",
        "habit": "Gọi tên cảm xúc: nói “con đang thấy…” mỗi tối",
        "period": "Tuần 1–4"
      },
      {
        "title": "Bước 2 · Giấc ngủ và màn hình",
        "description": "Giữ thói quen của bước 1 rồi thêm MỘT thói quen mới. Chỉ thêm khi bước 1 đã khá đều; chưa đều thì ở lại thêm vài tuần, không cần chạy theo lịch.",
        "habit": "Màn hình đi ngủ trước con",
        "period": "Tuần 5–8"
      },
      {
        "title": "Bước 3 · Việc nhà của con",
        "description": "Thêm thói quen thứ ba và bắt đầu rút dần nhắc nhở ở các thói quen cũ. Hết bước này mỗi thói quen đã lặp lại nhiều tuần, nhưng nhiều bé cần lâu hơn: cứ tiếp tục theo nhịp của con và chỉ chuyển sang giai đoạn tuổi kế tiếp khi cả nhà thấy vững.",
        "habit": "Một việc nhà nhỏ của riêng con mỗi ngày",
        "period": "Tuần 9–12"
      },
      {
        "title": "Bước 1 · Biết ơn mỗi tối",
        "description": "Bước đầu chỉ thêm MỘT thói quen mới. Hai tuần đầu làm cùng con và giữ một tín hiệu cố định (cùng giờ, cùng chỗ); hai tuần sau để con làm nhiều hơn, bớt nhắc. Cuối mỗi tuần dành vài phút nhìn lại. Bỏ lỡ một ngày thì cứ tiếp tục; bỏ lỡ nhiều ngày liền thì làm nhỏ hơn.",
        "habit": "Mỗi tối một điều biết ơn và một điều con làm tốt",
        "period": "Tuần 1–4"
      },
      {
        "title": "Bước 2 · Học có phương pháp",
        "description": "Giữ thói quen của bước 1 rồi thêm MỘT thói quen mới. Chỉ thêm khi bước 1 đã khá đều; chưa đều thì ở lại thêm vài tuần, không cần chạy theo lịch.",
        "habit": "Đọc xong thì tự hỏi rồi tự trả lời",
        "period": "Tuần 5–8"
      },
      {
        "title": "Bước 3 · Vận động có con số",
        "description": "Thêm thói quen thứ ba và bắt đầu rút dần nhắc nhở ở các thói quen cũ. Hết bước này mỗi thói quen đã lặp lại nhiều tuần, nhưng nhiều bé cần lâu hơn: cứ tiếp tục theo nhịp của con và chỉ chuyển sang giai đoạn tuổi kế tiếp khi cả nhà thấy vững.",
        "habit": "Vận động 60 phút và ghi con số tiến bộ",
        "period": "Tuần 9–12"
      },
      {
        "title": "Bước 1 · Ngủ đủ, đầu óc nhẹ",
        "description": "Bước đầu chỉ thêm MỘT thói quen mới. Hai tuần đầu làm cùng con và giữ một tín hiệu cố định (cùng giờ, cùng chỗ); hai tuần sau để con làm nhiều hơn, bớt nhắc. Cuối mỗi tuần dành vài phút nhìn lại. Bỏ lỡ một ngày thì cứ tiếp tục; bỏ lỡ nhiều ngày liền thì làm nhỏ hơn.",
        "habit": "Đi ngủ đúng giờ, không màn hình trước khi ngủ",
        "period": "Tuần 1–4"
      },
      {
        "title": "Bước 2 · Luật của riêng mình",
        "description": "Giữ thói quen của bước 1 rồi thêm MỘT thói quen mới. Chỉ thêm khi bước 1 đã khá đều; chưa đều thì ở lại thêm vài tuần, không cần chạy theo lịch.",
        "habit": "Giữ ba luật con tự đặt cho mình",
        "period": "Tuần 5–8"
      },
      {
        "title": "Bước 3 · Học tự chủ",
        "description": "Thêm thói quen thứ ba và bắt đầu rút dần nhắc nhở ở các thói quen cũ. Hết bước này mỗi thói quen đã lặp lại nhiều tuần, nhưng nhiều bé cần lâu hơn: cứ tiếp tục theo nhịp của con và chỉ chuyển sang giai đoạn tuổi kế tiếp khi cả nhà thấy vững.",
        "habit": "Lập kế hoạch học tuần, tự đánh giá và tự chịu kết quả",
        "period": "Tuần 9–12"
      },
      {
        "title": "Bước 1 · Người con muốn trở thành",
        "description": "Bước đầu chỉ thêm MỘT thói quen mới. Hai tuần đầu làm cùng con và giữ một tín hiệu cố định (cùng giờ, cùng chỗ); hai tuần sau để con làm nhiều hơn, bớt nhắc. Cuối mỗi tuần dành vài phút nhìn lại. Bỏ lỡ một ngày thì cứ tiếp tục; bỏ lỡ nhiều ngày liền thì làm nhỏ hơn.",
        "habit": "Viết lại và đọc tuyên ngôn của con mỗi tuần",
        "period": "Tuần 1–4"
      },
      {
        "title": "Bước 2 · Thân khỏe",
        "description": "Giữ thói quen của bước 1 rồi thêm MỘT thói quen mới. Chỉ thêm khi bước 1 đã khá đều; chưa đều thì ở lại thêm vài tuần, không cần chạy theo lịch.",
        "habit": "Tập, ăn và nghỉ theo lịch trong tuần",
        "period": "Tuần 5–8"
      },
      {
        "title": "Bước 3 · Thử nghề",
        "description": "Thêm thói quen thứ ba và bắt đầu rút dần nhắc nhở ở các thói quen cũ. Hết bước này mỗi thói quen đã lặp lại nhiều tuần, nhưng nhiều bé cần lâu hơn: cứ tiếp tục theo nhịp của con và chỉ chuyển sang giai đoạn tuổi kế tiếp khi cả nhà thấy vững.",
        "habit": "Thử một lĩnh vực nghề: tìm hiểu, trải nghiệm, ghi lại",
        "period": "Tuần 9–12"
      }
    ]
  },
  "en": {
    "eyebrow": "Start at a manageable pace",
    "title": "Age-based roadmaps, adding just one habit per step",
    "description": "Each age stage has a roughly 12-week roadmap with three steps. Every step keeps earlier habits and adds only one new habit; how long you stay depends on your child’s pace. Habit formation varies between people, so weeks are suggestions, not deadlines.",
    "newHabits": "New habits in this step",
    "age": "years old",
    "stages": [
      {
        "title": "Safety and senses",
        "adultRole": "You model and describe"
      },
      {
        "title": "Exploring and willpower",
        "adultRole": "You do it together and remind gently"
      },
      {
        "title": "Effort and skills",
        "adultRole": "You supervise and join in"
      },
      {
        "title": "Identity and emotions",
        "adultRole": "You walk alongside and follow the shared rules too"
      },
      {
        "title": "Direction and responsibility",
        "adultRole": "You advise and back them up"
      }
    ],
    "plans": [
      {
        "title": "Step 1 · A calm routine and good sleep",
        "description": "This first step adds just ONE new habit. In the first two weeks do it together and keep one fixed cue (same time, same place); in the next two let your child do more with fewer reminders. Spend a few minutes looking back at the end of each week. Missing one day changes nothing; missing several in a row means making it smaller.",
        "habit": "A bedtime ritual at the same time every evening",
        "period": "Weeks 1–4"
      },
      {
        "title": "Step 2 · Being answered every day",
        "description": "Keep the habit from step 1 and add ONE new habit. Add it only when step 1 is fairly steady; if it is not, stay a few more weeks. There is no calendar to catch up with.",
        "habit": "Look, wait, answer when your baby makes a sound",
        "period": "Weeks 5–8"
      },
      {
        "title": "Step 3 · Books and play",
        "description": "Add the third habit and begin easing off reminders on the older ones. By the end each habit has been repeated for many weeks, but many children need longer: keep going at your child’s pace and move to the next age stage only when it feels steady.",
        "habit": "One book and one story every day",
        "period": "Weeks 9–12"
      },
      {
        "title": "Step 1 · Calm feelings",
        "description": "This first step adds just ONE new habit. In the first two weeks do it together and keep one fixed cue (same time, same place); in the next two let your child do more with fewer reminders. Spend a few minutes looking back at the end of each week. Missing one day changes nothing; missing several in a row means making it smaller.",
        "habit": "Name a feeling: say “I feel…” each evening",
        "period": "Weeks 1–4"
      },
      {
        "title": "Step 2 · Sleep and screens",
        "description": "Keep the habit from step 1 and add ONE new habit. Add it only when step 1 is fairly steady; if it is not, stay a few more weeks. There is no calendar to catch up with.",
        "habit": "Screens go to sleep before you do",
        "period": "Weeks 5–8"
      },
      {
        "title": "Step 3 · My own chore",
        "description": "Add the third habit and begin easing off reminders on the older ones. By the end each habit has been repeated for many weeks, but many children need longer: keep going at your child’s pace and move to the next age stage only when it feels steady.",
        "habit": "One small chore of your own every day",
        "period": "Weeks 9–12"
      },
      {
        "title": "Step 1 · Gratitude each evening",
        "description": "This first step adds just ONE new habit. In the first two weeks do it together and keep one fixed cue (same time, same place); in the next two let your child do more with fewer reminders. Spend a few minutes looking back at the end of each week. Missing one day changes nothing; missing several in a row means making it smaller.",
        "habit": "Each evening one thing to be grateful for and one thing you did well",
        "period": "Weeks 1–4"
      },
      {
        "title": "Step 2 · Learning with a method",
        "description": "Keep the habit from step 1 and add ONE new habit. Add it only when step 1 is fairly steady; if it is not, stay a few more weeks. There is no calendar to catch up with.",
        "habit": "After reading, ask yourself a question and answer it",
        "period": "Weeks 5–8"
      },
      {
        "title": "Step 3 · Moving, with numbers",
        "description": "Add the third habit and begin easing off reminders on the older ones. By the end each habit has been repeated for many weeks, but many children need longer: keep going at your child’s pace and move to the next age stage only when it feels steady.",
        "habit": "Move for 60 minutes and note one number that improves",
        "period": "Weeks 9–12"
      },
      {
        "title": "Step 1 · Enough sleep, a clearer head",
        "description": "This first step adds just ONE new habit. In the first two weeks do it together and keep one fixed cue (same time, same place); in the next two let your child do more with fewer reminders. Spend a few minutes looking back at the end of each week. Missing one day changes nothing; missing several in a row means making it smaller.",
        "habit": "Sleep on time, no screens before bed",
        "period": "Weeks 1–4"
      },
      {
        "title": "Step 2 · My own rules",
        "description": "Keep the habit from step 1 and add ONE new habit. Add it only when step 1 is fairly steady; if it is not, stay a few more weeks. There is no calendar to catch up with.",
        "habit": "Keep three rules you set for yourself",
        "period": "Weeks 5–8"
      },
      {
        "title": "Step 3 · Taking charge of learning",
        "description": "Add the third habit and begin easing off reminders on the older ones. By the end each habit has been repeated for many weeks, but many children need longer: keep going at your child’s pace and move to the next age stage only when it feels steady.",
        "habit": "Plan the study week, self-assess and own the result",
        "period": "Weeks 9–12"
      },
      {
        "title": "Step 1 · Who I want to become",
        "description": "This first step adds just ONE new habit. In the first two weeks do it together and keep one fixed cue (same time, same place); in the next two let your child do more with fewer reminders. Spend a few minutes looking back at the end of each week. Missing one day changes nothing; missing several in a row means making it smaller.",
        "habit": "Rewrite and reread your own statement each week",
        "period": "Weeks 1–4"
      },
      {
        "title": "Step 2 · A healthy body",
        "description": "Keep the habit from step 1 and add ONE new habit. Add it only when step 1 is fairly steady; if it is not, stay a few more weeks. There is no calendar to catch up with.",
        "habit": "Train, eat and rest to a weekly schedule",
        "period": "Weeks 5–8"
      },
      {
        "title": "Step 3 · Trying a path",
        "description": "Add the third habit and begin easing off reminders on the older ones. By the end each habit has been repeated for many weeks, but many children need longer: keep going at your child’s pace and move to the next age stage only when it feels steady.",
        "habit": "Try one career area: learn, experience, write it down",
        "period": "Weeks 9–12"
      }
    ]
  },
  "fr": {
    "eyebrow": "Commencer à un rythme adapté",
    "title": "Des parcours par âge, une seule nouvelle habitude à chaque étape",
    "description": "Chaque âge dispose d’un parcours d’environ 12 semaines en trois étapes. Chaque étape garde les habitudes précédentes et n’en ajoute qu’une ; sa durée dépend du rythme de l’enfant. Le temps de formation varie selon les personnes : les semaines sont des repères, pas des échéances.",
    "newHabits": "Nouvelles habitudes à cette étape",
    "age": "ans",
    "stages": [
      {
        "title": "Sécurité et sens",
        "adultRole": "Les parents montrent et décrivent"
      },
      {
        "title": "Exploration et volonté",
        "adultRole": "Les parents participent et rappellent doucement"
      },
      {
        "title": "Effort et compétences",
        "adultRole": "Les parents suivent et participent"
      },
      {
        "title": "Identité et émotions",
        "adultRole": "Les parents accompagnent et respectent aussi les règles communes"
      },
      {
        "title": "Orientation et responsabilité",
        "adultRole": "Les parents conseillent et soutiennent"
      }
    ],
    "plans": [
      {
        "title": "Étape 1 · Routine paisible et bon sommeil",
        "description": "Cette première étape ajoute UNE seule habitude. Les deux premières semaines, pratiquez ensemble avec un signal fixe (même heure, même lieu) ; les deux suivantes, laissez l’enfant faire davantage avec moins de rappels. Prenez quelques minutes pour faire le point chaque fin de semaine. Un jour manqué ne change rien ; plusieurs jours de suite invitent à réduire la pratique.",
        "habit": "Un rituel du coucher à la même heure chaque soir",
        "period": "Semaines 1–4"
      },
      {
        "title": "Étape 2 · Recevoir une réponse chaque jour",
        "description": "Gardez l’habitude de l’étape 1 et ajoutez UNE nouvelle habitude, seulement lorsque la première est assez régulière. Sinon, restez quelques semaines de plus, sans courir après le calendrier.",
        "habit": "Regarder, attendre et répondre quand l’enfant émet un son",
        "period": "Semaines 5–8"
      },
      {
        "title": "Étape 3 · Livres et jeux",
        "description": "Ajoutez la troisième habitude et réduisez peu à peu les rappels pour les anciennes. À la fin, chaque habitude aura été répétée plusieurs semaines, mais beaucoup d’enfants ont besoin de plus de temps : suivez leur rythme et passez à l’âge suivant seulement lorsque toute la famille se sent prête.",
        "habit": "Un livre et une histoire chaque jour",
        "period": "Semaines 9–12"
      },
      {
        "title": "Étape 1 · Émotions calmes",
        "description": "Cette première étape ajoute UNE seule habitude. Les deux premières semaines, pratiquez ensemble avec un signal fixe (même heure, même lieu) ; les deux suivantes, laissez l’enfant faire davantage avec moins de rappels. Prenez quelques minutes pour faire le point chaque fin de semaine. Un jour manqué ne change rien ; plusieurs jours de suite invitent à réduire la pratique.",
        "habit": "Nommer une émotion : dire « je me sens… » chaque soir",
        "period": "Semaines 1–4"
      },
      {
        "title": "Étape 2 · Sommeil et écrans",
        "description": "Gardez l’habitude de l’étape 1 et ajoutez UNE nouvelle habitude, seulement lorsque la première est assez régulière. Sinon, restez quelques semaines de plus, sans courir après le calendrier.",
        "habit": "Les écrans se couchent avant toi",
        "period": "Semaines 5–8"
      },
      {
        "title": "Étape 3 · Ma tâche à la maison",
        "description": "Ajoutez la troisième habitude et réduisez peu à peu les rappels pour les anciennes. À la fin, chaque habitude aura été répétée plusieurs semaines, mais beaucoup d’enfants ont besoin de plus de temps : suivez leur rythme et passez à l’âge suivant seulement lorsque toute la famille se sent prête.",
        "habit": "Une petite tâche personnelle chaque jour",
        "period": "Semaines 9–12"
      },
      {
        "title": "Étape 1 · Gratitude du soir",
        "description": "Cette première étape ajoute UNE seule habitude. Les deux premières semaines, pratiquez ensemble avec un signal fixe (même heure, même lieu) ; les deux suivantes, laissez l’enfant faire davantage avec moins de rappels. Prenez quelques minutes pour faire le point chaque fin de semaine. Un jour manqué ne change rien ; plusieurs jours de suite invitent à réduire la pratique.",
        "habit": "Chaque soir, une chose pour laquelle être reconnaissant et une réussite",
        "period": "Semaines 1–4"
      },
      {
        "title": "Étape 2 · Apprendre avec méthode",
        "description": "Gardez l’habitude de l’étape 1 et ajoutez UNE nouvelle habitude, seulement lorsque la première est assez régulière. Sinon, restez quelques semaines de plus, sans courir après le calendrier.",
        "habit": "Après la lecture, se poser une question et y répondre",
        "period": "Semaines 5–8"
      },
      {
        "title": "Étape 3 · Bouger avec des chiffres",
        "description": "Ajoutez la troisième habitude et réduisez peu à peu les rappels pour les anciennes. À la fin, chaque habitude aura été répétée plusieurs semaines, mais beaucoup d’enfants ont besoin de plus de temps : suivez leur rythme et passez à l’âge suivant seulement lorsque toute la famille se sent prête.",
        "habit": "Bouger 60 minutes et noter un chiffre qui progresse",
        "period": "Semaines 9–12"
      },
      {
        "title": "Étape 1 · Assez de sommeil, l’esprit plus léger",
        "description": "Cette première étape ajoute UNE seule habitude. Les deux premières semaines, pratiquez ensemble avec un signal fixe (même heure, même lieu) ; les deux suivantes, laissez l’enfant faire davantage avec moins de rappels. Prenez quelques minutes pour faire le point chaque fin de semaine. Un jour manqué ne change rien ; plusieurs jours de suite invitent à réduire la pratique.",
        "habit": "Dormir à l’heure, sans écran avant le coucher",
        "period": "Semaines 1–4"
      },
      {
        "title": "Étape 2 · Mes propres règles",
        "description": "Gardez l’habitude de l’étape 1 et ajoutez UNE nouvelle habitude, seulement lorsque la première est assez régulière. Sinon, restez quelques semaines de plus, sans courir après le calendrier.",
        "habit": "Respecter trois règles que tu as choisies",
        "period": "Semaines 5–8"
      },
      {
        "title": "Étape 3 · Apprendre en autonomie",
        "description": "Ajoutez la troisième habitude et réduisez peu à peu les rappels pour les anciennes. À la fin, chaque habitude aura été répétée plusieurs semaines, mais beaucoup d’enfants ont besoin de plus de temps : suivez leur rythme et passez à l’âge suivant seulement lorsque toute la famille se sent prête.",
        "habit": "Planifier la semaine d’étude, s’autoévaluer et assumer le résultat",
        "period": "Semaines 9–12"
      },
      {
        "title": "Étape 1 · Qui je veux devenir",
        "description": "Cette première étape ajoute UNE seule habitude. Les deux premières semaines, pratiquez ensemble avec un signal fixe (même heure, même lieu) ; les deux suivantes, laissez l’enfant faire davantage avec moins de rappels. Prenez quelques minutes pour faire le point chaque fin de semaine. Un jour manqué ne change rien ; plusieurs jours de suite invitent à réduire la pratique.",
        "habit": "Réécrire et relire ta déclaration personnelle chaque semaine",
        "period": "Semaines 1–4"
      },
      {
        "title": "Étape 2 · Un corps en bonne santé",
        "description": "Gardez l’habitude de l’étape 1 et ajoutez UNE nouvelle habitude, seulement lorsque la première est assez régulière. Sinon, restez quelques semaines de plus, sans courir après le calendrier.",
        "habit": "S’entraîner, manger et se reposer selon un planning hebdomadaire",
        "period": "Semaines 5–8"
      },
      {
        "title": "Étape 3 · Essayer un métier",
        "description": "Ajoutez la troisième habitude et réduisez peu à peu les rappels pour les anciennes. À la fin, chaque habitude aura été répétée plusieurs semaines, mais beaucoup d’enfants ont besoin de plus de temps : suivez leur rythme et passez à l’âge suivant seulement lorsque toute la famille se sent prête.",
        "habit": "Explorer un domaine professionnel : apprendre, expérimenter et noter",
        "period": "Semaines 9–12"
      }
    ]
  },
  "de": {
    "eyebrow": "In passendem Tempo beginnen",
    "title": "Altersbezogene Pläne, jeder Schritt ergänzt nur eine Gewohnheit",
    "description": "Jede Altersstufe hat einen Plan von etwa 12 Wochen mit drei Schritten. Jeder Schritt behält frühere Gewohnheiten bei und ergänzt nur eine neue. Die Dauer richtet sich nach Ihrem Kind. Gewohnheitsbildung ist individuell; Wochenangaben sind Anregungen, keine Fristen.",
    "newHabits": "Neue Gewohnheiten in diesem Schritt",
    "age": "Jahre",
    "stages": [
      {
        "title": "Sicherheit und Sinne",
        "adultRole": "Eltern machen vor und beschreiben"
      },
      {
        "title": "Entdecken und Willenskraft",
        "adultRole": "Eltern machen mit und erinnern sanft"
      },
      {
        "title": "Fleiß und Fertigkeiten",
        "adultRole": "Eltern begleiten und machen mit"
      },
      {
        "title": "Identität und Gefühle",
        "adultRole": "Eltern begleiten und halten sich ebenfalls an gemeinsame Regeln"
      },
      {
        "title": "Orientierung und Verantwortung",
        "adultRole": "Eltern beraten und unterstützen"
      }
    ],
    "plans": [
      {
        "title": "Schritt 1 · Ruhiger Alltag und guter Schlaf",
        "description": "Dieser erste Schritt ergänzt nur EINE neue Gewohnheit. Üben Sie in den ersten zwei Wochen gemeinsam mit einem festen Auslöser (gleiche Zeit, gleicher Ort). Lassen Sie Ihr Kind in den nächsten zwei Wochen mehr selbst tun und erinnern Sie weniger. Schauen Sie am Wochenende einige Minuten zurück. Ein verpasster Tag ändert nichts; mehrere hintereinander bedeuten, die Aufgabe kleiner zu machen.",
        "habit": "Ein Einschlafritual jeden Abend zur gleichen Zeit",
        "period": "Wochen 1–4"
      },
      {
        "title": "Schritt 2 · Jeden Tag eine Antwort erhalten",
        "description": "Behalten Sie die Gewohnheit aus Schritt 1 bei und ergänzen Sie EINE neue, erst wenn die erste recht regelmäßig gelingt. Falls nicht, bleiben Sie einige Wochen länger. Sie müssen keinem Kalender hinterherlaufen.",
        "habit": "Schauen, warten und antworten, wenn Ihr Kind einen Laut macht",
        "period": "Wochen 5–8"
      },
      {
        "title": "Schritt 3 · Bücher und Spielen",
        "description": "Ergänzen Sie die dritte Gewohnheit und reduzieren Sie Erinnerungen bei den bisherigen langsam. Am Ende wurde jede viele Wochen wiederholt, doch viele Kinder brauchen länger. Bleiben Sie im Tempo Ihres Kindes und wechseln Sie erst zur nächsten Altersstufe, wenn sich die ganze Familie sicher fühlt.",
        "habit": "Jeden Tag ein Buch und eine Geschichte",
        "period": "Wochen 9–12"
      },
      {
        "title": "Schritt 1 · Ruhige Gefühle",
        "description": "Dieser erste Schritt ergänzt nur EINE neue Gewohnheit. Üben Sie in den ersten zwei Wochen gemeinsam mit einem festen Auslöser (gleiche Zeit, gleicher Ort). Lassen Sie Ihr Kind in den nächsten zwei Wochen mehr selbst tun und erinnern Sie weniger. Schauen Sie am Wochenende einige Minuten zurück. Ein verpasster Tag ändert nichts; mehrere hintereinander bedeuten, die Aufgabe kleiner zu machen.",
        "habit": "Ein Gefühl benennen: Jeden Abend „Ich fühle mich…“ sagen",
        "period": "Wochen 1–4"
      },
      {
        "title": "Schritt 2 · Schlaf und Bildschirme",
        "description": "Behalten Sie die Gewohnheit aus Schritt 1 bei und ergänzen Sie EINE neue, erst wenn die erste recht regelmäßig gelingt. Falls nicht, bleiben Sie einige Wochen länger. Sie müssen keinem Kalender hinterherlaufen.",
        "habit": "Bildschirme schlafen vor dir ein",
        "period": "Wochen 5–8"
      },
      {
        "title": "Schritt 3 · Meine eigene Hausarbeit",
        "description": "Ergänzen Sie die dritte Gewohnheit und reduzieren Sie Erinnerungen bei den bisherigen langsam. Am Ende wurde jede viele Wochen wiederholt, doch viele Kinder brauchen länger. Bleiben Sie im Tempo Ihres Kindes und wechseln Sie erst zur nächsten Altersstufe, wenn sich die ganze Familie sicher fühlt.",
        "habit": "Jeden Tag eine eigene kleine Hausaufgabe im Haushalt",
        "period": "Wochen 9–12"
      },
      {
        "title": "Schritt 1 · Dankbarkeit am Abend",
        "description": "Dieser erste Schritt ergänzt nur EINE neue Gewohnheit. Üben Sie in den ersten zwei Wochen gemeinsam mit einem festen Auslöser (gleiche Zeit, gleicher Ort). Lassen Sie Ihr Kind in den nächsten zwei Wochen mehr selbst tun und erinnern Sie weniger. Schauen Sie am Wochenende einige Minuten zurück. Ein verpasster Tag ändert nichts; mehrere hintereinander bedeuten, die Aufgabe kleiner zu machen.",
        "habit": "Jeden Abend etwas, wofür du dankbar bist, und etwas, das dir gelungen ist",
        "period": "Wochen 1–4"
      },
      {
        "title": "Schritt 2 · Mit Methode lernen",
        "description": "Behalten Sie die Gewohnheit aus Schritt 1 bei und ergänzen Sie EINE neue, erst wenn die erste recht regelmäßig gelingt. Falls nicht, bleiben Sie einige Wochen länger. Sie müssen keinem Kalender hinterherlaufen.",
        "habit": "Nach dem Lesen selbst eine Frage stellen und beantworten",
        "period": "Wochen 5–8"
      },
      {
        "title": "Schritt 3 · Bewegung mit Zahlen",
        "description": "Ergänzen Sie die dritte Gewohnheit und reduzieren Sie Erinnerungen bei den bisherigen langsam. Am Ende wurde jede viele Wochen wiederholt, doch viele Kinder brauchen länger. Bleiben Sie im Tempo Ihres Kindes und wechseln Sie erst zur nächsten Altersstufe, wenn sich die ganze Familie sicher fühlt.",
        "habit": "60 Minuten bewegen und eine Zahl für den Fortschritt notieren",
        "period": "Wochen 9–12"
      },
      {
        "title": "Schritt 1 · Genug Schlaf, ein klarerer Kopf",
        "description": "Dieser erste Schritt ergänzt nur EINE neue Gewohnheit. Üben Sie in den ersten zwei Wochen gemeinsam mit einem festen Auslöser (gleiche Zeit, gleicher Ort). Lassen Sie Ihr Kind in den nächsten zwei Wochen mehr selbst tun und erinnern Sie weniger. Schauen Sie am Wochenende einige Minuten zurück. Ein verpasster Tag ändert nichts; mehrere hintereinander bedeuten, die Aufgabe kleiner zu machen.",
        "habit": "Pünktlich schlafen, ohne Bildschirm vor dem Zubettgehen",
        "period": "Wochen 1–4"
      },
      {
        "title": "Schritt 2 · Meine eigenen Regeln",
        "description": "Behalten Sie die Gewohnheit aus Schritt 1 bei und ergänzen Sie EINE neue, erst wenn die erste recht regelmäßig gelingt. Falls nicht, bleiben Sie einige Wochen länger. Sie müssen keinem Kalender hinterherlaufen.",
        "habit": "Drei selbst gesetzte Regeln einhalten",
        "period": "Wochen 5–8"
      },
      {
        "title": "Schritt 3 · Selbstständig lernen",
        "description": "Ergänzen Sie die dritte Gewohnheit und reduzieren Sie Erinnerungen bei den bisherigen langsam. Am Ende wurde jede viele Wochen wiederholt, doch viele Kinder brauchen länger. Bleiben Sie im Tempo Ihres Kindes und wechseln Sie erst zur nächsten Altersstufe, wenn sich die ganze Familie sicher fühlt.",
        "habit": "Die Lernwoche planen, selbst bewerten und das Ergebnis verantworten",
        "period": "Wochen 9–12"
      },
      {
        "title": "Schritt 1 · Wer ich werden möchte",
        "description": "Dieser erste Schritt ergänzt nur EINE neue Gewohnheit. Üben Sie in den ersten zwei Wochen gemeinsam mit einem festen Auslöser (gleiche Zeit, gleicher Ort). Lassen Sie Ihr Kind in den nächsten zwei Wochen mehr selbst tun und erinnern Sie weniger. Schauen Sie am Wochenende einige Minuten zurück. Ein verpasster Tag ändert nichts; mehrere hintereinander bedeuten, die Aufgabe kleiner zu machen.",
        "habit": "Die eigene Erklärung jede Woche überarbeiten und lesen",
        "period": "Wochen 1–4"
      },
      {
        "title": "Schritt 2 · Ein gesunder Körper",
        "description": "Behalten Sie die Gewohnheit aus Schritt 1 bei und ergänzen Sie EINE neue, erst wenn die erste recht regelmäßig gelingt. Falls nicht, bleiben Sie einige Wochen länger. Sie müssen keinem Kalender hinterherlaufen.",
        "habit": "Training, Essen und Ruhe nach Wochenplan",
        "period": "Wochen 5–8"
      },
      {
        "title": "Schritt 3 · Einen Berufsweg ausprobieren",
        "description": "Ergänzen Sie die dritte Gewohnheit und reduzieren Sie Erinnerungen bei den bisherigen langsam. Am Ende wurde jede viele Wochen wiederholt, doch viele Kinder brauchen länger. Bleiben Sie im Tempo Ihres Kindes und wechseln Sie erst zur nächsten Altersstufe, wenn sich die ganze Familie sicher fühlt.",
        "habit": "Ein Berufsfeld ausprobieren: informieren, erleben und aufschreiben",
        "period": "Wochen 9–12"
      }
    ]
  },
  "it": {
    "eyebrow": "Inizia con un ritmo sostenibile",
    "title": "Percorsi per età, una sola nuova abitudine a ogni passo",
    "description": "Ogni fascia d’età ha un percorso di circa 12 settimane in tre passi. Ogni passo mantiene le abitudini precedenti e ne aggiunge una sola; la durata dipende dal ritmo del bambino. I tempi variano da persona a persona: le settimane sono indicazioni, non scadenze.",
    "newHabits": "Nuove abitudini in questo passo",
    "age": "anni",
    "stages": [
      {
        "title": "Sicurezza e sensi",
        "adultRole": "I genitori mostrano e descrivono"
      },
      {
        "title": "Esplorazione e volontà",
        "adultRole": "I genitori partecipano e ricordano con delicatezza"
      },
      {
        "title": "Impegno e abilità",
        "adultRole": "I genitori seguono e partecipano"
      },
      {
        "title": "Identità ed emozioni",
        "adultRole": "I genitori accompagnano e rispettano le regole comuni"
      },
      {
        "title": "Orientamento e responsabilità",
        "adultRole": "I genitori consigliano e sostengono"
      }
    ],
    "plans": [
      {
        "title": "Passo 1 · Routine serena e buon sonno",
        "description": "Questo primo passo aggiunge UNA sola abitudine. Nelle prime due settimane praticate insieme mantenendo un segnale fisso (stessa ora, stesso luogo); nelle due successive lasciate fare di più al bambino con meno promemoria. Dedicate qualche minuto a riflettere a fine settimana. Saltare un giorno non cambia nulla; saltarne diversi di seguito invita a ridurre la pratica.",
        "habit": "Un rituale della buonanotte alla stessa ora ogni sera",
        "period": "Settimane 1–4"
      },
      {
        "title": "Passo 2 · Ricevere una risposta ogni giorno",
        "description": "Mantenete l’abitudine del passo 1 e aggiungetene UNA nuova solo quando la prima è abbastanza regolare. Altrimenti restate qualche settimana in più: non c’è un calendario da rincorrere.",
        "habit": "Guarda, aspetta e rispondi quando il bambino emette un suono",
        "period": "Settimane 5–8"
      },
      {
        "title": "Passo 3 · Libri e gioco",
        "description": "Aggiungete la terza abitudine e riducete gradualmente i promemoria per le precedenti. Alla fine ciascuna sarà stata ripetuta per settimane, ma molti bambini hanno bisogno di più tempo: seguite il ritmo del bambino e passate alla fascia successiva solo quando tutta la famiglia si sente sicura.",
        "habit": "Un libro e una storia ogni giorno",
        "period": "Settimane 9–12"
      },
      {
        "title": "Passo 1 · Emozioni calme",
        "description": "Questo primo passo aggiunge UNA sola abitudine. Nelle prime due settimane praticate insieme mantenendo un segnale fisso (stessa ora, stesso luogo); nelle due successive lasciate fare di più al bambino con meno promemoria. Dedicate qualche minuto a riflettere a fine settimana. Saltare un giorno non cambia nulla; saltarne diversi di seguito invita a ridurre la pratica.",
        "habit": "Dai un nome a un’emozione: dì “mi sento…” ogni sera",
        "period": "Settimane 1–4"
      },
      {
        "title": "Passo 2 · Sonno e schermi",
        "description": "Mantenete l’abitudine del passo 1 e aggiungetene UNA nuova solo quando la prima è abbastanza regolare. Altrimenti restate qualche settimana in più: non c’è un calendario da rincorrere.",
        "habit": "Gli schermi vanno a dormire prima di te",
        "period": "Settimane 5–8"
      },
      {
        "title": "Passo 3 · Il mio compito in casa",
        "description": "Aggiungete la terza abitudine e riducete gradualmente i promemoria per le precedenti. Alla fine ciascuna sarà stata ripetuta per settimane, ma molti bambini hanno bisogno di più tempo: seguite il ritmo del bambino e passate alla fascia successiva solo quando tutta la famiglia si sente sicura.",
        "habit": "Un piccolo compito personale ogni giorno",
        "period": "Settimane 9–12"
      },
      {
        "title": "Passo 1 · Gratitudine serale",
        "description": "Questo primo passo aggiunge UNA sola abitudine. Nelle prime due settimane praticate insieme mantenendo un segnale fisso (stessa ora, stesso luogo); nelle due successive lasciate fare di più al bambino con meno promemoria. Dedicate qualche minuto a riflettere a fine settimana. Saltare un giorno non cambia nulla; saltarne diversi di seguito invita a ridurre la pratica.",
        "habit": "Ogni sera una cosa per cui essere grati e una cosa fatta bene",
        "period": "Settimane 1–4"
      },
      {
        "title": "Passo 2 · Imparare con metodo",
        "description": "Mantenete l’abitudine del passo 1 e aggiungetene UNA nuova solo quando la prima è abbastanza regolare. Altrimenti restate qualche settimana in più: non c’è un calendario da rincorrere.",
        "habit": "Dopo la lettura, fatti una domanda e rispondi",
        "period": "Settimane 5–8"
      },
      {
        "title": "Passo 3 · Movimento con i numeri",
        "description": "Aggiungete la terza abitudine e riducete gradualmente i promemoria per le precedenti. Alla fine ciascuna sarà stata ripetuta per settimane, ma molti bambini hanno bisogno di più tempo: seguite il ritmo del bambino e passate alla fascia successiva solo quando tutta la famiglia si sente sicura.",
        "habit": "Muoviti per 60 minuti e annota un numero che migliora",
        "period": "Settimane 9–12"
      },
      {
        "title": "Passo 1 · Sonno sufficiente, mente più leggera",
        "description": "Questo primo passo aggiunge UNA sola abitudine. Nelle prime due settimane praticate insieme mantenendo un segnale fisso (stessa ora, stesso luogo); nelle due successive lasciate fare di più al bambino con meno promemoria. Dedicate qualche minuto a riflettere a fine settimana. Saltare un giorno non cambia nulla; saltarne diversi di seguito invita a ridurre la pratica.",
        "habit": "Dormire puntualmente, senza schermi prima di coricarsi",
        "period": "Settimane 1–4"
      },
      {
        "title": "Passo 2 · Le mie regole",
        "description": "Mantenete l’abitudine del passo 1 e aggiungetene UNA nuova solo quando la prima è abbastanza regolare. Altrimenti restate qualche settimana in più: non c’è un calendario da rincorrere.",
        "habit": "Rispetta tre regole che hai scelto",
        "period": "Settimane 5–8"
      },
      {
        "title": "Passo 3 · Studio autonomo",
        "description": "Aggiungete la terza abitudine e riducete gradualmente i promemoria per le precedenti. Alla fine ciascuna sarà stata ripetuta per settimane, ma molti bambini hanno bisogno di più tempo: seguite il ritmo del bambino e passate alla fascia successiva solo quando tutta la famiglia si sente sicura.",
        "habit": "Pianifica la settimana di studio, autovalutati e assumiti il risultato",
        "period": "Settimane 9–12"
      },
      {
        "title": "Passo 1 · Chi voglio diventare",
        "description": "Questo primo passo aggiunge UNA sola abitudine. Nelle prime due settimane praticate insieme mantenendo un segnale fisso (stessa ora, stesso luogo); nelle due successive lasciate fare di più al bambino con meno promemoria. Dedicate qualche minuto a riflettere a fine settimana. Saltare un giorno non cambia nulla; saltarne diversi di seguito invita a ridurre la pratica.",
        "habit": "Riscrivi e rileggi la tua dichiarazione ogni settimana",
        "period": "Settimane 1–4"
      },
      {
        "title": "Passo 2 · Un corpo sano",
        "description": "Mantenete l’abitudine del passo 1 e aggiungetene UNA nuova solo quando la prima è abbastanza regolare. Altrimenti restate qualche settimana in più: non c’è un calendario da rincorrere.",
        "habit": "Allenati, mangia e riposa secondo un programma settimanale",
        "period": "Settimane 5–8"
      },
      {
        "title": "Passo 3 · Provare una professione",
        "description": "Aggiungete la terza abitudine e riducete gradualmente i promemoria per le precedenti. Alla fine ciascuna sarà stata ripetuta per settimane, ma molti bambini hanno bisogno di più tempo: seguite il ritmo del bambino e passate alla fascia successiva solo quando tutta la famiglia si sente sicura.",
        "habit": "Esplora un settore professionale: informati, fai esperienza e annota",
        "period": "Settimane 9–12"
      }
    ]
  },
  "es": {
    "eyebrow": "Empezar a un ritmo manejable",
    "title": "Recorridos por edad, un solo hábito nuevo en cada paso",
    "description": "Cada edad tiene un recorrido de unas 12 semanas con tres pasos. Cada paso conserva los hábitos anteriores y añade solo uno; su duración depende del ritmo del niño. El tiempo de formación varía entre personas, así que las semanas son orientaciones, no plazos límite.",
    "newHabits": "Hábitos nuevos en este paso",
    "age": "años",
    "stages": [
      {
        "title": "Seguridad y sentidos",
        "adultRole": "Los padres muestran y describen"
      },
      {
        "title": "Exploración y voluntad",
        "adultRole": "Los padres participan y recuerdan con suavidad"
      },
      {
        "title": "Esfuerzo y habilidades",
        "adultRole": "Los padres supervisan y participan"
      },
      {
        "title": "Identidad y emociones",
        "adultRole": "Los padres acompañan y respetan las reglas comunes"
      },
      {
        "title": "Orientación y responsabilidad",
        "adultRole": "Los padres aconsejan y respaldan"
      }
    ],
    "plans": [
      {
        "title": "Paso 1 · Rutina tranquila y buen sueño",
        "description": "Este primer paso añade solo UN hábito nuevo. En las dos primeras semanas hacedlo juntos con una señal fija (misma hora, mismo lugar); en las dos siguientes dejad que el niño haga más con menos recordatorios. Dedicad unos minutos a revisar al final de cada semana. Omitir un día no cambia nada; omitir varios seguidos indica que hay que reducir la tarea.",
        "habit": "Un ritual para dormir a la misma hora cada noche",
        "period": "Semanas 1–4"
      },
      {
        "title": "Paso 2 · Recibir una respuesta cada día",
        "description": "Mantened el hábito del paso 1 y añadid UNO nuevo solo cuando el primero sea bastante regular. Si aún no lo es, quedaos unas semanas más, sin perseguir el calendario.",
        "habit": "Mirar, esperar y responder cuando el niño emite un sonido",
        "period": "Semanas 5–8"
      },
      {
        "title": "Paso 3 · Libros y juego",
        "description": "Añadid el tercer hábito y reducid poco a poco los recordatorios de los anteriores. Al terminar, cada hábito se habrá repetido durante semanas, pero muchos niños necesitan más tiempo: seguid su ritmo y pasad a la siguiente edad solo cuando toda la familia se sienta firme.",
        "habit": "Un libro y una historia cada día",
        "period": "Semanas 9–12"
      },
      {
        "title": "Paso 1 · Emociones tranquilas",
        "description": "Este primer paso añade solo UN hábito nuevo. En las dos primeras semanas hacedlo juntos con una señal fija (misma hora, mismo lugar); en las dos siguientes dejad que el niño haga más con menos recordatorios. Dedicad unos minutos a revisar al final de cada semana. Omitir un día no cambia nada; omitir varios seguidos indica que hay que reducir la tarea.",
        "habit": "Nombrar una emoción: decir “me siento…” cada noche",
        "period": "Semanas 1–4"
      },
      {
        "title": "Paso 2 · Sueño y pantallas",
        "description": "Mantened el hábito del paso 1 y añadid UNO nuevo solo cuando el primero sea bastante regular. Si aún no lo es, quedaos unas semanas más, sin perseguir el calendario.",
        "habit": "Las pantallas se duermen antes que tú",
        "period": "Semanas 5–8"
      },
      {
        "title": "Paso 3 · Mi tarea en casa",
        "description": "Añadid el tercer hábito y reducid poco a poco los recordatorios de los anteriores. Al terminar, cada hábito se habrá repetido durante semanas, pero muchos niños necesitan más tiempo: seguid su ritmo y pasad a la siguiente edad solo cuando toda la familia se sienta firme.",
        "habit": "Una pequeña tarea propia cada día",
        "period": "Semanas 9–12"
      },
      {
        "title": "Paso 1 · Gratitud por la noche",
        "description": "Este primer paso añade solo UN hábito nuevo. En las dos primeras semanas hacedlo juntos con una señal fija (misma hora, mismo lugar); en las dos siguientes dejad que el niño haga más con menos recordatorios. Dedicad unos minutos a revisar al final de cada semana. Omitir un día no cambia nada; omitir varios seguidos indica que hay que reducir la tarea.",
        "habit": "Cada noche, algo que agradecer y algo que hiciste bien",
        "period": "Semanas 1–4"
      },
      {
        "title": "Paso 2 · Aprender con método",
        "description": "Mantened el hábito del paso 1 y añadid UNO nuevo solo cuando el primero sea bastante regular. Si aún no lo es, quedaos unas semanas más, sin perseguir el calendario.",
        "habit": "Después de leer, hazte una pregunta y respóndela",
        "period": "Semanas 5–8"
      },
      {
        "title": "Paso 3 · Moverse con cifras",
        "description": "Añadid el tercer hábito y reducid poco a poco los recordatorios de los anteriores. Al terminar, cada hábito se habrá repetido durante semanas, pero muchos niños necesitan más tiempo: seguid su ritmo y pasad a la siguiente edad solo cuando toda la familia se sienta firme.",
        "habit": "Moverse 60 minutos y anotar una cifra que mejore",
        "period": "Semanas 9–12"
      },
      {
        "title": "Paso 1 · Dormir suficiente, mente más ligera",
        "description": "Este primer paso añade solo UN hábito nuevo. En las dos primeras semanas hacedlo juntos con una señal fija (misma hora, mismo lugar); en las dos siguientes dejad que el niño haga más con menos recordatorios. Dedicad unos minutos a revisar al final de cada semana. Omitir un día no cambia nada; omitir varios seguidos indica que hay que reducir la tarea.",
        "habit": "Dormir a tiempo, sin pantallas antes de acostarse",
        "period": "Semanas 1–4"
      },
      {
        "title": "Paso 2 · Mis propias reglas",
        "description": "Mantened el hábito del paso 1 y añadid UNO nuevo solo cuando el primero sea bastante regular. Si aún no lo es, quedaos unas semanas más, sin perseguir el calendario.",
        "habit": "Cumplir tres reglas que tú has elegido",
        "period": "Semanas 5–8"
      },
      {
        "title": "Paso 3 · Aprendizaje autónomo",
        "description": "Añadid el tercer hábito y reducid poco a poco los recordatorios de los anteriores. Al terminar, cada hábito se habrá repetido durante semanas, pero muchos niños necesitan más tiempo: seguid su ritmo y pasad a la siguiente edad solo cuando toda la familia se sienta firme.",
        "habit": "Planificar la semana de estudio, autoevaluarse y asumir el resultado",
        "period": "Semanas 9–12"
      },
      {
        "title": "Paso 1 · Quién quiero ser",
        "description": "Este primer paso añade solo UN hábito nuevo. En las dos primeras semanas hacedlo juntos con una señal fija (misma hora, mismo lugar); en las dos siguientes dejad que el niño haga más con menos recordatorios. Dedicad unos minutos a revisar al final de cada semana. Omitir un día no cambia nada; omitir varios seguidos indica que hay que reducir la tarea.",
        "habit": "Reescribir y releer tu declaración cada semana",
        "period": "Semanas 1–4"
      },
      {
        "title": "Paso 2 · Un cuerpo sano",
        "description": "Mantened el hábito del paso 1 y añadid UNO nuevo solo cuando el primero sea bastante regular. Si aún no lo es, quedaos unas semanas más, sin perseguir el calendario.",
        "habit": "Entrenar, comer y descansar con un horario semanal",
        "period": "Semanas 5–8"
      },
      {
        "title": "Paso 3 · Probar una profesión",
        "description": "Añadid el tercer hábito y reducid poco a poco los recordatorios de los anteriores. Al terminar, cada hábito se habrá repetido durante semanas, pero muchos niños necesitan más tiempo: seguid su ritmo y pasad a la siguiente edad solo cuando toda la familia se sienta firme.",
        "habit": "Explorar un campo profesional: aprender, experimentar y anotar",
        "period": "Semanas 9–12"
      }
    ]
  },
  "zh": {
    "eyebrow": "量力开始",
    "title": "按年龄安排的成长路线，每一步只增加一个习惯",
    "description": "每个年龄阶段都有约12周、分三步的路线。每一步保留之前的习惯，只增加一个新习惯；停留多久取决于孩子的节奏。形成习惯所需时间因人而异，周数只是建议，并非期限。",
    "newHabits": "本步骤的新习惯",
    "age": "岁",
    "stages": [
      {
        "title": "安全与感官",
        "adultRole": "家长示范并描述"
      },
      {
        "title": "探索与意志",
        "adultRole": "家长一起做并轻声提醒"
      },
      {
        "title": "勤奋与技能",
        "adultRole": "家长关注并参与"
      },
      {
        "title": "身份与情绪",
        "adultRole": "家长陪伴，也遵守共同规则"
      },
      {
        "title": "方向与责任",
        "adultRole": "家长提供建议与支持"
      }
    ],
    "plans": [
      {
        "title": "步骤 1 · 平静作息与良好睡眠",
        "description": "第一步只增加一个新习惯。前两周和孩子一起做，保持固定提示（同一时间、同一地点）；后两周让孩子多做一些、减少提醒。每周结束时花几分钟回顾。漏做一天就继续，连续漏做多天则把任务缩小。",
        "habit": "每晚同一时间进行睡前仪式",
        "period": "第1–4周"
      },
      {
        "title": "步骤 2 · 每天得到回应",
        "description": "保留第一步的习惯，再增加一个新习惯。只有第一步已经较稳定时才增加；尚未稳定就多停留几周，不必追赶日历。",
        "habit": "孩子发声时，注视、等待、回应",
        "period": "第5–8周"
      },
      {
        "title": "步骤 3 · 阅读与游戏",
        "description": "增加第三个习惯，开始逐渐减少对旧习惯的提醒。结束时每个习惯已重复多周，但许多孩子需要更久：继续按孩子的节奏，等全家觉得稳妥时再进入下一年龄阶段。",
        "habit": "每天一本书、一个故事",
        "period": "第9–12周"
      },
      {
        "title": "步骤 1 · 平静情绪",
        "description": "第一步只增加一个新习惯。前两周和孩子一起做，保持固定提示（同一时间、同一地点）；后两周让孩子多做一些、减少提醒。每周结束时花几分钟回顾。漏做一天就继续，连续漏做多天则把任务缩小。",
        "habit": "每晚说“我感觉……”来命名情绪",
        "period": "第1–4周"
      },
      {
        "title": "步骤 2 · 睡眠与屏幕",
        "description": "保留第一步的习惯，再增加一个新习惯。只有第一步已经较稳定时才增加；尚未稳定就多停留几周，不必追赶日历。",
        "habit": "屏幕比你先睡觉",
        "period": "第5–8周"
      },
      {
        "title": "步骤 3 · 自己的家务",
        "description": "增加第三个习惯，开始逐渐减少对旧习惯的提醒。结束时每个习惯已重复多周，但许多孩子需要更久：继续按孩子的节奏，等全家觉得稳妥时再进入下一年龄阶段。",
        "habit": "每天一项自己的小家务",
        "period": "第9–12周"
      },
      {
        "title": "步骤 1 · 每晚感恩",
        "description": "第一步只增加一个新习惯。前两周和孩子一起做，保持固定提示（同一时间、同一地点）；后两周让孩子多做一些、减少提醒。每周结束时花几分钟回顾。漏做一天就继续，连续漏做多天则把任务缩小。",
        "habit": "每晚一件感恩的事和一件自己做得好的事",
        "period": "第1–4周"
      },
      {
        "title": "步骤 2 · 有方法地学习",
        "description": "保留第一步的习惯，再增加一个新习惯。只有第一步已经较稳定时才增加；尚未稳定就多停留几周，不必追赶日历。",
        "habit": "读完后自问并回答",
        "period": "第5–8周"
      },
      {
        "title": "步骤 3 · 用数字记录运动",
        "description": "增加第三个习惯，开始逐渐减少对旧习惯的提醒。结束时每个习惯已重复多周，但许多孩子需要更久：继续按孩子的节奏，等全家觉得稳妥时再进入下一年龄阶段。",
        "habit": "运动60分钟，记录一个进步数字",
        "period": "第9–12周"
      },
      {
        "title": "步骤 1 · 睡得充足，头脑轻松",
        "description": "第一步只增加一个新习惯。前两周和孩子一起做，保持固定提示（同一时间、同一地点）；后两周让孩子多做一些、减少提醒。每周结束时花几分钟回顾。漏做一天就继续，连续漏做多天则把任务缩小。",
        "habit": "按时睡觉，睡前不用屏幕",
        "period": "第1–4周"
      },
      {
        "title": "步骤 2 · 自己的规则",
        "description": "保留第一步的习惯，再增加一个新习惯。只有第一步已经较稳定时才增加；尚未稳定就多停留几周，不必追赶日历。",
        "habit": "遵守自己制定的三条规则",
        "period": "第5–8周"
      },
      {
        "title": "步骤 3 · 自主学习",
        "description": "增加第三个习惯，开始逐渐减少对旧习惯的提醒。结束时每个习惯已重复多周，但许多孩子需要更久：继续按孩子的节奏，等全家觉得稳妥时再进入下一年龄阶段。",
        "habit": "规划每周学习，自我评估并承担结果",
        "period": "第9–12周"
      },
      {
        "title": "步骤 1 · 我想成为什么样的人",
        "description": "第一步只增加一个新习惯。前两周和孩子一起做，保持固定提示（同一时间、同一地点）；后两周让孩子多做一些、减少提醒。每周结束时花几分钟回顾。漏做一天就继续，连续漏做多天则把任务缩小。",
        "habit": "每周重写并重读自己的宣言",
        "period": "第1–4周"
      },
      {
        "title": "步骤 2 · 健康身体",
        "description": "保留第一步的习惯，再增加一个新习惯。只有第一步已经较稳定时才增加；尚未稳定就多停留几周，不必追赶日历。",
        "habit": "按每周计划运动、饮食与休息",
        "period": "第5–8周"
      },
      {
        "title": "步骤 3 · 尝试职业",
        "description": "增加第三个习惯，开始逐渐减少对旧习惯的提醒。结束时每个习惯已重复多周，但许多孩子需要更久：继续按孩子的节奏，等全家觉得稳妥时再进入下一年龄阶段。",
        "habit": "探索一个职业领域：了解、体验、记录",
        "period": "第9–12周"
      }
    ]
  },
  "ja": {
    "eyebrow": "無理のないペースで始める",
    "title": "年齢別プラン、各ステップで増やす習慣は1つだけ",
    "description": "各年齢段階に、3ステップからなる約12週間のプランがあります。前の習慣を続けながら新しい習慣を1つだけ加え、滞在期間は子どものペースで決めます。習慣形成には個人差があり、週数は目安であって期限ではありません。",
    "newHabits": "このステップの新しい習慣",
    "age": "歳",
    "stages": [
      {
        "title": "安心と感覚",
        "adultRole": "親が手本を見せて説明する"
      },
      {
        "title": "探究と意志",
        "adultRole": "親が一緒に取り組み、優しく声をかける"
      },
      {
        "title": "努力と技能",
        "adultRole": "親が見守り、一緒に取り組む"
      },
      {
        "title": "自己認識と感情",
        "adultRole": "親が寄り添い、共通のルールを守る"
      },
      {
        "title": "方向性と責任",
        "adultRole": "親が助言し、支える"
      }
    ],
    "plans": [
      {
        "title": "ステップ 1 · 穏やかな生活とよい睡眠",
        "description": "最初のステップでは新しい習慣を1つだけ加えます。最初の2週間は一緒に行い、同じ時間・場所の合図を保ちます。次の2週間は子どもが行う部分を増やし、声かけを減らします。週末に数分振り返りましょう。1日忘れても続け、何日も続いたらミッションを小さくします。",
        "habit": "毎晩同じ時間に寝る前の習慣を行う",
        "period": "1〜4週目"
      },
      {
        "title": "ステップ 2 · 毎日応えてもらう",
        "description": "ステップ1の習慣を保ちながら、新しく1つだけ加えます。最初の習慣がほぼ安定してから追加し、まだなら数週間長く続けましょう。予定に追いつく必要はありません。",
        "habit": "子どもが声を出したら、見る・待つ・応える",
        "period": "5〜8週目"
      },
      {
        "title": "ステップ 3 · 本と遊び",
        "description": "3つ目の習慣を加え、前の習慣への声かけを徐々に減らします。終了時にはそれぞれ何週間も繰り返していますが、多くの子どもはさらに時間が必要です。子どものペースを守り、家族全員が安定したと感じてから次の年齢段階へ進みましょう。",
        "habit": "毎日1冊の本と1つの物語",
        "period": "9〜12週目"
      },
      {
        "title": "ステップ 1 · 穏やかな気持ち",
        "description": "最初のステップでは新しい習慣を1つだけ加えます。最初の2週間は一緒に行い、同じ時間・場所の合図を保ちます。次の2週間は子どもが行う部分を増やし、声かけを減らします。週末に数分振り返りましょう。1日忘れても続け、何日も続いたらミッションを小さくします。",
        "habit": "毎晩「今、私は…と感じる」と気持ちを言葉にする",
        "period": "1〜4週目"
      },
      {
        "title": "ステップ 2 · 睡眠と画面",
        "description": "ステップ1の習慣を保ちながら、新しく1つだけ加えます。最初の習慣がほぼ安定してから追加し、まだなら数週間長く続けましょう。予定に追いつく必要はありません。",
        "habit": "画面は自分より先におやすみ",
        "period": "5〜8週目"
      },
      {
        "title": "ステップ 3 · 自分の家事",
        "description": "3つ目の習慣を加え、前の習慣への声かけを徐々に減らします。終了時にはそれぞれ何週間も繰り返していますが、多くの子どもはさらに時間が必要です。子どものペースを守り、家族全員が安定したと感じてから次の年齢段階へ進みましょう。",
        "habit": "毎日、自分の小さな家事を1つ",
        "period": "9〜12週目"
      },
      {
        "title": "ステップ 1 · 夜の感謝",
        "description": "最初のステップでは新しい習慣を1つだけ加えます。最初の2週間は一緒に行い、同じ時間・場所の合図を保ちます。次の2週間は子どもが行う部分を増やし、声かけを減らします。週末に数分振り返りましょう。1日忘れても続け、何日も続いたらミッションを小さくします。",
        "habit": "毎晩、感謝することと上手にできたことを1つずつ",
        "period": "1〜4週目"
      },
      {
        "title": "ステップ 2 · 方法を工夫して学ぶ",
        "description": "ステップ1の習慣を保ちながら、新しく1つだけ加えます。最初の習慣がほぼ安定してから追加し、まだなら数週間長く続けましょう。予定に追いつく必要はありません。",
        "habit": "読んだ後に自分で質問し、答える",
        "period": "5〜8週目"
      },
      {
        "title": "ステップ 3 · 数字で見る運動",
        "description": "3つ目の習慣を加え、前の習慣への声かけを徐々に減らします。終了時にはそれぞれ何週間も繰り返していますが、多くの子どもはさらに時間が必要です。子どものペースを守り、家族全員が安定したと感じてから次の年齢段階へ進みましょう。",
        "habit": "60分動き、進歩する数字を1つ記録する",
        "period": "9〜12週目"
      },
      {
        "title": "ステップ 1 · 十分な睡眠、すっきりした頭",
        "description": "最初のステップでは新しい習慣を1つだけ加えます。最初の2週間は一緒に行い、同じ時間・場所の合図を保ちます。次の2週間は子どもが行う部分を増やし、声かけを減らします。週末に数分振り返りましょう。1日忘れても続け、何日も続いたらミッションを小さくします。",
        "habit": "時間どおりに寝て、寝る前に画面を見ない",
        "period": "1〜4週目"
      },
      {
        "title": "ステップ 2 · 自分のルール",
        "description": "ステップ1の習慣を保ちながら、新しく1つだけ加えます。最初の習慣がほぼ安定してから追加し、まだなら数週間長く続けましょう。予定に追いつく必要はありません。",
        "habit": "自分で決めた3つのルールを守る",
        "period": "5〜8週目"
      },
      {
        "title": "ステップ 3 · 主体的な学習",
        "description": "3つ目の習慣を加え、前の習慣への声かけを徐々に減らします。終了時にはそれぞれ何週間も繰り返していますが、多くの子どもはさらに時間が必要です。子どものペースを守り、家族全員が安定したと感じてから次の年齢段階へ進みましょう。",
        "habit": "週の学習を計画し、自己評価して結果に責任を持つ",
        "period": "9〜12週目"
      },
      {
        "title": "ステップ 1 · なりたい自分",
        "description": "最初のステップでは新しい習慣を1つだけ加えます。最初の2週間は一緒に行い、同じ時間・場所の合図を保ちます。次の2週間は子どもが行う部分を増やし、声かけを減らします。週末に数分振り返りましょう。1日忘れても続け、何日も続いたらミッションを小さくします。",
        "habit": "毎週、自分の宣言を書き直して読み返す",
        "period": "1〜4週目"
      },
      {
        "title": "ステップ 2 · 健康な体",
        "description": "ステップ1の習慣を保ちながら、新しく1つだけ加えます。最初の習慣がほぼ安定してから追加し、まだなら数週間長く続けましょう。予定に追いつく必要はありません。",
        "habit": "週の予定に沿って運動・食事・休養をとる",
        "period": "5〜8週目"
      },
      {
        "title": "ステップ 3 · 仕事を試す",
        "description": "3つ目の習慣を加え、前の習慣への声かけを徐々に減らします。終了時にはそれぞれ何週間も繰り返していますが、多くの子どもはさらに時間が必要です。子どものペースを守り、家族全員が安定したと感じてから次の年齢段階へ進みましょう。",
        "habit": "職業分野を1つ試す：調べ、体験し、記録する",
        "period": "9〜12週目"
      }
    ]
  },
  "ko": {
    "eyebrow": "무리 없는 속도로 시작",
    "title": "연령별 과정, 단계마다 습관 하나씩 추가",
    "description": "각 연령대에는 세 단계로 구성된 약 12주 과정이 있습니다. 이전 습관은 유지하고 새 습관을 하나씩만 추가하며, 머무는 기간은 아이의 속도에 맞춥니다. 습관 형성 시간은 개인마다 다르므로 주차는 제안이며 마감이 아닙니다.",
    "newHabits": "이번 단계의 새 습관",
    "age": "세",
    "stages": [
      {
        "title": "안전과 감각",
        "adultRole": "부모가 보여 주고 설명합니다"
      },
      {
        "title": "탐색과 의지",
        "adultRole": "부모가 함께하고 부드럽게 알려 줍니다"
      },
      {
        "title": "노력과 기술",
        "adultRole": "부모가 살피고 함께합니다"
      },
      {
        "title": "정체성과 감정",
        "adultRole": "부모가 동행하며 공동 규칙도 지킵니다"
      },
      {
        "title": "방향과 책임",
        "adultRole": "부모가 조언하고 뒷받침합니다"
      }
    ],
    "plans": [
      {
        "title": "단계 1 · 평온한 일과와 좋은 잠",
        "description": "첫 단계에서는 새 습관을 하나만 추가합니다. 처음 두 주는 함께하며 같은 시간과 장소의 신호를 유지하고, 다음 두 주는 아이가 더 많이 하도록 알림을 줄입니다. 매주 말 몇 분 동안 돌아보세요. 하루 빠뜨리면 계속하고, 여러 날 연속 빠뜨리면 미션을 줄입니다.",
        "habit": "매일 저녁 같은 시간에 잠자리 의식 하기",
        "period": "1–4주차"
      },
      {
        "title": "단계 2 · 매일 응답받기",
        "description": "1단계 습관을 유지하고 새 습관을 하나만 추가합니다. 1단계가 꽤 꾸준해진 뒤에만 추가하고, 아직이면 몇 주 더 머무르세요. 달력을 따라잡을 필요는 없습니다.",
        "habit": "아이가 소리를 내면 바라보고 기다리고 답하기",
        "period": "5–8주차"
      },
      {
        "title": "단계 3 · 책과 놀이",
        "description": "세 번째 습관을 추가하고 이전 습관의 알림을 서서히 줄입니다. 끝날 때 각 습관은 여러 주 반복되었지만 많은 아이는 더 오래 걸립니다. 아이의 속도를 지키고 가족 모두가 안정되었다고 느낄 때 다음 연령대로 이동하세요.",
        "habit": "매일 책 한 권과 이야기 하나",
        "period": "9–12주차"
      },
      {
        "title": "단계 1 · 차분한 감정",
        "description": "첫 단계에서는 새 습관을 하나만 추가합니다. 처음 두 주는 함께하며 같은 시간과 장소의 신호를 유지하고, 다음 두 주는 아이가 더 많이 하도록 알림을 줄입니다. 매주 말 몇 분 동안 돌아보세요. 하루 빠뜨리면 계속하고, 여러 날 연속 빠뜨리면 미션을 줄입니다.",
        "habit": "매일 저녁 “나는 지금… 느껴”라고 감정 이름 붙이기",
        "period": "1–4주차"
      },
      {
        "title": "단계 2 · 수면과 화면",
        "description": "1단계 습관을 유지하고 새 습관을 하나만 추가합니다. 1단계가 꽤 꾸준해진 뒤에만 추가하고, 아직이면 몇 주 더 머무르세요. 달력을 따라잡을 필요는 없습니다.",
        "habit": "화면은 나보다 먼저 잠들기",
        "period": "5–8주차"
      },
      {
        "title": "단계 3 · 나의 집안일",
        "description": "세 번째 습관을 추가하고 이전 습관의 알림을 서서히 줄입니다. 끝날 때 각 습관은 여러 주 반복되었지만 많은 아이는 더 오래 걸립니다. 아이의 속도를 지키고 가족 모두가 안정되었다고 느낄 때 다음 연령대로 이동하세요.",
        "habit": "매일 나만의 작은 집안일 하나",
        "period": "9–12주차"
      },
      {
        "title": "단계 1 · 저녁마다 감사",
        "description": "첫 단계에서는 새 습관을 하나만 추가합니다. 처음 두 주는 함께하며 같은 시간과 장소의 신호를 유지하고, 다음 두 주는 아이가 더 많이 하도록 알림을 줄입니다. 매주 말 몇 분 동안 돌아보세요. 하루 빠뜨리면 계속하고, 여러 날 연속 빠뜨리면 미션을 줄입니다.",
        "habit": "매일 저녁 감사한 일 하나와 잘한 일 하나",
        "period": "1–4주차"
      },
      {
        "title": "단계 2 · 방법 있는 학습",
        "description": "1단계 습관을 유지하고 새 습관을 하나만 추가합니다. 1단계가 꽤 꾸준해진 뒤에만 추가하고, 아직이면 몇 주 더 머무르세요. 달력을 따라잡을 필요는 없습니다.",
        "habit": "읽은 뒤 스스로 질문하고 답하기",
        "period": "5–8주차"
      },
      {
        "title": "단계 3 · 숫자로 보는 운동",
        "description": "세 번째 습관을 추가하고 이전 습관의 알림을 서서히 줄입니다. 끝날 때 각 습관은 여러 주 반복되었지만 많은 아이는 더 오래 걸립니다. 아이의 속도를 지키고 가족 모두가 안정되었다고 느낄 때 다음 연령대로 이동하세요.",
        "habit": "60분 움직이고 발전하는 숫자 하나 기록하기",
        "period": "9–12주차"
      },
      {
        "title": "단계 1 · 충분한 잠, 가벼운 머리",
        "description": "첫 단계에서는 새 습관을 하나만 추가합니다. 처음 두 주는 함께하며 같은 시간과 장소의 신호를 유지하고, 다음 두 주는 아이가 더 많이 하도록 알림을 줄입니다. 매주 말 몇 분 동안 돌아보세요. 하루 빠뜨리면 계속하고, 여러 날 연속 빠뜨리면 미션을 줄입니다.",
        "habit": "제시간에 잠들고 잠들기 전 화면 안 보기",
        "period": "1–4주차"
      },
      {
        "title": "단계 2 · 나만의 규칙",
        "description": "1단계 습관을 유지하고 새 습관을 하나만 추가합니다. 1단계가 꽤 꾸준해진 뒤에만 추가하고, 아직이면 몇 주 더 머무르세요. 달력을 따라잡을 필요는 없습니다.",
        "habit": "스스로 정한 세 가지 규칙 지키기",
        "period": "5–8주차"
      },
      {
        "title": "단계 3 · 자율 학습",
        "description": "세 번째 습관을 추가하고 이전 습관의 알림을 서서히 줄입니다. 끝날 때 각 습관은 여러 주 반복되었지만 많은 아이는 더 오래 걸립니다. 아이의 속도를 지키고 가족 모두가 안정되었다고 느낄 때 다음 연령대로 이동하세요.",
        "habit": "한 주 학습 계획, 자기 평가와 결과 책임지기",
        "period": "9–12주차"
      },
      {
        "title": "단계 1 · 내가 되고 싶은 사람",
        "description": "첫 단계에서는 새 습관을 하나만 추가합니다. 처음 두 주는 함께하며 같은 시간과 장소의 신호를 유지하고, 다음 두 주는 아이가 더 많이 하도록 알림을 줄입니다. 매주 말 몇 분 동안 돌아보세요. 하루 빠뜨리면 계속하고, 여러 날 연속 빠뜨리면 미션을 줄입니다.",
        "habit": "매주 자신의 선언을 다시 쓰고 읽기",
        "period": "1–4주차"
      },
      {
        "title": "단계 2 · 건강한 몸",
        "description": "1단계 습관을 유지하고 새 습관을 하나만 추가합니다. 1단계가 꽤 꾸준해진 뒤에만 추가하고, 아직이면 몇 주 더 머무르세요. 달력을 따라잡을 필요는 없습니다.",
        "habit": "주간 일정에 따라 운동하고 먹고 쉬기",
        "period": "5–8주차"
      },
      {
        "title": "단계 3 · 직업 체험",
        "description": "세 번째 습관을 추가하고 이전 습관의 알림을 서서히 줄입니다. 끝날 때 각 습관은 여러 주 반복되었지만 많은 아이는 더 오래 걸립니다. 아이의 속도를 지키고 가족 모두가 안정되었다고 느낄 때 다음 연령대로 이동하세요.",
        "habit": "직업 분야 하나를 알아보고 경험하고 기록하기",
        "period": "9–12주차"
      }
    ]
  }
};

export function getPublicRoadmapsCopy(language: Language): PublicRoadmapsCopy {
  return COPY[language];
}
