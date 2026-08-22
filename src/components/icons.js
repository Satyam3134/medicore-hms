// ============================================================
// icons.js — Centralized Icon Helper using Lucide
// ============================================================

import { createIcons, icons } from 'lucide';

// Attach globally for dynamic innerHTML usage
window.lucide = {
  createIcons: (options = {}) => {
    return createIcons({
      icons,
      nameAttr: 'data-lucide',
      attrs: {
        'stroke-width': 2,
        class: 'lucide-icon',
        ...options.attrs
      },
      ...options
    });
  }
};

/**
 * Re-scans and initializes all icons in a given container or whole page
 * @param {HTMLElement} root - container element (defaults to document.body)
 */
export function refreshIcons(root = document.body) {
  try {
    window.lucide.createIcons({ el: root });
  } catch (err) {
    console.warn('Lucide icon refresh warning:', err);
  }
}
