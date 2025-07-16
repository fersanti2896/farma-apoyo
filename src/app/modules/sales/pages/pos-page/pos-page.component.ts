import { Component } from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

import { GlobalStateService } from '../../../../shared/services';
import { SalesService } from '../../services/sales.service';
import { UserInfoCreditDTO } from '../../../../dashboard/interfaces/user.interface';
import { ClientByUserDTO } from '../../../interfaces/client.interface';
import { ProductDialogComponent } from '../../components/product-dialog/product-dialog.component';
import { ProductStockDTO } from '../../../interfaces/product.interface';
import { SalesAlertDialogComponent } from '../../components/sales-alert-dialog/sales-alert-dialog.component';
import { CreateSaleRequest, DetailSaleByIdRequest, SaleDTO } from '../../../interfaces/sale.interface';
import { PackagingService } from '../../../packaging/services/packaging.service';
import { TicketDialogComponent } from '../../../packaging/components/ticket-dialog/ticket-dialog.component';

@Component({
  selector: 'modules-sales-pos-page',
  standalone: false,
  templateUrl: './pos-page.component.html',
})
export class PosPageComponent {
  public posForm!: FormGroup;
  public sellerName: string = '';
  public creditInfoUser!: UserInfoCreditDTO;
  public availableCreditUser: number = 0;
  public clientsByUser: ClientByUserDTO[] = [];
  public availableCredit: number = 0;
  public isBlocked: string = 'Desconocido';
  public isLoading: boolean = false;
  public productsStock: ProductStockDTO[] = [];
  public isRegisterDisabled: boolean = true;

  constructor(
    private fb: FormBuilder, 
    private snackbar: MatSnackBar,
    private globalStateService: GlobalStateService,
    private packingService: PackagingService,
    private salesService: SalesService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.posForm = this.fb.group({
      selectedClientId: [''],
      products: this.fb.array([]),
    });

    const { fullName } = this.globalStateService.getUser();
    this.sellerName = fullName;

    this.loadCreditInfoUser();
    this.loadClientsByUser();

    this.posForm.get('selectedClientId')?.valueChanges.subscribe(() => {
      this.onClientChange();
      this.validateSaleConditions();
    });
  }

  validateSaleConditions(): void {
    // Validación del vendedor
    if (this.availableCreditUser <= 0) {
      this.isRegisterDisabled = true;
      this.openWarning('No tienes crédito disponible como vendedor. Por favor, notificar a administración.');
      return;
    }

    const selectedId = this.posForm.get('selectedClientId')?.value;
    const client = this.clientsByUser.find(c => c.clientId === +selectedId);

    if (!client) {
      this.isRegisterDisabled = true;
      return;
    }

    // Cliente sin crédito
    if (client.availableCredit <= 0) {
      this.isRegisterDisabled = true;
      this.openWarning('El cliente no tiene crédito disponible para realizar compras. Por favor, notificar a administración.');
      return;
    }

    // Cliente bloqueado
    if (client.isBlocked === 1) {
      this.isRegisterDisabled = true;
      this.openWarning('El cliente está bloqueado y no puede realizar compras. Por favor, notificar a administración.');
      return;
    }

    this.isRegisterDisabled = false;
  }

  openWarning(message: string): void {
    this.dialog.open(SalesAlertDialogComponent, {
      width: '400px',
      data: { message }
    });
  }

  loadCreditInfoUser(): void {
    this.isLoading = true;

    this.salesService.creditInfo().subscribe({
      next: (response) => {
        if (response.result) {
          this.creditInfoUser = response.result;
          this.availableCreditUser = response.result.availableCredit;
          setTimeout(() => {
            this.validateSaleConditions();
          }, 300); 
        }
        this.isLoading = false;
      },
      error: () => this.isLoading = false,
    });


  }

  loadClientsByUser(): void {
    this.isLoading = true;

    this.salesService.getClienteByUser().subscribe({
      next: (response) => {
        if(response.result) {
          console.log(response)
          this.clientsByUser = response.result;
        }
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  get products(): FormArray {
    return this.posForm.get('products') as FormArray;
  }

  onClientChange(): void {
    const selectedId = this.posForm.get('selectedClientId')?.value;
    const client = this.clientsByUser.find(c => c.clientId === +selectedId);
    this.availableCredit  = client?.availableCredit ?? 0;
    this.isBlocked = client?.isBlocked == 0 ? 'Activo' : 'Bloqueado'
  }

  openProductDialog(): void {
    this.salesService.getProductStock().subscribe({
      next: (response) => {
        const productList = response.result;
        console.log(productList)
        const dialogRef = this.dialog.open(ProductDialogComponent, {
          width: '500px',
          data: productList
        });

        dialogRef.afterClosed().subscribe((result: any) => {
          if (result) {
            const alreadyExists = this.products.controls.some(p => p.get('productId')?.value === result.productId);

            if (alreadyExists) {
              this.snackBar.open('Este producto ya fue agregado.', 'Cerrar', {
                duration: 3000,
                panelClass: 'snack-warn'
              });
            } else {
              this.products.push(this.fb.group({
                productId: [result.productId],
                productName: [result.productName],
                quantity: [result.quantity],
                defaultPrice: [result.defaultPrice],
                customPrice: [result.customPrice]
              }));

              this.snackBar.open('Producto agregado correctamente.', 'Cerrar', {
                duration: 2000,
                panelClass: 'snack-success'
              });
            }
          }
        });  
      },
      error: () => {
        this.snackBar.open('Error al cargar productos.', 'Cerrar', { duration: 3000, panelClass: 'snack-error' });
      }
    });
  }

  removeProduct(index: number): void {
    this.products.removeAt(index);
  }

  getTotal(): number {
    return this.products.controls.reduce((sum, group) => {
      const { quantity, customPrice } = group.value;
      return sum + quantity * customPrice;
    }, 0);
  }

  registerSale(): void {
    const selectedClientId = this.posForm.get('selectedClientId')?.value;

    if (!selectedClientId) {
      this.openWarning('Debe seleccionar un cliente antes de registrar la venta.');
      return;
    }

    if (this.products.length === 0) {
      this.openWarning('Debe agregar al menos un producto para registrar la venta.');
      return;
    }

    const products = this.products.controls.map(group => {
      return {
        productId: group.get('productId')?.value,
        quantity: group.get('quantity')?.value,
        unitPrice: group.get('customPrice')?.value
      };
    });

    const totalAmount = this.getTotal();

    if (totalAmount > this.availableCredit) {
      this.openWarning(`El total de la venta ($${totalAmount.toLocaleString()}) excede el crédito disponible del cliente ($${this.availableCredit.toLocaleString()}).`);
      return;
    }

    const request: CreateSaleRequest = {
      clientId: +selectedClientId,
      totalAmount,
      products
    };

    this.isLoading = true;

    this.salesService.createSale(request).subscribe({
      next: (response) => {
        this.isLoading = false;

        if (response.error) {
          this.openWarning(`Error al registrar la venta: ${response.error.message}`);
          return;
        }

        const saleId = Number(response.result?.msg);

        this.snackbar.open('Venta registrada correctamente', 'Cerrar', {
          duration: 2500,
          panelClass: 'snack-success'
        });

        const client = this.clientsByUser.find(c => c.clientId === +selectedClientId);

        const sale: SaleDTO = {
          saleId: saleId,
          clientId: +selectedClientId,
          businessName: client?.businessName ?? '',
          saleStatusId: 2,
          statusName: 'En proceso',
          totalAmount: totalAmount,
          saleDate: new Date().toISOString(),
          vendedor: this.sellerName,
          repartidor: '' // puedes llenarlo si lo asignas más adelante
        };

        this.openDetailsTicket(sale);

        this.resetForm();
      },
      error: () => {
        this.isLoading = false;
        this.openWarning('Ocurrió un error al registrar la venta.');
      }
    });
  }

  resetForm(): void {
    this.posForm.get('selectedClientId')?.reset('');
    this.products.clear();
    this.availableCredit = 0;
    this.isBlocked = 'Desconocido';
    this.isRegisterDisabled = true;
  }

  openDetailsTicket(sale: SaleDTO): void {
    const request = { saleId: sale.saleId };

    this.packingService.postDetailSaleById(request).subscribe({
      next: (response) => {
        if (response.result) {
          this.dialog.open(TicketDialogComponent, {
            width: '200px',
            height: '70%',
            data: {
              sale: sale,             // Info general del ticket
              details: response.result // Lista de productos vendidos
            }
          });
        }
      },
      error: () => {
        this.snackBar.open('Error al obtener detalles del ticket.', 'Cerrar', { duration: 3000 });
      }
    });
  }
}
