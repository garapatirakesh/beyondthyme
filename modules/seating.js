/* modules/seating.js
 * Seating floorplan rendering matching Image 1 design.
 * 25 Seats: Top row 01-12, Bottom row 24-14, Left seat 25.
 * Circular glassmorphism seats with gold borders, avatar profiles for booked seats,
 * 105% hover lift, selection gold glow rings, and click ripple animations.
 */

import { SEAT_ORDER_IMAGE1 } from '../config/app.config.js';

/**
 * Render the seating layout for given club config.
 * @param {object} clubConfig
 * @param {object} callbacks
 */
export function renderSeatingLayout(clubConfig, callbacks = {}) {
  const rowTop       = document.getElementById('chairRowTop');
  const rowBottom    = document.getElementById('chairRowBottom');
  const headContainer = document.getElementById('headChairContainer');

  if (!rowTop || !rowBottom || !headContainer) return;

  rowTop.innerHTML       = '';
  rowBottom.innerHTML    = '';
  headContainer.innerHTML = '';

  const isExpired = new Date(clubConfig.eventDate) <= new Date();

  // Render Top Row (01 to 12)
  SEAT_ORDER_IMAGE1.topRow.forEach(seatNum => {
    rowTop.appendChild(_createLuxurySeatElement(seatNum, 'chair-top', clubConfig, callbacks, isExpired));
  });

  // Render Bottom Row (24 down to 14)
  SEAT_ORDER_IMAGE1.bottomRow.forEach(seatNum => {
    rowBottom.appendChild(_createLuxurySeatElement(seatNum, 'chair-bottom', clubConfig, callbacks, isExpired));
  });

  // Render Head Seat (25)
  headContainer.appendChild(_createLuxurySeatElement(SEAT_ORDER_IMAGE1.headSeat, 'chair-left', clubConfig, callbacks, isExpired));
}

/**
 * Build a single luxury circular seat element.
 * @private
 */
function _createLuxurySeatElement(seatNum, placementClass, config, callbacks, isExpired) {
  const div = document.createElement('div');
  div.id = `chair${seatNum}`;
  div.setAttribute('data-seat', `Seat_${String(seatNum).padStart(2, '0')}`);

  const occ = config.occupied.find(o => o.seat === seatNum);

  if (occ) {
    // Booked seat: Displays ONLY circular avatar profile (no name)
    div.className = `chair ${placementClass} occupied luxury-booked-seat nav-interactive`;
    div.innerHTML = `
      <div class="luxury-avatar-ring">
        <span class="avatar-emoji">${occ.emoji || '👤'}</span>
      </div>
      <div class="chair-tooltip">
        <p class="tooltip-title">Position ${String(seatNum).padStart(2, '0')}</p>
        <p class="tooltip-time">[RESERVED MEMBER]</p>
      </div>
    `;
    div.addEventListener('mouseenter', () => { if (!isExpired) callbacks.onOccupiedHover?.(); });
    div.addEventListener('mouseleave', () => { if (!isExpired) callbacks.onSeatHoverLeave?.(); });
  } else {
    if (isExpired) {
      div.className = `chair ${placementClass} available available-expired`;
      div.innerHTML = `
        <span class="chair-label-open">${String(seatNum).padStart(2, '0')}</span>
        <div class="chair-tooltip">
          <p class="tooltip-title">Position ${String(seatNum).padStart(2, '0')}</p>
          <p class="tooltip-time">[REGISTRATION CLOSED]</p>
        </div>
      `;
    } else {
      // Open Available seat: Black glass circle with gold border ring
      div.className = `chair ${placementClass} available luxury-open-seat nav-interactive`;
      div.innerHTML = `
        <span class="chair-label-num font-mono">${String(seatNum).padStart(2, '0')}</span>
        <div class="gold-ripple-ring"></div>
        <div class="chair-tooltip">
          <p class="tooltip-title">Position ${String(seatNum).padStart(2, '0')}</p>
          <p class="tooltip-time">[AVAILABLE SEAT]</p>
        </div>
      `;

      div.addEventListener('mouseenter', () => callbacks.onSeatHoverEnter?.(div));
      div.addEventListener('mouseleave', () => callbacks.onSeatHoverLeave?.());
      div.addEventListener('click', (e) => {
        // Click animation: golden ripple
        const ripple = div.querySelector('.gold-ripple-ring');
        if (ripple) {
          ripple.classList.remove('active');
          void ripple.offsetWidth; // Force reflow
          ripple.classList.add('active');
        }
        callbacks.onSeatClick?.(div);
      });
    }
  }

  return div;
}

/**
 * Mark a seat element as selected.
 * @param {HTMLElement} chairEl
 */
export function selectSeat(chairEl) {
  const prev = document.querySelector('.chair.selected');
  if (prev) prev.classList.remove('selected');
  chairEl.classList.add('selected');
}

/**
 * Convert seat to occupied booked avatar.
 * @param {HTMLElement} chairEl
 * @param {{ emoji: string, alias: string }} vettingData
 * @param {string} seatNum
 */
export function convertSeatToOccupied(chairEl, vettingData, seatNum) {
  const { emoji } = vettingData;
  chairEl.classList.remove('available', 'selected', 'blinking-glitch', 'luxury-open-seat');
  chairEl.classList.add('occupied', 'luxury-booked-seat');
  chairEl.innerHTML = `
    <div class="luxury-avatar-ring">
      <span class="avatar-emoji">${emoji || '👤'}</span>
    </div>
    <div class="chair-tooltip">
      <p class="tooltip-title">Position ${seatNum}</p>
      <p class="tooltip-time">[RESERVED MEMBER]</p>
    </div>
  `;
}
