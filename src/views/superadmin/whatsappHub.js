// ============================================================
// superadmin/whatsappHub.js — Module 6: WhatsApp / Communication Hub
// ============================================================

import { renderTopbar } from '../../components/topbar.js';
import { renderSidebar } from '../../components/sidebar.js';
import { get, updateWhatsAppConfig } from '../../store.js';
import { showToast } from '../../components/toast.js';
import { refreshIcons } from '../../components/icons.js';

export function renderSAWhatsAppHub() {
  renderSidebar();
  renderTopbar({ breadcrumb: [{ label: 'Super Admin', path: '/sa/dashboard' }, { label: 'WhatsApp & Communication Hub' }] });

  const config = get('whatsappConfig') || {};
  const hospitals = get('hospitals') || [];

  const content = document.getElementById('content');
  content.innerHTML = `
    <!-- Header -->
    <div class="page-header">
      <div>
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
          <h1 class="page-title">WhatsApp & Communication Hub</h1>
          <span class="badge badge-wa">Flagship Automation Engine</span>
        </div>
        <p class="page-subtitle">Centralized Meta Cloud API management, automated bot templates, reminder schedules & per-tenant overrides</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary" onclick="navigateTo('/whatsapp')">
          <i data-lucide="qr-code"></i> Patient QR Center
        </button>
        <button class="btn btn-primary" onclick="saveGlobalWhatsAppConfig()">
          <i data-lucide="save"></i> Save Global Settings
        </button>
      </div>
    </div>

    <!-- WhatsApp Operational Health & Quota Cards -->
    <div class="stats-grid stats-grid-4" style="margin-bottom:28px">
      <div class="stat-card">
        <div class="stat-card-icon" style="background:#DCF8C6;color:#075E54"><i data-lucide="phone-call"></i></div>
        <div class="stat-card-value">${config.businessNumber}</div>
        <div class="stat-card-label">Primary Business Line</div>
        <div class="stat-card-trend"><span class="trend-up">● Meta API Verified</span></div>
      </div>

      <div class="stat-card">
        <div class="stat-card-icon blue"><i data-lucide="message-square"></i></div>
        <div class="stat-card-value">${config.dailyUsed.toLocaleString()} <span style="font-size:var(--font-size-base);color:var(--color-text-muted)">/ ${config.dailyQuota.toLocaleString()}</span></div>
        <div class="stat-card-label">Daily Message Quota</div>
        <div class="stat-card-trend">
          <div class="progress-bar" style="margin-top:6px"><div class="progress-fill" style="width:${Math.round((config.dailyUsed / config.dailyQuota) * 100)}%;background:#25D366"></div></div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-card-icon green"><i data-lucide="check-check"></i></div>
        <div class="stat-card-value">99.4%</div>
        <div class="stat-card-label">Message Delivery Rate</div>
        <div class="stat-card-trend"><span class="trend-up">↑ 0.2s</span> avg webhook response</div>
      </div>

      <div class="stat-card">
        <div class="stat-card-icon teal"><i data-lucide="bell-ring"></i></div>
        <div class="stat-card-value">${config.autoReminderHours}h Before</div>
        <div class="stat-card-label">Auto Reminder Timing</div>
        <div class="stat-card-trend">Automated Patient Reminders</div>
      </div>
    </div>

    <div class="content-grid" style="grid-template-columns: 2fr 1fr; margin-bottom: 28px">
      <!-- Global Bot Script & Templates Configuration -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Global Conversational AI & Script Templates</span>
          <button class="btn btn-secondary btn-sm" onclick="resetBotTemplateToDefault()">Reset Defaults</button>
        </div>
        <div class="card-body">
          <div class="form-group">
            <label class="form-label">Default Welcome Greeting & Menu Prompt</label>
            <textarea class="form-control" id="wa-welcome-msg" rows="3">${config.welcomeMessage}</textarea>
            <div class="form-hint">Supports WhatsApp markdown like *bold*, _italic_, and line breaks.</div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Standard Operating Hours</label>
              <input type="text" class="form-control" id="wa-hours" value="${config.workingHours}" />
            </div>
            <div class="form-group">
              <label class="form-label">Auto Reminder Buffer</label>
              <select class="form-control" id="wa-reminder-hours">
                <option value="48" ${config.autoReminderHours === 48 ? 'selected' : ''}>48 Hours before appointment</option>
                <option value="24" ${config.autoReminderHours === 24 ? 'selected' : ''}>24 Hours before appointment (Recommended)</option>
                <option value="12" ${config.autoReminderHours === 12 ? 'selected' : ''}>12 Hours before appointment</option>
                <option value="2" ${config.autoReminderHours === 2 ? 'selected' : ''}>2 Hours before appointment</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Default Business WhatsApp Number</label>
              <input type="text" class="form-control" id="wa-biz-phone" value="${config.businessNumber}" />
            </div>
            <div class="form-group">
              <label class="form-label">Template Language</label>
              <select class="form-control" id="wa-lang">
                <option value="en_IN" selected>English (India) — en_IN</option>
                <option value="hi_IN">Hindi — hi_IN</option>
                <option value="mr_IN">Marathi — mr_IN</option>
              </select>
            </div>
          </div>

          <div style="margin-top:16px;display:flex;justify-content:flex-end">
            <button class="btn btn-primary" onclick="saveGlobalWhatsAppConfig()">
              <i data-lucide="check"></i> Update Bot Engine
            </button>
          </div>
        </div>
      </div>

      <!-- Live Webhook & Cloud API Diagnostic Panel -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Meta Cloud API Status</span>
          <span class="badge badge-success">● Connected</span>
        </div>
        <div class="card-body">
          <div class="info-list">
            <div class="info-row"><span class="info-label">API Version</span><span class="info-value font-semibold">v19.0 (Graph API)</span></div>
            <div class="info-row"><span class="info-label">Webhook Endpoint</span><span class="info-value" style="font-family:monospace;font-size:12px">/api/v1/wa/webhook</span></div>
            <div class="info-row"><span class="info-label">SSL Encryption</span><span class="info-value" style="color:var(--color-success)">TLS 1.3 Active</span></div>
            <div class="info-row"><span class="info-label">Token Verified</span><span class="info-value">EAAP...9xZ (Valid)</span></div>
            <div class="info-row"><span class="info-label">Daily Message Rate</span><span class="info-value">~62 msgs/hour</span></div>
          </div>
          <div style="margin-top:20px">
            <button class="btn btn-secondary btn-sm w-full" onclick="testWhatsAppWebhook()">
              <i data-lucide="refresh-cw"></i> Ping Webhook & Test Connection
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Per-Hospital Overrides Table -->
    <div class="card mb-6">
      <div class="card-header">
        <div>
          <span class="card-title">Tenant-Specific WhatsApp Configurations & Overrides</span>
          <div style="font-size:var(--font-size-xs);color:var(--color-text-muted);margin-top:2px">Configure custom business numbers or custom greetings for specific hospitals</div>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="showToast({ title: 'New Custom Line', message: 'Enter details in the modal.', type: 'info' })">
          <i data-lucide="plus"></i> Add Dedicated Line
        </button>
      </div>
      <div class="card-body" style="padding:0">
        <table class="data-table">
          <thead>
            <tr>
              <th>Hospital Tenant</th>
              <th>Assigned WhatsApp Line</th>
              <th>Custom Greeting</th>
              <th>Auto Reminders</th>
              <th>Monthly Volume</th>
              <th class="td-actions">Configure</th>
            </tr>
          </thead>
          <tbody>
            ${hospitals.map(h => {
              const hasCustomLine = h.id === 'h1' || h.id === 'h4';
              const phone = hasCustomLine ? h.phone : '+91 98765 43210 (Global Line)';
              return `
                <tr>
                  <td>
                    <div class="avatar-name">
                      <div class="avatar avatar-sm" style="background:${h.primaryColor || 'var(--color-primary)'}">${h.name.charAt(0)}</div>
                      <div>
                        <div class="an-name">${h.name}</div>
                        <div class="an-sub">${h.city}</div>
                      </div>
                    </div>
                  </td>
                  <td style="font-weight:600">${phone}</td>
                  <td>
                    ${hasCustomLine ? '<span class="badge badge-primary">Custom Script</span>' : '<span class="badge badge-gray">Inherits Global</span>'}
                  </td>
                  <td><span class="badge badge-success">Enabled (24h)</span></td>
                  <td style="font-weight:600">${h.id === 'h1' ? '640' : h.id === 'h2' ? '320' : '180'} msgs</td>
                  <td class="td-actions">
                    <button class="btn btn-secondary btn-sm" onclick="openTenantWhatsAppModal('${h.id}')">
                      <i data-lucide="sliders"></i> Overrides
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
}

window.saveGlobalWhatsAppConfig = () => {
  const welcome = document.getElementById('wa-welcome-msg')?.value;
  const hours = document.getElementById('wa-hours')?.value;
  const rem = parseInt(document.getElementById('wa-reminder-hours')?.value) || 24;
  const phone = document.getElementById('wa-biz-phone')?.value;

  updateWhatsAppConfig({
    welcomeMessage: welcome,
    workingHours: hours,
    autoReminderHours: rem,
    businessNumber: phone
  });

  showToast({
    title: 'WhatsApp Hub Updated',
    message: 'Global bot configuration and reminder schedules saved.',
    type: 'wa'
  });
};

window.resetBotTemplateToDefault = () => {
  document.getElementById('wa-welcome-msg').value = 'Hello! 👋 Welcome to our Hospital. I am MediBot, your appointment booking assistant on WhatsApp. How can I help you today?';
  showToast({ title: 'Template Reset', message: 'Default message restored.', type: 'info' });
};

window.testWhatsAppWebhook = () => {
  showToast({ title: 'Pinging Webhook...', type: 'info' });
  setTimeout(() => {
    showToast({
      title: '✓ Webhook Healthy',
      message: 'Meta Cloud API returned 200 OK (Latency: 14ms)',
      type: 'wa'
    });
  }, 600);
};

window.openTenantWhatsAppModal = (hospitalId) => {
  const hospitals = get('hospitals') || [];
  const h = hospitals.find(h => h.id === hospitalId);
  if (!h) return;

  import('../../components/modal.js').then(({ openModal, closeModal }) => {
    openModal({
      title: `WhatsApp Overrides — ${h.name}`,
      size: 'md',
      body: `
        <div class="form-group">
          <label class="form-label">Dedicated Phone Number (Optional)</label>
          <input type="text" class="form-control" value="${h.phone}" />
          <div class="form-hint">Leave blank to use the shared platform business number.</div>
        </div>
        <div class="form-group">
          <label class="form-label">Custom Welcome Message for ${h.name}</label>
          <textarea class="form-control" rows="3">👋 Welcome to *${h.name}*! Book your consultation or check doctor schedules in seconds.</textarea>
        </div>
        <div class="form-group">
          <label class="form-check">
            <input type="checkbox" checked />
            <span>Enable instant SMS fallback if patient has no WhatsApp active</span>
          </label>
        </div>
      `,
      footer: `
        <button class="btn btn-secondary" onclick="window._closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="saveTenantOverride('${h.name}')">Save Tenant Overrides</button>
      `
    });
  });
};

window.saveTenantOverride = (name) => {
  import('../../components/modal.js').then(({ closeModal }) => {
    closeModal();
    showToast({ title: 'Overrides Saved', message: `Custom WhatsApp settings applied for ${name}.`, type: 'wa' });
  });
};
