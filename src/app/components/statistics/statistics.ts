import {Component, EventEmitter, inject, Output} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import {PeopleService} from '../../services/people.service';
import {AuthService, CurrentUser} from '../../services/auth.service';
import {ImportHistoryEntry, ImportHistoryService} from '../../services/import-history.service';


declare const bootstrap: any;

function locationValidator(group: AbstractControl): ValidationErrors | null {
  const {x, y, z, name} = group.value;
  const anyFilled = x != null || y != null || z != null || name?.trim();
  const allFilled = x != null && y != null && z != null && name?.trim();

  return anyFilled && !allFilled
    ? {incompleteLocation: 'Если локация указана, все поля обязательны'}
    : null;
}

@Component({
  selector: 'app-statistics',
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './statistics.html',
  standalone: true,
  styleUrl: './statistics.css'
})
export class Statistics {
  nationalityForm: FormGroup;
  weightForm: FormGroup;
  eyeColorForm: FormGroup;
  hairAndLocationForm: FormGroup;

  private personService = inject(PeopleService)

  statsResults: any = {};

  selectedImportFile: File | null = null;
  importInProgress = false;
  importResultMessage = '';
  importErrors: string[] = [];

  // auth
  currentUser: CurrentUser | null = null;

  loginForm: FormGroup;
  registerForm: FormGroup;

  authError = '';
  authMessage = '';
  loginInProgress = false;
  registerInProgress = false;

  // import history
  importHistory: ImportHistoryEntry[] = [];
  importHistoryLoading = false;
  importHistoryError = '';

  private authService = inject(AuthService);
  private importHistoryService = inject(ImportHistoryService);

  constructor(private fb: FormBuilder) {
    this.nationalityForm = this.fb.group({nationality: ['', [Validators.required]]});
    this.weightForm = this.fb.group({weight: ['', [Validators.min(1)]]});
    this.eyeColorForm = this.fb.group({eyeColor: ['', [Validators.required]]});
    this.hairAndLocationForm = this.fb.group({
      hairColor: ['', [Validators.required]],
      location: this.fb.group({
        x: [0],
        y: [0],
        z: [0],
        name: ['']
      })
    }, {validators: locationValidator})

    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(4)]],
    });

    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(4)]],
    });

    // подписка на текущего юзера
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;

      if (user) {
        // залогинились или восстановили с токена — грузим историю
        this.loadImportHistory();
      } else {
        // разлогинились — чистим историю
        this.importHistory = [];
        this.importHistoryError = '';
      }
    });
  }

  @Output() statsChanged = new EventEmitter<any>();
  @Output() filterRequested = new EventEmitter<{ type: string, value: any }>();

  calculateAverageHeight() {
    this.personService.getAverageHeight().subscribe(result => {
      this.statsResults.averageHeight = result
      this.statsChanged.emit(this.statsResults)
    })
  }

  countByNationality() {
    this.personService.countByNationality(this.nationalityForm.get('nationality')?.value).subscribe(result => {
      this.statsResults.countByNationality = result;
      this.statsChanged.emit(this.statsResults);
    })
  }

  filterByWeight() {
    const weight = this.weightForm.get('weight')?.value
    this.filterRequested.emit({type: 'weightLessThan', value: weight})

    const modal = document.getElementById('weightLessThanModal')
    if (modal) bootstrap.Modal.getInstance(modal)?.hide()

    // this.personService.getWeightLessThan(this.weightForm.value).subscribe(result => {
    //   this.statsResults.weight = result;
    //   this.statsChanged.emit(this.statsResults);
    // })
  }

  percentageByEyeColor() {
    this.personService.getPercentageByEyeColor(this.eyeColorForm.get('eyeColor')?.value).subscribe(result => {
      this.statsResults.percentageByEyeColor = result;
      this.statsChanged.emit(this.statsResults);
    })
  }

  countByHairAndLocation() {
    this.personService.countByHairAndLocation(
      this.hairAndLocationForm.get('hairColor')?.value,
      this.hairAndLocationForm.get('location')?.value
    ).subscribe(result => {
      this.statsResults.hairLocationCount = result;
      this.statsChanged.emit(this.statsResults);
    })
  }

  onImportFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedImportFile = input.files[0];
      this.importResultMessage = '';
      this.importErrors = [];
    } else {
      this.selectedImportFile = null;
    }
  }

  runImport() {
    if (!this.selectedImportFile || this.importInProgress) {
      return;
    }

    this.importInProgress = true;
    this.importResultMessage = '';
    this.importErrors = [];

    const fileReader = new FileReader();

    fileReader.onload = () => {
      try {
        const text = fileReader.result as string;
        const data = JSON.parse(text);

        if (!Array.isArray(data)) {
          throw new Error('Корневой элемент JSON должен быть массивом объектов Person.');
        }

        this.personService.importPeople(data).subscribe({
          next: (response: any) => {
            // ожидаем формат, который мы сделали на бэке:
            // { status: 'OK', imported: number } или
            // { status: 'ERROR', errors: string[] }
            if (response?.status === 'OK') {
              this.importResultMessage = `Успешно импортировано объектов: ${response.imported}.`;
              this.importErrors = [];
            } else if (response?.status === 'ERROR') {
              this.importResultMessage = 'Ошибки при импорте объектов.';
              this.importErrors = response.errors ?? [];
            } else {
              this.importResultMessage = 'Неожиданный ответ сервера при импорте.';
            }
          },
          error: (err) => {
            // на бэке при 400 мы возвращаем JSON с errors
            if (err.error?.errors) {
              this.importResultMessage = 'Ошибки при импорте объектов.';
              this.importErrors = err.error.errors;
            } else {
              this.importResultMessage = 'Ошибка при запросе к серверу.';
            }
          },
          complete: () => {
            this.importInProgress = false;
          }
        });

      } catch (e: any) {
        this.importInProgress = false;
        this.importResultMessage = 'Ошибка чтения или разбора JSON файла.';
        this.importErrors = [e?.message ?? String(e)];
      }
    };

    fileReader.onerror = () => {
      this.importInProgress = false;
      this.importResultMessage = 'Ошибка чтения файла.';
    };

    fileReader.readAsText(this.selectedImportFile, 'utf-8');
  }

  submitRegister() {
    if (this.registerForm.invalid || this.registerInProgress) {
      return;
    }

    this.registerInProgress = true;
    this.authError = '';
    this.authMessage = '';

    const {username, password} = this.registerForm.value;

    this.authService.register(username, password).subscribe({
      next: user => {
        this.authMessage = `Пользователь "${user.username}" успешно зарегистрирован. Теперь можно войти.`;
        this.authError = '';
      },
      error: err => {
        this.authMessage = '';
        this.authError = err?.error?.message || 'Ошибка регистрации.';
      },
      complete: () => {
        this.registerInProgress = false;
      }
    });
  }

  submitLogin() {
    if (this.loginForm.invalid || this.loginInProgress) {
      return;
    }

    this.loginInProgress = true;
    this.authError = '';
    this.authMessage = '';

    const {username, password} = this.loginForm.value;

    this.authService.login(username, password).subscribe({
      next: user => {
        this.authMessage = `Вход выполнен. Текущий пользователь: ${user.username} (${user.role}).`;
        this.authError = '';

        // можно по желанию закрыть модалку через bootstrap.Modal
        const el = document.getElementById('loginModal');
        if (el) {
          const modal = bootstrap.Modal.getInstance(el) || new bootstrap.Modal(el);
          modal.hide();
        }
      },
      error: err => {
        this.authMessage = '';
        this.authError = err?.error?.message || 'Ошибка входа.';
      },
      complete: () => {
        this.loginInProgress = false;
      }
    });
  }

  logout() {
    this.authService.logout();
    this.authMessage = 'Вы вышли из системы.';
    this.authError = '';
  }

  loadImportHistory() {
    this.importHistoryLoading = true;
    this.importHistoryError = '';
    this.importHistory = [];

    this.importHistoryService.getHistory().subscribe({
      next: history => {
        this.importHistory = history;
      },
      error: err => {
        this.importHistoryError = err?.error?.message || 'Ошибка загрузки истории импортов.';
      },
      complete: () => {
        this.importHistoryLoading = false;
      }
    });
  }


}
