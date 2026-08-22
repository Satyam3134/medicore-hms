// ============================================================
// doctor/leaveRequests.js — Module 7: Formal Leave & Availability
// ============================================================

import { renderTopbar } from '../../components/topbar.js';
import { renderSidebar } from '../../components/sidebar.js';
import { get, getDoctorLeaves, submitDoctorLeave } from '../../store.js';
import { showToast } from '../../components/toast.js';
import { openModal, closeModal } from '../../components/modal.js';
import { refreshIcons } from '../../components/icons.js';

function getActiveDoctor() {
  const currentUserId = get('currentUserId');
  const staff = get('staff');
  return staff.find(s => s.id === currentUserId && s.role === 'Doctor') || staff.find(s => s.role === 'Doctor') || staff[0];
}

export function renderDoctorLeaveRequests() {
  renderSidebar();
  const me = getActiveDoctor();
  renderTopbar({
    breadcrumb: [
      { label: 'Doctor Workspace', path: '/dr/dashboard' },
      { label: 'Leave & Roster Requests' }
    ]
  });

  const leaves = getDoctorLeaves();

  const content = document.getElementById('content');
  content.innerHTML = `
    <!-- Header -->
    <div class="page-header">
      <div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
          <h1 class="page-title">Formal Leave & Availability Requests</h1>
          <span class="badge badge-primary">Hospital Roster Sync</span>
        </div>
        <p class="page-subtitle">Submit formal leave applications, assign covering physicians, and automatically block booking calendars</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" onclick="openSubmitLeaveModal()">
          <i data-lucide="calendar-plus"></i> Apply for Leave
        </button>
      </div>
    </div>

    <!-- Leave Balance Cards -->
    <div class="stats-grid stats-grid-3" style="margin-bottom:28px">
      <div class="stat-card">
        <div class="stat-card-icon blue"><i data-lucide="calendar-check"></i></div>
        <div class="stat-card-value">18 Days</div>
        <div class="stat-card-label">Annual / Paid Leave Balance</div>
        <div class="stat-card-trend">Accrued for current year</div>
      </div>

      <div class="stat-card">
        <div class="stat-card-icon purple"><i data-lucide="award"></i></div>
        <div class="stat-card-value">6 Days</div>
        <div class="stat-card-label">CME & Conference Leave</div>
        <div class="stat-card-trend">Medical education quota</div>
      </div>

      <div class="stat-card">
        <div class="stat-card-icon green"><i data-lucide="shield-check"></i></div>
        <div class="stat-card-value">10 Days</div>
        <div class="stat-card-label">Casual / Sick Leave Available</div>
        <div class="stat-card-trend">Instant approval quota</div>
      </div>
    </div>

    <!-- Leave Applications Table -->
    <div class="card">
      <div class="card-header" style="background:#F8FAFC">
        <span class="card-title">Leave History & Upcoming Requests (${leaves.length})</span>
        <span class="badge badge-gray">Integrated with Hospital Roster</span>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Doctor Name</th>
              <th>Leave Type</th>
              <th>Duration / Dates</th>
              <th>Covering Specialist</th>
              <th>Clinical Justification</th>
              <th>Status</th>
              <th class="td-actions">Roster Sync</th>
            </tr>
          </thead>
          <tbody>
            ${leaves.map(l => `
              <tr>
                <td>
                  <div style="font-weight:700">${l.doctorName}</div>
                  <div style="font-size:11px;color:var(--color-text-muted)">${l.department}</div>
                </td>
                <td><span class="badge badge-info badge-no-dot">${l.type}</span></td>
                <td>
                  <div style="font-weight:700">${l.startDate} to ${l.endDate}</div>
                  <div style="font-size:11px;color:var(--color-text-muted)">${l.days} Days Total</div>
                </td>
                <td>
                  <div style="font-weight:600">${l.coveringDoctor || 'Dr. Aditya Kapoor'}</div>
                  <div style="font-size:11px;color:var(--color-text-muted)">Assigned Proxy</div>
                </td>
                <td>
                  <div style="font-size:12px;max-width:240px;color:var(--color-text)">${l.reason}</div>
                </td>
                <td>
                  <span class="badge badge-${l.status === 'approved' ? 'success' : l.status === 'pending' ? 'warning' : 'gray'}">
                    ${l.status.toUpperCase()}
                  </span>
                </td>
                <td class="td-actions">
                  <span style="font-size:11px;color:var(--color-success);font-weight:700">✓ Slots Blocked</span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  refreshIcons(content);
}

window.openSubmitLeaveModal = () => {
  const me = getActiveDoctor();
  const doctors = get('staff').filter(s => s.role === 'Doctor' && s.id !== me.id);

  openModal({
    title: 'Submit Formal Leave Application',
    size: 'md',
    body: `
      <div class="form-group">
        <label class="form-label">Leave Category <span class="required">*</span></label>
        <select class="form-control" id="leave-type">
          <option>Annual / Planned Vacation</option>
          <option>CME / Medical Conference Leave</option>
          <option>Casual / Emergency Leave</option>
          <option>Medical Sickness Leave</option>
        </select>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Start Date <span class="required">*</span></label>
          <input type="date" class="form-control" id="leave-start" value="${getAheadDate(7)}" required />
        </div>
        <div class="form-group">
          <label class="form-label">End Date <span class="required">*</span></label>
          <input type="date" class="form-control" id="leave-end" value="${getAheadDate(10)}" required />
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Nominated Covering Physician <span class="required">*</span></label>
        <select class="form-control" id="leave-cover">
          ${doctors.map(d => `<option value="${d.name}">${d.name} (${d.department})</option>`).join('')}
        </select>
        <div class="form-hint">Selected physician will handle inpatient rounds & urgent OPD referrals.</div>
      </div>

      <div class="form-group">
        <label class="form-label">Reason / Justification</label>
        <textarea class="form-control" id="leave-reason" rows="2" placeholder="e.g. Attending annual cardiology convention"></textarea>
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="window._closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="submitDoctorLeaveForm()">Submit to Hospital Admin</button>
    `
  });
};

function getAheadDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

window.submitDoctorLeaveForm = () => {
  const me = getActiveDoctor();
  const type = document.getElementById('leave-type')?.value;
  const startDate = document.getElementById('leave-start')?.value;
  const endDate = document.getElementById('leave-end')?.value;
  const coveringDoctor = document.getElementById('leave-cover')?.value;
  const reason = document.getElementById('leave-reason')?.value || 'Personal leave';

  submitDoctorLeave({
    doctorId: me.id,
    doctorName: me.name,
    department: me.department,
    type,
    startDate,
    endDate,
    days: 4,
    coveringDoctor,
    reason
  });

  closeModal();
  showToast({ title: 'Leave Application Submitted', message: 'Hospital Admin notified and roster updated.', type: 'success' });
  renderDoctorLeaveRequests();
};
