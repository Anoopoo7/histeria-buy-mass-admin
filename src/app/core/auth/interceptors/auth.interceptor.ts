import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthResponse } from '../../models/auth.model';
import { TokenStorageService } from '../../services/token-storage.service';
import { AuthService } from '../services/auth.service';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

const BYPASS_PATHS = [
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/refresh',
  '/api/v1/auth/phone/otp/send',
  '/api/v1/auth/phone/otp/verify',
  '/api/v1/auth/verify-phone',
  '/api/v1/auth/email/verify',
  '/api/v1/auth/email/verification/resend',
];

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const tokenStorage = inject(TokenStorageService);
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if request is targeted to our backend API
  const isBackendUrl = req.url.startsWith('/') || req.url.startsWith(environment.apiBaseUrl);

  // Check if request matches bypass list
  const isBypassUrl = BYPASS_PATHS.some((path) => req.url.includes(path));

  let authReq = req;
  const token = tokenStorage.getAccessToken();

  if (isBackendUrl && token && !isBypassUrl && !req.headers.has('Authorization')) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(authReq).pipe(
    catchError((error: unknown) => {
      if (isBackendUrl && error instanceof HttpErrorResponse && error.status === 401) {
        // If 401 happened during refresh or on a bypass endpoint, don't attempt refresh loop
        if (isBypassUrl || req.url.includes('/api/v1/auth/refresh')) {
          tokenStorage.clearTokens();
          return throwError(() => error);
        }

        return handle401Error(authReq, next, tokenStorage, authService, router);
      }

      // Any other error (including 403 Forbidden or third-party error) is passed through without refresh
      return throwError(() => error);
    }),
  );
};

function handle401Error(
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
  tokenStorage: TokenStorageService,
  authService: AuthService,
  router: Router,
): Observable<HttpEvent<unknown>> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return authService.refreshTokens().pipe(
      switchMap((response: AuthResponse) => {
        isRefreshing = false;
        refreshTokenSubject.next(response.accessToken);
        return next(
          request.clone({
            setHeaders: {
              Authorization: `Bearer ${response.accessToken}`,
            },
          }),
        );
      }),
      catchError((refreshErr: unknown) => {
        isRefreshing = false;
        refreshTokenSubject.next(null);
        tokenStorage.clearTokens();
        router.navigate(['/auth/login']);
        return throwError(() => refreshErr);
      }),
    );
  } else {
    // Concurrent request: wait for the active refresh to emit new access token
    return refreshTokenSubject.pipe(
      filter((token): token is string => token !== null),
      take(1),
      switchMap((newToken: string) => {
        return next(
          request.clone({
            setHeaders: {
              Authorization: `Bearer ${newToken}`,
            },
          }),
        );
      }),
    );
  }
}
