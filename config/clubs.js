/* config/clubs.js
 * SINGLE SOURCE OF TRUTH for all supper club data.
 * Contains concrete eventDate calendar strings to track active vs past events.
 */

export const CLUBS_CONFIG = {
  zenitsu: {
    id: 'zenitsu',
    name: 'Zenitsu',
    location: 'Erragadda',
    emblem: '🔥',
    glowColor: '255,90,46',
    romanNumeral: 'I',
    price: 500,
    capacity: 7,
    eventDate: '2026-08-15T20:00:00+05:30',
    displayNight: 'Sat Aug 15 · 20:00',
    image: 'assets/vedic_fire_food.png',
    description: 'Exclusive luxury mystery dining experience where time stops at the table.',
    occupied: [],
  },
  tanjiro: {
    id: 'tanjiro',
    name: 'Tanjiro',
    location: 'Hyderabad',
    emblem: '🌊',
    glowColor: '40,120,180',
    romanNumeral: 'II',
    price: 500,
    capacity: 5,
    eventDate: '2026-08-26T20:00:00+05:30',
    displayNight: 'Sat Aug 26 · 20:00',
    image: 'assets/coastal_monsoon_food.png',
    description: 'Exclusive private dining experiment celebrating precision flavor calibration.',
    occupied: [],
  }
};

/** Returns the number of available seats for a given club config object */
export function getAvailableSeats(club) {
  if (!club) return 0;
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
