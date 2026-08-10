/* config/ticket.config.js
 * Config-driven data and constants for Beyond Thyme Digital QR Ticket System.
 * Strict zero hardcoding policy (Rule 1, Rule 3).
 */

export const TICKET_SYSTEM = {
  PREFIX: 'BT',
  VERIFY_BASE_URL: 'https://beyond-thyme.web.app',
  DEFAULT_DRESS_CODE: 'Black Tie & Chrono Elements',
  ORGANIZER_NAME: 'Beyond Thyme Supper Club',
  ORGANIZER_EMAIL: 'beyondthyme.in@gmail.com',
  DEFAULT_CURRENCY: 'INR',
  QR_SIZE_PX: 220,
  PDF_SCALE_FACTOR: 2,
};

export function getVerifyUrl(bookingId) {
  if (!bookingId) return TICKET_SYSTEM.VERIFY_BASE_URL;
  // Always use the production URL for QR codes so mobile scanning works during local dev
  return `${TICKET_SYSTEM.VERIFY_BASE_URL}/?id=${bookingId}`;
}

export const TICKET_STATUS = {
  CONFIRMED: {
    code: 'CONFIRMED',
    label: 'SEAT CONFIRMED',
    badgeClass: 'badge-confirmed',
    message: 'Your timeline reservation is verified and active.',
  },
  CHECKED_IN: {
    code: 'CHECKED_IN',
    label: 'CHECKED IN',
    badgeClass: 'badge-checkedin',
    message: 'Welcome to Beyond Thyme. Guest checked in.',
  },
  CANCELLED: {
    code: 'CANCELLED',
    label: 'TICKET CANCELLED',
    badgeClass: 'badge-cancelled',
    message: 'This reservation has been cancelled.',
  },
  INVALID: {
    code: 'INVALID',
    label: 'INVALID TICKET',
    badgeClass: 'badge-invalid',
    message: 'No valid ticket document was found for this ID.',
  },
};

export const WHATSAPP_CONFIG = {
  SHARE_TEXT_TEMPLATE: (name, theme, ticketUrl, bookingId) =>
    `✨ You're invited to Beyond Thyme!\n\nGuest: ${name}\nTheme: ${theme}\nBooking ID: ${bookingId}\n\nView my exclusive digital ticket:\n${ticketUrl}`,
};

export const EMAIL_DISPATCH_CONFIG = {
  SUBJECT_TEMPLATE: (bookingId, theme) => `Beyond Thyme Invitation Secured — ${bookingId} (${theme})`,
  BODY_PREVIEW: (name, bookingId) => `Dear ${name}, your VIP Digital Ticket [${bookingId}] is confirmed.`,
};
