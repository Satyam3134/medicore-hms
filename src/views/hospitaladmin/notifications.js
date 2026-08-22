// ============================================================
// hospitaladmin/notifications.js — Module 13: Activity Feed
// ============================================================

import { renderTopbar } from '../../components/topbar.js';
import { renderSidebar } from '../../components/sidebar.js';
import { get, getHospitalStaff } from '../../store.js';
import { showToast } from '../../components/toast.js';
import { openModal, closeModal } from '../../components/modal.js';
import { refreshIcons } from '../../components/icons.js';

let activeEventFilter = '';

export function renderHospitalNotifications() {
  renderSidebar();
  renderTopbar({
    breadcrumb: [
      { label: 'Hospital Admin', path: '/ha/dashboard' },
      { label: 'Activity Feed & Staff Alerts' }
    ]
  });

  const feed = get('activityFeed') || [];
  const hospital = get('hospitals')?.find(h => h.id === get('currentHospitalId')) || get('hospitals')?.[0];

  const filteredFeed = activeEventFilter
    ? feed.filter(item => item.type === activeEventFilter)
    : feed;

  const content = document.getElementById('content');
  content.innerHTML = `
    <!-- Header -->
    <div class="page-header">
      <div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
          <h1 class="page-title">Hospital Activity Feed & Real-Time Alerts</h1>
          <span class="badge badge-primary">Live Operations Audit</span>
        </div>
        <p class="page-subtitle">Real-time chronological events across front desk check-ins, WhatsApp bookings, diagnostic results, and staff shifts</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" onclick="openBroadcastAlertModal()">
          <i data-lucide="megaphone"></i> Broadcast Staff Announcement
        </button>
      </div>
    </div>

    <!-- Event Filters Bar -->
    <div class="card mb-6" style="padding:14px 20px;background:white">
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <span style="font-size:var(--font-size-xs);font-weight:700;text-transform:uppercase;color:var(--color-text-muted);margin-right:6px">Filter Activity:</span>
        <button class="btn btn-sm ${!activeEventFilter ? 'btn-primary' : 'btn-secondary'}" onclick="filterFeed('')">
          All Events (${feed.length})
        </button>
        <button class="btn btn-sm ${activeEventFilter === 'whatsapp' ? 'btn-primary' : 'btn-secondary'}" onclick="filterFeed('whatsapp')">
          📱 WhatsApp Bookings
        </button>
        <button class="btn btn-sm ${activeEventFilter === 'checkin' ? 'btn-primary' : 'btn-secondary'}" onclick="filterFeed('checkin')">
          🎫 Front Desk Check-ins
        </button>
        <button class="btn btn-sm ${activeEventFilter === 'lab' ? 'btn-primary' : 'btn-secondary'}" onclick="filterFeed('lab')">
          🧪 Lab Reports
        </button>
        <button class="btn btn-sm ${activeEventFilter === 'payment' ? 'btn-primary' : 'btn-secondary'}" onclick="filterFeed('payment')">
          💳 Billing & Payments
        </button>
        <button class="btn btn-sm ${activeEventFilter === 'staff' ? 'btn-primary' : 'btn-secondary'}" onclick="filterFeed('staff')">
          🩺 Staff Duty
        </button>
      </div>
    </div>

    <!-- Chronological Activity Stream -->
    <div class="card">
      <div class="card-header" style="background:#F8FAFC">
        <span class="card-title">Live Hospital Timeline</span>
        <span class="badge badge-success">● Connected to Real-Time Bus</span>
      </div>

      <div class="card-body" style="padding:24px">
        <div style="display:flex;flex-direction:column;gap:18px">
          ${filteredFeed.map(item => {
            const isWA = item.type === 'whatsapp';
            const iconBg = item.color === 'green' ? '#DCFCE7' : item.color === 'red' ? '#FEE2E2' : item.color === 'amber' ? '#FEF3C7' : '#DBEAFE';
            const iconColor = item.color === 'green' ? '#16A34A' : item.color === 'red' ? '#DC2626' : item.color === 'amber' ? '#D97706' : '#2563EB';

            return `
              <div style="display:flex;align-items:flex-start;gap:16px;padding-bottom:16px;border-bottom:1px solid var(--color-border)">
                <div style="width:42px;height:42px;border-radius:12px;background:${iconBg};color:${iconColor};display:flex;align-items:center;justify-content:center;flex-shrink:0">
                  <i data-lucide="${item.icon || 'bell'}" style="width:20px;height:20px"></i>
                </div>
                <div style="flex:1">
                  <div style="display:flex;justify-content:space-between;align-items:baseline">
                    <div style="font-weight:700;font-size:var(--font-size-base);color:var(--color-text)">
                      ${item.text}
                    </div>
                    <span style="font-size:var(--font-size-xs);color:var(--color-text-muted);white-space:nowrap;margin-left:14px">
                      ${item.time}
                    </span>
                  </div>
                  <div style="font-size:var(--font-size-xs);color:var(--color-text-muted);margin-top:4px">
                    Facility: <strong>${hospital?.name || 'Apollo Hospital'}</strong> · Event ID: ${item.id}
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;

  refreshIcons(content);
}

window.filterFeed = (filter) => {
  activeEventFilter = filter;
  renderHospitalNotifications();
};

window.openBroadcastAlertModal = () => {
  openModal({
    title: 'Broadcast Announcement to All Staff',
    size: 'md',
    body: `
      <div class="form-group">
        <label class="form-label">Announcement Title <span class="required">*</span></label>
        <input type="text" class="form-control" id="broad-title" placeholder="e.g. Clinical Grand Rounds at 04:00 PM" required />
      </div>

      <div class="form-group">
        <label class="form-label">Announcement Message <span class="required">*</span></label>
        <textarea class="form-control" id="broad-msg" rows="3" placeholder="Enter message for on-duty doctors and nursing staff..."></textarea>
      </div>

      <div class="form-group">
        <label class="form-label">Target Audience</label>
        <select class="form-control" id="broad-aud">
          <option>All Staff (Doctors, Nurses, Reception)</option>
          <option>Doctors & Medical Officers Only</option>
          <option>Nursing & Ward Staff</option>
          <option>Front Desk & Billing Cashiers</option>
        </select>
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="window._closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="submitBroadcast()">Send Broadcast Alert</button>
    `
  });
};

window.submitBroadcast = () => {
  const title = document.getElementById('broad-title')?.value;
  const msg = document.getElementById('broad-msg')?.value;

  if (!title) {
    showToast({ title: 'Title Required', message: 'Please enter announcement title.', type: 'warning' });
    return;
  }

  const feed = get('activityFeed') || [];
  feed.unshift({
    id: 'act-' + Date.now(),
    type: 'staff',
    icon: 'megaphone',
    color: 'blue',
    text: `📢 Announcement: ${title} — ${msg || ''}`,
    time: 'Just now'
  });

  closeModal();
  showToast({ title: 'Broadcast Sent', message: 'Alert delivered to all staff terminals.', type: 'success' });
  renderHospitalNotifications();
};
