import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AlertCircle, CheckCircle2, Info, LucideAngularModule, TriangleAlert, X } from 'lucide-angular';
import { ToastMessage, ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'bm-toast-container',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="bm-toast-container" aria-live="polite" aria-atomic="true">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="bm-toast" [class]="'bm-toast-' + toast.type" role="status">
          <div class="bm-toast-icon">
            @switch (toast.type) {
              @case ('success') {
                <lucide-icon [img]="CheckCircleIcon" [size]="18"></lucide-icon>
              }
              @case ('warning') {
                <lucide-icon [img]="AlertTriangleIcon" [size]="18"></lucide-icon>
              }
              @case ('danger') {
                <lucide-icon [img]="AlertCircleIcon" [size]="18"></lucide-icon>
              }
              @default {
                <lucide-icon [img]="InfoIcon" [size]="18"></lucide-icon>
              }
            }
          </div>

          <div class="bm-toast-content">
            @if (toast.title) {
              <div class="bm-toast-title">{{ toast.title }}</div>
            }
            <div class="bm-toast-message">{{ toast.message }}</div>
          </div>

          <button
            type="button"
            class="bm-toast-close"
            (click)="dismiss(toast.id)"
            aria-label="Dismiss notification"
          >
            <lucide-icon [img]="CloseIcon" [size]="14"></lucide-icon>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .bm-toast-container {
      position: fixed;
      bottom: var(--bm-space-6);
      right: var(--bm-space-6);
      display: flex;
      flex-direction: column;
      gap: var(--bm-space-2);
      z-index: 9999;
      max-width: 420px;
      width: calc(100% - 32px);
      pointer-events: none;
    }

    .bm-toast {
      pointer-events: auto;
      display: flex;
      align-items: flex-start;
      gap: var(--bm-space-3);
      padding: var(--bm-space-3) var(--bm-space-4);
      background-color: var(--bm-color-surface);
      border: 1px solid var(--bm-color-border);
      border-radius: var(--bm-radius-md);
      box-shadow: var(--bm-shadow-md);
      animation: slideInUp 200ms ease-out;

      &.bm-toast-success {
        border-left: 4px solid var(--bm-color-success);
        .bm-toast-icon { color: var(--bm-color-success); }
      }

      &.bm-toast-warning {
        border-left: 4px solid var(--bm-color-warning);
        .bm-toast-icon { color: var(--bm-color-warning); }
      }

      &.bm-toast-danger {
        border-left: 4px solid var(--bm-color-danger);
        .bm-toast-icon { color: var(--bm-color-danger); }
      }

      &.bm-toast-info {
        border-left: 4px solid var(--bm-color-info);
        .bm-toast-icon { color: var(--bm-color-info); }
      }
    }

    .bm-toast-icon {
      flex-shrink: 0;
      margin-top: 1px;
    }

    .bm-toast-content {
      flex: 1;
    }

    .bm-toast-title {
      font-size: var(--bm-font-size-sm);
      font-weight: var(--bm-font-weight-medium);
      color: var(--bm-color-text-primary);
      margin-bottom: 2px;
    }

    .bm-toast-message {
      font-size: var(--bm-font-size-xs);
      color: var(--bm-color-text-secondary);
      line-height: 1.4;
    }

    .bm-toast-close {
      background: transparent;
      border: none;
      color: var(--bm-color-text-muted);
      cursor: pointer;
      padding: 2px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--bm-radius-sm);

      &:hover {
        color: var(--bm-color-text-primary);
        background-color: var(--bm-color-surface-subtle);
      }
    }

    @keyframes slideInUp {
      from {
        opacity: 0;
        transform: translateY(12px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `],
})
export class ToastContainerComponent {
  readonly toastService = inject(ToastService);

  readonly CheckCircleIcon = CheckCircle2;
  readonly AlertTriangleIcon = TriangleAlert;
  readonly AlertCircleIcon = AlertCircle;
  readonly InfoIcon = Info;
  readonly CloseIcon = X;

  dismiss(id: string): void {
    this.toastService.dismiss(id);
  }
}
