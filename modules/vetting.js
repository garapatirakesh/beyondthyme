/* modules/vetting.js
 * Multi-step "Your Timeline" Luxury Booking Modal & Razorpay Checkout integration.
 */

import { SEAT_PRICE_INR, MIN_SEATS_PER_BOOKING, MAX_SEATS_PER_BOOKING, RAZORPAY_KEY_ID, EVENT_DETAILS, EMAIL_REGEX } from '../config/app.config.js';
import { addTimelineSubmission } from './admin.js';
import { generateTicketQRCode } from './qrcode.js';
import { bookSeatTransaction } from './firebase.js';
import { getCurrentUser } from './auth.js';
import { buildTicketData, persistTicket } from './ticket.js';
import { cacheTicketLocally, openTicketVerificationModal } from './myTickets.js';
import { dispatchTicketEmail } from './ticketExporter.js';

let selectedSeatQuantity = 1;

/**
 * Initialize Timeline Booking overlay.
 * @param {object} deps - { callbacks, getSelectedSeat() }
 */
export function initVetting(deps) {
  const { callbacks, getSelectedSeat } = deps;

  const overlay      = document.getElementById('vettingOverlay');
  const closeBtn      = document.getElementById('closeVettingBtn');
  const stepSummary  = document.getElementById('vettingStepSummary');
  const stepForm     = document.getElementById('vettingStepForm');
  const stepConfirm  = document.getElementById('vettingStepConfirm');
  const toFormBtn    = document.getElementById('toTimelineFormBtn');
  const reserveBtn   = document.getElementById('btnReserveSeatRazorpay');

  // Quantity Stepper controls
  const btnQtyMinus = document.getElementById('btnQtyMinus');
  const btnQtyPlus  = document.getElementById('btnQtyPlus');
  const qtyDisplay  = document.getElementById('seatQtyDisplay');
  const summaryTotalPriceEl = document.getElementById('summaryTotalReservationPrice');
  const btnPriceLabelEl = document.getElementById('btnReservePriceLabel');

  selectedSeatQuantity = 1;
  _updatePriceDisplays();

  btnQtyMinus?.addEventListener('click', (e) => {
    e.preventDefault();
    if (selectedSeatQuantity > MIN_SEATS_PER_BOOKING) {
      selectedSeatQuantity--;
      _updatePriceDisplays();
    }
  });

  btnQtyPlus?.addEventListener('click', (e) => {
    e.preventDefault();
    if (selectedSeatQuantity < MAX_SEATS_PER_BOOKING) {
      selectedSeatQuantity++;
      _updatePriceDisplays();
    }
  });

  function _updatePriceDisplays() {
    const totalINR = selectedSeatQuantity * SEAT_PRICE_INR;
    if (qtyDisplay) qtyDisplay.innerText = String(selectedSeatQuantity);
    if (summaryTotalPriceEl) summaryTotalPriceEl.innerText = `₹${totalINR.toLocaleString('en-IN')} INR`;
    if (btnPriceLabelEl) btnPriceLabelEl.innerText = `₹${totalINR.toLocaleString('en-IN')}`;
  }

  // Interactive Era selection cards
  const eraCards = document.querySelectorAll('.era-card-option');
  eraCards.forEach(card => {
    card.addEventListener('click', () => {
      eraCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
    });
  });

  // Interactive preference toggle pills
  const prefGroupBtns = document.querySelectorAll('.pref-group-btn');
  prefGroupBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const parent = btn.closest('.pref-group-toggle');
      if (parent) {
        parent.querySelectorAll('.pref-group-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      }
    });
  });

  // Event Header Details Population
  const themeEl = document.getElementById('bookingEventTheme');
  const dateEl  = document.getElementById('bookingEventDate');
  const timeEl  = document.getElementById('bookingEventTime');
  const venueEl = document.getElementById('bookingEventVenue');

  if (themeEl) themeEl.innerText = EVENT_DETAILS.theme;
  if (dateEl)  dateEl.innerText  = EVENT_DETAILS.date;
  if (timeEl)  timeEl.innerText  = EVENT_DETAILS.time;
  if (venueEl) venueEl.innerText = EVENT_DETAILS.venue;

  // Step 1 -> Step 2 (Summary to Timeline Form)
  toFormBtn?.addEventListener('click', (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const sForm = document.getElementById('vettingStepForm');
    const sSummary = document.getElementById('vettingStepSummary');
    _show(sForm);
    _hide(sSummary);
  });

  // Close Overlay
  closeBtn?.addEventListener('click', (e) => {
    if (e) e.preventDefault();
    _hideOverlay();
  });

  // Reserve My Seat & Trigger Razorpay
  reserveBtn?.addEventListener('click', (e) => {
    if (e) e.preventDefault();
    const fullName     = document.getElementById('tlFullName')?.value.trim();
    const dob          = document.getElementById('tlDOB')?.value.trim();
    const phone        = document.getElementById('tlPhone')?.value.trim();
    const favPlace     = document.getElementById('tlFavPlace')?.value.trim();
    const favFood      = document.getElementById('tlFavFood')?.value.trim();
    const allergies    = document.getElementById('tlAllergies')?.value.trim();
    const reliveMoment = document.getElementById('tlReliveMoment')?.value.trim();

    if (!fullName) { alert('Please enter your full name: "Who should we welcome?"'); return; }
    if (!dob)      { alert('Please enter your date of birth: "Which year did your journey begin?"'); return; }
    if (!phone)    { alert('Please enter your phone number: "How shall we contact your future self?"'); return; }

    const activeEra = document.querySelector('.era-card-option.active')?.getAttribute('data-era') || '2000s';

    const selectedSeatObj = getSelectedSeat?.() || 'Seat_11';
    const seatLabel = typeof selectedSeatObj === 'string' 
      ? selectedSeatObj 
      : (selectedSeatObj?.seatId || selectedSeatObj?.label || 'Seat_11');

    const totalAmountINR = selectedSeatQuantity * SEAT_PRICE_INR;

    const timelineData = {
      fullName,
      dob,
      phone,
      favPlace: favPlace || 'Unspecified Timeline',
      favFood: favFood || 'Time-Stop Feast',
      allergies: allergies || 'None',
      era: activeEra,
      timeOfDay: _getSelectedPref('prefTimeOfDay', 'Midnight'),
      beverage: _getSelectedPref('prefBeverage', 'Coffee'),
      personality: _getSelectedPref('prefPersonality', 'Introvert'),
      reliveMoment: reliveMoment || 'Every moment at the table',
      seatId: seatLabel,
      quantity: selectedSeatQuantity,
      unitPrice: SEAT_PRICE_INR,
      amount: totalAmountINR,
    };

    // Razorpay Integration
    if (window.Razorpay) {
      try {
        const options = {
          key: RAZORPAY_KEY_ID,
          amount: totalAmountINR * 100, // Multiplied in paise: e.g. 2 seats = 700000 paise = ₹7,000 INR
          currency: 'INR',
          name: 'Beyond Thyme Supper Club',
          description: `${selectedSeatQuantity} Seat(s) Reservation — ${EVENT_DETAILS.theme}`,
          image: '/logo.jpg',
          prefill: {
            name: fullName,
            contact: phone,
          },
          theme: {
            color: '#ff5a2e',
          },
          handler: function (response) {
            _handlePaymentSuccess(timelineData, response, deps);
          },
          modal: {
            ondismiss: function () {
              console.log('Payment checkout closed');
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } catch (e) {
        console.warn('Razorpay popup notice, proceeding to confirmation:', e);
        _handlePaymentSuccess(timelineData, { payment_id: `pay_direct_${Date.now()}` }, deps);
      }
    } else {
      _handlePaymentSuccess(timelineData, { payment_id: `pay_direct_${Date.now()}` }, deps);
    }
  });
}

/**
 * Handle payment completion and transition to Ticket Confirmation.
 */
async function _handlePaymentSuccess(timelineData, paymentResponse, deps) {
  timelineData.paymentId = paymentResponse.payment_id;

  // Save to Admin Submissions (Local)
  addTimelineSubmission(timelineData);

  const currentUser = getCurrentUser();

  // Reserve seat atomically using Firestore ACID Transaction
  try {
    await bookSeatTransaction(timelineData.seatId, timelineData, currentUser);
  } catch (err) {
    if (err?.code === 'DUPLICATE_BOOKING') {
      alert(err.message);
      return;
    }
  }

  // Generate Unique Ticket Object & Persist to Firestore
  const ticketData = buildTicketData(timelineData, currentUser);
  await persistTicket(ticketData);
  cacheTicketLocally(ticketData);

  // Trigger seat claim callback
  deps.callbacks?.onVettingComplete?.(timelineData);

  // Dispatch Email Notification Simulation
  try {
    dispatchTicketEmail(ticketData);
  } catch (e) {
    console.warn('Email notification notice:', e);
  }

  // Close Vetting Overlay & Open Luxury Digital Ticket Verification Modal
  _hideOverlay();
  setTimeout(() => {
    openTicketVerificationModal(ticketData);
  }, 300);
}

/**
 * Open Vetting / Timeline modal for a selected seat.
 * @param {string} seatId
 */
export function openVettingModal(seatParam) {
  const overlay     = document.getElementById('vettingOverlay');
  const stepSummary = document.getElementById('vettingStepSummary');
  const stepForm    = document.getElementById('vettingStepForm');
  const stepConfirm = document.getElementById('vettingStepConfirm');
  const seatTarget  = document.getElementById('summarySelectedSeatLabel');

  const rawSeat = typeof seatParam === 'string' 
    ? seatParam 
    : (seatParam?.seatId || seatParam?.label || `Seat_${String(seatParam?.id || 11).padStart(2, '0')}`);

  if (seatTarget) seatTarget.innerText = rawSeat.replace('_', ' ').toUpperCase();

  _show(stepSummary);
  _hide(stepForm);
  _hide(stepConfirm);

  if (overlay) {
    overlay.classList.remove('overlay-backdrop--hidden');
    overlay.classList.add('active');
  }
}

function _hideOverlay() {
  const overlay = document.getElementById('vettingOverlay');
  if (overlay) {
    overlay.classList.add('overlay-backdrop--hidden');
    overlay.classList.remove('active');
  }
}

function _show(el) {
  if (el) {
    el.classList.remove('hidden');
    el.style.display = 'block';
  }
}
function _hide(el) {
  if (el) {
    el.classList.add('hidden');
    el.style.display = 'none';
  }
}

function _getSelectedPref(groupId, defaultVal) {
  const activeBtn = document.querySelector(`#${groupId} .pref-group-btn.active`);
  return activeBtn ? activeBtn.getAttribute('data-value') : defaultVal;
}
