// ============================================================
// superadmin/dashboard.js — Module 1: Command Center
// ============================================================

import { renderTopbar } from '../../components/topbar.js';
import { renderSidebar } from '../../components/sidebar.js';
import { get } from '../../store.js';
import { renderBarChart, renderDonutChart } from '../../components/chart.js';
import { refreshIcons } from '../../components/icons.js';

export function renderSADashboard() {
  renderSidebar();
  renderTopbar({ breadcrumb: [{ label: 'Super Admin' }, { label: 'Command Center' }] });

  const analytics = get('platformAnalytics');
  const hospitals = get('hospitals') || [];
  const alerts = get('platformAlerts') || [];
  const tickets = get('supportTickets') || [];
  const activeHospitals = hospitals.filter(h => h.status === 'active');
  const suspendedHospitals = hospitals.filter(h => h.status === 'suspended');
  const criticalAlerts = alerts.filter(a => a.severity === 'critical' && !a.acknowledged);
  const openTickets = tickets.filter(t => t.status === 'open');

  const content = document.getElementById('content');
  content.innerHTML = `
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Platform Command Center</h1>
        <p class="page-subtitle">Multi-tenant operations, revenue health & live system status — ${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary" onclick="navigateTo('/sa/analytics')">
          <i data-lucide="bar-chart-2"></i> Platform BI
        </button>
        <button class="btn btn-primary" onclick="navigateTo('/sa/hospitals/new')">
          <i data-lucide="plus-circle"></i> Onboard Hospital
        </button>
      </div>
    </div>

    <!-- Urgent Action / Alert Banner if any -->
    ${criticalAlerts.length > 0 ? `
      <div style="background:#FEF2F2;border:1.5px solid #EF4444;border-radius:var(--radius-lg);padding:16px 20px;margin-bottom:24px;display:flex;align-items:center;justify-content:space-between;gap:16px">
        <div style="display:flex;align-items:center;gap:14px">
          <div style="width:40px;height:40px;border-radius:50%;background:#FEE2E2;color:#DC2626;display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <i data-lucide="alert-octagon" style="width:24px;height:24px"></i>
          </div>
          <div>
            <div style="font-size:var(--font-size-base);font-weight:700;color:#991B1B">Action Required: ${criticalAlerts[0].title}</div>
            <div style="font-size:var(--font-size-sm);color:#7F1D1D">${criticalAlerts[0].message}</div>
          </div>
        </div>
        <button class="btn btn-danger btn-sm" onclick="navigateTo('${criticalAlerts[0].actionRoute}')">
          Resolve Now →
        </button>
      </div>
    ` : ''}

    <!-- Top KPI Grid -->
    <div class="stats-grid stats-grid-5" style="margin-bottom:28px">
      <!-- Total Hospitals -->
      <div class="stat-card">
        <div class="stat-card-header">
          <div class="stat-card-icon blue"><i data-lucide="building-2"></i></div>
          <span class="badge badge-success">+1 this month</span>
        </div>
        <div class="stat-card-value">${hospitals.length}</div>
        <div class="stat-card-label">Total Hospitals</div>
        <div class="stat-card-trend">
          <span class="trend-up">● ${activeHospitals.length} Active</span> · <span style="color:var(--color-danger)">● ${suspendedHospitals.length} Suspended</span>
        </div>
      </div>

      <!-- Total Patients Managed -->
      <div class="stat-card">
        <div class="stat-card-header">
          <div class="stat-card-icon green"><i data-lucide="users"></i></div>
          <span class="badge badge-info">+${analytics.newPatientsThisMonth} this month</span>
        </div>
        <div class="stat-card-value">${analytics.totalPatients.toLocaleString()}</div>
        <div class="stat-card-label">Total Patients</div>
        <div class="stat-card-trend"><span class="trend-up">↑ 12.4%</span> vs last month</div>
      </div>

      <!-- Monthly Recurring Revenue (MRR) -->
      <div class="stat-card">
        <div class="stat-card-header">
          <div class="stat-card-icon teal"><i data-lucide="indian-rupee"></i></div>
          <span class="badge badge-success">+15.2% ARR</span>
        </div>
        <div class="stat-card-value">₹${(analytics.monthlyRevenue / 100000).toFixed(1)}L</div>
        <div class="stat-card-label">Monthly Revenue</div>
        <div class="stat-card-trend"><span class="trend-up">↑ ₹60K</span> vs last month</div>
      </div>

      <!-- WhatsApp Booking Volume -->
      <div class="stat-card">
        <div class="stat-card-header">
          <div class="stat-card-icon" style="background:#DCF8C6;color:#075E54"><i data-lucide="message-circle"></i></div>
          <span class="badge badge-wa">44.8% Share</span>
        </div>
        <div class="stat-card-value">${analytics.appointmentsBySource.whatsapp.toLocaleString()}</div>
        <div class="stat-card-label">WhatsApp Bookings</div>
        <div class="stat-card-trend"><span class="trend-up">↑ 22%</span> adoption rate</div>
      </div>

      <!-- Active Doctors -->
      <div class="stat-card">
        <div class="stat-card-header">
          <div class="stat-card-icon amber"><i data-lucide="stethoscope"></i></div>
          <span class="badge badge-gray">${analytics.totalStaff} Total Staff</span>
        </div>
        <div class="stat-card-value">${analytics.totalDoctors}</div>
        <div class="stat-card-label">Onboarded Doctors</div>
        <div class="stat-card-trend" style="color:var(--color-primary);cursor:pointer" onclick="navigateTo('/sa/hospitals')">View Hospitals →</div>
      </div>
    </div>

    <!-- Charts & Infrastructure Status Grid -->
    <div class="content-grid" style="grid-template-columns: 2fr 1fr; margin-bottom: 28px">
      <!-- Monthly Revenue & Patient Growth Bar Chart -->
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Patient Inflow & Growth Trend</div>
            <div style="font-size:var(--font-size-xs);color:var(--color-text-muted);margin-top:2px">Monthly patients across all registered tenant hospitals</div>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="navigateTo('/sa/analytics')">Full BI Report</button>
        </div>
        <div class="card-body">
          <div id="sa-patient-chart"></div>
        </div>
      </div>

      <!-- Booking Channel Breakdown Donut -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">Appointment Channel Split</div>
        </div>
        <div class="card-body" style="display:flex;flex-direction:column;align-items:center">
          <div id="sa-source-donut"></div>
        </div>
      </div>
    </div>

    <!-- Hospital Quick Directory & Live System Health -->
    <div class="content-grid" style="grid-template-columns: 2fr 1fr">
      <!-- Hospital Fleet Overview -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">Hospital Tenants Status</div>
          <button class="btn btn-secondary btn-sm" onclick="navigateTo('/sa/hospitals')">All Hospitals →</button>
        </div>
        <div class="card-body" style="padding:0">
          <table class="data-table">
            <thead>
              <tr>
                <th>Hospital</th>
                <th>City / Type</th>
                <th>Plan</th>
                <th>Beds</th>
                <th>Status</th>
                <th class="td-actions">Monitor</th>
              </tr>
            </thead>
            <tbody>
              ${hospitals.slice(0, 5).map(h => `
                <tr onclick="navigateTo('/sa/hospitals/${h.id}')" style="cursor:pointer">
                  <td>
                    <div class="avatar-name">
                      <div class="avatar avatar-sm" style="background:${h.primaryColor || 'var(--color-primary)'}">${h.name.charAt(0)}</div>
                      <div>
                        <div class="an-name">${h.name}</div>
                        <div class="an-sub">${h.adminName}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style="font-weight:500">${h.city}</div>
                    <div style="font-size:var(--font-size-xs);color:var(--color-text-muted)">${h.type}</div>
                  </td>
                  <td>
                    <span class="badge badge-${h.plan === 'Enterprise' ? 'primary' : h.plan === 'Professional' ? 'accent' : 'gray'} badge-no-dot">
                      ${h.plan}
                    </span>
                  </td>
                  <td style="font-weight:600">${h.beds || '—'}</td>
                  <td>
                    <span class="badge badge-${h.status === 'active' ? 'success' : 'danger'}">
                      ${h.status === 'active' ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td class="td-actions" onclick="event.stopPropagation()">
                    <button class="btn btn-secondary btn-sm" onclick="navigateTo('/sa/hospitals/${h.id}')" title="Live Monitor">
                      <i data-lucide="activity"></i> Monitor
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Infrastructure Health & Operations -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">System Health & Ops</div>
          <span class="badge badge-success animate-pulse">● 99.98% Uptime</span>
        </div>
        <div class="card-body">
          <div class="info-list">
            <div class="info-row">
              <span class="info-label">WhatsApp Meta Webhook</span>
              <span class="badge badge-success">● Connected</span>
            </div>
            <div class="info-row">
              <span class="info-label">Daily WhatsApp Quota</span>
              <span class="info-value">1,420 / 5,000 (28%)</span>
            </div>
            <div class="info-row">
              <span class="info-label">Open Support Tickets</span>
              <span class="badge badge-${openTickets.length > 0 ? 'warning' : 'success'}">${openTickets.length} open</span>
            </div>
            <div class="info-row">
              <span class="info-label">Database Latency</span>
              <span class="info-value" style="color:var(--color-success)">18ms (Optimal)</span>
            </div>
            <div class="info-row">
              <span class="info-label">Latest Automated Backup</span>
              <span class="info-value">Today at 04:00 AM</span>
            </div>
            <div class="info-row">
              <span class="info-label">Security & Compliance</span>
              <span class="info-value" style="color:var(--color-accent);font-weight:600">HIPAA Check OK</span>
            </div>
          </div>
          <div style="margin-top:20px;display:flex;gap:10px">
            <button class="btn btn-secondary btn-sm flex-1" onclick="navigateTo('/sa/alerts')">
              <i data-lucide="bell"></i> View Alerts (${alerts.filter(a => !a.acknowledged).length})
            </button>
            <button class="btn btn-secondary btn-sm flex-1" onclick="navigateTo('/sa/support')">
              <i data-lucide="life-buoy"></i> Helpdesk
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  refreshIcons(content);

  // Render Charts
  const trend = analytics.monthlyTrend || [
    { month: 'Mar', patients: 620 }, { month: 'Apr', patients: 690 },
    { month: 'May', patients: 730 }, { month: 'Jun', patients: 780 },
    { month: 'Jul', patients: 870 }, { month: 'Aug', patients: 955 },
  ];

  renderBarChart(
    document.getElementById('sa-patient-chart'),
    trend.map(t => ({ label: t.month, value: t.patients })),
    { barColor: 'var(--color-primary)' }
  );

  const sources = analytics.appointmentsBySource || { whatsapp: 1240, walkin: 820, phone: 410, admin: 310 };
  renderDonutChart(
    document.getElementById('sa-source-donut'),
    [
      { label: 'WhatsApp', value: sources.whatsapp, color: '#25D366' },
      { label: 'Walk-in', value: sources.walkin, color: '#0B5FA5' },
      { label: 'Phone Call', value: sources.phone, color: '#D97706' },
      { label: 'Admin Portal', value: sources.admin, color: '#64748B' },
    ]
  );
}
