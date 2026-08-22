// ============================================================
// superadmin/analytics.js — Module 5: Platform Analytics & Reports
// ============================================================

import { renderTopbar } from '../../components/topbar.js';
import { renderSidebar } from '../../components/sidebar.js';
import { get } from '../../store.js';
import { renderBarChart, renderDonutChart } from '../../components/chart.js';
import { showToast } from '../../components/toast.js';
import { refreshIcons } from '../../components/icons.js';

export function renderSAAnalytics() {
  renderSidebar();
  renderTopbar({ breadcrumb: [{ label: 'Super Admin', path: '/sa/dashboard' }, { label: 'Platform Analytics' }] });

  const analytics = get('platformAnalytics') || {};
  const hospitals = get('hospitals') || [];

  const content = document.getElementById('content');
  content.innerHTML = `
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Platform Business Intelligence & Analytics</h1>
        <p class="page-subtitle">Cross-hospital comparative insights, booking channel metrics, and churn risk indicators</p>
      </div>
      <div class="page-actions">
        <select class="table-filter-select" id="analytics-timeframe" onchange="onAnalyticsTimeframeChange()">
          <option value="30">Last 30 Days</option>
          <option value="90" selected>Last 90 Days (Q2-Q3)</option>
          <option value="365">Trailing 12 Months</option>
        </select>
        <button class="btn btn-secondary" onclick="exportAnalyticsReport('csv')">
          <i data-lucide="download"></i> Export CSV
        </button>
        <button class="btn btn-primary" onclick="exportAnalyticsReport('pdf')">
          <i data-lucide="file-text"></i> Executive Summary PDF
        </button>
      </div>
    </div>

    <!-- Analytics Benchmark Stats -->
    <div class="stats-grid stats-grid-4" style="margin-bottom:28px">
      <div class="stat-card">
        <div class="stat-card-icon blue"><i data-lucide="trending-up"></i></div>
        <div class="stat-card-value">12.4%</div>
        <div class="stat-card-label">Monthly Patient Growth</div>
        <div class="stat-card-trend"><span class="trend-up">↑ +2.1%</span> vs platform average</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-icon" style="background:#DCF8C6;color:#075E54"><i data-lucide="message-circle"></i></div>
        <div class="stat-card-value">44.8%</div>
        <div class="stat-card-label">WhatsApp Channel Share</div>
        <div class="stat-card-trend"><span class="trend-up">↑ +8.4%</span> since WhatsApp QR launch</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-icon teal"><i data-lucide="activity"></i></div>
        <div class="stat-card-value">71.2%</div>
        <div class="stat-card-label">Avg Bed Utilization</div>
        <div class="stat-card-trend">Across ${hospitals.length} hospital wards</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-icon amber"><i data-lucide="user-check"></i></div>
        <div class="stat-card-value">84.6%</div>
        <div class="stat-card-label">Doctor Shift Utilization</div>
        <div class="stat-card-trend">Optimal capacity balance</div>
      </div>
    </div>

    <!-- Growth and Channel Comparison Grid -->
    <div class="content-grid" style="grid-template-columns: 2fr 1fr; margin-bottom: 28px">
      <div class="card">
        <div class="card-header">
          <div class="card-title">Hospital Patient Volume Comparison</div>
          <span class="badge badge-primary">Active Tenants</span>
        </div>
        <div class="card-body">
          <div id="sa-hospital-comparison-chart"></div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title">Global Patient Intake Channels</div>
        </div>
        <div class="card-body" style="display:flex;flex-direction:column;align-items:center">
          <div id="sa-channel-donut"></div>
        </div>
      </div>
    </div>

    <!-- Churn Risk & Health Benchmark Table -->
    <div class="card mb-6">
      <div class="card-header">
        <div>
          <span class="card-title">Hospital Retention & Churn Risk Analysis</span>
          <div style="font-size:var(--font-size-xs);color:var(--color-text-muted);margin-top:2px">Identifies underperforming tenants requiring customer success intervention</div>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="showToast({ title: 'Alerts Dispatched', message: 'Retention alerts sent to account managers.', type: 'info' })">
          <i data-lucide="send"></i> Notify Account Reps
        </button>
      </div>
      <div class="card-body" style="padding:0">
        <table class="data-table">
          <thead>
            <tr>
              <th>Hospital Tenant</th>
              <th>Monthly Volume</th>
              <th>WhatsApp Adoption</th>
              <th>Bed Occupancy</th>
              <th>Payment Health</th>
              <th>Churn Risk Index</th>
              <th class="td-actions">Intervention</th>
            </tr>
          </thead>
          <tbody>
            ${hospitals.map(h => {
              const waShare = h.id === 'h1' ? '48%' : h.id === 'h2' ? '54%' : h.id === 'h3' ? '62%' : h.id === 'h4' ? '38%' : '18%';
              const riskLevel = h.status === 'suspended' ? 'Critical' : h.id === 'h4' ? 'Medium' : 'Low';
              const riskColor = riskLevel === 'Critical' ? 'danger' : riskLevel === 'Medium' ? 'warning' : 'success';
              return `
                <tr>
                  <td>
                    <div class="avatar-name">
                      <div class="avatar avatar-sm" style="background:${h.primaryColor || 'var(--color-primary)'}">${h.name.charAt(0)}</div>
                      <div>
                        <div class="an-name">${h.name}</div>
                        <div class="an-sub">${h.plan} Plan</div>
                      </div>
                    </div>
                  </td>
                  <td style="font-weight:600">${h.stats?.patients || 0} patients</td>
                  <td><span class="badge badge-wa">${waShare}</span></td>
                  <td>${h.stats?.bedOccupancy || 0}%</td>
                  <td>
                    <span class="badge badge-${h.status === 'active' ? 'success' : 'danger'}">
                      ${h.status === 'active' ? 'Good' : 'Overdue'}
                    </span>
                  </td>
                  <td>
                    <span class="badge badge-${riskColor}">
                      ${riskLevel} Risk
                    </span>
                  </td>
                  <td class="td-actions">
                    <button class="btn btn-secondary btn-sm" onclick="navigateTo('/sa/hospitals/${h.id}')">
                      <i data-lucide="activity"></i> View Tenant
                    </button>
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

  // Render comparative charts
  renderBarChart(
    document.getElementById('sa-hospital-comparison-chart'),
    hospitals.map(h => ({
      label: h.name.split(' ')[0],
      value: h.stats?.patients || 50
    })),
    { barColor: 'var(--color-primary)' }
  );

  const sources = analytics.appointmentsBySource || { whatsapp: 1240, walkin: 820, phone: 410, admin: 310 };
  renderDonutChart(
    document.getElementById('sa-channel-donut'),
    [
      { label: 'WhatsApp Bot (44%)', value: sources.whatsapp, color: '#25D366' },
      { label: 'Walk-In Front Desk (29%)', value: sources.walkin, color: '#0B5FA5' },
      { label: 'Telephone Booking (15%)', value: sources.phone, color: '#D97706' },
      { label: 'Admin Entry (12%)', value: sources.admin, color: '#64748B' },
    ]
  );
}

window.onAnalyticsTimeframeChange = () => {
  showToast({ title: 'Analytics Refreshed', message: 'Data aggregated for selected period.', type: 'info' });
};

window.exportAnalyticsReport = (format) => {
  showToast({
    title: `Export Ready (${format.toUpperCase()})`,
    message: `Platform executive BI report exported successfully.`,
    type: 'success'
  });
};
