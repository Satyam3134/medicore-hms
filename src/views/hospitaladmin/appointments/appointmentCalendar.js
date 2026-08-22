// ============================================================
// hospitaladmin/appointments/appointmentCalendar.js
// ============================================================

import { renderTopbar } from '../../../components/topbar.js';
import { renderSidebar } from '../../../components/sidebar.js';
import { getHospitalAppointments, get, getPatientById, getStaffById, addAppointment, updateAppointmentStatus, getDoctors, getHospitalPatients } from '../../../store.js';
import { openDrawer, closeDrawer } from '../../../components/modal.js';
import { showToast } from '../../../components/toast.js';
import { openModal, closeModal } from '../../../components/modal.js';

let calView = 'month'; // month | week | day
let calDate = new Date();

export function renderAppointmentCalendar() {
  renderSidebar();
  renderTopbar({ breadcrumb: [{ label: 'Hospital Admin', path: '/ha/dashboard' }, { label: 'Appointments' }] });

  const appts = getHospitalAppointments();
  const todayStr = new Date().toISOString().split('T')[0];

  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Appointments</h1>
        <p class="page-subtitle">${appts.length} total · ${appts.filter(a => a.date === todayStr).length} today</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary" onclick="navigateTo('/ha/appointments/list')">
          <i data-lucide="list" style="width:14px;height:14px"></i> List View
        </button>
        <button class="btn btn-primary" onclick="openBookAppointmentModal()">
          <i data-lucide="plus" style="width:14px;height:14px"></i> Book Appointment
        </button>
      </div>
    </div>

    <!-- Appointment Stats -->
    <div class="stats-grid" style="grid-template-columns:repeat(5,1fr);margin-bottom:24px">
      ${[
        { label: 'Today', value: appts.filter(a => a.date === todayStr).length, color: 'blue', icon: 'calendar' },
        { label: 'Confirmed', value: appts.filter(a => a.status === 'confirmed').length, color: 'green', icon: 'check-circle' },
        { label: 'Pending', value: appts.filter(a => a.status === 'pending').length, color: 'amber', icon: 'clock' },
        { label: 'Completed', value: appts.filter(a => a.status === 'completed').length, color: 'gray', icon: 'check-check' },
        { label: 'WhatsApp', value: appts.filter(a => a.source === 'whatsapp').length, color: 'green', icon: 'message-circle' },
      ].map(s => `
        <div class="stat-card">
          <div class="stat-card-icon ${s.color}"><i data-lucide="${s.icon}" style="width:18px;height:18px"></i></div>
          <div class="stat-card-value">${s.value}</div>
          <div class="stat-card-label">${s.label}</div>
        </div>
      `).join('')}
    </div>

    <!-- Calendar Controls -->
    <div class="card">
      <div class="card-header">
        <div class="cal-nav" style="width:100%;margin:0">
          <div style="display:flex;align-items:center;gap:8px">
            <button class="btn btn-secondary btn-sm" onclick="calNav(-1)">
              <i data-lucide="chevron-left" style="width:14px;height:14px"></i>
            </button>
            <span class="cal-nav-title" id="cal-title"></span>
            <button class="btn btn-secondary btn-sm" onclick="calNav(1)">
              <i data-lucide="chevron-right" style="width:14px;height:14px"></i>
            </button>
            <button class="btn btn-secondary btn-sm" onclick="calGoToday()">Today</button>
          </div>
          <div class="cal-view-toggle">
            <button class="cal-view-btn ${calView === 'month' ? 'active' : ''}" onclick="setCalView('month')">Month</button>
            <button class="cal-view-btn ${calView === 'week' ? 'active' : ''}" onclick="setCalView('week')">Week</button>
            <button class="cal-view-btn ${calView === 'day' ? 'active' : ''}" onclick="setCalView('day')">Day</button>
          </div>
        </div>
      </div>
      <div class="card-body-flush">
        <div id="calendar-grid"></div>
      </div>
    </div>

    <!-- Legend -->
    <div style="display:flex;gap:16px;margin-top:16px;flex-wrap:wrap">
      ${[
        { color: 'var(--color-info)', label: 'Confirmed' },
        { color: 'var(--color-warning)', label: 'Pending' },
        { color: 'var(--color-gray)', label: 'Completed' },
        { color: 'var(--color-danger)', label: 'Cancelled/No-show' },
        { color: '#25D366', label: 'Via WhatsApp' },
      ].map(l => `
        <div style="display:flex;align-items:center;gap:6px;font-size:12px">
          <div style="width:12px;height:12px;border-radius:3px;background:${l.color}"></div>
          ${l.label}
        </div>
      `).join('')}
    </div>
  `;

  if (window.lucide) lucide.createIcons({ el: content });
  renderCalendarGrid();
}

function renderCalendarGrid() {
  const appts = getHospitalAppointments();
  const el = document.getElementById('calendar-grid');
  const titleEl = document.getElementById('cal-title');
  if (!el) return;

  if (calView === 'month') {
    const year = calDate.getFullYear();
    const month = calDate.getMonth();
    titleEl && (titleEl.textContent = calDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }));

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev = new Date(year, month, 0).getDate();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const today = new Date().toISOString().split('T')[0];
    let html = '<div class="cal-grid">';
    html += days.map(d => `<div class="cal-day-header">${d}</div>`).join('');

    // Prev month fill
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = daysInPrev - i;
      html += `<div class="cal-cell other-month"><div class="cal-date">${d}</div></div>`;
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayAppts = appts.filter(a => a.date === dateStr).slice(0, 3);
      const isToday = dateStr === today;
      html += `
        <div class="cal-cell ${isToday ? 'today' : ''}">
          <div class="cal-date">${d}</div>
          ${dayAppts.map(a => {
            const patient = getPatientById(a.patientId);
            const isWA = a.source === 'whatsapp';
            return `
              <div class="cal-event ${a.status}" onclick="openApptDrawer('${a.id}')"
                style="${isWA ? 'border-left:2px solid #25D366' : ''}">
                ${a.time} ${patient?.name?.split(' ')[0] || 'Appt'}${isWA ? ' 📱' : ''}
              </div>
            `;
          }).join('')}
          ${appts.filter(a => a.date === dateStr).length > 3
            ? `<div style="font-size:10px;color:var(--color-text-muted);padding:2px 4px">+${appts.filter(a => a.date === dateStr).length - 3} more</div>`
            : ''
          }
        </div>
      `;
    }

    // Next month fill
    const remaining = 42 - (firstDay + daysInMonth);
    for (let d = 1; d <= remaining; d++) {
      html += `<div class="cal-cell other-month"><div class="cal-date">${d}</div></div>`;
    }

    html += '</div>';
    el.innerHTML = html;

  } else if (calView === 'day') {
    titleEl && (titleEl.textContent = calDate.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    const dateStr = calDate.toISOString().split('T')[0];
    const dayAppts = appts.filter(a => a.date === dateStr).sort((a, b) => a.time.localeCompare(b.time));
    el.innerHTML = `
      <div style="padding:16px">
        ${dayAppts.length === 0 ? `<div class="empty-state" style="padding:40px"><div class="es-title">No appointments</div></div>` :
        dayAppts.map(a => {
          const patient = getPatientById(a.patientId);
          const doctor = getStaffById(a.doctorId);
          return `
            <div style="display:flex;gap:16px;padding:12px 0;border-bottom:1px solid var(--color-border);cursor:pointer" onclick="openApptDrawer('${a.id}')">
              <div style="width:60px;text-align:right;color:var(--color-text-muted);font-size:13px;font-weight:600;flex-shrink:0">${a.time}</div>
              <div style="flex:1;background:var(--color-${a.status === 'confirmed' ? 'primary-light' : a.status === 'completed' ? 'bg' : a.status === 'pending' ? 'warning-bg' : 'danger-bg'});border-radius:8px;padding:10px 14px;border-left:3px solid var(--color-${a.status === 'confirmed' ? 'primary' : a.status === 'completed' ? 'border-strong' : a.status === 'pending' ? 'warning' : 'danger'})">
                <div style="font-weight:600;font-size:14px">${patient?.name || '—'}</div>
                <div style="font-size:12px;color:var(--color-text-muted)">${doctor?.name} · ${a.department} · ${a.type}</div>
                ${a.source === 'whatsapp' ? '<span class="badge badge-wa badge-no-dot" style="font-size:10px;margin-top:4px">📱 WhatsApp</span>' : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }
}

window.calNav = (dir) => {
  if (calView === 'month') calDate.setMonth(calDate.getMonth() + dir);
  else calDate.setDate(calDate.getDate() + (calView === 'week' ? 7 * dir : dir));
  renderCalendarGrid();
};

window.calGoToday = () => { calDate = new Date(); renderCalendarGrid(); };

window.setCalView = (v) => {
  calView = v;
  document.querySelectorAll('.cal-view-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`[onclick="setCalView('${v}')"]`)?.classList.add('active');
  renderCalendarGrid();
};

window.openApptDrawer = (apptId) => {
  const appt = get('appointments').find(a => a.id === apptId);
  if (!appt) return;
  const patient = getPatientById(appt.patientId);
  const doctor = getStaffById(appt.doctorId);

  openDrawer({
    title: 'Appointment Details',
    body: `
      <div style="margin-bottom:20px">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
          <div class="avatar avatar-lg" style="background:var(--color-primary)">${patient?.name?.charAt(0)}</div>
          <div>
            <div style="font-size:16px;font-weight:600">${patient?.name || '—'}</div>
            <div style="font-size:13px;color:var(--color-text-muted)">${patient?.patientId} · ${patient?.age}y / ${patient?.gender}</div>
          </div>
        </div>
        <div class="info-list">
          <div class="info-row"><span class="info-label">Doctor</span><span class="info-value">${doctor?.name}</span></div>
          <div class="info-row"><span class="info-label">Department</span><span class="info-value">${appt.department}</span></div>
          <div class="info-row"><span class="info-label">Date & Time</span><span class="info-value">${appt.date} at ${appt.time}</span></div>
          <div class="info-row"><span class="info-label">Token</span><span class="info-value font-semibold" style="color:var(--color-primary)">${appt.token}</span></div>
          <div class="info-row"><span class="info-label">Type</span><span class="info-value">${appt.type}</span></div>
          <div class="info-row">
            <span class="info-label">Source</span>
            <span class="info-value">
              ${appt.source === 'whatsapp' ? '<span class="badge badge-wa badge-no-dot">📱 WhatsApp</span>' : appt.source}
            </span>
          </div>
          <div class="info-row"><span class="info-label">Notes</span><span class="info-value">${appt.notes || '—'}</span></div>
          <div class="info-row">
            <span class="info-label">Status</span>
            <span class="info-value">
              <span class="badge badge-${appt.status === 'confirmed' ? 'info' : appt.status === 'completed' ? 'gray' : appt.status === 'pending' ? 'warning' : 'danger'}">
                ${appt.status}
              </span>
            </span>
          </div>
        </div>
      </div>
      <div class="form-section-title">Update Status</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px">
        <button class="btn btn-sm btn-success" onclick="changeApptStatus('${apptId}','confirmed')">✓ Confirm</button>
        <button class="btn btn-sm btn-primary" onclick="changeApptStatus('${apptId}','completed')">✓ Complete</button>
        <button class="btn btn-sm btn-secondary" onclick="changeApptStatus('${apptId}','no-show')">No Show</button>
        <button class="btn btn-sm btn-danger" onclick="changeApptStatus('${apptId}','cancelled')">✕ Cancel</button>
      </div>
      <div class="form-section-title" style="margin-top:16px">Add Notes</div>
      <textarea class="form-control" rows="3" placeholder="Add consultation notes…"></textarea>
      <div style="margin-top:8px">
        <button class="btn btn-primary btn-sm">Save Notes</button>
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="window._closeDrawer()">Close</button>
      <button class="btn btn-accent" onclick="navigateTo('/ha/patients/${appt.patientId}');window._closeDrawer()">View Patient EMR</button>
    `
  });
};

window.changeApptStatus = (id, status) => {
  updateAppointmentStatus(id, status);
  closeDrawer();
  showToast({ title: 'Status Updated', message: `Appointment marked as ${status}.`, type: 'success' });
  renderAppointmentCalendar();
};

window.openBookAppointmentModal = () => {
  const patients = getHospitalPatients();
  const doctors = getDoctors();
  openModal({
    title: 'Book New Appointment',
    size: 'lg',
    body: `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Patient <span class="required">*</span></label>
          <select class="form-control" id="bk-patient">
            <option value="">Select patient…</option>
            ${patients.map(p => `<option value="${p.id}">${p.name} (${p.patientId})</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Doctor <span class="required">*</span></label>
          <select class="form-control" id="bk-doctor">
            <option value="">Select doctor…</option>
            ${doctors.map(d => `<option value="${d.id}">${d.name} — ${d.department}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Date <span class="required">*</span></label>
          <input type="date" class="form-control" id="bk-date" value="${new Date().toISOString().split('T')[0]}" />
        </div>
        <div class="form-group">
          <label class="form-label">Time</label>
          <select class="form-control" id="bk-time">
            ${['09:00','09:30','10:00','10:30','11:00','11:30','12:00','14:00','14:30','15:00','15:30','16:00','16:30','17:00'].map(t => `<option>${t}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Visit Type</label>
          <select class="form-control" id="bk-type"><option>OPD</option><option>Follow-up</option><option>Emergency</option></select>
        </div>
        <div class="form-group">
          <label class="form-label">Source</label>
          <select class="form-control" id="bk-source"><option value="admin">Admin Entry</option><option value="phone">Phone</option><option value="walkin">Walk-in</option></select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Notes</label>
        <textarea class="form-control" id="bk-notes" rows="2" placeholder="Reason for visit…"></textarea>
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="window._closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="submitBooking()">Book Appointment</button>
    `
  });
};

window.submitBooking = () => {
  const patientId = document.getElementById('bk-patient')?.value;
  const doctorId = document.getElementById('bk-doctor')?.value;
  const date = document.getElementById('bk-date')?.value;
  if (!patientId || !doctorId || !date) {
    showToast({ title: 'Required fields missing', type: 'warning' }); return;
  }
  const doc = getStaffById(doctorId);
  const newAppt = addAppointment({
    hospitalId: get('currentHospitalId'),
    patientId,
    doctorId,
    department: doc?.department || 'General',
    date,
    time: document.getElementById('bk-time')?.value || '09:00',
    status: 'confirmed',
    type: document.getElementById('bk-type')?.value || 'OPD',
    source: document.getElementById('bk-source')?.value || 'admin',
    notes: document.getElementById('bk-notes')?.value || '',
  });
  closeModal();
  showToast({ title: 'Appointment Booked!', message: `Token ${newAppt.token} created.`, type: 'success' });
  renderAppointmentCalendar();
};
