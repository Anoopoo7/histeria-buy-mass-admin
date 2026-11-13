import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, ShieldCheck, ShoppingBag, Store } from 'lucide-angular';

@Component({
  selector: 'bm-auth-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  template: `
    <div class="bm-auth-page">
      <div class="bm-auth-container">
        <!-- Brand Header -->
        <header class="bm-auth-brand">
          <div class="bm-brand-logo">
            <lucide-icon [img]="StoreIcon" [size]="24" class="bm-brand-icon"></lucide-icon>
            <div class="bm-brand-text">
              <span class="bm-brand-name">BuyMass</span>
              <span class="bm-brand-badge">Store Admin</span>
            </div>
          </div>
          <p class="bm-brand-tagline">Merchant portal for Kerala-first community group buying</p>
        </header>

        <!-- Main Auth Form Card -->
        <main class="bm-auth-card">
          <router-outlet></router-outlet>
        </main>

        <!-- Footer / Trust Signals -->
        <footer class="bm-auth-footer">
          <div class="bm-trust-signal">
            <lucide-icon [img]="ShieldCheckIcon" [size]="14"></lucide-icon>
            <span>Verified Merchant Security & OTP Protection</span>
          </div>
          <div class="bm-copyright">
            &copy; {{ currentYear }} BuyMass Technologies. All rights reserved.
          </div>
        </footer>
      </div>
    </div>
  `,
  styles: [`
    .bm-auth-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--bm-color-bg);
      padding: var(--bm-space-6) var(--bm-space-4);
    }

    .bm-auth-container {
      width: 100%;
      max-width: 440px;
      display: flex;
      flex-direction: column;
      gap: var(--bm-space-6);
    }

    .bm-auth-brand {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--bm-space-2);
    }

    .bm-brand-logo {
      display: inline-flex;
      align-items: center;
      gap: var(--bm-space-3);
      padding: 6px 12px;
      background-color: var(--bm-color-surface);
      border: 1px solid var(--bm-color-border);
      border-radius: var(--bm-radius-lg);
      box-shadow: var(--bm-shadow-xs);
    }

    .bm-brand-icon {
      color: var(--bm-color-primary);
    }

    .bm-brand-text {
      display: flex;
      align-items: baseline;
      gap: 6px;
    }

    .bm-brand-name {
      font-size: var(--bm-font-size-lg);
      font-weight: var(--bm-font-weight-bold);
      color: var(--bm-color-text-primary);
      letter-spacing: -0.02em;
    }

    .bm-brand-badge {
      font-size: 11px;
      font-weight: var(--bm-font-weight-semibold);
      color: var(--bm-color-primary);
      background-color: var(--bm-color-primary-soft);
      padding: 1px 6px;
      border-radius: var(--bm-radius-sm);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .bm-brand-tagline {
      font-size: var(--bm-font-size-xs);
      color: var(--bm-color-text-secondary);
      margin: 0;
    }

    .bm-auth-card {
      background-color: var(--bm-color-surface);
      border: 1px solid var(--bm-color-border);
      border-radius: var(--bm-radius-xl);
      box-shadow: var(--bm-shadow-sm);
      padding: var(--bm-space-8) var(--bm-space-6);

      @media (min-width: 640px) {
        padding: var(--bm-space-8);
      }
    }

    .bm-auth-footer {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--bm-space-2);
      text-align: center;
    }

    .bm-trust-signal {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: var(--bm-font-size-xs);
      color: var(--bm-color-text-secondary);
    }

    .bm-copyright {
      font-size: 11px;
      color: var(--bm-color-text-muted);
    }
  `],
})
export class AuthLayoutComponent {
  readonly StoreIcon = Store;
  readonly ShieldCheckIcon = ShieldCheck;
  readonly ShoppingBagIcon = ShoppingBag;
  readonly currentYear = new Date().getFullYear();
}
