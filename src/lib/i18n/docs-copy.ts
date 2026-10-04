import type { Language } from '@/types';

const vi = [
  ['bat-dau', 'Bắt đầu nhanh', 'Khách mới thấy trang giới thiệu để chọn cách bắt đầu. Phụ huynh đã đăng nhập sẽ vào thẳng bảng quản lý; muốn xem lại trang giới thiệu, chọn Trang chủ. Tạo hồ sơ cho bé rồi chọn vài nhiệm vụ vừa sức. Bắt đầu ít, duy trì đều.'],
  ['ho-so', 'Hồ sơ và thói quen', 'Trong Thiết kế > Quản lý việc, xem các việc Đang dùng hoặc chọn thêm từ Thư viện. Có thể giao việc chung hay riêng cho từng bé, đặt số sao, thời gian và yêu cầu xác nhận. Hồ sơ từng bé nằm ở Gia đình > Hồ sơ các con.'],
  ['ket-noi', 'Kết nối thiết bị của bé', 'Mở mã QR tại Gia đình > Hồ sơ các con. Trên máy của bé, chọn Quét QR hoặc nhập mã thủ công. Sau khi ghép, thiết bị này vào thẳng giao diện trẻ khi mở lại; không hiện bảng phụ huynh hay trang giới thiệu. Chỉ làm mới mã khi nghi ngờ mã đã bị lộ.'],
  ['linh-vat', 'Linh vật và màu sắc', 'Bé có thể chọn linh vật trên màn hình của mình. Sau mỗi lần chọn, cần chờ đủ 7 ngày mới đổi sang linh vật khác; màn hình sẽ cho biết khi nào đổi tiếp được. Màu sắc có thể đổi bất cứ lúc nào. Nút loa trên màn hình của bé cho phép tắt âm thanh; từ 20:00 đến trước 07:00, âm lượng tự giảm một nửa.'],
  ['thu-buoi-sang', 'Thư buổi sáng', 'Từ 07:00 theo giờ thiết bị, bé có một lá thư mới từ linh vật mỗi ngày. Bé chạm “Mình đã đọc” để ghi nhận; thư vẫn ở đó để xem lại trong ngày. Gia đình đã đồng bộ sẽ thấy trạng thái đã đọc trên thiết bị khác của bé.'],
  ['hoan-thanh', 'Hoàn thành và xác nhận', 'Bé chạm vào nhiệm vụ để đọc ý nghĩa và cách làm, sau đó chạm dấu tròn khi hoàn thành. Việc cần xác nhận sẽ chờ phụ huynh duyệt.'],
  ['phan-thuong', 'Sao và phần thưởng', 'Mỗi nhiệm vụ hoàn thành mang lại số sao đã đặt. Trong mục Đổi quà, bé chạm biểu tượng mục tiêu trên một phần thưởng để theo dõi số sao cần tích lũy. Mục tiêu được lưu cho bé; xin đổi quà là thao tác riêng và phụ huynh là người xác nhận.'],
  ['tam-nghi', 'Tạm nghỉ cùng gia đình', 'Tại Gia đình > Cài đặt, phụ huynh chọn Tạm nghỉ và xác nhận. Khi đang nghỉ, giao diện bé ẩn nhắc tiến độ và chuỗi ngày; bé vẫn có thể làm nhiệm vụ, còn sao và phần thưởng không bị xóa. Chọn Tiếp tục khi cả nhà sẵn sàng.'],
  ['thanh-toan', 'Thanh toán và kích hoạt', 'Kiểm tra chủ tài khoản, số tài khoản, số tiền và nội dung chuyển khoản. Quét QR hoặc mở trang thanh toán bảo mật. Gói được kích hoạt sau khi xác nhận.'],
  ['dong-bo', 'Đồng bộ và thiết bị', 'Đăng nhập để dùng dữ liệu trên nhiều thiết bị. Bạn cũng có thể thu hồi thiết bị không còn sử dụng.'],
  ['tro-giup', 'Khắc phục sự cố và FAQ', 'Nếu camera không mở, hãy cấp quyền camera, dùng kết nối an toàn hoặc nhập mã thủ công. Nếu thanh toán đang chờ, đừng thanh toán lại ngay.'],
] as const;
const en = [
  ['quick-start', 'Quick start', 'New visitors see the introduction and choose how to begin. Signed-in parents go straight to the parent dashboard; select Home to revisit the introduction. Create a child profile, then choose a few manageable tasks. Start small and stay consistent.'],
  ['profiles', 'Profiles and habits', 'Under Design > Habits, see tasks In use or choose more from the Library. Assign tasks to all children or one child, set stars, duration, and approval requirements. Child profiles are under Family > Children.'],
  ['connect', 'Connect a child device', 'Open the QR under Family > Children. On the child device, scan it or enter the code manually. Once paired, that device opens directly in the child view, without parent or sales navigation. Refresh the code only if it may have been exposed.'],
  ['mascot', 'Mascot and color', 'Children can choose a mascot on their own screen. After a choice, wait seven full days before changing to a different mascot; the screen shows the next available time. Colors can be changed anytime. The sound button on the child screen can mute effects; volume is halved from 20:00 until 07:00 local time.'],
  ['morning-letter', 'Morning letter', 'From 07:00 device time, each child gets one new letter from their mascot each day. Tap “I have read it” to record reading; the letter stays available to reread that day. Synced families can see the read state on another child device.'],
  ['complete', 'Complete and approve', 'Open a task to read its purpose and steps, then mark it complete. Tasks requiring approval wait for a parent.'],
  ['rewards', 'Stars and rewards', 'Completed tasks earn stars. In Rewards, children can select a gift as their savings goal and track the stars needed. The goal is saved for the child; requesting a reward is separate and parents confirm it.'],
  ['family-break', 'Take a family break', 'Under Family > Settings, choose Take a break and confirm. While paused, the child view hides progress and streak prompts; tasks remain available, and stars and rewards are not deleted. Choose Resume when your family is ready.'],
  ['payment', 'Payment and activation', 'Check account holder, account number, amount, and memo. Scan the QR or open secure checkout. Activation follows verification.'],
  ['sync', 'Sync and devices', 'Sign in to use family data across devices. You can revoke devices you no longer use.'],
  ['help', 'Troubleshooting and FAQ', 'If camera scanning is unavailable, grant permission, use a secure connection, or enter the code manually.'],
] as const;

type DocsSection = readonly [id: string, title: string, body: string];
type DocsCopy = Readonly<{ title: string; intro: string; back: string; sections: readonly DocsSection[] }>;

const fr: readonly DocsSection[] = [
  ['quick-start', 'Démarrage rapide', 'Les nouveaux visiteurs voient la présentation et choisissent comment commencer. Les parents connectés arrivent sur leur tableau de bord ; choisissez Accueil pour revoir la présentation. Créez un profil enfant et choisissez quelques tâches adaptées. Commencez petit et gardez le rythme.'],
  ['profiles', 'Profils et habitudes', 'Dans Organiser > Gérer les habitudes, consultez les missions « En cours » ou choisissez-en d’autres dans la Bibliothèque. Attribuez des missions à tous les enfants ou à un seul, puis définissez les étoiles, la durée et la validation. Les profils enfants se trouvent dans Famille > Profils des enfants.'],
  ['connect', 'Connecter l’appareil d’un enfant', 'Ouvrez le QR dans Famille > Profils des enfants. Sur l’appareil de l’enfant, scannez-le ou saisissez le code. Une fois associé, l’appareil ouvre directement la vue enfant, sans afficher les menus destinés aux parents ni ceux de présentation commerciale. Actualisez le code uniquement s’il a pu être exposé.'],
  ['mascot', 'Mascotte et couleur', 'Les enfants peuvent choisir une mascotte sur leur écran. Après un choix, attendez sept jours complets avant d’en changer ; l’écran indique le prochain moment possible. Les couleurs peuvent être changées à tout moment. Le bouton son coupe les effets ; le volume est réduit de moitié de 20:00 à 07:00, heure locale.'],
  ['morning-letter', 'Lettre du matin', 'À partir de 07:00, selon l’heure de l’appareil, chaque enfant reçoit une nouvelle lettre de sa mascotte. Touchez « Je l’ai lue » pour l’enregistrer ; la lettre reste disponible ce jour-là. Une famille synchronisée voit l’état de lecture sur un autre appareil de l’enfant.'],
  ['complete', 'Terminer et valider', 'Ouvrez une tâche pour lire son objectif et ses étapes, puis marquez-la comme terminée. Les tâches à valider attendent un parent.'],
  ['rewards', 'Étoiles et récompenses', 'Les tâches terminées rapportent des étoiles. Dans Récompenses, les enfants peuvent choisir un cadeau comme objectif d’épargne et suivre les étoiles nécessaires. L’objectif est enregistré pour l’enfant ; la demande est distincte et les parents la valident.'],
  ['family-break', 'Faire une pause en famille', 'Dans Famille > Paramètres, choisissez Faire une pause et confirmez. Pendant la pause, la vue enfant masque les rappels de progression et de série ; les tâches restent disponibles et les étoiles et récompenses ne sont pas supprimées. Choisissez Reprendre quand votre famille est prête.'],
  ['payment', 'Paiement et activation', 'Vérifiez le titulaire, le numéro de compte, le montant et le motif du virement. Scannez le QR ou ouvrez le paiement sécurisé. L’activation suit la vérification.'],
  ['sync', 'Synchronisation et appareils', 'Connectez-vous pour utiliser les données familiales sur plusieurs appareils. Vous pouvez révoquer les appareils que vous n’utilisez plus.'],
  ['help', 'Dépannage et FAQ', 'Si le scan ne fonctionne pas, autorisez la caméra, utilisez une connexion sécurisée ou saisissez le code. Si le paiement est en attente, ne payez pas tout de suite une seconde fois.'],
];
const de: readonly DocsSection[] = [
  ['quick-start', 'Schnellstart', 'Neue Besucher sehen die Einführung und wählen, wie sie beginnen möchten. Angemeldete Eltern gelangen direkt zum Eltern-Dashboard; mit Startseite öffnest du die Einführung erneut. Erstelle ein Kinderprofil und wähle einige passende Aufgaben. Fang klein an und bleib dran.'],
  ['profiles', 'Profile und Gewohnheiten', 'Unter Design > Gewohnheiten siehst du verwendete Aufgaben oder wählst weitere aus der Bibliothek. Weise Aufgaben allen Kindern oder einem Kind zu und lege Sterne, Dauer und Freigabe fest. Kinderprofile findest du unter Familie > Kinder.'],
  ['connect', 'Kindergerät verbinden', 'Öffne den QR-Code unter Familie > Kinder. Scanne ihn auf dem Kindergerät oder gib den Code ein. Nach der Kopplung öffnet das Gerät direkt die Kinderansicht, ohne Eltern- oder Verkaufsnavigation. Aktualisiere den Code nur, wenn er möglicherweise bekannt geworden ist.'],
  ['mascot', 'Maskottchen und Farbe', 'Kinder können auf ihrem Bildschirm ein Maskottchen wählen. Warte danach sieben volle Tage, bevor du ein anderes wählst; der Bildschirm zeigt den nächsten Zeitpunkt. Farben lassen sich jederzeit ändern. Die Tontaste schaltet Effekte stumm; von 20:00 bis 07:00 Ortszeit ist die Lautstärke halbiert.'],
  ['morning-letter', 'Morgenbrief', 'Ab 07:00 Uhr Gerätezeit erhält jedes Kind täglich einen neuen Brief vom Maskottchen. Tippe auf „Ich habe ihn gelesen“, um dies zu speichern; der Brief bleibt an diesem Tag verfügbar. Synchronisierte Familien sehen den Lesestatus auf einem anderen Kindergerät.'],
  ['complete', 'Abschließen und genehmigen', 'Öffne eine Aufgabe, um Ziel und Schritte zu lesen, und markiere sie dann als erledigt. Aufgaben mit Freigabe warten auf ein Elternteil.'],
  ['rewards', 'Sterne und Belohnungen', 'Erledigte Aufgaben bringen Sterne. Unter Belohnungen können Kinder ein Geschenk als Sparziel wählen und die nötigen Sterne verfolgen. Das Ziel wird für das Kind gespeichert; die Anfrage ist getrennt und wird von den Eltern bestätigt.'],
  ['family-break', 'Familienpause machen', 'Unter Familie > Einstellungen wählst du Pause machen und bestätigst. Während der Pause blendet die Kinderansicht Fortschritts- und Serienhinweise aus; Aufgaben bleiben verfügbar und Sterne und Belohnungen werden nicht gelöscht. Wähle Fortsetzen, wenn deine Familie bereit ist.'],
  ['payment', 'Zahlung und Aktivierung', 'Prüfe Kontoinhaber, Kontonummer, Betrag und Verwendungszweck. Scanne den QR-Code oder öffne den sicheren Bezahlvorgang. Die Freischaltung erfolgt nach der Prüfung.'],
  ['sync', 'Synchronisierung und Geräte', 'Melde dich an, um Familiendaten auf mehreren Geräten zu nutzen. Geräte, die du nicht mehr verwendest, kannst du widerrufen.'],
  ['help', 'Fehlerbehebung und FAQ', 'Wenn der Kamerascan nicht funktioniert, erlaube den Kamerazugriff, nutze eine sichere Verbindung oder gib den Code ein. Wenn die Zahlung aussteht, zahle nicht sofort erneut.'],
];
const it: readonly DocsSection[] = [
  ['quick-start', 'Avvio rapido', 'I nuovi visitatori vedono la presentazione e scelgono come iniziare. I genitori che hanno effettuato l’accesso entrano nel pannello genitori; scegli Home per rivedere la presentazione. Crea un profilo bambino e scegli alcune attività alla sua portata. Inizia con poco e continua con costanza.'],
  ['profiles', 'Profili e abitudini', 'In Progetta > Gestisci abitudini, guarda le attività In uso o scegline altre dalla Libreria. Assegna attività a tutti i bambini o a uno solo, poi imposta stelle, durata e richiesta di approvazione. I profili sono in Famiglia > Profili bambini.'],
  ['connect', 'Collega il dispositivo di un bambino', 'Apri il QR in Famiglia > Profili bambini. Sul dispositivo del bambino, scansionalo o inserisci il codice. Dopo l’associazione, il dispositivo apre direttamente la vista bambino, senza navigazione genitori o commerciale. Aggiorna il codice solo se potrebbe essere stato esposto.'],
  ['mascot', 'Mascotte e colore', 'I bambini possono scegliere una mascotte sul proprio schermo. Dopo la scelta, attendi sette giorni interi prima di cambiarla; lo schermo mostra il prossimo momento disponibile. I colori si possono cambiare quando vuoi. Il pulsante audio silenzia gli effetti; il volume si dimezza dalle 20:00 alle 07:00, ora locale.'],
  ['morning-letter', 'Lettera del mattino', 'Dalle 07:00 secondo l’ora del dispositivo, ogni bambino riceve ogni giorno una nuova lettera dalla mascotte. Tocca “L’ho letta” per registrarlo; la lettera resta disponibile quel giorno. Le famiglie sincronizzate vedono lo stato di lettura su un altro dispositivo del bambino.'],
  ['complete', 'Completa e approva', 'Apri un’attività per leggerne lo scopo e i passaggi, poi segnalala come completata. Le attività che richiedono approvazione attendono un genitore.'],
  ['rewards', 'Stelle e premi', 'Le attività completate fanno guadagnare stelle. In Premi, i bambini possono scegliere un regalo come obiettivo di risparmio e seguire le stelle necessarie. L’obiettivo viene salvato per il bambino; la richiesta è separata e i genitori la confermano.'],
  ['family-break', 'Fare una pausa in famiglia', 'In Famiglia > Impostazioni, scegli Fai una pausa e conferma. Durante la pausa, la vista bambino nasconde gli avvisi su progresso e serie; le attività restano disponibili e stelle e ricompense non vengono eliminate. Scegli Riprendi quando la famiglia è pronta.'],
  ['payment', 'Pagamento e attivazione', 'Controlla intestatario, numero di conto, importo e causale. Scansiona il QR o apri il pagamento sicuro. L’attivazione avviene dopo la verifica.'],
  ['sync', 'Sincronizzazione e dispositivi', 'Accedi per usare i dati della famiglia su più dispositivi. Puoi revocare i dispositivi che non usi più.'],
  ['help', 'Risoluzione dei problemi e FAQ', 'Se la scansione con la fotocamera non è disponibile, consenti l’accesso alla fotocamera, usa una connessione sicura o inserisci il codice. Se il pagamento è in sospeso, non pagare subito una seconda volta.'],
];
const es: readonly DocsSection[] = [
  ['quick-start', 'Inicio rápido', 'Los visitantes nuevos ven la presentación y eligen cómo empezar. Los padres con sesión iniciada van al panel de padres; elige Inicio para volver a verla. Crea un perfil infantil y elige algunas tareas adecuadas. Empieza poco a poco y mantén la constancia.'],
  ['profiles', 'Perfiles y hábitos', 'En Diseño > Hábitos, consulta las tareas En uso o elige más en la Biblioteca. Asigna tareas a todos los niños o a uno, y define estrellas, duración y aprobación. Los perfiles infantiles están en Familia > Niños.'],
  ['connect', 'Conectar el dispositivo de un niño', 'Abre el QR en Familia > Niños. En el dispositivo del niño, escanéalo o introduce el código. Tras vincularlo, abre directamente la vista infantil, sin navegación para padres ni de ventas. Actualiza el código solo si puede haberse expuesto.'],
  ['mascot', 'Mascota y color', 'Los niños pueden elegir una mascota en su pantalla. Después, espera siete días completos antes de cambiarla; la pantalla muestra cuándo será posible. Los colores se pueden cambiar cuando quieras. El botón de sonido silencia los efectos; el volumen se reduce a la mitad de 20:00 a 07:00, hora local.'],
  ['morning-letter', 'Carta de la mañana', 'Desde las 07:00 del dispositivo, cada niño recibe una carta nueva de su mascota cada día. Toca “La he leído” para registrarlo; queda disponible para releerla ese día. Las familias sincronizadas pueden ver el estado en otro dispositivo.'],
  ['complete', 'Completar y aprobar', 'Abre una tarea para leer su objetivo y sus pasos, y después márcala como completada. Las tareas que requieren aprobación esperan la confirmación de un padre o una madre.'],
  ['rewards', 'Estrellas y recompensas', 'Las tareas completadas dan estrellas. En Recompensas, los niños pueden elegir un regalo como meta de ahorro y seguir las estrellas necesarias. La meta se guarda para el niño; pedir una recompensa es independiente y los padres la confirman.'],
  ['family-break', 'Tomarse un descanso en familia', 'En Familia > Ajustes, elige Tomarse un descanso y confirma. Durante la pausa, la vista infantil oculta los avisos de progreso y racha; las tareas siguen disponibles y no se borran estrellas ni recompensas. Elige Reanudar cuando la familia esté lista.'],
  ['payment', 'Pago y activación', 'Comprueba el titular, el número de cuenta, el importe y el concepto. Escanea el QR o abre el pago seguro. La activación llega después de la verificación.'],
  ['sync', 'Sincronización y dispositivos', 'Inicia sesión para usar los datos familiares en varios dispositivos. Puedes revocar los dispositivos que ya no uses.'],
  ['help', 'Solución de problemas y FAQ', 'Si el escaneo con la cámara no está disponible, permite el acceso a la cámara, usa una conexión segura o introduce el código. Si el pago está pendiente, no vuelvas a pagar de inmediato.'],
];
const zh: readonly DocsSection[] = [
  ['quick-start', '快速开始', '新访客会看到介绍并选择开始方式。已登录的家长会直接进入家长面板；选择首页即可再次查看介绍。创建孩子档案，再选择几项适合的任务。从少量开始，坚持下去。'],
  ['profiles', '档案与习惯', '在规划 > 习惯管理中查看“使用中”的任务，或从“习惯库”选择更多任务。可以把任务分配给所有孩子或某个孩子，并设置奖励星星数、时长和审批要求。孩子档案位于家庭 > 孩子档案。'],
  ['connect', '连接孩子的设备', '在家庭 > 孩子档案中打开二维码。在孩子设备上扫描，或手动输入代码。配对后，该设备会直接打开孩子界面，不显示家长或销售导航。只有在代码可能泄露时才刷新代码。'],
  ['mascot', '吉祥物与颜色', '孩子可以在自己的界面选择吉祥物。每次选择后，需要等待完整七天才能更换；界面会显示下次可更换的时间。颜色可以随时更改。声音按钮可以静音效果音；当地时间 20:00 到 07:00 音量会减半。'],
  ['morning-letter', '晨间信件', '从设备时间 07:00 起，每个孩子每天会收到吉祥物的一封新信。点击“我读完了”记录阅读状态；当天仍可再次查看。已同步的家庭可以在另一台设备上看到阅读状态。'],
  ['complete', '完成与批准', '打开任务查看目的和步骤，然后将其标记为完成。需要批准的任务会等待家长处理。'],
  ['rewards', '星星与奖励', '完成任务可以获得星星。在奖励兑换中，孩子可以选择礼物作为储蓄目标，并查看所需星星。目标会为孩子保存；申请兑换奖励是独立操作，由家长确认。'],
  ['family-break', '全家休息一下', '在家庭 > 系统设置中选择“暂时休息”并确认。暂停期间，孩子界面会隐藏进度和连续记录提示；任务仍可使用，星星和奖励不会被删除。全家准备好后选择继续。'],
  ['payment', '付款与开通', '检查账户持有人、账号、金额和备注。扫描二维码或打开安全付款页面。验证后即可开通。'],
  ['sync', '同步与设备', '登录后即可在多台设备上使用家庭数据。也可以撤销不再使用的设备。'],
  ['help', '故障排查与 FAQ', '如果无法使用摄像头扫码，请允许访问摄像头、使用安全连接，或手动输入连接码。如果付款仍在处理中，请不要立即再次付款。'],
];
const ja: readonly DocsSection[] = [
  ['quick-start', 'すぐに始める', '初めての方には紹介画面が表示され、始め方を選べます。ログイン中の保護者は保護者ダッシュボードに直接進みます。紹介画面をもう一度見るときはホームを選んでください。お子さまのプロフィールを作り、無理のないミッションをいくつか選びます。少しずつ、続けていきましょう。'],
  ['profiles', 'プロフィールと習慣', '設計 > 習慣の管理で使用中のミッションを確認するか、ライブラリから追加します。すべてのお子さま、または1人のお子さまにミッションを割り当て、スター、時間、承認の要否を設定できます。プロフィールは家族 > 子ども一覧にあります。'],
  ['connect', 'お子さまの端末をつなぐ', '家族 > 子ども一覧で QR を開きます。お子さまの端末で読み取るか、コードを手入力してください。連携後は、その端末で子ども画面が直接開き、保護者向けのメニューや購入案内は表示されません。コードが知られた可能性があるときだけ更新してください。'],
  ['mascot', 'マスコットと色', 'お子さまは自分の画面でマスコットを選べます。選んだ後は、別のマスコットに変えるまで7日間待ちます。次の時刻は画面に表示されます。色はいつでも変更できます。音ボタンで効果音を消せます。20:00から07:00までは音量が半分になります。'],
  ['morning-letter', '朝の手紙', '端末時刻の07:00から、お子さまは毎日マスコットから新しい手紙を1通受け取ります。「読んだよ」をタップすると読んだことが記録され、その日のうちは読み返せます。家族のデータを同期している場合は、お子さまの別の端末でも読んだことを確認できます。'],
  ['complete', '完了して承認する', 'ミッションを開いて目的と手順を読み、終わったら完了にします。承認が必要なミッションは保護者の確認を待ちます。'],
  ['rewards', 'スターとごほうび', '完了したミッションでスターを獲得できます。ごほうびでは、欲しいごほうびを選び、交換に必要なスターを貯める目標にできます。目標は保存され、申請は別の操作として保護者が確認します。'],
  ['family-break', '家族でひと休み', '家族 > 設定で「お休みする」を選び、確認します。休止中は進捗と連続記録の案内が隠れます。ミッションは使え、スターやごほうびも削除されません。準備ができたら再開を選びます。'],
  ['payment', '支払いと有効化', '口座名義、口座番号、金額、振込内容を確認します。QR を読み取るか、安全な支払いページを開いてください。確認後に有効になります。'],
  ['sync', '同期と端末', 'ログインすると、複数の端末で家族データを使えます。使わなくなった端末の連携を解除できます。'],
  ['help', 'トラブル解決と FAQ', 'カメラで読み取れないときは、許可、安全な接続、コードの手入力をお試しください。支払いが保留中なら、すぐにもう一度支払わないでください。'],
];
const ko: readonly DocsSection[] = [
  ['quick-start', '빠르게 시작하기', '처음 방문하면 소개 화면에서 시작 방법을 선택할 수 있어요. 로그인한 부모님은 부모 대시보드로 바로 이동하고, 소개를 다시 보려면 홈을 선택하세요. 아이 프로필을 만들고 할 수 있는 일을 몇 가지 고르세요. 작게 시작해 꾸준히 이어 가요.'],
  ['profiles', '프로필과 습관', '설계 > 습관 관리에서 사용 중인 미션을 확인하거나 라이브러리에서 더 고르세요. 모든 아이 또는 한 아이에게 미션을 배정하고 별, 시간, 승인 여부를 설정할 수 있어요. 아이 프로필은 가족 > 아이에서 볼 수 있어요.'],
  ['connect', '아이 기기 연결하기', '가족 > 아이에서 QR을 여세요. 아이 기기에서 스캔하거나 코드를 직접 입력하세요. 연결하면 아이 화면을 바로 열어요. 코드가 노출되었을 수 있을 때만 새로 고치세요.'],
  ['mascot', '마스코트와 색상', '아이는 자기 화면에서 마스코트를 고를 수 있어요. 선택한 뒤 다른 마스코트로 바꾸려면 꼬박 7일을 기다려야 해요. 다시 변경할 수 있는 시점은 화면에 표시돼요. 색상은 언제든 바꿀 수 있어요. 소리 버튼으로 효과음을 끌 수 있고, 20:00부터 07:00까지 음량이 절반으로 줄어요.'],
  ['morning-letter', '아침 편지', '기기 시간 07:00부터 아이는 매일 마스코트에게서 새 편지 한 통을 받아요. “다 읽었어요”를 눌러 기록하면 그날 다시 읽을 수 있어요. 가족 데이터를 동기화한 경우, 아이의 다른 기기에서도 읽음 상태를 볼 수 있어요.'],
  ['complete', '완료하고 승인받기', '미션을 열어 의미와 방법을 읽은 다음 완료로 표시하세요. 승인이 필요한 미션은 부모님의 승인을 기다려요.'],
  ['rewards', '별과 선물', '일을 완료하면 별을 받아요. 선물 상점에서 아이가 선물을 저축 목표로 고르고 필요한 별을 확인할 수 있어요. 목표는 저장되고, 요청은 별도 작업으로 부모님이 확인해요.'],
  ['family-break', '가족과 잠시 쉬기', '가족 > 설정에서 잠시 쉬기를 선택하고 확인하세요. 쉬는 동안 진행 상황과 연속 기록 안내가 숨겨지고, 일은 계속 사용할 수 있으며 별과 선물은 삭제되지 않아요. 준비되면 다시 시작을 선택하세요.'],
  ['payment', '결제와 활성화', '예금주, 계좌 번호, 금액, 입금 내용을 확인하세요. QR을 스캔하거나 안전한 결제 페이지를 여세요. 확인되면 활성화돼요.'],
  ['sync', '동기화와 기기', '로그인하면 여러 기기에서 가족 데이터를 사용할 수 있어요. 더 이상 쓰지 않는 기기의 연결을 취소할 수도 있어요.'],
  ['help', '문제 해결과 FAQ', '카메라 스캔이 되지 않으면 권한을 허용하고, 안전한 연결을 사용하거나 코드를 직접 입력하세요. 결제가 보류 중이면 바로 다시 결제하지 마세요.'],
];

const COPY: Record<Language, DocsCopy> = {
  vi: { title: 'Tài liệu sử dụng KidHabit', intro: 'Hướng dẫn ngắn gọn cho phụ huynh và bé.', back: 'Quay lại ứng dụng', sections: vi },
  en: { title: 'KidHabit user guide', intro: 'A concise guide for parents and children.', back: 'Back to the app', sections: en },
  fr: { title: 'Guide d’utilisation KidHabit', intro: 'Un guide concis pour les parents et les enfants.', back: 'Retour à l’application', sections: fr },
  de: { title: 'KidHabit-Benutzerhilfe', intro: 'Eine kurze Anleitung für Eltern und Kinder.', back: 'Zurück zur App', sections: de },
  it: { title: 'Guida utente KidHabit', intro: 'Una guida breve per genitori e bambini.', back: 'Torna all’app', sections: it },
  es: { title: 'Guía de usuario de KidHabit', intro: 'Una guía breve para padres y niños.', back: 'Volver a la aplicación', sections: es },
  zh: { title: 'KidHabit 使用指南', intro: '给家长和孩子的简明指南。', back: '返回应用', sections: zh },
  ja: { title: 'KidHabit ご利用ガイド', intro: '保護者とお子さま向けの短いガイドです。', back: 'アプリに戻る', sections: ja },
  ko: { title: 'KidHabit 사용 안내', intro: '부모님과 아이를 위한 간단한 안내입니다.', back: '앱으로 돌아가기', sections: ko },
};

export function getDocsCopy(language: Language): DocsCopy {
  return COPY[language] ?? COPY.en;
}
