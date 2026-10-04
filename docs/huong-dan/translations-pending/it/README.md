# Guida per l'utente di KidHabit Hero

Questa guida descrive **tutte le funzioni di KidHabit Hero** così come gli utenti le vedono e le usano, poi mostra come le funzioni **si collegano** tra loro. Ogni file inizia con «In questa guida» e termina con «Argomenti correlati», così può passare da una funzione a quelle collegate senza dover ricominciare la ricerca.

KidHabit Hero aiuta genitori e bambini a sviluppare buone abitudini attraverso piccole azioni quotidiane: i genitori assegnano attività, i bambini le contrassegnano come completate, i genitori le approvano e i bambini raccolgono stelle da riscattare per i premi scelti dai genitori. L'app non usa le stelle per confrontare i bambini o giudicare il loro carattere ([vedere i principi](06-khoa-hoc-thoi-quen.md#nguyen-tac)).

## Lettura per ruolo

| Lei è | Legga in quest'ordine |
|---|---|
| Un genitore che vuole iniziare | [1. Primi passi](01-bat-dau.md) → [2. Schermata del bambino](02-man-hinh-be.md) → [3. Oggi e approvazioni](03-hom-nay-va-duyet-viec.md) |
| Un genitore che vuole progettare le abitudini | [4. Progettare le abitudini](04-thiet-ke-thoi-quen.md) → [6. Scienza delle abitudini](06-khoa-hoc-thoi-quen.md) |
| Un genitore che gestisce la famiglia e i dispositivi | [5. Famiglia e impostazioni](05-gia-dinh-va-cai-dat.md) → [9. Sicurezza e privacy](09-bao-mat-va-rieng-tu.md) |
| Un genitore interessato ai piani e ai pagamenti | [7. Piani e pagamenti](07-goi-va-thanh-toan.md) → [8. Presenta un amico](08-gioi-thieu-ban-be.md) |
| Un operatore o addetto all'assistenza clienti | [10. Amministrazione e operazioni](10-quan-tri-va-van-hanh.md) |
| Un visitatore del sito o autore di contenuti | [11. Sito web e pagine pubbliche](11-website-va-trang-cong-khai.md) |
| Chi desidera una visione d'insieme | [12. Mappa dei collegamenti e scenari](12-ban-do-lien-ket.md) e [13. Glossario](13-thuat-ngu.md) |

## Indice

1. [Primi passi](01-bat-dau.md): modalità di accesso all'app, accesso, configurazione della famiglia, ruoli, lingua e demo.
2. [Schermata del bambino](02-man-hinh-be.md): attività, completamento, rinvio, timer, stelle, livelli, serie, distintivi, premi, classifiche, mascotte, lettere del mattino, diari e città dei sogni.
3. [Oggi e approvazioni](03-hom-nay-va-duyet-viec.md): attività in attesa di approvazione, premi in attesa di approvazione, progressi di ciascun bambino, riepilogo settimanale, statistiche, stampa e condivisione.
4. [Progettare le abitudini](04-thiet-ke-thoi-quen.md): gestione delle attività, raccolta, struttura delle 47 abitudini, programmi e segnali, percorsi per età e raccolta dei premi.
5. [Famiglia e impostazioni](05-gia-dinh-va-cai-dat.md): profili dei bambini, abbinamento dei dispositivi, persone che si prendono cura dei bambini, account, PIN, aspetto, privacy, promemoria, installazione dell'app, dati e pause.
6. [Scienza delle abitudini](06-khoa-hoc-thoi-quen.md): principi, quattro fasi, logica dei suggerimenti, 16 profili caratteriali e 7 modalità di dare.
7. [Piani e pagamenti](07-goi-va-thanh-toan.md): prove, piani, PayOS, attivazione, coupon, rimborsi ed e-mail.
8. [Presenta un amico](08-gioi-thieu-ban-be.md): codici invito, sconti del 10%, commissioni del 30% e prelievi.
9. [Sicurezza e privacy](09-bao-mat-va-rieng-tu.md): PIN, codici di abbinamento, consenso, dati dei bambini ed eliminazione dei dati.
10. [Amministrazione e operazioni](10-quan-tri-va-van-hanh.md): pagina di amministrazione, ruoli, assistenza clienti, attività in background e documentazione tecnica.
11. [Sito web e pagine pubbliche](11-website-va-trang-cong-khai.md): pagina di destinazione, blog, struttura, percorso, scienza e pagine legali.
12. [Mappa dei collegamenti e scenari](12-ban-do-lien-ket.md): diagrammi delle dipendenze, percorsi completi e risoluzione dei problemi.
13. [Glossario](13-thuat-ngu.md).

<!--op-->## Due ambienti e tre gruppi di utenti

KidHabit Hero offre due ambienti distinti, ciascuno con il proprio indirizzo:

| Ambiente | Indirizzo | Uso | Documentazione |
|---|---|---|---|
| **App** | `app.kidhabithero.com` | Accesso, gestione della famiglia, attività dei bambini, pagamenti e amministrazione | da 1 a 10 |
| **Sito di presentazione** | `kidhabithero.com` | Presentazione, prezzi, blog, struttura delle abitudini e condizioni | [11](11-website-va-trang-cong-khai.md) |

L'app ha tre gruppi di utenti e ciascun gruppo vede la propria area:

- **Genitori** (proprietari della famiglia, genitori, tutori): accedono con Google e vedono le aree Oggi, Progettazione e Famiglia.
- **Bambini**: accedono con un codice o un codice QR fornito da un genitore (non serve un account) e vedono solo la propria area.
- **Persone che si prendono cura dei bambini** (nonni o parenti): ricevono un invito dai genitori e possono solo vedere i progressi; non possono modificare nulla.<!--/op-->

## Catalogo delle funzioni

La colonna «Stato» indica se una funzione è attiva per tutti gli utenti (**Attiva**) o non è ancora disponibile (**Disattivata**).<!--op--> Lo stato deriva dalle variabili di configurazione della versione attuale; gli operatori possono modificarlo nel [rilascio](../deployment.md).<!--/op-->

| Funzione | Chi la usa | Dove | Requisito | Stato | Correlata |
|---|---|---|---|---|---|
| Accesso con Google | Genitori | Schermata di accesso | Nessuno | Attiva | [1](01-bat-dau.md#dang-nhap) |
| Accesso con un codice inviato via e-mail | Genitori | Schermata di accesso | Non disponibile<!--op--> (`emailCodeLogin` flag)<!--/op--> | **Disattivata** | [1](01-bat-dau.md#dang-nhap) |
| Demo (dati di esempio) | Tutti | Schermata di accesso | Nessuno | Attiva | [1](01-bat-dau.md#demo) |
| Creazione del primo profilo bambino | Genitori | Primo accesso | Consenso alla gestione dei dati | Attiva | [1](01-bat-dau.md#thiet-lap) |
| Nove lingue con rilevamento automatico | Tutti | Ovunque | Nessuno | Attiva | [1](01-bat-dau.md#ngon-ngu) |
| Accesso del bambino con codice famiglia o codice QR | Bambini | Schermata di accesso | Un genitore ha creato il profilo del bambino | Attiva | [5](05-gia-dinh-va-cai-dat.md#ghep-thiet-bi), [9](09-bao-mat-va-rieng-tu.md#ma-ghep) |
| Attività quotidiane in base all'ora del giorno | Bambini | Schermata del bambino | Attività assegnate | Attiva | [2](02-man-hinh-be.md#nhiem-vu) |
| Scorrimento per completare o rinviare | Bambini | Schermata del bambino | Nessuno | Attiva | [2](02-man-hinh-be.md#hoan-thanh) |
| Timer per attività di una certa durata | Bambini | Schermata del bambino | Attività con un numero di minuti | Attiva | [2](02-man-hinh-be.md#dem-gio) |
| Lettura ad alta voce delle attività | Bambini | Schermata del bambino | Dispositivo supportato | Attiva | [2](02-man-hinh-be.md#doc-to) |
| Stelle, livelli e serie | Bambini, genitori | Entrambi | Nessuno | Attiva | [2](02-man-hinh-be.md#sao-cap-chuoi) |
| Distintivi (5 di base e 16 profili caratteriali) | Bambini | Schermata del bambino | Attività completate | Attiva | [2](02-man-hinh-be.md#huy-hieu), [6](06-khoa-hoc-thoi-quen.md#chan-dung) |
| Riscatto dei premi e definizione degli obiettivi premio | Bambini, genitori | Entrambi | Raccolta premi del genitore | Attiva | [2](02-man-hinh-be.md#qua), [4](04-thiet-ke-thoi-quen.md#kho-qua) |
| Classifiche familiari e di gruppo | Bambini | Schermata del bambino | Nessuno | Attiva | [2](02-man-hinh-be.md#bang-xep-hang) |
| Classifica pubblica | Bambini | Schermata del bambino | Un genitore la attiva e seleziona il bambino | Attiva (disattivata per impostazione predefinita per ogni famiglia) | [5](05-gia-dinh-va-cai-dat.md#rieng-tu), [9](09-bao-mat-va-rieng-tu.md#bxh-cong-khai) |
| Mascotte e colori | Bambini | Schermata del bambino | Modifica della mascotte una volta ogni 7 giorni | Attiva | [2](02-man-hinh-be.md#linh-vat) |
| Lettera del mattino della mascotte | Bambini | Schermata del bambino | Dalle 07:00 | **Attiva** | [2](02-man-hinh-be.md#thu-buoi-sang) |
| Diario di una frase | Bambini, genitori | Entrambi | Nessuno | **Attiva** | [2](02-man-hinh-be.md#nhat-ky), [3](03-hom-nay-va-duyet-viec.md#thong-ke) |
| Città dei sogni | Bambini | Schermata del bambino | Costruzione con le stelle | **Attiva** | [2](02-man-hinh-be.md#thanh-pho) |
| Aspetto in base all'età | Bambini, genitori | Entrambi | I genitori possono fissarlo | **Attiva** | [2](02-man-hinh-be.md#giao-dien-tuoi), [5](05-gia-dinh-va-cai-dat.md#ho-so) |
| Approvazione di attività e premi | Genitori | Oggi | PIN, se impostato | Attiva | [3](03-hom-nay-va-duyet-viec.md#duyet) |
| Aggiunta o sottrazione manuale di stelle | Genitori | Profili dei bambini | PIN, se impostato | Attiva | [3](03-hom-nay-va-duyet-viec.md#chinh-sao) |
| Vista Oggi del bambino (numero di attività, serie, 7 giorni), progressi e riepilogo settimanale | Genitori | Oggi | Per progressi e riepilogo settimanale è necessario attivare il programma di abitudini | **Attiva** | [3](03-hom-nay-va-duyet-viec.md#hom-nay) |
| Registrazione del modo in cui il bambino ha svolto l'attività (da solo, con un suggerimento, insieme) | Genitori, bambini dai 15 anni in su | Oggi, schermata del bambino | Programma di abitudini attivo | **Attiva** | [3](03-hom-nay-va-duyet-viec.md#muc-ho-tro), [6](06-khoa-hoc-thoi-quen.md#bon-pha) |
| Statistiche di 7 giorni, stampa settimanale e condivisione dei traguardi | Genitori | Oggi → Statistiche | Nessuno | Attiva | [3](03-hom-nay-va-duyet-viec.md#thong-ke) |
| Gestione delle attività e creazione di attività personalizzate | Genitori | Progettazione → Gestione attività | Un piano | Attiva | [4](04-thiet-ke-thoi-quen.md#quan-ly-viec) |
| Struttura di 47 abitudini per età da 0 a 18 anni | Genitori | Gestione attività → Raccolta | Un piano | Attiva | [4](04-thiet-ke-thoi-quen.md#khung-47), [6](06-khoa-hoc-thoi-quen.md#khung) |
| Programma e segnali «se… allora…» | Genitori | Gestione attività | Programma di abitudini attivo | **Attiva** | [4](04-thiet-ke-thoi-quen.md#chuong-trinh), [6](06-khoa-hoc-thoi-quen.md#logic) |
| Percorso per età (5 fasi) | Genitori | Progettazione → Percorsi | Un piano | Attiva | [4](04-thiet-ke-thoi-quen.md#lo-trinh) |
| Guida a 16 profili caratteriali e 7 modalità di dare | Genitori | Barra superiore | Nessuno | Attiva | [6](06-khoa-hoc-thoi-quen.md#chan-dung) |
| Raccolta premi e suggerimenti di premi | Genitori | Progettazione → Premi | Un piano | Attiva | [4](04-thiet-ke-thoi-quen.md#kho-qua) |
| Profili dei bambini e pacchetti di piani per età | Genitori | Famiglia → Profili dei bambini | Il numero di bambini dipende dal piano | Attiva | [5](05-gia-dinh-va-cai-dat.md#ho-so) |
| Abbinamento e revoca dei dispositivi | Genitori | Profili dei bambini, Impostazioni | PIN, se impostato | Attiva | [5](05-gia-dinh-va-cai-dat.md#ghep-thiet-bi) |
| Invito a una persona che si prende cura del bambino (sola visualizzazione) | Genitori | Impostazioni | Link valido 72 ore | Attiva | [5](05-gia-dinh-va-cai-dat.md#nguoi-cham-soc) |
| PIN genitore | Genitori | Impostazioni | Nessuno | Attiva | [5](05-gia-dinh-va-cai-dat.md#pin), [9](09-bao-mat-va-rieng-tu.md#pin) |
| Pausa per tutta la famiglia | Genitori | Impostazioni | Nessuno | Attiva | [5](05-gia-dinh-va-cai-dat.md#tam-nghi) |
| Promemoria per i genitori | Genitori | Impostazioni | Consenso del genitore | **Attiva** | [5](05-gia-dinh-va-cai-dat.md#nhac-viec) |
| Installazione dell'app (PWA) | Tutti | Impostazioni, browser | Nessuno | Attiva | [5](05-gia-dinh-va-cai-dat.md#pwa) |
| Download e ripristino dei dati della famiglia | Genitori | Impostazioni | Nessuno | Attiva | [5](05-gia-dinh-va-cai-dat.md#du-lieu) |
| Eliminazione permanente dei dati della famiglia | Proprietario della famiglia | Statistiche | Inserire `DELETE FAMILY` | Attiva | [9](09-bao-mat-va-rieng-tu.md#xoa-du-lieu) |
| Prova di 7 giorni | Genitori | `/start`, prezzi, configurazione | Una volta per famiglia | Attiva | [7](07-goi-va-thanh-toan.md#dung-thu) |
| Pagamento VietQR tramite PayOS | Genitori | Prezzi, `/checkout` | Accesso | Attiva | [7](07-goi-va-thanh-toan.md#thanh-toan) |
| Codice regalo (coupon) | Genitori | Famiglia → Account | Codice valido | Attiva | [7](07-goi-va-thanh-toan.md#coupon) |
| Invita un amico, sconto del 10%, commissione del 30% | Genitori | Impostazioni, link `?ref=` | PIN richiesto per prelevare | Attiva | [8](08-gioi-thieu-ban-be.md) |
| E-mail relative al ciclo di vita | Genitori | Posta in arrivo | Configurazione e-mail | In base alla configurazione | [7](07-goi-va-thanh-toan.md#email) |
| Pagina di amministrazione (6 sezioni) | Amministratori | `/admin` | Ruolo e verifica in due passaggi | Attiva | [10](10-quan-tri-va-van-hanh.md#admin) |

## Convenzioni di questa guida

- I [percorsi nell'app] usano la forma `Area → Elemento`, per esempio `Family → Settings`.
- «Un piano» significa che la famiglia è nel periodo di prova o ha un piano non scaduto ([7](07-goi-va-thanh-toan.md)).
- «PIN, se impostato» significa che l'azione viene eseguita solo dopo aver inserito in questo browser il PIN genitore corretto e valido ([5](05-gia-dinh-va-cai-dat.md#pin)).
- Prezzi, soglie e limiti di tempo sono quelli in vigore al momento della redazione; la fonte autorevole è la documentazione tecnica collegata alla fine di ciascun file.

<!--op-->## Mantenere aggiornata la guida

- Quando aggiunge o modifica una funzione, aggiorni il **catalogo delle funzioni qui sopra** e il file che la descrive; aggiunga link alle funzioni correlate alla fine del file («Argomenti correlati»).
- Ogni sezione ha un'ancora `<a id="…"></a>` da usare nei link; non rinomini le ancore già in uso. Il test `tests/unit/user-guide-links.test.ts` segnala errori se un link interno o un'ancora non funziona.
- Prezzi, soglie e flag di rilascio provengono dal codice sorgente; in caso di discrepanza prevale il codice, quindi aggiorni la guida di conseguenza.
- Ultimo aggiornamento: 10/03/2026.
- Anche i capitoli da 1 a 9, il 12 e il 13 sono disponibili nell'app (`/docs` e il ? nell'area genitori). Dopo aver modificato un file Markdown, esegua `npm run guide:build` per ricostruire `public/guide`; il test `tests/unit/guide-build.test.ts` segnala se si dimentica. I contenuti riservati agli operatori vanno racchiusi tra la coppia di commenti HTML `<!-- op -->` e `<!-- /op -->` (qui sono scritti senza spazi; gli spazi vengono aggiunti nell'esempio perché non abbia effetto) e non appaiono nell'app.
- **Traduzioni:** inserisca la traduzione di ogni capitolo (con lo stesso nome file, mantenendo ogni riga `<a id="…"></a>`, ogni destinazione dei link e lo stesso numero di righe, colonne e voci nelle tabelle) in `docs/huong-dan/i18n/<language code>/`, aggiunga il codice a `GUIDE_TRANSLATIONS` in `src/lib/guide/guide-locale.ts`, poi esegua `npm run guide:build`. Il test `tests/unit/guide-translations.test.ts` confronta la struttura di ciascuna traduzione con quella della versione vietnamita. Quando modifica un capitolo vietnamita, aggiorni anche le traduzioni corrispondenti.
- Per aggiungere un ? a una nuova funzione: aggiunga il relativo codice a `src/lib/guide/help-topic-id.ts`, scriva in vietnamita e in inglese una spiegazione in `src/lib/guide/help-topics.ts` che rimandi a una sezione esistente della guida, poi inserisca `<HelpTip topic="…" />` accanto al titolo nella schermata.

## Documentazione tecnica correlata

[Architettura](../architecture.md) · [Sicurezza e privacy](../security-privacy.md) · [Scienza delle abitudini e logica adattiva](../habit-science-and-adaptive-logic.md) · [Contratto dei dati della struttura delle abitudini](../habit-framework-data-contract.md) · [Programma di inviti](../affiliate-program.md) · [Analisi del prodotto](../product-analytics.md) · [Rilascio](../deployment.md) · [Ripristino dei dati](../data-recovery.md) · [Registro delle affermazioni](../claims-ledger.md) · [Guida alla pubblicazione del blog](../blog-guide.md) · [E-mail del ciclo di vita e rimborsi](../runbooks/lifecycle-and-refunds.md)<!--/op-->
