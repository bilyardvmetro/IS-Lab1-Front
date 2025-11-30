import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {AuthService} from './auth.service';

export type ImportStatus = 'SUCCESS' | 'FAILED';

export interface ImportHistoryEntry {
  id: number;
  startedAt: string;   // ISO-строка
  finishedAt?: string;
  username: string;
  importedCount: number;
  errorCount: number;
  status: ImportStatus;
}

@Injectable({
  providedIn: 'root'
})
export class ImportHistoryService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  // private apiUrl = 'http://localhost:44044/IS-Lab1-1.0-SNAPSHOT/api/imports/history'
  private apiUrl = 'http://localhost:8080/IS-Lab1-1.0-SNAPSHOT/api/imports/history'

  getHistory(): Observable<ImportHistoryEntry[]> {
    const headers = this.auth.getAuthHeaders();
    return this.http.get<ImportHistoryEntry[]>(this.apiUrl, {headers});
  }
}
