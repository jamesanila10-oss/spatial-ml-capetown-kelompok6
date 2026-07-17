/**
 * main.js — Application entry point & router
 * GeoAI Cape Town WebGIS
 *
 * Bootstraps the application:
 * 1. Shows loading overlay
 * 2. Loads all config data via Loader
 * 3. Initializes UI (theme, sidebar, nav)
 * 4. Renders default section (Home)
 * 5. Wires navigation events
 */

'use strict';

const App = (() => {

  // Current active section
  let _currentSection = 'home';
  // Store loaded config data
  let _data = {};
  // Map initialized flag
  let _mapInitialized = false;

  // Section → render function mapping
  const SECTION_RENDERERS = {
    home:    () => Dashboard.renderHome(document.getElementById('section-home'), _data),
    data:    () => Dashboard.renderDataProcess(document.getElementById('section-data'), _data),
    model:   () => Dashboard.renderModelEvaluation(document.getElementById('section-model'), _data),
    insights:() => Dashboard.renderInsights(document.getElementById('section-insights'), _data),
    about:   () => Dashboard.renderAbout(document.getElementById('section-about'), _data),
    map:     () => {
      if (!_mapInitialized) {
        _mapInitialized = true;
        MapModule.init();
      } else {
        // Ensure map redraws if section was hidden
        setTimeout(() => {
          const m = MapModule.getMap();
          if (m) m.invalidateSize();
        }, 300);
      }
    },
  };

  // -------------------------------------------------------
  // Navigation
  // -------------------------------------------------------
  function navigate(sectionId) {
    if (sectionId === _currentSection) return;

    // Hide all sections
    document.querySelectorAll('.app-section').forEach(s => s.classList.remove('active'));
    // Show target
    const target = document.getElementById(`section-${sectionId}`);
    if (target) target.classList.add('active');

    // Update nav items
    document.querySelectorAll('.nav-item-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.section === sectionId);
    });

    _currentSection = sectionId;

    // Render section content
    const renderer = SECTION_RENDERERS[sectionId];
    if (renderer) renderer();

    // Close mobile sidebar
    if (window.innerWidth <= 768) {
      document.getElementById('sidebar')?.classList.remove('mobile-open');
      document.getElementById('sidebar-overlay')?.classList.remove('active');
    }

    // Update URL hash
    window.history.replaceState(null, '', `#${sectionId}`);

    // Trigger animation observers
    setTimeout(Utils.observeAnimations, 200);
  }

  // -------------------------------------------------------
  // Theme Toggle
  // -------------------------------------------------------
  function initTheme() {
    const saved = localStorage.getItem('geoai-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    updateThemeIcon(saved);

    document.getElementById('theme-toggle')?.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('geoai-theme', next);
      updateThemeIcon(next);
    });
  }

  function updateThemeIcon(theme) {
    const icon = document.querySelector('#theme-toggle i');
    if (!icon) return;
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
  }

  // -------------------------------------------------------
  // Sidebar
  // -------------------------------------------------------
  function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const collapseBtn = document.getElementById('sidebar-collapse-btn');
    const mainContent = document.getElementById('main-content');
    const mobileToggle = document.getElementById('sidebar-toggle');
    const overlay = document.getElementById('sidebar-overlay');

    // Collapse state from localStorage
    const collapsed = localStorage.getItem('geoai-sidebar-collapsed') === 'true';
    if (collapsed) {
      sidebar?.classList.add('collapsed');
      mainContent?.classList.add('sidebar-collapsed');
      updateCollapseIcon(true);
    }

    // Desktop collapse
    collapseBtn?.addEventListener('click', () => {
      const isCollapsed = sidebar?.classList.toggle('collapsed');
      mainContent?.classList.toggle('sidebar-collapsed', isCollapsed);
      localStorage.setItem('geoai-sidebar-collapsed', isCollapsed);
      updateCollapseIcon(isCollapsed);

      // Re-render map if visible
      setTimeout(() => {
        const m = MapModule.getMap();
        if (m) m.invalidateSize();
      }, 420);
    });

    // Mobile toggle
    mobileToggle?.addEventListener('click', () => {
      sidebar?.classList.toggle('mobile-open');
      overlay?.classList.toggle('active');
    });

    // Overlay click closes sidebar
    overlay?.addEventListener('click', () => {
      sidebar?.classList.remove('mobile-open');
      overlay?.classList.remove('active');
    });
  }

  function updateCollapseIcon(isCollapsed) {
    const icon = document.querySelector('#sidebar-collapse-btn i');
    if (!icon) return;
    icon.className = isCollapsed ? 'fas fa-chevron-right' : 'fas fa-chevron-left';
  }

  // -------------------------------------------------------
  // Navigation wiring
  // -------------------------------------------------------
  function initNav() {
    document.querySelectorAll('.nav-item-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const section = btn.dataset.section;
        if (section) navigate(section);
      });
    });
  }

  // -------------------------------------------------------
  // Loading overlay
  // -------------------------------------------------------
  function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (!overlay) return;
    overlay.classList.add('fade-out');
    setTimeout(() => overlay.remove(), 600);
  }

  // -------------------------------------------------------
  // Boot
  // -------------------------------------------------------
  async function boot() {
    // Initialize theme immediately
    initTheme();

    // Load config data
    _data = await Loader.boot();

    // Short pause for visual
    await new Promise(r => setTimeout(r, 600));

    // Init UI
    initSidebar();
    initNav();

    // Render initial section
    const hash = window.location.hash.replace('#', '') || 'home';
    const validSections = Object.keys(SECTION_RENDERERS);
    const startSection = validSections.includes(hash) ? hash : 'home';

    // Show home section
    document.getElementById(`section-${startSection}`)?.classList.add('active');
    document.querySelector(`[data-section="${startSection}"]`)?.classList.add('active');
    _currentSection = startSection;

    const renderer = SECTION_RENDERERS[startSection];
    if (renderer) renderer();

    // Hide loading
    hideLoading();

    // Trigger initial animations
    setTimeout(Utils.observeAnimations, 400);

    console.log('[App] Boot complete. Section:', startSection, '| Data:', _data);
  }

  // -------------------------------------------------------
  // Start on DOM ready
  // -------------------------------------------------------
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  return { navigate, getData: () => _data };

})();

window.App = App;
