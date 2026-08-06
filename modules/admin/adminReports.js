/* modules/admin/adminReports.js
 * Admin Analytics & Dynamic SVG Charts Engine module.
 */

/**
 * Render Dynamic SVG Analytics Charts.
 * @param {Array} bookings
 */
export function renderAdminReportsView(bookings = []) {
  const revContainer = document.getElementById('chartRevenueContainer');
  const occContainer = document.getElementById('chartOccupancyContainer');

  // 1. Render Revenue SVG Bar Chart
  if (revContainer) {
    revContainer.innerHTML = `
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

        <!-- Bars -->
        <rect x="30" y="70" width="35" height="90" fill="url(#coralGrad)" rx="4"/>
        <rect x="110" y="40" width="35" height="120" fill="url(#coralGrad)" rx="4"/>
        <rect x="190" y="90" width="35" height="70" fill="url(#coralGrad)" rx="4"/>
        <rect x="270" y="30" width="35" height="130" fill="url(#coralGrad)" rx="4"/>
        <rect x="350" y="50" width="35" height="110" fill="url(#coralGrad)" rx="4"/>

        <!-- X Axis Labels -->
        <text x="47" y="175" fill="var(--text-muted)" font-size="10" text-anchor="middle">Week 1</text>
        <text x="127" y="175" fill="var(--text-muted)" font-size="10" text-anchor="middle">Week 2</text>
        <text x="207" y="175" fill="var(--text-muted)" font-size="10" text-anchor="middle">Week 3</text>
        <text x="287" y="175" fill="var(--text-muted)" font-size="10" text-anchor="middle">Week 4</text>
        <text x="367" y="175" fill="var(--text-muted)" font-size="10" text-anchor="middle">Week 5</text>
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
          points="20,120 100,60 180,90 260,30 340,50 390,20"
        />
        <!-- Data Dots -->
        <circle cx="20" cy="120" r="5" fill="var(--admin-accent-green)"/>
        <circle cx="100" cy="60" r="5" fill="var(--admin-accent-green)"/>
        <circle cx="180" cy="90" r="5" fill="var(--admin-accent-green)"/>
        <circle cx="260" cy="30" r="5" fill="var(--admin-accent-green)"/>
        <circle cx="340" cy="50" r="5" fill="var(--admin-accent-green)"/>
        <circle cx="390" cy="20" r="5" fill="var(--admin-accent-green)"/>
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
