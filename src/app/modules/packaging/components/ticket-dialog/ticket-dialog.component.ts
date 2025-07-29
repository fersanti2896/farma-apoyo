import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

import { jsPDF } from 'jspdf';

import { DetailsSaleDTO, SaleDTO, TicketData } from '../../../interfaces/sale.interface';
import { numeroALetras } from '../../../../shared/helpers/number-to-words.helper';

@Component({
  selector: 'app-ticket-dialog',
  standalone: false,
  templateUrl: './ticket-dialog.component.html'
})
export class TicketDialogComponent {
  public sale: SaleDTO;
  public details: DetailsSaleDTO[];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: TicketData
  ) {
    this.sale = data.sale;
    this.details = data.details;
  }

  getTotalEnLetra(): string {
    return numeroALetras(this.sale.totalAmount);
  }

  printTicket(): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [55, 130 + this.details.length * 8]
    });

    const formatter = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2
    });

    const date = new Date(this.details[0].createDate);
    const timeStr = date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });
    const dateStr = date.toLocaleDateString('es-MX');

    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 6;

    const logo = new Image();
    logo.src = 'assets/logos/inventory.png';

    logo.onload = () => {
      doc.addImage(logo, 'PNG', pageWidth / 2 - 12, y, 25, 18);
      y += 18;

      doc.setFontSize(10);
      doc.setFont('courier', 'bold');
      doc.text('DISTRIBUIDORA', pageWidth / 2, y+2, { align: 'center' });
      y += 4;
      doc.text('FARMACÉUTICA', pageWidth / 2, y+2, { align: 'center' });

      y += 6;
      doc.setFont('courier', 'bold');
      doc.text('VENDEDOR', pageWidth / 2, y+2, { align: 'center' });
      y += 4;
      doc.text(this.details[0].vendedor, pageWidth / 2, y+2, { align: 'center' });

      y += 6;
      doc.setDrawColor(150);
      doc.line(5, y, pageWidth - 5, y);
      y += 4;

      doc.setFont('courier', 'bold');
      doc.setFontSize(11);
      doc.text(`TICKET: ${this.sale.saleId}`, 5, y);
      y += 5;

      doc.setFont('courier', 'normal');
      doc.setFontSize(10);
      doc.text(`HORA: ${timeStr}`, 5, y);
      y += 4;
      doc.text(`FECHA: ${dateStr}`, 5, y);
      y += 4;
      doc.text(`REPARTIDOR:`, 5, y);
      y += 4;

      const repartidorLines = this.splitRepartidorName(this.details[0].repartidor, pageWidth - 10, doc);
        repartidorLines.forEach(line => {
          doc.text(line, 5, y);
          y += 4;
      });

      doc.line(5, y, pageWidth - 5, y);
      y += 4;

      // Productos
      this.details.forEach(item => {
        doc.setFont('courier', 'normal');
        doc.setFontSize(8);
        doc.text(item.productName, 5, y);
        y += 4;

        const qtyStr = `${item.quantity} x ${formatter.format(item.unitPrice)}`;
        const totalStr = formatter.format(item.subTotal);
        doc.text(qtyStr, 5, y);
        doc.text(totalStr, pageWidth - 5, y, { align: 'right' });
        y += 5;
      });

      doc.line(5, y, pageWidth - 5, y);
      y += 5;

      doc.setFont('courier', 'bold');
      doc.setFontSize(12);
      doc.text('TOTAL:', 5, y);
      doc.text(formatter.format(this.sale.totalAmount), pageWidth - 5, y, { align: 'right' });
      y += 4;

      // Total en letras (multilínea)
      doc.setFont('courier', 'italic');
      doc.setFontSize(8);
      const letrasMonto = doc.splitTextToSize(this.getTotalEnLetra(), pageWidth - 10);
      doc.text(letrasMonto, pageWidth / 2, y, { align: 'center' });
      y += letrasMonto.length * 4;

      // Cliente
      doc.setFont('courier', 'bold');
      doc.setFontSize(10);
      doc.text('CLIENTE:', pageWidth / 2, y, { align: 'center' });
      y += 4;

      doc.setFont('courier', 'bold');
      const clienteLines = doc.splitTextToSize(this.sale.businessName, pageWidth - 10);
      clienteLines.forEach((line: any) => {
        doc.text(line, pageWidth / 2, y, { align: 'center' });
        y += 4;
      });

      doc.line(5, y, pageWidth - 5, y);
      y += 5;

      // Footer
      doc.setFontSize(8);
      doc.setFont('courier', 'bold');
      doc.text('DUDAS O ACLARACIONES', pageWidth / 2, y, { align: 'center' });
      y += 4;
      doc.text('farma.apoyo.oficial@gmail.com', pageWidth / 2, y, { align: 'center' });
      y += 4;
      doc.text('OFICINA: 55-83-24-81-85', pageWidth / 2, y, { align: 'center' });
      y += 6;

      doc.setFontSize(9);
      doc.setFont('courier', 'bold');
      doc.text('GRACIAS POR SU COMPRA', pageWidth / 2, y, { align: 'center' });

      // 🖨 Abrimos ventana de impresión automática
      window.open(doc.output('bloburl'), '_blank');
    };
  }

  downloadTicket(): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [55, 130 + this.details.length * 8] // altura dinámica
    });

    const formatter = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2
    });

    const date = new Date(this.details[0].createDate);
    const timeStr = date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });
    const dateStr = date.toLocaleDateString('es-MX');

    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 10;

    const logo = new Image();
    logo.src = 'assets/logos/inventory.png';

    logo.onload = () => {
      doc.addImage(logo, 'PNG', pageWidth / 2 - 8, y, 16, 16);
      y += 18;

      doc.setFontSize(8);
      doc.setFont('courier', 'bold');
      doc.text('DISTRIBUIDORA', pageWidth / 2, y, { align: 'center' });
      y += 4;
      doc.text('FARMACÉUTICA', pageWidth / 2, y, { align: 'center' });

      y += 6;
      doc.setFont('courier', 'normal');
      doc.text('VENDEDOR', pageWidth / 2, y, { align: 'center' });
      y += 4;
      doc.text(this.details[0].vendedor, pageWidth / 2, y, { align: 'center' });

      y += 6;
      doc.setDrawColor(150);
      doc.line(5, y, pageWidth - 5, y);
      y += 4;

      doc.setFont('courier', 'bold');
      doc.setFontSize(10);
      doc.text(`TICKET: ${this.sale.saleId}`, 5, y);
      y += 5;

      doc.setFont('courier', 'normal');
      doc.setFontSize(8);
      doc.text(`HORA: ${timeStr}`, 5, y);
      y += 4;
      doc.text(`FECHA: ${dateStr}`, 5, y);
      y += 4;
      doc.text(`REPARTIDOR: ${this.details[0].repartidor}`, 5, y);
      y += 4;

      doc.line(5, y, pageWidth - 5, y);
      y += 4;

      // Productos
      this.details.forEach(item => {
        doc.setFont('courier', 'normal');
        doc.setFontSize(7);
        doc.text(item.productName, 5, y);
        y += 4;

        const qtyStr = `${item.quantity} x ${formatter.format(item.unitPrice)}`;
        const totalStr = formatter.format(item.subTotal);
        doc.text(qtyStr, 5, y);
        doc.text(totalStr, pageWidth - 5, y, { align: 'right' });
        y += 5;
      });

      doc.line(5, y, pageWidth - 5, y);
      y += 5;

      // Total
      doc.setFont('courier', 'bold');
      doc.setFontSize(9);
      doc.text('TOTAL:', 5, y);
      doc.text(formatter.format(this.sale.totalAmount), pageWidth - 5, y, { align: 'right' });
      y += 4;

      // Total en letras (multilínea)
      doc.setFont('courier', 'italic');
      doc.setFontSize(7);
      const letrasMonto = doc.splitTextToSize(this.getTotalEnLetra(), pageWidth - 10);
      doc.text(letrasMonto, pageWidth / 2, y, { align: 'center' });
      y += letrasMonto.length * 4;

      // Cliente centrado
      doc.setFont('courier', 'bold');
      doc.setFontSize(8);
      doc.text('CLIENTE:', pageWidth / 2, y, { align: 'center' });
      y += 4;

      doc.setFont('courier', 'normal');
      const clienteLines = doc.splitTextToSize(this.sale.businessName, pageWidth - 10);
      clienteLines.forEach((line: any) => {
        doc.text(line, pageWidth / 2, y, { align: 'center' });
        y += 4;
      });

      doc.line(5, y, pageWidth - 5, y);
      y += 5;

      // Footer
      doc.setFontSize(7);
      doc.setFont('courier', 'bold');
      doc.text('DUDAS O ACLARACIONES', pageWidth / 2, y, { align: 'center' });
      y += 4;
      doc.text('farma.apoyo.oficial@gmail.com', pageWidth / 2, y, { align: 'center' });
      y += 4;
      doc.text('OFICINA: 55-83-24-81-85', pageWidth / 2, y, { align: 'center' });
      y += 6;

      doc.setFontSize(8);
      doc.setFont('courier', 'bold');
      doc.text('GRACIAS POR SU COMPRA', pageWidth / 2, y, { align: 'center' });

      doc.save(`ticket-${this.sale.saleId}.pdf`);
    };
  }

  splitRepartidorName(repartidor: string, width: number, doc: jsPDF): string[] {
    return doc.splitTextToSize(repartidor, width);
  }
}
