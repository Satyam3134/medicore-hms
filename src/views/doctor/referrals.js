// ============================================================
// doctor/referrals.js — Module 8: Doctor-to-Doctor Referrals
// ============================================================

import { renderTopbar } from '../../components/topbar.js';
import { renderSidebar } from '../../components/sidebar.js';
import { get, getDoctorReferrals, createDoctorReferral, getDoctorPatients } from '../../store.js';
import { showToast } from '../../components/toast.js';
import { openModal, closeModal } from '../../components/modal.js';
import { refreshIcons } from '../../components/icons.js';

function getActiveDoctor() {
  const currentUserId = get('currentUserId');
  const staff = get('staff');
  return staff.find(s => s.id === currentUserId && s.role === 'Doctor') || staff.find(s => s.role === 'Doctor') || staff[0];
}

export function renderDoctorReferrals() {
  renderSidebar();
  const me = getActiveDoctor();
  renderTopbar({
    breadcrumb: [
      { label: 'Doctor Workspace', path: '/dr/dashboard' },
      { label: 'Inter-Specialist Referrals' }
    ]
  });

  const referrals = getDoctorReferrals();

  const content = document.getElementById('content');
  content.innerHTML = `
    <!-- Header -->
    <div class="page-header">
      <div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
          <h1 class="page-title">Inter-Specialist Patient Referrals</h1>
          <span class="badge badge-primary">Cross-Department Consultations</span>
        </div>
        <p class="page-subtitle">Refer patients to peer specialists across Cardiology, Neurology, Orthopedics, and Oncology with clinical case handover notes</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" onclick="openCreateReferralModal()">
          <i data-lucide="share-2"></i> Create New Referral
        </button>
      </div>
    </div>

    <!-- Referrals Table -->
    <div class="card">
      <div class="card-header" style="background:#F8FAFC">
        <span class="card-title">Active Referral Ledger (${referrals.length})</span>
        <span class="badge badge-gray">Multi-Specialty Coordination</span>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Patient Details</th>
              <th>Originating Physician</th>
              <th>Referred To Specialist</th>
              <th>Target Department</th>
              <th>Clinical Referral Reason</th>
              <th>Date</th>
              <th>Status</th>
              <th class="td-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${referrals.map(ref => `
              <tr>
                <td>
                  <div style="font-weight:700;font-size:var(--font-size-base)">${ref.patientName}</div>
                  <div style="font-size:11px;color:var(--color-text-muted)">ID: ${ref.patientId}</div>
                </td>
                <td>
                  <div style="font-weight:600">${ref.fromDoctorName}</div>
                </td>
                <td>
                  <div style="font-weight:700;color:var(--color-primary)">${ref.toDoctorName}</div>
                </td>
                <td><span class="badge badge-info badge-no-dot">${ref.toDepartment}</span></td>
                <td>
                  <div style="font-size:12px;max-width:260px;color:var(--color-text)">${ref.reason}</div>
                </td>
                <td style="color:var(--color-text-muted)">${ref.date}</td>
                <td>
                  <span class="badge badge-${ref.status === 'completed' ? 'success' : 'warning'}">
                    ${ref.status.toUpperCase()}
                  </span>
                </td>
                <td class="td-actions">
                  <button class="btn btn-secondary btn-sm" onclick="navigateTo('/dr/consultation/${ref.patientId}')">
                    Open Case →
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  refreshIcons(content);
}

window.openCreateReferralModal = () => {
  const me = getActiveDoctor();
  const patients = getDoctorPatients(me.id);
  const doctors = get('staff').filter(s => s.role === 'Doctor' && s.id !== me.id);

  openModal({
    title: 'Initiate Specialist Patient Referral',
    size: 'md',
    body: `
      <div class="form-group">
        <label class="form-label">Select Patient <span class="required">*</span></label>
        <select class="form-control" id="ref-patient">
          ${patients.map(p => `<option value="${p.id}" data-name="${p.name}">${p.name} (${p.patientId})</option>`).join('')}
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Refer To Specialist <span class="required">*</span></label>
        <select class="form-control" id="ref-doctor">
          ${doctors.map(d => `<option value="${d.id}" data-name="${d.name}" data-dept="${d.department}">${d.name} — ${d.department}</option>`).join('')}
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Clinical Indication & Handover Notes <span class="required">*</span></label>
        <textarea class="form-control" id="ref-reason" rows="3" placeholder="e.g. Patient presents with persistent diabetic radiculopathy. Kindly evaluate for peripheral neuropathy and nerve conduction study." required></textarea>
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="window._closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="submitDoctorReferralForm()">Dispatch Referral Handover</button>
    `
  });
};

window.submitDoctorReferralForm = () => {
  const me = getActiveDoctor();
  const patientSelect = document.getElementById('ref-patient');
  const patientId = patientSelect?.value;
  const patientName = patientSelect?.options[patientSelect.selectedIndex]?.getAttribute('data-name') || 'Patient';

  const doctorSelect = document.getElementById('ref-doctor');
  const toDoctorId = doctorSelect?.value;
  const toDoctorName = doctorSelect?.options[doctorSelect.selectedIndex]?.getAttribute('data-name') || 'Doctor';
  const toDepartment = doctorSelect?.options[doctorSelect.selectedIndex]?.getAttribute('data-dept') || 'Specialty';

  const reason = document.getElementById('ref-reason')?.value;
  if (!reason) {
    showToast({ title: 'Reason Required', message: 'Please enter clinical referral notes.', type: 'warning' });
    return;
  }

  createDoctorReferral({
    patientId,
    patientName,
    fromDoctorId: me.id,
    fromDoctorName: me.name,
    toDoctorId,
    toDoctorName,
    toDepartment,
    reason,
    priority: 'priority'
  });

  closeModal();
  showToast({ title: 'Referral Dispatched', message: `Case transferred to ${toDoctorName}.`, type: 'success' });
  renderDoctorReferrals();
};
