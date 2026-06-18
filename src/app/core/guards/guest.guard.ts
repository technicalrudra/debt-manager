import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = async () => {
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

  if (!auth.isAuthenticated()) {
    return true;
  }

  if (auth.isAdmin() && auth.isApproved()) {
    return router.parseUrl('/admin');
  }

  if (auth.isApproved()) {
    return router.parseUrl('/dashboard');
  }

  if (auth.userStatus() === 'pending') {
    return router.parseUrl('/pending-approval');
  }

  await auth.signOut();
  return true;
};
