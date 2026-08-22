// ============================================================
// doctor/consultation.js — Module 4: Live Patient Consultation Work Surface
// ============================================================

import { renderTopbar } from '../../components/topbar.js';
import { renderSidebar } from '../../components/sidebar.js';
import { get, getPatientById, recordConsultationVisit, getPrescriptionTemplates } from '../../store.js';
import { showToast } from '../../components/toast.js';
import { refreshIcons } from '../../components/icons.js';

let rxRows = [
  { drug: 'Telmisartan 40mg', dose: '1 tab once daily (morning)', duration: '30 days', instructions: 'After breakfast' }
];

let selectedLabs = [];

function getActiveDoctor() {
  const currentUserId = get('currentUserId');
  const staff = get('staff');
  return staff.find(s => s.id === currentUserId && s.role === 'Doctor') || staff.find(s => s.role === 'Doctor') || staff[0];
}

export function renderDoctorConsultation({ params, query }) {
  const patientId = params?.id || 'p1';
  const apptId = query?.apptId || null;
  const patient = getPatientById(patientId) || get('patients')[0];
  const me = getActiveDoctor();
  const templates = getPrescriptionTemplates();

  renderSidebar();
  renderTopbar({
    breadcrumb: [
      { label: 'Doctor Workspace', path: '/dr/dashboard' },
      { label: 'My Patients', path: '/dr/patients' },
      { label: `Consultation: ${patient.name}` }
    ]
  });

  const content = document.getElementById('content');
  content.innerHTML = `
    <!-- Top Patient Bar -->
    <div style="background:white;border:1.5px solid var(--color-border);border-radius:14px;padding:18px 24px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;box-shadow:var(--shadow-xs);flex-wrap:wrap;gap:16px">
      <div style="display:flex;align-items:center;gap:16px">
        <div class="avatar avatar-lg" style="background:${patient.gender === 'Female' ? '#be185d' : 'var(--color-primary)'};font-size:22px;font-weight:800">
          ${patient.name.charAt(0)}
        </div>
        <div>
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:2px">
            <h1 style="font-size:20px;font-weight:800;color:var(--color-text);margin:0">${patient.name}</h1>
            <span class="badge badge-gray badge-no-dot">${patient.patientId}</span>
            <span class="badge badge-${patient.status === 'Admitted' ? 'danger' : 'success'}">${patient.status}</span>
          </div>
          <div style="font-size:12px;color:var(--color-text-muted)">
            ${patient.age} yrs · ${patient.gender} · Blood: <strong style="color:var(--color-danger)">${patient.bloodGroup}</strong> · ${patient.phone}
          </div>
        </div>
      </div>

      <div style="display:flex;align-items:center;gap:10px">
        <button class="btn btn-secondary btn-sm" onclick="navigateTo('/ha/patients/${patient.id}')">
          <i data-lucide="external-link"></i> Full Patient Record
        </button>
        <button class="btn btn-primary btn-sm" onclick="navigateTo('/dr/dashboard')">
          ← Back to OPD Queue
        </button>
      </div>
    </div>

    <!-- Allergies Alert Banner if Present -->
    ${patient.allergies?.length > 0 ? `
      <div class="alert alert-danger mb-4" style="display:flex;align-items:center;gap:10px;padding:10px 16px">
        <i data-lucide="alert-octagon" style="width:20px;height:20px"></i>
        <div>
          <strong style="font-size:13px">CRITICAL DRUG ALLERGIES RECORDED:</strong>
          <span style="font-weight:700;margin-left:6px">${patient.allergies.join(', ')}</span> — Check formulation ingredients before prescribing!
        </div>
      </div>
    ` : ''}

    <!-- 2-COLUMN MASTER CONSULTATION WORKSPACE -->
    <div style="display:grid;grid-template-columns:1fr 1.5fr;gap:24px;align-items:start">
      
      <!-- LEFT COLUMN: Patient Clinical Baseline & History -->
      <div style="display:flex;flex-direction:column;gap:20px">
        
        <!-- Live Vitals Capture -->
        <div class="card">
          <div class="card-header" style="background:#F8FAFC">
            <span class="card-title">Recorded Vitals Today</span>
            <span class="badge badge-gray">Triage Nurse Verified</span>
          </div>
          <div class="card-body" style="padding:16px">
            <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:10px;text-align:center">
              <div style="background:#F8FAFC;padding:8px;border-radius:8px;border:1px solid var(--color-border)">
                <div style="font-size:11px;color:var(--color-text-muted)">BP (mmHg)</div>
                <input type="text" id="vit-bp" class="form-control" style="text-align:center;font-weight:800;font-size:14px;padding:2px 4px;margin-top:2px" value="${patient.vitals?.bp || '120/80'}" />
              </div>
              <div style="background:#F8FAFC;padding:8px;border-radius:8px;border:1px solid var(--color-border)">
                <div style="font-size:11px;color:var(--color-text-muted)">Pulse (bpm)</div>
                <input type="number" id="vit-pulse" class="form-control" style="text-align:center;font-weight:800;font-size:14px;padding:2px 4px;margin-top:2px" value="${patient.vitals?.pulse || 76}" />
              </div>
              <div style="background:#F8FAFC;padding:8px;border-radius:8px;border:1px solid var(--color-border)">
                <div style="font-size:11px;color:var(--color-text-muted)">SpO2 (%)</div>
                <input type="number" id="vit-spo2" class="form-control" style="text-align:center;font-weight:800;font-size:14px;padding:2px 4px;margin-top:2px" value="${patient.vitals?.spo2 || 98}" />
              </div>
              <div style="background:#F8FAFC;padding:8px;border-radius:8px;border:1px solid var(--color-border)">
                <div style="font-size:11px;color:var(--color-text-muted)">Temp (°F)</div>
                <input type="number" step="0.1" id="vit-temp" class="form-control" style="text-align:center;font-weight:800;font-size:14px;padding:2px 4px;margin-top:2px" value="${patient.vitals?.temp || 98.4}" />
              </div>
              <div style="background:#F8FAFC;padding:8px;border-radius:8px;border:1px solid var(--color-border)">
                <div style="font-size:11px;color:var(--color-text-muted)">Weight (kg)</div>
                <input type="number" id="vit-weight" class="form-control" style="text-align:center;font-weight:800;font-size:14px;padding:2px 4px;margin-top:2px" value="${patient.vitals?.weight || 70}" />
              </div>
              <div style="background:#F8FAFC;padding:8px;border-radius:8px;border:1px solid var(--color-border)">
                <div style="font-size:11px;color:var(--color-text-muted)">BMI Index</div>
                <div style="font-weight:800;font-size:14px;color:var(--color-primary);margin-top:6px">24.2 (Normal)</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Medical History & Chronic Conditions -->
        <div class="card">
          <div class="card-header" style="background:#F8FAFC">
            <span class="card-title">Past History & Active Diagnoses</span>
          </div>
          <div class="card-body" style="padding:16px">
            <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px">
              ${(patient.medicalHistory || ['Essential Hypertension']).map(h => `
                <span class="badge badge-info" style="font-size:12px;padding:4px 10px">${h}</span>
              `).join('')}
            </div>
            <div style="font-size:12px;color:var(--color-text-muted)">
              Insurance: <strong>${patient.insurance || 'Direct Self-Pay'}</strong>
            </div>
          </div>
        </div>

        <!-- Previous Visits Timeline -->
        <div class="card">
          <div class="card-header" style="background:#F8FAFC">
            <span class="card-title">Previous Consultation History</span>
            <span class="badge badge-gray">${patient.visits?.length || 0} Visits</span>
          </div>
          <div class="card-body" style="padding:16px" class="scroll-y" style="max-height:300px">
            ${(patient.visits || []).map(v => `
              <div style="border-left:3px solid var(--color-primary);padding-left:12px;margin-bottom:14px">
                <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--color-text-muted)">
                  <span>${v.date} · ${v.type}</span>
                  <span style="font-weight:700">${v.doctor}</span>
                </div>
                <div style="font-weight:700;font-size:13px;color:var(--color-text);margin-top:2px">${v.diagnosis}</div>
                <div style="font-size:12px;color:var(--color-text-muted);margin-top:2px">${v.notes}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Recent Diagnostic Lab Reports -->
        <div class="card">
          <div class="card-header" style="background:#F8FAFC">
            <span class="card-title">Laboratory Investigations</span>
            <span class="badge badge-gray">${patient.labReports?.length || 0} Reports</span>
          </div>
          <div class="card-body" style="padding:16px">
            ${(patient.labReports || []).length === 0 ? `<div style="font-size:12px;color:var(--color-text-muted)">No prior diagnostic reports available.</div>` : `
              ${patient.labReports.map(lr => `
                <div style="padding:10px;background:#F8FAFC;border-radius:8px;margin-bottom:8px;border:1px solid var(--color-border);font-size:12px">
                  <div style="display:flex;justify-content:space-between;font-weight:700">
                    <span>${lr.test}</span>
                    <span class="badge badge-success" style="font-size:10px">${lr.status.toUpperCase()}</span>
                  </div>
                  <div style="color:var(--color-text);margin-top:4px">Result: <strong>${lr.result}</strong></div>
                  <div style="font-size:11px;color:var(--color-text-muted);margin-top:2px">${lr.date} · Ordered by ${lr.ordered}</div>
                </div>
              `).join('')}
            `}
          </div>
        </div>

      </div>

      <!-- RIGHT COLUMN: Active Clinical Visit Form & Prescription Engine -->
      <div style="display:flex;flex-direction:column;gap:20px">
        
        <div class="card" style="border:2px solid var(--color-primary);box-shadow:var(--shadow-sm)">
          <div class="card-header" style="background:#EFF6FF">
            <div>
              <span class="card-title" style="color:var(--color-primary)">🩺 Clinical Consultation & e-Prescription (Rx)</span>
              <div style="font-size:12px;color:var(--color-text-muted)">Active visit entry for Dr. ${me.name}</div>
            </div>

            <!-- Quick Template Injector Dropdown -->
            <div style="display:flex;align-items:center;gap:8px">
              <span style="font-size:11px;font-weight:700;color:var(--color-text-muted);text-transform:uppercase">Quick Template:</span>
              <select class="form-control" style="width:220px;font-size:12px;padding:4px 8px" id="template-injector" onchange="applyRxTemplate(this.value)">
                <option value="">-- Apply Rx Template --</option>
                ${templates.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
              </select>
            </div>
          </div>

          <div class="card-body" style="padding:24px">
            
            <!-- Chief Complaint -->
            <div class="form-group mb-4">
              <label class="form-label" style="font-weight:700">Chief Clinical Complaints & Symptoms <span class="required">*</span></label>
              <textarea class="form-control" id="visit-complaint" rows="2" placeholder="e.g. Exertional breathlessness, mild chest tightness since 3 days, headaches on waking up.">Routine follow-up evaluation. Patient reports mild evening fatigue.</textarea>
            </div>

            <!-- ICD-10 Diagnosis -->
            <div class="form-group mb-4">
              <label class="form-label" style="font-weight:700">Primary Clinical Diagnosis (ICD-10) <span class="required">*</span></label>
              <input type="text" class="form-control" id="visit-diagnosis" value="Essential Hypertension (I10) — Stable" required />
            </div>

            <!-- Electronic Prescription (Rx Builder) -->
            <div class="mb-4">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
                <label class="form-label" style="font-weight:700;margin:0">💊 Prescribed Medications (e-Rx)</label>
                <button class="btn btn-sm btn-secondary" onclick="addRxItemRow()">
                  <i data-lucide="plus"></i> Add Drug Row
                </button>
              </div>

              <div id="rx-rows-container">
                ${renderRxRows()}
              </div>
            </div>

            <!-- Diagnostic Lab Tests Order -->
            <div class="form-group mb-4">
              <label class="form-label" style="font-weight:700">🧪 Order Diagnostic Investigations (Pathology / Radiology)</label>
              <div style="display:flex;flex-wrap:wrap;gap:8px" id="lab-tags-container">
                ${['Lipid Profile Extended', 'HbA1c Glycated Hemoglobin', '12-Lead ECG', 'Digital Chest X-Ray', 'Serum Creatinine & Electrolytes', 'Complete Blood Count (CBC)'].map(test => {
                  const isChecked = selectedLabs.includes(test);
                  return `
                    <label style="display:flex;align-items:center;gap:6px;background:${isChecked ? '#EFF6FF' : '#F8FAFC'};border:1px solid ${isChecked ? 'var(--color-primary)' : 'var(--color-border)'};padding:6px 12px;border-radius:8px;cursor:pointer;font-size:12px">
                      <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="toggleLabSelection('${test}')" />
                      <span>${test}</span>
                    </label>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- Clinical Advice & Follow-Up -->
            <div class="form-row mb-4">
              <div class="form-group">
                <label class="form-label" style="font-weight:700">Dietary & Lifestyle Advice</label>
                <input type="text" class="form-control" id="visit-advice" value="Low sodium diet (<2g/day), daily 30-minute brisk walk. Avoid strenuous lifting." />
              </div>
              <div class="form-group">
                <label class="form-label" style="font-weight:700">Follow-Up Review Date</label>
                <input type="date" class="form-control" id="visit-followup" value="${getAheadDate(30)}" />
              </div>
            </div>

            <!-- Internal Specialist Referral Checkbox -->
            <div class="form-group mb-6" style="background:#F8FAFC;padding:12px 16px;border-radius:10px;border:1px solid var(--color-border)">
              <label class="form-check" style="margin:0">
                <input type="checkbox" id="visit-refer-check" onchange="toggleReferralInput()" />
                <span style="font-size:13px;font-weight:700">Refer patient to another specialist in this hospital</span>
              </label>
              <div id="referral-box" style="display:none;margin-top:12px">
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Specialty Department</label>
                    <select class="form-control" id="refer-dept">
                      <option>General Medicine (Dr. Aditya Kapoor)</option>
                      <option>Neurology (Dr. Ananya Singh)</option>
                      <option>Orthopedics (Dr. Suresh Patel)</option>
                      <option>Dermatology (Dr. Priya Nambiar)</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Referral Reason</label>
                    <input type="text" class="form-control" id="refer-notes" placeholder="e.g. For diabetic optimization and renal check" />
                  </div>
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div style="display:flex;justify-content:space-between;align-items:center;padding-top:16px;border-top:2px solid var(--color-border)">
              <button class="btn btn-secondary" onclick="saveVisitDraft()">
                <i data-lucide="save"></i> Save Draft
              </button>

              <button class="btn btn-primary btn-lg" onclick="finalizeConsultation('${patient.id}', '${apptId || ''}')">
                <i data-lucide="check-circle"></i> Complete Visit & Dispatch WhatsApp Rx
              </button>
            </div>

          </div>
        </div>

      </div>

    </div>
  `;

  refreshIcons(content);
}

function getAheadDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function renderRxRows() {
  return rxRows.map((rx, index) => `
    <div style="display:grid;grid-template-columns:1.5fr 1.2fr 0.8fr 1.2fr 36px;gap:8px;align-items:center;margin-bottom:8px">
      <input type="text" class="form-control" placeholder="Drug Name" value="${rx.drug}" oninput="updateRxItem(${index}, 'drug', this.value)" />
      <input type="text" class="form-control" placeholder="Dosage (e.g. 1 tab morning)" value="${rx.dose}" oninput="updateRxItem(${index}, 'dose', this.value)" />
      <input type="text" class="form-control" placeholder="Duration" value="${rx.duration}" oninput="updateRxItem(${index}, 'duration', this.value)" />
      <input type="text" class="form-control" placeholder="Instructions" value="${rx.instructions}" oninput="updateRxItem(${index}, 'instructions', this.value)" />
      <button class="btn btn-danger btn-sm" style="padding:6px" onclick="removeRxItem(${index})">
        <i data-lucide="trash-2" style="width:14px;height:14px"></i>
      </button>
    </div>
  `).join('');
}

window.addRxItemRow = () => {
  rxRows.push({ drug: '', dose: '1 tab once daily', duration: '30 days', instructions: 'After food' });
  const container = document.getElementById('rx-rows-container');
  if (container) container.innerHTML = renderRxRows();
  refreshIcons(container);
};

window.removeRxItem = (index) => {
  rxRows.splice(index, 1);
  if (rxRows.length === 0) rxRows.push({ drug: '', dose: '', duration: '', instructions: '' });
  const container = document.getElementById('rx-rows-container');
  if (container) container.innerHTML = renderRxRows();
  refreshIcons(container);
};

window.updateRxItem = (index, key, val) => {
  if (rxRows[index]) rxRows[index][key] = val;
};

window.toggleLabSelection = (testName) => {
  if (selectedLabs.includes(testName)) {
    selectedLabs = selectedLabs.filter(t => t !== testName);
  } else {
    selectedLabs.push(testName);
  }
};

window.applyRxTemplate = (templateId) => {
  if (!templateId) return;
  const tmpl = getPrescriptionTemplates().find(t => t.id === templateId);
  if (tmpl) {
    document.getElementById('visit-diagnosis').value = tmpl.diagnosis;
    document.getElementById('visit-advice').value = tmpl.notes;
    rxRows = tmpl.drugs.map(d => ({ ...d }));
    selectedLabs = [...(tmpl.recommendedLabs || [])];

    const rxContainer = document.getElementById('rx-rows-container');
    if (rxContainer) rxContainer.innerHTML = renderRxRows();
    refreshIcons(rxContainer);

    showToast({ title: 'Template Applied', message: `Injected "${tmpl.name}" into visit.`, type: 'success' });
  }
};

window.toggleReferralInput = () => {
  const isChecked = document.getElementById('visit-refer-check')?.checked;
  const box = document.getElementById('referral-box');
  if (box) box.style.display = isChecked ? 'block' : 'none';
};

window.saveVisitDraft = () => {
  showToast({ title: 'Draft Saved', message: 'Clinical consultation draft saved locally.', type: 'info' });
};

window.finalizeConsultation = (patientId, apptId) => {
  const me = getActiveDoctor();
  const diagnosis = document.getElementById('visit-diagnosis')?.value || 'Clinical evaluation completed';
  const complaint = document.getElementById('visit-complaint')?.value || '';
  const advice = document.getElementById('visit-advice')?.value || '';
  const followup = document.getElementById('visit-followup')?.value || '';

  const bp = document.getElementById('vit-bp')?.value;
  const pulse = parseInt(document.getElementById('vit-pulse')?.value);
  const spo2 = parseInt(document.getElementById('vit-spo2')?.value);
  const temp = parseFloat(document.getElementById('vit-temp')?.value);
  const weight = parseFloat(document.getElementById('vit-weight')?.value);

  recordConsultationVisit(patientId, {
    doctorName: me.name,
    diagnosis,
    clinicalNotes: `${complaint}. Advice: ${advice}. Next Review: ${followup}.`,
    prescriptions: rxRows.filter(r => r.drug.trim().length > 0),
    labs: selectedLabs,
    appointmentId: apptId || undefined,
    vitals: { bp, pulse, spo2, temp, weight }
  });

  showToast({
    title: '✓ Visit Completed & Rx Dispatched',
    message: `Prescription & follow-up instructions sent to patient via WhatsApp.`,
    type: 'wa'
  });

  navigateTo('/dr/dashboard');
};
