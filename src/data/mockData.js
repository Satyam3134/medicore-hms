// ============================================================
// mockData.js — Comprehensive Seed Data for MediCore HMS
// ============================================================

const today = new Date();
const fmt = (d) => d.toISOString().split('T')[0];
const daysAgo = (n) => { const d = new Date(today); d.setDate(d.getDate() - n); return fmt(d); };
const daysAhead = (n) => { const d = new Date(today); d.setDate(d.getDate() + n); return fmt(d); };

// ── Master Super Admin DB Info ───────────────────────────────
export const superAdminMasterDb = {
  dbId: 'db_master_superadmin_root',
  dbName: 'medicore_master_platform',
  dbHost: 'db-master-cluster.ap-south-1.internal.medicore.io',
  dbPort: 5432,
  dbUser: 'root_superadmin',
  dbType: 'PostgreSQL 16.2 Enterprise HA Cluster',
  sslMode: 'verify-full (TLS 1.3)',
  totalTenantsPartitioned: 5,
  storageTotal: '12.8 GB',
  masterEncryption: 'AES-256-GCM / AWS KMS Key #kms-mc-root-8842',
  lastMasterBackup: 'Today, 04:00 AM UTC'
};

// ── Hospitals with Dedicated Isolated Tenant Databases ────────
export const hospitals = [
  {
    id: 'h1',
    name: 'Apollo Multi-Specialty Hospital',
    type: 'Multi-Specialty',
    city: 'Mumbai',
    state: 'Maharashtra',
    address: '15 Andheri East, Mumbai, MH 400069',
    phone: '+91 22 6789 0000',
    email: 'admin@apollomumbai.com',
    adminName: 'Rajesh Mehta',
    adminEmail: 'rajesh.mehta@apollomumbai.com',
    beds: 320,
    plan: 'Enterprise',
    planPrice: 49999,
    status: 'active',
    onboardedDate: '2024-01-15',
    logo: null,
    primaryColor: '#0B5FA5',
    departments: ['Cardiology', 'Orthopedics', 'Neurology', 'Pediatrics', 'Oncology', 'Dermatology', 'General Medicine', 'Emergency'],
    stats: { staff: 48, doctors: 22, patients: 312, todayAppointments: 34, bedOccupancy: 78, monthlyRevenue: 2840000 },
    location: { lat: 19.1136, lng: 72.8697 },
    database: {
      dbId: 'db_hosp_apollo_mum_781',
      dbName: 'medicore_tenant_apollo_mumbai',
      dbHost: 'db-node-01.ap-south-1.internal.medicore.io',
      dbPort: 5432,
      dbUser: 'usr_apollo_admin',
      dbPassword: 'enc_sec_99aK#29$vLm!Pz',
      dbType: 'PostgreSQL 16.2 (Isolated Schema Partition)',
      dbSize: '2.84 GB',
      status: 'healthy',
      sslMode: 'require (TLS 1.3)',
      connectionUri: 'postgresql://usr_apollo_admin:enc_sec_99aK#29$vLm!Pz@db-node-01.ap-south-1.internal.medicore.io:5432/medicore_tenant_apollo_mumbai?sslmode=require',
      createdAt: '2024-01-15 10:30 UTC',
      lastPingLatency: '8ms'
    },
    backupConfig: {
      enabled: true,
      cronSchedule: '0 2 * * *',
      cronLabel: 'Daily at 02:00 AM UTC',
      frequency: 'daily',
      retentionDays: 90,
      storageTarget: 'AWS S3 (s3://medicore-backups-mumbai/apollo-h1/)',
      lastBackupTime: 'Today, 02:00 AM UTC',
      lastBackupSize: '412 MB',
      lastBackupStatus: 'success',
      history: [
        { id: 'bk-9941', timestamp: '2026-08-21 02:00 AM', size: '412 MB', type: 'Automated (Cron)', status: 'success', checksum: 'sha256:88e0b...3d2' },
        { id: 'bk-9940', timestamp: '2026-08-20 02:00 AM', size: '408 MB', type: 'Automated (Cron)', status: 'success', checksum: 'sha256:47a1c...f91' },
        { id: 'bk-9939', timestamp: '2026-08-19 04:15 PM', size: '405 MB', type: 'Manual Snapshot', status: 'success', checksum: 'sha256:12b9d...aa0' }
      ]
    }
  },
  {
    id: 'h2',
    name: 'Sunshine Cardiac Care Centre',
    type: 'Single-Specialty',
    city: 'Pune',
    state: 'Maharashtra',
    address: '8 Baner Road, Pune, MH 411045',
    phone: '+91 20 2786 1111',
    email: 'info@sunshinecardiac.com',
    adminName: 'Dr. Priya Nair',
    adminEmail: 'priya.nair@sunshinecardiac.com',
    beds: 80,
    plan: 'Professional',
    planPrice: 24999,
    status: 'active',
    onboardedDate: '2024-03-22',
    logo: null,
    primaryColor: '#0F7A6C',
    departments: ['Cardiology', 'Emergency', 'ICU', 'Rehabilitation'],
    stats: { staff: 18, doctors: 9, patients: 124, todayAppointments: 18, bedOccupancy: 65, monthlyRevenue: 1260000 },
    database: {
      dbId: 'db_hosp_sunshine_pune_412',
      dbName: 'medicore_tenant_sunshine_cardiac',
      dbHost: 'db-node-02.ap-south-1.internal.medicore.io',
      dbPort: 5432,
      dbUser: 'usr_sunshine_admin',
      dbPassword: 'enc_sec_88bN#71$pQx!Ty',
      dbType: 'PostgreSQL 16.2 (Isolated Schema Partition)',
      dbSize: '1.26 GB',
      status: 'healthy',
      sslMode: 'require (TLS 1.3)',
      connectionUri: 'postgresql://usr_sunshine_admin:enc_sec_88bN#71$pQx!Ty@db-node-02.ap-south-1.internal.medicore.io:5432/medicore_tenant_sunshine_cardiac?sslmode=require',
      createdAt: '2024-03-22 14:15 UTC',
      lastPingLatency: '11ms'
    },
    backupConfig: {
      enabled: true,
      cronSchedule: '0 2 * * *',
      cronLabel: 'Daily at 02:00 AM UTC',
      frequency: 'daily',
      retentionDays: 60,
      storageTarget: 'AWS S3 (s3://medicore-backups-mumbai/sunshine-h2/)',
      lastBackupTime: 'Today, 02:00 AM UTC',
      lastBackupSize: '184 MB',
      lastBackupStatus: 'success',
      history: [
        { id: 'bk-8821', timestamp: '2026-08-21 02:00 AM', size: '184 MB', type: 'Automated (Cron)', status: 'success', checksum: 'sha256:39d1b...9a1' },
        { id: 'bk-8820', timestamp: '2026-08-20 02:00 AM', size: '181 MB', type: 'Automated (Cron)', status: 'success', checksum: 'sha256:56a2c...b12' }
      ]
    }
  },
  {
    id: 'h3',
    name: 'Green Valley Family Clinic',
    type: 'Clinic',
    city: 'Bengaluru',
    state: 'Karnataka',
    address: '42 Koramangala 5th Block, Bengaluru, KA 560095',
    phone: '+91 80 4123 5678',
    email: 'hello@greenvalley.clinic',
    adminName: 'Arun Sharma',
    adminEmail: 'arun@greenvalley.clinic',
    beds: 12,
    plan: 'Starter',
    planPrice: 9999,
    status: 'active',
    onboardedDate: '2024-06-10',
    logo: null,
    primaryColor: '#16A34A',
    departments: ['General Medicine', 'Pediatrics', 'Dermatology'],
    stats: { staff: 8, doctors: 4, patients: 87, todayAppointments: 22, bedOccupancy: 42, monthlyRevenue: 320000 },
    database: {
      dbId: 'db_hosp_greenvalley_blr_901',
      dbName: 'medicore_tenant_green_valley',
      dbHost: 'db-node-03.ap-south-1.internal.medicore.io',
      dbPort: 5432,
      dbUser: 'usr_greenvalley_admin',
      dbPassword: 'enc_sec_33zK#19$mNp!Wq',
      dbType: 'PostgreSQL 16.2 (Isolated Schema Partition)',
      dbSize: '430 MB',
      status: 'healthy',
      sslMode: 'require (TLS 1.3)',
      connectionUri: 'postgresql://usr_greenvalley_admin:enc_sec_33zK#19$mNp!Wq@db-node-03.ap-south-1.internal.medicore.io:5432/medicore_tenant_green_valley?sslmode=require',
      createdAt: '2024-06-10 09:00 UTC',
      lastPingLatency: '14ms'
    },
    backupConfig: {
      enabled: true,
      cronSchedule: '0 3 * * 0',
      cronLabel: 'Weekly on Sunday 03:00 AM UTC',
      frequency: 'weekly',
      retentionDays: 30,
      storageTarget: 'AWS S3 (s3://medicore-backups-mumbai/greenvalley-h3/)',
      lastBackupTime: '3 days ago',
      lastBackupSize: '62 MB',
      lastBackupStatus: 'success',
      history: [
        { id: 'bk-7710', timestamp: '2026-08-17 03:00 AM', size: '62 MB', type: 'Automated (Cron)', status: 'success', checksum: 'sha256:77f2b...cc1' }
      ]
    }
  },
  {
    id: 'h4',
    name: 'MedLife Ortho & Spine Institute',
    type: 'Single-Specialty',
    city: 'Hyderabad',
    state: 'Telangana',
    address: '77 Jubilee Hills, Hyderabad, TS 500033',
    phone: '+91 40 6611 7700',
    email: 'contact@medlifeortho.com',
    adminName: 'Sujatha Reddy',
    adminEmail: 'sujatha@medlifeortho.com',
    beds: 60,
    plan: 'Professional',
    planPrice: 24999,
    status: 'active',
    onboardedDate: '2024-09-01',
    logo: null,
    primaryColor: '#7c3aed',
    departments: ['Orthopedics', 'Physiotherapy', 'Radiology', 'Emergency'],
    stats: { staff: 20, doctors: 10, patients: 198, todayAppointments: 27, bedOccupancy: 71, monthlyRevenue: 980000 },
    database: {
      dbId: 'db_hosp_medlife_hyd_552',
      dbName: 'medicore_tenant_medlife_ortho',
      dbHost: 'db-node-02.ap-south-1.internal.medicore.io',
      dbPort: 5432,
      dbUser: 'usr_medlife_admin',
      dbPassword: 'enc_sec_44rT#88$xVb!Za',
      dbType: 'PostgreSQL 16.2 (Isolated Schema Partition)',
      dbSize: '980 MB',
      status: 'healthy',
      sslMode: 'require (TLS 1.3)',
      connectionUri: 'postgresql://usr_medlife_admin:enc_sec_44rT#88$xVb!Za@db-node-02.ap-south-1.internal.medicore.io:5432/medicore_tenant_medlife_ortho?sslmode=require',
      createdAt: '2024-09-01 11:20 UTC',
      lastPingLatency: '9ms'
    },
    backupConfig: {
      enabled: true,
      cronSchedule: '0 */12 * * *',
      cronLabel: 'Every 12 Hours',
      frequency: '12h',
      retentionDays: 90,
      storageTarget: 'AWS S3 (s3://medicore-backups-mumbai/medlife-h4/)',
      lastBackupTime: 'Today, 12:00 PM UTC',
      lastBackupSize: '142 MB',
      lastBackupStatus: 'success',
      history: [
        { id: 'bk-6602', timestamp: '2026-08-21 12:00 PM', size: '142 MB', type: 'Automated (Cron)', status: 'success', checksum: 'sha256:11a4d...88f' },
        { id: 'bk-6601', timestamp: '2026-08-21 12:00 AM', size: '139 MB', type: 'Automated (Cron)', status: 'success', checksum: 'sha256:99c3b...44e' }
      ]
    }
  },
  {
    id: 'h5',
    name: 'CityHeal General Hospital',
    type: 'Multi-Specialty',
    city: 'Chennai',
    state: 'Tamil Nadu',
    address: '3 Anna Salai, Chennai, TN 600002',
    phone: '+91 44 2345 6789',
    email: 'admin@cityheal.in',
    adminName: 'Vijay Krishnan',
    adminEmail: 'vijay@cityheal.in',
    beds: 180,
    plan: 'Enterprise',
    planPrice: 49999,
    status: 'suspended',
    onboardedDate: '2023-11-12',
    logo: null,
    primaryColor: '#D97706',
    departments: ['General Medicine', 'OB-GYN', 'Pediatrics', 'Cardiology', 'Surgery', 'Emergency'],
    stats: { staff: 34, doctors: 16, patients: 234, todayAppointments: 0, bedOccupancy: 0, monthlyRevenue: 0 },
    database: {
      dbId: 'db_hosp_cityheal_chn_109',
      dbName: 'medicore_tenant_cityheal_chennai',
      dbHost: 'db-node-01.ap-south-1.internal.medicore.io',
      dbPort: 5432,
      dbUser: 'usr_cityheal_admin',
      dbPassword: 'enc_sec_11qW#55$kLm!Hj',
      dbType: 'PostgreSQL 16.2 (Isolated Schema Partition)',
      dbSize: '2.10 GB',
      status: 'suspended',
      sslMode: 'require (TLS 1.3)',
      connectionUri: 'postgresql://usr_cityheal_admin:enc_sec_11qW#55$kLm!Hj@db-node-01.ap-south-1.internal.medicore.io:5432/medicore_tenant_cityheal_chennai?sslmode=require',
      createdAt: '2023-11-12 08:30 UTC',
      lastPingLatency: 'N/A (Suspended)'
    },
    backupConfig: {
      enabled: false,
      cronSchedule: '0 2 * * *',
      cronLabel: 'Daily at 02:00 AM UTC (Paused)',
      frequency: 'daily',
      retentionDays: 90,
      storageTarget: 'AWS S3 (s3://medicore-backups-mumbai/cityheal-h5/)',
      lastBackupTime: '12 days ago',
      lastBackupSize: '310 MB',
      lastBackupStatus: 'paused',
      history: [
        { id: 'bk-5501', timestamp: '2026-08-09 02:00 AM', size: '310 MB', type: 'Automated (Cron)', status: 'success', checksum: 'sha256:44b1c...99a' }
      ]
    }
  }
];

// ── Departments ────────────────────────────────────────────
export const departments = [
  { id: 'd1', hospitalId: 'h1', name: 'Cardiology', head: 's2', color: '#DC2626', patientCount: 48, avgWaitMin: 22, doctorCount: 4 },
  { id: 'd2', hospitalId: 'h1', name: 'Orthopedics', head: 's3', color: '#D97706', patientCount: 62, avgWaitMin: 18, doctorCount: 5 },
  { id: 'd3', hospitalId: 'h1', name: 'Neurology', head: 's4', color: '#7c3aed', patientCount: 31, avgWaitMin: 35, doctorCount: 3 },
  { id: 'd4', hospitalId: 'h1', name: 'Pediatrics', head: 's5', color: '#0891b2', patientCount: 55, avgWaitMin: 14, doctorCount: 4 },
  { id: 'd5', hospitalId: 'h1', name: 'Oncology', head: 's6', color: '#be185d', patientCount: 29, avgWaitMin: 28, doctorCount: 3 },
  { id: 'd6', hospitalId: 'h1', name: 'Dermatology', head: 's7', color: '#16A34A', patientCount: 41, avgWaitMin: 12, doctorCount: 3 },
  { id: 'd7', hospitalId: 'h1', name: 'General Medicine', head: 's1', color: '#0B5FA5', patientCount: 87, avgWaitMin: 10, doctorCount: 6 },
  { id: 'd8', hospitalId: 'h1', name: 'Emergency', head: 's8', color: '#DC2626', patientCount: 24, avgWaitMin: 5, doctorCount: 3 },
];

// ── Staff / Doctors ────────────────────────────────────────
export const staff = [
  {
    id: 's1', hospitalId: 'h1',
    name: 'Dr. Aditya Kapoor', role: 'Doctor', department: 'General Medicine', specialization: 'Internal Medicine',
    email: 'aditya.kapoor@apollomumbai.com', phone: '+91 98200 11001',
    status: 'on-duty', joinDate: '2021-06-01',
    qualifications: 'MBBS, MD (Internal Medicine)', consultationFee: 800,
    avatar: null, initials: 'AK',
    schedule: { mon: '09:00-17:00', tue: '09:00-17:00', wed: '09:00-17:00', thu: '09:00-17:00', fri: '09:00-17:00', sat: null, sun: null },
    patientCount: 42, rating: 4.7,
    bio: 'Senior internal medicine specialist with 12 years experience.'
  },
  {
    id: 's2', hospitalId: 'h1',
    name: 'Dr. Meera Joshi', role: 'Doctor', department: 'Cardiology', specialization: 'Interventional Cardiology',
    email: 'meera.joshi@apollomumbai.com', phone: '+91 98200 11002',
    status: 'on-duty', joinDate: '2020-03-15',
    qualifications: 'MBBS, MD, DM (Cardiology)', consultationFee: 1200,
    avatar: null, initials: 'MJ',
    schedule: { mon: '10:00-18:00', tue: '10:00-18:00', wed: null, thu: '10:00-18:00', fri: '10:00-18:00', sat: '09:00-13:00', sun: null },
    patientCount: 38, rating: 4.9
  },
  {
    id: 's3', hospitalId: 'h1',
    name: 'Dr. Suresh Patel', role: 'Doctor', department: 'Orthopedics', specialization: 'Joint Replacement',
    email: 'suresh.patel@apollomumbai.com', phone: '+91 98200 11003',
    status: 'on-duty', joinDate: '2019-11-20',
    qualifications: 'MBBS, MS (Ortho)', consultationFee: 1000,
    avatar: null, initials: 'SP',
    schedule: { mon: '09:00-17:00', tue: null, wed: '09:00-17:00', thu: null, fri: '09:00-17:00', sat: '09:00-14:00', sun: null },
    patientCount: 55, rating: 4.8
  },
  {
    id: 's4', hospitalId: 'h1',
    name: 'Dr. Ananya Singh', role: 'Doctor', department: 'Neurology', specialization: 'Stroke & Epilepsy',
    email: 'ananya.singh@apollomumbai.com', phone: '+91 98200 11004',
    status: 'on-leave', joinDate: '2022-01-10',
    qualifications: 'MBBS, MD, DM (Neurology)', consultationFee: 1100,
    avatar: null, initials: 'AS',
    schedule: { mon: '09:00-17:00', tue: '09:00-17:00', wed: '09:00-17:00', thu: '09:00-17:00', fri: null, sat: null, sun: null },
    patientCount: 29, rating: 4.6
  },
  {
    id: 's5', hospitalId: 'h1',
    name: 'Dr. Ravi Kumar', role: 'Doctor', department: 'Pediatrics', specialization: 'Neonatology',
    email: 'ravi.kumar@apollomumbai.com', phone: '+91 98200 11005',
    status: 'on-duty', joinDate: '2021-09-05',
    qualifications: 'MBBS, MD (Pediatrics)', consultationFee: 700,
    avatar: null, initials: 'RK',
    schedule: { mon: '08:00-16:00', tue: '08:00-16:00', wed: '08:00-16:00', thu: '08:00-16:00', fri: '08:00-16:00', sat: '08:00-12:00', sun: null },
    patientCount: 51, rating: 4.8
  },
  {
    id: 's6', hospitalId: 'h1',
    name: 'Dr. Sunita Rao', role: 'Doctor', department: 'Oncology', specialization: 'Medical Oncology',
    email: 'sunita.rao@apollomumbai.com', phone: '+91 98200 11006',
    status: 'on-duty', joinDate: '2020-07-12',
    qualifications: 'MBBS, MD, DM (Oncology)', consultationFee: 1500,
    avatar: null, initials: 'SR',
    schedule: { mon: '10:00-17:00', tue: '10:00-17:00', wed: '10:00-17:00', thu: '10:00-17:00', fri: '10:00-17:00', sat: null, sun: null },
    patientCount: 27, rating: 4.9
  },
  {
    id: 's7', hospitalId: 'h1',
    name: 'Dr. Priya Nambiar', role: 'Doctor', department: 'Dermatology', specialization: 'Cosmetic Dermatology',
    email: 'priya.nambiar@apollomumbai.com', phone: '+91 98200 11007',
    status: 'on-duty', joinDate: '2022-04-01',
    qualifications: 'MBBS, MD (Dermatology)', consultationFee: 900,
    avatar: null, initials: 'PN',
    schedule: { mon: '09:00-17:00', tue: '09:00-17:00', wed: null, thu: '09:00-17:00', fri: '09:00-17:00', sat: '09:00-13:00', sun: null },
    patientCount: 38, rating: 4.7
  },
  {
    id: 's8', hospitalId: 'h1',
    name: 'Dr. Kiran Desai', role: 'Doctor', department: 'Emergency', specialization: 'Emergency Medicine',
    email: 'kiran.desai@apollomumbai.com', phone: '+91 98200 11008',
    status: 'on-duty', joinDate: '2020-01-08',
    qualifications: 'MBBS, DNB (Emergency Medicine)', consultationFee: 600,
    avatar: null, initials: 'KD',
    schedule: { mon: '08:00-20:00', tue: '08:00-20:00', wed: '08:00-20:00', thu: '08:00-20:00', fri: '08:00-20:00', sat: '08:00-20:00', sun: '08:00-20:00' },
    patientCount: 22, rating: 4.5
  },
  {
    id: 's9', hospitalId: 'h1',
    name: 'Nurse Deepa Menon', role: 'Nurse', department: 'Cardiology', specialization: null,
    email: 'deepa.menon@apollomumbai.com', phone: '+91 98200 21001',
    status: 'on-duty', joinDate: '2022-08-15',
    qualifications: 'B.Sc Nursing', consultationFee: null,
    avatar: null, initials: 'DM',
    schedule: { mon: '07:00-15:00', tue: '07:00-15:00', wed: '07:00-15:00', thu: '07:00-15:00', fri: '07:00-15:00', sat: null, sun: null },
    patientCount: null, rating: null
  },
  {
    id: 's10', hospitalId: 'h1',
    name: 'Rekha Sharma', role: 'Receptionist', department: 'Front Desk', specialization: null,
    email: 'rekha.sharma@apollomumbai.com', phone: '+91 98200 31001',
    status: 'on-duty', joinDate: '2023-02-01',
    qualifications: 'B.Com', consultationFee: null,
    avatar: null, initials: 'RS',
    schedule: { mon: '08:00-16:00', tue: '08:00-16:00', wed: '08:00-16:00', thu: '08:00-16:00', fri: '08:00-16:00', sat: '08:00-13:00', sun: null },
    patientCount: null, rating: null
  },
  {
    id: 's11', hospitalId: 'h1',
    name: 'Dr. Mohan Iyer', role: 'Doctor', department: 'General Medicine', specialization: 'Diabetology',
    email: 'mohan.iyer@apollomumbai.com', phone: '+91 98200 11009',
    status: 'off-duty', joinDate: '2021-03-22',
    qualifications: 'MBBS, MD (Medicine)', consultationFee: 750,
    avatar: null, initials: 'MI',
    schedule: { mon: null, tue: '12:00-20:00', wed: null, thu: '12:00-20:00', fri: '12:00-20:00', sat: '10:00-18:00', sun: null },
    patientCount: 33, rating: 4.6
  },
  {
    id: 's12', hospitalId: 'h1',
    name: 'Pradeep Kulkarni', role: 'Lab Technician', department: 'Pathology', specialization: null,
    email: 'pradeep.kulkarni@apollomumbai.com', phone: '+91 98200 41001',
    status: 'on-duty', joinDate: '2022-11-10',
    qualifications: 'DMLT, B.Sc MLT', consultationFee: null,
    avatar: null, initials: 'PK',
    schedule: { mon: '07:00-15:00', tue: '07:00-15:00', wed: '07:00-15:00', thu: '07:00-15:00', fri: '07:00-15:00', sat: '07:00-12:00', sun: null },
    patientCount: null, rating: null
  },
];

// ── Patients ───────────────────────────────────────────────
export const patients = [
  {
    id: 'p1', hospitalId: 'h1',
    name: 'Arvind Bose', age: 58, gender: 'Male', bloodGroup: 'B+',
    phone: '+91 99001 10001', email: 'arvind.bose@email.com',
    address: 'Flat 4B, Marine Drive, Mumbai', emergencyContact: 'Priya Bose (+91 99001 10002)',
    allergies: ['Penicillin', 'Aspirin'], medicalHistory: ['Hypertension', 'Type 2 Diabetes'],
    insurance: 'Star Health — Policy #SH2023001', idProof: 'Aadhar: XXXX-XXXX-1234',
    assignedDoctor: 's2', department: 'Cardiology',
    registeredDate: daysAgo(180), lastVisit: daysAgo(3),
    status: 'OPD', patientId: 'MH-APL-001',
    vitals: { bp: '138/88', pulse: 76, temp: 98.6, spo2: 97, weight: 78, height: 170 },
    visits: [
      { date: daysAgo(3), doctor: 'Dr. Meera Joshi', type: 'OPD', diagnosis: 'Stable angina — review', notes: 'Medication adjusted, stress test ordered.' },
      { date: daysAgo(30), doctor: 'Dr. Meera Joshi', type: 'OPD', diagnosis: 'Hypertensive crisis', notes: 'BP 170/100. IV medication given. Monitored 4h.' },
      { date: daysAgo(90), doctor: 'Dr. Meera Joshi', type: 'OPD', diagnosis: 'Routine cardiology follow-up', notes: 'ECG normal. Continue current medications.' },
    ],
    prescriptions: [
      { date: daysAgo(3), drug: 'Atorvastatin 40mg', dose: '1 tablet at night', duration: '30 days', prescribedBy: 'Dr. Meera Joshi' },
      { date: daysAgo(3), drug: 'Metoprolol 25mg', dose: '1 tablet twice daily', duration: '30 days', prescribedBy: 'Dr. Meera Joshi' },
      { date: daysAgo(3), drug: 'Aspirin 75mg', dose: '1 tablet morning', duration: '30 days', prescribedBy: 'Dr. Meera Joshi' },
    ],
    labReports: [
      { date: daysAgo(5), test: 'Lipid Profile', status: 'completed', result: 'LDL: 142 mg/dL (High)', ordered: 'Dr. Meera Joshi' },
      { date: daysAgo(5), test: 'HbA1c', status: 'completed', result: '7.2% (Controlled)', ordered: 'Dr. Meera Joshi' },
      { date: daysAgo(1), test: 'Treadmill Stress Test', status: 'pending', result: null, ordered: 'Dr. Meera Joshi' },
    ],
    billing: [
      { date: daysAgo(3), description: 'OPD Consultation', amount: 1200, status: 'paid', invoice: 'INV-2024-0831' },
      { date: daysAgo(5), description: 'Lab Tests — Lipid Profile + HbA1c', amount: 2800, status: 'paid', invoice: 'INV-2024-0829' },
    ]
  },
  {
    id: 'p2', hospitalId: 'h1',
    name: 'Sunita Verma', age: 34, gender: 'Female', bloodGroup: 'O+',
    phone: '+91 99001 20002', email: 'sunita.verma@email.com',
    address: '12 Linking Road, Bandra, Mumbai', emergencyContact: 'Ramesh Verma (+91 99001 20003)',
    allergies: [], medicalHistory: ['PCOS', 'Mild Anemia'],
    insurance: 'ICICI Lombard — Policy #IL2024012',
    assignedDoctor: 's7', department: 'Dermatology',
    registeredDate: daysAgo(45), lastVisit: daysAgo(7),
    status: 'OPD', patientId: 'MH-APL-002',
    vitals: { bp: '110/70', pulse: 82, temp: 98.2, spo2: 99, weight: 58, height: 162 },
    visits: [
      { date: daysAgo(7), doctor: 'Dr. Priya Nambiar', type: 'OPD', diagnosis: 'Acne Vulgaris — moderate', notes: 'Started topical tretinoin, oral doxycycline.' },
      { date: daysAgo(45), doctor: 'Dr. Priya Nambiar', type: 'OPD', diagnosis: 'Initial consultation', notes: 'Skin assessment done. Treatment plan initiated.' },
    ],
    prescriptions: [
      { date: daysAgo(7), drug: 'Tretinoin 0.025% cream', dose: 'Apply at night', duration: '60 days', prescribedBy: 'Dr. Priya Nambiar' },
      { date: daysAgo(7), drug: 'Doxycycline 100mg', dose: '1 tablet twice daily', duration: '30 days', prescribedBy: 'Dr. Priya Nambiar' },
    ],
    labReports: [],
    billing: [
      { date: daysAgo(7), description: 'OPD Consultation', amount: 900, status: 'paid', invoice: 'INV-2024-0837' },
    ]
  },
  {
    id: 'p3', hospitalId: 'h1',
    name: 'Ramesh Gupta', age: 65, gender: 'Male', bloodGroup: 'A+',
    phone: '+91 99001 30003', email: 'ramesh.gupta@email.com',
    address: '5 Dadar West, Mumbai', emergencyContact: 'Seema Gupta (+91 99001 30004)',
    allergies: ['Sulfa drugs'], medicalHistory: ['Knee Osteoarthritis', 'Hypertension'],
    insurance: 'New India Assurance — Policy #NIA2023045',
    assignedDoctor: 's3', department: 'Orthopedics',
    registeredDate: daysAgo(120), lastVisit: daysAgo(14),
    status: 'Admitted', patientId: 'MH-APL-003',
    vitals: { bp: '142/90', pulse: 70, temp: 98.8, spo2: 96, weight: 85, height: 168 },
    visits: [
      { date: daysAgo(14), doctor: 'Dr. Suresh Patel', type: 'IPD', diagnosis: 'Total Knee Replacement — Right', notes: 'Post-op day 3. Good recovery. Physiotherapy started.' },
      { date: daysAgo(30), doctor: 'Dr. Suresh Patel', type: 'OPD', diagnosis: 'Pre-operative assessment', notes: 'Surgery scheduled. All clearances obtained.' },
    ],
    prescriptions: [
      { date: daysAgo(14), drug: 'Pantoprazole 40mg', dose: '1 tablet before breakfast', duration: '30 days', prescribedBy: 'Dr. Suresh Patel' },
      { date: daysAgo(14), drug: 'Paracetamol 500mg', dose: '1 tablet as needed (pain)', duration: '14 days', prescribedBy: 'Dr. Suresh Patel' },
    ],
    labReports: [
      { date: daysAgo(20), test: 'Pre-op Blood Panel', status: 'completed', result: 'All parameters normal', ordered: 'Dr. Suresh Patel' },
      { date: daysAgo(20), test: 'X-Ray Knee (AP/Lateral)', status: 'completed', result: 'Severe joint space narrowing', ordered: 'Dr. Suresh Patel' },
    ],
    billing: [
      { date: daysAgo(14), description: 'TKR Surgery + IPD Package', amount: 185000, status: 'partial', invoice: 'INV-2024-0820' },
    ]
  },
  {
    id: 'p4', hospitalId: 'h1',
    name: 'Anita Krishnan', age: 28, gender: 'Female', bloodGroup: 'AB-',
    phone: '+91 99001 40004', email: 'anita.krishnan@email.com',
    address: '8 Powai Lake Road, Mumbai', emergencyContact: 'Vijay Krishnan (+91 99001 40005)',
    allergies: [], medicalHistory: [],
    insurance: null,
    assignedDoctor: 's5', department: 'Pediatrics',
    registeredDate: daysAgo(10), lastVisit: daysAgo(2),
    status: 'OPD', patientId: 'MH-APL-004',
    vitals: { bp: '110/72', pulse: 88, temp: 99.1, spo2: 98, weight: 52, height: 158 },
    visits: [
      { date: daysAgo(2), doctor: 'Dr. Ravi Kumar', type: 'OPD', diagnosis: 'Acute upper respiratory tract infection', notes: 'Viral. Symptomatic treatment prescribed.' },
    ],
    prescriptions: [
      { date: daysAgo(2), drug: 'Cetirizine 10mg', dose: '1 tablet at night', duration: '5 days', prescribedBy: 'Dr. Ravi Kumar' },
    ],
    labReports: [],
    billing: [
      { date: daysAgo(2), description: 'OPD Consultation', amount: 700, status: 'paid', invoice: 'INV-2024-0842' },
    ]
  },
  {
    id: 'p5', hospitalId: 'h1',
    name: 'Mohan Pillai', age: 72, gender: 'Male', bloodGroup: 'B-',
    phone: '+91 99001 50005', email: 'mohan.pillai@email.com',
    address: '22 Thane West, Mumbai', emergencyContact: 'Radha Pillai (+91 99001 50006)',
    allergies: ['NSAIDs'], medicalHistory: ['Parkinson\'s Disease', 'Type 2 Diabetes', 'Hypertension'],
    insurance: 'Government ESI',
    assignedDoctor: 's4', department: 'Neurology',
    registeredDate: daysAgo(365), lastVisit: daysAgo(21),
    status: 'OPD', patientId: 'MH-APL-005',
    vitals: { bp: '130/84', pulse: 64, temp: 97.8, spo2: 95, weight: 62, height: 165 },
    visits: [
      { date: daysAgo(21), doctor: 'Dr. Ananya Singh', type: 'OPD', diagnosis: 'Parkinson\'s — quarterly review', notes: 'Tremors mildly worse. Levodopa dose increased.' },
    ],
    prescriptions: [
      { date: daysAgo(21), drug: 'Levodopa/Carbidopa 100/25mg', dose: '3 times daily', duration: '90 days', prescribedBy: 'Dr. Ananya Singh' },
    ],
    labReports: [],
    billing: []
  },
  {
    id: 'p6', hospitalId: 'h1',
    name: 'Fatima Sheikh', age: 42, gender: 'Female', bloodGroup: 'O-',
    phone: '+91 99001 60006', email: 'fatima.sheikh@email.com',
    address: '15 Mahim, Mumbai', emergencyContact: 'Ahmed Sheikh (+91 99001 60007)',
    allergies: [], medicalHistory: ['Breast Cancer Stage II — in remission'],
    insurance: 'Bajaj Allianz — Policy #BA2023078',
    assignedDoctor: 's6', department: 'Oncology',
    registeredDate: daysAgo(400), lastVisit: daysAgo(10),
    status: 'OPD', patientId: 'MH-APL-006',
    vitals: { bp: '118/76', pulse: 78, temp: 98.4, spo2: 98, weight: 61, height: 160 },
    visits: [
      { date: daysAgo(10), doctor: 'Dr. Sunita Rao', type: 'OPD', diagnosis: 'Post-chemo follow-up — remission confirmed', notes: 'CA-125 normal. Next PET scan in 6 months.' },
    ],
    prescriptions: [],
    labReports: [
      { date: daysAgo(10), test: 'CA-125 Tumor Marker', status: 'completed', result: '12 U/mL (Normal)', ordered: 'Dr. Sunita Rao' },
    ],
    billing: []
  },
  {
    id: 'p7', hospitalId: 'h1',
    name: 'Sanjay Malhotra', age: 45, gender: 'Male', bloodGroup: 'A-',
    phone: '+91 99001 70007', email: 'sanjay.malhotra@email.com',
    address: '7 Juhu, Mumbai', emergencyContact: 'Neha Malhotra (+91 99001 70008)',
    allergies: ['Latex'], medicalHistory: ['Lumbar Disc Herniation'],
    insurance: 'Tata AIG — Policy #TA2024015',
    assignedDoctor: 's3', department: 'Orthopedics',
    registeredDate: daysAgo(60), lastVisit: daysAgo(5),
    status: 'OPD', patientId: 'MH-APL-007',
    vitals: { bp: '125/82', pulse: 74, temp: 98.6, spo2: 99, weight: 80, height: 172 },
    visits: [
      { date: daysAgo(5), doctor: 'Dr. Suresh Patel', type: 'OPD', diagnosis: 'L4-L5 disc herniation', notes: 'Conservative management continued. Physiotherapy 3x/week.' },
    ],
    prescriptions: [
      { date: daysAgo(5), drug: 'Methylprednisolone 8mg', dose: '1 tablet twice daily (taper)', duration: '7 days', prescribedBy: 'Dr. Suresh Patel' },
    ],
    labReports: [],
    billing: []
  },
  {
    id: 'p8', hospitalId: 'h1',
    name: 'Kavya Reddy', age: 8, gender: 'Female', bloodGroup: 'B+',
    phone: '+91 99001 80008', email: null,
    address: '33 Mulund West, Mumbai', emergencyContact: 'Ravi Reddy (Father) +91 99001 80009',
    allergies: ['Peanuts'], medicalHistory: ['Asthma (mild intermittent)'],
    insurance: null,
    assignedDoctor: 's5', department: 'Pediatrics',
    registeredDate: daysAgo(200), lastVisit: daysAgo(1),
    status: 'OPD', patientId: 'MH-APL-008',
    vitals: { bp: '95/60', pulse: 92, temp: 99.5, spo2: 96, weight: 24, height: 128 },
    visits: [
      { date: daysAgo(1), doctor: 'Dr. Ravi Kumar', type: 'OPD', diagnosis: 'Asthma exacerbation — mild', notes: 'Nebulization given. Inhalers prescribed.' },
    ],
    prescriptions: [
      { date: daysAgo(1), drug: 'Salbutamol MDI 100mcg', dose: '2 puffs as needed', duration: '30 days', prescribedBy: 'Dr. Ravi Kumar' },
    ],
    labReports: [],
    billing: []
  },
  {
    id: 'p9', hospitalId: 'h1',
    name: 'Deepak Nair', age: 53, gender: 'Male', bloodGroup: 'AB+',
    phone: '+91 99001 90009', email: 'deepak.nair@email.com',
    address: '21 Kandivali East, Mumbai', emergencyContact: 'Latha Nair (+91 99001 90010)',
    allergies: [], medicalHistory: ['Type 2 Diabetes', 'Hypercholesterolemia'],
    insurance: 'Max Bupa — Policy #MB2023067',
    assignedDoctor: 's1', department: 'General Medicine',
    registeredDate: daysAgo(90), lastVisit: daysAgo(8),
    status: 'OPD', patientId: 'MH-APL-009',
    vitals: { bp: '132/86', pulse: 72, temp: 98.4, spo2: 98, weight: 88, height: 174 },
    visits: [
      { date: daysAgo(8), doctor: 'Dr. Aditya Kapoor', type: 'OPD', diagnosis: 'Diabetes mellitus — poor control', notes: 'Insulin added to regimen. Dietitian referral given.' },
    ],
    prescriptions: [],
    labReports: [
      { date: daysAgo(8), test: 'HbA1c', status: 'completed', result: '9.1% (Poor Control)', ordered: 'Dr. Aditya Kapoor' },
    ],
    billing: []
  },
  {
    id: 'p10', hospitalId: 'h1',
    name: 'Aarav Shah', age: 5, gender: 'Male', bloodGroup: 'O+',
    phone: '+91 99001 00010', email: null,
    address: '6 Goregaon West, Mumbai', emergencyContact: 'Meena Shah (Mother) +91 99001 00011',
    allergies: [], medicalHistory: [],
    insurance: null,
    assignedDoctor: 's5', department: 'Pediatrics',
    registeredDate: daysAgo(15), lastVisit: daysAgo(15),
    status: 'OPD', patientId: 'MH-APL-010',
    vitals: { bp: '90/58', pulse: 100, temp: 100.2, spo2: 97, weight: 18, height: 112 },
    visits: [
      { date: daysAgo(15), doctor: 'Dr. Ravi Kumar', type: 'OPD', diagnosis: 'Acute tonsillitis', notes: 'Antibiotics prescribed. Review in 7 days.' },
    ],
    prescriptions: [],
    labReports: [],
    billing: []
  },
];

// ── Appointments ────────────────────────────────────────────
const apptTime = (date, hour, min = 0) => `${date}T${String(hour).padStart(2,'0')}:${String(min).padStart(2,'0')}:00`;

export const appointments = [
  // Today
  { id: 'a1', hospitalId: 'h1', patientId: 'p1', doctorId: 's2', department: 'Cardiology', date: fmt(today), time: '09:00', status: 'confirmed', type: 'Follow-up', source: 'whatsapp', notes: 'Monthly cardiac review', token: 'C-001' },
  { id: 'a2', hospitalId: 'h1', patientId: 'p2', doctorId: 's7', department: 'Dermatology', date: fmt(today), time: '10:00', status: 'confirmed', type: 'Follow-up', source: 'admin', notes: 'Acne follow-up', token: 'D-001' },
  { id: 'a3', hospitalId: 'h1', patientId: 'p4', doctorId: 's5', department: 'Pediatrics', date: fmt(today), time: '10:30', status: 'completed', type: 'OPD', source: 'walkin', notes: 'Cold and fever', token: 'P-001' },
  { id: 'a4', hospitalId: 'h1', patientId: 'p7', doctorId: 's3', department: 'Orthopedics', date: fmt(today), time: '11:00', status: 'confirmed', type: 'Follow-up', source: 'phone', notes: 'Back pain review', token: 'O-001' },
  { id: 'a5', hospitalId: 'h1', patientId: 'p8', doctorId: 's5', department: 'Pediatrics', date: fmt(today), time: '11:30', status: 'no-show', type: 'OPD', source: 'whatsapp', notes: 'Asthma follow-up', token: 'P-002' },
  { id: 'a6', hospitalId: 'h1', patientId: 'p9', doctorId: 's1', department: 'General Medicine', date: fmt(today), time: '12:00', status: 'confirmed', type: 'OPD', source: 'whatsapp', notes: 'Diabetes review', token: 'G-001' },
  { id: 'a7', hospitalId: 'h1', patientId: 'p6', doctorId: 's6', department: 'Oncology', date: fmt(today), time: '14:00', status: 'pending', type: 'OPD', source: 'whatsapp', notes: 'Oncology follow-up', token: 'N-001' },
  { id: 'a8', hospitalId: 'h1', patientId: 'p5', doctorId: 's4', department: 'Neurology', date: fmt(today), time: '15:00', status: 'confirmed', type: 'Follow-up', source: 'admin', notes: 'Parkinson\'s quarterly', token: 'NR-001' },
  { id: 'a9', hospitalId: 'h1', patientId: 'p10', doctorId: 's5', department: 'Pediatrics', date: fmt(today), time: '16:00', status: 'confirmed', type: 'OPD', source: 'walkin', notes: 'Sore throat check', token: 'P-003' },

  // Yesterday
  { id: 'a10', hospitalId: 'h1', patientId: 'p8', doctorId: 's5', department: 'Pediatrics', date: daysAgo(1), time: '09:30', status: 'completed', type: 'OPD', source: 'whatsapp', notes: '', token: 'P-001' },
  { id: 'a11', hospitalId: 'h1', patientId: 'p1', doctorId: 's2', department: 'Cardiology', date: daysAgo(1), time: '10:00', status: 'completed', type: 'OPD', source: 'phone', notes: '', token: 'C-001' },
  { id: 'a12', hospitalId: 'h1', patientId: 'p3', doctorId: 's3', department: 'Orthopedics', date: daysAgo(1), time: '11:00', status: 'completed', type: 'IPD Review', source: 'admin', notes: 'Post-op day 13', token: 'O-002' },

  // Days ago
  { id: 'a13', hospitalId: 'h1', patientId: 'p6', doctorId: 's6', department: 'Oncology', date: daysAgo(3), time: '09:00', status: 'completed', type: 'Follow-up', source: 'admin', notes: '', token: 'N-001' },
  { id: 'a14', hospitalId: 'h1', patientId: 'p9', doctorId: 's1', department: 'General Medicine', date: daysAgo(3), time: '14:00', status: 'completed', type: 'OPD', source: 'whatsapp', notes: '', token: 'G-001' },
  { id: 'a15', hospitalId: 'h1', patientId: 'p2', doctorId: 's7', department: 'Dermatology', date: daysAgo(5), time: '10:00', status: 'cancelled', type: 'Follow-up', source: 'whatsapp', notes: 'Patient cancelled via WhatsApp', token: 'D-001' },
  { id: 'a16', hospitalId: 'h1', patientId: 'p7', doctorId: 's3', department: 'Orthopedics', date: daysAgo(7), time: '11:00', status: 'completed', type: 'OPD', source: 'phone', notes: '', token: 'O-001' },

  // Upcoming
  { id: 'a17', hospitalId: 'h1', patientId: 'p1', doctorId: 's2', department: 'Cardiology', date: daysAhead(2), time: '09:00', status: 'confirmed', type: 'Stress Test Review', source: 'admin', notes: 'Bring stress test report', token: 'C-001' },
  { id: 'a18', hospitalId: 'h1', patientId: 'p5', doctorId: 's4', department: 'Neurology', date: daysAhead(3), time: '15:00', status: 'confirmed', type: 'Follow-up', source: 'admin', notes: '', token: 'NR-001' },
  { id: 'a19', hospitalId: 'h1', patientId: 'p2', doctorId: 's7', department: 'Dermatology', date: daysAhead(5), time: '11:00', status: 'pending', type: 'Follow-up', source: 'whatsapp', notes: '', token: 'D-001' },
  { id: 'a20', hospitalId: 'h1', patientId: 'p9', doctorId: 's1', department: 'General Medicine', date: daysAhead(7), time: '10:00', status: 'confirmed', type: 'OPD', source: 'whatsapp', notes: 'Sugar level review', token: 'G-001' },
  { id: 'a21', hospitalId: 'h1', patientId: 'p7', doctorId: 's3', department: 'Orthopedics', date: daysAhead(7), time: '12:00', status: 'confirmed', type: 'Follow-up', source: 'phone', notes: '', token: 'O-001' },
  { id: 'a22', hospitalId: 'h1', patientId: 'p4', doctorId: 's5', department: 'Pediatrics', date: daysAhead(10), time: '09:30', status: 'pending', type: 'OPD', source: 'whatsapp', notes: 'Annual check-up', token: 'P-001' },
  { id: 'a23', hospitalId: 'h1', patientId: 'p6', doctorId: 's6', department: 'Oncology', date: daysAhead(14), time: '14:00', status: 'confirmed', type: 'PET Scan Review', source: 'admin', notes: '', token: 'N-001' },
];

// ── Beds ────────────────────────────────────────────────────
export const beds = [
  // Ward A — General
  ...Array.from({ length: 20 }, (_, i) => ({
    id: `bed-A${i + 1}`, hospitalId: 'h1', ward: 'Ward A — General',
    number: `A${i + 1}`,
    status: i < 14 ? 'occupied' : i < 17 ? 'available' : i === 17 ? 'cleaning' : 'maintenance',
    patientId: i < 14 ? patients[i % patients.length]?.id : null,
    patientName: i < 14 ? patients[i % patients.length]?.name : null,
    admitDate: i < 14 ? daysAgo(Math.floor(Math.random() * 10) + 1) : null,
  })),
  // Ward B — Cardiology
  ...Array.from({ length: 12 }, (_, i) => ({
    id: `bed-B${i + 1}`, hospitalId: 'h1', ward: 'Ward B — Cardiology',
    number: `B${i + 1}`,
    status: i < 8 ? 'occupied' : i < 11 ? 'available' : 'cleaning',
    patientId: i < 8 ? patients[i % 3]?.id : null,
    patientName: i < 8 ? patients[i % 3]?.name : null,
    admitDate: i < 8 ? daysAgo(Math.floor(Math.random() * 7) + 1) : null,
  })),
  // ICU
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `bed-ICU${i + 1}`, hospitalId: 'h1', ward: 'ICU',
    number: `ICU-${i + 1}`,
    status: i < 5 ? 'occupied' : 'available',
    patientId: i < 5 ? patients[i]?.id : null,
    patientName: i < 5 ? patients[i]?.name : null,
    admitDate: i < 5 ? daysAgo(Math.floor(Math.random() * 5) + 1) : null,
  })),
];

// ── Platform Analytics ──────────────────────────────────────
export const platformAnalytics = {
  totalHospitals: 5,
  activeHospitals: 4,
  suspendedHospitals: 1,
  totalPatients: 955,
  totalStaff: 128,
  totalDoctors: 61,
  monthlyRevenue: 5400000,
  monthlyGrowth: 12.4,
  newHospitalsThisMonth: 1,
  newPatientsThisMonth: 87,
  appointmentsBySource: { whatsapp: 1240, walkin: 820, phone: 410, admin: 310 },
  monthlyTrend: [
    { month: 'Mar', hospitals: 3, patients: 620, revenue: 3800000 },
    { month: 'Apr', hospitals: 3, patients: 690, revenue: 4100000 },
    { month: 'May', hospitals: 4, patients: 730, revenue: 4400000 },
    { month: 'Jun', hospitals: 4, patients: 780, revenue: 4600000 },
    { month: 'Jul', hospitals: 5, patients: 870, revenue: 5100000 },
    { month: 'Aug', hospitals: 5, patients: 955, revenue: 5400000 },
  ]
};

// ── Billing / Invoices ──────────────────────────────────────
export const invoices = [
  { id: 'inv1', hospitalId: 'h1', patientId: 'p1', date: daysAgo(3), description: 'OPD Consultation — Cardiology', amount: 1200, status: 'paid', doctor: 'Dr. Meera Joshi' },
  { id: 'inv2', hospitalId: 'h1', patientId: 'p1', date: daysAgo(5), description: 'Lab Tests — Lipid Profile + HbA1c', amount: 2800, status: 'paid', doctor: 'Dr. Meera Joshi' },
  { id: 'inv3', hospitalId: 'h1', patientId: 'p3', date: daysAgo(14), description: 'TKR Surgery + IPD Package (Part)', amount: 185000, status: 'partial', doctor: 'Dr. Suresh Patel' },
  { id: 'inv4', hospitalId: 'h1', patientId: 'p2', date: daysAgo(7), description: 'OPD Consultation — Dermatology', amount: 900, status: 'paid', doctor: 'Dr. Priya Nambiar' },
  { id: 'inv5', hospitalId: 'h1', patientId: 'p4', date: daysAgo(2), description: 'OPD Consultation — Pediatrics', amount: 700, status: 'paid', doctor: 'Dr. Ravi Kumar' },
  { id: 'inv6', hospitalId: 'h1', patientId: 'p6', date: daysAgo(10), description: 'OPD Consultation + Lab — Oncology', amount: 3500, status: 'insurance', doctor: 'Dr. Sunita Rao' },
  { id: 'inv7', hospitalId: 'h1', patientId: 'p8', date: daysAgo(1), description: 'OPD Consultation + Nebulization', amount: 950, status: 'pending', doctor: 'Dr. Ravi Kumar' },
  { id: 'inv8', hospitalId: 'h1', patientId: 'p9', date: daysAgo(8), description: 'OPD Consultation + Lab — General Medicine', amount: 1600, status: 'paid', doctor: 'Dr. Aditya Kapoor' },
];

// ── Activity Feed ────────────────────────────────────────────
export const activityFeed = [
  { id: 'act1', type: 'whatsapp', icon: 'message-circle', color: 'green', text: 'New appointment booked via WhatsApp — Arvind Bose with Dr. Meera Joshi', time: '2 min ago' },
  { id: 'act2', type: 'checkin', icon: 'user-check', color: 'blue', text: 'Patient Anita Krishnan checked in — Token P-001 issued', time: '18 min ago' },
  { id: 'act3', type: 'appointment', icon: 'calendar', color: 'blue', text: 'Appointment completed — Dr. Ravi Kumar with Kavya Reddy', time: '34 min ago' },
  { id: 'act4', type: 'cancel', icon: 'x-circle', color: 'red', text: 'Appointment cancelled — Sunita Verma rescheduled via WhatsApp', time: '1 hr ago' },
  { id: 'act5', type: 'staff', icon: 'user-plus', color: 'amber', text: 'Dr. Ananya Singh marked on leave — 2 days', time: '2 hr ago' },
  { id: 'act6', type: 'lab', icon: 'flask-conical', color: 'blue', text: 'Lab report ready — Arvind Bose Lipid Profile', time: '3 hr ago' },
  { id: 'act7', type: 'whatsapp', icon: 'message-circle', color: 'green', text: 'New appointment booked via WhatsApp — Kavya Reddy with Dr. Ravi Kumar', time: '4 hr ago' },
  { id: 'act8', type: 'payment', icon: 'receipt', color: 'green', text: 'Payment received ₹2,800 — Arvind Bose (Lab Tests)', time: '5 hr ago' },
];

// ── Hospital Pharmacy Inventory ──────────────────────────────
export const pharmacyMedicines = [
  { id: 'med-1', hospitalId: 'h1', name: 'Atorvastatin 40mg', generic: 'Atorvastatin Calcium', category: 'Cardiovascular', form: 'Tablet', stock: 450, minStock: 100, price: 18.50, batchNo: 'BAT-2026-901', expiryDate: '2027-04-30', manufacturer: 'Sun Pharma', rackLocation: 'Rack C-02' },
  { id: 'med-2', hospitalId: 'h1', name: 'Metoprolol Succinate 25mg', generic: 'Metoprolol ER', category: 'Cardiovascular', form: 'Tablet', stock: 280, minStock: 80, price: 12.00, batchNo: 'BAT-2026-882', expiryDate: '2027-08-31', manufacturer: 'Cipla', rackLocation: 'Rack C-04' },
  { id: 'med-3', hospitalId: 'h1', name: 'Aspirin 75mg Gastro-Resistant', generic: 'Acetylsalicylic Acid', category: 'Cardiovascular', form: 'Tablet', stock: 600, minStock: 150, price: 4.50, batchNo: 'BAT-2026-771', expiryDate: '2028-01-31', manufacturer: 'Bayer India', rackLocation: 'Rack C-01' },
  { id: 'med-4', hospitalId: 'h1', name: 'Pantoprazole 40mg', generic: 'Pantoprazole Sodium', category: 'Gastroenterology', form: 'Tablet', stock: 820, minStock: 200, price: 9.80, batchNo: 'BAT-2026-664', expiryDate: '2027-11-30', manufacturer: 'Alkem Labs', rackLocation: 'Rack G-01' },
  { id: 'med-5', hospitalId: 'h1', name: 'Paracetamol 650mg (Dolo)', generic: 'Acetaminophen', category: 'Analgesics', form: 'Tablet', stock: 1200, minStock: 300, price: 3.20, batchNo: 'BAT-2026-551', expiryDate: '2027-12-31', manufacturer: 'Micro Labs', rackLocation: 'Rack A-01' },
  { id: 'med-6', hospitalId: 'h1', name: 'Cetirizine 10mg', generic: 'Cetirizine Hydrochloride', category: 'Antihistamines', form: 'Tablet', stock: 340, minStock: 100, price: 5.50, batchNo: 'BAT-2026-442', expiryDate: '2027-06-30', manufacturer: 'Dr. Reddy\'s', rackLocation: 'Rack H-02' },
  { id: 'med-7', hospitalId: 'h1', name: 'Tretinoin 0.025% Topical Gel', generic: 'All-trans-retinoic acid', category: 'Dermatology', form: 'Gel / Ointment', stock: 18, minStock: 30, price: 210.00, batchNo: 'BAT-2026-339', expiryDate: '2026-11-30', manufacturer: 'Galderma', rackLocation: 'Rack D-01', lowStock: true },
  { id: 'med-8', hospitalId: 'h1', name: 'Doxycycline 100mg', generic: 'Doxycycline Hyclate', category: 'Antibiotics', form: 'Capsule', stock: 190, minStock: 80, price: 14.50, batchNo: 'BAT-2026-228', expiryDate: '2027-09-30', manufacturer: 'Zydus Cadila', rackLocation: 'Rack B-03' },
  { id: 'med-9', hospitalId: 'h1', name: 'Salbutamol Inhaler 100mcg', generic: 'Albuterol Sulfate', category: 'Pulmonology', form: 'Inhaler / MDI', stock: 14, minStock: 25, price: 165.00, batchNo: 'BAT-2026-112', expiryDate: '2026-10-31', manufacturer: 'Cipla Respiratory', rackLocation: 'Rack P-01', lowStock: true },
  { id: 'med-10', hospitalId: 'h1', name: 'Insulin Glargine 100 IU/mL', generic: 'Long-Acting Insulin', category: 'Diabetology', form: 'Cartridge / Pen', stock: 45, minStock: 20, price: 680.00, batchNo: 'BAT-2026-098', expiryDate: '2027-03-31', manufacturer: 'Sanofi India', rackLocation: 'Cold Fridge 01' },
];

// ── Hospital Lab & Diagnostic Orders ────────────────────────
export const labOrders = [
  { id: 'LAB-901', hospitalId: 'h1', patientId: 'p1', patientName: 'Arvind Bose', doctor: 'Dr. Meera Joshi', testName: 'Lipid Profile Extended', department: 'Biochemistry', sampleType: 'Serum / Blood', sampleCollectedAt: daysAgo(5) + ' 08:30 AM', status: 'completed', resultSummary: 'Total: 220 mg/dL, LDL: 142 (High), HDL: 44, Triglycerides: 180', priority: 'routine', cost: 1200, reportUrl: '#' },
  { id: 'LAB-902', hospitalId: 'h1', patientId: 'p1', patientName: 'Arvind Bose', doctor: 'Dr. Meera Joshi', testName: 'HbA1c Glycated Hemoglobin', department: 'Biochemistry', sampleType: 'EDTA Blood', sampleCollectedAt: daysAgo(5) + ' 08:30 AM', status: 'completed', resultSummary: '7.2% (Fair Diabetes Control)', priority: 'routine', cost: 800, reportUrl: '#' },
  { id: 'LAB-903', hospitalId: 'h1', patientId: 'p1', patientName: 'Arvind Bose', doctor: 'Dr. Meera Joshi', testName: 'Treadmill Stress Test (TMT)', department: 'Cardiology Diagnostics', sampleType: 'Diagnostic Exercise ECG', sampleCollectedAt: null, status: 'processing', resultSummary: 'Scheduled today at 03:00 PM in Cardiac Wing', priority: 'urgent', cost: 2500, reportUrl: null },
  { id: 'LAB-904', hospitalId: 'h1', patientId: 'p3', patientName: 'Ramesh Gupta', doctor: 'Dr. Suresh Patel', testName: 'Digital X-Ray Right Knee AP/Lat', department: 'Radiology', sampleType: 'Digital Radiography', sampleCollectedAt: daysAgo(20), status: 'completed', resultSummary: 'Post-op alignment verified. Grade 4 Osteoarthritis pre-op resolved.', priority: 'routine', cost: 1100, reportUrl: '#' },
  { id: 'LAB-905', hospitalId: 'h1', patientId: 'p6', patientName: 'Fatima Sheikh', doctor: 'Dr. Sunita Rao', testName: 'CA-125 Ovarian Tumor Marker', department: 'Immunology', sampleType: 'Blood Serum', sampleCollectedAt: daysAgo(10), status: 'completed', resultSummary: '12 U/mL (Normal Reference < 35 U/mL)', priority: 'urgent', cost: 1800, reportUrl: '#' },
  { id: 'LAB-906', hospitalId: 'h1', patientId: 'p9', patientName: 'Deepak Nair', doctor: 'Dr. Aditya Kapoor', testName: 'Comprehensive Metabolic Panel + HbA1c', department: 'Biochemistry', sampleType: 'Blood', sampleCollectedAt: daysAgo(8), status: 'completed', resultSummary: 'Fasting Glucose: 198 mg/dL, HbA1c: 9.1% (High)', priority: 'routine', cost: 1600, reportUrl: '#' },
  { id: 'LAB-907', hospitalId: 'h1', patientId: 'p7', patientName: 'Sanjay Malhotra', doctor: 'Dr. Suresh Patel', testName: 'MRI Lumbar Spine (L1-S1)', department: 'Radiology / Imaging', sampleType: '1.5T MRI Scan', sampleCollectedAt: daysAgo(4), status: 'completed', resultSummary: 'L4-L5 disc protrusion causing mild thecal sac compression', priority: 'routine', cost: 6500, reportUrl: '#' },
  { id: 'LAB-908', hospitalId: 'h1', patientId: 'p4', patientName: 'Anita Krishnan', doctor: 'Dr. Ravi Kumar', testName: 'Complete Blood Count (CBC) + ESR', department: 'Hematology', sampleType: 'EDTA Whole Blood', sampleCollectedAt: 'Today, 09:15 AM', status: 'processing', resultSummary: 'Sample in automated cell counter', priority: 'urgent', cost: 650, reportUrl: null }
];

// ── Hospital Subscription Plans ──────────────────────────────
export const subscriptionPlans = [
  { id: 'starter', name: 'Starter', price: 9999, features: ['Up to 3 Doctors', '5 Departments', 'WhatsApp Booking', 'Basic Reports', 'Email Support'], maxDoctors: 3, maxDepts: 5 },
  { id: 'professional', name: 'Professional', price: 24999, features: ['Up to 15 Doctors', '10 Departments', 'WhatsApp Booking', 'Advanced Analytics', 'Billing Module', 'Priority Support'], maxDoctors: 15, maxDepts: 10 },
  { id: 'enterprise', name: 'Enterprise', price: 49999, features: ['Unlimited Doctors', 'All Departments', 'WhatsApp Booking', 'Full Analytics', 'Bed Management', 'Lab Integration', '24/7 Support', 'Custom Branding'], maxDoctors: null, maxDepts: null },
];

// ── Platform Invoice History (for super admin billing view) ──
export const platformInvoices = [
  { id: 'pi1', hospitalId: 'h1', hospitalName: 'Apollo Multi-Specialty Hospital', plan: 'Enterprise', amount: 49999, date: daysAgo(5), dueDate: daysAhead(25), status: 'paid' },
  { id: 'pi2', hospitalId: 'h2', hospitalName: 'Sunshine Cardiac Care Centre', plan: 'Professional', amount: 24999, date: daysAgo(5), dueDate: daysAhead(25), status: 'paid' },
  { id: 'pi3', hospitalId: 'h3', hospitalName: 'Green Valley Family Clinic', plan: 'Starter', amount: 9999, date: daysAgo(5), dueDate: daysAhead(25), status: 'paid' },
  { id: 'pi4', hospitalId: 'h4', hospitalName: 'MedLife Ortho & Spine Institute', plan: 'Professional', amount: 24999, date: daysAgo(5), dueDate: daysAhead(25), status: 'pending' },
  { id: 'pi5', hospitalId: 'h5', hospitalName: 'CityHeal General Hospital', plan: 'Enterprise', amount: 49999, date: daysAgo(35), dueDate: daysAgo(5), status: 'overdue' },
];

// ── Doctor Prescription Templates ────────────────────────────
export const prescriptionTemplates = [
  {
    id: 'tmpl-1',
    doctorId: 's2',
    name: 'Hypertension & Lipid Standard Protocol',
    category: 'Cardiology',
    diagnosis: 'Essential Hypertension (I10) + Mixed Dyslipidemia',
    notes: 'Low sodium diet (<2g/day), daily 30-min brisk walk. Monitor BP daily.',
    drugs: [
      { drug: 'Telmisartan 40mg', dose: '1 tab once daily (morning)', duration: '90 days', instructions: 'After breakfast' },
      { drug: 'Atorvastatin 20mg', dose: '1 tab at bedtime', duration: '90 days', instructions: 'Post dinner' },
      { drug: 'Aspirin 75mg Gastro-Resistant', dose: '1 tab once daily', duration: '90 days', instructions: 'After lunch' }
    ],
    recommendedLabs: ['Lipid Profile Extended', 'Serum Creatinine & Electrolytes', '12-Lead ECG']
  },
  {
    id: 'tmpl-2',
    doctorId: 's1',
    name: 'Type 2 Diabetes Mellitus — Dual Therapy',
    category: 'General Medicine',
    diagnosis: 'Type 2 Diabetes Mellitus with Poor Glycemic Control (E11.65)',
    notes: 'Diabetic diet plan given. Follow-up HbA1c in 3 months.',
    drugs: [
      { drug: 'Metformin 500mg SR', dose: '1 tab twice daily', duration: '60 days', instructions: 'With breakfast & dinner' },
      { drug: 'Glimepiride 1mg', dose: '1 tab before breakfast', duration: '60 days', instructions: '30 mins before food' }
    ],
    recommendedLabs: ['HbA1c Glycated Hemoglobin', 'Fasting & Post-Prandial Glucose', 'Urine Microalbumin']
  },
  {
    id: 'tmpl-3',
    doctorId: 's5',
    name: 'Acute Upper Respiratory Tract Infection (Pediatric/Adult)',
    category: 'Pediatrics / General',
    diagnosis: 'Acute Nasopharyngitis & Bronchospasm (J00)',
    notes: 'Steam inhalation twice daily. Adequate oral hydration.',
    drugs: [
      { drug: 'Paracetamol 500mg / 250mg', dose: '1 tab as needed for fever', duration: '5 days', instructions: 'Min 6 hours gap' },
      { drug: 'Cetirizine 5mg / 10mg', dose: '1 tab at night', duration: '5 days', instructions: 'At bedtime' },
      { drug: 'Salbutamol Inhaler 100mcg', dose: '2 puffs SOS for wheeze', duration: '15 days', instructions: 'Use spacer if child' }
    ],
    recommendedLabs: ['Complete Blood Count (CBC)']
  },
  {
    id: 'tmpl-4',
    doctorId: 's3',
    name: 'Osteoarthritis Joint Pain Conservative Care',
    category: 'Orthopedics',
    diagnosis: 'Bilateral Knee Osteoarthritis Grade 2-3 (M17.0)',
    notes: 'Quadriceps strengthening exercises. Avoid squatting and cross-legged sitting.',
    drugs: [
      { drug: 'Pantoprazole 40mg', dose: '1 tab before breakfast', duration: '14 days', instructions: 'Empty stomach' },
      { drug: 'Aceclofenac 100mg + Paracetamol 325mg', dose: '1 tab twice daily', duration: '7 days', instructions: 'After food only' },
      { drug: 'Calcium Carbonate 500mg + Vit D3', dose: '1 tab daily', duration: '60 days', instructions: 'After lunch' }
    ],
    recommendedLabs: ['Digital X-Ray Knee AP/Lateral', 'Serum Uric Acid']
  }
];

// ── Doctor Leave & Roster Requests ───────────────────────────
export const doctorLeaves = [
  { id: 'lev-1', doctorId: 's4', doctorName: 'Dr. Ananya Singh', department: 'Neurology', type: 'Conference Leave', startDate: daysAhead(5), endDate: daysAhead(7), days: 3, coveringDoctor: 'Dr. Aditya Kapoor', reason: 'Attending National Neurology Summit, New Delhi', status: 'approved' },
  { id: 'lev-2', doctorId: 's2', doctorName: 'Dr. Meera Joshi', department: 'Cardiology', type: 'Annual Leave', startDate: daysAhead(18), endDate: daysAhead(22), days: 5, coveringDoctor: 'Dr. Sunita Rao', reason: 'Family vacation', status: 'pending' },
  { id: 'lev-3', doctorId: 's3', doctorName: 'Dr. Suresh Patel', department: 'Orthopedics', type: 'Medical Leave', startDate: daysAgo(10), endDate: daysAgo(8), days: 2, coveringDoctor: 'Dr. Ravi Kumar', reason: 'Viral fever recovery', status: 'completed' }
];

// ── Doctor-to-Doctor Internal Referrals ──────────────────────
export const doctorReferrals = [
  { id: 'ref-1', hospitalId: 'h1', patientId: 'p1', patientName: 'Arvind Bose', fromDoctorId: 's2', fromDoctorName: 'Dr. Meera Joshi', toDoctorId: 's1', toDoctorName: 'Dr. Aditya Kapoor', toDepartment: 'General Medicine', reason: 'Uncontrolled glycemic spikes impacting cardiovascular risk profile. Kindly optimize oral hypoglycemic therapy.', priority: 'priority', date: daysAgo(2), status: 'completed' },
  { id: 'ref-2', hospitalId: 'h1', patientId: 'p7', patientName: 'Sanjay Malhotra', fromDoctorId: 's3', fromDoctorName: 'Dr. Suresh Patel', toDoctorId: 's4', toDoctorName: 'Dr. Ananya Singh', toDepartment: 'Neurology', reason: 'L4-L5 disc protrusion with radiculopathy and progressive right foot numbness. Rule out nerve compression.', priority: 'urgent', date: daysAgo(1), status: 'pending' }
];

// ── WhatsApp Bot Config ──────────────────────────────────────
export const whatsappConfig = {
  businessNumber: '+91 98765 43210',
  welcomeMessage: 'Hello! 👋 Welcome to Apollo Multi-Specialty Hospital. I\'m MediBot, your appointment assistant. Would you like to book an appointment?',
  workingHours: '8:00 AM – 8:00 PM (Mon–Sat)',
  autoReminderHours: 24,
  departments: ['Cardiology', 'Orthopedics', 'Neurology', 'Pediatrics', 'Oncology', 'Dermatology', 'General Medicine'],
  templateLanguage: 'en_IN',
  webhookStatus: 'connected',
  dailyQuota: 5000,
  dailyUsed: 1420
};

// ── Super Admin Platform Team (User & Role Management) ──────
export const platformUsers = [
  {
    id: 'pu1',
    name: 'Aakash Verma',
    email: 'aakash@medicore.io',
    role: 'Super Admin',
    permissions: ['all'],
    status: 'active',
    lastActive: '10 min ago',
    avatarColor: '#0B5FA5',
    twoFactor: true
  },
  {
    id: 'pu2',
    name: 'Sneha Kulkarni',
    email: 'sneha.k@medicore.io',
    role: 'Billing & Operations Admin',
    permissions: ['billing_read', 'billing_write', 'hospitals_read', 'analytics_read'],
    status: 'active',
    lastActive: '1 hr ago',
    avatarColor: '#0F7A6C',
    twoFactor: true
  },
  {
    id: 'pu3',
    name: 'Tariq Mansoor',
    email: 'tariq@medicore.io',
    role: 'Support & Onboarding Lead',
    permissions: ['support_read', 'support_write', 'hospitals_read', 'whatsapp_manage'],
    status: 'active',
    lastActive: '25 min ago',
    avatarColor: '#D97706',
    twoFactor: true
  },
  {
    id: 'pu4',
    name: 'Elena Rostova',
    email: 'elena@medicore.io',
    role: 'Security & Compliance Officer',
    permissions: ['audit_read', 'security_manage', 'compliance_read', 'compliance_write'],
    status: 'active',
    lastActive: 'Yesterday',
    avatarColor: '#7c3aed',
    twoFactor: true
  }
];

// ── Support / Ticketing Helpdesk ─────────────────────────────
export const supportTickets = [
  {
    id: 'TICK-1042',
    hospitalId: 'h1',
    hospitalName: 'Apollo Multi-Specialty Hospital',
    requesterName: 'Rajesh Mehta (Admin)',
    email: 'rajesh.mehta@apollomumbai.com',
    subject: 'Request custom OPD receipt template with NABH Accreditation Logo',
    category: 'Customization',
    priority: 'medium',
    status: 'in-progress',
    assignee: 'Tariq Mansoor',
    createdAt: daysAgo(1),
    updatedAt: '3 hrs ago',
    messages: [
      { sender: 'Rajesh Mehta', role: 'customer', text: 'We need our official NABH accreditation number and logo printed on the patient OPD consultation invoices.', time: daysAgo(1) },
      { sender: 'Tariq Mansoor', role: 'support', text: 'Hi Rajesh, please upload the vector SVG logo and accreditation string. We are deploying custom headers in the next release.', time: '3 hrs ago' }
    ]
  },
  {
    id: 'TICK-1041',
    hospitalId: 'h2',
    hospitalName: 'Sunshine Cardiac Care Centre',
    requesterName: 'Dr. Priya Nair',
    email: 'priya.nair@sunshinecardiac.com',
    subject: 'WhatsApp appointment confirmation delay (~2 min lag)',
    category: 'WhatsApp & Bot',
    priority: 'high',
    status: 'open',
    assignee: 'Aakash Verma',
    createdAt: daysAgo(2),
    updatedAt: '1 day ago',
    messages: [
      { sender: 'Dr. Priya Nair', role: 'customer', text: 'Patients are reporting that after selecting Dr. Nair, the token message arrives after 2 minutes instead of instantaneously.', time: daysAgo(2) }
    ]
  },
  {
    id: 'TICK-1039',
    hospitalId: 'h5',
    hospitalName: 'CityHeal General Hospital',
    requesterName: 'Vijay Krishnan',
    email: 'admin@cityheal.in',
    subject: 'Billing query regarding overdue invoice & suspension grace period',
    category: 'Billing',
    priority: 'urgent',
    status: 'open',
    assignee: 'Sneha Kulkarni',
    createdAt: daysAgo(3),
    updatedAt: '2 days ago',
    messages: [
      { sender: 'Vijay Krishnan', role: 'customer', text: 'Our accounts team is processing invoice PI-5. Please extend our grace period by 5 days before suspending.', time: daysAgo(3) }
    ]
  },
  {
    id: 'TICK-1035',
    hospitalId: 'h3',
    hospitalName: 'Green Valley Family Clinic',
    requesterName: 'Arun Sharma',
    email: 'arun@greenvalley.clinic',
    subject: 'Add 2 additional doctor seats under Starter Plan',
    category: 'Plan & Billing',
    priority: 'low',
    status: 'resolved',
    assignee: 'Sneha Kulkarni',
    createdAt: daysAgo(6),
    updatedAt: daysAgo(4),
    messages: [
      { sender: 'Arun Sharma', role: 'customer', text: 'We have onboarded 2 visiting consultants. How do we add them?', time: daysAgo(6) },
      { sender: 'Sneha Kulkarni', role: 'support', text: 'Upgraded Green Valley to Starter+ add-on. Seats are now unlocked in your Staff Directory.', time: daysAgo(4) }
    ]
  }
];

// ── Platform Actionable Notifications & Alerts ──────────────
export const platformAlerts = [
  {
    id: 'alt-1',
    severity: 'critical',
    title: 'Payment Overdue & Suspension Warning',
    message: 'CityHeal General Hospital invoice ₹49,999 is 35 days overdue. Automated suspension scheduled in 48 hours.',
    hospitalId: 'h5',
    hospitalName: 'CityHeal General Hospital',
    timestamp: '2 hours ago',
    actionRequired: 'Review Grace Period / Suspend Tenant',
    actionRoute: '/sa/billing',
    acknowledged: false
  },
  {
    id: 'alt-2',
    severity: 'warning',
    title: 'High ICU Bed Occupancy Alert',
    message: 'Apollo Multi-Specialty Hospital reached 92% ICU bed capacity. 7 of 8 critical care beds are filled.',
    hospitalId: 'h1',
    hospitalName: 'Apollo Multi-Specialty Hospital',
    timestamp: '4 hours ago',
    actionRequired: 'View Hospital Monitor',
    actionRoute: '/sa/hospitals/h1',
    acknowledged: false
  },
  {
    id: 'alt-3',
    severity: 'info',
    title: 'New Hospital Onboarded',
    message: 'MedLife Ortho & Spine Institute completed onboarding wizard and published 4 departments.',
    hospitalId: 'h4',
    hospitalName: 'MedLife Ortho & Spine Institute',
    timestamp: 'Yesterday',
    actionRequired: 'Verify Credentials',
    actionRoute: '/sa/hospitals/h4',
    acknowledged: true
  },
  {
    id: 'alt-4',
    severity: 'warning',
    title: 'WhatsApp Daily Quota Reached 70%',
    message: 'Global WhatsApp message volume reached 3,500 / 5,000 daily tier. Consider upgrading Meta Cloud API capacity.',
    hospitalId: null,
    hospitalName: 'Platform Global',
    timestamp: 'Yesterday',
    actionRequired: 'Manage WhatsApp Quota',
    actionRoute: '/sa/whatsapp-hub',
    acknowledged: false
  },
  {
    id: 'alt-5',
    severity: 'info',
    title: 'Automated Database Backup Completed',
    message: 'Encrypted snapshot for 5 tenant hospital databases generated and stored in cold storage.',
    hospitalId: null,
    hospitalName: 'System Infrastructure',
    timestamp: '2 days ago',
    actionRequired: 'View Audit Logs',
    actionRoute: '/sa/settings',
    acknowledged: true
  }
];

// ── Healthcare Audit Logs ────────────────────────────────────
export const auditLogs = [
  {
    id: 'aud-991',
    timestamp: daysAgo(0) + ' 11:42:18',
    user: 'Aakash Verma (Super Admin)',
    action: 'Hospital Status Changed',
    details: 'Changed status of CityHeal General Hospital to Suspended (Billing non-compliance)',
    tenant: 'CityHeal General Hospital',
    ipAddress: '103.21.14.92',
    severity: 'warning'
  },
  {
    id: 'aud-990',
    timestamp: daysAgo(0) + ' 09:15:04',
    user: 'Tariq Mansoor',
    action: 'WhatsApp Bot Script Updated',
    details: 'Updated default appointment reminder timing to 24h before slot',
    tenant: 'Global Platform',
    ipAddress: '103.21.14.95',
    severity: 'info'
  },
  {
    id: 'aud-989',
    timestamp: daysAgo(1) + ' 16:30:22',
    user: 'Sneha Kulkarni',
    action: 'Invoice Generated',
    details: 'Generated monthly billing invoice PI-5 for ₹49,999 (Enterprise Plan)',
    tenant: 'Apollo Multi-Specialty Hospital',
    ipAddress: '103.21.14.93',
    severity: 'info'
  },
  {
    id: 'aud-988',
    timestamp: daysAgo(2) + ' 14:05:11',
    user: 'Elena Rostova',
    action: 'Security Policy Modified',
    details: 'Enforced mandatory 2FA authentication for all Hospital Administrator accounts',
    tenant: 'All Tenants',
    ipAddress: '49.36.110.12',
    severity: 'critical'
  },
  {
    id: 'aud-987',
    timestamp: daysAgo(3) + ' 10:20:45',
    user: 'Aakash Verma',
    action: 'Tenant Onboarded',
    details: 'Completed registration wizard for MedLife Ortho & Spine Institute',
    tenant: 'MedLife Ortho & Spine Institute',
    ipAddress: '103.21.14.92',
    severity: 'info'
  },
  {
    id: 'aud-986',
    timestamp: daysAgo(4) + ' 18:00:00',
    user: 'System Automated Job',
    action: 'Daily Data Integrity Check',
    details: 'Verified HIPAA compliance checksums across 955 patient EMR records',
    tenant: 'Platform Database',
    ipAddress: '127.0.0.1',
    severity: 'info'
  }
];
