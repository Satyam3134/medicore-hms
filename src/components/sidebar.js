// ============================================================
// sidebar.js — Role-Aware Left Navigation (10 Super Admin Modules)
// ============================================================

import { navigate } from '../router.js';
import { get, set } from '../store.js';
import { refreshIcons } from './icons.js';

const navConfig = {
  superadmin: [
    { type: 'section', label: 'Command & Monitoring' },
    { type: 'link', path: '/sa/dashboard', label: '1. Command Center', icon: 'layout-dashboard' },
    { type: 'link', path: '/sa/hospitals', label: '2. Hospitals Directory', icon: 'building-2' },
    { type: 'link', path: '/sa/hospitals/new', label: '3. Onboard Hospital', icon: 'plus-circle' },

    { type: 'section', label: 'Business & Revenue' },
    { type: 'link', path: '/sa/billing', label: '4. Subscription Plans', icon: 'layers' },
    { type: 'link', path: '/sa/invoices', label: 'Tenant Invoices', icon: 'receipt', badge: 'GST' },
    { type: 'link', path: '/sa/analytics', label: '5. Platform Analytics', icon: 'bar-chart-2' },

    { type: 'section', label: 'Flagship Channels' },
    { type: 'link', path: '/sa/whatsapp-hub', label: '6. WhatsApp Hub', icon: 'message-square', badge: 'META' },

    { type: 'section', label: 'Platform Administration' },
    { type: 'link', path: '/sa/databases', label: 'Databases & Backups', icon: 'database', badge: 'VAULT' },
    { type: 'link', path: '/sa/platform-users', label: '7. Team & Roles', icon: 'users-round' },
    { type: 'link', path: '/sa/alerts', label: '8. Actionable Alerts', icon: 'bell', badge: '2' },
    { type: 'link', path: '/sa/support', label: '9. Support Helpdesk', icon: 'life-buoy' },
    { type: 'link', path: '/sa/settings', label: '10. Settings & Audit', icon: 'shield-check' },

    { type: 'section', label: 'Client Showcase & Tools' },
    { type: 'link', path: '/sa/demo-sandbox', label: 'Client Demo & Sandbox', icon: 'presentation', badge: 'DEMO' },
    { type: 'link', path: '/whatsapp', label: 'Patient QR & Bot Flow', icon: 'smartphone', badge: 'META' },
    { type: 'link', path: '/sa/staff-directory', label: 'Global Staff Directory', icon: 'stethoscope', badge: 'P2' },
    { type: 'link', path: '/sa/compliance', label: 'Data Compliance', icon: 'file-check-2', badge: 'P2' },
    { type: 'link', path: '/sa/integrations', label: 'API Integrations', icon: 'plug', badge: 'P2' },
  ],
  hospitaladmin: [
    { type: 'section', label: 'Phase 1 — Core Operations' },
    { type: 'link', path: '/ha/dashboard', label: '1. Dashboard', icon: 'layout-dashboard' },
    { type: 'link', path: '/ha/staff', label: '2. Staff & Doctors', icon: 'stethoscope' },
    { type: 'link', path: '/ha/patients', label: '3. Patient Directory', icon: 'user-round' },
    { type: 'link', path: '/ha/doctor-assignment', label: '4. Doctor Assignment', icon: 'user-check', badge: 'TRIAGE' },
    { type: 'link', path: '/ha/appointments', label: '5. Appointments', icon: 'calendar-check' },
    { type: 'link', path: '/ha/departments', label: '6. Departments', icon: 'layers' },
    { type: 'link', path: '/ha/queue', label: '7. Front Desk Queue', icon: 'list-ordered', badge: 'LIVE' },

    { type: 'section', label: 'Phase 1 — Finance & BI' },
    { type: 'link', path: '/ha/billing', label: '8. Patient Billing', icon: 'receipt' },
    { type: 'link', path: '/ha/reports', label: '9. Reports & Analytics', icon: 'bar-chart-2' },

    { type: 'section', label: 'Phase 2 — Inpatient & Ancillary' },
    { type: 'link', path: '/ha/beds', label: '10. Bed & Ward Grid', icon: 'bed', badge: 'IPD' },
    { type: 'link', path: '/ha/pharmacy', label: '11. Pharmacy & Stock', icon: 'pill', badge: 'Rx' },
    { type: 'link', path: '/ha/lab', label: '12. Lab & Diagnostics', icon: 'flask-conical', badge: 'LAB' },
    { type: 'link', path: '/ha/notifications', label: '13. Activity Feed', icon: 'bell', badge: 'FEED' },
    { type: 'link', path: '/ha/settings', label: '14. Hospital Settings', icon: 'settings', badge: 'CONFIG' },

    { type: 'section', label: 'Patient Acquisition' },
    { type: 'link', path: '/whatsapp', label: 'WhatsApp QR & Bot Flow', icon: 'smartphone', badge: 'META' },
  ],
  doctor: [
    { type: 'section', label: 'Phase 1 — Clinical Operations' },
    { type: 'link', path: '/dr/dashboard', label: '1. OPD Dashboard', icon: 'layout-dashboard' },
    { type: 'link', path: '/dr/patients', label: '2. My Patients', icon: 'users' },
    { type: 'link', path: '/dr/schedule', label: '3. Schedule & Sync', icon: 'calendar', badge: 'SYNC' },
    { type: 'link', path: '/dr/consultation/p1', label: '4. Active Consultation', icon: 'stethoscope', badge: 'EMR' },

    { type: 'section', label: 'Phase 2 — Clinical Productivity' },
    { type: 'link', path: '/dr/templates', label: '6. Rx Templates', icon: 'file-text', badge: 'Rx' },
    { type: 'link', path: '/dr/leave-requests', label: '7. Leave Requests', icon: 'calendar-off' },
    { type: 'link', path: '/dr/referrals', label: '8. Inter-Doctor Referrals', icon: 'share-2' },
    { type: 'link', path: '/dr/analytics', label: '9. Self-View Analytics', icon: 'bar-chart-2' },
  ],
  receptionist: [
    { type: 'section', label: 'Phase 1 — Front Desk Core' },
    { type: 'link', path: '/rc/queue', label: "1. Today's Live Queue", icon: 'list-ordered' },
    { type: 'link', path: '/rc/checkin', label: '2. Patient Check-In', icon: 'user-check', badge: 'ARRIVAL' },
    { type: 'link', path: '/rc/quick-book', label: '3. Quick Book / Walk-in', icon: 'calendar-plus', badge: 'FAST' },
    { type: 'link', path: '/rc/appointments', label: '4. Appointments Ledger', icon: 'calendar-check' },
    { type: 'link', path: '/rc/patients', label: '5. Patient Directory', icon: 'user-round' },
    { type: 'link', path: '/rc/whatsapp-inbox', label: '6. WhatsApp Inbox', icon: 'smartphone', badge: 'META' },

    { type: 'section', label: 'Phase 2 — Front Desk Operations' },
    { type: 'link', path: '/rc/billing-handoff', label: '7. Billing Handoff', icon: 'receipt' },
    { type: 'link', path: '/rc/daily-reports', label: '8. Daily Shift Report', icon: 'bar-chart-2' },
    { type: 'link', path: '/rc/alerts', label: '9. Operational Alerts', icon: 'bell', badge: '3' },
  ]
};

export function renderSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  const role = get('currentRole') || 'superadmin';
  const currentPath = window.location.hash.slice(1) || '/';
  const items = navConfig[role] || [];
  const hospital = role !== 'superadmin' ? get('hospitals')?.find(h => h.id === get('currentHospitalId')) : null;

  sidebar.innerHTML = `
    <div class="sidebar-logo">
      <div class="logo-icon">
        <i data-lucide="cross" style="width:24px;height:24px"></i>
      </div>
      <div class="logo-text">
        MediCore
        <div class="logo-sub">${role === 'superadmin' ? 'Super Admin Portal' : 'Hospital Workspace'}</div>
      </div>
    </div>

    ${hospital ? `
      <div class="sidebar-hospital-selector">
        <div class="hs-label">Active Hospital</div>
        <div class="hs-name" title="${hospital.name}">${hospital.name}</div>
      </div>
    ` : ''}

    <nav style="padding: 10px 0">
      ${items.map(item => {
        if (item.type === 'section') {
          return `
            <div class="sidebar-section">
              <div class="sidebar-section-label">${item.label}</div>
            </div>
          `;
        }
        const isActive = currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path + '/'));
        return `
          <div class="nav-item ${isActive ? 'active' : ''}" data-path="${item.path}" onclick="navigateTo('${item.path}')">
            <i data-lucide="${item.icon}" class="nav-icon"></i>
            <span class="nav-label">${item.label}</span>
            ${item.badge ? `<span class="nav-badge ${item.badge === 'META' ? 'badge-wa' : item.badge === 'P2' ? 'badge-gray' : ''}" style="${item.badge === 'META' ? 'background:#25D366;color:white' : ''}">${item.badge}</span>` : ''}
          </div>
        `;
      }).join('')}
    </nav>

    <div class="sidebar-footer">
      <div class="nav-item" onclick="handleUserLogout()" style="color:var(--color-danger);cursor:pointer">
        <i data-lucide="log-out" class="nav-icon"></i>
        <span class="nav-label">Sign Out</span>
      </div>
    </div>
  `;

  refreshIcons(sidebar);
}

// Expose navigate globally for onclick handlers
window.navigateTo = (path) => {
  navigate(path);
  renderSidebar();
};
