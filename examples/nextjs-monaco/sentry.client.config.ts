import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || '',

  // Only enable in production
  enabled: process.env.NODE_ENV === 'production',

  // Set tracesSampleRate to 1.0 to capture 100% of transactions
  tracesSampleRate: 0.1,

  // Capture Replay for 10% of all sessions
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
