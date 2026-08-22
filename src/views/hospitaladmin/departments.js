// ============================================================
// hospitaladmin/departments.js — Departments Module
// ============================================================

import { renderTopbar } from '../../components/topbar.js';
import { renderSidebar } from '../../components/sidebar.js';
import { getHospitalDepartments, getHospitalStaff, get, getHospitalAppointments } from '../../store.js';
import { showToast } from '../../components/toast.js';

const DEPT_ICONS = {
  'Cardiology': 'heart-pulse', 'Orthopedics': 'bone', 'Neurology': 'brain',
  'Pediatrics': 'baby', 'Oncology': 'microscope', 'Dermatology': 'sparkles',
  'General Medicine': 'stethoscope', 'Emergency': 'ambulance', 'OB-GYN': 'baby',
  'Radiology': 'scan', 'Pathology': 'flask-conical', 'Physiotherapy': 'activity',
};

export function renderDepartments() {
  renderSidebar();
  renderTopbar({ breadcrumb: [{ label: 'Hospital Admin', path: '/ha/dashboard' }, { label: 'Departments' }] });

  const depts = getHospitalDepartments();
  const staff = getHospitalStaff();

  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="page-header">
      <div><h1 class="page-title">Departments</h1><p class="page-subtitle">${depts.length} departments configured</p></div>
      <div class="page-actions">
        <button class="btn btn-primary" onclick="showToast_('Coming Soon','Department creation will be available soon.','info')">
          <i data-lucide="plus" style="width:14px;height:14px"></i> Add Department
        </button>
      </div>
    </div>

    <!-- Department Cards Grid -->
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px;margin-bottom:24px">
      ${depts.map(dept => {
        const deptStaff = staff.filter(s => s.department === dept.name);
        const deptDoctors = deptStaff.filter(s => s.role === 'Doctor');
        const headDoc = staff.find(s => s.id === dept.head);
        return `
          <div class="dept-card" onclick="showDeptDetail('${dept.id}')">
            <div class="dept-icon" style="background:${dept.color}20;color:${dept.color}">
              <i data-lucide="${DEPT_ICONS[dept.name] || 'layers'}" style="width:24px;height:24px"></i>
            </div>
            <div style="font-size:16px;font-weight:700;margin-bottom:4px">${dept.name}</div>
            <div style="font-size:12px;color:var(--color-text-muted);margin-bottom:16px">
              Head: ${headDoc?.name || 'Unassigned'}
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:16px">
              <div style="text-align:center;background:var(--color-bg);border-radius:6px;padding:8px">
                <div style="font-size:18px;font-weight:700;color:var(--color-primary)">${deptDoctors.length}</div>
                <div style="font-size:10px;color:var(--color-text-muted)">Doctors</div>
              </div>
              <div style="text-align:center;background:var(--color-bg);border-radius:6px;padding:8px">
                <div style="font-size:18px;font-weight:700;color:var(--color-accent)">${dept.patientCount}</div>
                <div style="font-size:10px;color:var(--color-text-muted)">Patients</div>
              </div>
              <div style="text-align:center;background:var(--color-bg);border-radius:6px;padding:8px">
                <div style="font-size:18px;font-weight:700;color:var(--color-warning)">${dept.avgWaitMin}</div>
                <div style="font-size:10px;color:var(--color-text-muted)">Avg Wait</div>
              </div>
            </div>
            <div style="margin-bottom:8px">
              <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
                <span>Patient Load</span>
                <span style="font-weight:600">${Math.min(100, Math.round(dept.patientCount / 1.2))}%</span>
              </div>
              <div class="progress-bar"><div class="progress-fill" style="width:${Math.min(100, dept.patientCount / 1.2)}%;background:${dept.color}"></div></div>
            </div>
            <div style="display:flex;gap:4px;margin-top:12px">
              ${deptStaff.slice(0, 5).map(s => `
                <div class="avatar avatar-sm" style="background:${dept.color};font-size:10px" title="${s.name}">${s.initials}</div>
              `).join('')}
              ${deptStaff.length > 5 ? `<div class="avatar avatar-sm" style="background:var(--color-border-strong);color:var(--color-text-muted);font-size:10px">+${deptStaff.length - 5}</div>` : ''}
            </div>
          </div>
        `;
      }).join('')}
    </div>

    <!-- Department Table -->
    <div class="data-table-wrapper">
      <div class="table-toolbar">
        <div class="table-toolbar-left"><span class="card-title">Department Summary</span></div>
      </div>
      <table class="data-table">
        <thead>
          <tr><th>Department</th><th>Head</th><th>Doctors</th><th>Total Staff</th><th>Patients</th><th>Avg Wait</th><th>Actions</th></tr>
        </thead>
        <tbody>
          ${depts.map(dept => {
            const deptStaff = staff.filter(s => s.department === dept.name);
            const deptDoctors = deptStaff.filter(s => s.role === 'Doctor');
            const headDoc = staff.find(s => s.id === dept.head);
            return `
              <tr>
                <td>
                  <div style="display:flex;align-items:center;gap:8px">
                    <div style="width:10px;height:10px;border-radius:50%;background:${dept.color}"></div>
                    <span style="font-weight:500">${dept.name}</span>
                  </div>
                </td>
                <td>${headDoc?.name || '—'}</td>
                <td>${deptDoctors.length}</td>
                <td>${deptStaff.length}</td>
                <td>${dept.patientCount}</td>
                <td>${dept.avgWaitMin} min</td>
                <td class="td-actions">
                  <button class="row-action-btn"><i data-lucide="settings" style="width:14px;height:14px"></i></button>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;

  if (window.lucide) lucide.createIcons({ el: content });
  window.showToast_ = (t, m, type) => showToast({ title: t, message: m, type });
}

window.showDeptDetail = (id) => {
  const depts = get('departments');
  const dept = depts.find(d => d.id === id);
  if (!dept) return;
  showToast({ title: dept.name, message: `${dept.patientCount} patients · ${dept.avgWaitMin} min avg wait`, type: 'info' });
};

// ============================================================
// hospitaladmin/beds.js — Bed Management
// ============================================================
export function renderBedManagement() {
  renderSidebar();
  renderTopbar({ breadcrumb: [{ label: 'Hospital Admin', path: '/ha/dashboard' }, { label: 'Bed Management' }] });

  const beds = get('beds').filter(b => b.hospitalId === get('currentHospitalId'));
  const wards = [...new Set(beds.map(b => b.ward))];
  const occupied = beds.filter(b => b.status === 'occupied').length;
  const available = beds.filter(b => b.status === 'available').length;
  const cleaning = beds.filter(b => b.status === 'cleaning').length;
  const maintenance = beds.filter(b => b.status === 'maintenance').length;

  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="page-header">
      <div><h1 class="page-title">Bed Management</h1><p class="page-subtitle">${beds.length} total beds across ${wards.length} wards</p></div>
    </div>

    <div class="stats-grid stats-grid-4" style="margin-bottom:24px">
      <div class="stat-card">
        <div class="stat-card-icon red"><i data-lucide="bed" style="width:20px;height:20px"></i></div>
        <div class="stat-card-value">${occupied}</div>
        <div class="stat-card-label">Occupied</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-icon green"><i data-lucide="bed" style="width:20px;height:20px"></i></div>
        <div class="stat-card-value">${available}</div>
        <div class="stat-card-label">Available</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-icon amber"><i data-lucide="loader" style="width:20px;height:20px"></i></div>
        <div class="stat-card-value">${cleaning}</div>
        <div class="stat-card-label">Cleaning</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-icon gray"><i data-lucide="wrench" style="width:20px;height:20px"></i></div>
        <div class="stat-card-value">${maintenance}</div>
        <div class="stat-card-label">Maintenance</div>
      </div>
    </div>

    <!-- Legend -->
    <div style="display:flex;gap:16px;margin-bottom:20px;flex-wrap:wrap">
      ${[
        { color: 'var(--color-danger)', label: 'Occupied', count: occupied },
        { color: 'var(--color-success)', label: 'Available', count: available },
        { color: 'var(--color-warning)', label: 'Cleaning', count: cleaning },
        { color: 'var(--color-border-strong)', label: 'Maintenance', count: maintenance },
      ].map(l => `
        <div style="display:flex;align-items:center;gap:6px;font-size:13px">
          <div style="width:14px;height:14px;border-radius:3px;background:${l.color}"></div>
          ${l.label} (${l.count})
        </div>
      `).join('')}
    </div>

    <!-- Ward Sections -->
    ${wards.map(ward => {
      const wardBeds = beds.filter(b => b.ward === ward);
      return `
        <div class="card" style="margin-bottom:20px">
          <div class="card-header">
            <span class="card-title">${ward}</span>
            <span class="badge badge-gray badge-no-dot">${wardBeds.length} beds</span>
          </div>
          <div class="card-body">
            <div class="bed-grid">
              ${wardBeds.map(bed => `
                <div class="bed-cell ${bed.status}" title="${bed.number} — ${bed.status}${bed.patientName ? ': ' + bed.patientName : ''}">
                  <div class="bed-number">${bed.number}</div>
                  <div class="bed-patient-name">${bed.patientName || bed.status}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    }).join('')}
  `;

  if (window.lucide) lucide.createIcons({ el: content });
}

// ============================================================
// hospitaladmin/billing.js — Hospital Billing
// ============================================================
export function renderHABilling() {
  renderSidebar();
  renderTopbar({ breadcrumb: [{ label: 'Hospital Admin', path: '/ha/dashboard' }, { label: 'Billing & Invoices' }] });

  const invoices = get('invoices').filter(i => i.hospitalId === get('currentHospitalId'));
  const total = invoices.reduce((s, i) => s + i.amount, 0);
  const paid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0);

  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="page-header">
      <div><h1 class="page-title">Billing & Invoices</h1></div>
      <div class="page-actions">
        <button class="btn btn-primary" onclick="showToast_('Generate Invoice','Invoice generator coming soon.','info')">
          <i data-lucide="plus" style="width:14px;height:14px"></i> New Invoice
        </button>
      </div>
    </div>

    <div class="stats-grid stats-grid-4" style="margin-bottom:24px">
      <div class="stat-card">
        <div class="stat-card-icon blue"><i data-lucide="indian-rupee" style="width:20px;height:20px"></i></div>
        <div class="stat-card-value">₹${(total/1000).toFixed(0)}K</div>
        <div class="stat-card-label">Total Billed</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-icon green"><i data-lucide="check-circle" style="width:20px;height:20px"></i></div>
        <div class="stat-card-value">₹${(paid/1000).toFixed(0)}K</div>
        <div class="stat-card-label">Collected</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-icon amber"><i data-lucide="clock" style="width:20px;height:20px"></i></div>
        <div class="stat-card-value">${invoices.filter(i => i.status === 'pending').length}</div>
        <div class="stat-card-label">Pending</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-icon teal"><i data-lucide="shield" style="width:20px;height:20px"></i></div>
        <div class="stat-card-value">${invoices.filter(i => i.status === 'insurance').length}</div>
        <div class="stat-card-label">Insurance Claims</div>
      </div>
    </div>

    <div class="data-table-wrapper">
      <div class="table-toolbar">
        <div class="table-toolbar-left">
          <div class="table-search">
            <i data-lucide="search" style="width:14px;height:14px;color:var(--color-text-light)"></i>
            <input type="text" placeholder="Search invoices…" />
          </div>
          <select class="table-filter-select">
            <option value="">All Status</option>
            <option>paid</option><option>pending</option><option>partial</option><option>insurance</option>
          </select>
        </div>
        <div class="table-toolbar-right">
          <button class="btn btn-secondary btn-sm"><i data-lucide="download" style="width:13px;height:13px"></i> Export</button>
        </div>
      </div>
      <table class="data-table">
        <thead>
          <tr><th>Invoice #</th><th>Patient</th><th>Doctor</th><th>Description</th><th>Amount</th><th>Date</th><th>Status</th><th>Actions</th></tr>
        </thead>
        <tbody>
          ${invoices.map(inv => {
            const patient = get('patients').find(p => p.id === inv.patientId);
            return `
              <tr>
                <td style="font-family:monospace;font-size:12px;color:var(--color-primary)">INV-${inv.id.toUpperCase()}</td>
                <td>${patient?.name || '—'}</td>
                <td style="color:var(--color-text-muted)">${inv.doctor}</td>
                <td>${inv.description}</td>
                <td style="font-weight:600">₹${inv.amount.toLocaleString()}</td>
                <td style="color:var(--color-text-muted)">${inv.date}</td>
                <td><span class="badge badge-${inv.status === 'paid' ? 'success' : inv.status === 'partial' ? 'warning' : inv.status === 'insurance' ? 'info' : 'danger'}">${inv.status}</span></td>
                <td class="td-actions">
                  <button class="row-action-btn"><i data-lucide="file-text" style="width:14px;height:14px"></i></button>
                  <button class="row-action-btn"><i data-lucide="printer" style="width:14px;height:14px"></i></button>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;

  if (window.lucide) lucide.createIcons({ el: content });
  window.showToast_ = (t, m, type) => showToast({ title: t, message: m, type });
}

// ============================================================
// hospitaladmin/notifications.js — Activity Feed
// ============================================================
export function renderNotifications() {
  renderSidebar();
  renderTopbar({ breadcrumb: [{ label: 'Hospital Admin', path: '/ha/dashboard' }, { label: 'Activity Feed' }] });

  const feed = get('activityFeed');

  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="page-header">
      <div><h1 class="page-title">Activity Feed</h1><p class="page-subtitle">Real-time hospital activity log</p></div>
      <div class="page-actions">
        <button class="btn btn-secondary" onclick="simulateWABooking()">
          <i data-lucide="message-circle" style="width:14px;height:14px"></i> Simulate WhatsApp Booking
        </button>
      </div>
    </div>

    <div class="content-grid" style="grid-template-columns:2fr 1fr">
      <div class="card">
        <div class="card-header"><span class="card-title">All Activity</span><span class="badge badge-success animate-pulse">● Live</span></div>
        <div class="card-body" style="padding:0">
          <div class="activity-feed" style="padding:0 20px">
            ${feed.map(a => `
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
      <div class="card">
        <div class="card-header"><span class="card-title">By Type</span></div>
        <div class="card-body">
          ${[
            { type: 'WhatsApp Bookings', count: feed.filter(a => a.type === 'whatsapp').length, color: '#25D366', icon: 'message-circle' },
            { type: 'Check-ins', count: feed.filter(a => a.type === 'checkin').length, color: 'var(--color-primary)', icon: 'user-check' },
            { type: 'Appointments', count: feed.filter(a => a.type === 'appointment').length, color: 'var(--color-accent)', icon: 'calendar' },
            { type: 'Cancellations', count: feed.filter(a => a.type === 'cancel').length, color: 'var(--color-danger)', icon: 'x-circle' },
            { type: 'Payments', count: feed.filter(a => a.type === 'payment').length, color: 'var(--color-success)', icon: 'receipt' },
          ].map(s => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--color-border)">
              <div style="display:flex;align-items:center;gap:8px">
                <i data-lucide="${s.icon}" style="width:16px;height:16px;color:${s.color}"></i>
                <span style="font-size:13px">${s.type}</span>
              </div>
              <span class="badge badge-gray badge-no-dot">${s.count}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons({ el: content });
}

window.simulateWABooking = () => {
  const { addAppointment, get: storeGet, showToast: _ } = window._store || {};
  showToast({ title: '📱 Simulating WhatsApp Booking...', type: 'wa', duration: 2000 });
  setTimeout(() => {
    showToast({
      title: '📱 New WhatsApp Booking!',
      message: 'Anita Krishnan booked with Dr. Ravi Kumar — Pediatrics at 3:00 PM tomorrow',
      type: 'wa',
      duration: 8000,
    });
    // Add to feed
    const feed = get('activityFeed');
    feed.unshift({
      id: 'act_sim_' + Date.now(),
      type: 'whatsapp', icon: 'message-circle', color: 'green',
      text: 'New appointment booked via WhatsApp — Anita Krishnan with Dr. Ravi Kumar (Pediatrics)',
      time: 'just now'
    });
    renderNotifications();
  }, 1500);
};

// ============================================================
// hospitaladmin/reports.js — Reports & Analytics
// ============================================================
export function renderHAReports() {
  renderSidebar();
  renderTopbar({ breadcrumb: [{ label: 'Hospital Admin', path: '/ha/dashboard' }, { label: 'Reports & Analytics' }] });

  const appts = getHospitalAppointments ? getHospitalAppointments() : [];
  const content = document.getElementById('content');

  content.innerHTML = `
    <div class="page-header">
      <div><h1 class="page-title">Reports & Analytics</h1><p class="page-subtitle">Hospital performance data and trends</p></div>
      <div class="page-actions">
        <select class="table-filter-select">
          <option>Last 30 days</option><option>Last 90 days</option><option>This Year</option>
        </select>
        <button class="btn btn-secondary"><i data-lucide="download" style="width:14px;height:14px"></i> Export PDF</button>
      </div>
    </div>

    <div class="content-grid" style="margin-bottom:24px">
      <div class="card">
        <div class="card-header"><span class="card-title">Patient Inflow (Last 6 Months)</span></div>
        <div class="card-body"><div id="rpt-inflow"></div></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">Appointment Source Breakdown</span></div>
        <div class="card-body">
          ${[
            { label: 'WhatsApp', pct: 44, color: '#25D366' },
            { label: 'Walk-in', pct: 29, color: 'var(--color-primary)' },
            { label: 'Phone', pct: 18, color: 'var(--color-warning)' },
            { label: 'Admin Entry', pct: 9, color: 'var(--color-gray)' },
          ].map(s => `
            <div style="margin-bottom:12px">
              <div style="display:flex;justify-content:space-between;margin-bottom:4px">
                <span style="font-size:13px">${s.label}</span>
                <span style="font-size:12px;font-weight:600">${s.pct}%</span>
              </div>
              <div class="progress-bar"><div class="progress-fill" style="width:${s.pct}%;background:${s.color}"></div></div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <div class="content-grid">
      <div class="card">
        <div class="card-header"><span class="card-title">Doctor Consultation Volume</span></div>
        <div class="card-body"><div id="rpt-doctors"></div></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">Key Metrics</span></div>
        <div class="card-body">
          <div class="info-list">
            <div class="info-row"><span class="info-label">No-show Rate</span><span class="info-value font-semibold" style="color:var(--color-danger)">8.3%</span></div>
            <div class="info-row"><span class="info-label">Avg Consultation Time</span><span class="info-value">14.2 min</span></div>
            <div class="info-row"><span class="info-label">Patient Satisfaction</span><span class="info-value">⭐ 4.6/5.0</span></div>
            <div class="info-row"><span class="info-label">Avg Bed Occupancy</span><span class="info-value font-semibold">71%</span></div>
            <div class="info-row"><span class="info-label">WhatsApp Booking %</span><span class="info-value" style="color:#25D366">44% of all bookings</span></div>
            <div class="info-row"><span class="info-label">Avg Revenue/Patient</span><span class="info-value">₹4,820</span></div>
          </div>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons({ el: content });

  import('../../components/chart.js').then(({ renderBarChart }) => {
    renderBarChart(document.getElementById('rpt-inflow'), [
      { label: 'Mar', value: 52 }, { label: 'Apr', value: 61 }, { label: 'May', value: 58 },
      { label: 'Jun', value: 74 }, { label: 'Jul', value: 69 }, { label: 'Aug', value: 87 },
    ]);
    const staffList = getHospitalStaff ? getHospitalStaff() : [];
    const doctors = staffList.filter(s => s.role === 'Doctor').slice(0, 6);
    renderBarChart(document.getElementById('rpt-doctors'), doctors.map(d => ({
      label: d.name.split(' ')[1] || d.name.split(' ')[0],
      value: d.patientCount || 0,
    })), { barColor: 'var(--color-accent)' });
  });
}


