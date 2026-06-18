import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <div class="container-fluid py-3">
      <div class="page-header mb-4">
        <h1 class="page-title mb-1">Admin Settings</h1>
        <p class="text-secondary subtitle mb-0">Configure global platform settings.</p>
      </div>
      <mat-card>
        <mat-card-content class="p-4 text-center text-secondary">
          <p>Global platform settings, integrations, and email templates will be configured here.</p>
          <p><em>Coming soon in the next update.</em></p>
        </mat-card-content>
      </mat-card>
    </div>
  `
})
export class AdminSettings {}
