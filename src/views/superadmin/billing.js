// ============================================================
// superadmin/billing.js — Module 4: Subscription & Billing Hub
// ============================================================

import { renderTopbar } from '../../components/topbar.js';
import { renderSidebar } from '../../components/sidebar.js';
import { get, updateHospitalStatus, updateSubscriptionPlan, createSubscriptionPlan, addPlatformInvoice } from '../../store.js';
import { showToast } from '../../components/toast.js';
import { openModal, closeModal } from '../../components/modal.js';
import { refreshIcons } from '../../components/icons.js';

let activeBillingTab = 'plans'; // 'plans' | 'invoices'

export function renderSABilling(defaultTab) {
  if (defaultTab) activeBillingTab = defaultTab;

  renderSidebar();
  renderTopbar({
    breadcrumb: [
      { label: 'Super Admin', path: '/sa/dashboard' },
      { label: activeBillingTab === 'plans' ? 'SaaS Subscription Plans' : 'Tenant Invoices & Ledger' }
    ]
  });

  const invoices = get('platformInvoices') || [];
  const hospitals = get('hospitals') || [];
  const plans = get('subscriptionPlans') || [];

  const total = invoices.reduce((s, i) => s + i.amount, 0);
  const collected = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0);
  const pending = invoices.filter(i => i.status === 'pending').reduce((s, i) => s + i.amount, 0);
  const overdue = invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + i.amount, 0);

  const content = document.getElementById('content');
  content.innerHTML = `
    <!-- Header -->
    <div class="page-header">
      <div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
          <h1 class="page-title">SaaS Subscription & Invoicing Hub</h1>
          <span class="badge badge-primary">Tier Management & Multi-Tenant Ledger</span>
        </div>
        <p class="page-subtitle">Configure SaaS tier pricing & features, manage custom hospital plans, and collect recurring invoices</p>
      </div>
      <div class="page-actions">
        ${activeBillingTab === 'plans' ? `
          <button class="btn btn-secondary" onclick="exportPricingMatrixCSV()">
            <i data-lucide="download"></i> Export Tier Matrix
          </button>
          <button class="btn btn-primary" onclick="openCreatePlanModal()">
            <i data-lucide="plus-circle"></i> Create New SaaS Tier
          </button>
        ` : `
          <button class="btn btn-secondary" onclick="exportInvoicesCSV()">
            <i data-lucide="download"></i> Export Invoices (CSV)
          </button>
          <button class="btn btn-primary" onclick="openCreateInvoiceModal()">
            <i data-lucide="plus-circle"></i> Generate Custom Invoice
          </button>
        `}
      </div>
    </div>

    <!-- Navigation Tabs: Separate for Plans and Invoices -->
    <div class="tabs mb-6">
      <button class="tab-btn ${activeBillingTab === 'plans' ? 'active' : ''}" onclick="setBillingTab('plans')">
        <i data-lucide="layers"></i> SaaS Subscription Tiers & Pricing (${plans.length})
      </button>
      <button class="tab-btn ${activeBillingTab === 'invoices' ? 'active' : ''}" onclick="setBillingTab('invoices')">
        <i data-lucide="receipt"></i> Tenant Invoices & Payment Ledger (${invoices.length})
      </button>
    </div>

    <!-- TAB 1: SAAS SUBSCRIPTION PLANS -->
    ${activeBillingTab === 'plans' ? `
      <!-- Plans KPI Banner -->
      <div class="stats-grid stats-grid-4" style="margin-bottom:28px">
        <div class="stat-card">
          <div class="stat-card-icon blue"><i data-lucide="package"></i></div>
          <div class="stat-card-value">${plans.length} Tiers</div>
          <div class="stat-card-label">Active Subscription Tiers</div>
          <div class="stat-card-trend">From ₹9.9k to ₹49.9k / mo</div>
        </div>

        <div class="stat-card">
          <div class="stat-card-icon green"><i data-lucide="building-2"></i></div>
          <div class="stat-card-value">${hospitals.length} Subscribed</div>
          <div class="stat-card-label">Enrolled Hospital Tenants</div>
          <div class="stat-card-trend"><span class="trend-up">100% Tenant Coverage</span></div>
        </div>

        <div class="stat-card">
          <div class="stat-card-icon teal"><i data-lucide="sparkles"></i></div>
          <div class="stat-card-value">₹${((plans.reduce((acc, p) => acc + p.price, 0)) / 3000).toFixed(1)}k</div>
          <div class="stat-card-label">Avg Plan Price Index</div>
          <div class="stat-card-trend">Flexible feature allocation</div>
        </div>

        <div class="stat-card">
          <div class="stat-card-icon purple"><i data-lucide="arrow-up-right"></i></div>
          <div class="stat-card-value">Enterprise</div>
          <div class="stat-card-label">Top Tier Tier Share</div>
          <div class="stat-card-trend">40% of active hospitals</div>
        </div>
      </div>

      <!-- Plan Cards Grid -->
      <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:24px;margin-bottom:32px">
        ${plans.map(p => {
          const subscribedHospitals = hospitals.filter(h => h.plan === p.name);
          const isEnterprise = p.name === 'Enterprise' || p.id === 'plan_enterprise';

          return `
            <div style="border:2.5px solid ${isEnterprise ? 'var(--color-primary)' : 'var(--color-border)'};border-radius:16px;background:${isEnterprise ? '#F8FAFC' : 'white'};box-shadow:var(--shadow-sm);display:flex;flex-direction:column;justify-content:space-between;overflow:hidden;transition:all 0.15s">
              
              <!-- Card Top -->
              <div style="padding:26px 26px 18px 26px">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
                  <div>
                    <span style="font-size:var(--font-size-xl);font-weight:800;color:var(--color-text)">${p.name}</span>
                    <div style="font-size:var(--font-size-xs);color:var(--color-text-muted);margin-top:2px">ID: ${p.id}</div>
                  </div>
                  ${isEnterprise ? '<span class="badge badge-primary">Most Popular</span>' : '<span class="badge badge-gray badge-no-dot">Active Tier</span>'}
                </div>

                <div style="display:flex;align-items:baseline;gap:4px;margin-bottom:16px">
                  <span style="font-size:36px;font-weight:800;color:var(--color-primary)">₹${p.price.toLocaleString()}</span>
                  <span style="font-size:var(--font-size-sm);color:var(--color-text-muted)">/ month</span>
                </div>

                <!-- Subscribed Hospitals Chips -->
                <div style="background:var(--color-bg);border:1px solid var(--color-border);border-radius:10px;padding:10px 14px;margin-bottom:20px">
                  <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--color-text-light);margin-bottom:6px">
                    Enrolled Tenants (${subscribedHospitals.length})
                  </div>
                  ${subscribedHospitals.length > 0 ? `
                    <div style="display:flex;flex-wrap:wrap;gap:6px">
                      ${subscribedHospitals.map(h => `
                        <span class="badge badge-primary badge-no-dot" style="font-size:11px;cursor:pointer" onclick="navigateTo('/sa/hospitals/${h.id}')" title="Click to view tenant">
                          ${h.name.split(' ')[0]}
                        </span>
                      `).join('')}
                    </div>
                  ` : `
                    <span style="font-size:12px;color:var(--color-text-muted)">No hospitals currently enrolled</span>
                  `}
                </div>

                <!-- Limits Summary -->
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;padding-bottom:14px;border-bottom:1px solid var(--color-border);margin-bottom:16px;font-size:var(--font-size-xs)">
                  <div>
                    <span style="color:var(--color-text-light);font-weight:600">DOCTORS LIMIT</span>
                    <div style="font-weight:700;font-size:var(--font-size-sm);color:var(--color-text)">${p.maxDoctors ? p.maxDoctors + ' Doctors' : 'Unlimited'}</div>
                  </div>
                  <div>
                    <span style="color:var(--color-text-light);font-weight:600">DEPARTMENTS</span>
                    <div style="font-weight:700;font-size:var(--font-size-sm);color:var(--color-text)">${p.maxDepts ? p.maxDepts + ' Depts' : 'Unlimited'}</div>
                  </div>
                </div>

                <!-- Feature Bullet Points -->
                <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px">
                  ${(p.features || []).map(f => `
                    <div style="font-size:var(--font-size-sm);color:var(--color-text);display:flex;align-items:center;gap:8px">
                      <i data-lucide="check-circle-2" style="color:var(--color-success);width:16px;height:16px;flex-shrink:0"></i>
                      <span>${f}</span>
                    </div>
                  `).join('')}
                </div>
              </div>

              <!-- Card Action Footer -->
              <div style="padding:16px 26px;background:#FAFAFA;border-top:1px solid var(--color-border);display:flex;justify-content:space-between;align-items:center">
                <button class="btn btn-secondary btn-sm w-full" onclick="openEditPlanModal('${p.id}')">
                  <i data-lucide="edit-3"></i> Edit Plan Configuration & Pricing
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Plan Features Comparison Matrix -->
      <div class="card mb-6">
        <div class="card-header">
          <span class="card-title">Feature Entitlement Matrix Across Tiers</span>
        </div>
        <div class="card-body" style="padding:0">
          <table class="data-table">
            <thead>
              <tr>
                <th>Platform Module / Capability</th>
                <th>Starter (₹9,999)</th>
                <th>Professional (₹24,999)</th>
                <th>Enterprise (₹49,999)</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>WhatsApp Patient Chatbot & QR Booking</td><td>✓ Included</td><td>✓ Included</td><td>✓ Included (Priority Quota)</td></tr>
              <tr><td>Multi-Doctor Schedule & Calendar</td><td>Up to 5 Doctors</td><td>Up to 25 Doctors</td><td>✓ Unlimited Doctors</td></tr>
              <tr><td>Bed Management & Real-Time Ward Grid</td><td>Basic</td><td>✓ Full Support</td><td>✓ Multi-Ward & ICU Matrix</td></tr>
              <tr><td>Isolated Database Schema & Dedicated Keys</td><td>✓ Standard Partition</td><td>✓ Standard Partition</td><td>✓ High-Performance Cluster</td></tr>
              <tr><td>Automated Backup Cron Interval</td><td>Weekly</td><td>Every 12 Hours</td><td>✓ Daily (02:00 AM) + On-Demand</td></tr>
              <tr><td>Custom Hospital Branding & Logo</td><td>—</td><td>✓ Included</td><td>✓ White-Label Custom Domain</td></tr>
              <tr><td>Direct 24x7 SLA Support Line</td><td>Email Support</td><td>Standard SLA (4h)</td><td>✓ Dedicated Lead (15m SLA)</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    ` : ''}

    <!-- TAB 2: INVOICE LEDGER & REVENUE COLLECTION -->
    ${activeBillingTab === 'invoices' ? `
      <!-- Financial KPI Cards -->
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
          <div class="stat-card-label">Overdue (>30 Days)</div>
          <div class="stat-card-trend" style="color:var(--color-danger)">1 Hospital Risk</div>
        </div>

        <div class="stat-card">
          <div class="stat-card-icon blue"><i data-lucide="credit-card"></i></div>
          <div class="stat-card-value">₹${(total / 1000).toFixed(0)}K</div>
          <div class="stat-card-label">Total Monthly Billed</div>
          <div class="stat-card-trend">Across ${hospitals.length} Tenants</div>
        </div>
      </div>

      <!-- Invoices Data Table -->
      <div class="data-table-wrapper mb-6">
        <div class="table-toolbar">
          <div class="table-toolbar-left">
            <div class="table-search">
              <i data-lucide="search"></i>
              <input type="text" placeholder="Search invoices by hospital or invoice #..." id="invoice-search" oninput="filterInvoices()" />
            </div>
            <select class="table-filter-select" id="invoice-status-filter" onchange="filterInvoices()">
              <option value="">All Statuses</option>
              <option value="paid">Paid Only</option>
              <option value="pending">Pending Collection</option>
              <option value="overdue">Overdue Risk</option>
            </select>
          </div>
          <div class="table-toolbar-right">
            <span style="font-size:var(--font-size-sm);color:var(--color-text-muted)">Showing ${invoices.length} Invoices</span>
          </div>
        </div>

        <div class="scroll-x">
          <table class="data-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Hospital Tenant</th>
                <th>Plan Tier</th>
                <th>Billed Amount</th>
                <th>Issued Date</th>
                <th>Due Date</th>
                <th>Status</th>
                <th class="td-actions">Actions & Tax Invoice</th>
              </tr>
            </thead>
            <tbody id="invoice-tbody">
              ${renderInvoiceRows(invoices)}
            </tbody>
          </table>
        </div>
      </div>
    ` : ''}
  `;

  refreshIcons(content);
}

function renderInvoiceRows(list) {
  if (!list.length) {
    return `<tr><td colspan="8"><div class="empty-state"><div class="es-title">No invoices matching filter</div></div></td></tr>`;
  }
  return list.map(inv => {
    const isOverdue = inv.status === 'overdue';
    const isPaid = inv.status === 'paid';
    return `
      <tr>
        <td style="font-family:monospace;font-weight:700;color:var(--color-primary)">${inv.id.toUpperCase()}</td>
        <td>
          <div style="font-weight:600">${inv.hospitalName}</div>
          <div style="font-size:var(--font-size-xs);color:var(--color-text-muted)">ID: ${inv.hospitalId}</div>
        </td>
        <td><span class="badge badge-info badge-no-dot">${inv.plan}</span></td>
        <td style="font-weight:700;font-size:var(--font-size-base)">₹${inv.amount.toLocaleString()}</td>
        <td style="color:var(--color-text-muted)">${inv.date}</td>
        <td style="color:${isOverdue ? 'var(--color-danger)' : 'var(--color-text-muted)'};font-weight:${isOverdue ? '700' : '400'}">
          ${inv.dueDate}
        </td>
        <td>
          <span class="badge badge-${isPaid ? 'success' : isOverdue ? 'danger' : 'warning'}">
            ${inv.status.toUpperCase()}
          </span>
        </td>
        <td class="td-actions">
          <button class="btn btn-secondary btn-sm" onclick="viewOfficialInvoiceModal('${inv.id}')" title="View Official Tax Invoice">
            <i data-lucide="file-text"></i> View Invoice
          </button>

          ${isOverdue ? `
            <button class="btn btn-danger btn-sm" onclick="toggleTenantSuspension('${inv.hospitalId}', 'suspended')" title="Suspend Tenant for non-payment">
              <i data-lucide="shield-alert"></i> Suspend
            </button>
            <button class="btn btn-secondary btn-sm" onclick="sendPaymentReminder('${inv.hospitalId}', '${inv.id}')" title="Send WhatsApp Reminder">
              <i data-lucide="bell"></i> Remind
            </button>
          ` : isPaid ? `
            <span style="font-size:12px;color:var(--color-success);font-weight:700">✓ Settled</span>
          ` : `
            <button class="btn btn-success btn-sm" onclick="markInvoicePaid('${inv.id}')" title="Mark as Collected">
              ✓ Settle
            </button>
            <button class="btn btn-secondary btn-sm" onclick="sendPaymentReminder('${inv.hospitalId}', '${inv.id}')">
              <i data-lucide="send"></i> Reminder
            </button>
          `}
        </td>
      </tr>
    `;
  }).join('');
}

// ── Tab Switcher ──
window.setBillingTab = (tab) => {
  activeBillingTab = tab;
  renderSABilling();
};

window.filterInvoices = () => {
  const q = document.getElementById('invoice-search')?.value.toLowerCase() || '';
  const status = document.getElementById('invoice-status-filter')?.value || '';
  const invoices = get('platformInvoices') || [];

  const filtered = invoices.filter(inv => {
    const matchQ = !q || inv.hospitalName.toLowerCase().includes(q) || inv.id.toLowerCase().includes(q);
    const matchStatus = !status || inv.status === status;
    return matchQ && matchStatus;
  });

  const tbody = document.getElementById('invoice-tbody');
  if (tbody) {
    tbody.innerHTML = renderInvoiceRows(filtered);
    refreshIcons(tbody);
  }
};

// ── Edit Subscription Plan Modal ──
window.openEditPlanModal = (planId) => {
  const plans = get('subscriptionPlans') || [];
  const p = plans.find(plan => plan.id === planId);
  if (!p) return;

  openModal({
    title: `Edit SaaS Tier — ${p.name} Plan`,
    size: 'md',
    body: `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Plan Tier Name <span class="required">*</span></label>
          <input type="text" class="form-control" id="edit-plan-name" value="${p.name}" />
        </div>
        <div class="form-group">
          <label class="form-label">Monthly Price (INR ₹) <span class="required">*</span></label>
          <input type="number" class="form-control" id="edit-plan-price" value="${p.price}" />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Max Doctors Permitted</label>
          <input type="number" class="form-control" id="edit-plan-doctors" placeholder="Leave empty for Unlimited" value="${p.maxDoctors || ''}" />
        </div>
        <div class="form-group">
          <label class="form-label">Max Clinical Departments</label>
          <input type="number" class="form-control" id="edit-plan-depts" placeholder="Leave empty for Unlimited" value="${p.maxDepts || ''}" />
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Included Features (One per line)</label>
        <textarea class="form-control" id="edit-plan-features" rows="5">${(p.features || []).join('\n')}</textarea>
        <div class="form-hint">Each line will appear as a checked feature item on tenant cards.</div>
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="window._closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="savePlanChanges('${p.id}')">
        <i data-lucide="check"></i> Save Tier Changes
      </button>
    `
  });

  refreshIcons();
};

window.savePlanChanges = (planId) => {
  const name = document.getElementById('edit-plan-name')?.value;
  const price = parseInt(document.getElementById('edit-plan-price')?.value) || 9999;
  const maxDoctors = parseInt(document.getElementById('edit-plan-doctors')?.value) || null;
  const maxDepts = parseInt(document.getElementById('edit-plan-depts')?.value) || null;
  const rawFeatures = document.getElementById('edit-plan-features')?.value || '';
  const features = rawFeatures.split('\n').map(f => f.trim()).filter(f => f.length > 0);

  updateSubscriptionPlan(planId, {
    name,
    price,
    maxDoctors,
    maxDepts,
    features
  });

  closeModal();
  showToast({ title: 'Plan Updated', message: `${name} tier configuration saved successfully.`, type: 'success' });
  renderSABilling();
};

// ── Create New Plan Modal ──
window.openCreatePlanModal = () => {
  openModal({
    title: 'Create New SaaS Subscription Tier',
    size: 'md',
    body: `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Tier Name <span class="required">*</span></label>
          <input type="text" class="form-control" id="new-p-name" placeholder="e.g. Healthcare Network Plus" />
        </div>
        <div class="form-group">
          <label class="form-label">Monthly Price (INR ₹) <span class="required">*</span></label>
          <input type="number" class="form-control" id="new-p-price" placeholder="34999" />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Max Doctors Limit</label>
          <input type="number" class="form-control" id="new-p-doc" placeholder="e.g. 50" />
        </div>
        <div class="form-group">
          <label class="form-label">Max Departments Limit</label>
          <input type="number" class="form-control" id="new-p-dep" placeholder="e.g. 15" />
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Features Included (One line per feature)</label>
        <textarea class="form-control" id="new-p-feat" rows="4" placeholder="WhatsApp Patient Bot&#10;EMR & Prescription Notes&#10;Ward & Bed Management&#10;Dedicated PostgreSQL DB&#10;24x7 Phone SLA"></textarea>
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="window._closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="submitCreatePlan()">Create Tier</button>
    `
  });
};

window.submitCreatePlan = () => {
  const name = document.getElementById('new-p-name')?.value;
  const price = parseInt(document.getElementById('new-p-price')?.value) || 19999;
  const doc = parseInt(document.getElementById('new-p-doc')?.value) || null;
  const dep = parseInt(document.getElementById('new-p-dep')?.value) || null;
  const rawFeat = document.getElementById('new-p-feat')?.value || '';
  const features = rawFeat.split('\n').map(f => f.trim()).filter(f => f.length > 0);

  if (!name) {
    showToast({ title: 'Name Required', message: 'Please provide a tier name.', type: 'warning' });
    return;
  }

  createSubscriptionPlan({
    name,
    price,
    maxDoctors: doc,
    maxDepts: dep,
    features: features.length ? features : ['WhatsApp Bot', 'EMR Records', 'Isolated DB']
  });

  closeModal();
  showToast({ title: 'New Tier Created', message: `${name} tier is now available for tenant assignment.`, type: 'success' });
  renderSABilling();
};

// ── View Official Tax Invoice Modal ──
window.viewOfficialInvoiceModal = (invoiceId) => {
  const invoices = get('platformInvoices') || [];
  const inv = invoices.find(i => i.id === invoiceId);
  if (!inv) return;

  const hospitals = get('hospitals') || [];
  const h = hospitals.find(hosp => hosp.id === inv.hospitalId);

  const subtotal = Math.round(inv.amount / 1.18);
  const gst = inv.amount - subtotal;
  const isPaid = inv.status === 'paid';

  openModal({
    title: `Tax Invoice ${inv.id.toUpperCase()} — ${inv.hospitalName}`,
    size: 'lg',
    body: `
      <div style="background:white;border:1.5px solid var(--color-border);border-radius:12px;padding:28px;box-shadow:var(--shadow-sm)" id="print-tax-invoice">
        <!-- Invoice Header -->
        <div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:20px;border-bottom:2px solid var(--color-border);margin-bottom:20px">
          <div>
            <div style="font-size:24px;font-weight:800;color:var(--color-primary)">MediCore Technologies Pvt. Ltd.</div>
            <div style="font-size:var(--font-size-xs);color:var(--color-text-muted);margin-top:2px">
              Platform Headquarters: Tech Park, Bandra-Kurla Complex, Mumbai, MH 400051<br/>
              GSTIN: <strong>27AABCM8842P1ZV</strong> · PAN: AABCM8842P · support@medicore.io
            </div>
          </div>
          <div style="text-align:right">
            <div style="font-size:22px;font-weight:800;font-family:monospace;color:var(--color-text)">${inv.id.toUpperCase()}</div>
            <span class="badge badge-${isPaid ? 'success' : inv.status === 'overdue' ? 'danger' : 'warning'}" style="font-size:14px;padding:4px 12px;margin-top:4px">
              ${inv.status.toUpperCase()}
            </span>
          </div>
        </div>

        <!-- Billed To & Dates Grid -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px;font-size:var(--font-size-sm)">
          <div style="background:#F8FAFC;padding:14px;border-radius:10px;border:1px solid var(--color-border)">
            <span style="font-size:11px;font-weight:700;color:var(--color-text-light);text-transform:uppercase">BILLED TO (TENANT)</span>
            <div style="font-weight:800;font-size:var(--font-size-base);color:var(--color-text);margin-top:2px">${inv.hospitalName}</div>
            <div style="color:var(--color-text-muted);font-size:12px">${h?.address || 'Hospital Address, City, State'}</div>
            <div style="color:var(--color-text-muted);font-size:12px">Attn: ${h?.adminName || 'Hospital Administrator'} (${h?.adminEmail || inv.hospitalId})</div>
          </div>

          <div style="background:#F8FAFC;padding:14px;border-radius:10px;border:1px solid var(--color-border)">
            <div class="info-list" style="font-size:12px">
              <div class="info-row" style="padding:3px 0"><span class="info-label">Invoice Date</span><span class="info-value font-semibold">${inv.date}</span></div>
              <div class="info-row" style="padding:3px 0"><span class="info-label">Payment Due Date</span><span class="info-value font-semibold" style="color:${inv.status === 'overdue' ? 'var(--color-danger)' : 'inherit'}">${inv.dueDate}</span></div>
              <div class="info-row" style="padding:3px 0"><span class="info-label">Billing Cycle</span><span class="info-value">Monthly Recurring SaaS</span></div>
              <div class="info-row" style="padding:3px 0"><span class="info-label">Database Schema</span><span class="info-value font-mono">${h?.database?.dbName || 'Isolated Partition'}</span></div>
            </div>
          </div>
        </div>

        <!-- Itemized Line Items -->
        <table class="data-table" style="margin-bottom:20px">
          <thead>
            <tr>
              <th>Description / SaaS Service</th>
              <th>HSN/SAC</th>
              <th>Qty</th>
              <th>Unit Rate</th>
              <th style="text-align:right">Total (INR)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div style="font-weight:700">MediCore HMS ${inv.plan} Subscription</div>
                <div style="font-size:11px;color:var(--color-text-muted)">Cloud software license, WhatsApp patient bot, EMR module & bed grid</div>
              </td>
              <td style="font-family:monospace;font-size:12px">998313</td>
              <td>1 mo</td>
              <td>₹${(subtotal * 0.85).toFixed(0)}</td>
              <td style="text-align:right;font-weight:600">₹${(subtotal * 0.85).toFixed(0)}</td>
            </tr>
            <tr>
              <td>
                <div style="font-weight:700">Dedicated Tenant PostgreSQL Partition & Storage</div>
                <div style="font-size:11px;color:var(--color-text-muted)">Isolated schema partition with automated daily cron backup vault</div>
              </td>
              <td style="font-family:monospace;font-size:12px">998315</td>
              <td>1 partition</td>
              <td>₹${(subtotal * 0.15).toFixed(0)}</td>
              <td style="text-align:right;font-weight:600">₹${(subtotal * 0.15).toFixed(0)}</td>
            </tr>
          </tbody>
        </table>

        <!-- Totals & Taxes Breakdown -->
        <div style="display:flex;justify-content:flex-end">
          <div style="width:280px;background:#F8FAFC;border:1px solid var(--color-border);border-radius:10px;padding:14px">
            <div class="info-row" style="padding:4px 0"><span class="info-label">Subtotal</span><span class="info-value">₹${subtotal.toLocaleString()}</span></div>
            <div class="info-row" style="padding:4px 0"><span class="info-label">CGST (9%)</span><span class="info-value">₹${(gst / 2).toFixed(0)}</span></div>
            <div class="info-row" style="padding:4px 0"><span class="info-label">SGST (9%)</span><span class="info-value">₹${(gst / 2).toFixed(0)}</span></div>
            <div class="info-row" style="padding:8px 0;border-top:2px solid var(--color-border);margin-top:4px">
              <span style="font-weight:800;font-size:var(--font-size-base)">Total Payable</span>
              <span style="font-weight:800;font-size:var(--font-size-lg);color:var(--color-primary)">₹${inv.amount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div style="margin-top:20px;border-top:1px dashed var(--color-border);padding-top:12px;display:flex;justify-content:space-between;align-items:center;font-size:11px;color:var(--color-text-light)">
          <span>This is a computer-generated tax invoice. No physical signature required.</span>
          <span>Authorized by MediCore Super Admin Systems</span>
        </div>
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="window._closeModal()">Close</button>
      <button class="btn btn-primary" onclick="printOrDownloadInvoice('${inv.id}')">
        <i data-lucide="printer"></i> Print / Download Tax Invoice
      </button>
    `
  });

  refreshIcons();
};

window.printOrDownloadInvoice = (invoiceId) => {
  const element = document.getElementById('print-tax-invoice');
  if (!element) {
    window.print();
    return;
  }

  showToast({ title: 'Preparing Clean PDF', message: `Tax invoice ${invoiceId.toUpperCase()} prepared.`, type: 'info' });

  let iframe = document.getElementById('billing-isolated-print-frame');
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = 'billing-isolated-print-frame';
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
        <title>Tax Invoice ${invoiceId.toUpperCase()} - MediCore HMS</title>
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

window.markInvoicePaid = (id) => {
  const invoices = get('platformInvoices') || [];
  const inv = invoices.find(i => i.id === id);
  if (inv) {
    inv.status = 'paid';
    showToast({ title: 'Invoice Settled', message: `${inv.id.toUpperCase()} marked as PAID.`, type: 'success' });
    renderSABilling();
  }
};

window.sendPaymentReminder = (hospitalId, invoiceId) => {
  const hospitals = get('hospitals') || [];
  const h = hospitals.find(h => h.id === hospitalId);
  showToast({
    title: '📱 Reminder Dispatched',
    message: `WhatsApp payment reminder sent to ${h?.adminName} (${h?.adminEmail}) for invoice ${invoiceId.toUpperCase()}`,
    type: 'wa'
  });
};

window.toggleTenantSuspension = (hospitalId, status) => {
  const hospitals = get('hospitals') || [];
  const h = hospitals.find(h => h.id === hospitalId);
  if (!h) return;

  const newStatus = status || (h.status === 'active' ? 'suspended' : 'active');
  updateHospitalStatus(hospitalId, newStatus);
  showToast({
    title: `Tenant ${newStatus.toUpperCase()}`,
    message: `${h.name} workspace access has been ${newStatus}.`,
    type: newStatus === 'active' ? 'success' : 'danger'
  });
  renderSABilling();
};

window.openCreateInvoiceModal = () => {
  const hospitals = get('hospitals') || [];
  openModal({
    title: 'Generate Custom Platform Invoice',
    size: 'md',
    body: `
      <div class="form-group">
        <label class="form-label">Hospital Tenant <span class="required">*</span></label>
        <select class="form-control" id="new-inv-hosp" onchange="autoFillPlanPrice(this.value)">
          ${hospitals.map(h => `<option value="${h.id}">${h.name} (${h.plan} Plan)</option>`).join('')}
        </select>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Billing Amount (INR ₹) <span class="required">*</span></label>
          <input type="number" class="form-control" id="new-inv-amount" value="${hospitals[0]?.planPrice || 49999}" />
        </div>
        <div class="form-group">
          <label class="form-label">Plan Tier Tag</label>
          <input type="text" class="form-control" id="new-inv-plan" value="${hospitals[0]?.plan || 'Enterprise'}" />
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Billing Notes / Scope</label>
        <input type="text" class="form-control" placeholder="e.g. Monthly Subscription + Custom Storage Add-on" />
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="window._closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="submitCreateInvoice()">Issue Official Invoice</button>
    `
  });
};

window.autoFillPlanPrice = (hospId) => {
  const hospitals = get('hospitals') || [];
  const h = hospitals.find(h => h.id === hospId);
  if (h) {
    const amt = document.getElementById('new-inv-amount');
    const pl = document.getElementById('new-inv-plan');
    if (amt) amt.value = h.planPrice || 49999;
    if (pl) pl.value = h.plan || 'Enterprise';
  }
};

window.submitCreateInvoice = () => {
  const hospId = document.getElementById('new-inv-hosp')?.value;
  const amount = parseInt(document.getElementById('new-inv-amount')?.value) || 49999;
  const plan = document.getElementById('new-inv-plan')?.value || 'Enterprise';
  const hospitals = get('hospitals') || [];
  const h = hospitals.find(h => h.id === hospId);

  addPlatformInvoice({
    hospitalId: hospId,
    hospitalName: h?.name || 'Hospital',
    plan,
    amount
  });

  closeModal();
  showToast({ title: 'Invoice Issued', message: `Invoice created for ${h?.name}.`, type: 'success' });
  activeBillingTab = 'invoices';
  renderSABilling();
};

window.exportPricingMatrixCSV = () => {
  showToast({ title: 'Exporting Tier Matrix', message: 'SaaS Pricing matrix CSV exported.', type: 'info' });
};

window.exportInvoicesCSV = () => {
  showToast({ title: 'Exporting Invoices', message: 'Full invoice ledger CSV exported.', type: 'info' });
};
