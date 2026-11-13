import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  QueryList,
  ViewChildren,
  forwardRef,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'bm-otp-input',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => OtpInputComponent),
      multi: true,
    },
  ],
  template: `
    <div
      class="bm-otp-container"
      [class.has-error]="hasError"
      [class.is-disabled]="disabled"
      role="group"
      aria-label="One-Time Password Input"
    >
      @for (d of digits(); track $index; let i = $index) {
        <input
          #digitInput
          type="text"
          inputmode="numeric"
          pattern="[0-9]*"
          maxlength="1"
          autocomplete="one-time-code"
          class="bm-otp-box"
          [class.is-filled]="digits()[i] !== ''"
          [disabled]="disabled"
          [value]="digits()[i]"
          [attr.aria-label]="'Digit ' + (i + 1)"
          (input)="handleInput($event, i)"
          (keydown)="handleKeydown($event, i)"
          (paste)="handlePaste($event)"
          (focus)="handleFocus(i)"
        />
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .bm-otp-container {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--bm-space-2);
      width: 100%;
      margin: var(--bm-space-2) 0;

      @media (min-width: 480px) {
        gap: var(--bm-space-3);
      }
    }

    .bm-otp-box {
      width: 44px;
      height: 52px;
      text-align: center;
      font-family: var(--bm-font-mono, monospace);
      font-size: 22px;
      font-weight: var(--bm-font-weight-semibold, 600);
      color: var(--bm-color-text-primary, #1E293B);
      background-color: var(--bm-color-surface, #FFFFFF);
      border: 1.5px solid var(--bm-color-border, #E5E7EB);
      border-radius: var(--bm-radius-md, 8px);
      outline: none;
      transition: all var(--bm-transition-fast, 150ms cubic-bezier(0.4, 0, 0.2, 1));
      box-shadow: var(--bm-shadow-xs, 0 1px 2px 0 rgba(0, 0, 0, 0.05));

      @media (min-width: 480px) {
        width: 50px;
        height: 56px;
        font-size: 24px;
      }

      &:focus {
        border-color: var(--bm-color-primary, #176B50);
        box-shadow: 0 0 0 3px var(--bm-color-primary-focus, rgba(23, 107, 80, 0.15));
        background-color: var(--bm-color-surface, #FFFFFF);
        transform: translateY(-1px);
      }

      &.is-filled {
        background-color: var(--bm-color-surface-subtle, #F8FAFC);
        border-color: #CBD5E1;
      }

      &:disabled {
        background-color: var(--bm-color-surface-subtle, #F1F5F9);
        color: var(--bm-color-text-muted, #94A3B8);
        cursor: not-allowed;
        opacity: 0.7;
      }
    }

    .bm-otp-container.has-error .bm-otp-box {
      border-color: var(--bm-color-danger, #DC2626);

      &:focus {
        box-shadow: 0 0 0 3px var(--bm-color-danger-focus, rgba(220, 38, 38, 0.15));
      }
    }
  `],
})
export class OtpInputComponent implements ControlValueAccessor, AfterViewInit {
  @Input() length: number = 6;
  @Input() disabled: boolean = false;
  @Input() hasError: boolean = false;
  @Input() autoFocus: boolean = true;

  @Output() otpChange = new EventEmitter<string>();
  @Output() otpComplete = new EventEmitter<string>();

  @ViewChildren('digitInput') digitInputs!: QueryList<ElementRef<HTMLInputElement>>;

  readonly digits = signal<string[]>(Array(6).fill(''));

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  ngAfterViewInit(): void {
    if (this.autoFocus) {
      setTimeout(() => this.focusFirstEmpty(), 50);
    }
  }

  writeValue(value: string | null): void {
    const val = value ? String(value).slice(0, this.length) : '';
    const newDigits = Array(this.length).fill('');
    for (let i = 0; i < val.length; i++) {
      newDigits[i] = val[i];
    }
    this.digits.set(newDigits);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  handleInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const rawVal = input.value;
    const cleanDigit = rawVal.replace(/\D/g, '').slice(-1);

    const current = [...this.digits()];
    current[index] = cleanDigit;
    this.digits.set(current);
    input.value = cleanDigit;

    this.notifyValueChange();

    if (cleanDigit && index < this.length - 1) {
      this.focusBox(index + 1);
    }
  }

  handleKeydown(event: KeyboardEvent, index: number): void {
    const current = this.digits();

    switch (event.key) {
      case 'Backspace':
        if (!current[index] && index > 0) {
          event.preventDefault();
          const next = [...current];
          next[index - 1] = '';
          this.digits.set(next);
          this.focusBox(index - 1);
          this.notifyValueChange();
        } else if (current[index]) {
          const next = [...current];
          next[index] = '';
          this.digits.set(next);
          this.notifyValueChange();
        }
        break;

      case 'ArrowLeft':
        if (index > 0) {
          event.preventDefault();
          this.focusBox(index - 1);
        }
        break;

      case 'ArrowRight':
        if (index < this.length - 1) {
          event.preventDefault();
          this.focusBox(index + 1);
        }
        break;
    }
  }

  handlePaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasteData = event.clipboardData?.getData('text') || '';
    const cleanDigits = pasteData.replace(/\D/g, '').slice(0, this.length);

    if (!cleanDigits) return;

    const current = Array(this.length).fill('');
    for (let i = 0; i < cleanDigits.length; i++) {
      current[i] = cleanDigits[i];
    }
    this.digits.set(current);
    this.notifyValueChange();

    // Focus either the last filled box or next empty box
    const nextIdx = Math.min(cleanDigits.length, this.length - 1);
    this.focusBox(nextIdx);
  }

  handleFocus(index: number): void {
    const el = this.digitInputs.toArray()[index]?.nativeElement;
    if (el) {
      el.select();
    }
  }

  focusFirstEmpty(): void {
    const arr = this.digits();
    const emptyIndex = arr.findIndex((d) => !d);
    const target = emptyIndex === -1 ? this.length - 1 : emptyIndex;
    this.focusBox(target);
  }

  reset(): void {
    this.digits.set(Array(this.length).fill(''));
    this.notifyValueChange();
    if (this.autoFocus) {
      this.focusBox(0);
    }
  }

  private focusBox(index: number): void {
    const inputs = this.digitInputs?.toArray();
    if (inputs && inputs[index]) {
      inputs[index].nativeElement.focus();
    }
  }

  private notifyValueChange(): void {
    const code = this.digits().join('');
    this.onChange(code);
    this.onTouched();
    this.otpChange.emit(code);

    if (code.length === this.length && !this.digits().includes('')) {
      this.otpComplete.emit(code);
    }
  }
}
