import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './empty-state.html',
  styleUrls: ['./empty-state.scss']
})
export class EmptyState {
  @Input() icon: string = 'info';
  @Input() title: string = 'No Data Found';
  @Input() description: string = 'There is currently no data to display.';
  @Input() actionLabel?: string;
  @Output() action = new EventEmitter<void>();

  onActionClick() {
    this.action.emit();
  }
}
