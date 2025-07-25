import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatStepper } from '@angular/material/stepper';
import { Subscription } from 'rxjs';
import { AnalyzerStatusService } from 'src/app/services/analyzer-status.service';
import { AnalyzerService } from 'src/app/services/analyzer.service';
import { ConfigService } from 'src/app/services/config.service';
import { UsermanagmentApiService } from 'src/app/services/usermanagment-api.service';
import {
  Container,
  DeploymentsModel,
  DeployModel,
} from 'src/app/shared/deploymentModels/deploymentsModel';


@Component({
  selector: 'app-deployment',
  templateUrl: './deploy.component.html',
  styleUrls: ['./deploy.component.scss'],
})
export class DeploymentComponent implements OnInit, OnDestroy {
  button_green: string = 'button_green';
  button_red: string = 'button_red';
  isDivActive: boolean = true;
  deployments: DeploymentsModel = {
    delay: 0,
    MaxMind_GeoDB_Key: '',
    RemoteDeployments: [],
  };
  delayValue: number = this.deployments.delay || 60;
  geoDbKey: string = '';

  //add deploy variables
  name_input: string = '';
  IP_input: string = '';
  user_input: string = '';
  passw_input: string = '';
  add_container_ip_input: string = '';
  add_container_name_input: string = '';
  docker_net_input: string = ''; // Campo per la docker net
  Containers_input: Container[] = [];

  isLoadingDeploy: boolean = false;
  isLoadingSetup: boolean = false;
  isLoadingStart: boolean = false;
  analyzerRunning: boolean = false;

  // Mappa per memorizzare lo stato online dei deployment
  deploymentStatus: Map<string, boolean> = new Map();

  // Set per tracciare i deployment in fase di controllo
  checkingDeployments: Set<string> = new Set();

  // Variabili per la modalità di modifica
  isEditMode: boolean = false;
  deploymentBeingEdited: DeployModel | null = null;
  originalDeploymentIP: string = '';

  // Variabili per la modifica dei PLC
  editingPlcIndex: number = -1;
  isEditingPlc: boolean = false;

  @ViewChild('stepper') stepper!: MatStepper;

  private statusSubscription: Subscription | null = null;
  private statusChangeSubscription: Subscription | null = null;

  constructor(
    private http: HttpClient,
    private configS: ConfigService,
    private _snackBar: MatSnackBar,
    private analyzerS: AnalyzerService,
    private analyzerStatusService: AnalyzerStatusService,
    private userService: UsermanagmentApiService,
  ) { }

  // Aggiungi questi nel tuo DeploymentComponent

  selectedDeployment: any = null;

  removePlcIp(index: number) {
    // implementa logica per rimuovere un PLC dalla lista
    this.Containers_input.splice(index, 1);
  }



  isFormValid(): boolean {
    // implementa logica di validazione form
    return !!(this.name_input && this.IP_input && this.user_input && this.passw_input);
  }


  getStatusColor(status?: string): string {
    // colori a seconda dello stato del deployment
    switch (status?.toLowerCase()) {
      case 'online':
        return '#4caf50';
      case 'offline':
        return '#f44336';
      default:
        return '#9e9e9e';
    }
  }



  ngOnInit(): void {
    this.initDeployments();
    this.checkDeploymentsStatus();

    // Avvia il polling ogni 5 secondi per controllare lo stato dei deployment
    // Commentato per evitare polling automatico - ora si usa il controllo manuale
    /*
    setInterval(() => {
      this.checkDeploymentsStatus();
    }, 5000);
    */

    // Inizia il monitoraggio dello stato dell'analyzer
    this.analyzerStatusService.startMonitoring();

    // Sottoscrivi agli aggiornamenti dello stato
    this.statusSubscription = this.analyzerStatusService.isRunning$.subscribe(
      (isRunning: boolean) => {
        this.analyzerRunning = isRunning;
      }
    );

    // Sottoscrivi ai cambiamenti di stato per mostrare notifiche
    this.statusChangeSubscription = this.analyzerStatusService.statusChanged$.subscribe(
      (change: { from: boolean, to: boolean }) => {
        if (change.from === true && change.to === false) {
          // L'analyzer è passato da running a stopped
          this._snackBar.open('Analyzer fermato inaspettatamente, controllare "docker logs analyzer"', 'Chiudi', {
            duration: 6000, //mettere undefined
            panelClass: ['error-snackbar']
          });
        } else if (change.from === false && change.to === true) {
          // L'analyzer è passato da stopped a running
          this._snackBar.open('Analyzer avviato con successo!', 'Chiudi', {
            duration: 4000,
            panelClass: ['success-snackbar']
          });
        }
      }
    );
  }

  ngOnDestroy(): void {
    // Ferma il monitoraggio
    this.analyzerStatusService.stopMonitoring();

    // Pulisci le subscription
    if (this.statusSubscription) {
      this.statusSubscription.unsubscribe();
    }
    if (this.statusChangeSubscription) {
      this.statusChangeSubscription.unsubscribe();
    }
  }



  initDeployments(): void {
    this.configS.getDeployments().subscribe({
      next: (res: any) => {
        var remote: DeployModel[] = [];
        for (var i = 0; i < res.RemoteDeployments.length; i++) {
          var deploy: DeployModel = {
            name: res.RemoteDeployments[i].name,
            IP: res.RemoteDeployments[i].IP,
            user: res.RemoteDeployments[i].user,
            passw: res.RemoteDeployments[i].passw,
            active: true,
            Containers: res.RemoteDeployments[i].Containers,
            DockerNet: res.RemoteDeployments[i].DockerNet, // Aggiungi mappatura DockerNet
          };
          remote.push(deploy);
        }
        this.deployments = {
          delay: res.delay,
          MaxMind_GeoDB_Key: res.MaxMind_GeoDB_Key,
          RemoteDeployments: remote,
        };
        this.delayValue = this.deployments.delay;
      },
      error: (error: any) => {
        this._snackBar.open('Errore nel caricamento dei dati!', 'Chiudi', {
          duration: 2000, // Durata in millisecondi
          panelClass: ['error-snackbar']
        });
      }
    });
  }



  setDelayConfig() {
    this.configS.setDelayConfig(this.delayValue).subscribe({
      next: (res: any) => {
        if (res['message'] == 'Delay changed successfully') {
          this._snackBar.open('Delay aggiornato con successo!', 'Chiudi', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.initDeployments();
        } else {
          this._snackBar.open('Errore nell\'aggiornamento del delay!', 'Chiudi', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      },
      error: (error: any) => {
        this._snackBar.open('Errore nell\'aggiornamento del delay!', 'Chiudi', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  setKeyConfig() {
    this.configS.setKeyConfig(this.geoDbKey).subscribe({
      next: (res: any) => {
        console.log(res);
        if (res['message'] == 'MaxMind_GeoDB_Key changed successfully') {
          this._snackBar.open('Chiave MaxMind aggiornata con successo!', 'Chiudi', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.initDeployments();
        } else {
          this._snackBar.open('Errore nell\'aggiornamento della chiave MaxMind!', 'Chiudi', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      },
      error: (error: any) => {
        this._snackBar.open('Errore nell\'aggiornamento della chiave MaxMind!', 'Chiudi', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  addDeployment(): void {
    if (this.isEditMode) {
      // Se siamo in modalità modifica, usa il metodo di aggiornamento
      this.updateDeployment();
      return;
    }

    this.isLoadingDeploy = true;
    const deploy: DeployModel = {
      name: this.name_input,
      IP: this.IP_input,
      user: this.user_input,
      passw: this.passw_input,
      active: true,
      Containers: this.Containers_input,
      DockerNet: this.docker_net_input || undefined, // Include il campo macvlan se specificato
    };

    this.configS.addDeployment(deploy).subscribe({
      next: (res: any) => {
        console.log('Deployment aggiunto:', res);

        // Dopo aver aggiunto il deployment, crea il gruppo in Keycloak
        this.createGroupForDeployment(deploy.name);

        // Ricarica la lista dei deployment
        this.initDeployments();

        // Pulisci i campi input
        this.clearForm();

        // Reset del stepper
        if (this.stepper) {
          this.stepper.reset();
        }

        this.isLoadingDeploy = false;
      },
      error: (err: any) => {
        this._snackBar.open("Errore durante l'aggiunta!", 'Chiudi', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.isLoadingDeploy = false;
        console.error('Errore:', err);
      },
    });
  }

  // Metodo per creare automaticamente un gruppo per il deployment
  private createGroupForDeployment(deploymentName: string): void {
    const groupName = `${deploymentName}`;
    const description = `Gruppo automatico per il deployment ${deploymentName}`;

    // Prima mostra notifica del deployment creato
    this._snackBar.open(`Deployment '${deploymentName}' aggiunto con successo!`, 'Chiudi', {
      duration: 4000,
      panelClass: ['success-snackbar']
    });

    // Dopo 2 secondi, crea il gruppo e mostra la notifica del gruppo
    setTimeout(() => {
      this.userService.createGroup(groupName, description).subscribe({
        next: (response) => {
          console.log('Gruppo creato con successo:', response);
          this._snackBar.open(`Gruppo '${groupName}' creato automaticamente!`, 'Chiudi', {
            duration: 4000,
            panelClass: ['info-snackbar']
          });
        },
        error: (error) => {
          console.error('Errore nella creazione del gruppo:', error);
          // Non mostrare errore all'utente se il gruppo esiste già
          if (error.error?.message?.errorMessage?.includes('esiste già')) {
            console.log('Gruppo già esistente, continuando...');
            this._snackBar.open(`ℹGruppo '${groupName}' già esistente`, 'Chiudi', {
              duration: 3000,
              panelClass: ['info-snackbar']
            });
          } else {
            this._snackBar.open('Attenzione: errore nella creazione automatica del gruppo', 'Chiudi', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
          }
        }
      });
    }, 2000);
  }

  // Metodo per eliminare automaticamente il gruppo quando un deployment viene rimosso
  private deleteGroupForDeployment(deploymentName: string): void {
    const groupName = `${deploymentName}`;

    this.userService.deleteGroup(groupName).subscribe({
      next: (response) => {
        console.log('Gruppo eliminato con successo:', response);
        this._snackBar.open(`Gruppo '${groupName}' eliminato automaticamente!`, 'Chiudi', {
          duration: 4000,
          panelClass: ['success-snackbar']
        });
      },
      error: (error) => {
        console.error('Errore nell\'eliminazione del gruppo:', error);
        // Non mostrare errore all'utente se il gruppo non esiste
        if (error.error?.message?.errorMessage?.includes('non trovato')) {
          console.log('Gruppo non esistente, continuando...');
          this._snackBar.open(`Gruppo '${groupName}' non esistente`, 'Chiudi', {
            duration: 3000,
            panelClass: ['info-snackbar']
          });
        } else {
          this._snackBar.open('Attenzione: errore nell\'eliminazione automatica del gruppo', 'Chiudi', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      }
    });
  }

  removeDeployment(ipToRemove: string, deploymentName?: string): void {
    this.configS.removeDeployment(ipToRemove).subscribe((res: any) => {
      console.log(res);
      if (res['message'] == 'Deployments removed successfully') {
        // Prima mostra notifica del deployment rimosso
        this._snackBar.open(`Deployment '${deploymentName || ipToRemove}' rimosso con successo!`, 'Chiudi', {
          duration: 4000,
          panelClass: ['success-snackbar']
        });

        // Elimina anche il gruppo associato se abbiamo il nome del deployment
        if (deploymentName) {
          // Dopo 2 secondi, elimina il gruppo e mostra la notifica del gruppo
          setTimeout(() => {
            this.deleteGroupForDeployment(deploymentName);
          }, 2000);
        }

        this.initDeployments();
      } else {
        this._snackBar.open(
          'Errore nella rimozione del deployment!',
          'Chiudi',
          {
            duration: 5000,
            panelClass: ['error-snackbar'] // Durata in millisecondi
          }
        );
      }
    });
  }


  startAnalyzer(): void {
    this.isLoadingStart = true;
    this.analyzerS.start().subscribe({
      next: (res: any) => {
        console.log(res);
        // Aggiorna lo stato immediatamente - la notifica verrà mostrata dal monitoraggio automatico
        this.analyzerStatusService.refreshStatus();
      },
      error: () => {
        this._snackBar.open("Errore nell'avvio dell'analyzer", 'Chiudi', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.isLoadingStart = false;
        this.analyzerStatusService.refreshStatus();
      },
      complete: () => {
        this.isLoadingStart = false;
      },
    });
  }

  stopAnalyzer(): void {
    this.analyzerS.stop().subscribe({
      next: (res: any) => {
        console.log(res);
        // Aggiorna lo stato immediatamente
        this.analyzerStatusService.refreshStatus();
      },
      error: () => {
        this.analyzerStatusService.refreshStatus();
      }
    });
  }

  forceOpenSearchSetup(): void {
    this.isLoadingSetup = true;
    this.analyzerS.forceOpenSearchSetup().subscribe({
      next: (res: any) => {
        console.log(res);
        if (res == 'Opensearch configured') {
          this._snackBar.open(
            'OpenSearch setup configured successfully!',
            'Chiudi',
            {
              duration: 5000,
              panelClass: ['success-snackbar']
            }
          );
        }
      },
      error: () => {
        this._snackBar.open(
          'Errore nella configurazione di OpenSearch',
          'Chiudi',
          {
            duration: 5000,
            panelClass: ['error-snackbar']
          }
        );
        this.isLoadingSetup = false;
      },
      complete: () => {
        this.isLoadingSetup = false;
      },
    });
  }

  // Metodi per la gestione dei PLC
  editPlc(index: number): void {
    this.editingPlcIndex = index;
    this.isEditingPlc = true;

    // Popola i campi con i dati del PLC da modificare
    const plc = this.Containers_input[index];
    this.add_container_name_input = plc.name;
    this.add_container_ip_input = plc.IP;

    this._snackBar.open('Modalità modifica PLC attivata', 'Chiudi', {
      duration: 2000
    });
  }

  updatePlc(): void {
    if (!this.add_container_name_input || !this.add_container_ip_input) {
      this._snackBar.open('Inserire nome e IP del PLC!', 'Chiudi', {
        duration: 3000
      });
      return;
    }

    if (this.editingPlcIndex >= 0 && this.editingPlcIndex < this.Containers_input.length) {
      // Aggiorna il PLC esistente
      this.Containers_input[this.editingPlcIndex] = {
        name: this.add_container_name_input,
        IP: this.add_container_ip_input
      };

      this._snackBar.open('PLC aggiornato con successo!', 'Chiudi', {
        duration: 2000,
        panelClass: ['success-snackbar']
      });

      // Pulisce i campi senza mostrare messaggio di annullamento
      this.clearPlcEditFields();
    }
  }

  cancelPlcEdit(): void {
    this.clearPlcEditFields();

    this._snackBar.open('Modifica PLC annullata', 'Chiudi', {
      duration: 2000,
      panelClass: ['info-snackbar']
    });
  }

  private clearPlcEditFields(): void {
    this.editingPlcIndex = -1;
    this.isEditingPlc = false;
    this.add_container_name_input = '';
    this.add_container_ip_input = '';
  }

  addPlcIp(): void {
    if (this.add_container_ip_input == '') {
      return;
    }

    if (this.isEditingPlc) {
      // Se siamo in modalità modifica PLC, aggiorna invece di aggiungere
      this.updatePlc();
      return;
    }

    // Controlla se l'IP è già presente
    const existingPlc = this.Containers_input.find(container => container.IP === this.add_container_ip_input);
    if (existingPlc) {
      this._snackBar.open('Un PLC con questo IP è già presente!', 'Chiudi', {
        duration: 3000,
        panelClass: ['info-snackbar']
      });
      return;
    }

    var container: Container = {
      IP: this.add_container_ip_input,
      name: this.add_container_name_input || `PLC-${this.Containers_input.length + 1}`,
    };
    this.Containers_input.push(container);

    // Pulisci i campi dopo l'aggiunta
    this.add_container_name_input = '';
    this.add_container_ip_input = '';

    this._snackBar.open('PLC aggiunto con successo!', 'Chiudi', {
      duration: 2000,
      panelClass: ['success-snackbar']
    });
  }

  checkDeploymentsStatus(): void {
    this.configS.checkDeployments().subscribe({
      next: (res: any) => {
        // Aggiorna la mappa con gli stati dei deployment
        if (res.deployments) {
          res.deployments.forEach((deployment: any) => {
            this.deploymentStatus.set(deployment.ip, deployment.online);
          });
        }
      },
      error: (error: any) => {
        this._snackBar.open('Errore nel controllo stato deployment!', 'Chiudi', {
          duration: 2000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }


  getDeviceStatusColor(ip: string): string {
    const isOnline = this.deploymentStatus.get(ip);
    if (isOnline === true) return '#4caf50'; // Verde per online
    if (isOnline === false) return '#f44336'; // Rosso per offline
    return '#9e9e9e'; // Grigio per stato sconosciuto
  }

  getDeviceStatusText(ip: string): string {
    const isOnline = this.deploymentStatus.get(ip);
    if (isOnline === true) return 'Online';
    if (isOnline === false) return 'Offline';
    return 'Sconosciuto';
  }

  isDeploymentOnline(ip: string): boolean {
    return this.deploymentStatus.get(ip) === true;
  }

  editDeployment(deploy: any): void {
    // Attiva la modalità di modifica
    this.isEditMode = true;
    this.deploymentBeingEdited = { ...deploy }; // Crea una copia
    this.originalDeploymentIP = deploy.IP;

    // Popola i campi del form con i dati del deployment da modificare
    this.name_input = deploy.name;
    this.IP_input = deploy.IP;
    this.user_input = deploy.user;
    this.passw_input = deploy.passw;
    this.Containers_input = [...deploy.Containers]; // Copia i container
    this.docker_net_input = deploy.DockerNet || ''; // Carica il valore della docker net

    // Reset del stepper al primo step
    if (this.stepper) {
      this.stepper.reset();
    }

    // Scorri in alto al form di aggiunta/modifica
    this.scrollToForm();

    this._snackBar.open('Modalità modifica attivata', 'Chiudi', {
      duration: 2000,
      panelClass: ['success-snackbar']
    });
  }

  cancelEdit(): void {
    // Disattiva la modalità di modifica e pulisce i campi
    this.isEditMode = false;
    this.deploymentBeingEdited = null;
    this.originalDeploymentIP = '';

    // Annulla anche eventuali modifiche PLC in corso
    if (this.isEditingPlc) {
      this.clearPlcEditFields();
    }

    this.clearForm();

    // Reset del stepper al primo step
    if (this.stepper) {
      this.stepper.reset();
    }

    this._snackBar.open('Modifica annullata', 'Chiudi', {
      duration: 2000,
      panelClass: ['info-snackbar']
    });
  }

  updateDeployment(): void {
    if (!this.isFormValid() || !this.deploymentBeingEdited) {
      this._snackBar.open('Compilare tutti i campi obbligatori!', 'Chiudi', {
        duration: 3000
      });
      return;
    }

    this.isLoadingDeploy = true;

    // Crea l'oggetto deployment aggiornato
    const updatedDeploy: DeployModel = {
      name: this.name_input,
      IP: this.IP_input,
      user: this.user_input,
      passw: this.passw_input,
      active: true,
      Containers: this.Containers_input,
      DockerNet: this.docker_net_input || undefined, // Include il campo macvlan aggiornato
    };

    // Prima rimuovi il deployment esistente, poi aggiungi quello aggiornato
    this.configS.removeDeployment(this.originalDeploymentIP).subscribe({
      next: (removeRes: any) => {
        if (removeRes['message'] == 'Deployments removed successfully') {
          // Ora aggiungi il deployment aggiornato
          this.configS.addDeployment(updatedDeploy).subscribe({
            next: (addRes: any) => {
              // Ricarica la lista dei deployment
              this.initDeployments();
              this._snackBar.open('Deployment aggiornato con successo!', 'Chiudi', {
                duration: 3000,
                panelClass: ['success-snackbar']
              });

              // Esci dalla modalità di modifica e pulisci i campi
              this.isEditMode = false;
              this.deploymentBeingEdited = null;
              this.originalDeploymentIP = '';
              this.clearForm();

              // Reset del stepper
              if (this.stepper) {
                this.stepper.reset();
              }

              this.isLoadingDeploy = false;
            },
            error: (addErr: any) => {
              this._snackBar.open("Errore durante l'aggiornamento del deployment!", 'Chiudi', {
                duration: 5000,
                panelClass: ['error-snackbar']
              });
              this.isLoadingDeploy = false;
              console.error('Errore aggiunta:', addErr);
            }
          });
        } else {
          this._snackBar.open('Errore nella rimozione del deployment originale!', 'Chiudi', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
          this.isLoadingDeploy = false;
        }
      },
      error: (removeErr: any) => {
        this._snackBar.open('Errore nella rimozione del deployment originale!', 'Chiudi', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.isLoadingDeploy = false;
        console.error('Errore rimozione:', removeErr);
      }
    });
  }

  private clearForm(): void {
    this.name_input = '';
    this.IP_input = '';
    this.user_input = '';
    this.passw_input = '';
    this.Containers_input = [];
    this.add_container_ip_input = '';
    this.add_container_name_input = '';
    this.docker_net_input = ''; // Reset del campo macvlan

    // Pulisci anche le variabili di modifica PLC
    this.editingPlcIndex = -1;
    this.isEditingPlc = false;
  }

  private scrollToForm(): void {
    // Scorri fino al form di aggiunta/modifica
    setTimeout(() => {
      const formElement = document.querySelector('.deployment-card');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }


  selectDeployment(deploy: any): void {
    this.selectedDeployment = this.selectedDeployment === deploy ? null : deploy;
  }

  checkSingleDeploymentStatus(deploymentIP: string): void {
    // Aggiungi IP al set di controlli in corso
    this.checkingDeployments.add(deploymentIP);

    // Per ora uso checkDeployments e filtro il risultato per il singolo IP
    this.configS.checkDeployments().subscribe({
      next: (res: any) => {
        // Trova il deployment specifico nella risposta
        if (res.deployments) {
          const targetDeployment = res.deployments.find((dep: any) => dep.ip === deploymentIP);
          if (targetDeployment) {
            this.deploymentStatus.set(targetDeployment.ip, targetDeployment.online);

            const statusText = targetDeployment.online ? 'online' : 'offline';
            this._snackBar.open(`Vm del Deployment ${targetDeployment.name} è ${statusText}`, 'Chiudi', {
              duration: 3000,
              panelClass: ['info-snackbar']
            });
          }
        }
      },
      error: (error: any) => {
        this._snackBar.open('Errore nel controllo stato deployment!', 'Chiudi', {
          duration: 2000,
          panelClass: ['error-snackbar']
        });
      },
      complete: () => {
        // Rimuovi IP dal set di controlli in corso
        this.checkingDeployments.delete(deploymentIP);
      }
    });
  }

  isCheckingDeployment(ip: string): boolean {
    return this.checkingDeployments.has(ip);
  }





}
