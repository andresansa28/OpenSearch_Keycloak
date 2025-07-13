// import {Component, OnInit} from '@angular/core';
// import {UsermanagmentApiService} from "../../../services/usermanagment-api.service";
// import {MessageService} from "primeng/api";
// import {FormBuilder, FormControl, FormGroup} from "@angular/forms";

// @Component({
//   selector: 'app-page',
//   templateUrl: './page.component.html',
//   styleUrls: ['./page.component.scss'],
//   providers: [MessageService]
// })

// export class PageComponent implements OnInit{
//   myGroup!: FormGroup
//   constructor(
//     private service:UsermanagmentApiService,
//     private messageService:MessageService,
//     private fb: FormBuilder
//   ) { }

//   users! : any[]
//   username!: string;
//   firstname!: string;
//   lastname!:string;
//   email!: string;
//   password!: string;
//   productDialog: boolean = false;
//   groups!: any[];
//   checked: boolean = false;
//   selectedValue: any;
//   editingUser!: string;
//   async ngOnInit(): Promise<void> {
//     this.users = await this.getUsers()

//   }


//   async getUsers(): Promise<any>{
//     this.service.getUsers().subscribe((data: any) => {this.users = data})
//   }

//   async deleteUser(userid:string){
//     this.service.removeUser(userid).subscribe({
//       next:(v) => {
//         this.messageService.add({severity:'success', summary:'Success', detail:'User Deleted'})
//         this.testA()
//       },
//       error:(e) => {this.messageService.add({severity:'error', summary:'Error', detail:e["error"]["message"]["errorMessage"]})},
//       complete: () => console.info("complete")
//       }
//     )
//   }
//   async createUser(){
//     this.service.createUser(
//       this.username,
//       this.firstname,
//       this.lastname,
//       this.email,
//       this.password).subscribe(
//       {
//         next: (v) => {
//           this.users.push(v)
//           this.messageService.add({severity:'success', summary:'Success', detail:'User Created'})
//         },
//         error: (e) => {
//           this.messageService.add({severity:'error', summary:'Error', detail:e["error"]["message"]["errorMessage"]})
//         },
//         complete: () => console.info('complete')
//       }
//     )
//   }

//   async testA(){
//     this.service.getUsers().subscribe((data: any) => {this.users = data})
//   }

//   async editUser(user: any) {
//     this.productDialog = true
//     this.editingUser = user
//     this.service.getUserRoles(user).subscribe(
//       {
//         next: (v:any) => {
//           if (v.length > 0){
//             this.selectedValue = v[0].name
//           }
//         },
//         error: (e) => {
//           this.messageService.add({severity:'error', summary:'Error', detail:e["error"]["message"]["errorMessage"]})
//         },
//         complete: () => console.info('complete')
//       }
//     )

//     this.service.getAllGroups().subscribe(
//       {
//         next: (v:any) => {
//           this.groups = v
//         },
//         error: (e) => {
//           this.messageService.add({severity:'error', summary:'Error', detail:e["error"]["message"]["errorMessage"]})
//         },
//         complete: () => console.info('complete')
//       }
//     )
//   }



//   changeValue() {
//     this.service.setUserGroup(this.editingUser,this.selectedValue).subscribe(
//       {
//         next: (v:any) => {},
//         error: (e) => {
//           this.messageService.add({severity:'error', summary:'Error', detail:e["error"]["message"]["errorMessage"]})
//         },
//         complete: () => {
//           this.productDialog = false
//           this.selectedValue = ""
//         }
//       }
//     )
//   }


// }


import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { UsermanagmentApiService } from 'src/app/services/usermanagment-api.service';

// Interfaces
interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  password?: string; // Optional per la creazione
}

interface Group {
  id: number;
  name: string;
  description: string;
  permissions: string[];
}

@Component({
  selector: 'app-user-management',
  templateUrl: './page.component.html',
  standalone: false,
  styleUrls: ['./page.component.scss']
})
export class PageComponent implements OnInit {
  // Implementazione del metodo deleteUser
  deleteUser(userId: any): void {
    if (confirm('Sei sicuro di voler eliminare questo utente?')) {
      this.service.removeUser(userId.toString()).subscribe({
        next: (response) => {
          this.loadUsers(); // Ricarica la lista
          this.snackBar.open('Utente eliminato con successo!', 'Chiudi', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        },
        error: (error) => {
          console.error('Errore nell\'eliminazione utente:', error);
          this.snackBar.open('Errore nell\'eliminazione dell\'utente', 'Chiudi', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  manageGroups(userId: any): void {
    console.log('Gestione gruppi per utente:', userId, 'tipo:', typeof userId);
    this.currentUserId = userId;
    this.loadUserGroups();
    this.dialog.open(this.groupDialog, {
      width: '500px',
      disableClose: false
    });
  }

  assignGroup(): void {
    if (this.currentUserId && this.selectedGroup) {
      console.log('Assegnazione gruppo:', {
        userId: this.currentUserId,
        selectedGroup: this.selectedGroup,
        userIdType: typeof this.currentUserId,
        selectedGroupType: typeof this.selectedGroup
      });

      this.service.setUserGroup(this.currentUserId.toString(), this.selectedGroup.toString()).subscribe({
        next: (response) => {
          console.log('Gruppo assegnato con successo:', response);
          this.snackBar.open('Gruppo assegnato con successo!', 'Chiudi', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.dialog.closeAll();
          this.selectedGroup = null;
          this.currentUserId = null;
        },
        error: (error) => {
          console.error('Errore completo nell\'assegnazione gruppo:', error);
          console.error('Error message:', error.error?.message || error.message);
          console.error('Error status:', error.status);

          let errorMessage = 'Errore nell\'assegnazione del gruppo';
          if (error.error?.message?.errorMessage) {
            errorMessage = error.error.message.errorMessage;
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.message) {
            errorMessage = error.message;
          }

          this.snackBar.open(errorMessage, 'Chiudi', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
    } else {
      console.error('Dati mancanti per assegnazione gruppo:', {
        currentUserId: this.currentUserId,
        selectedGroup: this.selectedGroup
      });
      this.snackBar.open('Seleziona un utente e un gruppo', 'Chiudi', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    }
  }
  @ViewChild('groupDialog') groupDialog!: TemplateRef<any>;
  @ViewChild(MatSort) sort!: MatSort;

  // Table properties
  displayedColumns: string[] = ['avatar', 'username', 'fullName', 'email', 'actions'];
  users: User[] = [];
  filteredUsers = new MatTableDataSource<User>([]);
  searchTerm = '';

  // Form properties
  userForm: FormGroup;
  isEditMode = false;
  editingUserId: number | null = null;
  hidePassword = true;

  // Dialog properties
  selectedGroup: number | null = null;
  currentUserId: number | null = null;
  groups: Group[] = [];

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private service: UsermanagmentApiService
  ) {
    this.userForm = this.createUserForm();
  }

  ngOnInit(): void {
    this.loadUsers();
    this.loadGroups();
  }

  ngAfterViewInit(): void {
    this.filteredUsers.sort = this.sort;
  }

  // Form initialization
  private createUserForm(): FormGroup {
    return this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(4)]]
    });
  }



  // Data loading methods
  private loadUsers(): void {
    this.service.getUsers().subscribe({
      next: (response: any) => {
        // Gestisce sia risposte dirette che wrapped
        const data = response.data || response;
        this.users = this.transformApiUsersData(data);
        this.filteredUsers.data = [...this.users];
        console.log('Users loaded:', this.users);
      },
      error: (error) => {
        console.error('Errore nel caricamento utenti:', error);
        this.snackBar.open('Errore nel caricamento degli utenti', 'Chiudi', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  private transformApiUsersData(apiData: any[]): User[] {
    if (!Array.isArray(apiData)) {
      return [];
    }

    return apiData.map((apiUser, index) => {
      console.log('Trasformazione utente API:', apiUser);
      return {
        id: apiUser.id || apiUser.userId || apiUser.user_id || index + 1,
        username: apiUser.username || apiUser.userName || '',
        email: apiUser.email || '',
        firstName: apiUser.firstName || apiUser.first_name || '',
        lastName: apiUser.lastName || apiUser.last_name || '',
        isActive: apiUser.isActive !== undefined ? apiUser.isActive : true,
        createdAt: apiUser.createdAt ? new Date(apiUser.createdAt) : new Date(),
        updatedAt: apiUser.updatedAt ? new Date(apiUser.updatedAt) : new Date()
      };
    });
  }

  private loadGroups(): void {
    this.service.getAllGroups().subscribe({
      next: (response: any) => {
        // Gestisce sia risposte dirette che wrapped
        const data = response.data || response;
        this.groups = data;
        console.log('Groups loaded:', this.groups);
        console.log('Struttura primo gruppo:', this.groups[0]);
      },
      error: (error) => {
        console.error('Errore nel caricamento gruppi:', error);
      }
    });
  }

  private loadUserGroups(): void {
    if (this.currentUserId) {
      this.service.getUserRoles(this.currentUserId.toString()).subscribe({
        next: (userGroups: any) => {
          if (userGroups && userGroups.length > 0) {
            this.selectedGroup = userGroups[0].id || userGroups[0].name;
          }
        },
        error: (error) => {
          console.error('Errore nel caricamento gruppi utente:', error);
        }
      });
    }
  }



  // Form methods
  onSubmit(): void {
    if (this.userForm.valid) {
      const formData = this.userForm.value;

      if (this.isEditMode && this.editingUserId) {
        this.updateUser(this.editingUserId, formData);
      } else {
        this.createUser(formData);
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.userForm.controls).forEach(key => {
      this.userForm.get(key)?.markAsTouched();
    });
  }

  resetForm(): void {
    this.userForm.reset();
    this.isEditMode = false;
    this.editingUserId = null;
    this.hidePassword = true;
  }

  // CRUD Operations
  createUser(userData: Partial<User>): void {
    this.service.createUser(
      userData.username!,
      userData.firstName!,
      userData.lastName!,
      userData.email!,
      userData.password!
    ).subscribe({
      next: (response: any) => {
        console.log('Utente creato, risposta API:', response);
        // Ricarica la lista utenti dopo la creazione per avere gli ID corretti
        this.loadUsers();
        this.resetForm();
        this.snackBar.open('Utente creato con successo!', 'Chiudi', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      },
      error: (error) => {
        console.error('Errore nella creazione utente:', error);
        this.snackBar.open('Errore nella creazione dell\'utente', 'Chiudi', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  editUser(userId: number): void {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      this.isEditMode = true;
      this.editingUserId = userId;

      // Remove password validation for edit mode
      this.userForm.get('password')?.clearValidators();
      this.userForm.get('password')?.updateValueAndValidity();

      this.userForm.patchValue({
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      });

      // Scroll to form
      document.querySelector('.form-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  }
  updateUser(userId: number, userData: Partial<User>): void {
    // Per ora implementiamo una logica di aggiornamento locale
    // In futuro si potrà aggiungere un endpoint API per l'aggiornamento
    const userIndex = this.users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      this.users[userIndex] = {
        ...this.users[userIndex],
        username: userData.username!,
        email: userData.email!,
        firstName: userData.firstName!,
        lastName: userData.lastName!,
        updatedAt: new Date()
      };
      this.filteredUsers.data = [...this.users];
      this.resetForm();
      this.snackBar.open('Utente aggiornato con successo!', 'Chiudi', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });
    }
  }

}