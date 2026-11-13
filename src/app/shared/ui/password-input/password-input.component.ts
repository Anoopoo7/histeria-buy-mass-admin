import { CommonModule } from '@angular/common';
import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { Eye, EyeOff, LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'bm-password-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PasswordInputComponent),
      multi: true,
    },
  ],
  template: `
    <div class="bm-form-field" [class.has-error]="!!error">
      @if (label) {
        <label [for]="id" class="bm-label">
          {{ label }}
          @if (required) {
            <span class="bm-required-dot" aria-hidden="true">*</span>
          }
        </label>
      }

      <div class="bm-input-wrapper">
        <input
          [id]="id"
          [type]="showPassword ? 'text' : 'password'"
          [placeholder]="placeholder"
          [disabled]="disabled"
          [value]="value"
          [attr.autocomplete]="autocomplete"
          [attr.aria-invalid]="!!error"
          [attr.aria-describedby]="error ? id + '-error' : hint ? id + '-hint' : null"
          (input)="handleInput($event)"
          (blur)="handleBlur()"
        />

        <button
          type="button"
          class="bm-visibility-toggle"
          (click)="toggleVisibility()"
          [attr.aria-label]="showPassword ? 'Hide password' : 'Show password'"
          tabindex="-1"
        >
          <lucide-icon [img]="showPassword ? EyeOffIcon : EyeIcon" [size]="16"></lucide-icon>
        </button>
      </div>

      @if (showStrength && value.length > 0) {
        <div class="bm-strength-container" aria-live="polite">
          <div class="bm-strength-bar">
            <div
              class="bm-strength-fill"
              [style.width.%]="strengthScore * 33.33"
              [class.strength-weak]="strengthScore <= 1"
              [class.strength-medium]="strengthScore === 2"
              [class.strength-strong]="strengthScore === 3"
            ></div>
          </div>
          <div class="bm-strength-hints">
            <span [class.hint-met]="hasLength">8+ characters</span>
            <span [class.hint-met]="hasLetter">Letters</span>
            <span [class.hint-met]="hasNumber">Numbers</span>
          </div>
        </div>
      }

      @if (error) {
        <p [id]="id + '-error'" class="bm-error-message" role="alert">
          {{ error }}
        </p>
      } @else if (hint) {
        <p [id]="id + '-hint'" class="bm-hint-message">
          {{ hint }}
        </p>
      }
    </div>
  `,
  styles: [`
    .bm-form-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
      width: 100%;
    }

    .bm-label {
      font-size: var(--bm-font-size-sm);
      font-weight: var(--bm-font-weight-medium);
      color: var(--bm-color-text-primary);
      display: flex;
      align-items: center;
      gap: 2px;
    }

    .bm-required-dot {
      color: var(--bm-color-danger);
    }

    .bm-input-wrapper {
      display: flex;
      align-items: center;
      background-color: var(--bm-color-surface);
      border: 1px solid var(--bm-color-border);
      border-radius: var(--bm-radius-md);
      transition: all var(--bm-transition-fast);
      overflow: hidden;

      &:focus-within {
        border-color: var(--bm-color-primary);
        box-shadow: 0 0 0 3px var(--bm-color-primary-focus);
      }
    }

    input {
      flex: 1;
      height: 38px;
      padding: 0 var(--bm-space-3);
      border: none;
      background: transparent;
      color: var(--bm-color-text-primary);
      font-size: var(--bm-font-size-sm);
      outline: none;

      &::placeholder {
        color: var(--bm-color-text-muted);
      }

      &:disabled {
        background-color: var(--bm-color-surface-subtle);
        cursor: not-allowed;
      }
    }

    .bm-visibility-toggle {
      background: transparent;
      border: none;
      padding: 0 var(--bm-space-3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--bm-color-text-secondary);
      cursor: pointer;
      height: 100%;

      &:hover {
        color: var(--bm-color-text-primary);
      }
    }

    .bm-strength-container {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-top: 2px;
    }

    .bm-strength-bar {
      height: 4px;
      background-color: var(--bm-color-border);
      border-radius: var(--bm-radius-full);
      overflow: hidden;
    }

    .bm-strength-fill {
      height: 100%;
      transition: width var(--bm-transition-normal), background-color var(--bm-transition-normal);

      &.strength-weak { background-color: var(--bm-color-danger); }
      &.strength-medium { background-color: var(--bm-color-warning); }
      &.strength-strong { background-color: var(--bm-color-success); }
    }

    .bm-strength-hints {
      display: flex;
      gap: var(--bm-space-3);
      font-size: 11px;
      color: var(--bm-color-text-muted);

      .hint-met {
        color: var(--bm-color-success);
        font-weight: var(--bm-font-weight-medium);
      }
    }

    .has-error .bm-input-wrapper {
      border-color: var(--bm-color-danger);

      &:focus-within {
        box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.15);
      }
    }

    .bm-error-message {
      font-size: var(--bm-font-size-xs);
      color: var(--bm-color-danger);
      margin: 0;
    }

    .bm-hint-message {
      font-size: var(--bm-font-size-xs);
      color: var(--bm-color-text-secondary);
      margin: 0;
    }
  `],
})
export class PasswordInputComponent implements ControlValueAccessor {
  readonly EyeIcon = Eye;
  readonly EyeOffIcon = EyeOff;

  @Input() id = `bm-pwd-${Math.random().toString(36).substring(2, 9)}`;
  @Input() label?: string;
  @Input() placeholder = '••••••••';
  @Input() required = false;
  @Input() disabled = false;
  @Input() error?: string | null;
  @Input() hint?: string;
  @Input() autocomplete = 'current-password';
  @Input() showStrength = false;

  showPassword = false;
  value = '';

  onChange: (value: string) => void = () => {};
  onTouched: () => void = () => {};

  get hasLength(): boolean {
    return this.value.length >= 8;
  }

  get hasLetter(): boolean {
    return /[A-Za-z]/.test(this.value);
  }

  get hasNumber(): boolean {
    return /\d/.test(this.value);
  }

  get strengthScore(): number {
    let score = 0;
    if (this.hasLength) score++;
    if (this.hasLetter) score++;
    if (this.hasNumber) score++;
    return score;
  }

  toggleVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  writeValue(val: unknown): void {
    this.value = val ? String(val) : '';
  }

  registerOnChange(fn: (val: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  handleInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.onChange(this.value);
  }

  handleBlur(): void {
    this.onTouched();
  }
}
