// ============================================================
// hospitaladmin/patients/patientProfile.js — Rich Patient EMR
// ============================================================

import { renderTopbar } from '../../../components/topbar.js';
import { renderSidebar } from '../../../components/sidebar.js';
import { getPatientById, getStaffById, get } from '../../../store.js';
import { showToast } from '../../../components/toast.js';
import { openModal, closeModal } from '../../../components/modal.js';

export function renderPatientProfile({ params }) {
  const { id } = params;
  const patient = getPatientById(id);
  if (!patient) {
    document.getElementById('content').innerHTML = `<div class="empty-state"><div class="es-title">Patient not found</div></div>`;
    return;
  }

  renderSidebar();
  renderTopbar({ breadcrumb: [
    { label: 'Hospital Admin', path: '/ha/dashboard' },
    { label: 'Patients', path: '/ha/patients' },
    { label: patient.name }
  ] });

  const assignedDoc = getStaffById(patient.assignedDoctor);

  const content = document.getElementById('content');
  content.innerHTML = `
    <!-- Patient Header -->
    <div class="page-header">
      <div style="display:flex;align-items:center;gap:16px">
        <div class="avatar avatar-xl" style="background:${patient.gender === 'Female' ? '#be185d' : 'var(--color-primary)'}">${patient.name.charAt(0)}</div>
        <div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
            <h1 class="page-title">${patient.name}</h1>
            <span class="badge badge-gray badge-no-dot" style="font-size:11px">${patient.patientId}</span>
            <span class="badge badge-${patient.status === 'Admitted' ? 'danger' : patient.status === 'OPD' ? 'info' : 'gray'}">${patient.status}</span>
          </div>
          <div style="display:flex;gap:16px;font-size:13px;color:var(--color-text-muted)">
            <span>${patient.age}y · ${patient.gender}</span>
            <span>Blood: <strong style="color:var(--color-danger)">${patient.bloodGroup}</strong></span>
            <span>${patient.phone}</span>
            ${patient.allergies.length > 0 ? `<span style="color:var(--color-danger)">⚠ Allergies: ${patient.allergies.join(', ')}</span>` : ''}
          </div>
        </div>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary" onclick="navigateTo('/ha/patients')">← Back</button>
        <button class="btn btn-secondary" onclick="openAssignDoctorModal('${patient.id}')">
          <i data-lucide="user-check" style="width:14px;height:14px"></i> Reassign Doctor
        </button>
        <button class="btn btn-primary" onclick="bookForPatient('${patient.id}')">
          <i data-lucide="calendar-plus" style="width:14px;height:14px"></i> Book Appointment
        </button>
      </div>
    </div>

    <!-- Quick Info Bar -->
    <div style="display:flex;gap:12px;margin-bottom:24px;flex-wrap:wrap">
      <div class="card" style="flex:1;min-width:140px;padding:12px 16px">
        <div style="font-size:11px;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">Assigned Doctor</div>
        <div style="font-weight:600;font-size:13px">${assignedDoc?.name || 'Not Assigned'}</div>
        <div style="font-size:11px;color:var(--color-text-muted)">${assignedDoc?.department || ''}</div>
      </div>
      <div class="card" style="flex:1;min-width:140px;padding:12px 16px">
        <div style="font-size:11px;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">Last Visit</div>
        <div style="font-weight:600;font-size:13px">${patient.lastVisit}</div>
        <div style="font-size:11px;color:var(--color-text-muted)">${patient.visits.length} visits total</div>
      </div>
      <div class="card" style="flex:1;min-width:140px;padding:12px 16px">
        <div style="font-size:11px;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">Registered</div>
        <div style="font-weight:600;font-size:13px">${patient.registeredDate}</div>
      </div>
      <div class="card" style="flex:1;min-width:140px;padding:12px 16px">
        <div style="font-size:11px;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">Insurance</div>
        <div style="font-weight:600;font-size:13px;font-size:12px">${patient.insurance || 'Self-Pay'}</div>
      </div>
      <div class="card" style="flex:1;min-width:140px;padding:12px 16px">
        <div style="font-size:11px;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">Emergency Contact</div>
        <div style="font-size:12px;font-weight:500">${patient.emergencyContact || '—'}</div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs" id="patient-tabs">
      <button class="tab-btn active" onclick="switchPatientTab('overview', this)">
        <i data-lucide="layout-dashboard" style="width:14px;height:14px"></i> Overview
      </button>
      <button class="tab-btn" onclick="switchPatientTab('visits', this)">
        <i data-lucide="calendar" style="width:14px;height:14px"></i> Visit History (${patient.visits.length})
      </button>
      <button class="tab-btn" onclick="switchPatientTab('prescriptions', this)">
        <i data-lucide="pill" style="width:14px;height:14px"></i> Prescriptions (${patient.prescriptions.length})
      </button>
      <button class="tab-btn" onclick="switchPatientTab('labs', this)">
        <i data-lucide="flask-conical" style="width:14px;height:14px"></i> Lab Reports (${patient.labReports.length})
      </button>
      <button class="tab-btn" onclick="switchPatientTab('billing', this)">
        <i data-lucide="receipt" style="width:14px;height:14px"></i> Billing (${patient.billing.length})
      </button>
    </div>

    <!-- Tab Content -->
    <div id="tab-overview" class="tab-content active">${renderOverviewTab(patient)}</div>
    <div id="tab-visits"   class="tab-content">${renderVisitsTab(patient)}</div>
    <div id="tab-prescriptions" class="tab-content">${renderPrescriptionsTab(patient)}</div>
    <div id="tab-labs"    class="tab-content">${renderLabsTab(patient)}</div>
    <div id="tab-billing" class="tab-content">${renderBillingTab(patient)}</div>
  `;

  if (window.lucide) lucide.createIcons({ el: content });
}

function renderOverviewTab(p) {
  const v = p.vitals;
  return `
    <div class="content-grid">
      <div>
        <!-- Vitals -->
        <div class="card" style="margin-bottom:20px">
          <div class="card-header"><span class="card-title">Latest Vitals</span><span style="font-size:12px;color:var(--color-text-muted)">${p.lastVisit}</span></div>
          <div class="card-body">
            <div class="vitals-grid">
              <div class="vital-item">
                <div class="vital-value">${v.bp || '—'}</div>
                <div class="vital-unit">mmHg</div>
                <div class="vital-label">Blood Pressure</div>
              </div>
              <div class="vital-item">
                <div class="vital-value">${v.pulse || '—'}</div>
                <div class="vital-unit">bpm</div>
                <div class="vital-label">Pulse Rate</div>
              </div>
              <div class="vital-item">
                <div class="vital-value">${v.temp || '—'}</div>
                <div class="vital-unit">°F</div>
                <div class="vital-label">Temperature</div>
              </div>
              <div class="vital-item">
                <div class="vital-value">${v.spo2 || '—'}</div>
                <div class="vital-unit">%</div>
                <div class="vital-label">SpO₂</div>
              </div>
              <div class="vital-item">
                <div class="vital-value">${v.weight || '—'}</div>
                <div class="vital-unit">kg</div>
                <div class="vital-label">Weight</div>
              </div>
              <div class="vital-item">
                <div class="vital-value">${v.height || '—'}</div>
                <div class="vital-unit">cm</div>
                <div class="vital-label">Height</div>
              </div>
            </div>
          </div>
        </div>
        <!-- Medical History -->
        <div class="card">
          <div class="card-header"><span class="card-title">Medical History & Conditions</span></div>
          <div class="card-body">
            ${p.medicalHistory.length > 0
              ? p.medicalHistory.map(c => `<span class="badge badge-warning badge-no-dot" style="margin:3px">${c}</span>`).join('')
              : '<span style="color:var(--color-text-muted);font-size:13px">No known medical history</span>'
            }
            ${p.allergies.length > 0 ? `
              <div style="margin-top:12px">
                <div style="font-size:12px;font-weight:600;color:var(--color-danger);margin-bottom:6px">⚠ Allergies</div>
                ${p.allergies.map(a => `<span class="badge badge-danger badge-no-dot" style="margin:2px">${a}</span>`).join('')}
              </div>
            ` : ''}
          </div>
        </div>
      </div>
      <!-- Recent Activity -->
      <div>
        <div class="card" style="margin-bottom:20px">
          <div class="card-header"><span class="card-title">Recent Visits</span></div>
          <div>
            ${p.visits.slice(0, 3).map(v => `
              <div style="padding:14px 20px;border-bottom:1px solid var(--color-border)">
                <div style="display:flex;justify-content:space-between;margin-bottom:4px">
                  <span style="font-size:13px;font-weight:500">${v.diagnosis}</span>
                  <span style="font-size:11px;color:var(--color-text-muted)">${v.date}</span>
                </div>
                <div style="font-size:12px;color:var(--color-text-muted);margin-bottom:4px">By ${v.doctor} · ${v.type}</div>
                <div style="font-size:12px;color:var(--color-text-muted)">${v.notes}</div>
              </div>
            `).join('') || '<div class="empty-state" style="padding:30px"><div class="es-title">No visits recorded</div></div>'}
          </div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">Patient Info</span></div>
          <div class="card-body">
            <div class="info-list">
              <div class="info-row"><span class="info-label">Full Name</span><span class="info-value font-medium">${p.name}</span></div>
              <div class="info-row"><span class="info-label">Age / Gender</span><span class="info-value">${p.age} yrs / ${p.gender}</span></div>
              <div class="info-row"><span class="info-label">Blood Group</span><span class="info-value font-semibold" style="color:var(--color-danger)">${p.bloodGroup}</span></div>
              <div class="info-row"><span class="info-label">Address</span><span class="info-value">${p.address}</span></div>
              <div class="info-row"><span class="info-label">Emergency</span><span class="info-value">${p.emergencyContact || '—'}</span></div>
              <div class="info-row"><span class="info-label">Insurance</span><span class="info-value">${p.insurance || 'Self-Pay'}</span></div>
              <div class="info-row"><span class="info-label">ID Proof</span><span class="info-value">${p.idProof || '—'}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderVisitsTab(p) {
  return `
    <div class="data-table-wrapper">
      <div class="table-toolbar">
        <div class="table-toolbar-left"><span class="card-title">Visit History</span><span class="badge badge-gray badge-no-dot">${p.visits.length} visits</span></div>
        <div class="table-toolbar-right"><button class="btn btn-primary btn-sm"><i data-lucide="plus" style="width:13px;height:13px"></i> Add Visit Note</button></div>
      </div>
      ${p.visits.length === 0 ? `<div class="empty-state" style="padding:40px"><div class="es-title">No visit records</div></div>` :
      `<table class="data-table">
        <thead><tr><th>Date</th><th>Doctor</th><th>Type</th><th>Diagnosis</th><th>Notes</th></tr></thead>
        <tbody>
          ${p.visits.map(v => `
            <tr>
              <td style="white-space:nowrap">${v.date}</td>
              <td>${v.doctor}</td>
              <td><span class="badge badge-info badge-no-dot">${v.type}</span></td>
              <td style="font-weight:500">${v.diagnosis}</td>
              <td style="color:var(--color-text-muted);font-size:12px">${v.notes}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>`}
    </div>
  `;
}

function renderPrescriptionsTab(p) {
  return `
    <div class="card">
      <div class="card-header">
        <span class="card-title">Prescriptions</span>
        <button class="btn btn-primary btn-sm"><i data-lucide="plus" style="width:13px;height:13px"></i> New Prescription</button>
      </div>
      <div class="card-body">
        ${p.prescriptions.length === 0 ? `<div class="empty-state"><div class="es-title">No prescriptions</div></div>` :
        p.prescriptions.map(rx => `
          <div class="rx-item">
            <div>
              <div class="rx-name">${rx.drug}</div>
              <div class="rx-dose">${rx.dose}</div>
              <div style="font-size:11px;color:var(--color-text-light);margin-top:2px">By ${rx.prescribedBy} · ${rx.date}</div>
            </div>
            <div class="rx-duration"><span class="badge badge-info badge-no-dot">${rx.duration}</span></div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderLabsTab(p) {
  return `
    <div class="data-table-wrapper">
      <div class="table-toolbar">
        <div class="table-toolbar-left"><span class="card-title">Lab Reports</span></div>
        <div class="table-toolbar-right"><button class="btn btn-primary btn-sm"><i data-lucide="plus" style="width:13px;height:13px"></i> Request Lab</button></div>
      </div>
      ${p.labReports.length === 0 ? `<div class="empty-state" style="padding:40px"><div class="es-title">No lab reports</div></div>` :
      `<table class="data-table">
        <thead><tr><th>Date</th><th>Test</th><th>Ordered By</th><th>Result</th><th>Status</th></tr></thead>
        <tbody>
          ${p.labReports.map(lr => `
            <tr>
              <td>${lr.date}</td>
              <td style="font-weight:500">${lr.test}</td>
              <td style="color:var(--color-text-muted)">${lr.ordered}</td>
              <td style="color:${lr.result?.includes('High') || lr.result?.includes('Poor') ? 'var(--color-danger)' : 'var(--color-text)'}">
                ${lr.result || '—'}
              </td>
              <td><span class="badge badge-${lr.status === 'completed' ? 'success' : 'warning'}">${lr.status}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>`}
    </div>
  `;
}

function renderBillingTab(p) {
  const total = p.billing.reduce((s, b) => s + b.amount, 0);
  return `
    <div class="data-table-wrapper">
      <div class="table-toolbar">
        <div class="table-toolbar-left">
          <span class="card-title">Billing History</span>
          <span class="badge badge-gray badge-no-dot">Total: ₹${total.toLocaleString()}</span>
        </div>
        <div class="table-toolbar-right">
          <button class="btn btn-primary btn-sm"><i data-lucide="plus" style="width:13px;height:13px"></i> Generate Invoice</button>
        </div>
      </div>
      ${p.billing.length === 0 ? `<div class="empty-state" style="padding:40px"><div class="es-title">No billing records</div></div>` :
      `<table class="data-table">
        <thead><tr><th>Date</th><th>Invoice #</th><th>Description</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          ${p.billing.map(b => `
            <tr>
              <td>${b.date}</td>
              <td style="font-family:monospace;font-size:12px">${b.invoice}</td>
              <td>${b.description}</td>
              <td style="font-weight:600">₹${b.amount.toLocaleString()}</td>
              <td><span class="badge badge-${b.status === 'paid' ? 'success' : b.status === 'partial' ? 'warning' : 'danger'}">${b.status}</span></td>
              <td class="td-actions">
                <button class="row-action-btn" title="View Invoice"><i data-lucide="file-text" style="width:14px;height:14px"></i></button>
                <button class="row-action-btn" title="Print"><i data-lucide="printer" style="width:14px;height:14px"></i></button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>`}
    </div>
  `;
}

window.switchPatientTab = (tab, btn) => {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(`tab-${tab}`)?.classList.add('active');
  if (window.lucide) lucide.createIcons({ el: document.getElementById(`tab-${tab}`) });
};

window.openAssignDoctorModal = (patientId) => {
  const doctors = get('staff').filter(s => s.hospitalId === get('currentHospitalId') && s.role === 'Doctor');
  openModal({
    title: 'Assign / Reassign Doctor',
    size: 'sm',
    body: `
      <div class="form-group">
        <label class="form-label">Select Doctor <span class="required">*</span></label>
        <select class="form-control" id="ad-doctor">
          <option value="">Choose a doctor…</option>
          ${doctors.map(d => `<option value="${d.id}">${d.name} — ${d.department} (${d.status})</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Reason / Notes</label>
        <textarea class="form-control" id="ad-notes" rows="2" placeholder="Reason for assignment/reassignment…"></textarea>
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="window._closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="window._closeModal();showToast_('Doctor Assigned','Patient has been reassigned successfully.','success')">Assign Doctor</button>
    `
  });
  window.showToast_ = (t, m, type) => showToast({ title: t, message: m, type });
};

window.bookForPatient = (patientId) => {
  showToast({ title: 'Feature', message: 'Use the Book Appointment button on the dashboard.', type: 'info' });
};
