/* modules/admin/adminUsers.js
 * Admin User Directory & Membership module.
 */

import { writeFirestoreDoc, removeFirestoreDoc } from '../firebase.js';

/**
 * Render Users Directory Table.
 * @param {Array} users
 */
export function renderAdminUsersView(users = []) {
  const tbody = document.getElementById('adminUsersTableBody');
  if (!tbody) return;

  tbody.innerHTML = '';
  if (users.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; color: var(--admin-text-secondary); padding: 2rem;">
          No registered users in directory yet.
        </td>
      </tr>
    `;
    return;
  }

  users.forEach(u => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <strong style="color: var(--admin-gold);">${u.displayName || 'Member'}</strong>
      </td>
      <td>${u.email || '-'}</td>
      <td><span class="admin-badge admin-badge-warning">${u.membership || 'Vedic Society Member'}</span></td>
      <td>🪙 ${u.timeCoins || 100} Coins</td>
      <td>${u.attendanceCount || 1} Dinners</td>
      <td><span class="admin-badge ${u.blocked ? 'admin-badge-danger' : 'admin-badge-success'}">${u.blocked ? 'Blocked' : 'Active'}</span></td>
      <td>
        <div style="display: flex; gap: 0.35rem;">
          <button class="admin-btn admin-btn-outline admin-btn-sm btn-toggle-block" data-id="${u.id}">${u.blocked ? 'Unblock' : 'Block'}</button>
          <button class="admin-btn admin-btn-danger admin-btn-sm btn-delete-user" data-id="${u.id}">Delete</button>
        </div>
      </td>
    `;

    tr.querySelector('.btn-toggle-block')?.addEventListener('click', async () => {
      await writeFirestoreDoc('users', u.id, {
        ...u,
        blocked: !u.blocked,
      });
    });

    tr.querySelector('.btn-delete-user')?.addEventListener('click', async () => {
      if (confirm(`Delete member ${u.displayName || u.email}?`)) {
        await removeFirestoreDoc('users', u.id);
      }
    });

    tbody.appendChild(tr);
  });
}
