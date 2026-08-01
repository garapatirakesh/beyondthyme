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
    const isExpired = new Date(club.eventDate) <= now;
    if (isExpired) return; // Only show active/future clubs in the main strip

    const available = getAvailableSeats(club);
    const isActive  = club.id === activeClubId;

    const btn = document.createElement('button');
    btn.className  = `club-card nav-interactive${isActive ? ' active' : ''}`;
    btn.setAttribute('data-club', club.id);
    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');

    btn.innerHTML = `
      <div class="club-card-inner">
        <div class="club-card-glow" style="--glow-color: ${club.glowColor};"></div>
        <div class="club-card-emblem">${club.emblem}</div>
        <div class="club-card-numeral">${club.romanNumeral}</div>
        <h3 class="club-card-name">${club.name}</h3>
        <p class="club-card-location">${club.location}</p>
        <div class="club-card-night">${club.displayNight}</div>
        <div class="club-card-availability">
          <span class="club-avail-dot"></span>
          <span class="club-avail-text">${available} SEATS OPEN</span>
        </div>
        <div class="club-card-accent-line"></div>
      </div>
    `;

    btn.addEventListener('click', () => {
      if (btn.getAttribute('data-club') === activeClubId) return;

      document.querySelectorAll('.club-card, .archive-card').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');

      onClubSelect?.(club.id);
    });

    row.appendChild(btn);
  });
}

/**
 * Render expired/past events into the slide-out archives drawer.
 * @param {object} clubsConfig
 * @param {string} activeClubId
 * @param {Function} onClubSelect
 */
export function renderArchivedDrawer(clubsConfig, activeClubId, onClubSelect) {
  const container = document.getElementById('archivedDrawerCards');
  if (!container) return;

  container.innerHTML = '';

  const now = new Date();

  Object.values(clubsConfig).forEach((club) => {
    const isExpired = new Date(club.eventDate) <= now;
    if (!isExpired) return; // Only show expired/past events here

    const isActive = club.id === activeClubId;

    const btn = document.createElement('button');
    btn.className  = `archive-card nav-interactive${isActive ? ' active' : ''}`;
    btn.setAttribute('data-club', club.id);

    btn.innerHTML = `
      <div class="archive-card-inner">
        <div class="archive-card-header">
          <span class="archive-card-numeral">${club.romanNumeral}</span>
          <span class="archive-card-lock">🔒 CLOSED</span>
        </div>
        <h4 class="archive-card-name">${club.name}</h4>
        <p class="archive-card-meta">${club.location}</p>
        <p class="archive-card-date">${club.displayNight}</p>
      </div>
    `;

    btn.addEventListener('click', () => {
      document.querySelectorAll('.club-card, .archive-card').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');

      onClubSelect?.(club.id);
    });

    container.appendChild(btn);
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
