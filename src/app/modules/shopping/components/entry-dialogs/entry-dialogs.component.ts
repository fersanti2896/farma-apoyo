import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import { DetailsEntryResponse } from '../../../interfaces/entrey-sumarry.interface';

@Component({
  selector: 'app-entry-dialogs',
  standalone: false,
  templateUrl: './entry-dialogs.component.html'
})
export class EntryDialogsComponent {
  constructor(
    public dialogRef: MatDialogRef<EntryDialogsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DetailsEntryResponse
  ) {}

  generatePDF(): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const entry = this.data;

    const formatter = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2
    });

    const logoImg = new Image();
    logoImg.src = 'assets/logos/inventory.png';

    logoImg.onload = () => {
      const today = new Date().toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

      // === ENCABEZADO ===
      doc.addImage(logoImg, 'PNG', 10, 10, 30, 30);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('FARMA APOYO', pageWidth / 2, 20, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.text('NOTA DE PEDIDO | COMPRA', pageWidth / 2, 28, { align: 'center' });

      doc.setFontSize(10);
      doc.text(`Fecha: ${today}`, pageWidth - 14, 20, { align: 'right' });

      // === BLOQUES DE INFORMACIÓN ===
      const leftX = 14;
      const rightX = pageWidth / 2 + 10;
      let currentY = 45;

      doc.setFontSize(11);
      doc.text(`Factura: ${entry.invoiceNumber || '-'}`, leftX, currentY);
      doc.text(`Proveedor: ${entry.businessName}`, leftX, currentY += 8);
      const obsText = `Observaciones: ${entry.observations || '-'}`;
      const obsLines = doc.splitTextToSize(obsText, pageWidth / 2 - 20);
      doc.text(obsLines, leftX, currentY += 8);
      currentY += obsLines.length * 5;


      let rightY = 45;
      doc.text(`Fecha Registro: ${new Date(entry.entryDate).toLocaleDateString()}`, rightX, rightY);
      doc.text(`Fecha de Pago: ${new Date(entry.expectedPaymentDate).toLocaleDateString()}`, rightX, rightY += 8);
      doc.text(`Monto Total: ${formatter.format(entry.totalAmount)}`, rightX, rightY += 8);

      // === TABLA DE PRODUCTOS ===
      const columns = ['Producto', 'Cantidad', 'Lote', 'Fecha Caducidad', 'Precio Unitario', 'Subtotal'];
      const rows = entry.productsDetails.map(prod => [
        prod.productName,
        prod.quantity,
        prod.lot || '-',
        prod.expirationDate ? new Date(prod.expirationDate).toLocaleDateString() : '-',
        formatter.format(prod.unitPrice),
        formatter.format(prod.subTotal)
      ]);

      const tableY = Math.max(currentY, rightY) + 10;

      autoTable(doc, {
        head: [columns],
        body: rows,
        startY: tableY,
        margin: { bottom: 20 },
        styles: {
          fontSize: 10,
          cellPadding: 3
        },
        headStyles: {
          fillColor: [25, 118, 210],
          textColor: 255,
          halign: 'center'
        },
        columnStyles: {
          1: { halign: 'center' },
          2: { halign: 'center' },
          3: { halign: 'center' },
          4: { halign: 'right' },
          5: { halign: 'right' }
        },
        didDrawPage: () => {
          const str = `Página ${doc.getNumberOfPages()}`;
          doc.setFontSize(9);
          doc.text(str, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, {
            align: 'center'
          });
        }
      });

      doc.save(`NotaPedido_${entry.entryId}.pdf`);
    };
  }
  
  close(): void {
    this.dialogRef.close();
  }
}
