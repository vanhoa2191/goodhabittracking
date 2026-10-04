# 5. Famiglia e impostazioni

[← 4. Progettare le abitudini](04-thiet-ke-thoi-quen.md) · [Indice](README.md) · [Avanti: 6. La scienza delle abitudini →](06-khoa-hoc-thoi-quen.md)

<!--op-->## In questa guida

[Profili dei bambini](#ho-so) · [Associare il dispositivo di un bambino](#ghep-thiet-bi) · [Gestire i dispositivi](#thiet-bi) · [Invitare una persona che si prende cura del bambino](#nguoi-cham-soc) · [Gruppi di impostazioni](#cai-dat) · [Account e sincronizzazione](#tai-khoan) · [Privacy e notifiche](#rieng-tu) · [Promemoria](#nhac-viec) · [Aspetto](#giao-dien) · [PIN](#pin) · [Fare una pausa](#tam-nghi) · [Installare l’app](#pwa) · [Dati della famiglia](#du-lieu) · [Offerte e segnalazioni](#uu-dai) · [Sezioni correlate](#lien-quan)<!--/op-->

L’area **Famiglia** ha due sezioni: `Family → Child profiles` e `Family → Settings`.

<a id="ho-so"></a>
## Profili dei bambini

Ogni bambino ha un profilo separato con:

| Informazione | Note |
|---|---|
| Nome reale | Usato dai genitori; non viene mostrato pubblicamente a meno che non si scelga di condividerlo |
| Soprannome | Il nome mostrato nella classifica; se lasciato vuoto, la classifica pubblica usa «Super Child» |
| Età (da 0 a 18) | Cursore; determina automaticamente la **fascia** (0–3, 3–6, 6–12, 12–18) con una descrizione. Determina i suggerimenti, il [percorso](04-thiet-ke-thoi-quen.md#lo-trinh) e l’[interfaccia in base all’età](02-man-hinh-be.md#giao-dien-tuoi) |
| Mascotte e colore | Sei [mascotte](02-man-hinh-be.md#linh-vat) |
| Classifica | Scelga se partecipare alla classifica pubblica e se mostrare il nome reale o solo il soprannome (consigliato: soprannome). I nuovi bambini sono **privati** per impostazione predefinita |
| Interfaccia in base all’età | Quando modifica un profilo: **Automatico in base all’età**, fissi la fascia 3–8 o 9–12, da 13 anni, oppure **mantenga l’interfaccia attuale**. La scelta del genitore ha la precedenza su quella effettuata sul dispositivo del bambino |

Dalla scheda del profilo, i genitori possono:

- **Aggiungere, modificare o eliminare** un profilo bambino. Il numero di bambini dipende dal [piano](07-goi-va-thanh-toan.md#cac-goi): il piano per un bambino consente fino a 1 bambino; la prova e i piani famiglia non hanno limiti. Alla scadenza di un piano, non è possibile aggiungere un nuovo profilo senza un piano.
- **Caricare il pacchetto in base all’età** («Aggiungi automaticamente 6 abitudini adatte all’età…») per ottenere subito sei attività iniziali.
- **[Assegnare o sottrarre stelle manualmente](03-hom-nay-va-duyet-viec.md#chinh-sao)**.
- Visualizzare stelle, livello, serie e se il bambino è nascosto dalla classifica.
- Aprire il **codice di connessione e il codice QR** del bambino ([più avanti](#ghep-thiet-bi)).

<a id="ghep-thiet-bi"></a>
## Associare il dispositivo di un bambino

Ogni bambino ha **un codice di connessione permanente** (e un codice QR corrispondente). Il codice consente l’accesso solo a quel bambino, non contiene PIN né dati della famiglia e rimane invariato finché un genitore non lo aggiorna.

1. **Ottenere il codice del bambino**: in `Family → Child profiles`, copi il codice oppure tocchi «Mostra codice QR». Se è stato impostato un [PIN](#pin), sarà necessario inserirlo.
2. **Aprire il dispositivo del bambino**: apra l’app e apra «Questo è un dispositivo di un bambino?» e scelga «Inserisci il codice o scansiona il QR» (oppure «Codice bambino» nella barra superiore).
3. **Scansionare il codice QR o inserire il codice**: il dispositivo accede automaticamente al profilo del bambino corretto. Viene mostrato «Connessione riuscita!» e il bambino tocca «Inizia le attività del bambino».

Dopo l’associazione, il dispositivo apre sempre direttamente la [schermata del bambino](02-man-hinh-be.md), senza mostrare la dashboard dei genitori o le pagine di vendita.

- **Aggiornare il codice** per un bambino («Crea un nuovo codice per questo bambino») oppure **per tutti i bambini** («Crea nuovi codici bambino»): i vecchi codici smettono di funzionare. Lo faccia solo se sospetta che un codice sia stato esposto. È necessario un PIN.
- Se la fotocamera non si apre: conceda l’autorizzazione alla fotocamera, usi una connessione sicura (https) oppure inserisca manualmente il codice.
- Troppi tentativi errati attiveranno la limitazione delle richieste ([9](09-bao-mat-va-rieng-tu.md#ma-ghep)).

<a id="thiet-bi"></a>
## Gestire i dispositivi

`Settings → Devices & family rhythm → Children's devices` elenca i dispositivi associati: a quale bambino appartengono, quando sono stati visti l’ultima volta e se l’accesso è scaduto. **Revoca l’accesso** immediatamente se un dispositivo è smarrito o non viene più usato (è necessario il PIN). Ogni dispositivo può accedere al profilo di **un solo** bambino.

<a id="nguoi-cham-soc"></a>
## Invitare una persona che si prende cura del bambino

Per nonni o parenti che desiderano seguire i progressi ma **non possono modificare nulla**.

1. In `Settings`, tocchi **Crea invito per chi si prende cura del bambino**. Il link di invito **monouso** compare solo al momento della creazione e **scade dopo 72 ore**. Lo copi e lo invii alla persona.
2. La persona invitata apre il link, accede con Google e tocca «Accetta». Se l’invito è scaduto, è stato revocato o l’account appartiene già a un’altra famiglia, vedrà «Invito non valido…».
3. Apre l’**Area di chi si prende cura del bambino**: visualizza i progressi di ciascun bambino con accesso in sola lettura: «Oggi: x / y attività» (y è il numero di attività programmate per oggi in base alla regola di ripetizione; se non ce ne sono, «Nessuna attività programmata per oggi»), «Ultimi 7 giorni: x / y», le abitudini di ciascun bambino e il totale dei completamenti «Sempre» come dato secondario. Chi si prende cura del bambino vede solo i conteggi giornalieri, non quale attività è stata svolta, a che ora o eventuali note.
4. I genitori possono **Revocare l’invito** in qualsiasi momento dall’elenco «Inviti attivi».

<a id="cai-dat"></a>
## Gruppi di impostazioni

`Family → Settings` è suddivisa in gruppi; la barra «Gruppi di impostazioni» porta direttamente a ciascuna sezione:

| Gruppo | Contenuti |
|---|---|
| **Dispositivi e ritmo familiare** | Dispositivi dei bambini, installazione dell’app, persone che si prendono cura dei bambini, [pausa familiare](#tam-nghi) |
| **Account e sincronizzazione** | Informazioni cliente, codici regalo, dati della famiglia |
| **Privacy e notifiche** | Classifica pubblica, misurazione anonima, promemoria |
| **Aspetto** | Chiaro, scuro, impostazioni del dispositivo |
| **Proteggi l’area genitori** | PIN |
| **Offerte e segnalazioni** | Campo del codice di segnalazione, scheda Invita un amico (in fondo alla pagina, visibile solo dopo l’accesso) |

La barra degli indirizzi ricorda la sezione aperta (per esempio `?section=settings#settings-security`): ricaricando la pagina si rimane nella stessa sezione e il pulsante Indietro del browser riporta alla sezione precedente. Il link seleziona solo una sezione all’interno dell’area genitori e non sblocca nulla: in modalità bambino, la parte `section` viene ignorata.
In fondo alla pagina trova «Apri la guida utente» (la pagina `/docs` nell’app; veda [come trovare aiuto nell’app](01-bat-dau.md#tro-giup)) e i link a Privacy, Termini e Contatta l’assistenza ([11](11-website-va-trang-cong-khai.md)).

<a id="tai-khoan"></a>
## Account e sincronizzazione

- **Stato**: «Account famiglia», verificato, «Cloud pronto». I dati della famiglia si sincronizzano automaticamente tra telefoni, tablet e computer, senza necessità di configurazioni tecniche.
- **Informazioni cliente**: nome completo, numero di telefono (da 9 a 15 cifre), email (sola lettura) e possibilità di ricevere guide e offerte. Sono usate per fornire assistenza per l’account e i pagamenti.
- **Codice coupon**: inserisca un codice regalo per aggiungere giorni extra al suo accesso ([7](07-goi-va-thanh-toan.md#coupon)).

<a id="rieng-tu"></a>
## Privacy e notifiche

- **Condividi nella classifica pubblica**: opzione valida per tutta la famiglia, **disattivata per impostazione predefinita**, che solo un genitore può modificare. Se attivata, compaiono solo i bambini selezionati nel [profilo](#ho-so), e solo con soprannome, avatar, punteggio del periodo, serie e posizione. Può disattivarla in qualsiasi momento ([9](09-bao-mat-va-rieng-tu.md#bxh-cong-khai)).
- **Misurazione anonima**: opzione di consenso per i genitori, disattivata per impostazione predefinita. Al momento non è configurata alcuna destinazione di raccolta, quindi gli eventi non escono dal dispositivo ([analisi del prodotto](../product-analytics.md)).
- **Promemoria**: veda [più avanti](#nhac-viec).

<a id="nhac-viec"></a>
### Promemoria per i genitori

Attivi «Consenti i promemoria per gli elementi che richiedono attenzione» per ricevere promemoria quando un’attività o un premio richiede approvazione. I promemoria riguardano solo gli elementi che richiedono approvazione, non sono pubblicità e possono essere disattivati in qualsiasi momento. Per ricevere notifiche fuori dall’app, tocchi «Consenti notifiche su questo dispositivo»; se il dispositivo le blocca, i promemoria continueranno a comparire nell’app (veda il [banner Oggi](03-hom-nay-va-duyet-viec.md#nhac-viec-ngan)).

<a id="giao-dien"></a>
## Aspetto

- **Chiaro, Scuro, Impostazioni del dispositivo** nel gruppo Aspetto.
- **Carattere e dimensione**: apra la finestra «Impostazioni carattere e dimensione» dalla barra superiore per rendere il testo il più facile possibile da leggere per suo figlio.
- **Lingua**: selettore della lingua nella barra superiore ([1](01-bat-dau.md#ngon-ngu)).
- **Interfaccia del bambino in base all’età**: la fissi mentre [modifica il profilo del bambino](#ho-so).

<a id="pin"></a>
## PIN genitori

Il PIN è composto da **esattamente 4 cifre** e protegge l’area di gestione della famiglia. Non lo condivida con i bambini.

- **Creazione**: inserisca il PIN, poi lo inserisca di nuovo per confermare. **Modifica**: inserisca il PIN attuale, poi il nuovo PIN due volte.
- Quando è impostato un PIN, per passare dalla schermata del bambino alla modalità genitori è necessario inserirlo. Dopo averlo inserito correttamente, questo browser rimane sbloccato per **2 ore**; bloccarlo di nuovo annulla lo sblocco.
- Queste operazioni sensibili richiedono lo sblocco: visualizzare o modificare il codice di connessione di un bambino, revocare un dispositivo, approvare attività e premi, assegnare o sottrarre stelle manualmente, creare un pagamento, eliminare la famiglia, salvare i dati bancari o prelevare le commissioni di segnalazione. Se l’area non è sbloccata, l’app torna alla schermata di blocco.
- Per prelevare le commissioni di segnalazione la famiglia deve **avere un PIN impostato** ([8](08-gioi-thieu-ban-be.md#rut-tien)).
- Dopo troppi tentativi errati, occorre attendere qualche minuto («Ha effettuato troppi tentativi»).
- Se un bambino tocca per completare un’attività sul dispositivo del genitore, **non** è necessario il PIN.

<a id="tam-nghi"></a>
## Fare una pausa in famiglia

In `Settings → Family break`, tocchi **Fai una pausa**, poi confermi quando tutta la famiglia ha bisogno di riposo (malattia, viaggio o vacanze). Durante la pausa:

- la schermata del bambino nasconde i promemoria dei progressi, le serie e la classifica e mostra un messaggio rassicurante ([2](02-man-hinh-be.md#tam-nghi-be));
- i bambini possono comunque completare le attività; stelle, premi e attività non vengono eliminati;
- i giorni di pausa non interrompono la [serie](02-man-hinh-be.md#sao-cap-chuoi) e non vengono conteggiati come occasioni perse nel [calcolo delle fasi delle abitudini](06-khoa-hoc-thoi-quen.md#logic);
- i [promemoria](#nhac-viec) vengono sospesi.

Tocchi **Riprendi** quando desidera continuare.

<a id="pwa"></a>
## Installare l’app

La scheda «Installa KidHabit Hero» consente di aprire rapidamente l’app come un’applicazione, continuando a ricevere le nuove versioni dal web. Su Android/Chrome, tocchi «Installa ora»; su iPhone, la apra in Safari → Condividi → Aggiungi alla schermata Home. Se necessario, è disponibile anche un pulsante «Aggiorna i dati dell’app».

<a id="du-lieu"></a>
## Dati della famiglia

La scheda «Dati della famiglia» consente di **scaricare una copia JSON** contenente profili dei bambini, abitudini, cronologia dei completamenti, premi, gruppi, diari, segnali e registrazioni di come il bambino ha svolto le attività. Il file **non contiene il PIN né informazioni di pagamento**, ma contiene i dati di suo figlio, quindi lo conservi in privato. «Ripristina da file JSON» riguarda solo i dati archiviati su questo dispositivo (sostituisce tutti i dati locali); per gli account Google, i dati sono archiviati sul server della famiglia. Esporti separatamente il diario di un bambino da [Statistiche](03-hom-nay-va-duyet-viec.md#thong-ke). Eliminazione permanente: [9](09-bao-mat-va-rieng-tu.md#xoa-du-lieu).

<a id="uu-dai"></a>
## Offerte e segnalazioni

L’ultimo gruppo in `Settings`, visibile solo dopo l’accesso:

- **Codice di segnalazione**: campo «Ha un codice di segnalazione di un amico?» (visibile solo quando la famiglia è idonea).
- **Invita un amico**: scheda per ottenere un link, monitorare le commissioni e prelevare denaro ([8](08-gioi-thieu-ban-be.md)).

<a id="lien-quan"></a>
## Sezioni correlate

- Dove i bambini usano il codice e cosa vedono: [2. Schermata del bambino](02-man-hinh-be.md).
- Limiti di bambini per piano, acquisto di un piano, coupon: [7. Piani e pagamenti](07-goi-va-thanh-toan.md).
- Perché i codici di connessione e i PIN sono sicuri: [9. Sicurezza e privacy](09-bao-mat-va-rieng-tu.md).
- I prelievi delle segnalazioni richiedono un PIN: [8. Invita un amico](08-gioi-thieu-ban-be.md).
