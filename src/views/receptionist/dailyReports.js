// ============================================================
// receptionist/dailyReports.js — Module 8: End-of-Day Shift Handover
// ============================================================

import { renderTopbar } from '../../components/topbar.js';
import { renderSidebar } from '../../components/sidebar.js';
import { getTodayAppointments, getHospitalInvoices } from '../../store.js';
import { showToast } from '../../components/toast.js';
import { refreshIcons } from '../../components/icons.js';

export function renderDailyReports() {
  renderSidebar();
  renderTopbar({
    breadcrumb: [
      { label: 'Front Desk', path: '/rc/queue' },
      { label: 'End-of-Day Shift Report' }
    ]
  });

  const appts = getTodayAppointments();
  const checkedIn = appts.filter(a => a.status === 'confirmed' || a.status === 'in-progress' || a.status === 'completed').length;
  const walkins = appts.filter(a => a.source === 'walkin').length;
  const waBookings = appts.filter(a => a.source === 'whatsapp').length;
  const noShows = appts.filter(a => a.status === 'no-show').length;
  const invoices = getHospitalInvoices();
  const cashTotal = invoices.reduce((s, i) => s + (i.amount || 0), 0);

  const content = document.getElementById('content');
  content.innerHTML = `
    <!-- Header -->
    <div class="page-header">
      <div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
          <h1 class="page-title">Front Desk Shift Handover Report</h1>
          <span class="badge badge-primary">Shift: Morning & Afternoon</span>
        </div>
        <p class="page-subtitle">Summary of today's patient arrivals, walk-ins handled, channel conversion, and counter cash collected for handover</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary" onclick="showToast({ title: 'Shift Summary Printed', message: 'Handover report printed for supervisor.', type: 'info' })">
          <i data-lucide="printer"></i> Print Handover Sheet
        </button>
      </div>
    </div>

    <!-- Handover KPI Cards -->
    <div class="stats-grid stats-grid-4" style="margin-bottom:28px">
      <div class="stat-card">
        <div class="stat-card-icon green"><i data-lucide="user-check"></i></div>
        <div class="stat-card-value">${checkedIn}</div>
        <div class="stat-card-label">Patients Checked In</div>
        <div class="stat-card-trend">Across all OPD specialties</div>
      </div>

      <div class="stat-card">
        <div class="stat-card-icon blue"><i data-lucide="user-plus"></i></div>
        <div class="stat-card-value">${walkins}</div>
        <div class="stat-card-label">Walk-in Registrations</div>
        <div class="stat-card-trend">Fast-path counter bookings</div>
      </div>

      <div class="stat-card">
        <div class="stat-card-icon purple"><i data-lucide="smartphone"></i></div>
        <div class="stat-card-value">${waBookings}</div>
        <div class="stat-card-label">WhatsApp Arrivals</div>
        <div class="stat-card-trend">Zero queue wait time</div>
      </div>

      <div class="stat-card">
        <div class="stat-card-icon red"><i data-lucide="user-x"></i></div>
        <div class="stat-card-value">${noShows}</div>
        <div class="stat-card-label">No-Shows Recorded</div>
        <div class="stat-card-trend">Follow-up auto scheduled</div>
      </div>
    </div>

    <!-- Counter Reconciliation Box -->
    <div class="card" style="border:1.5px solid var(--color-border);margin-bottom:24px">
      <div class="card-header" style="background:#F8FAFC">
        <span class="card-title">Front Desk Cash & UPI Reconciliation</span>
      </div>
      <div class="card-body" style="padding:20px">
        <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:16px">
          <div style="background:#F8FAFC;padding:14px;border-radius:10px;border:1px solid var(--color-border)">
            <div style="font-size:12px;color:var(--color-text-muted)">Total Collected at Counter</div>
            <div style="font-size:22px;font-weight:800;color:var(--color-primary);margin-top:4px">₹${cashTotal.toLocaleString()}</div>
          </div>
          <div style="background:#F8FAFC;padding:14px;border-radius:10px;border:1px solid var(--color-border)">
            <div style="font-size:12px;color:var(--color-text-muted)">Receptionist on Duty</div>
            <div style="font-size:16px;font-weight:700;margin-top:4px">Rekha Sharma (Front Desk Lead)</div>
          </div>
          <div style="background:#F8FAFC;padding:14px;border-radius:10px;border:1px solid var(--color-border)">
            <div style="font-size:12px;color:var(--color-text-muted)">Shift Handover Status</div>
            <div style="font-size:14px;font-weight:700;color:var(--color-success);margin-top:4px">✓ Cash Balanced & Ready</div>
          </div>
        </div>
      </div>
    </div>
  `;

  refreshIcons(content);
}
