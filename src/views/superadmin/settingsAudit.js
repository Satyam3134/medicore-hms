// ============================================================
// superadmin/settingsAudit.js — Module 10: System Settings & Audit Logs
// ============================================================

import { renderTopbar } from '../../components/topbar.js';
import { renderSidebar } from '../../components/sidebar.js';
import { get, addAuditLog } from '../../store.js';
import { showToast } from '../../components/toast.js';
import { refreshIcons } from '../../components/icons.js';

let activeSettingsTab = 'audit'; // 'audit' | 'security' | 'branding'

export function renderSASettingsAudit() {
  renderSidebar();
  renderTopbar({ breadcrumb: [{ label: 'Super Admin', path: '/sa/dashboard' }, { label: 'Settings & Audit Logs' }] });

  const auditLogs = get('auditLogs') || [];

  const content = document.getElementById('content');
  content.innerHTML = `
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">System Settings & Compliance Audit Trail</h1>
        <p class="page-subtitle">Healthcare data compliance, platform security policies, and immutable tenant audit logs</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary" onclick="exportAuditLogs()">
          <i data-lucide="download"></i> Export Compliance Log (CSV)
        </button>
        <button class="btn btn-primary" onclick="saveSecurityPolicies()">
          <i data-lucide="shield-check"></i> Save Policies
        </button>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="tabs">
      <button class="tab-btn ${activeSettingsTab === 'audit' ? 'active' : ''}" onclick="setSettingsTab('audit')">
        <i data-lucide="file-text"></i> Healthcare Audit Trail (${auditLogs.length})
      </button>
      <button class="tab-btn ${activeSettingsTab === 'security' ? 'active' : ''}" onclick="setSettingsTab('security')">
        <i data-lucide="lock"></i> Security & 2FA Policies
      </button>
      <button class="tab-btn ${activeSettingsTab === 'branding' ? 'active' : ''}" onclick="setSettingsTab('branding')">
        <i data-lucide="palette"></i> Platform Branding & System Ops
      </button>
    </div>

    <!-- Tab 1: Healthcare Audit Logs -->
    <div class="tab-content ${activeSettingsTab === 'audit' ? 'active' : ''}">
      <div class="data-table-wrapper mb-6">
        <div class="table-toolbar">
          <div class="table-toolbar-left">
            <div class="table-search">
              <i data-lucide="search"></i>
              <input type="text" placeholder="Search audit logs by actor, action or hospital..." id="audit-search" oninput="filterAuditLogs()" />
            </div>
            <select class="table-filter-select" id="audit-severity-filter" onchange="filterAuditLogs()">
              <option value="">All Severity Levels</option>
              <option value="critical">Critical Only</option>
              <option value="warning">Warnings</option>
              <option value="info">Informational</option>
            </select>
          </div>
          <div class="table-toolbar-right">
            <span class="badge badge-success">● Tamper-Proof Checksum Verified</span>
          </div>
        </div>

        <div class="scroll-x">
          <table class="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Operator / Actor</th>
                <th>Action Performed</th>
                <th>Tenant Scope</th>
                <th>Details & Payload</th>
                <th>IP Address</th>
                <th>Severity</th>
              </tr>
            </thead>
            <tbody id="audit-tbody">
              ${renderAuditRows(auditLogs)}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Tab 2: Security Policies -->
    <div class="tab-content ${activeSettingsTab === 'security' ? 'active' : ''}">
      <div class="content-grid" style="grid-template-columns: 1fr 1fr">
        <div class="card">
          <div class="card-header"><span class="card-title">Authentication & Access Policies</span></div>
          <div class="card-body">
            <div class="form-group">
              <label class="form-check">
                <input type="checkbox" checked disabled />
                <div>
                  <div style="font-weight:600">Mandatory 2FA for All Admins</div>
                  <div style="font-size:var(--font-size-xs);color:var(--color-text-muted)">Requires Authenticator App or SMS OTP on login across all tenant admins.</div>
                </div>
              </label>
            </div>
            <div class="form-group" style="margin-top:16px">
              <label class="form-label">Inactivity Session Timeout</label>
              <select class="form-control" id="sec-timeout">
                <option value="15" selected>15 Minutes (HIPAA Recommended)</option>
                <option value="30">30 Minutes</option>
                <option value="60">60 Minutes</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Password Expiry Cycle</label>
              <select class="form-control">
                <option selected>90 Days (Healthcare Enterprise Standard)</option>
                <option>180 Days</option>
                <option>Never Expire (Not Recommended)</option>
              </select>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><span class="card-title">Data Protection & Privacy</span></div>
          <div class="card-body">
            <div class="form-group">
              <label class="form-check">
                <input type="checkbox" checked />
                <div>
                  <div style="font-weight:600">AES-256 Patient Data Encryption at Rest</div>
                  <div style="font-size:var(--font-size-xs);color:var(--color-text-muted)">All medical notes and lab files encrypted before disk storage.</div>
                </div>
              </label>
            </div>
            <div class="form-group" style="margin-top:16px">
              <label class="form-check">
                <input type="checkbox" checked />
                <div>
                  <div style="font-weight:600">Strict Multi-Tenant Database Isolation</div>
                  <div style="font-size:var(--font-size-xs);color:var(--color-text-muted)">Hospitals cannot cross-read patient or financial records.</div>
                </div>
              </label>
            </div>
            <div class="form-group" style="margin-top:16px">
              <label class="form-check">
                <input type="checkbox" checked />
                <div>
                  <div style="font-weight:600">Automated Audit Trail Generation</div>
                  <div style="font-size:var(--font-size-xs);color:var(--color-text-muted)">Record all privilege changes, status updates and data exports.</div>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab 3: Branding & Platform Ops -->
    <div class="tab-content ${activeSettingsTab === 'branding' ? 'active' : ''}">
      <div class="content-grid" style="grid-template-columns: 1fr 1fr">
        <div class="card">
          <div class="card-header"><span class="card-title">Platform Identity</span></div>
          <div class="card-body">
            <div class="form-group">
              <label class="form-label">Platform Name</label>
              <input type="text" class="form-control" value="MediCore Enterprise HMS" />
            </div>
            <div class="form-group">
              <label class="form-label">Super Admin Support Email</label>
              <input type="email" class="form-control" value="support@medicore.io" />
            </div>
            <div class="form-group">
              <label class="form-label">Platform Root Domain</label>
              <input type="text" class="form-control" value="app.medicore.io" />
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><span class="card-title">Automated Backup & Disaster Recovery</span></div>
          <div class="card-body">
            <div class="info-list">
              <div class="info-row"><span class="info-label">Daily Backup Window</span><span class="info-value">04:00 AM UTC</span></div>
              <div class="info-row"><span class="info-label">Retention Policy</span><span class="info-value">365 Days (Encrypted)</span></div>
              <div class="info-row"><span class="info-label">Last Snapshot</span><span class="info-value" style="color:var(--color-success)">✓ Succeeded (1.8 GB)</span></div>
            </div>
            <div style="margin-top:20px">
              <button class="btn btn-secondary btn-sm w-full" onclick="showToast({ title: 'Backup Triggered', message: 'Manual snapshot job scheduled.', type: 'info' })">
                <i data-lucide="hard-drive"></i> Trigger On-Demand Backup
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  refreshIcons(content);
}

function renderAuditRows(list) {
  if (!list.length) {
    return `<tr><td colspan="7"><div class="empty-state"><div class="es-title">No audit records found</div></div></td></tr>`;
  }
  return list.map(log => {
    const isCrit = log.severity === 'critical';
    const isWarn = log.severity === 'warning';
    const badgeColor = isCrit ? 'danger' : isWarn ? 'warning' : 'info';

    return `
      <tr>
        <td style="font-family:monospace;font-size:var(--font-size-xs);white-space:nowrap">${log.timestamp}</td>
        <td style="font-weight:600">${log.user}</td>
        <td style="font-weight:600;color:var(--color-primary)">${log.action}</td>
        <td><span class="badge badge-gray badge-no-dot">${log.tenant}</span></td>
        <td style="max-width:320px;font-size:var(--font-size-sm);color:var(--color-text-muted)">${log.details}</td>
        <td style="font-family:monospace;font-size:var(--font-size-xs)">${log.ipAddress}</td>
        <td><span class="badge badge-${badgeColor}">${log.severity.toUpperCase()}</span></td>
      </tr>
    `;
  }).join('');
}

window.setSettingsTab = (tab) => {
  activeSettingsTab = tab;
  renderSASettingsAudit();
};

window.filterAuditLogs = () => {
  const q = document.getElementById('audit-search')?.value.toLowerCase() || '';
  const sev = document.getElementById('audit-severity-filter')?.value || '';
  const logs = get('auditLogs') || [];

  const filtered = logs.filter(l => {
    const matchQ = !q || l.user.toLowerCase().includes(q) || l.action.toLowerCase().includes(q) || l.tenant.toLowerCase().includes(q) || l.details.toLowerCase().includes(q);
    const matchSev = !sev || l.severity === sev;
    return matchQ && matchSev;
  });

  const tbody = document.getElementById('audit-tbody');
  if (tbody) {
    tbody.innerHTML = renderAuditRows(filtered);
    refreshIcons(tbody);
  }
};

window.exportAuditLogs = () => {
  showToast({ title: 'Exporting Audit Trail', message: 'Signed compliance CSV download started.', type: 'success' });
};

window.saveSecurityPolicies = () => {
  addAuditLog({
    user: 'Aakash Verma (Super Admin)',
    action: 'Security Policies Saved',
    details: 'Updated session timeout and 2FA authentication requirements',
    tenant: 'Platform System',
    severity: 'info'
  });
  showToast({ title: 'Policies Saved', message: 'Security and 2FA configuration updated.', type: 'success' });
};
