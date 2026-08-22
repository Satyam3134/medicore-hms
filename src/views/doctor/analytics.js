// ============================================================
// doctor/analytics.js — Module 9: Doctor Performance & Self-View Analytics
// ============================================================

import { renderTopbar } from '../../components/topbar.js';
import { renderSidebar } from '../../components/sidebar.js';
import { get, getDoctorAppointments, getDoctorPatients } from '../../store.js';
import { renderLineChart, renderBarChart, renderDonutChart } from '../../components/chart.js';
import { refreshIcons } from '../../components/icons.js';

function getActiveDoctor() {
  const currentUserId = get('currentUserId');
  const staff = get('staff');
  return staff.find(s => s.id === currentUserId && s.role === 'Doctor') || staff.find(s => s.role === 'Doctor') || staff[0];
}

export function renderDoctorAnalytics() {
  renderSidebar();
  const me = getActiveDoctor();
  renderTopbar({
    breadcrumb: [
      { label: 'Doctor Workspace', path: '/dr/dashboard' },
      { label: 'My Clinical Analytics' }
    ]
  });

  const myAppts = getDoctorAppointments(me.id);
  const myPatients = getDoctorPatients(me.id);
  const completed = myAppts.filter(a => a.status === 'completed');

  const content = document.getElementById('content');
  content.innerHTML = `
    <!-- Header -->
    <div class="page-header">
      <div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
          <h1 class="page-title">My Performance & Clinical Analytics</h1>
          <span class="badge badge-primary">Physician Self-View</span>
        </div>
        <p class="page-subtitle">Track consultation volume trends, average patient encounter duration, diagnosis distribution, and patient satisfaction ratings</p>
      </div>
    </div>

    <!-- Doctor Metrics Cards -->
    <div class="stats-grid stats-grid-4" style="margin-bottom:28px">
      <div class="stat-card">
        <div class="stat-card-icon blue"><i data-lucide="check-check"></i></div>
        <div class="stat-card-value">${completed.length || 18}</div>
        <div class="stat-card-label">Completed Consultations</div>
        <div class="stat-card-trend"><span class="trend-up">↑ 16% this month</span></div>
      </div>

      <div class="stat-card">
        <div class="stat-card-icon green"><i data-lucide="clock"></i></div>
        <div class="stat-card-value">11.4 min</div>
        <div class="stat-card-label">Avg Encounter Time</div>
        <div class="stat-card-trend">Optimal thoroughness balance</div>
      </div>

      <div class="stat-card">
        <div class="stat-card-icon amber"><i data-lucide="star"></i></div>
        <div class="stat-card-value">${me.rating || '4.9'} / 5.0</div>
        <div class="stat-card-label">Patient Experience Score</div>
        <div class="stat-card-trend">Based on 142 WhatsApp reviews</div>
      </div>

      <div class="stat-card">
        <div class="stat-card-icon purple"><i data-lucide="users"></i></div>
        <div class="stat-card-value">${myPatients.length}</div>
        <div class="stat-card-label">Active Assigned Patients</div>
        <div class="stat-card-trend">In ${me.department} Specialty</div>
      </div>
    </div>

    <!-- Charts Row -->
    <div style="display:grid;grid-template-columns:1.4fr 1fr;gap:24px;margin-bottom:24px">
      
      <!-- Weekly Consult Volume Line Chart -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Weekly Consultation Volume Trend</span>
        </div>
        <div class="card-body">
          <div id="doc-volume-chart" style="height:260px"></div>
        </div>
      </div>

      <!-- Consultation Type Split -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Consultation Case Mix</span>
        </div>
        <div class="card-body">
          <div id="doc-casemix-chart" style="height:260px"></div>
        </div>
      </div>

    </div>
  `;

  refreshIcons(content);

  setTimeout(() => {
    renderLineChart('doc-volume-chart', {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      series: [{
        name: 'Patients Consulted',
        data: [14, 18, 16, 22, 19, 12],
        color: '#0B5FA5'
      }]
    });

    renderDonutChart('doc-casemix-chart', {
      labels: ['Routine OPD Follow-Up', 'First-Time Diagnosis', 'Pre-Op Evaluation', 'Emergency Triage'],
      data: [52, 28, 12, 8],
      colors: ['#0B5FA5', '#10B981', '#F59E0B', '#EF4444']
    });
  }, 50);
}
