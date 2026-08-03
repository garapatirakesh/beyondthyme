/* modules/admin.js
 * Admin Dashboard module for managing seats and viewing "Your Timeline" member submissions.
 * Accessible exclusively to admin@gmail.com session.
 */

import { TOTAL_SEATS } from '../config/app.config.js';

let timelineSubmissions = [];

/**
 * Initialize Admin Dashboard events.
 * @param {object} callbacks - { onSeatReset() }
 */
export function initAdminDashboard(callbacks = {}) {
  const closeBtn = document.getElementById('closeAdminDashboardBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      closeAdminDashboard();
    });
  }

  const clearBtn = document.getElementById('btnClearAdminBookings');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('Reset all member timeline bookings?')) {
        timelineSubmissions = [];
        localStorage.removeItem('beyondthyme_timeline_bookings');
        renderAdminDashboard();
        callbacks.onSeatReset?.();
      }
    });
  }
}

/**
 * Record a new timeline booking submission.
 * @param {object} data
 */
export function addTimelineSubmission(data) {
  timelineSubmissions.push({
    id: `TL_${Date.now()}`,
    timestamp: new Date().toLocaleTimeString(),
    ...data,
  });
  localStorage.setItem('beyondthyme_timeline_bookings', JSON.stringify(timelineSubmissions));
}

/**
 * Open the Admin Dashboard drawer/modal.
 */
export function openAdminDashboard() {
  const stored = localStorage.getItem('beyondthyme_timeline_bookings');
  if (stored) {
    try { timelineSubmissions = JSON.parse(stored); } catch (e) { timelineSubmissions = []; }
  }

  renderAdminDashboard();
  const overlay = document.getElementById('adminDashboardOverlay');
  if (overlay) overlay.classList.add('active');
}

/**
 * Close the Admin Dashboard drawer/modal.
 */
export function closeAdminDashboard() {
  const overlay = document.getElementById('adminDashboardOverlay');
  if (overlay) overlay.classList.remove('active');
}

/**
 * Render the Admin Dashboard data tables.
 */
export function renderAdminDashboard() {
  const countEl = document.getElementById('adminBookedCount');
  const tableEl = document.getElementById('adminSubmissionsTableBody');
  const gridEl  = document.getElementById('adminSeatGridOverview');

  if (countEl) {
    countEl.innerText = `${timelineSubmissions.length} / ${TOTAL_SEATS} Reserved`;
  }

  // Render Seat Grid Overview
  if (gridEl) {
    gridEl.innerHTML = '';
    for (let i = 1; i <= TOTAL_SEATS; i++) {
      const seatNumStr = `Seat_${String(i).padStart(2, '0')}`;
      const sub = timelineSubmissions.find(s => s.seatId === seatNumStr);

      const seatChip = document.createElement('div');
      seatChip.className = `admin-seat-chip ${sub ? 'booked' : 'open'}`;
      seatChip.innerHTML = `
        <span class="chip-num">P${String(i).padStart(2, '0')}</span>
        <span class="chip-status">${sub ? sub.fullName || sub.email : 'OPEN'}</span>
      `;
      gridEl.appendChild(seatChip);
    }
  }

  // Render Submissions Table
  if (tableEl) {
    tableEl.innerHTML = '';
    if (timelineSubmissions.length === 0) {
      tableEl.innerHTML = `
        <tr>
          <td colspan="8" class="admin-empty-cell">No member timelines recorded yet. Claim a seat to test booking.</td>
        </tr>
      `;
      return;
    }

    timelineSubmissions.forEach((sub, idx) => {
      const tr = document.createElement('tr');
      tr.className = 'admin-row';
      tr.innerHTML = `
        <td><span class="admin-badge">${sub.seatId || `Seat ${idx + 1}`}</span></td>
        <td><strong>${sub.fullName || 'Member'}</strong><br><small class="text-ash">${sub.email || ''}</small></td>
        <td>${sub.dob || '-'}</td>
        <td>${sub.phone || '-'}</td>
        <td>${sub.favPlace || '-'}</td>
        <td>${sub.favFood || '-'}<br><small class="text-coral">Allergies: ${sub.allergies || 'None'}</small></td>
        <td><span class="admin-era-tag">${sub.era || '2000s'}</span></td>
        <td><small class="text-ash">${sub.reliveMoment || '-'}</small></td>
      `;
      tableEl.appendChild(tr);
    });
  }
}
