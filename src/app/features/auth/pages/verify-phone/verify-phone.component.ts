import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, QueryList, ViewChildren, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LucideAngularModule, MessageSquare, Phone, RefreshCw } from 'lucide-angular';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { ApiError } from '../../../../core/services/api-client.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';

@Component({
  selector: 'bm-verify-phone',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, LucideAngularModule, ButtonComponent],
  template: `
    <div class="bm-verify-page">
      <div class="bm-auth-header">
        <div class="bm-verify-icon-wrap">
          <lucide-icon [img]="MessageSquareIcon" [size]="24"></lucide-icon>
        </div>
        <h2 class="bm-auth-title">Verify Your Phone</h2>
        <p class="bm-auth-desc">
          Enter the 6-digit WhatsApp verification code sent to
          <strong class="bm-phone-highlight">{{ displayPhone() }}</strong>
        </p>
      </div>

      @if (errorMessage()) {
        <div class="bm-alert-banner bm-alert-danger" role="alert">
          <span>{{ errorMessage() }}</span>
        </div>
      }

      <form [formGroup]="otpForm" (ngSubmit)="onSubmit()" class="bm-otp-form">
        <div class="bm-otp-inputs" (paste)="handlePaste($event)">
          @for (control of otpDigits.controls; track $index) {
            <input
              #otpInput
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
              maxlength="1"
              autocomplete="one-time-code"
              class="bm-otp-digit"
              [class.has-value]="control.value"
              [formControl]="$any(control)"
              (input)="handleDigitInput($event, $index)"
              (keydown)="handleKeyDown($event, $index)"
            />
          }
        </div>

        <bm-button
          type="submit"
          variant="primary"
          size="lg"
          [fullWidth]="true"
          [loading]="authService.isLoading()"
          [disabled]="isOtpIncomplete || authService.isLoading()"
        >
          Verify Phone Number
        </bm-button>
      </form>

      <!-- Resend OTP Action -->
      <div class="bm-resend-section">
        @if (cooldownSeconds() > 0) {
          <p class="bm-cooldown-text">
            Resend code in <strong>{{ cooldownSeconds() }}s</strong>
          </p>
        } @else {
          <button
            type="button"
            class="bm-resend-btn"
            (click)="handleResendOtp()"
            [disabled]="authService.isLoading()"
          >
            <lucide-icon [img]="RefreshIcon" [size]="14"></lucide-icon>
            <span>Resend WhatsApp OTP</span>
          </button>
        }
      </div>

      <!-- Footer navigation -->
      <div class="bm-auth-footer-link">
        <a routerLink="/auth/login" class="bm-link-secondary">Back to Sign In</a>
      </div>
    </div>
  `,
  styles: [`
    .bm-verify-page {
      display: flex;
      flex-direction: column;
      gap: var(--bm-space-6);
      text-align: center;
    }

    .bm-verify-icon-wrap {
      width: 48px;
      height: 48px;
      margin: 0 auto var(--bm-space-3);
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--bm-color-primary-soft);
      color: var(--bm-color-primary);
      border-radius: var(--bm-radius-full);
      border: 1px solid var(--bm-color-primary-border);
    }

    .bm-auth-title {
      font-size: var(--bm-font-size-xl);
      font-weight: var(--bm-font-weight-semibold);
      color: var(--bm-color-text-primary);
      margin: 0;
    }

    .bm-auth-desc {
      font-size: var(--bm-font-size-sm);
      color: var(--bm-color-text-secondary);
      margin-top: 6px;
      line-height: 1.5;
    }

    .bm-phone-highlight {
      color: var(--bm-color-text-primary);
      font-weight: var(--bm-font-weight-semibold);
      display: block;
      margin-top: 2px;
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

    .bm-otp-form {
      display: flex;
      flex-direction: column;
      gap: var(--bm-space-6);
    }

    .bm-otp-inputs {
      display: flex;
      justify-content: center;
      gap: var(--bm-space-2);

      @media (min-width: 400px) {
        gap: var(--bm-space-3);
      }
    }

    .bm-otp-digit {
      width: 44px;
      height: 52px;
      font-size: var(--bm-font-size-xl);
      font-weight: var(--bm-font-weight-bold);
      text-align: center;
      background-color: var(--bm-color-surface);
      border: 1px solid var(--bm-color-border);
      border-radius: var(--bm-radius-md);
      color: var(--bm-color-text-primary);
      outline: none;
      transition: all var(--bm-transition-fast);

      &:focus {
        border-color: var(--bm-color-primary);
        box-shadow: 0 0 0 3px var(--bm-color-primary-focus);
      }

      &.has-value {
        border-color: var(--bm-color-primary);
        background-color: var(--bm-color-primary-soft);
      }
    }

    .bm-resend-section {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--bm-font-size-xs);
    }

    .bm-cooldown-text {
      color: var(--bm-color-text-secondary);
      margin: 0;

      strong {
        color: var(--bm-color-text-primary);
      }
    }

    .bm-resend-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: transparent;
      border: none;
      color: var(--bm-color-primary);
      font-weight: var(--bm-font-weight-medium);
      cursor: pointer;
      font-size: var(--bm-font-size-xs);

      &:hover:not(:disabled) {
        text-decoration: underline;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .bm-auth-footer-link {
      padding-top: var(--bm-space-2);
      border-top: 1px solid var(--bm-color-border);
    }

    .bm-link-secondary {
      font-size: var(--bm-font-size-xs);
      color: var(--bm-color-text-secondary);

      &:hover {
        color: var(--bm-color-text-primary);
      }
    }
  `],
})
export class VerifyPhonePageComponent implements OnInit, OnDestroy {
  @ViewChildren('otpInput') otpInputs!: QueryList<ElementRef<HTMLInputElement>>;

  private readonly fb = inject(FormBuilder);
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly MessageSquareIcon = MessageSquare;
  readonly RefreshIcon = RefreshCw;
  readonly PhoneIcon = Phone;

  readonly errorMessage = signal<string | null>(null);
  readonly cooldownSeconds = signal<number>(60);
  private timerInterval?: ReturnType<typeof setInterval>;

  readonly otpForm: FormGroup = this.fb.group({
    digits: this.fb.array(
      Array(6)
        .fill('')
        .map(() => ['', [Validators.required, Validators.pattern(/^[0-9]$/)]]),
    ),
  });

  get otpDigits(): FormArray {
    return this.otpForm.get('digits') as FormArray;
  }

  get isOtpIncomplete(): boolean {
    return this.otpDigits.controls.some((c) => !c.value || !/^\d$/.test(c.value));
  }

  displayPhone(): string {
    const p = this.authService.pendingVerificationPhone() || this.authService.currentUser()?.phone;
    return p ? p : 'your registered mobile number';
  }

  ngOnInit(): void {
    this.startCooldownTimer();
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  startCooldownTimer(duration = 60): void {
    this.cooldownSeconds.set(duration);
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.cooldownSeconds.update((s) => {
        if (s <= 1) {
          clearInterval(this.timerInterval);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  handleDigitInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const val = input.value;

    if (val && /^\d$/.test(val)) {
      if (index < 5) {
        const nextInput = this.otpInputs.get(index + 1)?.nativeElement;
        nextInput?.focus();
      }
    }
  }

  handleKeyDown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace') {
      const current = this.otpDigits.at(index).value;
      if (!current && index > 0) {
        const prevInput = this.otpInputs.get(index - 1)?.nativeElement;
        prevInput?.focus();
      }
    }
  }

  handlePaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text') || '';
    const digitsOnly = pastedData.replace(/\D/g, '').slice(0, 6);

    for (let i = 0; i < digitsOnly.length; i++) {
      this.otpDigits.at(i).setValue(digitsOnly[i]);
    }

    const nextIndex = Math.min(digitsOnly.length, 5);
    this.otpInputs.get(nextIndex)?.nativeElement.focus();
  }

  handleResendOtp(): void {
    const phone = this.authService.pendingVerificationPhone() || this.authService.currentUser()?.phone;
    if (!phone) {
      this.errorMessage.set('Phone number not found. Please sign in or register again.');
      return;
    }

    this.errorMessage.set(null);
    this.authService.sendPhoneOtp(phone).subscribe({
      next: (res) => {
        this.startCooldownTimer(res.cooldownSeconds || 60);
        this.toast.info('New verification code sent via WhatsApp.');
      },
      error: (err: ApiError) => {
        this.errorMessage.set(err.message || 'Unable to resend OTP. Please wait a moment.');
      },
    });
  }

  onSubmit(): void {
    if (this.isOtpIncomplete || this.authService.isLoading()) {
      return;
    }

    const phone = this.authService.pendingVerificationPhone() || this.authService.currentUser()?.phone;
    if (!phone) {
      this.errorMessage.set('Phone number is missing. Please sign in or register again.');
      return;
    }

    const otpCode = this.otpDigits.controls.map((c) => c.value).join('');
    this.errorMessage.set(null);

    this.authService.verifyPhone(phone, otpCode).subscribe({
      next: () => {
        this.toast.success('Phone verified successfully!');
        if (this.authService.isAuthenticated()) {
          this.router.navigate(['/dashboard']);
        } else {
          this.router.navigate(['/auth/login']);
        }
      },
      error: (err: ApiError) => {
        this.errorMessage.set(err.message || 'Invalid or expired OTP code. Please try again.');
      },
    });
  }
}
