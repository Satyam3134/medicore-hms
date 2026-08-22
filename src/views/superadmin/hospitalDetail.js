// ============================================================
// superadmin/hospitalDetail.js — Hospital Drill-in & DB Management
// ============================================================

import { renderTopbar } from '../../components/topbar.js';
import { renderSidebar } from '../../components/sidebar.js';
import {
  getHospital,
  getHospitalStaff,
  getHospitalPatients,
  getHospitalAppointments,
  triggerManualBackup,
  updateBackupSchedule,
  rotateDbPassword,
  downloadDbBackupFile,
  set
} from '../../store.js';
import { showToast } from '../../components/toast.js';
import { openModal, closeModal } from '../../components/modal.js';
import { refreshIcons } from '../../components/icons.js';

let activeDetailTab = 'overview'; // 'overview' | 'database' | 'backups' | 'staff'

export function renderHospitalDetail({ params }) {
  const { id } = params;
  const hospital = getHospital(id);

  if (!hospital) {
    document.getElementById('content').innerHTML = `
      <div class="empty-state" style="padding:100px 20px">
        <i data-lucide="building" class="es-icon" style="width:64px;height:64px"></i>
        <div class="es-title">Hospital Not Found</div>
        <div class="es-desc">The requested hospital tenant could not be found in the registry.</div>
        <button class="btn btn-primary" style="margin-top:16px" onclick="navigateTo('/sa/hospitals')">← Back to Directory</button>
      </div>
    `;
    refreshIcons();
    return;
  }

  renderSidebar();
  renderTopbar({
    breadcrumb: [
      { label: 'Super Admin', path: '/sa/dashboard' },
      { label: 'Hospitals', path: '/sa/hospitals' },
      { label: hospital.name }
    ]
  });

  const staffList = getHospitalStaff(id);
  const patients = getHospitalPatients(id);
  const appointments = getHospitalAppointments(id);

  const db = hospital.database || {
    dbId: `db_hosp_${hospital.id}`,
    dbName: `medicore_tenant_${hospital.name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 16)}`,
    dbHost: 'db-node-01.ap-south-1.internal.medicore.io',
    dbPort: 5432,
    dbUser: `usr_${hospital.id}_admin`,
    dbPassword: 'sec_vault_enc_9942#88$pQ',
    dbType: 'PostgreSQL 16.2 (Isolated Schema Partition)',
    dbSize: '1.8 GB',
    status: hospital.status === 'active' ? 'healthy' : 'suspended',
    sslMode: 'require (TLS 1.3)',
    connectionUri: `postgresql://usr_${hospital.id}_admin:sec_vault_enc_9942#88$pQ@db-node-01.ap-south-1.internal.medicore.io:5432/medicore_tenant_${hospital.id}?sslmode=require`,
    createdAt: hospital.onboardedDate || '2024-01-15',
    lastPingLatency: '8ms'
  };

  const backup = hospital.backupConfig || {
    enabled: true,
    cronSchedule: '0 2 * * *',
    cronLabel: 'Daily at 02:00 AM UTC',
    frequency: 'daily',
    retentionDays: 90,
    storageTarget: 'AWS S3 (s3://medicore-backups-mumbai/)',
    lastBackupTime: 'Today, 02:00 AM UTC',
    lastBackupSize: '340 MB',
    lastBackupStatus: 'success',
    history: [
      { id: 'bk-9941', timestamp: '2026-08-21 02:00 AM', size: '340 MB', type: 'Automated (Cron)', status: 'success', checksum: 'sha256:88e0b...3d2' }
    ]
  };

  const content = document.getElementById('content');
  content.innerHTML = `
    <!-- Header -->
    <div class="page-header">
      <div style="display:flex;align-items:center;gap:16px">
        <div class="avatar avatar-xl" style="background:${hospital.primaryColor || '#0B5FA5'};border-radius:16px;font-size:28px;color:white;font-weight:800;display:flex;align-items:center;justify-content:center">
          ${hospital.name.charAt(0)}
        </div>
        <div>
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
            <h1 class="page-title">${hospital.name}</h1>
            <span class="badge badge-${hospital.status === 'active' ? 'success' : 'danger'}">${hospital.status.toUpperCase()}</span>
            <span class="badge badge-info badge-no-dot">${hospital.type}</span>
            <span class="badge badge-primary badge-no-dot">${hospital.plan} Plan</span>
          </div>
          <p class="page-subtitle">${hospital.address} · Admin: <strong>${hospital.adminName}</strong> (${hospital.adminEmail})</p>
        </div>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary" onclick="navigateTo('/sa/hospitals')">← Back</button>
        <button class="btn btn-primary" onclick="enterHospital('${id}')">
          <i data-lucide="log-in"></i> Enter Hospital Admin View
        </button>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="tabs mb-6">
      <button class="tab-btn ${activeDetailTab === 'overview' ? 'active' : ''}" onclick="setDetailTab('${id}', 'overview')">
        <i data-lucide="layout-dashboard"></i> Overview & Metrics
      </button>
      <button class="tab-btn ${activeDetailTab === 'database' ? 'active' : ''}" onclick="setDetailTab('${id}', 'database')">
        <i data-lucide="database"></i> Isolated Database & Credentials
      </button>
      <button class="tab-btn ${activeDetailTab === 'backups' ? 'active' : ''}" onclick="setDetailTab('${id}', 'backups')">
        <i data-lucide="hard-drive-download"></i> Backups & Cron Schedule (${backup.history?.length || 0})
      </button>
      <button class="tab-btn ${activeDetailTab === 'staff' ? 'active' : ''}" onclick="setDetailTab('${id}', 'staff')">
        <i data-lucide="users"></i> Doctors & Staff (${staffList.length})
      </button>
    </div>

    <!-- TAB 1: OVERVIEW -->
    ${activeDetailTab === 'overview' ? `
      <!-- Stats Grid -->
      <div class="stats-grid stats-grid-5" style="margin-bottom:28px">
        <div class="stat-card">
          <div class="stat-card-icon blue"><i data-lucide="bed"></i></div>
          <div class="stat-card-value">${hospital.beds}</div>
          <div class="stat-card-label">Total Inpatient Beds</div>
          <div class="stat-card-trend">${hospital.stats?.bedOccupancy || 0}% occupied</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-icon teal"><i data-lucide="stethoscope"></i></div>
          <div class="stat-card-value">${hospital.stats?.doctors || 0}</div>
          <div class="stat-card-label">Doctors on Duty</div>
          <div class="stat-card-trend">${hospital.stats?.staff || 0} total staff</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-icon green"><i data-lucide="users"></i></div>
          <div class="stat-card-value">${hospital.stats?.patients || 0}</div>
          <div class="stat-card-label">Active Patients</div>
          <div class="stat-card-trend">Registered in EMR</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-icon amber"><i data-lucide="calendar-check"></i></div>
          <div class="stat-card-value">${hospital.stats?.todayAppointments || 0}</div>
          <div class="stat-card-label">Today's Appointments</div>
          <div class="stat-card-trend">Across OPD/IPD</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-icon purple"><i data-lucide="indian-rupee"></i></div>
          <div class="stat-card-value">₹${((hospital.stats?.monthlyRevenue || 0) / 100000).toFixed(1)}L</div>
          <div class="stat-card-label">Monthly Volume</div>
          <div class="stat-card-trend">Current billing cycle</div>
        </div>
      </div>

      <div class="content-grid" style="grid-template-columns: 1fr 1fr; margin-bottom:24px">
        <!-- Hospital Info -->
        <div class="card">
          <div class="card-header"><span class="card-title">Hospital Tenant Details</span></div>
          <div class="card-body">
            <div class="info-list">
              <div class="info-row"><span class="info-label">Type</span><span class="info-value font-semibold">${hospital.type}</span></div>
              <div class="info-row"><span class="info-label">Full Address</span><span class="info-value">${hospital.address}</span></div>
              <div class="info-row"><span class="info-label">Phone</span><span class="info-value">${hospital.phone}</span></div>
              <div class="info-row"><span class="info-label">Contact Email</span><span class="info-value">${hospital.email}</span></div>
              <div class="info-row"><span class="info-label">Administrator</span><span class="info-value font-semibold">${hospital.adminName} (${hospital.adminEmail})</span></div>
              <div class="info-row"><span class="info-label">Onboarded Date</span><span class="info-value">${hospital.onboardedDate}</span></div>
              <div class="info-row">
                <span class="info-label">Subscription Tier</span>
                <span class="badge badge-primary badge-no-dot">${hospital.plan} — ₹${hospital.planPrice?.toLocaleString()}/mo</span>
              </div>
              <div class="info-row">
                <span class="info-label">Active Departments</span>
                <div style="display:flex;flex-wrap:wrap;gap:4px">
                  ${(hospital.departments || []).map(d => `<span class="badge badge-gray badge-no-dot">${d}</span>`).join('')}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Bed Occupancy -->
        <div class="card">
          <div class="card-header"><span class="card-title">Bed Occupancy & Ward Distribution</span></div>
          <div class="card-body">
            <div style="text-align:center;margin-bottom:16px">
              <div style="font-size:48px;font-weight:800;color:var(--color-primary)">${hospital.stats?.bedOccupancy || 0}%</div>
              <div style="color:var(--color-text-muted);font-size:var(--font-size-sm)">
                ${Math.round((hospital.beds || 0) * (hospital.stats?.bedOccupancy || 0) / 100)} / ${hospital.beds} beds currently occupied
              </div>
            </div>
            <div class="progress-bar" style="height:10px;margin-bottom:16px">
              <div class="progress-fill ${(hospital.stats?.bedOccupancy || 0) > 85 ? 'red' : (hospital.stats?.bedOccupancy || 0) > 70 ? 'amber' : 'green'}"
                style="width:${hospital.stats?.bedOccupancy || 0}%"></div>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:var(--font-size-sm)">
              <span style="color:var(--color-success);font-weight:600">● Available: ${(hospital.beds || 0) - Math.round((hospital.beds || 0) * (hospital.stats?.bedOccupancy || 0) / 100)}</span>
              <span style="color:var(--color-danger);font-weight:600">● Occupied: ${Math.round((hospital.beds || 0) * (hospital.stats?.bedOccupancy || 0) / 100)}</span>
            </div>
          </div>
        </div>
      </div>
    ` : ''}

    <!-- TAB 2: ISOLATED DATABASE & CREDENTIALS VAULT -->
    ${activeDetailTab === 'database' ? `
      <div class="content-grid" style="grid-template-columns: 2fr 1fr; margin-bottom:24px">
        
        <div class="card">
          <div class="card-header">
            <div>
              <span class="card-title">Isolated Database Partition & Access Keys</span>
              <div style="font-size:var(--font-size-xs);color:var(--color-text-muted);margin-top:2px">
                Physically separated PostgreSQL schema with dedicated encryption keys
              </div>
            </div>
            <span class="badge badge-${db.status === 'healthy' ? 'success' : 'danger'}">
              ● ${db.status === 'healthy' ? 'Online & Healthy' : 'Suspended'}
            </span>
          </div>

          <div class="card-body">
            <div style="display:grid;grid-template-columns: 1fr 1fr; gap:16px; margin-bottom:20px">
              <div class="form-group">
                <label class="form-label">Database Identifier (ID)</label>
                <input type="text" class="form-control font-mono" value="${db.dbId}" readonly />
              </div>
              <div class="form-group">
                <label class="form-label">Database Name</label>
                <input type="text" class="form-control font-mono font-bold text-primary" value="${db.dbName}" readonly />
              </div>
              <div class="form-group">
                <label class="form-label">Database Cluster Host & Port</label>
                <input type="text" class="form-control font-mono" value="${db.dbHost}:${db.dbPort}" readonly />
              </div>
              <div class="form-group">
                <label class="form-label">Admin Username</label>
                <input type="text" class="form-control font-mono" value="${db.dbUser}" readonly />
              </div>
            </div>

            <!-- Password with Reveal Toggle -->
            <div class="form-group" style="margin-bottom:20px">
              <label class="form-label">Super Admin Master Password</label>
              <div style="display:flex;gap:8px">
                <input type="password" id="hosp-db-pass-${hospital.id}" class="form-control font-mono" value="${db.dbPassword}" readonly />
                <button class="btn btn-secondary" onclick="togglePassField('hosp-db-pass-${hospital.id}')" title="Reveal / Hide">
                  <i data-lucide="eye"></i>
                </button>
                <button class="btn btn-secondary" onclick="copyText('${db.dbPassword}', 'Password Copied')">
                  <i data-lucide="copy"></i> Copy
                </button>
                <button class="btn btn-secondary" onclick="handleRotatePassword('${hospital.id}')" title="Rotate DB Password">
                  <i data-lucide="refresh-cw"></i> Rotate
                </button>
              </div>
            </div>

            <!-- Connection String URI -->
            <div class="form-group" style="margin-bottom:20px">
              <label class="form-label">PostgreSQL Direct Connection String</label>
              <div style="display:flex;gap:8px">
                <input type="text" class="form-control font-mono" style="font-size:12px" value="${db.connectionUri}" readonly />
                <button class="btn btn-secondary" onclick="copyText('${db.connectionUri}', 'Connection URI Copied')">
                  <i data-lucide="copy"></i> Copy URI
                </button>
              </div>
              <div class="form-hint">Used for database migrations, replica attachments, or secure pg_dump utilities.</div>
            </div>

            <div style="display:flex;gap:12px;border-top:1px solid var(--color-border);padding-top:16px">
              <button class="btn btn-secondary btn-sm" onclick="pingDatabase('${hospital.id}')">
                <i data-lucide="activity"></i> Test Connection & Ping (${db.lastPingLatency})
              </button>
              <button class="btn btn-primary btn-sm" onclick="triggerTenantBackup('${hospital.id}')">
                <i data-lucide="download"></i> Download SQL/JSON Dump
              </button>
            </div>
          </div>
        </div>

        <!-- DB Metrics & Encryption Status -->
        <div class="card">
          <div class="card-header"><span class="card-title">Partition Security & Specs</span></div>
          <div class="card-body">
            <div class="info-list">
              <div class="info-row"><span class="info-label">Engine</span><span class="info-value font-semibold">${db.dbType}</span></div>
              <div class="info-row"><span class="info-label">Current Storage</span><span class="info-value font-semibold">${db.dbSize}</span></div>
              <div class="info-row"><span class="info-label">SSL Mode</span><span class="info-value" style="color:var(--color-success)">${db.sslMode}</span></div>
              <div class="info-row"><span class="info-label">Encryption</span><span class="info-value">AES-256 (At-Rest)</span></div>
              <div class="info-row"><span class="info-label">Partition Created</span><span class="info-value">${db.createdAt}</span></div>
              <div class="info-row"><span class="info-label">Connection Health</span><span class="badge badge-success">● Verified</span></div>
            </div>
          </div>
        </div>
      </div>
    ` : ''}

    <!-- TAB 3: BACKUP MANAGEMENT & CRON SCHEDULER -->
    ${activeDetailTab === 'backups' ? `
      <!-- Top Backup Controls Card -->
      <div class="card mb-6">
        <div class="card-header" style="background:#F8FAFC">
          <div>
            <span class="card-title">Automated Backup Schedule & Cron Job</span>
            <div style="font-size:var(--font-size-xs);color:var(--color-text-muted);margin-top:2px">
              Configured automated database snapshot interval and S3 storage retention
            </div>
          </div>
          <button class="btn btn-primary btn-lg" onclick="triggerTenantBackup('${hospital.id}')">
            <i data-lucide="download-cloud"></i> Create & Download On-Demand Snapshot
          </button>
        </div>

        <div class="card-body">
          <div style="display:grid;grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px">
            <div class="form-group">
              <label class="form-label">Automated Backups</label>
              <select class="form-control" id="bk-enabled-${hospital.id}">
                <option value="true" ${backup.enabled ? 'selected' : ''}>Enabled (Active Cronjob)</option>
                <option value="false" ${!backup.enabled ? 'selected' : ''}>Disabled / Paused</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Backup Interval / Frequency</label>
              <select class="form-control" id="bk-freq-${hospital.id}">
                <option value="6h" ${backup.frequency === '6h' ? 'selected' : ''}>Every 6 Hours (0 */6 * * *)</option>
                <option value="12h" ${backup.frequency === '12h' ? 'selected' : ''}>Every 12 Hours (0 */12 * * *)</option>
                <option value="daily" ${backup.frequency === 'daily' ? 'selected' : ''}>Daily at 02:00 AM UTC (0 2 * * *)</option>
                <option value="weekly" ${backup.frequency === 'weekly' ? 'selected' : ''}>Weekly on Sunday (0 3 * * 0)</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Retention Policy</label>
              <select class="form-control" id="bk-retention-${hospital.id}">
                <option value="30" ${backup.retentionDays === 30 ? 'selected' : ''}>30 Days</option>
                <option value="60" ${backup.retentionDays === 60 ? 'selected' : ''}>60 Days</option>
                <option value="90" ${backup.retentionDays === 90 ? 'selected' : ''}>90 Days (Recommended)</option>
                <option value="365" ${backup.retentionDays === 365 ? 'selected' : ''}>365 Days (1 Year)</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">&nbsp;</label>
              <button class="btn btn-secondary w-full" onclick="saveTenantBackupSchedule('${hospital.id}')" style="height:48px">
                <i data-lucide="save"></i> Update Cron Job
              </button>
            </div>
          </div>

          <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:10px;padding:12px 16px;display:flex;align-items:center;justify-content:space-between">
            <div style="font-size:var(--font-size-sm);color:#166534">
              <strong>Storage Target:</strong> ${backup.storageTarget} · Last run: <strong>${backup.lastBackupTime}</strong> (${backup.lastBackupSize})
            </div>
            <span class="badge badge-success">● S3 Sync Operational</span>
          </div>
        </div>
      </div>

      <!-- Backup Snapshot History Table -->
      <div class="data-table-wrapper mb-6">
        <div class="table-toolbar">
          <div class="table-toolbar-left">
            <span class="card-title">Available Database Snapshots & History</span>
            <span class="badge badge-gray badge-no-dot">${backup.history?.length || 0} Snapshots</span>
          </div>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th>Snapshot ID</th>
              <th>Created Timestamp</th>
              <th>Archive Size</th>
              <th>Trigger Type</th>
              <th>SHA-256 Checksum</th>
              <th>Status</th>
              <th class="td-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${(backup.history || []).map(b => `
              <tr>
                <td style="font-family:monospace;font-weight:700;color:var(--color-primary)">${b.id}</td>
                <td style="font-size:var(--font-size-sm)">${b.timestamp}</td>
                <td style="font-weight:600">${b.size}</td>
                <td><span class="badge badge-${b.type.includes('Cron') ? 'info' : 'primary'} badge-no-dot">${b.type}</span></td>
                <td style="font-family:monospace;font-size:12px;color:var(--color-text-muted)">${b.checksum || 'sha256:88e0b...3d2'}</td>
                <td><span class="badge badge-success">✓ Available</span></td>
                <td class="td-actions">
                  <button class="btn btn-secondary btn-sm" onclick="downloadSnapshotFile('${hospital.id}', '${b.id}')">
                    <i data-lucide="download"></i> Download
                  </button>
                  <button class="btn btn-secondary btn-sm" onclick="simulateRestore('${hospital.id}', '${b.id}')">
                    <i data-lucide="rotate-ccw"></i> Restore
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : ''}

    <!-- TAB 4: STAFF -->
    ${activeDetailTab === 'staff' ? `
      <div class="data-table-wrapper mb-6">
        <div class="table-toolbar">
          <div class="table-toolbar-left">
            <span class="card-title">Doctors & Medical Staff</span>
            <span class="badge badge-gray badge-no-dot">${staffList.length}</span>
          </div>
          <div class="table-toolbar-right">
            <button class="btn btn-secondary btn-sm" onclick="enterHospital('${id}')">Manage Staff in Hospital View →</button>
          </div>
        </div>
        <table class="data-table">
          <thead>
            <tr><th>Name</th><th>Role</th><th>Department</th><th>Phone</th><th>Status</th></tr>
          </thead>
          <tbody>
            ${staffList.map(s => `
              <tr>
                <td><div class="avatar-name"><div class="avatar avatar-sm" style="background:var(--color-primary)">${s.initials}</div><div class="an-name">${s.name}</div></div></td>
                <td><span class="badge badge-info badge-no-dot">${s.role}</span></td>
                <td style="color:var(--color-text-muted)">${s.department}</td>
                <td style="font-size:var(--font-size-xs)">${s.phone || '—'}</td>
                <td><span class="badge badge-${s.status === 'on-duty' ? 'success' : s.status === 'on-leave' ? 'warning' : 'gray'}">${s.status}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : ''}
  `;

  refreshIcons(content);
}

// ── Tab Switcher ──
window.setDetailTab = (hospitalId, tab) => {
  activeDetailTab = tab;
  renderHospitalDetail({ params: { id: hospitalId } });
};

window.enterHospital = (id) => {
  set('currentRole', 'hospitaladmin');
  set('currentHospitalId', id);
  showToast({ title: 'Switched Context', message: `Now managing as Hospital Admin.`, type: 'info' });
  navigateTo('/ha/dashboard');
};

window.togglePassField = (id) => {
  const input = document.getElementById(id);
  if (input) {
    input.type = input.type === 'password' ? 'text' : 'password';
  }
};

window.copyText = (text, toastMsg) => {
  navigator.clipboard?.writeText(text);
  showToast({ title: 'Copied', message: toastMsg || 'Copied to clipboard.', type: 'success' });
};

window.handleRotatePassword = (hospitalId) => {
  const newPass = rotateDbPassword(hospitalId);
  showToast({ title: 'Password Rotated', message: `New database password generated and saved to vault.`, type: 'warning' });
  renderHospitalDetail({ params: { id: hospitalId } });
};

window.pingDatabase = (hospitalId) => {
  showToast({ title: 'Pinging Database Partition...', type: 'info' });
  setTimeout(() => {
    showToast({
      title: '✓ Database Partition Healthy',
      message: `PostgreSQL connection verified (Latency: 7ms, SSL TLS 1.3 Active).`,
      type: 'success'
    });
  }, 400);
};

window.triggerTenantBackup = (hospitalId) => {
  const snap = triggerManualBackup(hospitalId);
  showToast({
    title: 'Backup Created & Downloaded',
    message: `Snapshot ${snap.id} (${snap.size}) exported.`,
    type: 'success'
  });
  renderHospitalDetail({ params: { id: hospitalId } });
};

window.saveTenantBackupSchedule = (hospitalId) => {
  const enabled = document.getElementById(`bk-enabled-${hospitalId}`)?.value === 'true';
  const frequency = document.getElementById(`bk-freq-${hospitalId}`)?.value;
  const retention = parseInt(document.getElementById(`bk-retention-${hospitalId}`)?.value) || 90;

  updateBackupSchedule(hospitalId, {
    enabled,
    frequency,
    retentionDays: retention
  });

  showToast({
    title: 'Cron Job Schedule Updated',
    message: `Automated backup scheduled (${frequency}, ${retention} days retention).`,
    type: 'success'
  });
  renderHospitalDetail({ params: { id: hospitalId } });
};

window.downloadSnapshotFile = (hospitalId, backupId) => {
  const hospital = getHospital(hospitalId);
  downloadDbBackupFile(hospital, backupId);
  showToast({ title: 'Downloading Snapshot', message: `File ${backupId} downloaded.`, type: 'info' });
};

window.simulateRestore = (hospitalId, backupId) => {
  openModal({
    title: `Simulate Database Restore (${backupId})`,
    size: 'md',
    body: `
      <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:10px;padding:14px;margin-bottom:16px">
        <div style="font-weight:700;color:#B45309;margin-bottom:4px">⚠️ Pre-Restore Check</div>
        <div style="font-size:var(--font-size-sm);color:#92400E">Restoring snapshot <strong>${backupId}</strong> will point the tenant partition to this historical point in time. All schemas and tables will be verified against SHA-256 checksums.</div>
      </div>
      <div class="form-group">
        <label class="form-check">
          <input type="checkbox" checked />
          <span>Create pre-restore safety snapshot before applying</span>
        </label>
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="window._closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="confirmRestore()">Proceed with Restore Simulation</button>
    `
  });
};

window.confirmRestore = () => {
  closeModal();
  showToast({ title: 'Restore Succeeded', message: 'Tenant partition verified and restored.', type: 'success' });
};
