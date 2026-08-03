/* modules/admin/adminCapsules.js
 * Admin Time Capsule Vault management module.
 */

import { writeFirestoreDoc, removeFirestoreDoc } from '../firebase.js';

export function renderAdminCapsulesView(capsules = []) {
  const tbody = document.getElementById('adminCapsulesTableBody');
  if (!tbody) return;

  tbody.innerHTML = '';
  if (capsules.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--admin-text-secondary); padding: 2rem;">
          No sealed time capsules in vault.
        </td>
      </tr>
    `;
    return;
  }

  capsules.forEach(c => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="admin-badge admin-badge-warning">${c.id || 'CAPSULE'}</span></td>
      <td><strong>${c.sealedBy || 'Member'}</strong></td>
      <td><small style="color: var(--admin-text-secondary);">${c.sealedAt ? new Date(c.sealedAt).toLocaleDateString() : '-'}</small></td>
      <td><small style="color: var(--admin-gold);">${c.unlockDate || 'October 24, 2026'}</small></td>
      <td><span class="admin-badge ${c.unlocked ? 'admin-badge-success' : 'admin-badge-info'}">${c.unlocked ? 'Unlocked' : 'Sealed'}</span></td>
      <td>
        <div style="display: flex; gap: 0.35rem;">
          <button class="admin-btn admin-btn-outline admin-btn-sm btn-unlock-capsule" data-id="${c.id}">${c.unlocked ? 'Reseal' : 'Unlock Now'}</button>
          <button class="admin-btn admin-btn-danger admin-btn-sm btn-delete-capsule" data-id="${c.id}">Delete</button>
        </div>
      </td>
    `;

    tr.querySelector('.btn-unlock-capsule')?.addEventListener('click', async () => {
      await writeFirestoreDoc('timeCapsules', c.id, {
        ...c,
        unlocked: !c.unlocked,
      });
    });

    tr.querySelector('.btn-delete-capsule')?.addEventListener('click', async () => {
      if (confirm(`Delete time capsule ${c.id}?`)) {
        await removeFirestoreDoc('timeCapsules', c.id);
      }
    });

    tbody.appendChild(tr);
  });
}
