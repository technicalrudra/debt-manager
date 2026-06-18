import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-upgrade-prompt',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <mat-card class="upgrade-prompt-card d-flex flex-row align-items-center bg-primary-soft border border-primary">
      <div class="icon-container me-3 bg-primary text-white d-flex align-items-center justify-content-center rounded-circle" style="width: 48px; height: 48px;">
        <mat-icon>workspace_premium</mat-icon>
      </div>
      <div class="flex-grow-1">
        <h4 class="fw-bold m-0 text-primary">{{ title }}</h4>
        <p class="text-secondary m-0 text-sm">{{ message }}</p>
      </div>
      <div class="ms-3">
        <button mat-flat-button color="primary" routerLink="/subscription" [queryParams]="{ required: featureKey }">
          Upgrade Now
        </button>
      </div>
    </mat-card>
  `,
  styles: [`
    .upgrade-prompt-card {
      padding: 16px;
      border-radius: 12px !important;
      box-shadow: none !important;
    }
  `]
})
export class UpgradePrompt {
  @Input() title = 'Unlock Premium Features';
  @Input() message = 'Upgrade your plan to access this advanced feature.';
  @Input() featureKey = '';
}
