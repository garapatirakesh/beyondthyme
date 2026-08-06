/* modules/admin/adminTreasure.js
 * Admin Treasure Hunt Coordinate & Leaderboard Management module.
 */

import { writeFirestoreDoc } from '../firebase.js';

export function renderAdminTreasureView(hunts = []) {
  const leaderboardEl = document.getElementById('adminTreasureLeaderboard');
  if (!leaderboardEl) return;

  const currentHunt = hunts.find(h => h.id === 'clue_01') || hunts[0];

  if (currentHunt) {
    const xInput = document.getElementById('thCoordX');
    const yInput = document.getElementById('thCoordY');
    const hintInput = document.getElementById('thHint');
    const titleInput = document.getElementById('thTitle');

    if (xInput && currentHunt.xCoord) xInput.value = currentHunt.xCoord;
    if (yInput && currentHunt.yCoord) yInput.value = currentHunt.yCoord;
    if (hintInput && currentHunt.hint) hintInput.value = currentHunt.hint;
    if (titleInput && currentHunt.title) titleInput.value = currentHunt.title;
  }

  leaderboardEl.innerHTML = `
    <div class="admin-recessed-box">
      <div>
        <span class="admin-text-coral-accent">1. ChronoMaster</span>
        <div class="admin-seat-status">Solved in 42s • 3 Attempts</div>
      </div>
      <span class="admin-badge admin-badge-success">VIP Unlocked</span>
    </div>
    <div class="admin-recessed-box-subtle">
      <div>
        <span class="admin-text-coral-accent">2. Kala_Seeker</span>
        <div class="admin-seat-status">Solved in 1m 12s • 5 Attempts</div>
      </div>
      <span class="admin-badge admin-badge-info">VIP Unlocked</span>
    </div>
  `;
}

export function initAdminTreasureListeners() {
  const btnSave = document.getElementById('btnSaveTreasureConfig');
  if (btnSave) {
    btnSave.addEventListener('click', async () => {
      const title = (document.getElementById('thTitle')?.value || 'Vault of Amrit Yuga').trim();
      const x = parseInt(document.getElementById('thCoordX')?.value || '42', 10);
      const y = parseInt(document.getElementById('thCoordY')?.value || '65', 10);
      const hint = (document.getElementById('thHint')?.value || '').trim();

      await writeFirestoreDoc('treasureHunts', 'clue_01', {
        id: 'clue_01',
        title: title,
        xCoord: x,
        yCoord: y,
        hint: hint,
        updatedAt: new Date().toISOString(),
      });

      alert(`✅ Treasure Hunt coordinates updated live on guest site!\nX: ${x}, Y: ${y}`);
    });
  }
}
