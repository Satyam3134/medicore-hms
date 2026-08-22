// ============================================================
// superadmin/databaseHub.js — Multi-Tenant Database & Backup Hub
// ============================================================

import { renderTopbar } from '../../components/topbar.js';
import { renderSidebar } from '../../components/sidebar.js';
import { get, triggerManualBackup, rotateDbPassword } from '../../store.js';
import { showToast } from '../../components/toast.js';
import { openModal, closeModal } from '../../components/modal.js';
import { refreshIcons } from '../../components/icons.js';

export function renderSADatabaseHub() {
  renderSidebar();
  renderTopbar({
    breadcrumb: [
      { label: 'Super Admin', path: '/sa/dashboard' },
      { label: 'Multi-Tenant Databases & Backups' }
    ]
  });

  const hospitals = get('hospitals') || [];
  const masterDb = get('superAdminMasterDb') || {};

  const totalDbStorage = hospitals.reduce((acc, h) => {
    const sizeStr = h.database?.dbSize || '1 GB';
    const num = parseFloat(sizeStr) || 1.0;
    return acc + num;
  }, 0).toFixed(1);

  const activeCronCount = hospitals.filter(h => h.backupConfig?.enabled).length;

  const content = document.getElementById('content');
  content.innerHTML = `
    <!-- Header -->
    <div class="page-header">
      <div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
          <h1 class="page-title">Multi-Tenant Database & Backup Command Center</h1>
          <span class="badge badge-primary">Isolated Architecture</span>
        </div>
        <p class="page-subtitle">Super Admin Key Vault, tenant schema isolation, real-time connection monitoring, and automated cron backup schedules</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary" onclick="exportMasterDbBackup()">
          <i data-lucide="download-cloud"></i> Master Platform Backup
        </button>
        <button class="btn btn-primary" onclick="navigateTo('/sa/hospitals/new')">
          <i data-lucide="plus-circle"></i> Provision New Tenant DB
        </button>
      </div>
    </div>

    <!-- DB Fleet Summary Counters -->
    <div class="stats-grid stats-grid-4" style="margin-bottom:28px">
      <div class="stat-card">
        <div class="stat-card-icon blue"><i data-lucide="database"></i></div>
        <div class="stat-card-value">${hospitals.length} Isolated DBs</div>
        <div class="stat-card-label">Tenant Database Partitions</div>
        <div class="stat-card-trend"><span class="trend-up">● Separate from Admin DB</span></div>
      </div>

      <div class="stat-card">
        <div class="stat-card-icon green"><i data-lucide="hard-drive-download"></i></div>
        <div class="stat-card-value">${activeCronCount} / ${hospitals.length} Active</div>
        <div class="stat-card-label">Automated Backup Cronjobs</div>
        <div class="stat-card-trend"><span class="trend-up">100% 24h Success Rate</span></div>
      </div>

      <div class="stat-card">
        <div class="stat-card-icon teal"><i data-lucide="server"></i></div>
        <div class="stat-card-value">${totalDbStorage} GB</div>
        <div class="stat-card-label">Total Tenant DB Storage</div>
        <div class="stat-card-trend">Across AWS Mumbai Region</div>
      </div>

      <div class="stat-card">
        <div class="stat-card-icon amber"><i data-lucide="shield-check"></i></div>
        <div class="stat-card-value">AES-256</div>
        <div class="stat-card-label">Encryption Standard</div>
        <div class="stat-card-trend">TLS 1.3 Strict SSL Enforcement</div>
      </div>
    </div>

    <!-- Master Database Architecture Card -->
    <div class="card mb-6" style="background:#F8FAFC;border:1.5px solid var(--color-border)">
      <div class="card-header">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:40px;height:40px;border-radius:10px;background:#EFF6FF;color:var(--color-primary);display:flex;align-items:center;justify-content:center">
            <i data-lucide="cpu" style="width:22px;height:22px"></i>
          </div>
          <div>
            <span class="card-title">Super Admin Master Database (${masterDb.dbName || 'medicore_master_platform'})</span>
            <div style="font-size:var(--font-size-xs);color:var(--color-text-muted)">Houses platform metadata, global subscriptions, operator accounts & audit logs</div>
          </div>
        </div>
        <span class="badge badge-success">● HA Cluster Active</span>
      </div>
      <div class="card-body" style="padding-top:0">
        <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:16px;background:white;border:1px solid var(--color-border);border-radius:10px;padding:16px;font-size:var(--font-size-sm)">
          <div>
            <span style="color:var(--color-text-light);font-size:11px;text-transform:uppercase;font-weight:700">Root DB Host</span>
            <div style="font-family:monospace;font-weight:600">${masterDb.dbHost || 'db-master-cluster.ap-south-1.internal:5432'}</div>
          </div>
          <div>
            <span style="color:var(--color-text-light);font-size:11px;text-transform:uppercase;font-weight:700">Cluster Architecture</span>
            <div style="font-weight:600">${masterDb.dbType || 'PostgreSQL 16.2 Enterprise'}</div>
          </div>
          <div>
            <span style="color:var(--color-text-light);font-size:11px;text-transform:uppercase;font-weight:700">Active Tenant Partitions</span>
            <div style="font-weight:700;color:var(--color-primary)">${hospitals.length} Dedicated DB Partitions</div>
          </div>
          <div>
            <span style="color:var(--color-text-light);font-size:11px;text-transform:uppercase;font-weight:700">Last Master Backup</span>
            <div style="font-weight:600;color:var(--color-success)">${masterDb.lastMasterBackup || 'Today, 04:00 AM UTC'}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tenant Databases Fleet Table -->
    <div class="data-table-wrapper mb-6">
      <div class="table-toolbar">
        <div class="table-toolbar-left">
          <div class="table-search">
            <i data-lucide="search"></i>
            <input type="text" placeholder="Search tenant DB by hospital or database name..." id="db-search" oninput="filterTenantDbs()" />
          </div>
          <select class="table-filter-select" id="db-status-filter" onchange="filterTenantDbs()">
            <option value="">All Database Statuses</option>
            <option value="healthy">Healthy / Online</option>
            <option value="suspended">Suspended Partitions</option>
          </select>
        </div>
        <div class="table-toolbar-right">
          <span style="font-size:var(--font-size-sm);color:var(--color-text-muted)">${hospitals.length} Tenant Partitions</span>
        </div>
      </div>

      <div class="scroll-x">
        <table class="data-table">
          <thead>
            <tr>
              <th>Hospital Tenant</th>
              <th>Isolated Database Schema</th>
              <th>Host Node</th>
              <th>Storage Size</th>
              <th>Automated Backup (Cron)</th>
              <th>Last Backup</th>
              <th>Status</th>
              <th class="td-actions">Super Admin Vault</th>
            </tr>
          </thead>
          <tbody id="db-fleet-tbody">
            ${renderDbFleetRows(hospitals)}
          </tbody>
        </table>
      </div>
    </div>
  `;

  refreshIcons(content);
}

function renderDbFleetRows(list) {
  if (!list.length) {
    return `<tr><td colspan="8"><div class="empty-state"><div class="es-title">No tenant databases found</div></div></td></tr>`;
  }

  return list.map(h => {
    const db = h.database || {};
    const bk = h.backupConfig || {};
    const isHealthy = db.status === 'healthy';

    return `
      <tr>
        <td>
          <div class="avatar-name">
            <div class="avatar avatar-sm" style="background:${h.primaryColor || 'var(--color-primary)'}">${h.name.charAt(0)}</div>
            <div>
              <div class="an-name">${h.name}</div>
              <div class="an-sub">${h.city} · ${h.plan}</div>
            </div>
          </div>
        </td>
        <td>
          <div style="font-family:monospace;font-weight:700;color:var(--color-primary)">${db.dbName || 'db_' + h.id}</div>
          <div style="font-size:11px;color:var(--color-text-muted)">User: ${db.dbUser || 'admin'}</div>
        </td>
        <td style="font-family:monospace;font-size:var(--font-size-xs)">${db.dbHost || 'db-node-01.internal'}:${db.dbPort || 5432}</td>
        <td style="font-weight:600">${db.dbSize || '1.2 GB'}</td>
        <td>
          ${bk.enabled ? `
            <span class="badge badge-success badge-no-dot">
              <i data-lucide="clock" style="width:12px;height:12px;display:inline-block"></i> ${bk.frequency?.toUpperCase() || 'DAILY'}
            </span>
          ` : `
            <span class="badge badge-gray badge-no-dot">Disabled</span>
          `}
        </td>
        <td style="font-size:var(--font-size-xs)">${bk.lastBackupTime || 'N/A'}</td>
        <td>
          <span class="badge badge-${isHealthy ? 'success' : 'danger'}">
            ● ${isHealthy ? 'Healthy' : 'Suspended'}
          </span>
        </td>
        <td class="td-actions">
          <button class="btn btn-secondary btn-sm" onclick="openDbVaultModal('${h.id}')" title="View Master Keys">
            <i data-lucide="key"></i> Keys Vault
          </button>
          <button class="btn btn-secondary btn-sm" onclick="downloadDbDirect('${h.id}')" title="Download SQL Snapshot">
            <i data-lucide="download"></i> Backup
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

window.filterTenantDbs = () => {
  const q = document.getElementById('db-search')?.value.toLowerCase() || '';
  const status = document.getElementById('db-status-filter')?.value || '';
  const hospitals = get('hospitals') || [];

  const filtered = hospitals.filter(h => {
    const matchQ = !q || h.name.toLowerCase().includes(q) || (h.database?.dbName && h.database.dbName.toLowerCase().includes(q));
    const matchStatus = !status || h.database?.status === status;
    return matchQ && matchStatus;
  });

  const tbody = document.getElementById('db-fleet-tbody');
  if (tbody) {
    tbody.innerHTML = renderDbFleetRows(filtered);
    refreshIcons(tbody);
  }
};

window.openDbVaultModal = (hospitalId) => {
  const hospitals = get('hospitals') || [];
  const h = hospitals.find(hosp => hosp.id === hospitalId);
  if (!h || !h.database) return;

  openModal({
    title: `Super Admin Vault — ${h.name}`,
    size: 'lg',
    body: `
      <div style="display:grid;grid-template-columns: 1fr 1fr; gap:14px; background:#F8FAFC; border:1px solid var(--color-border); border-radius:12px; padding:18px; margin-bottom:20px">
        <div>
          <span class="info-label">Database Identifier</span>
          <div style="font-family:monospace;font-weight:700;color:var(--color-primary)">${h.database.dbId}</div>
        </div>
        <div>
          <span class="info-label">Isolated Database Name</span>
          <div style="font-family:monospace;font-weight:700">${h.database.dbName}</div>
        </div>
        <div>
          <span class="info-label">Host Node & Port</span>
          <div style="font-family:monospace;font-weight:600">${h.database.dbHost}:${h.database.dbPort}</div>
        </div>
        <div>
          <span class="info-label">Admin Username</span>
          <div style="font-family:monospace;font-weight:600">${h.database.dbUser}</div>
        </div>
        <div style="grid-column: span 2">
          <span class="info-label">Master Secret Password</span>
          <div style="display:flex;align-items:center;gap:8px">
            <input type="password" id="vault-p-${h.id}" value="${h.database.dbPassword}" class="form-control font-mono" readonly />
            <button class="btn btn-secondary btn-sm" onclick="togglePassField('vault-p-${h.id}')" title="Reveal/Hide">
              <i data-lucide="eye"></i>
            </button>
            <button class="btn btn-secondary btn-sm" onclick="copyText('${h.database.dbPassword}', 'Password Copied')">
              <i data-lucide="copy"></i> Copy
            </button>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Full Connection String (URI)</label>
        <div style="display:flex;gap:8px">
          <input type="text" class="form-control font-mono" style="font-size:12px" value="${h.database.connectionUri}" readonly />
          <button class="btn btn-secondary btn-sm" onclick="copyText('${h.database.connectionUri}', 'URI Copied')">
            <i data-lucide="copy"></i> Copy
          </button>
        </div>
      </div>

      <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:10px;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;margin-top:16px">
        <span style="font-size:var(--font-size-sm);color:#166534">
          <strong>Cron Schedule:</strong> ${h.backupConfig?.cronLabel || 'Daily at 02:00 AM UTC'}
        </span>
        <button class="btn btn-secondary btn-sm" onclick="window._closeModal();navigateTo('/sa/hospitals/${h.id}')">
          Configure Backup Schedule →
        </button>
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="window._closeModal()">Close</button>
      <button class="btn btn-primary" onclick="downloadDbDirect('${h.id}')">
        <i data-lucide="download"></i> Download SQL/JSON Snapshot
      </button>
    `
  });

  refreshIcons();
};

window.downloadDbDirect = (hospitalId) => {
  triggerManualBackup(hospitalId);
  showToast({ title: 'Backup Downloaded', message: 'Tenant database snapshot exported.', type: 'success' });
  renderSADatabaseHub();
};

window.exportMasterDbBackup = () => {
  showToast({ title: 'Exporting Master Platform DB', message: 'Master schema and tenant catalogs dump started.', type: 'success' });
};
