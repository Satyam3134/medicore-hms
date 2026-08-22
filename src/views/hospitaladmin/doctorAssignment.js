// ============================================================
// hospitaladmin/doctorAssignment.js — Module 4: Doctor Assignment Flow
// ============================================================

import { renderTopbar } from '../../components/topbar.js';
import { renderSidebar } from '../../components/sidebar.js';
import { getHospitalStaff, getHospitalPatients, getHospitalDepartments, getHospitalAppointments, assignPatientDoctor, get } from '../../store.js';
import { showToast } from '../../components/toast.js';
import { openModal, closeModal } from '../../components/modal.js';
import { refreshIcons } from '../../components/icons.js';

let selectedDeptFilter = '';
let selectedPatientId = null;

export function renderDoctorAssignment(preselectedPatientId) {
  if (preselectedPatientId) selectedPatientId = preselectedPatientId;

  renderSidebar();
  renderTopbar({
    breadcrumb: [
      { label: 'Hospital Admin', path: '/ha/dashboard' },
      { label: 'Doctor Assignment' }
    ]
  });

  const doctors = getHospitalStaff().filter(s => s.role === 'Doctor');
  const patients = getHospitalPatients();
  const departments = getHospitalDepartments();
  const appointments = getHospitalAppointments();

  const filteredDoctors = selectedDeptFilter
    ? doctors.filter(d => d.department === selectedDeptFilter)
    : doctors;

  const content = document.getElementById('content');
  content.innerHTML = `
    <!-- Header -->
    <div class="page-header">
      <div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
          <h1 class="page-title">Doctor Assignment & OPD Triage</h1>
          <span class="badge badge-primary">Clinical Allocation Engine</span>
        </div>
        <p class="page-subtitle">Assign incoming & unassigned patients to available specialists based on department load and live shift schedules</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary" onclick="openAutoTriageModal()">
          <i data-lucide="sparkles"></i> Auto-Balance Queue
        </button>
        <button class="btn btn-primary" onclick="openDirectAssignModal()">
          <i data-lucide="user-plus"></i> Assign New Patient
        </button>
      </div>
    </div>

    <!-- Department Filter Bar -->
    <div class="card mb-6" style="padding:14px 20px;background:white">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span style="font-size:var(--font-size-xs);font-weight:700;text-transform:uppercase;color:var(--color-text-muted);margin-right:6px">Filter Specialty:</span>
          <button class="btn btn-sm ${!selectedDeptFilter ? 'btn-primary' : 'btn-secondary'}" onclick="filterDept('')">All Specialties (${doctors.length} Doctors)</button>
          ${departments.map(d => `
            <button class="btn btn-sm ${selectedDeptFilter === d.name ? 'btn-primary' : 'btn-secondary'}" onclick="filterDept('${d.name}')">
              ${d.name}
            </button>
          `).join('')}
        </div>
        <div style="font-size:var(--font-size-xs);color:var(--color-text-muted)">
          🟢 ${doctors.filter(d => d.status === 'on-duty').length} On-Duty Doctors Available Now
        </div>
      </div>
    </div>

    <!-- Master-Detail Layout: Left (Active Doctor Availability Roster) + Right (Patients Awaiting Assignment / Reassignment) -->
    <div style="display:grid;grid-template-columns:1.3fr 0.9fr;gap:24px;align-items:start">
      
      <!-- Left: Specialist Roster & Live OPD Queue Load -->
      <div class="card">
        <div class="card-header" style="background:#F8FAFC">
          <div>
            <span class="card-title">Specialist Roster & Real-Time OPD Load</span>
            <div style="font-size:var(--font-size-xs);color:var(--color-text-muted);margin-top:2px">Click any doctor to immediately allocate active patient</div>
          </div>
          <span class="badge badge-gray">${filteredDoctors.length} Specialists</span>
        </div>

        <div style="padding:20px;display:grid;grid-template-columns:1fr 1fr;gap:16px">
          ${filteredDoctors.map(doc => {
            const docAppts = appointments.filter(a => a.doctorId === doc.id);
            const waitingCount = docAppts.filter(a => a.status === 'confirmed').length;
            const completedCount = docAppts.filter(a => a.status === 'completed').length;
            const isOnDuty = doc.status === 'on-duty';

            return `
              <div style="border:2px solid ${isOnDuty ? 'var(--color-border)' : '#FCA5A5'};border-radius:14px;padding:18px;background:${isOnDuty ? 'white' : '#FEF2F2'};box-shadow:var(--shadow-xs);display:flex;flex-direction:column;justify-content:space-between">
                <div>
                  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
                    <div style="display:flex;align-items:center;gap:10px">
                      <div class="user-avatar" style="background:var(--color-primary);width:42px;height:42px;font-size:15px;font-weight:700">
                        ${doc.initials}
                      </div>
                      <div>
                        <div style="font-weight:800;font-size:var(--font-size-base);color:var(--color-text)">${doc.name}</div>
                        <div style="font-size:var(--font-size-xs);color:var(--color-text-muted)">${doc.specialization || doc.department}</div>
                      </div>
                    </div>
                    <span class="badge badge-${isOnDuty ? 'success' : 'danger'} badge-no-dot">
                      ${isOnDuty ? 'On Duty' : 'On Leave'}
                    </span>
                  </div>

                  <!-- Consultation Specs -->
                  <div style="background:var(--color-bg);padding:10px;border-radius:8px;margin-bottom:12px;font-size:var(--font-size-xs)">
                    <div class="info-row" style="padding:2px 0"><span class="info-label">Specialty</span><span class="info-value font-semibold">${doc.department}</span></div>
                    <div class="info-row" style="padding:2px 0"><span class="info-label">Consult Fee</span><span class="info-value font-semibold">₹${doc.consultationFee || 800}</span></div>
                    <div class="info-row" style="padding:2px 0"><span class="info-label">Today's Load</span><span class="info-value" style="color:var(--color-primary);font-weight:700">${waitingCount} in Queue · ${completedCount} Done</span></div>
                  </div>
                </div>

                <button class="btn btn-primary btn-sm w-full" ${!isOnDuty ? 'disabled' : ''} onclick="promptAssignToDoctor('${doc.id}', '${doc.name}', '${doc.department}')">
                  <i data-lucide="check-circle"></i> Assign Patient to ${doc.name.split(' ')[1] || 'Doctor'}
                </button>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Right: Patients Queue Awaiting Doctor Allocation -->
      <div class="card">
        <div class="card-header" style="background:#F8FAFC">
          <div>
            <span class="card-title">Patient Queue for Assignment</span>
            <div style="font-size:var(--font-size-xs);color:var(--color-text-muted);margin-top:2px">Select patient to assign or re-route</div>
          </div>
          <span class="badge badge-warning badge-no-dot">${patients.length} Total Patients</span>
        </div>

        <div style="padding:16px" class="scroll-y" style="max-height:600px">
          ${patients.map(p => {
            const currentDoc = doctors.find(d => d.id === p.assignedDoctor);
            const isSelected = selectedPatientId === p.id;

            return `
              <div onclick="selectPatientForAssignment('${p.id}')" 
                style="padding:14px;border-radius:12px;margin-bottom:10px;cursor:pointer;border:2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'};background:${isSelected ? 'var(--color-primary-light)' : 'white'};transition:all 0.15s">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">
                  <div>
                    <div style="font-weight:800;font-size:var(--font-size-base);color:var(--color-text)">${p.name}</div>
                    <div style="font-size:var(--font-size-xs);color:var(--color-text-muted)">
                      ${p.gender}, ${p.age} yrs · ID: ${p.patientId} · Blood: <strong>${p.bloodGroup}</strong>
                    </div>
                  </div>
                  <span class="badge badge-info badge-no-dot">${p.department || 'General'}</span>
                </div>

                <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;padding-top:8px;border-top:1px dashed ${isSelected ? '#93C5FD' : 'var(--color-border)'};font-size:var(--font-size-xs)">
                  <div style="color:var(--color-text-muted)">
                    Current: <strong>${currentDoc?.name || 'Unassigned'}</strong>
                  </div>
                  <button class="btn btn-secondary btn-sm" style="padding:2px 8px;font-size:11px" onclick="openReassignModal('${p.id}', '${p.name}', '${p.department}')">
                    Reassign →
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

    </div>
  `;

  refreshIcons(content);
}

window.filterDept = (dept) => {
  selectedDeptFilter = dept;
  renderDoctorAssignment();
};

window.selectPatientForAssignment = (patientId) => {
  selectedPatientId = patientId;
  renderDoctorAssignment(patientId);
};

window.promptAssignToDoctor = (doctorId, doctorName, department) => {
  const patients = getHospitalPatients();
  const selectedP = patients.find(p => p.id === selectedPatientId) || patients[0];

  openModal({
    title: `Confirm Assignment to ${doctorName}`,
    size: 'md',
    body: `
      <div class="alert alert-info mb-4" style="font-size:var(--font-size-sm)">
        Allocating patient to <strong>${doctorName}</strong> in <strong>${department}</strong> OPD.
      </div>

      <div class="form-group">
        <label class="form-label">Select Patient <span class="required">*</span></label>
        <select class="form-control" id="assign-patient-select">
          ${patients.map(p => `
            <option value="${p.id}" ${p.id === selectedP?.id ? 'selected' : ''}>
              ${p.name} (${p.age}y, ${p.gender}) — Current: ${p.department || 'General'}
            </option>
          `).join('')}
        </select>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Consultation Priority</label>
          <select class="form-control" id="assign-priority">
            <option value="routine">Routine OPD</option>
            <option value="priority">Priority Review</option>
            <option value="urgent">Urgent / Emergency Triage</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">OPD Slot / Room</label>
          <input type="text" class="form-control" id="assign-room" value="Room 204 (OPD Wing)" />
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Chief Complaint / Triage Notes</label>
        <textarea class="form-control" id="assign-notes" rows="3" placeholder="e.g. Chest tightness on exertion since 2 days. Follow-up ECG advised."></textarea>
      </div>

      <label class="form-check">
        <input type="checkbox" checked id="assign-notify-wa" />
        <span style="font-size:var(--font-size-xs)">📱 Dispatch instant WhatsApp assignment alert to patient with Token & Room #</span>
      </label>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="window._closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="confirmAssignmentSubmit('${doctorId}', '${department}')">
        <i data-lucide="check"></i> Confirm Doctor Assignment
      </button>
    `
  });

  refreshIcons();
};

window.confirmAssignmentSubmit = (doctorId, department) => {
  const patientId = document.getElementById('assign-patient-select')?.value;
  const isNotify = document.getElementById('assign-notify-wa')?.checked;
  const doctors = getHospitalStaff();
  const doc = doctors.find(d => d.id === doctorId);

  assignPatientDoctor(patientId, doctorId, department);

  closeModal();

  if (isNotify) {
    showToast({
      title: '📱 WhatsApp Dispatched',
      message: `Appointment details & Token sent to patient for consultation with ${doc?.name}.`,
      type: 'wa'
    });
  } else {
    showToast({
      title: '✓ Doctor Assigned',
      message: `Patient successfully assigned to ${doc?.name}.`,
      type: 'success'
    });
  }

  renderDoctorAssignment(patientId);
};

window.openDirectAssignModal = () => {
  const patients = getHospitalPatients();
  const doctors = getHospitalStaff().filter(s => s.role === 'Doctor' && s.status === 'on-duty');

  openModal({
    title: 'Direct Patient-to-Doctor Assignment',
    size: 'md',
    body: `
      <div class="form-group">
        <label class="form-label">Select Patient</label>
        <select class="form-control" id="dir-patient">
          ${patients.map(p => `<option value="${p.id}">${p.name} (${p.patientId})</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Assign To Doctor</label>
        <select class="form-control" id="dir-doc">
          ${doctors.map(d => `<option value="${d.id}">${d.name} — ${d.department} (Fee: ₹${d.consultationFee})</option>`).join('')}
        </select>
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="window._closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="submitDirectAssign()">Assign</button>
    `
  });
};

window.submitDirectAssign = () => {
  const patientId = document.getElementById('dir-patient')?.value;
  const doctorId = document.getElementById('dir-doc')?.value;
  const doctors = getHospitalStaff();
  const doc = doctors.find(d => d.id === doctorId);

  assignPatientDoctor(patientId, doctorId, doc?.department);
  closeModal();
  showToast({ title: 'Assigned', message: `Assigned to ${doc?.name}.`, type: 'success' });
  renderDoctorAssignment();
};

window.openReassignModal = (patientId, patientName, currentDept) => {
  selectedPatientId = patientId;
  const doctors = getHospitalStaff().filter(s => s.role === 'Doctor');

  openModal({
    title: `Reassign Doctor for ${patientName}`,
    size: 'md',
    body: `
      <div class="form-group">
        <label class="form-label">Select New Specialist</label>
        <select class="form-control" id="reassign-doc-id">
          ${doctors.map(d => `
            <option value="${d.id}">${d.name} (${d.department}) — ${d.status === 'on-duty' ? '🟢 On Duty' : '🔴 On Leave'}</option>
          `).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Reason for Reassignment</label>
        <input type="text" class="form-control" placeholder="e.g. Specialty transfer or physician schedule conflict" />
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="window._closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="submitReassign('${patientId}')">Confirm Reassignment</button>
    `
  });
};

window.submitReassign = (patientId) => {
  const doctorId = document.getElementById('reassign-doc-id')?.value;
  const doc = getHospitalStaff().find(d => d.id === doctorId);
  assignPatientDoctor(patientId, doctorId, doc?.department);
  closeModal();
  showToast({ title: 'Reassigned', message: `Patient reassigned to ${doc?.name}.`, type: 'success' });
  renderDoctorAssignment();
};

window.openAutoTriageModal = () => {
  showToast({
    title: 'Auto-Triage Optimized',
    message: 'OPD queue load balanced across all available specialists.',
    type: 'success'
  });
};
