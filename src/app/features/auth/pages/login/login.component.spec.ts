import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { LoginPageComponent } from './login.component';

describe('LoginPageComponent & Validation', () => {
  let component: LoginPageComponent;
  let fixture: ComponentFixture<LoginPageComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let toastSpy: jasmine.SpyObj<ToastService>;
  let router: Router;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['login', 'isLoading']);
    toastSpy = jasmine.createSpyObj('ToastService', ['success', 'info', 'danger']);

    authServiceSpy.isLoading.and.returnValue(false);

    await TestBed.configureTestingModule({
      imports: [LoginPageComponent, ReactiveFormsModule],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ToastService, useValue: toastSpy },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    fixture = TestBed.createComponent(LoginPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and form be initially invalid', () => {
    expect(component).toBeTruthy();
    expect(component.loginForm.valid).toBeFalse();
  });

  it('should validate identifier field', () => {
    const control = component.loginForm.get('identifier');
    control?.setValue('');
    expect(control?.valid).toBeFalse();

    control?.setValue('ab');
    expect(control?.valid).toBeFalse();

    control?.setValue('anoop@example.com');
    expect(control?.valid).toBeTrue();
  });

  it('should validate password field', () => {
    const control = component.loginForm.get('password');
    control?.setValue('');
    expect(control?.valid).toBeFalse();

    control?.setValue('12345');
    expect(control?.valid).toBeFalse();

    control?.setValue('StrongPass123!');
    expect(control?.valid).toBeTrue();
  });

  it('should call login on valid form submit', () => {
    authServiceSpy.login.and.returnValue(
      of({
        accessToken: 'mock-access',
        refreshToken: 'mock-refresh',
        user: {
          id: 'u-1',
          name: 'Anoop',
          email: 'anoop@example.com',
          role: 'CUSTOMER',
          isEmailVerified: true,
          isPhoneVerified: true,
        },
      }),
    );

    component.loginForm.setValue({
      identifier: 'anoop@example.com',
      password: 'StrongPass123!',
      rememberMe: false,
    });

    component.onSubmit();

    expect(authServiceSpy.login).toHaveBeenCalledWith({
      email: 'anoop@example.com',
      identifier: 'anoop@example.com',
      password: 'StrongPass123!',
    });
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should display error message on login failure without alert popup', () => {
    authServiceSpy.login.and.returnValue(
      throwError(() => ({ status: 401, message: 'Invalid credentials' })),
    );

    component.loginForm.setValue({
      identifier: 'anoop@example.com',
      password: 'WrongPassword!',
      rememberMe: false,
    });

    component.onSubmit();

    expect(component.errorMessage()).toBe('Invalid credentials');
  });
});
