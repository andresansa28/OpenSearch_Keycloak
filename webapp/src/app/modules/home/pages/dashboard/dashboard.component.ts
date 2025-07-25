import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { OpenSearchService } from 'src/app/services/opensearch.service';

interface NmapScanRow {
  container: string;
  totalScans: number;
  ports: { port: number; count: number }[];
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class HomeComponent implements OnInit {
  displayedColumns: string[] = ['container', 'ports', 'totalScans'];
  dataSource = new MatTableDataSource<NmapScanRow>([]);
  loading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private osService: OpenSearchService) {}

  ngOnInit() {
    this.loading = true;
    this.osService.getScanNmap('test').subscribe({
      next: (res: any) => {
        this.dataSource.data = this.parseNmapAgg(res);
        this.loading = false;
        setTimeout(() => {
          this.dataSource.paginator = this.paginator;
        });
      },
      error: () => (this.loading = false),
    });
  }

  parseNmapAgg(res: any): NmapScanRow[] {
    const buckets = res?.aggregations?.containers?.buckets || [];
    return buckets.map((b: any) => ({
      container: b.key,
      totalScans: b.doc_count,
      ports: (b.ports?.buckets || []).map((p: any) => ({
        port: p.key,
        count: p.doc_count,
      })),
    }));
  }
}