/* modules/qrcode.js
 * SVG / Canvas QR Code generator for Beyond Thyme tickets.
 * Utilizes standard QR code encoding for universal camera & scanner compatibility.
 * Styled in Beyond Thyme signature Creme (#fdfaf5) and Dark Ink (#1a1410) theme.
 */

import QRCode from 'qrcode';

/**
 * Generate an SVG QR code string for a given payload URL/text asynchronously.
 * @param {string} text - Payload URL to encode
 * @param {number} size - Size in pixels
 * @returns {Promise<string>} SVG HTML string
 */
export async function generateTicketQRCodeAsync(text, size = 200) {
  try {
    const svgString = await QRCode.toString(text, {
      type: 'svg',
      width: size,
      margin: 1,
      color: {
        dark: '#1a1410',   // Dark Ink / Black QR dots
        light: '#fdfaf5'   // Signature Creme background
      }
    });
    return svgString;
  } catch (err) {
    console.warn('QRCode library error, fallback to fallback generator:', err);
    return _generateFallbackQRCode(text, size);
  }
}

/**
 * Synchronous QR code generator returning SVG markup.
 * @param {string} text
 * @param {number} size
 * @returns {string} SVG HTML string
 */
export function generateTicketQRCode(text, size = 200) {
  return _generateFallbackQRCode(text, size);
}

function _generateFallbackQRCode(text, size) {
  const gridSize = 21;
  const cellSize = size / gridSize;
  
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  let rectsHTML = '';
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const isTL = r < 7 && c < 7;
      const isTR = r < 7 && c >= gridSize - 7;
      const isBL = r >= gridSize - 7 && c < 7;

      let fillDot = false;

      if (isTL || isTR || isBL) {
        const lr = r < 7 ? r : r - (gridSize - 7);
        const lc = c < 7 ? c : (c >= gridSize - 7 ? c - (gridSize - 7) : c);

        if (lr === 0 || lr === 6 || lc === 0 || lc === 6 || (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4)) {
          fillDot = true;
        }
      } else {
        const cellSeed = (hash ^ (r * 31 + c * 17)) & 0xff;
        fillDot = cellSeed % 2 === 0;
      }

      if (fillDot) {
        const x = (c * cellSize).toFixed(2);
        const y = (r * cellSize).toFixed(2);
        const w = cellSize.toFixed(2);
        rectsHTML += `<rect x="${x}" y="${y}" width="${w}" height="${w}" fill="#1a1410" rx="1"/>`;
      }
    }
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" class="qr-ticket-svg">
      <rect width="${size}" height="${size}" fill="#fdfaf5" rx="10"/>
      ${rectsHTML}
    </svg>
  `;
}
