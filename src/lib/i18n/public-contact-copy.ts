import type { Language } from '@/types';

export type PublicContactCopy = {
  readonly title: string;
  readonly description: string;
  readonly subject: string;
  readonly beforeTitle: string;
  readonly docsAdvice: string;
  readonly docsLabel: string;
  readonly errorAdvice: string;
  readonly paymentAdvice: string;
  readonly channelTitle: string;
  readonly email: string;
  readonly unconfigured: string;
  readonly noForm: string;
  readonly neverTitle: string;
  readonly never: string;
  readonly topicsTitle: string;
  readonly accountTopic: string;
  readonly paymentTopic: string;
  readonly dataTopic: string;
  readonly safetyTopic: string;
  readonly response: string;
};

export const COPY: Record<Language, PublicContactCopy> = {
  "vi": {
    "title": "Liên hệ hỗ trợ",
    "description": "Chọn đúng thông tin cần gửi để đội ngũ hỗ trợ xử lý mà không thu thập dư thừa dữ liệu của trẻ.",
    "subject": "[KidHabit] Yêu cầu hỗ trợ",
    "beforeTitle": "Trước khi liên hệ",
    "docsAdvice": "Tra cứu cách đăng nhập, ghép thiết bị, nhiệm vụ và phần thưởng trong [docs].",
    "docsLabel": "Tài liệu sử dụng",
    "errorAdvice": "Với lỗi có “Mã hỗ trợ”, hãy gửi mã đó cùng thời điểm và thao tác vừa thực hiện.",
    "paymentAdvice": "Với thanh toán, chỉ gửi mã đơn, gói đã chọn, số tiền và thời điểm. Che số tài khoản không cần thiết trên ảnh xác nhận.",
    "channelTitle": "Kênh hỗ trợ",
    "email": "Gửi email tới",
    "unconfigured": "Kênh email chính thức chưa được chủ sản phẩm cấu hình. Trang này sẽ không được đưa vào điều hướng công khai cho tới khi có địa chỉ hỗ trợ đã duyệt.",
    "noForm": "KidHabit không mở form gửi ẩn danh trực tiếp vào hệ thống ở giai đoạn này, nhằm giảm spam và tránh thu thập dữ liệu trẻ không cần thiết.",
    "neverTitle": "Nội dung không được gửi",
    "never": "Không gửi mật khẩu, mã PIN phụ huynh, mã ghép thiết bị còn hiệu lực, khóa bí mật, toàn bộ số tài khoản ngân hàng hoặc nội dung nhật ký riêng tư của trẻ.",
    "topicsTitle": "Chủ đề được hỗ trợ",
    "accountTopic": "Đăng nhập, hồ sơ và thiết bị của trẻ.",
    "paymentTopic": "Đơn thanh toán, kích hoạt gói hoặc giao dịch trùng.",
    "dataTopic": "Yêu cầu bản sao, chỉnh sửa hoặc xóa dữ liệu.",
    "safetyTopic": "Báo cáo vấn đề an toàn hoặc truy cập sai gia đình.",
    "response": "Chưa có thời gian phản hồi cam kết công khai. Sự cố nghi ngờ lộ dữ liệu hoặc truy cập sai gia đình được ưu tiên xử lý trước."
  },
  "en": {
    "title": "Contact support",
    "description": "Send the right information so support can handle your request without collecting unnecessary child data.",
    "subject": "[KidHabit] Support request",
    "beforeTitle": "Before contacting us",
    "docsAdvice": "Find help with signing in, pairing devices, tasks and rewards in [docs].",
    "docsLabel": "the user documentation",
    "errorAdvice": "For errors with a “Support code”, send that code along with the time and the action you just took.",
    "paymentAdvice": "For payments, send only the order code, selected plan, amount and time. Hide unnecessary account numbers in confirmation images.",
    "channelTitle": "Support channel",
    "email": "Email",
    "unconfigured": "The product owner has not configured the official email channel yet. This page will stay out of public navigation until an approved support address is available.",
    "noForm": "KidHabit does not offer anonymous forms that submit directly to the system at this stage, to reduce spam and avoid collecting unnecessary child data.",
    "neverTitle": "What you must not send",
    "never": "Do not send passwords, parent PINs, valid device pairing codes, secret keys, full bank account numbers or a child’s private journal content.",
    "topicsTitle": "Supported topics",
    "accountTopic": "Signing in, child profiles and devices.",
    "paymentTopic": "Payment orders, plan activation or duplicate transactions.",
    "dataTopic": "Requests to copy, correct or delete data.",
    "safetyTopic": "Reports of safety issues or access to the wrong family.",
    "response": "No public response time is promised yet. Suspected data exposure or access to the wrong family is handled first."
  },
  "fr": {
    "title": "Contacter l’assistance",
    "description": "Envoyez les informations utiles pour que l’assistance traite votre demande sans collecter de données superflues sur l’enfant.",
    "subject": "[KidHabit] Demande d’assistance",
    "beforeTitle": "Avant de nous contacter",
    "docsAdvice": "Consultez l’aide sur la connexion, l’association des appareils, les tâches et les récompenses dans [docs].",
    "docsLabel": "la documentation d’utilisation",
    "errorAdvice": "Si une erreur affiche un « code d’assistance », envoyez-le avec l’heure et l’action que vous veniez d’effectuer.",
    "paymentAdvice": "Pour un paiement, envoyez uniquement le code de commande, le forfait choisi, le montant et l’heure. Masquez les numéros de compte inutiles sur les captures de confirmation.",
    "channelTitle": "Canal d’assistance",
    "email": "Envoyer un e-mail à",
    "unconfigured": "Le responsable du produit n’a pas encore configuré l’adresse e-mail officielle. Cette page ne figurera pas dans la navigation publique tant qu’une adresse d’assistance approuvée ne sera pas disponible.",
    "noForm": "À ce stade, KidHabit ne propose pas de formulaire anonyme envoyé directement au système, afin de limiter le spam et la collecte inutile de données sur l’enfant.",
    "neverTitle": "Informations à ne pas envoyer",
    "never": "N’envoyez pas de mot de passe, de code PIN parental, de code d’association encore valide, de clé secrète, de numéro de compte bancaire complet ni de journal privé de l’enfant.",
    "topicsTitle": "Sujets pris en charge",
    "accountTopic": "Connexion, profils et appareils de l’enfant.",
    "paymentTopic": "Commandes de paiement, activation de forfaits ou transactions en double.",
    "dataTopic": "Demandes de copie, de rectification ou de suppression de données.",
    "safetyTopic": "Signalements de problèmes de sécurité ou d’accès à la mauvaise famille.",
    "response": "Aucun délai de réponse public n’est encore garanti. Les suspicions de fuite de données ou d’accès à la mauvaise famille sont traitées en priorité."
  },
  "de": {
    "title": "Support kontaktieren",
    "description": "Senden Sie die passenden Informationen, damit der Support Ihre Anfrage ohne unnötige Daten über das Kind bearbeiten kann.",
    "subject": "[KidHabit] Supportanfrage",
    "beforeTitle": "Vor der Kontaktaufnahme",
    "docsAdvice": "Hilfe zu Anmeldung, Gerätekopplung, Aufgaben und Belohnungen finden Sie in [docs].",
    "docsLabel": "der Benutzerdokumentation",
    "errorAdvice": "Bei Fehlern mit einem „Supportcode“ senden Sie diesen zusammen mit der Uhrzeit und der zuletzt ausgeführten Aktion.",
    "paymentAdvice": "Bei Zahlungen senden Sie nur Bestellcode, gewählten Tarif, Betrag und Uhrzeit. Verdecken Sie unnötige Kontonummern auf Bestätigungsbildern.",
    "channelTitle": "Supportkanal",
    "email": "E-Mail senden an",
    "unconfigured": "Der Produktverantwortliche hat die offizielle E-Mail-Adresse noch nicht eingerichtet. Diese Seite erscheint erst in der öffentlichen Navigation, wenn eine freigegebene Supportadresse vorliegt.",
    "noForm": "KidHabit bietet derzeit keine anonymen Formulare mit direkter Übermittlung an das System, um Spam und unnötige Erfassung von Kinderdaten zu vermeiden.",
    "neverTitle": "Was Sie nicht senden dürfen",
    "never": "Senden Sie keine Passwörter, Eltern-PINs, gültigen Kopplungscodes, geheimen Schlüssel, vollständigen Bankkontonummern oder privaten Tagebucheinträge des Kindes.",
    "topicsTitle": "Unterstützte Themen",
    "accountTopic": "Anmeldung, Kinderprofile und Geräte.",
    "paymentTopic": "Zahlungsaufträge, Tarifaktivierung oder doppelte Transaktionen.",
    "dataTopic": "Anfragen zur Kopie, Berichtigung oder Löschung von Daten.",
    "safetyTopic": "Meldungen zu Sicherheitsproblemen oder Zugriff auf die falsche Familie.",
    "response": "Es gibt noch keine öffentlich zugesagte Antwortzeit. Verdacht auf Datenlecks oder Zugriff auf die falsche Familie wird vorrangig bearbeitet."
  },
  "it": {
    "title": "Contatta l’assistenza",
    "description": "Invia le informazioni utili affinché l’assistenza possa gestire la richiesta senza raccogliere dati superflui sui bambini.",
    "subject": "[KidHabit] Richiesta di assistenza",
    "beforeTitle": "Prima di contattarci",
    "docsAdvice": "Consulta le istruzioni su accesso, associazione dei dispositivi, attività e premi in [docs].",
    "docsLabel": "la documentazione d’uso",
    "errorAdvice": "Per gli errori con un “codice di assistenza”, invia il codice insieme all’orario e all’azione appena eseguita.",
    "paymentAdvice": "Per i pagamenti, invia solo il codice dell’ordine, il piano scelto, l’importo e l’orario. Nascondi i numeri di conto non necessari nelle immagini di conferma.",
    "channelTitle": "Canale di assistenza",
    "email": "Invia un’e-mail a",
    "unconfigured": "Il responsabile del prodotto non ha ancora configurato l’indirizzo e-mail ufficiale. Questa pagina non apparirà nella navigazione pubblica finché non sarà disponibile un indirizzo di assistenza approvato.",
    "noForm": "In questa fase KidHabit non offre moduli anonimi inviati direttamente al sistema, per ridurre lo spam ed evitare la raccolta inutile di dati dei bambini.",
    "neverTitle": "Cosa non inviare",
    "never": "Non inviare password, PIN dei genitori, codici di associazione ancora validi, chiavi segrete, numeri di conto bancario completi o contenuti del diario privato di un bambino.",
    "topicsTitle": "Argomenti supportati",
    "accountTopic": "Accesso, profili e dispositivi dei bambini.",
    "paymentTopic": "Ordini di pagamento, attivazione dei piani o transazioni duplicate.",
    "dataTopic": "Richieste di copia, rettifica o cancellazione dei dati.",
    "safetyTopic": "Segnalazioni di problemi di sicurezza o accesso alla famiglia sbagliata.",
    "response": "Non è ancora garantito pubblicamente un tempo di risposta. I sospetti di esposizione dei dati o accesso alla famiglia sbagliata hanno la precedenza."
  },
  "es": {
    "title": "Contactar con asistencia",
    "description": "Envía la información adecuada para que asistencia gestione tu solicitud sin recopilar datos innecesarios del niño.",
    "subject": "[KidHabit] Solicitud de asistencia",
    "beforeTitle": "Antes de contactar",
    "docsAdvice": "Consulta la ayuda sobre acceso, vinculación de dispositivos, tareas y recompensas en [docs].",
    "docsLabel": "la documentación de uso",
    "errorAdvice": "Si un error muestra un “código de asistencia”, envíalo junto con la hora y la acción que acababas de realizar.",
    "paymentAdvice": "Para pagos, envía solo el código de pedido, el plan elegido, el importe y la hora. Oculta los números de cuenta innecesarios en las imágenes de confirmación.",
    "channelTitle": "Canal de asistencia",
    "email": "Enviar un correo a",
    "unconfigured": "El responsable del producto aún no ha configurado el correo oficial. Esta página no aparecerá en la navegación pública hasta que haya una dirección de asistencia aprobada.",
    "noForm": "En esta fase, KidHabit no ofrece formularios anónimos enviados directamente al sistema, para reducir el spam y evitar recopilar datos innecesarios de niños.",
    "neverTitle": "Qué no debes enviar",
    "never": "No envíes contraseñas, PIN de padres, códigos de vinculación vigentes, claves secretas, números completos de cuentas bancarias ni contenido del diario privado de un niño.",
    "topicsTitle": "Temas atendidos",
    "accountTopic": "Acceso, perfiles y dispositivos del niño.",
    "paymentTopic": "Pedidos de pago, activación de planes o transacciones duplicadas.",
    "dataTopic": "Solicitudes de copia, rectificación o eliminación de datos.",
    "safetyTopic": "Avisos de problemas de seguridad o acceso a una familia equivocada.",
    "response": "Aún no se garantiza públicamente un plazo de respuesta. Se priorizan las posibles exposiciones de datos o el acceso a una familia equivocada."
  },
  "zh": {
    "title": "联系支持",
    "description": "请发送所需的信息，便于支持团队处理请求，同时避免收集不必要的孩子数据。",
    "subject": "[KidHabit] 支持请求",
    "beforeTitle": "联系前",
    "docsAdvice": "有关登录、设备配对、任务和奖励的说明，请参阅[docs]。",
    "docsLabel": "使用文档",
    "errorAdvice": "如错误显示“支持代码”，请发送该代码、发生时间和刚刚执行的操作。",
    "paymentAdvice": "付款问题只需发送订单代码、所选套餐、金额和时间。请遮盖确认图片中不必要的账号。",
    "channelTitle": "支持渠道",
    "email": "发送邮件至",
    "unconfigured": "产品负责人尚未配置官方邮箱。在获得已批准的支持地址之前，此页面不会加入公开导航。",
    "noForm": "现阶段 KidHabit 不提供直接提交到系统的匿名表单，以减少垃圾信息并避免收集不必要的孩子数据。",
    "neverTitle": "请勿发送的内容",
    "never": "请勿发送密码、家长 PIN、仍有效的设备配对代码、密钥、完整银行账号或孩子的私人日记内容。",
    "topicsTitle": "支持主题",
    "accountTopic": "登录、孩子档案和设备。",
    "paymentTopic": "付款订单、套餐激活或重复交易。",
    "dataTopic": "数据副本、更正或删除请求。",
    "safetyTopic": "安全问题或访问错误家庭的报告。",
    "response": "目前尚无公开承诺的回复时限。疑似数据泄露或访问错误家庭的问题将优先处理。"
  },
  "ja": {
    "title": "サポートへのお問い合わせ",
    "description": "必要な情報を選んでお送りください。子どもの不要なデータを収集せずにサポートが対応できます。",
    "subject": "[KidHabit] サポート依頼",
    "beforeTitle": "お問い合わせの前に",
    "docsAdvice": "ログイン、デバイスのペアリング、タスク、報酬については[docs]をご覧ください。",
    "docsLabel": "利用ドキュメント",
    "errorAdvice": "「サポートコード」が表示されるエラーでは、コード、発生時刻、直前に行った操作を送ってください。",
    "paymentAdvice": "支払いについては注文コード、選択したプラン、金額、時刻だけを送ってください。確認画像の不要な口座番号は隠してください。",
    "channelTitle": "サポート窓口",
    "email": "メール送信先：",
    "unconfigured": "製品責任者による公式メール窓口の設定はまだ完了していません。承認済みのサポートアドレスが用意されるまで、このページは公開ナビゲーションに表示されません。",
    "noForm": "現段階では、迷惑送信と子どもの不要なデータ収集を減らすため、KidHabit はシステムに直接送信する匿名フォームを設けていません。",
    "neverTitle": "送信しないでください",
    "never": "パスワード、保護者の PIN、有効なペアリングコード、秘密鍵、銀行口座番号の全桁、子どもの非公開日記の内容は送らないでください。",
    "topicsTitle": "対応する内容",
    "accountTopic": "ログイン、子どものプロフィールとデバイス。",
    "paymentTopic": "支払い注文、プランの有効化、重複取引。",
    "dataTopic": "データのコピー、訂正、削除の依頼。",
    "safetyTopic": "安全上の問題や別の家族への誤ったアクセスの報告。",
    "response": "公開された回答時間の保証はまだありません。データ漏えいや別の家族へのアクセスが疑われる問題を優先して対応します。"
  },
  "ko": {
    "title": "지원 문의",
    "description": "아이가 불필요한 데이터를 제공하지 않도록, 지원팀의 처리에 필요한 정보를 골라 보내 주세요.",
    "subject": "[KidHabit] 지원 요청",
    "beforeTitle": "문의하기 전에",
    "docsAdvice": "로그인, 기기 연결, 과제와 보상 안내는 [docs]에서 확인하세요.",
    "docsLabel": "사용 문서",
    "errorAdvice": "오류에 “지원 코드”가 표시되면 코드와 발생 시간, 직전에 수행한 작업을 보내 주세요.",
    "paymentAdvice": "결제 문의에는 주문 코드, 선택한 요금제, 금액과 시간만 보내 주세요. 확인 이미지의 불필요한 계좌번호는 가려 주세요.",
    "channelTitle": "지원 채널",
    "email": "이메일 보내기:",
    "unconfigured": "제품 책임자가 아직 공식 이메일을 설정하지 않았습니다. 승인된 지원 주소가 마련되기 전까지 이 페이지는 공개 탐색 메뉴에 표시되지 않습니다.",
    "noForm": "현재 KidHabit은 스팸을 줄이고 불필요한 아이 데이터 수집을 피하기 위해 시스템으로 바로 보내는 익명 양식을 제공하지 않습니다.",
    "neverTitle": "보내면 안 되는 내용",
    "never": "비밀번호, 부모 PIN, 유효한 기기 연결 코드, 비밀 키, 전체 은행 계좌번호 또는 아이의 비공개 일기 내용을 보내지 마세요.",
    "topicsTitle": "지원하는 주제",
    "accountTopic": "로그인, 아이 프로필 및 기기.",
    "paymentTopic": "결제 주문, 요금제 활성화 또는 중복 거래.",
    "dataTopic": "데이터 사본, 수정 또는 삭제 요청.",
    "safetyTopic": "안전 문제나 다른 가족에 대한 잘못된 접근 신고.",
    "response": "아직 공개적으로 약속된 응답 시간은 없습니다. 데이터 노출이나 다른 가족 접근이 의심되는 문제를 우선 처리합니다."
  }
};

export function getPublicContactCopy(language: Language): PublicContactCopy {
  return COPY[language];
}

