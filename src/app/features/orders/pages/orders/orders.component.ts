import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, ShoppingBag } from 'lucide-angular';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { CardComponent } from '../../../../shared/ui/card/card.component';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../../shared/ui/page-header/page-header.component';

@Component({
  selector: 'bm-orders',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LucideAngularModule,
    PageHeaderComponent,
    CardComponent,
    EmptyStateComponent,
    ButtonComponent,
  ],
  template: `
    <div class="bm-feature-page">
      <bm-page-header
        title="Store Orders & Fulfillment"
        subtitle="Track customer group-buying orders, escrow settlements, and pickup verification"
        [breadcrumbs]="[
          { label: 'Dashboard', url: '/dashboard' },
          { label: 'Orders' }
        ]"
      ></bm-page-header>

      <bm-card>
        <bm-empty-state
          title="Orders Pipeline Active"
          description="Customer orders appear here automatically when group-buying pools hit minimum target thresholds."
        >
          <div bmEmptyIcon>
            <lucide-icon [img]="ShoppingBagIcon" [size]="40"></lucide-icon>
          </div>
          <div bmEmptyAction>
            <a routerLink="/dashboard">
              <bm-button variant="outline" size="md">
                View Dashboard Queue
              </bm-button>
            </a>
          </div>
        </bm-empty-state>
      </bm-card>
    </div>
  `,
  styles: [`
    .bm-feature-page {
      display: flex;
      flex-direction: column;
      gap: var(--bm-space-6);
    }
  `],
})
export class OrdersPageComponent {
  readonly ShoppingBagIcon = ShoppingBag;
}
