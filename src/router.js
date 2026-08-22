// ============================================================
// router.js — Hash-Based SPA Router
// ============================================================

const routes = {};
let currentPath = null;
let notFoundHandler = null;

export function route(path, handler) {
  routes[path] = handler;
}

export function onNotFound(handler) {
  notFoundHandler = handler;
}

export function navigate(path, pushState = true) {
  if (pushState) {
    window.location.hash = path;
  }
  currentPath = path;
  dispatch(path);
}

function dispatch(path) {
  // Exact match
  if (routes[path]) {
    routes[path]({ path, params: {} });
    return;
  }

  // Parametric match (e.g., /hospitals/:id)
  for (const [pattern, handler] of Object.entries(routes)) {
    const params = matchRoute(pattern, path);
    if (params !== null) {
      handler({ path, params });
      return;
    }
  }

  // Not found
  if (notFoundHandler) notFoundHandler({ path, params: {} });
}

function matchRoute(pattern, path) {
  const patternParts = pattern.split('/');
  const pathParts = path.split('/');

  if (patternParts.length !== pathParts.length) return null;

  const params = {};
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      params[patternParts[i].slice(1)] = decodeURIComponent(pathParts[i]);
    } else if (patternParts[i] !== pathParts[i]) {
      return null;
    }
  }
  return params;
}

export function init() {
  window.addEventListener('hashchange', () => {
    const path = window.location.hash.slice(1) || '/';
    dispatch(path);
  });

  // Initial dispatch
  const initial = window.location.hash.slice(1) || '/';
  dispatch(initial);
}

export function getCurrentPath() { return currentPath; }
