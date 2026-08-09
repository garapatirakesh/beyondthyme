/* modules/admin/adminEvents.js
 * Admin Event Management module (Create, Edit, Status Filter, Automatic Past Detection).
 */

import { writeFirestoreDoc, removeFirestoreDoc } from '../firebase.js';
import { getNormalizedEventStatus } from './adminDashboardService.js';

let activeEvents = [];
let activeThemes = [];
let currentFilter = 'All';

/**
 * Render Events View grid with status filtering & automatic past event detection.
 * @param {Array} events
 * @param {Array} themes
 */
export function renderAdminEventsView(events = [], themes = []) {
  activeEvents = events;
  if (themes && themes.length > 0) activeThemes = themes;

  const grid = document.getElementById('adminEventsGrid');
  if (!grid) return;

  // Process status using normalized date comparison (Requirement 22)
  const processedEvents = events.map(ev => {
    return { ...ev, computedStatus: getNormalizedEventStatus(ev) };
  });

  // Filter events based on active tab pill (Requirement 24)
  let filteredEvents = processedEvents;
  if (currentFilter === 'Upcoming') {
    filteredEvents = processedEvents.filter(e => e.computedStatus !== 'Completed' && e.computedStatus !== 'Archived');
  } else if (currentFilter !== 'All') {
    filteredEvents = processedEvents.filter(e => e.computedStatus === currentFilter);
  }

  grid.innerHTML = '';
  if (filteredEvents.length === 0) {
    grid.innerHTML = `<p class="admin-section-desc">No events found for filter "${currentFilter}". Click "Create New Event" to add an experience.</p>`;
    return;
  }

  filteredEvents.forEach(ev => {
    const card = document.createElement('div');
    card.className = 'admin-card';
    const statusBadgeCls = ev.computedStatus === 'Published' ? 'admin-badge-success' : (ev.computedStatus === 'Completed' ? 'admin-badge-info' : 'admin-badge-warning');

    card.innerHTML = `
      <div class="admin-card-header">
        <h3 class="admin-card-title font-display">${ev.title || ev.name || 'Supper Experience'}</h3>
        <span class="admin-badge ${statusBadgeCls}">${ev.computedStatus.toUpperCase()}</span>
      </div>
      <p class="admin-section-desc admin-mb-075">${ev.description || ''}</p>
      <div class="admin-flex-col-gap-sm font-mono text-sm">
        <div>🍷 Theme: <strong>${ev.themeName || ev.name || 'Custom'}</strong></div>
        <div>📍 Venue: <strong>${ev.venue || ev.location || 'Secret Villa'}</strong></div>
        <div>📅 Date: <strong>${ev.displayNight || ev.eventDate}</strong></div>
        <div>🪑 Capacity: <strong>${ev.capacity || 25} Seats</strong></div>
        <div>💰 Price: <strong>₹${ev.price || 3500}</strong></div>
      </div>
      <div class="admin-flex-gap-md admin-mt-1">
        <button class="admin-btn admin-btn-outline admin-btn-sm btn-edit-event" data-id="${ev.id}">Edit</button>
        <button class="admin-btn admin-btn-danger admin-btn-sm btn-delete-event" data-id="${ev.id}">Delete</button>
      </div>
    `;

    card.querySelector('.btn-edit-event')?.addEventListener('click', () => {
      openAdminEventModal(ev);
    });

    card.querySelector('.btn-delete-event')?.addEventListener('click', async () => {
      if (confirm(`Delete event "${ev.title || ev.name}"?`)) {
        try {
          await removeFirestoreDoc('events', ev.id);
          activeEvents = activeEvents.filter(e => e.id !== ev.id);
          renderAdminEventsView(activeEvents, activeThemes);
        } catch (err) {
          console.error('Firestore event deletion error:', err);
          alert(`Unable to delete event "${ev.title || ev.name}" from Firestore: ${err.message || 'Permission denied'}.\n\nPlease ensure your Firebase Security Rules allow deletes on /events/{eventId}.`);
        }
      }
    });

    grid.appendChild(card);
  });
}

/**
 * Handle Create Event modal trigger and filter tab pills.
 */
export function initAdminEventsListeners() {
  const btnCreate = document.getElementById('btnCreateEventModal');
  const closeBtn  = document.getElementById('closeAdminEventModalBtn');
  const form      = document.getElementById('adminEventForm');
  const filterPills = document.getElementById('adminEventFilterPills');

  if (filterPills) {
    filterPills.querySelectorAll('.admin-filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        filterPills.querySelectorAll('.admin-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter || 'All';
        renderAdminEventsView(activeEvents, activeThemes);
      });
    });
  }

  if (btnCreate) {
    btnCreate.addEventListener('click', () => {
      openAdminEventModal(null);
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', closeAdminEventModal);
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await _saveAdminEventFromModal();
    });
  }
}

export function openAdminEventModal(ev = null) {
  const modal = document.getElementById('adminEventModal');
  const modalTitle = document.getElementById('adminEventModalTitle');
  if (!modal) return;

  const idInput           = document.getElementById('adminEventIdInput');
  const themeSelect       = document.getElementById('adminEventThemeSelect');
  const titleInput        = document.getElementById('adminEventTitleInput');
  const venueInput        = document.getElementById('adminEventVenueInput');
  const emblemInput       = document.getElementById('adminEventEmblemInput');
  const priceInput        = document.getElementById('adminEventPriceInput');
  const capacityInput     = document.getElementById('adminEventCapacityInput');
  const statusSelect      = document.getElementById('adminEventStatusSelect');
  const startTimeInput    = document.getElementById('adminEventStartTimeInput');
  const endTimeInput      = document.getElementById('adminEventEndTimeInput');
  const displayNightInput = document.getElementById('adminEventDisplayNightInput');
  const fileInput         = document.getElementById('adminEventFileInput');
  const descInput         = document.getElementById('adminEventDescriptionInput');

  // Populate Theme Select Dropdown (Requirement 19)
  if (themeSelect) {
    themeSelect.innerHTML = '';
    const defaultThemes = [
      { id: 'zenitsu', title: 'Zenitsu' },
      { id: 'tanjiro', title: 'Tanjiro' },
      { id: 'vedic_fire', title: 'Vedic Fire' },
      { id: 'night_party', title: 'The Night Party' },
      { id: 'cinema90s', title: "90's Indian Cinema" }
    ];
    const availableThemesList = activeThemes.length > 0 ? activeThemes : defaultThemes;
    availableThemesList.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id || t.themeId;
      opt.innerText = t.title || t.name;
      if (ev && (ev.themeId === t.id || (ev.name || '').toLowerCase() === (t.title || '').toLowerCase())) {
        opt.selected = true;
      }
      themeSelect.appendChild(opt);
    });
  }

  if (ev) {
    if (modalTitle) modalTitle.innerText = `EDIT EVENT: ${(ev.title || ev.name || '').toUpperCase()}`;
    if (idInput) idInput.value = ev.id;
    if (titleInput) titleInput.value = ev.title || ev.name || '';
    if (venueInput) venueInput.value = ev.venue || ev.location || '';
    if (emblemInput) emblemInput.value = ev.emblem || '🔥';
    if (priceInput) priceInput.value = ev.price || 3500;
    if (capacityInput) capacityInput.value = ev.capacity || 25;
    if (statusSelect) statusSelect.value = ev.status || 'Published';
    if (startTimeInput) startTimeInput.value = _formatIsoToDatetimeLocal(ev.eventDate || ev.eventStartTime);
    if (endTimeInput) endTimeInput.value = _formatIsoToDatetimeLocal(ev.eventEndTime || ev.eventDate);
    if (displayNightInput) displayNightInput.value = ev.displayNight || '';
    if (descInput) descInput.value = ev.description || '';
  } else {
    if (modalTitle) modalTitle.innerText = 'CREATE NEW SUPPER CLUB EVENT';
    if (idInput) idInput.value = '';
    if (titleInput) titleInput.value = '';
    if (venueInput) venueInput.value = '';
    if (emblemInput) emblemInput.value = '🔥';
    if (priceInput) priceInput.value = 3500;
    if (capacityInput) capacityInput.value = 7;
    if (statusSelect) statusSelect.value = 'Published';
    if (startTimeInput) startTimeInput.value = '2026-08-15T20:00';
    if (endTimeInput) endTimeInput.value = '2026-08-15T23:30';
    if (displayNightInput) displayNightInput.value = 'Sat Aug 15 · 20:00';
    if (descInput) descInput.value = 'Exclusive luxury mystery dining experience where time stops at the table.';
  }

  if (fileInput) fileInput.value = '';

  modal.classList.remove('overlay-backdrop--hidden');
  modal.classList.add('active');
}

export function closeAdminEventModal() {
  const modal = document.getElementById('adminEventModal');
  if (modal) {
    modal.classList.add('overlay-backdrop--hidden');
    modal.classList.remove('active');
  }
}

function _generateCleanEventId(title) {
  if (!title) return `event_${Date.now()}`;
  const slug = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return `${slug}_${Date.now().toString().slice(-4)}`;
}

async function _saveAdminEventFromModal() {
  const rawId          = document.getElementById('adminEventIdInput')?.value.trim();
  const themeSelect    = document.getElementById('adminEventThemeSelect');
  const title          = document.getElementById('adminEventTitleInput')?.value.trim() || 'Supper Club';
  const id             = rawId ? rawId : _generateCleanEventId(title);
  const venue          = document.getElementById('adminEventVenueInput')?.value || 'Secret Villa';
  const emblem         = document.getElementById('adminEventEmblemInput')?.value || '🔥';
  const price          = parseInt(document.getElementById('adminEventPriceInput')?.value || '3500', 10);
  const capacity       = parseInt(document.getElementById('adminEventCapacityInput')?.value || '25', 10);
  const status         = document.getElementById('adminEventStatusSelect')?.value || 'Published';
  const startLocal     = document.getElementById('adminEventStartTimeInput')?.value;
  const endLocal       = document.getElementById('adminEventEndTimeInput')?.value;
  const displayNight   = document.getElementById('adminEventDisplayNightInput')?.value || '';
  const fileInput      = document.getElementById('adminEventFileInput');
  const description    = document.getElementById('adminEventDescriptionInput')?.value || '';

  const themeId        = themeSelect?.value || 'zenitsu';
  const selectedThemeOpt = themeSelect?.options[themeSelect.selectedIndex];
  const themeName      = selectedThemeOpt ? selectedThemeOpt.text : title;

  const eventStartTime = startLocal ? new Date(startLocal).toISOString() : new Date().toISOString();
  const eventEndTime   = endLocal ? new Date(endLocal).toISOString() : new Date(Date.now() + 12600000).toISOString();

  let imageUrl = null;

  if (fileInput && fileInput.files && fileInput.files[0]) {
    imageUrl = await _readFileAsDataUrl(fileInput.files[0]);
  }

  const existingEv = activeEvents.find(e => e.id === id) || {};

  // Capacity Edit Validation Guard
  const confirmedBookedSeats = typeof existingEv.bookedSeats === 'number'
    ? existingEv.bookedSeats
    : (Array.isArray(existingEv.occupied) ? existingEv.occupied.length : 0);

  if (confirmedBookedSeats > 0 && capacity < confirmedBookedSeats) {
    alert(`⚠️ Cannot reduce capacity to ${capacity} seats. There are already ${confirmedBookedSeats} confirmed bookings for "${title}".`);
    return;
  }

  const payload = {
    ...existingEv,
    id: id,
    clubKey: id,
    themeId: themeId,
    themeName: themeName,
    title: title,
    name: title,
    venue: venue,
    location: venue,
    emblem: emblem,
    price: price,
    capacity: capacity,
    status: status,
    eventDate: eventStartTime,
    eventStartTime: eventStartTime,
    eventEndTime: eventEndTime,
    displayNight: displayNight || title,
    description: description,
    createdAt: existingEv.createdAt || new Date().toISOString(),
  };

  if (imageUrl) {
    payload.image = imageUrl;
  } else if (!payload.image) {
    payload.image = 'assets/vedic_fire_food.png';
  }

  try {
    await writeFirestoreDoc('events', id, payload);
    closeAdminEventModal();
  } catch (err) {
    console.error('Failed to save event to Firestore:', err);
    alert(`⚠️ Error saving event: ${err.message || 'Permission denied'}.\n\nPlease check your Firestore security rules or connection.`);
  }
}

/**
 * Read and compress image files to ensure size is strictly < 2MB before storing in Firestore.
 * Uses HTML5 Canvas for client-side scaling & high-quality JPEG compression.
 * @param {File} file
 * @param {number} maxWidth
 * @param {number} maxHeight
 * @param {number} quality
 * @returns {Promise<string>} Base64 Data URL
 */
function _readFileAsDataUrl(file, maxWidth = 1200, maxHeight = 1200, quality = 0.8) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null);

    // If small SVG, return immediately as raw text data
    if (file.size < 300 * 1024 && file.type.includes('svg')) {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Proportional dimension scaling
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Export compressed JPEG
        let dataUrl = canvas.toDataURL('image/jpeg', quality);

        // Further compress if file size exceeds 1.5MB
        if (dataUrl.length > 1.5 * 1024 * 1024) {
          dataUrl = canvas.toDataURL('image/jpeg', 0.65);
        }

        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
      img.src = e.target.result;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

function _formatIsoToDatetimeLocal(isoStr) {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch (e) {
    return '';
  }
}
