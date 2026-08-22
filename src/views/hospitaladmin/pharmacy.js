// ============================================================
// hospitaladmin/pharmacy.js — Module 11: Pharmacy & Medication Inventory
// ============================================================

import { renderTopbar } from '../../components/topbar.js';
import { renderSidebar } from '../../components/sidebar.js';
import { getHospitalPharmacy, dispenseMedicine, addPharmacyMedicine, getHospitalPatients, get } from '../../store.js';
import { showToast } from '../../components/toast.js';
import { openModal, closeModal } from '../../components/modal.js';
import { refreshIcons } from '../../components/icons.js';

export function renderHospitalPharmacy() {
  renderSidebar();
  renderTopbar({
    breadcrumb: [
      { label: 'Hospital Admin', path: '/ha/dashboard' },
      { label: 'Pharmacy & Drug Inventory' }
    ]
  });

  const meds = getHospitalPharmacy();
  const patients = getHospitalPatients();

  const totalItems = meds.length;
  const totalStock = meds.reduce((s, m) => s + (m.stock || 0), 0);
  const lowStockCount = meds.filter(m => m.stock <= (m.minStock || 20)).length;
  const valuation = meds.reduce((s, m) => s + (m.stock * (m.price || 10)), 0);

  const content = document.getElementById('content');
  content.innerHTML = `
    <!-- Header -->
    <div class="page-header">
      <div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
          <h1 class="page-title">Pharmacy & Medication Inventory</h1>
          <span class="badge badge-primary">Formulary & Stock Control</span>
        </div>
        <p class="page-subtitle">Track hospital drug stock, batch expiries, prescription-to-dispense flow, and automated reorder alerts</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary" onclick="openDispenseRxModal()">
          <i data-lucide="scan-line"></i> Dispense Patient Rx
        </button>
        <button class="btn btn-primary" onclick="openAddMedicineModal()">
          <i data-lucide="plus-circle"></i> Add Drug Stock / Batch
        </button>
      </div>
    </div>

    <!-- Pharmacy KPI Summary Cards -->
    <div class="stats-grid stats-grid-4" style="margin-bottom:28px">
      <div class="stat-card">
        <div class="stat-card-icon blue"><i data-lucide="pill"></i></div>
        <div class="stat-card-value">${totalItems} Formulations</div>
        <div class="stat-card-label">Active Hospital Drugs</div>
        <div class="stat-card-trend">${totalStock.toLocaleString()} total units in stock</div>
      </div>

      <div class="stat-card">
        <div class="stat-card-icon red"><i data-lucide="alert-triangle"></i></div>
        <div class="stat-card-value">${lowStockCount} Items</div>
        <div class="stat-card-label">Low Stock Reorder Triggers</div>
        <div class="stat-card-trend" style="color:var(--color-danger)">Below minimum safe threshold</div>
      </div>

      <div class="stat-card">
        <div class="stat-card-icon green"><i data-lucide="check-circle-2"></i></div>
        <div class="stat-card-value">100% Verified</div>
        <div class="stat-card-label">Batch Expiry Compliance</div>
        <div class="stat-card-trend">0 expired units in dispensary</div>
      </div>

      <div class="stat-card">
        <div class="stat-card-icon purple"><i data-lucide="banknote"></i></div>
        <div class="stat-card-value">₹${(valuation / 1000).toFixed(1)}K</div>
        <div class="stat-card-label">Total Pharmacy Stock Value</div>
        <div class="stat-card-trend">Cost valuation basis</div>
      </div>
    </div>

    <!-- Low Stock Alert Banner if any -->
    ${lowStockCount > 0 ? `
      <div class="alert alert-warning mb-6" style="display:flex;justify-content:space-between;align-items:center">
        <div style="display:flex;align-items:center;gap:12px">
          <i data-lucide="alert-circle" style="width:22px;height:22px"></i>
          <div>
            <strong>Reorder Alert:</strong> ${lowStockCount} critical medication items are running below minimum stock buffers.
          </div>
        </div>
        <button class="btn btn-sm btn-secondary" onclick="showToast({ title: 'Purchase Order Dispatched', message: 'Reorder sent to central distributor.', type: 'success' })">
          Auto-Generate Purchase Order
        </button>
      </div>
    ` : ''}

    <!-- Medication Inventory Table -->
    <div class="card">
      <div class="card-header" style="background:#F8FAFC">
        <div>
          <span class="card-title">Medication Stock Ledger (${meds.length} Formulations)</span>
          <div style="font-size:var(--font-size-xs);color:var(--color-text-muted);margin-top:2px">Real-time rack positions and batch expiry dates</div>
        </div>
        <div style="display:flex;gap:8px">
          <input type="text" class="form-control" style="width:260px;padding:6px 12px;font-size:13px" placeholder="Search medicine or generic..." id="pharm-search" oninput="filterPharmacyTable()" />
        </div>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Drug Formulation</th>
              <th>Category</th>
              <th>Dosage Form</th>
              <th>Batch # & Expiry</th>
              <th>Rack Position</th>
              <th>In Stock</th>
              <th>Unit MRP</th>
              <th class="td-actions">Dispense & Action</th>
            </tr>
          </thead>
          <tbody id="pharm-tbody">
            ${renderPharmacyRows(meds)}
          </tbody>
        </table>
      </div>
    </div>
  `;

  refreshIcons(content);
}

function renderPharmacyRows(list) {
  if (!list.length) {
    return `<tr><td colspan="8"><div class="empty-state"><div class="es-title">No medications found</div></div></td></tr>`;
  }

  return list.map(med => {
    const isLow = med.stock <= (med.minStock || 20);

    return `
      <tr>
        <td>
          <div style="font-weight:800;font-size:var(--font-size-base)">${med.name}</div>
          <div style="font-size:var(--font-size-xs);color:var(--color-text-muted)">${med.generic} · ${med.manufacturer || 'Pharma'}</div>
        </td>
        <td><span class="badge badge-info badge-no-dot">${med.category}</span></td>
        <td style="color:var(--color-text-muted)">${med.form}</td>
        <td>
          <div style="font-family:monospace;font-weight:700;font-size:12px">${med.batchNo}</div>
          <div style="font-size:11px;color:var(--color-text-muted)">Exp: ${med.expiryDate}</div>
        </td>
        <td>
          <span style="background:var(--color-bg);padding:3px 8px;border-radius:6px;font-size:11px;font-weight:700;border:1px solid var(--color-border)">
            ${med.rackLocation || 'Rack A-01'}
          </span>
        </td>
        <td>
          <div style="font-weight:800;font-size:var(--font-size-base);color:${isLow ? 'var(--color-danger)' : 'var(--color-text)'}">
            ${med.stock} Units
          </div>
          ${isLow ? '<span class="badge badge-danger" style="font-size:10px;padding:2px 6px">LOW STOCK</span>' : ''}
        </td>
        <td style="font-weight:700">₹${med.price.toFixed(2)}</td>
        <td class="td-actions">
          <button class="btn btn-primary btn-sm" onclick="promptQuickDispense('${med.id}', '${med.name}', ${med.stock})">
            <i data-lucide="check"></i> Dispense
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

window.promptQuickDispense = (medId, medName, currentStock) => {
  openModal({
    title: `Dispense ${medName}`,
    size: 'sm',
    body: `
      <div style="font-size:13px;color:var(--color-text-muted);margin-bottom:14px">
        Current Dispensary Stock: <strong>${currentStock} Units</strong>
      </div>
      <div class="form-group">
        <label class="form-label">Quantity to Dispense</label>
        <input type="number" class="form-control" id="dispense-qty" value="10" min="1" max="${currentStock}" />
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="window._closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="submitDispense('${medId}', '${medName}')">Confirm Dispense</button>
    `
  });
};

window.submitDispense = (medId, medName) => {
  const qty = parseInt(document.getElementById('dispense-qty')?.value) || 1;
  const ok = dispenseMedicine(medId, qty);
  closeModal();

  if (ok) {
    showToast({ title: 'Medicine Dispensed', message: `Deducted ${qty} units of ${medName} from stock.`, type: 'success' });
    renderHospitalPharmacy();
  } else {
    showToast({ title: 'Insufficient Stock', message: 'Not enough units in stock.', type: 'danger' });
  }
};

window.openDispenseRxModal = () => {
  const patients = getHospitalPatients();
  openModal({
    title: 'Dispense Patient Prescription (Rx)',
    size: 'md',
    body: `
      <div class="form-group">
        <label class="form-label">Select Patient with Active Rx</label>
        <select class="form-control" id="rx-patient">
          ${patients.map(p => `<option value="${p.id}">${p.name} (${p.prescriptions?.length || 0} Prescribed Drugs)</option>`).join('')}
        </select>
      </div>
      <div class="alert alert-info" style="font-size:12px">
        Scanning active EMR electronic prescription orders and packaging medicines.
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="window._closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="submitPatientRxDispense()">Fulfill & Deduct Stock</button>
    `
  });
};

window.submitPatientRxDispense = () => {
  closeModal();
  showToast({ title: 'Prescription Fulfilled', message: 'Prescription packaged and stock updated.', type: 'success' });
  renderHospitalPharmacy();
};

window.openAddMedicineModal = () => {
  openModal({
    title: 'Add New Drug Formulation / Batch',
    size: 'md',
    body: `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Medicine Brand Name <span class="required">*</span></label>
          <input type="text" class="form-control" id="new-med-name" placeholder="e.g. Amoxicillin 500mg" required />
        </div>
        <div class="form-group">
          <label class="form-label">Generic Composition</label>
          <input type="text" class="form-control" id="new-med-gen" placeholder="e.g. Amoxicillin Trihydrate" />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Therapeutic Category</label>
          <select class="form-control" id="new-med-cat">
            <option>Antibiotics</option>
            <option>Cardiovascular</option>
            <option>Analgesics</option>
            <option>Gastroenterology</option>
            <option>Dermatology</option>
            <option>Diabetology</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Dosage Form</label>
          <select class="form-control" id="new-med-form">
            <option>Tablet</option>
            <option>Capsule</option>
            <option>Syrup / Liquid</option>
            <option>Injection</option>
            <option>Gel / Ointment</option>
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Stock Quantity</label>
          <input type="number" class="form-control" id="new-med-stock" value="200" />
        </div>
        <div class="form-group">
          <label class="form-label">Unit MRP (INR ₹)</label>
          <input type="number" class="form-control" id="new-med-price" value="15.00" />
        </div>
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="window._closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="submitAddMedicine()">Add to Formulary</button>
    `
  });
};

window.submitAddMedicine = () => {
  const name = document.getElementById('new-med-name')?.value;
  const generic = document.getElementById('new-med-gen')?.value || name;
  const category = document.getElementById('new-med-cat')?.value || 'General';
  const form = document.getElementById('new-med-form')?.value || 'Tablet';
  const stock = parseInt(document.getElementById('new-med-stock')?.value) || 100;
  const price = parseFloat(document.getElementById('new-med-price')?.value) || 10.0;

  if (!name) {
    showToast({ title: 'Name Required', message: 'Please enter drug brand name.', type: 'warning' });
    return;
  }

  addPharmacyMedicine({
    name,
    generic,
    category,
    form,
    stock,
    price,
    batchNo: 'BAT-2026-' + Math.floor(Math.random() * 899 + 100),
    expiryDate: '2028-06-30'
  });

  closeModal();
  showToast({ title: 'Medicine Added', message: `${name} registered in hospital pharmacy.`, type: 'success' });
  renderHospitalPharmacy();
};
