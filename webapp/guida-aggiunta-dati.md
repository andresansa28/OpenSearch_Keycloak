# Guida Completa all'Aggiunta di Nuove Tabelle nel Dashboard

Questa guida descrive dettagliatamente la procedura per aggiungere un nuovo componente-tabella al dashboard in modo modulare, seguendo l'architettura esistente.

## 📋 Prerequisiti

Prima di iniziare, assicurati di avere:
- Conoscenza di Angular e TypeScript
- Familiarità con Angular Material e RxJS
- Accesso al backend OpenSearch per testare le API

## 🚀 Procedura Completa

Per aggiungere una nuova tabella (ad esempio, una tabella per gli scan di Nmap), segui questi 5 passaggi dettagliati:

### 1. 📁 Struttura delle Directory

Prima di tutto, crea la struttura delle directory per il tuo nuovo componente:

```bash
webapp/src/app/modules/home/pages/tables/
└── il-tuo-componente/
    ├── il-tuo-componente.component.ts
    ├── il-tuo-componente.component.html
    ├── il-tuo-componente.component.scss
    └── (opzionale) il-tuo-componente.component.spec.ts
```

**Esempio per "Nmap Scans":**
```bash
webapp/src/app/modules/home/pages/tables/
└── nmap-scans/
    ├── nmap-scans.component.ts
    ├── nmap-scans.component.html
    ├── nmap-scans.component.scss
    └── nmap-scans.component.spec.ts
```

### 2. 🎯 Crea il Componente TypeScript

**File**: `webapp/src/app/modules/home/pages/tables/nmap-scans/nmap-scans.component.ts`

```typescript
import { ChangeDetectorRef, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { OpenSearchService } from 'src/app/services/opensearch.service';

@Component({
  selector: 'app-nmap-scans',
  templateUrl: './nmap-scans.component.html',
  styleUrls: ['./nmap-scans.component.scss']
})
export class NmapScansComponent implements OnChanges {

  @Input() tenant: string | null = null;

  // ID univoco per identificare questo tipo di tabella nel backend
  id = "nmap-scans";

  // Stati del componente
  isLoading = true;
  hasError = false;
  tableData: any[] = [];
  
  // Colonne da visualizzare nella tabella (personalizza secondo i tuoi dati)
  displayedColumns: string[] = ['target', 'port', 'service', 'status', 'timestamp'];

  constructor(
    private osService: OpenSearchService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tenant'] && this.tenant) {
      console.log('Tenant cambiato:', this.tenant);
      this.fetchData();
    }
  }

  /**
   * Recupera i dati dal backend OpenSearch
   */
  fetchData(): void {
    if (!this.tenant) return;

    this.isLoading = true;
    this.hasError = false;
    this.tableData = [];

    this.osService.getTable(this.tenant, this.id).pipe(
      finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (res: any) => {
        try {
          // PERSONALIZZA QUESTA PARTE SECONDO LA STRUTTURA DEI TUOI DATI
          // Esempio per dati di Nmap:
          const hits = res?.hits?.hits;
          if (!Array.isArray(hits)) {
            console.error("Formato hits non valido");
            this.hasError = true;
            return;
          }

          const structuredData: any[] = [];

          for (const hit of hits) {
            const source = hit._source;
            
            structuredData.push({
              target: source.target_ip || 'N/A',
              port: source.port || 'N/A',
              service: source.service || 'Unknown',
              status: source.status || 'Unknown',
              timestamp: source['@timestamp'] || new Date().toISOString(),
              // Aggiungi altri campi secondo necessità
            });
          }

          this.tableData = structuredData;
          console.log('Dati Nmap caricati:', this.tableData.length, 'record');

        } catch (err) {
          console.error("Errore nel parsing dei dati Nmap:", err);
          this.hasError = true;
        }
      },
      error: (err) => {
        console.error('Errore nella richiesta Nmap:', err);
        this.hasError = true;
      }
    });
  }

  /**
   * Metodo di utilità per formattare le date (opzionale)
   */
  formatDate(dateString: string): string {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  }

  /**
   * Metodo per refresh manuale dei dati (opzionale)
   */
  refreshData(): void {
    this.fetchData();
  }
}
```

### 3. 🎨 Crea il Template HTML

**File**: `webapp/src/app/modules/home/pages/tables/nmap-scans/nmap-scans.component.html`

```html
<div class="table-container">
  <!-- Stato di Caricamento -->
  <div *ngIf="isLoading" class="status-indicator">
    <mat-spinner diameter="50"></mat-spinner>
    <p>Caricamento scan Nmap...</p>
  </div>

  <!-- Stato di Errore -->
  <div *ngIf="!isLoading && hasError" class="status-indicator error">
    <mat-icon>error_outline</mat-icon>
    <p>Errore nel caricamento degli scan Nmap. Riprova più tardi.</p>
    <button mat-raised-button color="primary" (click)="refreshData()">
      <mat-icon>refresh</mat-icon>
      Riprova
    </button>
  </div>

  <!-- Stato con Dati -->
  <div *ngIf="!isLoading && !hasError && tableData.length > 0" class="data-container">
    
    <!-- Header con info aggiuntive (opzionale) -->
    <div class="table-header">
      <h4>Scan Nmap - {{ tableData.length }} risultati</h4>
      <button mat-icon-button (click)="refreshData()" [title]="'Aggiorna dati'">
        <mat-icon>refresh</mat-icon>
      </button>
    </div>

    <!-- Tabella principale -->
    <div class="table-wrapper">
      <table mat-table [dataSource]="tableData" class="mat-elevation-z8">
        
        <!-- Colonna Target IP -->
        <ng-container matColumnDef="target">
          <th mat-header-cell *matHeaderCellDef>Target IP</th>
          <td mat-cell *matCellDef="let element">{{ element.target }}</td>
        </ng-container>

        <!-- Colonna Porta -->
        <ng-container matColumnDef="port">
          <th mat-header-cell *matHeaderCellDef>Porta</th>
          <td mat-cell *matCellDef="let element">{{ element.port }}</td>
        </ng-container>

        <!-- Colonna Servizio -->
        <ng-container matColumnDef="service">
          <th mat-header-cell *matHeaderCellDef>Servizio</th>
          <td mat-cell *matCellDef="let element">
            <span [class]="'service-' + element.service.toLowerCase()">
              {{ element.service }}
            </span>
          </td>
        </ng-container>

        <!-- Colonna Status -->
        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Stato</th>
          <td mat-cell *matCellDef="let element">
            <mat-chip [class]="'status-' + element.status.toLowerCase()">
              {{ element.status }}
            </mat-chip>
          </td>
        </ng-container>

        <!-- Colonna Timestamp -->
        <ng-container matColumnDef="timestamp">
          <th mat-header-cell *matHeaderCellDef>Data/Ora</th>
          <td mat-cell *matCellDef="let element">{{ formatDate(element.timestamp) }}</td>
        </ng-container>

        <!-- Header e Righe -->
        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>
    </div>
  </div>

  <!-- Stato Vuoto -->
  <div *ngIf="!isLoading && !hasError && tableData.length === 0" class="status-indicator empty">
    <mat-icon>info_outline</mat-icon>
    <p>Nessuno scan Nmap disponibile per il tenant selezionato.</p>
  </div>
</div>
```

### 4. 🎨 Crea gli Stili CSS

**File**: `webapp/src/app/modules/home/pages/tables/nmap-scans/nmap-scans.component.scss`

```scss
.table-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 1rem;
}

.status-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: rgba(0, 0, 0, 0.6);
  min-height: 200px;
  flex: 1;

  &.error {
    color: #f44336;

    button {
      margin-top: 1rem;
    }
  }

  &.empty {
    color: rgba(0, 0, 0, 0.4);
  }

  mat-icon {
    font-size: 48px;
    width: 48px;
    height: 48px;
  }

  p {
    text-align: center;
    margin: 0;
  }
}

.data-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding: 0 0.5rem;

  h4 {
    margin: 0;
    color: rgba(0, 0, 0, 0.87);
  }
}

.table-wrapper {
  flex: 1;
  overflow: auto;
  border-radius: 8px;

  table {
    width: 100%;
  }

  .mat-column-target {
    font-family: 'Courier New', monospace;
    font-weight: bold;
  }

  .mat-column-port {
    text-align: center;
    font-weight: bold;
  }

  .mat-column-timestamp {
    font-size: 0.9em;
    color: rgba(0, 0, 0, 0.6);
  }
}

// Stili per servizi
.service-ssh { color: #2196F3; }
.service-http { color: #4CAF50; }
.service-https { color: #4CAF50; font-weight: bold; }
.service-ftp { color: #FF9800; }
.service-unknown { color: rgba(0, 0, 0, 0.6); }

// Stili per status
.status-open {
  background-color: #C8E6C9 !important;
  color: #2E7D32 !important;
}

.status-closed {
  background-color: #FFCDD2 !important;
  color: #C62828 !important;
}

.status-filtered {
  background-color: #FFF3E0 !important;
  color: #F57C00 !important;
}

.status-unknown {
  background-color: #F5F5F5 !important;
  color: rgba(0, 0, 0, 0.6) !important;
}

// Responsive
@media (max-width: 768px) {
  .table-container {
    padding: 0.5rem;
  }

  .table-header h4 {
    font-size: 1rem;
  }

  .mat-column-timestamp {
    display: none;
  }
}
```

### 5. 📝 Dichiara il Componente nel Modulo

**File**: `webapp/src/app/modules/home/home.module.ts`

Aggiungi il tuo nuovo componente alle dichiarazioni del modulo:

```typescript
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxPermissionsModule } from 'ngx-permissions';
import { CardModule } from "primeng/card";
import { MaterialModule } from 'src/app/shared/material-module';
import { HomeRoutingModule } from "./home-routing.module";
import { HomeComponent } from "./pages/dashboard/dashboard.component";
import { UniqueIpContainerComponent } from './pages/tables/unique-ip-container/unique-ip-container.component';
import { NmapScansComponent } from './pages/tables/nmap-scans/nmap-scans.component'; // <-- IMPORTA QUI

@NgModule({
  declarations: [
    HomeComponent,
    UniqueIpContainerComponent,
    NmapScansComponent // <-- AGGIUNGI QUI
    // Aggiungi qui altri componenti tabella man mano che vengono creati
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HomeRoutingModule,
    CardModule,
    NgxPermissionsModule.forChild(),
    MaterialModule
  ],
})
export class HomeModule { }
```

### 6. 🎛️ Registra la Tabella nel Dashboard

**File**: `webapp/src/app/modules/home/pages/dashboard/dashboard.component.ts`

Aggiungi la tua tabella all'array `availableTables` con le informazioni sul layout:

```typescript
// Nel metodo dove definisci availableTables
availableTables: DashboardTable[] = [
  {
    id: 'unique-ip',
    name: 'Unique IPs',
    layoutType: TableLayoutType.EXTRA_TALL,
    description: 'Tabella degli IP unici rilevati'
  },
  {
    id: 'nmap-scans', // <-- DEVE CORRISPONDERE al valore 'id' nel componente
    name: 'Nmap Scans',
    layoutType: TableLayoutType.WIDE_TALL, // <-- SCEGLI IL LAYOUT APPROPRIATO
    description: 'Risultati degli scan di rete Nmap'
  },
  {
    id: 'threat-intelligence',
    name: 'Threat Intelligence',
    layoutType: TableLayoutType.LARGE,
    description: 'Intelligence sulle minacce'
  },
  // ... altre tabelle
];
```

**🎯 Tipi di Layout Disponibili:**
- `TableLayoutType.SMALL` - 1x1: Tabella piccola (200-300px)
- `TableLayoutType.MEDIUM` - 1x2: Tabella media (350-450px)
- `TableLayoutType.LARGE` - 2x1: Tabella larga (300-400px)
- `TableLayoutType.TALL` - 1x3: Tabella alta (600-800px)
- `TableLayoutType.EXTRA_TALL` - 1x4: Tabella molto alta (800-1000px)
- `TableLayoutType.WIDE_TALL` - 2x2: Tabella larga e alta (500-650px)
- `TableLayoutType.EXTRA_WIDE` - 3x1: Tabella extra larga (300-400px)

### 7. 🖼️ Aggiungi il Componente al Template Dashboard

**File**: `webapp/src/app/modules/home/pages/dashboard/dashboard.component.html`

Aggiungi il tuo componente al switch statement:

```html
<!-- Contenuto della Card -->
<div class="item-content">
  <ng-container [ngSwitch]="table.id">
    <app-unique-ip-container 
      *ngSwitchCase="'unique-ip'" 
      [tenant]="selectedTenant">
    </app-unique-ip-container>
    
    <!-- AGGIUNGI QUI IL TUO NUOVO COMPONENTE -->
    <app-nmap-scans 
      *ngSwitchCase="'nmap-scans'" 
      [tenant]="selectedTenant">
    </app-nmap-scans>
    
    <!-- Placeholder per le altre tabelle -->
    <div *ngSwitchCase="'threat-intelligence'" class="placeholder-content">
      <mat-icon>security</mat-icon>
      <h4>Threat Intelligence</h4>
      <p>Componente in fase di sviluppo...</p>
    </div>
    
    <!-- Altri componenti... -->
    
    <div *ngSwitchDefault class="placeholder-content">
      <mat-icon>help</mat-icon>
      <h4>{{ table.name }}</h4>
      <p>Componente non ancora implementato</p>
    </div>
  </ng-container>
</div>
```

## 🔧 Configurazione Backend (Opzionale)

Se hai bisogno di aggiungere nuovi endpoint al backend, modifica il servizio OpenSearch:

**File**: `webapp/src/app/services/opensearch.service.ts`

```typescript
// Aggiungi metodi specifici se necessario
getNmapScans(tenant: string) {
  let queryParams = new HttpParams();
  queryParams = queryParams.append("tenant", tenant);
  return this.httpClient.get(this.url + "/api/nmap_scans", { params: queryParams });
}

// Oppure usa il metodo generico getTable() con id appropriato
// Il componente userà: this.osService.getTable(tenant, "nmap-scans")
```

## 🧪 Test del Componente

1. **Avvia l'applicazione**: `ng serve`
2. **Seleziona un tenant** nel dashboard
3. **Attiva la tua tabella** dai chip di selezione
4. **Verifica**:
   - Stati di caricamento
   - Gestione errori
   - Visualizzazione dati
   - Layout responsive

## 📋 Checklist Finale

- [ ] ✅ Componente creato in `tables/[nome-componente]/`
- [ ] ✅ File TypeScript con logica di fetching dati
- [ ] ✅ Template HTML con stati (loading, error, data, empty)
- [ ] ✅ Stili SCSS responsive e tematizzati
- [ ] ✅ Componente dichiarato in `home.module.ts`
- [ ] ✅ Tabella registrata in `availableTables`
- [ ] ✅ Componente aggiunto al template dashboard
- [ ] ✅ Layout type appropriato selezionato
- [ ] ✅ Backend endpoint configurato (se necessario)
- [ ] ✅ Test funzionale completato

## 🎯 Esempi di Implementazione

### Esempio 1: Tabella Semplice (Log di Sistema)
```typescript
// ID per il backend
id = "system-logs";

// Layout consigliato
layoutType: TableLayoutType.TALL

// Colonne tipiche
displayedColumns: string[] = ['timestamp', 'level', 'message', 'source'];
```

### Esempio 2: Tabella Complessa (Threat Intelligence)
```typescript
// ID per il backend
id = "threat-intelligence";

// Layout consigliato
layoutType: TableLayoutType.WIDE_TALL

// Colonne tipiche
displayedColumns: string[] = ['indicator', 'type', 'confidence', 'source', 'first_seen', 'last_seen'];
```

### Esempio 3: Dashboard Widgets
```typescript
// Per widget/grafici piccoli
layoutType: TableLayoutType.SMALL

// Per mappe geografiche
layoutType: TableLayoutType.EXTRA_WIDE
```

## 🐛 Risoluzione Problemi

### Problema: Componente non appare
- ✅ Verifica che il componente sia dichiarato in `home.module.ts`
- ✅ Controlla che l'`id` corrisponda tra componente e `availableTables`
- ✅ Assicurati che ci sia un `*ngSwitchCase` nel template

### Problema: Dati non si caricano
- ✅ Verifica la console browser per errori API
- ✅ Controlla che l'`id` nel componente corrisponda al backend
- ✅ Verifica che il tenant sia correttamente passato

### Problema: Layout non corretto
- ✅ Verifica il `TableLayoutType` scelto
- ✅ Controlla che gli stili CSS siano corretti
- ✅ Assicurati che non ci siano conflitti con altri CSS

Seguendo questa guida dettagliata, dovresti essere in grado di creare e integrare qualsiasi nuovo componente tabella nel dashboard in modo pulito e mantenibile! 🚀

## 🕐 Sistema di Range Temporali

### Frontend - Input del Componente

Ogni componente tabella deve accettare il range temporale come input:

```typescript
export class TuoComponente implements OnChanges {
  @Input() tenant: string | null = null;
  @Input() timeRange: { from: string; to: string } | null = null; // <-- AGGIUNGERE

  ngOnChanges(changes: SimpleChanges): void {
    // Reagisce ai cambi di entrambi i parametri
    if ((changes['tenant'] && this.tenant) || (changes['timeRange'] && this.timeRange)) {
      this.fetchData();
    }
  }

  fetchData(): void {
    if (!this.tenant || !this.timeRange) return;
    
    // Passa il timeRange al servizio
    this.osService.getTable(this.tenant, this.id, this.timeRange).pipe(...)
  }
}
```

### Template Dashboard

Nel template del dashboard, passa il range temporale:

```html
<app-tuo-componente 
  *ngSwitchCase="'tuo-id'" 
  [tenant]="selectedTenant"
  [timeRange]="getCurrentTimeRange()">
</app-tuo-componente>
```

### Backend - Handler Tabella

Aggiorna il tuo handler Python per accettare il range temporale:

```python
from datetime import datetime

def convert_time_range(time_range):
    """Converte il range temporale dal frontend al formato ElasticSearch"""
    if not time_range:
        return {
            "gte": "now-24h",
            "lte": "now", 
            "format": "strict_date_optional_time"
        }
    
    from_time = time_range.get("from", "now-24h")
    to_time = time_range.get("to", "now")
    
    return {
        "gte": from_time,
        "lte": to_time,
        "format": "strict_date_optional_time"
    }

async def get_data(tenant: str, time_range: dict = None):
    index_name = f"{tenant}_tuoi_dati"
    headers = {"security_tenant": tenant}
    
    # Converti il range temporale
    time_filter = convert_time_range(time_range)
    
    query = {
        # ... tua query
        "query": {
            "bool": {
                "filter": [
                    {"match_all": {}},
                    {
                        "range": {
                            "timestamp_field": time_filter  # <-- USA IL RANGE DINAMICO
                        }
                    }
                ]
            }
        }
    }
    
    # ... resto della logica
```

### Range Temporali Supportati

Il sistema supporta:

- **Predefiniti**: `now-15m`, `now-1h`, `now-24h`, `now-7d`, `now-30d` 
- **Personalizzati**: Date ISO format (`2025-01-01T00:00:00.000Z`)

Questo sistema garantisce che tutte le tabelle utilizzino lo stesso arco temporale selezionato dall'utente! ⏰
