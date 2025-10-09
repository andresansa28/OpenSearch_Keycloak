# Dashboard Analytics - Struttura Tab

## Panoramica

Questo dashboard fornisce una visualizzazione tabellare di dati provenienti da OpenSearch tramite aggregazioni. È stato progettato per gestire fino a 20+ tabelle diverse con una interfaccia a tab che permette di visualizzare multiple tabelle contemporaneamente.

## Struttura dei Componenti

### DashboardComponent (`dashboard.component.ts`)
Il componente principale che gestisce:
- **Catalogo tabelle**: Lista di 20 tabelle organizzate per categorie
- **Sistema di filtri**: Filtro per categoria e ricerca testuale
- **Gestione tab**: Apertura, chiusura e navigazione tra tab
- **Responsive design**: Adattamento automatico alla dimensione dello schermo

### TableRendererComponent (`table-renderer.component.ts`)
Componente generico per il rendering delle tabelle che:
- **Gestisce diversi tipi di tabelle**: Switch automatico basato su `tableId`
- **Dati fake integrati**: Per testing e sviluppo
- **Colonne dinamiche**: Configurazione automatica delle colonne per ogni tipo di tabella
- **Paginazione integrata**: MatPaginator configurato per ogni tabella

## Categorie di Tabelle

### 🔒 Sicurezza (Security)
- **Scansioni Nmap**: Porte scansionate per container
- **IP Unici per Container**: Indirizzi IP unici per ogni container
- **Threat Intelligence**: Indicatori di minacce rilevate
- **Login Falliti**: Tentativi di accesso non autorizzati
- **Traffico Sospetto**: Attività di rete anomale

### 🌐 Network
- **Connessioni di Rete**: Connessioni attive tra container
- **Utilizzo Banda**: Consumo di banda per container
- **Query DNS**: Richieste DNS più frequenti
- **Analisi Protocolli**: Distribuzione protocolli di rete
- **Traffico Geografico**: Distribuzione geografica del traffico

### 💻 Sistema (System)
- **Salute Container**: Stato e metriche dei container
- **Utilizzo Risorse**: CPU, memoria e storage per container
- **Log Errori**: Errori sistema più frequenti
- **Disponibilità Servizi**: Uptime e downtime dei servizi

### 📊 Analytics
- **Attività Utenti**: Pattern di utilizzo degli utenti
- **Utilizzo API**: Statistiche chiamate API
- **Flusso Dati**: Movimento dati tra servizi
- **Rilevamento Anomalie**: Comportamenti anomali rilevati
- **Trend Performance**: Andamento prestazioni nel tempo
- **Report Compliance**: Verifica conformità sicurezza

## Funzionalità

### Sistema Tab
- ✅ **Apertura multipla**: Possibilità di aprire più tabelle contemporaneamente
- ✅ **Chiusura selettiva**: Chiudi singole tab con pulsante X
- ✅ **Navigazione**: Click per passare tra tab attive
- ✅ **Scroll orizzontale**: Navigazione automatica quando ci sono molte tab
- ✅ **Indicatori visivi**: Icone per categoria e stato attivo

### Ricerca e Filtri
- ✅ **Ricerca testuale**: Filtra tabelle per nome o descrizione
- ✅ **Filtro categoria**: Visualizza solo tabelle di una categoria specifica
- ✅ **Feedback visivo**: Evidenziazione tabelle già aperte

### Responsive Design
- ✅ **Desktop**: Layout a griglia ottimizzato
- ✅ **Tablet**: Adattamento colonne e spazi
- ✅ **Mobile**: Layout verticale e controlli touch-friendly

## Integrazioni Future

### Collegamento con OpenSearch
Attualmente utilizza dati fake. Per integrare con OpenSearch:

1. **Modifica `TableRendererComponent.loadTableData()`**:
   ```typescript
   case 'nmap-scans':
     this.osService.getScanNmap('test').subscribe({
       next: (res) => this.processNmapData(res),
       error: () => this.loading = false
     });
     break;
   ```

2. **Aggiungi nuovi metodi al `OpenSearchService`**:
   ```typescript
   getThreatIntelligence() { /* query aggregation */ }
   getNetworkConnections() { /* query aggregation */ }
   // etc...
   ```

### Espansione Tabelle
Per aggiungere nuove tabelle:

1. **Aggiungi definizione in `availableTables`**
2. **Crea case nel switch di `loadTableData()`**
3. **Definisci colonne appropriate**
4. **Aggiungi stili specifici se necessari**

## Stili e Temi

### Colori per Categoria
- **Sicurezza**: Rosso (#c62828, #ffebee)
- **Network**: Blu (#1976d2, #e3f2fd)
- **Sistema**: Viola (#7b1fa2, #f3e5f5)
- **Analytics**: Verde (#388e3c, #e8f5e8)

### Componenti Stilizzati
- **Chips**: Per valori categorici e contatori
- **Code blocks**: Per IP, porte e username
- **Status indicators**: Per severità e stati
- **Icons**: Materiale Design per categorie e azioni

## Performance

### Ottimizzazioni Implementate
- **trackBy**: Per performance rendering liste
- **Lazy loading**: Solo tabelle attive caricano dati
- **Virtual scrolling**: Ready per implementazione futura
- **Pagination**: Limitazione righe visualizzate

### Suggerimenti
- Limitare tab aperte simultaneamente (max 5-7)
- Implementare cache per query frequenti
- Considerare debouncing per ricerca live
