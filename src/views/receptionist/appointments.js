// ============================================================
// receptionist/appointments.js — Module 4: Appointments View & Light Edit
// ============================================================

import { renderTopbar } from '../../components/topbar.js';
import { renderSidebar } from '../../components/sidebar.js';
import { get, getHospitalAppointments, getPatientById, getStaffById, rescheduleAppointment, cancelAppointment } from '../../store.js';
import { showToast } from '../../components/toast.js';
import { openModal, closeModal } from '../../components/modal.js';
import { refreshIcons } from '../../components/icons.js';

export function renderReceptionistAppointments() {
  renderSidebar();
  renderTopbar({
    breadcrumb: [
      { label: 'Front Desk', path: '/rc/queue' },
      { label: 'Appointments Ledger' }
    ]
  });

  const appts = getHospitalAppointments();

  const content = document.getElementById('content');
  content.innerHTML = `
    <!-- Header -->
    <div class="page-header">
      <div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
          <h1 class="page-title">Front Desk Appointments Ledger</h1>
          <span class="badge badge-primary">${appts.length} Bookings</span>
        </div>
        <p class="page-subtitle">View scheduled bookings, perform quick reschedules, or handle cancellations with patient feedback</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" onclick="navigateTo('/rc/quick-book')">
          <i data-lucide="plus-circle"></i> + New Appointment
        </button>
      </div>
    </div>

    <!-- Search & Filter Bar -->
    <div class="card mb-6" style="padding:14px 20px;background:white">
      <div style="display:flex;gap:12px;align-items:center">
        <input type="text" class="form-control" placeholder="Search appointments by patient, token, doctor, or date..." id="rc-appt-search" oninput="filterRcApptTable(this.value)" />
      </div>
    </div>

    <!-- Appointments Table -->
    <div class="card">
      <div class="card-header" style="background:#F8FAFC">
        <span class="card-title">All Hospital Appointments (${appts.length})</span>
        <span class="badge badge-gray">Front Desk Operations</span>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Token #</th>
              <th>Patient Name</th>
              <th>Date & Time</th>
              <th>Consulting Doctor</th>
              <th>Department</th>
              <th>Channel</th>
              <th>Status</th>
              <th class="td-actions">Light Edit Actions</th>
            </tr>
          </thead>
          <tbody id="rc-appt-tbody">
            ${renderRcApptRows(appts)}
          </tbody>
        </table>
      </div>
    </div>
  `;

  refreshIcons(content);
}

function renderRcApptRows(list) {
  if (!list.length) {
    return `<tr><td colspan="8"><div class="empty-state"><div class="es-title">No appointments found</div></div></td></tr>`;
  }

  return list.map(a => {
    const p = getPatientById(a.patientId);
    const doc = getStaffById(a.doctorId);
    const isCancelled = a.status === 'cancelled';
    const isCompleted = a.status === 'completed';

    return `
      <tr>
        <td style="font-family:monospace;font-weight:800;color:var(--color-primary)">${a.token || 'TKN'}</td>
        <td>
          <div style="font-weight:700;font-size:var(--font-size-base)">${p?.name || 'Patient'}</div>
          <div style="font-size:11px;color:var(--color-text-muted)">${p?.phone || ''}</div>
        </td>
        <td>
          <div style="font-weight:700">${a.date}</div>
          <div style="font-size:11px;color:var(--color-text-muted)">${a.time}</div>
        </td>
        <td>
          <div style="font-weight:600">${doc?.name || 'Doctor'}</div>
        </td>
        <td><span class="badge badge-info badge-no-dot">${a.department}</span></td>
        <td>
          <span class="badge ${a.source === 'whatsapp' ? 'badge-wa' : 'badge-gray'} badge-no-dot">
            ${a.source === 'whatsapp' ? '📱 WhatsApp' : a.source === 'walkin' ? 'Walk-In' : 'Phone Desk'}
          </span>
        </td>
        <td>
          <span class="badge badge-${isCompleted ? 'success' : isCancelled ? 'danger' : 'warning'}">
            ${a.status.toUpperCase()}
          </span>
        </td>
        <td class="td-actions">
          ${!isCancelled && !isCompleted ? `
            <button class="btn btn-secondary btn-sm" onclick="openRescheduleModal('${a.id}', '${p?.name}', '${a.date}', '${a.time}')">
              <i data-lucide="calendar"></i> Reschedule
            </button>
            <button class="btn btn-danger btn-sm" onclick="openCancelModal('${a.id}', '${p?.name}')">
              Cancel
            </button>
          ` : `
            <span style="font-size:11px;color:var(--color-text-muted)">Closed</span>
          `}
        </td>
      </tr>
    `;
  }).join('');
}

window.openRescheduleModal = (apptId, patientName, currentDate, currentTime) => {
  openModal({
    title: `Reschedule Appointment for ${patientName}`,
    size: 'md',
    body: `
      <div class="form-group">
        <label class="form-label">New Appointment Date <span class="required">*</span></label>
        <input type="date" class="form-control" id="resched-date" value="${currentDate}" required />
      </div>

      <div class="form-group">
        <label class="form-label">New Time Slot <span class="required">*</span></label>
        <select class="form-control" id="resched-time">
          <option ${currentTime === '09:00' ? 'selected' : ''}>09:00 AM</option>
          <option ${currentTime === '10:00' ? 'selected' : ''}>10:00 AM</option>
          <option ${currentTime === '11:00' ? 'selected' : ''}>11:00 AM</option>
          <option ${currentTime === '02:00' ? 'selected' : ''}>02:00 PM</option>
          <option ${currentTime === '03:30' ? 'selected' : ''}>03:30 PM</option>
          <option ${currentTime === '04:30' ? 'selected' : ''}>04:30 PM</option>
        </select>
      </div>

      <label class="form-check">
        <input type="checkbox" checked id="resched-wa-notify" />
        <span style="font-size:12px">📱 Send updated WhatsApp confirmation ticket to patient</span>
      </label>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="window._closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="submitReschedule('${apptId}')">Save Reschedule</button>
    `
  });
};

window.submitReschedule = (apptId) => {
  const newDate = document.getElementById('resched-date')?.value;
  const newTime = document.getElementById('resched-time')?.value;
  rescheduleAppointment(apptId, newDate, newTime);
  closeModal();
  showToast({ title: 'Appointment Rescheduled', message: `Moved to ${newDate} at ${newTime}.`, type: 'success' });
  renderReceptionistAppointments();
};

window.openCancelModal = (apptId, patientName) => {
  openModal({
    title: `Cancel Appointment: ${patientName}`,
    size: 'sm',
    body: `
      <p style="font-size:13px;color:var(--color-text);margin-bottom:12px">Are you sure you want to cancel this booking?</p>
      <div class="form-group">
        <label class="form-label">Cancellation Reason</label>
        <input type="text" class="form-control" id="cancel-reason" placeholder="e.g. Patient travel or reschedule needed" />
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="window._closeModal()">No, Keep</button>
      <button class="btn btn-danger" onclick="submitCancelAppt('${apptId}')">Confirm Cancel</button>
    `
  });
};

window.submitCancelAppt = (apptId) => {
  const reason = document.getElementById('cancel-reason')?.value || 'Patient requested';
  cancelAppointment(apptId, reason);
  closeModal();
  showToast({ title: 'Booking Cancelled', message: 'Slot reopened for other patients.', type: 'info' });
  renderReceptionistAppointments();
};
