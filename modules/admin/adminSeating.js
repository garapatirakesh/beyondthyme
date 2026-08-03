/* modules/admin/adminSeating.js
 * Admin Seating Management module (25-Seat Visual Layout Controls).
 */

import { ADMIN_DEFAULTS } from '../../config/admin.config.js';
import { writeFirestoreDoc } from '../firebase.js';

let seatBookingsData = [];

/**
 * Render Interactive 25-Seat Floorplan Grid.
 * @param {Array} bookings
 */
export function renderAdminSeatingView(bookings = []) {
  seatBookingsData = bookings;
  const grid = document.getElementById('adminInteractiveSeatGrid');
  if (!grid) return;

  grid.innerHTML = '';
  for (let i = 1; i <= ADMIN_DEFAULTS.MAX_SEATS; i++) {
    const seatIdStr = `Seat_${String(i).padStart(2, '0')}`;
    const booking = bookings.find(b => b.seatNum === i || b.seatId === seatIdStr);

    let statusCls = 'available';
    let statusLabel = 'OPEN';

    if (booking?.status === 'BOOKED') {
      statusCls = 'booked';
      statusLabel = booking.userName || 'BOOKED';
    } else if (booking?.status === 'LOCKED' || booking?.status === 'RESERVED') {
      statusCls = 'locked';
      statusLabel = booking.status;
    }

    const card = document.createElement('div');
    card.className = `admin-seat-card ${statusCls}`;
    card.innerHTML = `
      <div class="admin-seat-num">P${String(i).padStart(2, '0')}</div>
      <div class="admin-seat-status">${statusLabel}</div>
    `;

    card.addEventListener('click', () => {
      _openSeatActionMenu(i, booking);
    });

    grid.appendChild(card);
  }
}

export function initAdminSeatingListeners() {
  const resetBtn = document.getElementById('btnResetAllSeats');
  if (resetBtn) {
    resetBtn.addEventListener('click', async () => {
      if (confirm('Are you sure you want to reset all 25 seats to AVAILABLE?')) {
        for (let i = 1; i <= ADMIN_DEFAULTS.MAX_SEATS; i++) {
          const seatIdStr = String(i).padStart(2, '0');
          await writeFirestoreDoc('seatBookings', `seat_${seatIdStr}`, {
            seatId: `Seat_${seatIdStr}`,
            seatNum: i,
            userName: '',
            userAvatar: '',
            status: 'AVAILABLE',
            bookedAt: null,
          });
        }
        alert('All 25 seats reset to AVAILABLE.');
      }
    });
  }
}

async function _openSeatActionMenu(seatNum, booking) {
  const seatIdStr = String(seatNum).padStart(2, '0');
  const docId = `seat_${seatIdStr}`;
  const currentStatus = booking?.status || 'AVAILABLE';

  const action = prompt(
    `SEAT P${seatIdStr} MANAGEMENT\nCurrent Status: ${currentStatus}\n\nChoose an Action:\n1 - Lock Seat\n2 - Reserve Seat\n3 - Assign Guest Manually\n4 - Release / Unlock Seat`,
    '1'
  );

  if (!action) return;

  if (action === '1') {
    await writeFirestoreDoc('seatBookings', docId, {
      seatId: `Seat_${seatIdStr}`,
      seatNum: seatNum,
      status: 'LOCKED',
    });
  } else if (action === '2') {
    await writeFirestoreDoc('seatBookings', docId, {
      seatId: `Seat_${seatIdStr}`,
      seatNum: seatNum,
      status: 'RESERVED',
    });
  } else if (action === '3') {
    const name = prompt('Enter Guest Name to Assign:', 'VIP Guest');
    if (name) {
      await writeFirestoreDoc('seatBookings', docId, {
        seatId: `Seat_${seatIdStr}`,
        seatNum: seatNum,
        userName: name,
        userAvatar: '👑',
        status: 'BOOKED',
        bookedAt: new Date().toISOString(),
      });
    }
  } else if (action === '4') {
    await writeFirestoreDoc('seatBookings', docId, {
      seatId: `Seat_${seatIdStr}`,
      seatNum: seatNum,
      userName: '',
      userAvatar: '',
      status: 'AVAILABLE',
      bookedAt: null,
    });
  }
}
