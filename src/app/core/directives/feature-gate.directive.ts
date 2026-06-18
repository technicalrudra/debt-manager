import { Directive, Input, TemplateRef, ViewContainerRef, inject, effect } from '@angular/core';
import { SubscriptionService } from '../services/subscription.service';
import { AuthService } from '../services/auth.service';

@Directive({
  selector: '[appFeatureGate]',
  standalone: true
})
export class FeatureGateDirective {
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);
  private subscriptionService = inject(SubscriptionService);
  private authService = inject(AuthService);

  private featureKey = '';
  private hasView = false;

  @Input() set appFeatureGate(featureKey: string) {
    this.featureKey = featureKey;
    this.updateView();
  }

  constructor() {
    // Re-evaluate whenever user features or admin status change
    effect(() => {
      // Accessing these signals registers them as dependencies for the effect
      this.subscriptionService.userFeatures();
      this.authService.isAdmin();
      this.updateView();
    });
  }

  private updateView() {
    const isAdmin = this.authService.isAdmin();
    const hasFeature = this.subscriptionService.hasFeatureSync(this.featureKey);

    if (isAdmin || hasFeature) {
      if (!this.hasView) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.hasView = true;
      }
    } else {
      if (this.hasView) {
        this.viewContainer.clear();
        this.hasView = false;
      }
    }
  }
}
