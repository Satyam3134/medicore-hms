// ============================================================
// superadmin/platformUsers.js — Module 7: User & Role Management
// ============================================================

import { renderTopbar } from '../../components/topbar.js';
import { renderSidebar } from '../../components/sidebar.js';
import { get, addPlatformUser } from '../../store.js';
import { showToast } from '../../components/toast.js';
import { openModal, closeModal } from '../../components/modal.js';
import { refreshIcons } from '../../components/icons.js';

export function renderSAPlatformUsers() {
  renderSidebar();
  renderTopbar({ breadcrumb: [{ label: 'Super Admin', path: '/sa/dashboard' }, { label: 'Platform Users & Roles' }] });

  const users = get('platformUsers') || [];

  const content = document.getElementById('content');
  content.innerHTML = `
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Platform Team & Role Management</h1>
        <p class="page-subtitle">Manage internal Super Admin operators, role-based access control (RBAC), and 2FA policies</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary" onclick="openRolesMatrixModal()">
          <i data-lucide="shield"></i> View Permissions Matrix
        </button>
        <button class="btn btn-primary" onclick="openInviteUserModal()">
          <i data-lucide="user-plus"></i> Invite Team Member
        </button>
      </div>
    </div>

    <!-- Team Security & Access Stats -->
    <div class="stats-grid stats-grid-4" style="margin-bottom:28px">
      <div class="stat-card">
        <div class="stat-card-icon blue"><i data-lucide="users"></i></div>
        <div class="stat-card-value">${users.length}</div>
        <div class="stat-card-label">Platform Operators</div>
        <div class="stat-card-trend">Across 4 Functional Roles</div>
      </div>

      <div class="stat-card">
        <div class="stat-card-icon green"><i data-lucide="shield-check"></i></div>
        <div class="stat-card-value">100%</div>
        <div class="stat-card-label">2FA Enforcement</div>
        <div class="stat-card-trend"><span class="trend-up">● All accounts secured</span></div>
      </div>

      <div class="stat-card">
        <div class="stat-card-icon amber"><i data-lucide="key"></i></div>
        <div class="stat-card-value">4 Roles</div>
        <div class="stat-card-label">Role Definitions</div>
        <div class="stat-card-trend">Granular Permission Sets</div>
      </div>

      <div class="stat-card">
        <div class="stat-card-icon teal"><i data-lucide="activity"></i></div>
        <div class="stat-card-value">Active Now</div>
        <div class="stat-card-label">Session Concurrency</div>
        <div class="stat-card-trend">3 Active Super Admins</div>
      </div>
    </div>

    <!-- Platform Users Table -->
    <div class="data-table-wrapper mb-6">
      <div class="table-toolbar">
        <div class="table-toolbar-left">
          <div class="table-search">
            <i data-lucide="search"></i>
            <input type="text" placeholder="Search team members..." id="pu-search" oninput="filterPlatformUsers()" />
          </div>
          <select class="table-filter-select" id="pu-role-filter" onchange="filterPlatformUsers()">
            <option value="">All Platform Roles</option>
            <option value="Super Admin">Super Admin (Full Access)</option>
            <option value="Billing & Operations Admin">Billing & Operations Admin</option>
            <option value="Support & Onboarding Lead">Support & Onboarding Lead</option>
            <option value="Security & Compliance Officer">Security & Compliance Officer</option>
          </select>
        </div>
        <div class="table-toolbar-right">
          <span style="font-size:var(--font-size-sm);color:var(--color-text-muted)">${users.length} Active Operators</span>
        </div>
      </div>

      <div class="scroll-x">
        <table class="data-table">
          <thead>
            <tr>
              <th>Operator</th>
              <th>Platform Role</th>
              <th>Granted Permissions</th>
              <th>2FA Security</th>
              <th>Last Active</th>
              <th>Status</th>
              <th class="td-actions">Actions</th>
            </tr>
          </thead>
          <tbody id="pu-tbody">
            ${renderPlatformUserRows(users)}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Role Definitions & Policy Guide -->
    <div class="card">
      <div class="card-header">
        <span class="card-title">Pre-Configured Platform Roles</span>
      </div>
      <div class="card-body">
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:20px">
          ${[
            { title: 'Super Admin', desc: 'Full root access to all tenant data, billing overrides, system settings, and user management.', color: 'primary', count: users.filter(u => u.role === 'Super Admin').length },
            { title: 'Billing & Operations Admin', desc: 'Access to subscription plans, tenant invoicing, payment status, and revenue analytics.', color: 'accent', count: users.filter(u => u.role.includes('Billing')).length },
            { title: 'Support & Onboarding Lead', desc: 'Access to support tickets, hospital monitoring, onboarding wizard, and WhatsApp bot configs.', color: 'warning', count: users.filter(u => u.role.includes('Support')).length },
            { title: 'Security & Compliance Officer', desc: 'Read-only access to audit logs, security policies, data retention logs, and HIPAA compliance reports.', color: 'purple', count: users.filter(u => u.role.includes('Security')).length },
          ].map(r => `
            <div style="border:1px solid var(--color-border);border-radius:var(--radius-lg);padding:20px;background:var(--color-bg)">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                <span style="font-size:var(--font-size-base);font-weight:700">${r.title}</span>
                <span class="badge badge-${r.color} badge-no-dot">${r.count} User${r.count !== 1 ? 's' : ''}</span>
              </div>
              <div style="font-size:var(--font-size-sm);color:var(--color-text-muted);line-height:1.45">${r.desc}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  refreshIcons(content);
}

function renderPlatformUserRows(list) {
  if (!list.length) {
    return `<tr><td colspan="7"><div class="empty-state"><div class="es-title">No operators found</div></div></td></tr>`;
  }
  return list.map(u => {
    const isFullAdmin = u.permissions.includes('all');
    return `
      <tr>
        <td>
          <div class="avatar-name">
            <div class="avatar avatar-sm" style="background:${u.avatarColor || 'var(--color-primary)'}">
              ${u.name.charAt(0)}
            </div>
            <div>
              <div class="an-name">${u.name}</div>
              <div class="an-sub">${u.email}</div>
            </div>
          </div>
        </td>
        <td>
          <span class="badge badge-${isFullAdmin ? 'primary' : 'info'} badge-no-dot">
            ${u.role}
          </span>
        </td>
        <td>
          ${isFullAdmin ? '<span class="badge badge-success">Root (All Access)</span>' : `
            <div style="display:flex;gap:4px;flex-wrap:wrap;max-width:280px">
              ${u.permissions.slice(0, 3).map(p => `<span class="badge badge-gray badge-no-dot" style="font-size:11px">${p}</span>`).join('')}
              ${u.permissions.length > 3 ? `<span class="badge badge-gray badge-no-dot" style="font-size:11px">+${u.permissions.length - 3}</span>` : ''}
            </div>
          `}
        </td>
        <td>
          <span class="badge badge-success">
            <i data-lucide="shield-check" style="width:12px;height:12px;display:inline-block"></i> 2FA Enabled
          </span>
        </td>
        <td style="color:var(--color-text-muted);font-size:var(--font-size-sm)">${u.lastActive}</td>
        <td>
          <span class="badge badge-success">Active</span>
        </td>
        <td class="td-actions">
          <button class="btn btn-secondary btn-sm" onclick="openEditUserModal('${u.id}')" title="Edit Permissions">
            <i data-lucide="edit-3"></i> Edit
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

window.filterPlatformUsers = () => {
  const q = document.getElementById('pu-search')?.value.toLowerCase() || '';
  const role = document.getElementById('pu-role-filter')?.value || '';
  const users = get('platformUsers') || [];

  const filtered = users.filter(u => {
    const matchQ = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchRole = !role || u.role === role;
    return matchQ && matchRole;
  });

  const tbody = document.getElementById('pu-tbody');
  if (tbody) {
    tbody.innerHTML = renderPlatformUserRows(filtered);
    refreshIcons(tbody);
  }
};

window.openInviteUserModal = () => {
  openModal({
    title: 'Invite Platform Team Member',
    size: 'md',
    body: `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Full Name <span class="required">*</span></label>
          <input type="text" class="form-control" id="inv-name" placeholder="e.g. Rahul Deshmukh" />
        </div>
        <div class="form-group">
          <label class="form-label">Work Email <span class="required">*</span></label>
          <input type="email" class="form-control" id="inv-email" placeholder="rahul@medicore.io" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Assigned Platform Role <span class="required">*</span></label>
        <select class="form-control" id="inv-role">
          <option value="Super Admin">Super Admin (Full Root Permissions)</option>
          <option value="Billing & Operations Admin">Billing & Operations Admin</option>
          <option value="Support & Onboarding Lead">Support & Onboarding Lead</option>
          <option value="Security & Compliance Officer">Security & Compliance Officer</option>
        </select>
      </div>
      <div class="form-section-title">Granular Permissions Scope</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">
        <label class="form-check"><input type="checkbox" checked /> <span>Hospital Creation & Edit</span></label>
        <label class="form-check"><input type="checkbox" checked /> <span>Subscription & Billing Access</span></label>
        <label class="form-check"><input type="checkbox" checked /> <span>WhatsApp Bot Configuration</span></label>
        <label class="form-check"><input type="checkbox" checked /> <span>Support Ticketing Helpdesk</span></label>
        <label class="form-check"><input type="checkbox" checked /> <span>View Healthcare Audit Logs</span></label>
        <label class="form-check"><input type="checkbox" checked /> <span>Security & 2FA Enforcement</span></label>
      </div>
      <div class="form-group">
        <label class="form-check">
          <input type="checkbox" checked disabled />
          <span>Require 2FA setup upon initial password creation (Enforced Policy)</span>
        </label>
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="window._closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="submitInviteUser()">Send Invitation Email</button>
    `
  });
};

window.submitInviteUser = () => {
  const name = document.getElementById('inv-name')?.value;
  const email = document.getElementById('inv-email')?.value;
  const role = document.getElementById('inv-role')?.value;

  if (!name || !email) {
    showToast({ title: 'Missing Info', message: 'Name and Email are required.', type: 'warning' });
    return;
  }

  addPlatformUser({
    name,
    email,
    role,
    permissions: role === 'Super Admin' ? ['all'] : ['hospitals_read', 'support_read', 'billing_read']
  });

  closeModal();
  showToast({ title: 'Invitation Sent', message: `Secure onboarding link dispatched to ${email}.`, type: 'success' });
  renderSAPlatformUsers();
};

window.openEditUserModal = (id) => {
  const users = get('platformUsers') || [];
  const u = users.find(user => user.id === id);
  if (!u) return;

  openModal({
    title: `Edit Operator — ${u.name}`,
    size: 'md',
    body: `
      <div class="form-group">
        <label class="form-label">Operator Name</label>
        <input type="text" class="form-control" value="${u.name}" readonly />
      </div>
      <div class="form-group">
        <label class="form-label">Platform Role</label>
        <select class="form-control">
          <option ${u.role === 'Super Admin' ? 'selected' : ''}>Super Admin</option>
          <option ${u.role.includes('Billing') ? 'selected' : ''}>Billing & Operations Admin</option>
          <option ${u.role.includes('Support') ? 'selected' : ''}>Support & Onboarding Lead</option>
          <option ${u.role.includes('Security') ? 'selected' : ''}>Security & Compliance Officer</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-check">
          <input type="checkbox" ${u.status === 'active' ? 'checked' : ''} />
          <span>Account Active (Uncheck to temporarily suspend platform access)</span>
        </label>
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="window._closeModal()">Close</button>
      <button class="btn btn-primary" onclick="window._closeModal();showToast({ title: 'Operator Updated', type: 'success' })">Save Changes</button>
    `
  });
};

window.openRolesMatrixModal = () => {
  openModal({
    title: 'Platform Role & Permission Matrix (RBAC)',
    size: 'lg',
    body: `
      <table class="data-table">
        <thead>
          <tr>
            <th>Module / Capability</th>
            <th>Super Admin</th>
            <th>Billing Admin</th>
            <th>Support Lead</th>
            <th>Compliance Officer</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Create & Edit Hospitals</td><td>✓ Full</td><td>View Only</td><td>✓ Full</td><td>View Only</td></tr>
          <tr><td>Billing & Invoices Enforcement</td><td>✓ Full</td><td>✓ Full</td><td>View Only</td><td>View Only</td></tr>
          <tr><td>WhatsApp Bot Global Config</td><td>✓ Full</td><td>—</td><td>✓ Full</td><td>—</td></tr>
          <tr><td>Support Ticket Resolution</td><td>✓ Full</td><td>View Only</td><td>✓ Full</td><td>—</td></tr>
          <tr><td>Platform User Management</td><td>✓ Full</td><td>—</td><td>—</td><td>—</td></tr>
          <tr><td>Healthcare Audit Trail Logs</td><td>✓ Full</td><td>—</td><td>—</td><td>✓ Full</td></tr>
        </tbody>
      </table>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="window._closeModal()">Close</button>
    `
  });
};
