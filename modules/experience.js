/* modules/experience.js
 * Midnight Memories Experience Section controller.
 * Manages live countdown timer, seat availability, progress bar, and booking actions.
 */

import { EXPERIENCE_CONFIG } from '../config/app.config.js';
import { getAvailableSeats } from '../config/clubs.js';
import { getCurrentUser, promptGoogleLogin } from './auth.js';
import { openVettingModal } from './vetting.js';

let countdownTimerId = null;
let remainingSeconds = EXPERIENCE_CONFIG.COUNTDOWN_SECONDS || 300;
const totalSeconds = EXPERIENCE_CONFIG.COUNTDOWN_SECONDS || 300;
let currentActiveClubConfig = null;

/**
 * Initialize the Midnight Memories Experience section listeners and live timer.
 */
export function initExperienceSection() {
  const bookBtn = document.getElementById('expBookSeatBtn');
  const timerDisplay = document.getElementById('expTimerDisplay');
  const timerSub = document.getElementById('expTimerSub');

  if (bookBtn) {
    bookBtn.addEventListener('click', async () => {
      await promptGoogleLogin();
      openVettingModal('Seat_01', currentActiveClubConfig);
    });
  }

  // Timer click to extend handler
  if (timerDisplay) {
    timerDisplay.addEventListener('click', () => {
      if (remainingSeconds <= 0) {
        _resetTimer();
      }
    });
  }

  if (timerSub) {
    timerSub.addEventListener('click', () => {
      if (remainingSeconds <= 0) {
        _resetTimer();
      }
    });
  }

  _startTimer();
}

function _startTimer() {
  if (countdownTimerId) clearInterval(countdownTimerId);

  _updateDisplay();

  countdownTimerId = setInterval(() => {
    if (remainingSeconds > 0) {
      remainingSeconds--;
      _updateDisplay();
    } else {
      clearInterval(countdownTimerId);
      countdownTimerId = null;
      _handleTimerExpired();
    }
  }, 1000);
}

function _resetTimer() {
  remainingSeconds = totalSeconds;
  const timerDisplay = document.getElementById('expTimerDisplay');
  const timerSub = document.getElementById('expTimerSub');
  
  if (timerDisplay) {
    timerDisplay.classList.remove('expired');
  }
  if (timerSub) {
    timerSub.innerText = 'Complete your booking within time.';
    timerSub.classList.remove('clickable-extend');
  }

  _startTimer();
}

function _handleTimerExpired() {
  const timerDisplay = document.getElementById('expTimerDisplay');
  const timerSub = document.getElementById('expTimerSub');
  const progressBar = document.getElementById('expProgressBar');

  if (timerDisplay) {
    timerDisplay.innerText = '00:00';
    timerDisplay.classList.add('expired');
  }

  if (timerSub) {
    timerSub.innerText = EXPERIENCE_CONFIG.EXPIRED_TEXT || 'Reservation Expired — Click to extend';
    timerSub.classList.add('clickable-extend');
  }

  if (progressBar) {
    progressBar.style.width = '0%';
  }
}

function _updateDisplay() {
  const timerDisplay = document.getElementById('expTimerDisplay');
  const progressBar = document.getElementById('expProgressBar');

  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  if (timerDisplay) {
    timerDisplay.innerText = formatted;
  }

  if (progressBar) {
    const pct = Math.max(0, Math.min(100, (remainingSeconds / totalSeconds) * 100));
    progressBar.style.width = `${pct}%`;
  }
}

/**
 * Update remaining seats count dynamically.
 * @param {number} count
 */
export function updateSeatsRemaining(count) {
  const el = document.getElementById('expRemainingCount');
  if (el) {
    el.innerText = String(count);
  }
}

/**
 * Synchronize the selected Supper Club event to the Experience section.
 * @param {object} clubConfig
 */
export function syncSelectedEventToExperience(clubConfig) {
  if (!clubConfig) return;
  currentActiveClubConfig = clubConfig;

  const titleEl  = document.getElementById('expEventTitle');
  const descEl   = document.getElementById('expEventDesc');
  const dateEl   = document.getElementById('expEventDateLabel');
  const timeEl   = document.getElementById('expEventTimeLabel');
  const venueEl  = document.getElementById('expEventVenueLabel');
  const priceEl  = document.getElementById('expEventPriceLabel');
  const seatsEl  = document.getElementById('expRemainingCount');

  if (titleEl)  titleEl.innerText = (clubConfig.name || clubConfig.title || 'MIDNIGHT MEMORIES').toUpperCase();
  if (descEl)   descEl.innerText  = clubConfig.description || 'A mysterious dining experience where time keeps the secrets and strangers become stories.';
  if (dateEl)   dateEl.innerText  = (clubConfig.displayNight || 'SAT, 15 AUG 2026').toUpperCase();
  if (timeEl)   timeEl.innerText  = '20:00 IST ONWARDS';
  if (venueEl)  venueEl.innerText = (clubConfig.location || clubConfig.venue || 'SECRET VILLA').toUpperCase();
  if (priceEl) {
    const formattedPrice = (clubConfig.price || 3500).toLocaleString('en-IN');
    priceEl.innerText = `₹${formattedPrice} / GUEST`;
  }

  const available = getAvailableSeats(clubConfig);
  const isSoldOut = available <= 0 || clubConfig.status === 'Closed';
  const bookBtn = document.getElementById('expBookSeatBtn');
  const subtextEl = document.querySelector('.exp-action-subtext');

  if (seatsEl) {
    seatsEl.innerText = String(available);
  }

  if (bookBtn) {
    if (isSoldOut) {
      bookBtn.disabled = true;
      bookBtn.classList.add('disabled');
      bookBtn.innerText = '● SOLD OUT — CHRONO FULLY BOOKED';
      if (subtextEl) subtextEl.innerText = '✨ Time has stopped for this experience. All seats reserved.';
    } else {
      bookBtn.disabled = false;
      bookBtn.classList.remove('disabled');
      bookBtn.innerText = 'BOOK YOUR SEAT';
      if (subtextEl) subtextEl.innerText = 'Secure booking. Your experience is our priority.';
    }
  }
}
