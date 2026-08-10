/* modules/ticket.js
 * Core Digital Ticket Generator, Data Serializer & Luxury Ticket Renderer.
 * Inspiring Apple Wallet, Rolex craftsmanship, and BookMyShow simplicity.
 */

import { TICKET_SYSTEM, TICKET_STATUS, getVerifyUrl } from '../config/ticket.config.js';
import { } from '../config/app.config.js';
import { generateTicketQRCodeAsync } from './qrcode.js';
import { saveTicketDoc, getTicketDoc, listenToTicketDoc } from './firebase.js';

/**
 * Generate a unique Booking ID string: BT-YYYY-MM-XXXXXX
 * @returns {string} Unique Booking ID
 */
export function generateBookingId() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `${TICKET_SYSTEM.PREFIX}-${year}-${month}-${randomNum}`;
}

/**
 * Create a new ticket object adhering to Firestore collection schema.
 * @param {object} vettingData
 * @param {object} user
 * @returns {object} Ticket data object
 */
export function buildTicketData(vettingData = {}, user = null) {
  const bookingId = generateBookingId();
  const verifyUrl = getVerifyUrl(bookingId);

  const themeName = vettingData.themeName || vettingData.theme || vettingData.title || 'Exclusive Event';
  const date = vettingData.date || vettingData.displayNight || vettingData.eventDate || 'TBD';
  const time = vettingData.time || '20:00';
  const venue = vettingData.venue || vettingData.location || 'Secret Location';
  const userName = vettingData.fullName || user?.name || user?.displayName || 'Honored Guest';
  const amount = vettingData.amount || ((vettingData.quantity || 1) * (vettingData.unitPrice || 3500));

  return {
    ticketId: bookingId,
    bookingId: bookingId,
    eventId: vettingData.eventId || 'current-event',
    themeId: vettingData.themeId || 'midnight_memories',
    themeName: themeName,
    uid: user?.uid || 'GUEST_ANONYMOUS',
    userName: userName,
    email: vettingData.email || user?.email || 'guest@beyondthyme.com',
    phone: vettingData.phone || '',
    venue: venue,
    date: date,
    time: time,
    seatId: vettingData.seatId || 'Seat_01',
    dressCode: TICKET_SYSTEM.DEFAULT_DRESS_CODE,
    status: TICKET_STATUS.CONFIRMED.code,
    qrUrl: verifyUrl,
    ticketUrl: verifyUrl,
    downloadUrl: verifyUrl,
    checkedIn: false,
    checkedInAt: null,
    createdAt: new Date().toISOString(),
    quantity: vettingData.quantity || 1,
    unitPrice: vettingData.unitPrice || 3500,
    amount: amount,
    paymentId: vettingData.paymentId || `pay_${Date.now()}`,
  };
}

/**
 * Save ticket document to Firestore tickets collection.
 * @param {object} ticketData
 */
export async function persistTicket(ticketData) {
  try {
    await saveTicketDoc(ticketData);
    return ticketData;
  } catch (err) {
    console.warn('Failed to persist ticket document to Firestore:', err);
    return ticketData;
  }
}

/**
 * Render the Apple Wallet / Rolex inspired Luxury Digital Ticket inside a DOM container.
 * @param {object} ticket
 * @param {HTMLElement} container
 */
export async function renderLuxuryTicket(ticket, container) {
  if (!container || !ticket) return;

  const statusConfig = TICKET_STATUS[ticket.status] || (ticket.checkedIn ? TICKET_STATUS.CHECKED_IN : TICKET_STATUS.CONFIRMED);
  const targetVerifyUrl = ticket.qrUrl || getVerifyUrl(ticket.bookingId);
  const qrSvg = await generateTicketQRCodeAsync(targetVerifyUrl, TICKET_SYSTEM.QR_SIZE_PX);

  const formattedSeat = (ticket.seatId || 'Seat_01').replace('_', ' ').toUpperCase();

  const ticketMarkup = `
    <article class="luxury-ticket-card" id="luxuryTicketCard">
      <div class="luxury-ticket-border-glow"></div>
      
      <!-- Ticket Header -->
      <header class="luxury-ticket-header">
        <div class="luxury-ticket-brand">
          <span class="luxury-brand-logo">⏳</span>
          <div class="luxury-brand-titles">
            <h4 class="luxury-brand-main">BEYOND THYME</h4>
            <span class="luxury-brand-sub">PRIVATE SUPPER CLUB</span>
          </div>
        </div>
        <span class="luxury-ticket-status-badge ${statusConfig.badgeClass}" id="ticketStatusBadge">
          ${ticket.checkedIn ? 'CHECKED IN' : statusConfig.label}
        </span>
      </header>

      <!-- Theme Banner -->
      <div class="luxury-ticket-banner border-grid">
        <div class="luxury-banner-overlay"></div>
        <div class="luxury-banner-content">
          <span class="luxury-banner-tag">EXCLUSIVE INVITATION</span>
          <h3 class="luxury-banner-title">${ticket.themeName || 'Exclusive Event'}</h3>
        </div>
      </div>

      <!-- Main Specs Grid -->
      <div class="luxury-ticket-specs border-grid">
        <div class="luxury-spec-item">
          <span class="luxury-spec-label">GUEST NAME</span>
          <span class="luxury-spec-value text-gold">${ticket.userName || 'Honored Guest'}</span>
        </div>
        <div class="luxury-spec-item">
          <span class="luxury-spec-label">SEATS RESERVED</span>
          <span class="luxury-spec-value text-coral">${ticket.quantity || 1} Seat(s) (${formattedSeat})</span>
        </div>
        <div class="luxury-spec-item">
          <span class="luxury-spec-label">TOTAL PAID</span>
          <span class="luxury-spec-value text-gold">₹${(ticket.amount || 3500).toLocaleString('en-IN')} INR</span>
        </div>
        <div class="luxury-spec-item">
          <span class="luxury-spec-label">DATE & TIME</span>
          <span class="luxury-spec-value">${ticket.date || 'TBD'} • ${ticket.time || '20:00'}</span>
        </div>
        <div class="luxury-spec-item">
          <span class="luxury-spec-label">VENUE LOCATION</span>
          <span class="luxury-spec-value">${ticket.venue || 'Secret Location'}</span>
        </div>
        <div class="luxury-spec-item">
          <span class="luxury-spec-label">DRESS CODE</span>
          <span class="luxury-spec-value">${ticket.dressCode || TICKET_SYSTEM.DEFAULT_DRESS_CODE}</span>
        </div>
        <div class="luxury-spec-item">
          <span class="luxury-spec-label">BOOKING SERIAL</span>
          <span class="luxury-spec-value font-mono text-gold">${ticket.bookingId}</span>
        </div>
      </div>

      <!-- Footer Live Status -->
      <footer class="luxury-ticket-footer">
        <div class="luxury-footer-live">
          <span class="luxury-live-pulse"></span>
          <span class="luxury-live-text" id="ticketLiveStatusText">
            ${ticket.checkedIn ? 'ENTRY VERIFIED BY DOORMASTER' : 'TIMELINE COUNTDOWN ACTIVE'}
          </span>
        </div>
      </footer>
    </article>
  `;

  container.innerHTML = ticketMarkup;
}

/**
 * Subscribe to real-time status changes for a ticket document.
 * Updates badge and live text instantly when Admin scans the ticket.
 * @param {string} ticketId
 * @param {HTMLElement} ticketContainer
 */
export function initTicketRealtimeSync(ticketId, ticketContainer) {
  if (!ticketId || !ticketContainer) return () => {};

  return listenToTicketDoc(ticketId, (updatedDoc) => {
    if (!updatedDoc) return;

    const badgeEl = ticketContainer.querySelector('#ticketStatusBadge');
    const liveTextEl = ticketContainer.querySelector('#ticketLiveStatusText');

    if (updatedDoc.checkedIn || updatedDoc.status === 'Checked In') {
      if (badgeEl) {
        badgeEl.className = 'luxury-ticket-status-badge badge-checkedin';
        badgeEl.textContent = 'CHECKED IN';
      }
      if (liveTextEl) {
        liveTextEl.textContent = `CHECKED IN AT ${updatedDoc.checkinTime || 'DOOR'}`;
      }
    } else if (updatedDoc.status === 'CANCELLED') {
      if (badgeEl) {
        badgeEl.className = 'luxury-ticket-status-badge badge-cancelled';
        badgeEl.textContent = 'CANCELLED';
      }
      if (liveTextEl) {
        liveTextEl.textContent = 'THIS INVITATION HAS BEEN VOIDED';
      }
    }
  });
}
