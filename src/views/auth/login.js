// ============================================================
// auth/login.js — Enterprise Healthcare Login Portal
// ============================================================

import { setRole, set, get } from '../../store.js';
import { navigate } from '../../router.js';
import { showToast } from '../../components/toast.js';
import { refreshIcons } from '../../components/icons.js';

let activeLoginTab = 'hospital'; // 'hospital' | 'superadmin'

export function renderLogin() {
  document.body.classList.remove('has-demo-switcher');
  document.body.classList.add('is-login');

  // Hide main app chrome for login view
  const sidebar = document.getElementById('sidebar');
  const topbar = document.getElementById('topbar');
  const roleSwitcher = document.getElementById('role-switcher-bar');

  if (sidebar) sidebar.style.display = 'none';
  if (topbar) topbar.style.display = 'none';
  if (roleSwitcher) roleSwitcher.style.display = 'none';

  const content = document.getElementById('content');
  if (!content) return;

  content.removeAttribute('style');
  content.style.padding = '0';
  content.style.margin = '0';
  content.style.maxWidth = '100%';

  const hospitals = get('hospitals') || [];

  content.innerHTML = `
    <div style="min-height:100vh;display:grid;grid-template-columns:1.1fr 0.9fr;background:linear-gradient(135deg, #0B5FA5 0%, #063660 100%);color:white;position:relative">
      
      <!-- Left Hero Column -->
      <div style="padding:60px 80px;display:flex;flex-direction:column;justify-content:space-between;position:relative;overflow:hidden">
        
        <!-- Background Ambient Glow -->
        <div style="position:absolute;top:-100px;left:-100px;width:400px;height:400px;border-radius:50%;background:rgba(255,255,255,0.06);filter:blur(60px);pointer-events:none"></div>
        <div style="position:absolute;bottom:-80px;right:-80px;width:350px;height:350px;border-radius:50%;background:rgba(15,122,108,0.3);filter:blur(50px);pointer-events:none"></div>

        <div>
          <!-- Logo -->
          <div style="display:flex;align-items:center;gap:14px;margin-bottom:48px">
            <div style="width:48px;height:48px;border-radius:14px;background:white;color:var(--color-primary);display:flex;align-items:center;justify-content:center;box-shadow:0 8px 20px rgba(0,0,0,0.15)">
              <i data-lucide="cross" style="width:28px;height:28px"></i>
            </div>
            <div>
              <div style="font-size:24px;font-weight:800;letter-spacing:-0.02em">MediCore HMS</div>
              <div style="font-size:12px;opacity:0.8;text-transform:uppercase;letter-spacing:0.08em">Enterprise Healthcare OS</div>
            </div>
          </div>

          <!-- Hero Value Statement -->
          <h1 style="font-size:42px;font-weight:800;line-height:1.2;margin-bottom:20px;letter-spacing:-0.03em">
            Multi-Tenant Clinical Operations & WhatsApp Intelligence
          </h1>
          <p style="font-size:18px;opacity:0.85;line-height:1.6;max-width:560px;margin-bottom:36px">
            A unified operating platform for hospital administrators, practicing physicians, front desk receptionists, and enterprise health networks.
          </p>

          <!-- Core Feature Bullets -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;max-width:560px">
            <div style="background:rgba(255,255,255,0.08);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.12);border-radius:14px;padding:16px">
              <div style="font-size:20px;margin-bottom:6px">🏥</div>
              <div style="font-weight:700;font-size:15px;margin-bottom:2px">Isolated Tenant DBs</div>
              <div style="font-size:12px;opacity:0.75">Dedicated schema partitions & automated cron backups</div>
            </div>
            <div style="background:rgba(255,255,255,0.08);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.12);border-radius:14px;padding:16px">
              <div style="font-size:20px;margin-bottom:6px">📱</div>
              <div style="font-weight:700;font-size:15px;margin-bottom:2px">WhatsApp Patient Bot</div>
              <div style="font-size:12px;opacity:0.75">Zero app-download QR booking & token engine</div>
            </div>
          </div>
        </div>

        <!-- Compliance Footer -->
        <div style="display:flex;align-items:center;gap:24px;opacity:0.75;font-size:12px">
          <span>🔒 256-Bit TLS 1.3 Encryption</span>
          <span>🛡️ HIPAA & DISHA Compliant</span>
          <span>⚡ 99.98% High Availability</span>
        </div>
      </div>

      <!-- Right Login Card Column -->
      <div style="background:#FFFFFF;color:var(--color-text);padding:60px 50px;display:flex;flex-direction:column;justify-content:center;box-shadow:-10px 0 30px rgba(0,0,0,0.15)">
        <div style="max-width:440px;width:100%;margin:0 auto">
          
          <!-- Tab Switcher: Hospital Portal vs Super Admin -->
          <div style="display:grid;grid-template-columns:1fr 1fr;background:#F1F5F9;padding:4px;border-radius:12px;margin-bottom:28px">
            <button type="button" class="btn btn-sm ${activeLoginTab === 'hospital' ? 'btn-primary' : 'btn-secondary'}" 
              style="border:none;border-radius:9px;font-weight:700" 
              onclick="setAuthTab('hospital')">
              <i data-lucide="building-2"></i> Hospital Portal
            </button>
            <button type="button" class="btn btn-sm ${activeLoginTab === 'superadmin' ? 'btn-primary' : 'btn-secondary'}" 
              style="border:none;border-radius:9px;font-weight:700" 
              onclick="setAuthTab('superadmin')">
              <i data-lucide="shield"></i> Super Admin
            </button>
          </div>

          <!-- HOSPITAL PORTAL LOGIN (Single Login for Admin, Doctor, Receptionist) -->
          ${activeLoginTab === 'hospital' ? `
            <div style="margin-bottom:24px">
              <h2 style="font-size:26px;font-weight:800;color:var(--color-text);margin-bottom:6px">Sign In to Hospital Portal</h2>
              <p style="font-size:var(--font-size-sm);color:var(--color-text-muted)">
                Unified single login for Hospital Administrators, Doctors, and Front Desk Staff
              </p>
            </div>

            <form onsubmit="handleHospitalLogin(event)">
              <div class="form-group">
                <label class="form-label">Hospital Entity</label>
                <select class="form-control" id="login-hosp-id">
                  ${hospitals.map(h => `<option value="${h.id}">${h.name} (${h.city})</option>`).join('')}
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Staff Email / Employee ID <span class="required">*</span></label>
                <input type="email" class="form-control" id="login-hosp-email" value="rajesh.mehta@apollomumbai.com" placeholder="doctor@hospital.com" required />
              </div>

              <div class="form-group">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                  <label class="form-label" style="margin:0">Password <span class="required">*</span></label>
                  <a href="javascript:void(0)" onclick="showToast({ title: 'Password Reset', message: 'Contact hospital super administrator.', type: 'info' })" style="font-size:12px;color:var(--color-primary);font-weight:600">Forgot?</a>
                </div>
                <input type="password" class="form-control" id="login-hosp-pass" value="Welcome@123" required />
              </div>

              <div class="form-group">
                <label class="form-label">Login Role Context</label>
                <select class="form-control" id="login-hosp-role">
                  <option value="hospitaladmin">Hospital Administrator (Full Workspace)</option>
                  <option value="doctor">Practicing Doctor (Doctor Dashboard)</option>
                  <option value="receptionist">Receptionist / Front Desk (Queue & Token Station)</option>
                </select>
              </div>

              <button type="submit" class="btn btn-primary btn-lg w-full" style="margin-top:10px;height:50px">
                <i data-lucide="log-in"></i> Sign In to Hospital Workspace
              </button>
            </form>

            <!-- Quick 1-Click Role Login Presets -->
            <div style="margin-top:28px;border-top:1px solid var(--color-border);padding-top:20px">
              <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--color-text-light);letter-spacing:0.06em;margin-bottom:12px">
                ⚡ Quick 1-Click Role Logins
              </div>
              <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:8px">
                <button type="button" class="btn btn-secondary btn-sm" onclick="quickLoginRole('hospitaladmin', 'Dr. Rajesh Mehta', 'rajesh.mehta@apollomumbai.com', 'h1')">
                  Admin
                </button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="quickLoginRole('doctor', 'Dr. Meera Joshi', 'meera.joshi@apollomumbai.com', 'h1')">
                  Doctor
                </button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="quickLoginRole('receptionist', 'Rekha Sharma', 'rekha.sharma@apollomumbai.com', 'h1')">
                  Receptionist
                </button>
              </div>
            </div>
          ` : `
            <!-- SUPER ADMIN PORTAL LOGIN -->
            <div style="margin-bottom:24px">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
                <h2 style="font-size:26px;font-weight:800;color:var(--color-text)">Super Admin Root Login</h2>
                <span class="badge badge-primary">Master Access</span>
              </div>
              <p style="font-size:var(--font-size-sm);color:var(--color-text-muted)">
                Restricted root access for MediCore platform owners and cloud operations
              </p>
            </div>

            <form onsubmit="handleSuperAdminLogin(event)">
              <div class="form-group">
                <label class="form-label">Platform Operator Email <span class="required">*</span></label>
                <input type="email" class="form-control" id="login-sa-email" value="admin@medicore.io" required />
              </div>

              <div class="form-group">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                  <label class="form-label" style="margin:0">Master Passphrase <span class="required">*</span></label>
                  <span class="badge badge-success" style="font-size:11px">2FA Enforced</span>
                </div>
                <input type="password" class="form-control" id="login-sa-pass" value="SuperAdmin@2026" required />
              </div>

              <div class="form-group">
                <label class="form-check">
                  <input type="checkbox" checked disabled />
                  <span style="font-size:12px">Hardware Authenticator Token Verified (Session Key Active)</span>
                </label>
              </div>

              <button type="submit" class="btn btn-primary btn-lg w-full" style="margin-top:10px;height:50px">
                <i data-lucide="shield-check"></i> Authenticate & Enter Command Center
              </button>
            </form>

            <div style="margin-top:24px;border-top:1px solid var(--color-border);padding-top:16px;font-size:12px;color:var(--color-text-muted);text-align:center">
              Protected by multi-tenant cryptographic partition isolation.
            </div>
          `}
        </div>
      </div>
    </div>
  `;

  refreshIcons(content);
}

window.setAuthTab = (tab) => {
  activeLoginTab = tab;
  renderLogin();
};

window.handleHospitalLogin = (e) => {
  e?.preventDefault();
  const hospId = document.getElementById('login-hosp-id')?.value || 'h1';
  const role = document.getElementById('login-hosp-role')?.value || 'hospitaladmin';
  const email = document.getElementById('login-hosp-email')?.value || 'admin@hospital.com';

  set('currentHospitalId', hospId);
  set('isAuthenticated', true);
  setRole(role);

  showToast({
    title: '✓ Authentication Succeeded',
    message: `Signed in as ${role === 'hospitaladmin' ? 'Hospital Admin' : role === 'doctor' ? 'Doctor' : 'Receptionist'}.`,
    type: 'success'
  });

  const routes = {
    hospitaladmin: '/ha/dashboard',
    doctor: '/dr/dashboard',
    receptionist: '/rc/queue'
  };

  navigate(routes[role] || '/ha/dashboard');
};

window.handleSuperAdminLogin = (e) => {
  e?.preventDefault();
  set('isAuthenticated', true);
  setRole('superadmin');

  showToast({
    title: '✓ Super Admin Verified',
    message: 'Welcome back to MediCore Command Center.',
    type: 'success'
  });

  navigate('/sa/dashboard');
};

window.quickLoginRole = (role, name, email, hospId) => {
  set('currentHospitalId', hospId);
  set('isAuthenticated', true);
  setRole(role);

  showToast({
    title: `✓ Signed in as ${name}`,
    message: `Context: ${role.toUpperCase()}`,
    type: 'success'
  });

  const routes = {
    hospitaladmin: '/ha/dashboard',
    doctor: '/dr/dashboard',
    receptionist: '/rc/queue'
  };

  navigate(routes[role] || '/ha/dashboard');
};
