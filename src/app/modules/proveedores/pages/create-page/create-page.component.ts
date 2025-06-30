import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ProveedoresService } from '../../services/proveedores.service';
import { ValidatorsService } from '../../../../shared/services';
import { CreateSupplierRequest } from '../../../interfaces/supplier.interface';

@Component({
  selector: 'modules-proveedores-create-page',
  standalone: false,
  templateUrl: './create-page.component.html'
})
export class CreatePageComponent {
  public isLoading: boolean = false;
  public supplierForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private supplierService: ProveedoresService,
    private router: Router,
    private validatorsService: ValidatorsService,
    private snackBar: MatSnackBar,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.supplierForm = this.fb.group({
      businessName: ['', Validators.required],
      contactName: ['', Validators.required],
      phone: [''],
      address: [''],
      paymentTerms: [''],
      notes: [''],
    });
  }

  isValidField = ( field: string ) => {
    return this.validatorsService.isValidField( this.supplierForm, field );
  }

  onSubmit() {
    if (this.supplierForm.invalid) {
      this.supplierForm.markAllAsTouched();

      return;
    }

    const { businessName, contactName, phone, address, paymentTerms, notes } = this.supplierForm.value;
    
    const data: CreateSupplierRequest = {
      businessName,
      contactName,
      phone,
      email: '',
      rfc: '',
      address,
      paymentTerms,
      notes
    }

    this.isLoading = true;

    this.supplierService.createSupplier( data ).subscribe({
      next: (response) => {
        if(response.result) {
          this.snackBar.open(`Proveedor creado correctamente`, 'Cerrar', { duration: 300, });
          this.supplierForm.reset();
          this.isLoading = false;
          
          setTimeout(() => {
            this.router.navigate(['/sic/inicio/proveedores'])
          }, 100);
        }
        
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open('Error al crear proveedor.', 'Cerrar', { duration: 3000 });
        this.supplierForm.reset();
      }
    });
  }

  goBack() {
    this.location.back();
  }
}
