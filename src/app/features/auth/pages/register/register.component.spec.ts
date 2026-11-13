import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { RegisterPageComponent, backendPasswordPolicyValidator, passwordMatchValidator } from './register.component';

describe('RegisterPageComponent & Validation', () => {
  let component: RegisterPageComponent;
  let fixture: ComponentFixture<RegisterPageComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let toastSpy: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['register', 'sendPhoneOtp', 'isLoading']);
    toastSpy = jasmine.createSpyObj('ToastService', ['success', 'info', 'danger']);

    authServiceSpy.isLoading.and.returnValue(false);
    authServiceSpy.register.and.returnValue(of({ success: true, message: 'Created' }));
    authServiceSpy.sendPhoneOtp.and.returnValue(
      of({ success: true, message: 'Sent', expiresIn: 300, cooldownSeconds: 60 }),
    );

    await TestBed.configureTestingModule({
      imports: [RegisterPageComponent, ReactiveFormsModule],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ToastService, useValue: toastSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created and form should start invalid', () => {
    expect(component).toBeTruthy();
    expect(component.registerForm.valid).toBeFalse();
  });

  it('should require valid email', () => {
    const emailControl = component.registerForm.get('email');
    emailControl?.setValue('invalid-email');
    expect(emailControl?.valid).toBeFalse();

    emailControl?.setValue('anoop@example.com');
    expect(emailControl?.valid).toBeTrue();
  });

  it('should enforce password policy (at least 8 chars, 1 letter, 1 number)', () => {
    const passwordControl = component.registerForm.get('password');

    // Too short
    passwordControl?.setValue('Pass1');
    expect(passwordControl?.hasError('passwordPolicy')).toBeTrue();

    // No numbers
    passwordControl?.setValue('PasswordWithoutNumbers');
    expect(passwordControl?.hasError('passwordPolicy')).toBeTrue();

    // No letters
    passwordControl?.setValue('1234567890');
    expect(passwordControl?.hasError('passwordPolicy')).toBeTrue();

    // Valid
    passwordControl?.setValue('StrongPass123!');
    expect(passwordControl?.valid).toBeTrue();
  });

  it('should enforce password confirmation match', () => {
    component.registerForm.patchValue({
      name: 'Anoop',
      email: 'anoop@example.com',
      phone: '919876543210',
      password: 'StrongPass123!',
      confirmPassword: 'DifferentPassword123!',
      acceptTerms: true,
    });

    expect(component.registerForm.valid).toBeFalse();
    expect(component.registerForm.hasError('passwordMismatch')).toBeTrue();

    component.registerForm.patchValue({
      confirmPassword: 'StrongPass123!',
    });

    expect(component.registerForm.hasError('passwordMismatch')).toBeFalse();
    expect(component.registerForm.valid).toBeTrue();
  });

  it('should require acceptTerms to be true', () => {
    const termsControl = component.registerForm.get('acceptTerms');
    termsControl?.setValue(false);
    expect(termsControl?.valid).toBeFalse();

    termsControl?.setValue(true);
    expect(termsControl?.valid).toBeTrue();
  });
});
