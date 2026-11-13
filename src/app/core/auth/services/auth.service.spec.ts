import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ApiClientService } from '../../services/api-client.service';
import { ToastService } from '../../services/toast.service';
import { TokenStorageService } from '../../services/token-storage.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let apiClientSpy: jasmine.SpyObj<ApiClientService>;
  let tokenStorageSpy: jasmine.SpyObj<TokenStorageService>;
  let toastSpy: jasmine.SpyObj<ToastService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockUser = {
    id: 'user-123',
    name: 'Anoop Kumar',
    email: 'anoop@example.com',
    phone: '919876543210',
    role: 'CUSTOMER',
    isEmailVerified: true,
    isPhoneVerified: true,
  };

  beforeEach(() => {
    apiClientSpy = jasmine.createSpyObj('ApiClientService', ['get', 'post']);
    tokenStorageSpy = jasmine.createSpyObj('TokenStorageService', [
      'getAccessToken',
      'setAccessToken',
      'getRefreshToken',
      'setRefreshToken',
      'clearTokens',
    ]);
    toastSpy = jasmine.createSpyObj('ToastService', ['success', 'info', 'warning', 'danger']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: ApiClientService, useValue: apiClientSpy },
        { provide: TokenStorageService, useValue: tokenStorageSpy },
        { provide: ToastService, useValue: toastSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });

    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should set tokens and user on successful login', (done) => {
      const mockAuthRes = {
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-456',
        user: mockUser,
      };

      apiClientSpy.post.and.returnValue(of(mockAuthRes));
      apiClientSpy.get.and.returnValue(of({ merchant: null }));

      service.login({ email: 'anoop@example.com', password: 'Password123!' }).subscribe({
        next: (res) => {
          expect(res).toEqual(mockAuthRes);
          expect(tokenStorageSpy.setAccessToken).toHaveBeenCalledWith('access-token-123');
          expect(tokenStorageSpy.setRefreshToken).toHaveBeenCalledWith('refresh-token-456');
          expect(service.currentUser()).toEqual(mockUser);
          expect(service.isLoading()).toBeFalse();
          done();
        },
      });
    });

    it('should propagate API error and reset loading state', (done) => {
      const mockErr = { status: 401, message: 'Invalid email or password' };
      apiClientSpy.post.and.returnValue(throwError(() => mockErr));

      service.login({ email: 'anoop@example.com', password: 'WrongPassword' }).subscribe({
        error: (err) => {
          expect(err).toEqual(mockErr);
          expect(service.isLoading()).toBeFalse();
          done();
        },
      });
    });
  });

  describe('register', () => {
    it('should submit register request with acceptTerms true', (done) => {
      const regReq = {
        name: 'Anoop',
        email: 'anoop@example.com',
        phone: '919876543210',
        password: 'Password123!',
        acceptTerms: true,
      };
      const mockRegRes = { success: true, message: 'Registration successful' };
      apiClientSpy.post.and.returnValue(of(mockRegRes));

      service.register(regReq).subscribe({
        next: (res) => {
          expect(res).toEqual(mockRegRes);
          expect(service.pendingVerificationPhone()).toBe('919876543210');
          expect(service.isLoading()).toBeFalse();
          done();
        },
      });
    });
  });

  describe('verifyPhone', () => {
    it('should call verify endpoint and update isPhoneVerified on user signal', (done) => {
      apiClientSpy.post.and.returnValue(of({ success: true, message: 'Verified' }));

      service.verifyPhone('919876543210', '123456').subscribe({
        next: (res) => {
          expect(res.success).toBeTrue();
          expect(toastSpy.success).toHaveBeenCalled();
          done();
        },
      });
    });
  });

  describe('logout', () => {
    it('should clear tokens, reset user signal, and navigate to /auth/login', () => {
      tokenStorageSpy.getRefreshToken.and.returnValue('some-token');
      apiClientSpy.post.and.returnValue(of({ success: true }));

      service.logout();

      expect(tokenStorageSpy.clearTokens).toHaveBeenCalled();
      expect(service.currentUser()).toBeNull();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);
    });
  });
});
