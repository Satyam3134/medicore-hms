// ============================================================
// doctor/myPatients.js — Module 2: Doctor's Assigned Patients
// ============================================================

import { renderTopbar } from '../../components/topbar.js';
import { renderSidebar } from '../../components/sidebar.js';
import { get, getDoctorPatients } from '../../store.js';
import { refreshIcons } from '../../components/icons.js';

function getActiveDoctor() {
  const currentUserId = get('currentUserId');
  const staff = get('staff');
  return staff.find(s => s.id === currentUserId && s.role === 'Doctor') || staff.find(s => s.role === 'Doctor') || staff[0];
}

export function renderDoctorMyPatients() {
  renderSidebar();
  const me = getActiveDoctor();
  renderTopbar({
    breadcrumb: [
      { label: 'Doctor Workspace', path: '/dr/dashboard' },
      { label: 'My Assigned Patients' }
    ]
  });

  const myPatients = getDoctorPatients(me.id);

  const content = document.getElementById('content');
  content.innerHTML = `
    <!-- Header -->
    <div class="page-header">
      <div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
          <h1 class="page-title">My Patients Directory</h1>
          <span class="badge badge-primary">${me.name} (${myPatients.length} Active Records)</span>
        </div>
        <p class="page-subtitle">Assigned patient roster, diagnosis tags, previous visit dates, and instant clinical workspace access</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary" onclick="exportMyPatientsCSV()">
          <i data-lucide="download"></i> Export Roster CSV
        </button>
      </div>
    </div>

    <!-- Search & Filter Bar -->
    <div class="card mb-6" style="padding:14px 20px;background:white">
      <div style="display:flex;gap:12px;align-items:center">
        <input type="text" class="form-control" placeholder="Search patients by name, diagnosis or ID..." id="my-pat-search" oninput="filterMyPatientsTable()" />
      </div>
    </div>

    <!-- Patient Directory Table -->
    <div class="card">
      <div class="card-header" style="background:#F8FAFC">
        <span class="card-title">Assigned Patients (${myPatients.length})</span>
        <span class="badge badge-gray">Synchronized with Hospital Assignment Engine</span>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Patient Details</th>
              <th>Demographics</th>
              <th>Primary Condition / Diagnosis</th>
              <th>Last Consultation</th>
              <th>Prescriptions</th>
              <th>Status</th>
              <th class="td-actions">Clinical Actions</th>
            </tr>
          </thead>
          <tbody id="my-pat-tbody">
            ${renderMyPatientRows(myPatients)}
          </tbody>
        </table>
      </div>
    </div>
  `;

  refreshIcons(content);
}

function renderMyPatientRows(list) {
  if (!list.length) {
    return `<tr><td colspan="7"><div class="empty-state"><div class="es-title">No assigned patients found</div></div></td></tr>`;
  }

  return list.map(p => {
    const lastVisitObj = p.visits?.[0];
    const condition = p.medicalHistory?.[0] || lastVisitObj?.diagnosis || 'General OPD Evaluation';

    return `
      <tr>
        <td>
          <div style="font-weight:800;font-size:var(--font-size-base);color:var(--color-text)">${p.name}</div>
          <div style="font-size:var(--font-size-xs);color:var(--color-text-muted)">
            ID: <strong style="color:var(--color-primary)">${p.patientId}</strong> · ${p.phone}
          </div>
        </td>
        <td>
          <div style="font-weight:600">${p.age} yrs, ${p.gender}</div>
          <div style="font-size:11px;color:var(--color-text-muted)">Blood: <strong style="color:var(--color-danger)">${p.bloodGroup}</strong></div>
        </td>
        <td>
          <span class="badge badge-info badge-no-dot" style="font-size:12px;font-weight:600;max-width:220px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
            ${condition}
          </span>
          ${p.allergies?.length > 0 ? `
            <div style="font-size:10px;color:var(--color-danger);font-weight:700;margin-top:2px">
              ⚠ Allergy: ${p.allergies.join(', ')}
            </div>
          ` : ''}
        </td>
        <td>
          <div style="font-weight:600">${p.lastVisit || 'Recent'}</div>
          <div style="font-size:11px;color:var(--color-text-muted)">${p.visits?.length || 1} Total Visits</div>
        </td>
        <td>
          <div style="font-weight:700">${p.prescriptions?.length || 0} Drugs</div>
          <div style="font-size:11px;color:var(--color-text-muted)">Active e-Rx</div>
        </td>
        <td>
          <span class="badge badge-${p.status === 'Admitted' ? 'danger' : 'success'}">
            ${p.status || 'OPD'}
          </span>
        </td>
        <td class="td-actions">
          <button class="btn btn-primary btn-sm" onclick="navigateTo('/dr/consultation/${p.id}')">
            <i data-lucide="stethoscope"></i> Consult
          </button>
          <button class="btn btn-secondary btn-sm" onclick="navigateTo('/ha/patients/${p.id}')" title="View Full EMR Profile">
            <i data-lucide="file-text"></i> EMR
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

window.exportMyPatientsCSV = () => {
  showToast({ title: 'Exporting CSV', message: 'Assigned patients list exported.', type: 'info' });
};
