/* modules/admin/adminEventSelector.js
 * Global Reusable Admin Event Selector component.
 * Manages currently selected active event ID across all admin modules.
 */

let selectedEventId = null;
let changeListeners = [];

/**
 * Get currently selected Event ID.
 * @returns {string|null}
 */
export function getSelectedEventId() {
  return selectedEventId;
}

/**
 * Programmatically set the selected Event ID and notify all registered listeners.
 * @param {string} eventId
 * @param {Array} eventsList
 */
export function setSelectedEventId(eventId, eventsList = []) {
  if (!eventId) return;
  selectedEventId = eventId;
  const targetEvent = eventsList.find(e => e.id === eventId) || null;
  changeListeners.forEach(listener => {
    if (typeof listener === 'function') {
      listener(selectedEventId, targetEvent);
    }
  });
}

/**
 * Register a change listener for event selection updates.
 * @param {function} listener - Callback (selectedEventId, selectedEventObj)
 */
export function onEventSelectionChanged(listener) {
  if (typeof listener === 'function' && !changeListeners.includes(listener)) {
    changeListeners.push(listener);
  }
}

/**
 * Helper to get selected Event object from events array.
 * @param {Array} events
 * @returns {object|null}
 */
export function getSelectedEventObj(events = []) {
  if (events.length === 0) return null;

  if (selectedEventId) {
    const found = events.find(e => e.id === selectedEventId);
    if (found) return found;
  }

  // Automatic Default Selection Logic (Requirement 23)
  const now = new Date();
  
  // 1. First upcoming Published event
  const upcomingPublished = events.find(e => {
    const isUpcoming = new Date(e.eventDate || e.eventStartTime || 0) >= now;
    return isUpcoming && (e.status === 'Published' || e.status === 'AVAILABLE');
  });
  if (upcomingPublished) {
    selectedEventId = upcomingPublished.id;
    return upcomingPublished;
  }

  // 2. Nearest upcoming event of any status
  const upcomingAny = events.find(e => new Date(e.eventDate || e.eventStartTime || 0) >= now);
  if (upcomingAny) {
    selectedEventId = upcomingAny.id;
    return upcomingAny;
  }

  // 3. Fallback: Most recent past event
  const mostRecent = [...events].sort((a, b) => {
    return new Date(b.eventDate || 0).getTime() - new Date(a.eventDate || 0).getTime();
  })[0];

  if (mostRecent) {
    selectedEventId = mostRecent.id;
    return mostRecent;
  }

  return null;
}

/**
 * Render Reusable Event Selector Dropdown UI into target containers.
 * @param {Array} events - List of all event objects
 * @param {function} onSelect - Callback when user selects a different event
 */
export function renderEventSelector(events = [], onSelect) {
  const container = document.getElementById('adminGlobalEventSelectorContainer');
  if (!container) return;

  if (events.length === 0) {
    container.innerHTML = `
      <div class="admin-event-selector-box">
        <span class="admin-event-selector-label">CURRENT EVENT</span>
        <span class="admin-event-selector-empty">No events configured</span>
      </div>
    `;
    return;
  }

  // Determine active selected event
  const activeEvent = getSelectedEventObj(events);
  if (activeEvent) {
    selectedEventId = activeEvent.id;
  }

  const now = new Date();
  const upcomingEvents = events.filter(e => {
    const d = new Date(e.eventDate || e.eventStartTime || 0);
    return d >= now && e.status !== 'Completed' && e.status !== 'Archived';
  });
  
  const pastEvents = events.filter(e => {
    const d = new Date(e.eventDate || e.eventStartTime || 0);
    return d < now || e.status === 'Completed' || e.status === 'Closed' || e.status === 'Archived';
  });

  let optionsHtml = '';

  if (upcomingEvents.length > 0) {
    optionsHtml += `<optgroup label="UPCOMING EVENTS">`;
    upcomingEvents.forEach(e => {
      const isSel = e.id === selectedEventId ? 'selected' : '';
      const dateLabel = e.displayNight || e.eventDate?.split('T')[0] || '';
      const venueLabel = e.venue || e.location || 'Secret Villa';
      const capLabel = `${e.capacity || 25} seats`;
      optionsHtml += `<option value="${e.id}" ${isSel}>${e.title || e.name} · ${dateLabel} · ${venueLabel} (${capLabel})</option>`;
    });
    optionsHtml += `</optgroup>`;
  }

  if (pastEvents.length > 0) {
    optionsHtml += `<optgroup label="PAST EVENTS">`;
    pastEvents.forEach(e => {
      const isSel = e.id === selectedEventId ? 'selected' : '';
      const dateLabel = e.displayNight || e.eventDate?.split('T')[0] || '';
      const venueLabel = e.venue || e.location || 'Secret Villa';
      optionsHtml += `<option value="${e.id}" ${isSel}>${e.title || e.name} · ${dateLabel} · ${venueLabel} (PAST)</option>`;
    });
    optionsHtml += `</optgroup>`;
  }

  container.innerHTML = `
    <div class="admin-event-selector-box border-grid">
      <span class="admin-event-selector-label">CURRENT EVENT</span>
      <select id="adminGlobalEventSelectDropdown" class="admin-event-selector-dropdown font-display">
        ${optionsHtml}
      </select>
    </div>
  `;

  const dropdown = document.getElementById('adminGlobalEventSelectDropdown');
  if (dropdown) {
    dropdown.addEventListener('change', (e) => {
      const newId = e.target.value;
      selectedEventId = newId;
      const newEventObj = events.find(ev => ev.id === newId);
      if (typeof onSelect === 'function') {
        onSelect(newId, newEventObj);
      }
      changeListeners.forEach(listener => {
        if (typeof listener === 'function') {
          listener(newId, newEventObj);
        }
      });
    });
  }
}
