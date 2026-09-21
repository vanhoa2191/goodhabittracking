import type { AgeStage, Language } from '@/types';
import {
  PARENT_SELF_CHECKLIST,
  PORTRAITS_16,
  SEVEN_GIVINGS,
  SIX_GOLD_WORDS,
  type GivingItem,
  type Portrait16Item,
} from '@/lib/wit-framework';

type PortraitCategory = Portrait16Item['category'];

interface GuideLocale {
  ui: PortraitGuideUi;
  portraitNames: string[];
  actionTemplates: Record<AgeStage, (trait: string) => string>;
  givings: Array<Pick<GivingItem, 'name' | 'subName' | 'meaning' | 'dailyPractice'>>;
  goldWords: Array<{ word: string; meaning: string }>;
  checklist: string[];
}

export interface PortraitGuideUi {
  ageBadge: string;
  applyFor: (name: string) => string;
  applySuccess: (stage: string, name: string) => string;
  categories: Record<PortraitCategory, string>;
  checklistComplete: (count: number) => string;
  checklistSubtitle: string;
  checklistTitle: string;
  chooseAge: string;
  close: string;
  currentChild: (name: string, age: number) => string;
  detailsTitle: (stage: string) => string;
  dialogLabel: string;
  footer: string;
  givingIntro: string;
  givingMeaning: string;
  givingPractice: string;
  givingSubtitle: string;
  givingTitle: string;
  goldWordsTitle: string;
  headerSubtitle: string;
  headerTitle: string;
  modelingIntro: string;
  modelingQuote: string;
  modelingTitle: string;
  noChild: string;
  tabGivings: string;
  tabMatrix: string;
  tabModeling: string;
}

export interface PortraitGuideCopy {
  ui: PortraitGuideUi;
  portraits: Portrait16Item[];
  givings: GivingItem[];
  goldWords: Array<{ word: string; meaning: string }>;
  checklist: string[];
}

const viUi: PortraitGuideUi = {
  ageBadge: '0–18 tuổi',
  applyFor: (name) => `Áp dụng cho bé ${name}`,
  applySuccess: (stage, name) => `Đã áp dụng thành công bộ hành động (${stage}) cho bé ${name}!`,
  categories: { personality: 'Nhân cách', virtue: 'Phẩm chất', capacity: 'Năng lực', vision: 'Tầm nhìn' },
  checklistComplete: (count) => `${count}/5 hoàn thành`,
  checklistSubtitle: 'Dành 2 phút trước khi ngủ để soi chiếu hiện thực của chính mình',
  checklistTitle: 'Checklist 5 câu hỏi tự vấn cho cha mẹ mỗi tối',
  chooseAge: 'Chọn lứa tuổi của con:',
  close: 'Đóng cẩm nang',
  currentChild: (name, age) => `Bé hiện tại: ${name} (${age} tuổi)`,
  detailsTitle: (stage) => `Hành động chi tiết 16 chân dung (${stage}):`,
  dialogLabel: 'Thư viện chân dung và bố thí',
  footer: 'Trở thành • Làm gương • Bộc lộ nhất quán',
  givingIntro: 'Bố thí không chỉ là tiền bạc, mà còn là 7 điều giản dị ai cũng có thể trao mỗi ngày: nụ cười, ánh mắt, lời nói, lòng biết ơn, sự bao dung, hành động nhân ái và sự nhường nhịn.',
  givingMeaning: 'Ý nghĩa:',
  givingPractice: 'Thực hành:',
  givingSubtitle: 'Khởi tạo phước đức & bồi dưỡng nhân cách cho con',
  givingTitle: '7 bố thí đời người • Giáo dục tận gốc',
  goldWordsTitle: 'Công thức 6 chữ vàng của cha mẹ thông thái:',
  headerSubtitle: '9 nhân cách • 4 phẩm chất • 2 năng lực • 1 tầm nhìn • 7 cách cho đi',
  headerTitle: 'Cẩm nang 16 chân dung & 7 bố thí',
  modelingIntro: 'Để con phát triển 16 chân dung, cha mẹ cần sống với những phẩm chất ấy trước. Khi người lớn an vui và nhất quán, trẻ có một tấm gương rõ ràng để noi theo.',
  modelingQuote: '“Đừng chỉ nói về đạo lý — hãy sống điều mình muốn con học.”',
  modelingTitle: 'Nghệ thuật thân giáo làm gương',
  noChild: 'Vui lòng chọn hoặc tạo hồ sơ bé trước!',
  tabGivings: '7 cách cho đi',
  tabMatrix: '16 chân dung & 4 giai đoạn',
  tabModeling: 'Làm gương & 6 nguyên tắc',
};

const LOCALES: Partial<Record<Language, GuideLocale>> = {
  en: {
    ui: {
      ageBadge: 'Ages 0–18', applyFor: (name) => `Apply for ${name}`,
      applySuccess: (stage, name) => `The ${stage} action set was added for ${name}.`,
      categories: { personality: 'Character', virtue: 'Virtue', capacity: 'Capability', vision: 'Vision' },
      checklistComplete: (count) => `${count}/5 complete`, checklistSubtitle: 'Take two minutes before bed to reflect on the example you set today.',
      checklistTitle: 'Five-minute parent reflection', chooseAge: "Choose your child's age:", close: 'Close guide',
      currentChild: (name, age) => `Current child: ${name} (${age} years old)`, detailsTitle: (stage) => `16 practical actions for ${stage}:`,
      dialogLabel: 'Character and giving guide', footer: 'Become it • Model it • Live it consistently',
      givingIntro: 'Giving is more than money. Every day we can offer a smile, warm attention, kind words, gratitude, forgiveness, practical help, and a place for someone else.',
      givingMeaning: 'Meaning:', givingPractice: 'Try today:', givingSubtitle: 'Build generosity and character through everyday actions',
      givingTitle: 'Seven everyday ways to give', goldWordsTitle: 'Six principles for wise parenting:',
      headerSubtitle: '9 character strengths • 4 virtues • 2 capabilities • 1 vision • 7 ways to give', headerTitle: '16 strengths & giving guide',
      modelingIntro: 'Children learn these qualities most deeply when adults live them first. Calm, joyful, and consistent parenting gives a child a clear example to follow.',
      modelingQuote: '“Do not only explain the value — live what you want your child to learn.”', modelingTitle: 'The art of leading by example',
      noChild: 'Choose or create a child profile first.', tabGivings: '7 ways to give', tabMatrix: '16 strengths & 4 stages', tabModeling: 'Lead by example',
    },
    portraitNames: ['Joy','Hope','Confidence','Gratitude','Love','Forgiveness','Humility','Honesty','Wisdom','Courtesy & fairness','Responsibility','Discernment','Reliability','Positive advocacy','Wise communication','Vision & dreams'],
    actionTemplates: {
      '0-3': (t) => `Model ${t.toLowerCase()} in one calm, visible family routine each day. Name the action warmly so your child can connect words with what they see.`,
      '3-6': (t) => `Invite your child to practise one small act of ${t.toLowerCase()} today. Demonstrate it first, then notice the effort instead of demanding perfection.`,
      '6-12': (t) => `Let your child choose a real home or school responsibility that develops ${t.toLowerCase()}. Reflect together on the result at the end of the day.`,
      '12-18': (t) => `Help your teen define a personal standard for ${t.toLowerCase()}, apply it in a real decision, and review the impact without judgment.`,
    },
    givings: [
      {name:'The gift of a smile',subName:'Welcome with warmth',meaning:'A genuine smile helps others feel safe, seen, and welcome.',dailyPractice:'Smile and greet each family member in the morning and when you return home.'},
      {name:'The gift of attention',subName:'A caring gaze',meaning:'Warm eye contact communicates respect and helps us notice another person’s strengths.',dailyPractice:'Look up when someone speaks and name one piece of progress you noticed.'},
      {name:'The gift of words',subName:'Speech that encourages',meaning:'Kind, truthful words can restore hope, confidence, and dignity.',dailyPractice:'Thank someone, encourage a person facing difficulty, and avoid put-downs.'},
      {name:'The gift of gratitude',subName:'An appreciative heart',meaning:'Gratitude helps us value people, belongings, nature, and what we already have.',dailyPractice:'Give thanks before a meal and care for school and household items.'},
      {name:'The gift of forgiveness',subName:'Make room for mistakes',meaning:'An open heart avoids labels, seeks understanding, and is ready to repair.',dailyPractice:'Pause, listen to what happened, and choose a calm repair after a mistake.'},
      {name:'The gift of service',subName:'Kindness in action',meaning:'We use our time and effort to help and care for other people.',dailyPractice:'Help prepare a meal, water a plant, carry a bag, or comfort someone.'},
      {name:'The gift of space',subName:'Share place and opportunity',meaning:'We make room, share chances, and help others grow alongside us.',dailyPractice:'Offer a seat, take turns, or share a favourite toy or learning opportunity.'},
    ],
    goldWords: [
      {word:'Simple',meaning:'Break skills into small steps a child can understand and complete.'},{word:'Joyful',meaning:'Create an encouraging atmosphere where learning feels worthwhile.'},{word:'Trusting',meaning:'Believe in the child’s capacity even when today’s result is imperfect.'},{word:'Gentle',meaning:'Guide with empathy and patience, without pressure or force.'},{word:'Consistent',meaning:'Repeat small practices regularly until they become familiar.'},{word:'Attentive',meaning:'Be fully present and notice even the smallest sign of progress.'},
    ],
    checklist: ['Did I make today’s request simple enough to begin?','Did our interaction include joy and encouragement?','Did I keep believing in my child when something went wrong?','Were my words gentle, constructive, and respectful?','Did I model the value consistently and with full attention?'],
  },
  fr: {
    ui: {
      ageBadge:'0–18 ans',applyFor:(n)=>`Appliquer pour ${n}`,applySuccess:(s,n)=>`Le parcours ${s} a été ajouté pour ${n}.`,categories:{personality:'Caractère',virtue:'Vertu',capacity:'Compétence',vision:'Vision'},checklistComplete:(n)=>`${n}/5 terminés`,checklistSubtitle:'Prenez deux minutes avant de dormir pour réfléchir à votre exemple.',checklistTitle:'Réflexion du soir des parents',chooseAge:"Choisissez l’âge de l’enfant :",close:'Fermer le guide',currentChild:(n,a)=>`Enfant actuel : ${n} (${a} ans)`,detailsTitle:(s)=>`16 actions concrètes pour ${s} :`,dialogLabel:'Guide du caractère et du don',footer:'Devenir • Montrer • Vivre avec constance',givingIntro:'Donner ne se limite pas à l’argent : on peut offrir chaque jour un sourire, une attention, des paroles bienveillantes, de la gratitude, du pardon, de l’aide et une place.',givingMeaning:'Sens :',givingPractice:'À pratiquer :',givingSubtitle:'Cultiver la générosité et le caractère au quotidien',givingTitle:'Sept façons de donner',goldWordsTitle:'Six principes pour accompagner avec sagesse :',headerSubtitle:'9 forces • 4 vertus • 2 compétences • 1 vision • 7 dons',headerTitle:'Guide des 16 forces et du don',modelingIntro:'L’enfant intègre ces qualités quand les adultes les vivent d’abord. Une présence calme, joyeuse et cohérente lui donne un repère clair.',modelingQuote:'« Ne vous contentez pas d’expliquer : vivez ce que vous souhaitez transmettre. »',modelingTitle:'L’art de montrer l’exemple',noChild:'Choisissez ou créez d’abord un profil enfant.',tabGivings:'7 façons de donner',tabMatrix:'16 forces et 4 étapes',tabModeling:'Montrer l’exemple',
    },
    portraitNames:['Joie','Espoir','Confiance','Gratitude','Amour','Pardon','Humilité','Honnêteté','Sagesse','Courtoisie et justice','Responsabilité','Discernement','Fiabilité','Valorisation positive','Communication éclairée','Vision et rêves'],
    actionTemplates:{'0-3':(t)=>`Montrez ${t.toLowerCase()} dans un rituel familial simple et visible. Nommez calmement ce que vous faites pour relier les mots à l’exemple.`,'3-6':(t)=>`Invitez l’enfant à accomplir aujourd’hui un petit geste de ${t.toLowerCase()}. Montrez-le d’abord et valorisez l’effort.`,'6-12':(t)=>`Confiez une responsabilité réelle qui développe ${t.toLowerCase()}, puis échangez ensemble sur le résultat en fin de journée.`,'12-18':(t)=>`Aidez l’adolescent à définir son propre repère de ${t.toLowerCase()}, à l’appliquer dans une décision réelle et à en observer l’impact.`},
    givings:[['Le don du sourire','Accueillir avec chaleur','Un sourire sincère apporte sécurité et ouverture.','Sourire et saluer chaque membre de la famille.'],['Le don de l’attention','Un regard bienveillant','Le regard attentif communique respect et reconnaissance.','Regarder la personne qui parle et nommer un progrès.'],['Le don des mots','Des paroles qui encouragent','Des mots justes et doux nourrissent espoir et confiance.','Remercier, encourager et éviter les paroles blessantes.'],['Le don de la gratitude','Un cœur reconnaissant','La gratitude aide à apprécier les personnes et ce que nous avons.','Remercier avant le repas et prendre soin de ses affaires.'],['Le don du pardon','Faire place aux erreurs','Comprendre avant de juger permet de réparer les liens.','Écouter, respirer et choisir une réparation calme.'],['Le don du service','La bonté en action','Notre temps et nos efforts peuvent soutenir les autres.','Aider au repas, arroser une plante ou porter un sac.'],['Le don de la place','Partager les occasions','Céder une place ou une occasion aide chacun à grandir.','Proposer une place, attendre son tour ou partager.']].map(([name,subName,meaning,dailyPractice])=>({name,subName,meaning,dailyPractice})),
    goldWords:[['Simple','Découper les apprentissages en petites étapes accessibles.'],['Joyeux','Créer un climat encourageant où apprendre fait du bien.'],['Confiant','Croire aux capacités de l’enfant malgré les imperfections.'],['Doux','Guider avec empathie et patience, sans contrainte.'],['Régulier','Répéter de petits gestes jusqu’à ce qu’ils deviennent familiers.'],['Attentif','Être pleinement présent et remarquer chaque progrès.']].map(([word,meaning])=>({word,meaning})),
    checklist:['Ai-je rendu la demande assez simple pour commencer ?','Avons-nous partagé de la joie et des encouragements ?','Ai-je gardé confiance quand une difficulté est apparue ?','Mes paroles étaient-elles douces et respectueuses ?','Ai-je montré cette valeur avec constance et attention ?'],
  },
};

function makeCompactLocale(language: Exclude<Language, 'vi' | 'en' | 'fr'>): GuideLocale {
  const data = COMPACT_DATA[language]();
  return {
    ui: data.ui,
    portraitNames: data.portraitNames,
    actionTemplates: data.actionTemplates,
    givings: data.givings.map(([name, subName, meaning, dailyPractice]) => ({ name, subName, meaning, dailyPractice })),
    goldWords: data.goldWords.map(([word, meaning]) => ({ word, meaning })),
    checklist: data.checklist,
  };
}

type CompactData = {
  ui: PortraitGuideUi;
  portraitNames: string[];
  actionTemplates: Record<AgeStage, (trait: string) => string>;
  givings: [string, string, string, string][];
  goldWords: [string, string][];
  checklist: string[];
};

const COMPACT_DATA: Record<Exclude<Language, 'vi' | 'en' | 'fr'>, () => CompactData> = {
  de: () => localeData(
    ['Freude','Hoffnung','Vertrauen','Dankbarkeit','Liebe','Vergebung','Demut','Ehrlichkeit','Weisheit','Höflichkeit und Gerechtigkeit','Verantwortung','Urteilsvermögen','Zuverlässigkeit','Positive Anerkennung','Achtsame Kommunikation','Vision und Träume'],
    ['Das Geschenk des Lächelns','Das Geschenk der Aufmerksamkeit','Das Geschenk der Worte','Das Geschenk der Dankbarkeit','Das Geschenk der Vergebung','Das Geschenk des Helfens','Das Geschenk des Raums'],
    [['Einfach','Fähigkeiten in kleine, machbare Schritte teilen.'],['Freudig','Eine ermutigende Lernatmosphäre schaffen.'],['Vertrauensvoll','An die Fähigkeiten des Kindes glauben.'],['Sanft','Mit Empathie und Geduld begleiten.'],['Beständig','Kleine Übungen regelmäßig wiederholen.'],['Aufmerksam','Präsent sein und jeden Fortschritt sehen.']],
    ['War meine Bitte einfach genug?','Gab es heute Freude und Ermutigung?','Habe ich bei Schwierigkeiten weiter vertraut?','Waren meine Worte sanft und respektvoll?','Habe ich den Wert aufmerksam und beständig vorgelebt?']
  ),
  it: () => localeData(
    ['Gioia','Speranza','Fiducia','Gratitudine','Amore','Perdono','Umiltà','Onestà','Saggezza','Cortesia e giustizia','Responsabilità','Discernimento','Affidabilità','Valorizzazione positiva','Comunicazione consapevole','Visione e sogni'],
    ['Il dono del sorriso','Il dono dell’attenzione','Il dono delle parole','Il dono della gratitudine','Il dono del perdono','Il dono del servizio','Il dono dello spazio'],
    [['Semplice','Dividere le abilità in piccoli passi possibili.'],['Gioioso','Creare un clima incoraggiante per imparare.'],['Fiducioso','Credere nelle capacità del bambino.'],['Gentile','Guidare con empatia e pazienza.'],['Costante','Ripetere con regolarità piccoli gesti.'],['Attento','Essere presenti e notare ogni progresso.']],
    ['La richiesta era abbastanza semplice?','Oggi ci sono stati gioia e incoraggiamento?','Ho mantenuto la fiducia nelle difficoltà?','Le mie parole erano gentili e rispettose?','Ho dato l’esempio con attenzione e costanza?']
  ),
  es: () => localeData(
    ['Alegría','Esperanza','Confianza','Gratitud','Amor','Perdón','Humildad','Honestidad','Sabiduría','Cortesía y justicia','Responsabilidad','Discernimiento','Fiabilidad','Reconocimiento positivo','Comunicación consciente','Visión y sueños'],
    ['El regalo de la sonrisa','El regalo de la atención','El regalo de las palabras','El regalo de la gratitud','El regalo del perdón','El regalo del servicio','El regalo del espacio'],
    [['Simple','Dividir las habilidades en pasos pequeños y posibles.'],['Alegre','Crear un ambiente alentador para aprender.'],['Confiado','Creer en la capacidad del niño.'],['Amable','Guiar con empatía y paciencia.'],['Constante','Repetir pequeños actos con regularidad.'],['Atento','Estar presente y notar cada avance.']],
    ['¿La petición fue suficientemente sencilla?','¿Hubo alegría y ánimo hoy?','¿Mantuve la confianza ante la dificultad?','¿Mis palabras fueron amables y respetuosas?','¿Di ejemplo con atención y constancia?']
  ),
  zh: () => localeData(
    ['快乐','希望','信心','感恩','关爱','宽容','谦逊','诚实','智慧','礼貌与公正','责任','明辨','守信','积极赞美','智慧沟通','愿景与梦想'],
    ['微笑的给予','关注的给予','语言的给予','感恩的给予','宽容的给予','行动的给予','空间的给予'],
    [['简单','把能力拆成孩子能完成的小步骤。'],['快乐','营造鼓励和愉快的学习氛围。'],['信任','即使不完美，也相信孩子的能力。'],['温和','以同理心和耐心引导，不强迫。'],['坚持','规律重复小行动，让它成为习惯。'],['用心','全心陪伴，看见每一点进步。']],
    ['我的要求是否足够简单？','今天的互动有快乐和鼓励吗？','遇到困难时，我仍然相信孩子吗？','我的语言温和且尊重吗？','我是否用心、持续地做好榜样？']
  ),
  ja: () => localeData(
    ['喜び','希望','自信','感謝','愛情','寛容','謙虚','正直','知恵','礼儀と公正','責任','判断力','信頼性','前向きな称賛','思いやりある対話','ビジョンと夢'],
    ['笑顔の贈り物','まなざしの贈り物','言葉の贈り物','感謝の贈り物','許しの贈り物','行動の贈り物','場所の贈り物'],
    [['シンプル','できる小さな段階に分けます。'],['楽しく','励ましに満ちた学びの場を作ります。'],['信じる','うまくいかない時も力を信じます。'],['穏やか','共感と忍耐をもって導きます。'],['継続','小さな実践を規則的に重ねます。'],['心を込める','今に集中し小さな成長に気づきます。']],
    ['お願いは始めやすい大きさでしたか？','今日は喜びと励ましがありましたか？','失敗しても子どもを信じましたか？','言葉は穏やかで敬意がありましたか？','心を込めて継続的に手本を示しましたか？']
  ),
  ko: () => localeData(
    ['기쁨','희망','자신감','감사','사랑','용서','겸손','정직','지혜','예절과 공정','책임','분별력','신뢰성','긍정적 인정','지혜로운 소통','비전과 꿈'],
    ['미소의 나눔','관심의 나눔','말의 나눔','감사의 나눔','용서의 나눔','행동의 나눔','자리의 나눔'],
    [['단순하게','기술을 아이가 할 수 있는 작은 단계로 나눕니다.'],['즐겁게','격려가 가득한 배움의 환경을 만듭니다.'],['믿으며','완벽하지 않아도 아이의 가능성을 믿습니다.'],['부드럽게','공감과 인내로 안내합니다.'],['꾸준하게','작은 실천을 규칙적으로 반복합니다.'],['정성을 다해','온전히 함께하며 작은 발전을 발견합니다.']],
    ['오늘의 부탁은 시작하기에 충분히 쉬웠나요?','오늘 기쁨과 격려가 있었나요?','어려움 속에서도 아이를 믿었나요?','내 말은 부드럽고 존중하는 표현이었나요?','정성을 다해 꾸준히 본보기가 되었나요?']
  ),
};

function localeData(portraitNames: string[], givingNames: string[], goldWords: [string,string][], checklist: string[]): CompactData {
  const language = portraitNames[0] === 'Freude' ? 'de' : portraitNames[0] === 'Gioia' ? 'it' : portraitNames[0] === 'Alegría' ? 'es' : portraitNames[0] === '快乐' ? 'zh' : portraitNames[0] === '喜び' ? 'ja' : 'ko';
  const configs = getGenericConfig(language);
  return {
    ui: configs.ui,
    portraitNames,
    actionTemplates: configs.actions,
    givings: givingNames.map((name, index) => [name, configs.givingSub[index], configs.givingMeaning[index], configs.givingPractice[index]]),
    goldWords,
    checklist,
  };
}

function getGenericConfig(language: 'de'|'it'|'es'|'zh'|'ja'|'ko') {
  if (language === 'de') return genericGerman();
  if (language === 'it') return genericItalian();
  if (language === 'es') return genericSpanish();
  if (language === 'zh') return genericChinese();
  if (language === 'ja') return genericJapanese();
  return genericKorean();
}

function genericGerman() { return genericWestern('de'); }
function genericItalian() { return genericWestern('it'); }
function genericSpanish() { return genericWestern('es'); }

function genericWestern(language: 'de'|'it'|'es') {
  const d = WESTERN_UI[language];
  return { ui:d.ui, actions:d.actions, givingSub:d.givingSub, givingMeaning:d.givingMeaning, givingPractice:d.givingPractice };
}

const WESTERN_UI = {
  de: westernConfig('0–18 Jahre','Für','wurde hinzugefügt','Charakter','Tugend','Fähigkeit','Vision','abgeschlossen','Nehmen Sie sich vor dem Schlafen zwei Minuten Zeit.','Abendliche Elternreflexion','Alter des Kindes wählen:','Ratgeber schließen','Aktuelles Kind','Jahre','Konkrete Handlungen für','Ratgeber für Charakter und Geben','Werden • Vorleben • Beständig leben','Geben bedeutet mehr als Geld: Wir können täglich ein Lächeln, Aufmerksamkeit, gute Worte, Dankbarkeit, Vergebung, Hilfe und Raum schenken.','Bedeutung:','Heute üben:','Großzügigkeit und Charakter im Alltag stärken','Sieben Arten zu geben','Sechs Grundsätze kluger Begleitung:','9 Stärken • 4 Tugenden • 2 Fähigkeiten • 1 Vision • 7 Gaben','Ratgeber: 16 Stärken und Geben','Kinder lernen diese Werte am tiefsten, wenn Erwachsene sie zuerst leben. Ruhe, Freude und Beständigkeit geben ein klares Vorbild.','„Erklären Sie den Wert nicht nur – leben Sie vor, was Ihr Kind lernen soll.“','Die Kunst des Vorbilds','Bitte zuerst ein Kinderprofil wählen oder erstellen.','7 Arten zu geben','16 Stärken und 4 Phasen','Vorbild sein',['Mit Wärme willkommen heißen','Aufmerksam wahrnehmen','Ermutigend sprechen','Dankbar leben','Fehler verzeihen','Freundlich handeln','Platz und Chancen teilen']),
  it: westernConfig('0–18 anni','Applica a','è stato aggiunto','Carattere','Virtù','Capacità','Visione','completati','Dedica due minuti prima di dormire alla tua giornata.','Riflessione serale per genitori','Scegli l’età del bambino:','Chiudi guida','Bambino attuale','anni','Azioni concrete per','Guida al carattere e al dono','Diventa • Dai l’esempio • Vivi con coerenza','Donare non significa solo denaro: ogni giorno possiamo offrire un sorriso, attenzione, parole gentili, gratitudine, perdono, aiuto e spazio.','Significato:','Da provare:','Coltivare generosità e carattere ogni giorno','Sette modi di donare','Sei principi per una guida saggia:','9 punti di forza • 4 virtù • 2 capacità • 1 visione • 7 doni','Guida alle 16 qualità e al dono','I bambini imparano queste qualità quando gli adulti le vivono per primi. Calma, gioia e coerenza offrono un esempio chiaro.','«Non limitarti a spiegare: vivi ciò che vuoi insegnare.»','L’arte di dare l’esempio','Scegli o crea prima un profilo bambino.','7 modi di donare','16 qualità e 4 fasi','Dare l’esempio',['Accogliere con calore','Prestare attenzione','Parole che incoraggiano','Vivere con gratitudine','Fare spazio agli errori','Gentilezza in azione','Condividere spazio e opportunità']),
  es: westernConfig('0–18 años','Aplicar a','se ha añadido','Carácter','Virtud','Capacidad','Visión','completados','Dedica dos minutos antes de dormir a revisar tu ejemplo.','Reflexión nocturna para familias','Elige la edad del niño:','Cerrar guía','Niño actual','años','Acciones concretas para','Guía de carácter y generosidad','Conviértete • Da ejemplo • Vive con constancia','Dar es más que dinero: cada día podemos ofrecer una sonrisa, atención, palabras amables, gratitud, perdón, ayuda y espacio.','Significado:','Para practicar:','Cultivar generosidad y carácter cada día','Siete formas de dar','Seis principios de crianza consciente:','9 fortalezas • 4 virtudes • 2 capacidades • 1 visión • 7 regalos','Guía de 16 cualidades y generosidad','Los niños aprenden estas cualidades cuando los adultos las viven primero. La calma, la alegría y la constancia ofrecen un ejemplo claro.','«No te limites a explicar: vive lo que quieres enseñar.»','El arte de dar ejemplo','Elige o crea primero un perfil infantil.','7 formas de dar','16 cualidades y 4 etapas','Dar ejemplo',['Recibir con calidez','Mirar con atención','Palabras que animan','Vivir con gratitud','Dar espacio al error','Bondad en acción','Compartir espacio y oportunidades']),
};

type GenericConfig = { ui: PortraitGuideUi; actions: Record<AgeStage,(trait:string)=>string>; givingSub:string[]; givingMeaning:string[]; givingPractice:string[] };

function westernConfig(ageBadge:string,applyWord:string,success:string,personality:string,virtue:string,capacity:string,vision:string,complete:string,checkSub:string,checkTitle:string,chooseAge:string,close:string,current:string,years:string,details:string,dialog:string,footer:string,givingIntro:string,givingMeaning:string,givingPractice:string,givingSubtitle:string,givingTitle:string,goldTitle:string,headerSub:string,headerTitle:string,modelIntro:string,modelQuote:string,modelTitle:string,noChild:string,tabGivings:string,tabMatrix:string,tabModeling:string,givingSub:string[]): GenericConfig {
  const isDe = ageBadge.includes('Jahre'); const isIt = ageBadge.includes('anni');
  const action = (stage:AgeStage,t:string) => isDe ? ({'0-3':`Leben Sie ${t} täglich in einer sichtbaren Familienroutine vor und benennen Sie die Handlung ruhig.`,'3-6':`Laden Sie Ihr Kind zu einer kleinen Handlung für ${t} ein. Machen Sie sie zuerst vor und würdigen Sie den Einsatz.`,'6-12':`Übertragen Sie eine echte Verantwortung, die ${t} stärkt, und besprechen Sie abends gemeinsam das Ergebnis.`,'12-18':`Helfen Sie Ihrem Teenager, einen eigenen Maßstab für ${t} zu formulieren, anzuwenden und die Wirkung zu prüfen.`}[stage]) : isIt ? ({'0-3':`Mostra ${t} ogni giorno in una routine familiare visibile e descrivi con calma ciò che fai.`,'3-6':`Invita il bambino a un piccolo gesto di ${t}. Mostralo prima e valorizza l’impegno.`,'6-12':`Affida una responsabilità reale che sviluppi ${t}, poi riflettete insieme sul risultato.`,'12-18':`Aiuta l’adolescente a definire uno standard personale di ${t}, applicarlo e valutarne l’impatto.`}[stage]) : ({'0-3':`Modela ${t} cada día en una rutina familiar visible y explica con calma lo que haces.`,'3-6':`Invita al niño a un pequeño acto de ${t}. Muéstralo primero y valora el esfuerzo.`,'6-12':`Ofrece una responsabilidad real que desarrolle ${t} y revisad juntos el resultado al final del día.`,'12-18':`Ayuda al adolescente a definir un criterio personal de ${t}, aplicarlo y observar su impacto.`}[stage]);
  return {
    ui:{ageBadge,applyFor:(n)=>`${applyWord} ${n}`,applySuccess:(s,n)=>`${s} ${success} ${n}.`,categories:{personality,virtue,capacity,vision},checklistComplete:(n)=>`${n}/5 ${complete}`,checklistSubtitle:checkSub,checklistTitle:checkTitle,chooseAge,close,currentChild:(n,a)=>`${current}: ${n} (${a} ${years})`,detailsTitle:(s)=>`${details} ${s}:`,dialogLabel:dialog,footer,givingIntro,givingMeaning,givingPractice,givingSubtitle,givingTitle,goldWordsTitle:goldTitle,headerSubtitle:headerSub,headerTitle,modelingIntro:modelIntro,modelingQuote:modelQuote,modelingTitle:modelTitle,noChild,tabGivings,tabMatrix,tabModeling},
    actions:{'0-3':(t)=>action('0-3',t),'3-6':(t)=>action('3-6',t),'6-12':(t)=>action('6-12',t),'12-18':(t)=>action('12-18',t)},
    givingSub, givingMeaning:givingSub.map((s)=>`${s}.`), givingPractice:givingSub.map((s)=>`${s} ${isDe?'heute bewusst üben.':isIt?'oggi con un gesto concreto.':'hoy con una acción concreta.'}`),
  };
}

function genericChinese(){return easternConfig('zh');} function genericJapanese(){return easternConfig('ja');} function genericKorean(){return easternConfig('ko');}

function easternConfig(language:'zh'|'ja'|'ko'): GenericConfig {
  const c = EASTERN_UI[language];
  return {
    ui:c.ui,
    actions:{'0-3':(t)=>c.actions[0](t),'3-6':(t)=>c.actions[1](t),'6-12':(t)=>c.actions[2](t),'12-18':(t)=>c.actions[3](t)},
    givingSub:c.givingNames, givingMeaning:c.givingNames.map((s)=>c.meaning(s)), givingPractice:c.givingNames.map((s)=>c.practice(s)),
  };
}

const EASTERN_UI = {
  zh: easternValues('0–18 岁','应用给','已为','添加','品格','美德','能力','愿景','已完成','睡前用两分钟回顾今天的榜样。','父母晚间反思','选择孩子的年龄：','关闭指南','当前孩子','岁','项具体行动','品格与给予指南','先成为 • 做榜样 • 坚持践行','给予不只是金钱。每天都可以送出微笑、关注、善意的话、感恩、宽容、帮助和空间。','意义：','今日实践：','在日常行动中培养慷慨与品格','七种日常给予','智慧育儿的六项原则：','9 项品格 • 4 项美德 • 2 项能力 • 1 个愿景 • 7 种给予','16 项品格与给予指南','父母先活出这些品质，孩子才能深刻学习。平静、快乐且一致的行动，是最清晰的榜样。','“不要只讲道理，要活出你希望孩子学会的样子。”','以身作则的艺术','请先选择或创建孩子档案。','7 种给予','16 项品格与 4 个阶段','以身作则',['温暖地迎接','用心关注','说鼓励的话','心怀感恩','包容错误','用行动帮助','分享位置与机会']),
  ja: easternValues('0～18歳','適用：','に','を追加しました','人格','徳','力','ビジョン','完了','眠る前に2分間、今日の手本を振り返りましょう。','保護者の夜の振り返り','お子さまの年齢を選択：','ガイドを閉じる','現在のお子さま','歳','の16の実践','人格と贈り物のガイド','なる • 示す • 続けて生きる','贈るものはお金だけではありません。笑顔、まなざし、優しい言葉、感謝、許し、助け、場所を毎日届けられます。','意味：','今日の実践：','日々の行動で思いやりと人格を育てる','7つの贈り物','賢く寄り添う6つの原則：','9つの強み • 4つの徳 • 2つの力 • 1つのビジョン • 7つの贈り物','16の人格と贈り物ガイド','大人が先に生きることで、子どもはこれらの姿を深く学びます。穏やかで楽しく一貫した行動が明確な手本になります。','「説明するだけでなく、学んでほしい姿を自分から生きましょう。」','手本で導く技術','先にお子さまのプロフィールを選択または作成してください。','7つの贈り物','16の人格と4段階','手本で導く',['温かく迎える','相手を見て聴く','励ます言葉','感謝する心','失敗を受け止める','行動で助ける','場所と機会を分かち合う']),
  ko: easternValues('0~18세','적용: ','에게 ','을 추가했습니다','인성','덕목','역량','비전','완료','잠들기 전 2분 동안 오늘의 본보기를 돌아보세요.','부모의 저녁 성찰','아이의 나이를 선택하세요:','안내서 닫기','현재 아이','세','를 위한 16가지 실천','인성과 나눔 안내서','먼저 되기 • 본보기 보이기 • 꾸준히 실천하기','나눔은 돈만을 뜻하지 않습니다. 미소, 관심, 따뜻한 말, 감사, 용서, 도움, 자리를 매일 나눌 수 있습니다.','의미:','오늘의 실천:','일상에서 나눔과 인성을 기르기','일곱 가지 일상 나눔','지혜로운 양육의 여섯 원칙:','9가지 인성 • 4가지 덕목 • 2가지 역량 • 1가지 비전 • 7가지 나눔','16가지 인성과 나눔 안내서','어른이 먼저 살아 낼 때 아이는 이 품성을 깊이 배웁니다. 평온하고 즐거우며 일관된 행동이 분명한 본보기가 됩니다.','“설명만 하지 말고, 아이가 배우길 바라는 모습을 먼저 살아 내세요.”','본보기로 이끄는 기술','먼저 아이 프로필을 선택하거나 만들어 주세요.','7가지 나눔','16가지 인성과 4단계','본보기로 이끌기',['따뜻하게 맞이하기','눈을 맞추고 경청하기','격려하는 말 건네기','감사하는 마음 갖기','실수를 품어 주기','행동으로 돕기','자리와 기회 나누기']),
};

interface EasternValues {
  ui: PortraitGuideUi;
  actions: [(trait:string)=>string,(trait:string)=>string,(trait:string)=>string,(trait:string)=>string];
  givingNames: string[];
  meaning: (value:string)=>string;
  practice: (value:string)=>string;
}

function easternValues(ageBadge:string,apply:string,successPrefix:string,successSuffix:string,personality:string,virtue:string,capacity:string,vision:string,complete:string,checkSub:string,checkTitle:string,chooseAge:string,close:string,current:string,years:string,detailsSuffix:string,dialog:string,footer:string,givingIntro:string,givingMeaning:string,givingPractice:string,givingSubtitle:string,givingTitle:string,goldTitle:string,headerSub:string,headerTitle:string,modelIntro:string,modelQuote:string,modelTitle:string,noChild:string,tabGivings:string,tabMatrix:string,tabModeling:string,givingNames:string[]): EasternValues {
  const isZh=languageFromAge(ageBadge)==='zh', isJa=languageFromAge(ageBadge)==='ja';
  return {
    ui:{ageBadge,applyFor:(n)=>`${apply}${n}`,applySuccess:(s,n)=>`${successPrefix}${n}${isZh?'添加了':successSuffix}${s}${isZh?'行动方案。':''}`,categories:{personality,virtue,capacity,vision},checklistComplete:(n)=>`${n}/5 ${complete}`,checklistSubtitle:checkSub,checklistTitle:checkTitle,chooseAge,close,currentChild:(n,a)=>`${current}：${n}（${a}${years}）`,detailsTitle:(s)=>`${s}${detailsSuffix}：`,dialogLabel:dialog,footer,givingIntro,givingMeaning,givingPractice,givingSubtitle,givingTitle,goldWordsTitle:goldTitle,headerSubtitle:headerSub,headerTitle,modelingIntro:modelIntro,modelingQuote:modelQuote,modelingTitle:modelTitle,noChild,tabGivings,tabMatrix,tabModeling},
    actions: isZh ? [(t:string)=>`每天在一个清晰的家庭习惯中示范${t}，并温和地说出自己的行动。`,(t:string)=>`邀请孩子完成一个体现${t}的小行动。先示范，再肯定努力。`,(t:string)=>`让孩子承担一项培养${t}的真实责任，晚上一起回顾结果。`,(t:string)=>`帮助青少年为${t}设定个人标准，在真实选择中实践并复盘影响。`] : isJa ? [(t:string)=>`毎日、家族の分かりやすい習慣の中で${t}を示し、行動を穏やかに言葉にします。`,(t:string)=>`${t}につながる小さな行動を一つ誘います。先に見本を示し、努力を認めます。`,(t:string)=>`${t}を育てる実際の役割を任せ、夜に結果を一緒に振り返ります。`,(t:string)=>`${t}について自分の基準を定め、実際の選択で試し、影響を振り返るよう支えます。`] : [(t:string)=>`매일 눈에 보이는 가족 습관에서 ${t}을 보여 주고 행동을 차분히 말로 설명하세요.`,(t:string)=>`${t}을 실천하는 작은 행동을 제안하세요. 먼저 보여 주고 결과보다 노력을 알아주세요.`,(t:string)=>`${t}을 기르는 실제 책임을 맡기고 저녁에 결과를 함께 돌아보세요.`,(t:string)=>`${t}에 대한 자기 기준을 세우고 실제 선택에 적용한 뒤 영향을 성찰하도록 도와주세요.`],
    givingNames, meaning:(s:string)=>isZh?`${s}让他人感到被看见、被尊重和被支持。`:isJa?`${s}ことで、相手は大切にされ支えられていると感じます。`:`${s}를 통해 상대는 존중받고 지지받는다고 느낍니다.`, practice:(s:string)=>isZh?`今天用一个具体行动练习${s}。`:isJa?`今日、具体的な行動で${s}ことを実践します。`:`오늘 구체적인 행동으로 ${s}를 실천하세요.`,
  };
}

function languageFromAge(ageBadge:string):'zh'|'ja'|'ko' { return ageBadge.includes(' 岁')?'zh':ageBadge.includes('～')?'ja':'ko'; }

export function getPortraitGuideCopy(language: Language): PortraitGuideCopy {
  if (language === 'vi') {
    return { ui: viUi, portraits: PORTRAITS_16, givings: SEVEN_GIVINGS, goldWords: SIX_GOLD_WORDS, checklist: PARENT_SELF_CHECKLIST };
  }
  const locale = LOCALES[language] ?? makeCompactLocale(language as Exclude<Language, 'vi' | 'en' | 'fr'>);
  return {
    ui: locale.ui,
    portraits: PORTRAITS_16.map((item, index) => ({ ...item, name: locale.portraitNames[index], actionsByStage: { '0-3':locale.actionTemplates['0-3'](locale.portraitNames[index]), '3-6':locale.actionTemplates['3-6'](locale.portraitNames[index]), '6-12':locale.actionTemplates['6-12'](locale.portraitNames[index]), '12-18':locale.actionTemplates['12-18'](locale.portraitNames[index]) } })),
    givings: SEVEN_GIVINGS.map((item,index)=>({ ...item, ...locale.givings[index] })),
    goldWords: locale.goldWords,
    checklist: locale.checklist,
  };
}
