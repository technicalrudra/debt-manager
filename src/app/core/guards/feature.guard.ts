import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { SubscriptionService } from '../services/subscription.service';
import { AuthService } from '../services/auth.service';

export const featureGuard: CanActivateFn = async (route: ActivatedRouteSnapshot) => {
  const subscriptionService = inject(SubscriptionService);
  const authService = inject(AuthService);
  const router = inject(Router);

  // Admins bypass feature checks
  if (authService.isAdmin()) {
    return true;
  }

  const requiredFeature = route.data?.['feature'] as string;
  if (!requiredFeature) {
    return true;
  }

  const hasAccess = await subscriptionService.hasFeature(requiredFeature);
  if (hasAccess) {
    return true;
  }

  router.navigate(['/subscription'], { queryParams: { required: requiredFeature } });
  return false;
};
