import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

import { CreditNoteListDTO } from '../../../interfaces/collection.interface';
import { DetailsNoteCreditDTO, NoteCreditData } from '../../../interfaces/sale.interface';
import { numeroALetras } from '../../../../shared/helpers/number-to-words.helper';

import jsPDF from 'jspdf';

@Component({
  selector: 'app-details-credit-note',
  standalone: false,
  templateUrl: './details-credit-note.component.html'
})
export class DetailsCreditNoteComponent {
  public sale: CreditNoteListDTO;
  public details: DetailsNoteCreditDTO[];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: NoteCreditData
  ) {
    this.sale = data.sale;
    this.details = data.details;
  }

  getTotalEnLetra(): string {
    // total final de la nota en letras
    return numeroALetras(this.sale.finalCreditAmount);
  }

  // ---------- IMPRESIÓN (boleta 58mm) ----------
  printNote(): void {
    const altoDinamico = 130 + (this.details?.length || 0) * 8;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [55, altoDinamico]
    });

    const fmt = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 });
    const date = new Date(this.details[0].createDate);
    const timeStr = date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });
    const dateStr = date.toLocaleDateString('es-MX');

    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 6;

    const logo = new Image();
    logo.src = 'assets/logos/inventory.png';

    logo.onload = () => {
      // Header
      doc.addImage(logo, 'PNG', pageWidth / 2 - 12, y, 25, 18);
      y += 18;

      doc.setFontSize(10);
      doc.setFont('courier', 'bold');
      doc.text('DISTRIBUIDORA', pageWidth / 2, y + 2, { align: 'center' }); y += 4;
      doc.text('FARMACÉUTICA', pageWidth / 2, y + 2, { align: 'center' }); y += 6;

      doc.setDrawColor(150);
      doc.line(5, y, pageWidth - 5, y); y += 4;

      doc.setFont('courier', 'bold');
      doc.setFontSize(11);
      doc.text(`NOTA CRÉDITO: ${this.sale.noteCreditId}`, 5, y); y += 5;

      doc.setFont('courier', 'normal');
      doc.setFontSize(10);
      doc.text(`HORA: ${timeStr}`, 5, y); y += 4;
      doc.text(`FECHA: ${dateStr}`, 5, y); y += 4;
      doc.text(`SOLICITADO POR: ${this.sale.createdBy || this.details[0].creadoPor || ''}`, 5, y); y += 4;
      doc.text(`TICKET A CARGAR: ${this.sale.saleId}`, 5, y); y += 4;

      doc.line(5, y, pageWidth - 5, y); y += 4;

      // Productos
      this.details.forEach(d => {
        doc.setFont('courier', 'normal'); doc.setFontSize(8);
        doc.text(d.productName, 5, y); y += 4;

        const qtyStr = `${d.quantity} x ${fmt.format(d.unitPrice)}`;
        const totalStr = fmt.format(d.subTotal);
        doc.text(qtyStr, 5, y);
        doc.text(totalStr, pageWidth - 5, y, { align: 'right' });
        y += 5;
      });

      doc.line(5, y, pageWidth - 5, y); y += 5;

      // Total
      doc.setFont('courier', 'bold');
      doc.setFontSize(12);
      doc.text('TOTAL:', 5, y);
      doc.text(fmt.format(this.sale.finalCreditAmount), pageWidth - 5, y, { align: 'right' });
      y += 4;

      // Total en letras (multilínea)
      doc.setFont('courier', 'italic'); doc.setFontSize(8);
      const letras = doc.splitTextToSize(this.getTotalEnLetra(), pageWidth - 10);
      doc.text(letras, pageWidth / 2, y, { align: 'center' });
      y += letras.length * 4;

      // Cliente
      doc.setFont('courier', 'bold'); doc.setFontSize(10);
      doc.text('CLIENTE:', pageWidth / 2, y, { align: 'center' }); y += 4;

      doc.setFont('courier', 'bold');
      const clienteLines = doc.splitTextToSize(this.sale.clientName || '', pageWidth - 10);
      clienteLines.forEach((line: any) => { doc.text(line, pageWidth / 2, y, { align: 'center' }); y += 4; });

      doc.line(5, y, pageWidth - 5, y); y += 5;

      // Footer
      doc.setFontSize(9); doc.setFont('courier', 'bold');
      doc.text('DUDAS O ACLARACIONES', pageWidth / 2, y, { align: 'center' }); y += 4;
      doc.text('farma.apoyo.oficial@gmail.com', pageWidth / 2, y, { align: 'center' }); y += 4;
      doc.text('OFICINA: 55-83-24-81-85', pageWidth / 2, y, { align: 'center' }); y += 6;

      doc.setFontSize(10); doc.setFont('courier', 'bold');
      doc.text('¡GRACIAS!', pageWidth / 2, y, { align: 'center' });

      window.open(doc.output('bloburl'), '_blank');
    };
  }

  // ---------- DESCARGA (boleta 58mm) ----------
  downloadNote(): void {
    const altoDinamico = 130 + (this.details?.length || 0) * 8;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [55, altoDinamico] });

    const fmt = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 });
    const date = new Date(this.details[0].createDate);
    const timeStr = date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });
    const dateStr = date.toLocaleDateString('es-MX');

    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 10;

    const logo = new Image();
    logo.src = 'assets/logos/inventory.png';
    logo.onload = () => {
      doc.addImage(logo, 'PNG', pageWidth / 2 - 8, y, 16, 16); y += 18;

      doc.setFontSize(8); doc.setFont('courier', 'bold');
      doc.text('DISTRIBUIDORA', pageWidth / 2, y, { align: 'center' }); y += 4;
      doc.text('FARMACÉUTICA', pageWidth / 2, y, { align: 'center' }); y += 6;

      doc.setFont('courier', 'normal');

      doc.setDrawColor(150); doc.line(5, y, pageWidth - 5, y); y += 4;

      doc.setFont('courier', 'bold'); doc.setFontSize(10);
      doc.text(`NOTA CRÉDITO: ${this.sale.noteCreditId}`, 5, y); y += 5;

      doc.setFont('courier', 'normal'); doc.setFontSize(8);
      doc.text(`HORA: ${timeStr}`, 5, y); y += 4;
      doc.text(`FECHA: ${dateStr}`, 5, y); y += 4;
      doc.text(`SOLICITADO POR: ${this.sale.createdBy || this.details[0].creadoPor || ''}`, 5, y); y += 4;
      doc.text(`TICKET A CARGAR: ${this.sale.saleId}`, 5, y); y += 4;

      doc.line(5, y, pageWidth - 5, y); y += 4;

      this.details.forEach(d => {
        doc.setFont('courier', 'normal'); doc.setFontSize(7);
        doc.text(d.productName, 5, y); y += 4;
        const qtyStr = `${d.quantity} x ${fmt.format(d.unitPrice)}`;
        const totalStr = fmt.format(d.subTotal);
        doc.text(qtyStr, 5, y);
        doc.text(totalStr, pageWidth - 5, y, { align: 'right' });
        y += 5;
      });

      doc.line(5, y, pageWidth - 5, y); y += 5;

      doc.setFont('courier', 'bold'); doc.setFontSize(9);
      doc.text('TOTAL:', 5, y);
      doc.text(fmt.format(this.sale.finalCreditAmount), pageWidth - 5, y, { align: 'right' }); y += 4;

      doc.setFont('courier', 'italic'); doc.setFontSize(7);
      const letras = doc.splitTextToSize(this.getTotalEnLetra(), pageWidth - 10);
      doc.text(letras, pageWidth / 2, y, { align: 'center' }); y += letras.length * 4;

      doc.setFont('courier', 'bold'); doc.setFontSize(8);
      doc.text('CLIENTE:', pageWidth / 2, y, { align: 'center' }); y += 4;
      const clienteLines = doc.splitTextToSize(this.sale.clientName || '', pageWidth - 10);
      clienteLines.forEach((line: any) => { doc.text(line, pageWidth / 2, y, { align: 'center' }); y += 4; });

      doc.line(5, y, pageWidth - 5, y); y += 5;

      doc.setFontSize(7); doc.setFont('courier', 'bold');
      doc.text('DUDAS O ACLARACIONES', pageWidth / 2, y, { align: 'center' }); y += 4;
      doc.text('farma.apoyo.oficial@gmail.com', pageWidth / 2, y, { align: 'center' }); y += 4;
      doc.text('OFICINA: 55-83-24-81-85', pageWidth / 2, y, { align: 'center' }); y += 6;

      doc.setFontSize(8); doc.setFont('courier', 'bold');
      doc.text('¡GRACIAS!', pageWidth / 2, y, { align: 'center' });

      doc.save(`nota-credito-${this.sale.noteCreditId}.pdf`);
    };
  }
}
