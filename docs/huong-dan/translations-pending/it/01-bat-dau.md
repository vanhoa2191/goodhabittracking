# 1. Per iniziare

[← Indice](README.md) · [Avanti: 2. Schermata del bambino →](02-man-hinh-be.md)

<!--op-->## In questa guida

[Tre modi per accedere all'app](#cach-vao) · [Accedere](#dang-nhap) · [Configurare la famiglia](#thiet-lap) · [Informazioni cliente](#thong-tin) · [Ruoli](#vai-tro) · [Demo](#demo) · [Lingua](#ngon-ngu) · [Trovare assistenza nell'app](#tro-giup) · [Sezioni correlate](#lien-quan)<!--/op-->

<a id="cach-vao"></a>
## Tre modi per accedere all'app

Quando apre `app.kidhabithero.com` per la prima volta, la schermata “Come desidera accedere a KidHabit?” offre tre opzioni: due pulsanti visibili e un riquadro espandibile per i bambini. Le aree per genitori e bambini sono separate: i bambini non vedono mai pagamenti o impostazioni della famiglia.

| Opzione di accesso | Per chi | Cosa succede |
|---|---|---|
| **Continua come genitore** (accedi con Google) | Genitori e tutori | Apre il pannello della famiglia ([3](03-hom-nay-va-duyet-viec.md)). La prima volta, dovrà completare la [configurazione della famiglia](#thiet-lap). |
| **È il dispositivo di un bambino?** (lo apra, poi scelga “Inserisci il codice o scansiona il QR”) | Bambini | Il dispositivo viene associato a un solo bambino e apre direttamente la [schermata del bambino](02-man-hinh-be.md). Il bambino non ha bisogno di un account. |
| **Esplora la demo** (visibile sotto il pulsante per genitori) | Tutti | Usa dati di esempio e non richiede un account ([demo](#demo)). |

I genitori che hanno già effettuato l'accesso passano direttamente al pannello. Per visualizzare di nuovo la pagina iniziale, scelga “Home” o “Visualizza la pagina iniziale”. Dopo l'associazione del dispositivo di un bambino, questo apre sempre direttamente l'interfaccia del bambino e non mostra il pannello genitori né la pagina dei prezzi.

<a id="dang-nhap"></a>
## Accedere

- **Google** è il metodo principale di accesso per i genitori.
- **Un codice monouso inviato via email** è la seconda opzione ed è al momento **disattivata** finché non viene abilitata<!--op--> (il flag `emailCodeLogin`, [come abilitarla](../deployment.md))<!--/op-->. Quando è abilitata, nella schermata di accesso compare il riquadro espandibile “Altri modi per accedere”; aprendolo si trova il campo “Oppure ricevi un codice di accesso via email”. Se il flag è disattivato, il riquadro non esiste. I genitori inseriscono il proprio indirizzo email, ricevono un breve codice numerico e lo immettono per accedere. Possono richiedere un altro codice dopo alcuni secondi; troppe richieste comportano un'attesa di alcuni minuti.
- Se l'accesso non riesce, l'app mostra un breve messaggio e un pulsante per riprovare. Non viene salvato nulla.

I genitori che accedono tramite un link di segnalazione (`?ref=`) vengono registrati automaticamente come segnalati ([8](08-gioi-thieu-ban-be.md#ghi-nhan)). Le persone invitate come assistenti accedono con Google e poi accettano l'invito ([5](05-gia-dinh-va-cai-dat.md#nguoi-cham-soc)).

<a id="thiet-lap"></a>
## Creare il primo profilo bambino

Al primo accesso, la finestra “Crea il piano per la tua famiglia in base all'età” serve solo a creare un profilo bambino:

- Inserisca il **nome completo del bambino** (obbligatorio), il soprannome (facoltativo) e l'età (5 anni per impostazione predefinita).
- Apra **Altre personalizzazioni** per leggere informazioni sulla fascia d'età, cambiare la mascotte (Leo per impostazione predefinita), visualizzare in anteprima sei abitudini iniziali o disattivarne l'aggiunta (attivata per impostazione predefinita). Potrà modificarle in seguito.

Deve **confermare di essere il genitore o tutore legale del bambino** e acconsentire alla conservazione da parte di KidHabit del profilo, delle abitudini e dei progressi del bambino. Il consenso viene registrato con la versione dell'informativa ([9](09-bao-mat-va-rieng-tu.md#dong-thuan)). Le classifiche pubbliche sono disattivate per impostazione predefinita.

Se la famiglia non ha un piano, completando la configurazione si **avvia automaticamente una prova gratuita di 7 giorni** (il pulsante riporta “Inizia la prova di 7 giorni”). Ogni famiglia può usare la prova una sola volta ([7](07-goi-va-thanh-toan.md#dung-thu)).

Può aprire direttamente `/start` (“Inizia la tua prova di 7 giorni”) dal sito: acceda con Google, configuri la famiglia e poi selezioni il pulsante di avvio.

<a id="thong-tin"></a>
## Informazioni cliente

I genitori devono inserire **nome completo e numero di telefono al momento del pagamento**, prima dei termini e dei passaggi di segnalazione. Il numero di telefono deve contenere da 9 a 15 cifre. I dati vengono salvati sul server per i pagamenti futuri; i profili completi saltano questo passaggio. Questo requisito non impedisce di accedere o creare un profilo bambino. Ricevere indicazioni e offerte è facoltativo ed è disattivato per impostazione predefinita. Può modificare i dati in seguito in `Family → Settings → Account` ([5](05-gia-dinh-va-cai-dat.md#tai-khoan)); rinunciando, le email promozionali cessano immediatamente ([7](07-goi-va-thanh-toan.md#email)). Se il caricamento o il salvataggio non riesce, tocchi **Riprova**.

<a id="vai-tro"></a>
## Ruoli della famiglia

| Ruolo | Può fare | Non può fare |
|---|---|---|
| **Proprietario della famiglia** (creatore) | Tutto ciò che possono fare i genitori, pagamenti ed eliminazione dei dati della famiglia | Nulla |
| **Genitore o tutore** | Gestire bambini, attività, premi, approvazioni e dispositivi | Operazioni riservate al proprietario (eliminare la famiglia) |
| **Assistente** | Visualizzare i progressi nella “Vista assistente” | Modificare profili, attività, stelle o piano |
| **Bambino** (dispositivo associato) | Completare le proprie attività, richiedere premi e tenere un diario | Vedere pagamenti, impostazioni o profili di altri bambini |

Solo i genitori della famiglia possono avviare una prova o effettuare pagamenti. Anche le operazioni sensibili richiedono un [PIN](05-gia-dinh-va-cai-dat.md#pin).

<a id="demo"></a>
## Demo

“Esplora la demo” apre l'app con tre bambini di esempio (di 8, 4 e 1 anno), oltre ad attività, premi e gruppi di esempio. I dati demo vengono conservati nella scheda corrente del browser, quindi restano disponibili dopo aver ricaricato la pagina. Quando configura una famiglia reale o accede, i dati demo vengono eliminati e **non** si mescolano con quelli reali. La demo non invia dati al server e non richiede pagamenti.

<a id="ngon-ngu"></a>
## Lingua

L'app supporta nove lingue: vietnamita, inglese, francese, tedesco, italiano, spagnolo, cinese, giapponese e coreano. La lingua iniziale viene selezionata in quest'ordine: scelta salvata, paese (da Cloudflare), lingua del browser e poi inglese. La cambi con il selettore della lingua nella barra superiore. La scelta viene salvata, così pagina, titoli e interfaccia restano nella stessa lingua.

Sugli schermi stretti, i controlli della barra superiore si spostano nel **Menu** (il pulsante ⋮). Contiene il gruppo **Account**, il gruppo **Impostazioni rapide** (lingua, tema chiaro o scuro, dimensione del testo e suoni) e il link **Guida utente**. Le voci meno frequenti (prezzi, inserimento del codice di associazione del bambino, guida ai 16 profili, configurazione della famiglia, Home e stato di archiviazione) si trovano in **Altro**, che resta chiuso finché non lo apre.

Alcuni contenuti dettagliati, tra cui i percorsi per età e la schermata Oggi, non sono ancora tradotti in tutte e nove le lingue e saranno mostrati in inglese quando la traduzione non è disponibile.

<a id="tro-giup"></a>
## Trovare assistenza nell'app

Questa guida è integrata nell'app in due forme:

- **Un ? accanto a ogni elemento.** Nell'area genitori, accanto al titolo di ogni funzione compare un piccolo **?**, ad esempio per approvazioni, promemoria, PIN, codici di associazione e pagamenti. Passandoci sopra, toccandolo o raggiungendolo con il tasto Tab si legge una breve spiegazione di una o due frasi. Selezioni **Vedi i dettagli** per aprire la parte pertinente della guida nella schermata corrente, senza interrompere ciò che sta facendo. Nella finestra può selezionare un link a un'altra sezione per continuare la lettura oppure **Indietro** per tornare. Prema **Esc** o tocchi fuori dalla finestra per chiudere la spiegazione.
- **Una pagina dedicata alla guida.** Il pulsante **Guida utente** nella barra superiore (o `Family → Settings → Open user guide`) apre `/docs`: un elenco di capitoli, una casella di **ricerca** (può scrivere con o senza accenti), un gruppo di scorciatoie **“Voglio…”** per le attività comuni e l'indice di ogni capitolo. Il pulsante **Apri la guida completa** nella finestra dei dettagli porta anche alla sezione corrispondente di questa pagina.

La guida completa è disponibile in vietnamita e in alcune versioni tradotte, tra cui l'inglese. Nelle lingue senza traduzione, la spiegazione del ? appare in inglese mentre la sezione dettagliata è in vietnamita, con un breve riepilogo su `/docs`.

<a id="lien-quan"></a>
## Sezioni correlate

- Creare un profilo bambino e associare il suo dispositivo: [5. Profili bambino e associazione dei dispositivi](05-gia-dinh-va-cai-dat.md#ho-so).
- Cosa fanno i bambini dopo l'accesso: [2. Schermata del bambino](02-man-hinh-be.md).
- Prove, piani e prezzi: [7. Piani e pagamenti](07-goi-va-thanh-toan.md).
- Privacy dei dati dei bambini: [9. Sicurezza e privacy](09-bao-mat-va-rieng-tu.md).
- La pagina iniziale del sito: [11. Sito web e pagine pubbliche](11-website-va-trang-cong-khai.md).
