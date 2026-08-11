/* modules/countdown.js
 * Countdown timer targeting each supper club's next dinner moment.
 * Exports a startCountdown() factory; returns a stop() function.
 */

import { COUNTDOWN_INTERVAL_MS } from '../config/app.config.js';

/**
 * Start a live countdown for the given club config.
 * Updates the four orbital clock elements every second.
 *
 * @param {object} clubConfig   — e.g. CLUBS_CONFIG.vedic
 * @param {object} elements     — { daysBox, hoursBox, minutesBox, secondsBox, clockTargetLabel }
 * @returns {{ stop: Function, update: Function }}
 */
export function startCountdown(clubConfig, elements) {
  if (!clubConfig) return { stop: () => {}, update: () => {} };
  const {
    daysBox, hoursBox, minutesBox, secondsBox, clockTargetLabel,
    targetDayName, targetDateNum, targetMonthName, targetTimeHour
  } = elements;

  const chronoClockEl = document.getElementById('chronoClock');

  function update() {
    const now    = new Date();
    const target = new Date(clubConfig.eventDate);

    // Format target day, date, month, time dynamically
    const dayStr   = target.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
    const dateStr  = String(target.getDate()).padStart(2, '0');
    const monthStr = target.toLocaleDateString('en-US', { month: 'long' }).toUpperCase();
    const timeStr  = target.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

    if (targetDayName)   targetDayName.innerText   = dayStr;
    if (targetDateNum)  targetDateNum.innerText  = dateStr;
    if (targetMonthName) targetMonthName.innerText = monthStr;
    if (targetTimeHour)  targetTimeHour.innerText  = timeStr;

    const diff = target - now;

    if (diff <= 0) {
      if (daysBox)    daysBox.innerText    = '00';
      if (hoursBox)   hoursBox.innerText   = '00';
      if (minutesBox) minutesBox.innerText = '00';
      if (secondsBox) secondsBox.innerText = '00';
      if (clockTargetLabel) {
        clockTargetLabel.innerText = `${clubConfig.name.toUpperCase()} [ CLOSED / ARCHIVED ]`;
      }
      if (chronoClockEl) {
        chronoClockEl.classList.add('clock-orbital-container--closed');
      }
      return;
    }

    if (chronoClockEl) {
      chronoClockEl.classList.remove('clock-orbital-container--closed');
    }

    const days    = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours   = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (daysBox)    daysBox.innerText    = String(days).padStart(2, '0');
    if (hoursBox)   hoursBox.innerText   = String(hours).padStart(2, '0');
    if (minutesBox) minutesBox.innerText = String(minutes).padStart(2, '0');
    if (secondsBox) secondsBox.innerText = String(seconds).padStart(2, '0');

    if (clockTargetLabel) {
      clockTargetLabel.innerText = `COUNTDOWN TO ${clubConfig.name.toUpperCase()}`;
    }
  }

  update();
  const intervalId = setInterval(update, COUNTDOWN_INTERVAL_MS);

  return {
    stop:   () => clearInterval(intervalId),
    update,
  };
}
