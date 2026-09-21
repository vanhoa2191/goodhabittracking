import type { HabitActivity, Language, Reward } from '@/types';

type DemoText = readonly [title: string, description: string];

const ACTIVITY_IDS = ['act-1','act-2','act-3','act-4','act-5','act-6','act-baby-1','act-baby-2','act-baby-3','act-baby-4'] as const;
const REWARD_IDS = ['rew-1','rew-2','rew-3','rew-4'] as const;

const VI: readonly DemoText[] = [
  ['Nhan thí: Tươi cười chào buổi sáng','Nở nụ cười rạng rỡ và khoanh tay chào ông bà, bố mẹ khi ngủ dậy'],
  ['Đánh răng sáng & tối đúng 2 phút','Chăm sóc hàm răng trắng tinh và khỏe mạnh'],
  ['Văn hóa bàn ăn: Mời cơm & ngồi ăn không màn hình','Mời cả nhà ăn cơm, tập trung ăn ngon miệng, không xem điện thoại hay TV'],
  ['Sức học tập & Bài học tâm đắc hôm nay','Hoàn thành bài tập và chia sẻ với bố mẹ 1 điều hay bé học được trong ngày'],
  ['Thân thí: Tự bưng bát đĩa & dọn đồ chơi','Chủ động cất bát đĩa vào bồn và lau dọn góc học tập ngăn nắp'],
  ['Phẩm chất Tín: Chuẩn bị sách vở & ngủ trước 21h30','Giữ đúng lời hứa với bố mẹ, tự sắp xếp cặp sách và đi ngủ đúng giờ'],
  ['[Thân giáo Ba Mẹ] Nụ cười rạng rỡ đón bé thức dậy','Bố mẹ luôn cười tươi rạng rỡ khi bế và trò chuyện cùng con buổi sáng (Nhan thí)'],
  ['[Thân giáo Ba Mẹ] Ôm ấp con & Nói lời yêu thương ấm áp','Ôm ấp vỗ về bé mỗi ngày, dùng giọng nói dịu dàng gọi tên con (Thân thí)'],
  ['[Thân giáo Ba Mẹ] Mỉm cười bao dung khi bé làm đổ sữa/nước','Bố mẹ giữ tâm thái an vui, không dán nhãn, nhẹ nhàng dọn dẹp và làm mẫu cho con (Phòng thí)'],
  ['[Thân giáo Ba Mẹ] Đọc sách tranh giọng truyền cảm trước giờ ngủ','Cùng bé lật xem tranh, gieo hạt giống ngôn từ ánh sáng và thói quen đọc sách (Trí tuệ)'],
  ['Xem phim hoạt hình 30 phút','Được tự chọn 1 tập phim hoạt hình yêu thích'],
  ['Được chọn món ăn tối yêu thích','Gia đình cùng ăn món bé thích nhất (pizza, gà rán, canh sườn...)'],
  ['Mua 1 cuốn truyện tranh mới','Bố mẹ dẫn đi nhà sách chọn 1 cuốn sách/truyện yêu thích'],
  ['Chuyến đi chơi công viên cuối tuần','Cả nhà cùng đi chơi công viên nước hoặc khu vui chơi'],
];

const EN: readonly DemoText[] = [
  ['Gift a smile: Say good morning cheerfully','Smile warmly and greet your grandparents and parents when you wake up'],
  ['Brush your teeth for 2 minutes, morning and night','Keep your teeth clean, strong, and healthy'],
  ['Family mealtime: Greet everyone and eat without screens','Invite everyone to eat, enjoy the meal together, and put phones and TV away'],
  ['Finish schoolwork and share one thing you learned','Complete your homework and tell your parents one useful thing you learned today'],
  ['Help out: Put away dishes and tidy your toys','Put your dishes in the sink and leave your study area neat'],
  ['Keep your word: Pack your school bag and sleep by 9:30 PM','Keep your promise, prepare your school bag, and go to bed on time'],
  ['[Parent role model] Welcome your baby with a bright smile','Smile warmly while holding and talking with your baby in the morning'],
  ['[Parent role model] Hug your child and speak with warmth','Comfort your baby every day and say their name in a gentle voice'],
  ['[Parent role model] Stay calm when your baby spills milk or water','Stay patient, avoid labels, clean up gently, and show your child how'],
  ['[Parent role model] Read a picture book before bedtime','Explore the pictures together and nurture a love of words and reading'],
  ['Watch cartoons for 30 minutes','Choose one favorite cartoon episode'],
  ['Choose your favorite dinner','Enjoy the child’s favorite meal together as a family'],
  ['Get a new comic or storybook','Visit a bookstore and choose one favorite book'],
  ['Weekend park adventure','Visit a water park or amusement park together as a family'],
];

const TRANSLATIONS: Record<Exclude<Language, 'vi' | 'en'>, readonly DemoText[]> = {
  fr: [
    ['Offrez un sourire : dites bonjour joyeusement','Souriez chaleureusement et saluez vos grands-parents et vos parents au réveil'],
    ['Brossez-vous les dents pendant 2 minutes, matin et soir','Gardez vos dents propres, fortes et saines'],
    ['Repas en famille : saluez tout le monde et mangez sans écran','Invitez tout le monde à manger, profitez du repas ensemble et rangez téléphones et télévision'],
    ['Terminez vos devoirs et partagez une chose apprise','Dites à vos parents une chose utile que vous avez apprise aujourd’hui'],
    ['Aidez : rangez la vaisselle et vos jouets','Mettez votre vaisselle dans l’évier et laissez votre coin bureau propre'],
    ['Tenez parole : préparez votre cartable et dormez avant 21 h 30','Tenez votre promesse, préparez votre cartable et couchez-vous à l’heure'],
    ['[Parent modèle] Accueillez votre bébé avec un grand sourire','Souriez chaleureusement en tenant votre bébé et en lui parlant le matin'],
    ['[Parent modèle] Embrassez votre enfant et parlez avec chaleur','Réconfortez votre bébé chaque jour et prononcez son nom d’une voix douce'],
    ['[Parent modèle] Restez calme si votre bébé renverse du lait ou de l’eau','Restez patient, évitez les étiquettes, nettoyez doucement et montrez comment faire'],
    ['[Parent modèle] Lisez un livre d’images avant le coucher','Explorez les images ensemble et cultivez l’amour des mots et de la lecture'],
    ['Regardez des dessins animés pendant 30 minutes','Choisissez un épisode préféré'],
    ['Choisissez votre dîner préféré','Savourez en famille le repas préféré de l’enfant'],
    ['Recevez une nouvelle BD ou un livre d’histoires','Visitez une librairie et choisissez un livre préféré'],
    ['Aventure au parc le week-end','Visitez en famille un parc aquatique ou un parc d’attractions'],
  ],
  de: [
    ['Schenke ein Lächeln: Sage fröhlich guten Morgen','Lächle herzlich und begrüße beim Aufwachen deine Großeltern und Eltern'],
    ['Putze morgens und abends 2 Minuten die Zähne','Halte deine Zähne sauber, stark und gesund'],
    ['Familienessen: Begrüße alle und iss ohne Bildschirm','Genießt das Essen gemeinsam und legt Handys und Fernseher beiseite'],
    ['Erledige die Schulaufgaben und teile etwas Gelerntes','Erzähle deinen Eltern eine nützliche Sache, die du heute gelernt hast'],
    ['Hilf mit: Räume Geschirr und Spielsachen weg','Stelle dein Geschirr in die Spüle und hinterlasse deinen Lernplatz ordentlich'],
    ['Halte dein Wort: Packe die Schultasche und schlafe bis 21:30 Uhr','Halte dein Versprechen, bereite deine Schultasche vor und gehe pünktlich ins Bett'],
    ['[Eltern als Vorbild] Begrüße dein Baby mit einem strahlenden Lächeln','Lächle warm, während du dein Baby morgens hältst und mit ihm sprichst'],
    ['[Eltern als Vorbild] Umarme dein Kind und sprich liebevoll','Tröste dein Baby täglich und sage seinen Namen mit sanfter Stimme'],
    ['[Eltern als Vorbild] Bleibe ruhig, wenn dein Baby etwas verschüttet','Bleibe geduldig, vermeide Etiketten, räume sanft auf und zeige, wie es geht'],
    ['[Eltern als Vorbild] Lies vor dem Schlafengehen ein Bilderbuch','Entdeckt gemeinsam die Bilder und fördert die Freude an Worten und Büchern'],
    ['30 Minuten Zeichentrick schauen','Wähle eine Lieblingsfolge'],
    ['Wähle dein Lieblingsessen','Genießt gemeinsam das Lieblingsessen des Kindes'],
    ['Ein neuer Comic oder ein neues Geschichtenbuch','Besuche eine Buchhandlung und wähle ein Lieblingsbuch'],
    ['Parkabenteuer am Wochenende','Besucht gemeinsam einen Wasser- oder Freizeitpark'],
  ],
  it: [
    ['Regala un sorriso: dai il buongiorno con allegria','Sorridi e saluta nonni e genitori quando ti svegli'],
    ['Lavati i denti per 2 minuti, mattina e sera','Mantieni i denti puliti, forti e sani'],
    ['Pasto in famiglia: saluta tutti e mangia senza schermi','Godetevi il pasto insieme e mettete via telefoni e TV'],
    ['Finisci i compiti e condividi ciò che hai imparato','Racconta ai tuoi genitori una cosa utile che hai imparato oggi'],
    ['Dai una mano: sistema piatti e giocattoli','Metti i piatti nel lavandino e lascia in ordine la zona studio'],
    ['Mantieni la parola: prepara lo zaino e dormi entro le 21:30','Mantieni la promessa, prepara lo zaino e vai a letto in orario'],
    ['[Genitore modello] Accogli il bambino con un grande sorriso','Sorridi mentre tieni in braccio e parli con il bambino al mattino'],
    ['[Genitore modello] Abbraccia tuo figlio e parla con calore','Conforta il bambino ogni giorno e pronuncia il suo nome con voce gentile'],
    ['[Genitore modello] Mantieni la calma quando il bambino rovescia qualcosa','Sii paziente, evita etichette, pulisci con calma e mostra come fare'],
    ['[Genitore modello] Leggi un libro illustrato prima di dormire','Esplorate insieme le immagini e coltivate l’amore per parole e lettura'],
    ['Guarda i cartoni animati per 30 minuti','Scegli un episodio preferito'],
    ['Scegli la tua cena preferita','Godetevi in famiglia il pasto preferito del bambino'],
    ['Un nuovo fumetto o libro di fiabe','Visita una libreria e scegli un libro preferito'],
    ['Avventura al parco nel fine settimana','Visitate insieme un parco acquatico o divertimenti'],
  ],
  es: [
    ['Regala una sonrisa: da los buenos días con alegría','Sonríe y saluda a tus abuelos y padres al despertar'],
    ['Cepíllate los dientes 2 minutos, mañana y noche','Mantén tus dientes limpios, fuertes y sanos'],
    ['Comida familiar: saluda a todos y come sin pantallas','Disfruten juntos la comida y guarden teléfonos y televisión'],
    ['Termina las tareas y comparte algo que aprendiste','Cuéntales a tus padres algo útil que hayas aprendido hoy'],
    ['Ayuda: guarda los platos y ordena tus juguetes','Pon los platos en el fregadero y deja ordenada tu zona de estudio'],
    ['Cumple tu palabra: prepara la mochila y duerme antes de las 21:30','Cumple tu promesa, prepara la mochila y acuéstate a tiempo'],
    ['[Padres como modelo] Recibe al bebé con una gran sonrisa','Sonríe mientras sostienes y hablas con tu bebé por la mañana'],
    ['[Padres como modelo] Abraza a tu hijo y háblale con cariño','Consuela al bebé cada día y di su nombre con voz suave'],
    ['[Padres como modelo] Mantén la calma si el bebé derrama algo','Ten paciencia, evita etiquetas, limpia con calma y enseña cómo hacerlo'],
    ['[Padres como modelo] Lee un libro ilustrado antes de dormir','Exploren juntos las imágenes y cultiven el amor por las palabras y la lectura'],
    ['Mira dibujos animados durante 30 minutos','Elige un episodio favorito'],
    ['Elige tu cena favorita','Disfruten en familia de la comida favorita del niño'],
    ['Un nuevo cómic o libro de cuentos','Visita una librería y elige un libro favorito'],
    ['Aventura en el parque el fin de semana','Visiten juntos un parque acuático o de atracciones'],
  ],
  zh: [
    ['送出微笑：开心地说早安','醒来时微笑着问候爷爷奶奶和爸爸妈妈'],
    ['早晚各刷牙 2 分钟','保持牙齿清洁、坚固和健康'],
    ['家庭用餐：问候大家并远离屏幕','邀请大家一起吃饭，收起手机并关掉电视'],
    ['完成作业并分享一件学到的事','告诉父母你今天学到的一件有用的事'],
    ['主动帮忙：收好餐具和玩具','把餐具放进水槽，并整理好学习区域'],
    ['信守承诺：收好书包并在 21:30 前睡觉','遵守约定，准备好书包并按时上床睡觉'],
    ['【父母榜样】用灿烂笑容迎接宝宝醒来','早晨抱着宝宝说话时保持温暖的笑容'],
    ['【父母榜样】拥抱孩子并温柔说话','每天安抚宝宝，用轻柔的声音呼唤名字'],
    ['【父母榜样】宝宝打翻东西时保持冷静','保持耐心，不贴标签，温柔清理并示范做法'],
    ['【父母榜样】睡前读一本绘本','一起看图，培养对文字和阅读的热爱'],
    ['看 30 分钟动画片','选择一集喜欢的动画片'],
    ['选择最喜欢的晚餐','全家一起享用孩子最喜欢的一餐'],
    ['获得一本新漫画或故事书','去书店选择一本喜欢的书'],
    ['周末公园探险','全家一起去水上乐园或游乐园'],
  ],
  ja: [
    ['笑顔を贈る：元気におはようを言う','目が覚めたら笑顔で祖父母や両親に挨拶しましょう'],
    ['朝と夜に2分間歯を磨く','歯を清潔で丈夫、健康に保ちましょう'],
    ['家族の食事：みんなに挨拶して画面なしで食べる','一緒に食事を楽しみ、スマホとテレビを片付けましょう'],
    ['宿題を終えて学んだことを一つ話す','今日学んだ役立つことを一つ両親に伝えましょう'],
    ['お手伝い：食器とおもちゃを片付ける','食器を流しに置き、勉強場所を整えましょう'],
    ['約束を守る：かばんを準備して21時30分までに寝る','約束を守り、かばんを用意して時間どおりに寝ましょう'],
    ['【保護者のお手本】明るい笑顔で赤ちゃんを迎える','朝、赤ちゃんを抱いて話しかけながら温かく笑いましょう'],
    ['【保護者のお手本】子どもを抱きしめて優しく話す','毎日赤ちゃんをあやし、優しい声で名前を呼びましょう'],
    ['【保護者のお手本】こぼしても落ち着いて対応する','辛抱強く、決めつけず、優しく片付けてやり方を示しましょう'],
    ['【保護者のお手本】寝る前に絵本を読む','一緒に絵を見て、言葉と読書への興味を育てましょう'],
    ['アニメを30分見る','好きなエピソードを一つ選ぶ'],
    ['好きな夕食を選ぶ','家族で子どもの好きな料理を楽しむ'],
    ['新しい漫画や物語の本をもらう','本屋で好きな本を一冊選ぶ'],
    ['週末の公園アドベンチャー','家族でウォーターパークや遊園地に行く'],
  ],
  ko: [
    ['미소 선물하기: 즐겁게 아침 인사하기','일어나면 웃으며 조부모님과 부모님께 인사해요'],
    ['아침저녁으로 2분 동안 양치하기','치아를 깨끗하고 튼튼하게 지켜요'],
    ['가족 식사: 모두에게 인사하고 화면 없이 먹기','함께 식사를 즐기고 휴대폰과 TV를 치워요'],
    ['숙제를 마치고 배운 것 한 가지 나누기','오늘 배운 유용한 것 한 가지를 부모님께 말해요'],
    ['도와주기: 그릇과 장난감 정리하기','그릇을 싱크대에 놓고 공부 공간을 정돈해요'],
    ['약속 지키기: 가방을 챙기고 9시 30분까지 자기','약속을 지키고 책가방을 준비해 제시간에 자요'],
    ['[부모 본보기] 환한 미소로 아기 맞이하기','아침에 아기를 안고 이야기하며 따뜻하게 웃어 주세요'],
    ['[부모 본보기] 아이를 안아 주고 따뜻하게 말하기','매일 아기를 달래고 부드러운 목소리로 이름을 불러 주세요'],
    ['[부모 본보기] 아기가 흘려도 침착하게 대응하기','인내심을 갖고 낙인찍지 말며 부드럽게 치우고 방법을 보여 주세요'],
    ['[부모 본보기] 잠들기 전 그림책 읽기','그림을 함께 살펴보며 말과 독서에 대한 사랑을 키워요'],
    ['30분 동안 만화 보기','좋아하는 만화 한 편 고르기'],
    ['좋아하는 저녁 메뉴 고르기','온 가족이 아이가 좋아하는 식사를 함께 즐겨요'],
    ['새 만화책이나 동화책 받기','서점에서 좋아하는 책 한 권을 골라요'],
    ['주말 공원 모험','가족과 함께 워터파크나 놀이공원에 가요'],
  ],
};

function textFor(id: string, language: Language, ids: readonly string[], offset: number): { translated: DemoText; source: DemoText } | null {
  if (language === 'vi') return null;
  const index = ids.indexOf(id);
  if (index < 0) return null;
  const rows = language === 'en' ? EN : TRANSLATIONS[language];
  const rowIndex = index + offset;
  return rows[rowIndex] && VI[rowIndex] ? { translated: rows[rowIndex], source: VI[rowIndex] } : null;
}

export function localizeDemoActivity(activity: HabitActivity, language: Language): HabitActivity {
  const text = textFor(activity.id, language, ACTIVITY_IDS, 0);
  if (!text) return activity;
  const title = activity.title === text.source[0] ? text.translated[0] : activity.title;
  const description = activity.description === text.source[1] ? text.translated[1] : activity.description;
  return title === activity.title && description === activity.description ? activity : { ...activity, title, description };
}

export function localizeDemoReward(reward: Reward, language: Language): Reward {
  const text = textFor(reward.id, language, REWARD_IDS, ACTIVITY_IDS.length);
  if (!text) return reward;
  const title = reward.title === text.source[0] ? text.translated[0] : reward.title;
  const description = reward.description === text.source[1] ? text.translated[1] : reward.description;
  return title === reward.title && description === reward.description ? reward : { ...reward, title, description };
}
