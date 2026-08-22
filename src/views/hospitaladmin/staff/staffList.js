// ============================================================
// hospitaladmin/staff/staffList.js — Staff Directory
// ============================================================

import { renderTopbar } from '../../../components/topbar.js';
import { renderSidebar } from '../../../components/sidebar.js';
import { getHospitalStaff, get, addStaff } from '../../../store.js';
import { openModal, closeModal } from '../../../components/modal.js';
import { showToast } from '../../../components/toast.js';
import { navigate } from '../../../router.js';

export function renderStaffList() {
  renderSidebar();
  renderTopbar({ breadcrumb: [{ label: 'Hospital Admin', path: '/ha/dashboard' }, { label: 'Staff & Doctors' }] });

  const staffList = getHospitalStaff();
  const departments = get('departments').filter(d => d.hospitalId === get('currentHospitalId'));

  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Staff & Doctors</h1>
        <p class="page-subtitle">${staffList.length} staff members · ${staffList.filter(s => s.status === 'on-duty').length} on duty today</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary" onclick="navigateTo('/ha/staff/roster')">
          <i data-lucide="calendar" style="width:14px;height:14px"></i> Roster View
        </button>
        <button class="btn btn-primary" onclick="openAddStaffModal()">
          <i data-lucide="user-plus" style="width:14px;height:14px"></i> Add Staff
        </button>
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="stats-grid" style="grid-template-columns:repeat(5,1fr);margin-bottom:24px">
      ${[
        { label: 'Total Staff', value: staffList.length, icon: 'users', color: 'blue' },
        { label: 'Doctors', value: staffList.filter(s => s.role === 'Doctor').length, icon: 'stethoscope', color: 'teal' },
        { label: 'On Duty', value: staffList.filter(s => s.status === 'on-duty').length, icon: 'check-circle', color: 'green' },
        { label: 'On Leave', value: staffList.filter(s => s.status === 'on-leave').length, icon: 'clock', color: 'amber' },
        { label: 'Off Duty', value: staffList.filter(s => s.status === 'off-duty').length, icon: 'moon', color: 'purple' },
      ].map(s => `
        <div class="stat-card">
          <div class="stat-card-icon ${s.color}"><i data-lucide="${s.icon}" style="width:20px;height:20px"></i></div>
          <div class="stat-card-value">${s.value}</div>
          <div class="stat-card-label">${s.label}</div>
        </div>
      `).join('')}
    </div>

    <div class="data-table-wrapper">
      <div class="table-toolbar">
        <div class="table-toolbar-left">
          <div class="table-search">
            <i data-lucide="search" style="width:14px;height:14px;color:var(--color-text-light)"></i>
            <input type="text" placeholder="Search by name, department…" id="staff-search" oninput="filterStaff()" />
          </div>
          <select class="table-filter-select" id="staff-role-filter" onchange="filterStaff()">
            <option value="">All Roles</option>
            <option>Doctor</option><option>Nurse</option><option>Receptionist</option><option>Lab Technician</option>
          </select>
          <select class="table-filter-select" id="staff-status-filter" onchange="filterStaff()">
            <option value="">All Status</option>
            <option value="on-duty">On Duty</option>
            <option value="off-duty">Off Duty</option>
            <option value="on-leave">On Leave</option>
          </select>
          <select class="table-filter-select" id="staff-dept-filter" onchange="filterStaff()">
            <option value="">All Departments</option>
            ${departments.map(d => `<option value="${d.name}">${d.name}</option>`).join('')}
          </select>
        </div>
        <div class="table-toolbar-right">
          <span id="staff-count" style="font-size:12px;color:var(--color-text-muted)">${staffList.length} members</span>
        </div>
      </div>
      <div class="scroll-x">
        <table class="data-table" id="staff-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Department</th>
              <th>Specialization</th>
              <th>Fee/Consult</th>
              <th>Contact</th>
              <th>Status</th>
              <th>Join Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="staff-tbody">${renderStaffRows(staffList)}</tbody>
        </table>
      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons({ el: content });
}

function renderStaffRows(list) {
  if (!list.length) return `<tr><td colspan="9"><div class="empty-state"><div class="es-title">No staff found</div></div></td></tr>`;
  return list.map(s => `
    <tr onclick="navigateTo('/ha/staff/${s.id}')" style="cursor:pointer">
      <td>
        <div class="avatar-name">
          <div class="avatar avatar-sm" style="background:var(--color-primary)">${s.initials}</div>
          <div>
            <div class="an-name">${s.name}</div>
            <div class="an-sub">${s.email}</div>
          </div>
        </div>
      </td>
      <td><span class="badge badge-${s.role === 'Doctor' ? 'primary' : s.role === 'Nurse' ? 'accent' : 'gray'} badge-no-dot">${s.role}</span></td>
      <td style="color:var(--color-text-muted)">${s.department}</td>
      <td style="color:var(--color-text-muted)">${s.specialization || '—'}</td>
      <td>${s.consultationFee ? '₹' + s.consultationFee : '—'}</td>
      <td style="color:var(--color-text-muted)">${s.phone}</td>
      <td><span class="badge badge-${s.status === 'on-duty' ? 'success' : s.status === 'on-leave' ? 'warning' : 'gray'}">${s.status}</span></td>
      <td style="color:var(--color-text-muted)">${s.joinDate}</td>
      <td class="td-actions" onclick="event.stopPropagation()">
        <button class="row-action-btn" title="View Profile" onclick="navigateTo('/ha/staff/${s.id}')">
          <i data-lucide="eye" style="width:14px;height:14px"></i>
        </button>
        <button class="row-action-btn" title="Edit">
          <i data-lucide="pencil" style="width:14px;height:14px"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

window.filterStaff = () => {
  const q = document.getElementById('staff-search')?.value.toLowerCase() || '';
  const role = document.getElementById('staff-role-filter')?.value || '';
  const status = document.getElementById('staff-status-filter')?.value || '';
  const dept = document.getElementById('staff-dept-filter')?.value || '';
  const all = getHospitalStaff();
  const filtered = all.filter(s =>
    (!q || s.name.toLowerCase().includes(q) || s.department.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)) &&
    (!role || s.role === role) &&
    (!status || s.status === status) &&
    (!dept || s.department === dept)
  );
  const tbody = document.getElementById('staff-tbody');
  const count = document.getElementById('staff-count');
  if (tbody) { tbody.innerHTML = renderStaffRows(filtered); if (window.lucide) lucide.createIcons({ el: tbody }); }
  if (count) count.textContent = `${filtered.length} members`;
};

window.openAddStaffModal = () => {
  const departments = get('departments').filter(d => d.hospitalId === get('currentHospitalId'));
  openModal({
    title: 'Add New Staff Member',
    size: 'lg',
    body: `
      <div class="form-section-title">Personal Information</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Full Name <span class="required">*</span></label>
          <input class="form-control" id="ns-name" placeholder="Dr. First Last" />
        </div>
        <div class="form-group">
          <label class="form-label">Role <span class="required">*</span></label>
          <select class="form-control" id="ns-role">
            <option>Doctor</option><option>Nurse</option><option>Receptionist</option><option>Lab Technician</option><option>Pharmacist</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Department <span class="required">*</span></label>
          <select class="form-control" id="ns-dept">
            ${departments.map(d => `<option value="${d.name}">${d.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Specialization</label>
          <input class="form-control" id="ns-spec" placeholder="e.g. Interventional Cardiology" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Email</label>
          <input type="email" class="form-control" id="ns-email" placeholder="doctor@hospital.com" />
        </div>
        <div class="form-group">
          <label class="form-label">Phone</label>
          <input class="form-control" id="ns-phone" placeholder="+91 XXXXX XXXXX" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Qualifications</label>
          <input class="form-control" id="ns-qual" placeholder="e.g. MBBS, MD (Cardiology)" />
        </div>
        <div class="form-group">
          <label class="form-label">Consultation Fee (₹)</label>
          <input type="number" class="form-control" id="ns-fee" placeholder="e.g. 800" />
        </div>
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="window._closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="submitAddStaff()">Add Staff Member</button>
    `
  });
};

window.submitAddStaff = () => {
  const name = document.getElementById('ns-name')?.value;
  if (!name) { showToast({ title: 'Name required', type: 'warning' }); return; }
  addStaff({
    name,
    role: document.getElementById('ns-role')?.value || 'Doctor',
    department: document.getElementById('ns-dept')?.value || 'General Medicine',
    specialization: document.getElementById('ns-spec')?.value || null,
    email: document.getElementById('ns-email')?.value || '',
    phone: document.getElementById('ns-phone')?.value || '',
    qualifications: document.getElementById('ns-qual')?.value || '',
    consultationFee: parseInt(document.getElementById('ns-fee')?.value) || null,
    status: 'on-duty',
    joinDate: new Date().toISOString().split('T')[0],
    initials: name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
    avatar: null,
    schedule: {},
    patientCount: 0,
    rating: null,
  });
  closeModal();
  showToast({ title: 'Staff Added!', message: `${name} has been added to the team.`, type: 'success' });
  renderStaffList();
};
