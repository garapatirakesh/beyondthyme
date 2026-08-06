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

/** Synthesizes a mechanical clock click for dial increments */
export function playCalibrationTick() {
  if (!isPlaying || !audioCtx || audioCtx.state === 'suspended') return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(AUDIO.DIAL_TICK_FREQ_HZ, audioCtx.currentTime);

  gain.gain.setValueAtTime(AUDIO.DIAL_TICK_GAIN, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + AUDIO.DIAL_TICK_DURATION_S);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start();
  osc.stop(audioCtx.currentTime + AUDIO.DIAL_TICK_DURATION_S + 0.01);
}

/** Synthesizes an ascending terminal boot sweep when vetting overlay opens */
export function playTerminalBootSweep() {
  if (!isPlaying || !audioCtx || audioCtx.state === 'suspended') return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(AUDIO.BOOT_START_FREQ_HZ, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(AUDIO.BOOT_END_FREQ_HZ, audioCtx.currentTime + AUDIO.BOOT_SWEEP_DURATION_S);

  gain.gain.setValueAtTime(AUDIO.BOOT_GAIN, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + AUDIO.BOOT_SWEEP_DURATION_S);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start();
  osc.stop(audioCtx.currentTime + AUDIO.BOOT_SWEEP_DURATION_S + 0.05);
}

/** Synthesizes a thermal printer whirring + cutting blade paper tear sound */
export function playThermalPrinterTear() {
  if (!isPlaying || !audioCtx || audioCtx.state === 'suspended') return;

  const noiseNode = audioCtx.createBufferSource();
  noiseNode.buffer = _createWhiteNoiseBuffer();

  const filter = audioCtx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(800, audioCtx.currentTime);
  filter.frequency.linearRampToValueAtTime(1600, audioCtx.currentTime + 0.8);
  filter.frequency.setValueAtTime(3000, audioCtx.currentTime + 0.9);
  filter.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + AUDIO.PRINTER_NOISE_DURATION_S);

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(AUDIO.PRINTER_NOISE_GAIN, audioCtx.currentTime);
  
  // Printing pulses (whirr-whirr-whirr)
  for (let t = 0.1; t < 0.8; t += 0.15) {
    gain.gain.setValueAtTime(AUDIO.PRINTER_NOISE_GAIN * 0.4, audioCtx.currentTime + t);
    gain.gain.setValueAtTime(AUDIO.PRINTER_NOISE_GAIN, audioCtx.currentTime + t + 0.05);
  }
  
  // Sharp pop at tear/cut moment
  gain.gain.setValueAtTime(AUDIO.PRINTER_NOISE_GAIN * 1.5, audioCtx.currentTime + 0.85);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + AUDIO.PRINTER_NOISE_DURATION_S);

  noiseNode.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);

  noiseNode.start();
  noiseNode.stop(audioCtx.currentTime + AUDIO.PRINTER_NOISE_DURATION_S + 0.05);
}

function _createWhiteNoiseBuffer() {
  const bufferSize = audioCtx.sampleRate * AUDIO.PRINTER_NOISE_DURATION_S;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

/** Play a premium mechanical click feedback sound effect (cassette tape/latch) */
export function playStaticTapeClick() {
  if (!audioCtx || audioCtx.state === 'suspended') {
    try {
      const tempCtx = new (window.AudioContext || window.webkitAudioContext)();
      const clickBuffer = tempCtx.createBuffer(1, tempCtx.sampleRate * 0.015, tempCtx.sampleRate);
      const data = clickBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      
      const noise = tempCtx.createBufferSource();
      noise.buffer = clickBuffer;
      
      const filter = tempCtx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(2500, tempCtx.currentTime);

      const gainNode = tempCtx.createGain();
      gainNode.gain.setValueAtTime(0.06, tempCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, tempCtx.currentTime + 0.015);

      noise.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(tempCtx.destination);
      noise.start();
      setTimeout(() => tempCtx.close(), 100);
    } catch(e) {}
    return;
  }

  try {
    const clickBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.015, audioCtx.sampleRate);
    const data = clickBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    
    const noise = audioCtx.createBufferSource();
    noise.buffer = clickBuffer;
    
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(2500, audioCtx.currentTime);

    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0.06, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.015);

    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    noise.start();
  } catch(e){}
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
  const label = btn.querySelector('.audio-label');
  if (active) {
    btn.classList.add('active');
    if (label) label.innerText = 'SOUND: ON';
    else btn.innerHTML = '<span class="audio-pulse"></span><span class="audio-label font-mono">SOUND: ON</span>';
  } else {
    btn.classList.remove('active');
    if (label) label.innerText = 'SOUND: OFF';
    else btn.innerHTML = '<span class="audio-pulse"></span><span class="audio-label font-mono">SOUND: OFF</span>';
  }
}
