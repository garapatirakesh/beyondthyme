/* modules/admin/adminDashboard.js
 * Admin Dashboard module for realtime KPIs, revenue metrics, and telemetry feeds.
 */

import { ADMIN_DEFAULTS } from '../../config/admin.config.js';

/**
 * Render Executive Dashboard KPI Cards & Activity Feeds.
 * @param {Array} bookings - Live array of seatBookings documents
 * @param {Array} users - Live array of user documents
 * @param {Array} events - Live array of event documents
 */
export function renderAdminDashboardView(bookings = [], users = [], events = []) {
  const kpiContainer = document.getElementById('adminKpiGrid');
  const liveStreamContainer = document.getElementById('adminLiveBookingStream');
  const checkinsContainer = document.getElementById('adminTodayCheckinsList');
  const checkinRatioEl = document.getElementById('adminCheckinRatio');

  const totalSeats = ADMIN_DEFAULTS.MAX_SEATS;
  const bookedCount = bookings.filter(b => b.status === 'BOOKED').length;
  const availableCount = totalSeats - bookedCount;
  const checkedInCount = bookings.filter(b => b.attendance === 'Checked In').length;
  const totalRevenue = bookings.reduce((sum, b) => sum + (b.amount || ADMIN_DEFAULTS.DEFAULT_PRICE_INR), 0);

  // 1. Render KPI Cards
  if (kpiContainer) {
    kpiContainer.innerHTML = `
      <div class="admin-stat-card">
        <div class="admin-stat-info">
          <span class="admin-stat-label">Total Members</span>
          <span class="admin-stat-val">${users.length || 1}</span>
        </div>
        <span class="admin-stat-icon">👤</span>
      </div>

      <div class="admin-stat-card">
        <div class="admin-stat-info">
          <span class="admin-stat-label">Booked Seats</span>
          <span class="admin-stat-val">${bookedCount} / ${totalSeats}</span>
        </div>
        <span class="admin-stat-icon">🪑</span>
      </div>

      <div class="admin-stat-card">
        <div class="admin-stat-info">
          <span class="admin-stat-label">Available Seats</span>
          <span class="admin-stat-val">${availableCount}</span>
        </div>
        <span class="admin-stat-icon">✨</span>
      </div>

      <div class="admin-stat-card">
        <div class="admin-stat-info">
          <span class="admin-stat-label">Total Revenue</span>
          <span class="admin-stat-val">₹${totalRevenue.toLocaleString()}</span>
        </div>
        <span class="admin-stat-icon">💰</span>
      </div>
    `;
  }

  // 2. Render Check-in Ratio
  if (checkinRatioEl) {
    checkinRatioEl.innerText = `${checkedInCount} / ${bookedCount} Checked In`;
  }

  // 3. Render Live Booking Stream
  if (liveStreamContainer) {
    liveStreamContainer.innerHTML = '';
    if (bookings.length === 0) {
      liveStreamContainer.innerHTML = '<p style="color: var(--admin-text-secondary); font-size: 0.88rem;">No bookings recorded yet.</p>';
    } else {
      bookings.slice(-5).reverse().forEach(b => {
        const item = document.createElement('div');
        item.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0.8rem; background: rgba(11, 12, 16, 0.6); border-radius: 8px; border: 1px solid rgba(212, 175, 55, 0.1);';
        item.innerHTML = `
          <div>
            <span style="color: var(--admin-gold); font-weight: 600; font-size: 0.88rem;">${b.seatId || 'Seat'}</span>
            <span style="color: var(--admin-text-primary); margin-left: 0.5rem; font-size: 0.88rem;">${b.userName || b.userEmail || 'Member'}</span>
          </div>
          <span class="admin-badge admin-badge-success">${b.status || 'BOOKED'}</span>
        `;
        liveStreamContainer.appendChild(item);
      });
    }
  }

  // 4. Render Today's Checkins
  if (checkinsContainer) {
    checkinsContainer.innerHTML = '';
    const checkedInBookings = bookings.filter(b => b.attendance === 'Checked In');
    if (checkedInBookings.length === 0) {
      checkinsContainer.innerHTML = '<p style="color: var(--admin-text-secondary); font-size: 0.88rem;">No guests checked in yet today.</p>';
    } else {
      checkedInBookings.forEach(b => {
        const item = document.createElement('div');
        item.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0.8rem; background: rgba(11, 12, 16, 0.6); border-radius: 8px; border: 1px solid rgba(46, 196, 182, 0.2);';
        item.innerHTML = `
          <div>
            <span style="color: var(--admin-accent-green); font-weight: 600; font-size: 0.88rem;">✓ ${b.seatId}</span>
            <span style="color: var(--admin-text-primary); margin-left: 0.5rem; font-size: 0.88rem;">${b.userName || 'Member'}</span>
          </div>
          <small style="color: var(--admin-text-secondary);">${b.checkinTime || 'Just now'}</small>
        `;
        checkinsContainer.appendChild(item);
      });
    }
  }
}
