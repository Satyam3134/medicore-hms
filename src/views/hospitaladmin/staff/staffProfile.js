// ============================================================
// hospitaladmin/staff/staffProfile.js — Staff Profile Page
// ============================================================

import { renderTopbar } from '../../../components/topbar.js';
import { renderSidebar } from '../../../components/sidebar.js';
import { getStaffById, get, getDoctorAppointments, getDoctorPatients } from '../../../store.js';
import { showToast } from '../../../components/toast.js';

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function renderStaffProfile({ params }) {
  const { id } = params;
  const s = getStaffById(id);
  if (!s) { document.getElementById('content').innerHTML = `<div class="empty-state"><div class="es-title">Staff not found</div></div>`; return; }

  renderSidebar();
  renderTopbar({ breadcrumb: [
    { label: 'Hospital Admin', path: '/ha/dashboard' },
    { label: 'Staff', path: '/ha/staff' },
    { label: s.name }
  ] });

  const myAppts = getDoctorAppointments(s.id);
  const myPatients = getDoctorPatients(s.id);
  const todayAppts = myAppts.filter(a => a.date === new Date().toISOString().split('T')[0]);
  const upcomingAppts = myAppts.filter(a => a.date >= new Date().toISOString().split('T')[0] && a.status !== 'cancelled').slice(0, 5);

  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="page-header">
      <div style="display:flex;align-items:center;gap:16px">
        <div class="avatar avatar-xl" style="background:var(--color-primary)">${s.initials}</div>
        <div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
            <h1 class="page-title">${s.name}</h1>
            <span class="badge badge-${s.role === 'Doctor' ? 'primary' : 'info'} badge-no-dot">${s.role}</span>
            <span class="badge badge-${s.status === 'on-duty' ? 'success' : s.status === 'on-leave' ? 'warning' : 'gray'}">${s.status}</span>
          </div>
          <p class="page-subtitle">${s.specialization || s.department} · ${s.qualifications}</p>
        </div>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary" onclick="navigateTo('/ha/staff')">← Back</button>
        <button class="btn btn-secondary">
          <i data-lucide="pencil" style="width:14px;height:14px"></i> Edit
        </button>
        ${s.status === 'on-duty'
          ? `<button class="btn btn-secondary" onclick="markLeave('${s.id}')">Mark On Leave</button>`
          : `<button class="btn btn-success" onclick="markActive('${s.id}')">Mark Active</button>`
        }
      </div>
    </div>

    <div class="content-grid" style="grid-template-columns:1fr 2fr;margin-bottom:24px">
      <!-- Info Card -->
      <div class="card">
        <div class="card-header"><span class="card-title">Staff Information</span></div>
        <div class="card-body">
          <div class="info-list">
            <div class="info-row"><span class="info-label">Employee ID</span><span class="info-value font-medium">${s.id.toUpperCase()}</span></div>
            <div class="info-row"><span class="info-label">Department</span><span class="info-value">${s.department}</span></div>
            <div class="info-row"><span class="info-label">Specialization</span><span class="info-value">${s.specialization || '—'}</span></div>
            <div class="info-row"><span class="info-label">Qualifications</span><span class="info-value">${s.qualifications || '—'}</span></div>
            <div class="info-row"><span class="info-label">Email</span><span class="info-value">${s.email}</span></div>
            <div class="info-row"><span class="info-label">Phone</span><span class="info-value">${s.phone}</span></div>
            <div class="info-row"><span class="info-label">Join Date</span><span class="info-value">${s.joinDate}</span></div>
            ${s.consultationFee ? `<div class="info-row"><span class="info-label">Consult Fee</span><span class="info-value font-semibold">₹${s.consultationFee}</span></div>` : ''}
            ${s.rating ? `<div class="info-row"><span class="info-label">Patient Rating</span><span class="info-value">⭐ ${s.rating}/5.0</span></div>` : ''}
            ${s.patientCount !== null ? `<div class="info-row"><span class="info-label">Assigned Patients</span><span class="info-value">${myPatients.length}</span></div>` : ''}
          </div>
        </div>
      </div>

      <!-- Schedule -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Weekly Schedule</span>
          <button class="btn btn-secondary btn-sm" onclick="navigateTo('/ha/staff/roster')">View Roster</button>
        </div>
        <div class="card-body">
          <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:8px">
            ${DAYS.map((d, i) => {
              const slot = s.schedule?.[d];
              return `
                <div style="text-align:center">
                  <div style="font-size:11px;font-weight:600;color:var(--color-text-muted);text-transform:uppercase;margin-bottom:6px">${DAY_LABELS[i]}</div>
                  <div style="padding:8px 4px;border-radius:6px;font-size:11px;${slot
                    ? 'background:var(--color-primary-light);color:var(--color-primary);font-weight:500'
                    : 'background:var(--color-bg);color:var(--color-text-light)'}">
                    ${slot || 'Off'}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    </div>

    <!-- Upcoming Appointments -->
    ${s.role === 'Doctor' ? `
      <div class="content-grid" style="margin-bottom:24px">
        <div class="card">
          <div class="card-header">
            <span class="card-title">Upcoming Appointments</span>
            <span class="badge badge-gray badge-no-dot">${upcomingAppts.length}</span>
          </div>
          <div style="max-height:280px;overflow-y:auto">
            ${upcomingAppts.length === 0 ? `<div class="empty-state" style="padding:30px"><div class="es-title">No upcoming appointments</div></div>` :
            upcomingAppts.map(a => {
              const patient = get('patients').find(p => p.id === a.patientId);
              return `
                <div style="display:flex;align-items:center;gap:12px;padding:10px 20px;border-bottom:1px solid var(--color-border)">
                  <div style="min-width:80px;font-size:12px;color:var(--color-text-muted)">${a.date} ${a.time}</div>
                  <div class="avatar avatar-sm">${patient?.name?.charAt(0) || 'P'}</div>
                  <div style="flex:1">
                    <div style="font-size:13px;font-weight:500">${patient?.name || '—'}</div>
                    <div style="font-size:11px;color:var(--color-text-muted)">${a.type}</div>
                  </div>
                  <span class="badge badge-${a.status === 'confirmed' ? 'info' : a.status === 'completed' ? 'gray' : 'warning'}">${a.status}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">Assigned Patients</span><span class="badge badge-gray badge-no-dot">${myPatients.length}</span></div>
          <div style="max-height:280px;overflow-y:auto">
            ${myPatients.slice(0, 6).map(p => `
              <div style="display:flex;align-items:center;gap:12px;padding:10px 20px;border-bottom:1px solid var(--color-border);cursor:pointer" onclick="navigateTo('/ha/patients/${p.id}')">
                <div class="avatar avatar-sm" style="background:var(--color-accent)">${p.name.charAt(0)}</div>
                <div style="flex:1">
                  <div style="font-size:13px;font-weight:500">${p.name}</div>
                  <div style="font-size:11px;color:var(--color-text-muted)">${p.patientId} · Last: ${p.lastVisit}</div>
                </div>
                <span class="badge badge-${p.status === 'Admitted' ? 'danger' : 'info'} badge-no-dot">${p.status}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    ` : ''}

    <!-- Attendance History placeholder -->
    <div class="card">
      <div class="card-header"><span class="card-title">Attendance (This Month)</span></div>
      <div class="card-body">
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          ${Array.from({ length: 20 }, (_, i) => {
            const t = i < 16 ? 'present' : i < 18 ? 'leave' : 'absent';
            return `<div style="width:28px;height:28px;border-radius:4px;background:${t === 'present' ? 'var(--color-success-bg)' : t === 'leave' ? 'var(--color-warning-bg)' : 'var(--color-danger-bg)'};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:${t === 'present' ? 'var(--color-success)' : t === 'leave' ? 'var(--color-warning)' : 'var(--color-danger)'}">${i + 1}</div>`;
          }).join('')}
        </div>
        <div style="display:flex;gap:16px;margin-top:12px;font-size:12px">
          <span>🟢 Present: 16</span>
          <span>🟡 Leave: 2</span>
          <span>🔴 Absent: 2</span>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons({ el: content });
}

window.markLeave = (id) => { showToast({ title: 'Status Updated', message: 'Staff marked On Leave.', type: 'warning' }); };
window.markActive = (id) => { showToast({ title: 'Status Updated', message: 'Staff marked On Duty.', type: 'success' }); };
