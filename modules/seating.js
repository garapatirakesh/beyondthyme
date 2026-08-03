/* modules/seating.js
<<<<<<< HEAD
 * Seating floorplan rendering — oval poker-table layout.
 * All 25 chairs are rendered into #chairsRing, positioned absolutely
 * around the oval by CSS class chair-pos-01 through chair-pos-25.
 */

import { HEAD_SEAT } from '../config/app.config.js';
=======
 * Seating floorplan rendering matching Image 1 design.
 * 25 Seats: Top row 01-12, Bottom row 24-14, Left seat 25.
 * Circular glassmorphism seats with gold borders, avatar profiles for booked seats,
 * 105% hover lift, selection gold glow rings, and click ripple animations.
 */

import { SEAT_ORDER_IMAGE1 } from '../config/app.config.js';
>>>>>>> 6295ac1d3f7b4d70758eac6b5cc27fc944d4d58b

/**
 * Render the seating layout for given club config.
 * @param {object} clubConfig
 * @param {object} callbacks
 */
export function renderSeatingLayout(clubConfig, callbacks = {}) {
<<<<<<< HEAD
  const chairsRing   = document.getElementById('chairsRing');
  const nameTitle    = document.getElementById('activeClubNameTitle');
  const locationTag  = document.getElementById('activeClubLocationTag');
  const tableSubLabel = document.getElementById('tableSubLabel');
  const schematicEl  = document.querySelector('.schematic-visualizer');
=======
  const rowTop       = document.getElementById('chairRowTop');
  const rowBottom    = document.getElementById('chairRowBottom');
  const headContainer = document.getElementById('headChairContainer');
>>>>>>> 6295ac1d3f7b4d70758eac6b5cc27fc944d4d58b

  if (!chairsRing) return;

  chairsRing.innerHTML = '';

  const isExpired = new Date(clubConfig.eventDate) <= new Date();

  // Render Top Row (01 to 12)
  SEAT_ORDER_IMAGE1.topRow.forEach(seatNum => {
    rowTop.appendChild(_createLuxurySeatElement(seatNum, 'chair-top', clubConfig, callbacks, isExpired));
  });

<<<<<<< HEAD
  // Render all seats 1 – HEAD_SEAT (25) into the oval ring
  for (let i = 1; i <= HEAD_SEAT; i++) {
    chairsRing.appendChild(_createChairElement(i, clubConfig, callbacks, isExpired));
  }

  if (nameTitle) {
    nameTitle.innerText = isExpired
      ? `${clubConfig.name} Seating [ARCHIVED]`
      : `${clubConfig.name} Seating`;
  }
  if (locationTag) locationTag.innerText = clubConfig.location.toUpperCase();
  if (tableSubLabel) {
    tableSubLabel.innerText = isExpired
      ? `${clubConfig.location.toUpperCase()} · ARCHIVED`
      : `GRAND VILLA BANQUET · 25 POSITIONS`;
  }
=======
  // Render Bottom Row (24 down to 14)
  SEAT_ORDER_IMAGE1.bottomRow.forEach(seatNum => {
    rowBottom.appendChild(_createLuxurySeatElement(seatNum, 'chair-bottom', clubConfig, callbacks, isExpired));
  });

  // Render Head Seat (25)
  headContainer.appendChild(_createLuxurySeatElement(SEAT_ORDER_IMAGE1.headSeat, 'chair-left', clubConfig, callbacks, isExpired));
>>>>>>> 6295ac1d3f7b4d70758eac6b5cc27fc944d4d58b
}

/**
 * Build a single luxury circular seat element.
 * @private
 */
<<<<<<< HEAD
function _createChairElement(seatNum, config, callbacks, isExpired) {
=======
function _createLuxurySeatElement(seatNum, placementClass, config, callbacks, isExpired) {
>>>>>>> 6295ac1d3f7b4d70758eac6b5cc27fc944d4d58b
  const div = document.createElement('div');
  div.id = `chair${seatNum}`;
  div.setAttribute('data-seat', `Seat_${String(seatNum).padStart(2, '0')}`);

  const posClass = `p-${seatNum}`;
  const occ = config.occupied.find(o => o.seat === seatNum);

  if (occ) {
<<<<<<< HEAD
    // Occupied: black-card, member's first initial
    div.className = `seat ${posClass} black-card`;
    div.innerHTML = `
      <span class="seat-content">${occ.alias.charAt(0).toUpperCase()}</span>
      <div class="chair-tooltip">
        <p class="tooltip-title">Seat ${String(seatNum).padStart(2, '0')} — Reserved</p>
        <p class="tooltip-time">${isExpired ? 'Archived' : occ.alias}</p>
      </div>
    `;
    div.addEventListener('mouseenter', () => {
      if (!isExpired) callbacks.onOccupiedHover?.();
    });
    div.addEventListener('mouseleave', () => {
      if (!isExpired) callbacks.onSeatHoverLeave?.();
    });
  } else if (isExpired) {
    // Expired open seat
    div.className = `seat ${posClass} white-card-expired`;
    div.innerHTML = `
      <span class="seat-content">${seatNum}</span>
      <div class="chair-tooltip">
        <p class="tooltip-title">Seat ${String(seatNum).padStart(2, '0')} — Closed</p>
        <p class="tooltip-time">Registration expired</p>
      </div>
    `;
  } else {
    // Open seat: white-card with status dot
    div.className = `seat ${posClass} white-card nav-interactive`;
    div.innerHTML = `
      <span class="seat-content">${seatNum}<span class="status-dot"></span></span>
      <div class="chair-tooltip">
        <p class="tooltip-title">Seat ${String(seatNum).padStart(2, '0')} — Open</p>
        <p class="tooltip-time">Click to claim</p>
      </div>
    `;
    div.addEventListener('mouseenter', () => callbacks.onSeatHoverEnter?.(div));
    div.addEventListener('mouseleave', () => callbacks.onSeatHoverLeave?.());
    div.addEventListener('click',      () => callbacks.onSeatClick?.(div));
=======
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
>>>>>>> 6295ac1d3f7b4d70758eac6b5cc27fc944d4d58b
  }

  return div;
}

/**
 * Mark a seat element as selected.
 * @param {HTMLElement} chairEl
 */
export function selectSeat(chairEl) {
  const prev = document.querySelector('.seat.selected');
  if (prev) prev.classList.remove('selected');
  chairEl.classList.add('selected');
}

/**
<<<<<<< HEAD
 * Convert a reserved seat element to occupied state (post-vetting).
=======
 * Convert seat to occupied booked avatar.
>>>>>>> 6295ac1d3f7b4d70758eac6b5cc27fc944d4d58b
 * @param {HTMLElement} chairEl
 * @param {{ emoji: string, alias: string }} vettingData
 * @param {string} seatNum
 */
export function convertSeatToOccupied(chairEl, vettingData, seatNum) {
<<<<<<< HEAD
  const { alias, diet } = vettingData;
  chairEl.classList.remove('white-card', 'selected');
  chairEl.classList.add('black-card');
  chairEl.innerHTML = `
    <span class="seat-content">${alias.charAt(0).toUpperCase()}</span>
    <div class="chair-tooltip">
      <p class="tooltip-title">Seat ${seatNum} — Reserved</p>
      <p class="tooltip-time">${alias} (${diet})</p>
=======
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
>>>>>>> 6295ac1d3f7b4d70758eac6b5cc27fc944d4d58b
    </div>
  `;
}
