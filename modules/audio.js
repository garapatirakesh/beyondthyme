/* modules/audio.js
 * Web Audio API — ambient chronometer hum, chimes, and sound effects.
 * All frequency values come from config/app.config.js — no magic numbers here.
 */

import { AUDIO, AUDIO_CALIBRATION, TICK_INTERVAL_MS, AUDIO_FADEOUT_MS } from '../config/app.config.js';

// Internal audio state — encapsulated, not exposed as globals
let audioCtx   = null;
let droneOsc   = null;
let filterNode = null;
let gainNode   = null;
let lfoOsc     = null;
let tickTimer  = null;
let isPlaying  = false;

/** Returns true if ambient audio is currently playing */
export function isAudioPlaying() { return isPlaying; }

/**
 * Start the ambient drone + tick.
 * @param {HTMLButtonElement} toggleBtn
 * @param {{ openness: HTMLInputElement, depth: HTMLInputElement, energy: HTMLInputElement }} sliders
 */
export function startAmbientAudio(toggleBtn, sliders) {
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    droneOsc = audioCtx.createOscillator();
    droneOsc.type = 'triangle';
    droneOsc.frequency.setValueAtTime(AUDIO.DRONE_FREQ_HZ, audioCtx.currentTime);

    filterNode = audioCtx.createBiquadFilter();
    filterNode.type = 'lowpass';
    filterNode.frequency.setValueAtTime(AUDIO.FILTER_BASE_FREQ_HZ, audioCtx.currentTime);

    lfoOsc = audioCtx.createOscillator();
    lfoOsc.frequency.setValueAtTime(AUDIO.LFO_BASE_FREQ_HZ, audioCtx.currentTime);
    const lfoGain = audioCtx.createGain();
    lfoGain.gain.setValueAtTime(AUDIO.LFO_SWEEP_RANGE_HZ, audioCtx.currentTime);

    lfoOsc.connect(lfoGain);
    lfoGain.connect(filterNode.frequency);

    gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(AUDIO.DRONE_GAIN, audioCtx.currentTime + AUDIO.DRONE_FADE_S);

    droneOsc.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    droneOsc.start();
    lfoOsc.start();

    triggerTickClick();
    tickTimer = setInterval(triggerTickClick, TICK_INTERVAL_MS);

    updateAudioCalibration(sliders);

    isPlaying = true;
    _setToggleUI(toggleBtn, true);
  } catch (e) {
    console.error('AudioContext init failed:', e);
  }
}

/**
 * Gracefully fade out and stop all audio.
 * @param {HTMLButtonElement} toggleBtn
 */
export function stopAmbientAudio(toggleBtn) {
  if (!gainNode || !audioCtx) return;

  gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);

  setTimeout(() => {
    if (droneOsc) { droneOsc.stop(); droneOsc.disconnect(); }
    if (lfoOsc)   { lfoOsc.stop();   lfoOsc.disconnect(); }
    if (tickTimer) clearInterval(tickTimer);
    if (audioCtx)  audioCtx.close();

    droneOsc = lfoOsc = audioCtx = gainNode = filterNode = null;
    tickTimer = null;
    isPlaying = false;

    _setToggleUI(toggleBtn, false);
  }, AUDIO_FADEOUT_MS);
}

/**
 * Recalibrate audio parameters from slider values.
 * @param {{ openness: HTMLInputElement, depth: HTMLInputElement, energy: HTMLInputElement }} sliders
 */
export function updateAudioCalibration(sliders) {
  if (!isPlaying || !audioCtx || !droneOsc || !lfoOsc || !filterNode) return;

  const o = sliders?.openness?.value ?? AUDIO_CALIBRATION.FREQ_MULTIPLIER * 2 + AUDIO.DRONE_FREQ_HZ;
  const d = sliders?.depth?.value    ?? 50;
  const e = sliders?.energy?.value   ?? 50;

  const freq      = AUDIO.DRONE_FREQ_HZ + (o - 50) * AUDIO_CALIBRATION.FREQ_MULTIPLIER;
  const lfoFreq   = AUDIO_CALIBRATION.LFO_MIN_FREQ + (d / 100) * AUDIO_CALIBRATION.LFO_MAX_DELTA;
  const filterCut = AUDIO_CALIBRATION.FILTER_BASE  + (e / 100) * AUDIO_CALIBRATION.FILTER_RANGE;

  droneOsc.frequency.setTargetAtTime(freq,      audioCtx.currentTime, 0.1);
  lfoOsc.frequency.setTargetAtTime(lfoFreq,     audioCtx.currentTime, 0.1);
  filterNode.frequency.setTargetAtTime(filterCut, audioCtx.currentTime, 0.1);
}

/** Short high-A chime — seat hover / UI interaction feedback */
export function playBeaconChime() {
  if (!isPlaying || !audioCtx || audioCtx.state === 'suspended') return;
  _playTone('sine', AUDIO.BEACON_FREQ_HZ, AUDIO.BEACON_GAIN, AUDIO.BEACON_DURATION_S);
}

/** Low triangle resonance — occupied seat hover */
export function playResonanceChime() {
  if (!isPlaying || !audioCtx || audioCtx.state === 'suspended') return;
  _playTone('triangle', AUDIO.RESONANCE_FREQ_HZ, AUDIO.RESONANCE_GAIN, AUDIO.RESONANCE_DURATION_S);
}

/** Ascending C major arpeggio — vault unlock success */
export function playSuccessArpeggio() {
  if (!isPlaying || !audioCtx || audioCtx.state === 'suspended') return;
  AUDIO.ARPEGGIO_NOTES_HZ.forEach((freq, idx) => {
    setTimeout(() => {
      _playTone('sine', freq, AUDIO.ARPEGGIO_GAIN, AUDIO.ARPEGGIO_DURATION_S);
    }, idx * AUDIO.ARPEGGIO_DELAY_MS);
  });
}

/** Detuned sawtooth buzz — vault breach failure */
export function playErrorBuzzer() {
  if (!isPlaying || !audioCtx || audioCtx.state === 'suspended') return;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(AUDIO.BUZZER_GAIN, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + AUDIO.BUZZER_DURATION_S);

  [AUDIO.BUZZER_FREQ1_HZ, AUDIO.BUZZER_FREQ2_HZ].forEach(freq => {
    const osc = audioCtx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.connect(gain);
    osc.start();
    osc.stop(audioCtx.currentTime + AUDIO.BUZZER_DURATION_S + 0.05);
  });

  gain.connect(audioCtx.destination);
}

// ─── Private helpers ──────────────────────────────────────────────────────────

function triggerTickClick() {
  if (!audioCtx || audioCtx.state === 'suspended') return;
  const tickOsc    = audioCtx.createOscillator();
  const tickGain   = audioCtx.createGain();
  const tickFilter = audioCtx.createBiquadFilter();

  tickOsc.frequency.setValueAtTime(AUDIO.TICK_FREQ_HZ, audioCtx.currentTime);
  tickFilter.type = 'highpass';
  tickFilter.frequency.setValueAtTime(AUDIO.TICK_HIGHPASS_HZ, audioCtx.currentTime);

  tickGain.gain.setValueAtTime(AUDIO.TICK_GAIN, audioCtx.currentTime);
  tickGain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + AUDIO.TICK_DURATION_S);

  tickOsc.connect(tickFilter);
  tickFilter.connect(tickGain);
  gainNode ? tickGain.connect(gainNode) : tickGain.connect(audioCtx.destination);

  tickOsc.start();
  tickOsc.stop(audioCtx.currentTime + AUDIO.TICK_DURATION_S + 0.01);
}

function _playTone(type, freq, gain, duration) {
  const osc  = audioCtx.createOscillator();
  const gn   = audioCtx.createGain();
  osc.type   = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  gn.gain.setValueAtTime(gain, audioCtx.currentTime);
  gn.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
  osc.connect(gn);
  gn.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration + 0.05);
}

function _setToggleUI(btn, active) {
  if (!btn) return;
  if (active) {
    btn.innerHTML = '<span class="audio-pulse audio-pulse--active"></span>SOUND_PROTOCOL: ACTIVE';
  } else {
    btn.innerHTML = '<span class="audio-pulse"></span>SOUND_PROTOCOL: OFF';
  }
}
