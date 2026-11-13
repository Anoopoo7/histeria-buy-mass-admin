import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { VerifyPhonePageComponent } from './verify-phone.component';

describe('VerifyPhonePageComponent & OTP Validation', () => {
  let component: VerifyPhonePageComponent;
  let fixture: ComponentFixture<VerifyPhonePageComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let toastSpy: jasmine.SpyObj<ToastService>;
  let router: Router;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', [
      'verifyPhone',
      'sendPhoneOtp',
      'isLoading',
      'pendingVerificationPhone',
      'currentUser',
      'isAuthenticated',
    ]);
    toastSpy = jasmine.createSpyObj('ToastService', ['success', 'info', 'warning', 'danger']);

    authServiceSpy.isLoading.and.returnValue(false);
    authServiceSpy.pendingVerificationPhone.and.returnValue('919876543210');
    authServiceSpy.isAuthenticated.and.returnValue(false);
    authServiceSpy.verifyPhone.and.returnValue(of({ success: true, message: 'Verified' }));

    await TestBed.configureTestingModule({
      imports: [VerifyPhonePageComponent, ReactiveFormsModule],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ToastService, useValue: toastSpy },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    fixture = TestBed.createComponent(VerifyPhonePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and initialize with 6 digit controls', () => {
    expect(component).toBeTruthy();
    expect(component.otpDigits.length).toBe(6);
    expect(component.isOtpIncomplete).toBeTrue();
  });

  it('should accept valid 6-digit input and enable submission', () => {
    const testDigits = ['1', '2', '3', '4', '5', '6'];
    testDigits.forEach((digit, index) => {
      component.otpDigits.at(index).setValue(digit);
    });

    expect(component.isOtpIncomplete).toBeFalse();

    component.onSubmit();

    expect(authServiceSpy.verifyPhone).toHaveBeenCalledWith('919876543210', '123456');
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
  });

  it('should not submit if any digit is missing', () => {
    component.otpDigits.at(0).setValue('1');
    component.otpDigits.at(1).setValue('2');
    component.otpDigits.at(2).setValue('3');
    // digits 3, 4, 5 missing

    expect(component.isOtpIncomplete).toBeTrue();
    component.onSubmit();
    expect(authServiceSpy.verifyPhone).not.toHaveBeenCalled();
  });
});
