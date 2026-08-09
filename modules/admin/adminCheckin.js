/* modules/admin/adminCheckin.js
 * Admin QR Check-in Station & Real-Time Verification Scanner.
 */

import { markTicketCheckedIn, getTicketDoc, writeFirestoreDoc } from '../firebase.js';

let checkinLogs = [];

/**
 * Initialize Door Check-in Station listeners & QR scanner handlers.
 */
export function initAdminCheckinListeners() {
  const btnProcess = document.getElementById('btnProcessCheckin');
  const inputEl = document.getElementById('adminCheckinInput');
  const logContainer = document.getElementById('adminCheckinLog');

  btnProcess?.addEventListener('click', async () => {
    const code = (inputEl.value || '').trim();
    if (!code) {
      alert('Please enter or scan a valid Booking ID (e.g. BT-2026-08-000127) or seat number.');
      return;
    }

    await processDoorCheckin(code);
    inputEl.value = '';
  });

  inputEl?.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const code = (inputEl.value || '').trim();
      if (code) {
        await processDoorCheckin(code);
        inputEl.value = '';
      }
    }
  });
}

/**
 * Process a check-in request by Booking ID or Seat ID.
 * @param {string} rawCode - Scanned QR code URL or Booking ID
 */
export async function processDoorCheckin(rawCode) {
  let bookingId = rawCode;

  // Extract ID from URL if full QR URL scanned (e.g. https://beyondthyme.com/verify?id=BT-2026-08-000127)
  if (rawCode.includes('id=')) {
    try {
      const urlObj = new URL(rawCode.startsWith('http') ? rawCode : `https://${rawCode}`);
      bookingId = urlObj.searchParams.get('id') || rawCode;
    } catch (e) {
      const match = rawCode.match(/BT-\d{4}-\d{2}-\d+/);
      if (match) bookingId = match[0];
    }
  }

  // Attempt lookup in Firestore tickets collection
  const ticketDoc = await getTicketDoc(bookingId);

  if (!ticketDoc) {
    // If entered as Seat number e.g. "Seat_03" or "3"
    let seatNum = parseInt(rawCode.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(seatNum) && seatNum >= 1 && seatNum <= 25) {
      const seatIdStr = String(seatNum).padStart(2, '0');
      const nowTime = new Date().toLocaleTimeString();
      const docId = `seat_${seatIdStr}`;

      await writeFirestoreDoc('seatBookings', docId, {
        seatId: `Seat_${seatIdStr}`,
        seatNum: seatNum,
        attendance: 'Checked In',
        checkinTime: nowTime,
      });

      _logCheckin(`Seat_${seatIdStr}`, 'Checked In (Seat Manual)', nowTime);
      alert(`✓ Guest for Seat P${seatIdStr} Checked In at ${nowTime}!`);
      return;
    }

    alert(`⚠️ INVALID TICKET: No active booking found for ID "${bookingId}".`);
    _logCheckin(bookingId, 'INVALID TICKET', new Date().toLocaleTimeString(), 'badge-invalid');
    return;
  }

  // Perform Firestore check-in transaction
  const result = await markTicketCheckedIn(bookingId);

  if (result.success) {
    const nowTime = result.ticket.checkinTime;
    _logCheckin(ticketDoc.seatId || bookingId, `Checked In (${ticketDoc.userName})`, nowTime, 'badge-checkedin');
    
    // Also sync seatBookings collection so floorplan updates
    const seatIdStr = (ticketDoc.seatId || 'Seat_01').replace(/[^0-9]/g, '').padStart(2, '0');
    if (seatIdStr) {
      await writeFirestoreDoc('seatBookings', `seat_${seatIdStr}`, {
        attendance: 'Checked In',
        checkinTime: nowTime,
      });
    }

    alert(`✨ ACCESS GRANTED! Welcome ${ticketDoc.userName}.\nSeat: ${ticketDoc.seatId}\nBooking ID: ${bookingId}`);
  } else if (result.reason === 'ALREADY_CHECKED_IN') {
    const prevTime = result.ticket.checkinTime || 'earlier';
    alert(`⚠️ DUPLICATE ENTRY PREVENTED!\nGuest ${result.ticket.userName} was already checked in at ${prevTime}.`);
    _logCheckin(ticketDoc.seatId || bookingId, `DUPLICATE ATTEMPT (${result.ticket.userName})`, new Date().toLocaleTimeString(), 'badge-invalid');
  } else if (result.reason === 'CANCELLED') {
    alert(`🚫 ACCESS DENIED: Ticket ${bookingId} has been CANCELLED.`);
    _logCheckin(bookingId, 'CANCELLED TICKET', new Date().toLocaleTimeString(), 'badge-invalid');
  }
}

function _logCheckin(seatOrId, statusMsg, timeStr, badgeCls = 'badge-checkedin') {
  checkinLogs.unshift({
    seat: seatOrId,
    status: statusMsg,
    time: timeStr,
    badgeClass: badgeCls,
  });
  renderCheckinLogs();
}

export function renderCheckinLogs() {
  const container = document.getElementById('adminCheckinLog');
  if (!container) return;

  container.innerHTML = '';
  if (checkinLogs.length === 0) {
    container.innerHTML = '<p class="admin-section-desc">No door activity recorded in this session yet.</p>';
    return;
  }

  checkinLogs.forEach(log => {
    const item = document.createElement('div');
    item.className = 'admin-recessed-box-subtle';
    item.innerHTML = `
      <span class="admin-text-coral-accent">${log.seat}</span>
      <span class="admin-badge ${log.badgeClass || 'admin-badge-success'}">${log.status}</span>
      <span class="admin-section-desc">${log.time}</span>
    `;
    container.appendChild(item);
  });
}
