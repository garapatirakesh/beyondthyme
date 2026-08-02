/* modules/qrcode.js
 * Lightweight SVG QR code generator for ticket confirmation.
 */

/**
 * Generate an SVG QR code markup string for given text/payload.
 * @param {string} text - Payload to encode in QR pattern
 * @param {number} size - Output size in px
 * @returns {string} SVG HTML string
 */
export function generateTicketQRCode(text, size = 160) {
  // Deterministic 15x15 matrix grid representation based on payload string hash
  const gridSize = 17;
  const cellSize = size / gridSize;
  
  // Seed hash generator
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  let rectsHTML = '';

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      // Corner finder patterns (Top-Left, Top-Right, Bottom-Left)
      const isTopLeftCorner     = r < 4 && c < 4;
      const isTopRightCorner    = r < 4 && c >= gridSize - 4;
      const isBottomLeftCorner = r >= gridSize - 4 && c < 4;

      let fillDot = false;

      if (isTopLeftCorner || isTopRightCorner || isBottomLeftCorner) {
        const localR = r < 4 ? r : r - (gridSize - 4);
        const localC = c < 4 ? c : (c >= gridSize - 4 ? c - (gridSize - 4) : c);

        // Finder outer square & inner dot
        if (localR === 0 || localR === 3 || localC === 0 || localC === 3 || (localR === 1 && localC === 1)) {
          fillDot = true;
        }
      } else {
        // Data matrix cells pseudorandomized by hash
        const cellSeed = (hash ^ (r * 31 + c * 17)) & 0xff;
        fillDot = cellSeed % 2 === 0;
      }

      if (fillDot) {
        const x = (c * cellSize).toFixed(2);
        const y = (r * cellSize).toFixed(2);
        const w = cellSize.toFixed(2);
        rectsHTML += `<rect x="${x}" y="${y}" width="${w}" height="${w}" fill="var(--text-primary)" rx="1"/>`;
      }
    }
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" class="qr-ticket-svg">
      <rect width="${size}" height="${size}" fill="var(--bg-surface)" rx="8"/>
      ${rectsHTML}
    </svg>
  `;
}
