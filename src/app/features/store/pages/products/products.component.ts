import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, Plus, ShoppingBag } from 'lucide-angular';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { CardComponent } from '../../../../shared/ui/card/card.component';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../../shared/ui/page-header/page-header.component';

@Component({
  selector: 'bm-products',
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
        title="Store Products"
        subtitle="Manage regular store products and group-buying pool offerings"
        [breadcrumbs]="[
          { label: 'Dashboard', url: '/dashboard' },
          { label: 'Products' }
        ]"
      ></bm-page-header>

      <bm-card>
        <bm-empty-state
          title="Product Catalogue Ready for Onboarding"
          description="Once your merchant store application is approved by the administrative team, you can add products and assign wholesale tiered pricing."
        >
          <div bmEmptyIcon>
            <lucide-icon [img]="ShoppingBagIcon" [size]="40"></lucide-icon>
          </div>
          <div bmEmptyAction>
            <a routerLink="/merchant/status">
              <bm-button variant="outline" size="md">
                Check Store Onboarding Status
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
export class ProductsPageComponent {
  readonly authService = inject(AuthService);
  readonly ShoppingBagIcon = ShoppingBag;
  readonly PlusIcon = Plus;
}
