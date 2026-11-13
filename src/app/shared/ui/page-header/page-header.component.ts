import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';

export interface BreadcrumbItem {
  label: string;
  url?: string;
}

@Component({
  selector: 'bm-page-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="bm-page-header">
      <div class="bm-page-header-main">
        @if (breadcrumbs && breadcrumbs.length > 0) {
          <nav class="bm-breadcrumbs" aria-label="Breadcrumb">
            <ol>
              @for (item of breadcrumbs; track item.label; let last = $last) {
                <li>
                  @if (item.url && !last) {
                    <a [routerLink]="item.url">{{ item.label }}</a>
                  } @else {
                    <span [attr.aria-current]="last ? 'page' : null">{{ item.label }}</span>
                  }
                  @if (!last) {
                    <span class="bm-breadcrumb-separator" aria-hidden="true">/</span>
                  }
                </li>
              }
            </ol>
          </nav>
        }

        <div class="bm-title-group">
          <h1 class="bm-page-title">{{ title }}</h1>
          @if (subtitle) {
            <p class="bm-page-subtitle">{{ subtitle }}</p>
          }
        </div>
      </div>

      <div class="bm-page-header-actions">
        <ng-content select="[bmHeaderActions]"></ng-content>
      </div>
    </header>
  `,
  styles: [`
    .bm-page-header {
      display: flex;
      flex-direction: column;
      gap: var(--bm-space-3);
      margin-bottom: var(--bm-space-6);

      @media (min-width: 640px) {
        flex-direction: row;
        align-items: flex-end;
        justify-content: space-between;
      }
    }

    .bm-breadcrumbs {
      margin-bottom: var(--bm-space-2);

      ol {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: var(--bm-space-2);
        list-style: none;
        padding: 0;
        margin: 0;
      }

      li {
        display: flex;
        align-items: center;
        gap: var(--bm-space-2);
        font-size: var(--bm-font-size-xs);
        color: var(--bm-color-text-secondary);
      }

      a {
        color: var(--bm-color-text-secondary);
        text-decoration: none;

        &:hover {
          color: var(--bm-color-text-primary);
          text-decoration: underline;
        }
      }

      span[aria-current="page"] {
        color: var(--bm-color-text-primary);
        font-weight: var(--bm-font-weight-medium);
      }

      .bm-breadcrumb-separator {
        color: var(--bm-color-text-muted);
      }
    }

    .bm-page-title {
      font-size: var(--bm-font-size-2xl);
      font-weight: var(--bm-font-weight-semibold);
      color: var(--bm-color-text-primary);
      letter-spacing: -0.02em;
      margin: 0;
    }

    .bm-page-subtitle {
      font-size: var(--bm-font-size-sm);
      color: var(--bm-color-text-secondary);
      margin-top: 4px;
      margin-bottom: 0;
    }

    .bm-page-header-actions {
      display: flex;
      align-items: center;
      gap: var(--bm-space-3);
    }
  `],
})
export class PageHeaderComponent {
  @Input({ required: true }) title!: string;
  @Input() subtitle?: string;
  @Input() breadcrumbs?: BreadcrumbItem[];
}
