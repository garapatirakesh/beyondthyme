/* modules/admin/adminSeating.js
 * Admin Seating Management module (Event-Driven Dynamic Floorplan Controls).
 */

import { ADMIN_DEFAULTS } from '../../config/admin.config.js';
import { writeFirestoreDoc } from '../firebase.js';
import { buildCanonicalBookings, isBookingForEvent, isValidConfirmedBooking } from './adminDashboardService.js';

let currentSelectedEvent = null;
let currentEventBookings = [];

/**
 * Render Interactive Event-Specific Floorplan Grid.
 * @param {Array} seatBookings - Live array of seatBookings documents
 * @param {Array} tickets - Live array of ticket documents
 * @param {object} selectedEvent - Currently selected active event object
 */
export function renderAdminSeatingView(seatBookings = [], tickets = [], selectedEvent = null) {
  if (Array.isArray(tickets) && !Array.isArray(seatBookings)) {
    selectedEvent = tickets;
    tickets = [];
  } else if (!selectedEvent && !Array.isArray(tickets) && typeof seatBookings === 'object') {
    selectedEvent = seatBookings;
    seatBookings = [];
    tickets = [];
  }

  currentSelectedEvent = selectedEvent;
  const grid = document.getElementById('adminInteractiveSeatGrid');
  const titleEl = document.getElementById('adminSeatingTitle');
  const schematicTitleEl = document.getElementById('adminSeatingSchematicTitle');
  if (!grid) return;

  const eventName = selectedEvent?.name || selectedEvent?.title || 'Selected Event';
  const eventDate = selectedEvent?.displayNight || selectedEvent?.eventDate || '';
  const maxSeats = selectedEvent ? (parseInt(selectedEvent.capacity, 10) || 7) : 25;

  const canonicalAll = buildCanonicalBookings(seatBookings, tickets);
  currentEventBookings = selectedEvent
    ? canonicalAll.filter(b => isBookingForEvent(b, selectedEvent))
    : canonicalAll;

  // Update Section Headers
  if (titleEl) {
    titleEl.innerText = `${eventName.toUpperCase()} — ${maxSeats}-SEAT FLOORPLAN CONTROLS`;
  }
  if (schematicTitleEl) {
    schematicTitleEl.innerText = `${eventName} (${eventDate}) — ${maxSeats} Seats Schematic`;
  }

  grid.innerHTML = '';

  const confirmedBookings = currentEventBookings.filter(isValidConfirmedBooking);

  // Map explicit seats
  let totalBookedCount = 0;
  const explicitSeatMap = new Map();

  confirmedBookings.forEach(b => {
    totalBookedCount += b.quantity;
    const nameLabel = (b.guestName || 'BOOKED').split(' ')[0].toUpperCase();
    if (b.seatNum) explicitSeatMap.set(b.seatNum, nameLabel);
    if (b.seatId) {
      const num = parseInt(String(b.seatId).replace(/\D/g, ''), 10);
      if (!isNaN(num) && num > 0) explicitSeatMap.set(num, nameLabel);
    }
  });

  const primaryGuestName = confirmedBookings[0] ? (confirmedBookings[0].guestName || 'BOOKED').split(' ')[0].toUpperCase() : 'BOOKED';

  for (let i = 1; i <= maxSeats; i++) {
    const seatIdStr = `Seat_${String(i).padStart(2, '0')}`;
    const directBooking = currentEventBookings.find(b => b.seatNum === i || b.seatId === seatIdStr);

    let statusCls = 'available';
    let statusLabel = 'OPEN';

    if (explicitSeatMap.has(i)) {
      statusCls = 'booked';
      statusLabel = explicitSeatMap.get(i);
    } else if (i <= totalBookedCount) {
      statusCls = 'booked';
      statusLabel = primaryGuestName;
    } else if (directBooking?.status === 'LOCKED' || directBooking?.status === 'RESERVED') {
      statusCls = 'locked';
      statusLabel = directBooking.status;
    }

    const card = document.createElement('div');
    card.className = `admin-seat-card ${statusCls}`;
    card.innerHTML = `
      <div class="admin-seat-num">P${String(i).padStart(2, '0')}</div>
      <div class="admin-seat-status">${statusLabel}</div>
    `;

    card.addEventListener('click', () => {
      _openSeatActionMenu(i, booking, selectedEvent);
    });

    grid.appendChild(card);
  }
}

export function initAdminSeatingListeners() {
  const resetBtn = document.getElementById('btnResetAllSeats');
  if (resetBtn) {
    resetBtn.addEventListener('click', async () => {
      const eventName = currentSelectedEvent?.name || 'this event';
      const maxSeats = currentSelectedEvent ? (parseInt(currentSelectedEvent.capacity, 10) || 7) : 25;
      const eventId = currentSelectedEvent?.id || 'zenitsu';

      if (confirm(`Are you sure you want to reset all ${maxSeats} seats for "${eventName}" to AVAILABLE?`)) {
        for (let i = 1; i <= maxSeats; i++) {
          const seatIdStr = String(i).padStart(2, '0');
          const docId = `booking_${eventId}_seat_${seatIdStr}`;
          await writeFirestoreDoc('seatBookings', docId, {
            bookingId: docId,
            eventId: eventId,
            clubId: eventId,
            seatId: `Seat_${seatIdStr}`,
            seatNum: i,
            userName: '',
            userAvatar: '',
            status: 'AVAILABLE',
            bookedAt: null,
          });
        }
        alert(`All ${maxSeats} seats for "${eventName}" reset to AVAILABLE.`);
      }
    });
  }
}

async function _openSeatActionMenu(seatNum, booking, selectedEvent) {
  const seatIdStr = String(seatNum).padStart(2, '0');
  const eventId = selectedEvent?.id || booking?.eventId || booking?.clubId || 'zenitsu';
  const eventName = selectedEvent?.name || booking?.themeName || 'Supper Club';
  const docId = booking?.bookingId || `booking_${eventId}_seat_${seatIdStr}`;
  const currentStatus = booking?.status || 'AVAILABLE';

  const action = prompt(
    `EVENT: ${eventName.toUpperCase()}\nSEAT P${seatIdStr} MANAGEMENT\nCurrent Status: ${currentStatus}\n\nChoose an Action:\n1 - Lock Seat\n2 - Reserve Seat\n3 - Assign Guest Manually\n4 - Release / Unlock Seat`,
    '1'
  );

  if (!action) return;

  if (action === '1') {
    await writeFirestoreDoc('seatBookings', docId, {
      bookingId: docId,
      eventId: eventId,
      clubId: eventId,
      themeName: eventName,
      seatId: `Seat_${seatIdStr}`,
      seatNum: seatNum,
      status: 'LOCKED',
      updatedAt: new Date().toISOString(),
    });
  } else if (action === '2') {
    await writeFirestoreDoc('seatBookings', docId, {
      bookingId: docId,
      eventId: eventId,
      clubId: eventId,
      themeName: eventName,
      seatId: `Seat_${seatIdStr}`,
      seatNum: seatNum,
      status: 'RESERVED',
      updatedAt: new Date().toISOString(),
    });
  } else if (action === '3') {
    const name = prompt('Enter Guest Name to Assign:', 'VIP Guest');
    if (name) {
      await writeFirestoreDoc('seatBookings', docId, {
        bookingId: docId,
        eventId: eventId,
        clubId: eventId,
        themeName: eventName,
        seatId: `Seat_${seatIdStr}`,
        seatNum: seatNum,
        userName: name,
        userAvatar: '👑',
        status: 'BOOKED',
        bookedAt: new Date().toISOString(),
      });
    }
  } else if (action === '4') {
    await writeFirestoreDoc('seatBookings', docId, {
      bookingId: docId,
      eventId: eventId,
      clubId: eventId,
      themeName: eventName,
      seatId: `Seat_${seatIdStr}`,
      seatNum: seatNum,
      userName: '',
      userAvatar: '',
      status: 'AVAILABLE',
      bookedAt: null,
      updatedAt: new Date().toISOString(),
    });
  }
}
