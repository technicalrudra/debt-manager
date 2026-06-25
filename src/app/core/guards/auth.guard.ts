import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async (_route, _state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Wait for auth to initialize
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

  if (auth.isAuthenticated()) {
    // If it's an admin trying to access a user route, redirect to admin
    if (auth.isAdmin()) {
      router.navigate(['/admin']);
      return false;
    }
    return true;
  }

  router.navigate(['/login'], { replaceUrl: true });
  return false;
};
