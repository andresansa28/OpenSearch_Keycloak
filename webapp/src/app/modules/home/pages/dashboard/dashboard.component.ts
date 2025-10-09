import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { OpenSearchService } from 'src/app/services/opensearch.service';
import { AuthService } from 'src/app/shared/services/authService';


interface DashboardTable {
  id: string;
  name: string;
  description?: string;
  type?: string;
}

// Interfaccia per i range temporali preconfigurati
interface TimeRange {
  label: string;
  value: string;
  from: string;
  to: string;
}

// Interfaccia per il range temporale personalizzato
interface CustomTimeRange {
  from: string | Date;
  to: string | Date;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class HomeComponent implements OnInit, OnDestroy {

  tenants: string[] = [];
  selectedTenant: string | null = null;
  viewMode = "";
  // Gestione del range temporale
  selectedTimeRange: string = 'last_24h';
  customTimeRange: CustomTimeRange = {
    from: '',
    to: ''
  };
  isCustomTimeRange: boolean = false;

  // Cache del range temporale per evitare ricalcoli
  private currentTimeRangeCache: { from: string; to: string } | null = null;
  private lastTimeRangeString: string = '';

  // Range temporali preconfigurati
  predefinedTimeRanges: TimeRange[] = [
    {
      label: 'Ultimi 15 minuti',
      value: 'last_15m',
      from: 'now-15m',
      to: 'now'
    },
    {
      label: 'Ultima ora',
      value: 'last_1h',
      from: 'now-1h',
      to: 'now'
    },
    {
      label: 'Ultime 24 ore',
      value: 'last_24h',
      from: 'now-24h',
      to: 'now'
    },
    {
      label: 'Ultimi 7 giorni',
      value: 'last_7d',
      from: 'now-7d',
      to: 'now'
    },
    {
      label: 'Ultimi 30 giorni',
      value: 'last_30d',
      from: 'now-30d',
      to: 'now'
    },
    {
      label: 'Personalizzato',
      value: 'custom',
      from: '',
      to: ''
    }
  ];

  availableTables: DashboardTable[] = [
    {
      id: 'top10-actors-modbus-s7comm',
      name: 'Top 10 Modbus-S7comm interactions',
      description: 'Top 10 attori coinvolti in attività su Modbus o S7comm',
      type: 'generic-table'
    },
    {
      id: 'top10-actors-allInteractions',
      name: 'Top 10 All Interactions',
      description: 'Top 10 attori coinvolti in qualunque tipo di traffico',
      type: 'generic-table'
    },
    {
      id: 'top10-actors-itInteractions',
      name: 'Top 10 IT interactions',
      description: 'Top 10 attori coinvolti in traffico IT (HTTP, Kerberos, ecc)',
      type: 'generic-table'
    }
  ];


  activeTables: DashboardTable[] = [];
  selectedTabIndex = 0;
  private gridStyle: { [key: string]: string } = {};

  // Variabili per gestire le selezioni nelle modalità
  selectedTop10Items: string[] = [];
  selectedGraphicsItems: string[] = [];

  // Lista delle Top 10 disponibili (filtrate da availableTables)
  get availableTop10Tables(): DashboardTable[] {
    return this.availableTables.filter(table => table.type === 'generic-table');
  }

  // Lista dei grafici disponibili (placeholder per ora)
  availableGraphics: DashboardTable[] = [
    {
      id: 'network-timeline',
      name: 'Timeline di Rete',
      description: 'Andamento del traffico nel tempo',
      type: 'chart'
    },
    {
      id: 'threat-distribution',
      name: 'Distribuzione Minacce',
      description: 'Pie chart delle tipologie di minacce',
      type: 'chart'
    },
    {
      id: 'geographic-heatmap',
      name: 'Mappa di Calore Geografica',
      description: 'Heatmap delle minacce per zona geografica',
      type: 'chart'
    },
    {
      id: 'unique-ip',
      name: 'IP Unici',
      description: 'Distribuzione IP per container e tipo traffico',
      type: 'unique-ip'
    }
  ];

  constructor(
    private osService: OpenSearchService,
    private authService: AuthService
  ) { }

  /**
   * Ottiene le date di default per il range personalizzato (ultime 24 ore)
   */
  private getDefaultCustomTimeRange(): CustomTimeRange {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    return {
      from: yesterday.toISOString().slice(0, 16), // Formato datetime-local
      to: now.toISOString().slice(0, 16)
    };
  }

  ngOnInit(): void {
    // Inizializza le date personalizzate
    this.customTimeRange = this.getDefaultCustomTimeRange();

    const token = this.authService.getToken();
    this.osService.getTenants(token).subscribe({
      next: (value) => {
        console.log(value);
        this.tenants = Object.keys(value);
      },
    });

    // Inizializza la cache del range temporale
    this.updateTimeRangeCache();
  }

  selectTenant(tenant: string): void {
    this.selectedTenant = tenant;
    this.activeTables = [];
    // Reset del range temporale quando si cambia tenant
    this.selectedTimeRange = 'last_24h';
    this.isCustomTimeRange = false;

    // Reset delle date custom
    this.customTimeRange = this.getDefaultCustomTimeRange();

    // Reset delle selezioni
    this.selectedTop10Items=[];
    this.selectedGraphicsItems=[];
  }

  /**
   * Gestisce il cambio del range temporale
   */
  onTimeRangeChange(rangeValue: string): void {
    this.selectedTimeRange = rangeValue;
    this.isCustomTimeRange = rangeValue === 'custom';

    if (!this.isCustomTimeRange) {
      // Aggiorna la cache e le tabelle
      this.updateTimeRangeCache();
      this.refreshAllActiveTables();
    }
  }

  /**
   * Converte una data in formato ISO string, gestendo sia stringhe che Date
   */
  private toISOString(dateValue: string | Date): string {
    if (typeof dateValue === 'string') {
      // Se è una stringa, assumiamo sia in formato datetime-local
      return new Date(dateValue).toISOString();
    }
    return dateValue.toISOString();
  }

  /**
   * Valida che le date custom siano corrette
   */
  private validateCustomTimeRange(): boolean {
    if (!this.customTimeRange.from || !this.customTimeRange.to) {
      return false;
    }

    const fromDate = new Date(this.customTimeRange.from);
    const toDate = new Date(this.customTimeRange.to);

    return fromDate < toDate && !isNaN(fromDate.getTime()) && !isNaN(toDate.getTime());
  }

  /**
   * Applica il range temporale personalizzato
   */
  applyCustomTimeRange(): void {
    if (!this.isCustomTimeRange) return;

    if (!this.validateCustomTimeRange()) {
      alert('Inserisci date valide. La data di inizio deve essere precedente alla data di fine.');
      return;
    }

    this.updateTimeRangeCache();
    this.refreshAllActiveTables();
  }

  /**
   * Aggiorna la cache del range temporale
   */
  private updateTimeRangeCache(): void {
    const newRange = this.calculateCurrentTimeRange();
    const newRangeString = JSON.stringify(newRange);

    // Aggiorna solo se il range è effettivamente cambiato
    if (newRangeString !== this.lastTimeRangeString) {
      this.currentTimeRangeCache = newRange;
      this.lastTimeRangeString = newRangeString;
    }
  }

  /**
   * Calcola il range temporale corrente senza cache
   */
  private calculateCurrentTimeRange(): { from: string; to: string } {
    if (this.isCustomTimeRange) {
      return {
        from: this.toISOString(this.customTimeRange.from),
        to: this.toISOString(this.customTimeRange.to)
      };
    }

    const selectedRange = this.predefinedTimeRanges.find(r => r.value === this.selectedTimeRange);
    if (selectedRange) {
      return {
        from: selectedRange.from,
        to: selectedRange.to
      };
    }

    // Fallback: ultime 24 ore
    return {
      from: 'now-24h',
      to: 'now'
    };
  }

  /**
   * Ottiene il range temporale corrente (versione cached per il template)
   */
  getCurrentTimeRange(): { from: string; to: string } {
    if (!this.currentTimeRangeCache) {
      this.updateTimeRangeCache();
    }
    return this.currentTimeRangeCache!;
  }

  /**
   * Forza il refresh di tutte le tabelle attive con il nuovo range temporale
   * IMPORTANTE: Usa debouncing per evitare chiamate multiple
   */
  private refreshAllActiveTables(): void {
    if (this.activeTables.length === 0) return;

    // Debouncing: evita refresh multipli in sequenza rapida
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }

    this.refreshTimeout = setTimeout(() => {
      console.log('🔄 Refreshing tables with new time range:', this.getCurrentTimeRange());

      // Crea una copia per forzare il change detection
      const currentTables = [...this.activeTables];
      this.activeTables = [];

      // Usa un timeout più lungo per assicurarsi che i componenti si resettino
      setTimeout(() => {
        this.activeTables = currentTables;
      }, 50);
    }, 300); // 300ms di debouncing
  }

  private refreshTimeout: any;


  ngOnDestroy(): void {
    // Pulisci i timeout per evitare memory leaks
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }
  }

  
/**
 * Toggle selezione di un item Top 10
 */
toggleTop10Item(itemId: string): void {
  const index = this.selectedTop10Items.indexOf(itemId);
  if (index !== -1) {
    this.selectedTop10Items.splice(index, 1);
  } else {
    this.selectedTop10Items.push(itemId);
  }
}

/**
 * Verifica se un item Top 10 è selezionato
 */
isTop10ItemSelected(itemId: string): boolean {
  return this.selectedTop10Items.includes(itemId);
}

/**
 * Toggle selezione di un item Grafico
 */
toggleGraphicsItem(itemId: string): void {
  const index = this.selectedGraphicsItems.indexOf(itemId);
  if (index !== -1) {
    this.selectedGraphicsItems.splice(index, 1);
  } else {
    this.selectedGraphicsItems.push(itemId);
  }
}

/**
 * Verifica se un item Grafico è selezionato
 */
isGraphicsItemSelected(itemId: string): boolean {
  return this.selectedGraphicsItems.includes(itemId);
}

/**
 * Ottiene le tabelle Top 10 selezionate, nell’ordine in cui sono state selezionate
 */
getSelectedTop10Tables(): DashboardTable[] {
  return this.selectedTop10Items
    .map(id => this.availableTop10Tables.find(t => t.id === id))
    .filter((t): t is DashboardTable => !!t);
}

/**
 * Ottiene i grafici selezionati, nell’ordine in cui sono stati selezionati
 */
getSelectedGraphics(): DashboardTable[] {
  return this.selectedGraphicsItems
    .map(id => this.availableGraphics.find(t => t.id === id))
    .filter((t): t is DashboardTable => !!t);
  }
}