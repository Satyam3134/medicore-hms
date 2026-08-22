// ============================================================
// hospitaladmin/queueManagement.js — Module 7: Front Desk & Queue
// ============================================================

import { renderTopbar } from '../../components/topbar.js';
import { renderSidebar } from '../../components/sidebar.js';
import { getHospitalAppointments, getHospitalPatients, getHospitalStaff, get, updateAppointmentStatus } from '../../store.js';
import { showToast } from '../../components/toast.js';
import { openModal, closeModal } from '../../components/modal.js';
import { refreshIcons } from '../../components/icons.js';

export function renderQueueManagement() {
  renderSidebar();
  renderTopbar({
    breadcrumb: [
      { label: 'Hospital Admin', path: '/ha/dashboard' },
      { label: 'Front Desk & Queue Management' }
    ]
  });

  const appts = getHospitalAppointments();
  const patients = getHospitalPatients();
  const doctors = getHospitalStaff().filter(s => s.role === 'Doctor');

  // Filter today's queue
  const today = new Date().toISOString().split('T')[0];
  const queueList = appts.filter(a => a.date === today || a.id.startsWith('a'));

  const waiting = queueList.filter(a => a.status === 'confirmed' || a.status === 'pending');
  const inConsult = queueList.filter(a => a.status === 'in-progress');
  const completed = queueList.filter(a => a.status === 'completed');

  const content = document.getElementById('content');
  content.innerHTML = `
    <!-- Header -->
    <div class="page-header">
      <div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
          <h1 class="page-title">Front Desk & Real-Time OPD Queue</h1>
          <span class="badge badge-success">Live Token Station</span>
        </div>
        <p class="page-subtitle">Manage today's patient arrivals, live check-ins, walk-in token generation, and doctor consultation calling</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary" onclick="openPublicDisplayBoard()">
          <i data-lucide="tv"></i> OPD Display Screen
        </button>
        <button class="btn btn-primary" onclick="openWalkinRegistrationModal()">
          <i data-lucide="user-plus"></i> Walk-in Token Registration
        </button>
      </div>
    </div>

    <!-- Queue KPI Summary Cards -->
    <div class="stats-grid stats-grid-4" style="margin-bottom:28px">
      <div class="stat-card">
        <div class="stat-card-icon amber"><i data-lucide="clock"></i></div>
        <div class="stat-card-value">${waiting.length}</div>
        <div class="stat-card-label">Patients Waiting in OPD</div>
        <div class="stat-card-trend">Avg wait time ~18 mins</div>
      </div>

      <div class="stat-card">
        <div class="stat-card-icon blue"><i data-lucide="stethoscope"></i></div>
        <div class="stat-card-value">${inConsult.length || 2}</div>
        <div class="stat-card-label">In Active Consultation</div>
        <div class="stat-card-trend">Across 5 OPD rooms</div>
      </div>

      <div class="stat-card">
        <div class="stat-card-icon green"><i data-lucide="check-circle-2"></i></div>
        <div class="stat-card-value">${completed.length}</div>
        <div class="stat-card-label">Consultations Completed</div>
        <div class="stat-card-trend"><span class="trend-up">● Smooth flow today</span></div>
      </div>

      <div class="stat-card">
        <div class="stat-card-icon purple"><i data-lucide="smartphone"></i></div>
        <div class="stat-card-value">${queueList.filter(a => a.source === 'whatsapp').length}</div>
        <div class="stat-card-label">WhatsApp Self-Bookings</div>
        <div class="stat-card-trend">Zero reception queue delay</div>
      </div>
    </div>

    <!-- Live OPD Token Queue Ledger -->
    <div class="card">
      <div class="card-header" style="background:#F8FAFC">
        <div>
          <span class="card-title">Today's Live Queue Roster (${queueList.length} Appointments)</span>
          <div style="font-size:var(--font-size-xs);color:var(--color-text-muted);margin-top:2px">Real-time status updates and doctor buzzer</div>
        </div>
        <div style="display:flex;gap:8px">
          <input type="text" class="form-control" style="width:260px;padding:6px 12px;font-size:13px" placeholder="Search token or patient..." id="queue-search" oninput="filterQueueTable()" />
        </div>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Token #</th>
              <th>Patient Name</th>
              <th>Assigned Doctor</th>
              <th>Department</th>
              <th>Slot Time</th>
              <th>Booking Source</th>
              <th>Queue Status</th>
              <th class="td-actions">Front Desk Actions</th>
            </tr>
          </thead>
          <tbody id="queue-tbody">
            ${renderQueueRows(queueList, patients, doctors)}
          </tbody>
        </table>
      </div>
    </div>
  `;

  refreshIcons(content);
}

function renderQueueRows(list, patients, doctors) {
  if (!list.length) {
    return `<tr><td colspan="8"><div class="empty-state"><div class="es-title">No patients in queue</div></div></td></tr>`;
  }

  return list.map(item => {
    const p = patients.find(pt => pt.id === item.patientId);
    const doc = doctors.find(d => d.id === item.doctorId);
    const isWaiting = item.status === 'confirmed' || item.status === 'pending';
    const isCompleted = item.status === 'completed';

    const sourceBadge = item.source === 'whatsapp' ? 'badge-wa' : 'badge-gray';
    const sourceLabel = item.source === 'whatsapp' ? 'WhatsApp Bot' : item.source === 'walkin' ? 'Walk-in' : item.source === 'phone' ? 'Phone' : 'Admin';

    return `
      <tr>
        <td>
          <div style="font-family:monospace;font-weight:800;font-size:16px;color:var(--color-primary);background:#EFF6FF;padding:4px 10px;border-radius:8px;display:inline-block">
            ${item.token || 'TKN-' + item.id.toUpperCase()}
          </div>
        </td>
        <td>
          <div style="font-weight:800;font-size:var(--font-size-base)">${p?.name || 'Patient'}</div>
          <div style="font-size:var(--font-size-xs);color:var(--color-text-muted)">${p?.gender || 'M'}, ${p?.age || '45'}y · ${p?.phone || '+91 98XXX'}</div>
        </td>
        <td>
          <div style="font-weight:700">${doc?.name || 'Doctor'}</div>
          <div style="font-size:var(--font-size-xs);color:var(--color-text-muted)">Room 204</div>
        </td>
        <td><span class="badge badge-info badge-no-dot">${item.department}</span></td>
        <td style="font-weight:600">${item.time}</td>
        <td>
          <span class="badge ${sourceBadge} badge-no-dot" style="${item.source === 'whatsapp' ? 'background:#25D366;color:white' : ''}">
            ${sourceLabel}
          </span>
        </td>
        <td>
          <span class="badge badge-${isCompleted ? 'success' : isWaiting ? 'warning' : 'info'}">
            ${item.status.toUpperCase()}
          </span>
        </td>
        <td class="td-actions">
          ${isWaiting ? `
            <button class="btn btn-primary btn-sm" onclick="checkinAndNotifyDoctor('${item.id}', '${p?.name}', '${doc?.name}')">
              <i data-lucide="bell"></i> Notify Doctor
            </button>
            <button class="btn btn-success btn-sm" onclick="markQueueCompleted('${item.id}')">
              ✓ Done
            </button>
          ` : isCompleted ? `
            <span style="font-size:12px;color:var(--color-success);font-weight:700">✓ Completed</span>
          ` : `
            <button class="btn btn-secondary btn-sm" onclick="markQueueCompleted('${item.id}')">Complete</button>
          `}
        </td>
      </tr>
    `;
  }).join('');
}

window.checkinAndNotifyDoctor = (apptId, patientName, doctorName) => {
  updateAppointmentStatus(apptId, 'in-progress');
  showToast({
    title: '🔔 Doctor Buzzer Sent',
    message: `${patientName} checked in. Doctor ${doctorName} notified on doctor terminal.`,
    type: 'success'
  });
  renderQueueManagement();
};

window.markQueueCompleted = (apptId) => {
  updateAppointmentStatus(apptId, 'completed');
  showToast({ title: '✓ Consultation Finished', message: 'Queue updated.', type: 'success' });
  renderQueueManagement();
};

window.openWalkinRegistrationModal = () => {
  const doctors = getHospitalStaff().filter(s => s.role === 'Doctor' && s.status === 'on-duty');
  openModal({
    title: 'Walk-in Patient Token Registration',
    size: 'md',
    body: `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Patient Full Name <span class="required">*</span></label>
          <input type="text" class="form-control" id="walkin-name" placeholder="e.g. Anand Deshmukh" required />
        </div>
        <div class="form-group">
          <label class="form-label">Phone Number <span class="required">*</span></label>
          <input type="tel" class="form-control" id="walkin-phone" placeholder="+91 98765 00000" required />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Age</label>
          <input type="number" class="form-control" id="walkin-age" placeholder="42" />
        </div>
        <div class="form-group">
          <label class="form-label">Gender</label>
          <select class="form-control" id="walkin-gender">
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Consulting Doctor <span class="required">*</span></label>
        <select class="form-control" id="walkin-doc">
          ${doctors.map(d => `<option value="${d.id}">${d.name} (${d.department}) — Fee: ₹${d.consultationFee}</option>`).join('')}
        </select>
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="window._closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="submitWalkinToken()">Generate Token & Print</button>
    `
  });
};

window.submitWalkinToken = () => {
  const name = document.getElementById('walkin-name')?.value;
  if (!name) {
    showToast({ title: 'Name Required', message: 'Please enter patient name.', type: 'warning' });
    return;
  }
  closeModal();
  showToast({
    title: '🎫 Token Issued: TKN-108',
    message: `Walk-in token registered for ${name}. Dispatched to doctor queue.`,
    type: 'success'
  });
  renderQueueManagement();
};

window.openPublicDisplayBoard = () => {
  openModal({
    title: '📺 OPD Public Waiting Room Token Display',
    size: 'lg',
    body: `
      <div style="background:#0F172A;color:white;border-radius:14px;padding:32px;text-align:center">
        <div style="font-size:24px;font-weight:800;letter-spacing:0.04em;margin-bottom:8px">APOLLO MULTI-SPECIALTY HOSPITAL</div>
        <div style="font-size:14px;color:#94A3B8;margin-bottom:28px">OPD CONSULTATION QUEUE STATUS</div>

        <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:20px;margin-bottom:28px">
          <div style="background:#1E293B;border:2px solid #3B82F6;border-radius:12px;padding:20px">
            <div style="font-size:12px;color:#94A3B8;text-transform:uppercase">NOW SERVING</div>
            <div style="font-size:36px;font-weight:800;color:#60A5FA;font-family:monospace;margin:6px 0">C-001</div>
            <div style="font-weight:700">Dr. Meera Joshi</div>
            <div style="font-size:12px;color:#38BDF8">Room 204 (Cardiology)</div>
          </div>

          <div style="background:#1E293B;border:2px solid #10B981;border-radius:12px;padding:20px">
            <div style="font-size:12px;color:#94A3B8;text-transform:uppercase">NOW SERVING</div>
            <div style="font-size:36px;font-weight:800;color:#34D399;font-family:monospace;margin:6px 0">O-001</div>
            <div style="font-weight:700">Dr. Suresh Patel</div>
            <div style="font-size:12px;color:#34D399">Room 108 (Orthopedics)</div>
          </div>

          <div style="background:#1E293B;border:2px solid #F59E0B;border-radius:12px;padding:20px">
            <div style="font-size:12px;color:#94A3B8;text-transform:uppercase">NOW SERVING</div>
            <div style="font-size:36px;font-weight:800;color:#FBBF24;font-family:monospace;margin:6px 0">P-001</div>
            <div style="font-weight:700">Dr. Ravi Kumar</div>
            <div style="font-size:12px;color:#FBBF24">Room 302 (Pediatrics)</div>
          </div>
        </div>

        <div style="font-size:13px;color:#94A3B8">Next Token in Queue: <strong>D-001, G-001, N-001</strong> · Please proceed to designated room when announced.</div>
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="window._closeModal()">Close Screen</button>
      <button class="btn btn-primary" onclick="showToast({ title: 'Chime Sound Played', message: 'Announced next token on speaker.', type: 'info' })">
        <i data-lucide="volume-2"></i> Play Voice Announcement Chime
      </button>
    `
  });
  refreshIcons();
};
