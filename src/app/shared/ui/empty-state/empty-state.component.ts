import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'bm-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bm-empty-state">
      <div class="bm-empty-icon">
        <ng-content select="[bmEmptyIcon]"></ng-content>
      </div>
      <h4 class="bm-empty-title">{{ title }}</h4>
      @if (description) {
        <p class="bm-empty-description">{{ description }}</p>
      }
      <div class="bm-empty-action">
        <ng-content select="[bmEmptyAction]"></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .bm-empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: var(--bm-space-8) var(--bm-space-4);
      background-color: var(--bm-color-surface);
      border-radius: var(--bm-radius-lg);
    }

    .bm-empty-icon {
      color: var(--bm-color-text-muted);
      margin-bottom: var(--bm-space-3);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .bm-empty-title {
      font-size: var(--bm-font-size-md);
      font-weight: var(--bm-font-weight-medium);
      color: var(--bm-color-text-primary);
      margin: 0;
    }

    .bm-empty-description {
      font-size: var(--bm-font-size-sm);
      color: var(--bm-color-text-secondary);
      max-width: 420px;
      margin: var(--bm-space-2) 0 0 0;
    }

    .bm-empty-action {
      margin-top: var(--bm-space-4);
    }
  `],
})
export class EmptyStateComponent {
  @Input({ required: true }) title!: string;
  @Input() description?: string;
}
