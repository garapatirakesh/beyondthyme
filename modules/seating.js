/* modules/seating.js
 * Seating floorplan rendering — oval poker-table layout.
 * All 25 chairs are rendered into #chairsRing, positioned absolutely
 * around the oval by CSS class chair-pos-01 through chair-pos-25.
 */

import { HEAD_SEAT } from '../config/app.config.js';

/**
 * Render the full seating layout for the given club config.
 * @param {object} clubConfig   — e.g. CLUBS_CONFIG.vedic
 * @param {object} callbacks    — { onSeatClick, onSeatHoverEnter, onSeatHoverLeave, onOccupiedHover }
 */
export function renderSeatingLayout(clubConfig, callbacks = {}) {
  const chairsRing   = document.getElementById('chairsRing');
  const nameTitle    = document.getElementById('activeClubNameTitle');
  const locationTag  = document.getElementById('activeClubLocationTag');
  const tableSubLabel = document.getElementById('tableSubLabel');
  const schematicEl  = document.querySelector('.schematic-visualizer');

  if (!chairsRing) return;

  chairsRing.innerHTML = '';

  const isExpired = new Date(clubConfig.eventDate) <= new Date();

  // Add expired styling to the visualizer container
  if (schematicEl) {
    if (isExpired) {
      schematicEl.classList.add('floorplan-expired');
    } else {
      schematicEl.classList.remove('floorplan-expired');
    }
  }

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
}

/**
 * Build a single chair DOM element.
 * @private
 */
function _createChairElement(seatNum, config, callbacks, isExpired) {
  const div = document.createElement('div');
  div.id = `chair${seatNum}`;
  div.setAttribute('data-seat', `Seat_${String(seatNum).padStart(2, '0')}`);

  const posClass = `p-${seatNum}`;
  const occ = config.occupied.find(o => o.seat === seatNum);

  if (occ) {
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
  }

  return div;
}

/**
 * Mark a seat element as selected, deselecting any previous selection.
 * @param {HTMLElement} chairEl
 */
export function selectSeat(chairEl) {
  const prev = document.querySelector('.seat.selected');
  if (prev) prev.classList.remove('selected');
  chairEl.classList.add('selected');
}

/**
 * Convert a reserved seat element to occupied state (post-vetting).
 * @param {HTMLElement} chairEl
 * @param {{ emoji: string, alias: string, diet: string }} vettingData
 * @param {string} seatNum  — e.g. "03"
 */
export function convertSeatToOccupied(chairEl, vettingData, seatNum) {
  const { alias, diet } = vettingData;
  chairEl.classList.remove('white-card', 'selected');
  chairEl.classList.add('black-card');
  chairEl.innerHTML = `
    <span class="seat-content">${alias.charAt(0).toUpperCase()}</span>
    <div class="chair-tooltip">
      <p class="tooltip-title">Seat ${seatNum} — Reserved</p>
      <p class="tooltip-time">${alias} (${diet})</p>
    </div>
  `;
}
