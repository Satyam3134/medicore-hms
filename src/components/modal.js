// ============================================================
// modal.js — Modal & Drawer Manager
// ============================================================

let activeModal = null;
let activeDrawer = null;

export function openModal({ title, body, footer = '', size = '', onClose = null }) {
  closeModal();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal ${size ? 'modal-' + size : ''}">
      <div class="modal-header">
        <h2 class="modal-title">${title}</h2>
        <button class="modal-close" id="modal-close-btn">
          <i data-lucide="x" style="width:18px;height:18px"></i>
        </button>
      </div>
      <div class="modal-body">${body}</div>
      ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
    </div>
  `;

  document.body.appendChild(overlay);
  if (window.lucide) lucide.createIcons({ el: overlay });
  activeModal = overlay;

  // Close on backdrop click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal(onClose);
  });

  document.getElementById('modal-close-btn').addEventListener('click', () => closeModal(onClose));

  // Close on Escape
  document.addEventListener('keydown', handleEsc);

  return overlay;
}

export function closeModal(onClose) {
  if (activeModal) {
    activeModal.remove();
    activeModal = null;
    if (typeof onClose === 'function') onClose();
  }
  document.removeEventListener('keydown', handleEsc);
}

function handleEsc(e) {
  if (e.key === 'Escape') closeModal();
}

export function openDrawer({ title, body, footer = '' }) {
  closeDrawer();
  const overlay = document.createElement('div');
  overlay.className = 'drawer-overlay';
  overlay.id = 'drawer-overlay';

  const drawer = document.createElement('div');
  drawer.className = 'drawer';
  drawer.id = 'active-drawer';
  drawer.innerHTML = `
    <div class="drawer-header">
      <h2 class="modal-title">${title}</h2>
      <button class="modal-close" id="drawer-close-btn">
        <i data-lucide="x" style="width:18px;height:18px"></i>
      </button>
    </div>
    <div class="drawer-body">${body}</div>
    ${footer ? `<div class="drawer-footer">${footer}</div>` : ''}
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(drawer);
  if (window.lucide) {
    lucide.createIcons({ el: overlay });
    lucide.createIcons({ el: drawer });
  }

  activeDrawer = { overlay, drawer };

  overlay.addEventListener('click', closeDrawer);
  document.getElementById('drawer-close-btn').addEventListener('click', closeDrawer);

  return drawer;
}

export function closeDrawer() {
  if (activeDrawer) {
    activeDrawer.overlay.remove();
    activeDrawer.drawer.remove();
    activeDrawer = null;
  }
}

// Confirm dialog
export function confirmDialog({ title, message, confirmLabel = 'Confirm', danger = false, onConfirm }) {
  openModal({
    title,
    size: 'sm',
    body: `<p style="color:var(--color-text-muted);font-size:14px;line-height:1.6">${message}</p>`,
    footer: `
      <button class="btn btn-secondary" onclick="window._closeConfirm()">Cancel</button>
      <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" onclick="window._doConfirm()">${confirmLabel}</button>
    `
  });

  window._closeConfirm = closeModal;
  window._doConfirm = () => {
    closeModal();
    if (typeof onConfirm === 'function') onConfirm();
  };
}
