/**
 * loader.js — Data bootstrap & config loader
 * GeoAI Cape Town WebGIS
 *
 * Loads all configuration JSON files from config/
 * and makes them available globally before the app starts.
 */

'use strict';

const Loader = (() => {

  // Paths resolved relative to project root
  const CONFIG_PATHS = {
    metrics:     'config/metrics.json',
    statistics:  'config/statistics.json',
    projectInfo: 'config/project_info.json',
  };

  // Detected data files
  const DATA_FILES = {
    geojson: 'data/geojson/Perubahan_Vegetasi_CapeTown_2024_2025.geojson',
    veg2024: 'data/geojson/Vegetasi_CapeTown_2024.geojson',
    veg2025: 'data/geojson/Vegetasi_CapeTown_2025.geojson',
    boundary: 'data/geojson/Boundary_CapeTown.geojson',
    tif2024: 'data/raster/Classification_CapeTown_2024.tif',
    tif2025: 'data/raster/Classification_CapeTown_2025.tif',
  };

  // Asset files
  const ASSET_FILES = {
    workflow: 'assets/workflow.png',
  };

  // Loaded config store
  let _store = {
    metrics:     null,
    statistics:  null,
    projectInfo: null,
    ready:       false,
  };

  /**
   * Fetch a single JSON file with error handling
   */
  async function fetchJSON(path) {
    const res = await fetch(`${path}?v=1.2.2`);
    if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status} ${res.statusText}`);
    return res.json();
  }

  /**
   * Update the loading status text shown on the loading overlay
   */
  function setStatus(text) {
    const el = document.getElementById('loading-status');
    if (el) el.textContent = text;
  }

  /**
   * Main boot function — loads all configs in parallel
   * Returns the populated store object
   */
  async function boot() {
    try {
      setStatus('Initializing application…');

      setStatus('Loading project configuration…');
      const [metrics, statistics, projectInfo] = await Promise.all([
        fetchJSON(CONFIG_PATHS.metrics),
        fetchJSON(CONFIG_PATHS.statistics),
        fetchJSON(CONFIG_PATHS.projectInfo),
      ]);

      _store.metrics     = metrics;
      _store.statistics  = statistics;
      _store.projectInfo = projectInfo;
      _store.ready       = true;

      setStatus('Configuration loaded ✓');
      console.log('[Loader] All configs loaded successfully:', _store);

      return _store;

    } catch (err) {
      console.error('[Loader] Boot failed:', err);
      setStatus(`Error: ${err.message}`);
      Utils.showToast(`Config load error: ${err.message}`, 'error');
      // Return partial store so app can still render
      _store.ready = false;
      return _store;
    }
  }

  /**
   * Get a config value by key
   */
  function get(key) {
    return _store[key];
  }

  /**
   * Get all loaded data
   */
  function getAll() {
    return { ..._store };
  }

  /**
   * Return resolved data file paths
   */
  function getDataPaths() {
    return { ...DATA_FILES };
  }

  /**
   * Return asset file paths
   */
  function getAssetPaths() {
    return { ...ASSET_FILES };
  }

  return {
    boot,
    get,
    getAll,
    getDataPaths,
    getAssetPaths,
    CONFIG_PATHS,
    DATA_FILES,
    ASSET_FILES,
  };

})();

window.Loader = Loader;
