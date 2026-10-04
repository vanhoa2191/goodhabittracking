# 9. Sicurezza e privacy

[← 8. Presenta un amico](08-gioi-thieu-ban-be.md) · [Indice](README.md) · [Avanti: 10. Amministrazione e operazioni →](10-quan-tri-va-van-hanh.md)

<!--op-->## In questa guida

[Quali dati vengono memorizzati](#du-lieu) · [Chi può vedere cosa](#ai-thay) · [Codice di abbinamento del bambino](#ma-ghep) · [PIN](#pin) · [Consenso](#dong-thuan) · [Classifica pubblica](#bxh-cong-khai) · [Condivisione dei traguardi](#chia-se) · [Programma di inviti](#gioi-thieu-rieng-tu) · [Suggerimenti dell'IA](#goi-y-ai) · [Analisi e promemoria](#do-luong) · [Scaricare ed eliminare i dati](#xoa-du-lieu) · [Misure di sicurezza tecniche](#ky-thuat) · [Limiti legali](#phap-ly) · [Argomenti correlati](#lien-quan)<!--/op-->

Questa pagina spiega in modo semplice cosa fa KidHabit per proteggere i dati del bambino. Per i dettagli tecnici, consulti [Sicurezza e privacy](../security-privacy.md).

<a id="du-lieu"></a>
## Quali dati vengono memorizzati

L'app memorizza il profilo del bambino (nome, soprannome, età), le abitudini, i progressi, i punti, i premi, i dispositivi abbinati, il piano di abbonamento e i dati di contatto del genitore (nome completo, numero di telefono, e-mail). Le funzioni facoltative possono includere anche un diario di una frase, un piano di segnali, il modo in cui il bambino completa ogni tentativo e una lista dei desideri. **Non inviamo mai** i dati del bambino, i codici di sessione, i PIN, le chiavi PayOS o i contenuti dei webhook a sistemi di analisi.

<a id="ai-thay"></a>
## Chi può vedere cosa

| Persona | Può vedere | Non può vedere |
|---|---|---|
| Genitore | Tutti i dati della propria famiglia | I dati di altre famiglie |
| Persona che si prende cura del bambino | I nomi dei bambini, le abitudini attive (con la relativa frequenza), il totale dei tentativi completati o approvati per ciascun bambino e il conteggio giornaliero degli ultimi 7 giorni, in sola lettura | Non può apportare modifiche né vedere i singoli tentativi, gli orari, le note, l'età, i soprannomi, i premi, i gruppi, gli abbonamenti, i pagamenti, le impostazioni o gli altri membri |
| Bambino (dispositivo abbinato) | I propri dati | I profili degli altri bambini, i pagamenti, le impostazioni o il PIN |
| Operatore | I profili dei genitori (nome, e-mail, telefono), i piani di abbonamento e gli ordini; ogni azione viene registrata | I profili dei bambini, le attività o il diario del bambino |

Nel database ogni famiglia è mantenuta in un «compartimento» separato: un account non può leggere né scrivere i dati di un'altra famiglia, anche in presenza di un errore nell'interfaccia dell'app. Ogni dato appartiene a un `family_id`; i piani e i vantaggi appartengono alla famiglia, non a un indirizzo e-mail.

<a id="ma-ghep"></a>
## Codice di abbinamento del bambino

- Ogni codice apre **esattamente un profilo bambino** e non contiene PIN o dati della famiglia. Nel database viene memorizzato solo un hash del codice.
- La sessione del dispositivo del bambino viene memorizzata in un cookie HTTP-only, che gli script della pagina non possono leggere; ogni richiesta restituisce i dati di un solo bambino.
- Gli inserimenti ripetuti di codici errati sono soggetti a **limitazione della frequenza**.
- I genitori possono **aggiornare il codice** (quello precedente diventa non valido) e **revocare singoli dispositivi** in qualsiasi momento ([5](05-gia-dinh-va-cai-dat.md#ghep-thiet-bi)). Per visualizzare, modificare o revocare un codice è necessario il PIN.

<a id="pin"></a>
## PIN

Il **server** verifica il PIN di 4 cifre. Dopo l'inserimento del PIN corretto, il browser riceve un cookie di sblocco firmato e associato al genitore e alla famiglia. Rimane valido per **2 ore** e viene eliminato quando si blocca di nuovo. Nelle famiglie che hanno impostato un PIN, le azioni sensibili vengono rifiutate finché non si sblocca: eliminare la famiglia, revocare dispositivi, visualizzare o modificare codici di abbinamento, creare pagamenti, approvare attività e premi, aggiungere o sottrarre stelle manualmente e visualizzare i dati per i pagamenti degli inviti. Il bambino può toccare lo schermo per completare un'attività sul dispositivo del genitore senza inserire il PIN. Per istruzioni su come impostare un PIN, veda [5](05-gia-dinh-va-cai-dat.md#pin).

<a id="dong-thuan"></a>
## Consenso

- Durante la [configurazione della famiglia](01-bat-dau.md#thiet-lap), l'adulto deve confermare di essere un genitore o tutore legale e acconsentire alla memorizzazione dei dati del bambino. Il consenso viene registrato insieme alla **versione dell'informativa**.
- La classifica pubblica, l'analisi anonima, i promemoria e le offerte promozionali sono tutti **facoltativi**, **disattivati per impostazione predefinita** e possono essere disattivati di nuovo. Le revoche vengono conservate come data e ora, senza eliminare lo storico dei consensi.
- Le persone che si prendono cura del bambino possono accedere alla famiglia solo tramite un invito monouso creato da un genitore (scade dopo 72 ore); l'invito può essere revocato ([5](05-gia-dinh-va-cai-dat.md#nguoi-cham-soc)).

<a id="bxh-cong-khai"></a>
## Classifica pubblica

Un bambino appare nella classifica pubblica solo se sono vere **entrambe** le condizioni: la famiglia ha attivato la condivisione (disattivata per impostazione predefinita e modificabile solo da un genitore) **e** il profilo del bambino è stato contrassegnato come partecipante (i nuovi profili sono privati per impostazione predefinita). La classifica mostra solo il soprannome (o «Super Kid»), l'avatar, i punti ottenuti nel periodo, la serie e la posizione; **non** contiene il codice del bambino, il codice famiglia, il nome reale o l'età. I punti si basano sulle registrazioni confermate durante il periodo, non sul saldo attuale; quindi riscattare stelle per premi non modifica la classifica. Le classifiche Famiglia e Gruppo usano solo i dati dei rispettivi ambiti. Impostazioni: [5](05-gia-dinh-va-cai-dat.md#rieng-tu); esperienza del bambino: [2](02-man-hinh-be.md#bang-xep-hang).

<a id="chia-se"></a>
## Condivisione dei traguardi

«Condividi un traguardo positivo» ([3](03-hom-nay-va-duyet-viec.md#thong-ke)) mostra sempre ai genitori **un'anteprima e la possibilità di confermare** prima di aprire il pannello di condivisione del dispositivo. Per impostazione predefinita, il contenuto non include il nome, l'età, la foto o le attività del bambino e non contiene codici di tracciamento.

<a id="gioi-thieu-rieng-tu"></a>
## Programma di inviti

Il codice invito viene memorizzato per 60 giorni nel cookie `kidhabit_ref` (ed è eliminato dopo la registrazione). Solo gli amministratori autorizzati possono visualizzare le coordinate bancarie di chi invita; chi invita vede solo le ultime 4 cifre. Chi invita **non vede mai** informazioni sulla famiglia invitata ([8](08-gioi-thieu-ban-be.md)).

<a id="goi-y-ai"></a>
## Suggerimenti dell'IA

La funzione viene attivata gradualmente ed è **disattivata per impostazione predefinita**; appare solo dopo aver dato il consenso in Settings → Privacy (scheda **AI suggestions**). Quando tocca un pulsante per un suggerimento, l'app chiede a un modello di IA (Cloudflare Workers AI) di preparare una bozza:

- **Suggest small steps with AI** (nel modulo dell'abitudine): vengono inviati solo **il nome dell'abitudine appena digitato** (dopo aver rimosso link, e-mail e numeri di telefono) e una fascia d'età.
- **Summarise the week with AI**: vengono inviati solo **i conteggi della settimana** (completato da soli, con un promemoria, insieme, non completato), senza nomi di abitudini o del bambino.

**Non vengono mai inviati**: il nome o il soprannome del bambino, il diario, ciò che il bambino ha scritto, le foto e la Sua e-mail. I dati inviati e le risposte ricevute **non vengono scritti nei log di sistema**. Il risultato è solo un suggerimento contrassegnato come «bozza generata dall'IA»: lo legge e sceglie **Use** o **Dismiss**; l'app non applica nulla autonomamente. Ogni famiglia ha un numero limitato di suggerimenti al giorno e la funzione si sospende quando si esaurisce la quota condivisa. Come per le altre azioni sensibili, è necessario il PIN. Disattivando l'interruttore, la funzione si arresta subito.

<a id="do-luong"></a>
## Analisi e promemoria

- **L'analisi anonima** ha limiti rigorosi: gli eventi non contengono nomi, contenuti delle abitudini, codici di bambini/famiglie/utenti, codici di abbinamento, dati di pagamento o orari esatti. **Al momento non è configurata alcuna destinazione di raccolta**, quindi i dati non escono dal dispositivo, anche se un genitore acconsente. Non verranno pubblicate metriche (DAU, fidelizzazione, NPS ecc.) senza misurazioni reali. Veda [Analisi del prodotto](../product-analytics.md).
- I **promemoria** servono solo a informarLa delle attività che richiedono approvazione; non vengono usati per pubblicità.
- I dati sul modo in cui il bambino completa ogni tentativo e i piani di segnali vengono **usati solo per fornire suggerimenti ai genitori**; non servono a classificare o confrontare i bambini ([6](06-khoa-hoc-thoi-quen.md#logic)).

<a id="xoa-du-lieu"></a>
## Scaricare ed eliminare i dati

- **Download**: una copia JSON dei dati della famiglia ([5](05-gia-dinh-va-cai-dat.md#du-lieu)) e un CSV delle voci di diario di una frase ([3](03-hom-nay-va-duyet-viec.md#thong-ke)). Mantenga privati questi file perché contengono i dati del bambino.
- **Eliminazione permanente**: può eseguirla solo il **proprietario della famiglia**, da `Today → Analytics`, inserendo esattamente `DELETE FAMILY` (è richiesto il PIN, se impostato). L'operazione elimina profili dei bambini, abitudini, progressi, premi, dispositivi abbinati e sessioni abbinate; non può essere annullata. Ripristinare l'account di accesso **non** ripristina i dati eliminati ([Ripristino dei dati](../data-recovery.md)).

<a id="ky-thuat"></a>
## Misure di sicurezza tecniche

| Misura di sicurezza | Cosa significa per Lei |
|---|---|
| Isolamento delle famiglie e blocchi a livello di riga nelle transazioni | I dati di famiglie diverse non possono mescolarsi |
| Tutti i comandi di scrittura basati su cookie rifiutano richieste cross-origin | Un sito sconosciuto non può agire per Suo conto |
| PayOS «fail closed»: verifiche di firma, importo, contenuto, proprietario dell'ordine ed elaborazione duplicata | Una notifica falsa non può attivare un piano |
| Prova una tantum e verifiche dei piani a livello di database | Non è possibile aggirare i limiti modificando l'interfaccia |
| Content Security Policy (CSP), protezioni dai frame e autorizzazioni minime del browser | Riducono il rischio dovuto a codice dannoso |
| Funzioni sensibili solo sul server; le nuove funzioni sono chiuse per impostazione predefinita | Una superficie di abuso ridotta |
| Per gli amministratori è richiesta la verifica in due passaggi e ogni azione viene registrata con una motivazione | Tracciabilità e controllo |

<a id="phap-ly"></a>
## Limiti legali

Le impostazioni predefinite sono state progettate con un approccio **prudente** ai dati dei bambini, ma **non costituiscono una certificazione** di conformità a COPPA o GDPR-K. Prima di attivare la classifica pubblica in un mercato specifico, richieda una revisione legale che consideri l'età del consenso, il periodo di conservazione, i diritti di accesso e quelli di cancellazione. Le pagine `Privacy`, `Terms` e `Contact` sul [sito web](11-website-va-trang-cong-khai.md#phap-ly-web) possono restare bozze (non indicizzate né mostrate nel piè di pagina o al pagamento) finché non viene attivato il flag di approvazione legale. Per segnalare un incidente, non invii segreti o dati dei bambini tramite un canale pubblico.

<a id="lien-quan"></a>
## Argomenti correlati

- PIN, dispositivi e persone che si prendono cura dei bambini: [5. Famiglia e impostazioni](05-gia-dinh-va-cai-dat.md).
- Classifiche: [2. Schermata del bambino](02-man-hinh-be.md#bang-xep-hang).
- Amministrazione e registri delle azioni: [10. Amministrazione e operazioni](10-quan-tri-va-van-hanh.md).
- Risposta agli incidenti: [Risposta agli incidenti](../runbooks/incident-response.md).
