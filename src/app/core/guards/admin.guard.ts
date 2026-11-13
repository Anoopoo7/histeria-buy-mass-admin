import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../auth/services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isInitialized()) {
    if (authService.userRole() === 'ADMIN') {
      return true;
    }
    return router.createUrlTree(['/dashboard']);
  }

  return authService.initializeSession().pipe(
    map((isAuthenticated) => {
      if (isAuthenticated && authService.userRole() === 'ADMIN') {
        return true;
      }
      return router.createUrlTree(['/dashboard']);
    }),
  );
};
