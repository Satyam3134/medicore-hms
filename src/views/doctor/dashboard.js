// ============================================================
// doctor/dashboard.js — Module 1: Doctor Walk-in Command Center
// ============================================================

import { renderTopbar } from '../../components/topbar.js';
import { renderSidebar } from '../../components/sidebar.js';
import { get, getDoctorAppointments, getDoctorPatients, toggleDoctorAvailability } from '../../store.js';
import { showToast } from '../../components/toast.js';
import { refreshIcons } from '../../components/icons.js';

function getActiveDoctor() {
  const currentUserId = get('currentUserId');
  const staff = get('staff');
  return staff.find(s => s.id === currentUserId && s.role === 'Doctor') || staff.find(s => s.role === 'Doctor') || staff[0];
}

export function renderDoctorDashboard() {
  renderSidebar();
  const me = getActiveDoctor();
  renderTopbar({
    breadcrumb: [
      { label: 'Doctor Workspace' },
      { label: 'Dashboard' }
    ]
  });

  if (!me) {
    document.getElementById('content').innerHTML = `<div class="empty-state"><div class="es-title">No doctor data found</div></div>`;
    return;
  }

  const myAppts = getDoctorAppointments(me.id);
  const myPatients = getDoctorPatients(me.id);
  const today = new Date().toISOString().split('T')[0];
  const todayAppts = myAppts.filter(a => a.date === today || a.id.startsWith('a')).sort((a, b) => a.time.localeCompare(b.time));
  
  const waiting = todayAppts.filter(a => a.status === 'confirmed' || a.status === 'pending' || a.status === 'in-progress');
  const completed = todayAppts.filter(a => a.status === 'completed');
  const nextPatientAppt = waiting[0] || null;
  const nextPatient = nextPatientAppt ? get('patients').find(p => p.id === nextPatientAppt.patientId) : null;

  const isOnDuty = me.status === 'on-duty';

  const content = document.getElementById('content');
  content.innerHTML = `
    <!-- Top Welcome & Availability Banner -->
    <div style="background:white;border:1.5px solid var(--color-border);border-radius:14px;padding:22px 28px;margin-bottom:24px;display:flex;align-items:center;justify-content:space-between;box-shadow:var(--shadow-xs);flex-wrap:wrap;gap:18px">
      <div style="display:flex;align-items:center;gap:18px">
        <div class="user-avatar" style="background:var(--color-primary);width:54px;height:54px;font-size:20px;font-weight:800">
          ${me.initials || 'DR'}
        </div>
        <div>
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
            <h1 style="font-size:22px;font-weight:800;color:var(--color-text);margin:0">Welcome, ${me.name}</h1>
            <span class="badge badge-${isOnDuty ? 'success' : 'danger'} badge-no-dot">
              ${isOnDuty ? '🟢 Available on Duty' : '🔴 Marked Unavailable'}
            </span>
          </div>
          <div style="font-size:var(--font-size-sm);color:var(--color-text-muted)">
            ${me.specialization || me.department} · Room 204 (OPD Wing) · Shift: 09:00 AM – 05:00 PM
          </div>
        </div>
      </div>

      <!-- Quick Availability Sync Toggle -->
      <div style="display:flex;align-items:center;gap:12px;background:#F8FAFC;padding:10px 16px;border-radius:10px;border:1px solid var(--color-border)">
        <div style="text-align:right">
          <div style="font-size:12px;font-weight:700;color:var(--color-text)">OPD & WhatsApp Booking</div>
          <div style="font-size:11px;color:var(--color-text-muted)">Syncs slots in real-time</div>
        </div>
        <button class="btn btn-sm ${isOnDuty ? 'btn-danger' : 'btn-success'}" onclick="toggleMyAvailability('${me.id}', '${isOnDuty ? 'on-leave' : 'on-duty'}')">
          ${isOnDuty ? 'Mark Unavailable' : 'Go On Duty'}
        </button>
      </div>
    </div>

    <!-- Quick Walk-in Stats Cards -->
    <div class="stats-grid stats-grid-3" style="margin-bottom:24px">
      <div class="stat-card">
        <div class="stat-card-icon amber"><i data-lucide="clock"></i></div>
        <div class="stat-card-value">${waiting.length}</div>
        <div class="stat-card-label">Patients in Waiting Queue</div>
        <div class="stat-card-trend">Average consult ~12 mins</div>
      </div>

      <div class="stat-card">
        <div class="stat-card-icon green"><i data-lucide="check-circle-2"></i></div>
        <div class="stat-card-value">${completed.length}</div>
        <div class="stat-card-label">Completed Consultations</div>
        <div class="stat-card-trend"><span class="trend-up">● ${todayAppts.length} total scheduled today</span></div>
      </div>

      <div class="stat-card">
        <div class="stat-card-icon blue"><i data-lucide="users"></i></div>
        <div class="stat-card-value">${myPatients.length}</div>
        <div class="stat-card-label">Assigned EMR Patients</div>
        <div class="stat-card-trend" onclick="navigateTo('/dr/patients')" style="color:var(--color-primary);cursor:pointer;font-weight:700">Open Directory →</div>
      </div>
    </div>

    <!-- Quick Search Bar -->
    <div class="card mb-6" style="padding:14px 20px;background:white">
      <div style="display:flex;align-items:center;gap:12px">
        <i data-lucide="search" style="color:var(--color-text-muted)"></i>
        <input type="text" id="doc-patient-search" class="form-control" style="border:none;box-shadow:none;font-size:15px;padding:4px" placeholder="Search assigned patients by name, UHID, phone number or diagnosis..." oninput="handleDoctorSearch(this.value)" />
        <button class="btn btn-secondary btn-sm" onclick="navigateTo('/dr/patients')">Browse All My Patients</button>
      </div>
      <div id="doc-search-results" style="display:none;margin-top:12px;border-top:1px solid var(--color-border);padding-top:10px"></div>
    </div>

    <!-- Main Active Workspace Split: Next Up Patient Spotlight + Today's Queue List -->
    <div style="display:grid;grid-template-columns:1.2fr 1fr;gap:24px;align-items:start">
      
      <!-- Next Up Patient Card (Actionable Walk-in Center) -->
      <div class="card" style="border:2px solid var(--color-primary);box-shadow:var(--shadow-md)">
        <div class="card-header" style="background:#EFF6FF">
          <div style="display:flex;align-items:center;gap:8px">
            <span class="card-title" style="color:var(--color-primary)">🩺 Next Patient in Chair</span>
            <span class="badge badge-primary">LIVE TOKEN</span>
          </div>
          <span style="font-family:monospace;font-weight:800;font-size:16px;color:var(--color-primary)">${nextPatientAppt?.token || 'TOKEN #1'}</span>
        </div>

        <div class="card-body" style="padding:24px">
          ${nextPatient ? `
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px">
              <div>
                <div style="font-size:20px;font-weight:800;color:var(--color-text)">${nextPatient.name}</div>
                <div style="font-size:13px;color:var(--color-text-muted);margin-top:2px">
                  ${nextPatient.age} yrs · ${nextPatient.gender} · Blood: <strong style="color:var(--color-danger)">${nextPatient.bloodGroup}</strong> · UHID: ${nextPatient.patientId}
                </div>
              </div>
              <span class="badge ${nextPatientAppt.source === 'whatsapp' ? 'badge-wa' : 'badge-gray'} badge-no-dot" style="font-size:11px">
                ${nextPatientAppt.source === 'whatsapp' ? '📱 WhatsApp' : 'Walk-in'}
              </span>
            </div>

            <!-- Vitals Snapshot -->
            <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:10px;background:#F8FAFC;padding:12px;border-radius:10px;margin-bottom:18px;text-align:center;font-size:12px">
              <div>
                <div style="color:var(--color-text-muted);font-size:11px">Blood Pressure</div>
                <div style="font-weight:800;font-size:14px;color:var(--color-text)">${nextPatient.vitals?.bp || '120/80'}</div>
              </div>
              <div>
                <div style="color:var(--color-text-muted);font-size:11px">Pulse</div>
                <div style="font-weight:800;font-size:14px;color:var(--color-text)">${nextPatient.vitals?.pulse || 76} bpm</div>
              </div>
              <div>
                <div style="color:var(--color-text-muted);font-size:11px">SpO2</div>
                <div style="font-weight:800;font-size:14px;color:var(--color-text)">${nextPatient.vitals?.spo2 || 98}%</div>
              </div>
              <div>
                <div style="color:var(--color-text-muted);font-size:11px">Weight</div>
                <div style="font-weight:800;font-size:14px;color:var(--color-text)">${nextPatient.vitals?.weight || 68} kg</div>
              </div>
            </div>

            <!-- Allergies & Notes -->
            ${nextPatient.allergies?.length > 0 ? `
              <div class="alert alert-danger mb-4" style="padding:8px 12px;font-size:12px">
                <strong>⚠ Drug Allergies:</strong> ${nextPatient.allergies.join(', ')}
              </div>
            ` : ''}

            <div style="font-size:13px;color:var(--color-text-muted);margin-bottom:20px">
              Chief Complaint: <strong>${nextPatientAppt.notes || 'Routine follow-up consultation'}</strong>
            </div>

            <div style="display:flex;gap:10px">
              <button class="btn btn-primary btn-lg" style="flex:1" onclick="navigateTo('/dr/consultation/${nextPatient.id}?apptId=${nextPatientAppt.id}')">
                <i data-lucide="stethoscope"></i> Start Consultation Visit
              </button>
              <button class="btn btn-secondary" onclick="navigateTo('/ha/patients/${nextPatient.id}')" title="View Full EMR Profile">
                <i data-lucide="file-text"></i> Full EMR
              </button>
            </div>
          ` : `
            <div class="empty-state" style="padding:30px">
              <div class="es-title">No Patients in Waiting Chair</div>
              <div class="es-desc">All scheduled consultations for today are completed.</div>
            </div>
          `}
        </div>
      </div>

      <!-- Today's Live OPD Queue Roster -->
      <div class="card">
        <div class="card-header" style="background:#F8FAFC">
          <div>
            <span class="card-title">Today's Queue (${todayAppts.length} Scheduled)</span>
            <div style="font-size:var(--font-size-xs);color:var(--color-text-muted)">Live token roster</div>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="navigateTo('/dr/schedule')">Calendar View</button>
        </div>

        <div style="padding:14px" class="scroll-y" style="max-height:480px">
          ${todayAppts.map(appt => {
            const p = get('patients').find(pt => pt.id === appt.patientId);
            const isDone = appt.status === 'completed';
            const isNext = appt.id === nextPatientAppt?.id;

            return `
              <div style="display:flex;align-items:center;justify-content:space-between;padding:12px;border-radius:10px;margin-bottom:8px;border:1.5px solid ${isNext ? 'var(--color-primary)' : 'var(--color-border)'};background:${isNext ? '#EFF6FF' : isDone ? '#F8FAFC' : 'white'};transition:all 0.15s">
                <div style="display:flex;align-items:center;gap:12px">
                  <div style="font-family:monospace;font-weight:800;font-size:14px;color:var(--color-primary);background:#DBEAFE;padding:3px 8px;border-radius:6px">
                    ${appt.token || 'TKN'}
                  </div>
                  <div>
                    <div style="font-weight:700;font-size:14px;color:var(--color-text)">${p?.name || 'Patient'}</div>
                    <div style="font-size:11px;color:var(--color-text-muted)">${appt.time} · ${appt.type} · ${p?.age || ''}y</div>
                  </div>
                </div>

                <div>
                  ${isDone ? `
                    <span class="badge badge-success badge-no-dot" style="font-size:11px">✓ Completed</span>
                  ` : `
                    <button class="btn btn-primary btn-sm" style="font-size:11px;padding:3px 10px" onclick="navigateTo('/dr/consultation/${p?.id}?apptId=${appt.id}')">
                      Consult →
                    </button>
                  `}
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

window.toggleMyAvailability = (doctorId, newStatus) => {
  toggleDoctorAvailability(doctorId, newStatus);
  showToast({
    title: newStatus === 'on-duty' ? '🟢 You are On Duty' : '🔴 You are On Leave',
    message: newStatus === 'on-duty' ? 'OPD queue open and WhatsApp booking enabled.' : 'Slots blocked across WhatsApp and Reception desk.',
    type: newStatus === 'on-duty' ? 'success' : 'warning'
  });
  renderDoctorDashboard();
};

window.handleDoctorSearch = (query) => {
  const container = document.getElementById('doc-search-results');
  if (!query.trim()) {
    container.style.display = 'none';
    return;
  }
  const me = getActiveDoctor();
  const myPatients = getDoctorPatients(me.id);
  const q = query.toLowerCase();
  const results = myPatients.filter(p => 
    p.name.toLowerCase().includes(q) || 
    p.patientId.toLowerCase().includes(q) ||
    p.phone?.includes(q)
  );

  container.style.display = 'block';
  if (!results.length) {
    container.innerHTML = `<div style="font-size:12px;color:var(--color-text-muted);padding:6px">No matching assigned patients found.</div>`;
    return;
  }

  container.innerHTML = `
    <div style="font-size:11px;font-weight:700;color:var(--color-text-muted);text-transform:uppercase;margin-bottom:6px">Matching Patients (${results.length})</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      ${results.map(p => `
        <div onclick="navigateTo('/dr/consultation/${p.id}')" style="padding:8px 12px;background:#F8FAFC;border:1px solid var(--color-border);border-radius:8px;cursor:pointer;display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-weight:700;font-size:13px">${p.name}</div>
            <div style="font-size:11px;color:var(--color-text-muted)">${p.patientId} · Last: ${p.lastVisit || 'Recent'}</div>
          </div>
          <span class="btn btn-sm btn-primary" style="font-size:10px;padding:2px 8px">Consult</span>
        </div>
      `).join('')}
    </div>
  `;
};
