// ============================================================
// store.js — Reactive In-Memory State Store
// ============================================================

import * as mockData from './data/mockData.js';

// Deep clone to allow mutations without touching the original
const clone = (obj) => JSON.parse(JSON.stringify(obj));

const state = {
  // Authentication & session context
  isAuthenticated: false,
  clientDemoMode: false,          // When true, exposes demo role switcher for hospitaladmin, doctor & receptionist only

  // Current role / hospital context
  currentRole: 'superadmin',      // superadmin | hospitaladmin | doctor | receptionist
  currentHospitalId: 'h1',
  currentUserId: 's1',            // maps to a staff member (for doctor/receptionist views)

  // Master DB & Platform Settings
  superAdminMasterDb: clone(mockData.superAdminMasterDb),

  // Data (cloned so we can mutate for demo interactions)
  hospitals: clone(mockData.hospitals),
  departments: clone(mockData.departments),
  staff: clone(mockData.staff),
  patients: clone(mockData.patients),
  appointments: clone(mockData.appointments),
  beds: clone(mockData.beds),
  pharmacyMedicines: clone(mockData.pharmacyMedicines || []),
  labOrders: clone(mockData.labOrders || []),
  prescriptionTemplates: clone(mockData.prescriptionTemplates || []),
  doctorLeaves: clone(mockData.doctorLeaves || []),
  doctorReferrals: clone(mockData.doctorReferrals || []),
  invoices: clone(mockData.invoices),
  platformInvoices: clone(mockData.platformInvoices),
  platformAnalytics: clone(mockData.platformAnalytics),
  activityFeed: clone(mockData.activityFeed),
  subscriptionPlans: clone(mockData.subscriptionPlans),
  whatsappConfig: clone(mockData.whatsappConfig),
  platformUsers: clone(mockData.platformUsers),
  supportTickets: clone(mockData.supportTickets),
  platformAlerts: clone(mockData.platformAlerts),
  auditLogs: clone(mockData.auditLogs),

  // UI state
  sidebarCollapsed: false,
  currentPath: null,
};

// ── Subscribers ─────────────────────────────────────────────
const subscribers = new Set();

export function subscribe(fn) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

function notify() {
  subscribers.forEach(fn => fn(state));
}

// ── Getters ─────────────────────────────────────────────────
export function getState() { return state; }

export function get(key) { return state[key]; }

// ── Setters ─────────────────────────────────────────────────
export function set(key, value) {
  state[key] = value;
  notify();
}

export function setRole(role) {
  state.currentRole = role;
  // Map role to a representative user
  if (role === 'doctor')       state.currentUserId = 's2'; // Dr. Meera Joshi
  if (role === 'receptionist') state.currentUserId = 's10'; // Rekha Sharma
  if (role === 'hospitaladmin') state.currentUserId = null;
  if (role === 'superadmin')   state.currentUserId = null;
  notify();
}

// ── Data Helpers ─────────────────────────────────────────────

export function getHospital(id) {
  return state.hospitals.find(h => h.id === (id || state.currentHospitalId));
}

export function getHospitalStaff(hospitalId) {
  return state.staff.filter(s => s.hospitalId === (hospitalId || state.currentHospitalId));
}

export function getHospitalPatients(hospitalId) {
  return state.patients.filter(p => p.hospitalId === (hospitalId || state.currentHospitalId));
}

export function getHospitalAppointments(hospitalId) {
  return state.appointments.filter(a => a.hospitalId === (hospitalId || state.currentHospitalId));
}

export function getHospitalDepartments(hospitalId) {
  return state.departments.filter(d => d.hospitalId === (hospitalId || state.currentHospitalId));
}

export function getHospitalBeds(hospitalId) {
  return state.beds.filter(b => b.hospitalId === (hospitalId || state.currentHospitalId));
}

export function getHospitalInvoices(hospitalId) {
  return state.invoices.filter(i => i.hospitalId === (hospitalId || state.currentHospitalId));
}

export function getStaffById(id) {
  return state.staff.find(s => s.id === id);
}

export function getPatientById(id) {
  return state.patients.find(p => p.id === id);
}

export function getAppointmentById(id) {
  return state.appointments.find(a => a.id === id);
}

export function getDoctors(hospitalId) {
  return state.staff.filter(s => s.hospitalId === (hospitalId || state.currentHospitalId) && s.role === 'Doctor');
}

export function getTodayAppointments(hospitalId) {
  const today = new Date().toISOString().split('T')[0];
  return state.appointments.filter(a =>
    a.hospitalId === (hospitalId || state.currentHospitalId) && a.date === today
  );
}

export function getDoctorAppointments(doctorId) {
  return state.appointments.filter(a => a.doctorId === doctorId);
}

export function getDoctorPatients(doctorId) {
  return state.patients.filter(p => p.assignedDoctor === doctorId);
}

export function getTodayQueue(hospitalId) {
  const today = new Date().toISOString().split('T')[0];
  return state.appointments
    .filter(a => a.hospitalId === (hospitalId || state.currentHospitalId) && a.date === today)
    .sort((a, b) => a.time.localeCompare(b.time));
}

export function getCurrentDoctor() {
  return state.staff.find(s => s.id === state.currentUserId);
}

// ── Mutations ────────────────────────────────────────────────

export function addAppointment(appt) {
  const id = 'a' + Date.now();
  const token = appt.department?.charAt(0) + '-' + String(state.appointments.length + 1).padStart(3, '0');
  const newAppt = { id, token, ...appt };
  state.appointments.push(newAppt);
  // Also add to activity feed
  state.activityFeed.unshift({
    id: 'act' + Date.now(),
    type: appt.source === 'whatsapp' ? 'whatsapp' : 'appointment',
    icon: appt.source === 'whatsapp' ? 'message-circle' : 'calendar',
    color: appt.source === 'whatsapp' ? 'green' : 'blue',
    text: `New appointment booked${appt.source === 'whatsapp' ? ' via WhatsApp' : ''} — ${getPatientById(appt.patientId)?.name || 'Patient'} with ${getStaffById(appt.doctorId)?.name || 'Doctor'}`,
    time: 'just now'
  });
  notify();
  return newAppt;
}

export function updateAppointmentStatus(id, status) {
  const appt = state.appointments.find(a => a.id === id);
  if (appt) {
    appt.status = status;
    notify();
  }
}

export function addPatient(patient) {
  const id = 'p' + Date.now();
  const idx = state.patients.filter(p => p.hospitalId === state.currentHospitalId).length + 1;
  const patientId = 'MH-APL-' + String(idx + 10).padStart(3, '0');
  state.patients.push({ id, patientId, hospitalId: state.currentHospitalId, ...patient });
  notify();
  return id;
}

export function addStaff(member) {
  const id = 's' + Date.now();
  state.staff.push({ id, hospitalId: state.currentHospitalId, ...member });
  notify();
  return id;
}

export function addHospital(hospital) {
  const id = 'h' + Date.now();
  const slug = (hospital.name || 'hosp').toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 16);
  const randKey = Math.random().toString(36).substring(2, 8);
  const randPass = 'sec_' + Math.random().toString(36).substring(2, 10) + '#' + Math.floor(Math.random() * 89 + 10) + '$' + Math.random().toString(36).substring(2, 6);
  const dbName = `medicore_tenant_${slug}_${randKey}`;
  const dbUser = `usr_${slug}_admin`;
  const dbHost = 'db-node-01.ap-south-1.internal.medicore.io';
  const dbPort = 5432;
  const connectionUri = `postgresql://${dbUser}:${randPass}@${dbHost}:${dbPort}/${dbName}?sslmode=require`;

  const newHospital = {
    id,
    status: 'active',
    onboardedDate: new Date().toISOString().split('T')[0],
    database: {
      dbId: `db_hosp_${slug}_${randKey}`,
      dbName,
      dbHost,
      dbPort,
      dbUser,
      dbPassword: randPass,
      dbType: 'PostgreSQL 16.2 (Isolated Schema Partition)',
      dbSize: '45 MB (Initialized)',
      status: 'healthy',
      sslMode: 'require (TLS 1.3)',
      connectionUri,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
      lastPingLatency: '6ms'
    },
    backupConfig: {
      enabled: true,
      cronSchedule: '0 2 * * *',
      cronLabel: 'Daily at 02:00 AM UTC',
      frequency: 'daily',
      retentionDays: 90,
      storageTarget: `AWS S3 (s3://medicore-backups-mumbai/${slug}-${id}/)`,
      lastBackupTime: 'Just now (Init Snapshot)',
      lastBackupSize: '42 MB',
      lastBackupStatus: 'success',
      history: [
        {
          id: `bk-${Math.floor(Math.random() * 8999 + 1000)}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          size: '42 MB',
          type: 'Initial Provisioning Dump',
          status: 'success',
          checksum: `sha256:${Math.random().toString(36).substring(2, 12)}...${Math.random().toString(36).substring(2, 5)}`
        }
      ]
    },
    ...hospital
  };

  state.hospitals.push(newHospital);
  state.platformAnalytics.totalHospitals++;
  state.platformAnalytics.activeHospitals++;

  addAuditLog({
    user: 'Aakash Verma (Super Admin)',
    action: 'Isolated Tenant Database Provisioned',
    details: `Created isolated database ${dbName} for ${hospital.name} with automated daily backup cron (0 2 * * *)`,
    tenant: hospital.name,
    severity: 'info'
  });

  notify();
  return id;
}

export function triggerManualBackup(hospitalId) {
  const h = state.hospitals.find(hosp => hosp.id === hospitalId);
  if (!h) return null;

  if (!h.backupConfig) {
    h.backupConfig = { enabled: true, cronSchedule: '0 2 * * *', frequency: 'daily', retentionDays: 90, history: [] };
  }

  const now = new Date();
  const timeStr = now.toISOString().replace('T', ' ').slice(0, 16);
  const sizeNum = Math.floor(Math.random() * 40 + 120);
  const sizeStr = `${sizeNum} MB`;
  const backupId = `bk-${Math.floor(Math.random() * 8999 + 1000)}`;

  const newSnapshot = {
    id: backupId,
    timestamp: timeStr,
    size: sizeStr,
    type: 'Manual Export',
    status: 'success',
    checksum: `sha256:${Math.random().toString(36).substring(2, 12)}...${Math.random().toString(36).substring(2, 5)}`
  };

  h.backupConfig.history.unshift(newSnapshot);
  h.backupConfig.lastBackupTime = 'Just now';
  h.backupConfig.lastBackupSize = sizeStr;
  h.backupConfig.lastBackupStatus = 'success';

  addAuditLog({
    user: 'Aakash Verma (Super Admin)',
    action: 'Manual Database Backup Created',
    details: `Generated snapshot ${backupId} (${sizeStr}) for isolated database ${h.database?.dbName || h.name}`,
    tenant: h.name,
    severity: 'info'
  });

  notify();

  // Trigger actual client-side file download of the SQL dump
  downloadDbBackupFile(h, backupId);

  return newSnapshot;
}

export function updateBackupSchedule(hospitalId, scheduleData) {
  const h = state.hospitals.find(hosp => hosp.id === hospitalId);
  if (!h) return;

  if (!h.backupConfig) {
    h.backupConfig = { history: [] };
  }

  const freqLabels = {
    '6h': 'Every 6 Hours (0 */6 * * *)',
    '12h': 'Every 12 Hours (0 */12 * * *)',
    'daily': 'Daily at 02:00 AM UTC (0 2 * * *)',
    'weekly': 'Weekly on Sunday (0 3 * * 0)'
  };

  const cronExpressions = {
    '6h': '0 */6 * * *',
    '12h': '0 */12 * * *',
    'daily': '0 2 * * *',
    'weekly': '0 3 * * 0'
  };

  h.backupConfig.enabled = scheduleData.enabled !== undefined ? scheduleData.enabled : h.backupConfig.enabled;
  h.backupConfig.frequency = scheduleData.frequency || h.backupConfig.frequency || 'daily';
  h.backupConfig.cronSchedule = cronExpressions[h.backupConfig.frequency] || scheduleData.cronSchedule || '0 2 * * *';
  h.backupConfig.cronLabel = freqLabels[h.backupConfig.frequency] || 'Custom Cron Interval';
  h.backupConfig.retentionDays = scheduleData.retentionDays || h.backupConfig.retentionDays || 90;

  addAuditLog({
    user: 'Aakash Verma (Super Admin)',
    action: 'Backup Cron Schedule Updated',
    details: `Updated automated backup schedule to ${h.backupConfig.cronLabel} (${h.backupConfig.retentionDays} days retention)`,
    tenant: h.name,
    severity: 'info'
  });

  notify();
}

export function rotateDbPassword(hospitalId) {
  const h = state.hospitals.find(hosp => hosp.id === hospitalId);
  if (!h || !h.database) return null;

  const newPass = 'sec_' + Math.random().toString(36).substring(2, 10) + '#' + Math.floor(Math.random() * 89 + 10) + '$' + Math.random().toString(36).substring(2, 6);
  h.database.dbPassword = newPass;
  h.database.connectionUri = `postgresql://${h.database.dbUser}:${newPass}@${h.database.dbHost}:${h.database.dbPort}/${h.database.dbName}?sslmode=require`;

  addAuditLog({
    user: 'Aakash Verma (Super Admin)',
    action: 'Database Password Rotated',
    details: `Rotated credentials for isolated tenant database ${h.database.dbName}`,
    tenant: h.name,
    severity: 'warning'
  });

  notify();
  return newPass;
}

export function downloadDbBackupFile(hospital, backupId) {
  const backup = hospital.backupConfig?.history?.find(b => b.id === backupId) || {
    id: backupId,
    timestamp: new Date().toISOString(),
    size: '150 MB'
  };

  const backupData = {
    header: {
      platform: 'MediCore Enterprise HMS',
      engine: 'PostgreSQL 16.2 pg_dump dump utility',
      backupId: backup.id,
      timestamp: backup.timestamp,
      checksum: backup.checksum || 'sha256:88a7c29e4d1b82f',
      encryption: 'AES-256-GCM'
    },
    tenant: {
      id: hospital.id,
      name: hospital.name,
      databaseId: hospital.database?.dbId,
      databaseName: hospital.database?.dbName,
      clusterHost: hospital.database?.dbHost,
      schemaVersion: 'v2.4-multi-tenant-partition'
    },
    tables: {
      staff: state.staff.filter(s => s.hospitalId === hospital.id),
      patients: state.patients.filter(p => p.hospitalId === hospital.id),
      appointments: state.appointments.filter(a => a.hospitalId === hospital.id),
      departments: state.departments.filter(d => d.hospitalId === hospital.id),
      beds: state.beds.filter(b => b.hospitalId === hospital.id),
      invoices: state.invoices.filter(i => i.hospitalId === hospital.id)
    }
  };

  const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const filename = `${hospital.database?.dbName || hospital.id}_backup_${backup.id}_${backup.timestamp.replace(/[: ]/g, '_')}.sql.json`;
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function updateHospitalStatus(id, status) {
  const h = state.hospitals.find(h => h.id === id);
  if (h) {
    h.status = status;
    addAuditLog({
      user: 'Aakash Verma (Super Admin)',
      action: 'Hospital Status Changed',
      details: `Status of ${h.name} changed to ${status}`,
      tenant: h.name,
      severity: status === 'suspended' ? 'warning' : 'info'
    });
    notify();
  }
}

export function addPlatformUser(user) {
  const id = 'pu' + Date.now();
  state.platformUsers.push({
    id,
    status: 'active',
    lastActive: 'Just now',
    avatarColor: '#0B5FA5',
    twoFactor: true,
    ...user
  });
  addAuditLog({
    user: 'Aakash Verma (Super Admin)',
    action: 'Platform User Invited',
    details: `Invited ${user.name} (${user.email}) as ${user.role}`,
    tenant: 'Platform Team',
    severity: 'info'
  });
  notify();
  return id;
}

export function updateTicketStatus(id, status) {
  const t = state.supportTickets.find(ticket => ticket.id === id);
  if (t) {
    t.status = status;
    t.updatedAt = 'Just now';
    notify();
  }
}

export function addTicketReply(id, reply) {
  const t = state.supportTickets.find(ticket => ticket.id === id);
  if (t) {
    t.messages.push({
      sender: reply.sender || 'Aakash Verma (Super Admin)',
      role: 'support',
      text: reply.text,
      time: 'Just now'
    });
    t.updatedAt = 'Just now';
    notify();
  }
}

export function acknowledgeAlert(id) {
  const a = state.platformAlerts.find(alt => alt.id === id);
  if (a) {
    a.acknowledged = true;
    notify();
  }
}

export function addAuditLog(log) {
  const id = 'aud-' + Date.now();
  const dateStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
  state.auditLogs.unshift({
    id,
    timestamp: dateStr,
    ipAddress: '103.21.14.92',
    ...log
  });
  notify();
}

export function updateWhatsAppConfig(newConfig) {
  state.whatsappConfig = { ...state.whatsappConfig, ...newConfig };
  addAuditLog({
    user: 'Aakash Verma (Super Admin)',
    action: 'WhatsApp Config Updated',
    details: 'Global WhatsApp bot templates & working hours updated',
    tenant: 'Global Platform',
    severity: 'info'
  });
  notify();
}

export function updateSubscriptionPlan(planId, updatedFields) {
  const plan = state.subscriptionPlans.find(p => p.id === planId);
  if (plan) {
    Object.assign(plan, updatedFields);

    // Update any hospital on this plan if price changed
    if (updatedFields.price !== undefined) {
      state.hospitals.forEach(h => {
        if (h.plan === plan.name) {
          h.planPrice = updatedFields.price;
        }
      });
    }

    addAuditLog({
      user: 'Aakash Verma (Super Admin)',
      action: 'SaaS Subscription Plan Updated',
      details: `Updated ${plan.name} plan (Price: ₹${plan.price}/mo, Features: ${plan.features?.length || 0})`,
      tenant: 'Platform Billing',
      severity: 'info'
    });
    notify();
  }
}

export function createSubscriptionPlan(newPlan) {
  const id = 'plan_' + (newPlan.name || 'tier').toLowerCase().replace(/[^a-z0-9]/g, '_');
  const planObj = {
    id,
    features: [],
    ...newPlan
  };
  state.subscriptionPlans.push(planObj);
  addAuditLog({
    user: 'Aakash Verma (Super Admin)',
    action: 'New SaaS Tier Created',
    details: `Created tier ${newPlan.name} at ₹${newPlan.price}/month`,
    tenant: 'Platform Billing',
    severity: 'info'
  });
  notify();
  return id;
}

export function addPlatformInvoice(inv) {
  const id = 'inv-' + Math.floor(Math.random() * 8999 + 1000);
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const due = new Date(now);
  due.setDate(due.getDate() + 15);
  const dueStr = due.toISOString().split('T')[0];

  const newInv = {
    id,
    status: 'pending',
    date: dateStr,
    dueDate: dueStr,
    ...inv
  };

  state.platformInvoices.unshift(newInv);
  addAuditLog({
    user: 'Aakash Verma (Super Admin)',
    action: 'Platform Invoice Issued',
    details: `Issued invoice ${id.toUpperCase()} (₹${inv.amount.toLocaleString()}) to ${inv.hospitalName}`,
    tenant: inv.hospitalName,
    severity: 'info'
  });
  notify();
  return id;
}

// ── Hospital Operational Helpers ────────────────────────────

export function getHospitalPharmacy() {
  const hospId = state.currentHospitalId || 'h1';
  return state.pharmacyMedicines.filter(m => m.hospitalId === hospId);
}

export function dispenseMedicine(medId, qty = 1) {
  const med = state.pharmacyMedicines.find(m => m.id === medId);
  if (med && med.stock >= qty) {
    med.stock -= qty;
    if (med.stock <= med.minStock) {
      med.lowStock = true;
    }
    notify();
    return true;
  }
  return false;
}

export function addPharmacyMedicine(medData) {
  const id = 'med-' + (state.pharmacyMedicines.length + 1);
  const newMed = {
    id,
    hospitalId: state.currentHospitalId || 'h1',
    stock: 100,
    minStock: 20,
    lowStock: false,
    ...medData
  };
  state.pharmacyMedicines.unshift(newMed);
  notify();
  return id;
}

export function getHospitalLabOrders() {
  const hospId = state.currentHospitalId || 'h1';
  return state.labOrders.filter(l => l.hospitalId === hospId);
}

export function createLabOrder(orderData) {
  const id = 'LAB-' + Math.floor(Math.random() * 899 + 100);
  const newOrder = {
    id,
    hospitalId: state.currentHospitalId || 'h1',
    status: 'processing',
    sampleCollectedAt: 'Today, Just now',
    priority: 'routine',
    cost: 850,
    ...orderData
  };
  state.labOrders.unshift(newOrder);
  notify();
  return id;
}

export function updateLabOrderStatus(orderId, status, resultSummary) {
  const order = state.labOrders.find(l => l.id === orderId);
  if (order) {
    order.status = status;
    if (resultSummary) order.resultSummary = resultSummary;
    notify();
  }
}

export function assignPatientDoctor(patientId, doctorId, department) {
  const p = state.patients.find(pt => pt.id === patientId);
  const doc = state.staff.find(s => s.id === doctorId);
  if (p) {
    p.assignedDoctor = doctorId;
    if (department) p.department = department;
    else if (doc) p.department = doc.department;

    state.activityFeed.unshift({
      id: 'act-' + Date.now(),
      type: 'staff',
      icon: 'stethoscope',
      color: 'blue',
      text: `Patient ${p.name} assigned to ${doc?.name || 'Doctor'} (${p.department})`,
      time: 'Just now'
    });
    notify();
    return true;
  }
  return false;
}

export function admitPatientToBed(bedId, patientId, patientName) {
  const bed = state.beds.find(b => b.id === bedId);
  if (bed) {
    bed.status = 'occupied';
    bed.patientId = patientId;
    bed.patientName = patientName;
    bed.admitDate = new Date().toISOString().split('T')[0];

    const p = state.patients.find(pt => pt.id === patientId);
    if (p) p.status = 'Admitted';

    state.activityFeed.unshift({
      id: 'act-' + Date.now(),
      type: 'checkin',
      icon: 'bed',
      color: 'blue',
      text: `Patient ${patientName} admitted to ${bed.ward} (${bed.number})`,
      time: 'Just now'
    });
    notify();
    return true;
  }
  return false;
}

export function dischargePatientBed(bedId) {
  const bed = state.beds.find(b => b.id === bedId);
  if (bed) {
    const p = state.patients.find(pt => pt.id === bed.patientId);
    if (p) p.status = 'OPD';

    bed.status = 'cleaning';
    bed.patientId = null;
    bed.patientName = null;
    bed.admitDate = null;

    notify();
    return true;
  }
  return false;
}

export function addHospitalBill(billData) {
  const id = 'inv' + (state.invoices.length + 1);
  const newBill = {
    id,
    hospitalId: state.currentHospitalId || 'h1',
    date: new Date().toISOString().split('T')[0],
    status: 'paid',
    ...billData
  };
  state.invoices.unshift(newBill);
  notify();
  return id;
}

export function updateHospitalSettings(updatedFields) {
  const hospId = state.currentHospitalId || 'h1';
  const h = state.hospitals.find(hosp => hosp.id === hospId);
  if (h) {
    Object.assign(h, updatedFields);
    notify();
  }
}

// ── Doctor Workspace Helpers & Mutations ────────────────────

export function getDoctorLeaves(doctorId) {
  if (!doctorId) return state.doctorLeaves;
  return state.doctorLeaves.filter(l => l.doctorId === doctorId);
}

export function getDoctorReferrals(doctorId) {
  if (!doctorId) return state.doctorReferrals;
  return state.doctorReferrals.filter(r => r.fromDoctorId === doctorId || r.toDoctorId === doctorId);
}

export function getPrescriptionTemplates(doctorId) {
  return state.prescriptionTemplates;
}

export function toggleDoctorAvailability(doctorId, newStatus) {
  const doc = state.staff.find(s => s.id === doctorId);
  if (doc) {
    doc.status = newStatus; // 'on-duty' | 'on-leave'
    
    // Two-way sync: Update hospital activity feed and system log
    state.activityFeed.unshift({
      id: 'act-' + Date.now(),
      type: 'staff',
      icon: 'calendar',
      color: newStatus === 'on-duty' ? 'green' : 'amber',
      text: `${doc.name} marked ${newStatus === 'on-duty' ? '🟢 Available for OPD & WhatsApp booking' : '🔴 Unavailable / On Leave (Slots auto-blocked)'}`,
      time: 'Just now'
    });

    addAuditLog({
      user: doc.name,
      action: 'Doctor Availability Toggled',
      details: `Status changed to ${newStatus}. WhatsApp bot & OPD calendar synchronized.`,
      tenant: 'Apollo Multi-Specialty Hospital',
      severity: 'info'
    });

    notify();
    return true;
  }
  return false;
}

export function recordConsultationVisit(patientId, visitData) {
  const p = state.patients.find(pt => pt.id === patientId);
  if (p) {
    const today = new Date().toISOString().split('T')[0];
    
    // 1. Append to visits
    if (!p.visits) p.visits = [];
    p.visits.unshift({
      date: today,
      doctor: visitData.doctorName || 'Doctor',
      type: visitData.type || 'OPD Consultation',
      diagnosis: visitData.diagnosis || 'Clinical evaluation completed',
      notes: visitData.clinicalNotes || ''
    });

    // 2. Append prescribed medicines if any
    if (visitData.prescriptions && visitData.prescriptions.length > 0) {
      if (!p.prescriptions) p.prescriptions = [];
      visitData.prescriptions.forEach(rx => {
        p.prescriptions.unshift({
          date: today,
          drug: rx.drug,
          dose: rx.dose,
          duration: rx.duration,
          prescribedBy: visitData.doctorName
        });
      });
    }

    // 3. Create lab orders if ordered
    if (visitData.labs && visitData.labs.length > 0) {
      visitData.labs.forEach(testName => {
        createLabOrder({
          patientId,
          patientName: p.name,
          doctor: visitData.doctorName,
          testName,
          department: 'Diagnostics',
          sampleType: 'Clinical Investigation',
          priority: 'routine',
          cost: 950
        });
      });
    }

    // 4. Update appointment status if matching appointment exists
    if (visitData.appointmentId) {
      const appt = state.appointments.find(a => a.id === visitData.appointmentId);
      if (appt) appt.status = 'completed';
    }

    // 5. Update patient vitals if provided
    if (visitData.vitals) {
      p.vitals = { ...p.vitals, ...visitData.vitals };
    }

    // 6. Record activity
    state.activityFeed.unshift({
      id: 'act-' + Date.now(),
      type: 'appointment',
      icon: 'check-circle-2',
      color: 'blue',
      text: `Consultation completed for ${p.name} with ${visitData.doctorName} — Rx & EMR updated`,
      time: 'Just now'
    });

    notify();
    return true;
  }
  return false;
}

export function createDoctorReferral(referralData) {
  const id = 'ref-' + (state.doctorReferrals.length + 1);
  const newRef = {
    id,
    hospitalId: state.currentHospitalId || 'h1',
    date: new Date().toISOString().split('T')[0],
    status: 'pending',
    ...referralData
  };
  state.doctorReferrals.unshift(newRef);
  state.activityFeed.unshift({
    id: 'act-' + Date.now(),
    type: 'staff',
    icon: 'share-2',
    color: 'blue',
    text: `Referral created: ${newRef.patientName} referred to ${newRef.toDoctorName} (${newRef.toDepartment})`,
    time: 'Just now'
  });
  notify();
  return id;
}

export function submitDoctorLeave(leaveData) {
  const id = 'lev-' + (state.doctorLeaves.length + 1);
  const newLeave = {
    id,
    status: 'pending',
    ...leaveData
  };
  state.doctorLeaves.unshift(newLeave);
  state.activityFeed.unshift({
    id: 'act-' + Date.now(),
    type: 'staff',
    icon: 'calendar-off',
    color: 'amber',
    text: `Leave request submitted: ${newLeave.doctorName} for ${newLeave.days} days (${newLeave.type})`,
    time: 'Just now'
  });
  notify();
  return id;
}

export function addPrescriptionTemplate(templateData) {
  const id = 'tmpl-' + (state.prescriptionTemplates.length + 1);
  const newTmpl = {
    id,
    ...templateData
  };
  state.prescriptionTemplates.unshift(newTmpl);
  notify();
  return id;
}

// ── Receptionist Front Desk Helpers ─────────────────────────

export function updatePatientContact(patientId, contactFields) {
  const p = state.patients.find(pt => pt.id === patientId);
  if (p) {
    Object.assign(p, contactFields);
    notify();
    return true;
  }
  return false;
}

export function checkInAndIssueToken(apptId, patientId) {
  const appt = state.appointments.find(a => a.id === apptId);
  const p = state.patients.find(pt => pt.id === patientId);
  const doc = appt ? state.staff.find(s => s.id === appt.doctorId) : null;

  if (appt) {
    appt.status = 'confirmed';
    if (!appt.token) {
      appt.token = (appt.department?.charAt(0) || 'T') + '-' + Math.floor(Math.random() * 899 + 100);
    }
  }

  state.activityFeed.unshift({
    id: 'act-' + Date.now(),
    type: 'checkin',
    icon: 'user-check',
    color: 'blue',
    text: `Patient ${p?.name || 'Patient'} arrived at Front Desk — Token ${appt?.token || 'TKN'} issued for Dr. ${doc?.name || 'Doctor'}`,
    time: 'Just now'
  });

  notify();
  return appt?.token;
}

export function rescheduleAppointment(apptId, newDate, newTime) {
  const appt = state.appointments.find(a => a.id === apptId);
  if (appt) {
    appt.date = newDate;
    appt.time = newTime;
    appt.status = 'confirmed';
    notify();
    return true;
  }
  return false;
}

export function cancelAppointment(apptId, reason = 'Patient requested cancellation') {
  const appt = state.appointments.find(a => a.id === apptId);
  if (appt) {
    appt.status = 'cancelled';
    appt.cancelReason = reason;
    notify();
    return true;
  }
  return false;
}

export function confirmWhatsAppBooking(apptId) {
  const appt = state.appointments.find(a => a.id === apptId);
  if (appt) {
    appt.status = 'confirmed';
    appt.verifiedByReception = true;
    notify();
    return true;
  }
  return false;
}



