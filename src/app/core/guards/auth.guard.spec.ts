import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../auth/services/auth.service';
import { authGuard, guestGuard } from './auth.guard';

describe('Route Guards', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', [
      'isInitialized',
      'isAuthenticated',
      'initializeSession',
    ]);
    routerSpy = jasmine.createSpyObj('Router', ['createUrlTree']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });
  });

  describe('authGuard', () => {
    it('should allow access if user is initialized and authenticated', () => {
      authServiceSpy.isInitialized.and.returnValue(true);
      authServiceSpy.isAuthenticated.and.returnValue(true);

      const result = TestBed.runInInjectionContext(() =>
        authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
      );

      expect(result).toBeTrue();
    });

    it('should redirect to /auth/login if not authenticated', () => {
      authServiceSpy.isInitialized.and.returnValue(true);
      authServiceSpy.isAuthenticated.and.returnValue(false);
      const mockUrlTree = {} as UrlTree;
      routerSpy.createUrlTree.and.returnValue(mockUrlTree);

      const result = TestBed.runInInjectionContext(() =>
        authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
      );

      expect(routerSpy.createUrlTree).toHaveBeenCalledWith(['/auth/login']);
      expect(result).toBe(mockUrlTree);
    });
  });

  describe('guestGuard', () => {
    it('should redirect to /dashboard if authenticated user accesses guest route', () => {
      authServiceSpy.isInitialized.and.returnValue(true);
      authServiceSpy.isAuthenticated.and.returnValue(true);
      const mockUrlTree = {} as UrlTree;
      routerSpy.createUrlTree.and.returnValue(mockUrlTree);

      const result = TestBed.runInInjectionContext(() =>
        guestGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
      );

      expect(routerSpy.createUrlTree).toHaveBeenCalledWith(['/dashboard']);
      expect(result).toBe(mockUrlTree);
    });

    it('should allow unauthenticated guests', () => {
      authServiceSpy.isInitialized.and.returnValue(true);
      authServiceSpy.isAuthenticated.and.returnValue(false);

      const result = TestBed.runInInjectionContext(() =>
        guestGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
      );

      expect(result).toBeTrue();
    });
  });
});
