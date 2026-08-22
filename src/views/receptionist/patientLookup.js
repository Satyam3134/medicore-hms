// ============================================================
// receptionist/patientLookup.js — Module 5: Patient Lookup & Contact Editor
// ============================================================

import { renderTopbar } from '../../components/topbar.js';
import { renderSidebar } from '../../components/sidebar.js';
import { get, getHospitalPatients, updatePatientContact } from '../../store.js';
import { showToast } from '../../components/toast.js';
import { openModal, closeModal } from '../../components/modal.js';
import { refreshIcons } from '../../components/icons.js';

export function renderReceptionistPatientLookup() {
  renderSidebar();
  renderTopbar({
    breadcrumb: [
      { label: 'Front Desk', path: '/rc/queue' },
      { label: 'Patient Directory & Contact Lookup' }
    ]
  });

  const patients = getHospitalPatients();

  const content = document.getElementById('content');
  content.innerHTML = `
    <!-- Header -->
    <div class="page-header">
      <div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
          <h1 class="page-title">Patient Directory & Contact Lookup</h1>
          <span class="badge badge-primary">${patients.length} Registered Patients</span>
        </div>
        <p class="page-subtitle">Search demographic records, update patient contact info, emergency contacts, and insurance details (Clinical notes read-only)</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" onclick="navigateTo('/rc/quick-book')">
          <i data-lucide="user-plus"></i> + Register New Patient
        </button>
      </div>
    </div>

    <!-- Search Bar -->
    <div class="card mb-6" style="padding:14px 20px;background:white">
      <div style="display:flex;gap:12px;align-items:center">
        <input type="text" class="form-control" placeholder="Search patient by name, phone, UHID or emergency contact..." id="rc-pat-search" oninput="filterRcPatientTable(this.value)" />
      </div>
    </div>

    <!-- Patients Table -->
    <div class="card">
      <div class="card-header" style="background:#F8FAFC">
        <span class="card-title">Patient Records (${patients.length})</span>
        <span class="badge badge-gray">Administrative View</span>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>UHID & Name</th>
              <th>Age / Gender</th>
              <th>Phone & Email</th>
              <th>Address / City</th>
              <th>Emergency Contact</th>
              <th>Insurance / TPA</th>
              <th class="td-actions">Front Desk Actions</th>
            </tr>
          </thead>
          <tbody id="rc-pat-tbody">
            ${renderRcPatientRows(patients)}
          </tbody>
        </table>
      </div>
    </div>
  `;

  refreshIcons(content);
}

function renderRcPatientRows(list) {
  if (!list.length) {
    return `<tr><td colspan="7"><div class="empty-state"><div class="es-title">No patients found</div></div></td></tr>`;
  }

  return list.map(p => `
    <tr>
      <td>
        <div style="font-weight:800;font-size:var(--font-size-base);color:var(--color-text)">${p.name}</div>
        <div style="font-size:11px;font-family:monospace;color:var(--color-primary);font-weight:700">${p.patientId}</div>
      </td>
      <td>
        <div style="font-weight:600">${p.age} yrs, ${p.gender}</div>
        <div style="font-size:11px;color:var(--color-text-muted)">Blood: <strong>${p.bloodGroup}</strong></div>
      </td>
      <td>
        <div style="font-weight:700">${p.phone}</div>
        <div style="font-size:11px;color:var(--color-text-muted)">${p.email || 'No email'}</div>
      </td>
      <td>
        <div style="font-size:12px;max-width:200px;line-height:1.3">${p.address || 'Mumbai, MH'}</div>
      </td>
      <td>
        <div style="font-size:12px;font-weight:600">${p.emergencyContact || '—'}</div>
      </td>
      <td>
        <span class="badge badge-info badge-no-dot" style="font-size:11px">
          ${p.insurance || 'Self-Pay / Cash'}
        </span>
      </td>
      <td class="td-actions">
        <button class="btn btn-secondary btn-sm" onclick="openEditPatientContactModal('${p.id}')">
          <i data-lucide="edit-3"></i> Edit Contact
        </button>
        <button class="btn btn-primary btn-sm" onclick="navigateTo('/rc/quick-book?patientId=${p.id}')">
          Book
        </button>
      </td>
    </tr>
  `).join('');
}

window.openEditPatientContactModal = (patientId) => {
  const p = getHospitalPatients().find(pt => pt.id === patientId);
  if (!p) return;

  openModal({
    title: `Edit Contact Details: ${p.name}`,
    size: 'md',
    body: `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Phone Number <span class="required">*</span></label>
          <input type="tel" class="form-control" id="edit-phone" value="${p.phone || ''}" required />
        </div>
        <div class="form-group">
          <label class="form-label">Email Address</label>
          <input type="email" class="form-control" id="edit-email" value="${p.email || ''}" />
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Physical Residential Address</label>
        <input type="text" class="form-control" id="edit-address" value="${p.address || ''}" />
      </div>

      <div class="form-group">
        <label class="form-label">Emergency Contact Name & Phone</label>
        <input type="text" class="form-control" id="edit-emergency" value="${p.emergencyContact || ''}" placeholder="e.g. Ramesh Verma (+91 99001 20003)" />
      </div>

      <div class="form-group">
        <label class="form-label">Insurance Provider / TPA Policy Details</label>
        <input type="text" class="form-control" id="edit-insurance" value="${p.insurance || ''}" />
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="window._closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="submitEditContact('${p.id}')">Save Changes</button>
    `
  });
};

window.submitEditContact = (patientId) => {
  const phone = document.getElementById('edit-phone')?.value;
  const email = document.getElementById('edit-email')?.value;
  const address = document.getElementById('edit-address')?.value;
  const emergencyContact = document.getElementById('edit-emergency')?.value;
  const insurance = document.getElementById('edit-insurance')?.value;

  updatePatientContact(patientId, {
    phone,
    email,
    address,
    emergencyContact,
    insurance
  });

  closeModal();
  showToast({ title: 'Contact Info Saved', message: 'Patient demographic record updated.', type: 'success' });
  renderReceptionistPatientLookup();
};
