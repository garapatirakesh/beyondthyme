/* modules/admin/adminNotifications.js
 * Admin Targeted Broadcast & Notification Center module.
 */

import { writeFirestoreDoc } from '../firebase.js';

export function initAdminNotificationsListeners() {
  const btnSend = document.getElementById('btnSendNotification');
  if (btnSend) {
    btnSend.addEventListener('click', async () => {
      const audience = document.getElementById('notifAudience')?.value || 'Everyone';
      const title = (document.getElementById('notifTitle')?.value || '').trim();
      const message = (document.getElementById('notifMessage')?.value || '').trim();

      if (!title || !message) {
        alert('Please provide both notification title and message content.');
        return;
      }

      const notifId = `notif_${Date.now()}`;
      await writeFirestoreDoc('notifications', notifId, {
        id: notifId,
        title: title,
        message: message,
        audience: audience,
        createdAt: new Date().toISOString(),
      });

      document.getElementById('notifTitle').value = '';
      document.getElementById('notifMessage').value = '';

      alert(`🚀 Notification successfully broadcast to "${audience}"!`);
    });
  }
}
