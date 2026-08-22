// ============================================================
// superadmin/invoices.js — Dedicated Invoices Module with Preview
// ============================================================

import { renderTopbar } from '../../components/topbar.js';
import { renderSidebar } from '../../components/sidebar.js';
import { get, addPlatformInvoice, updateHospitalStatus } from '../../store.js';
import { showToast } from '../../components/toast.js';
import { openModal, closeModal } from '../../components/modal.js';
import { refreshIcons } from '../../components/icons.js';

let selectedInvoiceId = null;

export function renderSAInvoices(invoiceIdToPreview) {
  if (invoiceIdToPreview) selectedInvoiceId = invoiceIdToPreview;

  renderSidebar();
  renderTopbar({
    breadcrumb: [
      { label: 'Super Admin', path: '/sa/dashboard' },
      { label: 'Tenant Invoices & Billing Ledger' }
    ]
  });

  const invoices = get('platformInvoices') || [];
  const hospitals = get('hospitals') || [];

  if (!selectedInvoiceId && invoices.length > 0) {
    selectedInvoiceId = invoices[0].id;
  }

  const total = invoices.reduce((s, i) => s + i.amount, 0);
  const collected = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0);
  const pending = invoices.filter(i => i.status === 'pending').reduce((s, i) => s + i.amount, 0);
  const overdue = invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + i.amount, 0);

  const activeInvoice = invoices.find(i => i.id === selectedInvoiceId) || invoices[0];
  const activeHospital = hospitals.find(h => h.id === activeInvoice?.hospitalId);

  const content = document.getElementById('content');
  content.innerHTML = `
    <!-- Header -->
    <div class="page-header">
      <div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
          <h1 class="page-title">Tenant Invoices & Payment Ledger</h1>
          <span class="badge badge-primary">Dedicated Invoice Engine</span>
        </div>
        <p class="page-subtitle">Track hospital recurring subscriptions, issue GST tax invoices, and inspect live invoice previews</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary" onclick="exportAllInvoicesCSV()">
          <i data-lucide="download"></i> Export Ledger CSV
        </button>
        <button class="btn btn-primary" onclick="openCreateInvoiceWizard()">
          <i data-lucide="plus-circle"></i> Create Tax Invoice
        </button>
      </div>
    </div>

    <!-- Financial KPI Summary -->
    <div class="stats-grid stats-grid-4" style="margin-bottom:28px">
      <div class="stat-card">
        <div class="stat-card-icon green"><i data-lucide="check-circle-2"></i></div>
        <div class="stat-card-value">₹${(collected / 1000).toFixed(0)}K</div>
        <div class="stat-card-label">Collected This Month</div>
        <div class="stat-card-trend"><span class="trend-up">● ${invoices.filter(i => i.status === 'paid').length} Invoices Settled</span></div>
      </div>

      <div class="stat-card">
        <div class="stat-card-icon amber"><i data-lucide="clock"></i></div>
        <div class="stat-card-value">₹${(pending / 1000).toFixed(0)}K</div>
        <div class="stat-card-label">Pending Collection</div>
        <div class="stat-card-trend">${invoices.filter(i => i.status === 'pending').length} Invoices Awaiting</div>
      </div>

      <div class="stat-card">
        <div class="stat-card-icon red"><i data-lucide="alert-triangle"></i></div>
        <div class="stat-card-value">₹${(overdue / 1000).toFixed(0)}K</div>
        <div class="stat-card-label">Overdue Invoices</div>
        <div class="stat-card-trend" style="color:var(--color-danger)">Actionable Overdue Items</div>
      </div>

      <div class="stat-card">
        <div class="stat-card-icon blue"><i data-lucide="receipt"></i></div>
        <div class="stat-card-value">₹${(total / 1000).toFixed(0)}K</div>
        <div class="stat-card-label">Total Monthly Billed</div>
        <div class="stat-card-trend">Across ${hospitals.length} Tenant Hospitals</div>
      </div>
    </div>

    <!-- Master-Detail 2-Column Layout: Left (Invoice List) + Right (Live Interactive Invoice Preview) -->
    <div style="display:grid;grid-template-columns: 1fr 1fr; gap: 24px; align-items: start">
      
      <!-- Left Column: Invoices List with Filters -->
      <div class="card" style="box-shadow:var(--shadow-sm)">
        <div class="card-header" style="background:#F8FAFC">
          <div>
            <span class="card-title">Hospital Invoices (${invoices.length})</span>
            <div style="font-size:var(--font-size-xs);color:var(--color-text-muted);margin-top:2px">Select an invoice to inspect live tax preview</div>
          </div>
          <select class="table-filter-select" id="inv-status-filter" onchange="filterInvoicesList()">
            <option value="">All Statuses</option>
            <option value="paid">Paid Only</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>

        <div style="padding:12px 16px;border-bottom:1px solid var(--color-border);background:white">
          <div class="table-search" style="width:100%">
            <i data-lucide="search"></i>
            <input type="text" placeholder="Search invoices by hospital or invoice #..." id="inv-search-input" oninput="filterInvoicesList()" />
          </div>
        </div>

        <div class="scroll-y" style="max-height:680px;padding:8px" id="invoice-items-list">
          ${renderInvoiceListItems(invoices, selectedInvoiceId)}
        </div>
      </div>

      <!-- Right Column: Live Tax Invoice Preview Card -->
      <div id="invoice-preview-container">
        ${renderInvoicePreviewHtml(activeInvoice, activeHospital)}
      </div>

    </div>
  `;

  refreshIcons(content);
}

function renderInvoiceListItems(list, currentSelectedId) {
  if (!list.length) {
    return `<div class="empty-state" style="padding:40px"><div class="es-title">No invoices found</div></div>`;
  }

  return list.map(inv => {
    const isSelected = inv.id === currentSelectedId;
    const isOverdue = inv.status === 'overdue';
    const isPaid = inv.status === 'paid';
    const statusColor = isPaid ? 'success' : isOverdue ? 'danger' : 'warning';

    return `
      <div onclick="selectInvoiceForPreview('${inv.id}')" 
        style="padding:16px;margin-bottom:8px;border-radius:12px;cursor:pointer;border:2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'};background:${isSelected ? 'var(--color-primary-light)' : 'white'};box-shadow:${isSelected ? 'var(--shadow-xs)' : 'none'};transition:all 0.15s">
        
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">
          <div>
            <div style="font-family:monospace;font-weight:800;color:var(--color-primary);font-size:var(--font-size-base)">
              ${inv.id.toUpperCase()}
            </div>
            <div style="font-weight:700;font-size:var(--font-size-base);color:var(--color-text)">
              ${inv.hospitalName}
            </div>
          </div>
          <span class="badge badge-${statusColor}">
            ${inv.status.toUpperCase()}
          </span>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;padding-top:10px;border-top:1px dashed ${isSelected ? '#93C5FD' : 'var(--color-border)'}">
          <div style="font-size:var(--font-size-xs);color:var(--color-text-muted)">
            📅 Issued: ${inv.date} · Due: <span style="font-weight:600;color:${isOverdue ? 'var(--color-danger)' : 'inherit'}">${inv.dueDate}</span>
          </div>
          <div style="font-size:var(--font-size-lg);font-weight:800;color:var(--color-text)">
            ₹${inv.amount.toLocaleString()}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderInvoicePreviewHtml(inv, hospital) {
  if (!inv) {
    return `<div class="card"><div class="card-body"><div class="empty-state"><div class="es-title">No invoice selected</div></div></div></div>`;
  }

  const isPaid = inv.status === 'paid';
  const isOverdue = inv.status === 'overdue';
  const subtotal = Math.round(inv.amount / 1.18);
  const gst = inv.amount - subtotal;

  return `
    <div class="card" style="box-shadow:var(--shadow-md);border:1px solid var(--color-border);background:white">
      
      <!-- Preview Header Actions Bar -->
      <div class="card-header" style="background:#F8FAFC;padding:16px 24px">
        <div style="display:flex;align-items:center;gap:8px">
          <i data-lucide="file-text" style="color:var(--color-primary);width:20px;height:20px"></i>
          <span class="card-title">Tax Invoice Preview (${inv.id.toUpperCase()})</span>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-secondary btn-sm" onclick="printInvoiceDirect()">
            <i data-lucide="printer"></i> Print / PDF
          </button>
          <button class="btn btn-secondary btn-sm" onclick="sendInvoiceWhatsApp('${inv.hospitalId}', '${inv.id}')" title="Dispatch over WhatsApp">
            <i data-lucide="message-square" style="color:#25D366"></i> WhatsApp
          </button>
          ${!isPaid ? `
            <button class="btn btn-success btn-sm" onclick="markInvoiceSettled('${inv.id}')">
              ✓ Settle
            </button>
          ` : `
            <span class="badge badge-success">✓ Settle Verified</span>
          `}
        </div>
      </div>

      <!-- Printable Invoice Document Body -->
      <div class="card-body" style="padding:28px" id="printable-tax-invoice">
        
        <!-- Top Entity Header -->
        <div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:18px;border-bottom:2px solid var(--color-border);margin-bottom:20px">
          <div>
            <div style="font-size:22px;font-weight:800;color:var(--color-primary)">MediCore Technologies Pvt. Ltd.</div>
            <div style="font-size:12px;color:var(--color-text-muted);margin-top:4px;line-height:1.4">
              Healthcare SaaS Platform Headquarters<br/>
              Bandra-Kurla Complex (BKC), Mumbai, Maharashtra 400051<br/>
              GSTIN: <strong>27AABCM8842P1ZV</strong> · PAN: <strong>AABCM8842P</strong>
            </div>
          </div>

          <div style="text-align:right">
            <div style="font-size:20px;font-weight:800;font-family:monospace;color:var(--color-text)">${inv.id.toUpperCase()}</div>
            <div style="margin-top:6px">
              <span class="badge badge-${isPaid ? 'success' : isOverdue ? 'danger' : 'warning'}" style="font-size:13px;padding:4px 12px">
                ${inv.status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <!-- Billed To & Dates Grid -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px;font-size:var(--font-size-sm)">
          <div style="background:#F8FAFC;padding:14px;border-radius:10px;border:1px solid var(--color-border)">
            <span style="font-size:11px;font-weight:700;color:var(--color-text-light);text-transform:uppercase">BILLED TO (HOSPITAL TENANT)</span>
            <div style="font-weight:800;font-size:var(--font-size-base);color:var(--color-text);margin-top:2px">${inv.hospitalName}</div>
            <div style="color:var(--color-text-muted);font-size:12px">${hospital?.address || 'Hospital Campus Address, City, State'}</div>
            <div style="color:var(--color-text-muted);font-size:12px">Attn: <strong>${hospital?.adminName || 'Hospital Admin'}</strong> (${hospital?.adminEmail || 'admin@hospital.com'})</div>
          </div>

          <div style="background:#F8FAFC;padding:14px;border-radius:10px;border:1px solid var(--color-border)">
            <div class="info-list" style="font-size:12px">
              <div class="info-row" style="padding:2px 0"><span class="info-label">Invoice Date</span><span class="info-value font-semibold">${inv.date}</span></div>
              <div class="info-row" style="padding:2px 0"><span class="info-label">Due Date</span><span class="info-value font-semibold" style="color:${isOverdue ? 'var(--color-danger)' : 'inherit'}">${inv.dueDate}</span></div>
              <div class="info-row" style="padding:2px 0"><span class="info-label">Plan Tier</span><span class="info-value font-semibold">${inv.plan}</span></div>
              <div class="info-row" style="padding:2px 0"><span class="info-label">Database Schema</span><span class="info-value font-mono">${hospital?.database?.dbName || 'medicore_tenant_' + inv.hospitalId}</span></div>
            </div>
          </div>
        </div>

        <!-- Line Items Table -->
        <table class="data-table" style="margin-bottom:20px">
          <thead>
            <tr>
              <th>Description</th>
              <th>SAC Code</th>
              <th>Qty</th>
              <th>Rate</th>
              <th style="text-align:right">Amount (INR)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div style="font-weight:700">MediCore HMS ${inv.plan} Platform Subscription</div>
                <div style="font-size:11px;color:var(--color-text-muted)">Cloud software license, WhatsApp patient bot, EMR records & appointment engine</div>
              </td>
              <td style="font-family:monospace;font-size:12px">998313</td>
              <td>1 mo</td>
              <td>₹${(subtotal * 0.85).toFixed(0)}</td>
              <td style="text-align:right;font-weight:700">₹${(subtotal * 0.85).toFixed(0)}</td>
            </tr>
            <tr>
              <td>
                <div style="font-weight:700">Isolated Database Schema Partition & Daily Backup Storage</div>
                <div style="font-size:11px;color:var(--color-text-muted)">Encrypted PostgreSQL schema + daily automated cron backup snapshots</div>
              </td>
              <td style="font-family:monospace;font-size:12px">998315</td>
              <td>1 part</td>
              <td>₹${(subtotal * 0.15).toFixed(0)}</td>
              <td style="text-align:right;font-weight:700">₹${(subtotal * 0.15).toFixed(0)}</td>
            </tr>
          </tbody>
        </table>

        <!-- Totals Calculation & Payment Options -->
        <div style="display:grid;grid-template-columns: 1fr 280px; gap:20px; align-items: start">
          <div style="background:#F8FAFC;border:1px solid var(--color-border);border-radius:10px;padding:14px;font-size:12px">
            <span style="font-weight:700;color:var(--color-text)">BANK TRANSFER DETAILS (NEFT / RTGS)</span>
            <div style="color:var(--color-text-muted);margin-top:4px">
              Account Name: <strong>MediCore Technologies Pvt Ltd</strong><br/>
              A/C Number: <strong>99882200114422</strong> · IFSC: <strong>HDFC0001884</strong><br/>
              UPI ID: <strong>medicore.billing@hdfcbank</strong>
            </div>
          </div>

          <div style="background:#F8FAFC;border:1px solid var(--color-border);border-radius:10px;padding:14px;font-size:var(--font-size-sm)">
            <div class="info-row" style="padding:3px 0"><span class="info-label">Subtotal</span><span class="info-value">₹${subtotal.toLocaleString()}</span></div>
            <div class="info-row" style="padding:3px 0"><span class="info-label">CGST (9%)</span><span class="info-value">₹${(gst / 2).toFixed(0)}</span></div>
            <div class="info-row" style="padding:3px 0"><span class="info-label">SGST (9%)</span><span class="info-value">₹${(gst / 2).toFixed(0)}</span></div>
            <div class="info-row" style="padding:8px 0;border-top:2px solid var(--color-border);margin-top:4px">
              <span style="font-weight:800;font-size:var(--font-size-base)">Total Payable</span>
              <span style="font-weight:800;font-size:var(--font-size-lg);color:var(--color-primary)">₹${inv.amount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div style="margin-top:24px;border-top:1px dashed var(--color-border);padding-top:12px;display:flex;justify-content:space-between;align-items:center;font-size:11px;color:var(--color-text-light)">
          <span>Computer-generated official tax invoice under Section 31 of CGST Act.</span>
          <span>Authorized by MediCore Super Admin</span>
        </div>

      </div>

      <!-- Enforcement Footer if Overdue -->
      ${isOverdue ? `
        <div style="padding:16px 28px;background:#FEF2F2;border-top:1px solid #FCA5A5;display:flex;justify-content:space-between;align-items:center">
          <div style="font-size:var(--font-size-xs);color:#991B1B">
            ⚠️ <strong>Overdue Sanction:</strong> Payment is pending past the grace period. You may suspend workspace access.
          </div>
          <button class="btn btn-danger btn-sm" onclick="toggleTenantSuspension('${inv.hospitalId}', 'suspended')">
            <i data-lucide="shield-alert"></i> Suspend Tenant Workspace
          </button>
        </div>
      ` : ''}

    </div>
  `;
}

// ── Select Invoice and update Preview seamlessly ──
window.selectInvoiceForPreview = (id) => {
  selectedInvoiceId = id;
  const invoices = get('platformInvoices') || [];
  const hospitals = get('hospitals') || [];

  const inv = invoices.find(i => i.id === id);
  const hosp = hospitals.find(h => h.id === inv?.hospitalId);

  // Update left selection styling
  const listEl = document.getElementById('invoice-items-list');
  if (listEl) {
    listEl.innerHTML = renderInvoiceListItems(invoices, id);
    refreshIcons(listEl);
  }

  // Update right preview
  const previewEl = document.getElementById('invoice-preview-container');
  if (previewEl) {
    previewEl.innerHTML = renderInvoicePreviewHtml(inv, hosp);
    refreshIcons(previewEl);
  }
};

window.filterInvoicesList = () => {
  const q = document.getElementById('inv-search-input')?.value.toLowerCase() || '';
  const status = document.getElementById('inv-status-filter')?.value || '';
  const invoices = get('platformInvoices') || [];

  const filtered = invoices.filter(inv => {
    const matchQ = !q || inv.hospitalName.toLowerCase().includes(q) || inv.id.toLowerCase().includes(q);
    const matchStatus = !status || inv.status === status;
    return matchQ && matchStatus;
  });

  const listEl = document.getElementById('invoice-items-list');
  if (listEl) {
    listEl.innerHTML = renderInvoiceListItems(filtered, selectedInvoiceId);
    refreshIcons(listEl);
  }
};

window.printInvoiceDirect = () => {
  const element = document.getElementById('printable-tax-invoice');
  if (!element) {
    window.print();
    return;
  }

  showToast({ title: 'Preparing Clean Tax Invoice PDF', message: 'Isolating document for print...', type: 'info' });

  // Create isolated print frame
  let iframe = document.getElementById('invoice-isolated-print-frame');
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = 'invoice-isolated-print-frame';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
  }

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Tax Invoice - MediCore HMS</title>
        <meta charset="utf-8" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #FFFFFF;
            color: #0F172A;
            padding: 36px;
            font-size: 13.5px;
            line-height: 1.5;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
          }
          .badge-success { background: #DCFCE7 !important; color: #166534 !important; }
          .badge-danger { background: #FEE2E2 !important; color: #991B1B !important; }
          .badge-warning { background: #FEF3C7 !important; color: #92400E !important; }
          .data-table {
            width: 100%;
            border-collapse: collapse;
            margin: 18px 0;
          }
          .data-table th {
            text-align: left;
            padding: 10px 14px;
            background: #F8FAFC !important;
            border-bottom: 2px solid #CBD5E1;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #475569;
          }
          .data-table td {
            padding: 14px;
            border-bottom: 1px solid #E2E8F0;
          }
          .info-list { display: flex; flex-direction: column; gap: 4px; }
          .info-row { display: flex; justify-content: space-between; align-items: center; }
          .info-label { color: #64748B; }
          .info-value { font-weight: 600; }
          .font-mono { font-family: 'JetBrains Mono', monospace; }
          @page { size: A4 portrait; margin: 12mm; }
        </style>
      </head>
      <body>
        ${element.innerHTML}
      </body>
    </html>
  `);
  doc.close();

  setTimeout(() => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
  }, 250);
};

window.sendInvoiceWhatsApp = (hospitalId, invoiceId) => {
  const hospitals = get('hospitals') || [];
  const h = hospitals.find(h => h.id === hospitalId);
  showToast({
    title: '📱 Dispatched to WhatsApp',
    message: `Tax invoice ${invoiceId.toUpperCase()} with payment link sent to ${h?.adminName} (${h?.phone}).`,
    type: 'wa'
  });
};

window.markInvoiceSettled = (id) => {
  const invoices = get('platformInvoices') || [];
  const inv = invoices.find(i => i.id === id);
  if (inv) {
    inv.status = 'paid';
    showToast({ title: 'Invoice Settled', message: `${inv.id.toUpperCase()} marked as PAID.`, type: 'success' });
    renderSAInvoices(id);
  }
};

window.openCreateInvoiceWizard = () => {
  const hospitals = get('hospitals') || [];
  openModal({
    title: 'Create Custom Hospital Tax Invoice',
    size: 'md',
    body: `
      <div class="form-group">
        <label class="form-label">Hospital Tenant <span class="required">*</span></label>
        <select class="form-control" id="wiz-inv-hosp" onchange="autoFillWizPrice(this.value)">
          ${hospitals.map(h => `<option value="${h.id}">${h.name} (${h.plan} Plan)</option>`).join('')}
        </select>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Billing Amount (INR ₹) <span class="required">*</span></label>
          <input type="number" class="form-control" id="wiz-inv-amount" value="${hospitals[0]?.planPrice || 49999}" />
        </div>
        <div class="form-group">
          <label class="form-label">Plan Tier Tag</label>
          <input type="text" class="form-control" id="wiz-inv-plan" value="${hospitals[0]?.plan || 'Enterprise'}" />
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Billing Notes</label>
        <input type="text" class="form-control" id="wiz-inv-notes" placeholder="e.g. Monthly Recurring Subscription" />
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="window._closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="submitWizInvoice()">Generate & View Invoice</button>
    `
  });
};

window.autoFillWizPrice = (hospId) => {
  const hospitals = get('hospitals') || [];
  const h = hospitals.find(h => h.id === hospId);
  if (h) {
    const amt = document.getElementById('wiz-inv-amount');
    const pl = document.getElementById('wiz-inv-plan');
    if (amt) amt.value = h.planPrice || 49999;
    if (pl) pl.value = h.plan || 'Enterprise';
  }
};

window.submitWizInvoice = () => {
  const hospId = document.getElementById('wiz-inv-hosp')?.value;
  const amount = parseInt(document.getElementById('wiz-inv-amount')?.value) || 49999;
  const plan = document.getElementById('wiz-inv-plan')?.value || 'Enterprise';
  const hospitals = get('hospitals') || [];
  const h = hospitals.find(h => h.id === hospId);

  const newId = addPlatformInvoice({
    hospitalId: hospId,
    hospitalName: h?.name || 'Hospital',
    plan,
    amount
  });

  closeModal();
  showToast({ title: 'Invoice Issued', message: `Tax invoice ${newId.toUpperCase()} created.`, type: 'success' });
  renderSAInvoices(newId);
};

window.exportAllInvoicesCSV = () => {
  showToast({ title: 'Exporting Ledger', message: 'Full invoice history exported as CSV.', type: 'info' });
};
