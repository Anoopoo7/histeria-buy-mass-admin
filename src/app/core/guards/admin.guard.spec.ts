import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../auth/services/auth.service';
import { adminGuard } from './admin.guard';

describe('adminGuard', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', [
      'isInitialized',
      'userRole',
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

  it('should allow access if user is initialized and role is ADMIN', () => {
    authServiceSpy.isInitialized.and.returnValue(true);
    authServiceSpy.userRole.and.returnValue('ADMIN');

    const result = TestBed.runInInjectionContext(() =>
      adminGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

    expect(result).toBeTrue();
  });

  it('should redirect to /dashboard if role is not ADMIN', () => {
    authServiceSpy.isInitialized.and.returnValue(true);
    authServiceSpy.userRole.and.returnValue('CUSTOMER');
    const mockTree = {} as UrlTree;
    routerSpy.createUrlTree.and.returnValue(mockTree);

    const result = TestBed.runInInjectionContext(() =>
      adminGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

    expect(routerSpy.createUrlTree).toHaveBeenCalledWith(['/dashboard']);
    expect(result).toBe(mockTree);
  });
});
