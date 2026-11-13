import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export type SkeletonVariant = 'text' | 'circular' | 'rectangular' | 'card' | 'table-row';

@Component({
  selector: 'bm-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    @switch (variant) {
      @case ('table-row') {
        <div class="bm-skeleton-table-rows" [class]="containerClass">
          @for (item of items; track $index) {
            <div class="bm-skeleton-table-row">
              @for (col of columnArray; track $index) {
                <div class="bm-skeleton-col" [style.flex]="$index === 0 ? '1.5' : '1'">
                  <div
                    class="bm-skeleton-shimmer"
                    [style.height]="height || '16px'"
                    [style.width]="$index === 0 ? '70%' : '50%'"
                    [style.border-radius]="borderRadius || '4px'"
                  ></div>
                </div>
              }
            </div>
          }
        </div>
      }

      @case ('card') {
        <div class="bm-skeleton-cards" [class]="containerClass">
          @for (item of items; track $index) {
            <div class="bm-skeleton-card">
              <div
                class="bm-skeleton-shimmer bm-skeleton-card-media"
                [style.height]="height || '140px'"
              ></div>
              <div class="bm-skeleton-card-body">
                <div
                  class="bm-skeleton-shimmer"
                  style="width: 75%; height: 18px; margin-bottom: 8px; border-radius: 4px;"
                ></div>
                <div
                  class="bm-skeleton-shimmer"
                  style="width: 50%; height: 14px; margin-bottom: 12px; border-radius: 4px;"
                ></div>
                <div
                  class="bm-skeleton-shimmer"
                  style="width: 90%; height: 12px; margin-bottom: 6px; border-radius: 4px;"
                ></div>
                <div
                  class="bm-skeleton-shimmer"
                  style="width: 60%; height: 12px; border-radius: 4px;"
                ></div>
              </div>
            </div>
          }
        </div>
      }

      @default {
        <div class="bm-skeleton-list" [class]="containerClass">
          @for (item of items; track $index) {
            <div
              class="bm-skeleton-shimmer"
              [class.bm-skeleton-circular]="variant === 'circular'"
              [class.bm-skeleton-rectangular]="variant === 'rectangular'"
              [class.bm-skeleton-text]="variant === 'text'"
              [style.width]="computedWidth"
              [style.height]="computedHeight"
              [style.border-radius]="computedBorderRadius"
            ></div>
          }
        </div>
      }
    }
  `,
  styles: [`
    @keyframes bm-skeleton-shimmer {
      0% {
        background-position: -200% 0;
      }
      100% {
        background-position: 200% 0;
      }
    }

    .bm-skeleton-shimmer {
      background: linear-gradient(
        90deg,
        #f1f5f9 25%,
        #e2e8f0 37%,
        #f1f5f9 63%
      );
      background-size: 400% 100%;
      animation: bm-skeleton-shimmer 1.4s ease infinite;
      display: block;
    }

    .bm-skeleton-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: 100%;
    }

    .bm-skeleton-circular {
      border-radius: 9999px;
      flex-shrink: 0;
    }

    .bm-skeleton-rectangular {
      border-radius: 8px;
    }

    .bm-skeleton-text {
      border-radius: 4px;
    }

    /* Table row skeleton */
    .bm-skeleton-table-rows {
      display: flex;
      flex-direction: column;
      width: 100%;
    }

    .bm-skeleton-table-row {
      display: flex;
      align-items: center;
      padding: 14px 16px;
      border-bottom: 1px solid var(--bm-color-border, #e2e8f0);
      gap: 16px;
    }

    .bm-skeleton-col {
      display: flex;
      align-items: center;
    }

    /* Card skeleton */
    .bm-skeleton-cards {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
      width: 100%;
    }

    .bm-skeleton-card {
      background: var(--bm-color-surface, #ffffff);
      border: 1px solid var(--bm-color-border, #e2e8f0);
      border-radius: var(--bm-radius-lg, 12px);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .bm-skeleton-card-media {
      width: 100%;
    }

    .bm-skeleton-card-body {
      padding: 16px;
      display: flex;
      flex-direction: column;
    }
  `],
})
export class SkeletonComponent {
  @Input() variant: SkeletonVariant = 'text';
  @Input() width?: string;
  @Input() height?: string;
  @Input() borderRadius?: string;
  @Input() count = 1;
  @Input() columns = 5;
  @Input() containerClass = '';

  get items(): number[] {
    const n = Math.max(1, this.count || 1);
    return Array.from({ length: n }, (_, i) => i);
  }

  get columnArray(): number[] {
    const cols = Math.max(1, this.columns || 5);
    return Array.from({ length: cols }, (_, i) => i);
  }

  get computedWidth(): string {
    if (this.width) return this.width;
    if (this.variant === 'circular') return '40px';
    return '100%';
  }

  get computedHeight(): string {
    if (this.height) return this.height;
    if (this.variant === 'circular') return '40px';
    if (this.variant === 'text') return '16px';
    if (this.variant === 'rectangular') return '80px';
    return '16px';
  }

  get computedBorderRadius(): string {
    if (this.borderRadius) return this.borderRadius;
    if (this.variant === 'circular') return '9999px';
    if (this.variant === 'rectangular') return '8px';
    return '4px';
  }
}
