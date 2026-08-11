/* modules/admin/adminDashboardService.js
 * Single source of truth canonical data layer for event-driven admin dashboard metrics.
 * Provides normalized, deduplicated aggregations for booked seats, available inventory,
 * historical revenue, live booking streams, check-ins, and event completion statuses.
 */

import { ADMIN_DEFAULTS } from '../../config/admin.config.js';

/**
 * Safe numeric quantity parser with strict fallbacks.
 * @param {*} val
 * @returns {number|null}
 */
export function parseSafeQuantity(val) {
  if (typeof val === 'number' && !isNaN(val) && val > 0) return Math.floor(val);
  if (typeof val === 'string' && val.trim() !== '') {
    const parsed = parseInt(val.trim(), 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return null;
}

/**
 * Safe numeric monetary amount parser with strict fallbacks.
 * @param {*} val
 * @returns {number|null}
 */
export function parseSafeAmount(val) {
  if (typeof val === 'number' && !isNaN(val) && val > 0) return val;
  if (typeof val === 'string' && val.trim() !== '') {
    const parsed = parseFloat(val.trim());
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return null;
}

/**
 * Helper to determine if a booking document represents a valid confirmed transaction.
 * @param {object} b
 * @returns {boolean}
 */
export function isValidConfirmedBooking(b) {
  if (!b) return false;
  const status = String(b.status || b.bookingStatus || b.paymentStatus || '').toUpperCase().trim();

  // Explicit invalid states
  if (status === 'CANCELLED' || status === 'FAILED' || status === 'EXPIRED' || status === 'AVAILABLE' || status === 'LOCKED' || status === 'VOID') {
    return false;
  }

  // Explicit valid confirmed states
  if (status === 'BOOKED' || status === 'CONFIRMED' || status === 'PAID' || status === 'SUCCESS') {
    return true;
  }

  // Implicit confirmation check: document contains guest or payment data and is not explicitly invalid
  const hasGuestInfo = Boolean(b.userName || b.userEmail || b.email || b.fullName || b.uid);
  const hasPaymentOrSeats = Boolean(b.amount || b.paymentId || b.quantity || b.seatId || b.bookedAt || b.createdAt || b.vetting);
  return hasGuestInfo && hasPaymentOrSeats;
}

/**
 * Determine whether a booking record belongs to the active selected event.
 * Priority:
 * 1. Exact eventId match
 * 2. Exact clubId / themeId reference match
 * 3. Fallback to name match only if document lacks explicit eventId/clubId
 * @param {object} b - Booking document
 * @param {object|null} selectedEvent - Active selected event object
 * @returns {boolean}
 */
export function isBookingForEvent(b, selectedEvent) {
  if (!b || !selectedEvent) return false;

  const targetEventId = String(selectedEvent.id || selectedEvent.clubKey || '').trim().toLowerCase();
  const targetThemeId = String(selectedEvent.themeId || '').trim().toLowerCase();

  const bEventId = String(b.eventId || '').trim().toLowerCase();
  const bClubId = String(b.clubId || b.event_id || b.vetting?.clubId || b.vetting?.eventId || '').trim().toLowerCase();
  const bThemeId = String(b.themeId || b.vetting?.themeId || '').trim().toLowerCase();

  // 1. Specific Event ID match (ignoring generic placeholder 'current-event')
  if (targetEventId) {
    if (bEventId && bEventId !== 'current-event' && bEventId === targetEventId) return true;
    if (bClubId && bClubId !== 'current-event' && bClubId === targetEventId) return true;
  }
  if (targetThemeId && bThemeId && bThemeId === targetThemeId) return true;

  // 2. Fallback to normalized Theme / Event Title matching (handles 'current-event' and name variations)
  const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const eNameNorm = norm(selectedEvent.name || selectedEvent.title || selectedEvent.id || '');
  const bNameNorm = norm(b.themeName || b.title || b.name || b.vetting?.themeName || '');

  if (eNameNorm && bNameNorm) {
    if (eNameNorm === bNameNorm || eNameNorm.includes(bNameNorm) || bNameNorm.includes(eNameNorm)) {
      return true;
    }
  }

  return false;
}

/**
 * Build a canonical, deduplicated array of booking records across seatBookings and tickets collections.
 * Prevents double-counting purchases stored in both collections (Requirement 6 & 7).
 * @param {Array} seatBookings - Documents from 'seatBookings' collection
 * @param {Array} tickets - Documents from 'tickets' collection
 * @returns {Array} Canonical normalized bookings array
 */
export function buildCanonicalBookings(seatBookings = [], tickets = []) {
  const map = new Map();

  const processDoc = (doc, source) => {
    if (!doc) return;
    const canonicalId = String(
      doc.bookingId || doc.ticketId || doc.paymentId || doc.id || `anon_${Math.random()}`
    ).trim();

    const vetting = doc.vetting || {};

    const quantity =
      parseSafeQuantity(doc.quantity) ||
      parseSafeQuantity(vetting.quantity) ||
      parseSafeQuantity(doc.ticketQuantity) ||
      parseSafeQuantity(doc.tickets) ||
      parseSafeQuantity(doc.seatsCount) ||
      1;

    const unitPrice =
      parseSafeAmount(doc.unitPrice) ||
      parseSafeAmount(doc.ticketPrice) ||
      parseSafeAmount(doc.price) ||
      parseSafeAmount(vetting.unitPrice) ||
      ADMIN_DEFAULTS.DEFAULT_PRICE_INR;

    const totalAmount =
      parseSafeAmount(doc.amount) ||
      parseSafeAmount(doc.totalAmount) ||
      parseSafeAmount(vetting.amount) ||
      (quantity * unitPrice);

    const guestName = doc.userName || vetting.fullName || doc.name || doc.userEmail || 'Honored Guest';
    const email = doc.userEmail || doc.email || vetting.email || '';
    const eventId = doc.eventId || doc.clubId || vetting.clubId || vetting.eventId || '';
    const themeName = doc.themeName || doc.title || vetting.themeName || '';
    const seatId = doc.seatId || vetting.seatId || 'Seat_01';
    const seatNum = typeof doc.seatNum === 'number' ? doc.seatNum : (parseInt(String(seatId).replace(/\D/g, ''), 10) || 1);
    const checkedIn = doc.checkedIn === true || doc.attendance === 'Checked In' || doc.status === 'CHECKED_IN';
    const checkinTime = doc.checkinTime || doc.checkedInAt || null;
    const timestamp = doc.bookedAt || doc.createdAt || doc.timestamp || new Date().toISOString();

    const record = {
      canonicalId,
      bookingId: canonicalId,
      eventId,
      themeName,
      guestName,
      email,
      phone: vetting.phone || doc.phone || '',
      quantity,
      unitPrice,
      totalAmount,
      seatId,
      seatNum,
      checkedIn,
      checkinTime,
      status: doc.status || doc.paymentStatus || 'CONFIRMED',
      paymentStatus: doc.paymentStatus || 'PAID',
      bookedAt: timestamp,
      source,
      vetting,
      rawDoc: doc,
    };

    if (map.has(canonicalId)) {
      // Merge richer properties (e.g. check-in status from tickets)
      const existing = map.get(canonicalId);
      map.set(canonicalId, {
        ...existing,
        checkedIn: existing.checkedIn || record.checkedIn,
        checkinTime: existing.checkinTime || record.checkinTime,
        phone: existing.phone || record.phone,
        vetting: Object.keys(existing.vetting || {}).length > 0 ? existing.vetting : record.vetting,
      });
    } else {
      map.set(canonicalId, record);
    }
  };

  if (Array.isArray(seatBookings)) seatBookings.forEach(d => processDoc(d, 'seatBookings'));
  if (Array.isArray(tickets)) tickets.forEach(d => processDoc(d, 'tickets'));

  return Array.from(map.values());
}

/**
 * Compute authoritative dashboard metrics for a selected event.
 * @param {object|null} selectedEvent - Active selected event object
 * @param {Array} seatBookings - Documents from seatBookings collection
 * @param {Array} tickets - Documents from tickets collection
 * @param {Array} users - Platform user documents
 * @param {Array} activeReservations - Unexpired 5-min holds
 * @returns {object} Calculated dashboard data payload
 */
export function getEventDashboardData(selectedEvent = null, seatBookings = [], tickets = [], users = [], activeReservations = []) {
  const canonicalAll = buildCanonicalBookings(seatBookings, tickets);

  const eventId = selectedEvent?.id || '';
  const capacity = selectedEvent ? (parseInt(selectedEvent.capacity, 10) || 25) : 25;

  // Filter canonical bookings strictly for the selected event (Requirements 1 & 12)
  const matchingBookings = selectedEvent
    ? canonicalAll.filter(b => isBookingForEvent(b, selectedEvent))
    : canonicalAll;

  // Filter confirmed bookings (Requirement 5)
  const confirmedBookings = matchingBookings.filter(isValidConfirmedBooking);

  // Calculate total booked seats using SUM(quantity) (Requirement 8)
  let bookedSeats = 0;
  confirmedBookings.forEach(b => {
    bookedSeats += b.quantity;
  });

  // Calculate active unexpired 5-min reservations
  const nowMs = Date.now();
  let reservedSeats = 0;
  if (selectedEvent && Array.isArray(activeReservations)) {
    activeReservations.forEach(r => {
      if (r && r.status === 'RESERVED' && r.expiresAt > nowMs) {
        if (isBookingForEvent(r, selectedEvent)) {
          const qty = parseSafeQuantity(r.quantity) || 1;
          reservedSeats += qty;
        }
      }
    });
  }

  // Calculate Available Seats (Requirement 9)
  const availableSeats = Math.max(0, capacity - bookedSeats - reservedSeats);

  // Calculate Total Revenue using SUM(totalAmount) (Requirement 10)
  let revenue = 0;
  confirmedBookings.forEach(b => {
    revenue += b.totalAmount;
  });

  // Live stream: Sorted by bookedAt descending (Requirement 12)
  const liveBookings = [...confirmedBookings].sort((a, b) => {
    const timeA = new Date(a.bookedAt || 0).getTime();
    const timeB = new Date(b.bookedAt || 0).getTime();
    return timeB - timeA;
  });

  // Check-ins: Total checked in tickets/guests (Requirement 14 & 15)
  let checkedInGuests = 0;
  matchingBookings.forEach(b => {
    if (b.checkedIn) {
      checkedInGuests += b.quantity;
    }
  });

  return {
    eventId,
    eventName: selectedEvent?.name || selectedEvent?.title || 'Selected Event',
    capacity,
    bookedSeats,
    availableSeats,
    reservedSeats,
    revenue,
    bookingCount: confirmedBookings.length,
    totalSeatBookingsLoaded: seatBookings.length,
    totalTicketsLoaded: tickets.length,
    totalCanonicalBookings: canonicalAll.length,
    matchingBookingsCount: confirmedBookings.length,
    checkedInGuests,
    isSoldOut: availableSeats === 0 || bookedSeats >= capacity,
    liveBookings,
    globalMembers: users.length || 0,
  };
}

/**
 * Determine accurate event status considering date/time and explicit administrative status.
 * Prevents future events from prematurely displaying as COMPLETED (Requirement 20).
 * @param {object} eventObj
 * @returns {string} Normalized status label: 'PUBLISHED' | 'SOLD_OUT' | 'COMPLETED' | 'CLOSED' | 'DRAFT'
 */
export function getNormalizedEventStatus(eventObj) {
  if (!eventObj) return 'DRAFT';

  const rawStatus = (eventObj.status || 'Published').toUpperCase();
  if (rawStatus === 'DRAFT' || rawStatus === 'CANCELLED' || rawStatus === 'ARCHIVED') {
    return eventObj.status;
  }

  // Check if date/time has passed in local time
  const now = new Date();
  const eventTimeStr = eventObj.eventEndTime || eventObj.eventDate || eventObj.eventStartTime;
  const eventTime = eventTimeStr ? new Date(eventTimeStr) : null;

  const isPast = eventTime && !isNaN(eventTime.getTime()) && eventTime.getTime() > 0 && eventTime < now;

  if (isPast || rawStatus === 'COMPLETED') {
    return 'Completed';
  }

  const cap = parseInt(eventObj.capacity || 25, 10);
  const booked = parseInt(eventObj.bookedSeats || 0, 10);
  if (booked >= cap || (eventObj.availableSeats !== undefined && eventObj.availableSeats <= 0)) {
    return 'Sold Out';
  }

  return eventObj.status || 'Published';
}
