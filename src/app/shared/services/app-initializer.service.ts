import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { GlobalStateService } from './global-state.service';
import { AuthService } from '../../auth/services/auth.service';
import { RefreshTokenRequest } from '../../auth/interfaces/auth.interface';

@Injectable({ providedIn: 'root' })
export class AppInitializerService {
  constructor(
    private authService: AuthService,
    private globalState: GlobalStateService
  ) {}

  private clearSession(): void {
    // Limpia subjects
    this.globalState.clearState();
    // Borra cualquier refresh guardado
    localStorage.removeItem('refresh_token');
    sessionStorage.removeItem('refresh_token');
  }

  private isInvalidRefreshError(obj: any): boolean {
    const msg =
      obj?.error?.message ||
      obj?.message ||
      obj?.error ||
      '';
    const code = obj?.error?.code ?? obj?.code;

    // Normaliza el mensaje a minúsculas
    const m = (msg ?? '').toString().toLowerCase();

    return (
      code === 401 ||
      m.includes('refresh token invalido') ||
      m.includes('refresh token inválido') || // con acento
      m.includes('refresh token expirado') ||
      m.includes('refresh token inválido o expirado') ||
      m.includes('invalid refresh token') ||
      m.includes('expired refresh token')
    );
  }

  async initializeApp(): Promise<void> {
    const raw = localStorage.getItem('refresh_token');

    if (!raw || raw === 'undefined' || raw === 'null' || raw.trim() === '') {
      // Nada que refrescar
      this.clearSession();
      return;
    }

    try {
      const body: RefreshTokenRequest = { refreshToken: raw };
      const res = await firstValueFrom(this.authService.refreshAccessToken(body));

      // Algunos backends devuelven { error: {...} } con 200.
      if (this.isInvalidRefreshError(res)) {
        this.clearSession();
        return;
      }

      if (res?.result?.token) {
        this.globalState.setToken(res.result.token);
        this.globalState.setUser(res.result);
        localStorage.setItem('refresh_token', res.result.refreshToken);
        return;
      }

      // Sin result válido → trata como inválido
      this.clearSession();
    } catch (err: any) {
      // Cuando el servidor responde 400/401 con { error: { code: 401, message: "Refresh token inválido o expirado." } }
      if (this.isInvalidRefreshError(err)) {
        this.clearSession();
        return;
      }
      // Otros errores (red, CORS, etc.)
      console.error('Failed to refresh token on app init', err);
      this.clearSession();
    }
  }
}
