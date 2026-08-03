/* modules/admin.js
 * Central Admin Portal Orchestrator & Realtime Firestore Data Controller.
 * Connects all 12 Admin sub-modules and manages live snapshot subscriptions.
 */

import { initAdminAuth, openAdminPortal, closeAdminPortal } from './admin/adminAuth.js';
import { renderAdminDashboardView } from './admin/adminDashboard.js';
import { renderAdminEventsView, initAdminEventsListeners } from './admin/adminEvents.js';
import { renderAdminThemesView, initAdminThemesListeners } from './admin/adminThemes.js';
import { renderAdminSeatingView, initAdminSeatingListeners } from './admin/adminSeating.js';
import { renderAdminBookingsView, initAdminBookingsListeners } from './admin/adminBookings.js';
import { renderAdminUsersView } from './admin/adminUsers.js';
import { renderCheckinLogs, initAdminCheckinListeners } from './admin/adminCheckin.js';
import { renderAdminTreasureView, initAdminTreasureListeners } from './admin/adminTreasure.js';
import { renderAdminCapsulesView } from './admin/adminCapsules.js';
import { initAdminNotificationsListeners } from './admin/adminNotifications.js';
import { renderAdminReportsView, initAdminReportsListeners } from './admin/adminReports.js';
import { initAdminSettingsListeners } from './admin/adminSettings.js';
import { listenToCollection } from './firebase.js';

let liveBookings = [];
let liveUsers = [];
let liveEvents = [];
let liveThemes = [];
let liveHunts = [];
let liveCapsules = [];

/**
 * Initialize Admin Portal system and real-time listeners.
 */
export function initAdminPortal() {
  // 1. Initialize Auth & Navigation
  initAdminAuth({
    onTabChange: (tabId) => {
      _refreshCurrentTab(tabId);
    },
    onAuthChange: (adminUser) => {
      if (adminUser) {
        _subscribeRealtimeListeners();
      }
    },
  });

  // 2. Initialize Module Event Listeners
  initAdminEventsListeners();
  initAdminThemesListeners();
  initAdminSeatingListeners();
  initAdminBookingsListeners();
  initAdminCheckinListeners();
  initAdminTreasureListeners();
  initAdminNotificationsListeners();
  initAdminReportsListeners();
  initAdminSettingsListeners();

  // 3. Global Search listener
  const searchInput = document.getElementById('adminGlobalSearch');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      if (!q) {
        renderAdminBookingsView(liveBookings);
        return;
      }
      const filtered = liveBookings.filter(b => 
        (b.userName || '').toLowerCase().includes(q) ||
        (b.userEmail || '').toLowerCase().includes(q) ||
        (b.seatId || '').toLowerCase().includes(q)
      );
      renderAdminBookingsView(filtered);
    });
  }

  // 4. Refresh Dashboard Button
  const btnRefresh = document.getElementById('btnRefreshDashboard');
  if (btnRefresh) {
    btnRefresh.addEventListener('click', () => {
      renderAdminDashboardView(liveBookings, liveUsers, liveEvents);
    });
  }

  // Auto-subscribe to Firestore realtime collections
  _subscribeRealtimeListeners();
}

/**
 * Subscribe to all Firestore collections real-time snapshots.
 */
function _subscribeRealtimeListeners() {
  listenToCollection('seatBookings', (data) => {
    liveBookings = data;
    renderAdminDashboardView(liveBookings, liveUsers, liveEvents);
    renderAdminSeatingView(liveBookings);
    renderAdminBookingsView(liveBookings);
    renderAdminReportsView(liveBookings);
  });

  listenToCollection('users', (data) => {
    liveUsers = data;
    renderAdminUsersView(liveUsers);
    renderAdminDashboardView(liveBookings, liveUsers, liveEvents);
  });

  listenToCollection('events', (data) => {
    liveEvents = data;
    renderAdminEventsView(liveEvents);
  });

  listenToCollection('themes', (data) => {
    liveThemes = data;
    renderAdminThemesView(liveThemes);
  });

  listenToCollection('treasureHunts', (data) => {
    liveHunts = data;
    renderAdminTreasureView(liveHunts);
  });

  listenToCollection('timeCapsules', (data) => {
    liveCapsules = data;
    renderAdminCapsulesView(liveCapsules);
  });
}

function _refreshCurrentTab(tabId) {
  switch (tabId) {
    case 'dashboard':
      renderAdminDashboardView(liveBookings, liveUsers, liveEvents);
      break;
    case 'events':
      renderAdminEventsView(liveEvents);
      break;
    case 'themes':
      renderAdminThemesView(liveThemes);
      break;
    case 'seating':
      renderAdminSeatingView(liveBookings);
      break;
    case 'bookings':
      renderAdminBookingsView(liveBookings);
      break;
    case 'users':
      renderAdminUsersView(liveUsers);
      break;
    case 'checkin':
      renderCheckinLogs();
      break;
    case 'treasure':
      renderAdminTreasureView(liveHunts);
      break;
    case 'capsules':
      renderAdminCapsulesView(liveCapsules);
      break;
    case 'reports':
      renderAdminReportsView(liveBookings);
      break;
  }
}

export function addTimelineSubmission(data) {
  console.log('Timeline submission recorded:', data);
}

// Re-export triggers for backwards compatibility
export { openAdminPortal, closeAdminPortal };
export const initAdminDashboard = initAdminPortal;
export const openAdminDashboard = openAdminPortal;
export const closeAdminDashboard = closeAdminPortal;

