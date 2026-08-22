// ============================================================
// hospitaladmin/settings.js — Module 14: Hospital-Level Settings
// ============================================================

import { renderTopbar } from '../../components/topbar.js';
import { renderSidebar } from '../../components/sidebar.js';
import { get, updateHospitalSettings } from '../../store.js';
import { showToast } from '../../components/toast.js';
import { refreshIcons } from '../../components/icons.js';

let activeSettingsTab = 'general'; // 'general' | 'whatsapp' | 'permissions'

export function renderHospitalSettings() {
  renderSidebar();
  renderTopbar({
    breadcrumb: [
      { label: 'Hospital Admin', path: '/ha/dashboard' },
      { label: 'Hospital Settings & Branding' }
    ]
  });

  const hospital = get('hospitals')?.find(h => h.id === get('currentHospitalId')) || get('hospitals')?.[0];

  const content = document.getElementById('content');
  content.innerHTML = `
    <!-- Header -->
    <div class="page-header">
      <div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
          <h1 class="page-title">Hospital Workspace Settings</h1>
          <span class="badge badge-primary">Tenant Configuration</span>
        </div>
        <p class="page-subtitle">Configure hospital branding, OPD consultation hours, WhatsApp bot greetings, and staff access roles</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" onclick="saveHospitalSettings()">
          <i data-lucide="check"></i> Save Settings Changes
        </button>
      </div>
    </div>

    <!-- Settings Sub-Tabs -->
    <div class="tabs mb-6">
      <button class="tab-btn ${activeSettingsTab === 'general' ? 'active' : ''}" onclick="setHospTab('general')">
        <i data-lucide="building"></i> Hospital Profile & Branding
      </button>
      <button class="tab-btn ${activeSettingsTab === 'whatsapp' ? 'active' : ''}" onclick="setHospTab('whatsapp')">
        <i data-lucide="message-square"></i> WhatsApp Bot Overrides
      </button>
      <button class="tab-btn ${activeSettingsTab === 'permissions' ? 'active' : ''}" onclick="setHospTab('permissions')">
        <i data-lucide="shield"></i> Roles & Staff Permissions
      </button>
    </div>

    <!-- TAB 1: GENERAL & BRANDING -->
    ${activeSettingsTab === 'general' ? `
      <div class="card mb-6">
        <div class="card-header">
          <span class="card-title">Hospital Identity & Communication Info</span>
        </div>
        <div class="card-body">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Hospital Name <span class="required">*</span></label>
              <input type="text" class="form-control" id="h-set-name" value="${hospital?.name || ''}" />
            </div>
            <div class="form-group">
              <label class="form-label">Hospital Classification Type</label>
              <select class="form-control" id="h-set-type">
                <option ${hospital?.type === 'Multi-Specialty' ? 'selected' : ''}>Multi-Specialty</option>
                <option ${hospital?.type === 'Single-Specialty' ? 'selected' : ''}>Single-Specialty</option>
                <option ${hospital?.type === 'Clinic' ? 'selected' : ''}>Clinic / Daycare</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Contact Phone <span class="required">*</span></label>
              <input type="tel" class="form-control" id="h-set-phone" value="${hospital?.phone || ''}" />
            </div>
            <div class="form-group">
              <label class="form-label">Official Email <span class="required">*</span></label>
              <input type="email" class="form-control" id="h-set-email" value="${hospital?.email || ''}" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Campus Physical Address</label>
            <input type="text" class="form-control" id="h-set-address" value="${hospital?.address || ''}" />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Primary Brand Theme Color</label>
              <div style="display:flex;align-items:center;gap:12px">
                <input type="color" id="h-set-color" value="${hospital?.primaryColor || '#0B5FA5'}" style="width:50px;height:44px;border-radius:8px;border:1px solid var(--color-border);cursor:pointer" />
                <span style="font-family:monospace;font-size:13px;font-weight:700">${hospital?.primaryColor || '#0B5FA5'}</span>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">NABH / Clinical Accreditation #</label>
              <input type="text" class="form-control" value="NABH-HOSP-2024-8821" />
            </div>
          </div>
        </div>
      </div>
    ` : ''}

    <!-- TAB 2: WHATSAPP BOT OVERRIDES -->
    ${activeSettingsTab === 'whatsapp' ? `
      <div class="card mb-6">
        <div class="card-header">
          <span class="card-title">Hospital WhatsApp Bot Configuration</span>
        </div>
        <div class="card-body">
          <div class="form-group">
            <label class="form-label">Patient Welcome Greeting Message</label>
            <textarea class="form-control" id="h-set-wa-welcome" rows="3">Hello! 👋 Welcome to ${hospital?.name}. I'm your appointment assistant. Would you like to book a consultation or check waiting queue?</textarea>
            <div class="form-hint">This greeting appears first when patients scan your hospital QR standee.</div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">OPD Working Hours</label>
              <input type="text" class="form-control" id="h-set-wa-hours" value="08:00 AM – 08:00 PM (Mon–Sat)" />
            </div>
            <div class="form-group">
              <label class="form-label">Emergency Helpline Number</label>
              <input type="tel" class="form-control" value="+91 22 6789 9999" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-check">
              <input type="checkbox" checked />
              <span style="font-size:13px;font-weight:600">Send automated WhatsApp appointment reminders 24 hours before consultation</span>
            </label>
          </div>

          <div class="form-group">
            <label class="form-check">
              <input type="checkbox" checked />
              <span style="font-size:13px;font-weight:600">Deliver verified lab report PDFs directly to patient's WhatsApp number</span>
            </label>
          </div>
        </div>
      </div>
    ` : ''}

    <!-- TAB 3: ROLES & PERMISSIONS -->
    ${activeSettingsTab === 'permissions' ? `
      <div class="card mb-6">
        <div class="card-header">
          <span class="card-title">Role Permission Matrix</span>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>System Capability / Feature</th>
                <th>Hospital Admin</th>
                <th>Doctor</th>
                <th>Receptionist</th>
                <th>Nurse / Staff</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>View Patient EMR Records</td><td>✓ Full Access</td><td>✓ My Patients</td><td>✓ Demographics Only</td><td>✓ Vitals Only</td></tr>
              <tr><td>Write Prescriptions & Notes</td><td>✓ Full Access</td><td>✓ Active Consultations</td><td>— Restricted</td><td>— Restricted</td></tr>
              <tr><td>Manage OPD Token Queue</td><td>✓ Full Access</td><td>✓ Call Token</td><td>✓ Full Control</td><td>✓ Read Only</td></tr>
              <tr><td>Bed Admission & Discharge</td><td>✓ Full Access</td><td>✓ Recommend Discharge</td><td>✓ Admit Routine</td><td>✓ Ward Status</td></tr>
              <tr><td>Generate Patient Bills</td><td>✓ Full Access</td><td>— Restricted</td><td>✓ Issue OPD Bill</td><td>— Restricted</td></tr>
              <tr><td>Modify Hospital Settings</td><td>✓ Full Access</td><td>— Restricted</td><td>— Restricted</td><td>— Restricted</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    ` : ''}
  `;

  refreshIcons(content);
}

window.setHospTab = (tab) => {
  activeSettingsTab = tab;
  renderHospitalSettings();
};

window.saveHospitalSettings = () => {
  const name = document.getElementById('h-set-name')?.value;
  const phone = document.getElementById('h-set-phone')?.value;
  const email = document.getElementById('h-set-email')?.value;
  const address = document.getElementById('h-set-address')?.value;
  const primaryColor = document.getElementById('h-set-color')?.value;

  updateHospitalSettings({
    name: name || undefined,
    phone: phone || undefined,
    email: email || undefined,
    address: address || undefined,
    primaryColor: primaryColor || undefined
  });

  showToast({ title: 'Settings Saved', message: 'Hospital configuration and branding updated.', type: 'success' });
  renderHospitalSettings();
};
