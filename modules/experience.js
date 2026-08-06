/* modules/experience.js
 * Midnight Memories Experience Section controller.
 * Manages live countdown timer, seat availability, progress bar, and booking actions.
 */

import { EXPERIENCE_CONFIG } from '../config/app.config.js';
import { getCurrentUser, promptGoogleLogin } from './auth.js';
import { openVettingModal } from './vetting.js';

let countdownTimerId = null;
let remainingSeconds = EXPERIENCE_CONFIG.COUNTDOWN_SECONDS || 300;
const totalSeconds = EXPERIENCE_CONFIG.COUNTDOWN_SECONDS || 300;

/**
 * Initialize the Midnight Memories Experience section listeners and live timer.
 */
export function initExperienceSection() {
  const bookBtn = document.getElementById('expBookSeatBtn');
  const timerDisplay = document.getElementById('expTimerDisplay');
  const timerSub = document.getElementById('expTimerSub');

  if (bookBtn) {
    bookBtn.addEventListener('click', () => {
      const user = getCurrentUser();
      if (user) {
        openVettingModal('Seat_11');
      } else {
        promptGoogleLogin();
      }
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
