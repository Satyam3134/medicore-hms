// ============================================================
// toast.js — Toast Notification System
// ============================================================

const container = () => document.getElementById('toast-container');

let toastId = 0;

export function showToast({ title, message, type = 'info', duration = 4000, icon = null }) {
  const id = ++toastId;
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.id = `toast-${id}`;

  const iconMap = {
    info: 'info',
    success: 'check-circle',
    warning: 'alert-triangle',
    danger: 'x-circle',
    wa: 'message-circle',
  };

  const iconName = icon || iconMap[type] || 'info';
  const iconColor = type === 'success' ? 'var(--color-success)' :
    type === 'warning' ? 'var(--color-warning)' :
    type === 'danger' ? 'var(--color-danger)' :
    type === 'wa' ? '#25D366' : 'var(--color-primary)';

  el.innerHTML = `
    <div class="toast-icon">
      <i data-lucide="${iconName}" style="width:18px;height:18px;color:${iconColor}"></i>
    </div>
    <div class="toast-body">
      <div class="toast-title">${title}</div>
      ${message ? `<div class="toast-msg">${message}</div>` : ''}
    </div>
    <button class="toast-close" onclick="document.getElementById('toast-${id}').remove()">
      <i data-lucide="x" style="width:14px;height:14px"></i>
    </button>
  `;

  container().appendChild(el);
  lucide.createIcons({ el });

  if (duration > 0) {
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateX(100%)';
      el.style.transition = 'all 0.3s ease';
      setTimeout(() => el.remove(), 300);
    }, duration);
  }

  return id;
}

export function showWhatsAppToast(patientName, doctorName) {
  showToast({
    title: 'New WhatsApp Booking',
    message: `${patientName} booked with ${doctorName}`,
    type: 'wa',
    icon: 'message-circle',
    duration: 6000,
  });
}

// Simulated real-time events for demo purposes
const simulatedEvents = [
  { title: '📱 New WhatsApp Booking', message: 'Priya Nair booked with Dr. Aditya Kapoor — General Medicine', type: 'wa' },
  { title: '📱 WhatsApp Booking', message: 'Rahul Verma booked Cardiology — Tomorrow 10:00 AM', type: 'wa' },
  { title: '✅ Appointment Confirmed', message: 'Token TKN-0089 — Sonia Mehta checked in', type: 'success' },
  { title: '⚠️ Bed Alert', message: 'ICU Ward B is at 90% capacity', type: 'warning' },
  { title: '📱 WhatsApp Booking', message: 'Ramesh Kumar scheduled Orthopedics — Dr. Rajesh Mehta', type: 'wa' },
];

let pollingInterval = null;

export function startToastPolling() {
  if (pollingInterval) return;
  let idx = 0;
  // First toast after 12s, then every 40-60s
  const fire = () => {
    const ev = simulatedEvents[idx % simulatedEvents.length];
    showToast({ ...ev, duration: 7000 });
    idx++;
  };
  setTimeout(() => {
    fire();
    pollingInterval = setInterval(fire, 45000);
  }, 12000);
}
