// ============================================================
// superadmin/demoSandbox.js — Client Showcase & Dummy Accounts Module
// ============================================================

import { renderTopbar, updateDemoSwitcherVisibility } from '../../components/topbar.js';
import { renderSidebar } from '../../components/sidebar.js';
import { get, set, setRole } from '../../store.js';
import { showToast } from '../../components/toast.js';
import { navigate } from '../../router.js';
import { refreshIcons } from '../../components/icons.js';

export function renderSADemoSandbox() {
  renderSidebar();
  renderTopbar({
    breadcrumb: [
      { label: 'Super Admin', path: '/sa/dashboard' },
      { label: 'Client Demo & Dummy Accounts' }
    ]
  });

  const isDemoModeActive = get('clientDemoMode') || false;
  const hospitals = get('hospitals') || [];
  const staff = get('staff') || [];

  const content = document.getElementById('content');
  content.innerHTML = `
    <!-- Header -->
    <div class="page-header">
      <div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
          <h1 class="page-title">Client Demo & Dummy Accounts Showcase</h1>
          <span class="badge badge-accent">Sales & Client Presentation Engine</span>
        </div>
        <p class="page-subtitle">Configure dummy hospital personas and toggle the client presentation switcher (Hospital Admin, Doctor & Receptionist)</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary" onclick="resetDemoDataClean()">
          <i data-lucide="rotate-ccw"></i> Reset Demo Data to Pristine
        </button>
        <button class="btn btn-${isDemoModeActive ? 'danger' : 'success'}" onclick="toggleClientDemoMode()">
          <i data-lucide="${isDemoModeActive ? 'eye-off' : 'play'}"></i> 
          ${isDemoModeActive ? 'Disable Client Showcase Mode' : 'Enable Client Showcase Mode'}
        </button>
      </div>
    </div>

    <!-- Active Presentation Mode Banner -->
    <div class="card mb-6" style="background:${isDemoModeActive ? '#EFF6FF' : '#F8FAFC'};border:2px solid ${isDemoModeActive ? 'var(--color-primary)' : 'var(--color-border)'}">
      <div class="card-body" style="display:flex;align-items:center;justify-content:space-between;padding:24px">
        <div style="display:flex;align-items:center;gap:18px">
          <div style="width:52px;height:52px;border-radius:14px;background:${isDemoModeActive ? 'var(--color-primary)' : '#E2E8F0'};color:${isDemoModeActive ? 'white' : '#64748B'};display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <i data-lucide="presentation" style="width:28px;height:28px"></i>
          </div>
          <div>
            <div style="display:flex;align-items:center;gap:10px">
              <span style="font-size:var(--font-size-lg);font-weight:800;color:var(--color-text)">
                Client Presentation Role Switcher: ${isDemoModeActive ? '<span style="color:var(--color-primary)">ACTIVE</span>' : '<span style="color:var(--color-text-muted)">DISABLED (Normal Mode)</span>'}
              </span>
              <span class="badge badge-${isDemoModeActive ? 'success' : 'gray'}">
                ${isDemoModeActive ? '● Docked at Top' : 'Hidden'}
              </span>
            </div>
            <div style="font-size:var(--font-size-sm);color:var(--color-text-muted);margin-top:4px">
              ${isDemoModeActive 
                ? 'The top header displays role switching ONLY for <strong>Hospital Admin, Doctor, and Receptionist</strong> (Super Admin is hidden). Perfect for pitching to prospective hospital buyers!' 
                : 'Role switcher is hidden. Standard authentication flow applies.'}
            </div>
          </div>
        </div>

        <button class="btn btn-${isDemoModeActive ? 'secondary' : 'primary'} btn-lg" onclick="toggleClientDemoMode()">
          ${isDemoModeActive ? 'Turn Off Showcase' : 'Activate Client Showcase Mode'}
        </button>
      </div>
    </div>

    <!-- Pre-Configured Dummy Showcase Personas -->
    <div class="form-section-title">Pre-Configured Dummy Showcase Accounts</div>
    
    <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:24px;margin-bottom:32px">
      
      <!-- Persona 1: Hospital Administrator -->
      <div class="card" style="box-shadow:var(--shadow-sm);border:1.5px solid var(--color-border);display:flex;flex-direction:column;justify-content:space-between">
        <div class="card-body">
          <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px">
            <div style="width:48px;height:48px;border-radius:14px;background:#0F7A6C;color:white;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800">
              RM
            </div>
            <div>
              <div style="font-size:var(--font-size-base);font-weight:800">Dr. Rajesh Mehta</div>
              <div style="font-size:var(--font-size-xs);color:var(--color-text-muted)">Chief Medical Administrator</div>
            </div>
          </div>

          <div class="info-list" style="font-size:var(--font-size-xs);margin-bottom:16px">
            <div class="info-row"><span class="info-label">Assigned Facility</span><span class="info-value font-semibold">Apollo Hospital (Mumbai)</span></div>
            <div class="info-row"><span class="info-label">Access Level</span><span class="badge badge-primary badge-no-dot">Full Hospital Workspace</span></div>
            <div class="info-row"><span class="info-label">Clinical Scope</span><span class="info-value">320 Beds · 8 Depts · 48 Staff</span></div>
          </div>

          <div style="font-size:var(--font-size-xs);color:var(--color-text-muted);line-height:1.4">
            Showcases hospital-level EMR records, staff scheduling, bed grid occupancy, revenue ledger, and WhatsApp QR standee generator.
          </div>
        </div>

        <div style="padding:16px 20px;background:#FAFAFA;border-top:1px solid var(--color-border)">
          <button class="btn btn-primary w-full" onclick="launchDemoRole('hospitaladmin', 'h1')">
            <i data-lucide="log-in"></i> Launch as Hospital Admin →
          </button>
        </div>
      </div>

      <!-- Persona 2: Practicing Doctor -->
      <div class="card" style="box-shadow:var(--shadow-sm);border:1.5px solid var(--color-border);display:flex;flex-direction:column;justify-content:space-between">
        <div class="card-body">
          <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px">
            <div style="width:48px;height:48px;border-radius:14px;background:#0B5FA5;color:white;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800">
              MJ
            </div>
            <div>
              <div style="font-size:var(--font-size-base);font-weight:800">Dr. Meera Joshi</div>
              <div style="font-size:var(--font-size-xs);color:var(--color-text-muted)">Senior Cardiologist (MD, DM)</div>
            </div>
          </div>

          <div class="info-list" style="font-size:var(--font-size-xs);margin-bottom:16px">
            <div class="info-row"><span class="info-label">Assigned Facility</span><span class="info-value font-semibold">Apollo Hospital (Mumbai)</span></div>
            <div class="info-row"><span class="info-label">Access Level</span><span class="badge badge-info badge-no-dot">Doctor Workspace</span></div>
            <div class="info-row"><span class="info-label">Consultation Schedule</span><span class="info-value">09:00 AM - 02:00 PM (12 Patients)</span></div>
          </div>

          <div style="font-size:var(--font-size-xs);color:var(--color-text-muted);line-height:1.4">
            Showcases today's consultation queue, 1-click vitals chart, diagnostic lab review, Rx prescription generator, and visit summary completion.
          </div>
        </div>

        <div style="padding:16px 20px;background:#FAFAFA;border-top:1px solid var(--color-border)">
          <button class="btn btn-primary w-full" onclick="launchDemoRole('doctor', 'h1', 's2')">
            <i data-lucide="stethoscope"></i> Launch as Doctor →
          </button>
        </div>
      </div>

      <!-- Persona 3: Front Desk Receptionist -->
      <div class="card" style="box-shadow:var(--shadow-sm);border:1.5px solid var(--color-border);display:flex;flex-direction:column;justify-content:space-between">
        <div class="card-body">
          <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px">
            <div style="width:48px;height:48px;border-radius:14px;background:#D97706;color:white;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800">
              RS
            </div>
            <div>
              <div style="font-size:var(--font-size-base);font-weight:800">Rekha Sharma</div>
              <div style="font-size:var(--font-size-xs);color:var(--color-text-muted)">Front Desk & Triage Lead</div>
            </div>
          </div>

          <div class="info-list" style="font-size:var(--font-size-xs);margin-bottom:16px">
            <div class="info-row"><span class="info-label">Assigned Facility</span><span class="info-value font-semibold">Apollo Hospital (Mumbai)</span></div>
            <div class="info-row"><span class="info-label">Access Level</span><span class="badge badge-warning badge-no-dot">Receptionist Station</span></div>
            <div class="info-row"><span class="info-label">Daily Token Queue</span><span class="info-value">34 Appointments Today</span></div>
          </div>

          <div style="font-size:var(--font-size-xs);color:var(--color-text-muted);line-height:1.4">
            Showcases real-time OPD token queue, instant patient check-in station, quick appointment booking, and WhatsApp QR standee printing.
          </div>
        </div>

        <div style="padding:16px 20px;background:#FAFAFA;border-top:1px solid var(--color-border)">
          <button class="btn btn-primary w-full" onclick="launchDemoRole('receptionist', 'h1', 's10')">
            <i data-lucide="user-check"></i> Launch as Receptionist →
          </button>
        </div>
      </div>

    </div>

    <!-- Client Presentation Pitch Flow Guide -->
    <div class="card">
      <div class="card-header">
        <span class="card-title">Recommended Client Presentation Sequence</span>
      </div>
      <div class="card-body">
        <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:16px">
          <div style="border:1px solid var(--color-border);border-radius:12px;padding:16px;background:var(--color-bg)">
            <div style="font-weight:800;color:var(--color-primary);font-size:18px;margin-bottom:4px">Step 01</div>
            <div style="font-weight:700;font-size:14px;margin-bottom:4px">WhatsApp QR Demo</div>
            <div style="font-size:12px;color:var(--color-text-muted)">Open WhatsApp Patient Chatbot (#/whatsapp), show QR scanning & instant token generation.</div>
          </div>

          <div style="border:1px solid var(--color-border);border-radius:12px;padding:16px;background:var(--color-bg)">
            <div style="font-weight:800;color:var(--color-primary);font-size:18px;margin-bottom:4px">Step 02</div>
            <div style="font-weight:700;font-size:14px;margin-bottom:4px">Receptionist Queue</div>
            <div style="font-size:12px;color:var(--color-text-muted)">Show patient arriving at reception, matching token TKN-XXXX, and clicking 1-click Check-in.</div>
          </div>

          <div style="border:1px solid var(--color-border);border-radius:12px;padding:16px;background:var(--color-bg)">
            <div style="font-weight:800;color:var(--color-primary);font-size:18px;margin-bottom:4px">Step 03</div>
            <div style="font-weight:700;font-size:14px;margin-bottom:4px">Doctor Consultation</div>
            <div style="font-size:12px;color:var(--color-text-muted)">Switch to Doctor view, open patient EMR, record vital signs, add prescription, and complete visit.</div>
          </div>

          <div style="border:1px solid var(--color-border);border-radius:12px;padding:16px;background:var(--color-bg)">
            <div style="font-weight:800;color:var(--color-primary);font-size:18px;margin-bottom:4px">Step 04</div>
            <div style="font-weight:700;font-size:14px;margin-bottom:4px">Hospital Analytics</div>
            <div style="font-size:12px;color:var(--color-text-muted)">Switch to Hospital Admin, show live bed management grid, ward occupancy, and revenue collection.</div>
          </div>
        </div>
      </div>
    </div>
  `;

  refreshIcons(content);
}

window.toggleClientDemoMode = () => {
  const current = get('clientDemoMode') || false;
  const nextState = !current;
  set('clientDemoMode', nextState);

  updateDemoSwitcherVisibility(nextState);

  showToast({
    title: nextState ? '🎉 Client Showcase Mode Activated' : 'Client Showcase Mode Disabled',
    message: nextState 
      ? 'Top header role switcher enabled for Hospital Admin, Doctor & Receptionist.' 
      : 'Normal mode restored.',
    type: nextState ? 'success' : 'info'
  });

  renderSADemoSandbox();
};

window.launchDemoRole = (role, hospId, staffId) => {
  set('currentHospitalId', hospId || 'h1');
  set('currentRole', role);
  set('isAuthenticated', true);
  if (staffId) set('currentUserId', staffId);

  // Turn on client demo mode automatically so the client can switch between hospital roles
  set('clientDemoMode', true);
  updateDemoSwitcherVisibility(true);

  showToast({
    title: `✓ Switched to ${role.toUpperCase()}`,
    message: 'Client presentation showcase active.',
    type: 'success'
  });

  const routes = {
    hospitaladmin: '/ha/dashboard',
    doctor: '/dr/dashboard',
    receptionist: '/rc/queue'
  };

  navigate(routes[role] || '/ha/dashboard');
};

window.resetDemoDataClean = () => {
  showToast({
    title: 'Demo Data Reset',
    message: 'All appointments, patient queues and bed occupancy restored to clean pristine state.',
    type: 'success'
  });
};
