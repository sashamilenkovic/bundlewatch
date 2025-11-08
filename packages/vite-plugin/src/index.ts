/**
 * @milencode/bundlewatch-vite-plugin
 * Vite plugin for automatic bundle analysis
 */

import type { Plugin, ResolvedConfig } from 'vite';
import { MetricsCollector, GitStorage, ComparisonEngine, ReportGenerator } from '@milencode/bundlewatch-core';
import type { BundleWatchConfig } from '@milencode/bundlewatch-core';
import { resolve } from 'path';
import { writeFileSync, mkdirSync } from 'fs';

export interface ViteBundleWatchOptions extends Partial<BundleWatchConfig> {
  /**
   * Enable/disable the plugin
   * @default true
   */
  enabled?: boolean;

  /**
   * Print report to console after build
   * @default true
   */
  printReport?: boolean;

  /**
   * Save metrics to git storage
   * @default true in CI, false locally
   */
  saveToGit?: boolean;

  /**
   * Compare against target branch
   * @default 'main'
   */
  compareAgainst?: string;

  /**
   * Fail build if size increases beyond threshold
   * @default false
   */
  failOnSizeIncrease?: boolean;

  /**
   * Size increase threshold (percentage)
   * @default 10
   */
  sizeIncreaseThreshold?: number;

  /**
   * Generate interactive HTML dashboard
   * @default false
   */
  generateDashboard?: boolean;

  /**
   * Path to save the dashboard
   * @default './bundle-report'
   */
  dashboardPath?: string;
}

const defaultOptions: ViteBundleWatchOptions = {
  enabled: true,
  printReport: true,
  saveToGit: undefined, // Will be determined based on CI env
  compareAgainst: 'main',
  failOnSizeIncrease: false,
  sizeIncreaseThreshold: 10,
  generateDashboard: false,
  dashboardPath: './bundle-report',
};

/**
 * Vite plugin for bundle watching and analysis
 */
export function bundleWatch(userOptions: ViteBundleWatchOptions = {}): Plugin {
  const options = { ...defaultOptions, ...userOptions };
  let config: ResolvedConfig;
  let buildStartTime: number;
  const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

  // Default saveToGit based on CI environment
  if (options.saveToGit === undefined) {
    options.saveToGit = isCI;
  }

  return {
    name: 'vite-plugin-bundlewatch',
    
    apply: 'build', // Only run on build, not dev

    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },

    buildStart() {
      if (!options.enabled) return;
      buildStartTime = Date.now();
      console.log('📊 Bundle Watch: Starting analysis...');
    },

    async closeBundle() {
      if (!options.enabled) return;

      try {
        const outputDir = resolve(config.root, config.build.outDir);
        
        // Get git info
        const commit = await GitStorage.getCurrentCommit(config.root);
        const branch = await GitStorage.getCurrentBranch(config.root);

        // Collect metrics
        const collector = new MetricsCollector({
          outputDir,
          branch,
          commit,
          buildStartTime,
        });

        const metrics = await collector.collect();

        // Initialize storage and reporter
        const storage = new GitStorage({
          branch: options.storage?.branch || 'bundlewatch-data',
          workingDir: config.root,
        });
        const reporter = new ReportGenerator();
        const analyzer = new ComparisonEngine();

        let comparison;

        // Load baseline for comparison
        if (options.compareAgainst) {
          const baseline = await storage.load(options.compareAgainst);
          if (baseline) {
            comparison = analyzer.compare(metrics, baseline, options.compareAgainst);
          }
        }

        // Print report to console
        if (options.printReport) {
          console.log(reporter.generateConsoleOutput(metrics, comparison));
        }

        // Generate dashboard
        if (options.generateDashboard) {
          const dashboardDir = resolve(config.root, options.dashboardPath!);
          console.log(`📊 Generating dashboard at ${dashboardDir}...`);
          
          try {
            mkdirSync(dashboardDir, { recursive: true });
            
            const dashboardHTML = generateDashboardHTML(metrics, comparison);
            writeFileSync(resolve(dashboardDir, 'index.html'), dashboardHTML);
            
            console.log(`✅ Dashboard generated: ${resolve(dashboardDir, 'index.html')}`);
            console.log(`   Open with: open ${resolve(dashboardDir, 'index.html')}`);
          } catch (dashboardError) {
            console.error('Failed to generate dashboard:', dashboardError);
          }
        }

        // Save to git storage
        if (options.saveToGit) {
          console.log('💾 Saving metrics to git...');
          await storage.save(metrics);
          console.log('✅ Metrics saved successfully');
        }

        // Check thresholds
        if (options.failOnSizeIncrease && comparison) {
          const threshold = options.sizeIncreaseThreshold || 10;
          if (comparison.changes.totalSize.diffPercent > threshold) {
            throw new Error(
              `Bundle size increased by ${comparison.changes.totalSize.diffPercent.toFixed(1)}% ` +
              `(threshold: ${threshold}%). Build failed.`
            );
          }
        }

        // Set environment variables for GitHub Actions
        if (isCI) {
          console.log('Setting GitHub Actions outputs...');
          console.log(`::set-output name=total-size::${metrics.totalSize}`);
          console.log(`::set-output name=gzip-size::${metrics.totalGzipSize}`);
          if (comparison) {
            console.log(`::set-output name=size-diff::${comparison.changes.totalSize.diff}`);
            console.log(`::set-output name=size-diff-percent::${comparison.changes.totalSize.diffPercent}`);
          }
        }

      } catch (error) {
        console.error('❌ Bundle Watch error:', error);
        if (options.failOnSizeIncrease) {
          throw error;
        }
      }
    },
  };
}

/**
 * Generate interactive HTML dashboard
 */
function generateDashboardHTML(metrics: any, comparison?: any): string {
  const treemapData = generateTreemapData(metrics);
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bundle Watch Dashboard</title>
  <script src="https://d3js.org/d3.v7.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      padding: 2rem;
    }
    .header {
      margin-bottom: 2rem;
    }
    h1 {
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .stat-card {
      background: #1e293b;
      padding: 1.5rem;
      border-radius: 0.5rem;
      border: 1px solid #334155;
    }
    .stat-label {
      color: #94a3b8;
      font-size: 0.875rem;
      margin-bottom: 0.5rem;
    }
    .stat-value {
      font-size: 1.5rem;
      font-weight: 600;
    }
    .treemap {
      width: 100%;
      height: 600px;
      background: #1e293b;
      border-radius: 0.5rem;
      border: 1px solid #334155;
      overflow: hidden;
    }
    .node {
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .node:hover {
      opacity: 0.8;
    }
    .node-label {
      font-size: 12px;
      fill: white;
      text-shadow: 0 1px 2px rgba(0,0,0,0.5);
      pointer-events: none;
    }
    .tooltip {
      position: absolute;
      background: #1e293b;
      border: 1px solid #334155;
      padding: 0.75rem;
      border-radius: 0.375rem;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s;
      font-size: 0.875rem;
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3);
    }
    .tooltip-title {
      font-weight: 600;
      margin-bottom: 0.25rem;
    }
    .tooltip-size {
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 Bundle Watch Dashboard</h1>
    <p style="color: #94a3b8;">Interactive bundle size visualization</p>
  </div>

  <div class="stats">
    <div class="stat-card">
      <div class="stat-label">Total Size</div>
      <div class="stat-value">${formatBytes(metrics.totalSize)}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Gzipped</div>
      <div class="stat-value">${formatBytes(metrics.totalGzipSize)}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Brotli</div>
      <div class="stat-value">${formatBytes(metrics.totalBrotliSize)}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Chunks</div>
      <div class="stat-value">${metrics.files.length}</div>
    </div>
  </div>

  <div id="treemap" class="treemap"></div>
  <div id="tooltip" class="tooltip"></div>

  <script>
    const data = ${JSON.stringify(treemapData)};
    
    const width = document.getElementById('treemap').clientWidth;
    const height = 600;

    const color = d3.scaleOrdinal()
      .domain(['js', 'css', 'image', 'font', 'other'])
      .range(['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6']);

    const root = d3.hierarchy(data)
      .sum(d => d.value)
      .sort((a, b) => b.value - a.value);

    d3.treemap()
      .size([width, height])
      .padding(1)
      .round(true)(root);

    const svg = d3.select('#treemap')
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const tooltip = d3.select('#tooltip');

    const nodes = svg.selectAll('g')
      .data(root.leaves())
      .join('g')
      .attr('transform', d => \`translate(\${d.x0},\${d.y0})\`);

    nodes.append('rect')
      .attr('class', 'node')
      .attr('width', d => d.x1 - d.x0)
      .attr('height', d => d.y1 - d.y0)
      .attr('fill', d => color(d.data.type))
      .on('mouseover', function(event, d) {
        tooltip
          .style('opacity', 1)
          .style('left', event.pageX + 10 + 'px')
          .style('top', event.pageY + 10 + 'px')
          .html(\`
            <div class="tooltip-title">\${d.data.name}</div>
            <div class="tooltip-size">Rendered: \${formatBytes(d.data.value)}</div>
            <div class="tooltip-size">Gzip: \${formatBytes(d.data.gzip)}</div>
            <div class="tooltip-size">Brotli: \${formatBytes(d.data.brotli)}</div>
          \`);
      })
      .on('mousemove', function(event) {
        tooltip
          .style('left', event.pageX + 10 + 'px')
          .style('top', event.pageY + 10 + 'px');
      })
      .on('mouseout', function() {
        tooltip.style('opacity', 0);
      });

    nodes.append('text')
      .attr('class', 'node-label')
      .attr('x', 4)
      .attr('y', 16)
      .text(d => {
        const width = d.x1 - d.x0;
        const height = d.y1 - d.y0;
        if (width < 50 || height < 20) return '';
        return d.data.name.length > 20 ? d.data.name.slice(0, 18) + '...' : d.data.name;
      });

    function formatBytes(bytes) {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
    }
  </script>
</body>
</html>`;
}

/**
 * Generate treemap data from metrics
 */
function generateTreemapData(metrics: any): any {
  const children = metrics.files.map((file: any) => ({
    name: file.name.split('/').pop(),
    value: file.size,
    gzip: file.gzipSize,
    brotli: file.brotliSize,
    type: getFileType(file.name),
  }));

  return {
    name: 'Bundle',
    children,
  };
}

/**
 * Get file type from name
 */
function getFileType(name: string): string {
  if (name.endsWith('.js') || name.endsWith('.mjs')) return 'js';
  if (name.endsWith('.css')) return 'css';
  if (name.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) return 'image';
  if (name.match(/\.(woff|woff2|ttf|eot)$/)) return 'font';
  return 'other';
}

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

// Export default
export default bundleWatch;
