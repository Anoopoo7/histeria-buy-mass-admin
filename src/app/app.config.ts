import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, ErrorHandler, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';
import { authInterceptor } from './core/auth/interceptors/auth.interceptor';
import { GlobalErrorHandler } from './core/errors/global-error-handler';
import { correlationIdInterceptor } from './core/interceptors/correlation-id.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([correlationIdInterceptor, authInterceptor])),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
  ],
};
