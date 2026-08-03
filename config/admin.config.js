/* config/admin.config.js
 * Admin Portal configuration constants, menu metadata, and visual theme tokens.
 * All admin-specific data live here to ensure ZERO hardcoding in logic modules.
 */

export const ADMIN_AUTHORIZED_EMAIL = 'beyondthyme.in@gmail.com';

/** Admin Sidebar Navigation items */
export const ADMIN_SIDEBAR_NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊', description: 'Overview & Real-time KPIs' },
  { id: 'events', label: 'Events', icon: '📅', description: 'Event Creation & Lifecycle' },
  { id: 'themes', label: 'Themes', icon: '🍷', description: 'Saturday Theme Engine' },
  { id: 'seating', label: 'Seat Management', icon: '🪑', description: '25-Seat Floorplan Controls' },
  { id: 'bookings', label: 'Bookings', icon: '🎫', description: 'Reservations & Passenger Logs' },
  { id: 'users', label: 'Users', icon: '👤', description: 'Member Roster & Loyalty' },
  { id: 'checkin', label: 'QR Check-in', icon: '📲', description: 'Door Validation & Attendance' },
  { id: 'treasure', label: 'Treasure Hunt', icon: '🗝️', description: 'Coordinate Hunts & Leaderboard' },
  { id: 'capsules', label: 'Time Capsules', icon: '⏳', description: 'Temporal Memory Unlocker' },
  { id: 'notifications', label: 'Notifications', icon: '🔔', description: 'Targeted Broadcast Center' },
  { id: 'reports', label: 'Reports & Analytics', icon: '📈', description: 'Visual Financials & Demographics' },
  { id: 'settings', label: 'Settings', icon: '⚙️', description: 'System Parameters & Gateway Keys' },
];

/** Status choices */
export const EVENT_STATUSES = ['Draft', 'Published', 'Closed', 'Completed'];
export const THEME_STATUSES = ['Draft', 'Active', 'Archived'];
export const PAYMENT_STATUSES = ['Paid', 'Refunded', 'Pending', 'Failed'];
export const ATTENDANCE_STATUSES = ['Unchecked', 'Checked In', 'Late', 'Absent', 'Walk-in'];
export const HUNT_STATUSES = ['Draft', 'Active', 'Completed', 'Closed'];

/** Notification parameters */
export const NOTIFICATION_AUDIENCES = ['Everyone', 'Selected Users', 'Current Event Guests', 'Past Participants'];
export const NOTIFICATION_TYPES = ['Theme Released', 'Booking Confirmed', 'Reminder', 'Treasure Hunt', 'Special Offer'];
export const NOTIFICATION_CHANNELS = ['In-App', 'Push', 'Email'];

/** Chart presets */
export const REPORT_TIME_FRAMES = ['7 Days', '30 Days', '3 Months', 'All Time'];

/** System Defaults */
export const ADMIN_DEFAULTS = {
  SEARCH_DEBOUNCE_MS: 250,
  REFRESH_INTERVAL_MS: 5000,
  MAX_SEATS: 25,
  DEFAULT_PRICE_INR: 2000,
  DEFAULT_VENUE: 'Secret Villa, South Delhi',
  DEFAULT_MAPS_LINK: 'https://maps.google.com/?q=28.5355,77.2410',
  DEFAULT_INSTAGRAM: 'https://instagram.com/beyondthyme',
};

/** Rolex-inspired luxury theme tokens */
export const ROLEX_THEME_TOKENS = {
  COLOR_BG: '#0b0c10',
  COLOR_PANEL: '#151821',
  COLOR_CARD: 'rgba(21, 24, 33, 0.85)',
  COLOR_GOLD: '#d4af37',
  COLOR_GOLD_GLOW: 'rgba(212, 175, 55, 0.25)',
  COLOR_TEXT: '#e6e8ec',
  COLOR_MUTED: '#8a909d',
  COLOR_ACCENT: '#ff5a2e',
  COLOR_SUCCESS: '#2ec4b6',
  COLOR_DANGER: '#e71d36',
  COLOR_BORDER: 'rgba(212, 175, 55, 0.2)',
};
