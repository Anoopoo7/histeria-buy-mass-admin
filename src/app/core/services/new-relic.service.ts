import { Injectable, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

declare global {
  interface Window {
    newrelic?: {
      noticeError: (error: Error | string, customAttributes?: Record<string, unknown>) => void;
      addPageAction: (name: string, attributes?: Record<string, unknown>) => void;
      setCustomAttribute: (name: string, value: string | number | boolean) => void;
      setCurrentRouteName: (name: string) => void;
      log?: (message: string, options?: { level?: 'info' | 'warn' | 'error'; [key: string]: unknown }) => void;
    };
  }
}

@Injectable({
  providedIn: 'root',
})
export class NewRelicService {
  private readonly router = inject(Router);

  /**
   * Initializes New Relic SPA route change tracking.
   * Call once in AppComponent on app boot.
   */
  initRouteTracking(): void {
    if (!this.isAvailable()) return;

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.setCurrentRoute(event.urlAfterRedirects || event.url);
      });
  }

  isAvailable(): boolean {
    return typeof window !== 'undefined' && typeof window.newrelic !== 'undefined';
  }

  log(message: string, level: 'info' | 'warn' | 'error' = 'info', attributes?: Record<string, unknown>): void {
    if (this.isAvailable()) {
      if (typeof window.newrelic?.log === 'function') {
        window.newrelic.log(message, { level, ...attributes });
      } else {
        // Fallback to PageAction if browser log forwarding API is not yet loaded
        this.addPageAction(`log_${level}`, { message, ...attributes });
      }
    }
  }

  noticeError(error: Error | string, customAttributes?: Record<string, unknown>): void {
    if (this.isAvailable()) {
      window.newrelic?.noticeError(error, customAttributes);
    }
  }

  addPageAction(name: string, attributes?: Record<string, unknown>): void {
    if (this.isAvailable()) {
      window.newrelic?.addPageAction(name, attributes);
    }
  }

  setCustomAttribute(name: string, value: string | number | boolean): void {
    if (this.isAvailable()) {
      window.newrelic?.setCustomAttribute(name, value);
    }
  }

  setCurrentRoute(route: string): void {
    if (this.isAvailable()) {
      window.newrelic?.setCurrentRouteName(route);
    }
  }
}
