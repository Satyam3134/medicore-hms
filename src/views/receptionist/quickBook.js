// ============================================================
// receptionist/quickBook.js — Module 3: Fast-Path Quick Book & Walk-in
// ============================================================

import { renderTopbar } from '../../components/topbar.js';
import { renderSidebar } from '../../components/sidebar.js';
import { get, addPatient, addAppointment, checkInAndIssueToken } from '../../store.js';
import { showToast } from '../../components/toast.js';
import { refreshIcons } from '../../components/icons.js';

export function renderQuickBook({ query }) {
  renderSidebar();
  renderTopbar({
    breadcrumb: [
      { label: 'Front Desk', path: '/rc/queue' },
      { label: 'Quick Book & Walk-in Registration' }
    ]
  });

  const doctors = get('staff').filter(s => s.role === 'Doctor');
  const departments = get('departments');
  const preselectedPatientId = query?.patientId || null;
  const existingPatient = preselectedPatientId ? get('patients').find(p => p.id === preselectedPatientId) : null;

  const content = document.getElementById('content');
  content.innerHTML = `
    <!-- Header -->
    <div class="page-header">
      <div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
          <h1 class="page-title">Quick Booking & Walk-In Registration</h1>
          <span class="badge badge-primary">Fast-Path Form</span>
        </div>
        <p class="page-subtitle">Rapid registration for walk-in arrivals, phone-in appointments, or urgent triage bookings in under 15 seconds</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary" onclick="navigateTo('/rc/queue')">
          ← Back to Live Queue
        </button>
      </div>
    </div>

    <!-- Rapid Entry Card Form -->
    <div class="card" style="max-width:760px;margin:0 auto;border:2px solid var(--color-primary);box-shadow:var(--shadow-md)">
      <div class="card-header" style="background:#EFF6FF">
        <div>
          <span class="card-title" style="color:var(--color-primary)">⚡ Fast-Path Front Desk Entry</span>
          <div style="font-size:12px;color:var(--color-text-muted)">Registers patient, creates appointment slot, and prints token in 1 click</div>
        </div>
      </div>

      <div class="card-body" style="padding:28px">
        
        <!-- Patient Details Section -->
        <div style="font-size:12px;font-weight:700;text-transform:uppercase;color:var(--color-text-muted);margin-bottom:12px">
          1. Patient Basic Demographics
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Patient Full Name <span class="required">*</span></label>
            <input type="text" class="form-control" id="qb-name" value="${existingPatient?.name || ''}" placeholder="e.g. Ramesh Deshmukh" required autofocus />
          </div>
          <div class="form-group">
            <label class="form-label">Phone Number <span class="required">*</span></label>
            <input type="tel" class="form-control" id="qb-phone" value="${existingPatient?.phone || ''}" placeholder="+91 98765 00000" required />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Age</label>
            <input type="number" class="form-control" id="qb-age" value="${existingPatient?.age || '38'}" placeholder="Age in years" />
          </div>
          <div class="form-group">
            <label class="form-label">Gender</label>
            <select class="form-control" id="qb-gender">
              <option ${existingPatient?.gender === 'Male' ? 'selected' : ''}>Male</option>
              <option ${existingPatient?.gender === 'Female' ? 'selected' : ''}>Female</option>
              <option>Other</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Blood Group</label>
            <select class="form-control" id="qb-blood">
              <option>O+</option><option>A+</option><option>B+</option><option>AB+</option>
              <option>O-</option><option>A-</option><option>B-</option><option>AB-</option>
            </select>
          </div>
        </div>

        <hr style="border:none;border-top:1px solid var(--color-border);margin:20px 0" />

        <!-- Doctor & Slot Selection -->
        <div style="font-size:12px;font-weight:700;text-transform:uppercase;color:var(--color-text-muted);margin-bottom:12px">
          2. Clinical Specialty & Consulting Doctor
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Department <span class="required">*</span></label>
            <select class="form-control" id="qb-dept" onchange="filterDoctorsByDept(this.value)">
              ${departments.map(d => `<option value="${d.name}">${d.name}</option>`).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Assigned Specialist <span class="required">*</span></label>
            <select class="form-control" id="qb-doctor">
              ${doctors.map(doc => `
                <option value="${doc.id}">${doc.name} (${doc.department}) — Fee: ₹${doc.consultationFee || 800}</option>
              `).join('')}
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Booking Channel / Source</label>
            <select class="form-control" id="qb-source">
              <option value="walkin">🏥 Physical Walk-In</option>
              <option value="phone">📞 Phone Call Booking</option>
              <option value="admin">🏢 Reception / Executive</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Time Slot</label>
            <input type="text" class="form-control" id="qb-time" value="${getCurrentSlotTime()}" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Chief Complaint / Reason for Visit</label>
          <input type="text" class="form-control" id="qb-complaint" placeholder="e.g. Sudden knee pain, chest heaviness, fever since 2 days" />
        </div>

        <div style="margin-top:24px;display:flex;justify-content:space-between;align-items:center">
          <button class="btn btn-secondary" onclick="navigateTo('/rc/queue')">Cancel</button>
          <button class="btn btn-primary btn-lg" onclick="submitQuickBookAndIssueToken('${existingPatient?.id || ''}')">
            <i data-lucide="printer"></i> Register, Issue Token & Print Slip
          </button>
        </div>

      </div>
    </div>
  `;

  refreshIcons(content);
}

function getCurrentSlotTime() {
  const d = new Date();
  let hours = d.getHours();
  const minutes = d.getMinutes() < 30 ? '00' : '30';
  return `${String(hours).padStart(2, '0')}:${minutes}`;
}

window.submitQuickBookAndIssueToken = (existingPatientId) => {
  const name = document.getElementById('qb-name')?.value;
  const phone = document.getElementById('qb-phone')?.value;
  const age = parseInt(document.getElementById('qb-age')?.value) || 30;
  const gender = document.getElementById('qb-gender')?.value || 'Male';
  const bloodGroup = document.getElementById('qb-blood')?.value || 'O+';
  const department = document.getElementById('qb-dept')?.value || 'General Medicine';
  const doctorId = document.getElementById('qb-doctor')?.value;
  const source = document.getElementById('qb-source')?.value || 'walkin';
  const time = document.getElementById('qb-time')?.value || '10:00';
  const notes = document.getElementById('qb-complaint')?.value || 'Walk-in Consultation';

  if (!name || !phone) {
    showToast({ title: 'Missing Info', message: 'Please enter patient name and phone number.', type: 'warning' });
    return;
  }

  let pId = existingPatientId;
  if (!pId) {
    pId = addPatient({
      name,
      phone,
      age,
      gender,
      bloodGroup,
      status: 'OPD',
      assignedDoctor: doctorId,
      department
    });
  }

  const appt = addAppointment({
    patientId: pId,
    doctorId,
    department,
    date: new Date().toISOString().split('T')[0],
    time,
    status: 'confirmed',
    type: 'Walk-In OPD',
    source,
    notes
  });

  showToast({
    title: `🎫 Token Issued: ${appt.token || 'TKN-001'}`,
    message: `${name} registered for Dr. ${get('staff').find(s => s.id === doctorId)?.name}. Added to queue.`,
    type: 'success'
  });

  navigateTo('/rc/queue');
};
