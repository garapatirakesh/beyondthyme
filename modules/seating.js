/* modules/seating.js
 * Seating floorplan rendering and seat interaction logic.
 * renderSeatingLayout() is called on init and whenever activeClub changes.
 */

import { TOP_ROW_SEATS, BOTTOM_ROW_SEATS, HEAD_SEAT } from '../config/app.config.js';

/**
 * Render the full seating layout for the given club config.
 * @param {object} clubConfig   — e.g. CLUBS_CONFIG.vedic
 * @param {object} callbacks    — { onSeatClick, onSeatHoverEnter, onSeatHoverLeave, onOccupiedHover }
 */
export function renderSeatingLayout(clubConfig, callbacks = {}) {
  const rowTop       = document.getElementById('chairRowTop');
  const rowBottom    = document.getElementById('chairRowBottom');
  const headContainer = document.getElementById('headChairContainer');
  const nameTitle    = document.getElementById('activeClubNameTitle');
  const locationTag  = document.getElementById('activeClubLocationTag');

  if (!rowTop || !rowBottom || !headContainer) return;

  rowTop.innerHTML       = '';
  rowBottom.innerHTML    = '';
  headContainer.innerHTML = '';

  for (let i = TOP_ROW_SEATS.start; i <= TOP_ROW_SEATS.end; i++) {
    rowTop.appendChild(_createChairElement(i, 'chair-top', clubConfig, callbacks));
  }
  for (let i = BOTTOM_ROW_SEATS.start; i <= BOTTOM_ROW_SEATS.end; i++) {
    rowBottom.appendChild(_createChairElement(i, 'chair-bottom', clubConfig, callbacks));
  }
  headContainer.appendChild(_createChairElement(HEAD_SEAT, 'chair-left', clubConfig, callbacks));

  if (nameTitle)   nameTitle.innerText   = `${clubConfig.name} Seating`;
  if (locationTag) locationTag.innerText = clubConfig.location.toUpperCase();
}

/**
 * Build a single chair DOM element.
 * @private
 */
function _createChairElement(seatNum, placementClass, config, callbacks) {
  const div = document.createElement('div');
  div.id = `chair${seatNum}`;
  div.setAttribute('data-seat', `Seat_${String(seatNum).padStart(2, '0')}`);

  const occ = config.occupied.find(o => o.seat === seatNum);

  if (occ) {
    div.className = `chair ${placementClass} occupied`;
    div.innerHTML = `
      <div class="chrono-avatar-ring">
        <span class="avatar-emoji">${occ.emoji}</span>
        <span class="avatar-alias">${occ.alias}</span>
      </div>
      <div class="chair-tooltip">
        <p class="tooltip-title">Position ${String(seatNum).padStart(2, '0')} [Reserved]</p>
        <p class="tooltip-time">Avatar: ${occ.alias}</p>
      </div>
    `;
    div.addEventListener('mouseenter', () => callbacks.onOccupiedHover?.());
    div.addEventListener('mouseleave', () => callbacks.onSeatHoverLeave?.());
  } else {
    div.className = `chair ${placementClass} available nav-interactive`;
    div.innerHTML = `
      <span class="chair-icon-claim">+ CLAIM SEAT</span>
      <span class="chair-label-open">${String(seatNum).padStart(2, '0')}</span>
      <div class="chair-tooltip">
        <p class="tooltip-title">Position ${String(seatNum).padStart(2, '0')} [OPEN SEAT]</p>
        <p class="tooltip-time">Tap to Claim Position</p>
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
  const prev = document.querySelector('.chair.selected');
  if (prev) prev.classList.remove('selected');
  chairEl.classList.add('selected');
}

/**
 * Convert a reserved seat element to an occupied avatar state (post-vetting).
 * @param {HTMLElement} chairEl
 * @param {{ emoji: string, alias: string, diet: string }} vettingData
 * @param {string} seatNum  — e.g. "03"
 */
export function convertSeatToOccupied(chairEl, vettingData, seatNum) {
  const { emoji, alias, diet } = vettingData;
  chairEl.classList.remove('available', 'selected');
  chairEl.classList.add('occupied');
  chairEl.innerHTML = `
    <div class="chrono-avatar-ring">
      <span class="avatar-emoji">${emoji}</span>
      <span class="avatar-alias">${alias.toUpperCase()}</span>
    </div>
    <div class="chair-tooltip">
      <p class="tooltip-title">Position ${seatNum} [Reserved]</p>
      <p class="tooltip-time">Avatar: ${alias} (${diet})</p>
    </div>
  `;
}
