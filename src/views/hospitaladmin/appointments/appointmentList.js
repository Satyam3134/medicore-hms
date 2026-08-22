// ============================================================
// hospitaladmin/appointments/appointmentList.js — Appt List View
// ============================================================

import { renderTopbar } from '../../../components/topbar.js';
import { renderSidebar } from '../../../components/sidebar.js';
import { getHospitalAppointments, getPatientById, getStaffById, get } from '../../../store.js';

export function renderAppointmentList() {
  renderSidebar();
  renderTopbar({ breadcrumb: [
    { label: 'Hospital Admin', path: '/ha/dashboard' },
    { label: 'Appointments', path: '/ha/appointments' },
    { label: 'List View' }
  ] });

  const appts = getHospitalAppointments().sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return b.time.localeCompare(a.time);
  });
  const departments = [...new Set(appts.map(a => a.department))];

  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="page-header">
      <div><h1 class="page-title">Appointment List</h1><p class="page-subtitle">${appts.length} total appointments</p></div>
      <div class="page-actions">
        <button class="btn btn-secondary" onclick="navigateTo('/ha/appointments')">
          <i data-lucide="calendar" style="width:14px;height:14px"></i> Calendar View
        </button>
        <button class="btn btn-primary" onclick="window.openBookAppointmentModal && openBookAppointmentModal()">
          <i data-lucide="plus" style="width:14px;height:14px"></i> Book
        </button>
      </div>
    </div>

    <div class="data-table-wrapper">
      <div class="table-toolbar">
        <div class="table-toolbar-left">
          <div class="table-search">
            <i data-lucide="search" style="width:14px;height:14px;color:var(--color-text-light)"></i>
            <input type="text" placeholder="Search patient, doctor…" id="al-search" oninput="filterApptList()" />
          </div>
          <select class="table-filter-select" id="al-status" onchange="filterApptList()">
            <option value="">All Status</option>
            <option>confirmed</option><option>pending</option><option>completed</option><option>cancelled</option><option>no-show</option>
          </select>
          <select class="table-filter-select" id="al-dept" onchange="filterApptList()">
            <option value="">All Departments</option>
            ${departments.map(d => `<option>${d}</option>`).join('')}
          </select>
          <select class="table-filter-select" id="al-source" onchange="filterApptList()">
            <option value="">All Sources</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="walkin">Walk-in</option>
            <option value="phone">Phone</option>
            <option value="admin">Admin</option>
          </select>
          <input type="date" class="table-filter-select" id="al-date" onchange="filterApptList()" />
        </div>
        <div class="table-toolbar-right">
          <span id="al-count" style="font-size:12px;color:var(--color-text-muted)">${appts.length} appointments</span>
        </div>
      </div>
      <div class="scroll-x">
        <table class="data-table">
          <thead>
            <tr>
              <th>Token</th>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Department</th>
              <th>Date & Time</th>
              <th>Type</th>
              <th>Source</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="al-tbody">${renderApptRows(appts)}</tbody>
        </table>
      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons({ el: content });
}

function renderApptRows(list) {
  if (!list.length) return `<tr><td colspan="9"><div class="empty-state"><div class="es-title">No appointments found</div></div></td></tr>`;
  return list.map(a => {
    const patient = getPatientById(a.patientId);
    const doctor = getStaffById(a.doctorId);
    const isToday = a.date === new Date().toISOString().split('T')[0];
    return `
      <tr onclick="window.openApptDrawer && openApptDrawer('${a.id}')" style="cursor:pointer">
        <td><span style="font-family:monospace;font-size:12px;font-weight:600;color:var(--color-primary)">${a.token}</span></td>
        <td>
          <div class="avatar-name">
            <div class="avatar avatar-sm" style="background:var(--color-primary)">${patient?.name?.charAt(0) || 'P'}</div>
            <div>
              <div class="an-name">${patient?.name || '—'}</div>
              <div class="an-sub">${patient?.patientId || ''}</div>
            </div>
          </div>
        </td>
        <td style="color:var(--color-text-muted)">${doctor?.name || '—'}</td>
        <td>${a.department}</td>
        <td>
          <div style="font-size:13px;font-weight:${isToday ? '600' : '400'};color:${isToday ? 'var(--color-primary)' : 'var(--color-text)'}">
            ${isToday ? 'Today' : a.date}
          </div>
          <div style="font-size:12px;color:var(--color-text-muted)">${a.time}</div>
        </td>
        <td><span class="badge badge-info badge-no-dot">${a.type}</span></td>
        <td>
          ${a.source === 'whatsapp'
            ? `<span class="badge badge-wa badge-no-dot">📱 WhatsApp</span>`
            : `<span class="badge badge-gray badge-no-dot">${a.source}</span>`}
        </td>
        <td>
          <span class="badge badge-${a.status === 'confirmed' ? 'info' : a.status === 'completed' ? 'gray' : a.status === 'pending' ? 'warning' : 'danger'}">
            ${a.status}
          </span>
        </td>
        <td class="td-actions" onclick="event.stopPropagation()">
          <button class="row-action-btn" onclick="window.openApptDrawer && openApptDrawer('${a.id}')">
            <i data-lucide="eye" style="width:14px;height:14px"></i>
          </button>
          <button class="row-action-btn" onclick="navigateTo('/ha/patients/${a.patientId}')">
            <i data-lucide="user" style="width:14px;height:14px"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

window.filterApptList = () => {
  const q = document.getElementById('al-search')?.value.toLowerCase() || '';
  const status = document.getElementById('al-status')?.value || '';
  const dept = document.getElementById('al-dept')?.value || '';
  const source = document.getElementById('al-source')?.value || '';
  const date = document.getElementById('al-date')?.value || '';
  const appts = getHospitalAppointments();

  const filtered = appts.filter(a => {
    const p = getPatientById(a.patientId);
    const d = getStaffById(a.doctorId);
    const matchQ = !q || p?.name.toLowerCase().includes(q) || d?.name.toLowerCase().includes(q) || a.department.toLowerCase().includes(q);
    return matchQ && (!status || a.status === status) && (!dept || a.department === dept) && (!source || a.source === source) && (!date || a.date === date);
  }).sort((a, b) => b.date.localeCompare(a.date));

  const tbody = document.getElementById('al-tbody');
  const count = document.getElementById('al-count');
  if (tbody) { tbody.innerHTML = renderApptRows(filtered); if (window.lucide) lucide.createIcons({ el: tbody }); }
  if (count) count.textContent = `${filtered.length} appointments`;
};

