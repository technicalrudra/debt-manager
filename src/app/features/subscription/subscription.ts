import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SubscriptionService } from '../../core/services/subscription.service';

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <div class="container-fluid py-5">
      <div class="text-center mb-5">
        <h1 class="page-title fw-bold" style="font-size: 32px;">Upgrade Your Plan</h1>
        <p class="text-secondary subtitle mx-auto" style="max-width: 600px;">
          <span *ngIf="requiredFeature" class="text-danger fw-bold">
            The feature you are trying to access requires a higher tier plan.
          </span>
          Unlock powerful tools to accelerate your journey to financial freedom.
        </p>
      </div>

      <div class="row g-4 justify-content-center" *ngIf="plans().length > 0; else loadingState">
        <div class="col-12 col-md-6 col-lg-4" *ngFor="let plan of plans()">
          <mat-card class="pricing-card h-100 d-flex flex-column border" 
                    [ngClass]="{'border-primary shadow-lg scale-up': isCurrentPlan(plan.id)}">
            <div class="popular-badge bg-primary text-white" *ngIf="plan.name === 'Pro'">Most Popular</div>
            
            <mat-card-header class="d-block text-center pt-4 pb-3 border-bottom">
              <h2 class="fw-bold mb-2">{{ plan.name }}</h2>
              <p class="text-secondary mb-3">{{ plan.description }}</p>
              <div class="price-display">
                <span class="currency">₹</span>
                <span class="amount">{{ plan.price_monthly }}</span>
                <span class="period">/mo</span>
              </div>
            </mat-card-header>

            <mat-card-content class="flex-grow-1 p-4">
              <ul class="feature-list list-unstyled m-0">
                <li *ngIf="plan.name === 'Free'"><mat-icon class="text-success">check_circle</mat-icon> Basic Debt Tracking</li>
                <li *ngIf="plan.name === 'Free'"><mat-icon class="text-success">check_circle</mat-icon> Standard Analytics</li>
                
                <li *ngIf="plan.name === 'Pro'"><mat-icon class="text-success">check_circle</mat-icon> Everything in Free</li>
                <li *ngIf="plan.name === 'Pro'"><mat-icon class="text-success">check_circle</mat-icon> Advanced Snowball/Avalanche</li>
                <li *ngIf="plan.name === 'Pro'"><mat-icon class="text-success">check_circle</mat-icon> Priority Support</li>
                
                <li *ngIf="plan.name === 'Business'"><mat-icon class="text-success">check_circle</mat-icon> Everything in Pro</li>
                <li *ngIf="plan.name === 'Business'"><mat-icon class="text-success">check_circle</mat-icon> Multi-user Accounts</li>
                <li *ngIf="plan.name === 'Business'"><mat-icon class="text-success">check_circle</mat-icon> Custom API Access</li>
              </ul>
            </mat-card-content>
            
            <div class="p-4 pt-0 mt-auto text-center">
              <button mat-flat-button color="primary" class="w-100 py-2" 
                      [disabled]="isCurrentPlan(plan.id)"
                      (click)="subscribe(plan.id)">
                {{ isCurrentPlan(plan.id) ? 'Current Plan' : 'Select ' + plan.name }}
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
    .pricing-card {
      border-radius: 20px !important;
      position: relative;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      
      &.scale-up {
        transform: scale(1.05);
        z-index: 10;
      }
    }
    
    .popular-badge {
      position: absolute;
      top: -12px;
      left: 50%;
      transform: translateX(-50%);
      padding: 4px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }

    .price-display {
      display: flex;
      justify-content: center;
      align-items: baseline;
      
      .currency { font-size: 24px; font-weight: 600; color: #1d2939; }
      .amount { font-size: 48px; font-weight: 800; color: #1d2939; line-height: 1; margin: 0 4px; }
      .period { font-size: 16px; color: #667085; font-weight: 500; }
    }

    .feature-list {
      li {
        display: flex;
        align-items: center;
        margin-bottom: 16px;
        font-size: 15px;
        color: #475467;
        
        mat-icon {
          font-size: 20px;
          height: 20px;
          width: 20px;
          margin-right: 12px;
        }
      }
    }
  `]
})
export class SubscriptionPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private subscriptionService = inject(SubscriptionService);

  requiredFeature: string | null = null;
  plans = this.subscriptionService.plans;
  currentPlan = this.subscriptionService.currentPlan;

  ngOnInit() {
    this.requiredFeature = this.route.snapshot.queryParamMap.get('required');
    this.subscriptionService.loadPlans();
    this.subscriptionService.loadCurrentSubscription();
  }

  isCurrentPlan(planId: string): boolean {
    return this.currentPlan()?.id === planId;
  }

  subscribe(planId: string) {
    // In a real app, this would redirect to Stripe checkout or similar.
    // For now, we alert the user.
    alert('Subscription payment integration is pending. Please contact an admin to assign this plan to you.');
  }
}
