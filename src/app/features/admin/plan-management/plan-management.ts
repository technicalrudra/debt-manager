import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-plan-management',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="container-fluid py-3">
      <div class="page-header mb-4">
        <h1 class="page-title mb-1">Plans & Features</h1>
        <p class="text-secondary subtitle mb-0">Manage subscription tiers and toggle feature availability.</p>
      </div>

      <div class="row g-4" *ngIf="plans().length > 0; else loadingState">
        <div class="col-12 col-lg-4" *ngFor="let plan of plans()">
          <mat-card class="premium-card h-100 position-relative border" [ngClass]="{'border-primary': plan.is_active}">
            <div class="position-absolute top-0 end-0 p-3">
              <span class="badge" [ngClass]="plan.is_active ? 'bg-success text-white' : 'bg-secondary text-white'">
                {{ plan.is_active ? 'Active' : 'Inactive' }}
              </span>
            </div>
            
            <mat-card-header class="d-block mb-3">
              <h2 class="fw-bold text-dark mb-1" style="font-size: 20px;">{{ plan.name }}</h2>
              <p class="text-secondary mb-3">{{ plan.description }}</p>
              <h3 class="fw-bold text-primary m-0" style="font-size: 28px;">
                ₹{{ plan.price_monthly }}<span class="text-secondary" style="font-size: 14px;">/mo</span>
              </h3>
            </mat-card-header>

            <mat-card-content>
              <div class="mt-4 pt-3 border-top">
                <h4 class="fw-bold mb-3" style="font-size: 14px;">FEATURES INCLUDED:</h4>
                <div class="d-flex flex-column gap-3">
                  <div class="d-flex justify-content-between align-items-center" *ngFor="let feature of features()">
                    <div>
                      <div class="fw-medium text-dark text-sm">{{ feature.name }}</div>
                      <div class="text-xs text-secondary">{{ feature.description }}</div>
                    </div>
                    <mat-slide-toggle 
                      color="primary"
                      [checked]="isFeatureEnabled(plan.id, feature.id)"
                      (change)="toggleFeature(plan.id, feature.id, $event.checked)">
                    </mat-slide-toggle>
                  </div>
                </div>
              </div>
            </mat-card-content>
            
            <div class="mt-4 pt-3 text-center">
              <button mat-stroked-button color="primary" class="w-100" (click)="togglePlanStatus(plan)">
                {{ plan.is_active ? 'Deactivate Plan' : 'Activate Plan' }}
              </button>
            </div>
          </mat-card>
        </div>
      </div>

      <ng-template #loadingState>
        <div class="text-center py-5">
          <div class="spinner-border text-primary" role="status"></div>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .premium-card {
      padding: 24px;
      border-radius: 16px !important;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1) !important;
    }
  `]
})
export class PlanManagement implements OnInit {
  private adminService = inject(AdminService);
  
  plans = this.adminService.plans;
  features = this.adminService.features;
  planFeatures = this.adminService.planFeatures;

  async ngOnInit() {
    await Promise.all([
      this.adminService.loadPlans(),
      this.adminService.loadFeatures(),
      this.adminService.loadPlanFeatures()
    ]);
  }

  isFeatureEnabled(planId: string, featureId: string): boolean {
    const pf = this.planFeatures().find(p => p.plan_id === planId && p.feature_id === featureId);
    return pf ? pf.enabled : false;
  }

  async toggleFeature(planId: string, featureId: string, enabled: boolean) {
    await this.adminService.togglePlanFeature(planId, featureId, enabled);
  }

  async togglePlanStatus(plan: any) {
    await this.adminService.updatePlan(plan.id, { is_active: !plan.is_active });
  }
}
