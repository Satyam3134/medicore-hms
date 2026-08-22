// ============================================================
// whatsapp/demo.js — WhatsApp Booking & Live QR Code Center
// ============================================================

import { renderSidebar } from '../../components/sidebar.js';
import { renderTopbar } from '../../components/topbar.js';
import { get } from '../../store.js';
import { showToast } from '../../components/toast.js';
import { renderQRCode, getQRCodeDataURL, buildWhatsAppLink } from '../../components/qrGenerator.js';
import { refreshIcons } from '../../components/icons.js';

const BOT_NAME = 'MediCore HMS Bot';
const getHospitalName = () => {
  const h = get('hospitals').find(h => h.id === get('currentHospitalId'));
  return h?.name || 'Apollo Multi-Specialty Hospital';
};

let activeTab = 'simulation'; // 'simulation' | 'qr_standee'
let chatState = 'welcome';
let selectedHospital = null;
let selectedDept = null;
let selectedDoctor = null;
let selectedDate = null;
let selectedTime = null;
let patientName = null;
let patientPhone = null;
let messages = [];

// QR Generator State
let qrConfig = {
  hospitalId: 'h1',
  department: '',
  phone: '919876543210',
  qrColor: '#0B5FA5',
  targetType: 'whatsapp', // 'whatsapp' | 'webapp'
};

function resetChat() {
  chatState = 'welcome';
  selectedHospital = null;
  selectedDept = null;
  selectedDoctor = null;
  selectedDate = null;
  selectedTime = null;
  patientName = null;
  patientPhone = null;
  messages = [];
  addBotMessage(`👋 *Welcome to ${getHospitalName()}!*\n\nI'm MediCore HMS, your automated appointment booking assistant on WhatsApp.\n\nI can help you:\n📅 Book an appointment\n🔍 Check your appointment status\n❌ Cancel or reschedule\n\nReply with a number to continue:`, [
    '1. Book Appointment',
    '2. Check Appointment Status',
    '3. Cancel / Reschedule',
    '4. Hospital Information',
  ]);
}

function addBotMessage(text, quickReplies = [], delay = 800) {
  const id = 'msg_' + Date.now() + Math.random();
  messages.push({ id, role: 'bot', text, quickReplies, ts: new Date() });
  renderMessages();
  return id;
}

function addUserMessage(text) {
  messages.push({ id: 'u_' + Date.now(), role: 'user', text, ts: new Date() });
  renderMessages();
}

function scrollBottom() {
  const msgs = document.getElementById('wa-messages');
  if (msgs) msgs.scrollTop = msgs.scrollHeight;
}

function renderMessages() {
  const container = document.getElementById('wa-messages');
  if (!container) return;

  container.innerHTML = messages.map(m => {
    const time = m.ts.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    if (m.role === 'bot') {
      return `
        <div class="wa-msg-row bot">
          <div class="wa-avatar-bot">HC</div>
          <div class="wa-bubble bot">
            <div class="wa-sender">${BOT_NAME}</div>
            <div class="wa-text">${m.text.replace(/\n/g, '<br>').replace(/\*(.*?)\*/g, '<strong>$1</strong>').replace(/\_(.*?)\_/g, '<em>$1</em>')}</div>
            ${m.quickReplies?.length > 0 ? `
              <div class="wa-quick-replies">
                ${m.quickReplies.map(r => `
                  <button class="wa-reply-btn" onclick="handleQuickReply('${r.replace(/'/g, "\\'")}')">${r}</button>
                `).join('')}
              </div>
            ` : ''}
            <div class="wa-time">${time} ✓</div>
          </div>
        </div>
      `;
    } else {
      return `
        <div class="wa-msg-row user">
          <div class="wa-bubble user">
            <div class="wa-text">${m.text.replace(/\n/g, '<br>')}</div>
            <div class="wa-time">${time} ✓✓</div>
          </div>
        </div>
      `;
    }
  }).join('');

  setTimeout(scrollBottom, 50);
}

function simulateTyping(duration = 1000) {
  return new Promise(resolve => {
    const container = document.getElementById('wa-messages');
    const div = document.createElement('div');
    div.className = 'wa-msg-row bot';
    div.id = 'wa-typing';
    div.innerHTML = `
      <div class="wa-avatar-bot">HC</div>
      <div class="wa-bubble bot">
        <div class="wa-typing-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;
    if (container) {
      container.appendChild(div);
      scrollBottom();
    }
    setTimeout(() => {
      div.remove();
      resolve();
    }, duration);
  });
}

async function handleQuickReply(reply) {
  addUserMessage(reply);

  const replyLower = reply.toLowerCase().trim();
  const isNum = (n) => replyLower.startsWith(n + '.');

  await simulateTyping();

  if (chatState === 'welcome') {
    if (isNum('1') || replyLower.includes('book')) {
      chatState = 'select_dept';
      const departments = get('departments').filter(d => d.hospitalId === get('currentHospitalId'));
      addBotMessage(
        `Great! Let's book an appointment at *${getHospitalName()}*.\n\nWhich department would you like to visit?`,
        departments.map((d, i) => `${i+1}. ${d.name}`)
      );
    } else if (isNum('2') || replyLower.includes('check')) {
      chatState = 'check_status';
      addBotMessage('Please enter your *appointment token* (e.g. TKN-0012) or registered phone number to check your status.');
    } else if (isNum('3') || replyLower.includes('cancel')) {
      chatState = 'cancel';
      addBotMessage('Please enter your *appointment token* (e.g. TKN-0012) to cancel or reschedule.');
    } else if (isNum('4') || replyLower.includes('info')) {
      const h = get('hospitals').find(h => h.id === get('currentHospitalId'));
      addBotMessage(
        `🏥 *${h?.name}*\n📍 ${h?.address}\n📞 ${h?.phone}\n\n🕐 OPD Hours: Mon–Sat, 9 AM – 6 PM\n🚨 Emergency: 24×7\n\nWould you like to book an appointment?`,
        ['1. Book Appointment', '2. Back to Main Menu']
      );
    } else {
      addBotMessage('Please select one of the options below to proceed:', [
        '1. Book Appointment', '2. Check Appointment Status', '3. Cancel / Reschedule', '4. Hospital Information'
      ]);
    }
  } else if (chatState === 'select_dept') {
    const departments = get('departments').filter(d => d.hospitalId === get('currentHospitalId'));
    const deptIndex = parseInt(replyLower) - 1;
    const deptByNum = departments[deptIndex];
    const deptByName = departments.find(d => replyLower.includes(d.name.toLowerCase()));
    const dept = deptByNum || deptByName;

    if (dept) {
      selectedDept = dept;
      chatState = 'select_doctor';
      const doctors = get('staff').filter(s => s.hospitalId === get('currentHospitalId') && s.role === 'Doctor' && s.department === dept.name);
      if (doctors.length === 0) {
        addBotMessage(`No doctors currently available in ${dept.name}. Please select another department.`, ['← Back to Departments', '0. Main Menu']);
        chatState = 'select_dept';
      } else {
        addBotMessage(
          `👨‍⚕️ Available doctors in *${dept.name}*:`,
          doctors.map((d, i) => `${i+1}. ${d.name}${d.consultationFee ? ' — ₹' + d.consultationFee : ''}`)
        );
      }
    } else {
      addBotMessage('Please choose a valid department number from the list:', departments.map((d, i) => `${i+1}. ${d.name}`));
    }
  } else if (chatState === 'select_doctor') {
    const doctors = get('staff').filter(s => s.hospitalId === get('currentHospitalId') && s.role === 'Doctor' && s.department === selectedDept?.name);
    const idx = parseInt(replyLower) - 1;
    const docByNum = doctors[idx];
    const docByName = doctors.find(d => replyLower.includes(d.name.split(' ').pop().toLowerCase()));
    const doc = docByNum || docByName;
    if (doc) {
      selectedDoctor = doc;
      chatState = 'select_date';
      const dates = getNextDates(5);
      addBotMessage(
        `📅 You selected *${doc.name}* (${doc.specialization || doc.department}).\n\nPlease select your preferred date:`,
        dates.map(d => d.display)
      );
    } else {
      addBotMessage('Please select a doctor number from the list above.', doctors.map((d, i) => `${i+1}. ${d.name}`));
    }
  } else if (chatState === 'select_date') {
    const dates = getNextDates(5);
    const idx = parseInt(replyLower) - 1;
    const picked = dates[idx];
    if (picked) {
      selectedDate = picked;
      chatState = 'select_time';
      addBotMessage(
        `🕐 Preferred time slot on *${picked.display}*:`,
        ['1. 09:00 AM', '2. 10:00 AM', '3. 11:00 AM', '4. 02:00 PM', '5. 03:00 PM', '6. 04:00 PM']
      );
    } else {
      addBotMessage('Please choose one of the available dates:', dates.map(d => d.display));
    }
  } else if (chatState === 'select_time') {
    const times = [{ display: '09:00 AM', val: '09:00' }, { display: '10:00 AM', val: '10:00' }, { display: '11:00 AM', val: '11:00' }, { display: '02:00 PM', val: '14:00' }, { display: '03:00 PM', val: '15:00' }, { display: '04:00 PM', val: '16:00' }];
    const idx = parseInt(replyLower) - 1;
    const picked = times[idx];
    if (picked) {
      selectedTime = picked;
      chatState = 'collect_name';
      addBotMessage('Great! Please enter the *Patient Full Name*:');
    } else {
      addBotMessage('Please choose a time slot:', times.map((t, i) => `${i+1}. ${t.display}`));
    }
  } else if (chatState === 'collect_name') {
    patientName = reply.trim();
    chatState = 'collect_phone';
    addBotMessage(`Thank you, *${patientName}*! Please enter your *10-digit mobile number* for confirmation:`);
  } else if (chatState === 'collect_phone') {
    patientPhone = reply.replace(/\s/g, '');
    chatState = 'confirm';
    addBotMessage(
      `📋 *Appointment Booking Summary*\n\n🏥 Hospital: ${getHospitalName()}\n🏬 Department: ${selectedDept?.name}\n👨‍⚕️ Doctor: ${selectedDoctor?.name}\n📅 Date: ${selectedDate?.display}\n🕐 Time: ${selectedTime?.display}\n👤 Patient: ${patientName}\n📱 Contact: ${patientPhone}\n💰 Fee: ₹${selectedDoctor?.consultationFee || 'N/A'}\n\nShall I confirm this booking?`,
      ['✅ Yes, Confirm Booking', '✏️ Edit Details', '❌ Cancel']
    );
  } else if (chatState === 'confirm') {
    if (replyLower.includes('yes') || replyLower.includes('confirm')) {
      chatState = 'done';
      const token = `TKN-${String(Math.floor(Math.random() * 9000) + 1000)}`;
      await simulateTyping(1800);
      addBotMessage(
        `✅ *Appointment Successfully Confirmed!*\n\n🎫 *Booking Token: ${token}*\n\n📋 *Summary:*\n• Doctor: ${selectedDoctor?.name}\n• Facility: ${getHospitalName()}\n• Schedule: ${selectedDate?.display} at ${selectedTime?.display}\n• Patient: ${patientName}\n\n📍 Please arrive at the reception 15 minutes before your scheduled slot.\n🪙 Consultation Fee: ₹${selectedDoctor?.consultationFee || 'N/A'}\n\n📲 A reminder WhatsApp message will be sent 1 hour prior to your visit.\n\n_Thank you for choosing MediCore HMS!_`,
        ['📅 Book Another Appointment', '🏠 Main Menu']
      );
      showToast({ title: '📱 WhatsApp Booking Confirmed!', message: `${patientName} — Token: ${token}`, type: 'wa' });
      chatState = 'welcome';
    } else if (replyLower.includes('edit')) {
      chatState = 'welcome';
      resetChat();
    } else {
      chatState = 'welcome';
      addBotMessage('Booking was cancelled. How can I help you?', ['1. Book Appointment', '2. Main Menu']);
    }
  } else if (chatState === 'check_status' || chatState === 'cancel') {
    const token = reply.toUpperCase();
    const appt = get('appointments').find(a => a.token === token || a.token === `TKN-${token}`);
    if (appt) {
      const p = get('patients').find(pt => pt.id === appt.patientId);
      const d = get('staff').find(s => s.id === appt.doctorId);
      addBotMessage(
        `✅ *Appointment Found*\n\n🎫 Token: ${appt.token}\n👤 Patient: ${p?.name || '—'}\n👨‍⚕️ Doctor: ${d?.name || '—'}\n📅 Date: ${appt.date} at ${appt.time}\n📊 Status: ${appt.status.toUpperCase()}`,
        chatState === 'cancel' ? ['✅ Keep Appointment', '❌ Cancel This Appointment'] : ['📅 Book Another', '🏠 Main Menu']
      );
    } else {
      addBotMessage('No appointment found with that token. Please double check and try again.', ['1. Try Again', '0. Main Menu']);
    }
  } else if (chatState === 'done' || chatState === 'welcome') {
    if (replyLower.includes('book') || replyLower.includes('another') || isNum('1')) {
      chatState = 'welcome';
      resetChat();
    } else {
      chatState = 'welcome';
      resetChat();
    }
  }
}

function getNextDates(count) {
  const dates = [];
  const d = new Date();
  for (let i = 1; i <= count; i++) {
    const nd = new Date(d);
    nd.setDate(d.getDate() + i);
    dates.push({
      display: nd.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
      val: nd.toISOString().split('T')[0]
    });
  }
  return dates;
}

export function renderWhatsAppDemo() {
  renderSidebar();
  renderTopbar({ breadcrumb: [{ label: 'WhatsApp Patient Booking' }] });

  const hospitals = get('hospitals') || [];
  const currentHospId = qrConfig.hospitalId || get('currentHospitalId') || 'h1';
  const hospital = hospitals.find(h => h.id === currentHospId) || hospitals[0];
  const departments = get('departments').filter(d => d.hospitalId === hospital?.id);

  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">WhatsApp Booking & QR Generator</h1>
        <p class="page-subtitle">Real-time scannable QR codes for hospital receptions & simulated patient WhatsApp bot booking</p>
      </div>
      <div class="page-actions">
        <button class="btn ${activeTab === 'simulation' ? 'btn-primary' : 'btn-secondary'}" onclick="setWATab('simulation')">
          <i data-lucide="message-circle"></i> Chat Simulator
        </button>
        <button class="btn ${activeTab === 'qr_standee' ? 'btn-primary' : 'btn-secondary'}" onclick="setWATab('qr_standee')">
          <i data-lucide="qr-code"></i> Printable Standee Poster
        </button>
      </div>
    </div>

    ${activeTab === 'simulation' ? renderSimulationView(hospital, hospitals, departments) : renderStandeeView(hospital, hospitals, departments)}
  `;

  refreshIcons(content);

  // Generate the real QR code on canvas
  updateLiveQR();

  // Reset or maintain chat
  if (messages.length === 0) {
    resetChat();
  } else {
    renderMessages();
  }
}

function renderSimulationView(hospital, hospitals, departments) {
  return `
    <div class="wa-demo-layout">
      <!-- Left: Real Live Generated QR Code & Hospital Controls -->
      <div class="wa-demo-sidebar">
        <!-- Live QR Code Card -->
        <div class="card mb-4">
          <div class="card-header">
            <span class="card-title">📱 Scan to Book with WhatsApp</span>
            <span class="badge badge-wa">Live QR</span>
          </div>
          <div class="card-body" style="text-align:center">
            <div class="qr-card-box">
              <div class="qr-canvas-wrap">
                <canvas id="wa-qr-canvas" style="display:block;max-width:100%;height:auto;"></canvas>
              </div>
              <div style="font-size:var(--font-size-base);font-weight:700;color:var(--color-primary);margin-bottom:2px">
                ${hospital?.name}
              </div>
              <div style="font-size:var(--font-size-sm);color:var(--color-text-muted);margin-bottom:12px">
                Scan with any smartphone camera to start WhatsApp chat
              </div>
              <div style="display:flex;gap:8px;width:100%">
                <button class="btn btn-secondary btn-sm flex-1" onclick="downloadQRCode()" title="Download PNG for print">
                  <i data-lucide="download"></i> Download PNG
                </button>
                <button class="btn btn-primary btn-sm flex-1" onclick="openWhatsAppDirect()" title="Open WhatsApp Link">
                  <i data-lucide="external-link"></i> Test Link
                </button>
              </div>
            </div>

            <!-- QR Customizer Controls -->
            <div class="form-section-title" style="text-align:left;margin-top:16px">Customize QR Code</div>
            <div style="text-align:left">
              <div class="form-group mb-2">
                <label class="form-label">Hospital</label>
                <select class="form-control" id="qr-hospital-select" onchange="onQRConfigChange()">
                  ${hospitals.map(h => `<option value="${h.id}" ${h.id === hospital?.id ? 'selected' : ''}>${h.name}</option>`).join('')}
                </select>
              </div>
              <div class="form-group mb-2">
                <label class="form-label">Direct Department (Optional)</label>
                <select class="form-control" id="qr-dept-select" onchange="onQRConfigChange()">
                  <option value="">All Departments (General)</option>
                  ${departments.map(d => `<option value="${d.name}" ${qrConfig.department === d.name ? 'selected' : ''}>${d.name}</option>`).join('')}
                </select>
              </div>
              <div class="form-group mb-2">
                <label class="form-label">QR Color Theme</label>
                <select class="form-control" id="qr-color-select" onchange="onQRConfigChange()">
                  <option value="#0B5FA5" ${qrConfig.qrColor === '#0B5FA5' ? 'selected' : ''}>Clinical Blue (#0B5FA5)</option>
                  <option value="#075E54" ${qrConfig.qrColor === '#075E54' ? 'selected' : ''}>WhatsApp Green (#075E54)</option>
                  <option value="#0F7A6C" ${qrConfig.qrColor === '#0F7A6C' ? 'selected' : ''}>Teal Medical (#0F7A6C)</option>
                  <option value="#0F172A" ${qrConfig.qrColor === '#0F172A' ? 'selected' : ''}>Slate Dark (#0F172A)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- How It Works Flow -->
        <div class="card">
          <div class="card-header"><span class="card-title">Patient Workflow</span></div>
          <div class="card-body">
            ${[
              { icon: 'qr-code', label: '1. Scan Standee QR', desc: 'Patient scans the QR at the clinic entry desk or hospital brochure' },
              { icon: 'message-circle', label: '2. WhatsApp Launches', desc: 'No mobile app installation required — uses regular WhatsApp' },
              { icon: 'bot', label: '3. Conversational AI Guide', desc: 'Guided slot selection: Department, Doctor, Date & Time' },
              { icon: 'calendar-check', label: '4. Instant Token', desc: 'Patient receives digital token (TKN-XXXX) and check-in reminder' },
            ].map(s => `
              <div style="display:flex;gap:12px;margin-bottom:14px">
                <div style="width:34px;height:34px;border-radius:50%;background:var(--color-primary-light);color:var(--color-primary);display:flex;align-items:center;justify-content:center;font-weight:700;flex-shrink:0">
                  <i data-lucide="${s.icon}" style="width:18px;height:18px"></i>
                </div>
                <div>
                  <div style="font-size:var(--font-size-base);font-weight:700;margin-bottom:2px">${s.label}</div>
                  <div style="font-size:var(--font-size-sm);color:var(--color-text-muted)">${s.desc}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Right: Mobile Chat Simulator -->
      <div>
        <div class="wa-phone-frame">
          <!-- Status Bar -->
          <div class="wa-status-bar">
            <span>${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
            <div style="display:flex;gap:6px;align-items:center">
              <i data-lucide="signal" style="width:14px;height:14px"></i>
              <i data-lucide="wifi" style="width:14px;height:14px"></i>
              <i data-lucide="battery" style="width:14px;height:14px"></i>
            </div>
          </div>

          <!-- Header -->
          <div class="wa-header">
            <div class="wa-header-back"><i data-lucide="arrow-left" style="width:20px;height:20px"></i></div>
            <div class="wa-header-avatar">${hospital?.name?.charAt(0) || 'H'}</div>
            <div class="wa-header-info">
              <div class="wa-header-name">${hospital?.name || 'Hospital Assistant'}</div>
              <div class="wa-header-status">🟢 Verified Business Bot</div>
            </div>
            <div style="display:flex;gap:14px;margin-left:auto;color:rgba(255,255,255,0.9)">
              <i data-lucide="phone" style="width:20px;height:20px"></i>
              <i data-lucide="more-vertical" style="width:20px;height:20px"></i>
            </div>
          </div>

          <!-- Messages Stream -->
          <div class="wa-messages" id="wa-messages"></div>

          <!-- Input Area -->
          <div class="wa-input-area">
            <div class="wa-input-wrap">
              <button class="wa-emoji-btn"><i data-lucide="smile" style="width:22px;height:22px"></i></button>
              <input type="text" class="wa-input" id="wa-text-input" placeholder="Type a message or number..." onkeydown="if(event.key==='Enter')sendWAMessage()" />
              <button class="wa-attach-btn"><i data-lucide="paperclip" style="width:20px;height:20px"></i></button>
            </div>
            <button class="wa-send-btn" onclick="sendWAMessage()" title="Send">
              <i data-lucide="send" style="width:20px;height:20px"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderStandeeView(hospital, hospitals, departments) {
  return `
    <div class="card" style="max-width:760px;margin:0 auto">
      <div class="card-header">
        <span class="card-title">🖨️ Printable Reception Standee / Poster</span>
        <div style="display:flex;gap:8px">
          <button class="btn btn-secondary btn-sm" onclick="downloadQRCode()">
            <i data-lucide="download"></i> Download QR
          </button>
          <button class="btn btn-primary btn-sm" onclick="window.print()">
            <i data-lucide="printer"></i> Print Poster (A4)
          </button>
        </div>
      </div>
      <div class="card-body" style="text-align:center;padding:40px">
        <!-- Standee Printable Area -->
        <div style="border:3px solid var(--color-primary);border-radius:20px;padding:36px;background:white;box-shadow:var(--shadow-md)">
          <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:12px">
            <div class="avatar avatar-lg" style="background:var(--color-primary);font-size:24px;font-weight:800">${hospital?.name?.charAt(0)}</div>
            <div style="text-align:left">
              <div style="font-size:var(--font-size-2xl);font-weight:800;color:var(--color-primary)">${hospital?.name}</div>
              <div style="font-size:var(--font-size-sm);color:var(--color-text-muted)">${hospital?.address}</div>
            </div>
          </div>

          <div style="font-size:var(--font-size-3xl);font-weight:800;color:#0F172A;margin:20px 0 6px">
            Instant Doctor Appointment
          </div>
          <div style="font-size:var(--font-size-md);color:var(--color-text-muted);margin-bottom:24px">
            Scan below with your WhatsApp camera — No app download needed!
          </div>

          <div style="display:inline-block;padding:16px;background:#F8FAFC;border:2px dashed var(--color-primary);border-radius:16px;margin-bottom:20px">
            <canvas id="wa-qr-canvas" style="display:block;margin:0 auto;width:240px;height:240px"></canvas>
          </div>

          <div style="display:flex;justify-content:center;gap:24px;margin-top:16px;font-size:var(--font-size-base)">
            <div style="display:flex;align-items:center;gap:8px">
              <i data-lucide="check-circle" style="color:var(--color-success)"></i> 100% Free Booking
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              <i data-lucide="check-circle" style="color:var(--color-success)"></i> Zero Waiting at Desk
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              <i data-lucide="check-circle" style="color:var(--color-success)"></i> Instant Token
            </div>
          </div>

          <div style="margin-top:24px;padding-top:16px;border-top:1px solid var(--color-border);font-size:var(--font-size-xs);color:var(--color-text-light)">
            Powered by MediCore HMS Smart Healthcare Platform · WhatsApp Support: +91 98765 43210
          </div>
        </div>
      </div>
    </div>
  `;
}

async function updateLiveQR() {
  const canvas = document.getElementById('wa-qr-canvas');
  if (!canvas) return;

  const hospitals = get('hospitals') || [];
  const hospital = hospitals.find(h => h.id === qrConfig.hospitalId) || hospitals[0];

  const waLink = buildWhatsAppLink({
    phone: qrConfig.phone,
    hospitalName: hospital?.name,
    department: qrConfig.department
  });

  await renderQRCode(canvas, waLink, {
    width: 240,
    color: {
      dark: qrConfig.qrColor,
      light: '#FFFFFF'
    }
  });
}

window.setWATab = (tab) => {
  activeTab = tab;
  renderWhatsAppDemo();
};

window.onQRConfigChange = () => {
  qrConfig.hospitalId = document.getElementById('qr-hospital-select')?.value || 'h1';
  qrConfig.department = document.getElementById('qr-dept-select')?.value || '';
  qrConfig.qrColor = document.getElementById('qr-color-select')?.value || '#0B5FA5';
  updateLiveQR();
};

window.downloadQRCode = async () => {
  const hospitals = get('hospitals') || [];
  const hospital = hospitals.find(h => h.id === qrConfig.hospitalId) || hospitals[0];
  const waLink = buildWhatsAppLink({
    phone: qrConfig.phone,
    hospitalName: hospital?.name,
    department: qrConfig.department
  });

  const dataUrl = await getQRCodeDataURL(waLink, {
    width: 800,
    color: { dark: qrConfig.qrColor, light: '#FFFFFF' }
  });

  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `${hospital?.name.replace(/[^a-zA-Z0-9]/g, '_')}_WhatsApp_QR.png`;
  a.click();
  showToast({ title: 'QR Code Downloaded', message: 'High-res PNG saved to your downloads.', type: 'success' });
};

window.openWhatsAppDirect = () => {
  const hospitals = get('hospitals') || [];
  const hospital = hospitals.find(h => h.id === qrConfig.hospitalId) || hospitals[0];
  const waLink = buildWhatsAppLink({
    phone: qrConfig.phone,
    hospitalName: hospital?.name,
    department: qrConfig.department
  });
  window.open(waLink, '_blank');
};

window.handleQuickReply = (reply) => handleQuickReply(reply);

window.sendWAMessage = () => {
  const input = document.getElementById('wa-text-input');
  if (!input?.value.trim()) return;
  const val = input.value.trim();
  input.value = '';
  handleQuickReply(val);
};

window.resetWADemo = () => {
  messages = [];
  chatState = 'welcome';
  resetChat();
};
