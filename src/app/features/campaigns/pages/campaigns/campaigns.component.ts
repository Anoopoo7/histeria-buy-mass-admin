import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Layers, LucideAngularModule } from 'lucide-angular';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { CardComponent } from '../../../../shared/ui/card/card.component';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../../shared/ui/page-header/page-header.component';

@Component({
  selector: 'bm-campaigns',
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
        title="Group-Buying Campaigns & Pools"
        subtitle="Manage bulk order pools, target quantities, and community participation"
        [breadcrumbs]="[
          { label: 'Dashboard', url: '/dashboard' },
          { label: 'Campaigns' }
        ]"
      ></bm-page-header>

      <bm-card>
        <bm-empty-state
          title="Community Buying Pools"
          description="Pool creation opens as soon as store inventory is loaded and approved."
        >
          <div bmEmptyIcon>
            <lucide-icon [img]="LayersIcon" [size]="40"></lucide-icon>
          </div>
          <div bmEmptyAction>
            <a routerLink="/dashboard">
              <bm-button variant="outline" size="md">
                Return to Dashboard
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
export class CampaignsPageComponent {
  readonly LayersIcon = Layers;
}
