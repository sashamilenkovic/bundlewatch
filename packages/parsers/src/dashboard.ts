/**
 * Shared dashboard generation utilities
 * Used by both Vite and Webpack plugins
 */

import type { BuildMetrics } from '@milencode/bundlewatch-core';

interface TreemapNode {
  name: string;
  value: number;
  gzip: number;
  brotli: number;
  type: 'js' | 'css' | 'asset' | 'html' | 'other' | 'app' | 'npm';
}

interface TreemapData {
  name: string;
  children: TreemapNode[];
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Generate treemap data structure for D3 visualization
 * Prefers showing module composition when available, falls back to bundles
 */
export function generateTreemapData(metrics: BuildMetrics): TreemapData {
  // Primary view: actual output chunks (bundles/assets)
  // This shows what files are shipped to users
  const children = metrics.bundles.map(
    (bundle): TreemapNode => ({
      name: bundle.name.split('/').pop() || bundle.name,
      value: bundle.size,
      gzip: bundle.gzipSize,
      brotli: bundle.brotliSize,
      type: bundle.type,
    }),
  );

  return {
    name: 'Output Chunks',
    children,
  };
}

/**
 * Generate dependency composition data for secondary view
 */
export function generateDependencyData(metrics: BuildMetrics): TreemapData | null {
  if (!metrics.detailedDependencies || metrics.detailedDependencies.length === 0) {
    return null;
  }

  const children: TreemapNode[] = metrics.detailedDependencies.map(dep => {
    // Determine type: app code vs npm packages vs vendor
    let type: 'app' | 'npm' | 'vendor' = 'npm';

    if (dep.name === 'your-app' || dep.name === 'app' || dep.name.startsWith('src/') ||
        dep.name.startsWith('lib/') || dep.name.startsWith('components/') ||
        dep.name.startsWith('pages/') || dep.name.startsWith('views/')) {
      type = 'app';
    } else if (dep.name === 'bundler-virtual' || dep.name.startsWith('virtual:')) {
      type = 'vendor';
    }

    return {
      name: dep.name,
      value: dep.totalSize,
      gzip: dep.gzipSize || 0,
      brotli: dep.brotliSize || 0,
      type: type as 'app' | 'npm',
    };
  });

  return {
    name: 'Dependencies',
    children,
  };
}

/**
 * Generate enhanced HTML dashboard with dependency analysis
 */
export function generateEnhancedDashboard(metrics: BuildMetrics, _comparison?: unknown): string {
  const treemapData = generateTreemapData(metrics);
  const dependencyData = metrics.detailedDependencies || [];
  const sourceFileData = metrics.sourceFiles || [];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bundle Watch Dashboard</title>
  <script src="https://d3js.org/d3.v7.min.js"></script>
  <style>
    :root {
      --bg: #000;
      --bg-secondary: #0a0a0a;
      --border: #222;
      --text: #e0e0e0;
      --text-muted: #666;
      --accent: #0f0;
      --accent-secondary: #0a0;
    }
    .light {
      --bg: #fff;
      --bg-secondary: #f5f5f5;
      --border: #ddd;
      --text: #111;
      --text-muted: #666;
      --accent: #000;
      --accent-secondary: #333;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
      background: var(--bg);
      color: var(--text);
      padding: 1rem;
      font-size: 13px;
      line-height: 1.4;
    }
    .header {
      margin: 0 1rem 1rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border);
    }
    h1 {
      font-size: 1.25rem;
      font-weight: 400;
      margin-bottom: 0.25rem;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    h2 {
      font-size: 0.875rem;
      font-weight: 400;
      margin: 1.5rem 1rem 0.5rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--text-muted);
    }
    p {
      margin: 0 1rem;
    }
    .stats {
      display: flex;
      gap: 2rem;
      margin: 0 1rem 1rem;
      flex-wrap: wrap;
    }
    .stat-card {
      display: flex;
      gap: 0.5rem;
      align-items: baseline;
    }
    .stat-label {
      color: var(--text-muted);
      font-size: 0.75rem;
      text-transform: uppercase;
    }
    .stat-value {
      font-size: 1rem;
      font-weight: 600;
      color: var(--accent);
    }
    .treemap {
      width: calc(100% - 2rem);
      height: 350px;
      margin: 0 1rem;
      border: 1px solid var(--border);
      overflow: hidden;
    }
    .node {
      cursor: pointer;
      transition: opacity 0.1s;
    }
    .node:hover {
      opacity: 0.7;
    }
    .node-label {
      font-size: 10px;
      font-family: 'SF Mono', 'Fira Code', monospace;
      fill: white;
      pointer-events: none;
    }
    .tooltip {
      position: absolute;
      background: var(--bg);
      border: 1px solid var(--border);
      padding: 0.5rem;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.1s;
      font-size: 11px;
    }
    .tooltip-title {
      font-weight: 600;
      margin-bottom: 0.25rem;
    }
    .tooltip-size {
      color: var(--text-muted);
    }
    .dependency-table {
      width: calc(100% - 2rem);
      margin: 0 1rem;
      border: 1px solid var(--border);
      overflow-x: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }
    th, td {
      padding: 0.5rem 0.75rem;
      text-align: left;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    th {
      background: var(--bg-secondary);
      font-weight: 400;
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--text-muted);
      border-bottom: 1px solid var(--border);
    }
    td {
      border-bottom: 1px solid var(--border);
    }
    tr:hover {
      background: var(--bg-secondary);
    }
    .badge {
      display: inline-block;
      padding: 0.1rem 0.3rem;
      font-size: 0.6rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border: 1px solid;
    }
    .badge-npm {
      border-color: #666;
      color: #888;
    }
    .badge-app {
      border-color: var(--accent);
      color: var(--accent);
    }
    .badge-vendor {
      border-color: #666;
      color: #888;
    }
    .header-controls {
      display: flex;
      gap: 0.5rem;
    }
    .copy-btn, .theme-btn {
      background: transparent;
      color: var(--text);
      border: 1px solid var(--border);
      padding: 0.4rem 0.75rem;
      cursor: pointer;
      font-size: 0.7rem;
      font-family: inherit;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      transition: all 0.1s;
    }
    .copy-btn:hover, .theme-btn:hover {
      border-color: var(--text);
    }
    .copy-btn.copied {
      border-color: var(--accent);
      color: var(--accent);
    }
  </style>
</head>
<body>
  <div class="header">
    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
      <div>
        <h1>Bundle Watch</h1>
        <p style="color: var(--text-muted); font-size: 11px;">
          ${metrics.branch} / ${metrics.commit.substring(0, 7)} / ${new Date(metrics.timestamp).toLocaleString()}
        </p>
      </div>
      <div class="header-controls">
        <button class="theme-btn" onclick="toggleTheme()">Light</button>
        <button class="copy-btn" onclick="copyAll()">Copy</button>
      </div>
    </div>
  </div>

  <div class="stats">
    <div class="stat-card">
      <span class="stat-label">Total</span>
      <span class="stat-value">${formatBytes(metrics.totalSize)}</span>
    </div>
    <div class="stat-card">
      <span class="stat-label">Gzip</span>
      <span class="stat-value">${formatBytes(metrics.totalGzipSize || 0)}</span>
    </div>
    <div class="stat-card">
      <span class="stat-label">Brotli</span>
      <span class="stat-value">${formatBytes(metrics.totalBrotliSize || 0)}</span>
    </div>
    <div class="stat-card">
      <span class="stat-label">Chunks</span>
      <span class="stat-value">${metrics.chunkCount}</span>
    </div>
    ${metrics.modules ? `
    <div class="stat-card">
      <span class="stat-label">Modules</span>
      <span class="stat-value">${metrics.modules.length}</span>
    </div>
    ` : ''}
  </div>

  <h2>Bundle Treemap</h2>
  <div id="treemap" class="treemap"></div>

  ${treemapData.children && treemapData.children.length > 0 ? `
  <h2>Output Chunks</h2>
  <div class="dependency-table">
    <table id="modules-table">
      <colgroup>
        <col style="width: 30%;">
        <col style="width: 14%;">
        <col style="width: 14%;">
        <col style="width: 14%;">
        <col style="width: 14%;">
        <col style="width: 14%;">
      </colgroup>
      <thead>
        <tr>
          <th style="cursor: pointer;" onclick="sortModulesTable(0)">Name ↕</th>
          <th style="cursor: pointer;" onclick="sortModulesTable(1)">Size ↕</th>
          <th style="cursor: pointer;" onclick="sortModulesTable(2)">Gzipped ↕</th>
          <th style="cursor: pointer;" onclick="sortModulesTable(3)">Brotli ↕</th>
          <th></th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${treemapData.children.map((child: any) => `
          <tr>
            <td>
              ${child.type === 'app'
                ? '<span class="badge badge-app">APP</span> '
                : '<span class="badge badge-npm">NPM</span> '
              }
              <strong>${child.name}</strong>
            </td>
            <td>${formatBytes(child.value)}</td>
            <td>${child.gzip ? formatBytes(child.gzip) : 'N/A'}</td>
            <td>${child.brotli ? formatBytes(child.brotli) : 'N/A'}</td>
            <td></td>
            <td></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  ${dependencyData.length > 0 ? `
  <h2>Dependencies</h2>
  <div class="dependency-table">
    <table>
      <colgroup>
        <col style="width: 30%;">
        <col style="width: 14%;">
        <col style="width: 14%;">
        <col style="width: 14%;">
        <col style="width: 14%;">
        <col style="width: 14%;">
      </colgroup>
      <thead>
        <tr>
          <th>Package</th>
          <th>Size</th>
          <th>Gzipped</th>
          <th>% of Total</th>
          <th>Modules</th>
          <th>Tree-shakeable</th>
        </tr>
      </thead>
      <tbody>
        ${dependencyData.slice(0, 20).map((dep: any) => `
          <tr>
            <td>
              ${dep.name === 'your-app'
                ? '<span class="badge badge-app">APP</span> '
                : '<span class="badge badge-npm">NPM</span> '
              }
              <strong>${dep.name}</strong>
              ${dep.duplicate ? ' <span style="color: #ef4444;">DUPLICATE</span>' : ''}
            </td>
            <td>${formatBytes(dep.totalSize)}</td>
            <td>${dep.gzipSize ? formatBytes(dep.gzipSize) : 'N/A'}</td>
            <td>${dep.percentOfTotal?.toFixed(1)}%</td>
            <td>${dep.moduleCount}</td>
            <td>${dep.treeshakeable === true ? 'Yes' : dep.treeshakeable === false ? 'No' : 'Unknown'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  ${sourceFileData.length > 0 ? `
    <h2>Source Files (via Source Maps)</h2>
    <p style="color: #64748b; margin-bottom: 1rem; font-size: 0.95em;">
      Note: These sizes represent original source code before minification and tree-shaking.
      The actual bundled sizes are shown in the Dependencies and Bundle Composition sections above.
    </p>
    <div class="dependency-table">
      <table>
        <colgroup>
          <col style="width: 30%;">
          <col style="width: 14%;">
          <col style="width: 14%;">
          <col style="width: 14%;">
          <col style="width: 14%;">
          <col style="width: 14%;">
        </colgroup>
        <thead>
          <tr>
            <th>File Path</th>
            <th>Size</th>
            <th>Lines</th>
            <th>Package</th>
            <th></th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${sourceFileData.slice(0, 20).map((file: any) => `
            <tr>
              <td>
                ${file.package === 'your-app'
                  ? '<span class="badge badge-app">APP</span> '
                  : '<span class="badge badge-npm">NPM</span> '
                }
                ${file.path}
              </td>
              <td>${formatBytes(file.size)}</td>
              <td>${file.lines || 'N/A'}</td>
              <td>${file.package}</td>
              <td></td>
              <td></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  ` : ''}

  <script>
    // Theme toggle
    function toggleTheme() {
      document.body.classList.toggle('light');
      const btn = document.querySelector('.theme-btn');
      btn.textContent = document.body.classList.contains('light') ? 'Dark' : 'Light';
    }

    const data = ${JSON.stringify(treemapData)};

    const width = document.getElementById('treemap').clientWidth;
    const height = 350;

    const color = d3.scaleOrdinal()
      .domain(['app', 'npm', 'vendor', 'js', 'css', 'asset', 'html', 'other'])
      .range(['#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#f59e0b', '#06b6d4', '#f97316', '#64748b']);

    const treemap = d3.treemap()
      .size([width, height])
      .padding(1)
      .round(true);

    const root = d3.hierarchy(data)
      .sum(d => d.value) // Use exact sizes
      .sort((a, b) => b.value - a.value);

    treemap(root);

    const svg = d3.select('#treemap')
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const tooltip = d3.select('body')
      .append('div')
      .attr('class', 'tooltip');

    const nodes = svg.selectAll('g')
      .data(root.leaves())
      .join('g')
      .attr('class', 'node')
      .attr('transform', d => \`translate(\${d.x0},\${d.y0})\`);

    nodes.append('rect')
      .attr('width', d => d.x1 - d.x0)
      .attr('height', d => d.y1 - d.y0)
      .attr('fill', d => color(d.data.type));

    nodes.append('text')
      .attr('class', 'node-label')
      .attr('x', 4)
      .attr('y', 16)
      .text(d => {
        const width = d.x1 - d.x0;
        return width > 50 ? d.data.name : '';
      });

    nodes.on('mouseover', (event, d) => {
      tooltip
        .style('opacity', 1)
        .html(\`
          <div class="tooltip-title">\${d.data.name}</div>
          <div class="tooltip-size">Size: \${formatBytes(d.data.value)}</div>
          <div class="tooltip-size">Gzip: \${formatBytes(d.data.gzip || 0)}</div>
          <div class="tooltip-size">Brotli: \${formatBytes(d.data.brotli || 0)}</div>
        \`);

      // Smart positioning to keep tooltip in viewport
      const tooltipNode = tooltip.node();
      const tooltipRect = tooltipNode.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Default position: right and below cursor
      let left = event.pageX + 10;
      let top = event.pageY - 28;

      // If tooltip would go off right edge, position to left of cursor
      if (event.clientX + tooltipRect.width + 10 > viewportWidth) {
        left = event.pageX - tooltipRect.width - 10;
      }

      // If tooltip would go off bottom edge, position above cursor
      if (event.clientY + tooltipRect.height > viewportHeight) {
        top = event.pageY - tooltipRect.height - 10;
      }

      // If tooltip would go off top edge, position below cursor
      if (top < 0) {
        top = event.pageY + 10;
      }

      tooltip
        .style('left', left + 'px')
        .style('top', top + 'px');
    })
    .on('mouseout', () => {
      tooltip.style('opacity', 0);
    });

    function formatBytes(bytes) {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
    }

    // Copy all data as markdown
    function copyAll() {
      const metrics = ${JSON.stringify({
        branch: metrics.branch,
        commit: metrics.commit,
        timestamp: metrics.timestamp,
        totalSize: metrics.totalSize,
        totalGzipSize: metrics.totalGzipSize,
        totalBrotliSize: metrics.totalBrotliSize,
        chunkCount: metrics.chunkCount,
      })};

      const modules = data.children || [];
      const deps = ${JSON.stringify(dependencyData.slice(0, 30))};

      let text = \`# Bundle Analysis Report

## Summary
- **Branch:** \${metrics.branch}
- **Commit:** \${metrics.commit.substring(0, 7)}
- **Date:** \${new Date(metrics.timestamp).toLocaleString()}
- **Total Size:** \${formatBytes(metrics.totalSize)}
- **Gzipped:** \${formatBytes(metrics.totalGzipSize || 0)}
- **Brotli:** \${formatBytes(metrics.totalBrotliSize || 0)}
- **Chunks:** \${metrics.chunkCount}

## Bundle Composition
| Module | Type | Size | Gzipped |
|--------|------|------|---------|
\`;

      modules.forEach(m => {
        text += \`| \${m.name} | \${m.type.toUpperCase()} | \${formatBytes(m.value)} | \${formatBytes(m.gzip || 0)} |\\n\`;
      });

      if (deps.length > 0) {
        text += \`
## Top Dependencies
| Package | Size | % of Total | Modules |
|---------|------|------------|---------|
\`;
        deps.forEach(d => {
          text += \`| \${d.name} | \${formatBytes(d.totalSize)} | \${d.percentOfTotal?.toFixed(1)}% | \${d.moduleCount} |\\n\`;
        });
      }

      navigator.clipboard.writeText(text).then(() => {
        const btn = document.querySelector('.copy-btn');
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = 'Copy';
          btn.classList.remove('copied');
        }, 2000);
      });
    }

    // Sort modules table
    let sortDirection = [1, -1, -1, -1]; // 1 = ascending, -1 = descending
    function sortModulesTable(columnIndex) {
      const table = document.getElementById('modules-table');
      const tbody = table.querySelector('tbody');
      const rows = Array.from(tbody.querySelectorAll('tr'));

      sortDirection[columnIndex] *= -1;

      rows.sort((a, b) => {
        const aCell = a.cells[columnIndex].textContent.trim();
        const bCell = b.cells[columnIndex].textContent.trim();

        if (columnIndex === 0) {
          // Name column - text sort
          const aName = aCell.replace(/^(APP|NPM)\\s+/, '');
          const bName = bCell.replace(/^(APP|NPM)\\s+/, '');
          return sortDirection[columnIndex] * aName.localeCompare(bName);
        } else {
          // Size columns - numeric sort
          const parseSize = (str) => {
            if (str === 'N/A') return 0;
            const match = str.match(/([0-9.]+)\\s*(B|KB|MB|GB)/);
            if (!match) return 0;
            const value = parseFloat(match[1]);
            const unit = match[2];
            const multipliers = { B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3 };
            return value * (multipliers[unit] || 1);
          };
          return sortDirection[columnIndex] * (parseSize(aCell) - parseSize(bCell));
        }
      });

      rows.forEach(row => tbody.appendChild(row));
    }
  </script>
</body>
</html>`;
}
