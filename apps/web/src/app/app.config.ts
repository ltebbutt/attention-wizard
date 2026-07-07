import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors, HttpInterceptorFn } from '@angular/common/http';
import { provideRouter, withDisabledInitialNavigation } from '@angular/router';

import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { Api } from './core/api';
import { DemoApi } from './core/demo-api';

/** Every request carries the user's IANA timezone so plan dates are local (TOP3-01). */
const timezoneInterceptor: HttpInterceptorFn = (req, next) =>
  next(
    req.clone({
      setHeaders: { 'x-aw-timezone': Intl.DateTimeFormat().resolvedOptions().timeZone },
    }),
  );

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    // Demo builds render Today directly (see App) and must not touch the History
    // API: it is unavailable on file:// and in sandboxed iframes.
    ...(environment.demo
      ? [provideRouter(routes, withDisabledInitialNavigation())]
      : [provideRouter(routes)]),
    provideHttpClient(withInterceptors([timezoneInterceptor])),
    // GitHub Pages demo build: the loop runs client-side against the local store.
    ...(environment.demo ? [{ provide: Api, useClass: DemoApi }] : []),
  ],
};
