/* modules/admin/adminSettings.js
 * Admin System Parameters & Settings module.
 */

import { writeFirestoreDoc } from '../firebase.js';
import { RAZORPAY_KEY_ID, ADMIN_EMAIL } from '../../config/app.config.js';

export function initAdminSettingsListeners() {
  const btnSave = document.getElementById('btnSaveSystemSettings');
  if (btnSave) {
    btnSave.addEventListener('click', async () => {
      const venue = document.getElementById('settingVenue')?.value || 'Secret Villa, South Delhi';
      const seats = parseInt(document.getElementById('settingMaxSeats')?.value || '25', 10);
      const price = parseInt(document.getElementById('settingTicketPrice')?.value || '2000', 10);
      const rzpKey = document.getElementById('settingRazorpayKey')?.value || RAZORPAY_KEY_ID;
      const email = document.getElementById('settingSupportEmail')?.value || ADMIN_EMAIL;

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
