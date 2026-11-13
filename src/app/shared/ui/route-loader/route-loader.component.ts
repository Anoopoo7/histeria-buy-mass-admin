import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
} from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'bm-route-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (visible()) {
      <div
        class="bm-route-loader-track"
        [class.bm-route-loader-hiding]="isHiding()"
        role="progressbar"
        aria-label="Page loading"
        [attr.aria-valuenow]="progress()"
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <div
          class="bm-route-loader-bar"
          [style.width.%]="progress()"
        >
          <div class="bm-route-loader-glow"></div>
        </div>
      </div>
    }
  `,
  styles: [`
    .bm-route-loader-track {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      z-index: 99999;
      pointer-events: none;
      opacity: 1;
      transition: opacity 250ms ease-out;
    }

    .bm-route-loader-hiding {
      opacity: 0;
    }

    .bm-route-loader-bar {
      height: 100%;
      background: linear-gradient(
        90deg,
        var(--bm-color-primary, #176B50) 0%,
        var(--bm-color-accent, #22C55E) 100%
      );
      transition: width 200ms cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      will-change: width;
    }

    .bm-route-loader-glow {
      position: absolute;
      top: 0;
      right: 0;
      width: 100px;
      height: 100%;
      box-shadow: 0 0 10px #22C55E, 0 0 5px #176B50;
      opacity: 0.8;
      transform: rotate(3deg) translate(0px, -4px);
    }
  `],
})
export class RouteLoaderComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private sub?: Subscription;
  private trickleTimer?: ReturnType<typeof setInterval>;
  private hideTimeout?: ReturnType<typeof setTimeout>;

  readonly visible = signal(false);
  readonly isHiding = signal(false);
  readonly progress = signal(0);

  ngOnInit(): void {
    this.sub = this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.start();
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.complete();
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.clearTimers();
  }

  private start(): void {
    this.clearTimers();
    this.isHiding.set(false);
    this.visible.set(true);
    this.progress.set(15);

    this.trickleTimer = setInterval(() => {
      const current = this.progress();
      if (current < 85) {
        // Increment proportionally slower as it gets higher
        const step = Math.max(2, Math.floor((90 - current) * 0.15));
        this.progress.set(current + step);
      }
    }, 200);
  }

  private complete(): void {
    if (this.trickleTimer) {
      clearInterval(this.trickleTimer);
      this.trickleTimer = undefined;
    }

    this.progress.set(100);

    // Keep at 100% briefly, then fade out
    this.hideTimeout = setTimeout(() => {
      this.isHiding.set(true);

      setTimeout(() => {
        this.visible.set(false);
        this.progress.set(0);
        this.isHiding.set(false);
      }, 250);
    }, 200);
  }

  private clearTimers(): void {
    if (this.trickleTimer) {
      clearInterval(this.trickleTimer);
      this.trickleTimer = undefined;
    }
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = undefined;
    }
  }
}
