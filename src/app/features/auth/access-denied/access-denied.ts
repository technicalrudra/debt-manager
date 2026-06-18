import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatCardModule, MatIconModule],
  template: `
    <div class="container py-5">
      <mat-card class="mx-auto text-center p-4" style="max-width: 520px">
        <mat-icon color="warn" class="mb-3" style="width:64px;height:64px;font-size:64px">
          lock
        </mat-icon>
        <h1 class="h3 fw-bold">Module access required</h1>
        <p class="text-secondary">
          This module is not assigned to your account. Contact an administrator to request access.
        </p>
      </mat-card>
    </div>
  `
})
export class AccessDenied {}
