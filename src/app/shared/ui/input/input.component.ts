import { CommonModule } from '@angular/common';
import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'bm-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
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
        <ng-content select="[bmLeading]"></ng-content>

        <input
          [id]="id"
          [type]="type"
          [placeholder]="placeholder"
          [disabled]="disabled"
          [value]="value"
          [attr.autocomplete]="autocomplete"
          [attr.aria-invalid]="!!error"
          [attr.aria-describedby]="error ? id + '-error' : hint ? id + '-hint' : null"
          (input)="handleInput($event)"
          (blur)="handleBlur()"
        />

        <ng-content select="[bmTrailing]"></ng-content>
      </div>

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
export class InputComponent implements ControlValueAccessor {
  @Input() id = `bm-input-${Math.random().toString(36).substring(2, 9)}`;
  @Input() label?: string;
  @Input() type = 'text';
  @Input() placeholder = '';
  @Input() required = false;
  @Input() disabled = false;
  @Input() error?: string | null;
  @Input() hint?: string;
  @Input() autocomplete = 'off';

  value = '';

  onChange: (value: string) => void = () => {};
  onTouched: () => void = () => {};

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
