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
  // If we have detailed dependencies, show module composition
  if (metrics.detailedDependencies && metrics.detailedDependencies.length > 0) {
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
      name: 'Bundle Composition',
      children,
    };
  }

  // Fallback to bundle files
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
    name: 'Bundle',
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
    h2 {
      font-size: 1.5rem;
      font-weight: 600;
      margin: 2rem 0 1rem;
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
    .dependency-table {
      width: 100%;
      background: #1e293b;
      border-radius: 0.5rem;
      border: 1px solid #334155;
      overflow: hidden;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th {
      background: #0f172a;
      padding: 1rem;
      text-align: left;
      font-weight: 600;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #94a3b8;
    }
    td {
      padding: 1rem;
      border-top: 1px solid #334155;
    }
    tr:hover {
      background: #0f172a;
    }
    .badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }
    .badge-npm {
      background: #3b82f6;
      color: white;
    }
    .badge-app {
      background: #10b981;
      color: white;
    }
    .badge-vendor {
      background: #8b5cf6;
      color: white;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Bundle Watch Dashboard</h1>
    <p style="color: #94a3b8;">
      Branch: <strong>${metrics.branch}</strong> |
      Commit: <strong>${metrics.commit.substring(0, 7)}</strong> |
      ${new Date(metrics.timestamp).toLocaleString()}
    </p>
  </div>

  <div class="stats">
    <div class="stat-card">
      <div class="stat-label">Total Size</div>
      <div class="stat-value">${formatBytes(metrics.totalSize)}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Gzipped</div>
      <div class="stat-value">${formatBytes(metrics.totalGzipSize || 0)}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Brotli</div>
      <div class="stat-value">${formatBytes(metrics.totalBrotliSize || 0)}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Chunks</div>
      <div class="stat-value">${metrics.chunkCount}</div>
    </div>
    ${metrics.modules ? `
    <div class="stat-card">
      <div class="stat-label">Modules</div>
      <div class="stat-value">${metrics.modules.length}</div>
    </div>
    ` : ''}
  </div>

  <h2>Bundle Treemap</h2>
  <div id="treemap" class="treemap"></div>

  ${treemapData.children && treemapData.children.length > 0 ? `
  <h2>All Modules</h2>
  <div class="dependency-table">
    <table id="modules-table">
      <thead>
        <tr>
          <th style="cursor: pointer;" onclick="sortModulesTable(0)">Name ↕</th>
          <th style="cursor: pointer;" onclick="sortModulesTable(1)">Size ↕</th>
          <th style="cursor: pointer;" onclick="sortModulesTable(2)">Gzipped ↕</th>
          <th style="cursor: pointer;" onclick="sortModulesTable(3)">Brotli ↕</th>
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
              ${dep.duplicate ? ' <span style="color: #ef4444;">⚠️ DUPLICATE</span>' : ''}
            </td>
            <td>${formatBytes(dep.totalSize)}</td>
            <td>${dep.gzipSize ? formatBytes(dep.gzipSize) : 'N/A'}</td>
            <td>${dep.percentOfTotal?.toFixed(1)}%</td>
            <td>${dep.moduleCount}</td>
            <td>${dep.treeshakeable ? '✅ Yes' : '❌ No'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  ${sourceFileData.length > 0 ? `
    <h2>Source Files (via Source Maps)</h2>
    <div class="dependency-table">
      <table>
        <thead>
          <tr>
            <th>File Path</th>
            <th>Size</th>
            <th>Lines</th>
            <th>Package</th>
          </tr>
        </thead>
        <tbody>
          ${sourceFileData.slice(0, 20).map((file: any) => `
            <tr>
              <td style="font-family: monospace; font-size: 0.9em;">
                ${file.package === 'your-app'
                  ? '<span class="badge badge-app">APP</span> '
                  : '<span class="badge badge-npm">NPM</span> '
                }
                ${file.path}
              </td>
              <td>${formatBytes(file.size)}</td>
              <td>${file.lines || 'N/A'}</td>
              <td>${file.package}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  ` : ''}

  <script>
    const data = ${JSON.stringify(treemapData)};

    const width = document.getElementById('treemap').clientWidth;
    const height = 600;

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
