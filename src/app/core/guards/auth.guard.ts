import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../auth/services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isInitialized()) {
    if (authService.isAuthenticated()) {
      return true;
    }
    return router.createUrlTree(['/auth/login']);
  }

  return authService.initializeSession().pipe(
    map((isAuthenticated) => {
      if (isAuthenticated) {
        return true;
      }
      return router.createUrlTree(['/auth/login']);
    }),
  );
};

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isInitialized()) {
    if (authService.isAuthenticated()) {
      return router.createUrlTree(['/dashboard']);
    }
    return true;
  }

  return authService.initializeSession().pipe(
    map((isAuthenticated) => {
      if (isAuthenticated) {
        return router.createUrlTree(['/dashboard']);
      }
      return true;
    }),
  );
};
