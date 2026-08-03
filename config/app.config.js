/* config/app.config.js
 * ALL application-level constants and magic numbers live here.
 * No numeric literals, regex, or timing values should be hardcoded elsewhere.
 */

// ─── Seating ─────────────────────────────────────────────────────────────────
export const TOTAL_SEATS = 25;
export const TOP_ROW_SEATS    = { start: 1,  end: 12 };
export const BOTTOM_ROW_SEATS = { start: 13, end: 24 };
export const HEAD_SEAT        = 25;

// ─── Timing ──────────────────────────────────────────────────────────────────
export const COUNTDOWN_INTERVAL_MS = 1000;
export const DEBOUNCE_PRINT_MS     = 450;
export const TICK_INTERVAL_MS      = 3500;

/** Delays (ms) for the diagnostic sequence animation */
export const DIAGNOSTIC_DELAYS_MS = [600, 1200, 1800, 2400, 3200];

/** Delay before auto-triggering form submit after vetting modal closes */
export const VETTING_SUBMIT_DELAY_MS = 400;

/** Stop-audio fade-out duration */
export const AUDIO_FADEOUT_MS = 350;

/** Vault unlock transition delay before state swap */
export const VAULT_UNLOCK_DELAY_MS = 1200;

/** Vault jitter reset delay on wrong code */
export const VAULT_JITTER_RESET_MS = 150;

// ─── Audio ───────────────────────────────────────────────────────────────────
export const AUDIO = {
  DRONE_FREQ_HZ:       55,       // Low A triangle wave
  DRONE_GAIN:          0.15,
  DRONE_FADE_S:        1.5,
  LFO_BASE_FREQ_HZ:    0.12,
  LFO_SWEEP_RANGE_HZ:  60,
  FILTER_BASE_FREQ_HZ: 200,
  TICK_FREQ_HZ:        1000,
  TICK_HIGHPASS_HZ:    800,
  TICK_GAIN:           0.04,
  TICK_DURATION_S:     0.05,
  BEACON_FREQ_HZ:      880,      // High A
  BEACON_GAIN:         0.005,
  BEACON_DURATION_S:   0.3,
  RESONANCE_FREQ_HZ:   220,      // Low A
  RESONANCE_GAIN:      0.015,
  RESONANCE_DURATION_S:0.45,
  ARPEGGIO_NOTES_HZ:   [261.63, 329.63, 392.00, 523.25], // C4 E4 G4 C5
  ARPEGGIO_DELAY_MS:   150,
  ARPEGGIO_GAIN:       0.015,
  ARPEGGIO_DURATION_S: 0.45,
  BUZZER_FREQ1_HZ:     100,
  BUZZER_FREQ2_HZ:     104,
  BUZZER_GAIN:         0.02,
  BUZZER_DURATION_S:   0.35,

  // New Synthesized Vetting Audio chimes
  BOOT_START_FREQ_HZ:  80,
  BOOT_END_FREQ_HZ:    680,
  BOOT_SWEEP_DURATION_S:0.8,
  BOOT_GAIN:           0.025,

  DIAL_TICK_FREQ_HZ:   1200,
  DIAL_TICK_GAIN:      0.008,
  DIAL_TICK_DURATION_S:0.005,

  PRINTER_NOISE_DURATION_S: 1.2,
  PRINTER_NOISE_GAIN:       0.03,
};

/** Slider → drone freq mapping: baseFreq + (sliderValue - 50) * multiplier */
export const AUDIO_CALIBRATION = {
  FREQ_MULTIPLIER:    0.25,
  LFO_MIN_FREQ:       0.04,
  LFO_MAX_DELTA:      0.26,
  FILTER_BASE:        130,
  FILTER_RANGE:       170,
};

// ─── Radar Canvas ────────────────────────────────────────────────────────────
export const RADAR = {
  MAX_RADIUS:      45,
  RING_STEP:       15,
  RING_COLOR:      '#d4c8b8',
  FILL_COLOR:      'rgba(255, 90, 46, 0.18)',
  STROKE_COLOR:    '#ff5a2e',
  STROKE_WIDTH:    1.5,
  DOT_RADIUS:      3,
  DEFAULT_VALUE:   50,
};

// ─── Rotary Dials ────────────────────────────────────────────────────────────
export const DIAL_CONFIG = {
  RADIUS: 40,
  STROKE_WIDTH: 3,
};


// ─── Form Validation ─────────────────────────────────────────────────────────
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── Treasure Hunt / Coordinate System ───────────────────────────────────────
export const COORD = {
  HOUR_MIN:  10,
  HOUR_RANGE: 90,   // results in 10–99
  MINUTE_MAX: 60,
};

/** 4 possible hiding spots for Y-coordinate, identified by type */
export const Y_HIDING_SPOTS = [
  { type: 'menu-course', menuColIndex: 0, courseIndex: 2 },
  { type: 'occupied-tooltip', selector: '.chair.occupied' },
  { type: 'footer-link', footerColIndex: 0 },
];

// ─── Guestbook ───────────────────────────────────────────────────────────────
export const GUESTBOOK_EMOJIS = ['⏳', '⌛', '🪩', '☸️', '🕉️', '🕯️', '🧭', '🌀'];

// ─── Terminal ────────────────────────────────────────────────────────────────
export const TERMINAL_INITIAL_LINES = [
  { text: '> INITIATING SECURE CALIBRATION CHANNEL...', cls: '' },
  { text: '> SEAT_COORDINATES: UNASSIGNED. PLEASE SELECT A PULSING SEAT ON THE FLOORPLAN.', cls: 'accent', id: 'terminalSelectedSeatLine' },
];

// ─── Booking & Auth Config ───────────────────────────────────────────────────
export const SEAT_PRICE_INR = 2000;
export const RAZORPAY_KEY_ID = 'rzp_test_TKyTi4VEv9WTsk';
export const ADMIN_EMAIL = 'beyondthyme.in@gmail.com';
export const BOOKING_THEME = '✨ Midnight Memories';

export const EVENT_DETAILS = {
  theme: '✨ Midnight Memories',
  date: 'October 24, 2026',
  time: '20:00 IST',
  venue: 'Secret Villa, South Delhi',
  totalSeats: 25,
};

export const ERAS_OPTIONS = ['80s', '90s', '2000s', 'Future'];
export const PREFERENCES = {
  timeOfDay: ['Morning', 'Midnight'],
  beverage: ['Coffee', 'Tea'],
  personality: ['Introvert', 'Extrovert'],
};

// ─── 3D Watch & Dark Gold Particle Config ────────────────────────────────────
export const LUXURY_WATCH_CONFIG = {
  COLOR_CASE:             '#2a2d38',
  COLOR_BEZEL_OUTER:      '#404554',
  COLOR_BEZEL_INNER:      '#1f222a',
  COLOR_CROWN_STEEL:      '#343946',
  COLOR_GOLD_GEAR:        '#d4af37',
  COLOR_ROSE_GOLD_GEAR:   '#b8707a',
  COLOR_COPPER_GEAR:      '#b87333',
  COLOR_STEEL_GEAR:       '#8a909d',
  COLOR_DARK_PLATE:       '#0d0e12',
  COLOR_NEON_ORANGE:      '#ff5500',
  COLOR_NEON_EMISSIVE:    '#ff4400',
  COLOR_NEON_HALO:        '#ff6600',
  COLOR_RUBY_JEWEL:       '#e6004c',
  COLOR_SCREW_HEAD:       '#c5c9d4',
  COLOR_HAND_FACET:       '#f0f3fa',
  COLOR_SECOND_HAND:      '#ff4400',
  COLOR_MARKER_BLOCK:     '#1a1c23',
  COLOR_MARKER_HIGHLIGHT: '#6e7587',

  MAX_TILT_DEG:       35,
  TILT_DAMPING:       0.08,
  DRAG_SENSITIVITY:   0.008,

  // Watch Model Dimensions (Ported from C:\Users\arrab\watch)
  TORUS_CASE_RADIUS:       3.15,
  TORUS_CASE_TUBE:         0.22,
  TORUS_BEZEL_OUTER_R:     2.96,
  TORUS_BEZEL_OUTER_T:     0.14,
  TORUS_BEZEL_INNER_R:     2.78,
  TORUS_BEZEL_INNER_T:     0.10,
  NEON_TUBE_RADIUS:        2.62,
  NEON_TUBE_THICKNESS:     0.055,
  CROWN_X_OFFSET:          3.35,

  // Gears Configuration
  GEAR_CENTER: { teeth: 34, outerR: 1.4, innerR: 0.4, speedRatio: 1.0, dir: 1, pos: [0, -0.3, -0.05] },
  GEAR_UPPER_LEFT: { teeth: 24, outerR: 0.95, innerR: 0.25, speedRatio: 1.3, dir: -1, pos: [-1.1, 0.7, -0.02] },
  GEAR_UPPER_RIGHT: { teeth: 22, outerR: 0.85, innerR: 0.22, speedRatio: 1.5, dir: -1, pos: [1.15, 0.75, -0.01] },
  GEAR_LOWER_LEFT: { teeth: 18, outerR: 0.7, innerR: 0.18, speedRatio: 1.7, dir: -1, pos: [-1.05, -0.85, -0.04] },
  BALANCE_WHEEL_POS: [-0.5, 0.85, 0.0],

  // Camera framing Z distance (8.2 frames 6.3u complete watch at 90-95% container height)
  CAMERA_Z: 8.2,
  CAMERA_FOV: 42,
};

export const SEAT_ORDER_IMAGE1 = {
  topRow:    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  bottomRow: [24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 13, 14],
  headSeat:  25,
};

export const ORBITAL_SEATING_CONFIG = {
  TOTAL_SEATS: 25,
  RADIUS_X: 430,
  RADIUS_Y: 175,
  TILT_ANGLE_DEG: -20,
  FRONT_SCALE_MAX: 1.12,
  BACK_SCALE_MIN: 0.76,
  FRONT_OPACITY: 1.0,
  BACK_OPACITY: 0.55,
  ROTATION_DAMPING: 0.08,
  DRAG_SENSITIVITY: 0.004,
  AUTO_ROTATE_SPEED_MS: 600,
  COLOR_SEAT_AVAILABLE: '#ffffff',
  COLOR_SEAT_BOOKED: '#d62828',
  COLOR_SEAT_SELECTED: '#ff5a2e',
};


