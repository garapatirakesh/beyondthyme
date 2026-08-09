import { EXPERIENCE_CONFIG, INVENTORY_MESSAGES } from '../config/app.config.js';
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
      if (bookBtn.disabled) return;
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
 * Update remaining seats count & UI states dynamically.
 * @param {number} availableSeats
 * @param {object} [clubConfig]
 */
export function updateSeatsRemaining(availableSeats, clubConfig) {
  const labelOnly = document.getElementById('expLabelOnly');
  const seatsEl = document.getElementById('expRemainingCount');
  const remainingLabel = document.getElementById('expRemainingLabel');
  const bookBtn = document.getElementById('expBookSeatBtn');
  const subtextEl = document.getElementById('expSubtext') || document.querySelector('.exp-action-subtext');

  const isClosed = clubConfig && clubConfig.status === 'Closed';
  const isSoldOut = availableSeats <= 0 || isClosed;

  if (isSoldOut) {
    if (labelOnly) labelOnly.style.display = 'none';
    if (seatsEl) {
      seatsEl.innerText = INVENTORY_MESSAGES.SOLD_OUT_LABEL;
      seatsEl.classList.add('exp-sold-out-text');
    }
    if (remainingLabel) remainingLabel.style.display = 'none';

    if (bookBtn) {
      bookBtn.disabled = true;
      bookBtn.classList.add('disabled');
      bookBtn.innerText = INVENTORY_MESSAGES.SOLD_OUT_LABEL;
    }
    if (subtextEl) {
      subtextEl.innerHTML = `✨ ${INVENTORY_MESSAGES.SOLD_OUT_BANNER}`;
    }
  } else {
    if (labelOnly) labelOnly.style.display = 'inline-block';
    if (seatsEl) {
      seatsEl.innerText = String(availableSeats);
      seatsEl.classList.remove('exp-sold-out-text');
    }
    if (remainingLabel) {
      remainingLabel.style.display = 'inline-block';
      remainingLabel.innerText = availableSeats === 1
        ? INVENTORY_MESSAGES.SINGULAR_SEAT_LABEL
        : INVENTORY_MESSAGES.PLURAL_SEATS_LABEL;
    }

    if (bookBtn) {
      bookBtn.disabled = false;
      bookBtn.classList.remove('disabled');
      bookBtn.innerText = INVENTORY_MESSAGES.BOOK_SEAT_TEXT;
    }
    if (subtextEl) {
      subtextEl.innerHTML = `Hurry up! This experience is filling fast. <span class="exp-sparkle">✦</span>`;
    }
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

  if (titleEl)  titleEl.innerText = (clubConfig.name || clubConfig.title || 'MIDNIGHT MEMORIES').toUpperCase();
  if (descEl)   descEl.innerText  = clubConfig.description || 'A mysterious dining experience where time stops at the table.';
  if (dateEl)   dateEl.innerText  = (clubConfig.displayNight || 'SAT, 15 AUG 2026').toUpperCase();
  if (timeEl)   timeEl.innerText  = '20:00 IST ONWARDS';
  if (venueEl)  venueEl.innerText = (clubConfig.location || clubConfig.venue || 'SECRET VILLA').toUpperCase();
  if (priceEl) {
    const formattedPrice = (clubConfig.price || 3500).toLocaleString('en-IN');
    priceEl.innerText = `₹${formattedPrice} / GUEST`;
  }

  const available = getAvailableSeats(clubConfig);
  updateSeatsRemaining(available, clubConfig);
}
