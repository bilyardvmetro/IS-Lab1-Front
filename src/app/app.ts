import {Component, signal, ViewChild} from '@angular/core';
import {PersonForm} from './components/person-form/person-form';
import {MainMenu} from './components/main-menu/main-menu';
import {PeopleTable} from './components/people-table/people-table';
import {Statistics} from './components/statistics/statistics';
import {StatisticsPanel} from './components/statistics-panel/statistics-panel';

@Component({
  selector: 'app-root',
  imports: [PersonForm, MainMenu, PeopleTable, Statistics, StatisticsPanel],
  templateUrl: './app.html',
  standalone: true,
  styleUrl: './app.css'
})
export class App {
  @ViewChild('peopleTable') peopleTable!: PeopleTable;
  statsResults: any = {};

  onStatsChanged(results: any) {
    this.statsResults = { ...results };
  }

  openModal(type: string) {
    const modalIdMap: Record<string, string> = {
      createPerson: '#createPersonModal',
      averageHeight: '#averageHeightModal',
      countByNationality: '#countByNationalityModal',
      weightLessThan: '#weightLessThanModal',
      percentageByEyeColor: '#percentageByEyeColorModal',
      countByHairAndLocation: '#countByHairAndLocationModal'
    };

    const id = modalIdMap[type];
    if (id) {
      const modalElement = document.querySelector((id));

      if (modalElement){
        const modal = new (window as any).bootstrap.Modal(modalElement);
        modal.show();
      }
    }
  }

  onFilterRequested(event: { type: string, value: any }) {
    if (event.type === 'weightLessThan') {
      this.peopleTable.filterByWeightLessThan(event.value);
    }
  }

}
