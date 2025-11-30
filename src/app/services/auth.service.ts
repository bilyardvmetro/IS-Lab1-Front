import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {BehaviorSubject, map, Observable, tap} from 'rxjs';

export type UserRole = 'USER' | 'ADMIN';

export interface CurrentUser {
  id: number;
  username: string;
  role: UserRole;
}

interface LoginResponse {
  token: string;
  user: CurrentUser;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);

  // private apiUrl = 'http://localhost:44044/IS-Lab1-1.0-SNAPSHOT/api/auth'
  private apiUrl = 'http://localhost:8080/IS-Lab1-1.0-SNAPSHOT/api/auth'

  private readonly tokenKey = 'auth_token';

  private currentUserSubject = new BehaviorSubject<CurrentUser | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    const token = this.getToken();
    if (token) {
      this.loadCurrentUser(token);
    }
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  private saveToken(token: string) {
    localStorage.setItem(this.tokenKey, token);
  }

  private clearToken() {
    localStorage.removeItem(this.tokenKey);
  }

  private loadCurrentUser(token: string) {
    const headers = new HttpHeaders({
      'X-Auth-Token': token
    });

    this.http.get<CurrentUser>(`${this.apiUrl}/me`, {headers}).subscribe({
      next: user => this.currentUserSubject.next(user),
      error: () => {
        this.clearToken();
        this.currentUserSubject.next(null);
      }
    });
  }

  register(username: string, password: string): Observable<CurrentUser> {
    return this.http.post<CurrentUser>(`${this.apiUrl}/register`, {username, password});
  }

  login(username: string, password: string): Observable<CurrentUser> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, {username, password})
      .pipe(
        tap(resp => {
          this.saveToken(resp.token);
          this.currentUserSubject.next(resp.user);
        }),
        map(resp => resp.user)
      );
  }

  logout() {
    this.clearToken();
    this.currentUserSubject.next(null);
  }

  /**
   * Заголовки для запросов, где нужно пробрасывать токен (X-Auth-Token).
   */
  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return token
      ? new HttpHeaders({'X-Auth-Token': token})
      : new HttpHeaders();
  }
}
