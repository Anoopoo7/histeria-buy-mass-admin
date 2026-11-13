import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { ApiError } from '../../../../core/services/api-client.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { InputComponent } from '../../../../shared/ui/input/input.component';
import { PasswordInputComponent } from '../../../../shared/ui/password-input/password-input.component';

export const passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');

  if (!password || !confirmPassword) return null;
  if (confirmPassword.errors && !confirmPassword.errors['passwordMismatch']) {
    return null;
  }

  if (password.value !== confirmPassword.value) {
    confirmPassword.setErrors({ passwordMismatch: true });
    return { passwordMismatch: true };
  } else {
    confirmPassword.setErrors(null);
    return null;
  }
};

export const backendPasswordPolicyValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const val = control.value;
  if (!val || typeof val !== 'string') return null;

  const hasLength = val.length >= 8;
  const hasLetter = /[A-Za-z]/.test(val);
  const hasNumber = /\d/.test(val);

  if (!hasLength || !hasLetter || !hasNumber) {
    return { passwordPolicy: true };
  }
  return null;
};

@Component({
  selector: 'bm-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ButtonComponent,
    InputComponent,
    PasswordInputComponent,
  ],
  template: `
    <div class="bm-register-page">
      <div class="bm-auth-header">
        <h2 class="bm-auth-title">Create Merchant Account</h2>
        <p class="bm-auth-desc">Join the BuyMass Kerala community commerce network</p>
      </div>

      @if (errorMessage()) {
        <div class="bm-alert-banner bm-alert-danger" role="alert">
          <span>{{ errorMessage() }}</span>
        </div>
      }

      <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="bm-form">
        <!-- Full Name -->
        <bm-input
          id="reg-name"
          label="Full Name"
          placeholder="e.g. Anoop Kumar"
          autocomplete="name"
          [required]="true"
          formControlName="name"
          [error]="getFieldError('name')"
        ></bm-input>

        <!-- Email Address -->
        <bm-input
          id="reg-email"
          label="Email Address"
          type="email"
          placeholder="anoop@example.com"
          autocomplete="email"
          [required]="true"
          formControlName="email"
          [error]="getFieldError('email')"
        ></bm-input>

        <!-- Phone Number -->
        <bm-input
          id="reg-phone"
          label="WhatsApp Phone Number"
          type="tel"
          placeholder="e.g. 919876543210"
          autocomplete="tel"
          [required]="true"
          formControlName="phone"
          hint="Used for 6-digit WhatsApp OTP verification"
          [error]="getFieldError('phone')"
        ></bm-input>

        <!-- Password -->
        <bm-password-input
          id="reg-password"
          label="Password"
          placeholder="At least 8 characters"
          autocomplete="new-password"
          [required]="true"
          [showStrength]="true"
          formControlName="password"
          [error]="getFieldError('password')"
        ></bm-password-input>

        <!-- Confirm Password -->
        <bm-password-input
          id="reg-confirm-password"
          label="Confirm Password"
          placeholder="Re-enter your password"
          autocomplete="new-password"
          [required]="true"
          formControlName="confirmPassword"
          [error]="getFieldError('confirmPassword')"
        ></bm-password-input>

        <!-- Terms & Conditions Checkbox -->
        <div class="bm-terms-field">
          <label class="bm-checkbox-label">
            <input type="checkbox" formControlName="acceptTerms" />
            <span>
              I accept the BuyMass
              <a href="#" (click)="$event.preventDefault()">Merchant Terms & Privacy Agreement</a>
            </span>
          </label>
          @if (registerForm.get('acceptTerms')?.touched && registerForm.get('acceptTerms')?.hasError('requiredTrue')) {
            <p class="bm-field-error">You must accept the terms and conditions</p>
          }
        </div>

        <!-- Submit Button -->
        <bm-button
          type="submit"
          variant="primary"
          size="lg"
          [fullWidth]="true"
          [loading]="authService.isLoading()"
          [disabled]="registerForm.invalid || authService.isLoading()"
        >
          Create Account & Verify Phone
        </bm-button>
      </form>

      <!-- Back to login link -->
      <div class="bm-auth-footer-link">
        <span>Already have an account?</span>
        <a routerLink="/auth/login" class="bm-link-bold">Sign In</a>
      </div>
    </div>
  `,
  styles: [`
    .bm-register-page {
      display: flex;
      flex-direction: column;
      gap: var(--bm-space-6);
    }

    .bm-auth-header {
      text-align: left;
    }

    .bm-auth-title {
      font-size: var(--bm-font-size-xl);
      font-weight: var(--bm-font-weight-semibold);
      color: var(--bm-color-text-primary);
      margin: 0;
      letter-spacing: -0.01em;
    }

    .bm-auth-desc {
      font-size: var(--bm-font-size-sm);
      color: var(--bm-color-text-secondary);
      margin-top: 4px;
      margin-bottom: 0;
    }

    .bm-alert-banner {
      padding: var(--bm-space-3) var(--bm-space-4);
      border-radius: var(--bm-radius-md);
      font-size: var(--bm-font-size-xs);
      line-height: 1.4;

      &.bm-alert-danger {
        background-color: var(--bm-color-danger-bg);
        color: var(--bm-color-danger);
        border: 1px solid var(--bm-color-danger-border);
      }
    }

    .bm-form {
      display: flex;
      flex-direction: column;
      gap: var(--bm-space-4);
    }

    .bm-terms-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .bm-checkbox-label {
      display: flex;
      align-items: flex-start;
      gap: var(--bm-space-2);
      font-size: var(--bm-font-size-xs);
      color: var(--bm-color-text-secondary);
      cursor: pointer;
      user-select: none;
      line-height: 1.4;

      input[type="checkbox"] {
        accent-color: var(--bm-color-primary);
        width: 15px;
        height: 15px;
        margin-top: 2px;
        cursor: pointer;
      }

      a {
        color: var(--bm-color-primary);
        font-weight: var(--bm-font-weight-medium);
      }
    }

    .bm-field-error {
      font-size: var(--bm-font-size-xs);
      color: var(--bm-color-danger);
      margin: 0;
    }

    .bm-auth-footer-link {
      text-align: center;
      font-size: var(--bm-font-size-xs);
      color: var(--bm-color-text-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--bm-space-1);
      padding-top: var(--bm-space-2);
      border-top: 1px solid var(--bm-color-border);
    }

    .bm-link-bold {
      font-weight: var(--bm-font-weight-medium);
      color: var(--bm-color-primary);
    }
  `],
})
export class RegisterPageComponent {
  private readonly fb = inject(FormBuilder);
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly errorMessage = signal<string | null>(null);

  readonly registerForm: FormGroup = this.fb.group(
    {
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9+()\s-]{10,15}$/)]],
      password: ['', [Validators.required, backendPasswordPolicyValidator]],
      confirmPassword: ['', [Validators.required]],
      acceptTerms: [false, [Validators.requiredTrue]],
    },
    { validators: [passwordMatchValidator] },
  );

  getFieldError(fieldName: string): string | null {
    const control = this.registerForm.get(fieldName);
    if (!control || !control.touched || !control.errors) {
      return null;
    }

    if (control.errors['required']) return 'This field is required';
    if (control.errors['email']) return 'Please enter a valid email address';
    if (control.errors['pattern']) return 'Please enter a valid phone number';
    if (control.errors['passwordPolicy']) {
      return 'Password must be 8+ characters and contain at least one letter and one number';
    }
    if (control.errors['passwordMismatch']) {
      return 'Passwords do not match';
    }
    return null;
  }

  onSubmit(): void {
    if (this.registerForm.invalid || this.authService.isLoading()) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    const formVal = this.registerForm.value;

    this.authService
      .register({
        name: formVal.name.trim(),
        email: formVal.email.trim(),
        phone: formVal.phone.trim(),
        password: formVal.password,
        acceptTerms: true,
      })
      .subscribe({
        next: (res) => {
          this.toast.success(res.message || 'Account created successfully.');
          // Automatically trigger WhatsApp OTP send to the phone
          this.authService.sendPhoneOtp(formVal.phone.trim()).subscribe({
            next: () => {
              this.router.navigate(['/auth/verify-phone']);
            },
            error: () => {
              // Navigate even if automatic OTP dispatch hit a rate limit, allowing user to manually verify
              this.router.navigate(['/auth/verify-phone']);
            },
          });
        },
        error: (err: ApiError) => {
          if (err.status === 409) {
            this.errorMessage.set('An account with this email address already exists.');
          } else {
            this.errorMessage.set(err.message || 'Registration failed. Please check your information.');
          }
        },
      });
  }
}
