import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../auth/services/auth.service';

/**
 * Merchant Approved Guard
 *
 * Ensures only APPROVED merchants can access live store management features
 * (e.g. Products, Campaigns, Inventory, Orders).
 * Merchants in DRAFT, PENDING_REVIEW, REJECTED, or without an application
 * are directed to the onboarding status overview.
 */
export const merchantApprovedGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // If already loaded
  const currentMerchant = authService.currentMerchant();
  if (currentMerchant) {
    if (currentMerchant.status === 'APPROVED') {
      return true;
    }
    return router.createUrlTree(['/merchant/status']);
  }

  // Otherwise fetch from backend
  return authService.loadCurrentMerchantProfile().pipe(
    map((merchant) => {
      if (merchant && merchant.status === 'APPROVED') {
        return true;
      }
      return router.createUrlTree(['/merchant/status']);
    }),
    catchError(() => {
      return of(router.createUrlTree(['/merchant/status']));
    }),
  );
};
