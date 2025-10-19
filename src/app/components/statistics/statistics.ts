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

}
