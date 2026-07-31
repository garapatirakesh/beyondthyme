/* modules/vault.js
 * Treasure hunt coordinate system and Amrit Vault breaker logic.
 * Coordinate generation, Y-hiding, reveal flip animation, and vault UI state.
 */

import { COORD, Y_HIDING_SPOTS, VAULT_UNLOCK_DELAY_MS, VAULT_JITTER_RESET_MS } from '../config/app.config.js';
import { AMRIT_YUGA_ERA } from '../config/menu.js';
import { bindCursorHover } from './cursor.js';

// ─── Daily coordinate generation ─────────────────────────────────────────────

/** Generate a deterministic date seed string (YYYY-MM-DD) */
export function getTodayDateStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Seeded pseudo-random number generator (returns a callable → [0,1)) */
export function getSeededRandom(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return function () {
    const x = Math.sin(hash++) * 10000;
    return x - Math.floor(x);
  };
}

/**
 * Generate today's X and Y coordinates in HH:MM format.
 * @returns {{ coordX: string, coordY: string, hidingSpotIndex: number }}
 */
export function generateDailyCoords() {
  const rand  = getSeededRandom(getTodayDateStr());

  const hX = Math.floor(rand() * COORD.HOUR_RANGE) + COORD.HOUR_MIN;
  const mX = Math.floor(rand() * COORD.MINUTE_MAX);
  const coordX = `${hX}:${String(mX).padStart(2, '0')}`;

  const hY = Math.floor(rand() * COORD.HOUR_RANGE) + COORD.HOUR_MIN;
  const mY = Math.floor(rand() * COORD.MINUTE_MAX);
  const coordY = `${hY}:${String(mY).padStart(2, '0')}`;

  const hidingSpotIndex = Math.floor(rand() * Y_HIDING_SPOTS.length);

  return { coordX, coordY, hidingSpotIndex };
}

// ─── Y-coordinate hiding ─────────────────────────────────────────────────────

/**
 * Inject the Y coordinate revealer span into today's chosen hiding spot.
 * @param {string} coordY
 * @param {number} hidingSpotIndex
 */
export function hideCoordY(coordY, hidingSpotIndex) {
  const spot = Y_HIDING_SPOTS[hidingSpotIndex];
  if (!spot) return;

  setTimeout(() => {
    const revealerSpan = _buildRevealerSpan(coordY);

    if (spot.type === 'menu-course') {
      const col = document.querySelectorAll('.menu-column')[spot.menuColIndex];
      if (!col) return;
      const desc = col.querySelectorAll('.course-item')[spot.courseIndex]?.querySelector('.course-details');
      if (desc) desc.appendChild(revealerSpan);

    } else if (spot.type === 'occupied-tooltip') {
      const chair = document.querySelector(spot.selector);
      const tooltipTime = chair?.querySelector('.chair-tooltip .tooltip-time');
      if (tooltipTime) tooltipTime.appendChild(revealerSpan);

    } else if (spot.type === 'logo') {
      const logo = document.querySelector('.logo');
      if (logo) {
        const wrapper = document.createElement('span');
        wrapper.appendChild(revealerSpan);
        logo.appendChild(wrapper);
      }

    } else if (spot.type === 'footer-link') {
      const col   = document.querySelectorAll('.footer-links')[spot.footerColIndex];
      const link  = col?.querySelector('li a');
      if (link) link.appendChild(revealerSpan);
    }

    _attachRevealListeners();
  }, 100);
}

// ─── Time Capsule ─────────────────────────────────────────────────────────────

/**
 * Initialise the time capsule core button to reveal coordX on click.
 * @param {string} coordX
 * @param {Function} onReveal  — optional callback (e.g. play chime)
 */
export function initTimeCapsule(coordX, onReveal) {
  const btn        = document.getElementById('timeCapsuleCoreBtn');
  const label      = document.getElementById('timeCapsuleLabel');
  const statusText = document.getElementById('timeCapsuleStatusText');

  if (!btn) return;

  btn.addEventListener('click', () => {
    if (label)      { label.innerText = 'CAPSULE STATUS: DECRYPTED'; label.style.color = '#2a9d5c'; }
    if (statusText) statusText.innerHTML = `Temporal Coordinate X: <span class="text-coral coord-value">${coordX}</span>`;
    onReveal?.();
  });
}

// ─── Vault Breaker ────────────────────────────────────────────────────────────

/**
 * Initialise the BREACH button and wire vault unlock / failure flows.
 * @param {{ coordX: string, coordY: string }} coords
 * @param {object} audio  — { playBeaconChime, playSuccessArpeggio, playErrorBuzzer }
 * @param {HTMLElement} cursor
 */
export function initVaultBreaker(coords, audio, cursor) {
  const { coordX, coordY } = coords;

  const chronoKeyX       = document.getElementById('chronoKeyX');
  const chronoKeyY       = document.getElementById('chronoKeyY');
  const btnDecrypt       = document.getElementById('btnDecryptVault');
  const statusEl         = document.getElementById('vaultBreakerStatus');
  const vaultInnerGear   = document.getElementById('vaultInnerGear');
  const vaultStateLocked = document.getElementById('vaultStateLocked');
  const vaultStateUnlocked = document.getElementById('vaultStateUnlocked');
  const vipOverlay       = document.getElementById('vipOverlay');
  const vipTimestamp     = document.getElementById('vipTimestamp');
  const btnOpenVIP       = document.getElementById('btnOpenVIPPass');
  const closeVipBtn      = document.getElementById('closeVipBtn');

  if (btnDecrypt) {
    btnDecrypt.addEventListener('click', () => {
      const enteredX = chronoKeyX?.value.trim();
      const enteredY = chronoKeyY?.value.trim();

      if (enteredX === coordX && enteredY === coordY) {
        if (statusEl) { statusEl.innerText = '> ACCESS GRANTED. SATELLITE CHRONO-ALIGNMENT LOCKED.'; statusEl.style.color = '#2a9d5c'; }
        if (vaultInnerGear) vaultInnerGear.style.transform = 'rotate(720deg)';
        audio.playSuccessArpeggio?.();

        setTimeout(() => {
          if (vaultStateLocked)   vaultStateLocked.style.display   = 'none';
          if (vaultStateUnlocked) vaultStateUnlocked.style.display = 'flex';
          _showVipOverlay(vipOverlay, vipTimestamp);
          _unlockAmritMenu(cursor);
        }, VAULT_UNLOCK_DELAY_MS);

      } else {
        if (statusEl) { statusEl.innerText = '> ACCESS DENIED. KEY SIGNALS DESYNCHRONIZED. TRY AGAIN.'; statusEl.style.color = 'var(--color-coral)'; }
        if (vaultInnerGear) {
          vaultInnerGear.style.transform = 'rotate(-25deg)';
          setTimeout(() => { vaultInnerGear.style.transform = 'rotate(0deg)'; }, VAULT_JITTER_RESET_MS);
        }
        audio.playErrorBuzzer?.();
      }
    });
  }

  if (btnOpenVIP) {
    btnOpenVIP.addEventListener('click', () => _showVipOverlay(vipOverlay, vipTimestamp));
  }

  if (closeVipBtn) {
    closeVipBtn.addEventListener('click', () => {
      if (vipOverlay) vipOverlay.style.display = 'none';
    });
  }
}

// ─── Private helpers ──────────────────────────────────────────────────────────

function _buildRevealerSpan(coordY) {
  const span = document.createElement('span');
  span.className = 'revealer-text nav-interactive';
  span.setAttribute('data-reveal', coordY);
  span.innerText = _randomRevealWord();
  return span;
}

function _randomRevealWord() {
  const words = ['KALA', 'SOMA', 'YUGA', 'CHRA'];
  return words[Math.floor(Math.random() * words.length)];
}

function _attachRevealListeners() {
  document.addEventListener('click', (e) => {
    const t = e.target;
    if (!t?.classList.contains('revealer-text')) return;
    const secret = t.getAttribute('data-reveal');
    if (secret && t.innerText !== secret) {
      t.style.transform = 'rotateY(90deg)';
      setTimeout(() => {
        t.innerText       = secret;
        t.style.transform = 'rotateY(0deg)';
        t.style.color     = 'var(--color-gold)';
        t.style.borderBottom = 'none';
      }, 150);
    }
  });
}

function _showVipOverlay(vipOverlay, vipTimestamp) {
  if (!vipOverlay) return;
  vipOverlay.style.display = 'flex';
  if (vipTimestamp) vipTimestamp.innerText = new Date().toLocaleTimeString();
}

function _unlockAmritMenu(cursor) {
  const menuGrid = document.querySelector('.menu-grid');
  if (!menuGrid || document.getElementById('amritYugaCard')) return;

  menuGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(280px, 1fr))';

  const card = document.createElement('article');
  card.id        = 'amritYugaCard';
  card.className = 'menu-column menu-column--vip';

  card.innerHTML = `
    <div class="menu-col-header">
      <span class="menu-col-num menu-col-num--vip">${AMRIT_YUGA_ERA.numeral}</span>
      <h3 class="menu-col-title menu-col-title--vip">${AMRIT_YUGA_ERA.title}</h3>
      <span class="menu-col-status menu-col-status--vip">${AMRIT_YUGA_ERA.statusLabel}</span>
    </div>
    <ul class="course-list">
      ${AMRIT_YUGA_ERA.courses.map(c => `
        <li class="course-item">
          <h4 class="course-name course-name--vip">${c.name}</h4>
          <p class="course-details">${c.details}</p>
          <span class="course-meta course-meta--vip">${c.metaLabel}</span>
        </li>
      `).join('')}
    </ul>
  `;

  menuGrid.appendChild(card);

  if (cursor) {
    bindCursorHover(cursor, card.querySelectorAll('.nav-interactive, a, button'));
  }
}
