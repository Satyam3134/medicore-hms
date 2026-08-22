// ============================================================
// superadmin/phase2.js — Phase 2 Deferred Modules
// ============================================================

import { renderTopbar } from '../../components/topbar.js';
import { renderSidebar } from '../../components/sidebar.js';
import { get } from '../../store.js';
import { refreshIcons } from '../../components/icons.js';

export function renderSAPhase2(moduleType = 'staff') {
  renderSidebar();

  const titles = {
    staff: 'Global Staff & Doctor Directory',
    compliance: 'Compliance & Data Governance (HIPAA)',
    integrations: 'API & Developer Integrations (EHR/Lab APIs)'
  };

  renderTopbar({ breadcrumb: [{ label: 'Super Admin', path: '/sa/dashboard' }, { label: titles[moduleType] || 'Phase 2 Module' }] });

  const staff = get('staff') || [];
  const hospitals = get('hospitals') || [];
  const content = document.getElementById('content');

  if (moduleType === 'staff') {
    content.innerHTML = `
      <div class="page-header">
        <div>
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
            <h1 class="page-title">Global Staff & Doctor Directory</h1>
            <span class="badge badge-accent">Phase 2 Enabled Preview</span>
          </div>
          <p class="page-subtitle">Cross-hospital searchable database of ${staff.length} medical personnel across ${hospitals.length} facilities</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" onclick="navigateTo('/sa/dashboard')">← Command Center</button>
        </div>
      </div>

      <div class="data-table-wrapper mb-6">
        <div class="table-toolbar">
          <div class="table-toolbar-left">
            <div class="table-search">
              <i data-lucide="search"></i>
              <input type="text" placeholder="Search doctors across all hospitals..." id="g-staff-search" oninput="filterGlobalStaff()" />
            </div>
            <select class="table-filter-select" id="g-staff-role-filter" onchange="filterGlobalStaff()">
              <option value="">All Roles</option>
              <option value="Doctor">Doctors Only</option>
              <option value="Nurse">Nurses</option>
              <option value="Receptionist">Receptionists</option>
            </select>
          </div>
          <div class="table-toolbar-right">
            <span style="font-size:var(--font-size-sm);color:var(--color-text-muted)">${staff.length} Staff Members</span>
          </div>
        </div>

        <div class="scroll-x">
          <table class="data-table">
            <thead>
              <tr>
                <th>Staff Member</th>
                <th>Assigned Hospital</th>
                <th>Role</th>
                <th>Department</th>
                <th>Experience</th>
                <th>Contact</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody id="g-staff-tbody">
              ${staff.map(s => {
                const h = hospitals.find(hosp => hosp.id === s.hospitalId);
                return `
                  <tr>
                    <td>
                      <div class="avatar-name">
                        <div class="avatar avatar-sm" style="background:${s.role === 'Doctor' ? 'var(--color-primary)' : 'var(--color-accent)'}">${s.name.charAt(0)}</div>
                        <div>
                          <div class="an-name">${s.name}</div>
                          <div class="an-sub">${s.qualification || s.role}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style="font-weight:600">${h?.name || 'Apollo Hospital'}</div>
                      <div style="font-size:var(--font-size-xs);color:var(--color-text-muted)">${h?.city || 'Mumbai'}</div>
                    </td>
                    <td><span class="badge badge-${s.role === 'Doctor' ? 'primary' : 'gray'} badge-no-dot">${s.role}</span></td>
                    <td>${s.department}</td>
                    <td>${s.experience || '6 yrs'}</td>
                    <td style="font-size:var(--font-size-xs);color:var(--color-text-muted)">${s.phone || '—'}</td>
                    <td><span class="badge badge-success">Active</span></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } else if (moduleType === 'compliance') {
    content.innerHTML = `
      <div class="page-header">
        <div>
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
            <h1 class="page-title">Compliance & Data Governance</h1>
            <span class="badge badge-info">Phase 2 Module</span>
          </div>
          <p class="page-subtitle">Patient consent management, DISHA / HIPAA compliance controls, and data retention rules per hospital</p>
        </div>
      </div>

      <div class="content-grid" style="grid-template-columns: 1fr 1fr">
        <div class="card">
          <div class="card-header"><span class="card-title">Regulatory Frameworks</span></div>
          <div class="card-body">
            <div class="info-list">
              <div class="info-row"><span class="info-label">HIPAA Safe Harbor Compliance</span><span class="badge badge-success">● Compliant</span></div>
              <div class="info-row"><span class="info-label">DISHA (Digital Information Security in Healthcare)</span><span class="badge badge-success">● Compliant</span></div>
              <div class="info-row"><span class="info-label">GDPR / Data Localization</span><span class="badge badge-success">● Mumbai Cloud Node</span></div>
              <div class="info-row"><span class="info-label">Patient Consent Logging</span><span class="info-value">Active (100% Optical/Digital)</span></div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><span class="card-title">Tenant Retention Policies</span></div>
          <div class="card-body">
            <div class="info-list">
              <div class="info-row"><span class="info-label">EMR Record Retention</span><span class="info-value">7 Years (MCI Guidelines)</span></div>
              <div class="info-row"><span class="info-label">Diagnostic Imaging Storage</span><span class="info-value">3 Years Hot / 5 Years Cold</span></div>
              <div class="info-row"><span class="info-label">Audit Log Retention</span><span class="info-value">10 Years Immutable</span></div>
            </div>
          </div>
        </div>
      </div>
    `;
  } else if (moduleType === 'integrations') {
    content.innerHTML = `
      <div class="page-header">
        <div>
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
            <h1 class="page-title">API & Developer Integrations</h1>
            <span class="badge badge-info">Phase 2 Module</span>
          </div>
          <p class="page-subtitle">Connect external Laboratory Information Systems (LIS), PACS Imaging, and Insurance TPA clearinghouses</p>
        </div>
      </div>

      <div class="content-grid" style="grid-template-columns: 1fr 1fr">
        <div class="card">
          <div class="card-header"><span class="card-title">Available Connectors</span></div>
          <div class="card-body">
            <div class="info-list">
              <div class="info-row"><span class="info-label">HL7 / FHIR Gateway</span><span class="badge badge-gray">Ready for Tenant Binding</span></div>
              <div class="info-row"><span class="info-label">Lab LIS API (Roche / Abbott)</span><span class="badge badge-gray">Beta Testing</span></div>
              <div class="info-row"><span class="info-label">Insurance TPA Bridge (MediAssist/MDIndia)</span><span class="badge badge-gray">Available on Enterprise Plan</span></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  refreshIcons(content);
}

window.filterGlobalStaff = () => {
  const q = document.getElementById('g-staff-search')?.value.toLowerCase() || '';
  const role = document.getElementById('g-staff-role-filter')?.value || '';
  const staff = get('staff') || [];
  const hospitals = get('hospitals') || [];

  const filtered = staff.filter(s => {
    const matchQ = !q || s.name.toLowerCase().includes(q) || s.department.toLowerCase().includes(q);
    const matchRole = !role || s.role === role;
    return matchQ && matchRole;
  });

  const tbody = document.getElementById('g-staff-tbody');
  if (tbody) {
    tbody.innerHTML = filtered.map(s => {
      const h = hospitals.find(hosp => hosp.id === s.hospitalId);
      return `
        <tr>
          <td>
            <div class="avatar-name">
              <div class="avatar avatar-sm" style="background:${s.role === 'Doctor' ? 'var(--color-primary)' : 'var(--color-accent)'}">${s.name.charAt(0)}</div>
              <div>
                <div class="an-name">${s.name}</div>
                <div class="an-sub">${s.qualification || s.role}</div>
              </div>
            </div>
          </td>
          <td>
            <div style="font-weight:600">${h?.name || 'Apollo Hospital'}</div>
            <div style="font-size:var(--font-size-xs);color:var(--color-text-muted)">${h?.city || 'Mumbai'}</div>
          </td>
          <td><span class="badge badge-${s.role === 'Doctor' ? 'primary' : 'gray'} badge-no-dot">${s.role}</span></td>
          <td>${s.department}</td>
          <td>${s.experience || '6 yrs'}</td>
          <td style="font-size:var(--font-size-xs);color:var(--color-text-muted)">${s.phone || '—'}</td>
          <td><span class="badge badge-success">Active</span></td>
        </tr>
      `;
    }).join('');
    refreshIcons(tbody);
  }
};
