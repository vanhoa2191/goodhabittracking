import type { Language } from '@/types';

export type PublicFrameworkCopy = {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly givingTitle: string;
  readonly givingDescription: string;
  readonly today: string;
  readonly portraitTitle: string;
  readonly portraitDescription: string;
  readonly categories: Record<'personality' | 'virtue' | 'capacity' | 'vision', string>;
  readonly givings: readonly { readonly name: string; readonly subName: string; readonly meaning: string; readonly dailyPractice: string }[];
  readonly portraits: readonly { readonly name: string; readonly summary: string }[];
};

export const COPY: Record<Language, PublicFrameworkCopy> = {
  "vi": {
    "eyebrow": "Khung nội dung",
    "title": "Từ phẩm chất mong muốn đến hành động nhỏ mỗi ngày",
    "description": "KidHabit Hero sắp xếp gợi ý theo phẩm chất, cách thực hành và giai đoạn tuổi. Đây là công cụ đồng hành cho gia đình, không thay thế tư vấn y tế, tâm lý hoặc giáo dục chuyên môn.",
    "givingTitle": "7 cách trao tặng trong đời sống",
    "givingDescription": "Các hành động dễ quan sát như nụ cười, ánh mắt, lời nói, lòng biết ơn, sự bao dung, giúp đỡ và nhường cơ hội.",
    "today": "Gợi ý hôm nay:",
    "portraitTitle": "16 định hướng phát triển",
    "portraitDescription": "Mỗi định hướng có ví dụ thực hành khác nhau cho các giai đoạn 0–3, 3–6, 6–12 và 12–18 tuổi.",
    "categories": {
      "personality": "Nhân cách",
      "virtue": "Phẩm chất",
      "capacity": "Năng lực",
      "vision": "Tầm nhìn"
    },
    "givings": [
      {
        "name": "Nhan thí",
        "subName": "Bố thí nụ cười",
        "meaning": "Luôn nở nụ cười an vui, tươi tắn và đón nhận người khác với tâm thái hân hoan.",
        "dailyPractice": "Cười tươi chào hỏi ông bà, ba mẹ mỗi sáng thức dậy và khi trở về nhà."
      },
      {
        "name": "Nhãn thí",
        "subName": "Bố thí ánh mắt",
        "meaning": "Ánh mắt chứa đựng sự yêu thương, trân trọng, nhìn thấy điểm sáng và sự chuyển hóa tốt đẹp của con/người khác.",
        "dailyPractice": "Nhìn thẳng vào mắt khi trò chuyện, ghi nhận và khen ngợi sự tiến bộ của bạn bè."
      },
      {
        "name": "Ngôn thí",
        "subName": "Bố thí lời nói",
        "meaning": "Dùng lời ái ngữ mang lại hy vọng, niềm tin, sự khích lệ và khẳng định giá trị.",
        "dailyPractice": "Nói lời cảm ơn, động viên khi bạn gặp khó khăn, không nói lời chê bai tiêu cực."
      },
      {
        "name": "Tâm thí",
        "subName": "Bố thí lòng biết ơn",
        "meaning": "Nuôi dưỡng lòng trân trọng biết ơn sâu sắc đối với vạn vật, con người và những gì mình đang có.",
        "dailyPractice": "Nói lời cảm ơn trước bữa cơm, trân trọng đồ dùng học tập và công sức của cha mẹ."
      },
      {
        "name": "Phòng thí",
        "subName": "Bố thí lòng bao dung",
        "meaning": "Dung lượng trái tim rộng mở, không dán nhãn lỗi lầm, sẵn sàng tha thứ và thấu hiểu.",
        "dailyPractice": "Mỉm cười tha thứ khi bạn lỡ tay làm hỏng đồ, lắng nghe lý do thay vì tức giận."
      },
      {
        "name": "Thân thí",
        "subName": "Bố thí hành động nhân ái",
        "meaning": "Hành động phụng sự, giúp đỡ và chăm sóc người khác bằng bàn tay và sức lực cụ thể.",
        "dailyPractice": "Ôm hôn cha mẹ trước khi ngủ, phụ mẹ dọn mâm cơm, tưới cây, giúp bạn mang cặp sách."
      },
      {
        "name": "Tọa thí",
        "subName": "Bố thí vị trí & cơ hội",
        "meaning": "Nhường nhịn vị trí tốt, chia sẻ cơ hội, chuyển giao tri thức và nâng đỡ người khác cùng tiến bộ.",
        "dailyPractice": "Nhường ghế xe bus/chỗ ngồi cho người lớn, chia sẻ đồ chơi yêu thích cùng bạn."
      }
    ],
    "portraits": [
      {
        "name": "Vui vẻ",
        "summary": "Nhan thí, nụ cười rạng rỡ, tạo không khí hưng phấn và tích cực cho gia đình."
      },
      {
        "name": "Hy vọng",
        "summary": "Ngôn từ ánh sáng, hướng đến tương lai tốt đẹp và khích lệ vượt khó."
      },
      {
        "name": "Niềm tin",
        "summary": "Tin tưởng vào Nhân ánh sáng, nhất quán lời nói và hành động."
      },
      {
        "name": "Trân trọng biết ơn",
        "summary": "Tâm thí, trân quý từng hạt cơm, đồ dùng và mọi nhân duyên trong đời."
      },
      {
        "name": "Yêu thương",
        "summary": "Thân thí, ôm ấp, quan tâm chăm sóc người thân và vạn vật xung quanh."
      },
      {
        "name": "Bao dung",
        "summary": "Phòng thí, không dán nhãn lỗi lầm, tha thứ và mở rộng dung lượng trái tim."
      },
      {
        "name": "Khiêm tốn",
        "summary": "Tọa thí, lắng nghe cầu thị, không kiêu căng, nhường nhịn và học hỏi người khác."
      },
      {
        "name": "Chân thật",
        "summary": "Giữ đúng lời hứa, dũng cảm nhận lỗi, sống thật với giá trị nội tâm ánh sáng."
      },
      {
        "name": "Trí tuệ",
        "summary": "Đọc sách sâu sắc, đặt câu hỏi tại sao, khai mở nhận thức nội tâm."
      },
      {
        "name": "Lễ (Lễ phép & Lẽ phải)",
        "summary": "Đi thưa về gửi, tôn trọng chuẩn mực văn hóa ứng xử, bảo vệ lẽ phải."
      },
      {
        "name": "Nghĩa (Trách nhiệm & Gánh vác)",
        "summary": "Tự giác việc nhà, gánh vác trách nhiệm gia đình và phụng sự xã hội."
      },
      {
        "name": "Trí (Sáng suốt & Tỉnh thức)",
        "summary": "Phân tích vấn đề logic, chọn lọc thông tin lành mạnh, kiểm soát cảm xúc sáng suốt."
      },
      {
        "name": "Tín (Đúng giờ & Giữ lời)",
        "summary": "Đúng giờ, giữ đúng cam kết, thiết lập luật sắt kỷ luật tự thân."
      },
      {
        "name": "Quảng bá",
        "summary": "Nhắc đến điểm tốt của người khác, lan tỏa giá trị tri thức và truyền cảm hứng."
      },
      {
        "name": "Giao tiếp thông thái",
        "summary": "Nhãn thí, lắng nghe thấu cảm không ngắt lời, thuyết trình tự tin và hòa giải."
      },
      {
        "name": "Tầm nhìn & Kiến tạo ước mơ",
        "summary": "Bản đồ cuộc đời, xác lập mục tiêu 5-10 năm, kiên định sứ mệnh lớn lao."
      }
    ]
  },
  "en": {
    "eyebrow": "Content framework",
    "title": "From desired qualities to small daily actions",
    "description": "KidHabit Hero organises suggestions by quality, practice and age stage. It is a tool for families, not a substitute for professional medical, psychological or educational advice.",
    "givingTitle": "7 everyday ways to give",
    "givingDescription": "Observable actions such as smiles, eye contact, words, gratitude, forgiveness, help and sharing opportunities.",
    "today": "Try today:",
    "portraitTitle": "16 directions for growth",
    "portraitDescription": "Each direction offers different practical examples for ages 0–3, 3–6, 6–12 and 12–18.",
    "categories": {
      "personality": "Character",
      "virtue": "Virtue",
      "capacity": "Capability",
      "vision": "Vision"
    },
    "givings": [
      {
        "name": "The gift of a smile",
        "subName": "Giving a smile",
        "meaning": "Offer a joyful, bright smile and welcome others with happiness.",
        "dailyPractice": "Smile warmly to greet grandparents and parents each morning and when coming home."
      },
      {
        "name": "The gift of a gaze",
        "subName": "Giving caring attention",
        "meaning": "Look with love and respect, noticing strengths and positive changes in your child and others.",
        "dailyPractice": "Make eye contact during conversations and recognise and praise friends’ progress."
      },
      {
        "name": "The gift of words",
        "subName": "Giving kind words",
        "meaning": "Use kind words to offer hope, confidence, encouragement and affirmation of worth.",
        "dailyPractice": "Say thank you, encourage a friend in difficulty and avoid negative criticism."
      },
      {
        "name": "The gift of the heart",
        "subName": "Giving gratitude",
        "meaning": "Cultivate deep appreciation for people, all things and what you already have.",
        "dailyPractice": "Give thanks before meals and value school supplies and your parents’ effort."
      },
      {
        "name": "The gift of tolerance",
        "subName": "Giving forgiveness",
        "meaning": "Keep an open heart, do not label mistakes and be ready to forgive and understand.",
        "dailyPractice": "Smile and forgive when a friend accidentally breaks something; listen to the reason instead of getting angry."
      },
      {
        "name": "The gift of service",
        "subName": "Giving caring actions",
        "meaning": "Serve, help and care for others through practical effort and actions.",
        "dailyPractice": "Hug and kiss parents before bed, help clear the meal, water plants and help a friend carry a schoolbag."
      },
      {
        "name": "The gift of a place",
        "subName": "Giving space and opportunities",
        "meaning": "Yield a good place, share opportunities and knowledge, and support others’ progress.",
        "dailyPractice": "Offer a bus seat or other seat to adults and share favourite toys with friends."
      }
    ],
    "portraits": [
      {
        "name": "Joy",
        "summary": "Give a radiant smile and create an upbeat, positive family atmosphere."
      },
      {
        "name": "Hope",
        "summary": "Use uplifting words, look towards a better future and encourage perseverance."
      },
      {
        "name": "Confidence",
        "summary": "Trust in the good within people and keep words and actions consistent."
      },
      {
        "name": "Gratitude",
        "summary": "Give gratitude, valuing each grain of rice, belongings and every connection in life."
      },
      {
        "name": "Love",
        "summary": "Give caring actions, hugs and attention to loved ones and the world around you."
      },
      {
        "name": "Forgiveness",
        "summary": "Offer forgiveness without labelling mistakes, and open your heart."
      },
      {
        "name": "Humility",
        "summary": "Share space, listen with an open mind, avoid arrogance and learn from others."
      },
      {
        "name": "Honesty",
        "summary": "Keep promises, admit mistakes bravely and live true to positive inner values."
      },
      {
        "name": "Wisdom",
        "summary": "Read thoughtfully, ask why and deepen inner understanding."
      },
      {
        "name": "Courtesy and fairness",
        "summary": "Greet politely, respect cultural standards of conduct and defend what is right."
      },
      {
        "name": "Responsibility",
        "summary": "Take initiative with chores, carry family responsibilities and serve society."
      },
      {
        "name": "Discernment",
        "summary": "Analyse problems logically, select healthy information and manage emotions with clarity."
      },
      {
        "name": "Reliability",
        "summary": "Be punctual, honour commitments and establish firm personal discipline."
      },
      {
        "name": "Positive advocacy",
        "summary": "Mention others’ strengths, share valuable knowledge and inspire."
      },
      {
        "name": "Wise communication",
        "summary": "Offer attentive eye contact, listen empathetically without interrupting, present confidently and reconcile."
      },
      {
        "name": "Vision and dreams",
        "summary": "Map your life, set goals for 5-10 years and remain committed to a meaningful mission."
      }
    ]
  },
  "fr": {
    "eyebrow": "Cadre de contenu",
    "title": "Des qualités souhaitées aux petits gestes quotidiens",
    "description": "KidHabit Hero organise ses suggestions par qualité, pratique et âge. Cet outil familial ne remplace pas les conseils professionnels médicaux, psychologiques ou éducatifs.",
    "givingTitle": "7 façons de donner au quotidien",
    "givingDescription": "Des gestes observables : sourire, regard, paroles, gratitude, indulgence, aide et partage des occasions.",
    "today": "À essayer aujourd’hui :",
    "portraitTitle": "16 axes de développement",
    "portraitDescription": "Chaque axe propose des exemples adaptés aux âges 0–3, 3–6, 6–12 et 12–18 ans.",
    "categories": {
      "personality": "Caractère",
      "virtue": "Vertu",
      "capacity": "Compétence",
      "vision": "Vision"
    },
    "givings": [
      {
        "name": "Le don du sourire",
        "subName": "Offrir un sourire",
        "meaning": "Sourire avec joie et accueillir les autres avec enthousiasme.",
        "dailyPractice": "Sourire pour saluer les grands-parents et les parents le matin et au retour à la maison."
      },
      {
        "name": "Le don du regard",
        "subName": "Offrir un regard bienveillant",
        "meaning": "Regarder avec amour et respect, reconnaître les qualités et les changements positifs de l’enfant et des autres.",
        "dailyPractice": "Regarder dans les yeux en parlant et reconnaître et féliciter les progrès des amis."
      },
      {
        "name": "Le don des paroles",
        "subName": "Offrir des mots bienveillants",
        "meaning": "Employer des paroles douces qui apportent espoir, confiance, encouragement et reconnaissance de la valeur.",
        "dailyPractice": "Remercier, encourager un ami en difficulté et éviter les critiques négatives."
      },
      {
        "name": "Le don du cœur",
        "subName": "Offrir de la gratitude",
        "meaning": "Cultiver une profonde reconnaissance envers les personnes, toute chose et ce que l’on possède.",
        "dailyPractice": "Remercier avant les repas et apprécier le matériel scolaire et les efforts des parents."
      },
      {
        "name": "Le don de l’indulgence",
        "subName": "Offrir le pardon",
        "meaning": "Garder un cœur ouvert, ne pas étiqueter les erreurs, être prêt à pardonner et comprendre.",
        "dailyPractice": "Sourire et pardonner lorsqu’un ami casse quelque chose par accident ; écouter au lieu de se fâcher."
      },
      {
        "name": "Le don du service",
        "subName": "Offrir des gestes attentionnés",
        "meaning": "Servir, aider et prendre soin des autres par des gestes et des efforts concrets.",
        "dailyPractice": "Embrasser les parents avant de dormir, aider à débarrasser, arroser les plantes et porter le cartable d’un ami."
      },
      {
        "name": "Le don de la place",
        "subName": "Offrir une place et des occasions",
        "meaning": "Céder une bonne place, partager les occasions et les savoirs et soutenir les progrès des autres.",
        "dailyPractice": "Céder un siège dans le bus ou ailleurs aux adultes et partager ses jouets préférés avec ses amis."
      }
    ],
    "portraits": [
      {
        "name": "Joie",
        "summary": "Offrir un sourire rayonnant et une atmosphère familiale enthousiaste et positive."
      },
      {
        "name": "Espoir",
        "summary": "Parler avec optimisme, viser un avenir meilleur et encourager face aux difficultés."
      },
      {
        "name": "Confiance",
        "summary": "Croire au bon en chacun et rester cohérent entre paroles et actes."
      },
      {
        "name": "Gratitude",
        "summary": "Exprimer sa gratitude, apprécier chaque grain de riz, les objets et les liens de la vie."
      },
      {
        "name": "Amour",
        "summary": "Agir avec affection, étreindre et prendre soin des proches et du monde alentour."
      },
      {
        "name": "Pardon",
        "summary": "Pardonner sans étiqueter les erreurs et ouvrir son cœur."
      },
      {
        "name": "Humilité",
        "summary": "Partager sa place, écouter avec ouverture, éviter l’orgueil et apprendre des autres."
      },
      {
        "name": "Honnêteté",
        "summary": "Tenir ses promesses, reconnaître courageusement ses erreurs et vivre ses valeurs intérieures positives."
      },
      {
        "name": "Sagesse",
        "summary": "Lire avec profondeur, demander pourquoi et approfondir sa compréhension intérieure."
      },
      {
        "name": "Politesse et justice",
        "summary": "Saluer poliment, respecter les codes culturels et défendre ce qui est juste."
      },
      {
        "name": "Responsabilité",
        "summary": "Prendre en charge les tâches, les responsabilités familiales et le service à la société."
      },
      {
        "name": "Discernement",
        "summary": "Analyser logiquement, choisir une information saine et gérer ses émotions avec discernement."
      },
      {
        "name": "Fiabilité",
        "summary": "Être ponctuel, tenir ses engagements et établir une discipline personnelle ferme."
      },
      {
        "name": "Valorisation positive",
        "summary": "Valoriser les qualités des autres, partager les connaissances et inspirer."
      },
      {
        "name": "Communication éclairée",
        "summary": "Offrir un regard attentif, écouter sans interrompre, présenter avec assurance et réconcilier."
      },
      {
        "name": "Vision et rêves",
        "summary": "Tracer son chemin, fixer des objectifs à 5-10 ans et rester fidèle à une mission porteuse de sens."
      }
    ]
  },
  "de": {
    "eyebrow": "Inhaltlicher Rahmen",
    "title": "Von gewünschten Eigenschaften zu kleinen täglichen Handlungen",
    "description": "KidHabit Hero ordnet Anregungen nach Eigenschaften, Übungen und Altersstufen. Es begleitet Familien und ersetzt keine professionelle medizinische, psychologische oder pädagogische Beratung.",
    "givingTitle": "7 Wege, im Alltag zu geben",
    "givingDescription": "Beobachtbare Handlungen wie Lächeln, Blickkontakt, Worte, Dankbarkeit, Nachsicht, Hilfe und das Teilen von Chancen.",
    "today": "Anregung für heute:",
    "portraitTitle": "16 Entwicklungsrichtungen",
    "portraitDescription": "Jede Richtung bietet unterschiedliche Übungen für die Altersstufen 0–3, 3–6, 6–12 und 12–18 Jahre.",
    "categories": {
      "personality": "Charakter",
      "virtue": "Tugend",
      "capacity": "Fähigkeit",
      "vision": "Vision"
    },
    "givings": [
      {
        "name": "Das Geschenk des Lächelns",
        "subName": "Ein Lächeln schenken",
        "meaning": "Freudig und offen lächeln und andere herzlich willkommen heißen.",
        "dailyPractice": "Großeltern und Eltern morgens und bei der Heimkehr mit einem Lächeln begrüßen."
      },
      {
        "name": "Das Geschenk des Blicks",
        "subName": "Aufmerksamkeit schenken",
        "meaning": "Liebevoll und respektvoll schauen und Stärken sowie positive Veränderungen beim Kind und bei anderen sehen.",
        "dailyPractice": "Beim Gespräch Blickkontakt halten und Fortschritte von Freunden anerkennen und loben."
      },
      {
        "name": "Das Geschenk der Worte",
        "subName": "Freundliche Worte schenken",
        "meaning": "Mit freundlichen Worten Hoffnung, Vertrauen, Ermutigung und Wertschätzung vermitteln.",
        "dailyPractice": "Danke sagen, Freunde in Schwierigkeiten ermutigen und negative Kritik vermeiden."
      },
      {
        "name": "Das Geschenk des Herzens",
        "subName": "Dankbarkeit schenken",
        "meaning": "Tiefe Wertschätzung für Menschen, alle Dinge und das Vorhandene pflegen.",
        "dailyPractice": "Vor dem Essen danken und Schulmaterial sowie die Mühe der Eltern schätzen."
      },
      {
        "name": "Das Geschenk der Nachsicht",
        "subName": "Vergebung schenken",
        "meaning": "Das Herz offen halten, Fehler nicht mit Etiketten versehen und zum Vergeben und Verstehen bereit sein.",
        "dailyPractice": "Lächeln und verzeihen, wenn ein Freund versehentlich etwas beschädigt; zuhören statt wütend werden."
      },
      {
        "name": "Das Geschenk des Dienstes",
        "subName": "Fürsorgliche Handlungen schenken",
        "meaning": "Anderen mit konkreten Handlungen und eigener Kraft dienen, helfen und sie umsorgen.",
        "dailyPractice": "Eltern vor dem Schlafen umarmen und küssen, beim Abräumen helfen, Pflanzen gießen und Freunden die Schultasche tragen helfen."
      },
      {
        "name": "Das Geschenk des Platzes",
        "subName": "Platz und Chancen schenken",
        "meaning": "Einen guten Platz abgeben, Chancen und Wissen teilen und andere in ihrer Entwicklung unterstützen.",
        "dailyPractice": "Erwachsenen einen Sitzplatz im Bus oder anderswo anbieten und Lieblingsspielzeug mit Freunden teilen."
      }
    ],
    "portraits": [
      {
        "name": "Freude",
        "summary": "Ein strahlendes Lächeln schenken und eine lebendige, positive Familienatmosphäre schaffen."
      },
      {
        "name": "Hoffnung",
        "summary": "Aufbauende Worte nutzen, auf eine gute Zukunft blicken und zum Durchhalten ermutigen."
      },
      {
        "name": "Vertrauen",
        "summary": "An das Gute in Menschen glauben und Worte und Handlungen in Einklang halten."
      },
      {
        "name": "Dankbarkeit",
        "summary": "Dankbarkeit schenken und jedes Reiskorn, Gegenstände und Begegnungen im Leben schätzen."
      },
      {
        "name": "Liebe",
        "summary": "Mit liebevollen Handlungen, Umarmungen und Fürsorge für Angehörige und die Umgebung geben."
      },
      {
        "name": "Nachsicht",
        "summary": "Vergeben, Fehler nicht mit Etiketten versehen und das Herz öffnen."
      },
      {
        "name": "Bescheidenheit",
        "summary": "Platz teilen, offen zuhören, Hochmut vermeiden und von anderen lernen."
      },
      {
        "name": "Ehrlichkeit",
        "summary": "Versprechen halten, Fehler mutig eingestehen und positive innere Werte leben."
      },
      {
        "name": "Weisheit",
        "summary": "Gründlich lesen, nach dem Warum fragen und inneres Verständnis vertiefen."
      },
      {
        "name": "Höflichkeit und Gerechtigkeit",
        "summary": "Höflich grüßen, kulturelle Umgangsformen achten und für das Richtige eintreten."
      },
      {
        "name": "Verantwortung",
        "summary": "Hausarbeit selbst übernehmen, Familienverantwortung tragen und der Gesellschaft dienen."
      },
      {
        "name": "Urteilsvermögen",
        "summary": "Probleme logisch analysieren, hilfreiche Informationen auswählen und Gefühle klar steuern."
      },
      {
        "name": "Verlässlichkeit",
        "summary": "Pünktlich sein, Zusagen einhalten und feste Selbstdisziplin entwickeln."
      },
      {
        "name": "Positive Fürsprache",
        "summary": "Stärken anderer nennen, wertvolles Wissen teilen und inspirieren."
      },
      {
        "name": "Weise Kommunikation",
        "summary": "Aufmerksamen Blickkontakt schenken, einfühlsam ohne Unterbrechung zuhören, sicher vortragen und vermitteln."
      },
      {
        "name": "Vision und Träume",
        "summary": "Den Lebensweg planen, Ziele für 5-10 Jahre setzen und einer bedeutenden Aufgabe treu bleiben."
      }
    ]
  },
  "it": {
    "eyebrow": "Quadro dei contenuti",
    "title": "Dalle qualità desiderate alle piccole azioni quotidiane",
    "description": "KidHabit Hero organizza i suggerimenti per qualità, pratica e fascia d’età. È uno strumento per le famiglie, non sostituisce consulenze mediche, psicologiche o educative professionali.",
    "givingTitle": "7 modi di donare nella vita quotidiana",
    "givingDescription": "Azioni osservabili come sorrisi, sguardi, parole, gratitudine, comprensione, aiuto e condivisione delle opportunità.",
    "today": "Prova oggi:",
    "portraitTitle": "16 direzioni di crescita",
    "portraitDescription": "Ogni direzione offre esempi diversi per le fasce 0–3, 3–6, 6–12 e 12–18 anni.",
    "categories": {
      "personality": "Carattere",
      "virtue": "Virtù",
      "capacity": "Capacità",
      "vision": "Visione"
    },
    "givings": [
      {
        "name": "Il dono del sorriso",
        "subName": "Donare un sorriso",
        "meaning": "Sorridere con gioia e accogliere gli altri con entusiasmo.",
        "dailyPractice": "Salutare sorridendo nonni e genitori ogni mattina e al ritorno a casa."
      },
      {
        "name": "Il dono dello sguardo",
        "subName": "Donare attenzione",
        "meaning": "Guardare con amore e rispetto, notando qualità e cambiamenti positivi del bambino e degli altri.",
        "dailyPractice": "Guardare negli occhi durante le conversazioni e riconoscere e lodare i progressi degli amici."
      },
      {
        "name": "Il dono delle parole",
        "subName": "Donare parole gentili",
        "meaning": "Usare parole gentili che offrano speranza, fiducia, incoraggiamento e riconoscimento del valore.",
        "dailyPractice": "Ringraziare, incoraggiare un amico in difficoltà ed evitare critiche negative."
      },
      {
        "name": "Il dono del cuore",
        "subName": "Donare gratitudine",
        "meaning": "Coltivare profonda riconoscenza verso le persone, ogni cosa e ciò che si possiede.",
        "dailyPractice": "Ringraziare prima dei pasti e apprezzare il materiale scolastico e l’impegno dei genitori."
      },
      {
        "name": "Il dono della comprensione",
        "subName": "Donare perdono",
        "meaning": "Tenere il cuore aperto, non etichettare gli errori ed essere pronti a perdonare e capire.",
        "dailyPractice": "Sorridere e perdonare un amico che rompe qualcosa per sbaglio; ascoltare il motivo invece di arrabbiarsi."
      },
      {
        "name": "Il dono del servizio",
        "subName": "Donare gesti premurosi",
        "meaning": "Servire, aiutare e prendersi cura degli altri con azioni e sforzi concreti.",
        "dailyPractice": "Abbracciare e baciare i genitori prima di dormire, aiutare a sparecchiare, annaffiare e portare lo zaino di un amico."
      },
      {
        "name": "Il dono del posto",
        "subName": "Donare spazio e opportunità",
        "meaning": "Cedere un buon posto, condividere opportunità e conoscenze e sostenere il progresso degli altri.",
        "dailyPractice": "Cedere un posto sull’autobus o altrove agli adulti e condividere i giocattoli preferiti con gli amici."
      }
    ],
    "portraits": [
      {
        "name": "Gioia",
        "summary": "Donare un sorriso luminoso e creare un’atmosfera familiare vivace e positiva."
      },
      {
        "name": "Speranza",
        "summary": "Usare parole luminose, guardare a un futuro migliore e incoraggiare nelle difficoltà."
      },
      {
        "name": "Fiducia",
        "summary": "Credere nel bene delle persone e mantenere coerenza fra parole e azioni."
      },
      {
        "name": "Gratitudine",
        "summary": "Donare gratitudine, apprezzando ogni chicco di riso, gli oggetti e i legami della vita."
      },
      {
        "name": "Amore",
        "summary": "Donare gesti affettuosi, abbracci e cura ai propri cari e al mondo circostante."
      },
      {
        "name": "Perdono",
        "summary": "Perdonare senza etichettare gli errori e aprire il cuore."
      },
      {
        "name": "Umiltà",
        "summary": "Condividere il proprio posto, ascoltare con apertura, evitare l’arroganza e imparare dagli altri."
      },
      {
        "name": "Onestà",
        "summary": "Mantenere le promesse, ammettere con coraggio gli errori e vivere i valori interiori positivi."
      },
      {
        "name": "Saggezza",
        "summary": "Leggere con profondità, chiedere perché e approfondire la comprensione interiore."
      },
      {
        "name": "Cortesia e giustizia",
        "summary": "Salutare con educazione, rispettare le norme culturali e difendere ciò che è giusto."
      },
      {
        "name": "Responsabilità",
        "summary": "Svolgere spontaneamente i lavori domestici, assumere responsabilità familiari e servire la società."
      },
      {
        "name": "Discernimento",
        "summary": "Analizzare logicamente i problemi, scegliere informazioni sane e gestire le emozioni con lucidità."
      },
      {
        "name": "Affidabilità",
        "summary": "Essere puntuali, rispettare gli impegni e stabilire una ferma disciplina personale."
      },
      {
        "name": "Valorizzazione positiva",
        "summary": "Valorizzare i pregi altrui, condividere conoscenze utili e ispirare."
      },
      {
        "name": "Comunicazione saggia",
        "summary": "Offrire uno sguardo attento, ascoltare con empatia senza interrompere, parlare con sicurezza e mediare."
      },
      {
        "name": "Visione e sogni",
        "summary": "Disegnare il proprio percorso, fissare obiettivi a 5-10 anni e restare fedeli a una missione significativa."
      }
    ]
  },
  "es": {
    "eyebrow": "Marco de contenidos",
    "title": "De las cualidades deseadas a pequeñas acciones diarias",
    "description": "KidHabit Hero organiza sugerencias por cualidad, práctica y edad. Es una herramienta familiar y no sustituye el asesoramiento médico, psicológico o educativo profesional.",
    "givingTitle": "7 formas de dar en la vida diaria",
    "givingDescription": "Acciones observables como sonreír, mirar, hablar, agradecer, comprender, ayudar y compartir oportunidades.",
    "today": "Prueba hoy:",
    "portraitTitle": "16 orientaciones de desarrollo",
    "portraitDescription": "Cada orientación ofrece ejemplos distintos para las edades 0–3, 3–6, 6–12 y 12–18 años.",
    "categories": {
      "personality": "Carácter",
      "virtue": "Virtud",
      "capacity": "Capacidad",
      "vision": "Visión"
    },
    "givings": [
      {
        "name": "El regalo de la sonrisa",
        "subName": "Dar una sonrisa",
        "meaning": "Sonreír con alegría y recibir a los demás con entusiasmo.",
        "dailyPractice": "Saludar sonriendo a abuelos y padres cada mañana y al volver a casa."
      },
      {
        "name": "El regalo de la mirada",
        "subName": "Dar atención",
        "meaning": "Mirar con amor y respeto, reconociendo cualidades y cambios positivos del niño y de otras personas.",
        "dailyPractice": "Mirar a los ojos al conversar y reconocer y elogiar los avances de los amigos."
      },
      {
        "name": "El regalo de las palabras",
        "subName": "Dar palabras amables",
        "meaning": "Usar palabras amables que aporten esperanza, confianza, ánimo y reconocimiento del valor.",
        "dailyPractice": "Dar las gracias, animar a un amigo con dificultades y evitar críticas negativas."
      },
      {
        "name": "El regalo del corazón",
        "subName": "Dar gratitud",
        "meaning": "Cultivar un profundo agradecimiento por las personas, todas las cosas y lo que se tiene.",
        "dailyPractice": "Agradecer antes de comer y valorar el material escolar y el esfuerzo de los padres."
      },
      {
        "name": "El regalo de la tolerancia",
        "subName": "Dar perdón",
        "meaning": "Mantener el corazón abierto, no etiquetar los errores y estar dispuesto a perdonar y comprender.",
        "dailyPractice": "Sonreír y perdonar si un amigo rompe algo sin querer; escuchar el motivo en vez de enfadarse."
      },
      {
        "name": "El regalo del servicio",
        "subName": "Dar acciones cariñosas",
        "meaning": "Servir, ayudar y cuidar a otros mediante acciones y esfuerzos concretos.",
        "dailyPractice": "Abrazar y besar a los padres antes de dormir, ayudar a recoger la mesa, regar plantas y llevar la mochila de un amigo."
      },
      {
        "name": "El regalo del lugar",
        "subName": "Dar espacio y oportunidades",
        "meaning": "Ceder un buen lugar, compartir oportunidades y conocimientos y apoyar el progreso de otros.",
        "dailyPractice": "Ceder un asiento del autobús o de otro lugar a adultos y compartir los juguetes preferidos con amigos."
      }
    ],
    "portraits": [
      {
        "name": "Alegría",
        "summary": "Ofrecer una sonrisa radiante y crear un ambiente familiar animado y positivo."
      },
      {
        "name": "Esperanza",
        "summary": "Usar palabras luminosas, mirar a un futuro mejor y animar ante las dificultades."
      },
      {
        "name": "Confianza",
        "summary": "Confiar en lo bueno de las personas y mantener coherencia entre palabras y acciones."
      },
      {
        "name": "Gratitud",
        "summary": "Dar gratitud, valorar cada grano de arroz, los objetos y los vínculos de la vida."
      },
      {
        "name": "Amor",
        "summary": "Dar acciones cariñosas, abrazos y cuidados a los seres queridos y al entorno."
      },
      {
        "name": "Perdón",
        "summary": "Perdonar sin etiquetar los errores y abrir el corazón."
      },
      {
        "name": "Humildad",
        "summary": "Compartir el lugar, escuchar con apertura, evitar la arrogancia y aprender de otros."
      },
      {
        "name": "Honestidad",
        "summary": "Cumplir promesas, admitir errores con valentía y vivir los valores interiores positivos."
      },
      {
        "name": "Sabiduría",
        "summary": "Leer con profundidad, preguntar por qué y ampliar la comprensión interior."
      },
      {
        "name": "Cortesía y justicia",
        "summary": "Saludar con respeto, respetar las normas culturales y defender lo justo."
      },
      {
        "name": "Responsabilidad",
        "summary": "Tomar la iniciativa en casa, asumir responsabilidades familiares y servir a la sociedad."
      },
      {
        "name": "Discernimiento",
        "summary": "Analizar problemas con lógica, elegir información saludable y gestionar emociones con claridad."
      },
      {
        "name": "Fiabilidad",
        "summary": "Ser puntual, cumplir compromisos y establecer una disciplina personal firme."
      },
      {
        "name": "Promoción positiva",
        "summary": "Destacar las virtudes de otros, compartir conocimientos valiosos e inspirar."
      },
      {
        "name": "Comunicación sabia",
        "summary": "Ofrecer una mirada atenta, escuchar con empatía sin interrumpir, exponer con confianza y mediar."
      },
      {
        "name": "Visión y sueños",
        "summary": "Trazar el camino vital, fijar metas a 5-10 años y perseverar en una misión significativa."
      }
    ]
  },
  "zh": {
    "eyebrow": "内容框架",
    "title": "从期望的品质到每天的小行动",
    "description": "KidHabit Hero 按品质、练习方式和年龄阶段整理建议。这是家庭辅助工具，不能替代专业医疗、心理或教育咨询。",
    "givingTitle": "生活中的7种给予方式",
    "givingDescription": "容易观察的行动，例如微笑、目光、言语、感恩、包容、帮助和让出机会。",
    "today": "今天的建议：",
    "portraitTitle": "16个发展方向",
    "portraitDescription": "每个方向为0–3、3–6、6–12和12–18岁提供不同的实践例子。",
    "categories": {
      "personality": "品格",
      "virtue": "美德",
      "capacity": "能力",
      "vision": "愿景"
    },
    "givings": [
      {
        "name": "微笑的给予",
        "subName": "给予笑容",
        "meaning": "常带快乐灿烂的笑容，以欢喜的心态接纳他人。",
        "dailyPractice": "每天起床和回家时，微笑向祖父母和父母问好。"
      },
      {
        "name": "目光的给予",
        "subName": "给予关爱目光",
        "meaning": "目光充满关爱与尊重，看见孩子或他人的优点和积极变化。",
        "dailyPractice": "交谈时看着对方的眼睛，认可并赞扬朋友的进步。"
      },
      {
        "name": "言语的给予",
        "subName": "给予善意的话",
        "meaning": "使用温柔的言语，带来希望、信心、鼓励和价值肯定。",
        "dailyPractice": "说谢谢，在朋友困难时鼓励，避免负面贬低。"
      },
      {
        "name": "心的给予",
        "subName": "给予感恩",
        "meaning": "培养对万物、他人和已有事物的深切珍惜与感恩。",
        "dailyPractice": "饭前表达感谢，珍惜学习用品和父母的付出。"
      },
      {
        "name": "包容的给予",
        "subName": "给予宽容",
        "meaning": "敞开心胸，不给错误贴标签，愿意原谅和理解。",
        "dailyPractice": "朋友不小心弄坏物品时微笑原谅，倾听原因而不是生气。"
      },
      {
        "name": "行动的给予",
        "subName": "给予关爱行动",
        "meaning": "用双手和实际付出服务、帮助和照顾他人。",
        "dailyPractice": "睡前拥抱亲吻父母，帮忙收拾饭桌、浇植物，帮朋友提书包。"
      },
      {
        "name": "位置的给予",
        "subName": "给予位置与机会",
        "meaning": "让出好的位置，分享机会、传递知识，扶持他人共同进步。",
        "dailyPractice": "在公交车上或其他场所给成年人让座，与朋友分享喜欢的玩具。"
      }
    ],
    "portraits": [
      {
        "name": "快乐",
        "summary": "给予灿烂微笑，为家庭营造充满活力的积极氛围。"
      },
      {
        "name": "希望",
        "summary": "使用积极的话语，展望美好未来，鼓励克服困难。"
      },
      {
        "name": "信心",
        "summary": "相信人的善良，让言行保持一致。"
      },
      {
        "name": "感恩",
        "summary": "心怀感恩，珍惜每粒米、物品以及生命中的每段缘分。"
      },
      {
        "name": "关爱",
        "summary": "以行动给予关爱，拥抱、关心亲人与周围万物。"
      },
      {
        "name": "包容",
        "summary": "不因错误贴标签，愿意原谅并敞开心胸。"
      },
      {
        "name": "谦虚",
        "summary": "让出位置，虚心倾听，不骄傲，向他人学习。"
      },
      {
        "name": "诚实",
        "summary": "信守承诺，勇敢认错，忠于内心积极的价值观。"
      },
      {
        "name": "智慧",
        "summary": "深入阅读，追问为什么，增进内在认知。"
      },
      {
        "name": "礼貌与正义",
        "summary": "出入礼貌问候，尊重文化礼仪，维护正义。"
      },
      {
        "name": "责任与担当",
        "summary": "主动做家务，承担家庭责任，服务社会。"
      },
      {
        "name": "明辨与觉察",
        "summary": "逻辑分析问题，筛选健康信息，理智管理情绪。"
      },
      {
        "name": "守时与守信",
        "summary": "守时、履行承诺，建立坚定的自我纪律。"
      },
      {
        "name": "传播价值",
        "summary": "提及他人的优点，传播有价值的知识，启发他人。"
      },
      {
        "name": "智慧沟通",
        "summary": "给予关爱目光，不打断地共情倾听，自信表达，调解冲突。"
      },
      {
        "name": "愿景与梦想",
        "summary": "规划人生，设定5-10年目标，坚持有意义的使命。"
      }
    ]
  },
  "ja": {
    "eyebrow": "コンテンツの枠組み",
    "title": "育みたい資質を、毎日の小さな行動へ",
    "description": "KidHabit Hero は資質・実践方法・年齢段階ごとに提案を整理します。家族を支える道具であり、専門的な医療・心理・教育相談に代わるものではありません。",
    "givingTitle": "日常でできる7つの贈り物",
    "givingDescription": "笑顔、まなざし、言葉、感謝、寛容、手助け、機会を譲ることなど、観察しやすい行動です。",
    "today": "今日の提案：",
    "portraitTitle": "16の成長の方向",
    "portraitDescription": "各方向に0–3、3–6、6–12、12–18歳別の実践例があります。",
    "categories": {
      "personality": "人格",
      "virtue": "徳",
      "capacity": "能力",
      "vision": "ビジョン"
    },
    "givings": [
      {
        "name": "笑顔の贈り物",
        "subName": "笑顔を贈る",
        "meaning": "明るく穏やかな笑顔で、喜んで相手を迎える。",
        "dailyPractice": "毎朝起きたときと帰宅したときに、祖父母や親に笑顔で挨拶する。"
      },
      {
        "name": "まなざしの贈り物",
        "subName": "思いやりの目線を贈る",
        "meaning": "愛情と尊重を込めた目で、子どもや他者のよさと前向きな変化を見る。",
        "dailyPractice": "会話では目を合わせ、友達の進歩を認めてほめる。"
      },
      {
        "name": "言葉の贈り物",
        "subName": "優しい言葉を贈る",
        "meaning": "優しい言葉で希望、信頼、励ましと価値の肯定を届ける。",
        "dailyPractice": "ありがとうを伝え、困っている友達を励まし、否定的な批判を避ける。"
      },
      {
        "name": "心の贈り物",
        "subName": "感謝を贈る",
        "meaning": "人、あらゆるもの、自分が持つものへの深い感謝と敬意を育む。",
        "dailyPractice": "食事の前に感謝し、学用品と親の努力を大切にする。"
      },
      {
        "name": "寛容の贈り物",
        "subName": "許しを贈る",
        "meaning": "心を広く開き、失敗にレッテルを貼らず、許して理解する。",
        "dailyPractice": "友達がうっかり物を壊したら笑顔で許し、怒るより理由を聞く。"
      },
      {
        "name": "行動の贈り物",
        "subName": "思いやりの行動を贈る",
        "meaning": "手と具体的な努力で、他者に尽くし、助け、世話する。",
        "dailyPractice": "寝る前に親を抱きしめてキスし、食卓の片づけや水やりを手伝い、友達のかばんを持つ。"
      },
      {
        "name": "場所の贈り物",
        "subName": "場所と機会を贈る",
        "meaning": "よい場所を譲り、機会や知識を分かち合い、他者の成長を支える。",
        "dailyPractice": "バスなどで大人に席を譲り、好きなおもちゃを友達と分け合う。"
      }
    ],
    "portraits": [
      {
        "name": "喜び",
        "summary": "明るい笑顔を贈り、家族に活気ある前向きな雰囲気をつくる。"
      },
      {
        "name": "希望",
        "summary": "明るい言葉でよりよい未来に目を向け、困難を乗り越える力を励ます。"
      },
      {
        "name": "信頼",
        "summary": "人の中の善を信じ、言葉と行動を一致させる。"
      },
      {
        "name": "感謝",
        "summary": "感謝を贈り、米一粒、持ち物、人生のあらゆる縁を大切にする。"
      },
      {
        "name": "愛情",
        "summary": "愛情ある行動や抱擁で、家族や周囲のものを気にかけ世話する。"
      },
      {
        "name": "寛容",
        "summary": "失敗にレッテルを貼らず、許し、心を広くする。"
      },
      {
        "name": "謙虚さ",
        "summary": "場所を譲り、素直に聞き、傲慢にならず他者から学ぶ。"
      },
      {
        "name": "誠実さ",
        "summary": "約束を守り、勇気をもって失敗を認め、前向きな内面の価値に忠実に生きる。"
      },
      {
        "name": "知恵",
        "summary": "深く読書し、なぜかを問い、内面の理解を広げる。"
      },
      {
        "name": "礼儀と正義",
        "summary": "出入りの挨拶をし、文化的な礼儀を尊重し、正しいことを守る。"
      },
      {
        "name": "責任",
        "summary": "自ら家事を行い、家族の責任を担い、社会に貢献する。"
      },
      {
        "name": "洞察と自覚",
        "summary": "論理的に問題を分析し、健全な情報を選び、感情を冷静に管理する。"
      },
      {
        "name": "時間と約束を守ること",
        "summary": "時間と約束を守り、確かな自己規律を築く。"
      },
      {
        "name": "価値を伝える力",
        "summary": "他者のよさを伝え、価値ある知識を広め、意欲を引き出す。"
      },
      {
        "name": "賢明なコミュニケーション",
        "summary": "思いやりのある目線で、遮らず共感して聞き、自信をもって発表し、仲を取り持つ。"
      },
      {
        "name": "ビジョンと夢",
        "summary": "人生を描き、5-10年の目標を定め、大切な使命を貫く。"
      }
    ]
  },
  "ko": {
    "eyebrow": "콘텐츠 체계",
    "title": "원하는 자질에서 매일의 작은 행동으로",
    "description": "KidHabit Hero는 자질, 실천 방식, 연령대별로 제안을 정리합니다. 가족을 돕는 도구이며 전문적인 의료, 심리 또는 교육 상담을 대신하지 않습니다.",
    "givingTitle": "일상에서 나누는 7가지 방법",
    "givingDescription": "미소, 눈빛, 말, 감사, 포용, 도움과 기회 양보처럼 관찰하기 쉬운 행동입니다.",
    "today": "오늘의 제안:",
    "portraitTitle": "16가지 성장 방향",
    "portraitDescription": "각 방향은 0–3, 3–6, 6–12, 12–18세에 맞는 서로 다른 실천 예시를 제공합니다.",
    "categories": {
      "personality": "인성",
      "virtue": "덕목",
      "capacity": "역량",
      "vision": "비전"
    },
    "givings": [
      {
        "name": "미소의 나눔",
        "subName": "미소 나누기",
        "meaning": "즐겁고 환한 미소로 다른 사람을 반갑게 맞이합니다.",
        "dailyPractice": "매일 아침 일어났을 때와 집에 돌아왔을 때 조부모와 부모에게 웃으며 인사합니다."
      },
      {
        "name": "눈빛의 나눔",
        "subName": "다정한 눈빛 나누기",
        "meaning": "사랑과 존중을 담은 눈빛으로 아이와 다른 사람의 장점과 긍정적인 변화를 봅니다.",
        "dailyPractice": "대화할 때 눈을 맞추고 친구의 발전을 인정하며 칭찬합니다."
      },
      {
        "name": "말의 나눔",
        "subName": "따뜻한 말 나누기",
        "meaning": "다정한 말로 희망, 믿음, 격려와 가치의 인정을 전합니다.",
        "dailyPractice": "감사 인사를 하고 어려움을 겪는 친구를 격려하며 부정적인 비난을 피합니다."
      },
      {
        "name": "마음의 나눔",
        "subName": "감사 나누기",
        "meaning": "모든 것과 사람, 이미 가진 것에 대한 깊은 감사와 소중함을 기릅니다.",
        "dailyPractice": "식사 전에 감사하고 학용품과 부모의 노력을 소중히 여깁니다."
      },
      {
        "name": "포용의 나눔",
        "subName": "용서 나누기",
        "meaning": "마음을 넓게 열고 실수에 낙인찍지 않으며 용서하고 이해합니다.",
        "dailyPractice": "친구가 실수로 물건을 망가뜨리면 웃으며 용서하고 화내기보다 이유를 듣습니다."
      },
      {
        "name": "행동의 나눔",
        "subName": "다정한 행동 나누기",
        "meaning": "손과 실제 노력으로 다른 사람을 돕고 돌보며 봉사합니다.",
        "dailyPractice": "잠들기 전 부모를 안고 입 맞추고, 식탁 정리와 물주기를 돕고 친구의 책가방을 들어 줍니다."
      },
      {
        "name": "자리의 나눔",
        "subName": "자리와 기회 나누기",
        "meaning": "좋은 자리를 양보하고 기회와 지식을 나누며 다른 사람의 발전을 돕습니다.",
        "dailyPractice": "버스 등에서 어른에게 자리를 양보하고 좋아하는 장난감을 친구와 나눕니다."
      }
    ],
    "portraits": [
      {
        "name": "기쁨",
        "summary": "밝은 미소를 나누고 가족에게 활기차고 긍정적인 분위기를 만듭니다."
      },
      {
        "name": "희망",
        "summary": "밝은 말로 더 나은 미래를 바라보고 어려움을 이겨 내도록 격려합니다."
      },
      {
        "name": "믿음",
        "summary": "사람 안의 선함을 믿고 말과 행동을 일치시킵니다."
      },
      {
        "name": "감사",
        "summary": "감사를 나누며 쌀 한 톨, 물건과 삶의 모든 인연을 소중히 여깁니다."
      },
      {
        "name": "사랑",
        "summary": "다정한 행동과 포옹으로 가족과 주변의 모든 것을 돌봅니다."
      },
      {
        "name": "포용",
        "summary": "실수에 낙인찍지 않고 용서하며 마음을 넓힙니다."
      },
      {
        "name": "겸손",
        "summary": "자리를 양보하고 열린 마음으로 듣고, 자만하지 않으며 다른 사람에게 배웁니다."
      },
      {
        "name": "정직",
        "summary": "약속을 지키고 용기 있게 잘못을 인정하며 긍정적인 내면 가치에 충실하게 삽니다."
      },
      {
        "name": "지혜",
        "summary": "깊이 읽고 왜 그런지 질문하며 내면의 이해를 넓힙니다."
      },
      {
        "name": "예절과 정의",
        "summary": "예의 있게 인사하고 문화적 행동 규범을 존중하며 옳은 일을 지킵니다."
      },
      {
        "name": "책임과 헌신",
        "summary": "집안일을 자발적으로 하고 가족의 책임을 맡으며 사회에 봉사합니다."
      },
      {
        "name": "분별과 자각",
        "summary": "문제를 논리적으로 분석하고 건전한 정보를 고르며 감정을 명료하게 관리합니다."
      },
      {
        "name": "시간과 약속 지키기",
        "summary": "시간과 약속을 지키고 확고한 자기 규율을 세웁니다."
      },
      {
        "name": "가치 알리기",
        "summary": "다른 사람의 장점을 알리고 가치 있는 지식을 나누며 영감을 줍니다."
      },
      {
        "name": "지혜로운 소통",
        "summary": "다정한 눈빛으로 공감하며 끊지 않고 듣고, 자신 있게 발표하고 갈등을 중재합니다."
      },
      {
        "name": "비전과 꿈",
        "summary": "삶을 설계하고 5-10년 목표를 세우며 의미 있는 사명을 꾸준히 지킵니다."
      }
    ]
  }
};

export function getPublicFrameworkCopy(language: Language): PublicFrameworkCopy {
  return COPY[language];
}
