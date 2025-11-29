import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {BehaviorSubject, Observable} from 'rxjs';
import {Color, Country, Person, Location} from '../interfaces/IPerson';

@Injectable({
  providedIn: 'root'
})
export class PeopleService {
  private API_URL = 'http://localhost:44044/IS-Lab1-1.0-SNAPSHOT/api/people'
  // private API_URL = 'http://localhost:8080/IS-Lab1-1.0-SNAPSHOT/api/people'

  private selectedPersonSubject = new BehaviorSubject<Person | null>(null);
  selectedPerson$ = this.selectedPersonSubject.asObservable();

  constructor(private http: HttpClient) {
  }

  getAll(): Observable<Person[]> {
    return this.http.get<Person[]>(`${this.API_URL}/get-all`)
  }

  getById(id: number): Observable<Person> {
    return this.http.get<Person>(`${this.API_URL}/${id}`)
  }

  add(person: Person): Observable<Person> {
    return this.http.post<Person>(`${this.API_URL}/add`, person)
  }

  update(id: number, newPerson: Person): Observable<Person> {
    return this.http.post<Person>(`${this.API_URL}/update/${id}`, newPerson)
  }

  delete(personToAssignId: number, personToDeleteId: number): Observable<any> {
    const body = new URLSearchParams()
    body.set('personToAssignId', personToAssignId.toString())
    body.set('personToDeleteId', personToDeleteId.toString())

    return this.http.post(`${this.API_URL}/delete`, body.toString(), {
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      responseType: 'text' as const
    })
  }

  getAverageHeight(): Observable<number> {
    return this.http.get<number>(`${this.API_URL}/average-height`)
  }

  countByNationality(country: Country): Observable<number> {
    const params = new HttpParams().set('country', country.toString());
    return this.http.get<number>(`${this.API_URL}/count/nationality`, {params})
  }

  getWeightLessThan(weight: number): Observable<Person[]> {
    return this.http.get<Person[]>(`${this.API_URL}/weight/less-than/${weight}`)
  }

  getPercentageByEyeColor(color: Color): Observable<number> {
    return this.http.get<number>(`${this.API_URL}/percentage/eye-color/${color}`)
  }

  countByHairAndLocation(color: Color, location: Location): Observable<number> {
    const params = new HttpParams()
      .set('color', color)
      .set('x', location.x.toString())
      .set('y', location.y.toString())
      .set('z', location.z.toString())

    return this.http.get<number>(`${this.API_URL}/count/hair-location`, {params})
  }

  /** Выбрать текущего человека (для редактирования в модалке) */
  setSelectedPerson(person: Person | null): void {
    this.selectedPersonSubject.next(person);
  }

  importPeople(people: any[]): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/import`, people);
  }

}
