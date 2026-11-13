import { HttpErrorResponse, HttpHandlerFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { TokenStorageService } from '../../services/token-storage.service';
import { AuthService } from '../services/auth.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let tokenStorageSpy: jasmine.SpyObj<TokenStorageService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    tokenStorageSpy = jasmine.createSpyObj('TokenStorageService', [
      'getAccessToken',
      'clearTokens',
    ]);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['refreshTokens']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: TokenStorageService, useValue: tokenStorageSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });
  });

  it('should attach Bearer token to authenticated requests', (done) => {
    tokenStorageSpy.getAccessToken.and.returnValue('valid-access-token');

    const req = new HttpRequest('GET', '/api/v1/merchants/me');
    const next: HttpHandlerFn = (interceptedReq) => {
      expect(interceptedReq.headers.get('Authorization')).toBe('Bearer valid-access-token');
      return of(new HttpResponse({ status: 200 }));
    };

    TestBed.runInInjectionContext(() => {
      authInterceptor(req, next).subscribe({
        next: () => done(),
      });
    });
  });

  it('should not attach token to bypass paths', (done) => {
    tokenStorageSpy.getAccessToken.and.returnValue('valid-access-token');

    const req = new HttpRequest('POST', '/api/v1/auth/login', {});
    const next: HttpHandlerFn = (interceptedReq) => {
      expect(interceptedReq.headers.has('Authorization')).toBeFalse();
      return of(new HttpResponse({ status: 200 }));
    };

    TestBed.runInInjectionContext(() => {
      authInterceptor(req, next).subscribe({
        next: () => done(),
      });
    });
  });

  it('should not refresh on 403 Forbidden errors', (done) => {
    tokenStorageSpy.getAccessToken.and.returnValue('valid-token');

    const req = new HttpRequest('GET', '/api/v1/merchants/me');
    const next: HttpHandlerFn = () =>
      throwError(() => new HttpErrorResponse({ status: 403, statusText: 'Forbidden' }));

    TestBed.runInInjectionContext(() => {
      authInterceptor(req, next).subscribe({
        error: (err: HttpErrorResponse) => {
          expect(err.status).toBe(403);
          expect(authServiceSpy.refreshTokens).not.toHaveBeenCalled();
          done();
        },
      });
    });
  });
});
