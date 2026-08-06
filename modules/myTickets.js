/* modules/myTickets.js
 * User Profile "My Tickets" view, category tabs, filtering, and re-download/re-share manager.
 */

import { getUserTickets } from './firebase.js';
import { getCurrentUser } from './auth.js';
import { renderLuxuryTicket, initTicketRealtimeSync } from './ticket.js';
import { downloadTicketAsPDF, downloadTicketAsPNG, shareTicketOnWhatsApp } from './ticketExporter.js';

let cachedTickets = [];
let activeTab = 'upcoming';

/**
 * Initialize "My Tickets" drawer / modal listeners.
 */
export function initMyTickets() {
  const openBtn = document.getElementById('myTicketsNavBtn');
  const modal = document.getElementById('myTicketsModal');
  const closeBtn = document.getElementById('closeMyTicketsBtn');
  const searchInput = document.getElementById('myTicketsSearchInput');

  openBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    openMyTicketsModal();
  });

  closeBtn?.addEventListener('click', () => {
    closeMyTicketsModal();
  });

  // Category filter tabs
  const tabBtns = document.querySelectorAll('.my-tickets-tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeTab = btn.getAttribute('data-tab') || 'upcoming';
      renderMyTicketsList();
    });
  });

  // Search input filter
  searchInput?.addEventListener('input', () => {
    renderMyTicketsList();
  });
}

/**
 * Open the "My Tickets" modal and load the user's tickets.
 */
export async function openMyTicketsModal() {
  const modal = document.getElementById('myTicketsModal');
  if (!modal) return;

  modal.classList.remove('overlay-backdrop--hidden');
  modal.classList.add('active');

  const user = getCurrentUser();
  const userIdentifier = user?.uid || user?.email || localStorage.getItem('bt_last_guest_email');

  // Load from Firestore
  if (userIdentifier) {
    const remoteTickets = await getUserTickets(userIdentifier);
    cachedTickets = remoteTickets.length > 0 ? remoteTickets : _getLocalCachedTickets();
  } else {
    cachedTickets = _getLocalCachedTickets();
  }

  renderMyTicketsList();
}

/**
 * Close "My Tickets" modal.
 */
export function closeMyTicketsModal() {
  const modal = document.getElementById('myTicketsModal');
  if (modal) {
    modal.classList.add('overlay-backdrop--hidden');
    modal.classList.remove('active');
  }
}

/**
 * Render filtered list of user tickets into container.
 */
export function renderMyTicketsList() {
  const listContainer = document.getElementById('myTicketsListContainer');
  const searchInput = document.getElementById('myTicketsSearchInput');
  if (!listContainer) return;

  const queryText = (searchInput?.value || '').toLowerCase().trim();
  const now = new Date();

  const filtered = cachedTickets.filter(ticket => {
    // Status filter
    const tDate = new Date(ticket.date || now);
    const isCancelled = ticket.status === 'CANCELLED';
    const isPast = tDate < now || ticket.checkedIn;

    if (activeTab === 'cancelled' && !isCancelled) return false;
    if (activeTab === 'past' && (!isPast || isCancelled)) return false;
    if (activeTab === 'upcoming' && (isPast || isCancelled)) return false;

    // Search query filter
    if (queryText) {
      const matchId = (ticket.bookingId || '').toLowerCase().includes(queryText);
      const matchTheme = (ticket.themeName || '').toLowerCase().includes(queryText);
      const matchVenue = (ticket.venue || '').toLowerCase().includes(queryText);
      const matchName = (ticket.userName || '').toLowerCase().includes(queryText);
      return matchId || matchTheme || matchVenue || matchName;
    }

    return true;
  });

  listContainer.innerHTML = '';

  if (filtered.length === 0) {
    listContainer.innerHTML = `
      <div class="my-tickets-empty">
        <span class="empty-icon">🎟️</span>
        <h4 class="empty-title">NO ${activeTab.toUpperCase()} TICKETS FOUND</h4>
        <p class="empty-desc text-ash">You have no active tickets under this section.</p>
      </div>
    `;
    return;
  }

  filtered.forEach(ticket => {
    const card = document.createElement('div');
    card.className = 'my-ticket-summary-card border-grid';
    
    const formattedSeat = (ticket.seatId || 'Seat_01').replace('_', ' ').toUpperCase();

    card.innerHTML = `
      <div class="summary-card-header">
        <span class="summary-card-id text-gold font-mono">${ticket.bookingId}</span>
        <span class="summary-card-badge ${ticket.checkedIn ? 'badge-checkedin' : 'badge-confirmed'}">
          ${ticket.checkedIn ? 'CHECKED IN' : ticket.status || 'CONFIRMED'}
        </span>
      </div>
      <div class="summary-card-body">
        <h4 class="summary-card-theme">${ticket.themeName || 'Midnight Memories'}</h4>
        <p class="summary-card-meta text-ash">${ticket.date} • ${ticket.time} • ${ticket.venue}</p>
        <p class="summary-card-seat text-coral">Reserved Seat: ${formattedSeat}</p>
      </div>
      <div class="summary-card-actions">
        <button class="btn-pill btn-ghost btn-sm view-ticket-btn" data-id="${ticket.bookingId}">View Ticket</button>
        <button class="btn-pill btn-ghost btn-sm pdf-ticket-btn" data-id="${ticket.bookingId}">PDF</button>
        <button class="btn-pill btn-ghost btn-sm png-ticket-btn" data-id="${ticket.bookingId}">PNG</button>
        <button class="btn-pill btn-ghost btn-sm wa-ticket-btn" data-id="${ticket.bookingId}">WhatsApp</button>
      </div>
    `;

    // Action handlers
    card.querySelector('.view-ticket-btn')?.addEventListener('click', async () => {
      openTicketVerificationModal(ticket);
    });

    card.querySelector('.pdf-ticket-btn')?.addEventListener('click', async () => {
      const tempDiv = document.createElement('div');
      tempDiv.className = 'temp-ticket-export-host';
      document.body.appendChild(tempDiv);
      await renderLuxuryTicket(ticket, tempDiv);
      const cardEl = tempDiv.querySelector('#luxuryTicketCard');
      await downloadTicketAsPDF(cardEl, ticket.bookingId);
      document.body.removeChild(tempDiv);
    });

    card.querySelector('.png-ticket-btn')?.addEventListener('click', async () => {
      const tempDiv = document.createElement('div');
      tempDiv.className = 'temp-ticket-export-host';
      document.body.appendChild(tempDiv);
      await renderLuxuryTicket(ticket, tempDiv);
      const cardEl = tempDiv.querySelector('#luxuryTicketCard');
      await downloadTicketAsPNG(cardEl, ticket.bookingId);
      document.body.removeChild(tempDiv);
    });

    card.querySelector('.wa-ticket-btn')?.addEventListener('click', () => {
      shareTicketOnWhatsApp(ticket);
    });

    listContainer.appendChild(card);
  });
}

/**
 * Save a newly created ticket to local storage for offline / quick reference.
 * @param {object} ticket
 */
export function cacheTicketLocally(ticket) {
  if (!ticket) return;
  const current = _getLocalCachedTickets();
  const exists = current.findIndex(t => t.bookingId === ticket.bookingId);
  if (exists >= 0) {
    current[exists] = ticket;
  } else {
    current.unshift(ticket);
  }
  localStorage.setItem('bt_local_tickets', JSON.stringify(current));
  if (ticket.email) {
    localStorage.setItem('bt_last_guest_email', ticket.email);
  }
}

function _getLocalCachedTickets() {
  try {
    const raw = localStorage.getItem('bt_local_tickets');
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    return [];
  }
}

/**
 * Open full-screen luxury ticket view modal for any ticket.
 * @param {object} ticket
 */
export async function openTicketVerificationModal(ticket) {
  const overlay = document.getElementById('ticketOverlay');
  const container = document.getElementById('ticketOverlayContainer');
  if (!overlay || !container) return;

  await renderLuxuryTicket(ticket, container);
  overlay.classList.remove('overlay-backdrop--hidden');
  overlay.classList.add('active');

  // Realtime check-in sync listener
  initTicketRealtimeSync(ticket.bookingId, container);
}
