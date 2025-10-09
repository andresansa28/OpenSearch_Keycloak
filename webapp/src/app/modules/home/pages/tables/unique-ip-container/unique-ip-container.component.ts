import { ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, SimpleChanges, ViewEncapsulation, } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { OpenSearchService } from 'src/app/services/opensearch.service';

@Component({
  selector: 'app-unique-ip-container',
  templateUrl: './unique-ip-container.component.html',
  styleUrls: ['./unique-ip-container.component.scss'],
  encapsulation: ViewEncapsulation.None,
})


export class UniqueIpContainerComponent implements OnChanges, OnDestroy {

  @Input() tenant: string | null = null;
  @Input() timeRange: { from: string; to: string } | null = null;

  id = "unique-ip";

  isLoading = true;
  hasError = false;
  tableData: any[] = [];
  displayedColumns: string[] = []; // Popola questo array con le colonne che vuoi mostrare

  
  
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
      console.log('Mancano parametri per fetchData:', { tenant: this.tenant, timeRange: this.timeRange });
      return;
    }

    console.log('Eseguendo fetchData per unique-ip:', { tenant: this.tenant, timeRange: this.timeRange });

    this.isLoading = true;
    this.hasError = false;
    this.tableData = [];

    this.osService.getTable(this.tenant, this.id, this.timeRange).pipe(
      finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
        console.log('fetchData completata per unique-ip');
      })
    ).subscribe({
      next: (res: any) => {
        try {
          const buckets = res?.aggregations?.[2]?.buckets;
          if (!Array.isArray(buckets)) {
            console.error("Formato aggregations non valido");
            this.hasError = true;
            return;
          }

          const structuredData: any[] = [];

          for (const bucket of buckets) {
            const container = bucket.key;
            const subBuckets = bucket?.[3]?.buckets;

            if (!subBuckets) continue;

            const getValue = (label: string) => subBuckets?.[label]?.['1']?.value ?? 0;

            const total = getValue('Total');
            const malicious = getValue('Malicious');
            const benign = getValue('Benign');
            const unknown = getValue('Unknown');

            structuredData.push({
              container,
              values: [
                { label: 'Total', value: total },
                { label: 'Malicious', value: malicious },
                { label: 'Benign', value: benign },
                { label: 'Unknown', value: unknown }
              ]
            });
          }

          this.tableData = structuredData;
          console.log(this.tableData)
          // Crea un data source per ogni container

        } catch (err) {
          console.error("Errore nel parsing dei dati:", err);
          this.hasError = true;
        }
      },
      error: (err) => {
        console.error('Errore nella richiesta:', err);
        this.hasError = true;
      }
    });
  }

}
