// ============================================================
// receptionist/checkin.js — Module 2: Patient Arrival & Check-In
// ============================================================

import { renderTopbar } from '../../components/topbar.js';
import { renderSidebar } from '../../components/sidebar.js';
import { get, getHospitalPatients, getHospitalAppointments, checkInAndIssueToken } from '../../store.js';
import { showToast } from '../../components/toast.js';
import { refreshIcons } from '../../components/icons.js';

let searchQuery = '';

export function renderReceptionistCheckin() {
  renderSidebar();
  renderTopbar({
    breadcrumb: [
      { label: 'Front Desk', path: '/rc/queue' },
      { label: 'Patient Check-In & Arrival' }
    ]
  });

  const patients = getHospitalPatients();
  const appts = getHospitalAppointments();
  const today = new Date().toISOString().split('T')[0];

  const filteredPatients = searchQuery.trim() 
    ? patients.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.phone?.includes(searchQuery) || p.patientId.toLowerCase().includes(searchQuery.toLowerCase()))
    : patients.slice(0, 8);

  const content = document.getElementById('content');
  content.innerHTML = `
    <!-- Header -->
    <div class="page-header">
      <div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
          <h1 class="page-title">Patient Arrival & Live Check-In</h1>
          <span class="badge badge-primary">Front Desk Arrival Station</span>
        </div>
        <p class="page-subtitle">Search registered patient by name or phone to automatically match scheduled booking, assign OPD token, and notify doctor</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary" onclick="navigateTo('/rc/quick-book')">
          + New Patient Walk-in Form
        </button>
      </div>
    </div>

    <!-- Live Auto-Match Search Box -->
    <div class="card mb-6" style="padding:22px 28px;background:white;box-shadow:var(--shadow-sm);border:2px solid var(--color-primary)">
      <label class="form-label" style="font-size:15px;font-weight:800;color:var(--color-primary);margin-bottom:8px">
        🔍 Instant Patient Match & Arrival Check-In
      </label>
      <div style="display:flex;gap:12px;align-items:center">
        <input type="text" class="form-control" style="font-size:16px;padding:12px 18px" placeholder="Enter patient name, phone number, or UHID (e.g. Arvind, +91 99001..., MH-APL-001)..." id="checkin-search-input" value="${searchQuery}" oninput="handleCheckinSearch(this.value)" autofocus />
      </div>
      <div style="font-size:12px;color:var(--color-text-muted);margin-top:8px">
        ⚡ Typing instantly scans active bookings and pulls existing appointment details without re-entering data.
      </div>
    </div>

    <!-- Matched Patients / Scheduled Bookings List -->
    <div class="card">
      <div class="card-header" style="background:#F8FAFC">
        <span class="card-title">Matched Patients & Today's Bookings (${filteredPatients.length})</span>
        <span class="badge badge-gray">1-Click Check-In & Token Issuance</span>
      </div>

      <div class="card-body" style="padding:20px">
        <div style="display:flex;flex-direction:column;gap:14px">
          ${filteredPatients.map(p => {
            // Find if this patient has a booking today
            const bookedAppt = appts.find(a => a.patientId === p.id && (a.date === today || a.id.startsWith('a')));
            const doc = bookedAppt ? get('staff').find(s => s.id === bookedAppt.doctorId) : null;
            const isCheckedIn = bookedAppt && (bookedAppt.status === 'confirmed' || bookedAppt.status === 'in-progress');

            return `
              <div style="border:1.5px solid ${bookedAppt ? 'var(--color-primary)' : 'var(--color-border)'};border-radius:12px;padding:18px;background:${bookedAppt ? '#EFF6FF' : 'white'};display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px">
                <div style="display:flex;align-items:center;gap:16px">
                  <div class="user-avatar" style="background:${p.gender === 'Female' ? '#be185d' : 'var(--color-primary)'};width:46px;height:46px;font-size:16px;font-weight:800">
                    ${p.name.charAt(0)}
                  </div>
                  <div>
                    <div style="display:flex;align-items:center;gap:10px">
                      <span style="font-weight:800;font-size:16px;color:var(--color-text)">${p.name}</span>
                      <span class="badge badge-gray badge-no-dot">${p.patientId}</span>
                      ${bookedAppt?.source === 'whatsapp' ? '<span class="badge badge-wa badge-no-dot" style="font-size:10px">📱 WhatsApp</span>' : ''}
                    </div>
                    <div style="font-size:12px;color:var(--color-text-muted);margin-top:2px">
                      ${p.age} yrs · ${p.gender} · Blood: <strong>${p.bloodGroup}</strong> · Phone: <strong>${p.phone}</strong>
                    </div>
                    ${bookedAppt ? `
                      <div style="font-size:12px;color:var(--color-primary);font-weight:700;margin-top:4px">
                        📅 Scheduled Today at ${bookedAppt.time} with Dr. ${doc?.name || 'Doctor'} (${bookedAppt.department})
                      </div>
                    ` : `
                      <div style="font-size:11px;color:var(--color-text-muted);margin-top:2px">No scheduled booking today (Walk-in check-in available)</div>
                    `}
                  </div>
                </div>

                <div style="display:flex;align-items:center;gap:10px">
                  ${bookedAppt ? `
                    <div style="text-align:right;margin-right:8px">
                      <span style="font-size:11px;color:var(--color-text-muted)">Token #</span>
                      <div style="font-family:monospace;font-weight:800;font-size:16px;color:var(--color-primary)">${bookedAppt.token || 'AUTO'}</div>
                    </div>
                    <button class="btn btn-primary btn-lg" onclick="triggerPatientCheckIn('${bookedAppt.id}', '${p.id}', '${p.name}', '${doc?.name || 'Specialist'}')">
                      <i data-lucide="check-circle-2"></i> ${isCheckedIn ? 'Print Token & Buzz Doctor' : 'Mark Arrived & Issue Token'}
                    </button>
                  ` : `
                    <button class="btn btn-secondary" onclick="navigateTo('/rc/quick-book?patientId=${p.id}')">
                      Create Walk-in Token →
                    </button>
                  `}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;

  refreshIcons(content);
}

window.handleCheckinSearch = (val) => {
  searchQuery = val;
  renderReceptionistCheckin();
  // Keep focus on input
  setTimeout(() => {
    const input = document.getElementById('checkin-search-input');
    if (input) {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  }, 10);
};

window.triggerPatientCheckIn = (apptId, patientId, patientName, doctorName) => {
  const token = checkInAndIssueToken(apptId, patientId);
  showToast({
    title: `🎫 Token Issued: ${token || 'TKN-101'}`,
    message: `${patientName} marked arrived. Doctor ${doctorName} notified in OPD room.`,
    type: 'success'
  });
  navigateTo('/rc/queue');
};
