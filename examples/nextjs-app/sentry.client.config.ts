/**
 * Sentry client-side configuration
 * This adds Sentry JS to the bundle for demonstration purposes
 */

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  // Use a placeholder DSN - in production you'd use a real one
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || '',

  // Only enable in production
  enabled: process.env.NODE_ENV === 'production',

  // Performance monitoring
  tracesSampleRate: 0.1,

  // Debug mode in development
  debug: false,
});
