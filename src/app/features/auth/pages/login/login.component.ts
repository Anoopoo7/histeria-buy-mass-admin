import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { ApiError } from '../../../../core/services/api-client.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { InputComponent } from '../../../../shared/ui/input/input.component';
import { PasswordInputComponent } from '../../../../shared/ui/password-input/password-input.component';

@Component({
  selector: 'bm-login',
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
    <div class="bm-login-page">
      <div class="bm-auth-header">
        <h2 class="bm-auth-title">Merchant Sign In</h2>
        <p class="bm-auth-desc">Enter your credentials to access your store portal</p>
      </div>

      @if (errorMessage()) {
        <div class="bm-alert-banner bm-alert-danger" role="alert">
          <span>{{ errorMessage() }}</span>
        </div>
      }

      <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="bm-form">
        <!-- Email or Phone Identifier -->
        <bm-input
          id="login-identifier"
          label="Email address or Phone number"
          placeholder="e.g. anoop@example.com"
          autocomplete="username"
          [required]="true"
          formControlName="identifier"
          [error]="getFieldError('identifier')"
        ></bm-input>

        <!-- Password -->
        <bm-password-input
          id="login-password"
          label="Password"
          placeholder="••••••••"
          autocomplete="current-password"
          [required]="true"
          formControlName="password"
          [error]="getFieldError('password')"
        ></bm-password-input>

        <!-- Form Options -->
        <div class="bm-form-options">
          <label class="bm-checkbox-label">
            <input type="checkbox" formControlName="rememberMe" />
            <span>Keep me signed in</span>
          </label>

          <a routerLink="/auth/forgot-password" class="bm-forgot-link">
            Forgot password?
          </a>
        </div>

        <!-- Submit Button -->
        <bm-button
          type="submit"
          variant="primary"
          size="lg"
          [fullWidth]="true"
          [loading]="authService.isLoading()"
          [disabled]="loginForm.invalid || authService.isLoading()"
        >
          Sign In to Store
        </bm-button>
      </form>

      <!-- Registration link -->
      <div class="bm-auth-footer-link">
        <span>Don't have a merchant account?</span>
        <a routerLink="/auth/register" class="bm-link-bold">Register your store</a>
      </div>
    </div>
  `,
  styles: [`
    .bm-login-page {
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

    .bm-form-options {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: var(--bm-font-size-xs);
    }

    .bm-checkbox-label {
      display: flex;
      align-items: center;
      gap: var(--bm-space-2);
      color: var(--bm-color-text-secondary);
      cursor: pointer;
      user-select: none;

      input[type="checkbox"] {
        accent-color: var(--bm-color-primary);
        width: 15px;
        height: 15px;
        cursor: pointer;
      }
    }

    .bm-forgot-link {
      font-size: var(--bm-font-size-xs);
      color: var(--bm-color-text-secondary);

      &:hover {
        color: var(--bm-color-primary);
      }
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
export class LoginPageComponent {
  private readonly fb = inject(FormBuilder);
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly errorMessage = signal<string | null>(null);

  readonly loginForm: FormGroup = this.fb.group({
    identifier: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rememberMe: [false],
  });

  getFieldError(fieldName: string): string | null {
    const control = this.loginForm.get(fieldName);
    if (!control || !control.touched || !control.errors) {
      return null;
    }

    if (control.errors['required']) {
      return fieldName === 'identifier'
        ? 'Email address or phone number is required'
        : 'Password is required';
    }
    if (control.errors['minlength']) {
      return `Must be at least ${control.errors['minlength'].requiredLength} characters`;
    }
    return null;
  }

  onSubmit(): void {
    if (this.loginForm.invalid || this.authService.isLoading()) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    const formValue = this.loginForm.value;

    this.authService
      .login({
        email: formValue.identifier.trim(),
        identifier: formValue.identifier.trim(),
        password: formValue.password,
      })
      .subscribe({
        next: (response) => {
          this.toast.success(`Welcome back, ${response.user.name}`);
          this.router.navigate(['/dashboard']);
        },
        error: (err: ApiError) => {
          if (err.code === 'EMAIL_VERIFICATION_REQUIRED') {
            this.errorMessage.set(
              'Your email has not been activated. Please check your inbox for the verification link.',
            );
          } else {
            this.errorMessage.set(err.message || 'Invalid email or password.');
          }
        },
      });
  }
}
