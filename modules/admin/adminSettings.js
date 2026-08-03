/* modules/admin/adminSettings.js
 * Admin System Parameters & Settings module.
 */

import { writeFirestoreDoc } from '../firebase.js';

export function initAdminSettingsListeners() {
  const btnSave = document.getElementById('btnSaveSystemSettings');
  if (btnSave) {
    btnSave.addEventListener('click', async () => {
      const venue = document.getElementById('settingVenue')?.value || 'Secret Villa, South Delhi';
      const seats = parseInt(document.getElementById('settingMaxSeats')?.value || '25', 10);
      const price = parseInt(document.getElementById('settingTicketPrice')?.value || '2000', 10);
      const rzpKey = document.getElementById('settingRazorpayKey')?.value || 'rzp_test_TKyTi4VEv9WTsk';
      const email = document.getElementById('settingSupportEmail')?.value || 'beyondthyme.in@gmail.com';

      await writeFirestoreDoc('settings', 'system_config', {
        venue,
        seats,
        price,
        rzpKey,
        email,
        updatedAt: new Date().toISOString(),
      });

      alert('💾 All system settings successfully saved to Firestore!');
    });
  }
}
