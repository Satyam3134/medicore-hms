// ============================================================
// receptionist/frontdeskAlerts.js — Module 9: Front Desk Operational Alerts
// ============================================================

import { renderTopbar } from '../../components/topbar.js';
import { renderSidebar } from '../../components/sidebar.js';
import { showToast } from '../../components/toast.js';
import { refreshIcons } from '../../components/icons.js';

export function renderFrontDeskAlerts() {
  renderSidebar();
  renderTopbar({
    breadcrumb: [
      { label: 'Front Desk', path: '/rc/queue' },
      { label: 'Operational Alerts & Delays' }
    ]
  });

  const alerts = [
    {
      id: 'al-1',
      type: 'delay',
      severity: 'warning',
      title: 'Doctor Running ~15 Mins Late',
      message: 'Dr. Suresh Patel (Orthopedics) is delayed due to an extended post-op ward procedure. 3 waiting patients notified.',
      time: '5 min ago',
      action: 'Notify Waiting Patients on WhatsApp'
    },
    {
      id: 'al-2',
      type: 'wait',
      severity: 'danger',
      title: 'Patient Waiting Over 20 Mins',
      message: 'Patient Mohan Pillai (Token NR-001) has been waiting for 24 mins for Dr. Ananya Singh in Room 302.',
      time: '12 min ago',
      action: 'Send Priority Buzzer to Doctor'
    },
    {
      id: 'al-3',
      type: 'emergency',
      severity: 'info',
      title: 'Triage Transfer Alert',
      message: 'Trauma ER transferred 1 walk-in patient to Cardiology OPD for urgent ECG verification.',
      time: '28 min ago',
      action: 'Allocate Immediate STAT Token'
    }
  ];

  const content = document.getElementById('content');
  content.innerHTML = `
    <!-- Header -->
    <div class="page-header">
      <div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
          <h1 class="page-title">Front Desk Operational Alerts</h1>
          <span class="badge badge-warning">${alerts.length} Live Alerts</span>
        </div>
        <p class="page-subtitle">Real-time alerts on physician delays, prolonged patient waiting times, and urgent walk-in triage routing</p>
      </div>
    </div>

    <!-- Alerts List -->
    <div style="display:flex;flex-direction:column;gap:16px">
      ${alerts.map(a => {
        const isDanger = a.severity === 'danger';
        const isWarn = a.severity === 'warning';
        const borderColor = isDanger ? '#EF4444' : isWarn ? '#F59E0B' : '#3B82F6';
        const bgColor = isDanger ? '#FEF2F2' : isWarn ? '#FFFBEB' : '#EFF6FF';

        return `
          <div class="card" style="border-left:5px solid ${borderColor};background:${bgColor};padding:20px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px">
            <div style="display:flex;align-items:flex-start;gap:16px">
              <div style="width:40px;height:40px;border-radius:10px;background:white;display:flex;align-items:center;justify-content:center;color:${borderColor};box-shadow:var(--shadow-xs)">
                <i data-lucide="${isDanger ? 'alert-triangle' : isWarn ? 'clock' : 'bell'}" style="width:22px;height:22px"></i>
              </div>
              <div>
                <div style="display:flex;align-items:center;gap:10px">
                  <h3 style="font-size:16px;font-weight:800;color:var(--color-text);margin:0">${a.title}</h3>
                  <span style="font-size:11px;color:var(--color-text-muted)">${a.time}</span>
                </div>
                <p style="font-size:13px;color:var(--color-text);margin:4px 0 0 0;line-height:1.4">${a.message}</p>
              </div>
            </div>

            <div>
              <button class="btn btn-sm btn-primary" onclick="showToast({ title: 'Action Triggered', message: '${a.action} executed.', type: 'success' })">
                ${a.action}
              </button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  refreshIcons(content);
}
