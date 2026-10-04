# 9. Sicherheit und Datenschutz

[← 8. Freunde werben](08-gioi-thieu-ban-be.md) · [Inhaltsverzeichnis](README.md) · [Weiter: 10. Verwaltung und Betrieb →](10-quan-tri-va-van-hanh.md)

<!--op-->## In diesem Leitfaden

[Welche Daten gespeichert werden](#du-lieu) · [Wer was sehen kann](#ai-thay) · [Kopplungscode Ihres Kindes](#ma-ghep) · [PIN](#pin) · [Einwilligung](#dong-thuan) · [Öffentliche Rangliste](#bxh-cong-khai) · [Meilensteine teilen](#chia-se) · [Empfehlungsprogramm](#gioi-thieu-rieng-tu) · [KI-Vorschläge](#goi-y-ai) · [Analysen und Erinnerungen](#do-luong) · [Daten herunterladen und löschen](#xoa-du-lieu) · [Technische Schutzmaßnahmen](#ky-thuat) · [Rechtliche Einschränkungen](#phap-ly) · [Weiterführende Themen](#lien-quan)<!--/op-->

Diese Seite erläutert in einfacher Sprache, wie KidHabit die Daten Ihres Kindes schützt. Technische Details finden Sie unter [Sicherheit und Datenschutz](../security-privacy.md).

<a id="du-lieu"></a>
## Welche Daten gespeichert werden

Die App speichert das Profil Ihres Kindes (Name, Spitzname, Alter), Gewohnheiten, Fortschritt, Punkte, Belohnungen, gekoppelte Geräte und Tarif sowie die Kontaktdaten der Eltern (vollständiger Name, Telefonnummer, E-Mail-Adresse). Optionale Funktionen können auch ein Tagebuch mit einem Satz, einen Auslöserplan, Angaben dazu, wie Ihr Kind einzelne Versuche ausführt, und eine Wunschliste umfassen. **Wir übermitteln niemals** Daten Ihres Kindes, Sitzungscodes, PINs, PayOS-Schlüssel oder Webhook-Inhalte an ein Analysesystem.

<a id="ai-thay"></a>
## Wer was sehen kann

| Person | Kann sehen | Kann nicht sehen |
|---|---|---|
| Elternteil | Alle Daten der eigenen Familie | Daten anderer Familien |
| Betreuungsperson | Namen der Kinder, aktive Gewohnheiten (mit Wiederholungsplan), Gesamtzahl erledigter oder bestätigter Versuche je Kind und die Anzahl pro Tag der letzten 7 Tage, im Nur-Lese-Modus | Keine Änderungen; keine einzelnen Versuche, Tageszeiten, Notizen, Altersangaben, Spitznamen, Belohnungen, Gruppen, Tarife, Zahlungen, Einstellungen oder andere Mitglieder |
| Kind (gekoppeltes Gerät) | Eigene Daten | Profile anderer Kinder, Zahlungen, Einstellungen oder PIN |
| Betriebsteam | Elternprofile (Name, E-Mail, Telefon), Tarife, Bestellungen; jede Aktion wird protokolliert | Kinderprofile, Aufgaben oder Tagebuch des Kindes |

Jede Familie wird auf Datenbankebene in einem eigenen, getrennten „Bereich“ aufbewahrt: Ein Konto kann die Daten einer anderen Familie weder lesen noch ändern, selbst wenn ein Fehler in der Benutzeroberfläche vorliegt. Jedes Datenelement gehört zu einer `family_id`; Tarife und Leistungen gehören zur Familie, nicht zu einer E-Mail-Adresse.

<a id="ma-ghep"></a>
## Kopplungscode Ihres Kindes

- Jeder Code öffnet **genau ein Kinderprofil** und enthält weder PIN noch Familiendaten. In der Datenbank wird nur ein Hash des Codes gespeichert.
- Die Sitzung des Kindergeräts wird in einem HTTP-only-Cookie gespeichert, das Seitenskripte nicht lesen können. Jede Anfrage liefert nur Daten für ein Kind.
- Wiederholte falsche Codeeingaben unterliegen einer **Ratenbegrenzung**.
- Eltern können den Code jederzeit **erneuern** (der alte Code wird ungültig) und einzelne Geräte **entkoppeln** ([5](05-gia-dinh-va-cai-dat.md#ghep-thiet-bi)). Zum Anzeigen, Ändern oder Widerrufen eines Codes ist die PIN erforderlich.

<a id="pin"></a>
## PIN

Die 4-stellige PIN wird vom **Server** überprüft. Nach korrekter Eingabe erhält der Browser ein signiertes Freigabe-Cookie, das an Elternteil und Familie gebunden ist. Es bleibt **2 Stunden** gültig und wird gelöscht, wenn Sie erneut sperren. Bei Familien mit eingerichteter PIN werden sensible Aktionen bis zur Freigabe abgelehnt: Familie löschen, Geräte entkoppeln, Kopplungscodes anzeigen oder ändern, Zahlungen erstellen, Aufgaben und Belohnungen bestätigen, Sterne manuell hinzufügen oder abziehen sowie Auszahlungsinformationen des Empfehlungsprogramms ansehen. Ein Kind kann auf dem Gerät der Eltern eine Aufgabe durch Tippen erledigen, ohne die PIN einzugeben. Eine Anleitung zum Einrichten einer PIN finden Sie unter [5](05-gia-dinh-va-cai-dat.md#pin).

<a id="dong-thuan"></a>
## Einwilligung

- Während der [Familieneinrichtung](01-bat-dau.md#thiet-lap) muss die erwachsene Person bestätigen, dass sie Elternteil oder gesetzliche Vertretung ist, und der Speicherung der Daten des Kindes zustimmen. Die Einwilligung wird mit der **Richtlinienversion** gespeichert.
- Öffentliche Rangliste, anonyme Analysen, Erinnerungen und Werbeangebote sind **optionale Einstellungen**, standardmäßig **ausgeschaltet** und können wieder ausgeschaltet werden. Widerrufe werden als Zeitstempel aufbewahrt; der Einwilligungsverlauf wird nicht gelöscht.
- Betreuungspersonen können nur über eine einmalige, von einem Elternteil erstellte Einladung auf die Familie zugreifen (läuft nach 72 Stunden ab); die Einladung kann widerrufen werden ([5](05-gia-dinh-va-cai-dat.md#nguoi-cham-soc)).

<a id="bxh-cong-khai"></a>
## Öffentliche Rangliste

Ein Kind erscheint nur dann in der öffentlichen Rangliste, wenn **beide** Bedingungen erfüllt sind: Die Familie hat die Freigabe aktiviert (standardmäßig aus und nur von Eltern änderbar) **und** das Profil des Kindes wurde als teilnehmend markiert (neue Profile sind standardmäßig privat). Angezeigt werden nur Spitzname (oder „Super Kid“), Avatar, Punkte des Zeitraums, Serie und Rang; **nicht** angezeigt werden Kinder- oder Familiencode, echter Name oder Alter. Punkte stammen aus bestätigten Einträgen im jeweiligen Zeitraum, nicht aus dem aktuellen Kontostand. Das Einlösen von Sternen gegen Belohnungen ändert die Rangfolge daher nicht. Familien- und Gruppenranglisten verwenden nur Daten ihres jeweiligen Bereichs. Einstellungen: [5](05-gia-dinh-va-cai-dat.md#rieng-tu); Ansicht des Kindes: [2](02-man-hinh-be.md#bang-xep-hang).

<a id="chia-se"></a>
## Meilensteine teilen

„Positiven Meilenstein teilen“ ([3](03-hom-nay-va-duyet-viec.md#thong-ke)) zeigt Eltern immer **eine Vorschau und die Möglichkeit zur Bestätigung**, bevor das Teilen-Menü des Geräts geöffnet wird. Standardmäßig enthält der Inhalt weder Namen, Alter, Fotos noch Aufgaben des Kindes und keinen Tracking-Code.

<a id="gioi-thieu-rieng-tu"></a>
## Empfehlungsprogramm

Der Empfehlungscode wird 60 Tage im Cookie `kidhabit_ref` gespeichert und nach der Erfassung gelöscht. Nur autorisierte Administratoren können die Bankdaten der werbenden Person einsehen; diese sieht nur die letzten 4 Ziffern. Werbende sehen **niemals** Informationen über die geworbene Familie ([8](08-gioi-thieu-ban-be.md)).

<a id="goi-y-ai"></a>
## KI-Vorschläge

Diese Funktion wird nach und nach aktiviert und ist standardmäßig **ausgeschaltet**. Sie wird erst angezeigt, wenn Sie unter Einstellungen → Datenschutz der Karte **KI-Vorschläge** zugestimmt haben. Wenn Sie auf eine Vorschlagsschaltfläche tippen, bittet die App ein KI-Modell (Cloudflare Workers AI), einen Entwurf zu erstellen:

- **Mit KI kleine Schritte vorschlagen** (im Gewohnheitsformular): Übermittelt werden nur **der soeben eingegebene Name der Gewohnheit** (nach dem Entfernen von Links, E-Mail-Adressen und Telefonnummern) und eine Altersgruppe.
- **Woche mit KI zusammenfassen**: Übermittelt werden nur **die Wochenzahlen** (allein erledigt, mit Erinnerung, gemeinsam, nicht erledigt), ohne Gewohnheits- oder Kindernamen.

**Niemals übermittelt werden**: Name oder Spitzname Ihres Kindes, Tagebuch, von Ihrem Kind verfasste Inhalte, Fotos oder Ihre E-Mail-Adresse. Was gesendet wird und was zurückkommt, wird **nicht in Systemprotokolle geschrieben**. Das Ergebnis ist nur ein Vorschlag mit der Kennzeichnung „von KI entworfen“. Sie lesen ihn und wählen **Verwenden** oder **Verwerfen**; die App wendet selbst nichts an. Jede Familie hat eine begrenzte Anzahl von Vorschlägen pro Tag; wenn das gemeinsame Kontingent ausgeschöpft ist, pausiert die Funktion. Wie bei anderen sensiblen Aktionen ist Ihre PIN erforderlich. Wenn Sie die Einstellung ausschalten, wird die Funktion sofort beendet.

<a id="do-luong"></a>
## Analysen und Erinnerungen

- **Anonyme Analysen** haben strenge Grenzen: Ereignisse enthalten keine Namen, Inhalte von Gewohnheiten, Kinder-, Familien- oder Benutzercodes, Kopplungscodes, Zahlungsdaten oder exakten Zeitstempel. **Derzeit ist kein Erfassungsziel konfiguriert**, daher werden auch bei Einwilligung der Eltern keine Daten vom Gerät übertragen. Ohne tatsächliche Messungen werden keine Kennzahlen (DAU, Bindung, NPS usw.) veröffentlicht. Siehe [Produktanalysen](../product-analytics.md).
- **Erinnerungen** informieren Sie nur über Aufgaben, die bestätigt werden müssen; sie werden nicht für Werbung verwendet.
- Angaben dazu, wie Ihr Kind einzelne Versuche ausführt, und Auslöserpläne werden **nur verwendet, um Eltern Vorschläge zu geben**. Sie werden nicht verwendet, um Kinder einzustufen oder zu vergleichen ([6](06-khoa-hoc-thoi-quen.md#logic)).

<a id="xoa-du-lieu"></a>
## Daten herunterladen und löschen

- **Herunterladen**: JSON-Kopie der Familiendaten ([5](05-gia-dinh-va-cai-dat.md#du-lieu)) und CSV-Datei mit Tagebucheinträgen ([3](03-hom-nay-va-duyet-viec.md#thong-ke)). Bewahren Sie diese Dateien vertraulich auf, da sie Daten Ihres Kindes enthalten.
- **Dauerhaft löschen**: Nur der **Familieninhaber** kann dies unter `Today → Analytics` tun. Geben Sie dazu exakt `DELETE FAMILY` ein (falls eingerichtet, ist eine PIN erforderlich). Dadurch werden Kinderprofile, Gewohnheiten, Fortschritt, Belohnungen, gekoppelte Geräte und Gerätesitzungen gelöscht; die Aktion kann nicht rückgängig gemacht werden. Die Wiederherstellung des Anmeldekontos **stellt gelöschte Daten nicht wieder her** ([Datenwiederherstellung](../data-recovery.md)).

<a id="ky-thuat"></a>
## Technische Schutzmaßnahmen

| Schutzmaßnahme | Bedeutung für Sie |
|---|---|
| Trennung von Familien und Sperren auf Zeilenebene bei Transaktionen | Daten verschiedener Familien können nicht vermischt werden |
| Alle schreibenden, cookie-basierten Befehle weisen Cross-Origin-Anfragen zurück | Eine unbekannte Website kann nicht in Ihrem Namen handeln |
| PayOS nach dem Prinzip „fail closed“: Signatur, Betrag, Inhalt, Bestellinhaber und Prüfung auf doppelte Verarbeitung | Eine gefälschte Benachrichtigung kann keinen Tarif aktivieren |
| Einmalige Testphase und Tarifprüfungen auf Datenbankebene | Beschränkungen lassen sich nicht durch Ändern der Oberfläche umgehen |
| Content Security Policy (CSP), Frame-Schutz und minimale Browserberechtigungen | Geringeres Risiko durch schädlichen Code |
| Sensible Funktionen sind nur auf dem Server verfügbar; neue Funktionen sind standardmäßig gesperrt | Weniger Möglichkeiten für Missbrauch |
| Administratoren benötigen eine Zwei-Schritt-Verifizierung; jede Aktion wird mit Begründung protokolliert | Nachvollziehbarkeit und Kontrolle |

<a id="phap-ly"></a>
## Rechtliche Einschränkungen

Die Voreinstellungen sind für Kinderdaten **vorsichtig ausgelegt**, stellen aber **keine Zertifizierung** der Einhaltung von COPPA oder GDPR-K dar. Lassen Sie vor Aktivierung der öffentlichen Rangliste in einem bestimmten Markt rechtlich prüfen: Einwilligungsalter, Aufbewahrungsdauer, Auskunftsrechte und Löschrechte. Die Seiten `Privacy`, `Terms` und `Contact` auf der [Website](11-website-va-trang-cong-khai.md#phap-ly-web) können Entwürfe bleiben (nicht indexiert und weder in der Fußzeile noch beim Bezahlvorgang angezeigt), bis das Flag für die rechtliche Freigabe aktiviert ist. Melden Sie Vorfälle nicht über öffentliche Kanäle, wenn dafür Geheimnisse oder Daten von Kindern übermittelt werden müssten.

<a id="lien-quan"></a>
## Weiterführende Themen

- PINs, Geräte und Betreuungspersonen: [5. Familie und Einstellungen](05-gia-dinh-va-cai-dat.md).
- Ranglisten: [2. Kinderansicht](02-man-hinh-be.md#bang-xep-hang).
- Administration und Aktionsprotokolle: [10. Verwaltung und Betrieb](10-quan-tri-va-van-hanh.md).
- Reaktion auf Sicherheitsvorfälle: [Reaktion auf Sicherheitsvorfälle](../runbooks/incident-response.md).
