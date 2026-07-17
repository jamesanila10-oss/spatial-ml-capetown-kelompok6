/**
 * utils.js — Shared utility functions
 * GeoAI Cape Town WebGIS
 */

'use strict';

const Utils = (() => {

  /**
   * Format a number with comma thousands separator
   * @param {number} n
   * @param {number} decimals
   * @returns {string}
   */
  function formatNumber(n, decimals = 0) {
    if (n === null || n === undefined) return '—';
    return Number(n).toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  /**
   * Format hectares with unit
   * @param {number} ha
   * @returns {string}
   */
  function formatHa(ha) {
    if (Math.abs(ha) >= 1000) {
      return `${formatNumber(ha / 1000, 1)} kha`;
    }
    return `${formatNumber(ha)} ha`;
  }

  /**
   * Format percentage with sign
   * @param {number} pct
   * @returns {string}
   */
  function formatPct(pct) {
    const sign = pct > 0 ? '+' : '';
    return `${sign}${Number(pct).toFixed(1)}%`;
  }

  /**
   * Clamp a value between min and max
   */
  function clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
  }

  /**
   * Get initials from a name string
   * @param {string} name
   * @returns {string}
   */
  function getInitials(name) {
    return name
      .split(' ')
      .map(w => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  /**
   * Create a DOM element with optional class and attributes
   * @param {string} tag
   * @param {Object} opts
   * @returns {HTMLElement}
   */
  function el(tag, opts = {}) {
    const elem = document.createElement(tag);
    if (opts.class) elem.className = opts.class;
    if (opts.id) elem.id = opts.id;
    if (opts.html) elem.innerHTML = opts.html;
    if (opts.text) elem.textContent = opts.text;
    if (opts.attrs) {
      Object.entries(opts.attrs).forEach(([k, v]) => elem.setAttribute(k, v));
    }
    return elem;
  }

  /**
   * Animate a numeric counter from 0 to target
   * @param {HTMLElement} element
   * @param {number} target
   * @param {number} duration (ms)
   * @param {Function} formatter
   */
  function animateCounter(element, target, duration = 1200, formatter = formatNumber) {
    const start = performance.now();
    const isFloat = !Number.isInteger(target);

    function step(now) {
      const elapsed = now - start;
      const progress = clamp(elapsed / duration, 0, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease out cubic
      const current = target * eased;
      element.textContent = formatter(isFloat ? parseFloat(current.toFixed(1)) : Math.round(current));
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /**
   * Animate a progress bar width
   * @param {HTMLElement} barEl
   * @param {number} targetPct (0-100)
   * @param {number} delay (ms)
   */
  function animateBar(barEl, targetPct, delay = 0) {
    setTimeout(() => {
      barEl.style.width = `${targetPct}%`;
    }, delay);
  }

  /**
   * Debounce a function
   */
  function debounce(fn, wait = 200) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), wait);
    };
  }

  /**
   * Vegetation class metadata lookup
   * @param {number} code
   * @returns {{label: string, color: string, code: number}}
   */
  const VEG_CLASSES = {
    0: { label: 'Permanent Non-Vegetation', color: '#d9d9d9', code: 0 },
    1: { label: 'Vegetation Gain',          color: '#4daf4a', code: 1 },
    2: { label: 'Vegetation Loss',          color: '#e41a1c', code: 2 },
    3: { label: 'Permanent Vegetation',     color: '#1a9641', code: 3 },
  };

  function getVegClass(code) {
    return VEG_CLASSES[code] ?? { label: `Class ${code}`, color: '#888888', code };
  }

  /**
   * Download a file by URL
   * @param {string} url
   * @param {string} filename
   */
  function downloadFile(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  /**
   * Show a toast notification
   * @param {string} message
   * @param {'success'|'warning'|'error'|'info'} type
   */
  function showToast(message, type = 'info') {
    const icons = { success: 'fa-check-circle', warning: 'fa-exclamation-triangle', error: 'fa-times-circle', info: 'fa-info-circle' };
    const colors = { success: '#10b981', warning: '#f59e0b', error: '#ef4444', info: '#3b82f6' };

    const toast = el('div', {
      class: 'app-toast',
      html: `<i class="fas ${icons[type]}" style="color:${colors[type]}"></i> <span>${message}</span>`,
    });

    Object.assign(toast.style, {
      position: 'fixed',
      bottom: '1.5rem',
      right: '1.5rem',
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: '10px',
      padding: '0.7rem 1.1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.6rem',
      fontSize: '0.83rem',
      color: 'var(--text-primary)',
      boxShadow: 'var(--shadow-md)',
      zIndex: '9998',
      opacity: '0',
      transform: 'translateY(10px)',
      transition: 'all 0.3s ease',
      backdropFilter: 'blur(12px)',
    });

    document.body.appendChild(toast);
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    });

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3500);
  }

  /**
   * Intersection Observer for triggering animations when element enters viewport
   */
  function observeAnimations() {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in-view');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('[data-animate]').forEach(el => obs.observe(el));
  }

  return {
    formatNumber,
    formatHa,
    formatPct,
    clamp,
    getInitials,
    el,
    animateCounter,
    animateBar,
    debounce,
    getVegClass,
    VEG_CLASSES,
    downloadFile,
    showToast,
    observeAnimations,
  };
})();

window.Utils = Utils;
