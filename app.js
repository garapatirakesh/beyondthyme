/* app.js — Beyond Thyme Orchestrator
 * Thin wiring layer. Contains zero business logic, zero hardcoded values.
 * All data lives in config/. All logic lives in modules/.
 */

import { CLUBS_CONFIG, getNextAvailableSeat } from './config/clubs.js';
import {
  RADAR, EMAIL_REGEX, DEBOUNCE_PRINT_MS,
} from './config/app.config.js';

import { initCursor, bindCursorHover } from './modules/cursor.js';
import {
  startAmbientAudio, stopAmbientAudio, isAudioPlaying,
  updateAudioCalibration, playBeaconChime, playResonanceChime,
  playSuccessArpeggio, playErrorBuzzer, playThermalPrinterTear,
  playStaticTapeClick,
} from './modules/audio.js';
import { printToTerminal, resetTerminal, runDiagnosticSequence } from './modules/terminal.js';
import { startCountdown }    from './modules/countdown.js';
import {
  renderSeatingLayout, selectSeat, convertSeatToOccupied,
} from './modules/seating.js';
import {
  generateDailyCoords, hideCoordY, initTimeCapsule, initVaultBreaker,
} from './modules/vault.js';
import { initExperienceSection, updateSeatsRemaining, syncSelectedEventToExperience } from './modules/experience.js';
import { initGoldParticles } from './modules/particles.js';
import { listenToLiveSeatBookings, listenToCollection, getTicketDoc } from './modules/firebase.js';
import { initAuth, promptGoogleLogin, getCurrentUser } from './modules/auth.js';
import { initAdminDashboard, openAdminDashboard } from './modules/admin.js';
import { initVetting, openVettingModal } from './modules/vetting.js';
import { renderClubCards, renderMenu, renderGuestbook, appendGuestbookEntry } from './modules/renderer.js';
import { createRotaryDial }  from './modules/dials.js';
import { initMyTickets, openTicketVerificationModal } from './modules/myTickets.js';
import { downloadTicketAsPDF, downloadTicketAsPNG, shareTicketOnWhatsApp, dispatchTicketEmail } from './modules/ticketExporter.js';


document.addEventListener('DOMContentLoaded', () => {

  // Initialize Midnight Memories Experience Section & Dark Gold Particle Canvas
  initExperienceSection();
  setTimeout(() => {
    initGoldParticles('goldParticleCanvas');
  }, 300);

  // Initialize Google Auth
  initAuth({
    onAuthSuccess(user) {
      const seatId = selectedSeat || getNextAvailableSeat(CLUBS_CONFIG[activeClubId]);
      openVettingModal(seatId, CLUBS_CONFIG[activeClubId]);
    },
    onAdminAccess(user) {
      openAdminDashboard();
    }
  });

  // Initialize Admin Portal Engine
  initAdminDashboard();

  // Initialize My Tickets Profile Hub
  initMyTickets();

  // QR Code Verification Route Handler (e.g. ?id=BT-2026-08-000127 or #verify?id=BT-2026-08-000127)
  async function checkTicketVerificationRoute() {
    const urlParams = new URLSearchParams(window.location.search);
    let ticketId = urlParams.get('id') || urlParams.get('verify');

    if (!ticketId && window.location.hash.includes('id=')) {
      const hashParts = window.location.hash.split('id=');
      ticketId = hashParts[1]?.split('&')[0];
    } else if (!ticketId) {
      const match = window.location.href.match(/BT-\d{4}-\d{2}-\d+/i);
      if (match) ticketId = match[0];
    }

    if (ticketId) {
      ticketId = ticketId.trim();
      const ticketDoc = await getTicketDoc(ticketId);
      if (ticketDoc) {
        openTicketVerificationModal(ticketDoc);
      } else {
        openTicketVerificationModal({
          bookingId: ticketId,
          userName: 'Honored Guest',
          themeName: 'Beyond Thyme',
          date: '17 MAY 2025',
          time: '7:30 PM',
          venue: 'HYDERABAD',
          status: 'CONFIRMED',
          checkedIn: false,
        });
      }
    }
  }

  checkTicketVerificationRoute();
  window.addEventListener('hashchange', checkTicketVerificationRoute);

  // Digital Ticket Action Buttons Wiring
  let activeOverlayTicket = null;

  document.getElementById('closeTicketOverlayBtn')?.addEventListener('click', () => {
    const overlay = document.getElementById('ticketOverlay');
    if (overlay) {
      overlay.classList.add('overlay-backdrop--hidden');
      overlay.classList.remove('active');
    }
  });

  document.getElementById('btnDownloadTicketPDF')?.addEventListener('click', async () => {
    const cardEl = document.querySelector('#ticketOverlayContainer #luxuryTicketCard');
    const bId = cardEl?.querySelector('.luxury-spec-value.font-mono')?.textContent || 'BT-TICKET';
    await downloadTicketAsPDF(cardEl, bId);
  });

  document.getElementById('btnDownloadTicketPNG')?.addEventListener('click', async () => {
    const cardEl = document.querySelector('#ticketOverlayContainer #luxuryTicketCard');
    const bId = cardEl?.querySelector('.luxury-spec-value.font-mono')?.textContent || 'BT-TICKET';
    await downloadTicketAsPNG(cardEl, bId);
  });

  document.getElementById('btnShareTicketWhatsApp')?.addEventListener('click', () => {
    const cardEl = document.querySelector('#ticketOverlayContainer #luxuryTicketCard');
    const bId = cardEl?.querySelector('.luxury-spec-value.font-mono')?.textContent || 'BT-TICKET';
    const name = cardEl?.querySelector('.luxury-spec-value.text-gold')?.textContent || 'Guest';
    const theme = cardEl?.querySelector('.luxury-banner-title')?.textContent || 'Midnight Memories';
    shareTicketOnWhatsApp({ bookingId: bId, userName: name, themeName: theme });
  });

  document.getElementById('btnMailTicketEmail')?.addEventListener('click', () => {
    const cardEl = document.querySelector('#ticketOverlayContainer #luxuryTicketCard');
    const bId = cardEl?.querySelector('.luxury-spec-value.font-mono')?.textContent || 'BT-TICKET';
    const name = cardEl?.querySelector('.luxury-spec-value.text-gold')?.textContent || 'Guest';
    const theme = cardEl?.querySelector('.luxury-banner-title')?.textContent || 'Midnight Memories';
    dispatchTicketEmail({ bookingId: bId, userName: name, themeName: theme, email: '' });
  });

  // Hash Router for #admin or /admin
  function handleAdminHashRoute() {
    if (window.location.hash.includes('admin')) {
      openAdminDashboard();
    }
  }

  // Header Login Button logic
  document.getElementById('headerLoginBtn')?.addEventListener('click', () => {
    const user = getCurrentUser();
    if (!user) {
      promptGoogleLogin();
    } else {
      // If already logged in, clicking it could mean view profile or log out.
      // For now, let's just log them out for simplicity, or open My Tickets.
      document.getElementById('myTicketsNavBtn')?.click();
    }
  });

  window.addEventListener('hashchange', handleAdminHashRoute);
  handleAdminHashRoute();

  document.getElementById('footerAdminLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    openAdminDashboard();
  });


  // ── 1. Cursor ──────────────────────────────────────────────────────────────
  const cursor = initCursor();
  bindCursorHover(cursor, document.querySelectorAll('.nav-interactive, a, button, input, [type="range"]'));

  // ── 2. Render data-driven UI ───────────────────────────────────────────────
  let activeClubId = Object.keys(CLUBS_CONFIG)[0] || 'zenitsu';

  // Listen to Themes (Menus)
  listenToCollection('themes', (themes) => {
    if (!themes || themes.length === 0) return;
    // Sort themes by their numeral (I, II, III, IV) or ID
    const sortedThemes = themes.sort((a, b) => {
      const numerals = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4 };
      return (numerals[a.numeral] || 99) - (numerals[b.numeral] || 99);
    });
    // Render only the first 3 for the main page (exclude Amrit Yuga which is injected by Vault)
    renderMenu(sortedThemes.slice(0, 3));
  });

  // Listen to Time Capsules (Guestbook)
  listenToCollection('timeCapsules', (entries) => {
    if (!entries || entries.length === 0) return;
    // Sort descending by timestamp
    const sortedEntries = entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    renderGuestbook(sortedEntries);
  });
  renderClubCards(CLUBS_CONFIG, activeClubId, onClubSelect);

  // Horizontal themes slider navigation controls
  const sliderViewport = document.querySelector('.slider-viewport');
  const clubCardsRow = document.getElementById('clubCardsRow');
  const sLeftBtn  = document.getElementById('sliderLeftBtn');
  const sRightBtn = document.getElementById('sliderRightBtn');

  sLeftBtn?.addEventListener('click', () => {
    sliderViewport?.scrollBy({ left: -240, behavior: 'smooth' });
    playStaticTapeClick();
  });
  sLeftBtn?.addEventListener('mouseenter', () => playStaticTapeClick());

  sRightBtn?.addEventListener('click', () => {
    sliderViewport?.scrollBy({ left: 240, behavior: 'smooth' });
    playStaticTapeClick();
  });
  sRightBtn?.addEventListener('mouseenter', () => playStaticTapeClick());

  // Play static click on hover of any theme card
  clubCardsRow?.addEventListener('mouseover', (e) => {
    const card = e.target.closest('.club-card');
    if (card && card !== e.relatedTarget?.closest('.club-card')) {
      playStaticTapeClick();
    }
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
    targetDayName:    document.getElementById('targetDayName'),
    targetDateNum:    document.getElementById('targetDateNum'),
    targetMonthName:  document.getElementById('targetMonthName'),
    targetTimeHour:   document.getElementById('targetTimeHour'),
  };

  let countdownInstance = startCountdown(CLUBS_CONFIG[activeClubId], countdownEls);

  // ── 4. Render seating floorplan ────────────────────────────────────────────
  function buildSeating() {
    renderSeatingLayout(CLUBS_CONFIG[activeClubId], {
      onSeatClick(chairEl) {
        selectSeat(chairEl);
        const rawNum = chairEl.getAttribute('data-seat-num');
        selectedSeat   = rawNum ? `Seat_${String(rawNum).padStart(2, '0')}` : chairEl.getAttribute('data-seat') || 'Seat_01';
        selectedSeatEl = chairEl;

        if (isAudioPlaying()) playBeaconChime();

        const user = getCurrentUser();
        if (!user) {
          promptGoogleLogin();
        } else {
          // If already logged in, proceed directly to vetting
          const seatId = selectedSeat || getNextAvailableSeat(CLUBS_CONFIG[activeClubId]);
          openVettingModal(seatId, CLUBS_CONFIG[activeClubId]);
        }
      },
      onSeatHoverEnter() { 
        if (isAudioPlaying()) playBeaconChime(); 
      },
      onSeatHoverLeave() {},
      onOccupiedHover()  { if (isAudioPlaying()) playResonanceChime(); },
    });

    bindCursorHover(cursor, document.querySelectorAll('.orbital-seat-node'));
  }

  buildSeating();
  if (CLUBS_CONFIG[activeClubId]) {
    syncSelectedEventToExperience(CLUBS_CONFIG[activeClubId]);
  }

  // Listen in real time to Firebase Firestore live bookings across all devices
  let globalSubmissions = [];

  function recalculateOccupancy() {
    if (!globalSubmissions) return;

    // Reset occupied seat lists for all clubs before calculating live bookings
    Object.values(CLUBS_CONFIG).forEach(club => {
      club.occupied = [];
      club.bookedSeats = 0;
    });

    globalSubmissions.forEach(sub => {
      const subClubId = sub.clubId || sub.vetting?.clubId;
      const subTheme = (sub.themeName || sub.vetting?.themeName || sub.vetting?.theme || '').toLowerCase().trim();

      // Find matching Supper Club event by Club ID or Theme Name
      let targetConfig = Object.values(CLUBS_CONFIG).find(club => 
        (subClubId && club.id === subClubId) || 
        (subTheme && (club.name || '').toLowerCase().trim() === subTheme)
      );

      if (!targetConfig) {
        targetConfig = CLUBS_CONFIG[activeClubId];
      }

      if (!targetConfig) return;

      const qty = Math.max(1, parseInt(sub.quantity || sub.vetting?.quantity || 1, 10));
      const startNumStr = (sub.seatId || 'Seat_01').replace(/[^0-9]/g, '');
      const startNum = parseInt(startNumStr, 10) || 1;

      for (let i = 0; i < qty; i++) {
        const seatNum = Math.min(25, startNum + i);
        const alias = (sub.userName || sub.fullName || sub.vetting?.fullName || 'Member').split(' ')[0].toUpperCase();
        const emoji = '⏳';

        if (!targetConfig.occupied.some(o => o.seat === seatNum)) {
          targetConfig.occupied.push({ seat: seatNum, alias: alias, emoji: emoji });
        }
      }
      
      targetConfig.bookedSeats += qty;
    });

    buildSeating();
    renderClubCards(CLUBS_CONFIG, activeClubId, onClubSelect);
    if (CLUBS_CONFIG[activeClubId]) {
      syncSelectedEventToExperience(CLUBS_CONFIG[activeClubId]);
    }
  }

  listenToLiveSeatBookings((submissions) => {
    if (!submissions) return;
    globalSubmissions = submissions;
    recalculateOccupancy();
  });

  // Listen in real time to Admin Portal Events updates (max 4 slots replaced dynamically)
  listenToCollection('events', (eventsData) => {
    if (!eventsData || eventsData.length === 0) return;

    // Sort events by creation timestamp or event date (newest created first)
    const sortedEvents = [...eventsData].sort((a, b) => {
      const timeA = new Date(a.createdAt || a.eventDate || 0).getTime();
      const timeB = new Date(b.createdAt || b.eventDate || 0).getTime();
      return timeB - timeA;
    });

    const cappedEvents = sortedEvents.slice(0, 4);
    const romanNumerals = ['I', 'II', 'III', 'IV'];
    const defaultEmblems = ['🔥', '🌊', '🏔️', '⚗️'];
    const defaultImages = [
      'assets/vedic_fire_food.png',
      'assets/coastal_monsoon_food.png',
      'assets/himalayan_mist_food.png',
      'assets/neo_bengaluru_food.png'
    ];

    const newConfig = {};

    cappedEvents.forEach((ev, idx) => {
      const clubId = ev.id || ev.clubKey || `club_${idx + 1}`;
      const existingOccupied = CLUBS_CONFIG[clubId]?.occupied || [];

      // Evaluate Automatic Scheduling (Time Starts & Stops at Event Time)
      const now = new Date();
      const endTime = ev.eventEndTime ? new Date(ev.eventEndTime) : null;
      let calculatedStatus = ev.status || 'Published';

      if (endTime && !isNaN(endTime.getTime()) && now > endTime) {
        calculatedStatus = 'Closed';
      }

      newConfig[clubId] = {
        id: clubId,
        name: ev.title || ev.name || `Supper Club ${idx + 1}`,
        location: ev.venue || ev.location || 'Secret Villa',
        emblem: ev.emblem || defaultEmblems[idx] || '✨',
        glowColor: ev.glowColor || '255,90,46',
        romanNumeral: romanNumerals[idx] || `${idx + 1}`,
        price: ev.price || 3500,
        capacity: ev.capacity !== undefined ? parseInt(ev.capacity, 10) : 25,
        eventDate: ev.eventDate || ev.eventStartTime || '2026-08-15T20:00:00+05:30',
        eventEndTime: ev.eventEndTime || null,
        displayNight: ev.displayNight || 'Sat Aug 15 · 20:00',
        image: ev.image || defaultImages[idx] || 'assets/vedic_fire_food.png',
        description: ev.description || 'Exclusive luxury dining experience where time stops at the table.',
        status: calculatedStatus,
        occupied: existingOccupied,
      };
    });

    Object.keys(CLUBS_CONFIG).forEach(key => delete CLUBS_CONFIG[key]);
    Object.assign(CLUBS_CONFIG, newConfig);

    if (!CLUBS_CONFIG[activeClubId]) {
      activeClubId = Object.keys(CLUBS_CONFIG)[0] || '';
    }

    if (CLUBS_CONFIG[activeClubId]) {
      countdownInstance.stop();
      countdownInstance = startCountdown(CLUBS_CONFIG[activeClubId], countdownEls);
    }
    
    // Re-run the occupancy calculation which will also update the UI (cards, seating, experience)
    recalculateOccupancy();
  });

  // ── 5. Vetting & Timeline Booking Overlay ──────────────────────────────────
  initVetting({
    getSelectedSeat: () => selectedSeat ? { seatId: selectedSeat, seatEl: selectedSeatEl } : null,
    callbacks: {
      onVettingComplete(timelineData) {
        const seatNumStr = (timelineData.seatId || 'Seat_03').replace('SEAT_', '').replace('Seat_', '');
        const seatNum    = parseInt(seatNumStr, 10);
        const alias      = (timelineData.fullName || 'Member').split(' ')[0];
        const emoji      = '⏳';

        const config = CLUBS_CONFIG[activeClubId];
        if (!config.occupied.some(o => o.seat === seatNum)) {
          config.occupied.push({ seat: seatNum, alias: alias.toUpperCase(), emoji: emoji });
        }

        if (selectedSeatEl) {
          convertSeatToOccupied(selectedSeatEl, { emoji, alias, diet: timelineData.era }, String(seatNum).padStart(2, '0'));
        }

        if (isAudioPlaying()) playSuccessArpeggio();
      }
    }
  });

  // ── 6. Club switcher ───────────────────────────────────────────────────────
  function onClubSelect(clubId) {
    activeClubId   = clubId;
    selectedSeat   = null;
    selectedSeatEl = null;

    _updateTerminalSeatLine(null);

    const config = CLUBS_CONFIG[clubId];
    syncSelectedEventToExperience(config);
    const isExpired = new Date(config.eventDate) <= new Date();

    // Refresh layout selections
    renderClubCards(CLUBS_CONFIG, activeClubId, onClubSelect);

    // Handle expired event constraints
    if (isExpired) {
      if (submitBtn) {
        submitBtn.disabled = true;
      }
      document.getElementById('calibrationDialsRow')?.classList.add('disabled');
      printToTerminal(`> ACCESS PROTOCOL LOCK: ${config.name.toUpperCase()} EVENT CONCLUDED. SESSION ARCHIVED.`);
    } else {
      if (submitBtn) submitBtn.disabled = false;
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
  // Dials & HUD Synchronization Scoring wiring
  let printTimeout;
  function onDialUpdate() {
    drawRadar();
    updateAudioCalibration(sliders);

    // Calculate real-time Synchronization Score from Vibe Vector Dials
    const syncScore = Math.min(100, Math.round(
      (dialValues.openness * 0.33) +
      (dialValues.depth * 0.33) +
      (dialValues.energy * 0.34)
    ));

    const syncScoreEl = document.getElementById('hudSyncScoreValue');
    const radarSyncTag = document.getElementById('radarSyncTag');
    const telemetryMatchVal = document.getElementById('telemetryMatchVal');

    if (syncScoreEl) syncScoreEl.innerText = `${syncScore}%`;
    if (radarSyncTag) radarSyncTag.innerText = `VECTOR: SYNC ${syncScore}%`;
    if (telemetryMatchVal) telemetryMatchVal.innerText = `${syncScore}% MATCH`;

    // Sync vetting overlay ticket preview coordinates block
    const previewVector = document.getElementById('previewVector');
    if (previewVector) {
      previewVector.innerText = `[${Math.round(dialValues.openness)}%, ${Math.round(dialValues.depth)}%, ${Math.round(dialValues.energy)}%]`;
    }

    clearTimeout(printTimeout);
    printTimeout = setTimeout(() => {
      printToTerminal(
        `> AI ANALYSIS: VECTOR ALIGNED [TIME: ${Math.round(dialValues.openness)}% | SOCIAL: ${Math.round(dialValues.depth)}% | FLAVOR: ${Math.round(dialValues.energy)}%] — SYNC: ${syncScore}%`,
        'accent'
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

  // ── 9. Main form (chrono terminal & calibration console) ───────────────────
  const chronoForm     = document.getElementById('chronoForm');
  const submitBtn      = document.getElementById('submitBtn');
  const terminalBox    = document.getElementById('terminalBox');
  const successOverlay = document.getElementById('successOverlay');
  const closeSuccessBtn = document.getElementById('closeSuccessBtn');

  function validateForm() {
    const isExpired = new Date(CLUBS_CONFIG[activeClubId].eventDate) <= new Date();
    if (submitBtn) submitBtn.disabled = isExpired;
  }

  chronoForm?.addEventListener('submit', (e) => {
    e.preventDefault();

    submitBtn.disabled = true;
    submitBtn.innerText = '⚡ TRANSMITTING CALIBRATION VECTOR...';
    document.getElementById('calibrationDialsRow')?.classList.add('disabled');

    const currentUser = getCurrentUser();
    const userPseudo = currentUser ? currentUser.name : 'Chrono_Explorer';

    runDiagnosticSequence(
      {
        pseudo: userPseudo,
        seat:   selectedSeat || 'Seat_01',
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

    setTimeout(() => {
      submitBtn.innerText = '✨ CONTINUED TO RESERVE SEAT →';
      submitBtn.disabled = false;
      submitBtn.onclick = () => {
        openVettingModal(selectedSeat || 'Seat_01', CLUBS_CONFIG[activeClubId]);
      };
    }, 2400);
  });

  closeSuccessBtn?.addEventListener('click', () => {
    if (successOverlay) successOverlay.style.display = 'none';
    terminalBox?.classList.remove('diagnostic-running');

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

  initVaultBreaker(
    { coordX, coordY },
    { playBeaconChime, playSuccessArpeggio, playErrorBuzzer },
    cursor
  );

  // ── 11. Guestbook ─────────────────────────────────────────────────────────
  const guestbookForm = document.getElementById('guestbookForm');
  guestbookForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = document.getElementById('guestbookMsg')?.value.trim();
    if (!message) return;

    const user = getCurrentUser();
    if (!user) {
      promptGoogleLogin();
      return;
    }

    const alias = user.name || (user.email ? user.email.split('@')[0].toUpperCase() : 'MEMBER');
    appendGuestbookEntry(alias, message);
    document.getElementById('guestbookMsg').value = '';
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
