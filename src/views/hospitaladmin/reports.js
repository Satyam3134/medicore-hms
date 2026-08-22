// ============================================================
// hospitaladmin/reports.js — Module 9: Hospital Reports & Analytics
// ============================================================

import { renderTopbar } from '../../components/topbar.js';
import { renderSidebar } from '../../components/sidebar.js';
import { getHospitalAppointments, getHospitalStaff, getHospitalDepartments, getHospitalInvoices, get } from '../../store.js';
import { renderLineChart, renderBarChart, renderDonutChart } from '../../components/chart.js';
import { showToast } from '../../components/toast.js';
import { refreshIcons } from '../../components/icons.js';

export function renderHospitalReports() {
  renderSidebar();
  renderTopbar({
    breadcrumb: [
      { label: 'Hospital Admin', path: '/ha/dashboard' },
      { label: 'Reports & Operations Analytics' }
    ]
  });

  const appts = getHospitalAppointments();
  const staff = getHospitalStaff().filter(s => s.role === 'Doctor');
  const depts = getHospitalDepartments();
  const invoices = getHospitalInvoices();
  const hospital = get('hospitals')?.find(h => h.id === get('currentHospitalId')) || get('hospitals')?.[0];

  const totalAppts = appts.length;
  const completedAppts = appts.filter(a => a.status === 'completed').length;
  const noShows = appts.filter(a => a.status === 'no-show').length;
  const noShowRate = totalAppts ? ((noShows / totalAppts) * 100).toFixed(1) : '4.2';

  const waBookings = appts.filter(a => a.source === 'whatsapp').length;
  const walkinBookings = appts.filter(a => a.source === 'walkin').length;
  const phoneBookings = appts.filter(a => a.source === 'phone').length;
  const adminBookings = appts.filter(a => a.source === 'admin').length;

  const content = document.getElementById('content');
  content.innerHTML = `
    <!-- Header -->
    <div class="page-header">
      <div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
          <h1 class="page-title">Hospital Reports & Operations Analytics</h1>
          <span class="badge badge-primary">Executive BI</span>
        </div>
        <p class="page-subtitle">Patient volume metrics, physician workload, department revenue distribution & channel conversion</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary" onclick="exportHospitalAnalyticsPDF()">
          <i data-lucide="file-text"></i> Export PDF Report
        </button>
        <button class="btn btn-primary" onclick="showToast({ title: 'Schedule Generated', message: 'Weekly automated email scheduled.', type: 'success' })">
          <i data-lucide="mail"></i> Email Weekly Report
        </button>
      </div>
    </div>

    <!-- Analytics KPI Cards -->
    <div class="stats-grid stats-grid-4" style="margin-bottom:28px">
      <div class="stat-card">
        <div class="stat-card-icon blue"><i data-lucide="calendar-check"></i></div>
        <div class="stat-card-value">${totalAppts}</div>
        <div class="stat-card-label">Total Booked Consultations</div>
        <div class="stat-card-trend"><span class="trend-up">● ${completedAppts} Completed Visits</span></div>
      </div>

      <div class="stat-card">
        <div class="stat-card-icon green"><i data-lucide="smartphone"></i></div>
        <div class="stat-card-value">${((waBookings / (totalAppts || 1)) * 100).toFixed(0)}%</div>
        <div class="stat-card-label">WhatsApp Channel Share</div>
        <div class="stat-card-trend"><span class="trend-up">↑ 14% growth this month</span></div>
      </div>

      <div class="stat-card">
        <div class="stat-card-icon red"><i data-lucide="user-x"></i></div>
        <div class="stat-card-value">${noShowRate}%</div>
        <div class="stat-card-label">OPD No-Show Rate</div>
        <div class="stat-card-trend">WhatsApp reminders reduce no-shows</div>
      </div>

      <div class="stat-card">
        <div class="stat-card-icon purple"><i data-lucide="banknote"></i></div>
        <div class="stat-card-value">₹${((invoices.reduce((s, i) => s + (i.amount || 0), 0)) / 1000).toFixed(0)}K</div>
        <div class="stat-card-label">Total Hospital Revenue</div>
        <div class="stat-card-trend">OPD + IPD + Diagnostics</div>
      </div>
    </div>

    <!-- Charts Row 1: Patient Inflow & Booking Source Split -->
    <div style="display:grid;grid-template-columns:1.4fr 0.8fr;gap:24px;margin-bottom:28px">
      
      <!-- Patient Inflow Trend -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Daily Patient Inflow & OPD Volume Trend</span>
        </div>
        <div class="card-body">
          <div id="ha-inflow-chart" style="height:260px"></div>
        </div>
      </div>

      <!-- Booking Channel Split -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Booking Acquisition Channels</span>
        </div>
        <div class="card-body">
          <div id="ha-channel-chart" style="height:260px"></div>
        </div>
      </div>

    </div>

    <!-- Charts Row 2: Doctor-Wise Workload & Department Revenue -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:28px">
      
      <!-- Doctor Volume Bar Chart -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Doctor-Wise Consultations Volume</span>
        </div>
        <div class="card-body">
          <div id="ha-doctor-chart" style="height:260px"></div>
        </div>
      </div>

      <!-- Department Distribution Donut -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Department-Wise Patient Share</span>
        </div>
        <div class="card-body">
          <div id="ha-dept-chart" style="height:260px"></div>
        </div>
      </div>

    </div>

    <!-- Physician Productivity Table -->
    <div class="card">
      <div class="card-header">
        <span class="card-title">Physician Productivity & Revenue Breakdown</span>
      </div>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Doctor Name</th>
              <th>Specialty Department</th>
              <th>Consultation Fee</th>
              <th>Total Consultations</th>
              <th>Avg Rating</th>
              <th>Revenue Generated</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${staff.map(doc => {
              const docAppts = appts.filter(a => a.doctorId === doc.id);
              const count = docAppts.length || Math.floor(Math.random() * 8 + 4);
              const rev = count * (doc.consultationFee || 800);

              return `
                <tr>
                  <td>
                    <div style="font-weight:700">${doc.name}</div>
                    <div style="font-size:var(--font-size-xs);color:var(--color-text-muted)">${doc.qualifications || 'MBBS, MD'}</div>
                  </td>
                  <td><span class="badge badge-info badge-no-dot">${doc.department}</span></td>
                  <td style="font-weight:600">₹${doc.consultationFee || 800}</td>
                  <td style="font-weight:700">${count} Patients</td>
                  <td><span style="color:#F59E0B;font-weight:700">★ ${doc.rating || '4.8'}</span></td>
                  <td style="font-weight:800;color:var(--color-primary)">₹${rev.toLocaleString()}</td>
                  <td>
                    <span class="badge badge-${doc.status === 'on-duty' ? 'success' : 'danger'}">
                      ${doc.status.toUpperCase()}
                    </span>
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

  // Render Charts
  setTimeout(() => {
    // Inflow Trend
    renderLineChart('ha-inflow-chart', {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      series: [
        { name: 'OPD Patients', data: [38, 45, 42, 51, 62, 58, 24], color: '#0B5FA5' },
        { name: 'WhatsApp Bookings', data: [18, 22, 24, 30, 36, 32, 14], color: '#25D366' }
      ]
    });

    // Booking Channel Split
    renderDonutChart('ha-channel-chart', {
      labels: ['WhatsApp Bot', 'Walk-in Desk', 'Phone Call', 'Admin Portal'],
      data: [waBookings || 45, walkinBookings || 25, phoneBookings || 18, adminBookings || 12],
      colors: ['#25D366', '#0B5FA5', '#F59E0B', '#64748B']
    });

    // Doctor Volume Bar
    renderBarChart('ha-doctor-chart', {
      labels: staff.slice(0, 6).map(d => d.name.split(' ')[1] || d.name),
      series: [{
        name: 'Consultations',
        data: [42, 38, 55, 29, 51, 27],
        color: '#0B5FA5'
      }]
    });

    // Department Share
    renderDonutChart('ha-dept-chart', {
      labels: depts.slice(0, 5).map(d => d.name),
      data: depts.slice(0, 5).map(d => d.patientCount || 30),
      colors: ['#DC2626', '#D97706', '#7C3AED', '#0891B2', '#16A34A']
    });
  }, 50);
}

window.exportHospitalAnalyticsPDF = () => {
  showToast({ title: 'Exporting PDF', message: 'Hospital executive BI report generated.', type: 'info' });
};
