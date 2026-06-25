import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const approvedGuard: CanActivateFn = async () => {
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

  // Admins always pass
  if (auth.isAdmin()) {
    return true;
  }

  if (auth.isApproved()) {
    return true;
  }

  // Redirect pending/rejected/suspended users
  const status = auth.userStatus();
  if (status === 'pending') {
    router.navigate(['/pending-approval']);
  } else {
    router.navigate(['/login'], { replaceUrl: true });
  }
  return false;
};
