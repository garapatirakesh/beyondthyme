/* modules/vetting.js
 * Multi-step chrono-vetting overlay flow.
 * Handles 3-step modal, live ticket preview, typewriter logs, and audio handshakes.
 */

import { EMAIL_REGEX, VETTING_SUBMIT_DELAY_MS } from '../config/app.config.js';
import { playTerminalBootSweep } from './audio.js';

/**
 * Initialise the vetting overlay and all its step navigation.
 *
 * @param {object} deps — all DOM ids and callbacks needed
 * @param {object} deps.callbacks — {
 *   onVettingComplete(vettingData),   // vettingData: { pseudo, email, avatar, diet, seat, seatEl }
 *   onVettingCancel()
 * }
 */
export function initVetting(deps) {
  const {
    callbacks,
    getSelectedSeat,   // () => { seatId, seatEl } | null
    setSelectedSeat,   // (seatId) => void
  } = deps;

  const overlay    = document.getElementById('vettingOverlay');
  const step1      = document.getElementById('vettingStep1');
  const step2      = document.getElementById('vettingStep2');
  const step3      = document.getElementById('vettingStep3');

  const pseudoInput = document.getElementById('vettingPseudo');
  const emailInput  = document.getElementById('vettingEmail');

  const toStep2Btn      = document.getElementById('toStep2Btn');
  const toStep3Btn      = document.getElementById('toStep3Btn');
  const backToStep1Btn  = document.getElementById('backToStep1');
  const backToStep2Btn  = document.getElementById('backToStep2');
  const submitVettingBtn = document.getElementById('submitVettingBtn');
  const closeVettingBtn  = document.getElementById('closeVettingBtn');

  // Preview elements
  const previewPseudo = document.getElementById('previewPseudo');
  const previewSeat   = document.getElementById('previewSeat');
  const previewDiet   = document.getElementById('previewDiet');
  const previewAvatar = document.getElementById('previewAvatar');

  // Typewriter effect utility
  function typewrite(element, text, speed = 12, callback) {
    if (!element) { callback?.(); return; }
    element.innerText = '';
    let i = 0;
    function step() {
      if (i < text.length) {
        element.innerText += text.charAt(i);
        i++;
        setTimeout(step, speed);
      } else {
        callback?.();
      }
    }
    step();
  }

  // Sync live ticket preview helper
  function syncPreview() {
    if (previewPseudo && pseudoInput) {
      previewPseudo.innerText = pseudoInput.value.trim() ? pseudoInput.value.trim().toUpperCase() : 'PENDING ALIAS';
    }

    const selected = getSelectedSeat?.();
    if (previewSeat && selected) {
      previewSeat.innerText = selected.seatId.toUpperCase().replace('_', ' ');
    }

    if (previewDiet) {
      const activeDiet = document.querySelector('input[name="dietProfile"]:checked');
      previewDiet.innerText = activeDiet ? activeDiet.value.toUpperCase() : 'NOT SET';
    }

    if (previewAvatar) {
      const activeAvatar = document.querySelector('input[name="tempAvatar"]:checked');
      previewAvatar.innerText = activeAvatar ? activeAvatar.value : '⏳';
    }
  }

  // ── Step navigation ──────────────────────────────────────────────
  toStep2Btn?.addEventListener('click', () => {
    const pseudo = pseudoInput?.value.trim();
    const email  = emailInput?.value.trim();

    if (!pseudo) { alert('Please calibrate your pseudonym alias.'); return; }
    if (!EMAIL_REGEX.test(email)) { alert('Please enter a valid member coordinates email ID.'); return; }

    _show(step2); _hide(step1);
    syncPreview();

    const step2Label = step2.querySelector('.vetting-step-label');
    if (step2Label) {
      typewrite(step2Label, 'Step 2 of 3: Dietary Calibration');
    }
  });

  backToStep1Btn?.addEventListener('click', () => {
    _show(step1); _hide(step2);
    syncPreview();
  });

  toStep3Btn?.addEventListener('click', () => {
    _show(step3); _hide(step2);
    syncPreview();

    const step3Label = step3.querySelector('.vetting-step-label');
    if (step3Label) {
      typewrite(step3Label, 'Step 3 of 3: Select Temporal Avatar');
    }
  });

  backToStep2Btn?.addEventListener('click', () => {
    _show(step2); _hide(step3);
    syncPreview();
  });

  // Watch inputs to update live preview in real time
  pseudoInput?.addEventListener('input', syncPreview);

  // Vetting diet selections update preview
  document.querySelectorAll('input[name="dietProfile"]').forEach(radio => {
    radio.addEventListener('change', syncPreview);
  });

  // ── Avatar radio highlight ───────────────────────────────────────
  document.querySelectorAll('.avatar-node-label').forEach(label => {
    label.addEventListener('click', () => {
      document.querySelectorAll('.avatar-node-label .avatar-emoji-btn')
        .forEach(btn => btn.classList.remove('active'));
      label.querySelector('.avatar-emoji-btn')?.classList.add('active');
      
      const radio = label.querySelector('input[type="radio"]');
      if (radio) {
        radio.checked = true;
        syncPreview();
      }
    });
  });

  // ── Final submit ─────────────────────────────────────────────────
  submitVettingBtn?.addEventListener('click', () => {
    const avatar = document.querySelector('input[name="tempAvatar"]:checked')?.value;
    const diet   = document.querySelector('input[name="dietProfile"]:checked')?.value;
    const pseudo = pseudoInput?.value.trim();
    const email  = emailInput?.value.trim();
    const selected = getSelectedSeat?.();

    if (!selected) return;

    _hide(overlay);

    callbacks.onVettingComplete?.({
      pseudo,
      email,
      avatar,
      diet,
      seatId: selected.seatId,
      seatEl: selected.seatEl,
    });

    // Auto-trigger form submission after short delay
    setTimeout(() => {
      document.getElementById('chronoForm')?.dispatchEvent(new Event('submit'));
    }, VETTING_SUBMIT_DELAY_MS);
  });

  // ── Close / cancel ───────────────────────────────────────────────
  closeVettingBtn?.addEventListener('click', () => {
    _hide(overlay);
    callbacks.onVettingCancel?.();
  });

  /**
   * Open the vetting overlay for a specific seat.
   * Pre-fills pseudonym/email if already entered in the terminal form.
   * @param {HTMLElement} seatEl
   */
  function openForSeat(seatEl) {
    if (!overlay) return;

    // Trigger activation boot sound sweep
    playTerminalBootSweep();

    // Pre-fill from terminal form if available
    const termPseudo = document.getElementById('pseudonymInput')?.value.trim();
    const termEmail  = document.getElementById('emailInput')?.value.trim();
    if (termPseudo && pseudoInput)  pseudoInput.value = termPseudo;
    if (termEmail  && emailInput)   emailInput.value  = termEmail;

    _show(overlay);
    _show(step1); _hide(step2); _hide(step3);
    
    // Add pulsing screen grid overlay class to vetting panel
    const vettingPanel = overlay.querySelector('.vetting-panel');
    if (vettingPanel) {
      vettingPanel.classList.add('scanning-boot');
      setTimeout(() => {
        vettingPanel.classList.remove('scanning-boot');
      }, 1000);
    }

    // Typewrite the step 1 header for premium boot feel
    const step1Label = step1.querySelector('.vetting-step-label');
    if (step1Label) {
      typewrite(step1Label, 'Step 1 of 3: Identity & Coordinates');
    }

    syncPreview();
  }

  return { openForSeat };
}

// ─── Private helpers ──────────────────────────────────────────────────────────

function _show(el) { if (el) el.style.display = el.tagName === 'DIV' ? 'block' : 'block'; }
function _hide(el) { if (el) el.style.display = 'none'; }
