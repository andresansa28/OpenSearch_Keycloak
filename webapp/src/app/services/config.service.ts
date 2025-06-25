import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DeployModel } from '../shared/deploymentModels/deploymentsModel';
import { Observable, delay } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private url = 'http://172.17.0.1:5001';
  constructor(private http:HttpClient) { }

  getDeployments(): Observable<any> {
    return this.http.get(this.url + '/getConfig');
  }

  checkDeployments(deployments: any) : Observable<any> {
    return this.http.post(this.url + '/checkDeployments', deployments);
  }

  setDelayConfig(delay: number) : Observable<any> {
    return this.http.get(this.url + '/change_delay/' + delay);
  }

  setKeyConfig(key: string): Observable<any> {
    return this.http.get(this.url + '/change_key/' + key);
  }

  addDeployment(deployment: DeployModel): Observable<any> {
    return this.http.post(this.url + '/addDeploy', deployment);
  }

  removeDeployment(ipToRemove: string): Observable<any> {
    var body = {
      "ips": [
          ipToRemove
      ]
  };
    return this.http.post(this.url + '/removeDeploy', body);
  }

}
