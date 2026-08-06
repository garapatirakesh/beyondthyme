/* modules/admin/adminThemes.js
 * Admin Theme Engine module for managing Saturday themes.
 */

import { writeFirestoreDoc, removeFirestoreDoc } from '../firebase.js';

/**
 * Render Saturday Themes Grid.
 * @param {Array} themes
 */
export function renderAdminThemesView(themes = []) {
  const grid = document.getElementById('adminThemesGrid');
  if (!grid) return;

  grid.innerHTML = '';
  if (themes.length === 0) {
    grid.innerHTML = '<p class="admin-section-desc">No themes found in database.</p>';
    return;
  }

  themes.forEach(t => {
    const card = document.createElement('div');
    card.className = 'admin-card';
    card.innerHTML = `
      <div class="admin-card-header">
        <h3 class="admin-card-title">${t.title || 'Theme'}</h3>
        <span class="admin-badge ${t.active ? 'admin-badge-success' : 'admin-badge-warning'}">${t.active ? 'Active' : 'Inactive'}</span>
      </div>
      <p class="admin-section-desc admin-mb-075">${t.description || ''}</p>
      <div class="admin-text-gold admin-mb-1rem">
        Week ${t.week || 1} • ${t.month || 'October'}
      </div>
      <div class="admin-flex-gap-md">
        <button class="admin-btn ${t.active ? 'admin-btn-outline' : 'admin-btn-gold'} admin-btn-sm btn-toggle-theme" data-id="${t.id}">
          ${t.active ? 'Deactivate' : 'Activate Theme'}
        </button>
        <button class="admin-btn admin-btn-danger admin-btn-sm btn-delete-theme" data-id="${t.id}">Delete</button>
      </div>
    `;

    card.querySelector('.btn-toggle-theme')?.addEventListener('click', async () => {
      await writeFirestoreDoc('themes', t.id, {
        ...t,
        active: !t.active,
      });
    });

    card.querySelector('.btn-delete-theme')?.addEventListener('click', async () => {
      if (confirm(`Delete theme "${t.title}"?`)) {
        await removeFirestoreDoc('themes', t.id);
      }
    });

    grid.appendChild(card);
  });
}

export function initAdminThemesListeners() {
  const btnCreate = document.getElementById('btnCreateThemeModal');
  if (btnCreate) {
    btnCreate.addEventListener('click', async () => {
      const title = prompt('Enter Theme Name:', '✨ Renaissance Alchemy');
      if (!title) return;
      const themeId = `theme_${Date.now()}`;

      await writeFirestoreDoc('themes', themeId, {
        id: themeId,
        title: title,
        description: 'Chronological Renaissance dining infusion.',
        week: 3,
        month: 'October',
        active: false,
      });
    });
  }
}
