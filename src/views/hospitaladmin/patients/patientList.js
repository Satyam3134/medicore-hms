// ============================================================
// hospitaladmin/patients/patientList.js — Patient Directory
// ============================================================

import { renderTopbar } from '../../../components/topbar.js';
import { renderSidebar } from '../../../components/sidebar.js';
import { getHospitalPatients, getDoctors, get, addPatient } from '../../../store.js';
import { openModal, closeModal } from '../../../components/modal.js';
import { showToast } from '../../../components/toast.js';

export function renderPatientList() {
  renderSidebar();
  renderTopbar({ breadcrumb: [{ label: 'Hospital Admin', path: '/ha/dashboard' }, { label: 'Patients' }] });

  const patients = getHospitalPatients();
  const doctors = getDoctors();

  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Patient Directory</h1>
        <p class="page-subtitle">${patients.length} patients registered</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary">
          <i data-lucide="download" style="width:14px;height:14px"></i> Export
        </button>
        <button class="btn btn-primary" onclick="openAddPatientModal()">
          <i data-lucide="user-plus" style="width:14px;height:14px"></i> Register Patient
        </button>
      </div>
    </div>

    <!-- Quick Filters -->
    <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">
      ${[
        { label: 'All Patients', value: '', count: patients.length },
        { label: 'OPD', value: 'OPD', count: patients.filter(p => p.status === 'OPD').length },
        { label: 'Admitted', value: 'Admitted', count: patients.filter(p => p.status === 'Admitted').length },
        { label: 'Discharged', value: 'Discharged', count: patients.filter(p => p.status === 'Discharged').length },
      ].map((f, i) => `
        <button class="btn ${i === 0 ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="setStatusFilter('${f.value}', this)">
          ${f.label} <span class="badge badge-${i === 0 ? 'success' : 'gray'} badge-no-dot" style="font-size:10px;margin-left:4px">${f.count}</span>
        </button>
      `).join('')}
    </div>

    <div class="data-table-wrapper">
      <div class="table-toolbar">
        <div class="table-toolbar-left">
          <div class="table-search">
            <i data-lucide="search" style="width:14px;height:14px;color:var(--color-text-light)"></i>
            <input type="text" placeholder="Search by name, ID, phone…" id="pt-search" oninput="filterPatients()" />
          </div>
          <select class="table-filter-select" id="pt-dept-filter" onchange="filterPatients()">
            <option value="">All Departments</option>
            ${[...new Set(patients.map(p => p.department))].map(d => `<option>${d}</option>`).join('')}
          </select>
          <select class="table-filter-select" id="pt-doctor-filter" onchange="filterPatients()">
            <option value="">All Doctors</option>
            ${doctors.map(d => `<option value="${d.id}">${d.name}</option>`).join('')}
          </select>
        </div>
        <div class="table-toolbar-right">
          <span id="pt-count" style="font-size:12px;color:var(--color-text-muted)">${patients.length} patients</span>
        </div>
      </div>
      <div class="scroll-x">
        <table class="data-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Patient ID</th>
              <th>Age / Gender</th>
              <th>Contact</th>
              <th>Department</th>
              <th>Assigned Doctor</th>
              <th>Last Visit</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="pt-tbody">${renderPatientRows(patients)}</tbody>
        </table>
      </div>
      <div class="table-pagination">
        <span id="pt-showing">Showing ${Math.min(patients.length, 10)} of ${patients.length}</span>
        <div class="pagination-controls">
          <button class="page-btn" disabled><i data-lucide="chevron-left" style="width:14px;height:14px"></i></button>
          <button class="page-btn active">1</button>
          <button class="page-btn"><i data-lucide="chevron-right" style="width:14px;height:14px"></i></button>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons({ el: content });
  window._ptStatusFilter = '';
}

function renderPatientRows(list) {
  const allStaff = get('staff');
  if (!list.length) return `<tr><td colspan="9"><div class="empty-state"><div class="es-title">No patients found</div></div></td></tr>`;
  return list.map(p => {
    const doc = allStaff.find(s => s.id === p.assignedDoctor);
    return `
      <tr onclick="navigateTo('/ha/patients/${p.id}')" style="cursor:pointer">
        <td>
          <div class="avatar-name">
            <div class="avatar avatar-sm" style="background:${p.gender === 'Female' ? '#be185d' : 'var(--color-primary)'}">${p.name.charAt(0)}</div>
            <div>
              <div class="an-name">${p.name}</div>
              <div class="an-sub">${p.bloodGroup} · ${p.medicalHistory.slice(0, 1).join(', ') || 'No history'}</div>
            </div>
          </div>
        </td>
        <td style="font-family:monospace;font-size:12px;color:var(--color-text-muted)">${p.patientId}</td>
        <td>${p.age}y / ${p.gender}</td>
        <td style="color:var(--color-text-muted)">${p.phone}</td>
        <td>${p.department}</td>
        <td style="color:var(--color-text-muted)">${doc?.name || '—'}</td>
        <td style="color:var(--color-text-muted)">${p.lastVisit}</td>
        <td>
          <span class="badge badge-${p.status === 'Admitted' ? 'danger' : p.status === 'OPD' ? 'info' : 'gray'}">
            ${p.status}
          </span>
        </td>
        <td class="td-actions" onclick="event.stopPropagation()">
          <button class="row-action-btn" title="View Profile" onclick="navigateTo('/ha/patients/${p.id}')">
            <i data-lucide="eye" style="width:14px;height:14px"></i>
          </button>
          <button class="row-action-btn" title="Book Appointment">
            <i data-lucide="calendar-plus" style="width:14px;height:14px"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

window.setStatusFilter = (status, btn) => {
  window._ptStatusFilter = status;
  document.querySelectorAll('[onclick^="setStatusFilter"]').forEach(b => {
    b.className = 'btn btn-secondary btn-sm';
    b.querySelector('.badge')?.setAttribute('class', 'badge badge-gray badge-no-dot');
  });
  btn.className = 'btn btn-primary btn-sm';
  filterPatients();
};

window.filterPatients = () => {
  const q = document.getElementById('pt-search')?.value.toLowerCase() || '';
  const dept = document.getElementById('pt-dept-filter')?.value || '';
  const doc = document.getElementById('pt-doctor-filter')?.value || '';
  const status = window._ptStatusFilter || '';
  const patients = getHospitalPatients();
  const filtered = patients.filter(p =>
    (!q || p.name.toLowerCase().includes(q) || p.patientId.toLowerCase().includes(q) || p.phone.includes(q)) &&
    (!dept || p.department === dept) &&
    (!doc || p.assignedDoctor === doc) &&
    (!status || p.status === status)
  );
  const tbody = document.getElementById('pt-tbody');
  const count = document.getElementById('pt-count');
  if (tbody) { tbody.innerHTML = renderPatientRows(filtered); if (window.lucide) lucide.createIcons({ el: tbody }); }
  if (count) count.textContent = `${filtered.length} patients`;
};

window.openAddPatientModal = () => {
  const doctors = getDoctors();
  openModal({
    title: 'Register New Patient',
    size: 'lg',
    body: `
      <div class="form-section-title">Demographics</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Full Name <span class="required">*</span></label>
          <input class="form-control" id="np-name" placeholder="Patient full name" />
        </div>
        <div class="form-group">
          <label class="form-label">Age / Date of Birth</label>
          <input type="number" class="form-control" id="np-age" placeholder="Age" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Gender</label>
          <select class="form-control" id="np-gender">
            <option>Male</option><option>Female</option><option>Other</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Blood Group</label>
          <select class="form-control" id="np-blood">
            ${['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(b => `<option>${b}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-section-title">Contact</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Phone <span class="required">*</span></label>
          <input class="form-control" id="np-phone" placeholder="+91 XXXXX XXXXX" />
        </div>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input type="email" class="form-control" id="np-email" placeholder="patient@email.com" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Address</label>
        <textarea class="form-control" id="np-address" rows="2" placeholder="Full address"></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Emergency Contact</label>
        <input class="form-control" id="np-emergency" placeholder="Name + phone number" />
      </div>
      <div class="form-section-title">Medical</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Assign Doctor</label>
          <select class="form-control" id="np-doctor">
            <option value="">Select doctor…</option>
            ${doctors.map(d => `<option value="${d.id}">${d.name} (${d.department})</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Known Allergies</label>
          <input class="form-control" id="np-allergies" placeholder="e.g. Penicillin, Aspirin" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Medical History Summary</label>
        <textarea class="form-control" id="np-history" rows="2" placeholder="e.g. Hypertension, Type 2 Diabetes"></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Insurance Details</label>
        <input class="form-control" id="np-insurance" placeholder="Provider — Policy #" />
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="window._closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="submitAddPatient()">Register Patient</button>
    `
  });
};

window.submitAddPatient = () => {
  const name = document.getElementById('np-name')?.value;
  const phone = document.getElementById('np-phone')?.value;
  if (!name || !phone) { showToast({ title: 'Required fields missing', type: 'warning' }); return; }
  const doctorId = document.getElementById('np-doctor')?.value;
  const doctors = getDoctors();
  const doc = doctors.find(d => d.id === doctorId);
  addPatient({
    name,
    age: parseInt(document.getElementById('np-age')?.value) || 0,
    gender: document.getElementById('np-gender')?.value || 'Male',
    bloodGroup: document.getElementById('np-blood')?.value || 'O+',
    phone,
    email: document.getElementById('np-email')?.value || null,
    address: document.getElementById('np-address')?.value || '',
    emergencyContact: document.getElementById('np-emergency')?.value || '',
    assignedDoctor: doctorId || null,
    department: doc?.department || 'General Medicine',
    allergies: (document.getElementById('np-allergies')?.value || '').split(',').map(a => a.trim()).filter(Boolean),
    medicalHistory: (document.getElementById('np-history')?.value || '').split(',').map(a => a.trim()).filter(Boolean),
    insurance: document.getElementById('np-insurance')?.value || null,
    registeredDate: new Date().toISOString().split('T')[0],
    lastVisit: new Date().toISOString().split('T')[0],
    status: 'OPD',
    visits: [],
    prescriptions: [],
    labReports: [],
    billing: [],
    vitals: {},
  });
  closeModal();
  showToast({ title: 'Patient Registered!', message: `${name} has been added to the system.`, type: 'success' });
  renderPatientList();
};
