import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { map, Observable, startWith } from 'rxjs';

import { ClientesService } from '../../services/clientes.service';
import { ValidatorsService } from '../../../../shared/services';
import { CreateClientRequest, UpdateClientRequest } from '../../../interfaces/client.interface';
import { CPRequest, Municipality, States, Town, TownRequest } from '../../../interfaces/catalogs.interface';
import { UserService } from '../../../usuarios/services/user.service';
import { UsersDTO } from '../../../../auth/interfaces/auth.interface';

@Component({
  selector: 'app-create-page',
  standalone: false,
  templateUrl: './create-page.component.html'
})
export class CreatePageComponent implements OnInit {
  public isLoading: boolean = false;
  public clientForm!: FormGroup;
  public states: States[] = [];
  public municipalitys: Municipality[] = [];
  public towns: Town[] = [];
  public users: UsersDTO[] = [];

  public stateControl = new FormControl<States | null>(null);
  public filteredStates!: Observable<States[]>;
  public stateSelected: boolean = false;

  public municipalityControl = new FormControl<Municipality | null>(null);
  public filteredMunicipality!: Observable<Municipality[]>;

  public coloniaControl = new FormControl<Town | null>(null);
  public filteredColonia!: Observable<Town[]>;

  public userControl = new FormControl<UsersDTO | null>(null);
  public filteredUser!: Observable<UsersDTO[]>;

  public isEditMode: boolean = false;
  private clientId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private clientsService: ClientesService,
    private router: Router,
    private validatorsService: ValidatorsService,
    private snackBar: MatSnackBar,
    private location: Location,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.clientForm = this.fb.group({
      businessName: [ '', Validators.required ],
      contactName: [ '', Validators.required ],
      phone: [ '', [Validators.required, Validators.pattern(this.validatorsService.phonePatter) ] ] ,
      email: [ ''],
      paymentDays: [ '', [ Validators.required ] ],
      creditLimit: [ '', [ Validators.required ] ],
      notes: [ '' ],
      street: [ '', [ Validators.required ] ],
      outsideNumber: [ '', [ Validators.required ] ],
      interiorNumber: [ '' ],
      zipCode: [ '', [ Validators.required, Validators.pattern(this.validatorsService.zipCodePatter) ] ],
      state: [ '', [ Validators.required ] ],
      municipality: [ '', [ Validators.required ] ],
      colonia: [ '', [ Validators.required ] ],
      userId: [ , [ Validators.required ] ]
    });

    this.loadUser();
  
    const client = history.state['client'];
    if (client && client.clientId) {
      this.isEditMode = true;
      this.clientId = client.clientId;

      // Esperar que se cargue el catálogo de estados antes de setear el estado
      this.loadStates().then(() => {
        this.patchClientForm(client);
      });
    } else {
      this.loadStates();
    }
  }

  isValidField = ( field: string ) => {
    return this.validatorsService.isValidField( this.clientForm, field );
  }

  loadUser(): void {
    this.userService.listUsers().subscribe(response => {
      this.users = response.result!.filter(user => user.status === 1);

      this.filteredUser = this.userControl.valueChanges.pipe(
        startWith(''),
        map(value => {
          const searchValue = typeof value === 'string' ? value.toLowerCase() : this.displayFnUser(value!).toLowerCase();
          return this.users.filter(user => 
            this.displayFnUser(user).toLowerCase().includes(searchValue)
          );
        })
      );
    });
  }

  displayFnUser(user: UsersDTO): string {
    return `${user?.firstName ?? ''} ${user?.lastName ?? ''} ${user?.mLastName ?? ''}`.trim();
  }

  onUserSelected(user: UsersDTO): void {
    this.clientForm.get('userId')?.setValue(user?.userId);
  }

  loadStates(): Promise<void> {
    return new Promise((resolve) => {
      this.clientsService.getStates().subscribe(response => {
        this.states = response.result;

        this.filteredStates = this.stateControl.valueChanges.pipe(
          startWith(''),
          map(value => {
            const searchValue = typeof value === 'string' ? value.toLowerCase() : value?.d_estado?.toLowerCase() ?? '';
            return this.states.filter(s =>
              s.d_estado.toLowerCase().includes(searchValue)
            );
          })
        );

        resolve(); // <- importante
      });
    });
  }

  displayFn(state: States): string {
    return state?.d_estado ?? '';
  }

  onStateSelected(state: States): void {
    this.clientForm.get('state')?.setValue(state?.c_estado);
    this.stateControl.setValue(state);

    // Limpia municipio y colonia
    this.clientForm.get('municipality')?.reset();
    this.clientForm.get('colonia')?.reset();
    this.municipalityControl.reset();
    this.coloniaControl.reset();

    this.onStateChangeManual(state?.c_estado);
  }

  onStateChangeManual(selectedState: string): void {
    if (selectedState) {
      this.stateSelected = true;
      this.loadMunicipality(selectedState);
      this.clientForm.get('municipality')?.enable();
    } else {
      this.stateSelected = false;
      this.municipalitys = [];
      this.clientForm.get('municipality')?.disable();
    }
  }

  loadMunicipality(stateCode: string): Promise<void> {
    return new Promise((resolve) => {
      const data = { c_estado: stateCode };

      this.isLoading = true;

      this.clientsService.getMunicipalityByState(data).subscribe(response => {
        this.municipalitys = response.result;
        this.filteredMunicipality = this.municipalityControl.valueChanges.pipe(
          startWith(''),
          map(value => {
            const searchValue = typeof value === 'string' ? value.toLowerCase() : value?.d_mnpio?.toLowerCase() ?? '';
            return this.municipalitys.filter(s =>
              s.d_mnpio.toLowerCase().includes(searchValue)
            );
          })
        );

        this.isLoading = false;
        resolve();
      });
    });
  }

  displayFnMun(municipality: Municipality): string {
    return municipality?.d_mnpio ?? '';
  }

  onMunicipalitySelected(municipality: Municipality): void {
    this.clientForm.get('municipality')?.setValue(municipality.c_mnpio);
    this.municipalityControl.setValue(municipality);

    // Limpia colonia
    this.clientForm.get('colonia')?.reset();
    this.coloniaControl.reset();

    this.onMunicipalityChange(municipality.c_mnpio);
  }

  onMunicipalityChange(selectedMunicipality: string): void {
    const selectedState = this.stateControl.value?.c_estado;
    console.log({selectedState})

    if (selectedMunicipality && selectedState) {
      this.loadTowns(selectedState, selectedMunicipality);
      this.clientForm.get('colonia')?.enable();
    } else {
      this.clientForm.get('colonia')?.disable();
    }
  }

  displayFnCol(colonia: Town): string {
    return colonia?.d_asenta ?? '';
  }

  onColoniaSelected(colonia: Town): void {
    this.clientForm.get('colonia')?.setValue(colonia?.id_asenta_cpcons);
  }

  loadTowns(stateCode: string, municipality: string): Promise<void> {
    const data: TownRequest = {
      c_estado: stateCode,
      c_mnpio: municipality
    };

    this.isLoading = true;

    return new Promise((resolve) => {
      this.clientsService.getTownByStateAndMunicipality(data).subscribe(response => {
        console.log('loadTowns', response)
        this.towns = response.result;
        this.filteredColonia = this.coloniaControl.valueChanges.pipe(
          startWith(''),
          map(value => {
            const searchValue = typeof value === 'string' ? value.toLowerCase() : value?.d_asenta?.toLowerCase() ?? '';
            return this.towns.filter(s =>
              s.d_asenta.toLowerCase().includes(searchValue)
            );
          })
        );
        this.isLoading = false;
        resolve();
      });
    });
  }

  onZipCodeInput(): void {
    const zipCode = this.clientForm.get('zipCode')?.value;

    if (zipCode && zipCode.length === 5) {
      this.getCP(zipCode);
    }
  }

  getCP(zipCode: string): void {
    const data: CPRequest = {
      postalCode: zipCode
    };

    this.isLoading = true;

    this.clientsService.getCP(data).subscribe({
      next: (response) => {
        if (response && response.result) {
          console.log('GetCP', response)
          const result = response.result;

          const estadoObj = this.states.find(s => s.c_estado === result.c_estado);
          if (estadoObj) {
            this.stateControl.setValue(estadoObj, { emitEvent: false });
            this.clientForm.get('state')?.setValue(estadoObj.c_estado);
          }

          this.loadMunicipality(result.c_estado).then(() => {
            setTimeout(() => {
              const municipioObj = this.municipalitys.find(m => m.c_mnpio === result.c_mnpio);
              if (municipioObj) {
                this.municipalityControl.setValue(municipioObj, { emitEvent: false });
                this.clientForm.get('municipality')?.setValue(municipioObj.c_mnpio);
              }
            });

            this.loadTowns(result.c_estado, result.c_mnpio).then(() => {
              if (result.neighborhoods.length > 0) {
                const firstTown = result.neighborhoods[0];

                this.clientForm.get('colonia')?.setValue(firstTown.id_asenta_cpcons);

                const coloniaObj = this.towns.find(t => t.id_asenta_cpcons === firstTown.id_asenta_cpcons);
                if (coloniaObj) this.coloniaControl.setValue(coloniaObj, { emitEvent: false });
              }

              this.isLoading = false;
            });
          });
        } else if (response?.error) {
          this.snackBar.open(response.error.message || 'No se encontró información para el Código Postal', 'Cerrar', { duration: 3000 });
          this.isLoading = false;
        }
      },
      error: (err) => {
        console.error('Error al consultar el CP:', err);
        this.snackBar.open('Ocurrió un error al buscar el código postal. Intenta nuevamente.', 'Cerrar', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  // onSubmit() {
  //   if (this.clientForm.invalid) {
  //     this.clientForm.markAllAsTouched();

  //     return;
  //   }
  //   const { businessName, contactName, phone, address, email, paymentDays, creditLimit, notes,
  //           street, outsideNumber, interiorNumber, zipCode, state, municipality, colonia, userId
  //   } = this.clientForm.value;
    
  //   const data: CreateClientRequest = {
  //     businessName,
  //     contactName,
  //     phoneNumber: phone,
  //     email,
  //     rfc: '',
  //     address,
  //     paymentDays,
  //     creditLimit,
  //     notes,
  //     cve_CodigoPostal: zipCode,
  //     cve_Estado: state,
  //     cve_Municipio: municipality,
  //     cve_Colonia: colonia,
  //     street,
  //     extNbr: outsideNumber,
  //     innerNbr: interiorNumber,
  //     userId 
  //   }

  //   this.isLoading = false;

  //   this.clientsService.createClient( data ).subscribe({
  //     next: (response) => {
  //       if(response.result) {
  //         this.snackBar.open(`Cliente creado correctamente`, 'Cerrar', { duration: 300, });
  //         this.clientForm.reset();
  //         this.isLoading = false;
          
  //         setTimeout(() => {
  //           this.router.navigate(['/sic/inicio/clientes'])
  //         }, 100);
  //       }
        
  //     },
  //     error: (err) => {
  //       this.isLoading = false;
  //       this.snackBar.open('Error al crear cliente.', 'Cerrar', { duration: 3000 });
  //       this.clientForm.reset();
  //     }
  //   });
  // }

  onSubmit() {
    if (this.clientForm.invalid) {
      this.clientForm.markAllAsTouched();
      return;
    }

    const {
      businessName, contactName, phone, address, email,
      paymentDays, creditLimit, notes, street, outsideNumber,
      interiorNumber, zipCode, state, municipality, colonia, userId
    } = this.clientForm.value;

    const baseData: CreateClientRequest = {
      businessName,
      contactName,
      phoneNumber: phone,
      email,
      rfc: '',
      notes,
      paymentDays,
      creditLimit,
      address,
      street,
      extNbr: outsideNumber,
      innerNbr: interiorNumber,
      cve_CodigoPostal: zipCode,
      cve_Estado: state,
      cve_Municipio: municipality,
      cve_Colonia: colonia,
      userId
    };

    const data: CreateClientRequest | UpdateClientRequest = this.isEditMode
      ? { ...baseData, clientId: this.clientId! }
      : baseData;

    const request$ = this.isEditMode
      ? this.clientsService.updateClient(data as UpdateClientRequest)
      : this.clientsService.createClient(data as CreateClientRequest);

    this.isLoading = true;

    request$.subscribe({
      next: (response) => {
        this.snackBar.open(
          this.isEditMode ? 'Cliente actualizado correctamente' : 'Cliente creado correctamente',
          'Cerrar', { duration: 3000 }
        );
        this.clientForm.reset();
        this.isLoading = false;
        setTimeout(() => this.router.navigate(['/sic/inicio/clientes']), 100);
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Error al guardar cliente.', 'Cerrar', { duration: 3000 });
      }
    });
  }


  goBack() {
    this.location.back();
  }

  private patchClientForm(client: any): void {
    this.clientForm.patchValue({
      businessName: client.businessName,
      contactName: client.contactName,
      phone: client.phoneNumber,
      email: client.email,
      paymentDays: client.paymentDays,
      creditLimit: client.creditLimit,
      notes: client.notes,
      street: client.street,
      outsideNumber: client.extNbr,
      interiorNumber: client.innerNbr,
      zipCode: client.cve_CodigoPostal,
      state: client.cve_Estado,
      municipality: client.cve_Municipio,
      colonia: client.cve_Colonia,
      userId: client.userId
    });

    const estadoObj = this.states.find(s => s.c_estado === client.cve_Estado);
    if (estadoObj) this.stateControl.setValue(estadoObj, { emitEvent: false });

    this.loadMunicipality(client.cve_Estado).then(() => {
      const municipioObj = this.municipalitys.find(m => m.c_mnpio === client.cve_Municipio);
      if (municipioObj) {
        this.municipalityControl.setValue(municipioObj, { emitEvent: false });
        this.clientForm.get('municipality')?.setValue(municipioObj.c_mnpio);
      }

      return this.loadTowns(client.cve_Estado, client.cve_Municipio);
    }).then(() => {
      const coloniaObj = this.towns.find(t => t.id_asenta_cpcons === client.cve_Colonia);
      if (coloniaObj) {
        this.coloniaControl.setValue(coloniaObj, { emitEvent: false });
        this.clientForm.get('colonia')?.setValue(coloniaObj.id_asenta_cpcons);
      }
    });

    const userObj = this.users.find(u => u.userId === client.userId);
    if (userObj) this.userControl.setValue(userObj, { emitEvent: false });
  }

}
