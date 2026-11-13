import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Info, KeyRound, LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'bm-forgot-password',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  template: `
    <div class="bm-forgot-page">
      <div class="bm-auth-header">
        <div class="bm-icon-wrap">
          <lucide-icon [img]="KeyIcon" [size]="24"></lucide-icon>
        </div>
        <h2 class="bm-auth-title">Password Recovery</h2>
        <p class="bm-auth-desc">Reset your BuyMass merchant administration credentials</p>
      </div>

      <div class="bm-notice-card">
        <div class="bm-notice-icon">
          <lucide-icon [img]="InfoIcon" [size]="18"></lucide-icon>
        </div>
        <div class="bm-notice-text">
          <strong>Security Notice</strong>
          <p>
            Merchant account password resets require verified ownership verification.
            Please contact BuyMass Merchant Support or your assigned territory coordinator
            to initiate an authenticated credential reset.
          </p>
        </div>
      </div>

      <div class="bm-auth-footer-link">
        <a routerLink="/auth/login" class="bm-link-bold">Return to Sign In</a>
      </div>
    </div>
  `,
  styles: [`
    .bm-forgot-page {
      display: flex;
      flex-direction: column;
      gap: var(--bm-space-6);
      text-align: center;
    }

    .bm-icon-wrap {
      width: 48px;
      height: 48px;
      margin: 0 auto var(--bm-space-3);
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--bm-color-surface-subtle);
      color: var(--bm-color-text-primary);
      border-radius: var(--bm-radius-full);
      border: 1px solid var(--bm-color-border);
    }

    .bm-auth-title {
      font-size: var(--bm-font-size-xl);
      font-weight: var(--bm-font-weight-semibold);
      color: var(--bm-color-text-primary);
      margin: 0;
    }

    .bm-auth-desc {
      font-size: var(--bm-font-size-sm);
      color: var(--bm-color-text-secondary);
      margin-top: 4px;
    }

    .bm-notice-card {
      display: flex;
      gap: var(--bm-space-3);
      padding: var(--bm-space-4);
      background-color: var(--bm-color-info-bg);
      border: 1px solid var(--bm-color-info-border);
      border-radius: var(--bm-radius-md);
      text-align: left;
    }

    .bm-notice-icon {
      color: var(--bm-color-info);
      flex-shrink: 0;
      margin-top: 2px;
    }

    .bm-notice-text {
      font-size: var(--bm-font-size-xs);
      color: var(--bm-color-text-primary);
      line-height: 1.5;

      strong {
        display: block;
        margin-bottom: 2px;
        color: var(--bm-color-info);
      }

      p {
        margin: 0;
        color: var(--bm-color-text-secondary);
      }
    }

    .bm-auth-footer-link {
      padding-top: var(--bm-space-2);
      border-top: 1px solid var(--bm-color-border);
    }

    .bm-link-bold {
      font-weight: var(--bm-font-weight-medium);
      color: var(--bm-color-primary);
      font-size: var(--bm-font-size-xs);
    }
  `],
})
export class ForgotPasswordPageComponent {
  readonly KeyIcon = KeyRound;
  readonly InfoIcon = Info;
}
