import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../../dashboard/interfaces/user.interface';

@Injectable({
  providedIn: 'root',
})
export class GlobalStateService {
  private tokenSubject = new BehaviorSubject<string | null>(null);
  private userSubject = new BehaviorSubject<any | null>(null);
  
  token$: Observable<string | null> = this.tokenSubject.asObservable();
  user$: Observable<User | null> = this.userSubject.asObservable();

  getToken(): string | null {
    return this.tokenSubject.getValue();
  }

  setToken(token: string | null): void {
    this.tokenSubject.next(token);
  }

  clearToken(): void {
    this.tokenSubject.next(null);
  }

  setUser(user: any): void {
    this.userSubject.next(user);
  }

  getUser(): any | null {
    return this.userSubject.getValue();
  }

  clearUser(): void {
    this.userSubject.next(null);
  }

  clearState(): void {
    this.clearToken();
    this.clearUser();
  }

}
