import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, map, of, switchMap, tap, throwError } from 'rxjs';
import {
  AuthResponse,
  LoginRequest,
  LogoutResponse,
  RegisterRequest,
  RegisterResponse,
  SendPhoneOtpRequest,
  SendPhoneOtpResponse,
  VerifyPhoneOtpRequest,
  VerifyPhoneOtpResponse,
} from '../../models/auth.model';
import { MerchantMeResponse, MerchantRecord } from '../../models/merchant.model';
import { PublicUser } from '../../models/user.model';
import { ApiClientService, ApiError } from '../../services/api-client.service';
import { ToastService } from '../../services/toast.service';
import { TokenStorageService } from '../../services/token-storage.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiClient = inject(ApiClientService);
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  // Reactive state using Angular Signals
  private readonly _currentUser = signal<PublicUser | null>(null);
  readonly currentUser = this._currentUser.asReadonly();

  private readonly _currentMerchant = signal<MerchantRecord | null>(null);
  readonly currentMerchant = this._currentMerchant.asReadonly();

  private readonly _isLoading = signal<boolean>(false);
  readonly isLoading = this._isLoading.asReadonly();

  private readonly _isInitialized = signal<boolean>(false);
  readonly isInitialized = this._isInitialized.asReadonly();

  // Temporary storage during multi-step registration/verification flow
  private readonly _pendingVerificationPhone = signal<string | null>(null);
  readonly pendingVerificationPhone = this._pendingVerificationPhone.asReadonly();

  // Computed state
  readonly isAuthenticated = computed(() => !!this._currentUser() && !!this.tokenStorage.accessToken());
  readonly isEmailVerified = computed(() => !!this._currentUser()?.isEmailVerified);
  readonly isPhoneVerified = computed(() => !!this._currentUser()?.isPhoneVerified);
  readonly isMerchantApproved = computed(() => this._currentMerchant()?.status === 'APPROVED');
  readonly userRole = computed(() => this._currentUser()?.role ?? null);

  /**
   * Initializes auth session on app startup by rotating refresh token if present
   * and synchronizing current user & merchant profile state.
   */
  initializeSession(): Observable<boolean> {
    const refreshToken = this.tokenStorage.getRefreshToken();
    if (!refreshToken) {
      this._isInitialized.set(true);
      return of(false);
    }

    this._isLoading.set(true);
    return this.refreshTokens().pipe(
      switchMap(() =>
        this.loadCurrentMerchantProfile().pipe(
          catchError(() => of(null)),
        ),
      ),
      map(() => {
        this._isInitialized.set(true);
        this._isLoading.set(false);
        return true;
      }),
      catchError(() => {
        this.tokenStorage.clearTokens();
        this._currentUser.set(null);
        this._currentMerchant.set(null);
        this._isInitialized.set(true);
        this._isLoading.set(false);
        return of(false);
      }),
    );
  }

  /**
   * Register a new user account
   * POST /api/v1/auth/register
   */
  register(payload: RegisterRequest): Observable<RegisterResponse> {
    this._isLoading.set(true);
    // Ensure acceptTerms is strictly true
    const requestPayload: RegisterRequest = {
      ...payload,
      acceptTerms: true,
    };

    return this.apiClient.post<RegisterResponse>('/api/v1/auth/register', requestPayload).pipe(
      tap((res) => {
        this._isLoading.set(false);
        if (payload.phone) {
          this._pendingVerificationPhone.set(payload.phone);
        }
      }),
      catchError((err: ApiError) => {
        this._isLoading.set(false);
        return throwError(() => err);
      }),
    );
  }

  /**
   * Login with email/phone and password
   * POST /api/v1/auth/login
   */
  login(payload: LoginRequest): Observable<AuthResponse> {
    this._isLoading.set(true);
    // Support both identifier and email field names for compatibility
    const requestPayload = {
      email: payload.email,
      identifier: payload.identifier || payload.email,
      password: payload.password,
    };

    return this.apiClient.post<AuthResponse>('/api/v1/auth/login', requestPayload).pipe(
      tap((response) => {
        this.tokenStorage.setAccessToken(response.accessToken);
        this.tokenStorage.setRefreshToken(response.refreshToken);
        this._currentUser.set(response.user);
        this._isLoading.set(false);
        // Load associated merchant profile in the background
        this.loadCurrentMerchantProfile().subscribe({
          error: () => {
            // Unapproved or not yet applied merchants may return 404 or empty
          },
        });
      }),
      catchError((err: ApiError) => {
        this._isLoading.set(false);
        return throwError(() => err);
      }),
    );
  }

  /**
   * Send WhatsApp Phone Verification OTP
   * POST /api/v1/auth/phone/otp/send
   */
  sendPhoneOtp(phone: string): Observable<SendPhoneOtpResponse> {
    this._isLoading.set(true);
    const request: SendPhoneOtpRequest = { phone };

    return this.apiClient.post<SendPhoneOtpResponse>('/api/v1/auth/phone/otp/send', request).pipe(
      tap((res) => {
        this._isLoading.set(false);
        this._pendingVerificationPhone.set(phone);
        this.toast.info(res.message || 'Verification code sent to your WhatsApp');
      }),
      catchError((err: ApiError) => {
        this._isLoading.set(false);
        return throwError(() => err);
      }),
    );
  }

  /**
   * Verify phone number with 6-digit WhatsApp OTP
   * POST /api/v1/auth/phone/otp/verify
   */
  verifyPhone(phone: string, otp: string): Observable<VerifyPhoneOtpResponse> {
    this._isLoading.set(true);
    const request: VerifyPhoneOtpRequest = { phone: phone.trim(), otp: otp.trim() };

    return this.apiClient
      .post<VerifyPhoneOtpResponse>('/api/v1/auth/phone/otp/verify', request)
      .pipe(
        tap((res) => {
          this._isLoading.set(false);
          this.toast.success(res.message || 'Phone number verified successfully');
          // Update current user signal if logged in
          const current = this._currentUser();
          if (current) {
            this._currentUser.set({ ...current, isPhoneVerified: true, phone: phone.trim() });
          }
        }),
        catchError((err: ApiError) => {
          this._isLoading.set(false);
          return throwError(() => err);
        }),
      );
  }

  /**
   * Rotate refresh token and obtain new token pair
   * POST /api/v1/auth/refresh
   */
  refreshTokens(): Observable<AuthResponse> {
    const refreshToken = this.tokenStorage.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => ({
        status: 401,
        message: 'No refresh token available.',
      } as ApiError));
    }

    return this.apiClient
      .post<AuthResponse>('/api/v1/auth/refresh', { refreshToken })
      .pipe(
        tap((response) => {
          this.tokenStorage.setAccessToken(response.accessToken);
          this.tokenStorage.setRefreshToken(response.refreshToken);
          this._currentUser.set(response.user);
        }),
        catchError((err: ApiError) => {
          this.tokenStorage.clearTokens();
          this._currentUser.set(null);
          this._currentMerchant.set(null);
          return throwError(() => err);
        }),
      );
  }

  /**
   * Fetch current authenticated user profile
   * GET /api/v1/auth/me
   */
  loadCurrentUser(): Observable<PublicUser> {
    return this.apiClient.get<PublicUser>('/api/v1/auth/me').pipe(
      tap((user) => {
        this._currentUser.set(user);
      }),
    );
  }

  /**
   * Fetch current merchant store profile / onboarding status
   * GET /api/v1/merchants/me
   */
  loadCurrentMerchantProfile(): Observable<MerchantRecord | null> {
    return this.apiClient.get<MerchantMeResponse>('/api/v1/merchants/me').pipe(
      map((res) => res?.merchant || null),
      tap((merchant) => {
        this._currentMerchant.set(merchant);
      }),
      catchError(() => {
        this._currentMerchant.set(null);
        return of(null);
      }),
    );
  }

  /**
   * Safe local session cleanup and backend revocation
   * POST /api/v1/auth/logout
   */
  logout(): void {
    const refreshToken = this.tokenStorage.getRefreshToken();
    if (refreshToken) {
      this.apiClient.post<LogoutResponse>('/api/v1/auth/logout', { refreshToken }).subscribe({
        error: () => {
          // Continue local cleanup even if network revocation fails
        },
      });
    }

    this.tokenStorage.clearTokens();
    this._currentUser.set(null);
    this._currentMerchant.set(null);
    this._pendingVerificationPhone.set(null);
    this.toast.info('You have been signed out.');
    this.router.navigate(['/auth/login']);
  }

  setPendingVerificationPhone(phone: string | null): void {
    this._pendingVerificationPhone.set(phone);
  }
}
