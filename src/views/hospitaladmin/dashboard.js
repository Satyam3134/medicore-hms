// ============================================================
// hospitaladmin/dashboard.js — Hospital Admin Dashboard
// ============================================================

import { renderTopbar } from '../../components/topbar.js';
import { renderSidebar } from '../../components/sidebar.js';
import { get, getHospital, getTodayAppointments, getHospitalPatients, getHospitalStaff, getDoctors, getHospitalDepartments } from '../../store.js';
import { renderBarChart } from '../../components/chart.js';
import { showToast } from '../../components/toast.js';

export function renderHADashboard() {
  renderSidebar();
  const hospital = getHospital();
  renderTopbar({ breadcrumb: [{ label: hospital?.name || 'Hospital' }, { label: 'Dashboard' }] });

  const todayAppts = getTodayAppointments();
  const patients = getHospitalPatients();
  const staff = getHospitalStaff();
  const doctors = getDoctors();
  const departments = getHospitalDepartments();
  const activityFeed = get('activityFeed');
  const beds = get('beds').filter(b => b.hospitalId === get('currentHospitalId'));
  const occupiedBeds = beds.filter(b => b.status === 'occupied').length;
  const totalBeds = beds.length;
  const bedOccPct = totalBeds ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  // Appointment status breakdown
  const confirmed = todayAppts.filter(a => a.status === 'confirmed').length;
  const completed = todayAppts.filter(a => a.status === 'completed').length;
  const pending = todayAppts.filter(a => a.status === 'pending').length;
  const noShow = todayAppts.filter(a => a.status === 'no-show').length;
  const whatsappToday = todayAppts.filter(a => a.source === 'whatsapp').length;

  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Hospital Dashboard</h1>
        <p class="page-subtitle">${hospital?.name} · ${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary" onclick="navigateTo('/ha/appointments')">
          <i data-lucide="calendar" style="width:14px;height:14px"></i> Appointments
        </button>
        <button class="btn btn-primary" onclick="openBookModal()">
          <i data-lucide="plus" style="width:14px;height:14px"></i> Book Appointment
        </button>
      </div>
    </div>

    <!-- KPI Stats -->
    <div class="stats-grid stats-grid-4" style="margin-bottom:24px">
      <div class="stat-card">
        <div class="stat-card-header">
          <div class="stat-card-icon blue"><i data-lucide="users" style="width:20px;height:20px"></i></div>
          <span class="badge badge-success badge-no-dot" style="font-size:10px">+5 this week</span>
        </div>
        <div class="stat-card-value">${patients.length}</div>
        <div class="stat-card-label">Total Patients</div>
        <div class="stat-card-trend cursor-pointer" onclick="navigateTo('/ha/patients')" style="color:var(--color-primary)">View all →</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-header">
          <div class="stat-card-icon teal"><i data-lucide="stethoscope" style="width:20px;height:20px"></i></div>
        </div>
        <div class="stat-card-value">${doctors.filter(d => d.status === 'on-duty').length}/${doctors.length}</div>
        <div class="stat-card-label">Active Doctors</div>
        <div class="stat-card-trend">On duty today</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-header">
          <div class="stat-card-icon amber"><i data-lucide="calendar-check" style="width:20px;height:20px"></i></div>
          ${whatsappToday > 0 ? `<span class="badge badge-wa badge-no-dot" style="font-size:10px">📱 ${whatsappToday} via WA</span>` : ''}
        </div>
        <div class="stat-card-value">${todayAppts.length}</div>
        <div class="stat-card-label">Today's Appointments</div>
        <div class="stat-card-trend">${confirmed} confirmed · ${completed} done · ${pending} pending</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-header">
          <div class="stat-card-icon ${bedOccPct > 85 ? 'red' : bedOccPct > 70 ? 'amber' : 'green'}"><i data-lucide="bed" style="width:20px;height:20px"></i></div>
          <span class="badge badge-${bedOccPct > 85 ? 'danger' : bedOccPct > 70 ? 'warning' : 'success'} badge-no-dot" style="font-size:10px">${bedOccPct}%</span>
        </div>
        <div class="stat-card-value">${totalBeds - occupiedBeds}</div>
        <div class="stat-card-label">Available Beds</div>
        <div class="stat-card-trend">${occupiedBeds} occupied of ${totalBeds}</div>
      </div>
    </div>

    <div class="content-grid" style="grid-template-columns:3fr 2fr;margin-bottom:24px">
      <!-- Today's Appointments -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Today's Appointments</span>
          <div style="display:flex;gap:8px;align-items:center">
            <span class="badge badge-gray badge-no-dot">${todayAppts.length} total</span>
            <button class="btn btn-secondary btn-sm" onclick="navigateTo('/ha/appointments')">View Calendar</button>
          </div>
        </div>
        <div style="max-height:320px;overflow-y:auto">
          ${todayAppts.length === 0 ? `<div class="empty-state" style="padding:40px"><div class="es-title">No appointments today</div></div>` :
          todayAppts.map(a => {
            const patient = get('patients').find(p => p.id === a.patientId);
            const doctor = get('staff').find(s => s.id === a.doctorId);
            return `
              <div style="display:flex;align-items:center;gap:12px;padding:10px 20px;border-bottom:1px solid var(--color-border);cursor:pointer" onclick="navigateTo('/ha/appointments')">
                <div style="width:50px;text-align:center;flex-shrink:0">
                  <div style="font-size:13px;font-weight:700;color:var(--color-primary)">${a.time}</div>
                  <div style="font-size:10px;color:var(--color-text-muted)">${a.token}</div>
                </div>
                <div class="avatar avatar-sm" style="background:var(--color-primary)">${patient?.name?.charAt(0) || 'P'}</div>
                <div style="flex:1;min-width:0">
                  <div style="font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${patient?.name || 'Unknown'}</div>
                  <div style="font-size:11px;color:var(--color-text-muted)">${doctor?.name || '—'} · ${a.department}</div>
                </div>
                <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
                  ${a.source === 'whatsapp' ? `<span class="badge badge-wa badge-no-dot" style="font-size:10px">WA</span>` : ''}
                  <span class="badge badge-${a.status === 'confirmed' ? 'info' : a.status === 'completed' ? 'gray' : a.status === 'pending' ? 'warning' : 'danger'}">${a.status}</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Activity Feed -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Activity Feed</span>
          <button class="btn btn-secondary btn-sm" onclick="navigateTo('/ha/notifications')">View All</button>
        </div>
        <div class="card-body" style="padding:0">
          <div style="max-height:320px;overflow-y:auto;padding:12px 16px">
            ${activityFeed.slice(0, 6).map(a => `
              <div class="activity-item">
                <div class="activity-dot ${a.color}"><i data-lucide="${a.icon}" style="width:14px;height:14px"></i></div>
                <div class="activity-content">
                  <div class="activity-text">${a.text}</div>
                  <div class="activity-time">${a.time}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>

    <!-- Departments + Revenue -->
    <div class="content-grid" style="margin-bottom:24px">
      <div class="card">
        <div class="card-header">
          <span class="card-title">Department Load</span>
          <button class="btn btn-secondary btn-sm" onclick="navigateTo('/ha/departments')">Manage →</button>
        </div>
        <div class="card-body">
          ${departments.map(dept => `
            <div style="margin-bottom:12px">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
                <span style="font-size:13px;font-weight:500">${dept.name}</span>
                <span style="font-size:12px;color:var(--color-text-muted)">${dept.patientCount} patients · ${dept.avgWaitMin}min avg wait</span>
              </div>
              <div class="progress-bar"><div class="progress-fill" style="width:${Math.min(100, dept.patientCount / 1.2)}%;background:${dept.color}"></div></div>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">Revenue This Month</span></div>
        <div class="card-body">
          <div style="font-size:36px;font-weight:800;color:var(--color-text);margin-bottom:4px">₹${(hospital?.stats.monthlyRevenue / 100000 || 0).toFixed(1)}L</div>
          <div style="font-size:13px;color:var(--color-text-muted);margin-bottom:20px">
            <span class="trend-up" style="color:var(--color-success)">↑ 8.2%</span> vs last month
          </div>
          <div id="rev-mini-chart"></div>
          <div style="margin-top:16px">
            <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px">
              <span>OPD Consultations</span><span style="font-weight:600">₹4.2L</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px">
              <span>IPD / Surgery</span><span style="font-weight:600">₹18.5L</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px">
              <span>Lab & Diagnostics</span><span style="font-weight:600">₹5.7L</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:12px">
              <span>Pharmacy</span><span style="font-weight:600">₹0.0L</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Staff On Duty -->
    <div class="card">
      <div class="card-header">
        <span class="card-title">Staff On Duty Today</span>
        <button class="btn btn-secondary btn-sm" onclick="navigateTo('/ha/staff')">Manage Staff →</button>
      </div>
      <div class="scroll-x">
        <table class="data-table">
          <thead><tr><th>Name</th><th>Role</th><th>Department</th><th>Today's Patients</th><th>Status</th></tr></thead>
          <tbody>
            ${staff.slice(0, 8).map(s => {
              const myAppts = todayAppts.filter(a => a.doctorId === s.id);
              return `
                <tr onclick="navigateTo('/ha/staff/${s.id}')" style="cursor:pointer">
                  <td><div class="avatar-name"><div class="avatar avatar-sm" style="background:var(--color-primary)">${s.initials}</div><div class="an-name">${s.name}</div></div></td>
                  <td><span class="badge badge-info badge-no-dot">${s.role}</span></td>
                  <td style="color:var(--color-text-muted)">${s.department}</td>
                  <td>${s.role === 'Doctor' ? myAppts.length + ' appointments' : '—'}</td>
                  <td><span class="badge badge-${s.status === 'on-duty' ? 'success' : s.status === 'on-leave' ? 'warning' : 'gray'}">${s.status}</span></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons({ el: content });

  // Revenue mini chart
  const revEl = document.getElementById('rev-mini-chart');
  if (revEl) {
    import('../../components/chart.js').then(({ renderBarChart }) => {
      renderBarChart(revEl, [
        { label: 'Mar', value: 22 }, { label: 'Apr', value: 25 }, { label: 'May', value: 21 },
        { label: 'Jun', value: 27 }, { label: 'Jul', value: 26 }, { label: 'Aug', value: 28 },
      ], { height: 80, barColor: 'var(--color-accent)', showValues: false });
    });
  }

  // Simulate WhatsApp toast after 3s
  setTimeout(() => {
    showToast({
      title: '📱 New WhatsApp Booking',
      message: 'Deepak Nair booked with Dr. Aditya Kapoor — General Medicine',
      type: 'wa',
      icon: 'message-circle',
    });
  }, 3000);
}

window.openBookModal = () => {
  const { openModal, closeModal } = window._modal || {};
  if (!openModal) return;
  const patients = get('patients').filter(p => p.hospitalId === get('currentHospitalId'));
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
          <label class="form-label">Time <span class="required">*</span></label>
          <select class="form-control" id="bk-time">
            ${['09:00','09:30','10:00','10:30','11:00','11:30','12:00','14:00','14:30','15:00','15:30','16:00','16:30','17:00'].map(t => `<option>${t}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Visit Type</label>
          <select class="form-control" id="bk-type">
            <option>OPD</option><option>Follow-up</option><option>Emergency</option><option>IPD Review</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Source</label>
          <select class="form-control" id="bk-source">
            <option value="admin">Admin Entry</option><option value="phone">Phone</option><option value="walkin">Walk-in</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Notes / Reason</label>
        <textarea class="form-control" id="bk-notes" rows="2" placeholder="Reason for visit…"></textarea>
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="window._closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="submitBooking()">Book Appointment</button>
    `
  });
};
