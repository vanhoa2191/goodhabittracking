# 7. Piani e pagamenti

[← 6. La scienza delle abitudini](06-khoa-hoc-thoi-quen.md) · [Indice](README.md) · [Avanti: 8. Segnalazioni →](08-gioi-thieu-ban-be.md)

<!--op-->## In questa guida

[Prova gratuita di 7 giorni](#dung-thu) · [Piani](#cac-goi) · [Dove acquistare](#noi-mua) · [Procedura di pagamento](#thanh-toan) · [Attivazione e riconciliazione](#kich-hoat) · [Estensioni del periodo](#cong-don) · [Codici regalo (coupon)](#coupon) · [Sconto per le famiglie segnalate](#giam-gia) · [Rimborsi e cancellazione](#hoan-tien) · [Email inviate](#email) · [Scadenza del piano](#het-han) · [Sezioni correlate](#lien-quan)<!--/op-->

<a id="dung-thu"></a>
## Prova gratuita di 7 giorni

- **Gratis: 0 VND**, non è richiesta una carta di credito e alla scadenza **non viene effettuato alcun addebito automatico**.
- Sblocca tutte le funzionalità del piano famiglia, **senza limiti al numero di bambini**.
- **Una sola volta per famiglia.** Se la prova è già stata utilizzata, il pulsante di avvio mostrerà: «Questa famiglia ha già utilizzato una prova. Scelga un piano per continuare».
- Come avviarla: (a) automaticamente all’ultimo passaggio della [configurazione della famiglia](01-bat-dau.md#thiet-lap), se non si dispone di un piano; (b) in `/start` («Inizia la prova gratuita di 7 giorni»): acceda con Google, configuri la famiglia e tocchi Avvia; (c) nel riquadro della prova nella finestra dei prezzi. Può avviarla solo un genitore della famiglia.
- Il riquadro della prova **non comparirà più** dopo che la famiglia ha effettuato un pagamento.
- Quando la fine della prova si avvicina, il sistema invia un’email di promemoria ([email](#email)).

<a id="cac-goi"></a>
## Piani

| Piano | Prezzo | Bambini | Ideale per |
|---|---|---|---|
| **Prova gratuita di 7 giorni** | 0 VND | Senza limiti | Provare tutte le funzionalità prima di decidere |
| **Piano Base** | 29,000 VND / mese | 1 bambino | Famiglie che iniziano con un solo bambino |
| **Piano famiglia · Mensile** | 49,000 VND / mese | Senza limiti | Più bambini o accesso completo a tutte le funzionalità |
| **Piano famiglia · Annuale** | 399,000 VND / anno (prezzo normale 588,000 VND, risparmio 189,000 VND, 32%) | Senza limiti | Proseguire abbastanza a lungo da trasformare piccoli passi in abitudini |
| **A vita** | Non in vendita | Senza limiti | Concesso manualmente solo da un amministratore<!--op--> ([10](10-quan-tri-va-van-hanh.md#khach-hang))<!--/op--> |

Tutti i pagamenti sono **una tantum**, senza rinnovo automatico. La schermata dei prezzi elenca anche vantaggi aggiuntivi per il piano famiglia (resoconti settimanali, competizioni familiari e assistenza tecnica più rapida) e per il piano annuale (assistenza prioritaria ed ebook di guida alla genitorialità); l’ebook **non è ancora disponibile**.

**I nomi variano in base alla località:** il sito di marketing chiama il *Piano Base* «Piano Base» e i due piani famiglia «Piano Premium» (mensile e annuale). Si tratta degli stessi prodotti agli stessi prezzi.

**Il numero di bambini consentito dal piano** viene verificato nel database: il piano Base ne consente fino a 1; la prova, i piani famiglia e il piano a vita non hanno limiti; senza un piano attivo non è possibile aggiungere un nuovo profilo bambino.

<a id="noi-mua"></a>
## Dove acquistare

| Punto di accesso | Descrizione |
|---|---|
| Pulsante **Passa a Pro** nella barra superiore | Apre la finestra «Prezzi di KidHabit Hero Pro», dove può scegliere un piano |
| Finestra dei prezzi quando è necessario un piano | Per esempio, dopo la scadenza di un piano |
| Pagina `/pricing` e pulsante di selezione del piano sul [sito web](11-website-va-trang-cong-khai.md#trang-chinh) | Porta a `/checkout?plan=…` nell’app |
| Pagina `/checkout` | Carica il piano selezionato: acceda, configuri la famiglia se necessario e poi paghi |

Un link a un piano non valido (con informazioni obsolete o mancanti) mostra «Piano di pagamento non valido» con un pulsante per visualizzare i prezzi. I diritti del piano appartengono alla **famiglia**, non a un indirizzo email.

<a id="thanh-toan"></a>
## Procedura di pagamento

I pagamenti vengono elaborati tramite **PayOS (VietQR)**:

1. Scelga un piano → acceda con Google se necessario → «Continua al pagamento». Se il profilo è incompleto, inserisca nome completo e numero di telefono; i dati verranno ricordati per i pagamenti futuri. Le offerte sono facoltative e disattivate per impostazione predefinita. Poi confermi i termini se richiesto e inserisca un codice di segnalazione solo se la famiglia è idonea. La creazione dell’ordine è disattivata mentre il codice viene inviato. È possibile inserire i codici solo prima di creare il codice QR, perché il server calcola l’importo al momento della creazione dell’ordine; questa finestra non sostituisce un ordine esistente dopo l’applicazione di un codice.
2. La schermata di pagamento mostra un **codice VietQR** e i dati del bonifico: nome del beneficiario, banca, numero del conto, **importo esatto** e **causale del bonifico (obbligatoria)**. Include pulsanti per copiare ogni dato, un pulsante **Scarica il codice QR** (per aprire l’app bancaria e scegliere la scansione di un’immagine dalla galleria) e un link per aprire la pagina di pagamento sicura di PayOS. Se la copia non riesce, tenga premuto per selezionare il testo e lo copi manualmente. Non c’è un conto alla rovescia perché il server non impone un termine di pagamento di 15 minuti.
3. Scansioni il codice con l’app bancaria o MoMo. **Mantenga l’importo esatto e la causale del bonifico.**
4. Se necessario, tocchi **«Ho effettuato il bonifico»**; l’app controlla automaticamente lo stato. Gli errori di stato vengono mostrati nella lingua selezionata e i controlli automatici continuano. Al completamento viene mostrato «🎉 Passaggio al piano superiore riuscito!» e il piano viene sbloccato immediatamente.

Se il pagamento è in sospeso, **non paghi subito una seconda volta**. Il prezzo è stabilito dal server e non può essere modificato nel browser. Può pagare solo un genitore della famiglia e per effettuare un pagamento è necessario il [PIN](05-gia-dinh-va-cai-dat.md#pin), se è stato impostato. Tornando all’app dalla pagina PayOS, verrà mostrato l’esito del pagamento.

<a id="kich-hoat"></a>
## Attivazione e riconciliazione

Il piano viene attivato quando il sistema **conferma** il pagamento attraverso uno dei tre canali indipendenti; vale quello che arriva per primo e il pagamento non viene mai conteggiato due volte:

1. Il **webhook** di PayOS chiama `/api/payment/webhook` (con verifica della firma, dell’importo, della causale del bonifico e del titolare dell’ordine).
2. **Verifica PayOS:** mentre un genitore si trova nella schermata di pagamento, l’app chiede direttamente a PayOS lo stato dell’ordine. Questo controllo non dipende dal webhook.
3. **Riconciliazione in background:** ogni 10 minuti un’attività in background controlla gli ordini in sospeso e interroga PayOS.

Se ha effettuato il bonifico ma il piano non compare: attenda qualche minuto, riapra `/checkout` e poi contatti l’assistenza con il codice dell’ordine. <!--op-->Il team operativo può visualizzare l’ordine in [Amministrazione → Pagamenti](10-quan-tri-va-van-hanh.md#thanh-toan-admin).<!--/op-->

<a id="cong-don"></a>
## Estensioni del periodo

Se acquista mentre il piano attuale è ancora attivo, il periodo viene **aggiunto alla fine del periodo attuale**, compreso l’eventuale tempo di prova restante: il piano mensile aggiunge 1 mese, quello annuale 1 anno. Acquistando un piano inferiore a quello già attivo, **si mantiene il piano superiore**. Un piano a vita non viene sostituito da un altro piano.

<a id="coupon"></a>
## Codici regalo (coupon)

I codici regalo vengono creati dal team operativo. Ne inserisca uno in `Settings → Account → Coupon code → Apply code`.

- Un codice regalo aggiunge **giorni extra** di accesso; i codici che offrono solo uno sconto non sono utilizzabili qui. Se la famiglia non ha ancora un piano a pagamento, passa al Piano famiglia · Mensile per il numero di giorni corrispondente; se ha già un piano, i giorni vengono aggiunti alla fine del periodo attuale e il piano rimane invariato. I codici regalo non possono essere applicati al piano a vita.
- Ogni codice può essere usato **una sola volta per famiglia**; una famiglia può utilizzare codici diversi. Se un codice è scaduto, esaurito o disattivato, viene mostrato: «Codice non trovato, già utilizzato o scaduto».
- Dopo **più di 10 tentativi non riusciti nell’arco di 15 minuti**, l’accesso viene temporaneamente bloccato per qualche minuto.

<a id="giam-gia"></a>
## Sconto per le famiglie segnalate

Una famiglia che inserisce un codice di segnalazione (tramite un link `?ref=` oppure inserendolo manualmente) ottiene **il 10% di sconto sul primo piano annuale** (399,000 VND diventano 359,100 VND), solo se non ha ordini pagati precedenti. La schermata di pagamento mostra «Sconto del 10% grazie al codice di segnalazione». Dettagli: [8. Segnalazioni](08-gioi-thieu-ban-be.md#giam-10).

<a id="hoan-tien"></a>
## Rimborsi e cancellazione

- **Rimborso entro 30 giorni:** se non è soddisfatto, invii il codice dell’ordine e l’ora del pagamento all’indirizzo email dell’assistenza entro 30 giorni dal pagamento. I rimborsi vengono elaborati manualmente; una volta confermato il rimborso, la commissione di segnalazione per quell’ordine, se ancora in sospeso, viene recuperata ([8](08-gioi-thieu-ban-be.md#hoan-tien-hoa-hong)).
- Un **link di pagamento in sospeso** può essere annullato dal team di assistenza; l’ordine passa allo stato «annullato» solo dopo la conferma di PayOS.
- La **cancellazione del piano** è gestita dal team di assistenza e confermata via email. Non vengono effettuati addebiti automatici.

<!--op-->Procedura interna: [Gestione email e rimborsi](../runbooks/lifecycle-and-refunds.md) e [10. Amministrazione](10-quan-tri-va-van-hanh.md#phieu-ho-tro).<!--/op-->

<a id="email"></a>
## Email inviate

Ci sono due gruppi di email:

- **Email di accesso** (inviate da Supabase): conferma della registrazione, link di accesso, recupero, inviti, modifiche dell’email e nuova autenticazione. L’interfaccia email è predefinita ([modelli](../../supabase/email-templates/README.md)).
- **Email del ciclo di vita** (che possono essere attivate o disattivate): benvenuto e istruzioni di configurazione (`welcome_setup`), promemoria della fine della prova (`trial_ending`), ricevute di pagamento (`payment_receipt`), aggiornamenti delle richieste di assistenza (`support_status`), rimborsi (`refund_status`) e conferme di cancellazione del piano (`subscription_cancelled`).

Le email del ciclo di vita **non contengono dati dei bambini**. Le email promozionali vengono inviate solo se ha acconsentito a ricevere offerte; revocando il consenso, l’invio viene interrotto immediatamente. Gli indirizzi che generano errori di consegna, reclami o disiscrizioni non riceveranno altri messaggi.

<a id="het-han"></a>
## Scadenza del piano

Quando la prova o il piano scade senza rinnovo, la famiglia non risulta più avere un piano: non è possibile aggiungere un nuovo profilo bambino e l’app suggerisce di scegliere un piano. **I dati non vengono eliminati**; acquisti un piano o usi un codice regalo per continuare.

<a id="lien-quan"></a>
## Sezioni correlate

- Sconto del 10% e commissioni: [8. Segnalazioni](08-gioi-thieu-ban-be.md).
- Avvio di una prova durante la configurazione: [1. Per iniziare](01-bat-dau.md#thiet-lap).
- Limiti di bambini e aggiunta di profili: [5. Profili dei bambini](05-gia-dinh-va-cai-dat.md#ho-so).
- Gestione degli ordini, dei rimborsi e delle modifiche dei piani da parte del team operativo: [10. Amministrazione e operazioni](10-quan-tri-va-van-hanh.md).
- Configurazione di PayOS, webhook e riconciliazione: [Distribuzione](../deployment.md).
