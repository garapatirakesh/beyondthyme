/* modules/admin/adminCheckin.js
 * Admin QR Check-in & Door Telemetry module.
 */

import { writeFirestoreDoc } from '../firebase.js';

let checkinLogs = [];

/**
 * Initialize Check-in Station controls.
 * @param {Array} bookings
 */
export function initAdminCheckinListeners(bookings = []) {
  const btnProcess = document.getElementById('btnProcessCheckin');
  const inputEl = document.getElementById('adminCheckinInput');

  if (btnProcess && inputEl) {
    btnProcess.addEventListener('click', async () => {
      const code = (inputEl.value || '').trim();
      if (!code) {
        alert('Please enter or scan a ticket code / seat ID (e.g. Seat_01 or P01).');
        return;
      }

      // Match seat
      let seatNum = parseInt(code.replace(/[^0-9]/g, ''), 10);
      if (isNaN(seatNum) || seatNum < 1 || seatNum > 25) {
        seatNum = 1;
      }

      const docId = `seat_${String(seatNum).padStart(2, '0')}`;
      const nowTime = new Date().toLocaleTimeString();

      await writeFirestoreDoc('seatBookings', docId, {
        seatId: `Seat_${String(seatNum).padStart(2, '0')}`,
        seatNum: seatNum,
        attendance: 'Checked In',
        checkinTime: nowTime,
      });

      checkinLogs.unshift({
        time: nowTime,
        seat: `Seat_${String(seatNum).padStart(2, '0')}`,
        status: 'Checked In',
      });

      renderCheckinLogs();
      inputEl.value = '';
      alert(`✓ Guest for Seat P${String(seatNum).padStart(2, '0')} Checked In at ${nowTime}!`);
    });
  }
}

export function renderCheckinLogs() {
  const container = document.getElementById('adminCheckinLog');
  if (!container) return;

  container.innerHTML = '';
  if (checkinLogs.length === 0) {
    container.innerHTML = '<p style="color: var(--admin-text-secondary); font-size: 0.88rem;">No door activity recorded in this session yet.</p>';
    return;
  }

  checkinLogs.forEach(log => {
    const item = document.createElement('div');
    item.style.cssText = 'display: flex; justify-content: space-between; padding: 0.5rem 0.75rem; background: rgba(11, 12, 16, 0.6); border-radius: 6px; font-size: 0.85rem; border: 1px solid rgba(46, 196, 182, 0.3);';
    item.innerHTML = `
      <span style="color: var(--admin-gold); font-weight: 600;">${log.seat}</span>
      <span class="admin-badge admin-badge-success">${log.status}</span>
      <span style="color: var(--admin-text-secondary);">${log.time}</span>
    `;
    container.appendChild(item);
  });
}
