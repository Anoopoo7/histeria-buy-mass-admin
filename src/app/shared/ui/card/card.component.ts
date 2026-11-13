import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'bm-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bm-card" [class.bm-card-padded]="padded">
      @if (title || subtitle) {
        <div class="bm-card-header">
          <div>
            @if (title) {
              <h3 class="bm-card-title">{{ title }}</h3>
            }
            @if (subtitle) {
              <p class="bm-card-subtitle">{{ subtitle }}</p>
            }
          </div>
          <ng-content select="[bmCardAction]"></ng-content>
        </div>
      }

      <div class="bm-card-body">
        <ng-content></ng-content>
      </div>

      <ng-content select="[bmCardFooter]"></ng-content>
    </div>
  `,
  styles: [`
    .bm-card {
      background-color: var(--bm-color-surface);
      border: 1px solid var(--bm-color-border);
      border-radius: var(--bm-radius-lg);
      box-shadow: var(--bm-shadow-xs);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .bm-card-padded .bm-card-body {
      padding: var(--bm-space-5);
    }

    .bm-card-header {
      padding: var(--bm-space-4) var(--bm-space-5);
      border-bottom: 1px solid var(--bm-color-border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--bm-space-4);
    }

    .bm-card-title {
      font-size: var(--bm-font-size-md);
      font-weight: var(--bm-font-weight-medium);
      color: var(--bm-color-text-primary);
      margin: 0;
    }

    .bm-card-subtitle {
      font-size: var(--bm-font-size-xs);
      color: var(--bm-color-text-secondary);
      margin-top: 2px;
      margin-bottom: 0;
    }

    .bm-card-body {
      flex: 1;
    }
  `],
})
export class CardComponent {
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() padded = true;
}
