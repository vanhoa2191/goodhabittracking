# 1. Erste Schritte

[← Inhaltsverzeichnis](README.md) · [Weiter: 2. Kinderansicht →](02-man-hinh-be.md)

<!--op-->## In diesem Leitfaden

[Drei Möglichkeiten, die App zu öffnen](#cach-vao) · [Anmelden](#dang-nhap) · [Ihre Familie einrichten](#thiet-lap) · [Kundeninformationen](#thong-tin) · [Rollen](#vai-tro) · [Demo](#demo) · [Sprache](#ngon-ngu) · [Hilfe in der App finden](#tro-giup) · [Weiterführendes](#lien-quan)<!--/op-->

<a id="cach-vao"></a>
## Drei Möglichkeiten, die App zu öffnen

Wenn Sie `app.kidhabithero.com` zum ersten Mal öffnen, bietet der Bildschirm „Wie möchten Sie KidHabit öffnen?“ drei Möglichkeiten: zwei sichtbare Schaltflächen und einen eingeklappten Bereich für Kinder. Die Eltern- und Kinderbereiche sind getrennt: Kinder sehen niemals Zahlungen oder Familieneinstellungen.

| Einstiegsmöglichkeit | Für | Was geschieht |
|---|---|---|
| **Als Elternteil fortfahren** (mit Google anmelden) | Eltern und Erziehungsberechtigte | Öffnet das Familien-Dashboard ([3](03-hom-nay-va-duyet-viec.md)). Beim ersten Mal durchlaufen Sie die [Familieneinrichtung](#thiet-lap). |
| **Ist dies das Gerät eines Kindes?** (öffnen und dann „Code eingeben oder QR-Code scannen“ wählen) | Kinder | Das Gerät wird genau einem Kind zugeordnet und öffnet direkt die [Kinderansicht](02-man-hinh-be.md). Das Kind benötigt kein Konto. |
| **Demo ansehen** (sichtbar unter der Schaltfläche für Eltern) | Alle | Verwendet Beispieldaten und erfordert kein Konto ([Demo](#demo)). |

Bereits angemeldete Eltern gelangen direkt zum Dashboard. Um die Startseite erneut aufzurufen, wählen Sie „Startseite“ oder „Landingpage anzeigen“. Sobald ein Gerät eines Kindes gekoppelt ist, öffnet es immer direkt die Kinderansicht und zeigt weder das Eltern-Dashboard noch die Preisseite.

<a id="dang-nhap"></a>
## Anmelden

- **Google** ist die wichtigste Anmeldemethode für Eltern.
- **Einmalcode per E-Mail** ist die zweite Möglichkeit und derzeit **deaktiviert**, bis sie aktiviert wird<!--op--> (über das Flag `emailCodeLogin`, [so aktivieren Sie es](../deployment.md))<!--/op-->. Bei Aktivierung erscheint auf dem Einstiegsbildschirm der eingeklappte Bereich „Andere Anmeldemöglichkeiten“. Beim Öffnen wird das Feld „Oder Anmeldecode per E-Mail erhalten“ angezeigt. Ist das Flag ausgeschaltet, gibt es diesen Bereich nicht. Eltern geben ihre E-Mail-Adresse ein, erhalten einen kurzen Zahlencode und geben diesen zum Anmelden ein. Nach einigen Sekunden können sie einen weiteren Code anfordern; bei zu vielen Anfragen müssen sie einige Minuten warten.
- Wenn die Anmeldung fehlschlägt, zeigt die App eine kurze Meldung und eine Schaltfläche zum erneuten Versuch. Es wird nichts gespeichert.

Eltern, die sich über einen Empfehlungslink (`?ref=`) anmelden, werden automatisch als geworbene Familien erfasst ([8](08-gioi-thieu-ban-be.md#ghi-nhan)). Als Betreuungsperson eingeladene Personen melden sich mit Google an und nehmen anschließend die Einladung an ([5](05-gia-dinh-va-cai-dat.md#nguoi-cham-soc)).

<a id="thiet-lap"></a>
## Erstes Kinderprofil erstellen

Beim ersten Aufrufen erstellt das Fenster „Altersgerechten Plan für Ihre Familie erstellen“ lediglich ein Kinderprofil:

- Geben Sie den **vollständigen Namen des Kindes** (Pflichtfeld), einen Spitznamen (optional) und das Alter ein (standardmäßig 5).
- Öffnen Sie **Weitere Anpassungen**, um Informationen zur Altersstufe zu lesen, das Maskottchen zu ändern (standardmäßig Leo), sechs Startgewohnheiten in der Vorschau anzusehen oder das Hinzufügen von Startgewohnheiten auszuschalten (standardmäßig eingeschaltet). Eltern können diese Einstellungen später bearbeiten.

Sie müssen **bestätigen, dass Sie Elternteil oder gesetzliche Vertretung des Kindes sind**, und zustimmen, dass KidHabit das Profil, die Gewohnheiten und den Fortschritt des Kindes speichern darf. Die Einwilligung wird mit der Richtlinienversion erfasst ([9](09-bao-mat-va-rieng-tu.md#dong-thuan)). Öffentliche Ranglisten sind standardmäßig ausgeschaltet.

Hat die Familie keinen Tarif, beginnt nach Abschluss der Einrichtung **automatisch eine 7-tägige kostenlose Testphase** (die Schaltfläche lautet „7-tägige Testphase starten“). Jede Familie kann die Testphase nur einmal nutzen ([7](07-goi-va-thanh-toan.md#dung-thu)).

Sie können `/start` („7-tägige Testphase starten“) direkt auf der Website öffnen: Melden Sie sich mit Google an, richten Sie Ihre Familie ein und klicken Sie anschließend auf „Starten“.

<a id="thong-tin"></a>
## Kundeninformationen

Eltern müssen **ihren vollständigen Namen und ihre Telefonnummer erst beim Bezahlvorgang** eingeben, bevor die Bedingungen und Empfehlungsschritte angezeigt werden. Telefonnummern müssen 9 bis 15 Ziffern enthalten. Die Angaben werden für zukünftige Zahlungen auf dem Server gespeichert; bei vollständigen Profilen entfällt dieser Schritt. Die Anmeldung und das Erstellen eines Kinderprofils sind dadurch nicht blockiert. Der Erhalt von Informationen und Angeboten ist optional und standardmäßig ausgeschaltet. Eltern können ihre Angaben später unter `Family → Settings → Account` bearbeiten ([5](05-gia-dinh-va-cai-dat.md#tai-khoan)); bei Abmeldung werden Werbe-E-Mails sofort beendet ([7](07-goi-va-thanh-toan.md#email)). Falls das Laden oder Speichern fehlschlägt, tippen Sie auf **Erneut versuchen**.

<a id="vai-tro"></a>
## Familienrollen

| Rolle | Darf | Darf nicht |
|---|---|---|
| **Familieninhaber** (erstellt die Familie) | Alles, was Eltern tun können, Zahlungen veranlassen und Familiendaten löschen | Nichts |
| **Elternteil oder Erziehungsberechtigte/r** | Kinder, Aufgaben, Belohnungen, Bestätigungen und Geräte verwalten | Aktionen, die dem Inhaber vorbehalten sind (Familie löschen) |
| **Betreuungsperson** | Fortschritt in der „Ansicht für Betreuungspersonen“ ansehen | Profile, Aufgaben, Sterne oder den Plan bearbeiten |
| **Kind** (gekoppeltes Gerät) | Eigene Aufgaben erledigen, Belohnungen anfragen und Tagebuch führen | Zahlungen, Einstellungen oder Profile anderer Kinder ansehen |

Nur Eltern in der Familie können eine Testphase starten oder Zahlungen vornehmen. Für sensible Aktionen ist außerdem eine [PIN](05-gia-dinh-va-cai-dat.md#pin) erforderlich.

<a id="demo"></a>
## Demo

„Demo ansehen“ öffnet die App mit drei Beispielkindern (8, 4 und 1 Jahr alt) sowie Beispielaufgaben, Belohnungen und Gruppen. Die Demo-Daten werden im aktuellen Browser-Tab gespeichert und bleiben daher nach dem Neuladen der Seite erhalten. Wenn Sie eine echte Familie einrichten oder sich anmelden, werden die Demo-Daten gelöscht und **nicht** mit echten Daten vermischt. Die Demo sendet nichts an den Server und erfordert keine Zahlung.

<a id="ngon-ngu"></a>
## Sprache

Die App unterstützt neun Sprachen: Vietnamesisch, Englisch, Französisch, Deutsch, Italienisch, Spanisch, Chinesisch, Japanisch und Koreanisch. Die anfängliche Sprache wird in dieser Reihenfolge ausgewählt: Ihre gespeicherte Auswahl, Land (von Cloudflare), Browsersprache und dann Englisch. Ändern Sie die Sprache über die Sprachauswahl in der oberen Leiste. Ihre Auswahl wird gespeichert, damit Seite, Titel und Benutzeroberfläche dieselbe Sprache verwenden.

Auf schmalen Bildschirmen werden die Steuerelemente der oberen Leiste in das **Menü** (die Schaltfläche ⋮) verschoben. Es enthält die Gruppen **Konto** und **Schnelleinstellungen** (Sprache, helles oder dunkles Erscheinungsbild, Textgröße und Ton) sowie einen Link zum **Benutzerleitfaden**. Weniger häufig verwendete Elemente (Preise, Code zum Koppeln eines Kindes eingeben, Leitfaden zu den 16 Stärken, Familieneinrichtung, Startseite und Speicherstatus) befinden sich unter **Mehr**. Dieser Bereich bleibt geschlossen, bis Sie ihn öffnen.

Einige ausführliche Inhalte, darunter altersgerechte Entwicklungswege und die Heute-Ansicht, sind noch nicht in alle neun Sprachen übersetzt und werden auf Englisch angezeigt, wenn keine Übersetzung verfügbar ist.

<a id="tro-giup"></a>
## Hilfe in der App finden

Dieser Leitfaden ist auf zwei Arten in die App integriert:

- **Ein ? neben jedem Element.** Im Elternbereich erscheint neben dem Titel jeder Funktion ein kleines **?**, zum Beispiel neben Bestätigungen, Hinweisen, PINs, Kopplungscodes und Zahlungen. Bewegen Sie den Mauszeiger darauf, tippen Sie darauf oder wählen Sie es mit der Tabulatortaste aus, um eine kurze Erklärung von ein oder zwei Sätzen zu lesen. Klicken Sie auf **Details ansehen**, um den passenden Abschnitt des Leitfadens auf dem aktuellen Bildschirm zu öffnen, ohne Ihre Tätigkeit zu verlassen. In diesem Fenster können Sie auf einen Link zu einem anderen Abschnitt klicken oder auf **Zurück**, um zurückzukehren. Drücken Sie **Esc** oder tippen Sie außerhalb des Fensters, um die Erklärung zu schließen.
- **Eine eigene Leitfadenseite.** Über die Schaltfläche **Benutzerleitfaden** in der oberen Leiste (oder `Family → Settings → Open user guide`) gelangen Sie zu `/docs`: einer Kapitelliste, einem **Suchfeld** (Sie können mit oder ohne Akzente tippen), einer Gruppe **„Ich möchte …“** mit häufigen Aufgaben und einem Inhaltsverzeichnis für jedes Kapitel. Die Schaltfläche **Gesamten Leitfaden öffnen** im Detailfenster führt ebenfalls zur passenden Stelle auf dieser Seite.

Der vollständige Leitfaden ist auf Vietnamesisch und in übersetzten Fassungen verfügbar, derzeit auch auf Englisch. In Sprachen ohne Übersetzung erscheint die ?-Erklärung auf Englisch, während der ausführliche Abschnitt auf Vietnamesisch angezeigt wird; eine kurze Zusammenfassung finden Sie unter `/docs`.

<a id="lien-quan"></a>
## Weiterführendes

- Kinderprofil erstellen und Gerät koppeln: [5. Kinderprofile und Gerätekopplung](05-gia-dinh-va-cai-dat.md#ho-so).
- Was Kinder nach dem Öffnen sehen: [2. Kinderansicht](02-man-hinh-be.md).
- Testtarife und Preise: [7. Tarife und Zahlungen](07-goi-va-thanh-toan.md).
- Datenschutz für Kinderdaten: [9. Sicherheit und Datenschutz](09-bao-mat-va-rieng-tu.md).
- Die Startseite der Website: [11. Website und öffentliche Seiten](11-website-va-trang-cong-khai.md).
