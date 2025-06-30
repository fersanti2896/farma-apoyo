import { Injectable } from '@angular/core';
import { GlobalStateService } from '../../shared/services';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  constructor(
    private globalStateService: GlobalStateService
  ) { }

  logout(): void {
    this.globalStateService.clearState();
  }
}
