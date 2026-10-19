import type { Language } from '@/types';
import type { AiTier } from '@/lib/ai/config';
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
  readonly soonBadge: string;
  readonly soonTitle: string;
  readonly soonBody: string;
  readonly soonBreakdown: string;
  readonly soonSummary: string;
  readonly quota: { readonly tooFast: string; readonly free: string; readonly standard: string; readonly standardUpgradeOnly: string; readonly standardAddonOnly: string; readonly day: string; readonly addon: string; readonly upgrade: string };
  readonly errors: Readonly<Record<AiFailureCode, string>>;
};

const vi: AiCopy = {
  quota: {
    free: 'Bạn đã dùng hết 10 lượt gợi ý miễn phí tháng này. Nâng lên {upgrade} để dùng không giới hạn.',
    standard: 'Bạn đã dùng hết 20 lượt gợi ý tháng này. Thêm {addon} hoặc nâng lên {upgrade} để dùng không giới hạn.',
    standardUpgradeOnly: 'Bạn đã dùng hết 20 lượt gợi ý tháng này. Nâng lên {upgrade} để dùng không giới hạn.',
    standardAddonOnly: 'Bạn đã dùng hết 20 lượt gợi ý tháng này. Thêm {addon} để dùng không giới hạn.',
    day: 'Hôm nay bạn đã dùng rất nhiều gợi ý. Quay lại vào ngày mai nhé.',
    tooFast: 'Bạn thao tác hơi nhanh. Chờ vài giây rồi thử lại nhé.',
    addon: 'Add-on AI (29.000đ/tháng)',
    upgrade: 'Pro Plus',
  },
  soonBadge: 'Sắp ra mắt',
  soonTitle: 'Huấn luyện viên thói quen',
  soonBody: 'Đang phát triển: chia nhỏ một thói quen thành các bước dễ làm và tóm tắt tuần. Sẽ mặc định tắt, chỉ chạy khi bạn đồng ý. Ứng dụng xóa tên và biệt danh của bé khỏi những gì bạn gõ trước khi gửi, nên đừng gõ chúng; nhật ký của bé không bao giờ được gửi.',
  soonBreakdown: 'Gợi ý bước nhỏ bằng AI',
  soonSummary: 'Tóm tắt tuần bằng AI',
  consentTitle: 'Gợi ý bằng AI',
  consentIntro: 'Khi bạn bấm, ứng dụng nhờ một mô hình AI (Cloudflare Workers AI) soạn gợi ý. Mặc định tắt, bạn rút lại được bất cứ lúc nào.',
  consentSends: 'Chỉ gửi: tên một thói quen bạn vừa gõ (để chia nhỏ việc; ứng dụng xóa tên và biệt danh các bé khỏi chuỗi này trước khi gửi, nhưng bạn đừng gõ chúng) hoặc các con số của tuần (để tóm tắt tuần), cùng nhóm tuổi của bé (ví dụ 6-12).',
  consentNever: 'Không gửi tên hay biệt danh hồ sơ của bé, nhật ký, văn bản bé viết, ảnh, email của bạn. Rút lại đồng ý sẽ dừng việc gửi tiếp, nhưng nội dung đã gửi không thể thu hồi. Gợi ý của AI có thể sai và không phải tư vấn y tế hay tâm lý.',
  consentOnlyHelp: 'Số lượt mỗi tháng tùy gói: miễn phí 10, Gói Cơ bản/Pro 20, Pro Plus và Add-on AI không giới hạn theo tháng (tối đa 100 lượt mỗi ngày).',
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
    ai_quota: 'Hiện chưa có lượt gợi ý. Bạn thử lại sau nhé.',
    ai_disabled: 'Gợi ý AI đang tạm tắt.',
    ai_timeout: 'Gợi ý mất quá lâu. Bạn thử lại sau nhé.',
    ai_invalid_output: 'Chưa có gợi ý phù hợp lần này. Bạn thử lại hoặc tự viết nhé.',
    ai_error: 'Chưa soạn được gợi ý. Bạn thử lại sau nhé.',
    pin: 'Cần mở khóa bằng mã PIN trước.',
    network: 'Không kết nối được. Bạn kiểm tra mạng rồi thử lại nhé.',
  },
};

const en: AiCopy = {
  quota: {
    free: 'You have used all 10 free suggestions this month. Upgrade to {upgrade} for unlimited suggestions.',
    standard: 'You have used all 20 suggestions this month. Add the {addon} or upgrade to {upgrade} for unlimited suggestions.',
    standardUpgradeOnly: 'You have used all 20 suggestions this month. Upgrade to {upgrade} for unlimited suggestions.',
    standardAddonOnly: 'You have used all 20 suggestions this month. Add the {addon} for unlimited suggestions.',
    day: 'You have used a lot of suggestions today. Please come back tomorrow.',
    tooFast: 'That was a bit quick. Please wait a few seconds and try again.',
    addon: 'AI add-on (29,000 VND/month)',
    upgrade: 'Pro Plus',
  },
  soonBadge: 'Coming soon',
  soonTitle: 'Habit coach',
  soonBody: 'In development: splitting a habit into easy steps and summarising the week. It will be off by default and run only when you agree. The app removes child names and nicknames from what you type before sending, so please do not type them; your child’s journal is never sent.',
  soonBreakdown: 'Suggest small steps with AI',
  soonSummary: 'Summarise the week with AI',
  consentTitle: 'AI suggestions',
  consentIntro: 'When you tap a button, the app asks an AI model (Cloudflare Workers AI) to draft a suggestion. Off by default, and you can withdraw at any time.',
  consentSends: 'Only sent: the name of a habit you just typed (to split it into steps; the app removes children’s names and nicknames from it before sending, but please do not type them) or the week’s counts (to summarise the week), plus your child’s age band (for example 6-12).',
  consentNever: 'Not sent: your child’s profile name or nickname, journal, anything your child wrote, photos, your email. Withdrawing consent stops further sending, but content already sent cannot be recalled. AI suggestions can be wrong and are not medical or psychological advice.',
  consentOnlyHelp: 'The number of suggestions per month depends on the plan: 10 on free, 20 on Solo/Pro, unlimited with Pro Plus and the AI add-on.',
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
    ai_quota: 'No suggestions are available right now. Please try again later.',
    ai_disabled: 'AI suggestions are switched off for now.',
    ai_timeout: 'The suggestion took too long. Please try again later.',
    ai_invalid_output: 'No suitable suggestion this time. Try again or write your own.',
    ai_error: 'Could not draft a suggestion. Please try again later.',
    pin: 'Unlock with your PIN first.',
    network: 'Could not connect. Check your network and try again.',
  },
};

const fr: AiCopy = {
  quota: {
    free: 'Vous avez utilisé vos 10 suggestions gratuites de ce mois. Passez à {upgrade} pour des suggestions illimitées.',
    standard: 'Vous avez utilisé vos 20 suggestions de ce mois. Ajoutez l’{addon} ou passez à {upgrade} pour des suggestions illimitées.',
    standardUpgradeOnly: 'Vous avez utilisé vos 20 suggestions de ce mois. Passez à {upgrade} pour des suggestions illimitées.',
    standardAddonOnly: 'Vous avez utilisé vos 20 suggestions de ce mois. Ajoutez l’{addon} pour des suggestions illimitées.',
    day: 'Vous avez utilisé beaucoup de suggestions aujourd’hui. Revenez demain.',
    tooFast: 'C’était un peu rapide. Patientez quelques secondes puis réessayez.',
    addon: 'option IA (29 000 VND/mois)',
    upgrade: 'Pro Plus',
  },
  soonBadge: 'Bientôt disponible',
  soonTitle: 'Coach d’habitudes',
  soonBody: 'En développement : découper une habitude en petites étapes et résumer la semaine. Désactivé par défaut, uniquement avec votre accord. L’application supprime les noms et surnoms des enfants de ce que vous saisissez avant l’envoi, merci de ne pas les saisir ; le journal de votre enfant n’est jamais envoyé.',
  soonBreakdown: 'Suggérer de petites étapes par IA',
  soonSummary: 'Résumer la semaine par IA',
  consentTitle: 'Suggestions par IA', consentIntro: 'Lorsque vous appuyez sur un bouton, l’application demande à un modèle d’IA (Cloudflare Workers AI) de rédiger une suggestion. Désactivé par défaut, vous pouvez retirer votre accord à tout moment.',
  consentSends: 'Seuls sont envoyés : le nom d’une habitude que vous venez de saisir (pour la découper en étapes ; l’application en supprime les noms et surnoms des enfants avant l’envoi, mais merci de ne pas les saisir) ou les nombres de la semaine (pour la résumer), ainsi que la tranche d’âge de votre enfant (par exemple 6-12 ans).',
  consentNever: 'Ne sont pas envoyés : le nom ou le surnom du profil de votre enfant, son journal, ses écrits, des photos ou votre adresse e-mail. Retirer votre accord arrête les envois suivants, mais le contenu déjà envoyé ne peut pas être rappelé. Les suggestions de l’IA peuvent être erronées et ne constituent pas un avis médical ou psychologique.',
  consentOnlyHelp: 'Le nombre de suggestions par mois dépend du forfait : 10 en gratuit, 20 avec Solo/Pro, illimité avec Pro Plus et l’option IA.', consentToggle: 'Autoriser les suggestions par IA', consentFailed: 'Impossible d’enregistrer. Veuillez réessayer.',
  breakdownButton: 'Suggérer de petites étapes avec l’IA', breakdownWorking: 'Rédaction d’une suggestion…', breakdownTitle: 'Trois petites étapes suggérées', aiLabel: 'Rédigé par l’IA. Lisez attentivement avant de l’utiliser.', minutes: (count) => `${count} min`, use: 'Utiliser ces étapes', dismiss: 'Ignorer', summaryButton: 'Résumer la semaine avec l’IA', summaryWorking: 'Rédaction du résumé…', summaryTitle: 'Résumé de la semaine (IA)', needConsent: 'Activez « Suggestions par IA » dans Paramètres → Confidentialité pour utiliser cette fonction.',
  errors: { ai_consent_required: 'Vous n’avez pas accepté les suggestions par IA. Activez-les dans Paramètres → Confidentialité.', ai_quota: 'Aucune suggestion n’est disponible pour le moment. Réessayez plus tard.', ai_disabled: 'Les suggestions par IA sont temporairement désactivées.', ai_timeout: 'La suggestion prend trop de temps. Veuillez réessayer plus tard.', ai_invalid_output: 'Aucune suggestion adaptée cette fois. Réessayez ou rédigez la vôtre.', ai_error: 'Impossible de rédiger une suggestion. Veuillez réessayer plus tard.', pin: 'Veuillez d’abord déverrouiller avec votre code PIN.', network: 'Connexion impossible. Vérifiez votre réseau et réessayez.' },
};

const de: AiCopy = {
  quota: {
    free: 'Ihre 10 kostenlosen Vorschläge für diesen Monat sind aufgebraucht. Mit {upgrade} erhalten Sie unbegrenzt Vorschläge.',
    standard: 'Ihre 20 Vorschläge für diesen Monat sind aufgebraucht. Mit dem {addon} oder {upgrade} erhalten Sie unbegrenzt Vorschläge.',
    standardUpgradeOnly: 'Ihre 20 Vorschläge für diesen Monat sind aufgebraucht. Mit {upgrade} erhalten Sie unbegrenzt Vorschläge.',
    standardAddonOnly: 'Ihre 20 Vorschläge für diesen Monat sind aufgebraucht. Mit dem {addon} erhalten Sie unbegrenzt Vorschläge.',
    day: 'Sie haben heute sehr viele Vorschläge genutzt. Kommen Sie morgen wieder.',
    tooFast: 'Das ging etwas schnell. Bitte warten Sie ein paar Sekunden und versuchen Sie es erneut.',
    addon: 'KI-Zusatz (29.000 VND/Monat)',
    upgrade: 'Pro Plus',
  },
  soonBadge: 'Demnächst verfügbar',
  soonTitle: 'Gewohnheits-Coach',
  soonBody: 'In Entwicklung: eine Gewohnheit in leichte Schritte aufteilen und die Woche zusammenfassen. Standardmäßig aus, nur mit Ihrer Zustimmung. Die App entfernt Namen und Spitznamen von Kindern aus Ihrer Eingabe, bevor sie gesendet wird; bitte geben Sie sie nicht ein. Das Tagebuch Ihres Kindes wird nie gesendet.',
  soonBreakdown: 'Kleine Schritte per KI vorschlagen',
  soonSummary: 'Woche per KI zusammenfassen',
  consentTitle: 'KI-Vorschläge', consentIntro: 'Wenn Sie auf eine Schaltfläche tippen, bittet die App ein KI-Modell (Cloudflare Workers AI), einen Vorschlag zu formulieren. Standardmäßig ausgeschaltet; Sie können Ihre Zustimmung jederzeit widerrufen.',
  consentSends: 'Gesendet werden nur: der Name einer Gewohnheit, den Sie gerade eingegeben haben (um sie in Schritte aufzuteilen; die App entfernt Namen und Spitznamen von Kindern vor dem Senden, bitte geben Sie sie dennoch nicht ein) oder die Wochenzahlen (für eine Wochenzusammenfassung) sowie die Altersgruppe Ihres Kindes (zum Beispiel 6-12).',
  consentNever: 'Nicht gesendet werden: Profilname oder Spitzname Ihres Kindes, Tagebuch, Texte Ihres Kindes, Fotos oder Ihre E-Mail-Adresse. Der Widerruf der Zustimmung stoppt weiteres Senden, bereits gesendete Inhalte lassen sich aber nicht zurückholen. KI-Vorschläge können falsch sein und sind keine medizinische oder psychologische Beratung.',
  consentOnlyHelp: 'Die Anzahl der Vorschläge pro Monat hängt vom Paket ab: 10 kostenlos, 20 mit Solo/Pro, unbegrenzt mit Pro Plus und dem KI-Zusatz.', consentToggle: 'KI-Vorschläge erlauben', consentFailed: 'Speichern nicht möglich. Bitte versuchen Sie es erneut.',
  breakdownButton: 'Mit KI kleine Schritte vorschlagen', breakdownWorking: 'Vorschlag wird erstellt…', breakdownTitle: 'Drei vorgeschlagene kleine Schritte', aiLabel: 'Von KI formuliert. Bitte vor der Verwendung sorgfältig lesen.', minutes: (count) => `${count} Min.`, use: 'Diese Schritte verwenden', dismiss: 'Verwerfen', summaryButton: 'Woche mit KI zusammenfassen', summaryWorking: 'Zusammenfassung wird erstellt…', summaryTitle: 'Wochenzusammenfassung (KI)', needConsent: 'Aktivieren Sie „KI-Vorschläge“ unter Einstellungen → Datenschutz, um diese Funktion zu nutzen.',
  errors: { ai_consent_required: 'Sie haben KI-Vorschlägen nicht zugestimmt. Aktivieren Sie sie unter Einstellungen → Datenschutz.', ai_quota: 'Im Moment sind keine Vorschläge verfügbar. Bitte versuchen Sie es später erneut.', ai_disabled: 'KI-Vorschläge sind vorübergehend ausgeschaltet.', ai_timeout: 'Der Vorschlag dauert zu lange. Bitte versuchen Sie es später erneut.', ai_invalid_output: 'Diesmal gibt es keinen passenden Vorschlag. Versuchen Sie es erneut oder schreiben Sie selbst einen.', ai_error: 'Vorschlag konnte nicht erstellt werden. Bitte versuchen Sie es später erneut.', pin: 'Bitte entsperren Sie zuerst mit Ihrer PIN.', network: 'Verbindung fehlgeschlagen. Prüfen Sie Ihr Netzwerk und versuchen Sie es erneut.' },
};

const it: AiCopy = {
  quota: {
    free: 'Ha usato i 10 suggerimenti gratuiti di questo mese. Passi a {upgrade} per suggerimenti illimitati.',
    standard: 'Ha usato i 20 suggerimenti di questo mese. Aggiunga l’{addon} o passi a {upgrade} per suggerimenti illimitati.',
    standardUpgradeOnly: 'Ha usato i 20 suggerimenti di questo mese. Passi a {upgrade} per suggerimenti illimitati.',
    standardAddonOnly: 'Ha usato i 20 suggerimenti di questo mese. Aggiunga l’{addon} per suggerimenti illimitati.',
    day: 'Oggi ha usato moltissimi suggerimenti. Torni domani.',
    tooFast: 'Troppo veloce. Attenda qualche secondo e riprovi.',
    addon: 'opzione IA (29.000 VND/mese)',
    upgrade: 'Pro Plus',
  },
  soonBadge: 'In arrivo',
  soonTitle: 'Coach delle abitudini',
  soonBody: 'In sviluppo: dividere un’abitudine in passi facili e riassumere la settimana. Sarà disattivato per impostazione predefinita, attivo solo con il Suo consenso. L’app rimuove nomi e soprannomi dei bambini da ciò che digita prima dell’invio, quindi non li digiti; il diario del bambino non viene mai inviato.',
  soonBreakdown: 'Suggerisci piccoli passi con l’IA',
  soonSummary: 'Riassumi la settimana con l’IA',
  consentTitle: 'Suggerimenti con IA', consentIntro: 'Quando tocca un pulsante, l’app chiede a un modello di IA (Cloudflare Workers AI) di formulare un suggerimento. È disattivato per impostazione predefinita e può revocare il consenso in qualsiasi momento.',
  consentSends: 'Vengono inviati solo: il nome di un’abitudine appena digitato (per suddividerla in passaggi; l’app ne rimuove nomi e soprannomi dei figli prima dell’invio, ma la preghiamo di non digitarli) oppure i numeri della settimana (per riassumerla), insieme alla fascia di età del bambino (ad esempio 6-12).',
  consentNever: 'Non vengono inviati: nome o soprannome del profilo del figlio, diario, testi scritti dal figlio, foto o il suo indirizzo e-mail. Revocare il consenso interrompe ulteriori invii, ma i contenuti già inviati non possono essere richiamati. I suggerimenti dell’IA possono essere sbagliati e non sono un consiglio medico o psicologico.',
  consentOnlyHelp: 'Il numero di suggerimenti mensili dipende dal piano: 10 gratuiti, 20 con Solo/Pro, illimitati con Pro Plus e l’opzione IA.', consentToggle: 'Consenti suggerimenti con IA', consentFailed: 'Impossibile salvare. Riprovi.',
  breakdownButton: 'Suggerisci piccoli passaggi con l’IA', breakdownWorking: 'Preparazione del suggerimento…', breakdownTitle: 'Tre piccoli passaggi suggeriti', aiLabel: 'Formulato dall’IA. Lo legga attentamente prima di usarlo.', minutes: (count) => `${count} min`, use: 'Usa questi passaggi', dismiss: 'Ignora', summaryButton: 'Riassumi la settimana con l’IA', summaryWorking: 'Preparazione del riepilogo…', summaryTitle: 'Riepilogo settimanale (IA)', needConsent: 'Attivi “Suggerimenti con IA” in Impostazioni → Privacy per usare questa funzione.',
  errors: { ai_consent_required: 'Non ha acconsentito ai suggerimenti con IA. Li attivi in Impostazioni → Privacy.', ai_quota: 'Al momento non ci sono suggerimenti disponibili. Riprovi più tardi.', ai_disabled: 'I suggerimenti con IA sono temporaneamente disattivati.', ai_timeout: 'Il suggerimento richiede troppo tempo. Riprovi più tardi.', ai_invalid_output: 'Questa volta non è disponibile un suggerimento adatto. Riprovi o ne scriva uno.', ai_error: 'Impossibile formulare un suggerimento. Riprovi più tardi.', pin: 'Sblocchi prima con il PIN.', network: 'Connessione non riuscita. Controlli la rete e riprovi.' },
};

const es: AiCopy = {
  quota: {
    free: 'Ha usado las 10 sugerencias gratuitas de este mes. Cambie a {upgrade} para tener sugerencias ilimitadas.',
    standard: 'Ha usado las 20 sugerencias de este mes. Añada el {addon} o cambie a {upgrade} para tener sugerencias ilimitadas.',
    standardUpgradeOnly: 'Ha usado las 20 sugerencias de este mes. Cambie a {upgrade} para tener sugerencias ilimitadas.',
    standardAddonOnly: 'Ha usado las 20 sugerencias de este mes. Añada el {addon} para tener sugerencias ilimitadas.',
    day: 'Hoy ha usado muchísimas sugerencias. Vuelva mañana.',
    tooFast: 'Un poco rápido. Espere unos segundos e inténtelo de nuevo.',
    addon: 'complemento IA (29.000 VND/mes)',
    upgrade: 'Pro Plus',
  },
  soonBadge: 'Próximamente',
  soonTitle: 'Coach de hábitos',
  soonBody: 'En desarrollo: dividir un hábito en pasos fáciles y resumir la semana. Estará desactivado por defecto, solo con su consentimiento. La aplicación elimina los nombres y apodos de los niños de lo que escribe antes de enviarlo, así que le rogamos que no los escriba; el diario de su hijo o hija nunca se envía.',
  soonBreakdown: 'Sugerir pasos pequeños con IA',
  soonSummary: 'Resumir la semana con IA',
  consentTitle: 'Sugerencias con IA', consentIntro: 'Al pulsar un botón, la aplicación pide a un modelo de IA (Cloudflare Workers AI) que redacte una sugerencia. Está desactivado de forma predeterminada y puede retirar su consentimiento en cualquier momento.',
  consentSends: 'Solo se envían: el nombre de un hábito que acaba de escribir (para dividirlo en pasos; la aplicación elimina de él los nombres y apodos de sus hijos antes de enviarlo, pero le rogamos que no los escriba) o los recuentos de la semana (para resumirla), junto con el tramo de edad de su hijo o hija (por ejemplo, 6-12).',
  consentNever: 'No se envían: el nombre o apodo del perfil de su hijo, su diario, textos escritos por su hijo, fotos ni su correo electrónico. Retirar el consentimiento detiene nuevos envíos, pero el contenido ya enviado no se puede recuperar. Las sugerencias de la IA pueden ser erróneas y no son asesoramiento médico ni psicológico.',
  consentOnlyHelp: 'El número de sugerencias al mes depende del plan: 10 gratis, 20 con Solo/Pro, ilimitadas con Pro Plus y el complemento IA.', consentToggle: 'Permitir sugerencias con IA', consentFailed: 'No se pudo guardar. Inténtelo de nuevo.',
  breakdownButton: 'Sugerir pequeños pasos con IA', breakdownWorking: 'Redactando una sugerencia…', breakdownTitle: 'Tres pequeños pasos sugeridos', aiLabel: 'Redactado por IA. Léalo con atención antes de usarlo.', minutes: (count) => `${count} min`, use: 'Usar estos pasos', dismiss: 'Descartar', summaryButton: 'Resumir la semana con IA', summaryWorking: 'Redactando un resumen…', summaryTitle: 'Resumen semanal (IA)', needConsent: 'Active «Sugerencias con IA» en Ajustes → Privacidad para usar esta función.',
  errors: { ai_consent_required: 'No ha aceptado las sugerencias con IA. Actívelas en Ajustes → Privacidad.', ai_quota: 'Ahora no hay sugerencias disponibles. Inténtelo de nuevo más tarde.', ai_disabled: 'Las sugerencias con IA están desactivadas temporalmente.', ai_timeout: 'La sugerencia está tardando demasiado. Inténtelo más tarde.', ai_invalid_output: 'Esta vez no hay una sugerencia adecuada. Inténtelo de nuevo o escriba la suya.', ai_error: 'No se pudo redactar una sugerencia. Inténtelo más tarde.', pin: 'Desbloquee primero con su PIN.', network: 'No se pudo conectar. Compruebe la red e inténtelo de nuevo.' },
};

const zh: AiCopy = {
  quota: {
    free: '您已用完本月的10次免费建议。升级至 {upgrade}，即可无限次使用。',
    standard: '您已用完本月的20次建议。购买 {addon}或升级至 {upgrade}，即可无限次使用。',
    standardUpgradeOnly: '您已用完本月的20次建议。升级至 {upgrade}，即可无限次使用。',
    standardAddonOnly: '您已用完本月的20次建议。购买 {addon}，即可无限次使用。',
    day: '您今天已使用了很多建议。请明天再来。',
    tooFast: '操作太快了，请等几秒钟再试。',
    addon: 'AI 附加服务（29,000 VND/月）',
    upgrade: 'Pro Plus',
  },
  soonBadge: '即将推出',
  soonTitle: '习惯教练',
  soonBody: '开发中：把一个习惯拆成容易完成的小步骤，并总结一周情况。默认关闭，只有在您同意后才会运行。发送前应用会从您输入的内容中删除孩子的姓名和昵称，请不要输入；孩子的日记绝不会被发送。',
  soonBreakdown: '用 AI 建议小步骤',
  soonSummary: '用 AI 总结本周',
  consentTitle: 'AI 建议', consentIntro: '点击按钮时，应用会请 AI 模型（Cloudflare Workers AI）拟写建议。默认关闭，您可以随时撤回同意。',
  consentSends: '仅发送：您刚输入的习惯名称（用于拆分步骤；发送前应用会删除其中孩子的姓名和昵称，但请不要输入）或本周的计数（用于总结本周），以及孩子的年龄段（例如6-12岁）。',
  consentNever: '不会发送：孩子的档案姓名或昵称、日记、孩子写的内容、照片或您的电子邮箱。撤回同意后不再继续发送，但已发送的内容无法收回。AI 建议可能有误，不构成医疗或心理建议。',
  consentOnlyHelp: '每月的建议次数取决于方案：免费10次，Solo/Pro 20次，Pro Plus 和 AI 附加服务不限次数。', consentToggle: '允许 AI 建议', consentFailed: '保存失败，请重试。',
  breakdownButton: '用 AI 建议小步骤', breakdownWorking: '正在拟写建议…', breakdownTitle: '建议的三个小步骤', aiLabel: '由 AI 拟写。使用前请仔细阅读。', minutes: (count) => `${count} 分钟`, use: '使用这些步骤', dismiss: '忽略', summaryButton: '用 AI 总结本周', summaryWorking: '正在拟写总结…', summaryTitle: '每周总结（AI）', needConsent: '请在“设置”→“隐私”中开启“AI 建议”以使用。',
  errors: { ai_consent_required: '您尚未同意使用 AI 建议。请在“设置”→“隐私”中开启。', ai_quota: '目前没有可用的建议，请稍后再试。', ai_disabled: 'AI 建议目前暂时关闭。', ai_timeout: '生成建议耗时过长，请稍后重试。', ai_invalid_output: '这次没有合适的建议。请重试或自行编写。', ai_error: '无法拟写建议，请稍后重试。', pin: '请先使用 PIN 解锁。', network: '无法连接。请检查网络后重试。' },
};

const ja: AiCopy = {
  quota: {
    free: '今月の無料提案10回をすべて利用しました。{upgrade} にアップグレードすると、無制限で利用できます。',
    standard: '今月の提案20回をすべて利用しました。{addon}を購入するか {upgrade} にアップグレードすると、無制限で利用できます。',
    standardUpgradeOnly: '今月の提案20回をすべて利用しました。{upgrade} にアップグレードすると、無制限で利用できます。',
    standardAddonOnly: '今月の提案20回をすべて利用しました。{addon}を購入すると、無制限で利用できます。',
    day: '本日はたくさんの提案を利用しました。また明日ご利用ください。',
    tooFast: '操作が早すぎます。数秒待ってからもう一度お試しください。',
    addon: 'AI 追加オプション（月額29,000 VND）',
    upgrade: 'Pro Plus',
  },
  soonBadge: '近日公開',
  soonTitle: '習慣コーチ',
  soonBody: '開発中：習慣を取り組みやすい小さなステップに分けたり、1週間をまとめたりします。初期設定はオフで、同意した場合にのみ動作します。送信前に、入力内容からお子さまの名前やニックネームをアプリが削除しますが、入力しないでください。お子さまの日記は送信しません。',
  soonBreakdown: 'AI で小さなステップを提案',
  soonSummary: 'AI で今週をまとめる',
  consentTitle: 'AI の提案', consentIntro: 'ボタンを押すと、アプリが AI モデル（Cloudflare Workers AI）に提案文の作成を依頼します。初期設定ではオフです。同意はいつでも撤回できます。',
  consentSends: '送信されるのは、入力したばかりの習慣名（手順に分けるため。送信前にアプリがお子さまの名前やニックネームを削除しますが、入力しないでください）または今週の回数（週のまとめ用）、およびお子さまの年齢帯（例：6〜8歳）のみです。',
  consentNever: 'お子さまのプロフィール名やニックネーム、日記、お子さまが書いた文章、写真、保護者のメールアドレスは送信しません。同意を撤回するとそれ以降の送信は止まりますが、送信済みの内容は取り戻せません。AI の提案は誤っていることがあり、医療的・心理的な助言ではありません。',
  consentOnlyHelp: '1か月の提案数はプランによって異なります（無料10回、Solo/Pro 20回、Pro Plus と AI 追加オプションは無制限）。', consentToggle: 'AI の提案を許可', consentFailed: '保存できませんでした。もう一度お試しください。',
  breakdownButton: 'AI で小さな手順を提案', breakdownWorking: '提案を作成中…', breakdownTitle: '提案された3つの小さな手順', aiLabel: 'AI が作成しました。使う前によくお読みください。', minutes: (count) => `${count} 分`, use: 'この手順を使う', dismiss: '閉じる', summaryButton: 'AI で今週をまとめる', summaryWorking: 'まとめを作成中…', summaryTitle: '今週のまとめ（AI）', needConsent: '利用するには「設定」→「プライバシー」で「AI の提案」をオンにしてください。',
  errors: { ai_consent_required: 'AI の提案に同意していません。「設定」→「プライバシー」でオンにしてください。', ai_quota: '現在ご利用できる提案がありません。後でもう一度お試しください。', ai_disabled: 'AI の提案は現在一時的にオフです。', ai_timeout: '提案の作成に時間がかかりすぎています。後でもう一度お試しください。', ai_invalid_output: '今回は適切な提案がありませんでした。再試行するか、ご自身で入力してください。', ai_error: '提案を作成できませんでした。後でもう一度お試しください。', pin: '先に PIN でロックを解除してください。', network: '接続できません。ネットワークを確認して再試行してください。' },
};

const ko: AiCopy = {
  quota: {
    free: '이번 달 무료 제안 10회를 모두 사용했습니다. {upgrade}로 업그레이드하면 무제한으로 이용할 수 있습니다.',
    standard: '이번 달 제안 20회를 모두 사용했습니다. {addon}을 구매하거나 {upgrade}로 업그레이드하면 무제한으로 이용할 수 있습니다.',
    standardUpgradeOnly: '이번 달 제안 20회를 모두 사용했습니다. {upgrade}로 업그레이드하면 무제한으로 이용할 수 있습니다.',
    standardAddonOnly: '이번 달 제안 20회를 모두 사용했습니다. {addon}을 구매하면 무제한으로 이용할 수 있습니다.',
    day: '오늘 제안을 아주 많이 사용했습니다. 내일 다시 이용해 주세요.',
    tooFast: '너무 빠릅니다. 몇 초 후 다시 시도해 주세요.',
    addon: 'AI 추가 옵션(월 29,000 VND)',
    upgrade: 'Pro Plus',
  },
  soonBadge: '곧 출시',
  soonTitle: '습관 코치',
  soonBody: '개발 중: 습관을 쉬운 단계로 나누고 한 주를 요약합니다. 기본값은 꺼짐이며, 동의하신 경우에만 작동합니다. 전송 전에 앱이 입력하신 내용에서 자녀의 이름과 별명을 삭제하지만 입력하지 말아 주세요. 자녀의 일기는 절대 보내지 않습니다.',
  soonBreakdown: 'AI로 작은 단계 제안',
  soonSummary: 'AI로 주간 요약',
  consentTitle: 'AI 제안', consentIntro: '버튼을 누르면 앱이 AI 모델(Cloudflare Workers AI)에 제안 작성을 요청합니다. 기본 설정은 꺼짐이며 언제든 동의를 철회할 수 있습니다.',
  consentSends: '전송되는 정보는 방금 입력한 습관 이름(단계로 나누기 위한 용도이며, 전송 전에 앱이 자녀의 이름과 별명을 삭제하지만 입력하지 말아 주세요) 또는 이번 주 횟수(주간 요약용), 그리고 자녀의 연령대(예: 6-12세)뿐입니다.',
  consentNever: '자녀의 프로필 이름이나 별명, 일기, 자녀가 쓴 글, 사진, 보호자 이메일은 전송하지 않습니다. 동의를 철회하면 이후 전송은 중단되지만 이미 전송된 내용은 회수할 수 없습니다. AI 제안은 틀릴 수 있으며 의료·심리 조언이 아닙니다.',
  consentOnlyHelp: '한 달 제안 횟수는 플랜에 따라 달라요(무료 10회, Solo/Pro 20회, Pro Plus와 AI 추가 옵션은 무제한).', consentToggle: 'AI 제안 허용', consentFailed: '저장하지 못했습니다. 다시 시도해 주세요.',
  breakdownButton: 'AI로 작은 단계 제안받기', breakdownWorking: '제안을 작성하는 중…', breakdownTitle: '제안된 작은 단계 세 가지', aiLabel: 'AI가 작성했습니다. 사용 전에 꼼꼼히 읽어 주세요.', minutes: (count) => `${count}분`, use: '이 단계 사용하기', dismiss: '닫기', summaryButton: 'AI로 이번 주 요약하기', summaryWorking: '요약을 작성하는 중…', summaryTitle: '주간 요약(AI)', needConsent: '사용하려면 설정 → 개인정보에서 ‘AI 제안’을 켜 주세요.',
  errors: { ai_consent_required: 'AI 제안에 동의하지 않았습니다. 설정 → 개인정보에서 켜 주세요.', ai_quota: '현재 이용할 수 있는 제안이 없습니다. 나중에 다시 시도해 주세요.', ai_disabled: 'AI 제안이 현재 일시적으로 꺼져 있습니다.', ai_timeout: '제안 작성에 너무 오래 걸립니다. 나중에 다시 시도해 주세요.', ai_invalid_output: '이번에는 적절한 제안이 없습니다. 다시 시도하거나 직접 작성해 주세요.', ai_error: '제안을 작성하지 못했습니다. 나중에 다시 시도해 주세요.', pin: '먼저 PIN으로 잠금을 해제해 주세요.', network: '연결할 수 없습니다. 네트워크를 확인한 뒤 다시 시도해 주세요.' },
};

const COPY: Record<Language, AiCopy> = { vi, en, fr, de, it, es, zh, ja, ko };

export function getAiCopy(language: Language): AiCopy {
  return COPY[language] ?? en;
}

const ADDON_PLANS: readonly string[] = ['solo_monthly', 'solo_yearly', 'monthly', 'yearly', 'lifetime'];

/** The AI add-on is only sold on top of an active Solo/Pro/lifetime plan; the store reports 'free' for anything not active. */
export function canBuyAiAddon(plan: string, endsAt: string | null, now: number = Date.now()): boolean {
  return ADDON_PLANS.includes(plan) && (endsAt === null || Date.parse(endsAt) > now);
}

/**
 * The upsell template for a monthly or daily refusal, with `{addon}` and `{upgrade}` left for the screen to turn into links.
 * Null for every other refusal (a plain error) and for a Plus family, which is never sold what it already has.
 */
export function quotaTemplate(copy: AiCopy, reason: string | undefined, tier: AiTier | undefined, addonSellable: boolean, lifetime = false): string | null {
  if (reason === 'too_fast') return copy.quota.tooFast;
  if (reason === 'family_day') return copy.quota.day;
  if (reason !== 'family_month') return null;
  if (tier === 'free') return copy.quota.free;
  // Lifetime already includes every plan, so Pro Plus cannot be bought; the add-on is the only way up.
  if (tier === 'standard') return lifetime ? copy.quota.standardAddonOnly : addonSellable ? copy.quota.standard : copy.quota.standardUpgradeOnly;
  return null;
}
