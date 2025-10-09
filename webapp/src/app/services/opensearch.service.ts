import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})


export class OpenSearchService {
  private url = 'http://172.17.0.1:5000'

  constructor(private httpClient: HttpClient) { }

  getTenants(token: any) {
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    return this.httpClient.get(this.url + "/api/tenants", { headers });
  }

  getTenantIndices(tenant: string) {
    let queryParams = new HttpParams();
    queryParams = queryParams.append("tenant", tenant);
    return this.httpClient.get(this.url + "/api/tenant", { params: queryParams });
  }

  getArpSpoofData(tenant: string) {
    let queryParams = new HttpParams();
    queryParams = queryParams.append("tenant", tenant);
    return this.httpClient.get(this.url + "/api/arp_spoof", { params: queryParams });
  }

  getModbusDosData(tenant: string) {
    let queryParams = new HttpParams();
    queryParams = queryParams.append("tenant", tenant);
    return this.httpClient.get(this.url + "/api/modbus_dos", { params: queryParams });
  }

  getTable(tenant: string, id: string, timeRange?: { from: string; to: string }) {
    const body: any = {
      tenant: tenant,
      tableType: id
    };

    // Aggiungi il range temporale se fornito
    if (timeRange) {
      body.timeRange = timeRange;
    }

    return this.httpClient.post(this.url + '/api/table', body);
  }



}