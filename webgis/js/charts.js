/**
 * charts.js — All Chart.js chart renderers
 * GeoAI Cape Town WebGIS
 */

'use strict';

const Charts = (() => {

  // Chart registry to prevent duplicate renders
  const _registry = {};

  /**
   * Destroy a chart if it already exists
   * @param {string} id - canvas element id
   */
  function destroyChart(id) {
    if (_registry[id]) {
      _registry[id].destroy();
      delete _registry[id];
    }
  }

  /**
   * Get base Chart.js options for consistent theming
   */
  function getBaseOptions(overrides = {}) {
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const textColor   = isDark ? '#ffffff'              : '#1b1b1d';   // near-white / near-black
    const labelColor  = isDark ? '#c8d0df'              : '#2d2f33';   // secondary labels
    const gridColor   = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

    return {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          labels: {
            color: textColor,
            font: { family: "'Inter', sans-serif", size: 12 },
            padding: 16,
            usePointStyle: true,
            pointStyleWidth: 10,
          },
        },
        tooltip: {
          backgroundColor: isDark ? '#1a2236' : '#ffffff',
          titleColor: isDark ? '#ffffff' : '#0d0d0d',
          bodyColor:  isDark ? '#c8d0df' : '#2d2f33',
          borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
          titleFont: { family: "'Space Grotesk', sans-serif", weight: 'bold', size: 13 },
          bodyFont:  { family: "'Inter', sans-serif", size: 12 },
        },
      },
      scales: {
        x: {
          ticks: { color: labelColor, font: { family: "'Inter', sans-serif", size: 11 } },
          grid:  { color: gridColor },
        },
        y: {
          ticks: { color: labelColor, font: { family: "'Inter', sans-serif", size: 11 } },
          grid:  { color: gridColor },
        },
        ...overrides.scales,
      },
      ...overrides,
    };
  }

  // -------------------------------------------------------
  // CONFUSION MATRIX (custom HTML grid, not Chart.js)
  // -------------------------------------------------------
  /**
   * Render a 2×2 confusion matrix as an HTML grid
   * @param {string} containerId
   * @param {number[][]} matrix - [[TP, FP], [FN, TN]] style
   * @param {string[]} labels
   */
  function renderConfusionMatrix(containerId, matrix, labels = ['Vegetation', 'Non-Vegetation']) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const total = matrix.flat().reduce((a, b) => a + b, 0);

    container.innerHTML = `
      <div style="display:grid;grid-template-columns:auto auto 1fr 1fr;gap:6px;align-items:center;max-width:400px;margin:0 auto;">
        <!-- Header row -->
        <div></div>
        <div></div>
        <div style="text-align:center;font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted);padding:0 0 6px;">
          Predicted<br>Positive
        </div>
        <div style="text-align:center;font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted);padding:0 0 6px;">
          Predicted<br>Negative
        </div>
        <!-- Actual Positive row -->
        <div style="writing-mode:vertical-rl;transform:rotate(180deg);font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted);text-align:center;">
          Actual
        </div>
        <div style="font-size:0.78rem;color:var(--text-secondary);font-weight:600;white-space:nowrap;padding-right:8px;">
          Positive
        </div>
        <div style="aspect-ratio:1;background:rgba(16,185,129,0.2);border:2px solid rgba(16,185,129,0.4);border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:1rem;">
          <div style="font-size:1.8rem;font-weight:800;color:#10b981;font-family:'Space Grotesk',sans-serif;">${matrix[0][0]}</div>
          <div style="font-size:0.65rem;color:var(--text-muted);font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">True Pos</div>
          <div style="font-size:0.7rem;color:#10b981;font-weight:600;margin-top:2px;">${((matrix[0][0]/total)*100).toFixed(1)}%</div>
        </div>
        <div style="aspect-ratio:1;background:rgba(239,68,68,0.1);border:2px solid rgba(239,68,68,0.25);border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:1rem;">
          <div style="font-size:1.8rem;font-weight:800;color:#ef4444;font-family:'Space Grotesk',sans-serif;">${matrix[0][1]}</div>
          <div style="font-size:0.65rem;color:var(--text-muted);font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">False Neg</div>
          <div style="font-size:0.7rem;color:#ef4444;font-weight:600;margin-top:2px;">${((matrix[0][1]/total)*100).toFixed(1)}%</div>
        </div>
        <!-- Actual Negative row -->
        <div></div>
        <div style="font-size:0.78rem;color:var(--text-secondary);font-weight:600;white-space:nowrap;padding-right:8px;">
          Negative
        </div>
        <div style="aspect-ratio:1;background:rgba(239,68,68,0.1);border:2px solid rgba(239,68,68,0.25);border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:1rem;">
          <div style="font-size:1.8rem;font-weight:800;color:#ef4444;font-family:'Space Grotesk',sans-serif;">${matrix[1][0]}</div>
          <div style="font-size:0.65rem;color:var(--text-muted);font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">False Pos</div>
          <div style="font-size:0.7rem;color:#ef4444;font-weight:600;margin-top:2px;">${((matrix[1][0]/total)*100).toFixed(1)}%</div>
        </div>
        <div style="aspect-ratio:1;background:rgba(16,185,129,0.2);border:2px solid rgba(16,185,129,0.4);border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:1rem;">
          <div style="font-size:1.8rem;font-weight:800;color:#10b981;font-family:'Space Grotesk',sans-serif;">${matrix[1][1]}</div>
          <div style="font-size:0.65rem;color:var(--text-muted);font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">True Neg</div>
          <div style="font-size:0.7rem;color:#10b981;font-weight:600;margin-top:2px;">${((matrix[1][1]/total)*100).toFixed(1)}%</div>
        </div>
      </div>
    `;
  }

  // -------------------------------------------------------
  // RADAR CHART (Model metrics comparison)
  // -------------------------------------------------------
  function renderRadarChart(canvasId, metrics) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const tc  = isDark ? '#c8d0df' : '#2d2f33';
    const grid = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

    _registry[canvasId] = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['Accuracy', 'Precision', 'Recall', 'F1 Score'],
        datasets: [{
          label: 'Random Forest',
          data: [metrics.accuracy, metrics.precision, metrics.recall, metrics.f1_score],
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          borderColor: '#10b981',
          pointBackgroundColor: '#10b981',
          pointBorderColor: isDark ? '#111827' : '#ffffff',
          pointHoverBackgroundColor: isDark ? '#ffffff' : '#111827',
          pointHoverBorderColor: '#10b981',
          borderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: isDark ? '#1a2236' : '#ffffff',
            titleColor: isDark ? '#ffffff' : '#0d0d0d',
            bodyColor: isDark ? '#c8d0df' : '#2d2f33',
            callbacks: {
              label: ctx => ` ${ctx.parsed.r.toFixed(1)}%`,
            },
          },
        },
        scales: {
          r: {
            min: 70,
            max: 100,
            ticks: {
              color: tc,
              backdropColor: 'transparent',
              font: { size: 10 },
              stepSize: 10,
              callback: v => v + '%',
            },
            grid: { color: grid },
            pointLabels: {
              color: tc,
              font: { family: "'Inter', sans-serif", size: 12, weight: '600' },
            },
            angleLines: { color: grid },
          },
        },
      },
    });
  }

  // -------------------------------------------------------
  // BAR CHART — Model Metrics
  // -------------------------------------------------------
  function renderMetricsBarChart(canvasId, metrics) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const tc   = isDark ? '#c8d0df' : '#2d2f33';
    const grid = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

    _registry[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Accuracy', 'Precision', 'Recall', 'F1 Score'],
        datasets: [{
          label: 'Score (%)',
          data: [metrics.accuracy, metrics.precision, metrics.recall, metrics.f1_score],
          backgroundColor: [
            'rgba(16, 185, 129, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(139, 92, 246, 0.8)',
          ],
          borderColor: [
            '#10b981',
            '#3b82f6',
            '#f59e0b',
            '#8b5cf6',
          ],
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        }],
      },
      options: {
        ...getBaseOptions(),
        plugins: {
          ...getBaseOptions().plugins,
          legend: { display: false },
        },
        scales: {
          y: {
            min: 70,
            max: 100,
            ticks: {
              color: tc,
              callback: v => v + '%',
            },
            grid: { color: grid },
          },
          x: {
            ticks: { color: tc },
            grid: { display: false },
          },
        },
      },
    });
  }

  // -------------------------------------------------------
  // PIE CHART — Sample Distribution
  // -------------------------------------------------------
  function renderSamplePieChart(canvasId, metrics) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const tc = isDark ? '#c8d0df' : '#2d2f33';

    _registry[canvasId] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Training Samples', 'Testing Samples'],
        datasets: [{
          data: [metrics.training_samples, metrics.testing_samples],
          backgroundColor: ['rgba(16, 185, 129, 0.85)', 'rgba(59, 130, 246, 0.85)'],
          borderColor: ['#10b981', '#3b82f6'],
          borderWidth: 2,
          hoverOffset: 8,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '68%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: tc,
              font: { family: "'Inter', sans-serif", size: 12 },
              padding: 16,
              usePointStyle: true,
            },
          },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.label}: ${ctx.raw} (${((ctx.raw / metrics.total_samples) * 100).toFixed(1)}%)`,
            },
          },
        },
      },
    });
  }

  // -------------------------------------------------------
  // BAR CHART — Vegetation Area Comparison
  // -------------------------------------------------------
  function renderVegAreaBarChart(canvasId, stats) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const tc   = isDark ? '#c8d0df' : '#2d2f33';
    const grid = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

    _registry[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['2024', '2025'],
        datasets: [{
          label: 'Vegetation Area (ha)',
          data: [stats.vegetation_2024, stats.vegetation_2025],
          backgroundColor: [
            'rgba(26, 150, 65, 0.8)',
            'rgba(101, 163, 13, 0.8)',
          ],
          borderColor: ['#1a9641', '#65a30d'],
          borderWidth: 2,
          borderRadius: 10,
          borderSkipped: false,
        }],
      },
      options: {
        ...getBaseOptions(),
        plugins: {
          ...getBaseOptions().plugins,
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => ` ${Utils.formatNumber(ctx.raw)} ha`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: false,
            min: Math.round(stats.vegetation_2025 * 0.85),
            ticks: {
              color: tc,
              callback: v => Utils.formatNumber(v),
            },
            grid: { color: grid },
          },
          x: {
            ticks: { color: tc },
            grid: { display: false },
          },
        },
      },
    });
  }

  // -------------------------------------------------------
  // DONUT CHART — Change Breakdown (Gain vs Loss)
  // -------------------------------------------------------
  function renderChangeDonutChart(canvasId, stats) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const tc = isDark ? '#c8d0df' : '#2d2f33';

    _registry[canvasId] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Vegetation Gain', 'Vegetation Loss', 'Stable Vegetation'],
        datasets: [{
          data: [
            stats.gain,
            stats.loss,
            stats.vegetation_2025 - stats.gain,
          ],
          backgroundColor: [
            'rgba(77, 175, 74, 0.85)',
            'rgba(228, 26, 28, 0.85)',
            'rgba(26, 150, 65, 0.85)',
          ],
          borderColor: ['#4daf4a', '#e41a1c', '#1a9641'],
          borderWidth: 2,
          hoverOffset: 10,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: tc,
              font: { family: "'Inter', sans-serif", size: 11 },
              padding: 12,
              usePointStyle: true,
            },
          },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.label}: ${Utils.formatNumber(ctx.raw)} ha`,
            },
          },
        },
      },
    });
  }

  // -------------------------------------------------------
  // HORIZONTAL BAR CHART — Feature Importance (mock ranking)
  // -------------------------------------------------------
  function renderFeatureChart(canvasId, features) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const tc   = isDark ? '#c8d0df' : '#2d2f33';
    const grid = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

    // Exact feature importance values from GEE Random Forest classification
    const importanceMap = {
      NDVI: 0.4626,
      B2:   0.3245,
      B12:  0.2986,
      B3:   0.2878,
      B4:   0.2736,
      B8:   0.2695,
      B11:  0.2355
    };
    
    // Sort features by importance in descending order
    const sortedFeatures = [...features].sort((a, b) => (importanceMap[b] || 0) - (importanceMap[a] || 0));
    const vals = sortedFeatures.map(f => importanceMap[f] ?? 0.05);

    _registry[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: sortedFeatures,
        datasets: [{
          label: 'Relative Importance',
          data: vals,
          backgroundColor: sortedFeatures.map((_, i) => `hsla(${160 - i * 15}, 70%, 50%, 0.8)`),
          borderRadius: 6,
          borderSkipped: false,
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => ` ${(ctx.raw * 100).toFixed(2)}%`,
            },
          },
        },
        scales: {
          x: {
            ticks: { color: tc, callback: v => `${(v * 100).toFixed(0)}%` },
            grid: { color: grid },
          },
          y: {
            ticks: { color: tc, font: { weight: '600' } },
            grid: { display: false },
          },
        },
      },
    });
  }

  // -------------------------------------------------------
  // PIE CHART — Confusion Matrix Distribution (TP/TN/FP/FN)
  // -------------------------------------------------------
  function renderConfusionPieChart(canvasId, matrix) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const tc = isDark ? '#c8d0df' : '#2d2f33';

    const TP = matrix[0][0];
    const FN = matrix[0][1];
    const FP = matrix[1][0];
    const TN = matrix[1][1];

    _registry[canvasId] = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['True Positive', 'True Negative', 'False Positive', 'False Negative'],
        datasets: [{
          data: [TP, TN, FP, FN],
          backgroundColor: [
            'rgba(16, 185, 129, 0.85)',
            'rgba(59, 130, 246, 0.85)',
            'rgba(239, 68, 68, 0.75)',
            'rgba(245, 158, 11, 0.75)',
          ],
          borderColor: ['#10b981', '#3b82f6', '#ef4444', '#f59e0b'],
          borderWidth: 2,
          hoverOffset: 8,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: tc,
              font: { family: "'Inter', sans-serif", size: 11 },
              padding: 14,
              usePointStyle: true,
            },
          },
          tooltip: {
            callbacks: {
              label: ctx => {
                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                return ` ${ctx.label}: ${ctx.raw} (${((ctx.raw / total) * 100).toFixed(1)}%)`;
              },
            },
          },
        },
      },
    });
  }

  // -------------------------------------------------------
  // COMPARISON CHART — Gain vs Loss (Horizontal Bar)
  // -------------------------------------------------------
  function renderComparisonChart(canvasId, stats) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const tc   = isDark ? '#c8d0df' : '#2d2f33';
    const grid = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

    _registry[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Vegetation Gain', 'Vegetation Loss', 'Net Change'],
        datasets: [{
          label: 'Area (ha)',
          data: [stats.gain, stats.loss, Math.abs(stats.net_change)],
          backgroundColor: [
            'rgba(77, 175, 74, 0.85)',
            'rgba(228, 26, 28, 0.85)',
            'rgba(239, 68, 68, 0.65)',
          ],
          borderColor: ['#4daf4a', '#e41a1c', '#ef4444'],
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => ` ${Utils.formatNumber(ctx.raw)} ha`,
            },
          },
        },
        scales: {
          x: {
            ticks: {
              color: tc,
              callback: v => Utils.formatNumber(v),
            },
            grid: { color: grid },
          },
          y: {
            ticks: { color: tc, font: { weight: '600', size: 12 } },
            grid: { display: false },
          },
        },
      },
    });
  }

  // -------------------------------------------------------
  // Public API
  // -------------------------------------------------------
  return {
    renderConfusionMatrix,
    renderRadarChart,
    renderMetricsBarChart,
    renderSamplePieChart,
    renderVegAreaBarChart,
    renderChangeDonutChart,
    renderFeatureChart,
    renderConfusionPieChart,
    renderComparisonChart,
    destroyChart,
    getBaseOptions,
  };

})();

window.Charts = Charts;

