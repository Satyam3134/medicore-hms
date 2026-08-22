// ============================================================
// superadmin/support.js — Module 9: Support / Ticketing Helpdesk
// ============================================================

import { renderTopbar } from '../../components/topbar.js';
import { renderSidebar } from '../../components/sidebar.js';
import { get, updateTicketStatus, addTicketReply } from '../../store.js';
import { showToast } from '../../components/toast.js';
import { openDrawer, closeDrawer, openModal, closeModal } from '../../components/modal.js';
import { refreshIcons } from '../../components/icons.js';

export function renderSASupport() {
  renderSidebar();
  renderTopbar({ breadcrumb: [{ label: 'Super Admin', path: '/sa/dashboard' }, { label: 'Support & Helpdesk' }] });

  const tickets = get('supportTickets') || [];
  const openCount = tickets.filter(t => t.status === 'open').length;
  const inProgCount = tickets.filter(t => t.status === 'in-progress').length;
  const resolvedCount = tickets.filter(t => t.status === 'resolved').length;

  const content = document.getElementById('content');
  content.innerHTML = `
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Hospital Support & Helpdesk Queue</h1>
        <p class="page-subtitle">Centralized incident ticketing, feature requests, and WhatsApp bot troubleshooting for hospital tenants</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" onclick="openCreateTicketModal()">
          <i data-lucide="plus-circle"></i> Log Support Incident
        </button>
      </div>
    </div>

    <!-- Ticket Volume Counters -->
    <div class="stats-grid stats-grid-4" style="margin-bottom:28px">
      <div class="stat-card">
        <div class="stat-card-icon red"><i data-lucide="inbox"></i></div>
        <div class="stat-card-value">${openCount}</div>
        <div class="stat-card-label">Open Tickets</div>
        <div class="stat-card-trend" style="color:var(--color-danger)">Awaiting Initial Response</div>
      </div>

      <div class="stat-card">
        <div class="stat-card-icon amber"><i data-lucide="clock"></i></div>
        <div class="stat-card-value">${inProgCount}</div>
        <div class="stat-card-label">In Progress</div>
        <div class="stat-card-trend">Engineering & Ops Investigation</div>
      </div>

      <div class="stat-card">
        <div class="stat-card-icon green"><i data-lucide="check-circle-2"></i></div>
        <div class="stat-card-value">${resolvedCount}</div>
        <div class="stat-card-label">Resolved This Week</div>
        <div class="stat-card-trend"><span class="trend-up">↑ 100% SLA Met</span></div>
      </div>

      <div class="stat-card">
        <div class="stat-card-icon blue"><i data-lucide="zap"></i></div>
        <div class="stat-card-value">18 min</div>
        <div class="stat-card-label">Avg First Response Time</div>
        <div class="stat-card-trend"><span class="trend-up">Fast Turnaround</span></div>
      </div>
    </div>

    <!-- Tickets Table -->
    <div class="data-table-wrapper mb-6">
      <div class="table-toolbar">
        <div class="table-toolbar-left">
          <div class="table-search">
            <i data-lucide="search"></i>
            <input type="text" placeholder="Search by ticket #, subject or hospital..." id="ticket-search" oninput="filterTickets()" />
          </div>
          <select class="table-filter-select" id="ticket-status-filter" onchange="filterTickets()">
            <option value="">All Statuses</option>
            <option value="open">Open Only</option>
            <option value="in-progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
          <select class="table-filter-select" id="ticket-priority-filter" onchange="filterTickets()">
            <option value="">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div class="table-toolbar-right">
          <span style="font-size:var(--font-size-sm);color:var(--color-text-muted)">${tickets.length} Total Incidents</span>
        </div>
      </div>

      <div class="scroll-x">
        <table class="data-table">
          <thead>
            <tr>
              <th>Ticket #</th>
              <th>Hospital Tenant</th>
              <th>Subject & Requester</th>
              <th>Category</th>
              <th>Priority</th>
              <th>Assignee</th>
              <th>Status</th>
              <th class="td-actions">Resolve</th>
            </tr>
          </thead>
          <tbody id="ticket-tbody">
            ${renderTicketRows(tickets)}
          </tbody>
        </table>
      </div>
    </div>
  `;

  refreshIcons(content);
}

function renderTicketRows(list) {
  if (!list.length) {
    return `<tr><td colspan="8"><div class="empty-state"><div class="es-title">No tickets matching criteria</div></div></td></tr>`;
  }
  return list.map(t => {
    const isUrgent = t.priority === 'urgent';
    const isHigh = t.priority === 'high';
    const priorityBadge = isUrgent ? 'danger' : isHigh ? 'warning' : t.priority === 'medium' ? 'info' : 'gray';
    const statusBadge = t.status === 'open' ? 'danger' : t.status === 'in-progress' ? 'warning' : 'success';

    return `
      <tr onclick="openTicketDrawer('${t.id}')" style="cursor:pointer">
        <td style="font-family:monospace;font-weight:700;color:var(--color-primary)">${t.id}</td>
        <td>
          <div style="font-weight:600">${t.hospitalName}</div>
          <div style="font-size:var(--font-size-xs);color:var(--color-text-muted)">ID: ${t.hospitalId}</div>
        </td>
        <td>
          <div style="font-weight:600;max-width:320px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t.subject}</div>
          <div style="font-size:var(--font-size-xs);color:var(--color-text-muted)">By ${t.requesterName} · ${t.updatedAt}</div>
        </td>
        <td><span class="badge badge-gray badge-no-dot">${t.category}</span></td>
        <td><span class="badge badge-${priorityBadge}">${t.priority.toUpperCase()}</span></td>
        <td style="font-size:var(--font-size-sm);font-weight:500">${t.assignee}</td>
        <td><span class="badge badge-${statusBadge}">${t.status.toUpperCase()}</span></td>
        <td class="td-actions" onclick="event.stopPropagation()">
          <button class="btn btn-secondary btn-sm" onclick="openTicketDrawer('${t.id}')">
            <i data-lucide="message-square"></i> Open Thread
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

window.filterTickets = () => {
  const q = document.getElementById('ticket-search')?.value.toLowerCase() || '';
  const status = document.getElementById('ticket-status-filter')?.value || '';
  const priority = document.getElementById('ticket-priority-filter')?.value || '';
  const tickets = get('supportTickets') || [];

  const filtered = tickets.filter(t => {
    const matchQ = !q || t.id.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q) || t.hospitalName.toLowerCase().includes(q);
    const matchStatus = !status || t.status === status;
    const matchPriority = !priority || t.priority === priority;
    return matchQ && matchStatus && matchPriority;
  });

  const tbody = document.getElementById('ticket-tbody');
  if (tbody) {
    tbody.innerHTML = renderTicketRows(filtered);
    refreshIcons(tbody);
  }
};

window.openTicketDrawer = (id) => {
  const tickets = get('supportTickets') || [];
  const t = tickets.find(ticket => ticket.id === id);
  if (!t) return;

  openDrawer({
    title: `${t.id} — ${t.subject}`,
    body: `
      <!-- Incident Metadata -->
      <div style="background:var(--color-bg);border:1px solid var(--color-border);border-radius:var(--radius-md);padding:16px;margin-bottom:20px">
        <div class="info-list">
          <div class="info-row"><span class="info-label">Tenant</span><span class="info-value font-semibold">${t.hospitalName}</span></div>
          <div class="info-row"><span class="info-label">Requester</span><span class="info-value">${t.requesterName} (${t.email})</span></div>
          <div class="info-row"><span class="info-label">Category</span><span class="info-value">${t.category}</span></div>
          <div class="info-row">
            <span class="info-label">Priority & Status</span>
            <div style="display:flex;gap:6px">
              <span class="badge badge-${t.priority === 'urgent' ? 'danger' : 'warning'}">${t.priority.toUpperCase()}</span>
              <span class="badge badge-${t.status === 'open' ? 'danger' : t.status === 'in-progress' ? 'warning' : 'success'}">${t.status.toUpperCase()}</span>
            </div>
          </div>
          <div class="info-row"><span class="info-label">Assignee</span><span class="info-value font-semibold">${t.assignee}</span></div>
        </div>
      </div>

      <!-- Quick Action Status Change -->
      <div style="display:flex;gap:8px;margin-bottom:20px">
        <button class="btn btn-sm ${t.status === 'open' ? 'btn-primary' : 'btn-secondary'}" onclick="setTicketState('${t.id}', 'open')">Open</button>
        <button class="btn btn-sm ${t.status === 'in-progress' ? 'btn-primary' : 'btn-secondary'}" onclick="setTicketState('${t.id}', 'in-progress')">In Progress</button>
        <button class="btn btn-sm ${t.status === 'resolved' ? 'btn-success' : 'btn-secondary'}" onclick="setTicketState('${t.id}', 'resolved')">✓ Mark Resolved</button>
      </div>

      <!-- Message History Thread -->
      <div class="form-section-title">Incident Conversation Log</div>
      <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:24px">
        ${t.messages.map(m => `
          <div style="padding:14px;border-radius:12px;border:1px solid var(--color-border);background:${m.role === 'support' ? '#EBF4FF' : '#F8FAFC'}">
            <div style="display:flex;justify-content:space-between;margin-bottom:6px">
              <span style="font-size:var(--font-size-sm);font-weight:700;color:${m.role === 'support' ? 'var(--color-primary)' : 'var(--color-text)'}">
                ${m.sender} ${m.role === 'support' ? '(MediCore Support)' : '(Hospital Admin)'}
              </span>
              <span style="font-size:var(--font-size-xs);color:var(--color-text-light)">${m.time}</span>
            </div>
            <div style="font-size:var(--font-size-base);color:var(--color-text);line-height:1.45">${m.text}</div>
          </div>
        `).join('')}
      </div>

      <!-- Reply Box -->
      <div class="form-group">
        <label class="form-label">Send Official Support Reply</label>
        <textarea class="form-control" id="drawer-ticket-reply" placeholder="Type your response to the hospital administration..."></textarea>
      </div>
      <button class="btn btn-primary w-full" onclick="sendTicketReply('${t.id}')">
        <i data-lucide="send"></i> Dispatch Response to Hospital
      </button>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="window._closeDrawer()">Close Thread</button>
    `
  });
};

window.setTicketState = (id, status) => {
  updateTicketStatus(id, status);
  showToast({ title: 'Status Updated', message: `Ticket status set to ${status.toUpperCase()}.`, type: 'info' });
  closeDrawer();
  renderSASupport();
};

window.sendTicketReply = (id) => {
  const input = document.getElementById('drawer-ticket-reply');
  const text = input?.value.trim();
  if (!text) {
    showToast({ title: 'Empty Reply', message: 'Please enter a message.', type: 'warning' });
    return;
  }
  addTicketReply(id, { text });
  showToast({ title: 'Reply Dispatched', message: 'Notification sent to hospital administrator.', type: 'success' });
  closeDrawer();
  renderSASupport();
};

window.openCreateTicketModal = () => {
  const hospitals = get('hospitals') || [];
  openModal({
    title: 'Log New Support Incident',
    size: 'md',
    body: `
      <div class="form-group">
        <label class="form-label">Hospital Tenant <span class="required">*</span></label>
        <select class="form-control" id="new-t-hosp">
          ${hospitals.map(h => `<option value="${h.id}">${h.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Subject / Incident Summary <span class="required">*</span></label>
        <input type="text" class="form-control" id="new-t-subj" placeholder="e.g. WhatsApp Bot Token Delays" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Category</label>
          <select class="form-control" id="new-t-cat">
            <option>WhatsApp & Bot</option>
            <option>Billing</option>
            <option>Customization</option>
            <option>Data Sync</option>
            <option>General Support</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Priority</label>
          <select class="form-control" id="new-t-pri">
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Incident Details</label>
        <textarea class="form-control" id="new-t-desc" rows="3" placeholder="Describe the problem reported by the tenant..."></textarea>
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="window._closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="submitCreateTicket()">Create Incident Ticket</button>
    `
  });
};

window.submitCreateTicket = () => {
  const hospId = document.getElementById('new-t-hosp')?.value;
  const subj = document.getElementById('new-t-subj')?.value;
  const cat = document.getElementById('new-t-cat')?.value;
  const pri = document.getElementById('new-t-pri')?.value;
  const desc = document.getElementById('new-t-desc')?.value;

  if (!subj) {
    showToast({ title: 'Required Field', message: 'Please enter a ticket subject.', type: 'warning' });
    return;
  }

  const hospitals = get('hospitals') || [];
  const h = hospitals.find(h => h.id === hospId);
  const tickets = get('supportTickets') || [];
  const newId = `TICK-${Math.floor(Math.random() * 900) + 1000}`;

  tickets.unshift({
    id: newId,
    hospitalId: hospId,
    hospitalName: h?.name || 'Hospital',
    requesterName: h?.adminName || 'Admin',
    email: h?.email || 'admin@hospital.com',
    subject: subj,
    category: cat,
    priority: pri,
    status: 'open',
    assignee: 'Tariq Mansoor',
    createdAt: 'Just now',
    updatedAt: 'Just now',
    messages: [{ sender: 'Super Admin', role: 'support', text: desc || subj, time: 'Just now' }]
  });

  closeModal();
  showToast({ title: 'Ticket Created', message: `${newId} logged successfully.`, type: 'success' });
  renderSASupport();
};
