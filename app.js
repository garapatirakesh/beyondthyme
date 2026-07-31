/* app.js — Beyond Thyme Orchestrator
 * Thin wiring layer. Contains zero business logic, zero hardcoded values.
 * All data lives in config/. All logic lives in modules/.
 */

import { CLUBS_CONFIG }          from './config/clubs.js';
import { MENU_ERAS }             from './config/menu.js';
import { SEED_GUESTBOOK_ENTRIES } from './config/guestbook.js';
import {
  RADAR, EMAIL_REGEX, DEBOUNCE_PRINT_MS,
} from './config/app.config.js';

import { initCursor, bindCursorHover } from './modules/cursor.js';
import {
  startAmbientAudio, stopAmbientAudio, isAudioPlaying,
  updateAudioCalibration, playBeaconChime, playResonanceChime,
  playSuccessArpeggio, playErrorBuzzer,
} from './modules/audio.js';
import { printToTerminal, resetTerminal, runDiagnosticSequence } from './modules/terminal.js';
import { startCountdown }    from './modules/countdown.js';
import {
  renderSeatingLayout, selectSeat, convertSeatToOccupied,
} from './modules/seating.js';
import {
  generateDailyCoords, hideCoordY, initTimeCapsule, initVaultBreaker,
} from './modules/vault.js';
import { initVetting }       from './modules/vetting.js';
import {
  renderClubCards, renderMenu, renderGuestbook, appendGuestbookEntry,
} from './modules/renderer.js';

document.addEventListener('DOMContentLoaded', () => {

  // ── 1. Cursor ──────────────────────────────────────────────────────────────
  const cursor = initCursor();
  bindCursorHover(cursor, document.querySelectorAll('.nav-interactive, a, button, input, [type="range"]'));

  // ── 2. Render data-driven UI ───────────────────────────────────────────────
  let activeClubId = 'vedic';

  renderMenu(MENU_ERAS);
  renderGuestbook(SEED_GUESTBOOK_ENTRIES);
  renderClubCards(CLUBS_CONFIG, activeClubId, onClubSelect);

  // ── 3. Seating state ───────────────────────────────────────────────────────
  let selectedSeat   = null;   // 'Seat_03' etc.
  let selectedSeatEl = null;   // HTMLElement

  const sliders = {
    openness: document.getElementById('sliderOpenness'),
    depth:    document.getElementById('sliderDepth'),
    energy:   document.getElementById('sliderEnergy'),
  };

  const countdownEls = {
    daysBox:          document.getElementById('daysBox'),
    hoursBox:         document.getElementById('hoursBox'),
    minutesBox:       document.getElementById('minutesBox'),
    secondsBox:       document.getElementById('secondsBox'),
    clockTargetLabel: document.getElementById('clockTargetLabel'),
  };

  let countdownInstance = startCountdown(CLUBS_CONFIG[activeClubId], countdownEls);

  // ── 4. Render seating floorplan ────────────────────────────────────────────
  function buildSeating() {
    renderSeatingLayout(CLUBS_CONFIG[activeClubId], {
      onSeatClick(chairEl) {
        if (chairEl.classList.contains('selected')) {
          // Deselect
          chairEl.classList.remove('selected');
          selectedSeat   = null;
          selectedSeatEl = null;
          printToTerminal('> SEAT COORDINATES DISENGAGED. POSITION: UNASSIGNED.');
          _updateTerminalSeatLine(null);
          validateForm();
        } else {
          selectSeat(chairEl);
          selectedSeat   = chairEl.getAttribute('data-seat');
          selectedSeatEl = chairEl;
          vetting.openForSeat(chairEl);
          if (isAudioPlaying()) playBeaconChime();
        }
      },
      onSeatHoverEnter() { if (isAudioPlaying()) playBeaconChime(); },
      onSeatHoverLeave() {},
      onOccupiedHover()  { if (isAudioPlaying()) playResonanceChime(); },
    });

    // Re-bind cursor hover on dynamically created chairs
    bindCursorHover(cursor, document.querySelectorAll('.chair.available, .chair.occupied'));
  }

  buildSeating();

  // ── 5. Vetting overlay ─────────────────────────────────────────────────────
  const vetting = initVetting({
    getSelectedSeat: () => selectedSeat
      ? { seatId: selectedSeat, seatEl: selectedSeatEl }
      : null,
    setSelectedSeat: (id) => { selectedSeat = id; },
    callbacks: {
      onVettingComplete({ pseudo, email, avatar, diet, seatId, seatEl }) {
        // Sync terminal form fields
        const pseudoInput = document.getElementById('pseudonymInput');
        const emailInput  = document.getElementById('emailInput');
        if (pseudoInput) pseudoInput.value = pseudo;
        if (emailInput)  emailInput.value  = email;

        selectedSeat   = seatId;
        selectedSeatEl = seatEl;

        // Update the occupied list in active config so it persists on re-render
        const seatNum = parseInt(seatId.replace('SEAT_', '').replace('Seat_', ''), 10);
        const config  = CLUBS_CONFIG[activeClubId];
        if (!config.occupied.some(o => o.seat === seatNum)) {
          config.occupied.push({ seat: seatNum, alias: pseudo.toUpperCase(), emoji: avatar });
        }

        // Convert chair visually
        convertSeatToOccupied(seatEl, { emoji: avatar, alias: pseudo, diet }, String(seatNum).padStart(2, '0'));

        printToTerminal(`> SEAT POSITION ENGAGED: ${seatId.toUpperCase()} CALIBRATED.`);
        _updateTerminalSeatLine(seatId);
        validateForm();

        // Scroll to vault terminal
        document.getElementById('vault')?.scrollIntoView({ behavior: 'smooth' });
        if (isAudioPlaying()) playBeaconChime();
      },
      onVettingCancel() {
        if (selectedSeatEl) selectedSeatEl.classList.remove('selected');
        selectedSeat   = null;
        selectedSeatEl = null;
        validateForm();
      },
    },
  });

  // ── 6. Club switcher ───────────────────────────────────────────────────────
  function onClubSelect(clubId) {
    activeClubId   = clubId;
    selectedSeat   = null;
    selectedSeatEl = null;

    _updateTerminalSeatLine(null);
    if (document.getElementById('submitBtn')) {
      document.getElementById('submitBtn').disabled = true;
    }

    printToTerminal(`> SWITCHING SYSTEM CHANNEL TO ${CLUBS_CONFIG[clubId].name.toUpperCase()}...`);
    if (isAudioPlaying()) playBeaconChime();

    countdownInstance.stop();
    countdownInstance = startCountdown(CLUBS_CONFIG[clubId], countdownEls);
    buildSeating();
  }

  // ── 7. Radar canvas visualiser ─────────────────────────────────────────────
  const radarCanvas = document.getElementById('radarCanvas');

  function drawRadar() {
    if (!radarCanvas) return;
    const ctx = radarCanvas.getContext('2d');
    const { width: w, height: h } = radarCanvas;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);

    // Concentric grid rings
    ctx.strokeStyle = RADAR.RING_COLOR;
    ctx.lineWidth   = 1;
    for (let r = RADAR.RING_STEP; r <= RADAR.MAX_RADIUS; r += RADAR.RING_STEP) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Axis lines
    const angles = [
      -Math.PI / 2,
      -Math.PI / 2 + (2 * Math.PI / 3),
      -Math.PI / 2 + (4 * Math.PI / 3),
    ];
    ctx.beginPath();
    angles.forEach(ang => {
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + RADAR.MAX_RADIUS * Math.cos(ang), cy + RADAR.MAX_RADIUS * Math.sin(ang));
    });
    ctx.stroke();

    const valO = Number(sliders.openness?.value ?? RADAR.DEFAULT_VALUE);
    const valD = Number(sliders.depth?.value    ?? RADAR.DEFAULT_VALUE);
    const valE = Number(sliders.energy?.value   ?? RADAR.DEFAULT_VALUE);

    const pts = angles.map((ang, i) => {
      const r = RADAR.MAX_RADIUS * ([valO, valD, valE][i] / 100);
      return { x: cx + r * Math.cos(ang), y: cy + r * Math.sin(ang) };
    });

    ctx.fillStyle   = RADAR.FILL_COLOR;
    ctx.strokeStyle = RADAR.STROKE_COLOR;
    ctx.lineWidth   = RADAR.STROKE_WIDTH;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    pts.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = RADAR.STROKE_COLOR;
    pts.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, RADAR.DOT_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  drawRadar();

  // Slider event wiring
  let printTimeout;
  const sliderDisplays = {
    openness: document.getElementById('valOpenness'),
    depth:    document.getElementById('valDepth'),
    energy:   document.getElementById('valEnergy'),
  };

  Object.entries(sliders).forEach(([key, slider]) => {
    if (!slider) return;
    slider.addEventListener('input', () => {
      if (sliderDisplays[key]) sliderDisplays[key].innerText = `${slider.value}%`;
      drawRadar();
      updateAudioCalibration(sliders);
      clearTimeout(printTimeout);
      printTimeout = setTimeout(() => {
        printToTerminal(
          `> TEMPORAL VECTOR ADJUSTED: [TIME: ${sliders.openness?.value}% | SOCIAL: ${sliders.depth?.value}% | FLAVOR: ${sliders.energy?.value}%]`
        );
      }, DEBOUNCE_PRINT_MS);
    });
  });

  // ── 8. Audio toggle ────────────────────────────────────────────────────────
  const audioToggleBtn = document.getElementById('audioToggleBtn');
  audioToggleBtn?.addEventListener('click', () => {
    if (isAudioPlaying()) {
      stopAmbientAudio(audioToggleBtn);
    } else {
      startAmbientAudio(audioToggleBtn, sliders);
    }
  });

  // ── 9. Main form (chrono terminal) ─────────────────────────────────────────
  const chronoForm    = document.getElementById('chronoForm');
  const pseudonymInput = document.getElementById('pseudonymInput');
  const emailInput    = document.getElementById('emailInput');
  const submitBtn     = document.getElementById('submitBtn');
  const terminalBox   = document.getElementById('terminalBox');
  const successOverlay = document.getElementById('successOverlay');
  const closeSuccessBtn = document.getElementById('closeSuccessBtn');

  if (pseudonymInput) pseudonymInput.addEventListener('input', validateForm);
  if (emailInput)     emailInput.addEventListener('input', validateForm);

  function validateForm() {
    const valid = pseudonymInput?.value.trim().length > 0
               && EMAIL_REGEX.test(emailInput?.value.trim())
               && selectedSeat !== null;
    if (submitBtn) submitBtn.disabled = !valid;
  }

  chronoForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!selectedSeat) return;

    submitBtn.disabled = true;
    pseudonymInput?.setAttribute('disabled', 'true');
    emailInput?.setAttribute('disabled', 'true');
    sliders.openness?.setAttribute('disabled', 'true');
    sliders.depth?.setAttribute('disabled', 'true');
    sliders.energy?.setAttribute('disabled', 'true');

    runDiagnosticSequence(
      {
        pseudo: pseudonymInput?.value.trim(),
        seat:   selectedSeat,
        o:      sliders.openness?.value ?? '50',
        d:      sliders.depth?.value    ?? '50',
        eVal:   sliders.energy?.value   ?? '50',
      },
      {
        terminalBox,
        dotProgress2:  document.getElementById('dotProgress2'),
        dotProgress3:  document.getElementById('dotProgress3'),
        successOverlay,
        ticketEls: {
          club:      document.getElementById('ticketClub'),
          pseudonym: document.getElementById('ticketPseudonym'),
          seat:      document.getElementById('ticketSeat'),
          vector:    document.getElementById('ticketVector'),
        },
        clubName: CLUBS_CONFIG[activeClubId].name,
      }
    );
  });

  closeSuccessBtn?.addEventListener('click', () => {
    if (successOverlay) successOverlay.style.display = 'none';
    terminalBox?.classList.remove('diagnostic-running');

    [pseudonymInput, emailInput, sliders.openness, sliders.depth, sliders.energy]
      .forEach(el => el?.removeAttribute('disabled'));

    chronoForm?.reset();
    document.getElementById('vettingForm')?.reset();

    selectedSeat   = null;
    selectedSeatEl = null;

    const selectedChair = document.querySelector('.chair.selected');
    if (selectedChair) selectedChair.classList.remove('selected');

    document.getElementById('dotProgress2')?.classList.remove('active');
    document.getElementById('dotProgress3')?.classList.remove('active');

    ['valOpenness', 'valDepth', 'valEnergy'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerText = '50%';
    });

    drawRadar();
    resetTerminal();
    validateForm();
  });

  // ── 10. Treasure hunt coordinates ─────────────────────────────────────────
  const { coordX, coordY, hidingSpotIndex } = generateDailyCoords();

  hideCoordY(coordY, hidingSpotIndex);

  initTimeCapsule(coordX, () => { if (isAudioPlaying()) playBeaconChime(); });

  initVaultBreaker(
    { coordX, coordY },
    { playBeaconChime, playSuccessArpeggio, playErrorBuzzer },
    cursor
  );

  // ── 11. Guestbook ─────────────────────────────────────────────────────────
  const guestbookForm = document.getElementById('guestbookForm');
  guestbookForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const alias   = document.getElementById('guestbookName')?.value.trim();
    const message = document.getElementById('guestbookMsg')?.value.trim();
    if (!alias || !message) return;

    appendGuestbookEntry(alias, message);
    document.getElementById('guestbookMsg').value = '';
    if (isAudioPlaying()) playBeaconChime();
  });

  // ── 12. Waitlist form ─────────────────────────────────────────────────────
  document.getElementById('waitlistForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const emailEl = document.getElementById('waitlistEmail');
    if (!emailEl?.value.trim()) return;
    alert(`COORDINATES SYNCED: email channel ${emailEl.value.trim()} registered for private drops.`);
    emailEl.value = '';
    if (isAudioPlaying()) playBeaconChime();
  });

  // ── 13. Ticker marquee duplicate for seamless loop ─────────────────────────
  const marqueeInner = document.querySelector('.marquee-inner');
  if (marqueeInner) {
    marqueeInner.innerHTML += marqueeInner.innerHTML;
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  function _updateTerminalSeatLine(seatId) {
    const el = document.getElementById('terminalSelectedSeatLine');
    if (!el) return;
    if (seatId) {
      el.classList.remove('accent');
      el.classList.add('success');
      el.innerText = `> SEAT_COORDINATES: LOCKED [${seatId.toUpperCase()}]`;
    } else {
      el.classList.remove('success');
      el.classList.add('accent');
      el.innerText = '> SEAT_COORDINATES: UNASSIGNED. PLEASE SELECT A PULSING SEAT ON THE FLOORPLAN.';
    }
  }

});
