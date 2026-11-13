import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NewRelicService } from './core/services/new-relic.service';
import { RouteLoaderComponent } from './shared/ui/route-loader/route-loader.component';
import { ToastContainerComponent } from './shared/ui/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastContainerComponent, RouteLoaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'BuyMass Store Admin';
  private readonly newRelic = inject(NewRelicService);

  ngOnInit(): void {
    this.newRelic.initRouteTracking();
  }
}
