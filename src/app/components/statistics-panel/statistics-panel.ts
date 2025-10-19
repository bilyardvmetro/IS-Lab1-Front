import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-statistics-panel',
  imports: [],
  templateUrl: './statistics-panel.html',
  standalone: true,
  styleUrl: './statistics-panel.css'
})
export class StatisticsPanel {
  @Input() statsResults: any
}
