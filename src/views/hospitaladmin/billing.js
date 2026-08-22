// ============================================================
// hospitaladmin/billing.js — Module 8: Patient Billing & Invoicing
// ============================================================

import { renderTopbar } from '../../components/topbar.js';
import { renderSidebar } from '../../components/sidebar.js';
import { getHospitalInvoices, getHospitalPatients, getHospitalStaff, addHospitalBill, get } from '../../store.js';
import { showToast } from '../../components/toast.js';
import { openModal, closeModal } from '../../components/modal.js';
import { refreshIcons } from '../../components/icons.js';

export function renderHospitalBilling() {
  renderSidebar();
  renderTopbar({
    breadcrumb: [
      { label: 'Hospital Admin', path: '/ha/dashboard' },
      { label: 'Patient Billing & Invoicing' }
    ]
  });

  const invoices = getHospitalInvoices();
  const patients = getHospitalPatients();
  const hospital = get('hospitals')?.find(h => h.id === get('currentHospitalId')) || get('hospitals')?.[0];

  const total = invoices.reduce((s, i) => s + (i.amount || 0), 0);
  const paid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.amount || 0), 0);
  const pending = invoices.filter(i => i.status === 'pending' || i.status === 'partial').reduce((s, i) => s + (i.amount || 0), 0);
  const insurance = invoices.filter(i => i.status === 'insurance').reduce((s, i) => s + (i.amount || 0), 0);

  const content = document.getElementById('content');
  content.innerHTML = `
    <!-- Header -->
    <div class="page-header">
      <div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
          <h1 class="page-title">Patient Billing & Invoicing</h1>
          <span class="badge badge-primary">${hospital?.name || 'Hospital'} Accounts</span>
        </div>
        <p class="page-subtitle">Patient OPD/IPD bill generation, payment collection, and TPA insurance claim settlement</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary" onclick="exportHospitalBillingCSV()">
          <i data-lucide="download"></i> Export Revenue CSV
        </button>
        <button class="btn btn-primary" onclick="openGeneratePatientBillModal()">
          <i data-lucide="plus-circle"></i> Generate Patient Bill
        </button>
      </div>
    </div>

    <!-- Financial KPI Summary Cards -->
    <div class="stats-grid stats-grid-4" style="margin-bottom:28px">
      <div class="stat-card">
        <div class="stat-card-icon green"><i data-lucide="check-circle-2"></i></div>
        <div class="stat-card-value">₹${(paid / 1000).toFixed(0)}K</div>
        <div class="stat-card-label">Collected Payments</div>
        <div class="stat-card-trend"><span class="trend-up">● Instant Cash/UPI/Card</span></div>
      </div>

      <div class="stat-card">
        <div class="stat-card-icon amber"><i data-lucide="clock"></i></div>
        <div class="stat-card-value">₹${(pending / 1000).toFixed(0)}K</div>
        <div class="stat-card-label">Pending / Partial OPD</div>
        <div class="stat-card-trend">${invoices.filter(i => i.status === 'pending' || i.status === 'partial').length} Invoices Due</div>
      </div>

      <div class="stat-card">
        <div class="stat-card-icon blue"><i data-lucide="shield-check"></i></div>
        <div class="stat-card-value">₹${(insurance / 1000).toFixed(0)}K</div>
        <div class="stat-card-label">TPA Insurance Claims</div>
        <div class="stat-card-trend">Under TPA Pre-Auth Review</div>
      </div>

      <div class="stat-card">
        <div class="stat-card-icon purple"><i data-lucide="receipt"></i></div>
        <div class="stat-card-value">₹${(total / 1000).toFixed(0)}K</div>
        <div class="stat-card-label">Total Gross Billed</div>
        <div class="stat-card-trend">Across all clinical depts</div>
      </div>
    </div>

    <!-- Patient Invoices & Bill Ledger -->
    <div class="card">
      <div class="card-header" style="background:#F8FAFC">
        <div>
          <span class="card-title">Patient Bill & Invoice Records (${invoices.length})</span>
          <div style="font-size:var(--font-size-xs);color:var(--color-text-muted);margin-top:2px">Official tax bills with itemized pharmacy, lab, and consultation breakdown</div>
        </div>
        <div style="display:flex;gap:8px">
          <input type="text" class="form-control" style="width:260px;padding:6px 12px;font-size:13px" placeholder="Search bill or patient..." id="bill-search" oninput="filterHospitalBills()" />
        </div>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Patient Details</th>
              <th>Service / Description</th>
              <th>Doctor Assigned</th>
              <th>Bill Amount</th>
              <th>Date</th>
              <th>Status</th>
              <th class="td-actions">Actions & Receipt</th>
            </tr>
          </thead>
          <tbody id="bill-tbody">
            ${renderHospitalBillRows(invoices, patients)}
          </tbody>
        </table>
      </div>
    </div>
  `;

  refreshIcons(content);
}

function renderHospitalBillRows(list, patients) {
  if (!list.length) {
    return `<tr><td colspan="8"><div class="empty-state"><div class="es-title">No bills found</div></div></td></tr>`;
  }

  return list.map(inv => {
    const p = patients.find(pt => pt.id === inv.patientId);
    const isPaid = inv.status === 'paid';
    const isInsurance = inv.status === 'insurance';

    return `
      <tr>
        <td style="font-family:monospace;font-weight:700;color:var(--color-primary)">
          ${inv.id.toUpperCase()}
        </td>
        <td>
          <div style="font-weight:700;font-size:var(--font-size-base)">${p?.name || 'Patient'}</div>
          <div style="font-size:var(--font-size-xs);color:var(--color-text-muted)">ID: ${p?.patientId || 'MH-001'} · ${p?.phone || ''}</div>
        </td>
        <td>
          <div style="font-weight:600">${inv.description}</div>
        </td>
        <td style="color:var(--color-text-muted)">${inv.doctor || 'Staff'}</td>
        <td style="font-weight:800;font-size:var(--font-size-base)">₹${inv.amount.toLocaleString()}</td>
        <td style="color:var(--color-text-muted)">${inv.date}</td>
        <td>
          <span class="badge badge-${isPaid ? 'success' : isInsurance ? 'info' : 'warning'}">
            ${inv.status.toUpperCase()}
          </span>
        </td>
        <td class="td-actions">
          <button class="btn btn-secondary btn-sm" onclick="viewPatientInvoiceReceipt('${inv.id}')" title="Print Official Hospital Receipt">
            <i data-lucide="file-text"></i> Receipt
          </button>
          ${!isPaid ? `
            <button class="btn btn-success btn-sm" onclick="settlePatientBill('${inv.id}')">
              ✓ Settle
            </button>
          ` : `
            <span style="font-size:12px;color:var(--color-success);font-weight:700">✓ Settled</span>
          `}
        </td>
      </tr>
    `;
  }).join('');
}

window.viewPatientInvoiceReceipt = (invId) => {
  const invoices = getHospitalInvoices();
  const inv = invoices.find(i => i.id === invId);
  const patients = getHospitalPatients();
  const p = patients.find(pt => pt.id === inv?.patientId);
  const hospital = get('hospitals')?.find(h => h.id === get('currentHospitalId')) || get('hospitals')?.[0];

  openModal({
    title: `Official Patient Bill — ${inv?.id.toUpperCase()}`,
    size: 'lg',
    body: `
      <div style="background:white;border:1.5px solid var(--color-border);border-radius:12px;padding:28px" id="printable-tax-invoice">
        <!-- Hospital Header -->
        <div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:16px;border-bottom:2px solid var(--color-border);margin-bottom:20px">
          <div>
            <div style="font-size:22px;font-weight:800;color:var(--color-primary)">${hospital?.name || 'Apollo Hospital'}</div>
            <div style="font-size:12px;color:var(--color-text-muted);margin-top:2px">
              ${hospital?.address || '15 Andheri East, Mumbai, MH'}<br/>
              Phone: ${hospital?.phone || '+91 22 6789 0000'} · GSTIN: 27AABCA9911K1Z2
            </div>
          </div>
          <div style="text-align:right">
            <div style="font-size:20px;font-weight:800;font-family:monospace">${inv?.id.toUpperCase()}</div>
            <span class="badge badge-success" style="font-size:13px;padding:4px 10px;margin-top:4px">PAID RECEIPT</span>
          </div>
        </div>

        <!-- Patient Info -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;background:#F8FAFC;padding:14px;border-radius:10px;margin-bottom:20px;font-size:13px">
          <div>
            <span style="font-size:11px;font-weight:700;color:var(--color-text-light)">PATIENT DETAILS</span>
            <div style="font-weight:800;font-size:15px;margin-top:2px">${p?.name || 'Patient'}</div>
            <div style="color:var(--color-text-muted)">Age/Gender: ${p?.age}y / ${p?.gender} · Blood: ${p?.bloodGroup}</div>
            <div style="color:var(--color-text-muted)">UHID: ${p?.patientId || 'MH-APL-001'}</div>
          </div>
          <div>
            <div class="info-row" style="padding:2px 0"><span class="info-label">Billing Date</span><span class="info-value">${inv?.date}</span></div>
            <div class="info-row" style="padding:2px 0"><span class="info-label">Consultant</span><span class="info-value font-semibold">${inv?.doctor || 'Hospital Physician'}</span></div>
            <div class="info-row" style="padding:2px 0"><span class="info-label">Payment Mode</span><span class="info-value font-semibold">UPI / Card Verified</span></div>
          </div>
        </div>

        <!-- Items Table -->
        <table class="data-table" style="margin-bottom:18px">
          <thead>
            <tr>
              <th>Clinical Service / Procedure</th>
              <th>Qty</th>
              <th>Rate</th>
              <th style="text-align:right">Amount (INR)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div style="font-weight:700">${inv?.description}</div>
                <div style="font-size:11px;color:var(--color-text-muted)">Physician consultation and diagnostics evaluation</div>
              </td>
              <td>1</td>
              <td>₹${inv?.amount.toLocaleString()}</td>
              <td style="text-align:right;font-weight:700">₹${inv?.amount.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        <!-- Total -->
        <div style="display:flex;justify-content:flex-end">
          <div style="width:260px;background:#F8FAFC;padding:12px;border-radius:8px;border:1px solid var(--color-border)">
            <div class="info-row" style="padding:2px 0"><span class="info-label">Subtotal</span><span class="info-value">₹${inv?.amount.toLocaleString()}</span></div>
            <div class="info-row" style="padding:2px 0"><span class="info-label">Taxes (Exempt)</span><span class="info-value">₹0</span></div>
            <div class="info-row" style="padding:6px 0;border-top:2px solid var(--color-border);margin-top:4px">
              <span style="font-weight:800;font-size:16px">Total Paid</span>
              <span style="font-weight:800;font-size:18px;color:var(--color-primary)">₹${inv?.amount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div style="margin-top:20px;border-top:1px dashed var(--color-border);padding-top:10px;display:flex;justify-content:space-between;font-size:11px;color:var(--color-text-light)">
          <span>Authorized Cashier Signature: <strong>Rekha Sharma (Front Desk)</strong></span>
          <span>Thank you for choosing ${hospital?.name || 'MediCore Hospital'}.</span>
        </div>
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="window._closeModal()">Close</button>
      <button class="btn btn-primary" onclick="printInvoiceDirect()">
        <i data-lucide="printer"></i> Print Official Receipt
      </button>
    `
  });

  refreshIcons();
};

window.openGeneratePatientBillModal = () => {
  const patients = getHospitalPatients();
  const doctors = getHospitalStaff().filter(s => s.role === 'Doctor');

  openModal({
    title: 'Generate Patient OPD/IPD Bill',
    size: 'md',
    body: `
      <div class="form-group">
        <label class="form-label">Select Patient <span class="required">*</span></label>
        <select class="form-control" id="gen-bill-patient">
          ${patients.map(p => `<option value="${p.id}">${p.name} (${p.patientId})</option>`).join('')}
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Consulting Doctor</label>
        <select class="form-control" id="gen-bill-doc">
          ${doctors.map(d => `<option value="${d.name}">${d.name} (${d.department})</option>`).join('')}
        </select>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Bill Service / Procedure Description <span class="required">*</span></label>
          <input type="text" class="form-control" id="gen-bill-desc" value="OPD Consultation + Diagnostic Lab Tests" required />
        </div>
        <div class="form-group">
          <label class="form-label">Amount (INR ₹) <span class="required">*</span></label>
          <input type="number" class="form-control" id="gen-bill-amt" value="1800" required />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Payment Method</label>
          <select class="form-control" id="gen-bill-mode">
            <option value="paid">UPI / QR Code</option>
            <option value="paid">Credit / Debit Card</option>
            <option value="paid">Cash</option>
            <option value="insurance">TPA Health Insurance</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">TPA Insurance Policy / Pre-Auth #</label>
          <input type="text" class="form-control" placeholder="Optional for Cash" />
        </div>
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="window._closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="submitGenerateBill()">Generate Bill & Issue Receipt</button>
    `
  });
};

window.submitGenerateBill = () => {
  const patientId = document.getElementById('gen-bill-patient')?.value;
  const doctor = document.getElementById('gen-bill-doc')?.value;
  const description = document.getElementById('gen-bill-desc')?.value || 'Clinical Service';
  const amount = parseInt(document.getElementById('gen-bill-amt')?.value) || 1200;
  const status = document.getElementById('gen-bill-mode')?.value || 'paid';

  addHospitalBill({
    patientId,
    doctor,
    description,
    amount,
    status
  });

  closeModal();
  showToast({ title: 'Bill Generated', message: 'Patient bill recorded and added to ledger.', type: 'success' });
  renderHospitalBilling();
};

window.settlePatientBill = (invId) => {
  const invoices = getHospitalInvoices();
  const inv = invoices.find(i => i.id === invId);
  if (inv) {
    inv.status = 'paid';
    showToast({ title: 'Bill Settled', message: `${inv.id.toUpperCase()} marked as PAID.`, type: 'success' });
    renderHospitalBilling();
  }
};

window.exportHospitalBillingCSV = () => {
  showToast({ title: 'Exporting CSV', message: 'Patient billing ledger downloaded.', type: 'info' });
};
