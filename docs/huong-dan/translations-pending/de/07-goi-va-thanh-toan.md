# 7. Tarife und Zahlungen

[← 6. Die Wissenschaft der Gewohnheiten](06-khoa-hoc-thoi-quen.md) · [Inhaltsverzeichnis](README.md) · [Weiter: 8. Empfehlungen →](08-gioi-thieu-ban-be.md)

<!--op-->## In diesem Leitfaden

[7-tägige kostenlose Testphase](#dung-thu) · [Tarife](#cac-goi) · [Wo Sie kaufen können](#noi-mua) · [Zahlungsschritte](#thanh-toan) · [Aktivierung und Abgleich](#kich-hoat) · [Laufzeitverlängerungen](#cong-don) · [Geschenkcodes (Gutscheine)](#coupon) · [Rabatt für geworbene Familien](#giam-gia) · [Rückerstattung und Kündigung](#hoan-tien) · [E-Mails an Sie](#email) · [Wenn ein Tarif abläuft](#het-han) · [Weiterführendes](#lien-quan)<!--/op-->

<a id="dung-thu"></a>
## 7-tägige kostenlose Testphase

- **Kostenlos: 0 VND**, keine Kreditkarte erforderlich und **keine automatische Abbuchung** am Ende.
- Schaltet alle Funktionen des Familientarifs frei, **ohne Begrenzung der Kinderanzahl**.
- **Nur einmal pro Familie.** Wurde die Testphase bereits genutzt, lautet die Schaltfläche: „Diese Familie hat die Testphase bereits genutzt. Wählen Sie einen Tarif, um fortzufahren.“
- So starten Sie: (a) automatisch im letzten Schritt der [Familieneinrichtung](01-bat-dau.md#thiet-lap), wenn Sie keinen Tarif haben; (b) unter `/start` („7-tägige Testphase starten“): mit Google anmelden, Familie einrichten und auf „Starten“ tippen; (c) über das Testphasenfeld im Preisfenster. Nur ein Elternteil der Familie kann sie starten.
- Das Testphasenfeld wird **nicht erneut angezeigt**, nachdem die Familie bezahlt hat.
- Wenn das Ende der Testphase näher rückt, sendet das System eine Erinnerungs-E-Mail ([E-Mail](#email)).

<a id="cac-goi"></a>
## Tarife

| Tarif | Preis | Kinder | Geeignet für |
|---|---|---|---|
| **7-tägige kostenlose Testphase** | 0 VND | Unbegrenzt | Alles ausprobieren, bevor Sie sich entscheiden |
| **Tarif für ein Kind** | 29,000 VND / Monat | 1 Kind | Familien, die mit einem Kind beginnen |
| **Familientarif · Monatlich** | 49,000 VND / Monat | Unbegrenzt | Mehrere Kinder oder voller Zugriff auf alle Funktionen |
| **Familientarif · Jährlich** | 399,000 VND / Jahr (regulärer Preis 588,000 VND, 189,000 VND Ersparnis, 32 %) | Unbegrenzt | Lang genug dabeibleiben, damit aus kleinen Schritten Gewohnheiten werden können |
| **Lifetime** | Wird nicht verkauft | Unbegrenzt | Wird nur manuell von einer Administration gewährt<!--op--> ([10](10-quan-tri-va-van-hanh.md#khach-hang))<!--/op--> |

Alle Zahlungen sind **einmalig**; es gibt keine automatische Verlängerung. Auf der Preisseite werden außerdem zusätzliche Vorteile des Familientarifs (wöchentliche Fortschrittsberichte, Familienwettbewerbe und schnellere technische Unterstützung) und des Jahrestarifs (bevorzugte Unterstützung und E-Book zur Erziehung) aufgeführt. Das E-Book ist **noch nicht verfügbar**.

**Die Namen variieren je nach Ort:** Auf der Marketingwebsite heißt der *Tarif für ein Kind* „Basic Plan“; die beiden Familientarife heißen „Premium Plan“ (monatlich und jährlich). Es handelt sich um dieselben Produkte zu denselben Preisen.

**Die Kinderanzahl je Tarif** wird von der Datenbank geprüft: Der Tarif für ein Kind erlaubt bis zu 1 Kind; Test-, Familien- und Lifetime-Tarife sind unbegrenzt. Ohne aktiven Tarif können Sie kein neues Kinderprofil hinzufügen.

<a id="noi-mua"></a>
## Wo Sie kaufen können

| Einstiegspunkt | Beschreibung |
|---|---|
| Schaltfläche **Pro freischalten** in der oberen Leiste | Öffnet das Fenster „KidHabit Hero Pro Preise“, in dem Sie einen Tarif auswählen können |
| Preisfenster, wenn ein Tarif erforderlich ist | Zum Beispiel nach Ablauf eines Tarifs |
| Seite `/pricing` und Schaltfläche zur Tarifauswahl auf der [Website](11-website-va-trang-cong-khai.md#trang-chinh) | Führt zu `/checkout?plan=…` in der App |
| Seite `/checkout` | Lädt den ausgewählten Tarif: anmelden, bei Bedarf Familie einrichten und anschließend bezahlen |

Ein ungültiger Tariflink (veraltet oder mit fehlenden Angaben) zeigt „Ungültiger Zahlungstarif“ mit einer Schaltfläche zum Aufrufen der Preise. Nutzungsrechte gehören zur **Familie**, nicht zu einer E-Mail-Adresse.

<a id="thanh-toan"></a>
## Zahlungsschritte

Zahlungen werden über **PayOS (VietQR)** abgewickelt:

1. Tarif auswählen → bei Bedarf mit Google anmelden → „Weiter zur Zahlung“. Geben Sie Ihren vollständigen Namen und Ihre Telefonnummer ein, falls Ihr Profil unvollständig ist; die Angaben werden für künftige Zahlungen gespeichert. Angebote sind optional und standardmäßig ausgeschaltet. Bestätigen Sie bei Aufforderung die Bedingungen und geben Sie anschließend nur dann einen Empfehlungscode ein, wenn Ihre Familie berechtigt ist. Während der Code übermittelt wird, ist das Erstellen der Bestellung deaktiviert. Codes können nur vor Erstellung des QR-Codes eingegeben werden, da der Server den Betrag beim Erstellen der Bestellung berechnet. Das Anwenden eines Codes ersetzt keine bestehende Bestellung.
2. Der Zahlungsbildschirm zeigt einen **VietQR-Code** und Überweisungsdaten: Empfängername, Bank, Kontonummer, **genauer Betrag** und **erforderlicher Verwendungszweck**. Für jedes Element gibt es eine Kopierschaltfläche, außerdem eine Schaltfläche **QR-Code herunterladen** (damit Sie in Ihrer Banking-App ein Bild aus der Galerie zum Scannen auswählen können) und einen Link zur sicheren PayOS-Zahlungsseite. Wenn das Kopieren fehlschlägt, halten Sie den Text gedrückt, markieren Sie ihn und kopieren Sie ihn manuell. Es gibt keinen Countdown, da der Server keine Zahlungsfrist von 15 Minuten erzwingt.
3. Scannen Sie mit Ihrer Banking-App oder MoMo. **Behalten Sie den genauen Betrag und Verwendungszweck bei.**
4. Tippen Sie bei Bedarf auf **„Ich habe überwiesen“**; die App prüft den Status automatisch. Statusfehler werden in der von Ihnen ausgewählten Sprache angezeigt, und automatische Prüfungen werden fortgesetzt. Nach Abschluss erscheint „🎉 Upgrade erfolgreich!“ und der Tarif wird sofort freigeschaltet.

Wenn die Zahlung noch aussteht, **zahlen Sie nicht sofort erneut**. Der Preis wird vom Server festgelegt und kann im Browser nicht geändert werden. Nur ein Elternteil der Familie kann bezahlen; zum Erstellen einer Zahlung ist die [PIN](05-gia-dinh-va-cai-dat.md#pin) erforderlich, falls eingerichtet. Wenn Sie von der PayOS-Seite zur App zurückkehren, wird das Zahlungsergebnis angezeigt.

<a id="kich-hoat"></a>
## Aktivierung und Abgleich

Der Tarif wird aktiviert, wenn das System die Zahlung über eine von drei unabhängigen Möglichkeiten **bestätigt**. Welche zuerst eintrifft, gilt; die Zahlung wird nie doppelt gezählt:

1. PayOS-**Webhook** ruft `/api/payment/webhook` auf (mit Prüfung von Signatur, Betrag, Verwendungszweck und Bestellinhaber).
2. **PayOS-Abfrage**: Während ein Elternteil auf dem Zahlungsbildschirm ist, fragt die App PayOS direkt zur Bestellung ab. Das hängt nicht vom Webhook ab.
3. **Abgleich im Hintergrund**: Alle 10 Minuten prüft eine Hintergrundaufgabe ausstehende Bestellungen und fragt PayOS ab.

Wenn Sie überwiesen haben, aber der Tarif nicht angezeigt wird: Warten Sie einige Minuten, öffnen Sie `/checkout` erneut und kontaktieren Sie anschließend den Support mit dem Bestellcode. <!--op-->Das Betriebsteam kann die Bestellung unter [Admin → Zahlungen](10-quan-tri-va-van-hanh.md#thanh-toan-admin) ansehen.<!--/op-->

<a id="cong-don"></a>
## Laufzeitverlängerungen

Wenn Sie kaufen, während Ihr aktueller Tarif noch aktiv ist, wird die Laufzeit **an das Ende des aktuellen Zeitraums angehängt**, einschließlich verbleibender Testphase: Der Monatstarif verlängert um 1 Monat, der Jahrestarif um 1 Jahr. Wenn Sie einen niedrigeren Tarif kaufen als den, den Sie bereits haben, **bleibt der höhere Tarif bestehen**. Ein Lifetime-Tarif wird nicht durch einen anderen Tarif ersetzt.

<a id="coupon"></a>
## Geschenkcodes (Gutscheine)

Geschenkcodes werden vom Betriebsteam erstellt. Geben Sie einen unter `Settings → Account → Coupon code → Apply code` ein.

- Ein Geschenkcode fügt **zusätzliche Zugangstage** hinzu; Codes, die nur einen Rabatt gewähren, können hier nicht verwendet werden. Hat die Familie noch keinen bezahlten Tarif, wechselt sie für die entsprechende Anzahl von Tagen zum Familientarif · Monatlich. Hat sie bereits einen Tarif, werden die Tage an das Ende des aktuellen Zeitraums angehängt; der Tarif bleibt unverändert. Für Lifetime-Tarife sind Gutscheincodes nicht verfügbar.
- Jeder Code kann **einmal pro Familie** verwendet werden; eine Familie kann verschiedene Codes einlösen. Bei einem abgelaufenen, vollständig verwendeten oder deaktivierten Code erscheint: „Code nicht gefunden, bereits verwendet oder abgelaufen.“
- Nach **mehr als 10 fehlgeschlagenen Versuchen innerhalb von 15 Minuten** wird der Zugriff einige Minuten lang vorübergehend gesperrt.

<a id="giam-gia"></a>
## Rabatt für geworbene Familien

Eine Familie, die einen Empfehlungscode über einen `?ref=`-Link oder manuell eingibt, erhält **10 % Rabatt auf den ersten Jahrestarif** (399,000 VND werden zu 359,100 VND), sofern für die Familie noch keine bezahlte Bestellung vorliegt. Auf dem Zahlungsbildschirm steht „10 % Rabatt dank Empfehlungscode“. Details: [8. Empfehlungen](08-gioi-thieu-ban-be.md#giam-10).

<a id="hoan-tien"></a>
## Rückerstattung und Kündigung

- **30-Tage-Rückerstattung**: Wenn Sie nicht zufrieden sind, senden Sie den Bestellcode und den Zahlungszeitpunkt innerhalb von 30 Tagen nach der Zahlung an die Support-E-Mail-Adresse. Rückerstattungen werden manuell bearbeitet. Nach Bestätigung der Rückerstattung wird die Provision für diese Bestellung, sofern sie noch aussteht, zurückgefordert ([8](08-gioi-thieu-ban-be.md#hoan-tien-hoa-hong)).
- Ein **ausstehender Zahlungslink** kann vom Supportteam storniert werden; die Bestellung erhält erst den Status „storniert“, nachdem PayOS dies bestätigt hat.
- **Tarifkündigungen** werden vom Supportteam bearbeitet und per E-Mail bestätigt. Es werden keine automatischen Abbuchungen eingerichtet.

<!--op-->Interner Ablauf: [E-Mail-Betrieb und Rückerstattungen](../runbooks/lifecycle-and-refunds.md) und [10. Admin](10-quan-tri-va-van-hanh.md#phieu-ho-tro).<!--/op-->

<a id="email"></a>
## E-Mails an Sie

Es gibt zwei Gruppen von E-Mails:

- **Anmelde-E-Mails** (von Supabase): Anmeldebestätigung, Anmeldelinks, Kontowiederherstellung, Einladungen, E-Mail-Änderungen und erneute Authentifizierung. Die E-Mail-Oberfläche ist vorgefertigt ([Vorlagen](../../supabase/email-templates/README.md)).
- **E-Mails im Kundenlebenszyklus** (können aktiviert oder deaktiviert werden): Begrüßung und Einrichtungshinweise (`welcome_setup`), Erinnerungen vor Ende der Testphase (`trial_ending`), Zahlungsbelege (`payment_receipt`), Aktualisierungen von Supportanfragen (`support_status`), Rückerstattungen (`refund_status`) und Bestätigungen von Tarifkündigungen (`subscription_cancelled`).

E-Mails im Kundenlebenszyklus **enthalten keine Kinderdaten**. Werbe-E-Mails werden nur gesendet, wenn Sie dem Erhalt von Angeboten zugestimmt haben; das Ausschalten der Einwilligung beendet sie sofort. Nachrichten werden nicht mehr an Adressen gesendet, bei denen die Zustellung fehlgeschlagen ist, eine Beschwerde vorliegt oder die abgemeldet wurden.

<a id="het-han"></a>
## Wenn ein Tarif abläuft

Wenn Testphase oder Tarif ohne Verlängerung ablaufen, gilt die Familie nicht mehr als tarifberechtigt: Sie können kein neues Kinderprofil hinzufügen und die App schlägt die Auswahl eines Tarifs vor. **Daten werden nicht gelöscht**. Kaufen Sie einen Tarif oder lösen Sie einen Geschenkcode ein, um fortzufahren.

<a id="lien-quan"></a>
## Weiterführendes

- 10 % Rabatt und Provisionen: [8. Empfehlungen](08-gioi-thieu-ban-be.md).
- Testphase während der Einrichtung starten: [1. Erste Schritte](01-bat-dau.md#thiet-lap).
- Kindergrenzen und Profile hinzufügen: [5. Kinderprofile](05-gia-dinh-va-cai-dat.md#ho-so).
- Bearbeitung von Bestellungen, Rückerstattungen und Tarifänderungen durch das Betriebsteam: [10. Verwaltung und Betrieb](10-quan-tri-va-van-hanh.md).
- PayOS-, Webhook- und Abgleichkonfiguration: [Bereitstellung](../deployment.md).
