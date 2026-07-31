/* modules/terminal.js
 * Terminal console output utilities.
 * All string literals for terminal messages live in app.js or caller context.
 */

import { TERMINAL_INITIAL_LINES, DIAGNOSTIC_DELAYS_MS } from '../config/app.config.js';
import { playThermalPrinterTear } from './audio.js';

/**
 * Append a line to the terminal output element.
 * @param {string} text
 * @param {string} statusClass  — optional CSS class ('success'|'accent'|'')
 * @param {string} [id]         — optional id attribute for the new line element
 */
export function printToTerminal(text, statusClass = '', id = '') {
  const outputEl = document.getElementById('terminalOutput');
  if (!outputEl) return;

  const line = document.createElement('div');
  line.className = 'terminal-line' + (statusClass ? ` ${statusClass}` : '');
  if (id) line.id = id;
  line.innerText = text;
  outputEl.appendChild(line);

  // Auto-scroll inside the terminal box
  const terminalBox = document.getElementById('terminalBox');
  if (terminalBox) terminalBox.scrollTop = terminalBox.scrollHeight;
}

/**
 * Reset terminal to its initial two boot lines.
 * Re-creates the #terminalSelectedSeatLine element so callers can re-query it.
 */
export function resetTerminal() {
  const outputEl = document.getElementById('terminalOutput');
  if (!outputEl) return;

  outputEl.innerHTML = '';
  TERMINAL_INITIAL_LINES.forEach(({ text, cls, id }) => {
    const line = document.createElement('div');
    line.className = 'terminal-line' + (cls ? ` ${cls}` : '');
    if (id) line.id = id;
    line.innerText = text;
    outputEl.appendChild(line);
  });
}

/**
 * Run the multi-step diagnostic animation sequence on form submit.
 * @param {{ pseudo: string, seat: string, o: string, d: string, eVal: string }} params
 * @param {object} deps — { terminalBox, dotProgress2, dotProgress3, successOverlay, ticketEls, clubName }
 */
export function runDiagnosticSequence(params, deps) {
  const { pseudo, seat, o, d, eVal } = params;
  const { terminalBox, dotProgress2, dotProgress3, successOverlay, ticketEls, clubName } = deps;

  if (terminalBox) terminalBox.classList.add('diagnostic-running');

  printToTerminal(`> INITIATING CALIBRATION PROTOCOL FOR MEMBER: ${pseudo.toUpperCase()}...`, 'accent');

  setTimeout(() => {
    printToTerminal('> RUNNING DIAGNOSTIC: ESTABLISHING SECURE VILLA CONNECTION...');
    if (dotProgress2) dotProgress2.classList.add('active');
  }, DIAGNOSTIC_DELAYS_MS[0]);

  setTimeout(() => {
    printToTerminal(`> CAPTURING CALIBRATION VECTOR: [TIME: ${o}% | SOCIAL: ${d}% | FLAVOR: ${eVal}%]`);
  }, DIAGNOSTIC_DELAYS_MS[1]);

  setTimeout(() => {
    printToTerminal(`> SYNCING RESERVATION SLOT: POSITION ${seat.toUpperCase()} LOCKED.`);
    if (dotProgress3) dotProgress3.classList.add('active');
  }, DIAGNOSTIC_DELAYS_MS[2]);

  setTimeout(() => {
    printToTerminal('> SUCCESS: VILLA CLEARANCE AUTHORIZED. SYSTEM SECURED.', 'success');
  }, DIAGNOSTIC_DELAYS_MS[3]);

  setTimeout(() => {
    if (!successOverlay) return;
    successOverlay.style.display = 'flex';
    playThermalPrinterTear();

    if (ticketEls.club)       ticketEls.club.innerText       = clubName.toUpperCase();
    if (ticketEls.pseudonym)  ticketEls.pseudonym.innerText  = pseudo;
    if (ticketEls.seat)       ticketEls.seat.innerText       = seat.toUpperCase().replace('_', ' ');
    if (ticketEls.vector)     ticketEls.vector.innerText     = `[${o}%, ${d}%, ${eVal}%]`;
  }, DIAGNOSTIC_DELAYS_MS[4]);
}
