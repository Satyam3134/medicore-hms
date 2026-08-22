// ============================================================
// receptionist/billingHandoff.js — Module 7: Checkout Billing Handoff
// ============================================================

import { renderTopbar } from '../../components/topbar.js';
import { renderSidebar } from '../../components/sidebar.js';
import { get, getHospitalInvoices, getHospitalPatients, addHospitalBill } from '../../store.js';
import { showToast } from '../../components/toast.js';
import { openModal, closeModal } from '../../components/modal.js';
import { refreshIcons } from '../../components/icons.js';

export function renderBillingHandoff({ query }) {
  renderSidebar();
  renderTopbar({
    breadcrumb: [
      { label: 'Front Desk', path: '/rc/queue' },
      { label: 'Patient Checkout & Billing Handoff' }
    ]
  });

  const invoices = getHospitalInvoices();
  const patients = getHospitalPatients();
  const preselectedPatientId = query?.patientId || null;

  const content = document.getElementById('content');
  content.innerHTML = `
    <!-- Header -->
    <div class="page-header">
      <div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
          <h1 class="page-title">Patient Checkout & Payment Collection</h1>
          <span class="badge badge-primary">Front Desk Cashier</span>
        </div>
        <p class="page-subtitle">Collect OPD consultation fees, issue instant UPI / Cash payment receipts, and hand off completed records</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" onclick="openQuickCollectModal('${preselectedPatientId || ''}')">
          <i data-lucide="receipt"></i> + Collect New Payment
        </button>
      </div>
    </div>

    <!-- Quick Collection Ledger -->
    <div class="card">
      <div class="card-header" style="background:#F8FAFC">
        <span class="card-title">Recent Checkout Transactions (${invoices.length})</span>
        <span class="badge badge-gray">Front Desk Receipts</span>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Receipt #</th>
              <th>Patient Details</th>
              <th>Service Rendered</th>
              <th>Consulting Doctor</th>
              <th>Amount (INR)</th>
              <th>Status</th>
              <th class="td-actions">Receipt Actions</th>
            </tr>
          </thead>
          <tbody>
            ${invoices.map(inv => {
              const p = patients.find(pt => pt.id === inv.patientId);
              const isPaid = inv.status === 'paid';

              return `
                <tr>
                  <td style="font-family:monospace;font-weight:700;color:var(--color-primary)">${inv.id.toUpperCase()}</td>
                  <td>
                    <div style="font-weight:700;font-size:var(--font-size-base)">${p?.name || 'Patient'}</div>
                    <div style="font-size:11px;color:var(--color-text-muted)">${p?.patientId || ''} · ${p?.phone || ''}</div>
                  </td>
                  <td>
                    <div style="font-weight:600">${inv.description}</div>
                  </td>
                  <td style="color:var(--color-text-muted)">${inv.doctor || 'Physician'}</td>
                  <td style="font-weight:800;font-size:var(--font-size-base)">₹${inv.amount.toLocaleString()}</td>
                  <td>
                    <span class="badge badge-${isPaid ? 'success' : 'warning'}">
                      ${inv.status.toUpperCase()}
                    </span>
                  </td>
                  <td class="td-actions">
                    <button class="btn btn-secondary btn-sm" onclick="printFrontDeskReceipt('${inv.id}', '${p?.name}', ${inv.amount})">
                      <i data-lucide="printer"></i> Print Slip
                    </button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  refreshIcons(content);
}

window.openQuickCollectModal = (patientId) => {
  const patients = getHospitalPatients();
  const p = patients.find(pt => pt.id === patientId) || patients[0];

  openModal({
    title: 'Collect OPD Consultation Payment',
    size: 'md',
    body: `
      <div class="form-group">
        <label class="form-label">Select Patient</label>
        <select class="form-control" id="collect-patient">
          ${patients.map(pt => `<option value="${pt.id}" ${pt.id === p?.id ? 'selected' : ''}>${pt.name} (${pt.patientId})</option>`).join('')}
        </select>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Service Rendered</label>
          <input type="text" class="form-control" id="collect-desc" value="OPD Consultation Fee" />
        </div>
        <div class="form-group">
          <label class="form-label">Amount (INR ₹)</label>
          <input type="number" class="form-control" id="collect-amt" value="800" />
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Payment Mode</label>
        <select class="form-control" id="collect-mode">
          <option>📱 UPI / Dynamic QR Code</option>
          <option>💵 Cash</option>
          <option>💳 Credit / Debit Card</option>
        </select>
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="window._closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="submitCollectPayment()">Record Payment & Print Slip</button>
    `
  });
};

window.submitCollectPayment = () => {
  const patientId = document.getElementById('collect-patient')?.value;
  const description = document.getElementById('collect-desc')?.value || 'OPD Fee';
  const amount = parseInt(document.getElementById('collect-amt')?.value) || 800;

  addHospitalBill({
    patientId,
    description,
    amount,
    doctor: 'Dr. Consultation',
    status: 'paid'
  });

  closeModal();
  showToast({ title: 'Payment Collected', message: `₹${amount} recorded and receipt generated.`, type: 'success' });
  renderBillingHandoff({});
};

window.printFrontDeskReceipt = (invId, patientName, amt) => {
  showToast({ title: 'Printing Receipt Slip', message: `Issued slip for ${patientName} (₹${amt}).`, type: 'info' });
};
