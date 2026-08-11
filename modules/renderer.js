/* modules/renderer.js
 * DOM rendering driven entirely by config data.
 * No hardcoded strings, no inline styles — all from config/ files.
 */

import { getAvailableSeats } from '../config/clubs.js';
import { GUESTBOOK_EMOJIS } from '../config/app.config.js';

// ─── Club card selector ───────────────────────────────────────────────────────

/**
 * Render all 4 club selector cards from CLUBS_CONFIG data.
 * Replaces any existing club cards in #clubCardsRow.
 * @param {object} clubsConfig   — CLUBS_CONFIG object
 * @param {string} activeClubId  — initially selected club id
 * @param {Function} onClubSelect — callback(clubId)
 */
export function renderClubCards(clubsConfig, activeClubId, onClubSelect) {
  const row = document.getElementById('clubCardsRow');
  if (!row) return;

  row.innerHTML = '';

  const now = new Date();

  Object.values(clubsConfig).forEach((club) => {
    const isExpired = new Date(club.eventDate) <= now || club.status === 'Closed';
    const available = getAvailableSeats(club);
    const isSoldOut = available <= 0 || club.status === 'Sold_Out';
    const isActive  = club.id === activeClubId;

    let availLabel = `${available} SEATS OPEN`;
    if (club.status === 'Closed' || isExpired) {
      availLabel = 'CLOSED';
    } else if (isSoldOut) {
      availLabel = 'SOLD OUT';
    }

    const btn = document.createElement('button');
    btn.className  = `club-card nav-interactive${isActive ? ' active' : ''}${(isExpired || isSoldOut) ? ' expired' : ''}`;
    btn.setAttribute('data-club', club.id);
    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');

    const d = new Date(club.eventDate);
    const shortDay = d.toLocaleDateString('en-US', { weekday: 'short' });
    const shortMonth = d.toLocaleDateString('en-US', { month: 'short' });
    const dateNum = d.getDate();
    const timeStr = d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const derivedNight = `${shortDay} ${shortMonth} ${dateNum} &middot; ${timeStr}`;

    btn.innerHTML = `
      <div class="club-card-image-box">
        <img src="${club.image}" alt="${club.name}" class="club-card-image">
        <div class="club-card-numeral">${club.romanNumeral}</div>
      </div>
      <div class="club-card-content">
        <div class="club-card-header-row">
          <span class="club-card-emblem">${club.emblem}</span>
          <div class="club-card-availability ${(isExpired || isSoldOut) ? 'is-expired' : ''}">
            <span class="club-avail-dot"></span>
            <span class="club-avail-text">${availLabel}</span>
          </div>
        </div>
        <h3 class="club-card-name">${club.name}</h3>
        <p class="club-card-location">${club.location}</p>
        <div class="club-card-night">
          <span>${derivedNight}</span>
          <span class="club-card-price-tag">₹${(club.price || 3500).toLocaleString('en-IN')}</span>
        </div>
      </div>
    `;

    btn.addEventListener('click', () => {
      if (btn.getAttribute('data-club') === activeClubId) return;

      row.querySelectorAll('.club-card').forEach(b => {
        b.classList.remove('active');
        if (b.classList.contains('club-card')) {
          b.setAttribute('aria-pressed', 'false');
        }
      });
      btn.classList.add('active');
      if (btn.classList.contains('club-card')) {
        btn.setAttribute('aria-pressed', 'true');
      }

      onClubSelect?.(club.id);
    });

    row.appendChild(btn);
  });
}
// ─── Menu ─────────────────────────────────────────────────────────────────────

/**
 * Render the Eras of Flavor menu from MENU_ERAS data.
 * Replaces any existing content in .menu-grid.
 * @param {Array} menuEras — MENU_ERAS array from config/menu.js
 */
export function renderMenu(menuEras) {
  const grid = document.querySelector('.menu-grid');
  if (!grid) return;

  grid.innerHTML = '';

  menuEras.forEach(era => {
    const article = document.createElement('article');
    article.className = `menu-column${era.highlighted ? ' menu-column-highlighted' : ''}`;
    article.setAttribute('data-era', era.id);

    const statusClass = {
      archived:    'status-archived',
      active:      'status-active',
      speculative: 'status-speculative',
    }[era.statusType] || '';

    const titleClass = era.highlighted ? 'menu-col-title text-coral' : 'menu-col-title';

    article.innerHTML = `
      <div class="menu-col-header">
        <span class="menu-col-num">${era.numeral}</span>
        <h3 class="${titleClass}">${era.title}</h3>
        <span class="menu-col-status ${statusClass}">${era.statusLabel}</span>
      </div>
      <ul class="course-list">
        ${era.courses.map(c => {
          const nameClass = c.accentName ? 'course-name text-coral'
                          : c.mutedName  ? 'course-name text-ash'
                          : 'course-name';
          const metaClass = c.metaType === 'active' ? 'course-meta course-meta-active' : 'course-meta';
          return `
            <li class="course-item">
              <h4 class="${nameClass}">${c.name}</h4>
              <p class="course-details">${c.details}</p>
              <span class="${metaClass}">${c.metaLabel}</span>
            </li>
          `;
        }).join('')}
      </ul>
    `;

    grid.appendChild(article);
  });
}

// ─── Guestbook ────────────────────────────────────────────────────────────────

/**
 * Render seed guestbook entries into #guestbookOutput.
 * @param {Array} entries — SEED_GUESTBOOK_ENTRIES from config/guestbook.js
 */
export function renderGuestbook(entries) {
  const output = document.getElementById('guestbookOutput');
  if (!output) return;

  output.innerHTML = '';
  entries.forEach(entry => _appendGuestbookRow(output, entry.emoji, entry.alias, entry.message, entry.yuga));
}

/**
 * Append a new guestbook entry (from form submission).
 * @param {string} alias
 * @param {string} message
 */
export function appendGuestbookEntry(alias, message) {
  const output = document.getElementById('guestbookOutput');
  if (!output) return;

  const emoji = GUESTBOOK_EMOJIS[Math.floor(Math.random() * GUESTBOOK_EMOJIS.length)];
  _appendGuestbookRow(output, emoji, alias, `"${message}"`, 'India Yuga');
  output.scrollTop = output.scrollHeight;
}

// ─── Private helpers ──────────────────────────────────────────────────────────

function _appendGuestbookRow(container, emoji, alias, message, yuga) {
  const row = document.createElement('div');
  row.className = 'guestbook-row';
  row.innerHTML = `
    <span class="guestbook-alias">${emoji} ${alias.toUpperCase()}:</span>
    <span class="guestbook-message">${message} <span class="guestbook-yuga">· ${yuga}</span></span>
  `;
  container.appendChild(row);
}
