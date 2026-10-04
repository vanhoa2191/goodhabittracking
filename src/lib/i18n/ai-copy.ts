import type { Language } from '@/types';
import type { AiFailureCode } from '@/lib/store/ai-client';

export type AiCopy = {
  readonly consentTitle: string;
  readonly consentIntro: string;
  readonly consentSends: string;
  readonly consentNever: string;
  readonly consentOnlyHelp: string;
  readonly consentToggle: string;
  readonly consentFailed: string;
  readonly breakdownButton: string;
  readonly breakdownWorking: string;
  readonly breakdownTitle: string;
  readonly aiLabel: string;
  readonly minutes: (count: number) => string;
  readonly use: string;
  readonly dismiss: string;
  readonly summaryButton: string;
  readonly summaryWorking: string;
  readonly summaryTitle: string;
  readonly needConsent: string;
  readonly errors: Readonly<Record<AiFailureCode, string>>;
};

const vi: AiCopy = {
  consentTitle: 'Gợi ý bằng AI',
  consentIntro: 'Khi bạn bấm, ứng dụng nhờ một mô hình AI (Cloudflare Workers AI) soạn gợi ý. Mặc định tắt, bạn rút lại được bất cứ lúc nào.',
  consentSends: 'Chỉ gửi: tên một thói quen bạn vừa gõ (để chia nhỏ việc; ứng dụng tự xóa tên các bé nếu bạn lỡ gõ vào, nhưng bạn đừng gõ tên bé) hoặc các con số của tuần (để tóm tắt tuần).',
  consentNever: 'Không bao giờ gửi: tên hay biệt danh của bé, nhật ký, văn bản bé viết, ảnh, email của bạn.',
  consentOnlyHelp: 'Kết quả chỉ là gợi ý; bạn đọc và quyết định. Mỗi ngày chỉ có một số lượt giới hạn.',
  consentToggle: 'Cho phép gợi ý bằng AI',
  consentFailed: 'Chưa lưu được. Bạn thử lại nhé.',
  breakdownButton: 'Gợi ý bước nhỏ bằng AI',
  breakdownWorking: 'Đang soạn gợi ý…',
  breakdownTitle: 'Ba bước nhỏ gợi ý',
  aiLabel: 'Gợi ý do AI soạn. Ba mẹ đọc kỹ trước khi dùng.',
  minutes: (count) => `${count} phút`,
  use: 'Dùng các bước này',
  dismiss: 'Bỏ qua',
  summaryButton: 'Tóm tắt tuần bằng AI',
  summaryWorking: 'Đang soạn tóm tắt…',
  summaryTitle: 'Tóm tắt tuần (AI)',
  needConsent: 'Bật “Gợi ý bằng AI” trong Cài đặt → Quyền riêng tư để dùng.',
  errors: {
    ai_consent_required: 'Bạn chưa đồng ý dùng gợi ý AI. Bật ở Cài đặt → Quyền riêng tư.',
    ai_quota: 'Hôm nay đã hết lượt gợi ý. Mai bạn thử lại nhé.',
    ai_disabled: 'Gợi ý AI đang tạm tắt.',
    ai_timeout: 'Gợi ý mất quá lâu. Bạn thử lại sau nhé.',
    ai_invalid_output: 'Chưa có gợi ý phù hợp lần này. Bạn thử lại hoặc tự viết nhé.',
    ai_error: 'Chưa soạn được gợi ý. Bạn thử lại sau nhé.',
    pin: 'Cần mở khóa bằng mã PIN trước.',
    network: 'Không kết nối được. Bạn kiểm tra mạng rồi thử lại nhé.',
  },
};

const en: AiCopy = {
  consentTitle: 'AI suggestions',
  consentIntro: 'When you tap a button, the app asks an AI model (Cloudflare Workers AI) to draft a suggestion. Off by default, and you can withdraw at any time.',
  consentSends: 'Only sent: the name of a habit you just typed (to split it into steps; the app removes your children’s names if you type them, but please do not) or the week’s counts (to summarise the week).',
  consentNever: 'Never sent: your child’s name or nickname, journal, anything your child wrote, photos, your email.',
  consentOnlyHelp: 'The result is only a suggestion; you read it and decide. There is a limited number of suggestions each day.',
  consentToggle: 'Allow AI suggestions',
  consentFailed: 'Could not save. Please try again.',
  breakdownButton: 'Suggest small steps with AI',
  breakdownWorking: 'Drafting a suggestion…',
  breakdownTitle: 'Three small steps suggested',
  aiLabel: 'Drafted by AI. Read it carefully before you use it.',
  minutes: (count) => `${count} min`,
  use: 'Use these steps',
  dismiss: 'Dismiss',
  summaryButton: 'Summarise the week with AI',
  summaryWorking: 'Drafting a summary…',
  summaryTitle: 'Week summary (AI)',
  needConsent: 'Turn on “AI suggestions” in Settings → Privacy to use this.',
  errors: {
    ai_consent_required: 'You have not agreed to AI suggestions. Turn them on in Settings → Privacy.',
    ai_quota: 'No suggestions left for today. Please try again tomorrow.',
    ai_disabled: 'AI suggestions are switched off for now.',
    ai_timeout: 'The suggestion took too long. Please try again later.',
    ai_invalid_output: 'No suitable suggestion this time. Try again or write your own.',
    ai_error: 'Could not draft a suggestion. Please try again later.',
    pin: 'Unlock with your PIN first.',
    network: 'Could not connect. Check your network and try again.',
  },
};

const fr: AiCopy = {
  consentTitle: 'Suggestions par IA', consentIntro: 'Lorsque vous appuyez sur un bouton, l’application demande à un modèle d’IA (Cloudflare Workers AI) de rédiger une suggestion. Désactivé par défaut, vous pouvez retirer votre accord à tout moment.',
  consentSends: 'Seuls sont envoyés : le nom d’une habitude que vous venez de saisir (pour la découper en étapes ; l’application supprime les noms de vos enfants si vous en saisissez, mais merci de ne pas le faire) ou les nombres de la semaine (pour la résumer).',
  consentNever: 'Ne sont jamais envoyés : le nom ou le surnom de votre enfant, son journal, ses écrits, des photos ou votre adresse e-mail.',
  consentOnlyHelp: 'Le résultat est une suggestion uniquement ; vous la lisez et décidez. Le nombre de suggestions par jour est limité.', consentToggle: 'Autoriser les suggestions par IA', consentFailed: 'Impossible d’enregistrer. Veuillez réessayer.',
  breakdownButton: 'Suggérer de petites étapes avec l’IA', breakdownWorking: 'Rédaction d’une suggestion…', breakdownTitle: 'Trois petites étapes suggérées', aiLabel: 'Rédigé par l’IA. Lisez attentivement avant de l’utiliser.', minutes: (count) => `${count} min`, use: 'Utiliser ces étapes', dismiss: 'Ignorer', summaryButton: 'Résumer la semaine avec l’IA', summaryWorking: 'Rédaction du résumé…', summaryTitle: 'Résumé de la semaine (IA)', needConsent: 'Activez « Suggestions par IA » dans Paramètres → Confidentialité pour utiliser cette fonction.',
  errors: { ai_consent_required: 'Vous n’avez pas accepté les suggestions par IA. Activez-les dans Paramètres → Confidentialité.', ai_quota: 'Vous avez atteint la limite de suggestions pour aujourd’hui. Réessayez demain.', ai_disabled: 'Les suggestions par IA sont temporairement désactivées.', ai_timeout: 'La suggestion prend trop de temps. Veuillez réessayer plus tard.', ai_invalid_output: 'Aucune suggestion adaptée cette fois. Réessayez ou rédigez la vôtre.', ai_error: 'Impossible de rédiger une suggestion. Veuillez réessayer plus tard.', pin: 'Veuillez d’abord déverrouiller avec votre code PIN.', network: 'Connexion impossible. Vérifiez votre réseau et réessayez.' },
};

const de: AiCopy = {
  consentTitle: 'KI-Vorschläge', consentIntro: 'Wenn Sie auf eine Schaltfläche tippen, bittet die App ein KI-Modell (Cloudflare Workers AI), einen Vorschlag zu formulieren. Standardmäßig ausgeschaltet; Sie können Ihre Zustimmung jederzeit widerrufen.',
  consentSends: 'Gesendet werden nur: der Name einer Gewohnheit, den Sie gerade eingegeben haben (um sie in Schritte aufzuteilen; die App entfernt Namen Ihrer Kinder, falls Sie sie eingeben, bitte tun Sie das dennoch nicht) oder die Wochenzahlen (für eine Wochenzusammenfassung).',
  consentNever: 'Niemals gesendet werden: Name oder Spitzname Ihres Kindes, Tagebuch, Texte Ihres Kindes, Fotos oder Ihre E-Mail-Adresse.',
  consentOnlyHelp: 'Das Ergebnis ist nur ein Vorschlag; Sie lesen ihn und entscheiden. Die Anzahl der Vorschläge pro Tag ist begrenzt.', consentToggle: 'KI-Vorschläge erlauben', consentFailed: 'Speichern nicht möglich. Bitte versuchen Sie es erneut.',
  breakdownButton: 'Mit KI kleine Schritte vorschlagen', breakdownWorking: 'Vorschlag wird erstellt…', breakdownTitle: 'Drei vorgeschlagene kleine Schritte', aiLabel: 'Von KI formuliert. Bitte vor der Verwendung sorgfältig lesen.', minutes: (count) => `${count} Min.`, use: 'Diese Schritte verwenden', dismiss: 'Verwerfen', summaryButton: 'Woche mit KI zusammenfassen', summaryWorking: 'Zusammenfassung wird erstellt…', summaryTitle: 'Wochenzusammenfassung (KI)', needConsent: 'Aktivieren Sie „KI-Vorschläge“ unter Einstellungen → Datenschutz, um diese Funktion zu nutzen.',
  errors: { ai_consent_required: 'Sie haben KI-Vorschlägen nicht zugestimmt. Aktivieren Sie sie unter Einstellungen → Datenschutz.', ai_quota: 'Für heute sind keine Vorschläge mehr verfügbar. Bitte versuchen Sie es morgen erneut.', ai_disabled: 'KI-Vorschläge sind vorübergehend ausgeschaltet.', ai_timeout: 'Der Vorschlag dauert zu lange. Bitte versuchen Sie es später erneut.', ai_invalid_output: 'Diesmal gibt es keinen passenden Vorschlag. Versuchen Sie es erneut oder schreiben Sie selbst einen.', ai_error: 'Vorschlag konnte nicht erstellt werden. Bitte versuchen Sie es später erneut.', pin: 'Bitte entsperren Sie zuerst mit Ihrer PIN.', network: 'Verbindung fehlgeschlagen. Prüfen Sie Ihr Netzwerk und versuchen Sie es erneut.' },
};

const it: AiCopy = {
  consentTitle: 'Suggerimenti con IA', consentIntro: 'Quando tocca un pulsante, l’app chiede a un modello di IA (Cloudflare Workers AI) di formulare un suggerimento. È disattivato per impostazione predefinita e può revocare il consenso in qualsiasi momento.',
  consentSends: 'Vengono inviati solo: il nome di un’abitudine appena digitato (per suddividerla in passaggi; l’app rimuove i nomi dei figli se li inserisce, ma la preghiamo di non farlo) oppure i numeri della settimana (per riassumerla).',
  consentNever: 'Non vengono mai inviati: nome o soprannome del figlio, diario, testi scritti dal figlio, foto o il suo indirizzo e-mail.',
  consentOnlyHelp: 'Il risultato è solo un suggerimento; lo legge e decide Lei. Il numero di suggerimenti giornalieri è limitato.', consentToggle: 'Consenti suggerimenti con IA', consentFailed: 'Impossibile salvare. Riprovi.',
  breakdownButton: 'Suggerisci piccoli passaggi con l’IA', breakdownWorking: 'Preparazione del suggerimento…', breakdownTitle: 'Tre piccoli passaggi suggeriti', aiLabel: 'Formulato dall’IA. Lo legga attentamente prima di usarlo.', minutes: (count) => `${count} min`, use: 'Usa questi passaggi', dismiss: 'Ignora', summaryButton: 'Riassumi la settimana con l’IA', summaryWorking: 'Preparazione del riepilogo…', summaryTitle: 'Riepilogo settimanale (IA)', needConsent: 'Attivi “Suggerimenti con IA” in Impostazioni → Privacy per usare questa funzione.',
  errors: { ai_consent_required: 'Non ha acconsentito ai suggerimenti con IA. Li attivi in Impostazioni → Privacy.', ai_quota: 'Per oggi non ci sono più suggerimenti disponibili. Riprovi domani.', ai_disabled: 'I suggerimenti con IA sono temporaneamente disattivati.', ai_timeout: 'Il suggerimento richiede troppo tempo. Riprovi più tardi.', ai_invalid_output: 'Questa volta non è disponibile un suggerimento adatto. Riprovi o ne scriva uno.', ai_error: 'Impossibile formulare un suggerimento. Riprovi più tardi.', pin: 'Sblocchi prima con il PIN.', network: 'Connessione non riuscita. Controlli la rete e riprovi.' },
};

const es: AiCopy = {
  consentTitle: 'Sugerencias con IA', consentIntro: 'Al pulsar un botón, la aplicación pide a un modelo de IA (Cloudflare Workers AI) que redacte una sugerencia. Está desactivado de forma predeterminada y puede retirar su consentimiento en cualquier momento.',
  consentSends: 'Solo se envían: el nombre de un hábito que acaba de escribir (para dividirlo en pasos; la aplicación elimina los nombres de sus hijos si los escribe, pero le rogamos que no lo haga) o los recuentos de la semana (para resumirla).',
  consentNever: 'Nunca se envían: el nombre o apodo de su hijo, su diario, textos escritos por su hijo, fotos ni su correo electrónico.',
  consentOnlyHelp: 'El resultado es solo una sugerencia; usted la lee y decide. Hay un límite diario de sugerencias.', consentToggle: 'Permitir sugerencias con IA', consentFailed: 'No se pudo guardar. Inténtelo de nuevo.',
  breakdownButton: 'Sugerir pequeños pasos con IA', breakdownWorking: 'Redactando una sugerencia…', breakdownTitle: 'Tres pequeños pasos sugeridos', aiLabel: 'Redactado por IA. Léalo con atención antes de usarlo.', minutes: (count) => `${count} min`, use: 'Usar estos pasos', dismiss: 'Descartar', summaryButton: 'Resumir la semana con IA', summaryWorking: 'Redactando un resumen…', summaryTitle: 'Resumen semanal (IA)', needConsent: 'Active «Sugerencias con IA» en Ajustes → Privacidad para usar esta función.',
  errors: { ai_consent_required: 'No ha aceptado las sugerencias con IA. Actívelas en Ajustes → Privacidad.', ai_quota: 'Ya no quedan sugerencias para hoy. Inténtelo de nuevo mañana.', ai_disabled: 'Las sugerencias con IA están desactivadas temporalmente.', ai_timeout: 'La sugerencia está tardando demasiado. Inténtelo más tarde.', ai_invalid_output: 'Esta vez no hay una sugerencia adecuada. Inténtelo de nuevo o escriba la suya.', ai_error: 'No se pudo redactar una sugerencia. Inténtelo más tarde.', pin: 'Desbloquee primero con su PIN.', network: 'No se pudo conectar. Compruebe la red e inténtelo de nuevo.' },
};

const zh: AiCopy = {
  consentTitle: 'AI 建议', consentIntro: '点击按钮时，应用会请 AI 模型（Cloudflare Workers AI）拟写建议。默认关闭，您可以随时撤回同意。',
  consentSends: '仅发送：您刚输入的习惯名称（用于拆分步骤；如果您输入了孩子的姓名，应用会将其删除，但请不要输入）或本周的计数（用于总结本周）。',
  consentNever: '绝不会发送：孩子的姓名或昵称、日记、孩子写的内容、照片或您的电子邮箱。',
  consentOnlyHelp: '结果仅供参考；由您阅读并决定。每天的建议次数有限。', consentToggle: '允许 AI 建议', consentFailed: '保存失败，请重试。',
  breakdownButton: '用 AI 建议小步骤', breakdownWorking: '正在拟写建议…', breakdownTitle: '建议的三个小步骤', aiLabel: '由 AI 拟写。使用前请仔细阅读。', minutes: (count) => `${count} 分钟`, use: '使用这些步骤', dismiss: '忽略', summaryButton: '用 AI 总结本周', summaryWorking: '正在拟写总结…', summaryTitle: '每周总结（AI）', needConsent: '请在“设置”→“隐私”中开启“AI 建议”以使用。',
  errors: { ai_consent_required: '您尚未同意使用 AI 建议。请在“设置”→“隐私”中开启。', ai_quota: '今天的建议次数已用完，请明天再试。', ai_disabled: 'AI 建议目前暂时关闭。', ai_timeout: '生成建议耗时过长，请稍后重试。', ai_invalid_output: '这次没有合适的建议。请重试或自行编写。', ai_error: '无法拟写建议，请稍后重试。', pin: '请先使用 PIN 解锁。', network: '无法连接。请检查网络后重试。' },
};

const ja: AiCopy = {
  consentTitle: 'AI の提案', consentIntro: 'ボタンを押すと、アプリが AI モデル（Cloudflare Workers AI）に提案文の作成を依頼します。初期設定ではオフです。同意はいつでも撤回できます。',
  consentSends: '送信されるのは、入力したばかりの習慣名（手順に分けるため。お子さまの名前を入力した場合はアプリが削除しますが、入力しないでください）または今週の回数（週のまとめ用）のみです。',
  consentNever: 'お子さまの名前やニックネーム、日記、お子さまが書いた文章、写真、保護者のメールアドレスは送信されません。',
  consentOnlyHelp: '結果はあくまで提案です。内容を読んで判断してください。1日に利用できる提案数には上限があります。', consentToggle: 'AI の提案を許可', consentFailed: '保存できませんでした。もう一度お試しください。',
  breakdownButton: 'AI で小さな手順を提案', breakdownWorking: '提案を作成中…', breakdownTitle: '提案された3つの小さな手順', aiLabel: 'AI が作成しました。使う前によくお読みください。', minutes: (count) => `${count} 分`, use: 'この手順を使う', dismiss: '閉じる', summaryButton: 'AI で今週をまとめる', summaryWorking: 'まとめを作成中…', summaryTitle: '今週のまとめ（AI）', needConsent: '利用するには「設定」→「プライバシー」で「AI の提案」をオンにしてください。',
  errors: { ai_consent_required: 'AI の提案に同意していません。「設定」→「プライバシー」でオンにしてください。', ai_quota: '本日の提案回数の上限に達しました。明日もう一度お試しください。', ai_disabled: 'AI の提案は現在一時的にオフです。', ai_timeout: '提案の作成に時間がかかりすぎています。後でもう一度お試しください。', ai_invalid_output: '今回は適切な提案がありませんでした。再試行するか、ご自身で入力してください。', ai_error: '提案を作成できませんでした。後でもう一度お試しください。', pin: '先に PIN でロックを解除してください。', network: '接続できません。ネットワークを確認して再試行してください。' },
};

const ko: AiCopy = {
  consentTitle: 'AI 제안', consentIntro: '버튼을 누르면 앱이 AI 모델(Cloudflare Workers AI)에 제안 작성을 요청합니다. 기본 설정은 꺼짐이며 언제든 동의를 철회할 수 있습니다.',
  consentSends: '전송되는 정보는 방금 입력한 습관 이름(단계로 나누기 위한 용도이며, 자녀 이름을 입력하면 앱이 삭제하지만 입력하지 말아 주세요) 또는 이번 주 횟수(주간 요약용)뿐입니다.',
  consentNever: '자녀의 이름이나 별명, 일기, 자녀가 쓴 글, 사진, 보호자 이메일은 절대 전송되지 않습니다.',
  consentOnlyHelp: '결과는 제안일 뿐입니다. 읽고 직접 결정해 주세요. 하루 제안 횟수에는 제한이 있습니다.', consentToggle: 'AI 제안 허용', consentFailed: '저장하지 못했습니다. 다시 시도해 주세요.',
  breakdownButton: 'AI로 작은 단계 제안받기', breakdownWorking: '제안을 작성하는 중…', breakdownTitle: '제안된 작은 단계 세 가지', aiLabel: 'AI가 작성했습니다. 사용 전에 꼼꼼히 읽어 주세요.', minutes: (count) => `${count}분`, use: '이 단계 사용하기', dismiss: '닫기', summaryButton: 'AI로 이번 주 요약하기', summaryWorking: '요약을 작성하는 중…', summaryTitle: '주간 요약(AI)', needConsent: '사용하려면 설정 → 개인정보에서 ‘AI 제안’을 켜 주세요.',
  errors: { ai_consent_required: 'AI 제안에 동의하지 않았습니다. 설정 → 개인정보에서 켜 주세요.', ai_quota: '오늘의 제안 횟수를 모두 사용했습니다. 내일 다시 시도해 주세요.', ai_disabled: 'AI 제안이 현재 일시적으로 꺼져 있습니다.', ai_timeout: '제안 작성에 너무 오래 걸립니다. 나중에 다시 시도해 주세요.', ai_invalid_output: '이번에는 적절한 제안이 없습니다. 다시 시도하거나 직접 작성해 주세요.', ai_error: '제안을 작성하지 못했습니다. 나중에 다시 시도해 주세요.', pin: '먼저 PIN으로 잠금을 해제해 주세요.', network: '연결할 수 없습니다. 네트워크를 확인한 뒤 다시 시도해 주세요.' },
};

const COPY: Record<Language, AiCopy> = { vi, en, fr, de, it, es, zh, ja, ko };

export function getAiCopy(language: Language): AiCopy {
  return COPY[language] ?? en;
}
