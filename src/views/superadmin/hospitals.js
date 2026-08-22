// ============================================================
// superadmin/hospitals.js — Hospitals List View
// ============================================================

import { renderTopbar } from '../../components/topbar.js';
import { renderSidebar } from '../../components/sidebar.js';
import { get, updateHospitalStatus } from '../../store.js';
import { openModal, closeModal, confirmDialog } from '../../components/modal.js';
import { showToast } from '../../components/toast.js';

export function renderHospitalsList() {
  renderSidebar();
  renderTopbar({ breadcrumb: [{ label: 'Super Admin', path: '/sa/dashboard' }, { label: 'Hospitals' }] });

  const hospitals = get('hospitals');
  const content = document.getElementById('content');

  content.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Hospitals</h1>
        <p class="page-subtitle">${hospitals.length} hospitals registered on the platform</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary">
          <i data-lucide="download" style="width:14px;height:14px"></i> Export
        </button>
        <button class="btn btn-primary" onclick="navigateTo('/sa/hospitals/new')">
          <i data-lucide="plus" style="width:14px;height:14px"></i> New Hospital
        </button>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="stats-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:24px">
      <div class="stat-card">
        <div class="stat-card-icon blue" style="margin-bottom:8px"><i data-lucide="building-2" style="width:20px;height:20px"></i></div>
        <div class="stat-card-value">${hospitals.length}</div>
        <div class="stat-card-label">Total Hospitals</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-icon green" style="margin-bottom:8px"><i data-lucide="check-circle" style="width:20px;height:20px"></i></div>
        <div class="stat-card-value">${hospitals.filter(h => h.status === 'active').length}</div>
        <div class="stat-card-label">Active</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-icon amber" style="margin-bottom:8px"><i data-lucide="clock" style="width:20px;height:20px"></i></div>
        <div class="stat-card-value">${hospitals.filter(h => h.status === 'pending').length}</div>
        <div class="stat-card-label">Pending Setup</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-icon red" style="margin-bottom:8px"><i data-lucide="pause-circle" style="width:20px;height:20px"></i></div>
        <div class="stat-card-value">${hospitals.filter(h => h.status === 'suspended').length}</div>
        <div class="stat-card-label">Suspended</div>
      </div>
    </div>

    <div class="data-table-wrapper">
      <div class="table-toolbar">
        <div class="table-toolbar-left">
          <div class="table-search">
            <i data-lucide="search" style="width:14px;height:14px;color:var(--color-text-light)"></i>
            <input type="text" placeholder="Search hospitals…" id="hosp-search" oninput="filterHospitals()" />
          </div>
          <select class="table-filter-select" id="hosp-status-filter" onchange="filterHospitals()">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
          </select>
          <select class="table-filter-select" id="hosp-plan-filter" onchange="filterHospitals()">
            <option value="">All Plans</option>
            <option value="Starter">Starter</option>
            <option value="Professional">Professional</option>
            <option value="Enterprise">Enterprise</option>
          </select>
          <select class="table-filter-select" id="hosp-type-filter" onchange="filterHospitals()">
            <option value="">All Types</option>
            <option value="Multi-Specialty">Multi-Specialty</option>
            <option value="Single-Specialty">Single-Specialty</option>
            <option value="Clinic">Clinic</option>
          </select>
        </div>
        <div class="table-toolbar-right">
          <span id="hosp-count" style="font-size:12px;color:var(--color-text-muted)">${hospitals.length} hospitals</span>
        </div>
      </div>
      <div class="scroll-x">
        <table class="data-table" id="hospitals-table">
          <thead>
            <tr>
              <th>Hospital</th>
              <th>Type</th>
              <th>Location</th>
              <th>Beds</th>
              <th>Staff</th>
              <th>Patients</th>
              <th>Subscription</th>
              <th>Status</th>
              <th>Onboarded</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="hospitals-tbody">
            ${renderHospitalRows(hospitals)}
          </tbody>
        </table>
      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons({ el: content });
}

function renderHospitalRows(hospitals) {
  if (!hospitals.length) {
    return `<tr><td colspan="10"><div class="empty-state"><i data-lucide="building-2" class="es-icon" style="width:40px;height:40px"></i><div class="es-title">No hospitals found</div><div class="es-desc">Try adjusting your filters</div></div></td></tr>`;
  }

  return hospitals.map(h => `
    <tr onclick="navigateTo('/sa/hospitals/${h.id}')" style="cursor:pointer">
      <td>
        <div class="avatar-name">
          <div class="avatar" style="background:${h.primaryColor || '#0B5FA5'};border-radius:8px;width:36px;height:36px;font-size:14px">${h.name.charAt(0)}</div>
          <div>
            <div class="an-name">${h.name}</div>
            <div class="an-sub">${h.adminName} · ${h.email}</div>
          </div>
        </div>
      </td>
      <td><span class="badge badge-info badge-no-dot">${h.type}</span></td>
      <td style="color:var(--color-text-muted)">${h.city}, ${h.state}</td>
      <td>${h.beds}</td>
      <td>${h.stats.staff}</td>
      <td>${h.stats.patients}</td>
      <td>
        <div style="font-size:13px;font-weight:500">${h.plan}</div>
        <div style="font-size:11px;color:var(--color-text-muted)">₹${h.planPrice?.toLocaleString()}/mo</div>
      </td>
      <td>
        <span class="badge badge-${h.status === 'active' ? 'success' : h.status === 'pending' ? 'warning' : 'danger'}">
          ${h.status.charAt(0).toUpperCase() + h.status.slice(1)}
        </span>
      </td>
      <td style="color:var(--color-text-muted)">${h.onboardedDate}</td>
      <td class="td-actions" onclick="event.stopPropagation()">
        <button class="row-action-btn" title="View Details" onclick="navigateTo('/sa/hospitals/${h.id}')">
          <i data-lucide="eye" style="width:14px;height:14px"></i>
        </button>
        <button class="row-action-btn" title="Enter as Admin" onclick="enterHospital('${h.id}')">
          <i data-lucide="log-in" style="width:14px;height:14px"></i>
        </button>
        <button class="row-action-btn" title="${h.status === 'active' ? 'Suspend' : 'Activate'}"
          onclick="toggleHospitalStatus('${h.id}', '${h.status}')">
          <i data-lucide="${h.status === 'active' ? 'pause' : 'play'}" style="width:14px;height:14px"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

window.filterHospitals = () => {
  const query = document.getElementById('hosp-search')?.value.toLowerCase() || '';
  const status = document.getElementById('hosp-status-filter')?.value || '';
  const plan = document.getElementById('hosp-plan-filter')?.value || '';
  const type = document.getElementById('hosp-type-filter')?.value || '';
  const hospitals = get('hospitals');

  const filtered = hospitals.filter(h => {
    const matchQ = !query || h.name.toLowerCase().includes(query) || h.city.toLowerCase().includes(query) || h.adminName.toLowerCase().includes(query);
    const matchS = !status || h.status === status;
    const matchP = !plan || h.plan === plan;
    const matchT = !type || h.type === type;
    return matchQ && matchS && matchP && matchT;
  });

  const tbody = document.getElementById('hospitals-tbody');
  const count = document.getElementById('hosp-count');
  if (tbody) tbody.innerHTML = renderHospitalRows(filtered);
  if (count) count.textContent = `${filtered.length} hospitals`;
  if (window.lucide) lucide.createIcons({ el: document.getElementById('hospitals-table') });
};

window.toggleHospitalStatus = (id, currentStatus) => {
  const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
  confirmDialog({
    title: newStatus === 'suspended' ? 'Suspend Hospital?' : 'Reactivate Hospital?',
    message: newStatus === 'suspended'
      ? 'This will disable all hospital staff access. Existing patient data is preserved.'
      : 'This will restore full access for hospital staff and operations.',
    danger: newStatus === 'suspended',
    confirmLabel: newStatus === 'suspended' ? 'Suspend' : 'Reactivate',
    onConfirm: () => {
      updateHospitalStatus(id, newStatus);
      showToast({
        title: newStatus === 'suspended' ? 'Hospital Suspended' : 'Hospital Reactivated',
        type: newStatus === 'suspended' ? 'warning' : 'success',
      });
      renderHospitalsList();
    }
  });
};
