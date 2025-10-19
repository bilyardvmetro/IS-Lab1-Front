import {Component, EventEmitter, Output} from '@angular/core';

@Component({
  selector: 'app-main-menu',
  imports: [],
  templateUrl: './main-menu.html',
  standalone: true,
  styleUrl: './main-menu.css'
})
export class MainMenu {
  @Output() dialogRequested = new EventEmitter<string>();

  openDialog(type: string) {
    this.dialogRequested.emit(type)
  }
}
