import { ErrorHandler, Injectable, inject } from '@angular/core';
import { NewRelicService } from '../services/new-relic.service';

/**
 * Global Angular Error Handler
 * Automatically captures uncaught runtime exceptions and transmits
 * stack traces and metadata to New Relic Browser telemetry.
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly newRelic = inject(NewRelicService);

  handleError(error: unknown): void {
    // Retain standard browser console output
    console.error('[GlobalErrorHandler]', error);

    // Forward to New Relic if agent is active
    if (error instanceof Error) {
      this.newRelic.noticeError(error, {
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : '',
      });
    } else {
      this.newRelic.noticeError(String(error), {
        raw: error,
      });
    }
  }
}
