/**
 * HTML template for the dashboard
 * Self-contained with embedded CSS and JS for portability
 */

import type { BuildMetrics } from '@bundlewatch/core';

export interface DashboardData {
  current: BuildMetrics;
  historical?: BuildMetrics[];
  baseline?: BuildMetrics;
}

/**
 * Generate complete HTML dashboard
 */
export function generateDashboardHTML(data: DashboardData): string {
  const dataJson = JSON.stringify(data, null, 2);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bundle Watch Dashboard</title>
  <style>
    ${getStyles()}
  </style>
</head>
<body>
  <div class="dashboard">
    <!-- Header -->
    <header class="header">
      <div class="header-content">
        <h1>📦 Bundle Watch Dashboard</h1>
        <div class="header-meta">
          <span class="branch-badge" id="branch-badge"></span>
          <span class="commit-badge" id="commit-badge"></span>
          <span class="timestamp" id="timestamp"></span>
        </div>
      </div>
    </header>

    <!-- Navigation -->
    <nav class="nav">
      <button class="nav-btn active" data-view="overview">Overview</button>
      <button class="nav-btn" data-view="treemap">Treemap</button>
      <button class="nav-btn" data-view="dependencies">Dependencies</button>
      <button class="nav-btn" data-view="history">History</button>
      <button class="nav-btn" data-view="compare">Compare</button>
    </nav>

    <!-- Main Content -->
    <main class="content">
      <!-- Overview View -->
      <div class="view active" id="overview-view">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">Total Size</div>
            <div class="stat-value" id="total-size">-</div>
            <div class="stat-change" id="total-size-change"></div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Gzipped</div>
            <div class="stat-value" id="gzip-size">-</div>
            <div class="stat-change" id="gzip-change"></div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Brotli</div>
            <div class="stat-value" id="brotli-size">-</div>
            <div class="stat-change" id="brotli-change"></div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Build Time</div>
            <div class="stat-value" id="build-time">-</div>
            <div class="stat-change" id="build-change"></div>
          </div>
        </div>

        <div class="grid-2">
          <div class="card">
            <h2>Bundle Breakdown</h2>
            <canvas id="breakdown-chart"></canvas>
          </div>
          <div class="card">
            <h2>Size Trend</h2>
            <canvas id="trend-chart"></canvas>
          </div>
        </div>

        <div class="card">
          <h2>Bundles</h2>
          <div id="bundles-list"></div>
        </div>

        <div class="grid-2">
          <div class="card" id="warnings-card">
            <h2>⚠️ Warnings</h2>
            <ul id="warnings-list"></ul>
          </div>
          <div class="card" id="recommendations-card">
            <h2>💡 Recommendations</h2>
            <ul id="recommendations-list"></ul>
          </div>
        </div>
      </div>

      <!-- Treemap View -->
      <div class="view" id="treemap-view">
        <div class="card">
          <div class="card-header">
            <h2>🗺️ Bundle Treemap</h2>
            <div class="treemap-controls">
              <label>
                Color by:
                <select id="treemap-color">
                  <option value="size">Size</option>
                  <option value="type">Type</option>
                </select>
              </label>
            </div>
          </div>
          <div id="treemap-container"></div>
          <div id="treemap-tooltip" class="tooltip"></div>
        </div>
      </div>

      <!-- Dependencies View -->
      <div class="view" id="dependencies-view">
        <div class="card">
          <div class="card-header">
            <h2>📚 Dependencies</h2>
            <div class="deps-controls">
              <input type="search" id="deps-search" placeholder="Search dependencies...">
              <select id="deps-sort">
                <option value="size-desc">Size (largest first)</option>
                <option value="size-asc">Size (smallest first)</option>
                <option value="name">Name (A-Z)</option>
              </select>
            </div>
          </div>
          <div id="dependencies-list"></div>
        </div>
      </div>

      <!-- History View -->
      <div class="view" id="history-view">
        <div class="card">
          <h2>📈 Historical Metrics</h2>
          <canvas id="history-chart"></canvas>
        </div>
        <div class="card">
          <h2>Build History</h2>
          <div id="history-table"></div>
        </div>
      </div>

      <!-- Compare View -->
      <div class="view" id="compare-view">
        <div class="card">
          <div class="card-header">
            <h2>🔄 Compare Builds</h2>
            <div class="compare-controls">
              <select id="compare-base">
                <option value="current">Current Build</option>
              </select>
              <span>vs</span>
              <select id="compare-target">
                <option value="baseline">Baseline</option>
              </select>
            </div>
          </div>
          <div id="compare-results"></div>
        </div>
      </div>
    </main>
  </div>

  <!-- Chart.js CDN -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  
  <!-- Dashboard Data -->
  <script>
    window.DASHBOARD_DATA = ${dataJson};
  </script>

  <!-- Dashboard Logic -->
  <script>
    ${getScripts()}
  </script>
</body>
</html>`;
}

/**
 * CSS Styles
 */
function getStyles(): string {
  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    :root {
      --primary: #3b82f6;
      --success: #10b981;
      --warning: #f59e0b;
      --danger: #ef4444;
      --bg: #0f172a;
      --bg-card: #1e293b;
      --bg-hover: #334155;
      --text: #f1f5f9;
      --text-dim: #94a3b8;
      --border: #334155;
      --shadow: rgba(0, 0, 0, 0.3);
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
    }

    .dashboard {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    /* Header */
    .header {
      background: var(--bg-card);
      border-bottom: 1px solid var(--border);
      padding: 1.5rem 2rem;
    }

    .header-content {
      max-width: 1400px;
      margin: 0 auto;
    }

    .header h1 {
      font-size: 1.75rem;
      margin-bottom: 0.5rem;
    }

    .header-meta {
      display: flex;
      gap: 1rem;
      font-size: 0.875rem;
      color: var(--text-dim);
    }

    .branch-badge, .commit-badge {
      background: var(--bg-hover);
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      font-family: 'Courier New', monospace;
    }

    /* Navigation */
    .nav {
      background: var(--bg-card);
      border-bottom: 1px solid var(--border);
      padding: 0 2rem;
      display: flex;
      gap: 0.5rem;
      max-width: 1400px;
      margin: 0 auto;
      width: 100%;
    }

    .nav-btn {
      background: none;
      border: none;
      color: var(--text-dim);
      padding: 1rem 1.5rem;
      cursor: pointer;
      font-size: 0.9rem;
      font-weight: 500;
      border-bottom: 2px solid transparent;
      transition: all 0.2s;
    }

    .nav-btn:hover {
      color: var(--text);
      background: var(--bg-hover);
    }

    .nav-btn.active {
      color: var(--primary);
      border-bottom-color: var(--primary);
    }

    /* Content */
    .content {
      flex: 1;
      max-width: 1400px;
      margin: 0 auto;
      padding: 2rem;
      width: 100%;
    }

    .view {
      display: none;
      animation: fadeIn 0.3s;
    }

    .view.active {
      display: block;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Cards */
    .card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 0.5rem;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 2px 8px var(--shadow);
    }

    .card h2 {
      font-size: 1.25rem;
      margin-bottom: 1rem;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 0.5rem;
      padding: 1.5rem;
      box-shadow: 0 2px 8px var(--shadow);
    }

    .stat-label {
      font-size: 0.875rem;
      color: var(--text-dim);
      margin-bottom: 0.5rem;
    }

    .stat-value {
      font-size: 2rem;
      font-weight: 700;
      color: var(--text);
    }

    .stat-change {
      font-size: 0.875rem;
      margin-top: 0.5rem;
    }

    .stat-change.positive {
      color: var(--danger);
    }

    .stat-change.negative {
      color: var(--success);
    }

    /* Grid Layouts */
    .grid-2 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }

    /* Bundles List */
    .bundle-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      border-bottom: 1px solid var(--border);
    }

    .bundle-item:last-child {
      border-bottom: none;
    }

    .bundle-name {
      font-family: 'Courier New', monospace;
      font-size: 0.875rem;
    }

    .bundle-size {
      font-weight: 600;
      color: var(--primary);
    }

    .bundle-bar {
      height: 8px;
      background: var(--primary);
      border-radius: 4px;
      margin-top: 0.5rem;
      transition: width 0.3s;
    }

    /* Treemap */
    #treemap-container {
      min-height: 600px;
      position: relative;
      background: var(--bg);
      border-radius: 0.5rem;
      overflow: hidden;
    }

    .treemap-rect {
      position: absolute;
      border: 2px solid var(--bg);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: opacity 0.2s;
      overflow: hidden;
      padding: 0.5rem;
    }

    .treemap-rect:hover {
      opacity: 0.8;
      border-color: var(--text);
    }

    .treemap-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: white;
      text-shadow: 0 1px 3px rgba(0,0,0,0.5);
      text-align: center;
      word-break: break-word;
    }

    .tooltip {
      position: fixed;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 0.25rem;
      padding: 0.75rem;
      font-size: 0.875rem;
      pointer-events: none;
      z-index: 1000;
      display: none;
      box-shadow: 0 4px 12px var(--shadow);
    }

    .tooltip.show {
      display: block;
    }

    /* Dependencies */
    .deps-controls {
      display: flex;
      gap: 1rem;
    }

    #deps-search {
      flex: 1;
      padding: 0.5rem 1rem;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 0.25rem;
      color: var(--text);
      font-size: 0.875rem;
    }

    #deps-sort {
      padding: 0.5rem 1rem;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 0.25rem;
      color: var(--text);
      font-size: 0.875rem;
    }

    .dep-item {
      padding: 1rem;
      border-bottom: 1px solid var(--border);
    }

    .dep-item:last-child {
      border-bottom: none;
    }

    .dep-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .dep-name {
      font-weight: 600;
      font-family: 'Courier New', monospace;
    }

    .dep-size {
      font-weight: 700;
      color: var(--primary);
    }

    .dep-duplicate {
      background: var(--danger);
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .dep-meta {
      font-size: 0.875rem;
      color: var(--text-dim);
    }

    /* Forms */
    input, select, button {
      font-family: inherit;
    }

    select {
      cursor: pointer;
    }

    /* Lists */
    ul {
      list-style: none;
    }

    ul li {
      padding: 0.5rem 0;
      color: var(--text-dim);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .header, .nav, .content {
        padding-left: 1rem;
        padding-right: 1rem;
      }

      .grid-2 {
        grid-template-columns: 1fr;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }
    }
  `;
}

/**
 * JavaScript logic
 */
function getScripts(): string {
  return `
    // Dashboard App
    (function() {
      const data = window.DASHBOARD_DATA;
      
      // Utility: Format bytes
      function formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
      }

      // Utility: Format duration
      function formatDuration(ms) {
        if (ms < 1000) return ms + 'ms';
        return (ms / 1000).toFixed(2) + 's';
      }

      // Utility: Format percentage
      function formatPercent(num) {
        const abs = Math.abs(num);
        const sign = num > 0 ? '+' : '';
        return sign + abs.toFixed(1) + '%';
      }

      // Navigation
      document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const view = btn.dataset.view;
          
          // Update nav
          document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          
          // Update view
          document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
          document.getElementById(view + '-view').classList.add('active');
          
          // Render view
          if (view === 'treemap') renderTreemap();
          if (view === 'dependencies') renderDependencies();
          if (view === 'history') renderHistory();
        });
      });

      // Initialize header
      function initHeader() {
        const { current } = data;
        document.getElementById('branch-badge').textContent = current.branch;
        document.getElementById('commit-badge').textContent = current.commit.slice(0, 7);
        document.getElementById('timestamp').textContent = new Date(current.timestamp).toLocaleString();
      }

      // Initialize overview
      function initOverview() {
        const { current, baseline } = data;
        
        // Stats
        document.getElementById('total-size').textContent = formatBytes(current.totalSize);
        document.getElementById('gzip-size').textContent = formatBytes(current.totalGzipSize);
        document.getElementById('brotli-size').textContent = formatBytes(current.totalBrotliSize);
        document.getElementById('build-time').textContent = formatDuration(current.buildDuration);
        
        // Changes
        if (baseline) {
          const sizeChange = ((current.totalSize - baseline.totalSize) / baseline.totalSize * 100);
          const gzipChange = ((current.totalGzipSize - baseline.totalGzipSize) / baseline.totalGzipSize * 100);
          const brotliChange = ((current.totalBrotliSize - baseline.totalBrotliSize) / baseline.totalBrotliSize * 100);
          const timeChange = ((current.buildDuration - baseline.buildDuration) / baseline.buildDuration * 100);
          
          setChange('total-size-change', sizeChange);
          setChange('gzip-change', gzipChange);
          setChange('brotli-change', brotliChange);
          setChange('build-change', timeChange);
        }
        
        // Bundles list
        const bundlesList = document.getElementById('bundles-list');
        const maxSize = Math.max(...current.bundles.map(b => b.size));
        
        bundlesList.innerHTML = current.bundles
          .sort((a, b) => b.size - a.size)
          .map(bundle => {
            const percent = (bundle.size / maxSize * 100);
            return \`
              <div class="bundle-item">
                <div style="flex: 1;">
                  <div class="bundle-name">\${bundle.name}</div>
                  <div class="bundle-bar" style="width: \${percent}%"></div>
                </div>
                <div class="bundle-size">\${formatBytes(bundle.size)}</div>
              </div>
            \`;
          }).join('');
        
        // Warnings
        const warningsList = document.getElementById('warnings-list');
        if (current.warnings.length === 0) {
          document.getElementById('warnings-card').style.display = 'none';
        } else {
          warningsList.innerHTML = current.warnings.map(w => \`<li>⚠️ \${w}</li>\`).join('');
        }
        
        // Recommendations
        const recList = document.getElementById('recommendations-list');
        if (current.recommendations.length === 0) {
          document.getElementById('recommendations-card').style.display = 'none';
        } else {
          recList.innerHTML = current.recommendations.map(r => \`<li>💡 \${r}</li>\`).join('');
        }
        
        // Charts
        renderBreakdownChart();
        renderTrendChart();
      }

      function setChange(id, percent) {
        const el = document.getElementById(id);
        el.textContent = formatPercent(percent);
        el.className = 'stat-change ' + (percent > 0 ? 'positive' : 'negative');
      }

      // Breakdown Chart
      function renderBreakdownChart() {
        const { current } = data;
        const ctx = document.getElementById('breakdown-chart');
        
        new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['JavaScript', 'CSS', 'Images', 'Fonts', 'Other'],
            datasets: [{
              data: [
                current.byType.javascript,
                current.byType.css,
                current.byType.images,
                current.byType.fonts,
                current.byType.other
              ],
              backgroundColor: [
                '#3b82f6',
                '#10b981',
                '#f59e0b',
                '#ef4444',
                '#8b5cf6'
              ]
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: {
                position: 'bottom',
                labels: { color: '#f1f5f9' }
              },
              tooltip: {
                callbacks: {
                  label: (ctx) => ctx.label + ': ' + formatBytes(ctx.raw)
                }
              }
            }
          }
        });
      }

      // Trend Chart
      function renderTrendChart() {
        const { historical, current } = data;
        const ctx = document.getElementById('trend-chart');
        
        const commits = historical || [current];
        const labels = commits.map(m => m.commit.slice(0, 7));
        const sizes = commits.map(m => m.totalSize / 1024); // KB
        
        new Chart(ctx, {
          type: 'line',
          data: {
            labels,
            datasets: [{
              label: 'Bundle Size (KB)',
              data: sizes,
              borderColor: '#3b82f6',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              tension: 0.3,
              fill: true
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: {
                labels: { color: '#f1f5f9' }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: { color: '#94a3b8' },
                grid: { color: '#334155' }
              },
              x: {
                ticks: { color: '#94a3b8' },
                grid: { color: '#334155' }
              }
            }
          }
        });
      }

      // Treemap
      function renderTreemap() {
        const { current } = data;
        const container = document.getElementById('treemap-container');
        const tooltip = document.getElementById('treemap-tooltip');
        
        container.innerHTML = '';
        
        const width = container.clientWidth;
        const height = 600;
        
        // Prepare data
        const items = current.bundles.map(b => ({
          name: b.name,
          size: b.size,
          type: b.type
        }));
        
        // Simple treemap layout (squarified)
        const total = items.reduce((sum, item) => sum + item.size, 0);
        let x = 0, y = 0, rowHeight = 0;
        const rects = [];
        
        items.forEach(item => {
          const area = (item.size / total) * width * height;
          const w = Math.min(width - x, Math.sqrt(area * (width / height)));
          const h = area / w;
          
          rects.push({ ...item, x, y, w, h });
          
          x += w;
          if (x >= width - 10) {
            x = 0;
            y += rowHeight;
            rowHeight = 0;
          }
          rowHeight = Math.max(rowHeight, h);
        });
        
        // Render
        const colors = {
          js: '#3b82f6',
          css: '#10b981',
          asset: '#f59e0b',
          html: '#8b5cf6',
          other: '#6b7280'
        };
        
        rects.forEach(rect => {
          const div = document.createElement('div');
          div.className = 'treemap-rect';
          div.style.left = rect.x + 'px';
          div.style.top = rect.y + 'px';
          div.style.width = rect.w + 'px';
          div.style.height = rect.h + 'px';
          div.style.background = colors[rect.type] || colors.other;
          
          if (rect.w > 80 && rect.h > 40) {
            const label = document.createElement('div');
            label.className = 'treemap-label';
            label.textContent = rect.name.split('/').pop();
            div.appendChild(label);
          }
          
          div.addEventListener('mouseenter', (e) => {
            tooltip.innerHTML = \`
              <strong>\${rect.name}</strong><br>
              Size: \${formatBytes(rect.size)}<br>
              Type: \${rect.type}
            \`;
            tooltip.classList.add('show');
          });
          
          div.addEventListener('mousemove', (e) => {
            tooltip.style.left = (e.clientX + 10) + 'px';
            tooltip.style.top = (e.clientY + 10) + 'px';
          });
          
          div.addEventListener('mouseleave', () => {
            tooltip.classList.remove('show');
          });
          
          container.appendChild(div);
        });
      }

      // Dependencies
      function renderDependencies() {
        const { current } = data;
        const list = document.getElementById('dependencies-list');
        
        if (!current.dependencies || current.dependencies.length === 0) {
          list.innerHTML = '<p style="padding: 2rem; text-align: center; color: var(--text-dim);">No dependency data available</p>';
          return;
        }
        
        // Find duplicates
        const nameCount = {};
        current.dependencies.forEach(dep => {
          nameCount[dep.name] = (nameCount[dep.name] || 0) + 1;
        });
        
        list.innerHTML = current.dependencies
          .sort((a, b) => b.size - a.size)
          .map(dep => {
            const isDupe = nameCount[dep.name] > 1;
            return \`
              <div class="dep-item">
                <div class="dep-header">
                  <span class="dep-name">\${dep.name}</span>
                  <span class="dep-size">\${formatBytes(dep.size)}</span>
                </div>
                \${isDupe ? '<span class="dep-duplicate">DUPLICATE</span>' : ''}
                <div class="dep-meta">
                  \${dep.version ? 'v' + dep.version : 'unknown version'}
                </div>
              </div>
            \`;
          }).join('');
        
        // Search
        document.getElementById('deps-search').addEventListener('input', (e) => {
          const query = e.target.value.toLowerCase();
          document.querySelectorAll('.dep-item').forEach(item => {
            const name = item.querySelector('.dep-name').textContent.toLowerCase();
            item.style.display = name.includes(query) ? 'block' : 'none';
          });
        });
      }

      // History
      function renderHistory() {
        const { historical, current } = data;
        const ctx = document.getElementById('history-chart');
        
        const commits = historical || [current];
        const labels = commits.map(m => new Date(m.timestamp).toLocaleDateString());
        const sizes = commits.map(m => m.totalSize / 1024);
        const gzip = commits.map(m => m.totalGzipSize / 1024);
        
        new Chart(ctx, {
          type: 'line',
          data: {
            labels,
            datasets: [
              {
                label: 'Total Size (KB)',
                data: sizes,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.3
              },
              {
                label: 'Gzipped (KB)',
                data: gzip,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.3
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: {
                labels: { color: '#f1f5f9' }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: { color: '#94a3b8' },
                grid: { color: '#334155' }
              },
              x: {
                ticks: { color: '#94a3b8' },
                grid: { color: '#334155' }
              }
            }
          }
        });
      }

      // Initialize
      initHeader();
      initOverview();
    })();
  `;
}

