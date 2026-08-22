// ============================================================
// doctor/mySchedule.js — Module 3: Schedule & Two-Way Availability Sync
// ============================================================

import { renderTopbar } from '../../components/topbar.js';
import { renderSidebar } from '../../components/sidebar.js';
import { get, getDoctorAppointments, toggleDoctorAvailability } from '../../store.js';
import { showToast } from '../../components/toast.js';
import { refreshIcons } from '../../components/icons.js';

function getActiveDoctor() {
  const currentUserId = get('currentUserId');
  const staff = get('staff');
  return staff.find(s => s.id === currentUserId && s.role === 'Doctor') || staff.find(s => s.role === 'Doctor') || staff[0];
}

let scheduleViewMode = 'day'; // 'day' | 'week' | 'list'

export function renderDoctorMySchedule() {
  renderSidebar();
  const me = getActiveDoctor();
  renderTopbar({
    breadcrumb: [
      { label: 'Doctor Workspace', path: '/dr/dashboard' },
      { label: 'My Schedule & Availability' }
    ]
  });

  const myAppts = getDoctorAppointments(me.id);
  const isOnDuty = me.status === 'on-duty';

  const content = document.getElementById('content');
  content.innerHTML = `
    <!-- Header with Two-Way Sync Availability Toggle -->
    <div class="page-header">
      <div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
          <h1 class="page-title">My Schedule & Availability</h1>
          <span class="badge badge-${isOnDuty ? 'success' : 'danger'} badge-no-dot">
            ${isOnDuty ? '🟢 Available for Consultations' : '🔴 Marked Unavailable / On Leave'}
          </span>
        </div>
        <p class="page-subtitle">Manage upcoming OPD appointments and synchronize real-time booking slots with Hospital Admin & WhatsApp bot</p>
      </div>

      <!-- Real-Time Two-Way Sync Control -->
      <div class="page-actions" style="display:flex;align-items:center;gap:12px">
        <div style="text-align:right">
          <div style="font-size:12px;font-weight:700;color:var(--color-text)">Two-Way Availability Sync</div>
          <div style="font-size:11px;color:var(--color-text-muted)">Changes reflect instantly in WhatsApp Bot</div>
        </div>
        <button class="btn ${isOnDuty ? 'btn-danger' : 'btn-success'} btn-lg" onclick="toggleDoctorScheduleAvailability('${me.id}', '${isOnDuty ? 'on-leave' : 'on-duty'}')">
          ${isOnDuty ? '🔴 Mark Myself Unavailable' : '🟢 Set Available on Duty'}
        </button>
      </div>
    </div>

    <!-- Two-Way Sync Explanatory Alert Banner -->
    <div class="alert alert-${isOnDuty ? 'success' : 'warning'} mb-6" style="display:flex;align-items:center;justify-content:space-between">
      <div style="display:flex;align-items:center;gap:12px">
        <i data-lucide="${isOnDuty ? 'check-circle-2' : 'alert-triangle'}" style="width:24px;height:24px"></i>
        <div>
          <strong>${isOnDuty ? 'Active Two-Way Sync (Slots Open)' : 'Active Two-Way Sync (Slots Blocked)'}:</strong>
          ${isOnDuty 
            ? `Your OPD consultation slots in Room 204 are active and bookable via WhatsApp Bot, Phone Desk, and Hospital Admin.`
            : `Your OPD slots are automatically BLOCKED across the WhatsApp Bot booking tree and Reception Desk. No new patients will be allocated.`}
        </div>
      </div>
      <button class="btn btn-sm btn-secondary" onclick="navigateTo('/dr/leave-requests')">
        Submit Formal Leave Request →
      </button>
    </div>

    <!-- View Mode Switcher -->
    <div class="card mb-6" style="padding:14px 20px;background:white">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div style="display:flex;gap:8px">
          <button class="btn btn-sm ${scheduleViewMode === 'day' ? 'btn-primary' : 'btn-secondary'}" onclick="setScheduleView('day')">
            Today's Hourly Slots (${myAppts.filter(a => a.id.startsWith('a')).length})
          </button>
          <button class="btn btn-sm ${scheduleViewMode === 'week' ? 'btn-primary' : 'btn-secondary'}" onclick="setScheduleView('week')">
            Weekly Matrix
          </button>
          <button class="btn btn-sm ${scheduleViewMode === 'list' ? 'btn-primary' : 'btn-secondary'}" onclick="setScheduleView('list')">
            All Appointments (${myAppts.length})
          </button>
        </div>

        <div style="font-size:var(--font-size-xs);color:var(--color-text-muted)">
          Standard Working Hours: <strong>09:00 AM – 05:00 PM (Monday – Saturday)</strong>
        </div>
      </div>
    </div>

    <!-- Schedule Grid -->
    <div class="card">
      <div class="card-header" style="background:#F8FAFC">
        <span class="card-title">Consultation Time Slots</span>
        <span class="badge badge-gray">Room 204 (OPD Wing)</span>
      </div>

      <div class="card-body" style="padding:24px">
        ${renderScheduleSlots(myAppts)}
      </div>
    </div>
  `;

  refreshIcons(content);
}

function renderScheduleSlots(appts) {
  const timeSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
    '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
    '04:00 PM', '04:30 PM'
  ];

  return `
    <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(280px, 1fr));gap:16px">
      ${timeSlots.map((slot, idx) => {
        const matchingAppt = appts[idx % appts.length];
        const p = matchingAppt ? get('patients').find(pt => pt.id === matchingAppt.patientId) : null;
        const isBooked = !!matchingAppt && idx < 8;
        const isCompleted = isBooked && matchingAppt.status === 'completed';

        return `
          <div style="border:1.5px solid ${isBooked ? 'var(--color-border)' : '#E2E8F0'};border-radius:12px;padding:16px;background:${isCompleted ? '#F8FAFC' : isBooked ? '#EFF6FF' : 'white'};display:flex;flex-direction:column;justify-content:space-between">
            <div>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                <span style="font-weight:800;font-size:15px;color:var(--color-text)">${slot}</span>
                <span class="badge badge-${isCompleted ? 'success' : isBooked ? 'primary' : 'gray'} badge-no-dot" style="font-size:10px">
                  ${isCompleted ? 'COMPLETED' : isBooked ? 'BOOKED' : 'FREE SLOT'}
                </span>
              </div>

              ${isBooked ? `
                <div style="font-weight:700;font-size:14px;color:var(--color-text);margin-top:4px">${p?.name || 'Patient'}</div>
                <div style="font-size:11px;color:var(--color-text-muted)">${p?.age}y · Token: <strong>${matchingAppt.token}</strong></div>
                <div style="font-size:11px;color:var(--color-primary);margin-top:2px">${matchingAppt.type || 'Consultation'}</div>
              ` : `
                <div style="font-size:12px;color:var(--color-text-muted);margin:10px 0">Open for online & walk-in booking</div>
              `}
            </div>

            <div style="margin-top:12px;padding-top:10px;border-top:1px dashed var(--color-border)">
              ${isBooked ? `
                <button class="btn btn-primary btn-sm w-full" style="font-size:11px" onclick="navigateTo('/dr/consultation/${p?.id}?apptId=${matchingAppt.id}')">
                  ${isCompleted ? 'View Consultation Rx' : 'Start Visit →'}
                </button>
              ` : `
                <button class="btn btn-secondary btn-sm w-full" style="font-size:11px" onclick="showToast({ title: 'Slot Available', message: 'Ready for allocation.', type: 'info' })">
                  Block / Reserve Slot
                </button>
              `}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

window.toggleDoctorScheduleAvailability = (doctorId, newStatus) => {
  toggleDoctorAvailability(doctorId, newStatus);
  showToast({
    title: newStatus === 'on-duty' ? '🟢 Slots Synchronized' : '🔴 Slots Blocked',
    message: newStatus === 'on-duty' ? 'WhatsApp bot can now book appointments.' : 'WhatsApp bot and front desk will no longer book new patients.',
    type: newStatus === 'on-duty' ? 'success' : 'warning'
  });
  renderDoctorMySchedule();
};

window.setScheduleView = (mode) => {
  scheduleViewMode = mode;
  renderDoctorMySchedule();
};
