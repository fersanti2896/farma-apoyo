import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { GlobalStateService } from '../../../shared/services';
import { DashboardService } from '../../services/dashboard.service';
import { User } from '../../interfaces/user.interface';

@Component({
  selector: 'dashboard-layout-page',
  standalone: false,
  templateUrl: './layout-page.component.html'
})
export class LayoutPageComponent implements OnInit {
  public isSidebarOpen: boolean = false;
  public isUserMenuOpen: boolean = false;
  public currentLanguage: string = 'es';
  public user!: User;
  public sidebarItems!: any;

  @ViewChild('userMenuContainer') userMenuRef!: ElementRef;

  constructor(
      private router: Router,
      private dashboardService: DashboardService,
      private globalStateService: GlobalStateService
  ) { }

  ngOnInit(): void {
    this.user = this.globalStateService.getUser()!
    this.filterSidebarByRole(this.user.roleId);
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    const clickedInside = this.userMenuRef?.nativeElement.contains(event.target);
    if (!clickedInside && this.isUserMenuOpen) {
      this.closeUserMenu();
    }
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  closeSidebar(): void {
    this.isSidebarOpen = false;
  }

  closeUserMenu(): void {
    this.isUserMenuOpen = false;
  }

  logout(): void {
    localStorage.removeItem('refresh_token');
    this.dashboardService.logout();

    this.router.navigate(['/auth/login']);
  }

  filterSidebarByRole(roleId: number): void {
    const fullSidebar = [
      {
        label: 'Almacén',
        icon: 'inventory_2', // 📦 Bodega/Almacén
        roles: [1, 2, 4],
        children: [
          { label: 'Inventario', icon: 'inventory', url: '/sic/inicio/stock', roles: [1, 2, 4] },         // 📋
          { label: 'Compras', icon: 'shopping_cart', url: '/sic/inicio/compras', roles: [1, 2, 4] },       // 🛒
          { label: 'Surtido', icon: 'local_shipping', url: '/sic/inicio/surtido', roles: [1, 2, 4] },      // 🚚
          { label: 'Entregas', icon: 'outbox', url: '/sic/inicio/entregas', roles: [1, 2, 4] },            // 📤
        ]
      },
      {
        label: 'Gestión',
        icon: 'manage_accounts', // 👨‍💼
        roles: [1, 2],
        children: [
          { label: 'Usuarios', icon: 'supervisor_account', url: '/sic/inicio/usuarios', roles: [1] },     // 👥
          { label: 'Proveedores', icon: 'local_mall', url: '/sic/inicio/proveedores', roles: [1, 2] },     // 🛍️
          { label: 'Clientes', icon: 'groups', url: '/sic/inicio/clientes', roles: [1, 2] },               // 👨‍👩‍👧‍👦
          { label: 'Productos', icon: 'category', url: '/sic/inicio/productos', roles: [1, 2] },           // 🏷️
        ]
      },
      {
        label: 'Ventas',
        icon: 'sell', // 💰
        roles: [1, 2, 3, 5],
        children: [
          { label: 'Punto de Venta', icon: 'point_of_sale', url: '/sic/inicio/ventas', roles: [1, 2, 3, 5] }, // 🧾
          { label: 'Productos', icon: 'category', url: '/sic/inicio/productos', roles: [3, 5] }                // 🏷️
        ]
      },
      {
        label: 'Cobranza',
        icon: 'request_quote', // 🧾
        roles: [1, 2, 3],
        url: '/sic/inicio/cobranza'
      },
      {
        label: 'Finanzas',
        icon: 'account_balance_wallet', // 💼
        roles: [1, 2, 3],
        url: '/sic/inicio/finanzas'
      }
    ];

    this.sidebarItems = fullSidebar
      .filter(item => item.roles.includes(roleId))
      .map(group => ({
        ...group,
        expanded: false,
        children: group.children?.filter(child => child.roles?.includes(roleId)) ?? []
      }));
  }
}
