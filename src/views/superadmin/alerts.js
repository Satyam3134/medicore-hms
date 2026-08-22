// ============================================================
// superadmin/alerts.js — Module 8: Notifications & Actionable Alerts
// ============================================================

import { renderTopbar } from '../../components/topbar.js';
import { renderSidebar } from '../../components/sidebar.js';
import { get, acknowledgeAlert } from '../../store.js';
import { showToast } from '../../components/toast.js';
import { refreshIcons } from '../../components/icons.js';

export function renderSAAlerts() {
  renderSidebar();
  renderTopbar({ breadcrumb: [{ label: 'Super Admin', path: '/sa/dashboard' }, { label: 'Actionable Alerts' }] });

  const alerts = get('platformAlerts') || [];
  const critical = alerts.filter(a => a.severity === 'critical' && !a.acknowledged).length;
  const warning = alerts.filter(a => a.severity === 'warning' && !a.acknowledged).length;
  const info = alerts.filter(a => a.severity === 'info' && !a.acknowledged).length;

  const content = document.getElementById('content');
  content.innerHTML = `
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Platform Notifications & Actionable Alerts</h1>
        <p class="page-subtitle">Real-time system events, overdue billing flags, capacity alerts & tenant signup notifications</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary" onclick="markAllAlertsAcknowledged()">
          <i data-lucide="check-check"></i> Acknowledge All
        </button>
      </div>
    </div>

    <!-- Alert Counters -->
    <div class="stats-grid stats-grid-4" style="margin-bottom:28px">
      <div class="stat-card">
        <div class="stat-card-icon red"><i data-lucide="alert-octagon"></i></div>
        <div class="stat-card-value">${critical}</div>
        <div class="stat-card-label">Critical Action Items</div>
        <div class="stat-card-trend" style="color:var(--color-danger)">Immediate attention needed</div>
      </div>

      <div class="stat-card">
        <div class="stat-card-icon amber"><i data-lucide="alert-triangle"></i></div>
        <div class="stat-card-value">${warning}</div>
        <div class="stat-card-label">Operational Warnings</div>
        <div class="stat-card-trend">Capacity & Quotas</div>
      </div>

      <div class="stat-card">
        <div class="stat-card-icon blue"><i data-lucide="info"></i></div>
        <div class="stat-card-value">${info}</div>
        <div class="stat-card-label">System Informational</div>
        <div class="stat-card-trend">Signups & Backups</div>
      </div>

      <div class="stat-card">
        <div class="stat-card-icon green"><i data-lucide="shield-check"></i></div>
        <div class="stat-card-value">${alerts.filter(a => a.acknowledged).length}</div>
        <div class="stat-card-label">Resolved / Handled</div>
        <div class="stat-card-trend">Historical log</div>
      </div>
    </div>

    <!-- Filter Toolbar -->
    <div class="data-table-wrapper mb-6">
      <div class="table-toolbar">
        <div class="table-toolbar-left">
          <div class="table-search">
            <i data-lucide="search"></i>
            <input type="text" placeholder="Search alerts..." id="alert-search" oninput="filterAlertsFeed()" />
          </div>
          <select class="table-filter-select" id="alert-severity-filter" onchange="filterAlertsFeed()">
            <option value="">All Severities</option>
            <option value="critical">Critical Only</option>
            <option value="warning">Warnings</option>
            <option value="info">Informational</option>
          </select>
          <select class="table-filter-select" id="alert-status-filter" onchange="filterAlertsFeed()">
            <option value="all">All Alerts</option>
            <option value="unacknowledged" selected>Pending Action</option>
            <option value="acknowledged">Acknowledged</option>
          </select>
        </div>
        <div class="table-toolbar-right">
          <span style="font-size:var(--font-size-sm);color:var(--color-text-muted)">${alerts.length} Total Alerts</span>
        </div>
      </div>

      <!-- Actionable Feed Items -->
      <div id="alerts-feed-container" style="padding: 12px 24px">
        ${renderAlertsFeed(alerts)}
      </div>
    </div>
  `;

  refreshIcons(content);
}

function renderAlertsFeed(list) {
  if (!list.length) {
    return `<div class="empty-state" style="padding:40px"><div class="es-title">No alerts matching filter</div></div>`;
  }
  return list.map(a => {
    const isCrit = a.severity === 'critical';
    const isWarn = a.severity === 'warning';
    const borderColor = isCrit ? 'var(--color-danger)' : isWarn ? 'var(--color-warning)' : 'var(--color-primary)';
    const iconName = isCrit ? 'alert-octagon' : isWarn ? 'alert-triangle' : 'info';
    const iconBg = isCrit ? '#FEE2E2' : isWarn ? '#FEF3C7' : '#DBEAFE';
    const iconColor = isCrit ? '#DC2626' : isWarn ? '#D97706' : '#2563EB';

    return `
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:18px;padding:18px 20px;margin-bottom:14px;border:1.5px solid ${borderColor};border-radius:var(--radius-lg);background:${a.acknowledged ? '#FAFAFA' : 'white'};opacity:${a.acknowledged ? '0.75' : '1'};box-shadow:var(--shadow-xs);transition:all 0.15s">
        <div style="display:flex;align-items:flex-start;gap:14px">
          <div style="width:44px;height:44px;border-radius:50%;background:${iconBg};color:${iconColor};display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px">
            <i data-lucide="${iconName}" style="width:22px;height:22px"></i>
          </div>
          <div>
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
              <span style="font-size:var(--font-size-base);font-weight:700;color:var(--color-text)">${a.title}</span>
              <span class="badge badge-${a.severity === 'critical' ? 'danger' : a.severity === 'warning' ? 'warning' : 'info'}">
                ${a.severity.toUpperCase()}
              </span>
              ${a.hospitalName ? `<span class="badge badge-gray badge-no-dot">${a.hospitalName}</span>` : ''}
            </div>
            <div style="font-size:var(--font-size-sm);color:var(--color-text-muted);margin-bottom:8px;line-height:1.45">
              ${a.message}
            </div>
            <div style="font-size:var(--font-size-xs);color:var(--color-text-light)">
              🕒 ${a.timestamp} ${a.acknowledged ? '· ✓ Acknowledged by Super Admin' : '· ⚡ Awaiting Action'}
            </div>
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end;flex-shrink:0">
          ${a.actionRoute ? `
            <button class="btn btn-${isCrit ? 'danger' : 'primary'} btn-sm" onclick="navigateTo('${a.actionRoute}')">
              ${a.actionRequired} →
            </button>
          ` : ''}
          ${!a.acknowledged ? `
            <button class="btn btn-secondary btn-sm" onclick="handleAcknowledgeAlert('${a.id}')" style="font-size:12px">
              <i data-lucide="check"></i> Mark Handled
            </button>
          ` : `
            <span style="font-size:12px;color:var(--color-success);font-weight:600">✓ Resolved</span>
          `}
        </div>
      </div>
    `;
  }).join('');
}

window.filterAlertsFeed = () => {
  const q = document.getElementById('alert-search')?.value.toLowerCase() || '';
  const severity = document.getElementById('alert-severity-filter')?.value || '';
  const status = document.getElementById('alert-status-filter')?.value || 'all';
  const alerts = get('platformAlerts') || [];

  const filtered = alerts.filter(a => {
    const matchQ = !q || a.title.toLowerCase().includes(q) || a.message.toLowerCase().includes(q) || (a.hospitalName && a.hospitalName.toLowerCase().includes(q));
    const matchSev = !severity || a.severity === severity;
    const matchStatus = status === 'all' ? true : status === 'unacknowledged' ? !a.acknowledged : a.acknowledged;
    return matchQ && matchSev && matchStatus;
  });

  const container = document.getElementById('alerts-feed-container');
  if (container) {
    container.innerHTML = renderAlertsFeed(filtered);
    refreshIcons(container);
  }
};

window.handleAcknowledgeAlert = (id) => {
  acknowledgeAlert(id);
  showToast({ title: 'Alert Acknowledged', message: 'Marked as reviewed and handled.', type: 'success' });
  renderSAAlerts();
};

window.markAllAlertsAcknowledged = () => {
  const alerts = get('platformAlerts') || [];
  alerts.forEach(a => { a.acknowledged = true; });
  showToast({ title: 'All Alerts Acknowledged', message: 'All notifications marked as reviewed.', type: 'info' });
  renderSAAlerts();
};
