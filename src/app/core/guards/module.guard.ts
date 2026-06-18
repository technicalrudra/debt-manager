import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AccessControlService } from '../services/access-control.service';

export const moduleGuard: CanActivateFn = async route => {
  const access = inject(AccessControlService);
  const router = inject(Router);
  const moduleKey = route.data?.['module'] as string | undefined;

  if (!moduleKey || await access.hasModule(moduleKey)) return true;

  return router.createUrlTree(['/access-denied'], {
    queryParams: { accessDenied: moduleKey }
  });
};
