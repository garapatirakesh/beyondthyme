/* modules/ticketExporter.js
 * Export utilities: PDF generation, PNG image render, WhatsApp sharing, and Email dispatch.
 * Single responsibility module for outbound ticket channels (Rule 4).
 */

import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { WHATSAPP_CONFIG, EMAIL_DISPATCH_CONFIG, TICKET_SYSTEM } from '../config/ticket.config.js';

/**
 * Download ticket card container as a high-resolution PNG image.
 * @param {HTMLElement} ticketElement - Target luxury ticket element
 * @param {string} bookingId
 */
export async function downloadTicketAsPNG(ticketElement, bookingId = 'BT-TICKET') {
  if (!ticketElement) return;

  try {
    const canvas = await html2canvas(ticketElement, {
      scale: TICKET_SYSTEM.PDF_SCALE_FACTOR,
      useCORS: true,
      backgroundColor: '#0a0a0c',
      logging: false,
    });

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `BeyondThyme_Ticket_${bookingId}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (err) {
    console.warn('PNG export failed:', err);
    alert('Unable to generate PNG image download. Please try again.');
    return false;
  }
}

/**
 * Download ticket card container as a premium high-quality PDF document.
 * @param {HTMLElement} ticketElement - Target luxury ticket element
 * @param {string} bookingId
 */
export async function downloadTicketAsPDF(ticketElement, bookingId = 'BT-TICKET') {
  if (!ticketElement) return;

  try {
    const canvas = await html2canvas(ticketElement, {
      scale: TICKET_SYSTEM.PDF_SCALE_FACTOR,
      useCORS: true,
      backgroundColor: '#0a0a0c',
      logging: false,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgWidth = 190;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const positionX = (210 - imgWidth) / 2;
    const positionY = 15;

    pdf.setFillColor(10, 10, 12);
    pdf.rect(0, 0, 210, 297, 'F');
    pdf.addImage(imgData, 'JPEG', positionX, positionY, imgWidth, imgHeight);
    pdf.save(`BeyondThyme_Ticket_${bookingId}.pdf`);
    return true;
  } catch (err) {
    console.warn('PDF export failed:', err);
    alert('Unable to generate PDF document download. Please try again.');
    return false;
  }
}

/**
 * Share ticket via WhatsApp Web / App prefilled text link.
 * @param {object} ticketData
 */
export function shareTicketOnWhatsApp(ticketData) {
  if (!ticketData) return;

  const name = ticketData.userName || 'Guest';
  const theme = ticketData.themeName || 'Supper Club';
  const bookingId = ticketData.bookingId || ticketData.ticketId;
  const ticketUrl = ticketData.ticketUrl || `${TICKET_SYSTEM.VERIFY_BASE_URL}?id=${bookingId}`;

  const messageText = WHATSAPP_CONFIG.SHARE_TEXT_TEMPLATE(name, theme, ticketUrl, bookingId);
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(messageText)}`;

  window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
}

/**
 * Dispatch automatic email preview notification & copy details.
 * @param {object} ticketData
 */
export function dispatchTicketEmail(ticketData) {
  if (!ticketData) return;

  const subject = EMAIL_DISPATCH_CONFIG.SUBJECT_TEMPLATE(ticketData.bookingId, ticketData.themeName || 'Midnight Memories');
  const body = EMAIL_DISPATCH_CONFIG.BODY_PREVIEW(ticketData.userName, ticketData.bookingId);

  const mailtoUrl = `mailto:${encodeURIComponent(ticketData.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.open(mailtoUrl, '_self');
}
