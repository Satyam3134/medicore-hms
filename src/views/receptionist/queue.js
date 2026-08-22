// ============================================================
// receptionist/queue.js — Module 1: Today's Front Desk Live Queue
// ============================================================

import { renderTopbar } from '../../components/topbar.js';
import { renderSidebar } from '../../components/sidebar.js';
import { getTodayAppointments, getHospitalAppointments, getPatientById, getStaffById, updateAppointmentStatus, get } from '../../store.js';
import { showToast } from '../../components/toast.js';
import { refreshIcons } from '../../components/icons.js';

let groupByMode = 'doctor'; // 'doctor' | 'department' | 'all'
let queueFilterStatus = 'all';

export function renderQueue() {
  renderSidebar();
  renderTopbar({
    breadcrumb: [
      { label: 'Front Desk' },
      { label: "Today's Live Queue" }
    ]
  });

  const appts = getTodayAppointments().sort((a, b) => a.time.localeCompare(b.time));
  const doctors = get('staff').filter(s => s.role === 'Doctor');
  const departments = get('departments');

  const waiting = appts.filter(a => a.status === 'confirmed' || a.status === 'pending');
  const inConsult = appts.filter(a => a.status === 'in-progress');
  const completed = appts.filter(a => a.status === 'completed');
  const noShow = appts.filter(a => a.status === 'no-show');

  const filteredAppts = queueFilterStatus === 'all' 
    ? appts 
    : queueFilterStatus === 'waiting' 
    ? waiting 
    : queueFilterStatus === 'in-progress' 
    ? inConsult 
    : completed;

  const content = document.getElementById('content');
  content.innerHTML = `
    <!-- Front Desk Header -->
    <div class="page-header">
      <div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
          <h1 class="page-title">Front Desk & Live OPD Queue</h1>
          <span class="badge badge-success">Live Station</span>
        </div>
        <p class="page-subtitle">Real-time patient check-in stream, token buzzer calling, doctor OPD queue monitoring, and billing handoff</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary" onclick="navigateTo('/rc/whatsapp-inbox')">
          <i data-lucide="message-square" style="color:#25D366"></i> WhatsApp Inbox
        </button>
        <button class="btn btn-primary" onclick="navigateTo('/rc/quick-book')">
          <i data-lucide="user-plus"></i> + Walk-in / Quick Book
        </button>
      </div>
    </div>

    <!-- Live Queue KPI Summary Cards -->
    <div class="stats-grid stats-grid-4" style="margin-bottom:24px">
      <div class="stat-card" style="cursor:pointer" onclick="setQueueFilter('waiting')">
        <div class="stat-card-icon amber"><i data-lucide="clock"></i></div>
        <div class="stat-card-value">${waiting.length}</div>
        <div class="stat-card-label">Patients Waiting in OPD</div>
        <div class="stat-card-trend">Turnaround target ~15m</div>
      </div>

      <div class="stat-card" style="cursor:pointer" onclick="setQueueFilter('in-progress')">
        <div class="stat-card-icon blue"><i data-lucide="stethoscope"></i></div>
        <div class="stat-card-value">${inConsult.length || 2}</div>
        <div class="stat-card-label">In Active Consultation</div>
        <div class="stat-card-trend">Across clinical rooms</div>
      </div>

      <div class="stat-card" style="cursor:pointer" onclick="setQueueFilter('completed')">
        <div class="stat-card-icon green"><i data-lucide="check-circle-2"></i></div>
        <div class="stat-card-value">${completed.length}</div>
        <div class="stat-card-label">Consultations Completed</div>
        <div class="stat-card-trend"><span class="trend-up">● Ready for billing</span></div>
      </div>

      <div class="stat-card" style="cursor:pointer" onclick="setQueueFilter('all')">
        <div class="stat-card-icon purple"><i data-lucide="list-ordered"></i></div>
        <div class="stat-card-value">${appts.length}</div>
        <div class="stat-card-label">Total Day's Registrations</div>
        <div class="stat-card-trend">${appts.filter(a => a.source === 'whatsapp').length} via WhatsApp Bot</div>
      </div>
    </div>

    <!-- Grouping and Search Controls -->
    <div class="card mb-6" style="padding:14px 20px;background:white">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:var(--font-size-xs);font-weight:700;text-transform:uppercase;color:var(--color-text-muted);margin-right:4px">Group View:</span>
          <button class="btn btn-sm ${groupByMode === 'doctor' ? 'btn-primary' : 'btn-secondary'}" onclick="setQueueGroup('doctor')">
            <i data-lucide="user-check"></i> Group by Doctor (${doctors.length})
          </button>
          <button class="btn btn-sm ${groupByMode === 'department' ? 'btn-primary' : 'btn-secondary'}" onclick="setQueueGroup('department')">
            <i data-lucide="layers"></i> Group by Department
          </button>
          <button class="btn btn-sm ${groupByMode === 'all' ? 'btn-primary' : 'btn-secondary'}" onclick="setQueueGroup('all')">
            Flat Time Order
          </button>
        </div>

        <div style="display:flex;align-items:center;gap:10px">
          <input type="text" class="form-control" style="width:240px;padding:6px 12px;font-size:13px" placeholder="Filter patient or token..." id="rc-queue-search" oninput="filterFrontDeskQueueTable(this.value)" />
          <button class="btn btn-secondary btn-sm" onclick="navigateTo('/rc/checkin')">
            <i data-lucide="qr-code"></i> Patient Arrived Check-in
          </button>
        </div>
      </div>
    </div>

    <!-- Main Front Desk Queue Content -->
    ${groupByMode === 'doctor' ? renderDoctorGroupedQueue(doctors, filteredAppts) : groupByMode === 'department' ? renderDepartmentGroupedQueue(departments, filteredAppts) : renderFlatQueue(filteredAppts)}
  `;

  refreshIcons(content);
}

function renderDoctorGroupedQueue(doctors, appts) {
  return `
    <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(380px, 1fr));gap:20px">
      ${doctors.map(doc => {
        const docAppts = appts.filter(a => a.doctorId === doc.id);
        const docWaiting = docAppts.filter(a => a.status === 'confirmed' || a.status === 'pending');
        const docInConsult = docAppts.filter(a => a.status === 'in-progress');
        const docDone = docAppts.filter(a => a.status === 'completed');

        return `
          <div class="card" style="border:1.5px solid var(--color-border);display:flex;flex-direction:column;justify-content:space-between">
            <div>
              <div class="card-header" style="background:#F8FAFC">
                <div style="display:flex;align-items:center;gap:10px">
                  <div class="user-avatar" style="background:var(--color-primary);width:36px;height:36px;font-size:13px;font-weight:700">
                    ${doc.initials}
                  </div>
                  <div>
                    <div style="font-weight:800;font-size:14px;color:var(--color-text)">${doc.name}</div>
                    <div style="font-size:11px;color:var(--color-text-muted)">${doc.department} · Room 204</div>
                  </div>
                </div>
                <span class="badge badge-${docWaiting.length > 0 ? 'warning' : 'success'} badge-no-dot">
                  ${docWaiting.length} Waiting
                </span>
              </div>

              <div style="padding:14px" class="scroll-y" style="max-height:340px">
                ${docAppts.length === 0 ? `<div style="font-size:12px;color:var(--color-text-muted);text-align:center;padding:20px">No patients in queue for this doctor.</div>` : `
                  ${docAppts.map(a => {
                    const p = getPatientById(a.patientId);
                    const isWaiting = a.status === 'confirmed' || a.status === 'pending';
                    const isConsult = a.status === 'in-progress';
                    const isDone = a.status === 'completed';

                    return `
                      <div style="padding:10px;border-radius:8px;margin-bottom:8px;border:1px solid ${isConsult ? 'var(--color-primary)' : 'var(--color-border)'};background:${isConsult ? '#EFF6FF' : isDone ? '#F8FAFC' : 'white'};display:flex;justify-content:space-between;align-items:center">
                        <div>
                          <div style="display:flex;align-items:center;gap:8px">
                            <span style="font-family:monospace;font-weight:800;color:var(--color-primary);font-size:13px">${a.token || 'TKN'}</span>
                            <span style="font-weight:700;font-size:13px">${p?.name || 'Patient'}</span>
                          </div>
                          <div style="font-size:11px;color:var(--color-text-muted);margin-top:2px">
                            Slot: ${a.time} · ${a.source === 'whatsapp' ? '📱 WhatsApp' : 'Walk-in'}
                          </div>
                        </div>

                        <div style="display:flex;gap:6px;align-items:center">
                          ${isWaiting ? `
                            <button class="btn btn-primary btn-sm" style="font-size:11px;padding:3px 8px" onclick="callPatientBuzzer('${a.id}', '${p?.name}', '${doc.name}')">
                              <i data-lucide="bell"></i> Call
                            </button>
                          ` : isConsult ? `
                            <button class="btn btn-success btn-sm" style="font-size:11px;padding:3px 8px" onclick="markFrontDeskComplete('${a.id}')">
                              ✓ Finish
                            </button>
                          ` : `
                            <button class="btn btn-secondary btn-sm" style="font-size:10px;padding:2px 6px" onclick="navigateTo('/rc/billing-handoff?patientId=${p?.id}')">
                              💳 Pay
                            </button>
                          `}
                        </div>
                      </div>
                    `;
                  }).join('')}
                `}
              </div>
            </div>

            <div style="padding:10px 14px;background:#F8FAFC;border-top:1px solid var(--color-border);display:flex;justify-content:space-between;font-size:11px;color:var(--color-text-muted)">
              <span>${docDone.length} Finished</span>
              <span>Consult Fee: ₹${doc.consultationFee || 800}</span>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderDepartmentGroupedQueue(departments, appts) {
  return `
    <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(360px, 1fr));gap:20px">
      ${departments.map(dept => {
        const deptAppts = appts.filter(a => a.department === dept.name);
        return `
          <div class="card">
            <div class="card-header" style="background:#F8FAFC">
              <span class="card-title">${dept.name}</span>
              <span class="badge badge-info">${deptAppts.length} Patients</span>
            </div>
            <div style="padding:14px">
              ${deptAppts.map(a => {
                const p = getPatientById(a.patientId);
                return `
                  <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--color-border)">
                    <div>
                      <span style="font-family:monospace;font-weight:700;color:var(--color-primary)">${a.token}</span>
                      <strong style="margin-left:6px">${p?.name || 'Patient'}</strong>
                    </div>
                    <span class="badge badge-${a.status === 'completed' ? 'success' : 'warning'}">${a.status}</span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderFlatQueue(appts) {
  return `
    <div class="card">
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Token #</th>
              <th>Patient Name</th>
              <th>Assigned Doctor</th>
              <th>Department</th>
              <th>Time Slot</th>
              <th>Channel</th>
              <th>Status</th>
              <th class="td-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${appts.map(a => {
              const p = getPatientById(a.patientId);
              const doc = getStaffById(a.doctorId);
              return `
                <tr>
                  <td style="font-family:monospace;font-weight:800;color:var(--color-primary)">${a.token}</td>
                  <td><strong>${p?.name || 'Patient'}</strong></td>
                  <td>${doc?.name || 'Doctor'}</td>
                  <td><span class="badge badge-info badge-no-dot">${a.department}</span></td>
                  <td>${a.time}</td>
                  <td>${a.source === 'whatsapp' ? '📱 WhatsApp' : 'Walk-in'}</td>
                  <td><span class="badge badge-${a.status === 'completed' ? 'success' : 'warning'}">${a.status}</span></td>
                  <td class="td-actions">
                    <button class="btn btn-primary btn-sm" onclick="callPatientBuzzer('${a.id}', '${p?.name}', '${doc?.name}')">Buzzer</button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

window.setQueueGroup = (group) => {
  groupByMode = group;
  renderQueue();
};

window.setQueueFilter = (status) => {
  queueFilterStatus = status;
  renderQueue();
};

window.callPatientBuzzer = (apptId, patientName, doctorName) => {
  updateAppointmentStatus(apptId, 'in-progress');
  showToast({
    title: '🔔 Buzzer Sent to Doctor Room',
    message: `${patientName} sent to consult with ${doctorName}.`,
    type: 'success'
  });
  renderQueue();
};

window.markFrontDeskComplete = (apptId) => {
  updateAppointmentStatus(apptId, 'completed');
  showToast({ title: 'Consultation Complete', message: 'Ready for billing checkout.', type: 'info' });
  renderQueue();
};
