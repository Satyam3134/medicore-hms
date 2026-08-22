// ============================================================
// hospitaladmin/bedManagement.js — Module 10: Bed & Ward Management
// ============================================================

import { renderTopbar } from '../../components/topbar.js';
import { renderSidebar } from '../../components/sidebar.js';
import { getHospitalBeds, getHospitalPatients, admitPatientToBed, dischargePatientBed, get } from '../../store.js';
import { showToast } from '../../components/toast.js';
import { openModal, closeModal } from '../../components/modal.js';
import { refreshIcons } from '../../components/icons.js';

let selectedWardFilter = '';

export function renderBedManagement() {
  renderSidebar();
  renderTopbar({
    breadcrumb: [
      { label: 'Hospital Admin', path: '/ha/dashboard' },
      { label: 'Bed & Ward Management' }
    ]
  });

  const allBeds = getHospitalBeds();
  const patients = getHospitalPatients();

  const wards = [...new Set(allBeds.map(b => b.ward))];
  const filteredBeds = selectedWardFilter ? allBeds.filter(b => b.ward === selectedWardFilter) : allBeds;

  const total = allBeds.length;
  const occupied = allBeds.filter(b => b.status === 'occupied').length;
  const available = allBeds.filter(b => b.status === 'available').length;
  const cleaning = allBeds.filter(b => b.status === 'cleaning').length;
  const occupancyRate = total ? ((occupied / total) * 100).toFixed(0) : 0;

  const content = document.getElementById('content');
  content.innerHTML = `
    <!-- Header -->
    <div class="page-header">
      <div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
          <h1 class="page-title">Bed & Ward Management</h1>
          <span class="badge badge-primary">Real-Time IPD Grid</span>
        </div>
        <p class="page-subtitle">Live inpatient ward occupancy, bed admission workflows, patient transfers, and sanitization tracking</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" onclick="openAdmitBedModal()">
          <i data-lucide="user-plus"></i> Admit Patient to Bed
        </button>
      </div>
    </div>

    <!-- Ward Occupancy KPI Cards -->
    <div class="stats-grid stats-grid-4" style="margin-bottom:28px">
      <div class="stat-card">
        <div class="stat-card-icon red"><i data-lucide="bed"></i></div>
        <div class="stat-card-value">${occupied} / ${total}</div>
        <div class="stat-card-label">Occupied Beds (${occupancyRate}%)</div>
        <div class="stat-card-trend"><span class="trend-up">● Inpatient admissions active</span></div>
      </div>

      <div class="stat-card">
        <div class="stat-card-icon green"><i data-lucide="check-circle-2"></i></div>
        <div class="stat-card-value">${available} Beds</div>
        <div class="stat-card-label">Available for Admission</div>
        <div class="stat-card-trend">Ready for instant allocation</div>
      </div>

      <div class="stat-card">
        <div class="stat-card-icon amber"><i data-lucide="sparkles"></i></div>
        <div class="stat-card-value">${cleaning} Beds</div>
        <div class="stat-card-label">Sanitization in Progress</div>
        <div class="stat-card-trend">Housekeeping turnaround ~20m</div>
      </div>

      <div class="stat-card">
        <div class="stat-card-icon blue"><i data-lucide="layers"></i></div>
        <div class="stat-card-value">${wards.length} Wards</div>
        <div class="stat-card-label">Active Hospital Wards</div>
        <div class="stat-card-trend">General, ICU, Cardiology</div>
      </div>
    </div>

    <!-- Ward Filter Chips -->
    <div class="card mb-6" style="padding:14px 20px;background:white">
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <span style="font-size:var(--font-size-xs);font-weight:700;text-transform:uppercase;color:var(--color-text-muted);margin-right:6px">Filter Ward:</span>
        <button class="btn btn-sm ${!selectedWardFilter ? 'btn-primary' : 'btn-secondary'}" onclick="filterWard('')">
          All Wards (${allBeds.length})
        </button>
        ${wards.map(w => {
          const wardBeds = allBeds.filter(b => b.ward === w);
          const wardOcc = wardBeds.filter(b => b.status === 'occupied').length;
          return `
            <button class="btn btn-sm ${selectedWardFilter === w ? 'btn-primary' : 'btn-secondary'}" onclick="filterWard('${w}')">
              ${w} (${wardOcc}/${wardBeds.length})
            </button>
          `;
        }).join('')}
      </div>
    </div>

    <!-- Visual Bed Matrix Grid -->
    <div class="card">
      <div class="card-header" style="background:#F8FAFC">
        <span class="card-title">Live Inpatient Bed Matrix (${filteredBeds.length} Beds Shown)</span>
        <div style="display:flex;align-items:center;gap:14px;font-size:var(--font-size-xs)">
          <span><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#EF4444;margin-right:4px"></span> Occupied</span>
          <span><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#10B981;margin-right:4px"></span> Available</span>
          <span><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#F59E0B;margin-right:4px"></span> Cleaning</span>
        </div>
      </div>

      <div class="card-body" style="padding:24px">
        <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(220px, 1fr));gap:16px">
          ${filteredBeds.map(bed => {
            const isOcc = bed.status === 'occupied';
            const isAvail = bed.status === 'available';
            const isClean = bed.status === 'cleaning';

            const borderColor = isOcc ? '#EF4444' : isAvail ? '#10B981' : isClean ? '#F59E0B' : '#CBD5E1';
            const bgColor = isOcc ? '#FEF2F2' : isAvail ? '#F0FDF4' : isClean ? '#FFFBEB' : '#F8FAFC';

            return `
              <div style="border:2px solid ${borderColor};border-radius:12px;padding:16px;background:${bgColor};box-shadow:var(--shadow-xs);display:flex;flex-direction:column;justify-content:space-between">
                <div>
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                    <span style="font-weight:800;font-size:17px;font-family:monospace;color:var(--color-text)">
                      ${bed.number}
                    </span>
                    <span class="badge badge-${isOcc ? 'danger' : isAvail ? 'success' : isClean ? 'warning' : 'gray'} badge-no-dot" style="font-size:10px;padding:2px 8px">
                      ${bed.status.toUpperCase()}
                    </span>
                  </div>

                  <div style="font-size:11px;color:var(--color-text-muted);margin-bottom:8px">
                    ${bed.ward}
                  </div>

                  ${isOcc ? `
                    <div style="background:white;padding:8px 10px;border-radius:8px;border:1px solid #FCA5A5;margin-bottom:12px;font-size:12px">
                      <div style="font-weight:700;color:#991B1B">${bed.patientName || 'Admitted Patient'}</div>
                      <div style="color:var(--color-text-muted);font-size:11px">Admitted: ${bed.admitDate || 'Recent'}</div>
                    </div>
                  ` : isAvail ? `
                    <div style="font-size:12px;color:#166534;font-weight:600;margin-bottom:12px">
                      ✓ Sanitized & Ready
                    </div>
                  ` : `
                    <div style="font-size:12px;color:#92400E;font-weight:600;margin-bottom:12px">
                      🧹 Disinfection in progress
                    </div>
                  `}
                </div>

                <div>
                  ${isOcc ? `
                    <button class="btn btn-secondary btn-sm w-full" style="font-size:11px" onclick="promptDischargeBed('${bed.id}', '${bed.number}', '${bed.patientName}')">
                      Discharge / Free Bed
                    </button>
                  ` : isAvail ? `
                    <button class="btn btn-primary btn-sm w-full" style="font-size:11px" onclick="openQuickAdmitModal('${bed.id}', '${bed.number}', '${bed.ward}')">
                      Admit Patient →
                    </button>
                  ` : `
                    <button class="btn btn-success btn-sm w-full" style="font-size:11px" onclick="markBedCleaned('${bed.id}')">
                      ✓ Mark Clean
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

window.filterWard = (ward) => {
  selectedWardFilter = ward;
  renderBedManagement();
};

window.openAdmitBedModal = () => {
  const patients = getHospitalPatients();
  const availableBeds = getHospitalBeds().filter(b => b.status === 'available');

  if (!availableBeds.length) {
    showToast({ title: 'No Available Beds', message: 'All hospital beds are currently occupied.', type: 'danger' });
    return;
  }

  openModal({
    title: 'Admit Inpatient to Ward Bed',
    size: 'md',
    body: `
      <div class="form-group">
        <label class="form-label">Select Patient <span class="required">*</span></label>
        <select class="form-control" id="admit-patient">
          ${patients.map(p => `<option value="${p.id}">${p.name} (${p.patientId})</option>`).join('')}
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Select Available Bed <span class="required">*</span></label>
        <select class="form-control" id="admit-bed">
          ${availableBeds.map(b => `<option value="${b.id}">${b.number} — ${b.ward}</option>`).join('')}
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Admission Diagnosis / Reason</label>
        <input type="text" class="form-control" id="admit-diag" placeholder="e.g. Post-op recovery / Acute observation" />
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="window._closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="submitAdmitBed()">Confirm Admission</button>
    `
  });
};

window.openQuickAdmitModal = (bedId, bedNum, ward) => {
  const patients = getHospitalPatients();

  openModal({
    title: `Admit to Bed ${bedNum} (${ward})`,
    size: 'md',
    body: `
      <div class="form-group">
        <label class="form-label">Select Patient <span class="required">*</span></label>
        <select class="form-control" id="quick-admit-patient">
          ${patients.map(p => `<option value="${p.id}">${p.name} (${p.patientId})</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Admission Notes</label>
        <input type="text" class="form-control" id="quick-admit-notes" placeholder="e.g. Emergency Observation" />
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="window._closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="submitQuickAdmit('${bedId}')">Admit Patient</button>
    `
  });
};

window.submitAdmitBed = () => {
  const patientId = document.getElementById('admit-patient')?.value;
  const bedId = document.getElementById('admit-bed')?.value;
  const p = getHospitalPatients().find(pt => pt.id === patientId);

  admitPatientToBed(bedId, patientId, p?.name);
  closeModal();
  showToast({ title: 'Patient Admitted', message: `${p?.name} admitted to ward.`, type: 'success' });
  renderBedManagement();
};

window.submitQuickAdmit = (bedId) => {
  const patientId = document.getElementById('quick-admit-patient')?.value;
  const p = getHospitalPatients().find(pt => pt.id === patientId);

  admitPatientToBed(bedId, patientId, p?.name);
  closeModal();
  showToast({ title: 'Patient Admitted', message: `${p?.name} admitted.`, type: 'success' });
  renderBedManagement();
};

window.promptDischargeBed = (bedId, bedNum, patientName) => {
  openModal({
    title: `Discharge Patient from Bed ${bedNum}`,
    size: 'sm',
    body: `
      <p style="font-size:var(--font-size-base);color:var(--color-text)">
        Are you sure you want to discharge <strong>${patientName || 'the patient'}</strong> from bed <strong>${bedNum}</strong>?
      </p>
      <p style="font-size:var(--font-size-xs);color:var(--color-text-muted);margin-top:8px">
        The bed will be flagged for sanitization before new patient admission.
      </p>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="window._closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="confirmDischarge('${bedId}')">Confirm Discharge</button>
    `
  });
};

window.confirmDischarge = (bedId) => {
  dischargePatientBed(bedId);
  closeModal();
  showToast({ title: 'Patient Discharged', message: 'Bed marked for sanitization.', type: 'info' });
  renderBedManagement();
};

window.markBedCleaned = (bedId) => {
  const beds = getHospitalBeds();
  const b = beds.find(bed => bed.id === bedId);
  if (b) {
    b.status = 'available';
    showToast({ title: 'Bed Sanitized', message: `${b.number} is now Available.`, type: 'success' });
    renderBedManagement();
  }
};
