import { writeFirestoreDoc } from '../firebase.js';
import { buildCanonicalBookings, isBookingForEvent } from './adminDashboardService.js';

let activeBookings = [];
let currentSelectedEvent = null;

/**
 * Render Bookings Table for Selected Event.
 * @param {Array} seatBookings - Live array of seatBookings documents
 * @param {Array} tickets - Live array of ticket documents
 * @param {object} selectedEvent - Currently selected active event object
 */
export function renderAdminBookingsView(seatBookings = [], tickets = [], selectedEvent = null) {
  if (Array.isArray(tickets) && !Array.isArray(seatBookings)) {
    selectedEvent = tickets;
    tickets = [];
  } else if (!selectedEvent && !Array.isArray(tickets) && typeof seatBookings === 'object') {
    selectedEvent = seatBookings;
    seatBookings = [];
    tickets = [];
  }

  currentSelectedEvent = selectedEvent;

  const eventName = selectedEvent?.name || selectedEvent?.title || 'Selected Event';
  const canonicalAll = buildCanonicalBookings(seatBookings, tickets);

  // Filter bookings strictly for selected event (Requirement 19)
  activeBookings = selectedEvent
    ? canonicalAll.filter(b => isBookingForEvent(b, selectedEvent))
    : canonicalAll;

  const tbody = document.getElementById('adminBookingsTableBody');
  if (!tbody) return;

  tbody.innerHTML = '';
  if (activeBookings.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="admin-text-center admin-p-2rem font-mono text-muted">
          No bookings recorded for this event (${eventName}). Select another event or book seats on the frontend floorplan.
        </td>
      </tr>
    `;
    return;
  }

  activeBookings.forEach(b => {
    const tr = document.createElement('tr');
    const vetting = b.vetting || {};
    const ticketLabel = b.quantity > 1 ? `${b.quantity} Tickets` : (b.seatId || 'Seat P01');

    tr.innerHTML = `
      <td>
        <span class="admin-badge admin-badge-warning">${ticketLabel}</span>
      </td>
      <td>
        <strong class="admin-text-coral-accent">${b.guestName || 'Member'}</strong><br>
        <small class="admin-section-desc">${b.email || '-'}</small>
      </td>
      <td>${vetting.phone || b.phone || '-'}</td>
      <td><small class="admin-section-desc">${b.bookedAt ? new Date(b.bookedAt).toLocaleTimeString() : '-'}</small></td>
      <td>
        <span class="admin-badge admin-badge-success">${b.paymentStatus || 'Paid'}</span><br>
        <small class="font-mono">₹${totalAmount.toLocaleString('en-IN')}</small>
      </td>
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
      const newSeatNumStr = prompt(`Move ${b.userName} from ${b.seatId} to target Seat Number (1-${eventCap}):`);
      if (newSeatNumStr) {
        const targetSeatNum = parseInt(newSeatNumStr, 10);
        if (targetSeatNum >= 1 && targetSeatNum <= eventCap) {
          const oldSeatIdStr = String(b.seatNum || 1).padStart(2, '0');
          const newSeatIdStr = String(targetSeatNum).padStart(2, '0');
          const oldDocId = b.bookingId || `booking_${eventId}_seat_${oldSeatIdStr}`;
          const newDocId = `booking_${eventId}_seat_${newSeatIdStr}`;

          await writeFirestoreDoc('seatBookings', oldDocId, {
            status: 'AVAILABLE',
            userName: '',
            userAvatar: '',
            bookedAt: null,
          });

          await writeFirestoreDoc('seatBookings', newDocId, {
            ...b,
            bookingId: newDocId,
            eventId: eventId,
            clubId: eventId,
            themeName: eventName,
            seatId: `Seat_${newSeatIdStr}`,
            seatNum: targetSeatNum,
            status: 'BOOKED',
          });

          alert(`Successfully moved booking for ${b.userName} to Seat P${targetSeatNum} (${eventName})`);
        }
      }
    });

    tr.querySelector('.btn-cancel-booking')?.addEventListener('click', async () => {
      if (confirm(`Cancel booking for ${b.userName || b.seatId} in ${eventName}?`)) {
        const seatIdStr = String(b.seatNum || 1).padStart(2, '0');
        const docId = b.bookingId || `booking_${eventId}_seat_${seatIdStr}`;
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
        alert('No bookings available to export for the selected event.');
        return;
      }

      const eventName = currentSelectedEvent?.name || 'BeyondThyme_Event';
      let csv = 'Event,Seat,Guest Name,Email,Phone,Booked At,Payment Status,Attendance,Dietary,Allergies\n';
      activeBookings.forEach(b => {
        const v = b.vetting || {};
        csv += `"${eventName}","${b.seatId}","${b.userName || ''}","${b.userEmail || ''}","${v.phone || ''}","${b.bookedAt || ''}","${b.paymentStatus || 'Paid'}","${b.attendance || 'Unchecked'}","${v.favFood || ''}","${v.allergies || ''}"\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${eventName.replace(/[^a-zA-Z0-9]/g, '_')}_Bookings_${Date.now()}.csv`;
      a.click();
    });
  }
}
