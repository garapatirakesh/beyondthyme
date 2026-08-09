/* modules/admin/adminDashboard.js
 * Admin Dashboard module for realtime KPIs, revenue metrics, telemetry feeds, and event history.
 */

import { getEventDashboardData, getNormalizedEventStatus } from './adminDashboardService.js';
import { setSelectedEventId } from './adminEventSelector.js';

/**
 * Render Executive Dashboard KPI Cards, Activity Feeds, & Event History.
 * @param {Array} seatBookings - Live array of seatBookings documents
 * @param {Array} tickets - Live array of ticket documents
 * @param {Array} users - Live array of user documents
 * @param {Array} events - Live array of event documents
 * @param {object} selectedEvent - Currently selected active event object
 * @param {function} [onViewEvent] - Callback when clicking "VIEW EVENT" in history
 */
export function renderAdminDashboardView(seatBookings = [], tickets = [], users = [], events = [], selectedEvent = null, onViewEvent = null) {
  // Handle signature overloading if tickets is omitted
  let actualSeatBookings = seatBookings;
  let actualTickets = tickets;
  let actualUsers = users;
  let actualEvents = events;

  if (Array.isArray(tickets) && Array.isArray(users) && !Array.isArray(events)) {
    // Legacy 5-arg signature: (bookings, users, events, selectedEvent, onViewEvent)
    actualSeatBookings = seatBookings;
    actualTickets = [];
    actualUsers = tickets;
    actualEvents = users;
    selectedEvent = events;
  }

  const kpiContainer = document.getElementById('adminKpiGrid');
  const liveStreamContainer = document.getElementById('adminLiveBookingStream');
  const checkinsContainer = document.getElementById('adminTodayCheckinsList');
  const checkinRatioEl = document.getElementById('adminCheckinRatio');
  const historyContainer = document.getElementById('adminDashboardEventHistory');

  // Compute canonical dashboard metrics via service (Requirement 7 & 11)
  const dashboardData = getEventDashboardData(selectedEvent, actualSeatBookings, actualTickets, actualUsers);
  const eventTitleLabel = (selectedEvent?.name || selectedEvent?.title || 'SELECTED EVENT').toUpperCase();

  // 1. Render Global & Event-Specific KPI Cards (Requirements 8, 9, 10, 11)
  if (kpiContainer) {
    kpiContainer.innerHTML = `
      <div class="admin-stat-card">
        <div class="admin-stat-info">
          <span class="admin-stat-label">TOTAL PLATFORM MEMBERS<br>(GLOBAL)</span>
          <span class="admin-stat-val">${dashboardData.globalMembers}</span>
        </div>
        <span class="admin-stat-icon">👤</span>
      </div>

      <div class="admin-stat-card">
        <div class="admin-stat-info">
          <span class="admin-stat-label">${eventTitleLabel} —<br>BOOKED SEATS</span>
          <span class="admin-stat-val">${dashboardData.bookedSeats} / ${dashboardData.capacity}</span>
        </div>
        <span class="admin-stat-icon">🪑</span>
      </div>

      <div class="admin-stat-card">
        <div class="admin-stat-info">
          <span class="admin-stat-label">${eventTitleLabel} —<br>AVAILABLE SEATS</span>
          <span class="admin-stat-val">${dashboardData.availableSeats}</span>
        </div>
        <span class="admin-stat-icon">${dashboardData.isSoldOut ? '🔒' : '✨'}</span>
      </div>

      <div class="admin-stat-card">
        <div class="admin-stat-info">
          <span class="admin-stat-label">${eventTitleLabel} —<br>REVENUE</span>
          <span class="admin-stat-val">₹${dashboardData.revenue.toLocaleString('en-IN')}</span>
        </div>
        <span class="admin-stat-icon">💰</span>
      </div>
    `;
  }

  // 2. Render Check-in Ratio (Requirements 14 & 15)
  if (checkinRatioEl) {
    const totalTarget = dashboardData.bookedSeats > 0 ? dashboardData.bookedSeats : dashboardData.capacity;
    checkinRatioEl.innerText = `${dashboardData.checkedInGuests} / ${totalTarget} CHECKED IN`;
  }

  // 3. Render Event-Specific Live Booking Stream (Requirements 12 & 13)
  if (liveStreamContainer) {
    liveStreamContainer.innerHTML = '';
    const liveBookings = dashboardData.liveBookings;

    if (!selectedEvent) {
      liveStreamContainer.innerHTML = '<p class="admin-section-desc">Select an event from the dropdown above to view live bookings.</p>';
    } else if (liveBookings.length === 0) {
      liveStreamContainer.innerHTML = `<p class="admin-section-desc">No bookings recorded for ${selectedEvent.name || selectedEvent.title} yet.</p>`;
    } else {
      liveBookings.slice(0, 10).forEach(b => {
        const ticketLabel = b.quantity === 1 ? '1 Ticket' : `${b.quantity} Tickets`;
        const formattedTime = b.bookedAt ? _formatRelativeTime(b.bookedAt) : 'Just now';

        const item = document.createElement('div');
        item.className = 'admin-recessed-box-subtle';
        item.innerHTML = `
          <div>
            <strong class="admin-text-coral-accent">${b.guestName || 'Member'}</strong>
            <span class="admin-ml-05 font-mono text-muted">(${ticketLabel} · ₹${b.totalAmount.toLocaleString('en-IN')})</span>
          </div>
          <div class="admin-flex-gap-sm">
            <span class="admin-badge admin-badge-success">${(b.status || 'CONFIRMED').toUpperCase()}</span>
            <small class="admin-section-desc">${formattedTime}</small>
          </div>
        `;
        liveStreamContainer.appendChild(item);
      });
    }
  }

  // 4. Render Event-Specific Today's Check-ins (Requirements 14 & 15)
  if (checkinsContainer) {
    checkinsContainer.innerHTML = '';
    const checkedInBookings = dashboardData.liveBookings.filter(b => b.checkedIn);

    if (!selectedEvent || checkedInBookings.length === 0) {
      const evName = selectedEvent?.name || selectedEvent?.title || 'this event';
      checkinsContainer.innerHTML = `<p class="admin-section-desc">No guests checked in yet for ${evName}.</p>`;
    } else {
      checkedInBookings.forEach(b => {
        const item = document.createElement('div');
        item.className = 'admin-recessed-box-subtle';
        item.innerHTML = `
          <div>
            <span class="admin-badge admin-badge-success">✓ ${b.seatId || 'Seat'}</span>
            <strong class="admin-ml-05">${b.guestName || 'Member'}</strong>
            <span class="admin-section-desc">(${b.quantity > 1 ? `${b.quantity} guests` : '1 guest'})</span>
          </div>
          <small class="admin-section-desc">${b.checkinTime || 'Just now'}</small>
        `;
        checkinsContainer.appendChild(item);
      });
    }
  }

  // 5. Render Historical Events Retention Section (Requirement 20)
  if (historyContainer) {
    historyContainer.innerHTML = '';
    const now = new Date();

    const pastEvents = actualEvents.filter(ev => {
      const normalizedStatus = getNormalizedEventStatus(ev);
      const evDateStr = ev.eventEndTime || ev.eventDate || ev.eventStartTime;
      const evDate = evDateStr ? new Date(evDateStr) : null;
      const isPastDate = evDate && !isNaN(evDate.getTime()) && evDate < now;
      return normalizedStatus === 'Completed' || isPastDate;
    });

    if (pastEvents.length === 0) {
      historyContainer.innerHTML = '<p class="admin-section-desc">No past completed events recorded in historical archives yet.</p>';
    } else {
      pastEvents.forEach(ev => {
        const evData = getEventDashboardData(ev, actualSeatBookings, actualTickets, actualUsers);
        const dateLabel = ev.displayNight || ev.eventDate || 'Past Event';
        const venueLabel = ev.venue || ev.location || 'Secret Venue';

        const card = document.createElement('div');
        card.className = 'admin-history-card border-grid';
        card.innerHTML = `
          <div>
            <div class="admin-flex-between admin-mb-05">
              <h4 class="admin-card-title text-gold font-display">${(ev.title || ev.name || '').toUpperCase()}</h4>
              <span class="admin-badge admin-badge-info">COMPLETED</span>
            </div>
            <p class="admin-section-desc admin-mb-05">📅 ${dateLabel} · 📍 ${venueLabel}</p>
            <div class="admin-flex-col-gap-sm font-mono text-sm">
              <div>🪑 Booked: <strong>${evData.bookedSeats} / ${evData.capacity} Seats</strong></div>
              <div>💰 Revenue: <strong>₹${evData.revenue.toLocaleString('en-IN')}</strong></div>
              <div>📍 Check-ins: <strong>${evData.checkedInGuests} / ${evData.bookedSeats > 0 ? evData.bookedSeats : evData.capacity}</strong></div>
            </div>
          </div>
          <button class="admin-btn admin-btn-outline admin-btn-sm admin-mt-1 btn-view-history-event" data-id="${ev.id}">
            🔍 VIEW EVENT
          </button>
        `;

        card.querySelector('.btn-view-history-event')?.addEventListener('click', () => {
          setSelectedEventId(ev.id, actualEvents);
          if (typeof onViewEvent === 'function') {
            onViewEvent(ev.id);
          }
        });

        historyContainer.appendChild(card);
      });
    }
  }
}

function _formatRelativeTime(isoStr) {
  if (!isoStr) return 'Just now';
  try {
    const diffMs = Date.now() - new Date(isoStr).getTime();
    if (diffMs < 60000) return 'Just now';
    const mins = Math.floor(diffMs / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(isoStr).toLocaleDateString();
  } catch (e) {
    return 'Just now';
  }
}
