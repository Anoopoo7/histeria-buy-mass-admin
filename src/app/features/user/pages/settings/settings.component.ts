import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Bell, KeyRound, LucideAngularModule, ShieldCheck, Store, User } from 'lucide-angular';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { BadgeComponent } from '../../../../shared/ui/badge/badge.component';
import { CardComponent } from '../../../../shared/ui/card/card.component';
import { PageHeaderComponent } from '../../../../shared/ui/page-header/page-header.component';

@Component({
  selector: 'bm-settings',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, PageHeaderComponent, CardComponent, BadgeComponent],
  template: `
    <div class="bm-settings-page">
      <bm-page-header
        title="Settings & Preferences"
        subtitle="Configure store administration preferences and security controls"
        [breadcrumbs]="[
          { label: 'Dashboard', url: '/dashboard' },
          { label: 'Settings' }
        ]"
      ></bm-page-header>

      <div class="bm-settings-sections">
        <!-- Account Details -->
        <bm-card title="Account Credentials">
          <div class="bm-setting-row">
            <div class="bm-setting-info">
              <div class="bm-setting-title">
                <lucide-icon [img]="UserIcon" [size]="18"></lucide-icon>
                <span>Primary Account</span>
              </div>
              <p class="bm-setting-desc">Signed in as {{ authService.currentUser()?.email }}</p>
            </div>
            <bm-badge variant="success" size="sm">Active Session</bm-badge>
          </div>
        </bm-card>

        <!-- Security -->
        <bm-card title="Security & Authentication">
          <div class="bm-setting-row">
            <div class="bm-setting-info">
              <div class="bm-setting-title">
                <lucide-icon [img]="KeyIcon" [size]="18"></lucide-icon>
                <span>Multi-Factor Authentication</span>
              </div>
              <p class="bm-setting-desc">WhatsApp 6-digit OTP verification for store pickup releases & logins</p>
            </div>
            <bm-badge
              [variant]="authService.currentUser()?.isPhoneVerified ? 'success' : 'warning'"
              size="sm"
            >
              {{ authService.currentUser()?.isPhoneVerified ? 'Protected' : 'Pending Verification' }}
            </bm-badge>
          </div>
        </bm-card>

        <!-- Notification Preferences -->
        <bm-card title="Notification Preferences">
          <div class="bm-setting-row">
            <div class="bm-setting-info">
              <div class="bm-setting-title">
                <lucide-icon [img]="BellIcon" [size]="18"></lucide-icon>
                <span>Order & Pool Alerts</span>
              </div>
              <p class="bm-setting-desc">WhatsApp automated dispatch via Flourimus integration for pool fulfillment</p>
            </div>
            <bm-badge variant="neutral" size="sm">System Default</bm-badge>
          </div>
        </bm-card>

        <!-- Store Account Information -->
        <bm-card title="Storefront Association">
          <div class="bm-setting-row">
            <div class="bm-setting-info">
              <div class="bm-setting-title">
                <lucide-icon [img]="StoreIcon" [size]="18"></lucide-icon>
                <span>Merchant Application</span>
              </div>
              <p class="bm-setting-desc">
                Store Status: {{ authService.currentMerchant()?.status || 'No application submitted yet' }}
              </p>
            </div>
            <bm-badge
              [variant]="authService.currentMerchant()?.status === 'APPROVED' ? 'success' : 'warning'"
              size="sm"
            >
              {{ authService.currentMerchant()?.status || 'Unregistered' }}
            </bm-badge>
          </div>
        </bm-card>
      </div>
    </div>
  `,
  styles: [`
    .bm-settings-page {
      display: flex;
      flex-direction: column;
      gap: var(--bm-space-6);
    }

    .bm-settings-sections {
      display: flex;
      flex-direction: column;
      gap: var(--bm-space-5);
    }

    .bm-setting-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--bm-space-4);
    }

    .bm-setting-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .bm-setting-title {
      display: flex;
      align-items: center;
      gap: var(--bm-space-2);
      font-size: var(--bm-font-size-sm);
      font-weight: var(--bm-font-weight-medium);
      color: var(--bm-color-text-primary);
    }

    .bm-setting-desc {
      font-size: var(--bm-font-size-xs);
      color: var(--bm-color-text-secondary);
      margin: 0;
    }
  `],
})
export class SettingsPageComponent {
  readonly authService = inject(AuthService);

  readonly UserIcon = User;
  readonly KeyIcon = KeyRound;
  readonly BellIcon = Bell;
  readonly StoreIcon = Store;
  readonly ShieldCheckIcon = ShieldCheck;
}
