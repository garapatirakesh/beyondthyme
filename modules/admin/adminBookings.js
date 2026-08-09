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
  const eventId = selectedEvent?.id || 'zenitsu';
  const eventCap = parseInt(selectedEvent?.capacity || 25, 10);
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
    const ticketLabel = b.quantity > 1 ? `${b.quantity} Tickets` : (b.seatId || 'Seat_01');
    const guestName = b.guestName || b.userName || 'Member';
    const email = b.email || b.userEmail || '-';
    const phone = vetting.phone || b.phone || '-';
    const bookedTime = b.bookedAt ? new Date(b.bookedAt).toLocaleTimeString() : '-';
    const paymentStatus = b.paymentStatus || b.status || 'Paid';
    const totalAmount = typeof b.totalAmount === 'number' ? b.totalAmount : (typeof b.amount === 'number' ? b.amount : (b.quantity || 1) * (b.unitPrice || 500));
    const attendanceStatus = b.checkedIn ? 'Checked In' : (b.attendance || 'Unchecked');
    const dietary = vetting.favFood || vetting.era || 'Standard';
    const allergies = vetting.allergies || 'None';

    tr.innerHTML = `
      <td>
        <span class="admin-badge admin-badge-warning">${ticketLabel}</span>
      </td>
      <td>
        <strong class="admin-text-coral-accent">${guestName}</strong><br>
        <small class="admin-section-desc">${email}</small>
      </td>
      <td>${phone}</td>
      <td><small class="admin-section-desc">${bookedTime}</small></td>
      <td>
        <span class="admin-badge admin-badge-success">${paymentStatus}</span><br>
        <small class="font-mono">₹${totalAmount.toLocaleString('en-IN')}</small>
      </td>
      <td><span class="admin-badge ${b.checkedIn ? 'admin-badge-success' : 'admin-badge-info'}">${attendanceStatus}</span></td>
      <td>
        <small>${dietary}</small><br>
        <small class="admin-badge admin-badge-danger">Allergies: ${allergies}</small>
      </td>
      <td>
        <div class="admin-flex-gap-sm">
          <button class="admin-btn admin-btn-outline admin-btn-sm btn-move-seat" data-id="${b.seatId}">Move</button>
          <button class="admin-btn admin-btn-danger admin-btn-sm btn-cancel-booking" data-id="${b.seatId}">Cancel</button>
        </div>
      </td>
    `;

    tr.querySelector('.btn-move-seat')?.addEventListener('click', async () => {
      const newSeatNumStr = prompt(`Move ${guestName} from ${b.seatId} to target Seat Number (1-${eventCap}):`);
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

          alert(`Successfully moved booking for ${guestName} to Seat P${targetSeatNum} (${eventName})`);
        }
      }
    });

    tr.querySelector('.btn-cancel-booking')?.addEventListener('click', async () => {
      if (confirm(`Cancel booking for ${guestName} (${b.seatId}) in ${eventName}?`)) {
        try {
          if (b.source === 'tickets' || (b.bookingId && b.bookingId.startsWith('BT-'))) {
            await writeFirestoreDoc('tickets', b.bookingId, {
              status: 'CANCELLED',
              updatedAt: new Date().toISOString(),
            });
          }
          await writeFirestoreDoc('seatBookings', b.bookingId, {
            status: 'CANCELLED',
            updatedAt: new Date().toISOString(),
          });
          alert(`Successfully cancelled booking ${b.bookingId} for ${guestName}.`);
        } catch (err) {
          console.warn('Cancel booking notice:', err);
        }
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
