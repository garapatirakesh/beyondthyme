/* modules/admin/adminBookings.js
 * Admin Booking Management module (Table rendering, seat moving, CSV exports).
 */

import { writeFirestoreDoc, removeFirestoreDoc } from '../firebase.js';

let activeBookings = [];

/**
 * Render Bookings Table.
 * @param {Array} bookings
 */
export function renderAdminBookingsView(bookings = []) {
  activeBookings = bookings;
  const tbody = document.getElementById('adminBookingsTableBody');
  if (!tbody) return;

  tbody.innerHTML = '';
  if (bookings.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="admin-text-center admin-p-2rem">
          No bookings recorded yet. Select a seat on the frontend floorplan to create test bookings.
        </td>
      </tr>
    `;
    return;
  }

  bookings.forEach(b => {
    const tr = document.createElement('tr');
    const vetting = b.vetting || {};

    tr.innerHTML = `
      <td><span class="admin-badge admin-badge-warning">${b.seatId || 'Seat'}</span></td>
      <td>
        <strong class="admin-text-coral-accent">${b.userName || 'Member'}</strong><br>
        <small class="admin-section-desc">${b.userEmail || '-'}</small>
      </td>
      <td>${vetting.phone || b.phone || '-'}</td>
      <td><small class="admin-section-desc">${b.bookedAt ? new Date(b.bookedAt).toLocaleTimeString() : '-'}</small></td>
      <td><span class="admin-badge admin-badge-success">${b.paymentStatus || 'Paid'}</span></td>
      <td><span class="admin-badge ${b.attendance === 'Checked In' ? 'admin-badge-success' : 'admin-badge-info'}">${b.attendance || 'Unchecked'}</span></td>
      <td>
        <small>${vetting.favFood || 'Standard'}</small><br>
        <small class="admin-badge admin-badge-danger">Allergies: ${vetting.allergies || 'None'}</small>
      </td>
      <td>
        <div class="admin-flex-gap-sm">
          <button class="admin-btn admin-btn-outline admin-btn-sm btn-move-seat" data-id="${b.seatId}">Move</button>
          <button class="admin-btn admin-btn-danger admin-btn-sm btn-cancel-booking" data-id="${b.seatId}">Cancel</button>
        </div>
      </td>
    `;

    tr.querySelector('.btn-move-seat')?.addEventListener('click', async () => {
      const newSeatNum = prompt(`Move ${b.userName} from ${b.seatId} to target Seat Number (1-25):`);
      if (newSeatNum) {
        const targetSeatNum = parseInt(newSeatNum, 10);
        if (targetSeatNum >= 1 && targetSeatNum <= 25) {
          const oldDocId = `seat_${String(b.seatNum || 1).padStart(2, '0')}`;
          const newDocId = `seat_${String(targetSeatNum).padStart(2, '0')}`;

          await writeFirestoreDoc('seatBookings', oldDocId, {
            status: 'AVAILABLE',
            userName: '',
            userAvatar: '',
            bookedAt: null,
          });

          await writeFirestoreDoc('seatBookings', newDocId, {
            ...b,
            seatId: `Seat_${String(targetSeatNum).padStart(2, '0')}`,
            seatNum: targetSeatNum,
          });

          alert(`Successfully moved booking to Seat P${targetSeatNum}`);
        }
      }
    });

    tr.querySelector('.btn-cancel-booking')?.addEventListener('click', async () => {
      if (confirm(`Cancel booking for ${b.userName || b.seatId}?`)) {
        const docId = `seat_${String(b.seatNum || 1).padStart(2, '0')}`;
        await writeFirestoreDoc('seatBookings', docId, {
          status: 'AVAILABLE',
          userName: '',
          userAvatar: '',
          bookedAt: null,
        });
      }
    });

    tbody.appendChild(tr);
  });
}

export function initAdminBookingsListeners() {
  const btnExport = document.getElementById('btnExportBookingsCsv');
  if (btnExport) {
    btnExport.addEventListener('click', () => {
      if (activeBookings.length === 0) {
        alert('No bookings available to export.');
        return;
      }

      let csv = 'Seat,Guest Name,Email,Phone,Booked At,Payment Status,Attendance,Dietary,Allergies\n';
      activeBookings.forEach(b => {
        const v = b.vetting || {};
        csv += `"${b.seatId}","${b.userName || ''}","${b.userEmail || ''}","${v.phone || ''}","${b.bookedAt || ''}","${b.paymentStatus || 'Paid'}","${b.attendance || 'Unchecked'}","${v.favFood || ''}","${v.allergies || ''}"\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `BeyondThyme_Bookings_${Date.now()}.csv`;
      a.click();
    });
  }
}
