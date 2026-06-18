import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.loading()) {
    await new Promise<void>(resolve => {
      const check = setInterval(() => {
        if (!auth.loading()) {
          clearInterval(check);
          resolve();
        }
      }, 50);
    });
  }

  if (auth.isAdmin() && auth.isApproved()) {
    return true;
  }

  if (auth.isAuthenticated() && auth.userStatus() === 'pending') {
    router.navigate(['/pending-approval']);
    return false;
  }

  router.navigate(['/dashboard']);
  return false;
};
