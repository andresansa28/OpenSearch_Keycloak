# Guida all'uso
Una guida per avviare e usare il progetto
# Prerequisiti
 - Docker
 - jq (solitamente già incluso nelle distro linux, altrimente vedere la relativa documentazione per installarlo)


## Primo Avvio

NB: assicurarsi di cancellare il contenuto della cartella **certs** e il file **.done** (se presente) e i deploy nel file che si trovano in **analyzer/Config.json** (se presenti)
Per avviare il progetto, clonare il repository, accedere alla cartella creata e far partire tutto il sistema tramite lo script **start.sh** 

    bash start.sh
Il sistema richiederà un pò di tempo per scaricare e avviare tutto, quando il terminale vi restituirà il prompt (quindi l'installazione è terminata), procedere ad aprire un browser web e accedere all'indirizzo della webapp: **172.17.0.1:4200**
A questo punto, si verrà inoltrati alla pagina di login di keycloak e il browser impedirà (per un primo momento) la visione della pagina
Infatti, mostrerà un avviso di sicurezza. Basterà cliccare su **Avanzate** e poi su **Accetta il rischio e continua**
A questo punto, apparirà il login, dove le credenziali dell'unico utente già creato di default sono:
**username**: admin
**password**: password
Una volta eseguito il login (tramite admin) la webapp mostrerà la dashboard principale tramite un iframe relativo alla dashboard di opensearch
Anche qui, il browser non farà visualizzare la pagina, basterà cliccare su avanzate, copiare l'indirizzo e la porta relativa alla dashboard opensearch (**https://172.17.0.1:5601**), andare a questo indirizzo tramite un'altra tab del browser, cliccare su **Avanzate** e poi su **Accetta il rischio e continua**
**NB: assicurarsi che la connessione sia HTTPS**
Una volta fatto ciò, tornare alla dashboard  e ricaricare la pagina: apparire l'iframe con la dashboard di opensearch
Questa procedura di **accettare il rischio e continuare** va eseguita la prima volta oppure ogni volta che viene cancellata la cache

## Funzionamento
Tramite l'utente admin di default, è possibile accedere alla sezione **Deployments** e **Utenti**
Nella prima, l'admin può configurare uno o più deploy, in questo modo:

 1. Inserire la chiave geoDB (opzionale)
 2. Inserire il delay per l'analyzer
 3. Inserire nome del deploy
 4. Inserire IP della macchina remota in cui è ospitato il deploy
 5. Inserire nome utente della macchina remota
 6. Inserire password utente della macchina remota
 Cliccare su **Avanti**
 7. Inserire nome e indirizzo ip dei dispositivi del deploy (SCADA, PLC) 
	Cliccare su avanti
	Apparirà un recapt del deploy, se tutto è stato impostato correttamente, cliccare su **salva deployment**

A questo punto il deploy apparirà in basso nella lista dei deploy
Cliccando la card, è possibile visualizzare i dati del deploy e testare la connessione ssh verso la macchina remota in cui è ospitato il deploy; se il sistema rileva che la macchina è raggiungibile, allora apparirà la scritta verde **Online**, scritta rossa **Offline** viceversa
Quando un deploy viene creato, viene automaticamente creato un **gruppo keycloak** che servirà per assegnare ad un utente il tenant relativo a quel deploy




A questo punto, configurati tutti i deploy voluti, si procede con la configurazione di opensearch, tramite l'apposito pulsante **first opensearch setup**
A questo punto, se il deploy sulla macchina remota è attivo, si può proseguire con la pressione del pulsante **start** e l'analyzer inizierà a raccogliere i dati e caricarli su opensearch

Una volta che il setup è completato, tornando alla dashboard è possibile switchare i vari tenant (essendo admin, è possibile vedere tutti i tenant)

Per creare un utente, andare nella sezione **Utente** e inserire i campi nell'apposito form
Succesivamente, impostare il **gruppo** relativo all'utente
Ad esempio, se sono stati creati i deploy **test1** e **test2**, in automatico sono stati creati i gruppi **test1** e **test2**
Quindi, se ad un utente si vuole assegnare la visualizzazione dei dati relativa al deploy **test1**, verrà aggiunto al gruppo **test2**
Assicurarsi sempre che l'admin abbia configurato opensearch con l'appisito bottone, come descritto prima

A questo punto un utente può effettuare il login con le proprie credenziali, verrà mostrata la dashboard di opensearch e sceglierà il tenant da visualizzare in base ai gruppo a cui è stato aggiunto



