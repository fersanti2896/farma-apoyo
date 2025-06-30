import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ClientesService } from '../../services/clientes.service';
import { ValidatorsService } from '../../../../shared/services';
import { CreateClientRequest } from '../../../interfaces/client.interface';

@Component({
  selector: 'app-create-page',
  standalone: false,
  templateUrl: './create-page.component.html'
})
export class CreatePageComponent {
  public isLoading: boolean = false;
  public clientForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private clientsService: ClientesService,
    private router: Router,
    private validatorsService: ValidatorsService,
    private snackBar: MatSnackBar,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.clientForm = this.fb.group({
      businessName: ['', Validators.required],
      contactName: ['', Validators.required],
      phone: ['', Validators.required],
      address: ['', Validators.required],
      email: [''],
      paymentDays: [],
      creditLimit: [],
      notes: ['']
    });
  }

  isValidField = ( field: string ) => {
    return this.validatorsService.isValidField( this.clientForm, field );
  }

  onSubmit() {
    if (this.clientForm.invalid) {
      this.clientForm.markAllAsTouched();

      return;
    }

    const { businessName, contactName, phone, address, email, paymentDays, creditLimit, notes } = this.clientForm.value;
    
    const data: CreateClientRequest = {
      businessName,
      contactName,
      phoneNumber: phone,
      email,
      rfc: '',
      address,
      paymentDays,
      creditLimit,
      notes
    }

    this.isLoading = true;

    this.clientsService.createClient( data ).subscribe({
      next: (response) => {
        if(response.result) {
          this.snackBar.open(`Cliente creado correctamente`, 'Cerrar', { duration: 300, });
          this.clientForm.reset();
          this.isLoading = false;
          
          setTimeout(() => {
            this.router.navigate(['/sic/inicio/clientes'])
          }, 100);
        }
        
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open('Error al crear cliente.', 'Cerrar', { duration: 3000 });
        this.clientForm.reset();
      }
    });
  }

  goBack() {
    this.location.back();
  }
}
