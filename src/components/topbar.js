// ============================================================
// topbar.js — Top Bar & Client Demo Presentation Switcher
// ============================================================

import { get, set, setRole } from '../store.js';
import { navigate } from '../router.js';
import { renderSidebar } from './sidebar.js';
import { refreshIcons } from './icons.js';
import { showToast } from './toast.js';

const roleLabels = {
  superadmin: 'Super Admin',
  hospitaladmin: 'Hospital Admin',
  doctor: 'Doctor',
  receptionist: 'Receptionist',
};

const roleHomeRoutes = {
  superadmin: '/sa/dashboard',
  hospitaladmin: '/ha/dashboard',
  doctor: '/dr/dashboard',
  receptionist: '/rc/queue',
};

export function renderTopbar(opts = {}) {
  const topbar = document.getElementById('topbar');
  if (!topbar) return;

  // Restore topbar and sidebar visibility in case we navigated from login
  topbar.style.display = 'flex';
  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.style.display = 'flex';
  document.body.classList.remove('is-login');

  const content = document.getElementById('content');
  if (content) {
    content.removeAttribute('style');
  }

  const role = get('currentRole') || 'superadmin';
  const { breadcrumb = [] } = opts;

  let userInfo = { name: 'Platform Owner', role: roleLabels[role] || role, initials: 'PO', avatarColor: '#0B5FA5' };

  if (role === 'hospitaladmin') {
    userInfo = { name: 'Dr. Rajesh Mehta', role: 'Hospital Administrator', initials: 'RM', avatarColor: '#0F7A6C' };
  } else if (role === 'doctor') {
    userInfo = { name: 'Dr. Meera Joshi', role: 'Cardiologist', initials: 'MJ', avatarColor: '#0B5FA5' };
  } else if (role === 'receptionist') {
    userInfo = { name: 'Rekha Sharma', role: 'Front Desk Lead', initials: 'RS', avatarColor: '#D97706' };
  }

  const bcHtml = breadcrumb.length > 0 ? `
    <div class="topbar-breadcrumb">
      ${breadcrumb.map((b, i) => `
        ${i > 0 ? '<span class="bc-sep">/</span>' : ''}
        ${i === breadcrumb.length - 1
          ? `<span class="bc-current">${b.label}</span>`
          : `<span style="cursor:pointer" onclick="navigateTo('${b.path}')">${b.label}</span>`
        }
      `).join('')}
    </div>
  ` : '';

  topbar.innerHTML = `
    <div class="topbar-search">
      <i data-lucide="search" class="search-icon"></i>
      <input type="text" placeholder="Search patients, appointments, doctors..." id="topbar-search-input" />
    </div>

    ${bcHtml}

    <div class="topbar-actions">
      <button class="topbar-icon-btn" title="QR Code Generator" onclick="navigateTo('/whatsapp')">
        <i data-lucide="qr-code"></i>
      </button>
      <button class="topbar-icon-btn" title="Notifications" onclick="navigateTo('/ha/notifications')">
        <i data-lucide="bell"></i>
        <span class="topbar-notif-dot"></span>
      </button>
      <button class="topbar-icon-btn" title="WhatsApp Patient Simulator" onclick="navigateTo('/whatsapp')">
        <i data-lucide="smartphone" style="color:#25D366"></i>
      </button>
      
      <div class="topbar-divider"></div>
      
      <!-- User Profile with Logout Dropdown Trigger -->
      <div class="topbar-user" onclick="handleUserLogout()" title="Click to Sign Out" style="cursor:pointer">
        <div class="user-avatar" style="background:${userInfo.avatarColor}">${userInfo.initials}</div>
        <div class="user-info">
          <div class="user-name">${userInfo.name}</div>
          <div class="user-role">${userInfo.role}</div>
        </div>
        <i data-lucide="log-out" style="width:16px;height:16px;color:var(--color-text-muted);margin-left:4px" title="Sign Out"></i>
      </div>
    </div>
  `;

  refreshIcons(topbar);

  // Update demo switcher visibility based on state
  updateDemoSwitcherVisibility(get('clientDemoMode') || false);
}

// ── Client Demo Presentation Role Switcher ───────────────────
// Only displayed when Client Showcase Mode is activated via Super Admin
export function renderRoleSwitcher() {
  const isDemoActive = get('clientDemoMode') || false;
  updateDemoSwitcherVisibility(isDemoActive);
}

export function updateDemoSwitcherVisibility(isActive) {
  const bar = document.getElementById('role-switcher-bar');
  if (!bar) return;

  document.body.classList.toggle('has-demo-switcher', !!isActive);

  if (!isActive) {
    bar.style.display = 'none';
    bar.innerHTML = '';
    return;
  }

  bar.style.display = 'flex';
  const currentRole = get('currentRole') || 'hospitaladmin';

  // Client demo showcase switcher ONLY shows Hospital Admin, Doctor, and Receptionist (Hides Super Admin)
  const clientDemoRoles = [
    { key: 'hospitaladmin', label: '🏥 Hospital Admin', desc: 'Full Management' },
    { key: 'doctor', label: '🩺 Doctor View', desc: 'Consultation & Rx' },
    { key: 'receptionist', label: '🛎️ Receptionist', desc: 'Front Desk Queue' }
  ];

  bar.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px">
      <span class="rsb-badge" style="background:#0F7A6C;color:white">✨ Client Showcase Active</span>
      <span class="rsb-label" style="font-weight:700">Switch Persona:</span>
    </div>

    <div style="display:flex;align-items:center;gap:6px">
      ${clientDemoRoles.map(r => `
        <button class="rsb-btn ${currentRole === r.key ? 'active' : ''}"
          onclick="switchDemoRole('${r.key}')" style="font-weight:700">
          ${r.label}
        </button>
      `).join('')}
    </div>

    <div class="rsb-right" style="display:flex;align-items:center;gap:12px">
      <button class="btn btn-sm btn-secondary" onclick="navigateTo('/whatsapp')" style="height:32px;font-size:12px;padding:4px 12px;background:rgba(255,255,255,0.2);color:white;border:1px solid rgba(255,255,255,0.3)">
        <i data-lucide="qr-code" style="width:14px;height:14px"></i> QR Standee
      </button>
      <button class="btn btn-sm btn-danger" onclick="exitDemoShowcase()" style="height:32px;font-size:12px;padding:4px 12px">
        ✕ Exit Showcase
      </button>
    </div>
  `;

  refreshIcons(bar);
}

window.switchDemoRole = (role) => {
  setRole(role);
  updateDemoSwitcherVisibility(true);
  renderSidebar();
  const home = roleHomeRoutes[role] || '/ha/dashboard';
  navigate(home);
};

window.exitDemoShowcase = () => {
  set('clientDemoMode', false);
  updateDemoSwitcherVisibility(false);
  setRole('superadmin');
  showToast({ title: 'Exited Showcase Mode', message: 'Returned to Super Admin command center.', type: 'info' });
  navigate('/sa/dashboard');
};

window.handleUserLogout = () => {
  set('isAuthenticated', false);
  set('clientDemoMode', false);
  updateDemoSwitcherVisibility(false);
  showToast({ title: 'Signed Out', message: 'Session closed successfully.', type: 'info' });
  navigate('/login');
};
