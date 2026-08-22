// ============================================================
// doctor/prescriptionTemplates.js — Module 6: Saved Rx Templates
// ============================================================

import { renderTopbar } from '../../components/topbar.js';
import { renderSidebar } from '../../components/sidebar.js';
import { getPrescriptionTemplates, addPrescriptionTemplate } from '../../store.js';
import { showToast } from '../../components/toast.js';
import { openModal, closeModal } from '../../components/modal.js';
import { refreshIcons } from '../../components/icons.js';

export function renderPrescriptionTemplates() {
  renderSidebar();
  renderTopbar({
    breadcrumb: [
      { label: 'Doctor Workspace', path: '/dr/dashboard' },
      { label: 'Prescription Templates' }
    ]
  });

  const templates = getPrescriptionTemplates();

  const content = document.getElementById('content');
  content.innerHTML = `
    <!-- Header -->
    <div class="page-header">
      <div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
          <h1 class="page-title">Prescription & Clinical Protocol Templates</h1>
          <span class="badge badge-primary">${templates.length} Saved Clinical Regimens</span>
        </div>
        <p class="page-subtitle">Standardized prescription sets, drug dosages, and diagnostic bundles for rapid single-click injection during consultations</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" onclick="openCreateTemplateModal()">
          <i data-lucide="plus-circle"></i> Create New Rx Template
        </button>
      </div>
    </div>

    <!-- Templates Grid -->
    <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(360px, 1fr));gap:20px">
      ${templates.map(tmpl => `
        <div class="card" style="display:flex;flex-direction:column;justify-content:space-between">
          <div>
            <div class="card-header" style="background:#F8FAFC">
              <div>
                <span class="card-title" style="font-size:15px">${tmpl.name}</span>
                <div style="font-size:11px;color:var(--color-primary);font-weight:700;margin-top:2px">${tmpl.category}</div>
              </div>
              <span class="badge badge-gray badge-no-dot">${tmpl.drugs.length} Drugs</span>
            </div>

            <div class="card-body" style="padding:18px">
              <div style="font-size:12px;margin-bottom:12px">
                <span style="font-weight:700;color:var(--color-text-muted);text-transform:uppercase;font-size:10px">Default Diagnosis:</span>
                <div style="font-weight:700;color:var(--color-text);margin-top:2px">${tmpl.diagnosis}</div>
              </div>

              <!-- Drugs List -->
              <div style="background:#F8FAFC;padding:12px;border-radius:10px;border:1px solid var(--color-border);margin-bottom:12px">
                <span style="font-weight:700;color:var(--color-text-muted);text-transform:uppercase;font-size:10px;display:block;margin-bottom:6px">Medication Formulary:</span>
                ${tmpl.drugs.map(d => `
                  <div style="font-size:12px;padding:3px 0;border-bottom:1px dashed #E2E8F0">
                    <div style="font-weight:700;color:var(--color-text)">${d.drug}</div>
                    <div style="font-size:11px;color:var(--color-text-muted)">${d.dose} · ${d.duration} (${d.instructions})</div>
                  </div>
                `).join('')}
              </div>

              ${tmpl.recommendedLabs?.length > 0 ? `
                <div style="font-size:11px;color:var(--color-text-muted)">
                  <strong>Lab Orders:</strong> ${tmpl.recommendedLabs.join(', ')}
                </div>
              ` : ''}
            </div>
          </div>

          <div style="padding:14px 18px;background:#F8FAFC;border-top:1px solid var(--color-border);display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:11px;color:var(--color-text-muted)">Ready for consultation injection</span>
            <button class="btn btn-secondary btn-sm" onclick="showToast({ title: 'Template Ready', message: 'Available in active visit template selector.', type: 'info' })">
              Use in Visit →
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  refreshIcons(content);
}

window.openCreateTemplateModal = () => {
  openModal({
    title: 'Create Standardized Prescription Template',
    size: 'md',
    body: `
      <div class="form-group">
        <label class="form-label">Template Name <span class="required">*</span></label>
        <input type="text" class="form-control" id="tmpl-name" placeholder="e.g. Migraine Prophylaxis & Acute Attack" required />
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Clinical Category</label>
          <input type="text" class="form-control" id="tmpl-cat" value="Neurology / General" />
        </div>
        <div class="form-group">
          <label class="form-label">Primary Diagnosis (ICD-10)</label>
          <input type="text" class="form-control" id="tmpl-diag" value="Migraine with Aura (G43.1)" />
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Standard Drug 1</label>
        <input type="text" class="form-control mb-2" id="tmpl-d1-name" placeholder="Drug Name & Strength (e.g. Propranolol 40mg)" />
        <input type="text" class="form-control" id="tmpl-d1-dose" placeholder="Dosage (e.g. 1 tab twice daily for 60 days)" />
      </div>

      <div class="form-group">
        <label class="form-label">Clinical Dietary Advice</label>
        <input type="text" class="form-control" id="tmpl-notes" value="Avoid known dietary triggers (aged cheese, caffeine excess). Ensure regular sleep cycle." />
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="window._closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="submitCreateTemplate()">Save Template</button>
    `
  });
};

window.submitCreateTemplate = () => {
  const name = document.getElementById('tmpl-name')?.value;
  const category = document.getElementById('tmpl-cat')?.value || 'General';
  const diagnosis = document.getElementById('tmpl-diag')?.value || 'Clinical condition';
  const notes = document.getElementById('tmpl-notes')?.value || '';
  const d1 = document.getElementById('tmpl-d1-name')?.value || 'Standard Formulation';
  const dose1 = document.getElementById('tmpl-d1-dose')?.value || '1 tab daily for 30 days';

  if (!name) {
    showToast({ title: 'Name Required', message: 'Please enter template name.', type: 'warning' });
    return;
  }

  addPrescriptionTemplate({
    name,
    category,
    diagnosis,
    notes,
    drugs: [
      { drug: d1, dose: dose1, duration: '30 days', instructions: 'After food' }
    ],
    recommendedLabs: ['Routine Blood Work']
  });

  closeModal();
  showToast({ title: 'Template Saved', message: `Saved "${name}" to doctor formulary.`, type: 'success' });
  renderPrescriptionTemplates();
};
