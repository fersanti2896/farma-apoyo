import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { GlobalStateService } from '../../../shared/services';
import { DashboardService } from '../../services/dashboard.service';
import { User } from '../../interfaces/user.interface';

@Component({
  selector: 'dashboard-layout-page',
  standalone: false,
  templateUrl: './layout-page.component.html'
})
export class LayoutPageComponent {
  public isSidebarOpen: boolean = false;
  public isUserMenuOpen: boolean = false;
  public currentLanguage: string = 'es';
  public user!: User;

  public sidebarItems = [
    { label: 'Usuarios', icon: 'account_circle', url: '/sic/inicio/usuarios' },
    { label: 'Proveedores', icon: 'diversity_3', url: '/sic/inicio/proveedores' },
    { label: 'Productos', icon: 'list_alt', url: '/sic/inicio/productos' },
    { label: 'Inventario', icon: 'inventory', url: '/sic/inicio/inventario' },
    { label: 'Compras', icon: 'content_paste', url: '/sic/inicio/compras' },
  ];

  constructor(
      private router: Router,
      private dashboardService: DashboardService,
      private globalStateService: GlobalStateService
  ) { }

  ngOnInit(): void {
    this.user = this.globalStateService.getUser()!
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
}
