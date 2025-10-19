import {Component, inject, OnInit} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import {PeopleService} from '../../services/people.service';
import {Person} from '../../interfaces/IPerson';

declare const bootstrap: any;

function locationValidator(group: AbstractControl): ValidationErrors | null {
  const { x, y, z, name } = group.value;
  const anyFilled = x != null || y != null || z != null || name?.trim();
  const allFilled = x != null && y != null && z != null && name?.trim();

  return anyFilled && !allFilled
    ? { incompleteLocation: 'Если локация указана, все поля обязательны' }
    : null;
}

@Component({
  selector: 'app-person-form',
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './person-form.html',
  standalone: true,
  styleUrl: './person-form.css'
})
export class PersonForm implements OnInit{
  personForm: FormGroup;
  isEditing = false;
  currentPersonId: number | null = null
  errorMessages: string[] = [];

  private personService = inject(PeopleService)

  constructor(private fb: FormBuilder) {
    this.personForm = this.fb.group({
      name: ['', [Validators.required, Validators.pattern(/\S+/)]],
      height: [null, [Validators.required, Validators.min(1)]],
      weight: [null, [Validators.min(1)]],
      nationality: ['', [Validators.required]],
      hairColor: ['', [Validators.required]],
      eyeColor: ['', [Validators.required]],
      passportID: [''],

      coordinates: this.fb.group({
        x: [null, [Validators.required]],
        y: [null, [Validators.required, Validators.min(-804)]]
      }),

      location: this.fb.group({
        x: [null],
        y: [null],
        z: [null],
        name: ['']
      }, { validators: locationValidator })
    })

    this.personService.selectedPerson$.subscribe((person: Person | null) => {
      this.errorMessages = [];
      if (person) {
        this.isEditing = true;
        this.currentPersonId = person.id ?? null;
        this.personForm.patchValue(person);
      } else {
        this.isEditing = false;
        this.currentPersonId = null
        this.personForm.reset();
      }
    });
  }

  ngOnInit() {
    const modalElement = document.getElementById('createPersonModal');

    if (modalElement) {
      modalElement.addEventListener('hidden.bs.modal', () => {
        this.personService.setSelectedPerson(null);
      });
    }
  }

  onSave() {
    this.errorMessages = [];
    const personData = this.personForm.value;

    if (this.personForm.valid) {

      if (personData.location && !personData.location.name) {
        personData.location = null
      }

      if (this.isEditing && this.currentPersonId) {
        this.personService.update(this.currentPersonId, personData).subscribe(() => {
          alert('Person обновлён!')
          this.personService.setSelectedPerson(null);
        })
      } else {
        this.personService.add(personData).subscribe(() => alert('Person создан!'))
      }

      const modal = bootstrap.Modal.getInstance(document.getElementById('createPersonModal')!)
      modal.hide()

    } else {
      this.errorMessages = this.getFormValidationErrors();
    }
  }

  private getFormValidationErrors(): string[] {
    const messages: string[] = [];
    const controlErrors = (control: AbstractControl, name: string) => {
      if (control.errors) {
        for (const key in control.errors) {
          switch (key) {
            case 'required':
              messages.push(`Поле "${name}" обязательно для заполнения.`);
              break;
            case 'min':
              messages.push(`Значение поля "${name}" слишком маленькое.`);
              break;
            case 'pattern':
              messages.push(`Поле "${name}" имеет неверный формат.`);
              break;
            case 'incompleteLocation':
              messages.push(`Локация: если вы начали ввод, нужно заполнить все поля (X, Y, Z, Название).`);
              break;
            default:
              messages.push(`Поле "${name}" содержит ошибку (${key}).`);
              break;
          }
        }
      }
    };

    // Словарь для красивых названий полей
    const fieldNames: { [key: string]: string } = {
      name: 'Имя', height: 'Рост', weight: 'Вес', nationality: 'Национальность',
      hairColor: 'Цвет волос', eyeColor: 'Цвет глаз', passportID: 'Id Паспорта',
      coordinates: 'Координаты', location: 'Локация'
    };

    // Рекурсивная функция для обхода всех контролов
    const traverse = (group: FormGroup, prefix: string = '') => {
      Object.keys(group.controls).forEach(key => {
        const control = group.get(key)!;
        const fieldName = fieldNames[key] || key;
        const fullName = prefix ? `${prefix} -> ${fieldName}` : fieldName;

        if (control instanceof FormGroup) {
          // Сначала проверяем ошибки на самой группе (как у locationValidator)
          controlErrors(control, fieldName);
          // Затем рекурсивно идем вглубь
          traverse(control, fullName);
        } else {
          // Проверяем ошибки на конкретном поле
          controlErrors(control, fullName);
        }
      });
    };

    traverse(this.personForm);
    return [...new Set(messages)]; // Возвращаем уникальные сообщения
  }
}
