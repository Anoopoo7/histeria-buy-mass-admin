import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';
export type BadgeSize = 'sm' | 'md';

@Component({
  selector: 'bm-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [class]="badgeClasses">
      @if (dot) {
        <span class="bm-badge-dot" aria-hidden="true"></span>
      }
      <ng-content></ng-content>
    </span>
  `,
  styles: [`
    span {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-weight: var(--bm-font-weight-medium);
      border-radius: var(--bm-radius-full);
      white-space: nowrap;
      border: 1px solid transparent;
      line-height: 1;
    }

    .bm-badge-sm {
      font-size: 11px;
      padding: 3px 8px;
    }

    .bm-badge-md {
      font-size: var(--bm-font-size-xs);
      padding: 4px 10px;
    }

    .bm-badge-dot {
      width: 6px;
      height: 6px;
      border-radius: var(--bm-radius-full);
      background-color: currentColor;
    }

    .bm-badge-success {
      background-color: var(--bm-color-success-bg);
      color: var(--bm-color-success);
      border-color: var(--bm-color-success-border);
    }

    .bm-badge-warning {
      background-color: var(--bm-color-warning-bg);
      color: var(--bm-color-warning);
      border-color: var(--bm-color-warning-border);
    }

    .bm-badge-danger {
      background-color: var(--bm-color-danger-bg);
      color: var(--bm-color-danger);
      border-color: var(--bm-color-danger-border);
    }

    .bm-badge-info {
      background-color: var(--bm-color-info-bg);
      color: var(--bm-color-info);
      border-color: var(--bm-color-info-border);
    }

    .bm-badge-neutral {
      background-color: var(--bm-color-surface-subtle);
      color: var(--bm-color-text-secondary);
      border-color: var(--bm-color-border);
    }
  `],
})
export class BadgeComponent {
  @Input() variant: BadgeVariant = 'neutral';
  @Input() size: BadgeSize = 'sm';
  @Input() dot = false;

  get badgeClasses(): string {
    return `bm-badge-${this.variant} bm-badge-${this.size}`;
  }
}
