import type { Language } from '@/types';

export type PublicScienceCopy = {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly principlesTitle: string;
  readonly evidence: string;
  readonly action: string;
  readonly limit: string;
  readonly source: string;
  readonly unknownsTitle: string;
  readonly sourcesTitle: string;
  readonly principles: readonly { readonly title: string; readonly evidence: string; readonly action: string; readonly limit: string }[];
  readonly unknowns: readonly string[];
};

export const COPY: Record<Language, PublicScienceCopy> = {
  "vi": {
    "eyebrow": "Cơ sở khoa học",
    "title": "Xây thói quen cho trẻ: điều đã biết và điều chưa biết",
    "description": "KidHabit Hero dựa trên các nghiên cứu về hình thành thói quen để gợi ý cách đồng hành cùng con. Trang này nói rõ bằng chứng đến đâu và giới hạn ở đâu. Đây là công cụ đồng hành cho gia đình, không hứa kết quả cho từng em bé và không thay thế tư vấn của bác sĩ, nhà tâm lý hay chuyên gia giáo dục.",
    "principlesTitle": "Bảy điều nên biết",
    "evidence": "Bằng chứng nói gì.",
    "action": "Bạn có thể làm gì.",
    "limit": "Giới hạn.",
    "source": "Nguồn:",
    "unknownsTitle": "Điều chúng tôi chưa biết",
    "sourcesTitle": "Nguồn",
    "principles": [
      {
        "title": "Không có con số \"21 ngày\"",
        "evidence": "Một nghiên cứu theo dõi người lớn trong 12 tuần cho thấy thời gian để một hành vi trở nên gần như tự động rất khác nhau giữa từng người, thường tính bằng nhiều tuần đến nhiều tháng.",
        "action": "Coi việc xây thói quen là chuyện của vài tuần đến vài tháng, và đừng đánh giá con là \"chậm\" khi chưa đến một mốc nào đó.",
        "limit": "Các nghiên cứu này chủ yếu ở người lớn, với hành vi đơn giản do họ tự chọn. Chưa có con số tương ứng cho trẻ em."
      },
      {
        "title": "Tín hiệu quan trọng hơn ý chí",
        "evidence": "Thói quen là sự liên kết giữa một hoàn cảnh quen thuộc và một hành động, được củng cố khi lặp lại trong hoàn cảnh ổn định. Kế hoạch dạng \"nếu… thì…\" giúp hành động dễ xảy ra hơn.",
        "action": "Cùng con chọn một câu \"nếu… thì…\" thật cụ thể, ví dụ \"sau khi đánh răng buổi tối, con đọc một trang sách\", và giữ cùng hoàn cảnh mỗi ngày.",
        "limit": "Phần lớn bằng chứng đến từ người lớn. Ở trẻ em hiệu ứng khiêm tốn hơn và khác nhau theo loại thói quen."
      },
      {
        "title": "Bỏ lỡ một lần không làm hỏng thói quen",
        "evidence": "Trong nghiên cứu về quá trình hình thành thói quen, một lần bỏ lỡ không ảnh hưởng đáng kể đến tiến trình; điều quan trọng hơn là lặp lại đúng kế hoạch nhiều lần.",
        "action": "Hôm sau cứ làm tiếp. Không bắt con làm lại từ đầu và không phạt vì một ngày quên.",
        "limit": "Bỏ lỡ nhiều lần liên tiếp thì khác: đó là dấu hiệu nên điều chỉnh cách làm (làm nhỏ hơn, đổi giờ, thêm phương án cho cuối tuần)."
      },
      {
        "title": "Hỗ trợ đúng mức, rồi rút dần",
        "evidence": "Dạy kỹ năng bằng hỗ trợ nhiều lúc đầu rồi giảm dần là cách làm có cơ sở trong nghiên cứu về hỗ trợ và rút hỗ trợ.",
        "action": "Bắt đầu bằng làm cùng con, chuyển sang nhắc, rồi để con tự làm khi con đã làm đều.",
        "limit": "Chưa có nghiên cứu nào cho biết chính xác khi nào nên giảm và giảm bao nhiêu với thói quen hằng ngày của trẻ. Các ngưỡng trong KidHabit là giả thuyết làm việc, không phải sự thật khoa học, và sẽ được xem lại theo dữ liệu thực tế."
      },
      {
        "title": "Ghi nhận cụ thể, phần thưởng ở mức nhẹ",
        "evidence": "Phân tích gộp nhiều thí nghiệm cho thấy phần thưởng hữu hình báo trước và gắn với việc chỉ cần làm hoặc hoàn thành có thể làm giảm hứng thú của chính hoạt động đó, còn lời khen tích cực có tác dụng ngược lại.",
        "action": "Nói rõ điều con vừa làm được (\"con đã tự cất đồ chơi mà không cần nhắc\"), giữ phần thưởng vật chất ở mức nhẹ và giảm dần.",
        "limit": "Điều này không có nghĩa mọi phần thưởng đều xấu; cách và thời điểm thưởng quan trọng."
      },
      {
        "title": "Đừng ôm quá nhiều thói quen mới cùng lúc",
        "evidence": "Các kỹ năng tự điều khiển như kiềm chế, giữ thông tin trong đầu và linh hoạt suy nghĩ phát triển dần suốt tuổi thơ và tuổi thiếu niên, nên trẻ nhỏ có ít \"sức\" hơn cho nhiều việc mới một lúc.",
        "action": "Bắt đầu với một hoặc hai thói quen, làm cho vững rồi mới thêm.",
        "limit": "Không có nghiên cứu nào cho con số thói quen mới tối đa. Giới hạn trong KidHabit là quy ước thận trọng theo độ tuổi."
      },
      {
        "title": "Giấc ngủ là nền",
        "evidence": "Hiệp hội Y học Giấc ngủ Hoa Kỳ đưa ra khuyến nghị đồng thuận về số giờ ngủ theo từng độ tuổi của trẻ.",
        "action": "Xem giấc ngủ đủ là điều kiện nền trước khi thêm thói quen buổi tối.",
        "limit": "Đây là khuyến nghị chuyên gia cho dân số nói chung, không phải chẩn đoán cho một em bé."
      }
    ],
    "unknowns": [
      "Thời gian một thói quen hình thành ở trẻ em: các số liệu hiện có chủ yếu từ người lớn.",
      "Thời điểm và mức độ nên giảm nhắc nhở cho từng độ tuổi.",
      "Số thói quen mới tối đa nên xây cùng lúc.",
      "Ảnh hưởng của việc mất chuỗi ngày liên tiếp đối với trẻ."
    ]
  },
  "en": {
    "eyebrow": "Scientific basis",
    "title": "Building children’s habits: what we know and what we do not",
    "description": "KidHabit Hero draws on habit formation research to suggest ways to support your child. This page explains the evidence and its limits. It is a tool for families, promises no outcome for any individual child and does not replace advice from doctors, psychologists or education specialists.",
    "principlesTitle": "Seven things to know",
    "evidence": "What the evidence says.",
    "action": "What you can do.",
    "limit": "Limits.",
    "source": "Sources:",
    "unknownsTitle": "What we do not know",
    "sourcesTitle": "Sources",
    "principles": [
      {
        "title": "There is no “21-day” number",
        "evidence": "A study following adults for 12 weeks found that the time for behaviour to become almost automatic varied greatly between people, often spanning weeks to months.",
        "action": "Think of habit building in terms of weeks to months, and do not call your child “slow” for not reaching a milestone.",
        "limit": "These studies mainly involve adults practising simple behaviours of their own choosing. There is no equivalent number for children yet."
      },
      {
        "title": "Cues matter more than willpower",
        "evidence": "Habits connect a familiar situation with an action, reinforced by repetition in stable settings. “If… then…” plans make action more likely.",
        "action": "Choose a specific “if… then…” plan together, such as “after brushing my teeth at night, I read one page”, and keep the same setting each day.",
        "limit": "Most evidence comes from adults. Effects in children are more modest and vary by habit."
      },
      {
        "title": "Missing once does not ruin a habit",
        "evidence": "In habit formation research, one missed occasion did not significantly affect progress; repeated practice as planned mattered more.",
        "action": "Continue the next day. Do not make your child start over or punish a forgotten day.",
        "limit": "Repeated misses are different: they suggest adjusting the approach (make it smaller, change the time or add a weekend option)."
      },
      {
        "title": "Provide the right support, then fade it",
        "evidence": "Teaching skills with more support at first, then gradually reducing it, is grounded in research on prompting and fading.",
        "action": "Start by doing it together, move to reminders, then let your child act independently once practice is steady.",
        "limit": "No research tells us exactly when or how much to reduce support for children’s daily habits. KidHabit thresholds are working hypotheses, not scientific facts, and will be reviewed against real data."
      },
      {
        "title": "Recognise specifics; keep rewards light",
        "evidence": "A meta-analysis of experiments found that expected tangible rewards tied to simply doing or completing an activity can reduce interest in that activity, while positive praise has the opposite effect.",
        "action": "Name what your child just did (“you put your toys away without a reminder”), keep material rewards modest and gradually reduce them.",
        "limit": "This does not mean all rewards are bad; how and when you reward matters."
      },
      {
        "title": "Do not take on too many new habits at once",
        "evidence": "Self-regulation skills such as inhibition, working memory and flexible thinking develop throughout childhood and adolescence, so younger children have less capacity for many new tasks at once.",
        "action": "Start with one or two habits, establish them, then add more.",
        "limit": "No research sets a maximum number of new habits. KidHabit limits are cautious conventions based on age."
      },
      {
        "title": "Sleep is the foundation",
        "evidence": "The American Academy of Sleep Medicine provides consensus recommendations for sleep duration by children’s age.",
        "action": "Treat enough sleep as a foundation before adding evening habits.",
        "limit": "These are expert recommendations for the general population, not a diagnosis for an individual child."
      }
    ],
    "unknowns": [
      "How long habits take to form in children: available figures mainly concern adults.",
      "When and how much to reduce reminders at each age.",
      "The maximum number of new habits to build at once.",
      "The effect of losing a consecutive-day streak on children."
    ]
  },
  "fr": {
    "eyebrow": "Fondements scientifiques",
    "title": "Les habitudes des enfants : ce que l’on sait et ce que l’on ignore",
    "description": "KidHabit Hero s’appuie sur la recherche sur la formation des habitudes pour proposer un accompagnement. Cette page précise les preuves et leurs limites. Cet outil familial ne promet aucun résultat individuel et ne remplace pas l’avis d’un médecin, d’un psychologue ou d’un spécialiste de l’éducation.",
    "principlesTitle": "Sept points à connaître",
    "evidence": "Ce que disent les preuves.",
    "action": "Ce que vous pouvez faire.",
    "limit": "Limites.",
    "source": "Sources :",
    "unknownsTitle": "Ce que nous ignorons",
    "sourcesTitle": "Sources",
    "principles": [
      {
        "title": "Il n’existe pas de chiffre de « 21 jours »",
        "evidence": "Une étude suivant des adultes pendant 12 semaines a montré que le délai pour qu’un comportement devienne presque automatique variait beaucoup, souvent de plusieurs semaines à plusieurs mois.",
        "action": "Pensez en semaines ou en mois et ne qualifiez pas l’enfant de « lent » s’il n’atteint pas un jalon.",
        "limit": "Ces études portent surtout sur des adultes et des comportements simples qu’ils ont choisis. Aucun chiffre équivalent n’existe encore pour les enfants."
      },
      {
        "title": "Les signaux comptent plus que la volonté",
        "evidence": "Une habitude relie une situation familière à une action, renforcée par la répétition dans un contexte stable. Un plan « si… alors… » facilite l’action.",
        "action": "Choisissez ensemble un plan précis, par exemple « après le brossage des dents du soir, je lis une page », et gardez le même contexte chaque jour.",
        "limit": "Les preuves viennent surtout d’adultes. Chez les enfants, les effets sont plus modestes et varient selon l’habitude."
      },
      {
        "title": "Un oubli ne détruit pas l’habitude",
        "evidence": "Dans la recherche sur la formation des habitudes, un oubli n’affectait pas sensiblement la progression ; la répétition prévue comptait davantage.",
        "action": "Reprenez le lendemain. N’imposez pas de recommencer à zéro ni de punition pour un jour oublié.",
        "limit": "Plusieurs oublis consécutifs sont différents : ils invitent à ajuster la pratique (la réduire, changer l’heure ou prévoir une option pour le week-end)."
      },
      {
        "title": "Soutenir suffisamment, puis réduire l’aide",
        "evidence": "Enseigner avec davantage d’aide au début puis la réduire progressivement s’appuie sur la recherche sur les incitations et leur retrait.",
        "action": "Commencez ensemble, passez aux rappels, puis laissez l’enfant agir seul quand la pratique devient régulière.",
        "limit": "Aucune recherche ne précise quand ni combien réduire l’aide pour les habitudes quotidiennes des enfants. Les seuils de KidHabit sont des hypothèses de travail, pas des faits scientifiques, et seront réexaminés avec les données réelles."
      },
      {
        "title": "Reconnaître précisément, récompenser légèrement",
        "evidence": "Une méta-analyse d’expériences montre que des récompenses matérielles annoncées pour simplement pratiquer ou terminer une activité peuvent diminuer l’intérêt pour celle-ci, tandis que les compliments positifs ont l’effet inverse.",
        "action": "Nommez la réussite (« tu as rangé tes jouets sans rappel »), gardez les récompenses matérielles modestes et réduisez-les progressivement.",
        "limit": "Toutes les récompenses ne sont pas mauvaises ; la manière et le moment comptent."
      },
      {
        "title": "Ne pas multiplier les nouvelles habitudes",
        "evidence": "L’inhibition, la mémoire de travail et la flexibilité de pensée se développent durant l’enfance et l’adolescence ; les plus jeunes ont moins de capacité pour plusieurs nouveautés à la fois.",
        "action": "Commencez par une ou deux habitudes, stabilisez-les, puis ajoutez-en.",
        "limit": "Aucune recherche ne fixe de maximum. Les limites de KidHabit sont des conventions prudentes selon l’âge."
      },
      {
        "title": "Le sommeil est la base",
        "evidence": "L’American Academy of Sleep Medicine propose des recommandations consensuelles de durée du sommeil selon l’âge des enfants.",
        "action": "Considérez un sommeil suffisant comme une base avant d’ajouter des habitudes du soir.",
        "limit": "Ce sont des recommandations d’experts pour la population générale, pas un diagnostic individuel."
      }
    ],
    "unknowns": [
      "Le temps de formation d’une habitude chez les enfants : les chiffres disponibles concernent surtout les adultes.",
      "Quand et dans quelle mesure réduire les rappels selon l’âge.",
      "Le nombre maximal de nouvelles habitudes à construire simultanément.",
      "L’effet de la perte d’une série de jours consécutifs sur les enfants."
    ]
  },
  "de": {
    "eyebrow": "Wissenschaftliche Grundlagen",
    "title": "Gewohnheiten bei Kindern: Was wir wissen und was nicht",
    "description": "KidHabit Hero nutzt Forschung zur Gewohnheitsbildung für Anregungen zur Begleitung Ihres Kindes. Diese Seite erklärt Belege und Grenzen. Das Familienwerkzeug verspricht keine Ergebnisse für einzelne Kinder und ersetzt keine ärztliche, psychologische oder pädagogische Beratung.",
    "principlesTitle": "Sieben wichtige Punkte",
    "evidence": "Was die Forschung sagt.",
    "action": "Was Sie tun können.",
    "limit": "Grenzen.",
    "source": "Quellen:",
    "unknownsTitle": "Was wir nicht wissen",
    "sourcesTitle": "Quellen",
    "principles": [
      {
        "title": "Es gibt keine feste Zahl von „21 Tagen“",
        "evidence": "Eine Studie begleitete Erwachsene 12 Wochen lang. Die Zeit, bis ein Verhalten nahezu automatisch wurde, unterschied sich stark und betrug oft Wochen bis Monate.",
        "action": "Denken Sie in Wochen bis Monaten und nennen Sie Ihr Kind nicht „langsam“, wenn es einen Meilenstein noch nicht erreicht.",
        "limit": "Diese Studien betreffen vor allem Erwachsene mit einfachen, selbst gewählten Verhaltensweisen. Vergleichbare Zahlen für Kinder fehlen bislang."
      },
      {
        "title": "Auslöser sind wichtiger als Willenskraft",
        "evidence": "Gewohnheiten verknüpfen eine vertraute Situation mit einer Handlung, gestärkt durch Wiederholung unter stabilen Bedingungen. „Wenn… dann…“-Pläne erleichtern das Handeln.",
        "action": "Wählen Sie gemeinsam einen konkreten Plan, etwa „Nach dem abendlichen Zähneputzen lese ich eine Seite“, und behalten Sie täglich denselben Kontext bei.",
        "limit": "Die meisten Belege stammen von Erwachsenen. Bei Kindern sind die Effekte geringer und unterscheiden sich je nach Gewohnheit."
      },
      {
        "title": "Einmal auslassen zerstört keine Gewohnheit",
        "evidence": "In der Forschung zur Gewohnheitsbildung beeinträchtigte einmaliges Auslassen den Fortschritt nicht wesentlich; wiederholtes Üben nach Plan war wichtiger.",
        "action": "Machen Sie am nächsten Tag weiter. Lassen Sie Ihr Kind nicht von vorn beginnen und bestrafen Sie keinen vergessenen Tag.",
        "limit": "Mehrere Auslassungen hintereinander sind anders: Passen Sie das Vorgehen an (kleiner machen, Zeit ändern oder eine Wochenendoption ergänzen)."
      },
      {
        "title": "Passend unterstützen, dann schrittweise zurücknehmen",
        "evidence": "Fertigkeiten zunächst mit mehr Hilfe zu vermitteln und diese dann abzubauen, ist durch Forschung zu Hilfestellungen und deren Abbau begründet.",
        "action": "Beginnen Sie gemeinsam, gehen Sie zu Erinnerungen über und lassen Sie Ihr Kind selbst handeln, sobald es regelmäßig übt.",
        "limit": "Keine Forschung sagt genau, wann und wie stark die Hilfe bei täglichen Kindergewohnheiten abnehmen sollte. KidHabit-Schwellen sind Arbeitshypothesen, keine wissenschaftlichen Fakten, und werden anhand realer Daten überprüft."
      },
      {
        "title": "Konkret anerkennen, sparsam belohnen",
        "evidence": "Eine Metaanalyse von Experimenten zeigt, dass angekündigte materielle Belohnungen allein für das Ausführen oder Abschließen einer Tätigkeit das Interesse daran senken können, während positives Lob gegenteilig wirkt.",
        "action": "Benennen Sie das Erreichte („Du hast ohne Erinnerung aufgeräumt“), halten Sie materielle Belohnungen gering und reduzieren Sie sie nach und nach.",
        "limit": "Nicht jede Belohnung ist schlecht; Art und Zeitpunkt sind entscheidend."
      },
      {
        "title": "Nicht zu viele neue Gewohnheiten auf einmal",
        "evidence": "Selbststeuerung wie Impulskontrolle, Arbeitsgedächtnis und flexibles Denken entwickelt sich in Kindheit und Jugend. Jüngere Kinder haben daher weniger Kapazität für mehrere neue Aufgaben zugleich.",
        "action": "Beginnen Sie mit einer oder zwei Gewohnheiten, festigen Sie diese und ergänzen Sie dann weitere.",
        "limit": "Keine Studie legt eine Höchstzahl fest. KidHabit nutzt vorsichtige, altersbezogene Konventionen."
      },
      {
        "title": "Schlaf ist die Grundlage",
        "evidence": "Die American Academy of Sleep Medicine gibt Konsensempfehlungen zur Schlafdauer nach dem Alter von Kindern.",
        "action": "Ausreichender Schlaf sollte die Grundlage sein, bevor Abendgewohnheiten dazukommen.",
        "limit": "Dies sind Expertenempfehlungen für die Allgemeinbevölkerung, keine Diagnose für ein einzelnes Kind."
      }
    ],
    "unknowns": [
      "Wie lange Gewohnheitsbildung bei Kindern dauert: Die vorhandenen Zahlen betreffen überwiegend Erwachsene.",
      "Wann und wie stark Erinnerungen je Altersstufe reduziert werden sollten.",
      "Die maximale Zahl gleichzeitig aufzubauender neuer Gewohnheiten.",
      "Die Wirkung einer unterbrochenen Tageserie auf Kinder."
    ]
  },
  "it": {
    "eyebrow": "Basi scientifiche",
    "title": "Abitudini dei bambini: cosa sappiamo e cosa non sappiamo",
    "description": "KidHabit Hero usa la ricerca sulla formazione delle abitudini per suggerire come accompagnare i bambini. Questa pagina chiarisce prove e limiti. È uno strumento per le famiglie, non promette risultati individuali e non sostituisce medici, psicologi o specialisti dell’educazione.",
    "principlesTitle": "Sette cose da sapere",
    "evidence": "Cosa dicono le prove.",
    "action": "Cosa puoi fare.",
    "limit": "Limiti.",
    "source": "Fonti:",
    "unknownsTitle": "Cosa non sappiamo",
    "sourcesTitle": "Fonti",
    "principles": [
      {
        "title": "Non esiste il numero di “21 giorni”",
        "evidence": "Uno studio su adulti seguito per 12 settimane ha trovato tempi molto diversi per rendere un comportamento quasi automatico, spesso da settimane a mesi.",
        "action": "Pensa in termini di settimane o mesi e non definire “lento” un bambino che non ha raggiunto una tappa.",
        "limit": "Questi studi riguardano soprattutto adulti e comportamenti semplici scelti da loro. Non esiste ancora un dato equivalente per i bambini."
      },
      {
        "title": "I segnali contano più della volontà",
        "evidence": "Un’abitudine collega una situazione familiare a un’azione, rafforzata dalla ripetizione in un contesto stabile. I piani “se… allora…” facilitano l’azione.",
        "action": "Scegliete un piano concreto, per esempio “dopo aver lavato i denti la sera, leggo una pagina”, e mantenete lo stesso contesto ogni giorno.",
        "limit": "La maggior parte delle prove viene dagli adulti. Nei bambini gli effetti sono più modesti e variano secondo l’abitudine."
      },
      {
        "title": "Saltare una volta non rovina un’abitudine",
        "evidence": "Nella ricerca sulla formazione delle abitudini, una singola omissione non influiva significativamente sui progressi; contava di più ripetere secondo il piano.",
        "action": "Riprendete il giorno dopo. Non fate ricominciare il bambino da zero e non punite un giorno dimenticato.",
        "limit": "Saltare più volte di seguito è diverso: suggerisce di adattare la pratica (ridurla, cambiare orario o prevedere un’opzione per il fine settimana)."
      },
      {
        "title": "Offrire il giusto sostegno, poi ridurlo",
        "evidence": "Insegnare con più aiuto all’inizio e ridurlo gradualmente è fondato sulla ricerca sui suggerimenti e sulla loro riduzione.",
        "action": "Iniziate insieme, passate ai promemoria e lasciate agire il bambino da solo quando la pratica è regolare.",
        "limit": "Nessuna ricerca indica esattamente quando e quanto ridurre il sostegno nelle abitudini quotidiane dei bambini. Le soglie di KidHabit sono ipotesi di lavoro, non fatti scientifici, e verranno riviste usando dati reali."
      },
      {
        "title": "Riconoscere i dettagli, premiare con misura",
        "evidence": "Una meta-analisi di esperimenti mostra che premi materiali annunciati per il semplice svolgimento o completamento possono ridurre l’interesse per l’attività, mentre gli elogi positivi hanno l’effetto opposto.",
        "action": "Nomina il risultato (“hai riposto i giochi senza promemoria”), mantieni modesti i premi materiali e riducili gradualmente.",
        "limit": "Non tutti i premi sono negativi: contano modalità e momento."
      },
      {
        "title": "Non iniziare troppe abitudini insieme",
        "evidence": "Inibizione, memoria di lavoro e flessibilità del pensiero si sviluppano durante infanzia e adolescenza; i più piccoli hanno meno capacità per tante novità contemporaneamente.",
        "action": "Inizia con una o due abitudini, consolidale e poi aggiungine altre.",
        "limit": "Nessuna ricerca fissa un massimo. I limiti di KidHabit sono convenzioni prudenti basate sull’età."
      },
      {
        "title": "Il sonno è la base",
        "evidence": "L’American Academy of Sleep Medicine propone raccomandazioni condivise sulla durata del sonno per età.",
        "action": "Considera il sonno sufficiente una base prima di aggiungere abitudini serali.",
        "limit": "Sono raccomandazioni di esperti per la popolazione generale, non una diagnosi individuale."
      }
    ],
    "unknowns": [
      "Il tempo di formazione delle abitudini nei bambini: i dati disponibili riguardano soprattutto adulti.",
      "Quando e quanto ridurre i promemoria a ogni età.",
      "Il numero massimo di nuove abitudini da sviluppare insieme.",
      "L’effetto sui bambini della perdita di una serie di giorni consecutivi."
    ]
  },
  "es": {
    "eyebrow": "Base científica",
    "title": "Hábitos de los niños: lo que sabemos y lo que no",
    "description": "KidHabit Hero usa investigaciones sobre formación de hábitos para sugerir cómo acompañar a los niños. Esta página explica las pruebas y sus límites. Es una herramienta familiar, no promete resultados individuales ni sustituye a médicos, psicólogos o especialistas en educación.",
    "principlesTitle": "Siete cosas que conviene saber",
    "evidence": "Qué dicen las pruebas.",
    "action": "Qué puedes hacer.",
    "limit": "Límites.",
    "source": "Fuentes:",
    "unknownsTitle": "Lo que no sabemos",
    "sourcesTitle": "Fuentes",
    "principles": [
      {
        "title": "No existe la cifra de “21 días”",
        "evidence": "Un estudio que siguió a adultos durante 12 semanas observó grandes diferencias en el tiempo para que una conducta fuera casi automática, a menudo de semanas a meses.",
        "action": "Piensa en semanas o meses y no llames “lento” a tu hijo por no alcanzar un hito.",
        "limit": "Estos estudios tratan principalmente de adultos y conductas sencillas elegidas por ellos. Aún no existe una cifra equivalente para niños."
      },
      {
        "title": "Las señales importan más que la voluntad",
        "evidence": "Los hábitos vinculan una situación conocida con una acción, reforzada por la repetición en un contexto estable. Los planes “si… entonces…” facilitan actuar.",
        "action": "Elegid un plan concreto, como “después de lavarme los dientes por la noche, leo una página”, y mantened el mismo contexto cada día.",
        "limit": "La mayoría de las pruebas procede de adultos. En niños los efectos son más modestos y varían según el hábito."
      },
      {
        "title": "Omitir una vez no arruina el hábito",
        "evidence": "En la investigación sobre formación de hábitos, una omisión no afectó significativamente al progreso; repetir según el plan fue más importante.",
        "action": "Continuad al día siguiente. No hagas que tu hijo empiece de cero ni castigues un día olvidado.",
        "limit": "Varias omisiones seguidas son distintas: indican que conviene ajustar la práctica (reducirla, cambiar la hora o añadir una opción para el fin de semana)."
      },
      {
        "title": "Dar el apoyo adecuado y retirarlo poco a poco",
        "evidence": "Enseñar habilidades con más ayuda al principio y reducirla gradualmente se basa en investigaciones sobre ayudas y su retirada.",
        "action": "Empezad juntos, pasad a recordatorios y dejad que el niño actúe solo cuando la práctica sea regular.",
        "limit": "Ninguna investigación precisa cuándo ni cuánto reducir el apoyo en los hábitos diarios de los niños. Los umbrales de KidHabit son hipótesis de trabajo, no hechos científicos, y se revisarán con datos reales."
      },
      {
        "title": "Reconocer lo concreto y moderar los premios",
        "evidence": "Un metaanálisis de experimentos indica que los premios materiales anunciados por simplemente realizar o completar una actividad pueden reducir el interés en ella, mientras que los elogios positivos tienen el efecto contrario.",
        "action": "Nombra lo que acaba de lograr (“guardaste los juguetes sin recordatorio”), modera los premios materiales y redúcelos gradualmente.",
        "limit": "No significa que todo premio sea malo; importan la forma y el momento."
      },
      {
        "title": "No empezar demasiados hábitos a la vez",
        "evidence": "La inhibición, la memoria de trabajo y el pensamiento flexible se desarrollan durante la infancia y la adolescencia; los pequeños tienen menos capacidad para muchas novedades simultáneas.",
        "action": "Empieza con uno o dos hábitos, afiénzalos y luego añade más.",
        "limit": "Ninguna investigación fija un máximo. Los límites de KidHabit son convenciones prudentes según la edad."
      },
      {
        "title": "El sueño es la base",
        "evidence": "La American Academy of Sleep Medicine ofrece recomendaciones consensuadas sobre horas de sueño según la edad infantil.",
        "action": "Considera dormir suficiente una base antes de añadir hábitos nocturnos.",
        "limit": "Son recomendaciones expertas para la población general, no un diagnóstico individual."
      }
    ],
    "unknowns": [
      "Cuánto tarda en formarse un hábito en niños: las cifras disponibles proceden principalmente de adultos.",
      "Cuándo y cuánto reducir los recordatorios a cada edad.",
      "El máximo de hábitos nuevos que conviene crear a la vez.",
      "El efecto en los niños de perder una racha de días consecutivos."
    ]
  },
  "zh": {
    "eyebrow": "科学依据",
    "title": "培养孩子的习惯：已知与未知",
    "description": "KidHabit Hero 根据习惯形成研究，建议如何陪伴孩子。本页说明证据及其局限。这是家庭辅助工具，不保证任何孩子的个别结果，也不能替代医生、心理学家或教育专家的建议。",
    "principlesTitle": "需要了解的七点",
    "evidence": "证据怎么说。",
    "action": "你可以怎么做。",
    "limit": "局限。",
    "source": "来源：",
    "unknownsTitle": "我们尚不知道的事",
    "sourcesTitle": "来源",
    "principles": [
      {
        "title": "并不存在“21天”这个固定数字",
        "evidence": "一项跟踪成年人12周的研究发现，行为变得近乎自动所需时间因人而异，往往需要数周到数月。",
        "action": "把培养习惯看成数周到数月的过程，不要因孩子未达到某个节点就说孩子“慢”。",
        "limit": "这些研究主要针对成年人自主选择的简单行为。尚无适用于孩子的对应数字。"
      },
      {
        "title": "提示比意志力更重要",
        "evidence": "习惯把熟悉的情境与行动联系起来，在稳定情境中重复会强化联系。“如果……那么……”计划使行动更容易发生。",
        "action": "和孩子一起选择具体计划，例如“晚上刷牙后，读一页书”，并每天保持同样的情境。",
        "limit": "大多数证据来自成年人。在孩子身上效果较小，也因习惯类型而异。"
      },
      {
        "title": "漏做一次不会破坏习惯",
        "evidence": "习惯形成研究中，漏做一次并未显著影响进展；更重要的是按计划反复练习。",
        "action": "第二天继续即可。不要让孩子从头开始，也不要因忘记一天而惩罚。",
        "limit": "连续多次漏做则不同：这提示需要调整方法，例如缩小任务、改变时间或增加周末方案。"
      },
      {
        "title": "给予适当支持，再逐渐减少",
        "evidence": "先给予较多帮助，再逐渐减少，是有提示与提示撤除研究依据的技能教学方式。",
        "action": "先和孩子一起做，然后改为提醒，等练习稳定后让孩子独立完成。",
        "limit": "尚无研究明确说明孩子日常习惯的支持应何时减少、减少多少。KidHabit 的阈值是工作假设，而非科学事实，将依据实际数据重新评估。"
      },
      {
        "title": "具体认可，适度奖励",
        "evidence": "多项实验的元分析发现，预先告知、仅与执行或完成挂钩的实物奖励可能降低活动本身的兴趣，而积极表扬有相反效果。",
        "action": "说清孩子刚做到的事，例如“你不用提醒就收好了玩具”，保持适度的物质奖励，并逐渐减少。",
        "limit": "这不表示所有奖励都不好；方式和时机很重要。"
      },
      {
        "title": "不要同时开始太多新习惯",
        "evidence": "抑制控制、工作记忆和灵活思考等自我调节能力在童年和青春期逐渐发展，因此年龄较小的孩子较难同时应对多项新任务。",
        "action": "从一两个习惯开始，稳定后再增加。",
        "limit": "尚无研究规定新习惯的最大数量。KidHabit 的限制是按年龄设定的审慎约定。"
      },
      {
        "title": "睡眠是基础",
        "evidence": "美国睡眠医学学会针对孩子各年龄段的睡眠时长提出共识建议。",
        "action": "在增加晚间习惯前，先把充足睡眠作为基础条件。",
        "limit": "这是针对一般人群的专家建议，并非对某个孩子的诊断。"
      }
    ],
    "unknowns": [
      "孩子形成习惯所需的时间：现有数字主要来自成年人。",
      "各年龄段应何时、在多大程度上减少提醒。",
      "适合同时培养的新习惯最大数量。",
      "连续天数中断对孩子的影响。"
    ]
  },
  "ja": {
    "eyebrow": "科学的根拠",
    "title": "子どもの習慣づくり：わかっていること、まだわからないこと",
    "description": "KidHabit Hero は習慣形成の研究をもとに子どもへの関わり方を提案します。このページでは根拠と限界を示します。家族を支える道具であり、個々の子どもの結果を保証せず、医師・心理学者・教育専門家の助言に代わるものではありません。",
    "principlesTitle": "知っておきたい7つのこと",
    "evidence": "研究が示すこと。",
    "action": "できること。",
    "limit": "限界。",
    "source": "出典：",
    "unknownsTitle": "まだわからないこと",
    "sourcesTitle": "出典",
    "principles": [
      {
        "title": "「21日」という決まった数字はありません",
        "evidence": "成人を12週間追跡した研究では、行動がほぼ自動的になるまでの時間に大きな個人差があり、多くの場合は数週間から数か月でした。",
        "action": "習慣づくりは数週間から数か月の過程と考え、節目に達していない子どもを「遅い」と評価しないでください。",
        "limit": "主に成人が自分で選んだ簡単な行動の研究です。子どもに対応する数字はまだありません。"
      },
      {
        "title": "意志力より合図が大切",
        "evidence": "習慣は、なじみのある状況と行動の結びつきで、安定した状況で繰り返すと強まります。「もし…なら…」の計画は行動を起こしやすくします。",
        "action": "「夜に歯を磨いたら、本を1ページ読む」など具体的な計画を一緒に選び、毎日同じ状況を保ちましょう。",
        "limit": "根拠の多くは成人から得られています。子どもでは効果が小さく、習慣の種類でも異なります。"
      },
      {
        "title": "1回忘れても習慣は壊れません",
        "evidence": "習慣形成の研究では、1回の実施忘れは進行に大きな影響を与えず、計画に沿った繰り返しのほうが重要でした。",
        "action": "翌日に続けましょう。最初からやり直させたり、1日忘れたことで罰したりしないでください。",
        "limit": "何日も続けて忘れる場合は別です。ミッションを小さくする、時間を変える、週末の方法を加えるなど調整の合図です。"
      },
      {
        "title": "適切に支え、徐々に減らす",
        "evidence": "初めに多く支援し、その後少しずつ減らす技能指導は、プロンプトとそのフェイディングの研究に基づきます。",
        "action": "一緒に行うことから始め、声かけに移り、安定してできるようになったら子どもに任せましょう。",
        "limit": "子どもの日常習慣について、いつどれだけ支援を減らすべきかを正確に示す研究はありません。KidHabit の基準値は作業仮説であり科学的事実ではなく、実際のデータで見直します。"
      },
      {
        "title": "具体的に認め、報酬は控えめに",
        "evidence": "実験のメタ分析では、実行や完了だけを条件に予告する物質的報酬は活動自体への関心を下げる可能性があり、肯定的な称賛は逆の効果を示しました。",
        "action": "「言われなくてもおもちゃを片づけたね」のようにできたことを具体的に伝え、物質的報酬は控えめにし徐々に減らしましょう。",
        "limit": "すべての報酬が悪いという意味ではありません。方法とタイミングが大切です。"
      },
      {
        "title": "新しい習慣を一度に増やしすぎない",
        "evidence": "抑制、作業記憶、柔軟な思考など自己調整能力は幼少期から思春期にかけて育つため、幼い子どもは多くの新しいミッションに同時に対応する余力が少なくなります。",
        "action": "1つか2つから始め、定着してから増やしましょう。",
        "limit": "新しい習慣の最大数を示す研究はありません。KidHabit の上限は年齢に応じた慎重な取り決めです。"
      },
      {
        "title": "睡眠が土台",
        "evidence": "米国睡眠医学会は、子どもの年齢別の睡眠時間について合意に基づく推奨を示しています。",
        "action": "夜の習慣を追加する前に、十分な睡眠を土台と考えましょう。",
        "limit": "一般の集団への専門家の推奨であり、個々の子どもの診断ではありません。"
      }
    ],
    "unknowns": [
      "子どもの習慣形成にかかる時間：現在の数字は主に成人に基づいています。",
      "年齢別に、いつどれだけ声かけを減らすべきか。",
      "同時に始める新しい習慣の最大数。",
      "連続日数が途切れることの子どもへの影響。"
    ]
  },
  "ko": {
    "eyebrow": "과학적 근거",
    "title": "아이의 습관 만들기: 아는 것과 아직 모르는 것",
    "description": "KidHabit Hero는 습관 형성 연구를 바탕으로 아이를 돕는 방법을 제안합니다. 이 페이지는 근거와 한계를 밝힙니다. 가족을 위한 도구이며 개별 아이의 결과를 약속하거나 의사, 심리학자, 교육 전문가의 조언을 대신하지 않습니다.",
    "principlesTitle": "알아 두면 좋은 일곱 가지",
    "evidence": "근거가 말하는 것.",
    "action": "할 수 있는 일.",
    "limit": "한계.",
    "source": "출처:",
    "unknownsTitle": "아직 모르는 것",
    "sourcesTitle": "출처",
    "principles": [
      {
        "title": "“21일”이라는 정해진 숫자는 없습니다",
        "evidence": "성인을 12주간 관찰한 연구에서 행동이 거의 자동화되기까지 걸리는 시간은 개인마다 크게 달랐으며, 흔히 여러 주에서 여러 달이 걸렸습니다.",
        "action": "습관 형성을 여러 주에서 여러 달의 과정으로 보고, 어떤 시점에 도달하지 않았다고 아이를 “느리다”고 평가하지 마세요.",
        "limit": "주로 성인이 스스로 선택한 단순한 행동에 관한 연구입니다. 아이에게 해당하는 수치는 아직 없습니다."
      },
      {
        "title": "의지보다 신호가 중요합니다",
        "evidence": "습관은 익숙한 상황과 행동의 연결이며, 안정된 환경에서 반복하면 강화됩니다. “만약… 그러면…” 계획은 행동을 쉽게 만듭니다.",
        "action": "“저녁에 이를 닦으면 책 한 쪽을 읽는다”처럼 구체적인 계획을 아이와 정하고 매일 같은 상황을 유지하세요.",
        "limit": "근거 대부분은 성인에게서 나왔습니다. 아이에게서는 효과가 더 작고 습관 종류에 따라 다릅니다."
      },
      {
        "title": "한 번 빠뜨려도 습관은 망가지지 않습니다",
        "evidence": "습관 형성 연구에서 한 번의 누락은 진행에 큰 영향을 주지 않았으며, 계획대로 반복하는 것이 더 중요했습니다.",
        "action": "다음 날 계속하세요. 처음부터 다시 하게 하거나 하루 잊었다고 벌주지 마세요.",
        "limit": "여러 번 연속 빠뜨리는 것은 다릅니다. 미션을 줄이거나 시간을 바꾸고 주말 방법을 추가하는 등 조정할 신호입니다."
      },
      {
        "title": "적절히 돕고 서서히 줄입니다",
        "evidence": "처음에는 많이 돕고 점차 줄이는 기술 교육은 촉진과 촉진 소거 연구에 근거합니다.",
        "action": "함께 시작하고, 알림으로 옮긴 뒤, 꾸준히 실천하면 아이가 혼자 하게 하세요.",
        "limit": "아이의 일상 습관에서 언제 얼마나 지원을 줄여야 하는지 정확히 알려 주는 연구는 없습니다. KidHabit의 기준값은 과학적 사실이 아닌 작업 가설이며 실제 데이터에 따라 재검토합니다."
      },
      {
        "title": "구체적으로 인정하고 보상은 가볍게",
        "evidence": "실험들의 메타분석에 따르면 단순 실행이나 완료에 연계해 미리 알리는 물질적 보상은 활동 자체에 대한 흥미를 낮출 수 있으며, 긍정적인 칭찬은 반대 효과를 보였습니다.",
        "action": "“말하지 않아도 장난감을 정리했네”처럼 방금 한 일을 구체적으로 말하고, 물질적 보상은 적게 주며 점차 줄이세요.",
        "limit": "모든 보상이 나쁘다는 뜻은 아닙니다. 방법과 시점이 중요합니다."
      },
      {
        "title": "새 습관을 한꺼번에 너무 많이 시작하지 마세요",
        "evidence": "억제, 작업 기억, 유연한 사고 등 자기 조절 능력은 아동기와 청소년기에 걸쳐 발달하므로, 어린 아이는 많은 새 일을 동시에 감당할 여력이 더 적습니다.",
        "action": "하나 또는 두 개로 시작하고 안정된 후 추가하세요.",
        "limit": "새 습관의 최대 수를 정한 연구는 없습니다. KidHabit의 제한은 연령에 따른 신중한 약속입니다."
      },
      {
        "title": "수면이 바탕입니다",
        "evidence": "미국수면의학회는 아이의 연령별 수면 시간에 대한 합의 권고를 제시합니다.",
        "action": "저녁 습관을 추가하기 전에 충분한 수면을 기본 조건으로 보세요.",
        "limit": "일반 인구를 위한 전문가 권고이며 개별 아이의 진단은 아닙니다."
      }
    ],
    "unknowns": [
      "아이의 습관 형성 시간: 현재 수치는 주로 성인에게서 나왔습니다.",
      "연령별로 언제 얼마나 알림을 줄여야 하는지.",
      "동시에 만들 새 습관의 최대 수.",
      "연속 일수 기록이 끊기는 것이 아이에게 미치는 영향."
    ]
  }
};

export function getPublicScienceCopy(language: Language): PublicScienceCopy {
  return COPY[language];
}
