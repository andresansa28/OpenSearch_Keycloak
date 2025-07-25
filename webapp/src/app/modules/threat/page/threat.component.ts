import { AfterViewInit, ChangeDetectorRef, Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { OpenSearchService } from 'src/app/services/opensearch.service';
import { AuthService } from 'src/app/shared/services/authService';


@Component({
  selector: 'app-threat',
  templateUrl: './threat.component.html',
  styleUrls: ['./threat.component.scss'],
  encapsulation: ViewEncapsulation.None,
})

export class ThreatComponent implements OnInit, AfterViewInit {

  tenants: string[] = []
  selectedTenant: string | null = null;

  // Dati per le tabelle
  arpSpoofData = new MatTableDataSource<any>([]);
  modbusDosData = new MatTableDataSource<any>([]);

  // Colonne per le tabelle
  arpSpoofColumns: string[] = ['ip', 'mac', 'msg', 'ts'];
  modbusDosColumns: string[] = ['id.orig_h', 'id.resp_h', 'id.resp_p', 'msg', 'ts', 'payload'];

  // Paginatori
  @ViewChild('arpSpoofPaginator') arpSpoofPaginator!: MatPaginator;
  @ViewChild('modbusPaginator') modbusPaginator!: MatPaginator;

  // Stato caricamento
  loading = false;



  constructor(
    private osService: OpenSearchService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) { }


  ngOnInit(): void {
    const token = this.authService.getToken();
    this.osService.getTenants(token).subscribe({
      next: (value) => {
        console.log(value)
        this.tenants = Object.keys(value)
      },
    })
  }

  ngAfterViewInit(): void {
    // I paginatori verranno assegnati dopo il caricamento dei dati
  }

  selectTenant(tenant: string): void {
    this.selectedTenant = tenant;
    // Reset dei dati precedenti
    this.resetData();
    this.loadThreatData();
  }

  private resetData(): void {
    // Reset dei data sources
    this.arpSpoofData.data = [];
    this.modbusDosData.data = [];
    // Non resettiamo più modbusDosColumns perché sono ora predefinite

    // Reset dei paginatori
    if (this.arpSpoofPaginator) {
      this.arpSpoofPaginator.firstPage();
    }
    if (this.modbusPaginator) {
      this.modbusPaginator.firstPage();
    }

    this.cdr.detectChanges();
  }

  loadThreatData(): void {
    if (!this.selectedTenant) return;
    this.loading = true;
    let completedRequests = 0;

    const checkCompletion = () => {
      completedRequests++;
      if (completedRequests === 2) {
        this.loading = false;
        // Assegna i paginatori dopo che tutti i dati sono stati caricati
        setTimeout(() => {
          this.setupPaginators();
        }, 0);
      }
    };

    // Carica dati ARP Spoof
    this.osService.getArpSpoofData(this.selectedTenant).subscribe({
      next: (data: any) => {
        if (data && data.documents) {
          this.arpSpoofData.data = data.documents;
        } else {
          this.arpSpoofData.data = [];
        }
        checkCompletion();
      },
      error: (error) => {
        console.error('Errore nel caricamento dati ARP Spoof:', error);
        this.arpSpoofData.data = [];
        checkCompletion();
      }
    });

    // Carica dati Modbus DoS
    this.osService.getModbusDosData(this.selectedTenant).subscribe({
      next: (data: any) => {
        if (data && data.documents) {
          this.modbusDosData.data = data.documents;
          // Le colonne sono ora predefinite
        } else {
          this.modbusDosData.data = [];
        }
        checkCompletion();
      },
      error: (error) => {
        console.error('Errore nel caricamento dati Modbus DoS:', error);
        this.modbusDosData.data = [];
        checkCompletion();
      }
    });
  }

  private setupPaginators(): void {
    // Forza il rilevamento delle modifiche prima di assegnare i paginatori
    this.cdr.detectChanges();

    // Assegna i paginatori
    if (this.arpSpoofPaginator) {
      this.arpSpoofData.paginator = this.arpSpoofPaginator;
      this.arpSpoofPaginator.firstPage();
    }

    if (this.modbusPaginator) {
      this.modbusDosData.paginator = this.modbusPaginator;
      this.modbusPaginator.firstPage();
    }

    // Forza un ulteriore rilevamento delle modifiche
    this.cdr.detectChanges();
  }

  private extractColumns(document: any): string[] {
    return Object.keys(document).filter(key => key !== '_id');
  }

  getColumnDisplayName(column: string): string {
    const columnNames: { [key: string]: string } = {
      'id.orig_h': 'Source IP',
      'id.resp_h': 'Destination IP',
      'id.resp_p': 'Source Port',
      'msg': 'Message',
      'ts': 'Timestamp',
      'payload': 'Payload'
    };
    return columnNames[column] || column;
  }

  getValueType(value: any, column?: string): string {
    // Controlla prima il nome della colonna
    if (column === 'msg') {
      return 'message';
    }
    if (column === 'ts') {
      return 'timestamp';
    }

    // Poi controlla il valore
    if (typeof value === 'number' && value > 1000000000) {
      return 'timestamp';
    }
    if (typeof value === 'string' && /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(value)) {
      return 'ip';
    }
    if (typeof value === 'string' && value.includes('|')) {
      return 'payload';
    }
    return 'default';
  }

  formatPayload(payload: string): string[] {
    if (!payload || payload === '-') return [];
    return payload.split('|').filter(chunk => chunk.length > 0);
  }

  formatTimestamp(timestamp: any): string {
    if (!timestamp) return 'N/A';

    // Prova diversi formati di timestamp
    let date: Date;

    if (typeof timestamp === 'number') {
      // Se è un numero, prova sia secondi che millisecondi
      if (timestamp > 1000000000000) {
        // Millisecondi (13 cifre)
        date = new Date(timestamp);
      } else {
        // Secondi (10 cifre)
        date = new Date(timestamp * 1000);
      }
    } else if (typeof timestamp === 'string') {
      // Se è una stringa, prova a parsarla
      date = new Date(timestamp);
    } else {
      return 'Invalid Date';
    }

    // Verifica se la data è valida
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }

    // Formato richiesto: 25/07/2025, 13:57:01
    return date.toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  }

}
