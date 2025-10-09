# 📐 Guida Completa al Sistema di Layout Dinamico

Questa guida spiega in dettaglio come funziona e come modificare il sistema di layout dinamico per le tabelle del dashboard.

## 🎯 Panoramica del Sistema

Il sistema di layout dinamico utilizza un algoritmo avanzato di **bin packing** combinato con **CSS Grid** per ottimizzare automaticamente la disposizione delle tabelle, minimizzando gli spazi vuoti e creando un layout pulito e responsivo.

## 🏗️ Architettura del Sistema

### 1. **Enum dei Tipi di Layout**

**File**: `dashboard.component.ts`

```typescript
export enum TableLayoutType {
  SMALL = 'small',           // 1x1 - 200-300px
  MEDIUM = 'medium',         // 1x2 - 350-450px  
  LARGE = 'large',           // 2x1 - 300-400px
  TALL = 'tall',             // 1x3 - 600-800px
  EXTRA_TALL = 'extra-tall', // 1x4 - 800-1000px
  WIDE_TALL = 'wide-tall',   // 2x2 - 500-650px
  EXTRA_WIDE = 'extra-wide'  // 3x1 - 300-400px
}
```

### 2. **Interfaccia DashboardTable**

```typescript
interface DashboardTable {
  id: string;                    // Identificatore univoco
  name: string;                  // Nome visualizzato
  layoutType: TableLayoutType;   // Tipo di layout
  description?: string;          // Descrizione opzionale
}
```

## 🔧 Funzioni Principali del Sistema

### 1. **getOptimizedTables()** - Punto di Ingresso

```typescript
getOptimizedTables(): DashboardTable[] {
  if (this.activeTables.length === 0) return [];
  return this.calculateOptimalLayout();
}
```

Questa è la funzione chiamata dal template per ottenere l'ordine ottimizzato delle tabelle.

### 2. **calculateOptimalLayout()** - Algoritmo Principale

```typescript
private calculateOptimalLayout(): DashboardTable[] {
  if (this.activeTables.length <= 1) {
    return [...this.activeTables];
  }

  const columns = this.calculateOptimalColumns();
  
  // Per poche tabelle, usa algoritmo semplificato
  if (this.activeTables.length <= 3) {
    return this.simpleLayoutOptimization();
  }
  
  // Per molte tabelle, usa bin packing
  return this.binPackingLayout(columns);
}
```

**Strategia**:
- **1 tabella**: Restituisce così com'è
- **2-3 tabelle**: Algoritmo semplificato di alternanza
- **4+ tabelle**: Algoritmo complesso di bin packing

### 3. **calculateOptimalColumns()** - Calcolo Colonne

```typescript
private calculateOptimalColumns(): number {
  const screenWidth = window.innerWidth;
  
  if (screenWidth < 480) return 1;
  if (screenWidth < 768) return 2;
  if (screenWidth < 1200) return 3;
  
  // Per schermi grandi, considera il contenuto
  const hasWideItems = this.activeTables.some(table => 
    table.layoutType === TableLayoutType.LARGE || 
    table.layoutType === TableLayoutType.WIDE_TALL ||
    table.layoutType === TableLayoutType.EXTRA_WIDE
  );
  
  if (this.activeTables.length === 0) return 1;
  if (this.activeTables.length <= 2 && !hasWideItems) return 2;
  if (this.activeTables.length <= 4) return hasWideItems ? 4 : 3;
  return 4;
}
```

## 🧮 Algoritmi di Ottimizzazione

### Algoritmo 1: **Semplificato** (2-3 tabelle)

```typescript
private simpleLayoutOptimization(): DashboardTable[] {
  const sortedTables = this.sortTablesByPriority();
  const result: DashboardTable[] = [];
  const wideItems: DashboardTable[] = [];
  const narrowItems: DashboardTable[] = [];
  
  // Separa elementi wide da narrow
  for (const table of sortedTables) {
    const dim = this.getTableDimensions(table);
    if (dim.width > 1 || dim.height > 2) {
      wideItems.push(table);
    } else {
      narrowItems.push(table);
    }
  }
  
  // Interlaccia per migliore riempimento
  const maxLength = Math.max(wideItems.length, narrowItems.length);
  for (let i = 0; i < maxLength; i++) {
    if (i < wideItems.length) result.push(wideItems[i]);
    if (i < narrowItems.length) result.push(narrowItems[i]);
  }
  
  return result;
}
```

### Algoritmo 2: **Bin Packing** (4+ tabelle)

```typescript
private binPackingLayout(columns: number): DashboardTable[] {
  const gridMap = this.createGridMap(columns);
  const sortedTables = this.sortTablesByPriority();
  const placedTables: DashboardTable[] = [];
  const unplacedTables: DashboardTable[] = [];
  
  // Prima passata: posiziona con dimensioni originali
  for (const table of sortedTables) {
    const dimensions = this.getTableDimensions(table);
    const position = this.findBestPositionWithScore(gridMap, dimensions, columns);
    
    if (position) {
      this.markGridOccupied(gridMap, position.position, dimensions);
      placedTables.push(table);
    } else {
      unplacedTables.push(table);
    }
  }
  
  // Seconda passata: ridimensiona elementi non posizionati
  for (const table of unplacedTables) {
    const reducedDimensions = this.getReducedDimensions(table);
    const position = this.findBestPosition(gridMap, reducedDimensions, columns);
    
    if (position) {
      this.markGridOccupied(gridMap, position, reducedDimensions);
      placedTables.push(table);
    }
  }
  
  return placedTables;
}
```

## 📊 Sistema di Punteggio Posizioni

```typescript
private calculatePositionScore(
  gridMap: boolean[][], 
  row: number, 
  col: number, 
  dimensions: { width: number; height: number }
): number {
  let score = 0;
  
  // Preferisce posizioni vicine ad altre tabelle
  for (let r = Math.max(0, row - 1); r <= Math.min(gridMap.length - 1, row + dimensions.height); r++) {
    for (let c = Math.max(0, col - 1); c <= Math.min(gridMap[0].length - 1, col + dimensions.width); c++) {
      if (gridMap[r][c]) {
        score += 10; // Bonus vicinanza
      }
    }
  }
  
  score -= row * 2;    // Penalizza posizioni in basso
  score -= col;        // Preferisce sinistra
  
  return score;
}
```

## 🎨 CSS Grid Dinamico

### CSS Base per il Grid

**File**: `dashboard.component.scss`

```scss
.dynamic-dashboard {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  grid-auto-rows: minmax(200px, auto);
  grid-auto-flow: row dense;
  gap: 1.5rem;
  padding: 1.5rem;
  width: 100%;
  box-sizing: border-box;
  align-items: start;
}
```

### Classi per i Tipi di Layout

```scss
.table-small {
  grid-column: span 1;
  grid-row: span 1;
  min-height: 200px;
  max-height: 300px;
}

.table-medium {
  grid-column: span 1;
  grid-row: span 2;
  min-height: 350px;
  max-height: 450px;
}

.table-large {
  grid-column: span 2;
  grid-row: span 1;
  min-height: 300px;
  max-height: 400px;
}

.table-tall {
  grid-column: span 1;
  grid-row: span 3;
  min-height: 600px;
  max-height: 800px;
}

.table-extra-tall {
  grid-column: span 1;
  grid-row: span 4;
  min-height: 800px;
  max-height: 1000px;
}

.table-wide-tall {
  grid-column: span 2;
  grid-row: span 2;
  min-height: 500px;
  max-height: 650px;
}

.table-extra-wide {
  grid-column: span 3;
  grid-row: span 1;
  min-height: 300px;
  max-height: 400px;
}
```

## 📱 Sistema Responsive

### Breakpoints Principali

```scss
/* Tablet - max-width: 1200px */
@media (max-width: 1200px) {
  .dynamic-dashboard {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
  
  .table-large, .table-wide-tall {
    grid-column: span 1;
    grid-row: span 2;
  }
  
  .table-extra-tall {
    grid-column: span 1;
    grid-row: span 3;
  }
}

/* Mobile - max-width: 768px */
@media (max-width: 768px) {
  .dashboard-item {
    grid-column: span 1 !important;
    grid-row: span 1 !important;
    min-height: 250px !important;
    max-height: 400px !important;
  }
}

/* Mobile Small - max-width: 480px */
@media (max-width: 480px) {
  .dynamic-dashboard {
    grid-template-columns: 1fr;
  }
  
  .dashboard-item {
    min-height: 200px !important;
    max-height: 350px !important;
  }
}
```

## 🔧 Come Personalizzare il Layout

### 1. Aggiungere un Nuovo Tipo di Layout

**Step 1**: Aggiungi all'enum

```typescript
export enum TableLayoutType {
  // ... tipi esistenti
  MEGA_WIDE = 'mega-wide'  // 4x1 - tabella larghissima
}
```

**Step 2**: Aggiungi CSS

```scss
.table-mega-wide {
  grid-column: span 4;
  grid-row: span 1;
  min-height: 250px;
  max-height: 350px;
}
```

**Step 3**: Aggiorna la logica dimensions

```typescript
private getTableDimensions(table: DashboardTable): { width: number; height: number } {
  switch (table.layoutType) {
    // ... casi esistenti
    case TableLayoutType.MEGA_WIDE: return { width: 4, height: 1 };
    default: return { width: 1, height: 1 };
  }
}
```

### 2. Modificare l'Algoritmo di Priorità

```typescript
private sortTablesByPriority(): DashboardTable[] {
  return [...this.activeTables].sort((a, b) => {
    const aDim = this.getTableDimensions(a);
    const bDim = this.getTableDimensions(b);
    
    // Personalizza la logica di ordinamento
    const aArea = aDim.width * aDim.height;
    const bArea = bDim.width * bDim.height;
    
    // Prima per area, poi per importanza custom
    if (aArea !== bArea) return bArea - aArea;
    
    // Aggiungi logica custom per specifici ID
    if (a.id === 'critical-alerts') return -1;
    if (b.id === 'critical-alerts') return 1;
    
    return 0;
  });
}
```

### 3. Aggiustare i Breakpoints

```typescript
private calculateOptimalColumns(): number {
  const screenWidth = window.innerWidth;
  
  // Modifica i breakpoints secondo necessità
  if (screenWidth < 600) return 1;    // Era 480
  if (screenWidth < 900) return 2;    // Era 768  
  if (screenWidth < 1400) return 3;   // Era 1200
  
  return 5; // Supporta fino a 5 colonne su schermi molto grandi
}
```

## 🐛 Debug e Monitoraggio

### Abilitare Debug Logging

Il sistema include logging dettagliato:

```typescript
private logLayoutInfo(): void {
  const columns = this.calculateOptimalColumns();
  const efficiency = this.calculateLayoutEfficiency();
  const optimizedTables = this.calculateOptimalLayout();
  
  console.group('🔧 Layout Dashboard Info');
  console.log('📊 Tabelle attive:', this.activeTables.length);
  console.log('📐 Colonne calcolate:', columns);
  console.log('⚡ Efficienza layout:', (efficiency * 100).toFixed(1) + '%');
  console.log('📋 Ordine ottimizzato:', optimizedTables.map(t => t.name));
  console.groupEnd();
}
```

### Calcolo Efficienza Layout

```typescript
private calculateLayoutEfficiency(): number {
  const columns = this.calculateOptimalColumns();
  let totalCells = 0;
  
  for (const table of this.activeTables) {
    const dimensions = this.getTableDimensions(table);
    totalCells += dimensions.width * dimensions.height;
  }
  
  const minRows = Math.ceil(totalCells / columns);
  const totalGridCells = minRows * columns;
  
  return totalCells / totalGridCells;
}
```

## 🎛️ Controlli Utente

### Ottimizzazione Manuale

L'utente può forzare la riottimizzazione:

```html
<button mat-raised-button color="primary" (click)="optimizeLayout()">
  <mat-icon>auto_fix_high</mat-icon>
  Ottimizza Layout
</button>
```

```typescript
optimizeLayout(): void {
  this.forceLayoutRecalculation();
  this.logLayoutInfo();
}

private forceLayoutRecalculation(): void {
  if (this.activeTables.length > 1) {
    const currentTables = [...this.activeTables];
    this.activeTables = [];
    
    setTimeout(() => {
      this.activeTables = currentTables;
      this.gridStyle = this.getGridColumnsStyle();
    }, 10);
  }
}
```

## 📈 Performance e Ottimizzazioni

### 1. Cache del Layout Style

```typescript
private gridStyle: { [key: string]: string } = {};

getGridColumnsStyle(): { [key: string]: string } {
  const columnCount = this.calculateOptimalColumns();
  this.gridStyle = {
    'display': 'grid',
    'grid-template-columns': `repeat(${columnCount}, minmax(350px, 1fr))`,
    'grid-auto-rows': 'minmax(200px, auto)',
    'grid-auto-flow': 'row dense',
    'gap': '1.5rem',
    'align-items': 'start'
  };
  return this.gridStyle;
}
```

### 2. Resize Handler Ottimizzato

```typescript
@HostListener('window:resize', ['$event'])
onResize(event: any) {
  this.gridStyle = this.getGridColumnsStyle();
  this.forceLayoutRecalculation();
}
```

## 💡 Best Practices

### 1. **Scelta del Layout Type**
- **SMALL**: Widget, indicatori, grafici semplici
- **MEDIUM**: Tabelle con pochi record, form
- **LARGE**: Tabelle larghe, dashboard charts
- **TALL**: Tabelle con molti record, liste lunghe
- **EXTRA_TALL**: Log files, grandi dataset
- **WIDE_TALL**: Mappe, grafici complessi
- **EXTRA_WIDE**: Timeline, dashboard panoramici

### 2. **Performance**
- Usa `OnChanges` invece di `OnInit` per reagire al cambio tenant
- Implementa `finalize()` per gestire loading states
- Cache i risultati quando possibile

### 3. **UX**
- Sempre gestire stati loading, error, empty
- Fornire feedback visivo durante le operazioni
- Permettere refresh manuale dei dati

Il sistema di layout dinamico è completamente personalizzabile e si adatta automaticamente a qualsiasi configurazione di tabelle, garantendo sempre un risultato ottimale! 🚀
