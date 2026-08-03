/* modules/admin/adminEvents.js
 * Admin Event Management module (Create, Edit, Duplicate, Archive, Delete).
 */

import { writeFirestoreDoc, removeFirestoreDoc } from '../firebase.js';

let activeEvents = [];

/**
 * Render Events View grid.
 * @param {Array} events
 */
export function renderAdminEventsView(events = []) {
  activeEvents = events;
  const grid = document.getElementById('adminEventsGrid');
  if (!grid) return;

  grid.innerHTML = '';
  if (events.length === 0) {
    grid.innerHTML = '<p style="color: var(--admin-text-secondary); font-size: 0.9rem;">No events configured. Click "Create New Event" to add an experience.</p>';
    return;
  }

  events.forEach(ev => {
    const card = document.createElement('div');
    card.className = 'admin-card';
    card.innerHTML = `
      <div class="admin-card-header">
        <h3 class="admin-card-title">${ev.title || 'Supper Experience'}</h3>
        <span class="admin-badge ${ev.status === 'Published' ? 'admin-badge-success' : 'admin-badge-warning'}">${ev.status || 'Draft'}</span>
      </div>
      <p style="color: var(--admin-text-secondary); font-size: 0.88rem; margin-bottom: 0.75rem;">${ev.description || ''}</p>
      <div style="font-size: 0.82rem; color: var(--admin-text-primary); display: flex; flex-direction: column; gap: 0.35rem; margin-bottom: 1rem;">
        <div>📍 Venue: <strong>${ev.venue || 'Secret Villa'}</strong></div>
        <div>📅 Date: <strong>${ev.eventDate || 'October 24, 2026'}</strong></div>
        <div>🪑 Capacity: <strong>${ev.capacity || 25} Seats</strong></div>
      </div>
      <div style="display: flex; gap: 0.5rem;">
        <button class="admin-btn admin-btn-outline admin-btn-sm btn-edit-event" data-id="${ev.id}">Edit</button>
        <button class="admin-btn admin-btn-danger admin-btn-sm btn-delete-event" data-id="${ev.id}">Delete</button>
      </div>
    `;

    card.querySelector('.btn-edit-event')?.addEventListener('click', () => {
      _editEventPrompt(ev);
    });

    card.querySelector('.btn-delete-event')?.addEventListener('click', async () => {
      if (confirm(`Delete event "${ev.title}"?`)) {
        await removeFirestoreDoc('events', ev.id);
      }
    });

    grid.appendChild(card);
  });
}

/**
 * Handle Create Event modal trigger.
 */
export function initAdminEventsListeners() {
  const btnCreate = document.getElementById('btnCreateEventModal');
  if (btnCreate) {
    btnCreate.addEventListener('click', async () => {
      const title = prompt('Enter Event Name:', '✨ Chronological Supper Vol. II');
      if (!title) return;
      const venue = prompt('Enter Venue:', 'Secret Villa, South Delhi');
      const eventId = `event_${Date.now()}`;

      await writeFirestoreDoc('events', eventId, {
        id: eventId,
        title: title,
        venue: venue || 'Secret Villa',
        capacity: 25,
        status: 'Published',
        eventDate: 'October 24, 2026',
        description: 'Exclusive chronological dining experience.',
      });
    });
  }
}

async function _editEventPrompt(ev) {
  const newTitle = prompt('Edit Event Title:', ev.title);
  if (newTitle) {
    await writeFirestoreDoc('events', ev.id, {
      ...ev,
      title: newTitle,
    });
  }
}
