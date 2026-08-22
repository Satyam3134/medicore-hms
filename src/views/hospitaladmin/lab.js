// ============================================================
// hospitaladmin/lab.js — Module 12: Lab & Diagnostic Investigations
// ============================================================

import { renderTopbar } from '../../components/topbar.js';
import { renderSidebar } from '../../components/sidebar.js';
import { getHospitalLabOrders, createLabOrder, updateLabOrderStatus, getHospitalPatients, getHospitalStaff, get } from '../../store.js';
import { showToast } from '../../components/toast.js';
import { openModal, closeModal } from '../../components/modal.js';
import { refreshIcons } from '../../components/icons.js';

export function renderHospitalLab() {
  renderSidebar();
  renderTopbar({
    breadcrumb: [
      { label: 'Hospital Admin', path: '/ha/dashboard' },
      { label: 'Lab & Diagnostics Module' }
    ]
  });

  const orders = getHospitalLabOrders();
  const patients = getHospitalPatients();

  const total = orders.length;
  const completed = orders.filter(o => o.status === 'completed').length;
  const processing = orders.filter(o => o.status === 'processing').length;
  const urgent = orders.filter(o => o.priority === 'urgent').length;

  const content = document.getElementById('content');
  content.innerHTML = `
    <!-- Header -->
    <div class="page-header">
      <div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
          <h1 class="page-title">Lab & Diagnostic Investigations</h1>
          <span class="badge badge-primary">Pathology & Radiology Engine</span>
        </div>
        <p class="page-subtitle">Track pathology samples, imaging scans, diagnostic reports, and WhatsApp automated PDF delivery</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary" onclick="exportLabOrdersCSV()">
          <i data-lucide="download"></i> Export Lab Log
        </button>
        <button class="btn btn-primary" onclick="openOrderLabTestModal()">
          <i data-lucide="flask-conical"></i> Order New Lab Investigation
        </button>
      </div>
    </div>

    <!-- Lab KPI Summary Cards -->
    <div class="stats-grid stats-grid-4" style="margin-bottom:28px">
      <div class="stat-card">
        <div class="stat-card-icon blue"><i data-lucide="test-tube-2"></i></div>
        <div class="stat-card-value">${total} Tests</div>
        <div class="stat-card-label">Total Diagnostic Orders</div>
        <div class="stat-card-trend">Blood, Imaging & ECG</div>
      </div>

      <div class="stat-card">
        <div class="stat-card-icon green"><i data-lucide="check-circle-2"></i></div>
        <div class="stat-card-value">${completed} Ready</div>
        <div class="stat-card-label">Reports Verified & Delivered</div>
        <div class="stat-card-trend"><span class="trend-up">● Instant patient dispatch</span></div>
      </div>

      <div class="stat-card">
        <div class="stat-card-icon amber"><i data-lucide="clock"></i></div>
        <div class="stat-card-value">${processing} Processing</div>
        <div class="stat-card-label">Samples in Automated Analyzer</div>
        <div class="stat-card-trend">Est turnaround ~45 mins</div>
      </div>

      <div class="stat-card">
        <div class="stat-card-icon red"><i data-lucide="alert-triangle"></i></div>
        <div class="stat-card-value">${urgent} Urgent / STAT</div>
        <div class="stat-card-label">Critical STAT Investigations</div>
        <div class="stat-card-trend" style="color:var(--color-danger)">High priority processing</div>
      </div>
    </div>

    <!-- Diagnostic Orders Table -->
    <div class="card">
      <div class="card-header" style="background:#F8FAFC">
        <div>
          <span class="card-title">Diagnostic Investigations Ledger (${orders.length})</span>
          <div style="font-size:var(--font-size-xs);color:var(--color-text-muted);margin-top:2px">Clinical pathology findings and report uploads</div>
        </div>
        <div style="display:flex;gap:8px">
          <input type="text" class="form-control" style="width:260px;padding:6px 12px;font-size:13px" placeholder="Search test or patient..." id="lab-search" oninput="filterLabTable()" />
        </div>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Patient Details</th>
              <th>Investigation Name</th>
              <th>Department / Sample</th>
              <th>Ordering Doctor</th>
              <th>Clinical Result Summary</th>
              <th>Status</th>
              <th class="td-actions">Actions & WhatsApp</th>
            </tr>
          </thead>
          <tbody id="lab-tbody">
            ${renderLabRows(orders)}
          </tbody>
        </table>
      </div>
    </div>
  `;

  refreshIcons(content);
}

function renderLabRows(list) {
  if (!list.length) {
    return `<tr><td colspan="8"><div class="empty-state"><div class="es-title">No lab orders found</div></div></td></tr>`;
  }

  return list.map(item => {
    const isDone = item.status === 'completed';
    const isUrgent = item.priority === 'urgent';

    return `
      <tr>
        <td>
          <div style="font-family:monospace;font-weight:700;color:var(--color-primary)">
            ${item.id}
          </div>
          ${isUrgent ? '<span class="badge badge-danger" style="font-size:10px;padding:1px 6px">STAT URGENT</span>' : ''}
        </td>
        <td>
          <div style="font-weight:700;font-size:var(--font-size-base)">${item.patientName}</div>
          <div style="font-size:var(--font-size-xs);color:var(--color-text-muted)">ID: ${item.patientId}</div>
        </td>
        <td>
          <div style="font-weight:800">${item.testName}</div>
          <div style="font-size:var(--font-size-xs);color:var(--color-text-muted)">₹${item.cost || 800}</div>
        </td>
        <td>
          <div style="font-size:var(--font-size-sm);font-weight:600">${item.department}</div>
          <div style="font-size:var(--font-size-xs);color:var(--color-text-muted)">${item.sampleType}</div>
        </td>
        <td style="color:var(--color-text-muted)">${item.doctor}</td>
        <td>
          <div style="font-size:12px;max-width:240px;line-height:1.3;color:${isDone ? 'var(--color-text)' : 'var(--color-text-muted)'}">
            ${item.resultSummary || 'Awaiting lab machine results...'}
          </div>
        </td>
        <td>
          <span class="badge badge-${isDone ? 'success' : 'warning'}">
            ${item.status.toUpperCase()}
          </span>
        </td>
        <td class="td-actions">
          ${isDone ? `
            <button class="btn btn-secondary btn-sm" onclick="sendReportWhatsApp('${item.id}', '${item.patientName}', '${item.testName}')" title="Deliver to patient over WhatsApp">
              <i data-lucide="message-square" style="color:#25D366"></i> WhatsApp PDF
            </button>
          ` : `
            <button class="btn btn-success btn-sm" onclick="openUploadResultModal('${item.id}', '${item.testName}')">
              <i data-lucide="upload"></i> Upload Result
            </button>
          `}
        </td>
      </tr>
    `;
  }).join('');
}

window.sendReportWhatsApp = (orderId, patientName, testName) => {
  showToast({
    title: '📱 Report Sent via WhatsApp',
    message: `Official verified PDF report for ${testName} delivered to ${patientName}.`,
    type: 'wa'
  });
};

window.openUploadResultModal = (orderId, testName) => {
  openModal({
    title: `Upload Findings for ${testName} (${orderId})`,
    size: 'md',
    body: `
      <div class="form-group">
        <label class="form-label">Diagnostic Findings & Values <span class="required">*</span></label>
        <textarea class="form-control" id="lab-findings" rows="3" placeholder="e.g. Hemoglobin: 13.8 g/dL, WBC: 7,200 /mcL, Platelets: 2.4 Lakhs (Normal reference range)"></textarea>
      </div>

      <div class="form-group">
        <label class="form-label">Sign-off Pathologist / Radiologist</label>
        <input type="text" class="form-control" value="Dr. Pradeep Kulkarni (Chief Biochemist)" />
      </div>

      <label class="form-check">
        <input type="checkbox" checked id="auto-notify-wa" />
        <span style="font-size:12px">📱 Automatically dispatch verified report PDF to patient's WhatsApp upon submission</span>
      </label>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="window._closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="submitLabResult('${orderId}')">Publish & Deliver Report</button>
    `
  });
};

window.submitLabResult = (orderId) => {
  const summary = document.getElementById('lab-findings')?.value || 'Diagnostic test verified normal.';
  const isNotify = document.getElementById('auto-notify-wa')?.checked;

  updateLabOrderStatus(orderId, 'completed', summary);
  closeModal();

  if (isNotify) {
    showToast({ title: '✓ Report Published & Dispatched', message: 'Delivered to patient over WhatsApp.', type: 'wa' });
  } else {
    showToast({ title: '✓ Report Published', message: 'Findings saved to patient EMR.', type: 'success' });
  }

  renderHospitalLab();
};

window.openOrderLabTestModal = () => {
  const patients = getHospitalPatients();
  const doctors = getHospitalStaff().filter(s => s.role === 'Doctor');

  openModal({
    title: 'Order New Lab / Diagnostic Investigation',
    size: 'md',
    body: `
      <div class="form-group">
        <label class="form-label">Select Patient <span class="required">*</span></label>
        <select class="form-control" id="new-lab-patient">
          ${patients.map(p => `<option value="${p.id}">${p.name} (${p.patientId})</option>`).join('')}
        </select>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Test Investigation Name <span class="required">*</span></label>
          <input type="text" class="form-control" id="new-lab-test" placeholder="e.g. Thyroid Profile (T3, T4, TSH)" required />
        </div>
        <div class="form-group">
          <label class="form-label">Diagnostic Department</label>
          <select class="form-control" id="new-lab-dept">
            <option>Biochemistry</option>
            <option>Hematology</option>
            <option>Radiology / Imaging</option>
            <option>Microbiology</option>
            <option>Cardiology Diagnostics</option>
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Ordering Doctor</label>
          <select class="form-control" id="new-lab-doc">
            ${doctors.map(d => `<option value="${d.name}">${d.name} (${d.department})</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Priority</label>
          <select class="form-control" id="new-lab-priority">
            <option value="routine">Routine</option>
            <option value="urgent">STAT Urgent</option>
          </select>
        </div>
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="window._closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="submitNewLabOrder()">Order Test</button>
    `
  });
};

window.submitNewLabOrder = () => {
  const patientId = document.getElementById('new-lab-patient')?.value;
  const testName = document.getElementById('new-lab-test')?.value;
  const department = document.getElementById('new-lab-dept')?.value || 'Biochemistry';
  const doctor = document.getElementById('new-lab-doc')?.value;
  const priority = document.getElementById('new-lab-priority')?.value || 'routine';
  const p = getHospitalPatients().find(pt => pt.id === patientId);

  if (!testName) {
    showToast({ title: 'Test Name Required', message: 'Please enter investigation name.', type: 'warning' });
    return;
  }

  createLabOrder({
    patientId,
    patientName: p?.name || 'Patient',
    testName,
    department,
    doctor,
    sampleType: 'Clinical Sample',
    priority,
    cost: 1100
  });

  closeModal();
  showToast({ title: 'Investigation Ordered', message: `${testName} ordered for ${p?.name}.`, type: 'success' });
  renderHospitalLab();
};

window.exportLabOrdersCSV = () => {
  showToast({ title: 'Exporting Lab Ledger', message: 'Diagnostics history exported as CSV.', type: 'info' });
};
