// ============================================================
// main.js — App Entry Point & Route Directory
// ============================================================

import { route, onNotFound, init as initRouter } from './router.js';
import { renderSidebar } from './components/sidebar.js';
import { renderTopbar, renderRoleSwitcher } from './components/topbar.js';
import { get, set } from './store.js';
import { showToast, startToastPolling } from './components/toast.js';
import { openModal, closeModal, openDrawer, closeDrawer } from './components/modal.js';
import { renderBarChart, renderDonutChart, renderGroupedBarChart, renderLineChart } from './components/chart.js';
import { refreshIcons } from './components/icons.js';

// ── Expose globals ───────────────────────────────────────────
window._modal = { openModal, closeModal, openDrawer, closeDrawer };
window._closeModal = closeModal;
window._closeDrawer = closeDrawer;
window._chartsModule = { renderBarChart, renderDonutChart, renderGroupedBarChart, renderLineChart };
window.refreshIcons = refreshIcons;

// ── Lazy view loader with automatic icon refresh ─────────────
async function loadView(importer) {
  const mod = await importer();
  setTimeout(() => refreshIcons(document.getElementById('content') || document.body), 10);
  return mod;
}

// ── Route Definitions ─────────────────────────────────────────

// Login Portal
route('/login', () => loadView(() => import('./views/auth/login.js')).then(m => m.renderLogin()));

// Default redirect
route('/', () => {
  const isAuth = get('isAuthenticated');
  if (!isAuth) {
    window.location.hash = '/login';
    return;
  }
  const role = get('currentRole') || 'superadmin';
  const homeRoutes = {
    superadmin: '/sa/dashboard',
    hospitaladmin: '/ha/dashboard',
    doctor: '/dr/dashboard',
    receptionist: '/rc/queue',
  };
  window.location.hash = homeRoutes[role] || '/sa/dashboard';
});

// ══════════════════════════════════════════════════════════════
// 10 SUPER ADMIN CORE MODULES (Phase 1)
// ══════════════════════════════════════════════════════════════

// Module 1: Dashboard (Command Center)
route('/sa/dashboard', () => loadView(() => import('./views/superadmin/dashboard.js')).then(m => m.renderSADashboard()));

// Client Demo & Dummy Accounts Showcase Module
route('/sa/demo-sandbox', () => loadView(() => import('./views/superadmin/demoSandbox.js')).then(m => m.renderSADemoSandbox()));

// Module 2: Hospital Onboarding (Create Hospital)
route('/sa/hospitals/new', () => loadView(() => import('./views/superadmin/createHospital.js')).then(m => m.renderCreateHospital()));

// Module 3: Hospital Directory & Live Monitoring
route('/sa/hospitals', () => loadView(() => import('./views/superadmin/hospitals.js')).then(m => m.renderHospitalsList()));
route('/sa/hospitals/:id', (ctx) => loadView(() => import('./views/superadmin/hospitalDetail.js')).then(m => m.renderHospitalDetail(ctx)));

// Module 4: Subscription Plans
route('/sa/billing', () => loadView(() => import('./views/superadmin/billing.js')).then(m => m.renderSABilling('plans')));

// Dedicated Invoices Module with Preview
route('/sa/invoices', () => loadView(() => import('./views/superadmin/invoices.js')).then(m => m.renderSAInvoices()));
route('/sa/invoices/:id', (ctx) => loadView(() => import('./views/superadmin/invoices.js')).then(m => m.renderSAInvoices(ctx.params.id)));

// Module 5: Platform Analytics & Deep Reports
route('/sa/analytics', () => loadView(() => import('./views/superadmin/analytics.js')).then(m => m.renderSAAnalytics()));

// Module 6: WhatsApp / Communication Hub (Flagship)
route('/sa/whatsapp-hub', () => loadView(() => import('./views/superadmin/whatsappHub.js')).then(m => m.renderSAWhatsAppHub()));

// Multi-Tenant Databases & Backups Hub
route('/sa/databases', () => loadView(() => import('./views/superadmin/databaseHub.js')).then(m => m.renderSADatabaseHub()));

// Module 7: User & Role Management (Platform Team)
route('/sa/platform-users', () => loadView(() => import('./views/superadmin/platformUsers.js')).then(m => m.renderSAPlatformUsers()));

// Module 8: Notifications & Actionable Alerts
route('/sa/alerts', () => loadView(() => import('./views/superadmin/alerts.js')).then(m => m.renderSAAlerts()));

// Module 9: Support / Ticketing Helpdesk
route('/sa/support', () => loadView(() => import('./views/superadmin/support.js')).then(m => m.renderSASupport()));

// Module 10: System Settings & Healthcare Audit Logs
route('/sa/settings', () => loadView(() => import('./views/superadmin/settingsAudit.js')).then(m => m.renderSASettingsAudit()));

// Phase 2 Modules (Deferred & Preview)
route('/sa/staff-directory', () => loadView(() => import('./views/superadmin/phase2.js')).then(m => m.renderSAPhase2('staff')));
route('/sa/compliance', () => loadView(() => import('./views/superadmin/phase2.js')).then(m => m.renderSAPhase2('compliance')));
route('/sa/integrations', () => loadView(() => import('./views/superadmin/phase2.js')).then(m => m.renderSAPhase2('integrations')));

// ══════════════════════════════════════════════════════════════
// 14 HOSPITAL ADMIN MODULES (Phase 1 & Phase 2)
// ══════════════════════════════════════════════════════════════

// Module 1: Dashboard
route('/ha/dashboard', () => loadView(() => import('./views/hospitaladmin/dashboard.js')).then(m => m.renderHADashboard()));

// Module 2: Staff Management
route('/ha/staff', () => loadView(() => import('./views/hospitaladmin/staff/staffList.js')).then(m => m.renderStaffList()));
route('/ha/staff/:id', (ctx) => loadView(() => import('./views/hospitaladmin/staff/staffProfile.js')).then(m => m.renderStaffProfile(ctx)));

// Module 3: Patient Management (EMR-lite)
route('/ha/patients', () => loadView(() => import('./views/hospitaladmin/patients/patientList.js')).then(m => m.renderPatientList()));
route('/ha/patients/:id', (ctx) => loadView(() => import('./views/hospitaladmin/patients/patientProfile.js')).then(m => m.renderPatientProfile(ctx)));

// Module 4: Doctor Assignment
route('/ha/doctor-assignment', () => loadView(() => import('./views/hospitaladmin/doctorAssignment.js')).then(m => m.renderDoctorAssignment()));
route('/ha/doctor-assignment/:id', (ctx) => loadView(() => import('./views/hospitaladmin/doctorAssignment.js')).then(m => m.renderDoctorAssignment(ctx.params.id)));

// Module 5: Appointments & Scheduling
route('/ha/appointments', () => loadView(() => import('./views/hospitaladmin/appointments/appointmentCalendar.js')).then(m => m.renderAppointmentCalendar()));
route('/ha/appointments/list', () => loadView(() => import('./views/hospitaladmin/appointments/appointmentList.js')).then(m => m.renderAppointmentList()));

// Module 6: Departments Module
route('/ha/departments', () => loadView(() => import('./views/hospitaladmin/departments.js')).then(m => m.renderDepartments()));

// Module 7: Front Desk / Queue Management
route('/ha/queue', () => loadView(() => import('./views/hospitaladmin/queueManagement.js')).then(m => m.renderQueueManagement()));

// Module 8: Patient Billing & Invoicing
route('/ha/billing', () => loadView(() => import('./views/hospitaladmin/billing.js')).then(m => m.renderHospitalBilling()));

// Module 9: Reports & Operations Analytics
route('/ha/reports', () => loadView(() => import('./views/hospitaladmin/reports.js')).then(m => m.renderHospitalReports()));

// Module 10: Bed / Ward Management
route('/ha/beds', () => loadView(() => import('./views/hospitaladmin/bedManagement.js')).then(m => m.renderBedManagement()));

// Module 11: Pharmacy & Medication Inventory
route('/ha/pharmacy', () => loadView(() => import('./views/hospitaladmin/pharmacy.js')).then(m => m.renderHospitalPharmacy()));

// Module 12: Lab & Diagnostics Module
route('/ha/lab', () => loadView(() => import('./views/hospitaladmin/lab.js')).then(m => m.renderHospitalLab()));

// Module 13: Activity Feed & Real-Time Alerts
route('/ha/notifications', () => loadView(() => import('./views/hospitaladmin/notifications.js')).then(m => m.renderHospitalNotifications()));

// Module 14: Hospital-Level Settings & Branding
route('/ha/settings', () => loadView(() => import('./views/hospitaladmin/settings.js')).then(m => m.renderHospitalSettings()));

// ══════════════════════════════════════════════════════════════
// DOCTOR WORKSPACE ROUTES (Phase 1 & Phase 2)
// ══════════════════════════════════════════════════════════════

// Module 1: Dashboard
route('/dr/dashboard', () => loadView(() => import('./views/doctor/dashboard.js')).then(m => m.renderDoctorDashboard()));

// Module 2: My Patients
route('/dr/patients', () => loadView(() => import('./views/doctor/myPatients.js')).then(m => m.renderDoctorMyPatients()));

// Module 3: My Schedule & Two-Way Sync
route('/dr/schedule', () => loadView(() => import('./views/doctor/mySchedule.js')).then(m => m.renderDoctorMySchedule()));

// Module 4: Consultation / Patient Visit View
route('/dr/consultation', (ctx) => loadView(() => import('./views/doctor/consultation.js')).then(m => m.renderDoctorConsultation(ctx)));
route('/dr/consultation/:id', (ctx) => loadView(() => import('./views/doctor/consultation.js')).then(m => m.renderDoctorConsultation(ctx)));

// Module 6: Prescription Templates
route('/dr/templates', () => loadView(() => import('./views/doctor/prescriptionTemplates.js')).then(m => m.renderPrescriptionTemplates()));

// Module 7: Leave / Availability Requests
route('/dr/leave-requests', () => loadView(() => import('./views/doctor/leaveRequests.js')).then(m => m.renderDoctorLeaveRequests()));

// Module 8: Doctor-to-Doctor Referral
route('/dr/referrals', () => loadView(() => import('./views/doctor/referrals.js')).then(m => m.renderDoctorReferrals()));

// Module 9: Performance / Self-View Analytics
route('/dr/analytics', () => loadView(() => import('./views/doctor/analytics.js')).then(m => m.renderDoctorAnalytics()));

// ══════════════════════════════════════════════════════════════
// RECEPTIONIST FRONT DESK ROUTES (Phase 1 & Phase 2)
// ══════════════════════════════════════════════════════════════

// Module 1: Today's Live Queue
route('/rc/queue', () => loadView(() => import('./views/receptionist/queue.js')).then(m => m.renderQueue()));

// Module 2: Patient Check-In & Arrival
route('/rc/checkin', () => loadView(() => import('./views/receptionist/checkin.js')).then(m => m.renderReceptionistCheckin()));

// Module 3: Quick Book & Walk-in Registration
route('/rc/quick-book', (ctx) => loadView(() => import('./views/receptionist/quickBook.js')).then(m => m.renderQuickBook(ctx)));

// Module 4: Appointments Ledger (View + Light Edit)
route('/rc/appointments', () => loadView(() => import('./views/receptionist/appointments.js')).then(m => m.renderReceptionistAppointments()));

// Module 5: Patient Lookup & Contact Editor
route('/rc/patients', () => loadView(() => import('./views/receptionist/patientLookup.js')).then(m => m.renderReceptionistPatientLookup()));

// Module 6: WhatsApp Bookings Inbox
route('/rc/whatsapp-inbox', () => loadView(() => import('./views/receptionist/whatsappInbox.js')).then(m => m.renderReceptionistWhatsAppInbox()));

// Module 7: Billing Handoff & Quick Checkout Receipt
route('/rc/billing-handoff', (ctx) => loadView(() => import('./views/receptionist/billingHandoff.js')).then(m => m.renderBillingHandoff(ctx)));

// Module 8: Daily Shift Report & Reconciliation
route('/rc/daily-reports', () => loadView(() => import('./views/receptionist/dailyReports.js')).then(m => m.renderDailyReports()));

// Module 9: Operational Alerts & Delay Manager
route('/rc/alerts', () => loadView(() => import('./views/receptionist/frontdeskAlerts.js')).then(m => m.renderFrontDeskAlerts()));

// ══════════════════════════════════════════════════════════════
// WHATSAPP PATIENT QR & CHATBOT SIMULATION
// ══════════════════════════════════════════════════════════════
route('/whatsapp', () => loadView(() => import('./views/whatsapp/demo.js')).then(m => m.renderWhatsAppDemo()));

// ── 404 Handler ──
onNotFound(({ path }) => {
  renderSidebar();
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="empty-state" style="padding:100px 20px">
      <i data-lucide="compass-off" class="es-icon" style="width:64px;height:64px"></i>
      <div class="es-title">404 — Page Not Found</div>
      <div class="es-desc">The requested route <code>${path}</code> could not be found.</div>
      <button class="btn btn-primary" style="margin-top:16px" onclick="history.back()">← Go Back</button>
    </div>
  `;
  refreshIcons(content);
});

// ── App Init ─────────────────────────────────────────────────
function initApp() {
  renderRoleSwitcher();
  startToastPolling();
  initRouter();
  refreshIcons();

  console.log('%c🏥 MediCore Super Admin & Enterprise HMS', 'font-size:18px;font-weight:bold;color:#0B5FA5');
  console.log('%c10 Core Super Admin Launch Modules Active', 'color:#0F7A6C');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
