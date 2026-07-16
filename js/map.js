/**
 * map.js — Leaflet map initialization and layer management
 * GeoAI Cape Town WebGIS
 *
 * Performance strategy: GeoJSON features are split into 4 separate
 * LayerGroups (one per kode_perubahan class). Each group can be
 * toggled independently, reducing rendering load.
 */

'use strict';

const MapModule = (() => {

  let map = null;
  let currentBaseLayer = null;
  let layerControl = null;
  let miniMap = null;

  // Cape Town center
  const CAPE_TOWN_CENTER = [-33.9249, 18.4241];
  const DEFAULT_ZOOM = 10;

  // Dynamic fetch & parse cache for change GeoJSON
  let _changeGeoJSON = null;
  let _veg2024GeoJSON = null;
  let _veg2025GeoJSON = null;
  let _boundaryGeoJSON = null;

  // Layer groups cache (Leaflet LayerGroup instances)
  const _layerGroups = {
    veg2024: null,
    veg2025: null,
    gain: null,
    loss: null
  };

  // Layer visibility states
  const _layerVisibility = {
    basemap: true,
    boundary: true,
    veg2024: false,
    veg2025: false,
    gain: false,
    loss: false
  };

  // Layer opacities
  const _layerOpacities = {
    veg2024: 0.60,
    veg2025: 0.60,
    gain: 0.70,
    loss: 0.70,
    class2024: 0.75,
    class2025: 0.75
  };

  // Active basemap key
  let _activeBasemapKey = 'Dark Road';

  // Layer loading states: 'idle' | 'loading' | 'ready' | 'failed'
  const _layerStates = {
    boundary: 'idle',
    veg2024: 'idle',
    veg2025: 'idle',
    gain: 'idle',
    loss: 'idle',
    class2024: 'idle',
    class2025: 'idle'
  };

  // Active layer ID for opacity slider
  let _activeLayerId = null;

  // Combined bounds
  let _allBounds = null;

  // Layer color and label metadata registry
  const LAYER_META = {
    basemap:  { color: '#3b82f6', label: 'Active Basemap',    meta: 'Global Tile Layer' },
    boundary: { color: '#FFC107', label: 'City Boundary',     meta: 'Cape Town metro' },
    veg2024:  { color: '#1B5E20', label: 'Vegetation 2024',   meta: 'Dark Green vegetation extent' },
    veg2025:  { color: '#66BB6A', label: 'Vegetation 2025',   meta: 'Light Green vegetation extent' },
    gain:     { color: '#00BCD4', label: 'Vegetation Gain',    meta: 'Class 1 (Non-Veg → Veg)' },
    loss:     { color: '#F44336', label: 'Vegetation Loss',    meta: 'Class 2 (Veg → Non-Veg)' },
    class2024: { color: '#9C27B0', label: 'Classification 2024', meta: 'RF raster classification' },
    class2025: { color: '#FFD600', label: 'Classification 2025', meta: 'RF raster classification' },
  };

  // -------------------------------------------------------
  // Basemap tile definitions — lazy (called inside init())
  // -------------------------------------------------------
  let BASEMAPS = null;

  function _buildBasemaps() {
    return {
      'Dark Road': L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        { attribution: '&copy; CartoDB', subdomains: 'abcd', maxZoom: 19, pane: 'tilePane' }
      ),
      'Satellite': L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { attribution: '&copy; Esri, Maxar, Earthstar Geographics', maxZoom: 19, pane: 'tilePane' }
      ),
    };
  }

  // -------------------------------------------------------
  // Reusable Map Loading Overlay
  // -------------------------------------------------------
  function _showMapLoader(message) {
    const el = document.getElementById('map-loading-indicator');
    if (!el) return;
    const span = el.querySelector('span');
    if (span) span.textContent = message || 'Loading…';
    el.style.display = 'flex';
  }

  function _hideMapLoader() {
    const el = document.getElementById('map-loading-indicator');
    if (el) el.style.display = 'none';
  }

  // -------------------------------------------------------
  // Humanize GeoJSON property key names
  // -------------------------------------------------------
  function _humanizeKey(key) {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  // -------------------------------------------------------
  // Dynamic Popup Generator — renders clean HTML table
  // -------------------------------------------------------
  function _buildPopup(layerName, feature) {
    const props = feature.properties || {};
    let html = `
      <div class="map-popup-content" style="max-height: 250px; overflow-y: auto; min-width: 200px;">
        <h6 style="margin-top: 0; margin-bottom: 0.5rem; color: var(--brand-primary); font-size: 0.9rem; font-weight: 700; border-bottom: 1px solid var(--border-color); padding-bottom: 0.25rem;">${layerName}</h6>
        <table style="width: 100%; border-collapse: collapse; font-size: 0.75rem;">
          <tbody>
    `;

    let hasProps = false;
    for (const [key, value] of Object.entries(props)) {
      let display;
      if (value === null || value === undefined) {
        display = '—';
      } else if (typeof value === 'number') {
        display = Utils.formatNumber(value, 2);
      } else if (typeof value === 'string') {
        display = value || '—';
      } else if (typeof value === 'boolean') {
        display = value ? 'Yes' : 'No';
      } else {
        continue; // Skip objects/arrays — never render raw Leaflet objects
      }
      hasProps = true;
      html += `
        <tr style="border-bottom: 1px solid var(--border-color);">
          <td style="padding: 0.35rem 0.5rem 0.35rem 0; font-weight: 600; color: var(--text-secondary); width: 45%;">${_humanizeKey(key)}</td>
          <td style="padding: 0.35rem 0; color: var(--text-primary); text-align: right; word-break: break-all;">${display}</td>
        </tr>`;
    }

    if (!hasProps) {
      html += `
        <tr>
          <td colspan="2" style="padding: 0.5rem 0; color: var(--text-muted); text-align: center;">No attributes available</td>
        </tr>`;
    }

    html += `
          </tbody>
        </table>
      </div>
    `;
    return html;
  }

  // -------------------------------------------------------
  // Lazy Load change detection GeoJSON (42MB)
  // -------------------------------------------------------
  async function _ensureGeoJSONLoaded() {
    if (_changeGeoJSON) return _changeGeoJSON;

    _showMapLoader('Loading Cape Town change detection (42 MB)\u2026');

    try {
      const path = Loader.DATA_FILES.geojson;
      const res = await fetch(path);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      _changeGeoJSON = await res.json();

      const countEl = document.getElementById('geojson-feature-count');
      if (countEl) countEl.textContent = Utils.formatNumber(_changeGeoJSON.features?.length ?? 0);

      return _changeGeoJSON;
    } catch (err) {
      Utils.showToast(`Unable to load change detection GeoJSON: ${err.message}`, 'error');
      throw err;
    } finally {
      _hideMapLoader();
    }
  }

  // -------------------------------------------------------
  // Lazy Load Vegetation 2024 GeoJSON
  // -------------------------------------------------------
  async function _loadVeg2024() {
    if (_veg2024GeoJSON) {
      console.log('_veg2024GeoJSON populated: true');
      return _veg2024GeoJSON;
    }

    console.log('fetch started: data/geojson/Vegetasi_CapeTown_2024.geojson');
    _showMapLoader('Loading Vegetation 2024 dataset\u2026');

    try {
      const path = Loader.DATA_FILES.veg2024;
      const res = await fetch(path);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      _veg2024GeoJSON = await res.json();
      
      console.log('fetch success: data/geojson/Vegetasi_CapeTown_2024.geojson');
      console.log('number of features:', _veg2024GeoJSON.features?.length ?? 0);
      if (_veg2024GeoJSON.features && _veg2024GeoJSON.features.length > 0) {
        console.log('first feature properties:', JSON.stringify(_veg2024GeoJSON.features[0].properties));
      } else {
        console.log('first feature properties: none');
      }
      
      return _veg2024GeoJSON;
    } catch (err) {
      Utils.showToast(`Unable to load Vegetation 2024 dataset: ${err.message}`, 'error');
      throw err;
    } finally {
      _hideMapLoader();
    }
  }

  // -------------------------------------------------------
  // Lazy Load Vegetation 2025 GeoJSON
  // -------------------------------------------------------
  async function _loadVeg2025() {
    if (_veg2025GeoJSON) return _veg2025GeoJSON;

    _showMapLoader('Loading Vegetation 2025 dataset\u2026');

    try {
      const path = Loader.DATA_FILES.veg2025;
      const res = await fetch(path);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      _veg2025GeoJSON = await res.json();
      return _veg2025GeoJSON;
    } catch (err) {
      Utils.showToast(`Unable to load Vegetation 2025 dataset: ${err.message}`, 'error');
      throw err;
    } finally {
      _hideMapLoader();
    }
  }

  // -------------------------------------------------------
  // Update sidebar row with loading/ready/failed state icon
  // -------------------------------------------------------
  function _updateSidebarRow(layerId, state) {
    _layerStates[layerId] = state;
    const row = document.querySelector(`.filter-item[data-layer-id="${layerId}"]`);
    if (!row) return;

    // Remove any existing status icon
    const old = row.querySelector('.filter-status-icon');
    if (old) old.remove();

    if (state === 'loading') {
      const icon = document.createElement('i');
      icon.className = 'fas fa-spinner fa-spin filter-status-icon';
      icon.style.cssText = 'font-size:0.75rem;color:var(--brand-primary);margin-left:auto;';
      row.appendChild(icon);
    } else if (state === 'failed') {
      const icon = document.createElement('i');
      icon.className = 'fas fa-exclamation-triangle filter-status-icon';
      icon.style.cssText = 'font-size:0.75rem;color:#f59e0b;margin-left:auto;';
      icon.title = 'Dataset unavailable';
      row.appendChild(icon);
    }
    // 'ready' and 'idle' show nothing extra
  }

  // -------------------------------------------------------
  // Build a Leaflet GeoJSON LayerGroup from filtered features
  // -------------------------------------------------------
  function _ensureLayerGroup(layerId) {
    if (layerId === 'veg2024') {
      console.log("_ensureLayerGroup('veg2024') called");
    }
    if (_layerGroups[layerId]) {
      if (layerId === 'veg2024') {
        console.log("veg2024 group retrieved from cache");
      }
      return _layerGroups[layerId];
    }

    const meta = LAYER_META[layerId];
    if (!meta) return null;

    let geojson = null;
    if (layerId === 'veg2024') {
      geojson = _veg2024GeoJSON;
    } else if (layerId === 'veg2025') {
      geojson = _veg2025GeoJSON;
    } else {
      geojson = _changeGeoJSON;
    }

    if (!geojson) return null;

    const features = geojson.features || [];
    let filteredFeatures = [];

    if (layerId === 'gain') {
      filteredFeatures = features.filter(f => f.properties?.kode_perubahan == 1);
    } else if (layerId === 'loss') {
      filteredFeatures = features.filter(f => f.properties?.kode_perubahan == 2);
    } else {
      // Vegetation 2024 and 2025 are independent files, render all features in them
      filteredFeatures = features;
    }

    const group = L.geoJSON(
      { type: 'FeatureCollection', features: filteredFeatures },
      {
        style: (feature) => {
          return {
            fillColor: meta.color,
            weight: 0.6,
            opacity: 0.85,
            color: 'rgba(0,0,0,0.2)',
            fillOpacity: _layerOpacities[layerId] ?? 0.78,
          };
        },
        onEachFeature: (feature, layer) => {
          // Bind popup directly to avoid double-click issue
          layer.bindPopup(() => _buildPopup(meta.label, feature), { maxWidth: 290 });
          layer.on({
            mouseover(e) {
              const lyr = e.target;
              const currentOpacity = _layerOpacities[layerId] ?? 0.78;
              lyr.setStyle({
                weight: 2.0,
                color: '#ffffff',
                fillOpacity: Math.min(1.0, currentOpacity + 0.15)
              });
              const bar = document.getElementById('map-hover-info');
              if (bar) {
                // Read available attributes dynamically
                const val = feature.properties?.class ?? feature.properties?.count ?? 1;
                bar.textContent = `${meta.label} \u2014 Value: ${val}`;
              }
            },
            mouseout(e) {
              group.resetStyle(e.target);
              const bar = document.getElementById('map-hover-info');
              if (bar) bar.textContent = 'Hover over a feature for details';
            },
          });
        }
      }
    );

    if (layerId === 'veg2024') {
      console.log("L.geoJSON created for layer: veg2024");
    }

    _layerGroups[layerId] = group;

    if (layerId === 'veg2024') {
      console.log('group.getLayers().length:', group.getLayers().length);
      try {
        console.log('group.getBounds():', JSON.stringify(group.getBounds()));
      } catch (e) {
        console.log('group.getBounds(): error / invalid (null geometries)');
      }
      console.log('map.hasLayer(group):', map ? map.hasLayer(group) : false);
    }

    // Check bounds validity safely to avoid Leaflet exceptions with geometry: null
    if (group.getBounds) {
      try {
        const bounds = group.getBounds();
        if (bounds && typeof bounds.isValid === 'function' && bounds.isValid()) {
          if (!_allBounds || !_allBounds.isValid()) {
            _allBounds = bounds;
          } else {
            _allBounds.extend(bounds);
          }
        }
      } catch (e) {
        // Safe catch-all for empty or null geometry sets
      }
    }

    return group;
  }

  // -------------------------------------------------------
  // Filter Panel Builder — uses LAYER_META for DRY rendering
  // -------------------------------------------------------
  function _buildFilterPanel() {
    const panel = document.getElementById('map-filter-panel');
    if (!panel) return;

    const isGeoRasterAvailable = (typeof parseGeoraster !== 'undefined' && typeof GeoRasterLayer !== 'undefined');

    const analysisLayers = [
      { id: 'veg2024', name: 'Vegetation 2024', desc: 'Baseline vegetation extent (2024)', color: '#1B5E20' },
      { id: 'veg2025', name: 'Vegetation 2025', desc: 'Post-fire vegetation extent (2025)', color: '#66BB6A' },
      { id: 'gain',    name: 'Vegetation Gain',  desc: 'Areas of vegetation gain / regrowth', color: '#00BCD4' },
      { id: 'loss',    name: 'Vegetation Loss',  desc: 'Areas of vegetation loss / burn scars', color: '#F44336' }
    ];

    const referenceLayers = [
      { id: 'class2024', name: 'Classification 2024', desc: 'Random Forest raster model (2024)', color: '#9C27B0' },
      { id: 'class2025', name: 'Classification 2025', desc: 'Random Forest raster model (2025)', color: '#FFD600' }
    ];

    const boundaryLayer = { id: 'boundary', name: 'Cape Town Boundary', desc: 'Study Area boundary outline', color: '#FFC107' };

    panel.innerHTML = `
      <style>
        .filter-panel-head {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 0.88rem;
          font-weight: 700;
          color: var(--text-primary);
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 0.4rem;
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .filter-panel-head i {
          color: var(--brand-primary);
        }
        .filter-group {
          margin-bottom: 0.65rem;
        }
        .filter-group-header {
          font-size: 0.68rem;
          font-weight: 800;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 0.35rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          padding-bottom: 0.15rem;
        }
        .basemap-options {
          display: flex;
          gap: 0.4rem;
        }
        .basemap-option {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.35rem 0.5rem;
          background: var(--bg-base);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          cursor: pointer;
          font-size: 0.75rem;
          color: var(--text-secondary);
          transition: all 0.2s;
          user-select: none;
        }
        .basemap-option:hover {
          border-color: var(--brand-primary);
          color: var(--text-primary);
        }
        .basemap-option input[type="radio"] {
          margin: 0;
          accent-color: var(--brand-primary);
          cursor: pointer;
        }
        .basemap-option.active {
          border-color: var(--brand-primary);
          background: rgba(16, 185, 129, 0.08);
          color: var(--brand-primary);
          font-weight: 600;
        }
        .filter-list {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }
        .filter-item {
          display: flex;
          flex-direction: column;
          background: rgba(255, 255, 255, 0.01);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          padding: 0.35rem;
          transition: all 0.2s;
          cursor: pointer;
        }
        .filter-item:hover {
          background: rgba(255, 255, 255, 0.03);
          border-color: rgba(255, 255, 255, 0.12);
        }
        .filter-item.active-layer {
          border-color: var(--brand-primary) !important;
          background: rgba(16, 185, 129, 0.04) !important;
        }
        .filter-item-main {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          width: 100%;
        }
        /* Toggle Switch Checkbox Styling */
        .switch {
          position: relative;
          display: inline-block;
          width: 28px;
          height: 16px;
          flex-shrink: 0;
        }
        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .slider-toggle {
          position: absolute;
          cursor: pointer;
          top: 0; left: 0; right: 0; bottom: 0;
          background-color: rgba(255, 255, 255, 0.15);
          transition: .2s;
          border-radius: 16px;
        }
        .slider-toggle:before {
          position: absolute;
          content: "";
          height: 12px;
          width: 12px;
          left: 2px;
          bottom: 2px;
          background-color: white;
          transition: .2s;
          border-radius: 50%;
        }
        input:checked + .slider-toggle {
          background-color: var(--brand-primary);
        }
        input:checked + .slider-toggle:before {
          transform: translateX(12px);
        }
        input:disabled + .slider-toggle {
          background-color: rgba(255, 255, 255, 0.05);
          cursor: not-allowed;
        }
        .filter-swatch {
          width: 12px;
          height: 12px;
          border-radius: 3px;
          flex-shrink: 0;
          display: inline-block;
        }
        .filter-text {
          display: flex;
          flex-direction: column;
          line-height: 1.2;
          flex: 1;
        }
        .filter-name {
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--text-primary);
        }
        .filter-meta {
          font-size: 0.65rem;
          color: var(--text-muted);
        }
        .inline-opacity-container {
          width: 100%;
          padding-left: 2.5rem;
          margin-top: 0.35rem;
          border-top: 1px solid rgba(255, 255, 255, 0.04);
          padding-top: 0.35rem;
        }
        .inline-opacity-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .inline-opacity-slider {
          flex: 1;
          cursor: pointer;
          height: 4px;
          accent-color: var(--brand-primary);
        }
        .inline-opacity-val {
          font-size: 0.7rem;
          font-weight: 700;
          min-width: 28px;
          color: var(--text-secondary);
        }
      </style>

      <div class="filter-panel-head">
        <i class="fas fa-layer-group"></i>
        <span>Layers &amp; Filter Control</span>
      </div>

      <!-- BASEMAP GROUP -->
      <div class="filter-group">
        <div class="filter-group-header">Basemap</div>
        <div class="basemap-options">
          <div class="basemap-option ${_activeBasemapKey === 'Dark Road' ? 'active' : ''}" onclick="MapModule.switchBasemap('Dark Road')">
            <input type="radio" name="basemap-radio" value="Dark Road" ${_activeBasemapKey === 'Dark Road' ? 'checked' : ''} />
            <span>Dark Road</span>
          </div>
          <div class="basemap-option ${_activeBasemapKey === 'Satellite' ? 'active' : ''}" onclick="MapModule.switchBasemap('Satellite')">
            <input type="radio" name="basemap-radio" value="Satellite" ${_activeBasemapKey === 'Satellite' ? 'checked' : ''} />
            <span>Satellite</span>
          </div>
        </div>
      </div>

      <!-- ANALYSIS GROUP -->
      <div class="filter-group">
        <div class="filter-group-header">Analysis</div>
        <div class="filter-list">
          ${analysisLayers.map(lyr => {
            const checked = _layerVisibility[lyr.id] ? 'checked' : '';
            return `
              <div class="filter-item" data-layer-id="${lyr.id}" onclick="MapModule.setActiveLayer('${lyr.id}')">
                <div class="filter-item-main">
                  <label class="switch" onclick="event.stopPropagation();">
                    <input type="checkbox" id="lyr-${lyr.id}" ${checked} onchange="MapModule.toggleLayer('${lyr.id}', this.checked); event.stopPropagation();" />
                    <span class="slider-toggle"></span>
                  </label>
                  <span class="filter-swatch" style="background:${lyr.color};"></span>
                  <div class="filter-text">
                    <span class="filter-name">${lyr.name}</span>
                    <span class="filter-meta">${lyr.desc}</span>
                  </div>
                </div>
                <div class="inline-opacity-container" style="display:none;">
                  <div class="inline-opacity-row">
                    <input type="range" class="inline-opacity-slider" min="0" max="1" step="0.05" value="${_layerOpacities[lyr.id]}" oninput="MapModule.setOpacity(this.value); event.stopPropagation();" />
                    <span class="inline-opacity-val">${Math.round(_layerOpacities[lyr.id] * 100)}%</span>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- REFERENCE GROUP -->
      <div class="filter-group">
        <div class="filter-group-header">Reference</div>
        <div class="filter-list">
          ${referenceLayers.map(lyr => {
            const checked = _layerVisibility[lyr.id] ? 'checked' : '';
            const descHtml = isGeoRasterAvailable 
              ? lyr.desc 
              : '<span style="color:#f59e0b; font-weight: 600;">Classification layer unavailable</span>';
            return `
              <div class="filter-item" data-layer-id="${lyr.id}" onclick="${isGeoRasterAvailable ? `MapModule.setActiveLayer('${lyr.id}')` : ''}">
                <div class="filter-item-main">
                  <label class="switch" onclick="event.stopPropagation();">
                    <input type="checkbox" id="lyr-${lyr.id}" ${checked} ${isGeoRasterAvailable ? '' : 'disabled'} onchange="MapModule.toggleRasterLayer('${lyr.id}', this.checked); event.stopPropagation();" />
                    <span class="slider-toggle"></span>
                  </label>
                  <span class="filter-swatch" style="background:${lyr.color};"></span>
                  <div class="filter-text">
                    <span class="filter-name">${lyr.name}</span>
                    <span class="filter-meta">${descHtml}</span>
                  </div>
                </div>
                ${isGeoRasterAvailable ? `
                <div class="inline-opacity-container" style="display:none;">
                  <div class="inline-opacity-row">
                    <input type="range" class="inline-opacity-slider" min="0" max="1" step="0.05" value="${_layerOpacities[lyr.id] || 0.75}" oninput="MapModule.setOpacity(this.value); event.stopPropagation();" />
                    <span class="inline-opacity-val">${Math.round((_layerOpacities[lyr.id] || 0.75) * 100)}%</span>
                  </div>
                </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- BOUNDARY GROUP -->
      <div class="filter-group" style="margin-bottom: 0;">
        <div class="filter-group-header">Boundary</div>
        <div class="filter-list">
          <div class="filter-item" data-layer-id="boundary" onclick="MapModule.setActiveLayer('boundary')">
            <div class="filter-item-main">
              <label class="switch" onclick="event.stopPropagation();">
                <input type="checkbox" id="lyr-boundary" ${_layerVisibility['boundary'] ? 'checked' : ''} onchange="MapModule.toggleLayer('boundary', this.checked); event.stopPropagation();" />
                <span class="slider-toggle"></span>
              </label>
              <span class="filter-swatch" style="background:transparent; border:2px dashed ${boundaryLayer.color};"></span>
              <div class="filter-text">
                <span class="filter-name">${boundaryLayer.name}</span>
                <span class="filter-meta">${boundaryLayer.desc}</span>
              </div>
            </div>
            <div class="inline-opacity-container" style="display:none;">
              <div class="inline-opacity-row">
                <input type="range" class="inline-opacity-slider" min="0" max="1" step="0.05" value="0.90" disabled style="opacity: 0.5;" />
                <span class="inline-opacity-val">90%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    setActiveLayer(null);
  }

  // -------------------------------------------------------
  // Dynamic Legend — updates based on active layer visibility
  // -------------------------------------------------------
  function _updateLegend() {
    const el = document.getElementById('map-legend');
    if (!el) return;

    const visibleIds = ['veg2024', 'veg2025', 'gain', 'loss', 'boundary']
      .filter(id => _layerVisibility[id]);

    let html = `<h6><i class="fas fa-list" style="margin-right:0.4rem;color:var(--brand-primary);"></i>Vegetation Legend</h6>`;

    if (visibleIds.length === 0) {
      html += `<div style="font-size:0.75rem;color:var(--text-muted);padding:0.25rem 0;">No active layers</div>`;
    } else {
      visibleIds.forEach(id => {
        const m = LAYER_META[id];
        const swatchStyle = id === 'boundary'
          ? `background:transparent;border:2px dashed ${m.color};`
          : `background:${m.color};`;
        html += `
          <div class="legend-item">
            <div class="legend-swatch" style="${swatchStyle}"></div>
            <span>${m.label}</span>
          </div>`;
      });
    }

    el.innerHTML = html;
  }

  // -------------------------------------------------------
  // Public: Toggle layers (basemap, boundary, GeoJSON layers)
  // -------------------------------------------------------
  async function toggleLayer(layerId, visible) {
    if (layerId === 'veg2024') {
      console.log(`toggleLayer('veg2024') executed: visible = ${visible}`);
    }
    _layerVisibility[layerId] = visible;

    // Basemap toggle
    if (layerId === 'basemap') {
      if (visible) {
        if (currentBaseLayer && !map.hasLayer(currentBaseLayer)) currentBaseLayer.addTo(map);
      } else {
        if (currentBaseLayer && map.hasLayer(currentBaseLayer)) map.removeLayer(currentBaseLayer);
      }
      _updateLegend();
      return;
    }

    // Boundary toggle
    if (layerId === 'boundary') {
      if (visible) {
        try {
          await _loadBoundary();
          const bLayer = _ensureBoundaryLayer();
          if (bLayer && !map.hasLayer(bLayer)) bLayer.addTo(map);
        } catch (e) {
          if (_boundaryLayer && !map.hasLayer(_boundaryLayer)) _boundaryLayer.addTo(map);
        }
      } else {
        if (_boundaryLayer && map.hasLayer(_boundaryLayer)) map.removeLayer(_boundaryLayer);
      }
      _updateLegend();
      return;
    }

    // GeoJSON layers
    if (visible) {
      _updateSidebarRow(layerId, 'loading');
      _showMapLoader(`Loading ${LAYER_META[layerId]?.label || layerId}\u2026`);
      try {
        if (layerId === 'veg2024') {
          await _loadVeg2024();
        } else if (layerId === 'veg2025') {
          await _loadVeg2025();
        } else {
          await _ensureGeoJSONLoaded();
        }

        const group = _ensureLayerGroup(layerId);
        if (group && !map.hasLayer(group)) {
          group.addTo(map);
          if (layerId === 'veg2024') {
            console.log('After addTo(map) - map.hasLayer(group):', map.hasLayer(group));
          }
          setActiveLayer(layerId);
          if (group.getBounds) {
            try {
              const bounds = group.getBounds();
              if (bounds && typeof bounds.isValid === 'function' && bounds.isValid()) {
                map.fitBounds(bounds, { padding: [30, 30] });
              }
            } catch (e) {
              // Ignore empty/null geometry bounds error
            }
          }
        }
        _updateSidebarRow(layerId, 'ready');
        Utils.showToast(`${LAYER_META[layerId]?.label || layerId} layer displayed.`, 'success');
      } catch (err) {
        _updateSidebarRow(layerId, 'failed');
        const cb = document.getElementById(`lyr-${layerId}`);
        if (cb) cb.checked = false;
        _layerVisibility[layerId] = false;
      } finally {
        _hideMapLoader();
      }
    } else {
      const group = _layerGroups[layerId];
      if (group && map.hasLayer(group)) map.removeLayer(group);
      if (_activeLayerId === layerId) {
        const remaining = Object.keys(_layerVisibility).find(k => k !== 'basemap' && k !== 'boundary' && _layerVisibility[k]);
        setActiveLayer(remaining || null);
      }
    }

    _updateLegend();
  }

  // -------------------------------------------------------
  // Public: Set Active Layer for Opacity slider
  // -------------------------------------------------------
  function setActiveLayer(layerId) {
    _activeLayerId = layerId;
    document.querySelectorAll('.filter-item').forEach(item => {
      item.classList.remove('active-layer');
      const opacityCont = item.querySelector('.inline-opacity-container');
      if (opacityCont) {
        opacityCont.style.display = 'none';
      }
    });

    if (layerId) {
      const activeItem = document.querySelector(`.filter-item[data-layer-id="${layerId}"]`);
      if (activeItem) {
        activeItem.classList.add('active-layer');
        const opacityCont = activeItem.querySelector('.inline-opacity-container');
        if (opacityCont) {
          opacityCont.style.display = 'block';
          const slider = opacityCont.querySelector('.inline-opacity-slider');
          if (slider) {
            const op = _layerOpacities[layerId] ?? 0.70;
            slider.value = op;
            const valEl = opacityCont.querySelector('.inline-opacity-val');
            if (valEl) valEl.textContent = Math.round(op * 100) + '%';
          }
        }
      }
    }
  }

  // -------------------------------------------------------
  // Public: Set opacity
  // -------------------------------------------------------
  function setOpacity(val) {
    const opacity = parseFloat(val);
    const target = _activeLayerId;
    
    if (target) {
      _layerOpacities[target] = opacity;
      
      const group = _layerGroups[target];
      if (group) {
        group.eachLayer(layer => {
          if (layer.setStyle) layer.setStyle({ fillOpacity: opacity });
        });
      }
      
      const rasterLayer = _rasterLayers[target];
      if (rasterLayer && typeof rasterLayer.setOpacity === 'function') {
        rasterLayer.setOpacity(opacity);
      }

      // Update inline control values
      const activeItem = document.querySelector(`.filter-item[data-layer-id="${target}"]`);
      if (activeItem) {
        const slider = activeItem.querySelector('.inline-opacity-slider');
        if (slider) slider.value = opacity;
        const valEl = activeItem.querySelector('.inline-opacity-val');
        if (valEl) valEl.textContent = Math.round(opacity * 100) + '%';
      }
    }

    // Keep global compatibility controls updated
    const slider = document.getElementById('filter-opacity-slider');
    if (slider) slider.value = val;
    const oldSlider = document.getElementById('opacity-slider');
    if (oldSlider) oldSlider.value = val;
    const lbl = document.getElementById('filter-opacity-val');
    if (lbl) lbl.textContent = Math.round(opacity * 100) + '%';
    const oldLbl = document.getElementById('opacity-label');
    if (oldLbl) oldLbl.textContent = Math.round(opacity * 100) + '%';
  }

  // -------------------------------------------------------
  // Zoom to all features
  // -------------------------------------------------------
  function zoomToLayer() {
    if (_allBounds && _allBounds.isValid()) {
      map.fitBounds(_allBounds, { padding: [30, 30] });
    } else {
      map.setView(CAPE_TOWN_CENTER, DEFAULT_ZOOM);
    }
  }

  // -------------------------------------------------------
  // Locate Me
  // -------------------------------------------------------
  function locateMe() {
    if (!navigator.geolocation) {
      Utils.showToast('Geolocation not supported.', 'warning');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        map.setView([coords.latitude, coords.longitude], 13);
        L.marker([coords.latitude, coords.longitude])
          .addTo(map)
          .bindPopup(`📍 Your Location<br>${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`)
          .openPopup();
        Utils.showToast('Located your position.', 'success');
      },
      () => Utils.showToast('Could not retrieve location.', 'error')
    );
  }

  // -------------------------------------------------------
  // Mouse coordinate tracker
  // -------------------------------------------------------
  function _setupCoordDisplay() {
    const el = document.getElementById('map-coords');
    if (!el) return;
    map.on('mousemove', e => {
      el.textContent = `${e.latlng.lat.toFixed(5)}°, ${e.latlng.lng.toFixed(5)}°`;
    });
    map.on('mouseout', () => { el.textContent = '—'; });
  }

  // -------------------------------------------------------
  // MiniMap
  // -------------------------------------------------------
  function _setupMiniMap() {
    if (typeof L.Control.MiniMap === 'undefined') return;
    const mini = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      { attribution: '', subdomains: 'abcd' });
    miniMap = new L.Control.MiniMap(mini, {
      toggleDisplay: true,
      minimized: false,
      position: 'bottomright',
      width: 140,
      height: 100,
    }).addTo(map);
  }

  // -------------------------------------------------------
  // Raster stores
  // _parsedGeorasters : cache data TIF (parse sekali, reuse)
  // _rasterLayers     : referensi GeoRasterLayer di map
  // -------------------------------------------------------
  const _parsedGeorasters = { class2024: null, class2025: null };
  const _rasterLayers     = { class2024: null, class2025: null };

  // -------------------------------------------------------
  // Raster attempt — GeoRaster + GeoRasterLayer
  // Verifies: file exists, CRS, bounds, georaster parse
  // -------------------------------------------------------
  // Track whether raster setup has already run (prevent duplicate rows)
  let _rasterSetupDone = false;
  function _setupRasterAttempt() {
    if (typeof parseGeoraster === 'undefined') {
      console.info('[Raster] parseGeoraster CDN not ready yet.');
      return;
    }
    _buildFilterPanel();
  }

  // Dipanggil dari index.html setelah CDN load
  function retryRasterSetup() {
    if (!map) { setTimeout(retryRasterSetup, 500); return; }
    _buildFilterPanel();
  }

  // -------------------------------------------------------
  // Raster: parse TIF → render canvas → L.imageOverlay
  // (Tanpa GeoRasterLayer — lebih simpel, tidak ada shared-state bug)
  // -------------------------------------------------------
  async function _buildImageOverlay(layerId) {
    if (typeof parseGeoraster === 'undefined') {
      throw new Error('parseGeoraster library not loaded');
    }

    // 1. Parse TIF (cache per session, satu kali saja)
    if (!_parsedGeorasters[layerId]) {
      const basePath = layerId === 'class2024'
        ? Loader.DATA_FILES.tif2024
        : Loader.DATA_FILES.tif2025;
      console.log(`[Raster] Fetching ${layerId}: ${basePath}`);
      const res = await fetch(basePath, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status} — ${basePath}`);
      const ab  = await res.arrayBuffer();
      _parsedGeorasters[layerId] = await parseGeoraster(ab);
      const gr  = _parsedGeorasters[layerId];
      console.log(`[Raster] ✓ ${layerId} parsed — noData:${gr.noDataValue} w:${gr.width} h:${gr.height}`);
    }

    const gr   = _parsedGeorasters[layerId];
    const IS24 = (layerId === 'class2024');

    // Warna per layer: ungu untuk 2024 (R:156, G:39, B:176), kuning untuk 2025 (R:255, G:214, B:0)
    const [R, G, B] = IS24 ? [156, 39, 176] : [255, 214, 0];

    // 2. Render 1:1 ke canvas sesuai resolusi asli TIF (tanpa downsampling!)
    const W  = gr.width;
    const H  = gr.height;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    const img = ctx.createImageData(W, H);

    // Gunakan Uint32Array 32-bit untuk kecepatan render ultra cepat (ABGR format)
    const data32 = new Uint32Array(img.data.buffer);
    const col32  = (220 << 24) | (B << 16) | (G << 8) | R;  // Alpha 220 (~86%)

    const band = gr.values[0];
    for (let py = 0; py < H; py++) {
      const row = band[py];
      if (!row) continue;
      const rowOffset = py * W;
      for (let px = 0; px < W; px++) {
        const raw = row[px];
        if (raw !== null && raw !== undefined && Math.round(raw) === 1) {
          data32[rowOffset + px] = col32;
        }
      }
    }
    ctx.putImageData(img, 0, 0);

    // 3. Convert ke Blob URL & buat L.imageOverlay dengan rendering pixelated/tajam
    return new Promise((resolve) => {
      cv.toBlob(blob => {
        const imgUrl  = URL.createObjectURL(blob);
        const bounds  = L.latLngBounds([gr.ymin, gr.xmin], [gr.ymax, gr.xmax]);
        const overlay = L.imageOverlay(imgUrl, bounds, {
          opacity:     _layerOpacities[layerId] ?? 0.75,
          interactive: false,
          className:   'crisp-raster-overlay'
        });
        console.log(`[Raster] ✓ 1:1 crisp imageOverlay created for ${layerId} (${W}x${H}px)`);
        resolve(overlay);
      }, 'image/png');
    });
  }

  // -------------------------------------------------------
  // Fullscreen
  // -------------------------------------------------------
  let _isFullscreen = false;

  function toggleFullscreen() {
    const container = document.getElementById('map-container');
    const icon = document.querySelector('#fab-fullscreen i');
    _isFullscreen = !_isFullscreen;
    if (_isFullscreen) {
      container?.classList.add('map-fullscreen');
      if (icon) icon.className = 'fas fa-compress';
    } else {
      container?.classList.remove('map-fullscreen');
      if (icon) icon.className = 'fas fa-expand';
    }
    setTimeout(() => { if (map) map.invalidateSize(); }, 300);
  }

  // -------------------------------------------------------
  // Search (Nominatim)
  // -------------------------------------------------------
  let _searchTimeout = null;

  function _setupSearch() {
    const input = document.getElementById('map-search-input');
    const btn = document.getElementById('map-search-btn');
    const dropdown = document.getElementById('search-results-dropdown');
    if (!input || !btn || !dropdown) return;

    function doSearch() {
      const q = input.value.trim();
      if (q.length < 3) { dropdown.classList.remove('active'); return; }

      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&viewbox=18.3,-34.2,18.9,-33.7&bounded=0`)
        .then(r => r.json())
        .then(results => {
          if (!results.length) {
            dropdown.innerHTML = '<div class="search-result-item"><i class="fas fa-exclamation-circle"></i> No results found</div>';
            dropdown.classList.add('active');
            return;
          }
          dropdown.innerHTML = results.map(r => `
            <div class="search-result-item" data-lat="${r.lat}" data-lon="${r.lon}">
              <i class="fas fa-map-marker-alt"></i> ${r.display_name.substring(0, 80)}
            </div>
          `).join('');
          dropdown.classList.add('active');

          dropdown.querySelectorAll('.search-result-item[data-lat]').forEach(item => {
            item.addEventListener('click', () => {
              const lat = parseFloat(item.dataset.lat);
              const lon = parseFloat(item.dataset.lon);
              map.setView([lat, lon], 14);
              L.marker([lat, lon]).addTo(map)
                .bindPopup(`<strong>${item.textContent.trim()}</strong>`)
                .openPopup();
              dropdown.classList.remove('active');
              input.value = '';
            });
          });
        })
        .catch(() => {
          dropdown.innerHTML = '<div class="search-result-item"><i class="fas fa-times-circle"></i> Search failed</div>';
          dropdown.classList.add('active');
        });
    }

    input.addEventListener('input', () => {
      clearTimeout(_searchTimeout);
      _searchTimeout = setTimeout(doSearch, 400);
    });

    input.addEventListener('keydown', e => { if (e.key === 'Enter') { clearTimeout(_searchTimeout); doSearch(); } });
    btn.addEventListener('click', doSearch);

    // Close dropdown when clicking outside
    document.addEventListener('click', e => {
      if (!e.target.closest('.map-search-control')) dropdown.classList.remove('active');
    });
  }

  // -------------------------------------------------------
  // Measure Tool
  // -------------------------------------------------------
  let _measureMode = null; // 'distance' | 'area' | null
  let _measurePoints = [];
  let _measureLayers = L.featureGroup();
  let _measurePolyline = null;
  let _measurePolygon = null;

  function _setupMeasure() {
    const toolbar = document.getElementById('measure-toolbar');
    const fabBtn = document.getElementById('fab-measure');
    const distBtn = document.getElementById('measure-distance');
    const areaBtn = document.getElementById('measure-area');
    const clearBtn = document.getElementById('measure-clear');
    const resultEl = document.getElementById('measure-result');

    if (!fabBtn || !toolbar) return;

    _measureLayers.addTo(map);

    fabBtn.addEventListener('click', () => {
      toolbar.classList.toggle('active');
      if (!toolbar.classList.contains('active')) _stopMeasure();
    });

    distBtn.addEventListener('click', () => _startMeasure('distance'));
    areaBtn.addEventListener('click', () => _startMeasure('area'));
    clearBtn.addEventListener('click', _clearMeasure);
  }

  function _startMeasure(mode) {
    _stopMeasure();
    _measureMode = mode;
    _measurePoints = [];
    document.getElementById('measure-distance')?.classList.toggle('active', mode === 'distance');
    document.getElementById('measure-area')?.classList.toggle('active', mode === 'area');
    document.getElementById('measure-result').textContent = 'Click on map to start';
    document.getElementById('leaflet-map').style.cursor = 'crosshair';
    map.on('click', _onMeasureClick);
    map.on('mousemove', _onMeasurePreview);
  }

  let _measurePreviewLine = null;

  function _onMeasurePreview(e) {
    if (!_measureMode || _measurePoints.length === 0) return;
    const last = _measurePoints[_measurePoints.length - 1];
    if (_measurePreviewLine) _measureLayers.removeLayer(_measurePreviewLine);
    _measurePreviewLine = L.polyline([last, e.latlng], {
      color: '#3b82f6', weight: 2, dashArray: '4 6', opacity: 0.5,
    }).addTo(_measureLayers);
  }

  function _stopMeasure() {
    _measureMode = null;
    document.getElementById('measure-distance')?.classList.remove('active');
    document.getElementById('measure-area')?.classList.remove('active');
    document.getElementById('leaflet-map').style.cursor = '';
    map.off('click', _onMeasureClick);
    map.off('mousemove', _onMeasurePreview);
    if (_measurePreviewLine) {
      _measureLayers.removeLayer(_measurePreviewLine);
      _measurePreviewLine = null;
    }
  }

  function _clearMeasure() {
    _stopMeasure();
    _measureLayers.clearLayers();
    _measurePoints = [];
    _measurePolyline = null;
    _measurePolygon = null;
    const el = document.getElementById('measure-result');
    if (el) el.textContent = 'Click map to measure';
  }

  function _onMeasureClick(e) {
    _measurePoints.push(e.latlng);
    L.circleMarker(e.latlng, {
      radius: 4, color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 1, weight: 1,
    }).addTo(_measureLayers);

    if (_measureMode === 'distance' && _measurePoints.length >= 2) {
      if (_measurePolyline) _measureLayers.removeLayer(_measurePolyline);
      _measurePolyline = L.polyline(_measurePoints, {
        color: '#3b82f6', weight: 3, dashArray: '8 4',
      }).addTo(_measureLayers);
      let total = 0;
      for (let i = 1; i < _measurePoints.length; i++) {
        total += _measurePoints[i - 1].distanceTo(_measurePoints[i]);
      }
      const el = document.getElementById('measure-result');
      if (el) el.textContent = total >= 1000
        ? `${(total / 1000).toFixed(2)} km`
        : `${total.toFixed(1)} m`;
    }

    if (_measureMode === 'area' && _measurePoints.length >= 3) {
      if (_measurePolygon) _measureLayers.removeLayer(_measurePolygon);
      _measurePolygon = L.polygon(_measurePoints, {
        color: '#8b5cf6', weight: 2, fillColor: '#8b5cf6', fillOpacity: 0.15,
      }).addTo(_measureLayers);

      // Shoelace formula for area in m²
      const lats = _measurePoints.map(p => p.lat * Math.PI / 180);
      const lngs = _measurePoints.map(p => p.lng * Math.PI / 180);
      const R = 6371000;
      let area = 0;
      for (let i = 0; i < lats.length; i++) {
        const j = (i + 1) % lats.length;
        area += (lngs[j] - lngs[i]) * (2 + Math.sin(lats[i]) + Math.sin(lats[j]));
      }
      area = Math.abs(area * R * R / 2);

      const el = document.getElementById('measure-result');
      if (el) {
        if (area >= 1e6) el.textContent = `${(area / 1e6).toFixed(2)} km²`;
        else if (area >= 1e4) el.textContent = `${(area / 1e4).toFixed(2)} ha`;
        else el.textContent = `${area.toFixed(1)} m²`;
      }
    }
  }

  // -------------------------------------------------------
  // Cape Town City Boundary (simplified)
  // -------------------------------------------------------
  let _boundaryLayer = null;
 
  async function _loadBoundary() {
    if (_boundaryGeoJSON) return _boundaryGeoJSON;
    _showMapLoader('Loading City Boundary dataset\u2026');
    try {
      const path = Loader.DATA_FILES.boundary;
      const res = await fetch(path);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      _boundaryGeoJSON = await res.json();
      return _boundaryGeoJSON;
    } catch (err) {
      Utils.showToast(`Unable to load City Boundary dataset: ${err.message}`, 'error');
      throw err;
    } finally {
      _hideMapLoader();
    }
  }

  function _ensureBoundaryLayer() {
    if (_boundaryLayer) return _boundaryLayer;
    if (!_boundaryGeoJSON) return null;

    _boundaryLayer = L.geoJSON(_boundaryGeoJSON, {
      style: {
        color: '#FFC107',
        weight: 2.5,
        dashArray: '10 5',
        fill: false,
        opacity: 0.9,
      },
      onEachFeature: (feature, layer) => {
        layer.bindPopup('<div class="map-popup-content"><h6>Cape Town Metropolitan Area</h6><div class="map-popup-row"><span class="label">Type</span><span class="value">Study Area Boundary</span></div><div class="map-popup-row"><span class="label">Source</span><span class="value">Detailed municipal extent (GeoJSON)</span></div></div>', { maxWidth: 250 });
      }
    });
    return _boundaryLayer;
  }

  function _addCityBoundaryFallback() {
    const coords = [
      [-33.47, 18.30], [-33.47, 18.85], [-33.55, 18.92],
      [-33.70, 18.95], [-33.85, 18.92], [-34.02, 18.88],
      [-34.10, 18.82], [-34.19, 18.65], [-34.21, 18.45],
      [-34.19, 18.37], [-34.10, 18.30], [-33.95, 18.28],
      [-33.80, 18.28], [-33.65, 18.30], [-33.55, 18.32],
      [-33.47, 18.30],
    ];
    _boundaryLayer = L.polygon(coords, {
      color: '#FFC107', weight: 2.5, dashArray: '10 5',
      fill: false, opacity: 0.9,
    });
    _boundaryLayer.bindPopup('<div class="map-popup-content"><h6>Cape Town Metropolitan Area</h6><div class="map-popup-row"><span class="label">Type</span><span class="value">Study Area Boundary</span></div><div class="map-popup-row"><span class="label">Source</span><span class="value">Simplified municipal extent</span></div></div>', { maxWidth: 250 });
  }

  async function _addCityBoundary() {
    try {
      await _loadBoundary();
      const bLayer = _ensureBoundaryLayer();
      if (bLayer) bLayer.addTo(map);
    } catch (e) {
      console.warn("Falling back to simplified boundary:", e.message);
      _addCityBoundaryFallback();
      if (_boundaryLayer) _boundaryLayer.addTo(map);
    }
  }

  // -------------------------------------------------------
  // Map Info Summary (populate from loaded data)
  // -------------------------------------------------------
  function _populateInfoSummary() {
    const stats = Loader.get('statistics');
    if (!stats) return;
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('mis-veg24', Utils.formatNumber(stats.vegetation_2024) + ' ha');
    set('mis-veg25', Utils.formatNumber(stats.vegetation_2025) + ' ha');
    set('mis-gain', '+' + Utils.formatNumber(stats.gain) + ' ha');
    set('mis-loss', '−' + Utils.formatNumber(stats.loss) + ' ha');
    set('mis-net', Utils.formatNumber(stats.net_change) + ' ha (' + Utils.formatPct(stats.percentage) + ')');
  }


  // -------------------------------------------------------
  // Map init
  // -------------------------------------------------------
  async function init() {
    if (map) {
      setTimeout(() => map.invalidateSize(), 200);
      return;
    }

    // Build basemaps (Leaflet must be loaded by now)
    BASEMAPS = _buildBasemaps();

    // Create map
    map = L.map('leaflet-map', {
      center: CAPE_TOWN_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: false,
      attributionControl: true,
      preferCanvas: true,
    });

    // Default basemap = Dark Road
    _activeBasemapKey = 'Dark Road';
    currentBaseLayer = BASEMAPS['Dark Road'];
    currentBaseLayer.addTo(map);

    // Zoom control
    L.control.zoom({ position: 'topleft' }).addTo(map);

    // Layer control (hidden — we use our own basemap switcher)
    layerControl = L.control.layers(BASEMAPS, {}, {
      position: 'topright',
      collapsed: true,
    }).addTo(map);

    // Scale bar
    L.control.scale({ position: 'bottomleft', imperial: false }).addTo(map);

    // Compass North Arrow Control
    const CompassControl = L.Control.extend({
      options: { position: 'topleft' },
      onAdd() {
        const div = L.DomUtil.create('div', 'leaflet-compass-control');
        div.innerHTML = '<div style="width:32px;height:32px;background:var(--card-bg);border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:var(--shadow-lg);cursor:pointer;font-weight:700;font-size:0.8rem;color:var(--brand-primary);border:1px solid var(--border-color);">N</div>';
        div.title = 'Reset North';
        L.DomEvent.disableClickPropagation(div);
        div.addEventListener('click', () => map.setBearing?.(0));
        return div;
      }
    });
    new CompassControl().addTo(map);

    // MiniMap
    _setupMiniMap();

    // Coordinates
    _setupCoordDisplay();

    // City Boundary
    await _addCityBoundary();

    // Search
    _setupSearch();

    // Measure Tool
    _setupMeasure();

    // FAB buttons
    document.getElementById('fab-fullscreen')?.addEventListener('click', toggleFullscreen);
    document.getElementById('fab-locate')?.addEventListener('click', locateMe);
    document.getElementById('fab-zoom-layer')?.addEventListener('click', zoomToLayer);
    document.getElementById('fab-home')?.addEventListener('click', () => map.setView(CAPE_TOWN_CENTER, DEFAULT_ZOOM));

    // Escape key exits fullscreen
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && _isFullscreen) toggleFullscreen();
    });

    // Old opacity slider (top bar) — kept for compat
    document.getElementById('opacity-slider')?.addEventListener('input', e => {
      const val = parseFloat(e.target.value);
      setOpacity(val);
      const lbl = document.getElementById('opacity-label');
      if (lbl) lbl.textContent = Math.round(val * 100) + '%';
    });

    // Track basemap change in LayerControl to keep currentBaseLayer synced
    map.on('baselayerchange', e => {
      currentBaseLayer = e.layer;
      if (!_layerVisibility.basemap) {
        map.removeLayer(e.layer);
      }
    });

    // Update layer z-order so vector layers always render above basemap
    map.on('overlayadd overlayremove', () => {
      setTimeout(() => { if (map) map.invalidateSize(); }, 50);
    });

    // Build the dynamic layer switcher inside the filter panel
    _buildFilterPanel();

    // Update legend to show initial state (boundary visible)
    _updateLegend();

    // Inject active layer highlight styles dynamically
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      .filter-item.active-layer {
        border-color: var(--brand-primary) !important;
        background: rgba(16, 185, 129, 0.08) !important;
      }
    `;
    document.head.appendChild(styleEl);

    // Raster attempt
    _setupRasterAttempt();

    // Populate info summary
    _populateInfoSummary();

    // Fit bounds to City Boundary
    if (_boundaryLayer && _boundaryLayer.getBounds && _boundaryLayer.getBounds().isValid()) {
      map.fitBounds(_boundaryLayer.getBounds(), { padding: [30, 30] });
    } else {
      map.setView(CAPE_TOWN_CENTER, DEFAULT_ZOOM);
    }
  }

  // -------------------------------------------------------
  // Public: Switch basemap (Dark Road / Satellite)
  // -------------------------------------------------------
  function switchBasemap(key) {
    if (!BASEMAPS[key]) return;
    if (_activeBasemapKey === key) return;

    // Remove old basemap
    if (currentBaseLayer && map.hasLayer(currentBaseLayer)) {
      map.removeLayer(currentBaseLayer);
    }

    // Add new basemap
    _activeBasemapKey = key;
    currentBaseLayer = BASEMAPS[key];
    currentBaseLayer.addTo(map);
    // Push basemap below overlay pane
    currentBaseLayer.bringToBack();

    // Update button styles
    const btnDark = document.getElementById('bm-dark');
    const btnSat  = document.getElementById('bm-satellite');
    if (btnDark && btnSat) {
      const activeStyle = 'border:2px solid var(--brand-primary);background:rgba(16,185,129,0.1);color:var(--brand-primary);';
      const inactiveStyle = 'border:2px solid transparent;background:var(--bg-base);color:var(--text-muted);';
      btnDark.style.cssText = (key === 'Dark Road' ? activeStyle : inactiveStyle) +
        'flex:1;padding:0.35rem 0.5rem;border-radius:var(--radius-sm);font-size:0.72rem;font-weight:600;cursor:pointer;transition:all 0.2s;';
      btnSat.style.cssText  = (key === 'Satellite'  ? activeStyle : inactiveStyle) +
        'flex:1;padding:0.35rem 0.5rem;border-radius:var(--radius-sm);font-size:0.72rem;font-weight:600;cursor:pointer;transition:all 0.2s;';
    }

    Utils.showToast(`Basemap: ${key}`, 'success');
  }

  // -------------------------------------------------------
  // Public: Toggle raster layer visibility
  // -------------------------------------------------------
  async function toggleRasterLayer(layerId, visible) {
    console.log(`[Raster] toggleRasterLayer → "${layerId}" visible=${visible}`);
    _layerVisibility[layerId] = visible;

    if (visible) {
      // Hapus layer lama jika ada
      const old = _rasterLayers[layerId];
      if (old && map.hasLayer(old)) map.removeLayer(old);
      _rasterLayers[layerId] = null;

      _updateSidebarRow(layerId, 'loading');
      _showMapLoader(`Loading ${LAYER_META[layerId]?.label || layerId}…`);

      try {
        // Render TIF → canvas → imageOverlay
        const overlay = await _buildImageOverlay(layerId);

        // Race condition guard
        if (!_layerVisibility[layerId]) {
          console.warn(`[Raster] ${layerId} selesai tapi sudah di-off, skip.`);
          return;
        }

        // Pastikan tidak ada layer lama yang masuk saat async
        const cur = _rasterLayers[layerId];
        if (cur && map.hasLayer(cur)) map.removeLayer(cur);

        overlay.addTo(map);
        _rasterLayers[layerId] = overlay;
        setActiveLayer(layerId);
        _updateSidebarRow(layerId, 'ready');
        Utils.showToast(`${LAYER_META[layerId]?.label || layerId} loaded ✓`, 'success');

      } catch (err) {
        console.error(`[Raster] ✗ ${layerId}:`, err.message);
        _updateSidebarRow(layerId, 'failed');
        const cb = document.getElementById(`lyr-${layerId}`);
        if (cb) cb.checked = false;
        _layerVisibility[layerId] = false;
        Utils.showToast(err.message, 'error');
      } finally {
        _hideMapLoader();
      }

    } else {
      const layer = _rasterLayers[layerId];
      if (layer && map.hasLayer(layer)) map.removeLayer(layer);
      _rasterLayers[layerId] = null;
      if (_activeLayerId === layerId) setActiveLayer(null);
    }
  }

  // -------------------------------------------------------
  // Public API
  // -------------------------------------------------------
  return {
    init,
    getMap:           () => map,
    zoomToLayer,
    toggleLayer,
    toggleRasterLayer,
    retryRasterSetup,
    setActiveLayer,
    setOpacity,
    toggleFullscreen,
    switchBasemap,
    CAPE_TOWN_CENTER,
  };

})();

window.MapModule = MapModule;
