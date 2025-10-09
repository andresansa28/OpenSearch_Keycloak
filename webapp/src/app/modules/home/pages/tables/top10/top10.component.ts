import { ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { finalize } from 'rxjs';
import { OpenSearchService } from 'src/app/services/opensearch.service';


@Component({
  selector: 'app-top10',
  templateUrl: './top10.component.html',
  styleUrls: ['./top10.component.scss']
})

export class Top10Component implements OnDestroy, OnChanges {

  @Input() tenant: string | null = null;
  @Input() timeRange: { from: string; to: string } | null = null;

  // L'id viene passato dall'esterno per differenziare il tipo di query da eseguire
  @Input() id: string = '';

  isLoading = true;
  hasError = false;
  tableData: any[] = [];
  displayedColumns: string[] = ['position', 'actor', 'interactions', 'details']; // Popola questo array con le colonne che vuoi mostrare

  // Valore massimo per calcolare le percentuali nella barra
  private maxInteractions: number = 0;


  // Cache per evitare chiamate duplicate
  private lastRequestParams: string = '';
  private requestTimeout: any;

  constructor(
    private osService: OpenSearchService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['tenant'] && this.tenant) || (changes['timeRange'] && this.timeRange)) {
      // Crea una chiave unica per questa richiesta
      const currentParams = JSON.stringify({ tenant: this.tenant, timeRange: this.timeRange });

      // Evita chiamate duplicate
      if (currentParams === this.lastRequestParams) {
        console.log('Richiesta duplicata evitata per unique-ip');
        return;
      }

      this.lastRequestParams = currentParams;
      console.log('Tenant o TimeRange cambiato:', this.tenant, this.timeRange);

      // Debouncing per evitare chiamate multiple in rapida successione
      if (this.requestTimeout) {
        clearTimeout(this.requestTimeout);
      }

      this.requestTimeout = setTimeout(() => {
        this.fetchData();
      }, 100); // 100ms di debouncing
    }
  }

  ngOnDestroy(): void {
    // Pulisci i timeout per evitare memory leaks
    if (this.requestTimeout) {
      clearTimeout(this.requestTimeout);
    }
  }

  fetchData(): void {
    if (!this.tenant || !this.timeRange) {
      console.warn('Parametri mancanti per top-10-actors');
      return;
    }

    this.isLoading = true;
    this.hasError = false;
    this.tableData = [];

    this.osService.getTable(this.tenant, this.id, this.timeRange).pipe(
      finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (res: any) => {
        try {
          const buckets = res?.aggregations?.['actors']?.buckets;
          if (!Array.isArray(buckets)) {
            this.hasError = true;
            console.error('Formato aggregations non valido per top-10-actors');
            return;
          }

          this.tableData = buckets.map((bucket: any) => ({
            actor: bucket.key,
            uniqueIps: bucket.unique_ips?.buckets.map((ip: any) => ip.key) ?? [],
            totalInteractions: bucket.doc_count
          }));

          // Calcola il valore massimo per le barre percentuali
          this.maxInteractions = Math.max(...this.tableData.map(item => item.totalInteractions));

          console.log("Dati top10:", this.tableData);
        } catch (err) {
          console.error("Errore nel parsing dei dati per top-10-actors:", err);
          this.hasError = true;
        }
      },
      error: (err) => {
        console.error("Errore nella richiesta per top-10-actors:", err);
        this.hasError = true;
      }
    });
  }

  /**
   * Calcola la percentuale per la barra delle interazioni
   */
  getInteractionPercentage(interactions: number): number {
    if (this.maxInteractions === 0) return 0;
    return (interactions / this.maxInteractions) * 100;
  }

  /**
   * Genera il tooltip per gli IP
   */
  getIpTooltip(ips: string[]): string {
    if (!ips || ips.length === 0) return 'Nessun IP disponibile';

    if (ips.length <= 5) {
      return `IP: ${ips.join(', ')}`;
    }

    return `IP: ${ips.slice(0, 3).join(', ')} e altri ${ips.length - 3}`;
  }

}
