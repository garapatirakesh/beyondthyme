/* config/clubs.js
 * SINGLE SOURCE OF TRUTH for all supper club data.
 * Contains concrete eventDate calendar strings to track active vs past events.
 */
export const CLUBS_CONFIG = {};


/** Returns the number of available seats for a given club config object */
export function getAvailableSeats(club) {
  if (!club) return 0;

  if (typeof club.availableSeats === 'number') {
    return club.availableSeats;
  }

  const totalSeats = typeof club.capacity === 'number' ? club.capacity : (parseInt(club.capacity, 10) || 25);

  // Calculate confirmed bookings from bookedSeats or occupied array length
  let bookedCount = 0;
  if (typeof club.bookedSeats === 'number') {
    bookedCount = club.bookedSeats;
  } else if (Array.isArray(club.occupied)) {
    bookedCount = club.occupied.length;
  }

  // Active unexpired reservations
  const reservedCount = typeof club.reservedSeats === 'number' ? club.reservedSeats : 0;

  return Math.max(0, totalSeats - bookedCount - reservedCount);
}

/** Returns clubs as an ordered array (preserving insertion order) */
export function getClubsArray() {
  return Object.values(CLUBS_CONFIG);
}

/** 
 * Scans occupied list and returns the next free seat ID based on club capacity.
 * E.g., returns "Seat_01" if empty.
 */
export function getNextAvailableSeat(club) {
  if (!club) return 'Seat_01';
  const capacity = parseInt(club.capacity, 10) || 25;
  const occupiedSeats = (club.occupied || []).map(o => parseInt(o.seat, 10));

  for (let i = 1; i <= capacity; i++) {
    if (!occupiedSeats.includes(i)) {
      return `Seat_${String(i).padStart(2, '0')}`;
    }
  }

  return 'Seat_01'; // Fallback
}
