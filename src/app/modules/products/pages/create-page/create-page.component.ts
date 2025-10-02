import { ActivatedRoute, Router } from '@angular/router';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Location } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';

import { CreateProductRequest, ProductDTO, UpdateProductRequest } from '../../../interfaces/product.interface';
import { ProductService } from '../../services/product.service';
import { ValidatorsService } from '../../../../shared/services';

@Component({
  selector: 'modules-products-create-page',
  standalone: false,
  templateUrl: './create-page.component.html',
})
export class CreatePageComponent {
  public isLoading: boolean = false;
  public productForm!: FormGroup;
  public isEditMode = false;
  private productId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private router: Router,
    private validatorsService: ValidatorsService,
    private snackBar: MatSnackBar,
    private location: Location,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.productForm = this.fb.group({
      productName: ['', Validators.required],
      description: [''],
      barcode: [''],
      unit: [''],
      price: ['', Validators.required]
    });

    const product = history.state['product'] as ProductDTO;

    console.log({ product });

    if (product && product.productId) {
      this.isEditMode = true;
      this.productId = product.productId;

      this.productForm.patchValue({
        productName: product.productName,
        description: product.description,
        barcode: product.barcode,
        unit: product.unit,
        price: product.price
      });
    }
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

    const data: CreateProductRequest | UpdateProductRequest = {
      productName,
      description,
      barcode,
      unit,
      price,
      ...(this.isEditMode ? { productId: this.productId! } : {})
    };

    this.isLoading = true;

    const request$ = this.isEditMode
      ? this.productService.editProduct(data as UpdateProductRequest)
      : this.productService.createProduct(data as CreateProductRequest);

    request$.subscribe({
      next: (response) => {
        if (response.result) {
          const msg = this.isEditMode ? 'Producto actualizado correctamente' : 'Producto creado correctamente';
          this.snackBar.open(msg, 'Cerrar', { duration: 300 });
          this.productForm.reset();
          this.isLoading = false;

          setTimeout(() => {
            this.router.navigate(['/sic/inicio/productos']);
          }, 100);
        }
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Error al guardar producto.', 'Cerrar', { duration: 3000 });
      }
    });
  }

  goBack() {
    this.location.back();
  }
}
