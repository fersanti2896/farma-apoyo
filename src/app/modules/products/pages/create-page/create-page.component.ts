import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ProductService } from '../../services/product.service';
import { ValidatorsService } from '../../../../shared/services';
import { CreateProductRequest } from '../../../interfaces/product.interface';

@Component({
  selector: 'modules-products-create-page',
  standalone: false,
  templateUrl: './create-page.component.html',
})
export class CreatePageComponent {
  public isLoading: boolean = false;
  public productForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private router: Router,
    private validatorsService: ValidatorsService,
    private snackBar: MatSnackBar,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.productForm = this.fb.group({
      productName: ['', Validators.required],
      description: [''],
      barcode: [''],
      unit: [''],
      price: ['', Validators.required]
    });
  }

  isValidField = ( field: string ) => {
    return this.validatorsService.isValidField( this.productForm, field );
  }

  onSubmit() {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();

      return;
    }

    const { productName, description, barcode, unit, price } = this.productForm.value;
    
    const data: CreateProductRequest = { productName, description, barcode, unit, price }

    this.isLoading = true;

    this.productService.createProduct( data ).subscribe({
      next: (response) => {
        if(response.result) {
          this.snackBar.open(`Producto creado correctamente`, 'Cerrar', { duration: 300, });
          this.productForm.reset();
          this.isLoading = false;
          
          setTimeout(() => {
            this.router.navigate(['/sic/inicio/productos'])
          }, 100);
        }
        
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open('Error al crear producto.', 'Cerrar', { duration: 3000 });
        this.productForm.reset();
      }
    });
  }

  goBack() {
    this.location.back();
  }
}
