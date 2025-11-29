import {Component, inject, Input, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Person} from '../../interfaces/IPerson';
import {PeopleService} from '../../services/people.service';

declare const bootstrap: any;

@Component({
  selector: 'app-people-table',
  imports: [
    FormsModule
  ],
  templateUrl: './people-table.html',
  standalone: true,
  styleUrl: './people-table.css'
})
export class PeopleTable implements OnInit {
  protected readonly Math = Math;
  protected personService = inject(PeopleService)

  people: Person[] = [];
  @Input() filteredPeople: Person[] = [];

  // фильтрация
  filterColumn = '';
  filterValue = '';

  // сортировка
  sortDirection: 'asc' | 'desc' = 'asc';
  sortField = '';

  // пагинация
  pageSize = 3;
  currentPage = 1;

  // удаление и перепривязка
  selectedPerson?: Person;
  reassignPersonId: number | null = null;
  hasLinkedObjects = false;

  ngOnInit() {
    this.loadPeople()
  }

  loadPeople() {
    this.personService.getAll().subscribe(data => {
      this.people = data
      this.filteredPeople = data
    })
  }

  // фильтрация по полному совпадению
  filter() {
    if (!this.filterColumn || !this.filterValue) {
      this.filteredPeople = [...this.people];
    } else {
      this.filteredPeople = this.people.filter(p => {
        const value = this.resolveNestedValue(p, this.filterColumn);
        return String(value).toLowerCase() === this.filterValue.toLowerCase();
      });
    }

    this.currentPage = 1; // сбросить на первую страницу
  }

  filterByWeightLessThan(weight: number) {
    if (!weight) {
      this.filteredPeople = [...this.people];
    } else {
      this.filteredPeople = this.people.filter(p => p.weight && p.weight < weight);
    }
    this.currentPage = 1; // сбросить пагинацию
  }


  // сортировка
  sortBy(field: string) {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }

    const direction = this.sortDirection === 'asc' ? 1 : -1;

    this.filteredPeople.sort((a: any, b: any) => {
      const aValue = this.resolveNestedValue(a, field);
      const bValue = this.resolveNestedValue(b, field);
      if (aValue > bValue) return direction;
      if (aValue < bValue) return -direction;
      return 0;
    });
  }

  private resolveNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((prev, curr) => prev?.[curr], obj);
  }

  // пагинация
  get totalPages() {
    return Math.ceil(this.filteredPeople.length / this.pageSize);
  }

  get pagedPeople() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredPeople.slice(start, end);
  }

  setPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  prevPage() {
    if (this.currentPage > 1) this.currentPage--;
  }

  nextPage() {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  // открыть модалку для редактирования
  openEdit(person: Person) {
    this.personService.setSelectedPerson(person);

    const modal = new (window as any).bootstrap.Modal(
      document.getElementById('createPersonModal')
    );
    modal.show();
  }

  // === ПКМ: открыть модалку перепривязки ===
  openReassignModal(event: MouseEvent, person: Person) {
    event.preventDefault(); // отменяем стандартное меню ПКМ

    this.selectedPerson = person;
    this.hasLinkedObjects = !!(person.location || person.coordinates);
    this.reassignPersonId = null;

    const modal = new bootstrap.Modal(document.getElementById('reassignDeleteModal'));
    modal.show();
  }

  // === Удаление с перепривязкой ===
  confirmReassignAndDelete() {
    if (!this.selectedPerson?.id) return;

    const personToDeleteId = this.selectedPerson.id;
    const personToAssignId = this.reassignPersonId ?? 0; // если не указано — удалить без перепривязки

    this.personService.delete(personToAssignId, personToDeleteId).subscribe({
      next: (message) => {
        console.log(message)
        this.loadPeople();
        const modalEl = document.getElementById('reassignDeleteModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        modal.hide();
      },
      error: err => {
        console.error('Ошибка при удалении:', err);
      }
    });
  }

}
