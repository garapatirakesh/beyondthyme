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
  { type: 'logo' },
  { type: 'footer-link', footerColIndex: 0 },
];

// ─── Guestbook ───────────────────────────────────────────────────────────────
export const GUESTBOOK_EMOJIS = ['⏳', '⌛', '🪩', '☸️', '🕉️', '🕯️', '🧭', '🌀'];

// ─── Terminal ────────────────────────────────────────────────────────────────
export const TERMINAL_INITIAL_LINES = [
  { text: '> INITIATING SECURE CALIBRATION CHANNEL...', cls: '' },
  { text: '> SEAT_COORDINATES: UNASSIGNED. PLEASE SELECT A PULSING SEAT ON THE FLOORPLAN.', cls: 'accent', id: 'terminalSelectedSeatLine' },
];
