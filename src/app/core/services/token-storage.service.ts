import { Injectable, signal } from '@angular/core';

/**
 * Token Storage Service
 *
 * Security Architecture & Trade-Off Documentation:
 * 1. Access Tokens:
 *    - Held exclusively in-memory using an Angular Signal.
 *    - When the browser tab is reloaded, the in-memory access token is lost.
 *    - On bootstrap, if a valid refresh token exists in persistent storage,
 *      the application automatically performs a token rotation (`POST /api/v1/auth/refresh`)
 *      to rehydrate the in-memory access token without storing the access token in localStorage.
 * 2. Refresh Tokens:
 *    - Because the backend returns refresh tokens in JSON response bodies rather than
 *      Set-Cookie HttpOnly headers, browser storage (localStorage) is used for persistence.
 *    - Trade-off acknowledgement: Browser storage is vulnerable to XSS if an injection occurs.
 *      To mitigate this, access tokens are never kept in localStorage, strict Content-Security-Policy
 *      is advised, and token reuse detection is actively enforced by the backend family revocation.
 * 3. Sensitive Data Protection:
 *    - Passwords and OTP codes are strictly never stored or logged in any persistent or logging tier.
 */
@Injectable({
  providedIn: 'root',
})
export class TokenStorageService {
  private static readonly REFRESH_TOKEN_KEY = 'bm_rt_store_admin';

  // In-memory access token signal
  private readonly _accessToken = signal<string | null>(null);
  readonly accessToken = this._accessToken.asReadonly();

  getAccessToken(): string | null {
    return this._accessToken();
  }

  setAccessToken(token: string | null): void {
    this._accessToken.set(token);
  }

  getRefreshToken(): string | null {
    try {
      return localStorage.getItem(TokenStorageService.REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  }

  setRefreshToken(token: string | null): void {
    try {
      if (token) {
        localStorage.setItem(TokenStorageService.REFRESH_TOKEN_KEY, token);
      } else {
        localStorage.removeItem(TokenStorageService.REFRESH_TOKEN_KEY);
      }
    } catch {
      // Storage access may be blocked in strict private browsing modes
    }
  }

  clearTokens(): void {
    this._accessToken.set(null);
    try {
      localStorage.removeItem(TokenStorageService.REFRESH_TOKEN_KEY);
    } catch {
      // No-op
    }
  }
}
