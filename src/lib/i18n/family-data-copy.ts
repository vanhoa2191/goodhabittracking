import type { Language } from '@/types';

export type FamilyDataCopy = {
  title: string;
  intro: string;
  private: string;
  exportButton: string;
  exportDone: string;
  exportFailed: string;
  importButton: string;
  importWarning: string;
  importConfirm: string;
  importCancel: string;
  importDone: string;
  importInvalid: string;
  importCloudNote: string;
};

const COPY: Record<Language, FamilyDataCopy> = {
  vi: {
    title: "Dữ liệu gia đình",
    intro: "Tải về một bản sao dữ liệu của gia đình để lưu giữ hoặc mang đi. Tệp gồm hồ sơ các bé, thói quen, lịch sử hoàn thành, phần thưởng, nhóm, nhật ký, tín hiệu và ghi nhận cách bé làm.",
    private: "Tệp chứa thông tin của bé nên hãy giữ riêng tư. Tệp không chứa mã PIN phụ huynh và không chứa thông tin thanh toán.",
    exportButton: "Tải bản sao dữ liệu (JSON)",
    exportDone: "Đã tạo tệp. Hãy cất ở nơi an toàn.",
    exportFailed: "Chưa tạo được tệp. Bạn thử lại nhé.",
    importButton: "Khôi phục từ tệp JSON",
    importWarning: "Khôi phục sẽ thay thế toàn bộ dữ liệu đang có trên thiết bị này bằng nội dung của tệp.",
    importConfirm: "Thay thế dữ liệu",
    importCancel: "Hủy",
    importDone: "Đã khôi phục dữ liệu từ tệp.",
    importInvalid: "Tệp không hợp lệ hoặc không phải bản sao của KidHabit. Dữ liệu hiện tại được giữ nguyên.",
    importCloudNote: "Khôi phục từ tệp chỉ dùng khi dữ liệu lưu trên thiết bị này. Với tài khoản Google, dữ liệu đã được lưu trên máy chủ của gia đình.",
  },
  en: {
    title: "Family data",
    intro: "Download a copy of your family's data to keep or take with you. The file includes the children's profiles, habits, completion history, rewards, groups, journal entries, cues and how each habit was done.",
    private: "The file contains your children's information, so keep it private. It does not contain the parent PIN or any payment information.",
    exportButton: "Download a copy of the data (JSON)",
    exportDone: "The file was created. Please keep it somewhere safe.",
    exportFailed: "The file could not be created. Please try again.",
    importButton: "Restore from a JSON file",
    importWarning: "Restoring replaces all the data on this device with the contents of the file.",
    importConfirm: "Replace the data",
    importCancel: "Cancel",
    importDone: "The data was restored from the file.",
    importInvalid: "The file is not valid or is not a KidHabit copy. Your current data was kept.",
    importCloudNote: "Restoring from a file is only for data stored on this device. With a Google account, your family's data is already stored on the server.",
  },
  fr: {
    title: "Données de la famille",
    intro: "Téléchargez une copie des données de votre famille pour les conserver ou les emporter. Le fichier contient les profils des enfants, les habitudes, l’historique des habitudes accomplies, les récompenses, les groupes, les notes du journal, les repères et la façon dont chaque habitude a été réalisée.",
    private: "Le fichier contient des informations sur vos enfants. Gardez-le confidentiel. Il ne contient ni le PIN parental ni d’informations de paiement.",
    exportButton: "Télécharger une copie des données (JSON)",
    exportDone: "Le fichier a été créé. Gardez-le dans un endroit sûr.",
    exportFailed: "Le fichier n’a pas pu être créé. Veuillez réessayer.",
    importButton: "Restaurer à partir d’un fichier JSON",
    importWarning: "La restauration remplacera toutes les données de cet appareil par le contenu du fichier.",
    importConfirm: "Remplacer les données",
    importCancel: "Annuler",
    importDone: "Les données ont été restaurées à partir du fichier.",
    importInvalid: "Le fichier n’est pas valide ou n’est pas une copie des données de KidHabit. Vos données actuelles ont été conservées.",
    importCloudNote: "La restauration à partir d’un fichier concerne uniquement les données stockées sur cet appareil. Avec un compte Google, les données de votre famille sont déjà stockées sur le serveur.",
  },
  de: {
    title: "Familiendaten",
    intro: "Lade eine Kopie der Daten deiner Familie herunter, um sie aufzubewahren oder mitzunehmen. Die Datei enthält die Profile der Kinder, Gewohnheiten, den Verlauf erledigter Gewohnheiten, Belohnungen, Gruppen, Tagebucheinträge, Erinnerungsimpulse und Angaben dazu, wie jede Gewohnheit ausgeführt wurde.",
    private: "Die Datei enthält Informationen über deine Kinder. Bewahre sie vertraulich auf. Sie enthält weder die PIN für Eltern noch Zahlungsinformationen.",
    exportButton: "Kopie der Daten herunterladen (JSON)",
    exportDone: "Die Datei wurde erstellt. Bewahre sie an einem sicheren Ort auf.",
    exportFailed: "Die Datei konnte nicht erstellt werden. Bitte versuche es noch einmal.",
    importButton: "Aus einer JSON-Datei wiederherstellen",
    importWarning: "Beim Wiederherstellen werden alle Daten auf diesem Gerät durch den Inhalt der Datei ersetzt.",
    importConfirm: "Daten ersetzen",
    importCancel: "Abbrechen",
    importDone: "Die Daten wurden aus der Datei wiederhergestellt.",
    importInvalid: "Die Datei ist ungültig oder keine Kopie der KidHabit-Daten. Deine aktuellen Daten wurden beibehalten.",
    importCloudNote: "Das Wiederherstellen aus einer Datei ist nur für Daten vorgesehen, die auf diesem Gerät gespeichert sind. Bei einem Google-Konto sind die Daten deiner Familie bereits auf dem Server gespeichert.",
  },
  it: {
    title: "Dati della famiglia",
    intro: "Scarica una copia dei dati della tua famiglia per conservarli o portarli con te. Il file include i profili dei bambini, le abitudini, la cronologia delle abitudini completate, i premi, i gruppi, le note del diario, i segnali e il modo in cui è stata svolta ogni abitudine.",
    private: "Il file contiene informazioni sui tuoi bambini, quindi mantienilo privato. Non contiene il PIN genitore né informazioni di pagamento.",
    exportButton: "Scarica una copia dei dati (JSON)",
    exportDone: "Il file è stato creato. Conservalo in un posto sicuro.",
    exportFailed: "Non è stato possibile creare il file. Riprova.",
    importButton: "Ripristina da un file JSON",
    importWarning: "Il ripristino sostituirà tutti i dati presenti su questo dispositivo con il contenuto del file.",
    importConfirm: "Sostituisci i dati",
    importCancel: "Annulla",
    importDone: "I dati sono stati ripristinati dal file.",
    importInvalid: "Il file non è valido o non è una copia dei dati di KidHabit. I tuoi dati attuali sono stati mantenuti.",
    importCloudNote: "Il ripristino da un file serve solo per i dati salvati su questo dispositivo. Con un account Google, i dati della tua famiglia sono già salvati sul server.",
  },
  es: {
    title: "Datos de la familia",
    intro: "Descarga una copia de los datos de tu familia para guardarlos o llevarlos contigo. El archivo incluye los perfiles de los niños, los hábitos, el historial de hábitos completados, las recompensas, los grupos, las entradas del diario, las señales y cómo se realizó cada hábito.",
    private: "El archivo contiene información de tus hijos, así que mantenlo privado. No contiene el PIN parental ni información de pago.",
    exportButton: "Descargar una copia de los datos (JSON)",
    exportDone: "Se ha creado el archivo. Guárdalo en un lugar seguro.",
    exportFailed: "No se ha podido crear el archivo. Inténtalo de nuevo.",
    importButton: "Restaurar desde un archivo JSON",
    importWarning: "La restauración sustituirá todos los datos de este dispositivo por el contenido del archivo.",
    importConfirm: "Sustituir los datos",
    importCancel: "Cancelar",
    importDone: "Se han restaurado los datos desde el archivo.",
    importInvalid: "El archivo no es válido o no es una copia de los datos de KidHabit. Se han conservado tus datos actuales.",
    importCloudNote: "La restauración desde un archivo solo sirve para los datos guardados en este dispositivo. Con una cuenta de Google, los datos de tu familia ya están guardados en el servidor.",
  },
  zh: {
    title: "家庭数据",
    intro: "下载一份家庭数据副本，方便保存或随身带走。文件包含孩子的个人资料、习惯、完成记录、奖励、分组、日记、提示信号，以及每项习惯是如何完成的。",
    private: "文件包含孩子的信息，请妥善保管，不要随意分享。文件不包含家长 PIN 或任何付款信息。",
    exportButton: "下载数据副本（JSON）",
    exportDone: "文件已创建。请保存在安全的地方。",
    exportFailed: "无法创建文件。请重试。",
    importButton: "从 JSON 文件恢复",
    importWarning: "恢复会将此设备上的所有现有数据替换为文件中的内容。",
    importConfirm: "替换数据",
    importCancel: "取消",
    importDone: "已从文件恢复数据。",
    importInvalid: "文件无效，或不是 KidHabit 的数据副本。现有数据已保留。",
    importCloudNote: "从文件恢复仅适用于保存在此设备上的数据。如果使用 Google 账号，家庭数据已经保存在服务器上。",
  },
  ja: {
    title: "家族のデータ",
    intro: "家族のデータのコピーをダウンロードして、保管したり持ち運んだりできます。ファイルには、お子さんのプロフィール、習慣、完了履歴、ごほうび、グループ、日記、きっかけとなる合図、各習慣にどのように取り組んだかの記録が含まれます。",
    private: "ファイルにはお子さんの情報が含まれるため、他の人に見られないよう大切に保管してください。保護者用の PIN や支払い情報は含まれません。",
    exportButton: "データのコピーをダウンロード（JSON）",
    exportDone: "ファイルを作成しました。安全な場所に保管してください。",
    exportFailed: "ファイルを作成できませんでした。もう一度お試しください。",
    importButton: "JSON ファイルから復元",
    importWarning: "復元すると、この端末にあるすべてのデータがファイルの内容に置き換わります。",
    importConfirm: "データを置き換える",
    importCancel: "キャンセル",
    importDone: "ファイルからデータを復元しました。",
    importInvalid: "ファイルが無効か、KidHabit のデータのコピーではありません。現在のデータはそのまま保持されています。",
    importCloudNote: "ファイルからの復元は、この端末に保存されているデータにのみ使えます。Google アカウントをお使いの場合、家族のデータはすでにサーバーに保存されています。",
  },
  ko: {
    title: "가족 데이터",
    intro: "가족 데이터의 사본을 다운로드해 보관하거나 가져갈 수 있어요. 파일에는 아이들의 프로필, 습관, 완료 기록, 보상, 그룹, 일지, 습관을 시작하게 하는 신호, 각 습관을 어떻게 실천했는지에 대한 기록이 포함돼요.",
    private: "파일에는 아이들의 정보가 들어 있으니 다른 사람에게 공개되지 않도록 보관해 주세요. 부모용 PIN이나 결제 정보는 포함되지 않아요.",
    exportButton: "데이터 사본 다운로드 (JSON)",
    exportDone: "파일이 만들어졌어요. 안전한 곳에 보관해 주세요.",
    exportFailed: "파일을 만들지 못했어요. 다시 시도해 주세요.",
    importButton: "JSON 파일에서 복원",
    importWarning: "복원하면 이 기기에 있는 모든 데이터가 파일의 내용으로 바뀌어요.",
    importConfirm: "데이터 바꾸기",
    importCancel: "취소",
    importDone: "파일에서 데이터를 복원했어요.",
    importInvalid: "파일이 유효하지 않거나 KidHabit 데이터 사본이 아니에요. 현재 데이터는 그대로 유지됐어요.",
    importCloudNote: "파일에서 복원하는 기능은 이 기기에 저장된 데이터에만 사용할 수 있어요. Google 계정을 사용하면 가족 데이터는 이미 서버에 저장되어 있어요.",
  },
};

export function getFamilyDataCopy(language: Language): FamilyDataCopy {
  return COPY[language];
}
