// ============================================================
// qrGenerator.js — Real QR Code Generator Utility
// ============================================================

import QRCode from 'qrcode';

/**
 * Render a real, scannable QR Code onto a canvas element
 * @param {HTMLCanvasElement} canvasEl 
 * @param {string} text - URL or WhatsApp link
 * @param {Object} options - QR options
 */
export async function renderQRCode(canvasEl, text, options = {}) {
  const defaultOptions = {
    width: 220,
    margin: 2,
    color: {
      dark: '#0B5FA5', // Clinical Primary
      light: '#FFFFFF'
    },
    errorCorrectionLevel: 'H'
  };

  const finalOpts = { ...defaultOptions, ...options };

  try {
    await QRCode.toCanvas(canvasEl, text, finalOpts);
    return true;
  } catch (err) {
    console.error('QR Code generation failed:', err);
    return false;
  }
}

/**
 * Generate a PNG Data URL for downloading
 */
export async function getQRCodeDataURL(text, options = {}) {
  const defaultOptions = {
    width: 600,
    margin: 3,
    color: {
      dark: '#0B5FA5',
      light: '#FFFFFF'
    },
    errorCorrectionLevel: 'H'
  };
  return await QRCode.toDataURL(text, { ...defaultOptions, ...options });
}

/**
 * Build WhatsApp Deep Link URL
 */
export function buildWhatsAppLink({ phone = '919876543210', hospitalName = 'Apollo Hospital', department = '' }) {
  const text = department
    ? `Hello, I would like to book an appointment for *${department}* at *${hospitalName}*.`
    : `Hello, I would like to book a doctor appointment at *${hospitalName}*.`;
  return `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
}
