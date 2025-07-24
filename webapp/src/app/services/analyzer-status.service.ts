import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, interval, Subject, Subscription } from 'rxjs';
import { AnalyzerService } from './analyzer.service';

@Injectable({
  providedIn: 'root'
})
export class AnalyzerStatusService implements OnDestroy {

  private _isRunning = new BehaviorSubject<boolean>(false);
  private _statusChanged = new Subject<{ from: boolean, to: boolean }>();
  private statusSubscription: Subscription | null = null;
  private subscriberCount = 0;
  private previousStatus: boolean | null = null;

  // Observable pubblico per i componenti
  public isRunning$ = this._isRunning.asObservable();
  public statusChanged$ = this._statusChanged.asObservable();

  constructor(private analyzerService: AnalyzerService) { }

  /**
   * Inizia il monitoraggio dello stato dell'analyzer
   * Usa un counter per gestire più componenti che usano il servizio
   */
  startMonitoring(): void {
    this.subscriberCount++;

    // Inizia il monitoraggio solo se è il primo subscriber
    if (this.subscriberCount === 1) {
      this.updateStatus();
      this.statusSubscription = interval(5000).subscribe(() => {
        this.updateStatus();
      });
    }
  }

  /**
   * Ferma il monitoraggio quando non ci sono più subscriber
   */
  stopMonitoring(): void {
    this.subscriberCount--;

    // Ferma il monitoraggio solo se non ci sono più subscriber
    if (this.subscriberCount <= 0) {
      this.subscriberCount = 0;
      if (this.statusSubscription) {
        this.statusSubscription.unsubscribe();
        this.statusSubscription = null;
      }
    }
  }

  /**
   * Aggiorna manualmente lo stato (utile dopo start/stop)
   */
  refreshStatus(): void {
    this.updateStatus();
  }

  /**
   * Ottiene lo stato corrente senza subscription
   */
  getCurrentStatus(): boolean {
    return this._isRunning.value;
  }

  private updateStatus(): void {
    this.analyzerService.getStatus().subscribe({
      next: (res: any) => {
        const currentStatus = res.running || false;

        // Rileva cambio di stato solo se non è la prima volta
        if (this.previousStatus !== null && this.previousStatus !== currentStatus) {
          this._statusChanged.next({ from: this.previousStatus, to: currentStatus });
        }

        this.previousStatus = currentStatus;
        this._isRunning.next(currentStatus);
      },
      error: () => {
        const currentStatus = false;

        // Rileva cambio di stato solo se non è la prima volta
        if (this.previousStatus !== null && this.previousStatus !== currentStatus) {
          this._statusChanged.next({ from: this.previousStatus, to: currentStatus });
        }

        this.previousStatus = currentStatus;
        this._isRunning.next(false);
      }
    });
  }


  ngOnDestroy(): void {
    if (this.statusSubscription) {
      this.statusSubscription.unsubscribe();
    }
  }
}
