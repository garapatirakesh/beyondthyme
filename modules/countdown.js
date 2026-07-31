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
  const { daysBox, hoursBox, minutesBox, secondsBox, clockTargetLabel } = elements;

  function update() {
    const now    = new Date();
    const target = new Date();
    target.setHours(clubConfig.targetHour, 0, 0, 0);

    const currentDay  = now.getDay();
    const daysUntil   = (clubConfig.targetDay - currentDay + 7) % 7;

    if (daysUntil === 0) {
      if (now.getHours() > clubConfig.targetHour ||
         (now.getHours() === clubConfig.targetHour && now.getMinutes() >= 0)) {
        target.setDate(now.getDate() + 7);
      }
    } else {
      target.setDate(now.getDate() + daysUntil);
    }

    const diff = target - now;

    if (diff <= 0) {
      if (daysBox)    daysBox.innerText    = '00';
      if (hoursBox)   hoursBox.innerText   = '00';
      if (minutesBox) minutesBox.innerText = '00';
      if (secondsBox) secondsBox.innerText = '00';
      return;
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
      clockTargetLabel.innerText = `${clubConfig.name.toUpperCase()} DINNER MOMENT`;
    }
  }

  update();
  const intervalId = setInterval(update, COUNTDOWN_INTERVAL_MS);

  return {
    stop:   () => clearInterval(intervalId),
    update,
  };
}
