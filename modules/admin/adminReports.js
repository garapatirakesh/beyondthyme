import { getEventDashboardData } from './adminDashboardService.js';

/**
 * Render Dynamic SVG Analytics Charts & Event Report Summary.
 * @param {Array} seatBookings - Live array of seatBookings documents
 * @param {Array} tickets - Live array of ticket documents
 * @param {object} selectedEvent - Currently selected active event object
 */
export function renderAdminReportsView(seatBookings = [], tickets = [], selectedEvent = null) {
  if (Array.isArray(tickets) && !Array.isArray(seatBookings)) {
    selectedEvent = tickets;
    tickets = [];
  } else if (!selectedEvent && !Array.isArray(tickets) && typeof seatBookings === 'object') {
    selectedEvent = seatBookings;
    seatBookings = [];
    tickets = [];
  }

  const revContainer = document.getElementById('chartRevenueContainer');
  const occContainer = document.getElementById('chartOccupancyContainer');

  const evData = getEventDashboardData(selectedEvent, seatBookings, tickets);
  const eventName = selectedEvent?.name || selectedEvent?.title || 'Selected Event';
  const totalCap = evData.capacity;
  const soldCount = evData.bookedSeats;
  const occPct = totalCap > 0 ? Math.round((soldCount / totalCap) * 100) : 0;
  const checkedInCount = evData.checkedInGuests;
  const noShows = Math.max(0, soldCount - checkedInCount);

  // 1. Render Revenue SVG Bar Chart
  if (revContainer) {
    revContainer.innerHTML = `
      <div class="admin-mb-1 font-mono text-sm">
        <strong>${eventName.toUpperCase()} REPORT</strong> — Capacity: ${totalCap} | Sold: ${soldCount} | Occupancy: ${occPct}% | Check-ins: ${checkedInCount} | No-shows: ${noShows}
      </div>
      <svg width="100%" height="180" viewBox="0 0 400 180" preserveAspectRatio="none" class="admin-overflow-visible">
        <defs>
          <linearGradient id="coralGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="var(--color-coral)" stop-opacity="0.9"/>
            <stop offset="100%" stop-color="var(--color-coral)" stop-opacity="0.15"/>
          </linearGradient>
        </defs>
        <!-- Horizontal Gridlines -->
        <line x1="0" y1="30" x2="400" y2="30" stroke="var(--border-mid)" stroke-dasharray="4"/>
        <line x1="0" y1="80" x2="400" y2="80" stroke="var(--border-mid)" stroke-dasharray="4"/>
        <line x1="0" y1="130" x2="400" y2="130" stroke="var(--border-mid)" stroke-dasharray="4"/>

        <!-- Dynamic Bars -->
        <rect x="30" y="${160 - Math.min(130, occPct * 1.3)}" width="45" height="${Math.min(130, occPct * 1.3)}" fill="url(#coralGrad)" rx="4"/>
        <rect x="130" y="${160 - Math.min(130, (soldCount / totalCap) * 130)}" width="45" height="${Math.min(130, (soldCount / totalCap) * 130)}" fill="url(#coralGrad)" rx="4"/>
        <rect x="230" y="${160 - Math.min(130, (checkedInCount / Math.max(1, soldCount)) * 130)}" width="45" height="${Math.min(130, (checkedInCount / Math.max(1, soldCount)) * 130)}" fill="url(#coralGrad)" rx="4"/>
        <rect x="330" y="${160 - Math.min(130, (noShows / Math.max(1, soldCount)) * 130)}" width="45" height="${Math.min(130, (noShows / Math.max(1, soldCount)) * 130)}" fill="url(#coralGrad)" rx="4"/>

        <!-- X Axis Labels -->
        <text x="52" y="175" fill="var(--text-muted)" font-size="10" text-anchor="middle">Occupancy %</text>
        <text x="152" y="175" fill="var(--text-muted)" font-size="10" text-anchor="middle">Tickets Sold</text>
        <text x="252" y="175" fill="var(--text-muted)" font-size="10" text-anchor="middle">Check-ins</text>
        <text x="352" y="175" fill="var(--text-muted)" font-size="10" text-anchor="middle">No-shows</text>
      </svg>
    `;
  }

  // 2. Render Occupancy SVG Line Chart
  if (occContainer) {
    occContainer.innerHTML = `
      <svg width="100%" height="180" viewBox="0 0 400 180" preserveAspectRatio="none" class="admin-overflow-visible">
        <polyline
          fill="none"
          stroke="var(--admin-accent-green)"
          stroke-width="3"
          points="20,140 100,${160 - Math.min(130, occPct * 0.5)} 180,${160 - Math.min(130, occPct * 0.8)} 260,${160 - Math.min(130, occPct)} 340,${160 - Math.min(130, occPct * 1.1)} 390,${160 - Math.min(130, occPct * 1.2)}"
        />
        <!-- Data Dots -->
        <circle cx="20" cy="140" r="5" fill="var(--admin-accent-green)"/>
        <circle cx="100" cy="${160 - Math.min(130, occPct * 0.5)}" r="5" fill="var(--admin-accent-green)"/>
        <circle cx="180" cy="${160 - Math.min(130, occPct * 0.8)}" r="5" fill="var(--admin-accent-green)"/>
        <circle cx="260" cy="${160 - Math.min(130, occPct)}" r="5" fill="var(--admin-accent-green)"/>
        <circle cx="340" cy="${160 - Math.min(130, occPct * 1.1)}" r="5" fill="var(--admin-accent-green)"/>
        <circle cx="390" cy="${160 - Math.min(130, occPct * 1.2)}" r="5" fill="var(--admin-accent-green)"/>
      </svg>
    `;
  }
}

export function initAdminReportsListeners() {
  const btnPdf = document.getElementById('btnExportPdfReport');
  if (btnPdf) {
    btnPdf.addEventListener('click', () => {
      window.print();
    });
  }
}
