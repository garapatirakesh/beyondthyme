/* modules/vetting.js
 * Multi-step chrono-vetting overlay flow.
 * Handles 3-step modal, avatar selection, and seat claim finalisation.
 */

import { EMAIL_REGEX, VETTING_SUBMIT_DELAY_MS } from '../config/app.config.js';

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

  // ── Step navigation ──────────────────────────────────────────────
  toStep2Btn?.addEventListener('click', () => {
    const pseudo = pseudoInput?.value.trim();
    const email  = emailInput?.value.trim();

    if (!pseudo) { alert('Please calibrate your pseudonym alias.'); return; }
    if (!EMAIL_REGEX.test(email)) { alert('Please enter a valid member coordinates email ID.'); return; }

    _show(step2); _hide(step1);
  });

  backToStep1Btn?.addEventListener('click', () => { _show(step1); _hide(step2); });
  toStep3Btn?.addEventListener('click',     () => { _show(step3); _hide(step2); });
  backToStep2Btn?.addEventListener('click', () => { _show(step2); _hide(step3); });

  // ── Avatar radio highlight ───────────────────────────────────────
  document.querySelectorAll('.avatar-node-label').forEach(label => {
    label.addEventListener('click', () => {
      document.querySelectorAll('.avatar-node-label .avatar-emoji-btn')
        .forEach(btn => btn.classList.remove('active'));
      label.querySelector('.avatar-emoji-btn')?.classList.add('active');
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

    // Pre-fill from terminal form if available
    const termPseudo = document.getElementById('pseudonymInput')?.value.trim();
    const termEmail  = document.getElementById('emailInput')?.value.trim();
    if (termPseudo && pseudoInput)  pseudoInput.value = termPseudo;
    if (termEmail  && emailInput)   emailInput.value  = termEmail;

    _show(overlay);
    _show(step1); _hide(step2); _hide(step3);
  }

  return { openForSeat };
}

// ─── Private helpers ──────────────────────────────────────────────────────────

function _show(el) { if (el) el.style.display = el.tagName === 'DIV' ? 'block' : 'block'; }
function _hide(el) { if (el) el.style.display = 'none'; }
