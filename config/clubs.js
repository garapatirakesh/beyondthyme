/* config/clubs.js
 * SINGLE SOURCE OF TRUTH for all supper club data.
 * Contains concrete eventDate calendar strings to track active vs past events.
 */

export const CLUBS_CONFIG = {
  vedic: {
    id: 'vedic',
    name: 'Vedic Fire',
    location: 'South Delhi Villa',
    emblem: '🔥',
    glowColor: '255,90,46',
    romanNumeral: 'I',
    eventDate: '2026-08-15T20:00:00+05:30', // Active/Future IST
    displayNight: 'Sat Aug 15 · 20:00',
    image: 'assets/vedic_fire_food.png',
    description: 'Slow-cooked clay-pot curries with aromatic woodfire smoked spices, celebrating ancient culinary time-loops.',
    occupied: [
      { seat: 1,  alias: 'SOMA_04',  emoji: '⏳' },
      { seat: 2,  alias: 'KALA_19',  emoji: '🪩' },
      { seat: 4,  alias: 'YUGA_11',  emoji: '⌛' },
      { seat: 6,  alias: 'SOMA_02',  emoji: '☸️' },
      { seat: 7,  alias: 'KALA_09',  emoji: '🕉️' },
      { seat: 9,  alias: 'YUGA_07',  emoji: '🕯️' },
      { seat: 11, alias: 'SOMA_21',  emoji: '🧭' },
      { seat: 13, alias: 'KALA_03',  emoji: '⏳' },
      { seat: 15, alias: 'SOMA_14',  emoji: '🪩' },
      { seat: 16, alias: 'YUGA_18',  emoji: '⌛' },
      { seat: 18, alias: 'SOMA_01',  emoji: '☸️' },
      { seat: 20, alias: 'KALA_20',  emoji: '🕉️' },
      { seat: 22, alias: 'SOMA_15',  emoji: '🕯️' },
      { seat: 24, alias: 'YUGA_24',  emoji: '🧭' },
    ],
  },

  coastal: {
    id: 'coastal',
    name: 'Coastal Monsoon',
    location: 'Bandra Villa, Mumbai',
    emblem: '🌊',
    glowColor: '40,120,180',
    romanNumeral: 'II',
    eventDate: '2026-08-22T21:00:00+05:30', // Active/Future IST
    displayNight: 'Sat Aug 22 · 21:00',
    image: 'assets/coastal_monsoon_food.png',
    description: 'Fresh coastal catch prepared with rich shredded coconut, local kokum, and green monsoon coriander leaves.',
    occupied: [
      { seat: 1,  alias: 'POMF_09',    emoji: '🌀' },
      { seat: 3,  alias: 'COAST_21',   emoji: '🧭' },
      { seat: 5,  alias: 'BAY_14',     emoji: '🪩' },
      { seat: 6,  alias: 'RAIN_07',    emoji: '🌀' },
      { seat: 8,  alias: 'MALABAR_1',  emoji: '🧭' },
      { seat: 10, alias: 'GOA_18',     emoji: '🪩' },
      { seat: 12, alias: 'MONSOON_02', emoji: '🌀' },
      { seat: 14, alias: 'POMF_11',    emoji: '🧭' },
      { seat: 16, alias: 'COAST_07',   emoji: '🪩' },
      { seat: 18, alias: 'BAY_03',     emoji: '🌀' },
      { seat: 19, alias: 'RAIN_19',    emoji: '🧭' },
      { seat: 22, alias: 'MALABAR_5',  emoji: '🪩' },
      { seat: 24, alias: 'GOA_24',     emoji: '🌀' },
    ],
  },

  himalayan: {
    id: 'himalayan',
    name: 'Himalayan Mist',
    location: 'Darjeeling Villa',
    emblem: '🏔️',
    glowColor: '100,140,200',
    romanNumeral: 'III',
    eventDate: '2026-07-25T19:00:00+05:30', // Expired/Past IST
    displayNight: 'Sun Jul 25 · 19:00',
    image: 'assets/himalayan_mist_food.png',
    description: 'Hot steaming bamboo momos and thukpa noodle soups served inside a pine wood foggy visual environment.',
    occupied: [
      { seat: 2,  alias: 'MIST_03',   emoji: '❄️' },
      { seat: 4,  alias: 'PINE_18',   emoji: '🏔️' },
      { seat: 5,  alias: 'SNOW_15',   emoji: '🕯️' },
      { seat: 7,  alias: 'COLD_24',   emoji: '❄️' },
      { seat: 8,  alias: 'VALLEY_09', emoji: '🏔️' },
      { seat: 10, alias: 'PEAK_11',   emoji: '🕯️' },
      { seat: 13, alias: 'MIST_07',   emoji: '❄️' },
      { seat: 15, alias: 'PINE_14',   emoji: '🏔️' },
      { seat: 17, alias: 'SNOW_08',   emoji: '🕯️' },
      { seat: 19, alias: 'COLD_12',   emoji: '❄️' },
      { seat: 21, alias: 'VALLEY_14', emoji: '🏔️' },
      { seat: 23, alias: 'PEAK_23',   emoji: '🕯️' },
    ],
  },

  molecular: {
    id: 'molecular',
    name: 'Neo-Bengaluru',
    location: 'Indiranagar Villa, Bengaluru',
    emblem: '⚗️',
    glowColor: '80,200,130',
    romanNumeral: 'IV',
    eventDate: '2026-07-18T20:00:00+05:30', // Expired/Past IST
    displayNight: 'Thu Jul 18 · 20:00',
    image: 'assets/neo_bengaluru_food.png',
    description: 'Futuristic molecular gastronomy platted with mango spheres, laboratory vapor foams, and interactive neon gastrique.',
    occupied: [
      { seat: 1,  alias: 'NEO_08',    emoji: '⚙️' },
      { seat: 2,  alias: 'CYBER_10',  emoji: '🧪' },
      { seat: 3,  alias: 'NANO_12',   emoji: '⚛️' },
      { seat: 6,  alias: 'ATOM_19',   emoji: '⚙️' },
      { seat: 7,  alias: 'HYPER_05',  emoji: '🧪' },
      { seat: 8,  alias: 'GRID_21',   emoji: '⚛️' },
      { seat: 11, alias: 'NEO_14',    emoji: '⚙️' },
      { seat: 12, alias: 'CYBER_09',  emoji: '🧪' },
      { seat: 14, alias: 'NANO_03',   emoji: '⚛️' },
      { seat: 16, alias: 'ATOM_20',   emoji: '⚙️' },
      { seat: 18, alias: 'HYPER_15',  emoji: '🧪' },
      { seat: 20, alias: 'GRID_01',   emoji: '⚛️' },
      { seat: 22, alias: 'NEO_22',    emoji: '⚙️' },
      { seat: 24, alias: 'CYBER_24',  emoji: '🧪' },
    ],
  },
};

/** Returns the number of available seats for a given club config object */
export function getAvailableSeats(club) {
  const TOTAL_SEATS = 25;
  return TOTAL_SEATS - club.occupied.length;
}

/** Returns clubs as an ordered array (preserving insertion order) */
export function getClubsArray() {
  return Object.values(CLUBS_CONFIG);
}
