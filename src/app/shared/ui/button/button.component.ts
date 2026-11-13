import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'bm-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [type]="type"
      [disabled]="disabled || loading"
      [class]="buttonClasses"
      (click)="handleClick($event)"
      [attr.aria-busy]="loading"
    >
      @if (loading) {
        <svg class="bm-btn-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-dasharray="32" stroke-linecap="round"/>
        </svg>
      }
      <ng-content select="[bmLeading]"></ng-content>
      <span class="bm-btn-content">
        <ng-content></ng-content>
      </span>
      <ng-content select="[bmTrailing]"></ng-content>
    </button>
  `,
  styles: [`
    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--bm-space-2);
      font-weight: var(--bm-font-weight-medium);
      font-family: inherit;
      border-radius: var(--bm-radius-md);
      border: 1px solid transparent;
      cursor: pointer;
      transition: all var(--bm-transition-fast);
      white-space: nowrap;
      text-decoration: none;
      position: relative;

      &:focus-visible {
        outline: none;
        box-shadow: 0 0 0 3px var(--bm-color-primary-focus);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    // Sizes
    .bm-btn-sm {
      height: 32px;
      padding: 0 var(--bm-space-3);
      font-size: var(--bm-font-size-xs);
    }

    .bm-btn-md {
      height: 38px;
      padding: 0 var(--bm-space-4);
      font-size: var(--bm-font-size-sm);
    }

    .bm-btn-lg {
      height: 44px;
      padding: 0 var(--bm-space-5);
      font-size: var(--bm-font-size-base);
    }

    .bm-btn-full {
      width: 100%;
    }

    // Variants
    .bm-btn-primary {
      background-color: var(--bm-color-primary);
      color: #FFFFFF;

      &:hover:not(:disabled) {
        background-color: var(--bm-color-primary-hover);
      }
    }

    .bm-btn-secondary {
      background-color: var(--bm-color-surface-subtle);
      color: var(--bm-color-text-primary);
      border-color: var(--bm-color-border);

      &:hover:not(:disabled) {
        background-color: #E2E8F0;
      }
    }

    .bm-btn-outline {
      background-color: transparent;
      color: var(--bm-color-text-primary);
      border-color: var(--bm-color-border);

      &:hover:not(:disabled) {
        background-color: var(--bm-color-surface-subtle);
        border-color: var(--bm-color-border-hover);
      }
    }

    .bm-btn-ghost {
      background-color: transparent;
      color: var(--bm-color-text-secondary);

      &:hover:not(:disabled) {
        background-color: var(--bm-color-surface-subtle);
        color: var(--bm-color-text-primary);
      }
    }

    .bm-btn-danger {
      background-color: var(--bm-color-danger);
      color: #FFFFFF;

      &:hover:not(:disabled) {
        background-color: #B91C1C;
      }
    }

    .bm-btn-spinner {
      width: 16px;
      height: 16px;
      animation: spin 0.75s linear infinite;
    }

    @keyframes spin {
      100% { transform: rotate(360deg); }
    }
  `],
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() fullWidth = false;
  @Input() disabled = false;
  @Input() loading = false;
  @Output() btnClick = new EventEmitter<MouseEvent>();

  get buttonClasses(): string {
    return [
      `bm-btn-${this.variant}`,
      `bm-btn-${this.size}`,
      this.fullWidth ? 'bm-btn-full' : '',
    ].filter(Boolean).join(' ');
  }

  handleClick(event: MouseEvent): void {
    if (!this.disabled && !this.loading) {
      this.btnClick.emit(event);
    }
  }
}
