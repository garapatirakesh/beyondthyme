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
import { 
  renderEventSelector, 
  getSelectedEventObj, 
  getSelectedEventId, 
  setSelectedEventId, 
  onEventSelectionChanged 
} from './admin/adminEventSelector.js';
import { listenToCollection } from './firebase.js';

let liveSeatBookings = [];
let liveTickets = [];
let liveUsers = [];
let liveEvents = [];
let liveThemes = [];
let liveHunts = [];
let liveCapsules = [];
let realtimeUnsubscribers = [];
let activeTabId = 'dashboard';

/**
 * Initialize Admin Portal system and real-time listeners.
 */
export function initAdminPortal() {
  // Always subscribe to real-time listeners for live Firestore sync
  _subscribeRealtimeListeners();

  // 1. Initialize Auth & Navigation
  initAdminAuth({
    onTabChange: (tabId) => {
      activeTabId = tabId;
      _refreshCurrentTab(tabId);
    },
    onAuthChange: (adminUser) => {
      _subscribeRealtimeListeners();
    },
  });

  // 2. Initialize Event Selector change callback
  onEventSelectionChanged((eventId, selectedEventObj) => {
    _refreshAllViews();
  });

  // 3. Initialize Module Event Listeners
  initAdminEventsListeners();
  initAdminThemesListeners();
  initAdminSeatingListeners();
  initAdminBookingsListeners();
  initAdminCheckinListeners();
  initAdminTreasureListeners();
  initAdminNotificationsListeners();
  initAdminReportsListeners();
  initAdminSettingsListeners();

  // 4. Global Search listener
  const searchInput = document.getElementById('adminGlobalSearch');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      const selectedEvent = getSelectedEventObj(liveEvents);
      if (!q) {
        renderAdminBookingsView(liveSeatBookings, liveTickets, selectedEvent);
        return;
      }
      const filteredSeatBookings = liveSeatBookings.filter(b => 
        (b.userName || '').toLowerCase().includes(q) ||
        (b.userEmail || '').toLowerCase().includes(q) ||
        (b.seatId || '').toLowerCase().includes(q)
      );
      renderAdminBookingsView(filteredSeatBookings, liveTickets, selectedEvent);
    });
  }

  // 5. Refresh Dashboard Button
  const btnRefresh = document.getElementById('btnRefreshDashboard');
  if (btnRefresh) {
    btnRefresh.addEventListener('click', () => {
      _refreshAllViews();
    });
  }
}

/**
 * Subscribe to all Firestore collections real-time snapshots.
 */
function _subscribeRealtimeListeners() {
  _unsubscribeRealtimeListeners();

  realtimeUnsubscribers.push(
    listenToCollection('events', (data) => {
      liveEvents = data || [];
      renderEventSelector(liveEvents, () => _refreshAllViews());
      renderAdminEventsView(liveEvents, liveThemes);
      _refreshAllViews();
    })
  );

  realtimeUnsubscribers.push(
    listenToCollection('seatBookings', (data) => {
      liveSeatBookings = data || [];
      _refreshAllViews();
    })
  );

  realtimeUnsubscribers.push(
    listenToCollection('tickets', (data) => {
      liveTickets = data || [];
      _refreshAllViews();
    })
  );

  realtimeUnsubscribers.push(
    listenToCollection('users', (data) => {
      liveUsers = data || [];
      renderAdminUsersView(liveUsers);
      _refreshAllViews();
    })
  );

  realtimeUnsubscribers.push(
    listenToCollection('themes', (data) => {
      liveThemes = data || [];
      renderAdminThemesView(liveThemes);
      renderAdminEventsView(liveEvents, liveThemes);
    })
  );

  realtimeUnsubscribers.push(
    listenToCollection('treasureHunts', (data) => {
      liveHunts = data || [];
      renderAdminTreasureView(liveHunts);
    })
  );

  realtimeUnsubscribers.push(
    listenToCollection('timeCapsules', (data) => {
      liveCapsules = data || [];
      renderAdminCapsulesView(liveCapsules);
    })
  );
}

function _unsubscribeRealtimeListeners() {
  realtimeUnsubscribers.forEach(unsub => {
    if (typeof unsub === 'function') unsub();
  });
  realtimeUnsubscribers = [];
}

function _clearAdminData() {
  _unsubscribeRealtimeListeners();
  liveSeatBookings = [];
  liveTickets = [];
  liveUsers = [];
  liveEvents = [];
  liveThemes = [];
  liveHunts = [];
  liveCapsules = [];

  // Reset rendered DOM containers so zero admin data exists in DOM
  const kpi = document.getElementById('adminKpiGrid');
  if (kpi) kpi.innerHTML = '';
  const bookingsBody = document.getElementById('adminBookingsTableBody');
  if (bookingsBody) bookingsBody.innerHTML = '';
  const usersBody = document.getElementById('adminUsersTableBody');
  if (usersBody) usersBody.innerHTML = '';
  const eventsGrid = document.getElementById('adminEventsGrid');
  if (eventsGrid) eventsGrid.innerHTML = '';
  const themesGrid = document.getElementById('adminThemesGrid');
  if (themesGrid) themesGrid.innerHTML = '';
  const capsulesBody = document.getElementById('adminCapsulesTableBody');
  if (capsulesBody) capsulesBody.innerHTML = '';
  const liveStream = document.getElementById('adminLiveBookingStream');
  if (liveStream) liveStream.innerHTML = '';
  const checkins = document.getElementById('adminTodayCheckinsList');
  if (checkins) checkins.innerHTML = '';
}

function _refreshAllViews() {
  const selectedEvent = getSelectedEventObj(liveEvents);
  renderAdminDashboardView(liveSeatBookings, liveTickets, liveUsers, liveEvents, selectedEvent, () => _refreshAllViews());
  renderAdminSeatingView(liveSeatBookings, liveTickets, selectedEvent);
  renderAdminBookingsView(liveSeatBookings, liveTickets, selectedEvent);
  renderAdminReportsView(liveSeatBookings, liveTickets, selectedEvent);
}

function _refreshCurrentTab(tabId) {
  const selectedEvent = getSelectedEventObj(liveEvents);
  switch (tabId) {
    case 'dashboard':
      renderAdminDashboardView(liveSeatBookings, liveTickets, liveUsers, liveEvents, selectedEvent, () => _refreshAllViews());
      break;
    case 'events':
      renderAdminEventsView(liveEvents, liveThemes);
      break;
    case 'themes':
      renderAdminThemesView(liveThemes);
      break;
    case 'seating':
      renderAdminSeatingView(liveSeatBookings, liveTickets, selectedEvent);
      break;
    case 'bookings':
      renderAdminBookingsView(liveSeatBookings, liveTickets, selectedEvent);
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
      renderAdminReportsView(liveSeatBookings, liveTickets, selectedEvent);
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

