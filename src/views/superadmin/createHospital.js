// ============================================================
// superadmin/createHospital.js — Enterprise Hospital Onboarding Wizard
// ============================================================

import { renderTopbar } from '../../components/topbar.js';
import { renderSidebar } from '../../components/sidebar.js';
import { addHospital, get } from '../../store.js';
import { showToast } from '../../components/toast.js';
import { navigate } from '../../router.js';
import { refreshIcons } from '../../components/icons.js';

let currentStep = 1;
const totalSteps = 4;

let formData = {
  name: '',
  license: 'MH-NABH-2024-889',
  type: 'Multi-Specialty',
  address: '',
  city: 'Mumbai',
  state: 'Maharashtra',
  pincode: '400001',
  phone: '+91 ',
  email: '',
  emergencyPhone: '+91 22 9999 0000',
  departments: ['Cardiology', 'General Medicine', 'Orthopedics', 'Pediatrics', 'Emergency'],
  beds: 120,
  icuBeds: 12,
  otCount: 4,
  adminName: '',
  adminRole: 'Hospital Administrator',
  adminEmail: '',
  adminPhone: '+91 ',
  primaryColor: '#0B5FA5',
  plan: 'enterprise',
  planName: 'Enterprise',
  planPrice: 49999,
  billingCycle: 'monthly',
  agreeTerms: true
};

const STEP_META = [
  { step: 1, title: 'Facility Profile', subtitle: 'Basic information & location', icon: 'building-2' },
  { step: 2, title: 'Clinical Scope', subtitle: 'Departments & bed capacity', icon: 'layers' },
  { step: 3, title: 'Administration', subtitle: 'Admin account & branding', icon: 'shield-check' },
  { step: 4, title: 'Subscription', subtitle: 'Plan selection & launch', icon: 'credit-card' }
];

const ALL_DEPARTMENTS = [
  { name: 'Cardiology', icon: 'heart-pulse', desc: 'Heart & Cardiovascular Care' },
  { name: 'General Medicine', icon: 'stethoscope', desc: 'Internal Medicine & OPD' },
  { name: 'Orthopedics', icon: 'bone', desc: 'Bone, Joint & Spine Care' },
  { name: 'Pediatrics', icon: 'baby', desc: 'Child & Neonatal Health' },
  { name: 'Emergency', icon: 'ambulance', desc: '24x7 Trauma & Critical Care' },
  { name: 'Neurology', icon: 'brain', desc: 'Brain & Nervous System' },
  { name: 'Oncology', icon: 'microscope', desc: 'Cancer Care & Chemotherapy' },
  { name: 'Dermatology', icon: 'sparkles', desc: 'Skin, Hair & Aesthetics' },
  { name: 'OB-GYN', icon: 'heart', desc: 'Maternity & Women Health' },
  { name: 'Radiology', icon: 'scan', desc: 'X-Ray, MRI & CT Diagnostics' },
  { name: 'Pathology', icon: 'flask-conical', desc: 'Automated Lab Investigations' },
  { name: 'Physiotherapy', icon: 'activity', desc: 'Rehab & Mobility Therapy' }
];

const COLOR_PRESETS = [
  { name: 'Clinical Navy', hex: '#0B5FA5' },
  { name: 'Medical Teal', hex: '#0F7A6C' },
  { name: 'Emerald Care', hex: '#16A34A' },
  { name: 'Royal Indigo', hex: '#4F46E5' },
  { name: 'Deep Purple', hex: '#7C3AED' },
  { name: 'Crimson Health', hex: '#E11D48' }
];

export function renderCreateHospital() {
  renderSidebar();
  renderTopbar({
    breadcrumb: [
      { label: 'Super Admin', path: '/sa/dashboard' },
      { label: 'Hospitals', path: '/sa/hospitals' },
      { label: 'Onboard New Tenant' }
    ]
  });
  renderPageSkeleton();
}

function renderPageSkeleton() {
  const content = document.getElementById('content');
  if (!content) return;

  content.innerHTML = `
    <!-- Page Header with Status -->
    <div class="page-header" style="margin-bottom:24px">
      <div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
          <h1 class="page-title">Onboard New Hospital Tenant</h1>
          <span class="badge badge-primary">Multi-Tenant Setup</span>
        </div>
        <p class="page-subtitle">Configure workspace, clinical scope, administrator credentials, and billing plan</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary" onclick="navigateTo('/sa/hospitals')">
          <i data-lucide="x"></i> Cancel Onboarding
        </button>
        <button class="btn btn-secondary" onclick="saveDraft()">
          <i data-lucide="bookmark"></i> Save Draft
        </button>
      </div>
    </div>

    <!-- Stepper Navigation Bar -->
    <div id="wizard-stepper-bar" class="card mb-6" style="padding:0;overflow:hidden;background:#FFFFFF;border:1px solid var(--color-border);box-shadow:var(--shadow-sm)">
      ${renderStepperBarHtml()}
    </div>

    <!-- Main Form & Real-time Live Preview Layout -->
    <div style="display:grid;grid-template-columns: 1fr 380px; gap: 28px; align-items: start">
      
      <!-- Left Column: Current Step Content Card -->
      <div class="card" style="box-shadow:var(--shadow-md)">
        <div class="card-header" id="wizard-step-header" style="background:#f8fafc">
          <div>
            <span class="card-title" id="wizard-step-title">Step ${currentStep}: ${STEP_META[currentStep - 1].title}</span>
            <div style="font-size:var(--font-size-sm);color:var(--color-text-muted);margin-top:2px" id="wizard-step-subtitle">
              ${STEP_META[currentStep - 1].subtitle}
            </div>
          </div>
          <span class="badge badge-primary" id="wizard-step-badge">Step ${currentStep} of 4</span>
        </div>

        <div class="card-body" id="wizard-step-body" style="padding:32px">
          ${renderStepContent(currentStep)}
        </div>

        <!-- Wizard Navigation Footer -->
        <div class="modal-footer" id="wizard-step-footer" style="padding:20px 32px;display:flex;justify-content:space-between;align-items:center;background:#f8fafc">
          ${renderStepFooterHtml()}
        </div>
      </div>

      <!-- Right Column: Real-time Live Tenant Preview Card -->
      <div style="display:flex;flex-direction:column;gap:20px" id="wizard-preview-container">
        ${renderPreviewCardHtml()}
      </div>
    </div>
  `;

  refreshIcons(content);
}

function renderStepperBarHtml() {
  return `
    <div style="display:grid;grid-template-columns:repeat(4, 1fr);border-bottom:1px solid var(--color-border)">
      ${STEP_META.map((meta, idx) => {
        const isDone = meta.step < currentStep;
        const isActive = meta.step === currentStep;
        return `
          <div onclick="jumpToStep(${meta.step})" 
            style="padding:18px 24px;display:flex;align-items:center;gap:14px;cursor:${isDone ? 'pointer' : 'default'};background:${isActive ? '#F8FAFC' : 'white'};border-right:${idx < 3 ? '1px solid var(--color-border)' : 'none'};border-bottom:${isActive ? '3px solid var(--color-primary)' : '3px solid transparent'};transition:all 0.15s">
            
            <div style="width:42px;height:42px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:var(--font-size-base);flex-shrink:0;background:${isDone ? 'var(--color-success-bg)' : isActive ? 'var(--color-primary)' : 'var(--color-bg)'};color:${isDone ? 'var(--color-success)' : isActive ? 'white' : 'var(--color-text-muted)'};border:1.5px solid ${isDone ? 'var(--color-success)' : isActive ? 'var(--color-primary)' : 'var(--color-border)'};box-shadow:${isActive ? '0 3px 8px rgba(11,95,165,0.35)' : 'none'}">
              ${isDone ? '<i data-lucide="check" style="width:20px;height:20px"></i>' : `<i data-lucide="${meta.icon}" style="width:20px;height:20px"></i>`}
            </div>

            <div style="min-width:0;flex:1">
              <div style="font-size:var(--font-size-xs);font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:${isActive ? 'var(--color-primary)' : isDone ? 'var(--color-success)' : 'var(--color-text-light)'}">
                Step 0${meta.step} ${isDone ? '✓ Completed' : isActive ? '● Active' : ''}
              </div>
              <div style="font-size:var(--font-size-base);font-weight:700;color:${isActive ? 'var(--color-text)' : isDone ? 'var(--color-text)' : 'var(--color-text-muted)'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                ${meta.title}
              </div>
              <div style="font-size:var(--font-size-xs);color:var(--color-text-light);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                ${meta.subtitle}
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderStepFooterHtml() {
  return `
    <div>
      ${currentStep > 1 ? `
        <button type="button" class="btn btn-secondary" onclick="prevStep()">
          <i data-lucide="arrow-left"></i> Previous Step
        </button>
      ` : `
        <button type="button" class="btn btn-secondary" onclick="navigateTo('/sa/hospitals')">
          <i data-lucide="arrow-left"></i> Back to Directory
        </button>
      `}
    </div>
    <div style="display:flex;gap:12px">
      ${currentStep < totalSteps ? `
        <button type="button" class="btn btn-primary btn-lg" onclick="nextStep()">
          Continue to Step ${currentStep + 1} <i data-lucide="arrow-right"></i>
        </button>
      ` : `
        <button type="button" class="btn btn-success btn-lg" onclick="submitHospital()">
          <i data-lucide="check-circle-2"></i> Launch & Deploy Hospital Workspace
        </button>
      `}
    </div>
  `;
}

function renderPreviewCardHtml() {
  return `
    <!-- Live Preview Card -->
    <div class="card" style="border:2px solid var(--color-border);background:white">
      <div class="card-header" style="background:#F8FAFC">
        <span class="card-title" style="font-size:var(--font-size-base);display:flex;align-items:center;gap:8px">
          <i data-lucide="eye" style="width:18px;height:18px;color:var(--color-primary)"></i> Live Tenant Preview
        </span>
        <span class="badge badge-success animate-pulse">Live Sync</span>
      </div>
      <div class="card-body" style="padding:24px">
        <!-- Simulated Hospital Card -->
        <div style="border:1.5px solid var(--color-border);border-radius:14px;padding:18px;background:#FAFAFA;margin-bottom:16px">
          <div style="display:flex;align-items:center;gap:14px;margin-bottom:14px">
            <div id="preview-avatar" style="width:48px;height:48px;border-radius:12px;background:${formData.primaryColor || '#0B5FA5'};color:white;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;flex-shrink:0;box-shadow:0 3px 6px rgba(0,0,0,0.15)">
              ${(formData.name || 'H').charAt(0).toUpperCase()}
            </div>
            <div style="min-width:0;flex:1">
              <div id="preview-name" style="font-size:var(--font-size-lg);font-weight:800;color:var(--color-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                ${formData.name || 'Hospital Name Preview'}
              </div>
              <div id="preview-meta" style="font-size:var(--font-size-xs);color:var(--color-text-muted)">
                ${formData.type || 'Multi-Specialty'} · ${formData.city || 'City'}
              </div>
            </div>
          </div>

          <div class="info-list" style="font-size:var(--font-size-sm)">
            <div class="info-row" style="padding:6px 0">
              <span class="info-label">Plan Tier</span>
              <span id="preview-plan" class="badge badge-primary badge-no-dot">${formData.planName} (₹${(formData.planPrice / 1000).toFixed(0)}k/mo)</span>
            </div>
            <div class="info-row" style="padding:6px 0">
              <span class="info-label">Bed Capacity</span>
              <span id="preview-beds" class="info-value font-semibold">${formData.beds || 0} Total (${formData.icuBeds || 0} ICU)</span>
            </div>
            <div class="info-row" style="padding:6px 0">
              <span class="info-label">Administrator</span>
              <span id="preview-admin" class="info-value">${formData.adminName || 'Admin Pending'}</span>
            </div>
          </div>

          <!-- Department Chips Preview -->
          <div style="margin-top:12px;border-top:1px solid var(--color-border);padding-top:10px">
            <div style="font-size:11px;font-weight:700;color:var(--color-text-light);text-transform:uppercase;margin-bottom:6px">
              Enabled Departments (${formData.departments.length})
            </div>
            <div id="preview-depts" style="display:flex;flex-wrap:wrap;gap:4px">
              ${formData.departments.slice(0, 4).map(d => `
                <span class="badge badge-gray badge-no-dot" style="font-size:11px;padding:2px 8px">${d}</span>
              `).join('')}
              ${formData.departments.length > 4 ? `
                <span class="badge badge-gray badge-no-dot" style="font-size:11px;padding:2px 8px">+${formData.departments.length - 4} more</span>
              ` : ''}
            </div>
          </div>
        </div>

        <!-- Onboarding Checklist -->
        <div style="font-size:var(--font-size-xs);font-weight:700;text-transform:uppercase;color:var(--color-text-light);letter-spacing:0.06em;margin-bottom:8px">
          Provisioning Readiness
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;font-size:var(--font-size-sm)">
          <div style="display:flex;align-items:center;gap:8px;color:${formData.name ? 'var(--color-success)' : 'var(--color-text-muted)'}">
            <i data-lucide="${formData.name ? 'check-circle' : 'circle'}" style="width:16px;height:16px"></i> Facility Profile Complete
          </div>
          <div style="display:flex;align-items:center;gap:8px;color:${formData.departments.length > 0 ? 'var(--color-success)' : 'var(--color-text-muted)'}">
            <i data-lucide="${formData.departments.length > 0 ? 'check-circle' : 'circle'}" style="width:16px;height:16px"></i> ${formData.departments.length} Departments Configured
          </div>
          <div style="display:flex;align-items:center;gap:8px;color:${formData.adminEmail ? 'var(--color-success)' : 'var(--color-text-muted)'}">
            <i data-lucide="${formData.adminEmail ? 'check-circle' : 'circle'}" style="width:16px;height:16px"></i> Admin Credentials Verified
          </div>
          <div style="display:flex;align-items:center;gap:8px;color:${formData.plan ? 'var(--color-success)' : 'var(--color-text-muted)'}">
            <i data-lucide="${formData.plan ? 'check-circle' : 'circle'}" style="width:16px;height:16px"></i> ${formData.planName} Plan Assigned
          </div>
        </div>
      </div>
    </div>

    <!-- Security & Compliance Seal Card -->
    <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:var(--radius-lg);padding:16px 20px;display:flex;gap:12px;align-items:center">
      <i data-lucide="shield-check" style="width:32px;height:32px;color:var(--color-success);flex-shrink:0"></i>
      <div style="font-size:var(--font-size-xs);color:#166534;line-height:1.4">
        <strong>Automated Tenant Isolation:</strong> Dedicated database partition, SSL endpoint & WhatsApp webhook will be provisioned on launch.
      </div>
    </div>
  `;
}

// ── Targetted Live Preview Updater (Does NOT re-render left form inputs!) ──
function updateLivePreviewOnly() {
  const preview = document.getElementById('wizard-preview-container');
  if (preview) {
    preview.innerHTML = renderPreviewCardHtml();
    refreshIcons(preview);
  }
}

// ── Renders only the step content when changing steps ──
function renderCurrentStepOnly() {
  const stepBar = document.getElementById('wizard-stepper-bar');
  if (stepBar) {
    stepBar.innerHTML = renderStepperBarHtml();
    refreshIcons(stepBar);
  }

  const title = document.getElementById('wizard-step-title');
  if (title) title.textContent = `Step ${currentStep}: ${STEP_META[currentStep - 1].title}`;

  const subtitle = document.getElementById('wizard-step-subtitle');
  if (subtitle) subtitle.textContent = STEP_META[currentStep - 1].subtitle;

  const badge = document.getElementById('wizard-step-badge');
  if (badge) badge.textContent = `Step ${currentStep} of 4`;

  const body = document.getElementById('wizard-step-body');
  if (body) {
    body.innerHTML = renderStepContent(currentStep);
    refreshIcons(body);
  }

  const footer = document.getElementById('wizard-step-footer');
  if (footer) {
    footer.innerHTML = renderStepFooterHtml();
    refreshIcons(footer);
  }

  updateLivePreviewOnly();
}

function renderStepContent(step) {
  if (step === 1) {
    return `
      <div class="form-section-title" style="margin-top:0">1. Hospital Identity & Type</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Hospital / Healthcare Entity Name <span class="required">*</span></label>
          <input class="form-control" id="w-name" placeholder="e.g. Apollo Multi-Specialty Hospital" value="${formData.name}" oninput="updateField('name', this.value)" />
          <div class="form-hint">Official legal name printed on patient receipts and prescriptions.</div>
        </div>
        <div class="form-group">
          <label class="form-label">Facility Classification <span class="required">*</span></label>
          <select class="form-control" id="w-type" onchange="updateField('type', this.value)">
            <option value="Multi-Specialty" ${formData.type === 'Multi-Specialty' ? 'selected' : ''}>Multi-Specialty Hospital (Full Service)</option>
            <option value="Single-Specialty" ${formData.type === 'Single-Specialty' ? 'selected' : ''}>Single-Specialty Center (Cardiac/Ortho/Eye)</option>
            <option value="Clinic" ${formData.type === 'Clinic' ? 'selected' : ''}>Polyclinic / Family Care Practice</option>
            <option value="Diagnostic Centre" ${formData.type === 'Diagnostic Centre' ? 'selected' : ''}>Diagnostic & Imaging Center</option>
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Hospital License / NABH Registration #</label>
          <input class="form-control" id="w-license" placeholder="e.g. NABH-2024-MH-0842" value="${formData.license}" oninput="updateField('license', this.value)" />
        </div>
        <div class="form-group">
          <label class="form-label">Primary Hospital Contact Email <span class="required">*</span></label>
          <input type="email" class="form-control" id="w-email" placeholder="contact@hospital.com" value="${formData.email}" oninput="updateField('email', this.value)" />
        </div>
      </div>

      <div class="form-section-title">2. Physical Location & Contact Channels</div>
      <div class="form-group">
        <label class="form-label">Full Street Address & Landmark <span class="required">*</span></label>
        <textarea class="form-control" id="w-address" rows="2" placeholder="e.g. Plot 15, Andheri-Kurla Road, Near Metro Station" oninput="updateField('address', this.value)">${formData.address}</textarea>
      </div>

      <div class="form-row-3">
        <div class="form-group">
          <label class="form-label">City <span class="required">*</span></label>
          <input class="form-control" id="w-city" placeholder="Mumbai" value="${formData.city}" oninput="updateField('city', this.value)" />
        </div>
        <div class="form-group">
          <label class="form-label">State / Region <span class="required">*</span></label>
          <input class="form-control" id="w-state" placeholder="Maharashtra" value="${formData.state}" oninput="updateField('state', this.value)" />
        </div>
        <div class="form-group">
          <label class="form-label">Postal PIN Code</label>
          <input class="form-control" id="w-pincode" placeholder="400069" value="${formData.pincode}" oninput="updateField('pincode', this.value)" />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Main Reception Telephone <span class="required">*</span></label>
          <input class="form-control" id="w-phone" placeholder="+91 22 6789 0000" value="${formData.phone}" oninput="updateField('phone', this.value)" />
        </div>
        <div class="form-group">
          <label class="form-label">24x7 Emergency Helpline</label>
          <input class="form-control" id="w-emergency" placeholder="+91 22 9999 0000" value="${formData.emergencyPhone}" oninput="updateField('emergencyPhone', this.value)" />
        </div>
      </div>
    `;
  }

  if (step === 2) {
    return `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <div class="form-section-title" style="margin:0">1. Select Clinical Departments to Activate</div>
        <div style="display:flex;gap:8px">
          <button type="button" class="btn btn-secondary btn-sm" onclick="toggleAllDepts(true)">Select All</button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="toggleAllDepts(false)">Clear</button>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:12px;margin-bottom:28px">
        ${ALL_DEPARTMENTS.map(d => {
          const isSelected = formData.departments.includes(d.name);
          return `
            <div onclick="toggleDeptSelection('${d.name}')" 
              style="border:2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'};border-radius:12px;padding:14px;background:${isSelected ? 'var(--color-primary-light)' : 'white'};cursor:pointer;display:flex;align-items:flex-start;gap:10px;transition:all 0.15s">
              <input type="checkbox" ${isSelected ? 'checked' : ''} style="margin-top:3px;pointer-events:none;accent-color:var(--color-primary)" />
              <div>
                <div style="font-size:var(--font-size-base);font-weight:700;color:${isSelected ? 'var(--color-primary)' : 'var(--color-text)'}">
                  ${d.name}
                </div>
                <div style="font-size:12px;color:var(--color-text-muted)">${d.desc}</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <div class="form-section-title">2. Inpatient & Critical Care Capacity</div>
      <div class="form-row-3">
        <div class="form-group">
          <label class="form-label">Total Inpatient Beds <span class="required">*</span></label>
          <input type="number" class="form-control" id="w-beds" value="${formData.beds}" min="1" oninput="updateField('beds', parseInt(this.value) || 0)" />
          <div class="form-hint">Ward + Private Rooms</div>
        </div>
        <div class="form-group">
          <label class="form-label">ICU / Critical Care Beds</label>
          <input type="number" class="form-control" id="w-icubeds" value="${formData.icuBeds}" min="0" oninput="updateField('icuBeds', parseInt(this.value) || 0)" />
          <div class="form-hint">Intensive Care Units</div>
        </div>
        <div class="form-group">
          <label class="form-label">Operation Theatres (OT)</label>
          <input type="number" class="form-control" id="w-ot" value="${formData.otCount}" min="0" oninput="updateField('otCount', parseInt(this.value) || 0)" />
          <div class="form-hint">Major / Minor OTs</div>
        </div>
      </div>
    `;
  }

  if (step === 3) {
    return `
      <div class="form-section-title" style="margin-top:0">1. Root Hospital Administrator Account</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Admin Full Name <span class="required">*</span></label>
          <input class="form-control" id="w-admin-name" placeholder="e.g. Dr. Rajesh Mehta" value="${formData.adminName}" oninput="updateField('adminName', this.value)" />
          <div class="form-hint">Hospital CEO, Medical Director, or Operations Lead.</div>
        </div>
        <div class="form-group">
          <label class="form-label">Designation / Role Title</label>
          <input class="form-control" id="w-admin-role" placeholder="e.g. Medical Director & COO" value="${formData.adminRole}" oninput="updateField('adminRole', this.value)" />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Admin Official Email (Login ID) <span class="required">*</span></label>
          <input type="email" class="form-control" id="w-admin-email" placeholder="rajesh.mehta@apollomumbai.com" value="${formData.adminEmail}" oninput="updateField('adminEmail', this.value)" />
          <div class="form-hint">Onboarding activation link will be sent to this email.</div>
        </div>
        <div class="form-group">
          <label class="form-label">Direct Mobile Number <span class="required">*</span></label>
          <input class="form-control" id="w-admin-phone" placeholder="+91 98200 XXXXX" value="${formData.adminPhone}" oninput="updateField('adminPhone', this.value)" />
        </div>
      </div>

      <div style="background:#F8FAFC;border:1px solid var(--color-border);border-radius:var(--radius-md);padding:14px 18px;margin-bottom:24px;display:flex;align-items:center;gap:12px">
        <i data-lucide="key" style="color:var(--color-primary);width:24px;height:24px;flex-shrink:0"></i>
        <div style="font-size:var(--font-size-sm);color:var(--color-text-muted)">
          <strong>Initial Security Credentials:</strong> A one-time temporary security passphrase will be generated. The admin will be prompted to configure 2FA upon first login.
        </div>
      </div>

      <div class="form-section-title">2. Hospital Branding & Portal Theme</div>
      <div class="form-group">
        <label class="form-label">Choose Primary Portal Brand Color</label>
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;flex-wrap:wrap">
          ${COLOR_PRESETS.map(c => `
            <div onclick="selectBrandColor('${c.hex}')" 
              style="display:flex;align-items:center;gap:8px;padding:8px 14px;border:2px solid ${formData.primaryColor === c.hex ? c.hex : 'var(--color-border)'};border-radius:10px;cursor:pointer;background:white;transition:all 0.15s">
              <span style="width:18px;height:18px;border-radius:50%;background:${c.hex};display:inline-block"></span>
              <span style="font-size:var(--font-size-sm);font-weight:600">${c.name}</span>
            </div>
          `).join('')}
        </div>
        <div style="display:flex;align-items:center;gap:12px">
          <span style="font-size:var(--font-size-sm);color:var(--color-text-muted)">Or Custom HEX:</span>
          <input type="color" id="w-custom-color" value="${formData.primaryColor}" onchange="selectBrandColor(this.value)" style="width:48px;height:38px;padding:2px;border-radius:8px;cursor:pointer" />
          <input type="text" class="form-control" id="w-hex-display" style="width:120px" value="${formData.primaryColor}" readonly />
        </div>
      </div>
    `;
  }

  if (step === 4) {
    const plans = get('subscriptionPlans') || [];
    return `
      <div class="form-section-title" style="margin-top:0">1. Select Subscription Tier</div>
      
      <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:18px;margin-bottom:28px">
        ${plans.map(p => {
          const isChosen = formData.plan === p.id;
          return `
            <div onclick="choosePlan('${p.id}', '${p.name}', ${p.price})" 
              style="border:2.5px solid ${isChosen ? 'var(--color-primary)' : 'var(--color-border)'};border-radius:14px;padding:22px;background:${isChosen ? 'var(--color-primary-light)' : 'white'};cursor:pointer;position:relative;display:flex;flex-direction:column;justify-content:space-between;box-shadow:${isChosen ? 'var(--shadow-md)' : 'none'};transition:all 0.15s">
              ${p.name === 'Enterprise' ? '<span class="badge badge-primary" style="position:absolute;top:-10px;right:16px">Recommended</span>' : ''}
              <div>
                <div style="font-size:var(--font-size-lg);font-weight:800;color:var(--color-text);margin-bottom:4px">${p.name} Plan</div>
                <div style="font-size:var(--font-size-3xl);font-weight:800;color:var(--color-primary);margin-bottom:12px">
                  ₹${p.price.toLocaleString()}<span style="font-size:var(--font-size-sm);font-weight:400;color:var(--color-text-muted)"> /mo</span>
                </div>
                <div style="border-top:1px solid var(--color-border);padding-top:10px;margin-bottom:12px">
                  ${p.features.map(f => `
                    <div style="font-size:var(--font-size-xs);color:var(--color-text-muted);margin-bottom:4px;display:flex;align-items:center;gap:6px">
                      <i data-lucide="check" style="width:14px;height:14px;color:var(--color-success)"></i> ${f}
                    </div>
                  `).join('')}
                </div>
              </div>
              <div style="font-size:11px;color:var(--color-text-light);border-top:1px dashed var(--color-border);padding-top:8px">
                ${p.maxDoctors ? `Up to ${p.maxDoctors} Doctors` : 'Unlimited Doctors & Beds'}
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Isolated Database & Backup Cron Provisioning Preview -->
      <div class="form-section-title">2. Automated Database & Backup Isolation</div>
      <div style="background:#F8FAFC;border:1.5px solid var(--color-border);border-radius:var(--radius-lg);padding:20px;margin-bottom:24px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
          <div style="display:flex;align-items:center;gap:10px">
            <div style="width:36px;height:36px;border-radius:10px;background:#DBEAFE;color:#1E40AF;display:flex;align-items:center;justify-content:center">
              <i data-lucide="database" style="width:20px;height:20px"></i>
            </div>
            <div>
              <div style="font-size:var(--font-size-base);font-weight:700">Dedicated Tenant Database Partition</div>
              <div style="font-size:var(--font-size-xs);color:var(--color-text-muted)">Physically isolated from Super Admin Master Database & other hospitals</div>
            </div>
          </div>
          <span class="badge badge-success">● Auto-Provisioned</span>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;background:white;border:1px solid var(--color-border);border-radius:10px;padding:14px;font-size:var(--font-size-sm);margin-bottom:14px">
          <div>
            <span style="color:var(--color-text-light);font-size:11px;text-transform:uppercase;font-weight:700">Target Schema Name</span>
            <div style="font-family:monospace;font-weight:700;color:var(--color-primary)">medicore_tenant_${(formData.name || 'hosp').toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 16)}_partition</div>
          </div>
          <div>
            <span style="color:var(--color-text-light);font-size:11px;text-transform:uppercase;font-weight:700">Database Cluster Host</span>
            <div style="font-family:monospace;font-weight:600">db-node-01.ap-south-1.internal:5432</div>
          </div>
          <div>
            <span style="color:var(--color-text-light);font-size:11px;text-transform:uppercase;font-weight:700">Automated Backup Cronjob</span>
            <div style="font-weight:600;color:var(--color-success)">✓ Enabled (Daily at 02:00 AM UTC · 0 2 * * *)</div>
          </div>
          <div>
            <span style="color:var(--color-text-light);font-size:11px;text-transform:uppercase;font-weight:700">Snapshot Storage Target</span>
            <div style="font-weight:600">AWS S3 (Encrypted Bucket · 90-Day Retention)</div>
          </div>
        </div>
        <div style="font-size:var(--font-size-xs);color:var(--color-text-muted);display:flex;align-items:center;gap:6px">
          <i data-lucide="lock" style="width:14px;height:14px;color:var(--color-success)"></i> Super Admin will receive full root DB access, credentials vault & on-demand backup export capabilities immediately upon launch.
        </div>
      </div>

      <div class="form-section-title">3. Final Review & Confirmation</div>
      <div style="background:#F8FAFC;border:1px solid var(--color-border);border-radius:var(--radius-lg);padding:20px;margin-bottom:20px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;font-size:var(--font-size-sm)">
          <div>
            <div style="color:var(--color-text-light);font-size:var(--font-size-xs);text-transform:uppercase;font-weight:700">Entity Details</div>
            <div style="font-size:var(--font-size-base);font-weight:700;color:var(--color-text)">${formData.name || 'Hospital Name'}</div>
            <div style="color:var(--color-text-muted)">${formData.type} · ${formData.city}, ${formData.state}</div>
          </div>
          <div>
            <div style="color:var(--color-text-light);font-size:var(--font-size-xs);text-transform:uppercase;font-weight:700">Administrator Account</div>
            <div style="font-size:var(--font-size-base);font-weight:700;color:var(--color-text)">${formData.adminName || 'Admin Name'}</div>
            <div style="color:var(--color-text-muted)">${formData.adminEmail || 'admin@hospital.com'}</div>
          </div>
          <div>
            <div style="color:var(--color-text-light);font-size:var(--font-size-xs);text-transform:uppercase;font-weight:700">Clinical Scale</div>
            <div style="font-weight:600">${formData.departments.length} Departments · ${formData.beds} Inpatient Beds (${formData.icuBeds} ICU)</div>
          </div>
          <div>
            <div style="color:var(--color-text-light);font-size:var(--font-size-xs);text-transform:uppercase;font-weight:700">Assigned Subscription</div>
            <div style="font-weight:700;color:var(--color-primary)">${formData.planName} Tier (₹${formData.planPrice.toLocaleString()} / month)</div>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label class="form-check">
          <input type="checkbox" id="w-terms" ${formData.agreeTerms ? 'checked' : ''} onchange="formData.agreeTerms = this.checked" />
          <span>I confirm this hospital entity is compliant with medical registry standards and authorized to operate MediCore HMS workspace with dedicated database isolation.</span>
        </label>
      </div>
    `;
  }
}

// ── Direct Field Updater (No re-renders of the input field!) ──
window.updateField = (field, val) => {
  formData[field] = val;
  updateLivePreviewOnly();
};

window.jumpToStep = (step) => {
  if (step <= currentStep) {
    currentStep = step;
    renderCurrentStepOnly();
  }
};

window.toggleDeptSelection = (deptName) => {
  if (formData.departments.includes(deptName)) {
    formData.departments = formData.departments.filter(d => d !== deptName);
  } else {
    formData.departments.push(deptName);
  }
  renderCurrentStepOnly();
};

window.toggleAllDepts = (select) => {
  if (select) {
    formData.departments = ALL_DEPARTMENTS.map(d => d.name);
  } else {
    formData.departments = [];
  }
  renderCurrentStepOnly();
};

window.selectBrandColor = (hex) => {
  formData.primaryColor = hex;
  const hexDisplay = document.getElementById('w-hex-display');
  if (hexDisplay) hexDisplay.value = hex;
  const customColor = document.getElementById('w-custom-color');
  if (customColor) customColor.value = hex;
  updateLivePreviewOnly();
};

window.choosePlan = (id, name, price) => {
  formData.plan = id;
  formData.planName = name;
  formData.planPrice = price;
  renderCurrentStepOnly();
};

window.nextStep = () => {
  if (currentStep === 1) {
    if (!formData.name.trim()) {
      showToast({ title: 'Hospital Name Required', message: 'Please enter the official hospital name.', type: 'warning' });
      document.getElementById('w-name')?.focus();
      return;
    }
    if (!formData.email.trim()) {
      showToast({ title: 'Contact Email Required', message: 'Please provide the primary hospital email.', type: 'warning' });
      document.getElementById('w-email')?.focus();
      return;
    }
  }

  if (currentStep === 2) {
    if (formData.departments.length === 0) {
      showToast({ title: 'No Departments Selected', message: 'Please select at least 1 clinical department.', type: 'warning' });
      return;
    }
  }

  if (currentStep === 3) {
    if (!formData.adminName.trim() || !formData.adminEmail.trim()) {
      showToast({ title: 'Admin Account Required', message: 'Admin Name and Email are mandatory for login setup.', type: 'warning' });
      if (!formData.adminName.trim()) document.getElementById('w-admin-name')?.focus();
      else document.getElementById('w-admin-email')?.focus();
      return;
    }
  }

  if (currentStep < totalSteps) {
    currentStep++;
    renderCurrentStepOnly();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

window.prevStep = () => {
  if (currentStep > 1) {
    currentStep--;
    renderCurrentStepOnly();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

window.saveDraft = () => {
  showToast({ title: 'Draft Saved', message: `Onboarding progress for "${formData.name || 'New Hospital'}" saved.`, type: 'info' });
};

window.submitHospital = () => {
  if (!formData.agreeTerms) {
    showToast({ title: 'Compliance Agreement', message: 'Please check the compliance confirmation box.', type: 'warning' });
    return;
  }

  import('../../components/modal.js').then(({ openModal, closeModal }) => {
    // 1. Show automated provisioning animation modal
    openModal({
      title: 'Provisioning Isolated Tenant Infrastructure...',
      size: 'md',
      body: `
        <div style="padding:10px 0">
          <div style="text-align:center;margin-bottom:20px">
            <div style="width:56px;height:56px;border-radius:50%;background:#EFF6FF;color:var(--color-primary);display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px">
              <i data-lucide="database" style="width:28px;height:28px" class="animate-pulse"></i>
            </div>
            <div style="font-size:var(--font-size-lg);font-weight:800;color:var(--color-text)">Deploying ${formData.name}</div>
            <div style="font-size:var(--font-size-sm);color:var(--color-text-muted)">Creating isolated schema, credentials vault, and automated backup cronjob</div>
          </div>

          <div style="display:flex;flex-direction:column;gap:10px;font-size:var(--font-size-sm);background:#F8FAFC;border:1px solid var(--color-border);border-radius:10px;padding:16px" id="prov-checklist">
            <div style="display:flex;align-items:center;gap:8px;color:var(--color-success)" id="p-step-1">
              <i data-lucide="check-circle-2" style="width:16px;height:16px"></i> 1. Allocating isolated database schema partition...
            </div>
            <div style="display:flex;align-items:center;gap:8px;color:var(--color-success)" id="p-step-2">
              <i data-lucide="check-circle-2" style="width:16px;height:16px"></i> 2. Generating encrypted DB credentials & secret keys...
            </div>
            <div style="display:flex;align-items:center;gap:8px;color:var(--color-success)" id="p-step-3">
              <i data-lucide="check-circle-2" style="width:16px;height:16px"></i> 3. Initializing EMR clinical tables & HIPAA audit trail...
            </div>
            <div style="display:flex;align-items:center;gap:8px;color:var(--color-success)" id="p-step-4">
              <i data-lucide="check-circle-2" style="width:16px;height:16px"></i> 4. Registering automated daily backup cron (0 2 * * *)...
            </div>
          </div>
        </div>
      `,
      footer: ``
    });

    setTimeout(() => {
      // Create hospital in reactive store with isolated DB & Backup cron
      const newId = addHospital({
        name: formData.name,
        type: formData.type,
        license: formData.license,
        address: `${formData.address}, ${formData.city}, ${formData.state} - ${formData.pincode}`,
        city: formData.city,
        state: formData.state,
        phone: formData.phone,
        email: formData.email,
        adminName: formData.adminName,
        adminEmail: formData.adminEmail,
        adminRole: formData.adminRole,
        primaryColor: formData.primaryColor,
        beds: formData.beds,
        departments: formData.departments,
        plan: formData.planName,
        planPrice: formData.planPrice,
        stats: {
          staff: 8,
          doctors: 4,
          patients: 12,
          todayAppointments: 0,
          bedOccupancy: 15,
          monthlyRevenue: 0
        }
      });

      const hospitals = get('hospitals') || [];
      const createdHosp = hospitals.find(h => h.id === newId);

      // Show the generated Super Admin DB Credentials Vault Modal
      openModal({
        title: `✓ Database Provisioned & Access Vault — ${createdHosp.name}`,
        size: 'lg',
        body: `
          <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:12px;padding:16px 20px;margin-bottom:20px;display:flex;gap:14px;align-items:center">
            <i data-lucide="shield-check" style="width:36px;height:36px;color:var(--color-success);flex-shrink:0"></i>
            <div>
              <div style="font-size:var(--font-size-base);font-weight:700;color:#166534">Isolated Database Created Successfully</div>
              <div style="font-size:var(--font-size-xs);color:#15803D">This database is completely separate from the Super Admin Master Database. Full credentials have been securely stored in the Super Admin Vault.</div>
            </div>
          </div>

          <!-- Credentials Table -->
          <div class="form-section-title" style="margin-top:0">Super Admin Database Access Keys</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;background:#F8FAFC;border:1px solid var(--color-border);border-radius:12px;padding:18px;margin-bottom:20px">
            <div>
              <span class="info-label">Database ID</span>
              <div style="font-family:monospace;font-weight:700;color:var(--color-primary)">${createdHosp.database.dbId}</div>
            </div>
            <div>
              <span class="info-label">Database Name</span>
              <div style="font-family:monospace;font-weight:700">${createdHosp.database.dbName}</div>
            </div>
            <div>
              <span class="info-label">Database Cluster Host</span>
              <div style="font-family:monospace;font-weight:600">${createdHosp.database.dbHost}:${createdHosp.database.dbPort}</div>
            </div>
            <div>
              <span class="info-label">Admin Username</span>
              <div style="font-family:monospace;font-weight:600">${createdHosp.database.dbUser}</div>
            </div>
            <div>
              <span class="info-label">Generated Master Password</span>
              <div style="display:flex;align-items:center;gap:8px">
                <input type="password" id="vault-pass-display" value="${createdHosp.database.dbPassword}" class="form-control" style="height:36px;font-family:monospace" readonly />
                <button class="btn btn-secondary btn-sm" onclick="toggleVaultPassVisibility()" title="Reveal/Hide">
                  <i data-lucide="eye" style="width:14px;height:14px"></i>
                </button>
              </div>
            </div>
            <div>
              <span class="info-label">Automated Backup Schedule</span>
              <div style="font-weight:700;color:var(--color-success)">${createdHosp.backupConfig.cronLabel}</div>
            </div>
          </div>

          <!-- Connection String -->
          <div class="form-group" style="margin-bottom:16px">
            <label class="form-label">PostgreSQL Direct Connection URI</label>
            <div style="display:flex;gap:8px">
              <input type="text" class="form-control" id="vault-conn-uri" value="${createdHosp.database.connectionUri}" readonly style="font-family:monospace;font-size:12px" />
              <button class="btn btn-secondary btn-sm" onclick="copyConnUri()">
                <i data-lucide="copy"></i> Copy
              </button>
            </div>
          </div>
        `,
        footer: `
          <button class="btn btn-secondary" onclick="downloadInitDump('${newId}')">
            <i data-lucide="download"></i> Download Initial SQL/JSON Snapshot
          </button>
          <button class="btn btn-primary" onclick="proceedToMonitor('${newId}')">
            Go to Hospital Live Console →
          </button>
        `
      });

      refreshIcons();
    }, 1100);
  });
};

window.toggleVaultPassVisibility = () => {
  const input = document.getElementById('vault-pass-display');
  if (input) {
    input.type = input.type === 'password' ? 'text' : 'password';
  }
};

window.copyConnUri = () => {
  const uri = document.getElementById('vault-conn-uri')?.value;
  if (uri) {
    navigator.clipboard?.writeText(uri);
    showToast({ title: 'Copied to Clipboard', message: 'Connection string copied.', type: 'success' });
  }
};

window.downloadInitDump = (hospitalId) => {
  import('../../store.js').then(({ triggerManualBackup }) => {
    triggerManualBackup(hospitalId);
    showToast({ title: 'Backup Downloaded', message: 'Initial database snapshot exported.', type: 'success' });
  });
};

window.proceedToMonitor = (hospitalId) => {
  import('../../components/modal.js').then(({ closeModal }) => {
    closeModal();
    navigate(`/sa/hospitals/${hospitalId}`);
  });
};
