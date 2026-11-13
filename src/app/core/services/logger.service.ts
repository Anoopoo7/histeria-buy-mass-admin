import { Injectable, Injector, inject } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/services/auth.service';
import { NewRelicService } from './new-relic.service';

export interface LogContext {
  [key: string]: unknown;
}

@Injectable({
  providedIn: 'root',
})
export class LoggerService {
  private readonly newRelic = inject(NewRelicService);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);

  private get authService(): AuthService | null {
    try {
      return this.injector.get(AuthService);
    } catch {
      return null;
    }
  }

  private buildMetadata(custom?: LogContext): Record<string, unknown> {
    const auth = this.authService;
    const user = typeof auth?.currentUser === 'function' ? auth.currentUser() : null;
    const merchant = typeof auth?.currentMerchant === 'function' ? auth.currentMerchant() : null;

    return {
      appName: 'BuyMass Store Admin',
      environment: environment.production ? 'production' : 'development',
      route: this.router.url || '/',
      timestamp: new Date().toISOString(),
      ...(user ? { userId: user.id, userEmail: user.email, userRole: user.role } : {}),
      ...(merchant ? { storeId: merchant.id, storeName: merchant.storeName, storeStatus: merchant.status } : {}),
      ...(custom || {}),
    };
  }

  info(message: string, context?: LogContext): void {
    const meta = this.buildMetadata(context);
    console.info(`[BuyMass:INFO] ${message}`, meta);
    this.newRelic.log(message, 'info', meta);
  }

  warn(message: string, context?: LogContext): void {
    const meta = this.buildMetadata(context);
    console.warn(`[BuyMass:WARN] ${message}`, meta);
    this.newRelic.log(message, 'warn', meta);
  }

  error(message: string, error?: unknown, context?: LogContext): void {
    const meta = this.buildMetadata({
      ...(context || {}),
      ...(error instanceof Error ? { errorName: error.name, errorMessage: error.message, stack: error.stack } : { error }),
    });
    console.error(`[BuyMass:ERROR] ${message}`, meta);
    this.newRelic.log(message, 'error', meta);

    if (error instanceof Error) {
      this.newRelic.noticeError(error, meta);
    } else if (typeof error === 'string') {
      this.newRelic.noticeError(new Error(error), meta);
    }
  }

  /**
   * High-level business event tracking.
   * Ingests as PageAction in New Relic for fast NRQL analytics:
   * SELECT * FROM PageAction WHERE actionName = '...'
   */
  trackEvent(eventName: string, attributes?: LogContext): void {
    const payload = this.buildMetadata(attributes);
    console.debug(`[BuyMass:Event] ${eventName}`, payload);
    this.newRelic.addPageAction(eventName, payload);
    this.newRelic.log(`[Event] ${eventName}`, 'info', payload);
  }

  trackAuth(
    action: 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'LOGOUT' | 'PHONE_OTP_VERIFIED',
    metadata?: LogContext,
  ): void {
    this.trackEvent(`auth_${action.toLowerCase()}`, {
      action,
      ...metadata,
    });
  }

  trackOrder(
    action: 'CONFIRMED' | 'READY_FOR_PICKUP' | 'PICKUP_VERIFIED' | 'PICKUP_OTP_FAILED',
    orderId: string,
    metadata?: LogContext,
  ): void {
    this.trackEvent(`order_${action.toLowerCase()}`, {
      orderId,
      action,
      ...metadata,
    });
  }

  trackProduct(
    action: 'CREATED' | 'UPDATED' | 'DELETED' | 'ARCHIVED',
    productId: string,
    metadata?: LogContext,
  ): void {
    this.trackEvent(`product_${action.toLowerCase()}`, {
      productId,
      action,
      ...metadata,
    });
  }

  trackCampaign(
    action: 'CREATED' | 'SUBMITTED' | 'AUTO_STARTED' | 'CANCELLED',
    poolId: string,
    metadata?: LogContext,
  ): void {
    this.trackEvent(`campaign_${action.toLowerCase()}`, {
      poolId,
      action,
      ...metadata,
    });
  }
}
