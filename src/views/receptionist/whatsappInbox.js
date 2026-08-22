// ============================================================
// receptionist/whatsappInbox.js — Module 6: WhatsApp Bookings Inbox
// ============================================================

import { renderTopbar } from '../../components/topbar.js';
import { renderSidebar } from '../../components/sidebar.js';
import { get, getHospitalAppointments, getPatientById, getStaffById, confirmWhatsAppBooking } from '../../store.js';
import { showToast } from '../../components/toast.js';
import { refreshIcons } from '../../components/icons.js';

export function renderReceptionistWhatsAppInbox() {
  renderSidebar();
  renderTopbar({
    breadcrumb: [
      { label: 'Front Desk', path: '/rc/queue' },
      { label: 'WhatsApp Patient Bookings Inbox' }
    ]
  });

  const allAppts = getHospitalAppointments();
  const waAppts = allAppts.filter(a => a.source === 'whatsapp');
  const pendingVerify = waAppts.filter(a => !a.verifiedByReception);
  const verified = waAppts.filter(a => a.verifiedByReception);

  const content = document.getElementById('content');
  content.innerHTML = `
    <!-- Header -->
    <div class="page-header">
      <div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
          <h1 class="page-title">WhatsApp Patient Bookings Inbox</h1>
          <span class="badge badge-success" style="background:#25D366;color:white">📱 WhatsApp Meta Webhook Active</span>
        </div>
        <p class="page-subtitle">Verify automated chatbot bookings, review requested specialty departments, and confirm arrival tokens</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary" onclick="navigateTo('/whatsapp')">
          <i data-lucide="qr-code"></i> View Hospital QR Standee
        </button>
        <button class="btn btn-primary" onclick="verifyAllWABookings()">
          <i data-lucide="check-check"></i> Bulk Confirm All (${pendingVerify.length})
        </button>
      </div>
    </div>

    <!-- WhatsApp Stream KPIs -->
    <div class="stats-grid stats-grid-3" style="margin-bottom:28px">
      <div class="stat-card">
        <div class="stat-card-icon green"><i data-lucide="message-square"></i></div>
        <div class="stat-card-value">${waAppts.length} Bookings</div>
        <div class="stat-card-label">Total WhatsApp Bookings</div>
        <div class="stat-card-trend"><span class="trend-up">● Automated via MediBot</span></div>
      </div>

      <div class="stat-card">
        <div class="stat-card-icon amber"><i data-lucide="clock"></i></div>
        <div class="stat-card-value">${pendingVerify.length} Pending</div>
        <div class="stat-card-label">Awaiting Reception Verification</div>
        <div class="stat-card-trend">Check department & token allocation</div>
      </div>

      <div class="stat-card">
        <div class="stat-card-icon blue"><i data-lucide="check-circle"></i></div>
        <div class="stat-card-value">${verified.length} Verified</div>
        <div class="stat-card-label">Ready in Doctor Queues</div>
        <div class="stat-card-trend">Token confirmed with patient</div>
      </div>
    </div>

    <!-- WhatsApp Bookings Table -->
    <div class="card">
      <div class="card-header" style="background:#F8FAFC">
        <span class="card-title">Incoming Chatbot Bookings Roster (${waAppts.length})</span>
        <span class="badge badge-gray">WhatsApp Cloud API</span>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Token #</th>
              <th>Patient Name</th>
              <th>Phone Number</th>
              <th>Selected Specialty</th>
              <th>Assigned Doctor</th>
              <th>Time Slot</th>
              <th>Bot Status</th>
              <th class="td-actions">Front Desk Verification</th>
            </tr>
          </thead>
          <tbody>
            ${waAppts.map(a => {
              const p = getPatientById(a.patientId);
              const doc = getStaffById(a.doctorId);
              const isVerified = a.verifiedByReception;

              return `
                <tr>
                  <td style="font-family:monospace;font-weight:800;color:#16A34A">${a.token || 'WA-AUTO'}</td>
                  <td>
                    <div style="font-weight:700;font-size:var(--font-size-base)">${p?.name || 'WhatsApp Patient'}</div>
                    <div style="font-size:11px;color:var(--color-text-muted)">ID: ${p?.patientId || 'MH-APL-001'}</div>
                  </td>
                  <td>
                    <div style="font-weight:600;font-family:monospace">${p?.phone || '+91 98765 43210'}</div>
                  </td>
                  <td><span class="badge badge-info badge-no-dot">${a.department}</span></td>
                  <td>
                    <div style="font-weight:600">${doc?.name || 'Dr. Assigned'}</div>
                  </td>
                  <td>
                    <div style="font-weight:700">${a.time}</div>
                    <div style="font-size:11px;color:var(--color-text-muted)">${a.date}</div>
                  </td>
                  <td>
                    <span class="badge ${isVerified ? 'badge-success' : 'badge-warning'}">
                      ${isVerified ? 'VERIFIED' : 'NEW BOOKING'}
                    </span>
                  </td>
                  <td class="td-actions">
                    ${!isVerified ? `
                      <button class="btn btn-success btn-sm" onclick="triggerConfirmWABooking('${a.id}', '${p?.name}')">
                        <i data-lucide="check"></i> Confirm & Issue
                      </button>
                    ` : `
                      <span style="font-size:11px;color:var(--color-success);font-weight:700">✓ Token Sent</span>
                    `}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  refreshIcons(content);
}

window.triggerConfirmWABooking = (apptId, patientName) => {
  confirmWhatsAppBooking(apptId);
  showToast({
    title: '📱 WhatsApp Booking Confirmed',
    message: `Confirmation SMS/WhatsApp ticket sent to ${patientName}.`,
    type: 'wa'
  });
  renderReceptionistWhatsAppInbox();
};

window.verifyAllWABookings = () => {
  const waAppts = getHospitalAppointments().filter(a => a.source === 'whatsapp');
  waAppts.forEach(a => confirmWhatsAppBooking(a.id));
  showToast({ title: 'All Bookings Confirmed', message: 'Bulk verification finished.', type: 'success' });
  renderReceptionistWhatsAppInbox();
};
