/* modules/cursor.js
 * Custom cursor initialisation and hover-state management.
 * Registers mouseenter/mouseleave on all .nav-interactive elements.
 */

export function initCursor() {
  const cursor = document.getElementById('customCursor');
  if (!cursor) return null;

  document.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top  = e.clientY + 'px';
  });

  document.addEventListener('mousedown', () => cursor.classList.add('clicking'));
  document.addEventListener('mouseup',   () => cursor.classList.remove('clicking'));

  return cursor;
}

/**
 * Bind hover states on a set of elements.
 * Call again whenever new interactive elements are added to the DOM.
 * @param {HTMLElement} cursor
 * @param {NodeList|Element[]} elements
 */
export function bindCursorHover(cursor, elements) {
  if (!cursor) return;
  elements.forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hovering'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hovering'));
  });
}
