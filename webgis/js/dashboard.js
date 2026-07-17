/**
 * dashboard.js — Section content builders
 * GeoAI Cape Town WebGIS
 *
 * Renders the content for each navigation section
 * using data loaded by Loader.
 */

'use strict';

const Dashboard = (() => {

  // -------------------------------------------------------
  // HOME SECTION
  // -------------------------------------------------------
  function renderHome(container, { projectInfo, statistics, metrics }) {
    const stats = statistics;
    const info  = projectInfo;

    container.innerHTML = `
      <!-- Hero -->
      <div class="hero-section">
        <div class="hero-badge">
          <i class="fas fa-satellite-dish"></i>
          GeoAI Final Project
        </div>
        <h1 class="hero-title">
          <span class="gradient-text">Vegetation Change Analysis</span><br>
          <span style="color:var(--text-secondary);font-size:0.7em;font-weight:500;">Cape Town, South Africa</span>
          <span style="color:var(--text-muted);font-size:0.55em;"> (2024–2025)</span>
        </h1>
        <p class="hero-description">
          ${info.description}
        </p>

        <!-- Hero quick stats -->
        <div class="hero-stats-row">
          <div class="hero-stat">
            <span class="stat-num" id="hs-veg24">${Utils.formatNumber(stats.vegetation_2024)}</span>
            <span class="stat-label">Vegetation 2024 (ha)</span>
          </div>
          <div style="width:1px;background:var(--border-color);"></div>
          <div class="hero-stat">
            <span class="stat-num" id="hs-veg25">${Utils.formatNumber(stats.vegetation_2025)}</span>
            <span class="stat-label">Vegetation 2025 (ha)</span>
          </div>
          <div style="width:1px;background:var(--border-color);"></div>
          <div class="hero-stat">
            <span class="stat-num" style="color:#ef4444;">${Utils.formatPct(stats.percentage)}</span>
            <span class="stat-label">Net Change</span>
          </div>
          <div style="width:1px;background:var(--border-color);"></div>
          <div class="hero-stat">
            <span class="stat-num">${metrics.accuracy}%</span>
            <span class="stat-label">Model Accuracy</span>
          </div>
        </div>

        <!-- CTA buttons -->
        <div style="display:flex;gap:0.75rem;flex-wrap:wrap;">
          <button class="btn-primary-custom" onclick="App.navigate('map')" id="btn-explore-map">
            <i class="fas fa-map-marked-alt"></i> Explore Map
          </button>
          <button class="btn-secondary-custom" onclick="App.navigate('model')" id="btn-view-model">
            <i class="fas fa-chart-bar"></i> View Model Results
          </button>
        </div>
      </div>

      <div class="section-container">
        <!-- Study Area info + Objectives -->
        <div class="two-col" style="margin-bottom:1.5rem;">
          <div class="card-glass">
            <div class="card-header-custom">
              <span class="card-title-custom"><i class="fas fa-map-pin"></i> Study Area</span>
              <span class="tag tag-green">Cape Town, ZA</span>
            </div>
            <div class="card-body-custom">
              <ul class="info-list">
                <li><i class="fas fa-globe-africa"></i><span><strong>Location:</strong> ${info.study_area}</span></li>
                <li><i class="fas fa-satellite"></i><span><strong>Satellite:</strong> ${info.satellite}</span></li>
                <li><i class="fas fa-calendar"></i><span><strong>Period:</strong> 2024 – 2025</span></li>
                <li><i class="fas fa-fire"></i><span><strong>Event:</strong> Wildfire impact on vegetation</span></li>
                <li><i class="fas fa-robot"></i><span><strong>Classifier:</strong> ${info.classification_model} (${info.trees} trees)</span></li>
              </ul>
            </div>
          </div>

          <div class="card-glass">
            <div class="card-header-custom">
              <span class="card-title-custom"><i class="fas fa-bullseye"></i> Objectives</span>
            </div>
            <div class="card-body-custom">
              <ul class="info-list">
                <li><i class="fas fa-check-circle"></i><span>Classify vegetation cover using Sentinel-2 imagery</span></li>
                <li><i class="fas fa-check-circle"></i><span>Detect wildfire-driven vegetation change (2024–2025)</span></li>
                <li><i class="fas fa-check-circle"></i><span>Train and evaluate a Random Forest classifier</span></li>
                <li><i class="fas fa-check-circle"></i><span>Visualize spatial change patterns in a WebGIS dashboard</span></li>
                <li><i class="fas fa-check-circle"></i><span>Quantify area-based loss and gain statistics</span></li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Technology Stack -->
        <div class="card-glass">
          <div class="card-header-custom">
            <span class="card-title-custom"><i class="fas fa-layer-group"></i> Technology Stack</span>
          </div>
          <div class="card-body-custom">
            <div class="tech-grid">
              ${[
                { icon: 'fa-satellite',    label: 'Sentinel-2',           color: '#3b82f6' },
                { icon: 'fa-robot',        label: 'Random Forest',        color: '#10b981' },
                { icon: 'fa-globe',        label: 'Google Earth Engine',  color: '#f59e0b' },
                { icon: 'fa-map',          label: 'Leaflet.js',           color: '#10b981' },
                { icon: 'fa-chart-bar',    label: 'Chart.js',             color: '#8b5cf6' },
                { icon: 'fa-file-code',    label: 'GeoJSON',              color: '#14b8a6' },
                { icon: 'fa-image',        label: 'GeoTIFF',              color: '#f97316' },
                { icon: 'fa-code',         label: 'HTML5 / CSS3',         color: '#ef4444' },
                { icon: 'fa-js',           label: 'JavaScript ES6+',      color: '#eab308' },
                { icon: 'fa-bootstrap',    label: 'Bootstrap 5',          color: '#7c3aed' },
              ].map(t => `
                <span class="tech-badge">
                  <i class="fas ${t.icon}" style="color:${t.color};"></i>
                  ${t.label}
                </span>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    // Add button styles if not already in CSS
    _injectButtonStyles();
  }

  // -------------------------------------------------------
  // DATA & PROCESS SECTION
  // -------------------------------------------------------
  function renderDataProcess(container, { metrics, projectInfo }) {
    const paths = Loader.getDataPaths();
    const m = metrics;

    container.innerHTML = `
      <div class="section-banner">
        <div class="section-banner-label"><i class="fas fa-database"></i> Data &amp; Process</div>
        <h2 class="section-banner-title">Dataset &amp; Model Configuration</h2>
        <p class="section-banner-desc">
          Remote sensing data acquisition, preprocessing pipeline, and machine learning setup for the Random Forest classifier.
        </p>
      </div>

      <div class="section-container">

        <!-- Satellite & Acquisition Info -->
        <div class="card-glass" style="margin-bottom:1.5rem;">
          <div class="card-header-custom">
            <span class="card-title-custom"><i class="fas fa-satellite"></i> Satellite &amp; Acquisition</span>
            <span class="tag tag-blue">Sentinel-2</span>
          </div>
          <div class="card-body-custom" style="padding:0;">
            <table class="data-table">
              <thead><tr><th>Parameter</th><th>Value</th></tr></thead>
              <tbody>
                <tr><td><strong>Satellite</strong></td><td>Sentinel-2 SR Harmonized</td></tr>
                <tr><td><strong>Study Period</strong></td><td>2024 &ndash; 2025</td></tr>
                <tr><td><strong>Cloud Masking</strong></td><td>QA60 band cloud/shadow mask applied</td></tr>
                <tr><td><strong>Composite Method</strong></td><td>Median composite (cloud-free pixels)</td></tr>
                <tr><td><strong>Bands Used</strong></td><td>${m.features.join(', ')}</td></tr>
                <tr><td><strong>Ground Truth</strong></td><td>${m.total_samples} Samples</td></tr>
                <tr><td><strong>Train / Test Split</strong></td><td>${m.training_samples} Training / ${m.testing_samples} Testing (70 : 30)</td></tr>
                <tr><td><strong>Seed</strong></td><td>${m.seed}</td></tr>
                <tr><td><strong>Classifier</strong></td><td>${m.model} &mdash; ${m.trees} Trees</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Model Config KPIs -->
        <div class="kpi-grid" style="margin-bottom:1.5rem;">
          ${_kpiCard('Total Samples', m.total_samples, 'fa-database', '#3b82f6', '')}
          ${_kpiCard('Training Samples', m.training_samples, 'fa-graduation-cap', '#10b981', `${((m.training_samples/m.total_samples)*100).toFixed(0)}% of total`)}
          ${_kpiCard('Testing Samples', m.testing_samples, 'fa-vial', '#f59e0b', `${((m.testing_samples/m.total_samples)*100).toFixed(0)}% of total`)}
          ${_kpiCard('Number of Trees', m.trees, 'fa-tree', '#1a9641', 'Random Forest')}
          ${_kpiCard('Random Seed', m.seed, 'fa-random', '#8b5cf6', 'Reproducibility')}
          ${_kpiCard('Feature Bands', m.features.length, 'fa-layer-group', '#14b8a6', 'Sentinel-2')}
        </div>

        <div class="two-col" style="margin-bottom:1.5rem;">
          <!-- Ground Truth Samples Breakdown -->
          <div class="card-glass">
            <div class="card-header-custom">
              <span class="card-title-custom"><i class="fas fa-database"></i> Ground Truth Samples</span>
              <span class="tag tag-blue">Total: ${m.ground_truth.total}</span>
            </div>
            <div class="card-body-custom">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
                <div style="padding:1rem;background:var(--bg-base);border-radius:8px;border:1px solid var(--border-color);">
                  <div style="font-size:0.9rem;font-weight:700;color:var(--text-primary);border-bottom:1px solid var(--border-color);padding-bottom:0.4rem;margin-bottom:0.5rem;display:flex;align-items:center;gap:0.4rem;">
                    <i class="fas fa-calendar-alt" style="color:var(--brand-primary);"></i> 2024 Extent
                  </div>
                  <div style="display:flex;justify-content:space-between;font-size:0.8rem;margin-bottom:0.35rem;">
                    <span style="color:var(--text-secondary);">Vegetation (Class 1):</span>
                    <strong style="color:var(--kpi-green);margin-left:auto;">${m.ground_truth.class1_2024} samples</strong>
                  </div>
                  <div style="display:flex;justify-content:space-between;font-size:0.8rem;">
                    <span style="color:var(--text-secondary);">Non-Vegetation (Class 0):</span>
                    <strong style="color:var(--text-muted);margin-left:auto;">${m.ground_truth.class0_2024} samples</strong>
                  </div>
                </div>
                <div style="padding:1rem;background:var(--bg-base);border-radius:8px;border:1px solid var(--border-color);">
                  <div style="font-size:0.9rem;font-weight:700;color:var(--text-primary);border-bottom:1px solid var(--border-color);padding-bottom:0.4rem;margin-bottom:0.5rem;display:flex;align-items:center;gap:0.4rem;">
                    <i class="fas fa-calendar-alt" style="color:var(--brand-primary);"></i> 2025 Extent
                  </div>
                  <div style="display:flex;justify-content:space-between;font-size:0.8rem;margin-bottom:0.35rem;">
                    <span style="color:var(--text-secondary);">Vegetation (Class 1):</span>
                    <strong style="color:var(--kpi-green);margin-left:auto;">${m.ground_truth.class1_2025} samples</strong>
                  </div>
                  <div style="display:flex;justify-content:space-between;font-size:0.8rem;">
                    <span style="color:var(--text-secondary);">Non-Vegetation (Class 0):</span>
                    <strong style="color:var(--text-muted);margin-left:auto;">${m.ground_truth.class0_2025} samples</strong>
                  </div>
                </div>
              </div>
              <p style="font-size:0.75rem;color:var(--text-muted);margin-top:0.85rem;line-height:1.4;margin-bottom:0;">
                * Balanced dataset collected across Cape Town municipal area to ensure unbiased model training.
              </p>
            </div>
          </div>

          <!-- Dataset Split -->
          <div class="card-glass">
            <div class="card-header-custom">
              <span class="card-title-custom"><i class="fas fa-chart-pie"></i> Dataset Split</span>
              <span class="tag tag-green">70% Train / 30% Test</span>
            </div>
            <div class="card-body-custom">
              <div style="display:flex;flex-direction:column;gap:0.85rem;">
                <div>
                  <div style="display:flex;justify-content:space-between;font-size:0.82rem;font-weight:600;margin-bottom:0.3rem;">
                    <span>Training Set (70%)</span>
                    <span style="margin-left:auto;color:var(--kpi-green);">${m.training_samples} samples</span>
                  </div>
                  <div style="height:8px;background:rgba(255,255,255,0.08);border-radius:4px;overflow:hidden;">
                    <div style="height:100%;width:70%;background:linear-gradient(90deg,var(--kpi-green),#81c784);border-radius:4px;"></div>
                  </div>
                </div>
                <div>
                  <div style="display:flex;justify-content:space-between;font-size:0.82rem;font-weight:600;margin-bottom:0.3rem;">
                    <span>Testing Set (30%)</span>
                    <span style="margin-left:auto;color:var(--kpi-blue);">${m.testing_samples} samples</span>
                  </div>
                  <div style="height:8px;background:rgba(255,255,255,0.08);border-radius:4px;overflow:hidden;">
                    <div style="height:100%;width:30%;background:linear-gradient(90deg,var(--kpi-blue),#64b5f6);border-radius:4px;"></div>
                  </div>
                </div>
                
                <!-- Percentage Cards -->
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-top:0.5rem;">
                  <div style="padding:0.75rem;background:var(--bg-base);border-radius:8px;border:1px solid var(--border-color);text-align:center;">
                    <div style="font-size:1.25rem;font-weight:800;color:var(--kpi-green);">70%</div>
                    <div style="font-size:0.7rem;color:var(--text-muted);font-weight:600;text-transform:uppercase;">Training Ratio</div>
                  </div>
                  <div style="padding:0.75rem;background:var(--bg-base);border-radius:8px;border:1px solid var(--border-color);text-align:center;">
                    <div style="font-size:1.25rem;font-weight:800;color:var(--kpi-blue);">30%</div>
                    <div style="font-size:0.7rem;color:var(--text-muted);font-weight:600;text-transform:uppercase;">Testing Ratio</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="two-col" style="margin-bottom:1.5rem;">
          <!-- Input Features -->
          <div class="card-glass">
            <div class="card-header-custom">
              <span class="card-title-custom"><i class="fas fa-layer-group"></i> Input Features</span>
              <span class="tag tag-blue">${m.features.length} bands</span>
            </div>
            <div class="card-body-custom">
              <div style="display:flex;flex-direction:column;gap:0.6rem;">
                ${m.features.map((f, i) => `
                  <div style="display:flex;align-items:center;gap:0.75rem;padding:0.6rem 0.85rem;background:var(--bg-base);border-radius:8px;border:1px solid var(--border-color);">
                    <div style="width:28px;height:28px;border-radius:6px;background:hsl(${160-i*18},70%,45%,0.2);border:1px solid hsl(${160-i*18},70%,45%,0.4);display:flex;align-items:center;justify-content:center;font-size:0.65rem;font-weight:700;color:hsl(${160-i*18},70%,60%);">
                      ${i+1}
                    </div>
                    <div>
                      <div style="font-size:0.88rem;font-weight:700;color:var(--text-primary);">${f}</div>
                      <div style="font-size:0.72rem;color:var(--text-muted);">${_getBandDescription(f)}</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Feature Importance Chart -->
          <div class="card-glass">
            <div class="card-header-custom">
              <span class="card-title-custom"><i class="fas fa-sort-amount-down"></i> Feature Importance</span>
              <span class="tag tag-green">RF Ranking</span>
            </div>
            <div class="card-body-custom">
              <div style="height:300px;">
                <canvas id="chart-feature-importance"></canvas>
              </div>
            </div>
          </div>
        </div>

        <!-- Workflow Image -->
        <div class="card-glass" style="margin-bottom:1.5rem;">
          <div class="card-header-custom">
            <span class="card-title-custom"><i class="fas fa-project-diagram"></i> Processing Workflow</span>
            <span class="tag tag-green">Pipeline</span>
          </div>
          <div class="card-body-custom" style="padding:1rem;">
            <div class="workflow-img-card">
              <img src="assets/workflow.png" alt="GeoAI Processing Workflow"
                   onclick="Dashboard.openLightbox(this.src)" />
            </div>
            <p style="text-align:center;font-size:0.75rem;color:var(--text-muted);margin-top:0.75rem;">
              <i class="fas fa-info-circle" style="margin-right:0.3rem;"></i>
              Click image to enlarge. Data acquisition &rarr; preprocessing &rarr; classification &rarr; change detection pipeline.
            </p>
          </div>
        </div>

        <!-- Data Files -->
        <div class="card-glass" style="margin-bottom:1.5rem;">
          <div class="card-header-custom">
            <span class="card-title-custom"><i class="fas fa-folder-open"></i> Detected Data Files</span>
          </div>
          <div class="card-body-custom" style="padding:0;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>File</th>
                  <th>Type</th>
                  <th>Year</th>
                  <th>Description</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code style="font-size:0.78rem;color:var(--brand-primary);">Classification_CapeTown_2024.tif</code></td>
                  <td><span class="tag tag-amber">GeoTIFF</span></td>
                  <td>2024</td>
                  <td>Vegetation classification raster — Cape Town</td>
                  <td><span class="tag tag-blue">Detected</span></td>
                </tr>
                <tr>
                  <td><code style="font-size:0.78rem;color:var(--brand-primary);">Classification_CapeTown_2025.tif</code></td>
                  <td><span class="tag tag-amber">GeoTIFF</span></td>
                  <td>2025</td>
                  <td>Vegetation classification raster — Cape Town</td>
                  <td><span class="tag tag-blue">Detected</span></td>
                </tr>
                <tr>
                  <td><code style="font-size:0.78rem;color:var(--brand-primary);">Boundary_CapeTown.geojson</code></td>
                  <td><span class="tag tag-green">GeoJSON</span></td>
                  <td>All</td>
                  <td>Cape Town municipal administrative boundary polygon</td>
                  <td><span class="tag tag-green">Loaded ✓</span></td>
                </tr>
                <tr>
                  <td><code style="font-size:0.78rem;color:var(--brand-primary);">Vegetasi_CapeTown_2024.geojson</code></td>
                  <td><span class="tag tag-green">GeoJSON</span></td>
                  <td>2024</td>
                  <td>Vegetation extent polygons for baseline year 2024</td>
                  <td><span class="tag tag-green">Loaded ✓</span></td>
                </tr>
                <tr>
                  <td><code style="font-size:0.78rem;color:var(--brand-primary);">Vegetasi_CapeTown_2025.geojson</code></td>
                  <td><span class="tag tag-green">GeoJSON</span></td>
                  <td>2025</td>
                  <td>Vegetation extent polygons for comparison year 2025</td>
                  <td><span class="tag tag-green">Loaded ✓</span></td>
                </tr>
                <tr>
                  <td><code style="font-size:0.78rem;color:var(--brand-primary);">Perubahan_Vegetasi_CapeTown_2024_2025.geojson</code></td>
                  <td><span class="tag tag-green">GeoJSON</span></td>
                  <td>2024–2025</td>
                  <td>Vegetation change polygons (kode_perubahan: 0–3)</td>
                  <td><span class="tag tag-green">Loaded ✓</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>


        <!-- GeoTIFF Rendering Note removed -->


        <!-- Sample distribution donut -->
        <div class="card-glass" style="margin-top:1.5rem;">
          <div class="card-header-custom">
            <span class="card-title-custom"><i class="fas fa-chart-pie"></i> Sample Distribution</span>
          </div>
          <div class="card-body-custom">
            <div style="max-width:300px;margin:0 auto;">
              <canvas id="chart-sample-pie"></canvas>
            </div>
          </div>
        </div>
      </div>
    `;

    // Render charts
    setTimeout(() => {
      Charts.renderFeatureChart('chart-feature-importance', metrics.features);
      Charts.renderSamplePieChart('chart-sample-pie', metrics);
    }, 100);
  }

  // -------------------------------------------------------
  // MODEL EVALUATION SECTION
  // -------------------------------------------------------
  function renderModelEvaluation(container, { metrics }) {
    const m = metrics;

    container.innerHTML = `
      <div class="section-banner">
        <div class="section-banner-label"><i class="fas fa-flask"></i> Model Evaluation</div>
        <h2 class="section-banner-title">Random Forest Performance Metrics</h2>
        <p class="section-banner-desc">
          Comprehensive evaluation of the Random Forest classifier on ${m.testing_samples} test samples
          using standard classification metrics.
        </p>
      </div>

      <div class="section-container">
        <!-- Large KPI Cards -->
        <div class="kpi-grid" style="margin-bottom:1.5rem;">
          ${_kpiCard('Accuracy', m.accuracy + '%', 'fa-bullseye', '#10b981', 'Overall correctness')}
          ${_kpiCard('Precision', m.precision + '%', 'fa-crosshairs', '#3b82f6', 'Positive predictive value')}
          ${_kpiCard('Recall', m.recall + '%', 'fa-redo', '#f59e0b', 'True positive rate')}
          ${_kpiCard('F1 Score', m.f1_score + '%', 'fa-star', '#8b5cf6', 'Harmonic mean P & R')}
        </div>

        <!-- Metric Progress Bars -->
        <div class="card-glass" style="margin-bottom:1.5rem;">
          <div class="card-header-custom">
            <span class="card-title-custom"><i class="fas fa-tasks"></i> Performance Breakdown</span>
          </div>
          <div class="card-body-custom">
            ${[
              { label: 'Accuracy',  val: m.accuracy,  color: '#10b981' },
              { label: 'Precision', val: m.precision, color: '#3b82f6' },
              { label: 'Recall',    val: m.recall,    color: '#f59e0b' },
              { label: 'F1 Score',  val: m.f1_score,  color: '#8b5cf6' },
            ].map(({ label, val, color }) => `
              <div class="metric-bar-row">
                <span class="metric-bar-label">${label}</span>
                <div class="metric-bar-track">
                  <div class="metric-bar-fill"
                       data-target="${val}"
                       style="background:linear-gradient(90deg,${color},${color}aa);width:0%;"></div>
                </div>
                <span class="metric-bar-value">${val}%</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="two-col" style="margin-bottom:1.5rem;">
          <!-- Confusion Matrix -->
          <div class="card-glass">
            <div class="card-header-custom">
              <span class="card-title-custom"><i class="fas fa-th"></i> Confusion Matrix</span>
              <span class="tag tag-blue">${m.testing_samples} samples</span>
            </div>
            <div class="card-body-custom">
              <div id="confusion-matrix-grid"></div>
              <div style="margin-top:1rem;display:flex;gap:0.75rem;justify-content:center;flex-wrap:wrap;">
                <span style="font-size:0.75rem;display:flex;align-items:center;gap:0.4rem;color:var(--text-muted);">
                  <span style="width:10px;height:10px;background:rgba(16,185,129,0.4);border-radius:2px;display:inline-block;"></span> Correct
                </span>
                <span style="font-size:0.75rem;display:flex;align-items:center;gap:0.4rem;color:var(--text-muted);">
                  <span style="width:10px;height:10px;background:rgba(239,68,68,0.3);border-radius:2px;display:inline-block;"></span> Incorrect
                </span>
              </div>
            </div>
          </div>

          <!-- Radar Chart -->
          <div class="card-glass">
            <div class="card-header-custom">
              <span class="card-title-custom"><i class="fas fa-chart-radar"></i> Metrics Radar</span>
            </div>
            <div class="card-body-custom">
              <canvas id="chart-radar" height="260"></canvas>
            </div>
          </div>
        </div>

        <div class="two-col" style="margin-bottom:1.5rem;">
          <!-- Bar Chart -->
          <div class="card-glass">
            <div class="card-header-custom">
              <span class="card-title-custom"><i class="fas fa-chart-bar"></i> Metrics Bar Chart</span>
            </div>
            <div class="card-body-custom">
              <canvas id="chart-metrics-bar" height="220"></canvas>
            </div>
          </div>

          <!-- Pie Chart -->
          <div class="card-glass">
            <div class="card-header-custom">
              <span class="card-title-custom"><i class="fas fa-chart-pie"></i> Classification Distribution</span>
            </div>
            <div class="card-body-custom">
              <div style="max-width:300px;margin:0 auto;">
                <canvas id="chart-confusion-pie"></canvas>
              </div>
            </div>
          </div>
        </div>

        <!-- Performance Summary -->
        <div class="card-glass" style="margin-bottom:1.5rem;">
          <div class="card-header-custom">
            <span class="card-title-custom"><i class="fas fa-clipboard-check"></i> Performance Summary</span>
          </div>
          <div class="card-body-custom">
            <div style="display:flex;flex-direction:column;gap:0.85rem;">
              ${_summaryItem('fa-check-circle', '#10b981', 'High Accuracy',
                `The model achieved <strong>${m.accuracy}%</strong> overall accuracy on ${m.testing_samples} unseen test samples.`)}
              ${_summaryItem('fa-crosshairs', '#3b82f6', 'Strong Precision',
                `<strong>${m.precision}%</strong> precision indicates few false positives when predicting vegetation presence.`)}
              ${_summaryItem('fa-exclamation-triangle', '#f59e0b', 'Moderate Recall',
                `<strong>${m.recall}%</strong> recall suggests some vegetation was missed — likely due to class imbalance or spectral similarity.`)}
              ${_summaryItem('fa-star', '#8b5cf6', 'Solid F1 Score',
                `F1 of <strong>${m.f1_score}%</strong> balances precision and recall, confirming reliable classification.`)}
              ${_summaryItem('fa-tree', '#1a9641', 'Model Config',
                `${m.model} with ${m.trees} estimators, random seed ${m.seed}, trained on ${m.training_samples} samples.`)}
            </div>
          </div>
        </div>

        <!-- Interpretation Section -->
        <div class="card-glass" style="margin-bottom:1.5rem;">
          <div class="card-header-custom">
            <span class="card-title-custom"><i class="fas fa-microscope"></i> Model Interpretation</span>
          </div>
          <div class="card-body-custom">
            <div class="interpretation-grid">
              <div class="interpret-card">
                <div class="ic-icon" style="background:rgba(239,68,68,0.12);color:#ef4444;">
                  <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="ic-title">False Positive (FP = ${m.confusion_matrix[1][0]})</div>
                <div class="ic-desc">
                  <strong>${m.confusion_matrix[1][0]} samples</strong> were incorrectly classified as vegetation when they were actually non-vegetation.
                  This may result from spectral confusion between bare soil with green-tinted surfaces and actual vegetation cover,
                  especially in urban fringe areas or agricultural fields with residue.
                </div>
              </div>
              <div class="interpret-card">
                <div class="ic-icon" style="background:rgba(245,158,11,0.12);color:#f59e0b;">
                  <i class="fas fa-eye-slash"></i>
                </div>
                <div class="ic-title">False Negative (FN = ${m.confusion_matrix[0][1]})</div>
                <div class="ic-desc">
                  <strong>${m.confusion_matrix[0][1]} samples</strong> of real vegetation were missed by the classifier.
                  This typically occurs in sparse vegetation zones, shadow-affected areas, or mixed pixels
                  where vegetation is sub-pixel and difficult to distinguish from surrounding land cover.
                </div>
              </div>
              <div class="interpret-card">
                <div class="ic-icon" style="background:rgba(16,185,129,0.12);color:#10b981;">
                  <i class="fas fa-shield-alt"></i>
                </div>
                <div class="ic-title">Model Reliability</div>
                <div class="ic-desc">
                  With <strong>${m.accuracy}% accuracy</strong> and an <strong>F1 score of ${m.f1_score}%</strong>,
                  the Random Forest model demonstrates strong reliability for binary vegetation classification.
                  The high precision (${m.precision}%) ensures minimal over-prediction, making the results suitable
                  for area estimation and policy reporting.
                </div>
              </div>
              <div class="interpret-card">
                <div class="ic-icon" style="background:rgba(139,92,246,0.12);color:#8b5cf6;">
                  <i class="fas fa-exclamation-circle"></i>
                </div>
                <div class="ic-title">Model Limitations</div>
                <div class="ic-desc">
                  The model is trained on a single study period and may not generalize to different seasons or years.
                  Ground truth samples (${m.total_samples}) may not fully represent all terrain types in Cape Town.
                  Cloud shadows, topographic effects, and mixed pixels remain sources of classification uncertainty.
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    `;

    // Animate bars and render charts
    setTimeout(() => {
      document.querySelectorAll('.metric-bar-fill[data-target]').forEach((bar, i) => {
        Utils.animateBar(bar, parseFloat(bar.dataset.target), i * 150);
      });
      Charts.renderConfusionMatrix('confusion-matrix-grid', m.confusion_matrix);
      Charts.renderRadarChart('chart-radar', m);
      Charts.renderMetricsBarChart('chart-metrics-bar', m);
      Charts.renderConfusionPieChart('chart-confusion-pie', m.confusion_matrix);
    }, 100);
  }

  // -------------------------------------------------------
  // INSIGHTS SECTION
  // -------------------------------------------------------
  function renderInsights(container, { statistics }) {
    const s = statistics;
    const isNegative = s.net_change < 0;

    container.innerHTML = `
      <div class="section-banner">
        <div class="section-banner-label"><i class="fas fa-lightbulb"></i> Insights</div>
        <h2 class="section-banner-title">Vegetation Change Statistics</h2>
        <p class="section-banner-desc">
          Quantitative analysis of vegetation area change in Cape Town between 2024 and 2025,
          driven by wildfire events detected via Sentinel-2 imagery.
        </p>
      </div>

      <div class="section-container">
        <!-- KPI Cards -->
        <div class="kpi-grid" style="margin-bottom:1.5rem;">
          ${_kpiCard('Vegetation 2024', Utils.formatNumber(s.vegetation_2024) + ' ha', 'fa-leaf', '#1a9641', 'Baseline year')}
          ${_kpiCard('Vegetation 2025', Utils.formatNumber(s.vegetation_2025) + ' ha', 'fa-leaf', '#65a30d', 'Post-event year')}
          ${_kpiCard('Gain', '+' + Utils.formatNumber(s.gain) + ' ha', 'fa-arrow-trend-up', '#4daf4a', 'Regrowth / new veg')}
          ${_kpiCard('Loss', '−' + Utils.formatNumber(s.loss) + ' ha', 'fa-fire-alt', '#e41a1c', 'Burnt / cleared')}
          ${_kpiCard('Net Change', Utils.formatPct(s.percentage), 'fa-exchange-alt', isNegative ? '#ef4444' : '#10b981', Utils.formatNumber(s.net_change) + ' ha')}
        </div>

        <div class="two-col" style="margin-bottom:1.5rem;">
          <!-- Vegetation Coverage & City Area -->
          <div class="card-glass">
            <div class="card-header-custom">
              <span class="card-title-custom"><i class="fas fa-chart-line"></i> Vegetation Coverage</span>
              <span class="tag tag-blue">Total Area: ${Utils.formatNumber(s.total_city_area)} ha</span>
            </div>
            <div class="card-body-custom">
              <div style="display:flex;flex-direction:column;gap:1rem;">
                <div>
                  <div style="display:flex;justify-content:space-between;font-size:0.82rem;font-weight:600;margin-bottom:0.35rem;">
                    <span>Coverage 2024</span>
                    <strong style="margin-left:auto;color:var(--brand-primary);">${s.coverage_2024}%</strong>
                  </div>
                  <div style="height:10px;background:rgba(255,255,255,0.08);border-radius:5px;overflow:hidden;">
                    <div style="height:100%;width:${s.coverage_2024}%;background:linear-gradient(90deg,var(--kpi-green),var(--brand-primary));border-radius:5px;"></div>
                  </div>
                </div>
                
                <div>
                  <div style="display:flex;justify-content:space-between;font-size:0.82rem;font-weight:600;margin-bottom:0.35rem;">
                    <span>Coverage 2025</span>
                    <strong style="margin-left:auto;color:var(--brand-primary);">${s.coverage_2025}%</strong>
                  </div>
                  <div style="height:10px;background:rgba(255,255,255,0.08);border-radius:5px;overflow:hidden;">
                    <div style="height:100%;width:${s.coverage_2025}%;background:linear-gradient(90deg,#81c784,var(--brand-primary));border-radius:5px;"></div>
                  </div>
                </div>
                
                <div style="font-size:0.75rem;color:var(--text-muted);border-top:1px solid var(--border-color);padding-top:0.75rem;margin-top:0.25rem;">
                  <i class="fas fa-info-circle"></i> Vegetation coverage dropped by <strong>${(s.coverage_2024 - s.coverage_2025).toFixed(2)}%</strong> of the total municipal area due to recent fire incidents.
                </div>
              </div>
            </div>
          </div>

          <!-- Vegetation Stability -->
          <div class="card-glass">
            <div class="card-header-custom">
              <span class="card-title-custom"><i class="fas fa-shield-alt"></i> Vegetation Stability</span>
              <span class="tag tag-green">Stable: ${Utils.formatNumber(s.stable_vegetation)} ha</span>
            </div>
            <div class="card-body-custom">
              <div style="display:flex;flex-direction:column;gap:0.75rem;">
                <div style="display:flex;align-items:center;justify-content:space-between;padding:0.65rem 0.85rem;background:var(--bg-base);border-radius:8px;border-left:4px solid var(--kpi-green);margin-bottom:0.25rem;">
                  <div style="font-size:0.82rem;color:var(--text-secondary);font-weight:600;">Stable Vegetation</div>
                  <strong style="margin-left:auto;color:var(--text-primary);">${Utils.formatNumber(s.stable_vegetation)} ha</strong>
                </div>
                
                <div>
                  <div style="display:flex;justify-content:space-between;font-size:0.75rem;color:var(--text-muted);margin-bottom:0.25rem;">
                    <span>Out of 2024 Vegetation (${Utils.formatNumber(s.vegetation_2024)} ha)</span>
                  </div>
                  <div style="height:8px;background:rgba(255,255,255,0.08);border-radius:4px;overflow:hidden;display:flex;">
                    <div style="height:100%;width:${(s.stable_vegetation/s.vegetation_2024*100).toFixed(1)}%;background:var(--kpi-green);" title="Stable: ${(s.stable_vegetation/s.vegetation_2024*100).toFixed(1)}%"></div>
                    <div style="height:100%;width:${(s.loss/s.vegetation_2024*100).toFixed(1)}%;background:var(--kpi-red);" title="Loss: ${(s.loss/s.vegetation_2024*100).toFixed(1)}%"></div>
                  </div>
                  <div style="display:flex;justify-content:space-between;font-size:0.7rem;color:var(--text-muted);margin-top:0.35rem;">
                    <span>Stable: ${(s.stable_vegetation/s.vegetation_2024*100).toFixed(1)}%</span>
                    <span style="margin-left:auto;">Loss: ${(s.loss/s.vegetation_2024*100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="two-col" style="margin-bottom:1.5rem;">
          <!-- Area Bar Chart -->
          <div class="card-glass">
            <div class="card-header-custom">
              <span class="card-title-custom"><i class="fas fa-chart-bar"></i> Vegetation Area Comparison</span>
            </div>
            <div class="card-body-custom">
              <canvas id="chart-veg-area" height="240"></canvas>
            </div>
          </div>

          <!-- Change Donut -->
          <div class="card-glass">
            <div class="card-header-custom">
              <span class="card-title-custom"><i class="fas fa-chart-pie"></i> Change Breakdown</span>
            </div>
            <div class="card-body-custom">
              <canvas id="chart-change-donut" height="240"></canvas>
            </div>
          </div>
        </div>

        <!-- Summary Table -->
        <div class="card-glass" style="margin-bottom:1.5rem;">
          <div class="card-header-custom">
            <span class="card-title-custom"><i class="fas fa-table"></i> Detailed Statistics Table</span>
          </div>
          <div class="card-body-custom" style="padding:0;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Value (ha)</th>
                  <th>Percentage</th>
                  <th>Interpretation</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Vegetation Area 2024</strong></td>
                  <td>${Utils.formatNumber(s.vegetation_2024)} ha</td>
                  <td>${s.coverage_2024}% of city</td>
                  <td>Baseline vegetation extent before wildfire season (out of ${Utils.formatNumber(s.total_city_area)} ha total area)</td>
                </tr>
                <tr>
                  <td><strong>Vegetation Area 2025</strong></td>
                  <td>${Utils.formatNumber(s.vegetation_2025)} ha</td>
                  <td>${s.coverage_2025}% of city</td>
                  <td>Post-wildfire vegetation extent (${((s.vegetation_2025/s.vegetation_2024)*100).toFixed(1)}% of 2024)</td>
                </tr>
                <tr>
                  <td><strong>Stable Vegetation</strong></td>
                  <td>${Utils.formatNumber(s.stable_vegetation)} ha</td>
                  <td>${((s.stable_vegetation/s.vegetation_2024)*100).toFixed(1)}%</td>
                  <td>Vegetation area remaining unchanged between 2024 and 2025</td>
                </tr>
                <tr>
                  <td><span style="color:#4daf4a;font-weight:600;">▲ Gain</span></td>
                  <td>+${Utils.formatNumber(s.gain)} ha</td>
                  <td>${((s.gain/s.vegetation_2024)*100).toFixed(2)}%</td>
                  <td>New vegetation / regrowth detected in 2025</td>
                </tr>
                <tr>
                  <td><span style="color:#e41a1c;font-weight:600;">▼ Loss</span></td>
                  <td>−${Utils.formatNumber(s.loss)} ha</td>
                  <td>${((s.loss/s.vegetation_2024)*100).toFixed(2)}%</td>
                  <td>Vegetation destroyed by wildfire</td>
                </tr>
                <tr>
                  <td><strong>Total City Area</strong></td>
                  <td>${Utils.formatNumber(s.total_city_area)} ha</td>
                  <td>100.0%</td>
                  <td>Total municipal administrative area of Cape Town</td>
                </tr>
                <tr>
                  <td><strong style="color:${isNegative?'#ef4444':'#10b981'};">Net Change</strong></td>
                  <td style="color:${isNegative?'#ef4444':'#10b981'};font-weight:700;">${Utils.formatNumber(s.net_change)} ha</td>
                  <td style="color:${isNegative?'#ef4444':'#10b981'};font-weight:700;">${Utils.formatPct(s.percentage)}</td>
                  <td>Overall vegetation balance 2024→2025</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Comparison Chart (Gain vs Loss) -->
        <div class="card-glass" style="margin-bottom:1.5rem;">
          <div class="card-header-custom">
            <span class="card-title-custom"><i class="fas fa-balance-scale"></i> Gain vs Loss Comparison</span>
          </div>
          <div class="card-body-custom">
            <canvas id="chart-comparison" height="160"></canvas>
          </div>
        </div>

        <!-- Auto-generated Conclusion -->
        <div class="insight-card" style="margin-bottom:1.5rem;">
          <div class="insight-quote">"</div>
          <p class="insight-text">
            Between 2024 and 2025, Cape Town experienced a <strong style="color:#ef4444;">net vegetation loss of
            ${Utils.formatNumber(Math.abs(s.net_change))} ha (${Math.abs(s.percentage).toFixed(1)}%)</strong>,
            predominantly driven by wildfire events detected through Sentinel-2 multispectral imagery.
            A total of <strong>${Utils.formatNumber(s.loss)} ha</strong> of vegetation was destroyed,
            while only <strong>${Utils.formatNumber(s.gain)} ha</strong> showed signs of regrowth or new vegetation,
            indicating that recovery was significantly outpaced by loss.
            <br/><br/>
            <strong>Largest Changes &amp; Spatial Distribution:</strong> The largest contiguous blocks of vegetation loss occurred
            within the mountainous regions of <strong>Table Mountain National Park</strong> and the <strong>Hottentots Holland Nature Reserve (Somerset West)</strong>,
            showing a highly clustered spatial pattern following fire-prone fynbos vegetation corridors. In contrast, smaller dispersed patches
            of vegetation loss were observed along the peri-urban fringes (such as the Cape Flats outskirts), indicating localized urban encroachment.
            The Random Forest classifier &mdash; trained on ${Loader.get('metrics').training_samples} samples with
            ${Loader.get('metrics').accuracy}% accuracy &mdash; successfully distinguished land cover
            transition classes across the study area.
          </p>
        </div>

        <!-- Likely Causes -->
        <div class="card-glass" style="margin-bottom:1.5rem;">
          <div class="card-header-custom">
            <span class="card-title-custom"><i class="fas fa-search-plus"></i> Likely Causes of Vegetation Change</span>
          </div>
          <div class="card-body-custom">
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1rem;">
              <div class="cause-card">
                <div class="cause-icon" style="background:rgba(239,68,68,0.12);color:#ef4444;">
                  <i class="fas fa-fire"></i>
                </div>
                <div class="cause-info">
                  <h6>Wildfire</h6>
                  <p>Cape Town's fynbos biome is highly fire-prone. The 2024-2025 wildfire season was responsible
                    for the largest share of vegetation loss (${Utils.formatNumber(s.loss)} ha), destroying
                    indigenous shrubland and plantation forests across Table Mountain slopes and the Cape Flats.</p>
                </div>
              </div>
              <div class="cause-card">
                <div class="cause-icon" style="background:rgba(139,92,246,0.12);color:#8b5cf6;">
                  <i class="fas fa-city"></i>
                </div>
                <div class="cause-info">
                  <h6>Urban Expansion</h6>
                  <p>Ongoing residential and commercial development on the urban-rural fringe has converted
                    vegetated land to built-up surfaces. Informal settlement expansion and infrastructure projects
                    contribute to permanent vegetation clearance.</p>
                </div>
              </div>
              <div class="cause-card">
                <div class="cause-icon" style="background:rgba(77,175,74,0.12);color:#4daf4a;">
                  <i class="fas fa-seedling"></i>
                </div>
                <div class="cause-info">
                  <h6>Natural Regrowth</h6>
                  <p>The ${Utils.formatNumber(s.gain)} ha of vegetation gain is attributed to
                    post-fire fynbos regrowth (serotiny-driven), restoration projects in degraded areas,
                    and seasonal greening in agricultural zones detected by NDVI thresholds.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Potential Uses -->
        <div class="card-glass" style="margin-bottom:1.5rem;">
          <div class="card-header-custom">
            <span class="card-title-custom"><i class="fas fa-rocket"></i> Potential Uses</span>
          </div>
          <div class="card-body-custom">
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:1rem;">
              <div class="cause-card">
                <div class="cause-icon" style="background:rgba(16,185,129,0.12);color:#10b981;"><i class="fas fa-shield-alt"></i></div>
                <div class="cause-info"><h6>Disaster Risk Management</h6><p>Identify fire-prone zones and prioritize prevention strategies.</p></div>
              </div>
              <div class="cause-card">
                <div class="cause-icon" style="background:rgba(26,150,65,0.12);color:#1a9641;"><i class="fas fa-tree"></i></div>
                <div class="cause-info"><h6>Reforestation Planning</h6><p>Target revegetation efforts in the highest-loss areas identified by change detection.</p></div>
              </div>
              <div class="cause-card">
                <div class="cause-icon" style="background:rgba(59,130,246,0.12);color:#3b82f6;"><i class="fas fa-building"></i></div>
                <div class="cause-info"><h6>Urban Planning</h6><p>Monitor encroachment into green corridors and protected areas.</p></div>
              </div>
              <div class="cause-card">
                <div class="cause-icon" style="background:rgba(77,175,74,0.12);color:#4daf4a;"><i class="fas fa-leaf"></i></div>
                <div class="cause-info"><h6>Biodiversity Conservation</h6><p>Track fynbos habitat loss and support conservation policy decisions.</p></div>
              </div>
              <div class="cause-card">
                <div class="cause-icon" style="background:rgba(139,92,246,0.12);color:#8b5cf6;"><i class="fas fa-chart-line"></i></div>
                <div class="cause-info"><h6>Climate Monitoring</h6><p>Correlate vegetation trends with temperature and precipitation data.</p></div>
              </div>
              <div class="cause-card">
                <div class="cause-icon" style="background:rgba(245,158,11,0.12);color:#f59e0b;"><i class="fas fa-graduation-cap"></i></div>
                <div class="cause-info"><h6>Academic Research</h6><p>Serve as a baseline dataset for future remote sensing and GeoAI studies.</p></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recommendations -->
        <div class="recommendation-card" style="margin-bottom:1.5rem;">
          <h6><i class="fas fa-lightbulb" style="margin-right:0.4rem;"></i> Recommendations</h6>
          <p>
            Given the significant vegetation loss detected, we recommend: (1) implementing near-real-time wildfire
            monitoring using Sentinel-2 and MODIS active fire products; (2) prioritizing revegetation programs
            in the ${Utils.formatNumber(s.loss)} ha burnt zones identified in the change map; (3) expanding the training
            dataset to include additional land cover classes and multi-temporal samples to improve classification accuracy;
            and (4) integrating climate data layers (temperature, precipitation) to model future fire risk scenarios.
          </p>
        </div>

        <!-- Limitations -->
        <div class="card-glass" style="margin-bottom:1.5rem;">
          <div class="card-header-custom">
            <span class="card-title-custom"><i class="fas fa-exclamation-triangle"></i> Limitations</span>
          </div>
          <div class="card-body-custom">
            <div class="limitation-item">
              <i class="fas fa-exclamation-circle"></i>
              <span><strong>Temporal Resolution:</strong> Only two time points (2024 and 2025) were compared. Seasonal variations and short-lived events between these dates are not captured.</span>
            </div>
            <div class="limitation-item">
              <i class="fas fa-exclamation-circle"></i>
              <span><strong>Cloud Contamination:</strong> Despite cloud masking, residual cloud shadow artifacts may cause localized misclassification, especially during Cape Town's winter months.</span>
            </div>
            <div class="limitation-item">
              <i class="fas fa-exclamation-circle"></i>
              <span><strong>Binary Classification:</strong> The vegetation/non-vegetation binary approach does not distinguish between vegetation types (fynbos, grassland, plantation).</span>
            </div>
            <div class="limitation-item">
              <i class="fas fa-exclamation-circle"></i>
              <span><strong>Sample Size:</strong> With ${Loader.get('metrics').total_samples} ground truth samples, spatial coverage may be uneven. Under-sampled areas may have higher uncertainty.</span>
            </div>
            <div class="limitation-item">
              <i class="fas fa-exclamation-circle"></i>
              <span><strong>Spatial Resolution:</strong> Sentinel-2's 10-20 m resolution may produce mixed pixels at land cover boundaries, leading to edge artifacts.</span>
            </div>
          </div>
        </div>

      </div>
    `;

    setTimeout(() => {
      Charts.renderVegAreaBarChart('chart-veg-area', s);
      Charts.renderChangeDonutChart('chart-change-donut', s);
      Charts.renderComparisonChart('chart-comparison', s);
    }, 100);
  }

  // -------------------------------------------------------
  // ABOUT SECTION
  // -------------------------------------------------------
  function renderAbout(container, { projectInfo, metrics }) {
    const info = projectInfo;
    const downloads = Loader.getDataPaths();

    container.innerHTML = `
      <div class="section-banner">
        <div class="section-banner-label"><i class="fas fa-info-circle"></i> About</div>
        <h2 class="section-banner-title">${info.title}</h2>
        <p class="section-banner-desc">${info.description}</p>
      </div>

      <div class="section-container">
        <!-- Project Details -->
        <div class="two-col" style="margin-bottom:1.5rem;">
          <div class="card-glass">
            <div class="card-header-custom">
              <span class="card-title-custom"><i class="fas fa-info-circle"></i> Project Details</span>
            </div>
            <div class="card-body-custom">
              <ul class="info-list">
                <li><i class="fas fa-heading"></i><span><strong>Title:</strong> ${info.title}</span></li>
                <li><i class="fas fa-graduation-cap"></i><span><strong>Type:</strong> ${info.subtitle}</span></li>
                <li><i class="fas fa-map-marked-alt"></i><span><strong>Study Area:</strong> ${info.study_area}</span></li>
                <li><i class="fas fa-satellite"></i><span><strong>Satellite:</strong> ${info.satellite} (Multispectral)</span></li>
                <li><i class="fas fa-robot"></i><span><strong>Classifier:</strong> ${info.classification_model}</span></li>
                <li><i class="fas fa-tree"></i><span><strong>Trees:</strong> ${info.trees} estimators</span></li>
                <li><i class="fas fa-random"></i><span><strong>Seed:</strong> ${metrics.seed}</span></li>
                <li><i class="fas fa-bullseye"></i><span><strong>Accuracy:</strong> ${metrics.accuracy}%</span></li>
              </ul>
            </div>
          </div>

          <div class="card-glass">
            <div class="card-header-custom">
              <span class="card-title-custom"><i class="fas fa-layer-group"></i> Change Classes</span>
            </div>
            <div class="card-body-custom">
              <div style="display:flex;flex-direction:column;gap:0.75rem;">
                ${Object.values(Utils.VEG_CLASSES).map(cls => `
                  <div style="display:flex;align-items:center;gap:0.75rem;padding:0.65rem 0.85rem;background:var(--bg-base);border-radius:8px;border-left:4px solid ${cls.color};">
                    <div style="width:14px;height:14px;background:${cls.color};border-radius:3px;flex-shrink:0;"></div>
                    <div>
                      <div style="font-size:0.85rem;font-weight:700;color:var(--text-primary);">${cls.label}</div>
                      <div style="font-size:0.72rem;color:var(--text-muted);">kode_perubahan = ${cls.code}</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>

        <!-- Team / Authors (Modern Responsive Table) -->
        <div class="card-glass" style="margin-bottom:1.5rem;">
          <div class="card-header-custom">
            <span class="card-title-custom"><i class="fas fa-users"></i> Research Team</span>
            <span class="tag tag-green">${info.authors.length} members</span>
          </div>
          <div class="card-body-custom" style="padding:0;overflow-x:auto;">
            <table class="data-table team-table">
              <thead>
                <tr>
                  <th style="width:40px;text-align:center;">No</th>
                  <th>Nama</th>
                  <th>NIM</th>
                  <th>Peran</th>
                  <th>Tanggung Jawab</th>
                </tr>
              </thead>
              <tbody>
                ${info.authors.map((author, i) => `
                  <tr>
                    <td style="text-align:center;font-weight:700;color:var(--brand-primary);">${i + 1}</td>
                    <td>
                      <div style="display:flex;align-items:center;gap:0.65rem;">
                        <div style="width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,var(--brand-primary),var(--brand-secondary));display:flex;align-items:center;justify-content:center;font-weight:800;font-size:0.7rem;color:white;flex-shrink:0;">${Utils.getInitials(author.name)}</div>
                        <span style="font-weight:600;color:var(--text-primary);font-size:0.85rem;">${author.name}</span>
                      </div>
                    </td>
                    <td><code style="font-size:0.8rem;color:var(--brand-accent);">${author.nim ?? '-'}</code></td>
                    <td><span class="tag tag-green" style="white-space:nowrap;">${author.role}</span></td>
                    <td style="font-size:0.8rem;color:var(--text-secondary);line-height:1.5;">${author.jobdesk}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Downloads (3-column responsive grid) -->
        <div class="card-glass" style="margin-bottom:1.5rem;">
          <div class="card-header-custom">
            <span class="card-title-custom"><i class="fas fa-download"></i> Downloads</span>
          </div>
          <div class="card-body-custom">
            <div class="download-grid-3">
              <a class="download-card" href="data/geojson/Perubahan_Vegetasi_CapeTown_2024_2025.geojson"
                 download="Perubahan_Vegetasi_CapeTown_2024_2025.geojson" id="dl-geojson">
                <div class="download-icon"><i class="fas fa-map"></i></div>
                <div class="download-info">
                  <h6>Vegetation Change GeoJSON</h6>
                  <p>Perubahan_Vegetasi_CapeTown_2024_2025.geojson • ~42 MB</p>
                </div>
              </a>
              <a class="download-card" href="data/geojson/Vegetasi_CapeTown_2024.geojson"
                 download="Vegetasi_CapeTown_2024.geojson" id="dl-veg2024">
                <div class="download-icon" style="background:rgba(26,150,65,0.1);color:#1a9641;"><i class="fas fa-leaf"></i></div>
                <div class="download-info">
                  <h6>Vegetation 2024 GeoJSON</h6>
                  <p>Vegetasi_CapeTown_2024.geojson • ~3.2 MB</p>
                </div>
              </a>
              <a class="download-card" href="data/geojson/Vegetasi_CapeTown_2025.geojson"
                 download="Vegetasi_CapeTown_2025.geojson" id="dl-veg2025">
                <div class="download-icon" style="background:rgba(101,163,13,0.1);color:#65a30d;"><i class="fas fa-leaf"></i></div>
                <div class="download-info">
                  <h6>Vegetation 2025 GeoJSON</h6>
                  <p>Vegetasi_CapeTown_2025.geojson • ~3.2 MB</p>
                </div>
              </a>
              <a class="download-card" href="config/metrics.json"
                 download="metrics.json" id="dl-metrics">
                <div class="download-icon" style="background:rgba(59,130,246,0.1);color:#3b82f6;"><i class="fas fa-chart-bar"></i></div>
                <div class="download-info">
                  <h6>Model Metrics</h6>
                  <p>metrics.json — accuracy, confusion matrix, features</p>
                </div>
              </a>
              <a class="download-card" href="config/statistics.json"
                 download="statistics.json" id="dl-stats">
                <div class="download-icon" style="background:rgba(139,92,246,0.1);color:#8b5cf6;"><i class="fas fa-database"></i></div>
                <div class="download-info">
                  <h6>Change Statistics</h6>
                  <p>statistics.json — vegetation area &amp; change data</p>
                </div>
              </a>
              <a class="download-card" href="config/project_info.json"
                 download="project_info.json" id="dl-info">
                <div class="download-icon" style="background:rgba(245,158,11,0.1);color:#f59e0b;"><i class="fas fa-info-circle"></i></div>
                <div class="download-info">
                  <h6>Project Info</h6>
                  <p>project_info.json — authors, title, config</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // -------------------------------------------------------
  // HELPER: KPI Card HTML
  // -------------------------------------------------------
  function _kpiCard(label, value, icon, color, trend) {
    return `
      <div class="kpi-card" style="--kpi-color:${color};">
        <div class="kpi-icon-wrap"><i class="fas ${icon}"></i></div>
        <div class="kpi-value">${value}</div>
        <div class="kpi-label">${label}</div>
        ${trend ? `<div class="kpi-trend">${trend}</div>` : ''}
      </div>
    `;
  }

  // -------------------------------------------------------
  // HELPER: Summary item
  // -------------------------------------------------------
  function _summaryItem(icon, color, title, desc) {
    return `
      <div style="display:flex;gap:0.75rem;align-items:flex-start;">
        <div style="width:32px;height:32px;border-radius:8px;background:${color}22;color:${color};display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:0.95rem;">
          <i class="fas ${icon}"></i>
        </div>
        <div>
          <div style="font-size:0.85rem;font-weight:700;color:var(--text-primary);margin-bottom:0.15rem;">${title}</div>
          <div style="font-size:0.8rem;color:var(--text-secondary);line-height:1.5;">${desc}</div>
        </div>
      </div>
    `;
  }

  // -------------------------------------------------------
  // HELPER: Band description
  // -------------------------------------------------------
  function _getBandDescription(band) {
    const desc = {
      NDVI:  'Normalized Difference Vegetation Index',
      B2:    'Blue (490 nm) — atmospheric scattering',
      B3:    'Green (560 nm) — vegetation reflectance',
      B4:    'Red (665 nm) — chlorophyll absorption',
      B8:    'NIR (842 nm) — vegetation biomass',
      B11:   'SWIR-1 (1610 nm) — moisture, fire',
      B12:   'SWIR-2 (2190 nm) — burn scar detection',
    };
    return desc[band] ?? 'Sentinel-2 spectral band';
  }

  // -------------------------------------------------------
  // Inject button styles (avoids stylesheet dependency)
  // -------------------------------------------------------
  function _injectButtonStyles() {
    if (document.getElementById('_btn-styles')) return;
    const s = document.createElement('style');
    s.id = '_btn-styles';
    s.textContent = `
      .btn-primary-custom {
        display:inline-flex;align-items:center;gap:0.5rem;
        padding:0.65rem 1.4rem;border-radius:10px;border:none;
        background:linear-gradient(135deg,#10b981,#059669);
        color:white;font-size:0.88rem;font-weight:700;cursor:pointer;
        transition:all 0.25s ease;box-shadow:0 4px 14px rgba(16,185,129,0.35);
        font-family:inherit;
      }
      .btn-primary-custom:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(16,185,129,0.45);}
      .btn-secondary-custom {
        display:inline-flex;align-items:center;gap:0.5rem;
        padding:0.65rem 1.4rem;border-radius:10px;
        border:1px solid var(--border-color);
        background:var(--bg-card);color:var(--text-secondary);
        font-size:0.88rem;font-weight:700;cursor:pointer;
        transition:all 0.25s ease;font-family:inherit;
      }
      .btn-secondary-custom:hover{
        border-color:var(--brand-primary);color:var(--brand-primary);
        transform:translateY(-2px);box-shadow:var(--shadow-sm);
      }
    `;
    document.head.appendChild(s);
  }

  // -------------------------------------------------------
  // Lightbox for workflow image
  // -------------------------------------------------------
  function openLightbox(src) {
    const lb = document.createElement('div');
    lb.className = 'img-lightbox';
    lb.innerHTML = `<img src="${src}" alt="Workflow" />`;
    lb.addEventListener('click', () => lb.remove());
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') { lb.remove(); document.removeEventListener('keydown', esc); }
    });
    document.body.appendChild(lb);
  }

  return {
    renderHome,
    renderDataProcess,
    renderModelEvaluation,
    renderInsights,
    renderAbout,
    openLightbox,
  };

})();

window.Dashboard = Dashboard;
