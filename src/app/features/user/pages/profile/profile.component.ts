import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { CheckCircle2, LucideAngularModule, Mail, Phone, Shield, User, XCircle } from 'lucide-angular';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { AvatarComponent } from '../../../../shared/ui/avatar/avatar.component';
import { BadgeComponent } from '../../../../shared/ui/badge/badge.component';
import { CardComponent } from '../../../../shared/ui/card/card.component';
import { PageHeaderComponent } from '../../../../shared/ui/page-header/page-header.component';

@Component({
  selector: 'bm-profile',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    PageHeaderComponent,
    CardComponent,
    BadgeComponent,
    AvatarComponent,
  ],
  template: `
    <div class="bm-profile-page">
      <bm-page-header
        title="User Account & Profile"
        subtitle="Verified merchant operator details and security status"
        [breadcrumbs]="[
          { label: 'Dashboard', url: '/dashboard' },
          { label: 'Settings', url: '/settings' },
          { label: 'Profile' }
        ]"
      ></bm-page-header>

      <div class="bm-profile-grid">
        <!-- Identity Overview Card -->
        <bm-card title="Merchant Operator Details">
          <div class="bm-profile-hero">
            <bm-avatar [name]="userName()" size="lg"></bm-avatar>
            <div class="bm-hero-info">
              <h2 class="bm-hero-name">{{ userName() }}</h2>
              <div class="bm-hero-badges">
                <bm-badge variant="info" size="sm">
                  {{ userRoleLabel() }}
                </bm-badge>
                <bm-badge
                  [variant]="user()?.isEmailVerified ? 'success' : 'warning'"
                  size="sm"
                  [dot]="true"
                >
                  {{ user()?.isEmailVerified ? 'Email Verified' : 'Email Unverified' }}
                </bm-badge>
                <bm-badge
                  [variant]="user()?.isPhoneVerified ? 'success' : 'warning'"
                  size="sm"
                  [dot]="true"
                >
                  {{ user()?.isPhoneVerified ? 'Phone Verified' : 'Phone Unverified' }}
                </bm-badge>
              </div>
            </div>
          </div>

          <div class="bm-details-list">
            <div class="bm-detail-row">
              <div class="bm-detail-key">
                <lucide-icon [img]="MailIcon" [size]="16"></lucide-icon>
                <span>Email Address</span>
              </div>
              <div class="bm-detail-val">
                <span>{{ user()?.email || 'N/A' }}</span>
                @if (user()?.isEmailVerified) {
                  <lucide-icon [img]="CheckCircleIcon" [size]="16" class="text-success"></lucide-icon>
                } @else {
                  <lucide-icon [img]="XCircleIcon" [size]="16" class="text-warning"></lucide-icon>
                }
              </div>
            </div>

            <div class="bm-detail-row">
              <div class="bm-detail-key">
                <lucide-icon [img]="PhoneIcon" [size]="16"></lucide-icon>
                <span>WhatsApp Phone</span>
              </div>
              <div class="bm-detail-val">
                <span>{{ user()?.phone || 'Not linked' }}</span>
                @if (user()?.isPhoneVerified) {
                  <lucide-icon [img]="CheckCircleIcon" [size]="16" class="text-success"></lucide-icon>
                } @else {
                  <lucide-icon [img]="XCircleIcon" [size]="16" class="text-warning"></lucide-icon>
                }
              </div>
            </div>

            <div class="bm-detail-row">
              <div class="bm-detail-key">
                <lucide-icon [img]="ShieldIcon" [size]="16"></lucide-icon>
                <span>Security Role</span>
              </div>
              <div class="bm-detail-val">
                <span class="bm-mono-code">{{ user()?.role }}</span>
              </div>
            </div>

            <div class="bm-detail-row">
              <div class="bm-detail-key">
                <lucide-icon [img]="UserIcon" [size]="16"></lucide-icon>
                <span>Account ID</span>
              </div>
              <div class="bm-detail-val">
                <span class="bm-mono-code">{{ user()?.id }}</span>
              </div>
            </div>
          </div>
        </bm-card>

        <!-- Profile Edit / Backend Note -->
        <bm-card title="Profile Modification Status">
          <div class="bm-info-notice">
            <p>
              Profile updates (changing name, email, or verified phone) are handled via backend administration
              to maintain compliance with store KYC and group-buying financial escrow.
            </p>
            <div class="bm-status-pill">
              <span class="bm-status-dot"></span>
              <span>Direct Profile Mutation API: Not Supported in Current Backend Contract</span>
            </div>
          </div>
        </bm-card>
      </div>
    </div>
  `,
  styles: [`
    .bm-profile-page {
      display: flex;
      flex-direction: column;
      gap: var(--bm-space-6);
    }

    .bm-profile-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--bm-space-6);

      @media (min-width: 1024px) {
        grid-template-columns: 2fr 1fr;
      }
    }

    .bm-profile-hero {
      display: flex;
      align-items: center;
      gap: var(--bm-space-4);
      padding-bottom: var(--bm-space-5);
      border-bottom: 1px solid var(--bm-color-border);
      margin-bottom: var(--bm-space-5);
    }

    .bm-hero-info {
      display: flex;
      flex-direction: column;
      gap: var(--bm-space-2);
    }

    .bm-hero-name {
      font-size: var(--bm-font-size-xl);
      font-weight: var(--bm-font-weight-semibold);
      color: var(--bm-color-text-primary);
      margin: 0;
    }

    .bm-hero-badges {
      display: flex;
      flex-wrap: wrap;
      gap: var(--bm-space-2);
    }

    .bm-details-list {
      display: flex;
      flex-direction: column;
      gap: var(--bm-space-3);
    }

    .bm-detail-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--bm-space-3) 0;
      border-bottom: 1px solid var(--bm-color-border);

      &:last-child {
        border-bottom: none;
      }
    }

    .bm-detail-key {
      display: flex;
      align-items: center;
      gap: var(--bm-space-2);
      font-size: var(--bm-font-size-sm);
      color: var(--bm-color-text-secondary);
    }

    .bm-detail-val {
      display: flex;
      align-items: center;
      gap: var(--bm-space-2);
      font-size: var(--bm-font-size-sm);
      color: var(--bm-color-text-primary);
      font-weight: var(--bm-font-weight-medium);
    }

    .bm-mono-code {
      font-family: var(--bm-font-mono);
      font-size: var(--bm-font-size-xs);
      background-color: var(--bm-color-surface-subtle);
      padding: 2px 6px;
      border-radius: var(--bm-radius-sm);
      border: 1px solid var(--bm-color-border);
    }

    .bm-info-notice {
      display: flex;
      flex-direction: column;
      gap: var(--bm-space-4);
      font-size: var(--bm-font-size-sm);
      color: var(--bm-color-text-secondary);
      line-height: 1.5;
    }

    .bm-status-pill {
      display: inline-flex;
      align-items: center;
      gap: var(--bm-space-2);
      padding: var(--bm-space-2) var(--bm-space-3);
      background-color: var(--bm-color-surface-subtle);
      border: 1px solid var(--bm-color-border);
      border-radius: var(--bm-radius-md);
      font-size: var(--bm-font-size-xs);
      color: var(--bm-color-text-secondary);
    }

    .bm-status-dot {
      width: 6px;
      height: 6px;
      border-radius: var(--bm-radius-full);
      background-color: var(--bm-color-warning);
    }
  `],
})
export class ProfilePageComponent {
  private readonly authService = inject(AuthService);

  readonly MailIcon = Mail;
  readonly PhoneIcon = Phone;
  readonly ShieldIcon = Shield;
  readonly UserIcon = User;
  readonly CheckCircleIcon = CheckCircle2;
  readonly XCircleIcon = XCircle;

  readonly user = this.authService.currentUser;
  readonly userName = computed(() => this.user()?.name || 'Merchant');
  readonly userRoleLabel = computed(() => {
    return this.user()?.role === 'ADMIN' ? 'Platform Administrator' : 'Store Operator';
  });
}
