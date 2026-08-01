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
  playSuccessArpeggio, playErrorBuzzer, playThermalPrinterTear,
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
  renderClubCards, renderArchivedDrawer, renderMenu, renderGuestbook, appendGuestbookEntry,
} from './modules/renderer.js';
import { createRotaryDial }  from './modules/dials.js';


document.addEventListener('DOMContentLoaded', () => {

  // ── 1. Cursor ──────────────────────────────────────────────────────────────
  const cursor = initCursor();
  bindCursorHover(cursor, document.querySelectorAll('.nav-interactive, a, button, input, [type="range"]'));

  // ── 2. Render data-driven UI ───────────────────────────────────────────────
  let activeClubId = 'vedic';

  renderMenu(MENU_ERAS);
  renderGuestbook(SEED_GUESTBOOK_ENTRIES);
  renderClubCards(CLUBS_CONFIG, activeClubId, onClubSelect);
  renderArchivedDrawer(CLUBS_CONFIG, activeClubId, onClubSelect);

  // Left slide-out archives drawer binders
  const archivesDrawer = document.getElementById('archivesDrawer');
  const btnToggleArchives = document.getElementById('btnToggleArchives');
  const btnCloseArchives = document.getElementById('btnCloseArchives');

  btnToggleArchives?.addEventListener('click', () => {
    archivesDrawer?.classList.add('open');
  });

  btnCloseArchives?.addEventListener('click', () => {
    archivesDrawer?.classList.remove('open');
  });

  // ── 3. Seating state & Rotary Dials ────────────────────────────────────────
  let selectedSeat   = null;   // 'Seat_03' etc.
  let selectedSeatEl = null;   // HTMLElement

  const dialValues = { openness: 50, depth: 50, energy: 50 };

  const dialOpenness = createRotaryDial(document.getElementById('dialOpennessSlot'), 'TIME', 50, (val) => {
    dialValues.openness = val;
    onDialUpdate();
  });
  const dialDepth = createRotaryDial(document.getElementById('dialDepthSlot'), 'SOCIAL', 50, (val) => {
    dialValues.depth = val;
    onDialUpdate();
  });
  const dialEnergy = createRotaryDial(document.getElementById('dialEnergySlot'), 'FLAVOR', 50, (val) => {
    dialValues.energy = val;
    onDialUpdate();
  });

  const sliders = {
    get openness() { return { value: Math.round(dialValues.openness) }; },
    get depth() { return { value: Math.round(dialValues.depth) }; },
    get energy() { return { value: Math.round(dialValues.energy) }; }
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
    getDialValues: () => ({ o: dialValues.openness, d: dialValues.depth, e: dialValues.energy }),
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

    const config = CLUBS_CONFIG[clubId];
    const isExpired = new Date(config.eventDate) <= new Date();

    // Refresh layout selections
    renderClubCards(CLUBS_CONFIG, activeClubId, onClubSelect);
    renderArchivedDrawer(CLUBS_CONFIG, activeClubId, onClubSelect);

    // Auto-close left drawer on switch
    archivesDrawer?.classList.remove('open');

    // Handle expired event constraints
    if (isExpired) {
      if (pseudonymInput) {
        pseudonymInput.value = '';
        pseudonymInput.setAttribute('disabled', 'true');
      }
      if (emailInput) {
        emailInput.value = '';
        emailInput.setAttribute('disabled', 'true');
      }
      if (submitBtn) {
        submitBtn.disabled = true;
      }
      document.getElementById('calibrationDialsRow')?.classList.add('disabled');
      printToTerminal(`> ACCESS PROTOCOL LOCK: ${config.name.toUpperCase()} EVENT CONCLUDED. SESSION ARCHIVED.`);
    } else {
      if (pseudonymInput) pseudonymInput.removeAttribute('disabled');
      if (emailInput)     emailInput.removeAttribute('disabled');
      document.getElementById('calibrationDialsRow')?.classList.remove('disabled');
      printToTerminal(`> SWITCHING SYSTEM CHANNEL TO ${config.name.toUpperCase()}...`);
    }

    if (isAudioPlaying()) playBeaconChime();

    countdownInstance.stop();
    countdownInstance = startCountdown(config, countdownEls);
    buildSeating();
    validateForm();
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

  // Dials event wiring
  let printTimeout;
  function onDialUpdate() {
    drawRadar();
    updateAudioCalibration(sliders);

    // Sync vetting overlay ticket preview coordinates block
    const previewVector = document.getElementById('previewVector');
    if (previewVector) {
      previewVector.innerText = `[${Math.round(dialValues.openness)}%, ${Math.round(dialValues.depth)}%, ${Math.round(dialValues.energy)}%]`;
    }

    clearTimeout(printTimeout);
    printTimeout = setTimeout(() => {
      printToTerminal(
        `> TEMPORAL VECTOR ADJUSTED: [TIME: ${Math.round(dialValues.openness)}% | SOCIAL: ${Math.round(dialValues.depth)}% | FLAVOR: ${Math.round(dialValues.energy)}%]`
      );
    }, DEBOUNCE_PRINT_MS);
  }

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
    const isExpired = new Date(CLUBS_CONFIG[activeClubId].eventDate) <= new Date();
    if (isExpired) {
      if (submitBtn) submitBtn.disabled = true;
      return;
    }

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
    document.getElementById('calibrationDialsRow')?.classList.add('disabled');

    runDiagnosticSequence(
      {
        pseudo: pseudonymInput?.value.trim(),
        seat:   selectedSeat,
        o:      String(Math.round(dialValues.openness)),
        d:      String(Math.round(dialValues.depth)),
        eVal:   String(Math.round(dialValues.energy)),
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

    [pseudonymInput, emailInput].forEach(el => el?.removeAttribute('disabled'));
    document.getElementById('calibrationDialsRow')?.classList.remove('disabled');

    chronoForm?.reset();
    document.getElementById('vettingForm')?.reset();

    selectedSeat   = null;
    selectedSeatEl = null;

    const selectedChair = document.querySelector('.chair.selected');
    if (selectedChair) selectedChair.classList.remove('selected');

    document.getElementById('dotProgress2')?.classList.remove('active');
    document.getElementById('dotProgress3')?.classList.remove('active');

    // Reset dials back to 50% baseline values
    dialOpenness.setValue(50);
    dialDepth.setValue(50);
    dialEnergy.setValue(50);
    dialValues.openness = 50;
    dialValues.depth = 50;
    dialValues.energy = 50;

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
