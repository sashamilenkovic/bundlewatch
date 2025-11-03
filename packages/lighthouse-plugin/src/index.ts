import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import type { BuildMetrics } from '@milencode/bundlewatch-core';

export interface LighthouseOptions {
  /** URL to test (defaults to http://localhost:4173 - Vite preview server) */
  url?: string;
  /** Lighthouse config overrides */
  config?: any;
  /** Chrome flags */
  chromeFlags?: string[];
  /** Whether to launch Chrome headless */
  headless?: boolean;
}

export interface LighthouseMetrics {
  /** Performance score (0-100) */
  performance: number;
  /** Accessibility score (0-100) */
  accessibility: number;
  /** Best Practices score (0-100) */
  bestPractices: number;
  /** SEO score (0-100) */
  seo: number;
  /** First Contentful Paint (ms) */
  fcp: number;
  /** Largest Contentful Paint (ms) */
  lcp: number;
  /** Total Blocking Time (ms) */
  tbt: number;
  /** Cumulative Layout Shift */
  cls: number;
  /** Speed Index (ms) */
  speedIndex: number;
  /** Time to Interactive (ms) */
  tti: number;
}

export interface CorrelationResult {
  bundleSize: number;
  bundleSizeDelta: number;
  lighthouseMetrics: LighthouseMetrics;
  lighthouseMetricsDelta?: Partial<LighthouseMetrics>;
  insights: string[];
}

/**
 * Run Lighthouse audit on a URL
 */
export async function runLighthouse(
  options: LighthouseOptions = {}
): Promise<LighthouseMetrics> {
  const {
    url = 'http://localhost:4173',
    config = { extends: 'lighthouse:default' },
    chromeFlags = [],
    headless = true,
  } = options;

  const chrome = await chromeLauncher.launch({
    chromeFlags: [
      ...chromeFlags,
      ...(headless ? ['--headless'] : []),
    ],
  });

  try {
    const runnerResult = await lighthouse(url, {
      port: chrome.port,
      output: 'json',
    }, config);

    if (!runnerResult?.lhr) {
      throw new Error('Lighthouse audit failed');
    }

    const { categories, audits } = runnerResult.lhr;

    return {
      performance: Math.round((categories.performance?.score ?? 0) * 100),
      accessibility: Math.round((categories.accessibility?.score ?? 0) * 100),
      bestPractices: Math.round((categories['best-practices']?.score ?? 0) * 100),
      seo: Math.round((categories.seo?.score ?? 0) * 100),
      fcp: audits['first-contentful-paint']?.numericValue ?? 0,
      lcp: audits['largest-contentful-paint']?.numericValue ?? 0,
      tbt: audits['total-blocking-time']?.numericValue ?? 0,
      cls: audits['cumulative-layout-shift']?.numericValue ?? 0,
      speedIndex: audits['speed-index']?.numericValue ?? 0,
      tti: audits['interactive']?.numericValue ?? 0,
    };
  } finally {
    await chrome.kill();
  }
}

/**
 * Correlate bundle size changes with Lighthouse performance metrics
 */
export function correlateBundleAndPerformance(
  currentMetrics: BuildMetrics,
  baselineMetrics: BuildMetrics | undefined,
  lighthouseMetrics: LighthouseMetrics,
  baselineLighthouseMetrics?: LighthouseMetrics
): CorrelationResult {
  const bundleSize = currentMetrics.totalSize;
  const bundleSizeDelta = baselineMetrics
    ? ((bundleSize - baselineMetrics.totalSize) / baselineMetrics.totalSize) * 100
    : 0;

  const lighthouseMetricsDelta = baselineLighthouseMetrics
    ? {
        performance: lighthouseMetrics.performance - baselineLighthouseMetrics.performance,
        lcp: lighthouseMetrics.lcp - baselineLighthouseMetrics.lcp,
        fcp: lighthouseMetrics.fcp - baselineLighthouseMetrics.fcp,
        tbt: lighthouseMetrics.tbt - baselineLighthouseMetrics.tbt,
        cls: lighthouseMetrics.cls - baselineLighthouseMetrics.cls,
      }
    : undefined;

  const insights = generateCorrelationInsights(
    bundleSizeDelta,
    lighthouseMetrics,
    lighthouseMetricsDelta
  );

  return {
    bundleSize,
    bundleSizeDelta,
    lighthouseMetrics,
    lighthouseMetricsDelta,
    insights,
  };
}

/**
 * Generate insights based on bundle size and performance correlation
 */
function generateCorrelationInsights(
  bundleSizeDelta: number,
  metrics: LighthouseMetrics,
  delta?: Partial<LighthouseMetrics>
): string[] {
  const insights: string[] = [];

  // Bundle size increased but performance dropped
  if (bundleSizeDelta > 5 && delta && delta.performance && delta.performance < -5) {
    insights.push(
      `⚠️  Bundle size increased by ${bundleSizeDelta.toFixed(1)}% and Performance score dropped ${Math.abs(delta.performance)} points`
    );
  }

  // Bundle size increased but performance stayed the same or improved
  if (bundleSizeDelta > 5 && delta && delta.performance && delta.performance >= 0) {
    insights.push(
      `✅ Bundle size increased by ${bundleSizeDelta.toFixed(1)}% but Performance score maintained at ${metrics.performance}`
    );
  }

  // LCP issues
  if (metrics.lcp > 2500) {
    insights.push(
      `🐌 Largest Contentful Paint is ${(metrics.lcp / 1000).toFixed(2)}s (target: <2.5s). Consider code splitting or lazy loading.`
    );
  }

  // TBT issues
  if (metrics.tbt > 200) {
    insights.push(
      `⏱️  Total Blocking Time is ${metrics.tbt.toFixed(0)}ms (target: <200ms). Large bundles may be blocking the main thread.`
    );
  }

  // CLS issues
  if (metrics.cls > 0.1) {
    insights.push(
      `📐 Cumulative Layout Shift is ${metrics.cls.toFixed(3)} (target: <0.1). This is typically not bundle-size related.`
    );
  }

  // Performance score warnings
  if (metrics.performance < 50) {
    insights.push(
      `🔴 Performance score is ${metrics.performance}/100. Bundle optimization should be a high priority.`
    );
  } else if (metrics.performance < 90) {
    insights.push(
      `🟡 Performance score is ${metrics.performance}/100. There's room for improvement.`
    );
  } else {
    insights.push(
      `🟢 Excellent performance score: ${metrics.performance}/100!`
    );
  }

  return insights;
}

/**
 * Format Lighthouse metrics for console output
 */
export function formatLighthouseReport(
  metrics: LighthouseMetrics,
  delta?: Partial<LighthouseMetrics>
): string {
  const lines: string[] = [];
  
  lines.push('');
  lines.push('🔦 Lighthouse Performance Metrics');
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('');

  const formatDelta = (value: number | undefined, suffix = '') => {
    if (value === undefined) return '';
    const sign = value > 0 ? '+' : '';
    return ` (${sign}${value.toFixed(value < 1 ? 3 : 0)}${suffix})`;
  };

  lines.push(`Performance:     ${metrics.performance}/100${formatDelta(delta?.performance)}`);
  lines.push(`Accessibility:   ${metrics.accessibility}/100`);
  lines.push(`Best Practices:  ${metrics.bestPractices}/100`);
  lines.push(`SEO:             ${metrics.seo}/100`);
  lines.push('');
  lines.push('Core Web Vitals:');
  lines.push(`  LCP:  ${(metrics.lcp / 1000).toFixed(2)}s${formatDelta(delta?.lcp ? delta.lcp / 1000 : undefined, 's')}`);
  lines.push(`  FCP:  ${(metrics.fcp / 1000).toFixed(2)}s${formatDelta(delta?.fcp ? delta.fcp / 1000 : undefined, 's')}`);
  lines.push(`  TBT:  ${metrics.tbt.toFixed(0)}ms${formatDelta(delta?.tbt, 'ms')}`);
  lines.push(`  CLS:  ${metrics.cls.toFixed(3)}${formatDelta(delta?.cls)}`);
  lines.push('');

  return lines.join('\n');
}

