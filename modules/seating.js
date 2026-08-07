import { SEAT_ORDER_IMAGE1, ORBITAL_SEATING_CONFIG } from '../config/app.config.js';

let seatElements = [];
let currentRotation = 0;
let targetRotation = 0;
let isDragging = false;
let startX = 0;
let startRotation = 0;
let animationFrameId = null;

let currentEventCapacity = 25;

/**
 * Initialize 360° Orbital Seating System around 3D Watch.
 * Render seating nodes strictly based on event capacity given by admin.
 * @param {object} clubConfig
 * @param {object} callbacks
 */
export function initOrbitalSeating(clubConfig, callbacks = {}) {
  const container = document.getElementById('orbitalSeatRing');
  if (!container) return;

  container.innerHTML = '';
  seatElements = [];
  currentRotation = 0;
  targetRotation = 0;

  currentEventCapacity = typeof clubConfig?.capacity === 'number' 
    ? clubConfig.capacity 
    : (parseInt(clubConfig?.capacity, 10) || 25);

  const isExpired = new Date(clubConfig?.eventDate || Date.now()) <= new Date();

  // Create Seats based strictly on clubConfig.capacity given by admin
  for (let i = 0; i < currentEventCapacity; i++) {
    const seatNum = i + 1;
    const occ = clubConfig?.occupied ? clubConfig.occupied.find(o => o.seat === seatNum) : null;
    const node = document.createElement('div');
    node.id = `chair${seatNum}`;
    node.setAttribute('data-seat-index', i);
    node.setAttribute('data-seat-num', seatNum);

    if (occ) {
      // Booked seat
      node.className = 'orbital-seat-node orbital-seat-node--booked nav-interactive';
      node.innerHTML = `
        <span class="seat-node-avatar">${occ.emoji || '👤'}</span>
        <div class="chair-tooltip">
          <p class="tooltip-title">Position ${String(seatNum).padStart(2, '0')}</p>
          <p class="tooltip-time">[RESERVED MEMBER]</p>
        </div>
      `;
      node.addEventListener('mouseenter', () => { if (!isExpired) callbacks.onOccupiedHover?.(); });
      node.addEventListener('mouseleave', () => { if (!isExpired) callbacks.onSeatHoverLeave?.(); });
    } else {
      if (isExpired) {
        node.className = 'orbital-seat-node orbital-seat-node--expired';
        node.innerHTML = `
          <span class="seat-node-num">${String(seatNum).padStart(2, '0')}</span>
          <div class="chair-tooltip">
            <p class="tooltip-title">Position ${String(seatNum).padStart(2, '0')}</p>
            <p class="tooltip-time">[CLOSED]</p>
          </div>
        `;
      } else {
        // Available Seat
        node.className = 'orbital-seat-node orbital-seat-node--available nav-interactive';
        node.innerHTML = `
          <span class="seat-node-num">${String(seatNum).padStart(2, '0')}</span>
          <div class="gold-ripple-ring"></div>
          <div class="chair-tooltip">
            <p class="tooltip-title">Position ${String(seatNum).padStart(2, '0')}</p>
            <p class="tooltip-time">[AVAILABLE SEAT]</p>
          </div>
        `;

        node.addEventListener('mouseenter', () => callbacks.onSeatHoverEnter?.(node));
        node.addEventListener('mouseleave', () => callbacks.onSeatHoverLeave?.());

        let mDownX = 0;
        let mDownY = 0;

        node.addEventListener('mousedown', (e) => {
          mDownX = e.clientX;
          mDownY = e.clientY;
        });

        const triggerSeatSelect = (e) => {
          if (e) e.stopPropagation();
          const seatBaseAngle = (i / currentEventCapacity) * 2 * Math.PI;
          targetRotation = Math.PI / 2 - seatBaseAngle;
          selectSeat(node);

          const ripple = node.querySelector('.gold-ripple-ring');
          if (ripple) {
            ripple.classList.remove('active');
            void ripple.offsetWidth;
            ripple.classList.add('active');
          }

          callbacks.onSeatClick?.(node);
        };

        node.addEventListener('click', (e) => {
          const dx = Math.abs(e.clientX - mDownX);
          const dy = Math.abs(e.clientY - mDownY);
          if (dx < 6 && dy < 6) triggerSeatSelect(e);
        });

        node.addEventListener('touchend', (e) => triggerSeatSelect(e));
      }
    }

    container.appendChild(node);
    seatElements.push(node);
  }

  _updateOrbitalLayout();
  _startAnimationLoop();

  // Mouse & Touch Drag Controls
  const visualizer = document.getElementById('schematicVisualizer') || container;
  
  const handleDragStart = (clientX) => {
    isDragging = true;
    startX = clientX;
    startRotation = targetRotation;
  };

  const handleDragMove = (clientX) => {
    if (!isDragging) return;
    const deltaX = clientX - startX;
    targetRotation = startRotation + deltaX * ORBITAL_SEATING_CONFIG.DRAG_SENSITIVITY;
  };

  const handleDragEnd = () => {
    isDragging = false;
  };

  visualizer.addEventListener('mousedown', (e) => handleDragStart(e.clientX));
  window.addEventListener('mousemove', (e) => handleDragMove(e.clientX));
  window.addEventListener('mouseup', handleDragEnd);

  visualizer.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) handleDragStart(e.touches[0].clientX);
  }, { passive: true });
  window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) handleDragMove(e.touches[0].clientX);
  }, { passive: true });
  window.addEventListener('touchend', handleDragEnd);

  // Wheel Control
  visualizer.addEventListener('wheel', (e) => {
    e.preventDefault();
    targetRotation += e.deltaY * 0.0015;
  }, { passive: false });

  // Start 60 FPS Orbit Render Loop
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  _startOrbitLoop();
}

/**
 * 60 FPS Smooth Orbit Rotation Animation Loop.
 * @private
 */
function _startOrbitLoop() {
  function loop() {
    currentRotation += (targetRotation - currentRotation) * ORBITAL_SEATING_CONFIG.ROTATION_DAMPING;
    _updateOrbitalLayout();
    animationFrameId = requestAnimationFrame(loop);
  }
  loop();
}

/**
 * Calculate dynamic 3D positions for all 25 seat elements.
 * @private
 */
function _updateOrbitalLayout() {
  const total = ORBITAL_SEATING_CONFIG.TOTAL_SEATS;
  const rx = ORBITAL_SEATING_CONFIG.RADIUS_X;
  const ry = ORBITAL_SEATING_CONFIG.RADIUS_Y;
  const minScale = ORBITAL_SEATING_CONFIG.BACK_SCALE_MIN;
  const maxScale = ORBITAL_SEATING_CONFIG.FRONT_SCALE_MAX;
  const minOpacity = ORBITAL_SEATING_CONFIG.BACK_OPACITY;
  const maxOpacity = ORBITAL_SEATING_CONFIG.FRONT_OPACITY;

  seatElements.forEach((node, i) => {
    const angle = (i / total) * 2 * Math.PI + currentRotation;
    const x = rx * Math.cos(angle);
    const y = ry * Math.sin(angle);

    // Depth factor: 0 at back (top of ellipse), 1 at front (bottom of ellipse)
    const depth = (Math.sin(angle) + 1) / 2;
    const scale = minScale + depth * (maxScale - minScale);
    const opacity = minOpacity + depth * (maxOpacity - minOpacity);
    const zIndex = Math.round(depth * 100) + 10;

    node.style.setProperty('--seat-x', `${x.toFixed(1)}px`);
    node.style.setProperty('--seat-y', `${y.toFixed(1)}px`);
    node.style.setProperty('--seat-scale', scale.toFixed(3));
    node.style.setProperty('--seat-z', String(zIndex));
    node.style.setProperty('--seat-opacity', opacity.toFixed(2));
  });
}

/**
 * Compatibility wrapper for renderSeatingLayout.
 */
export function renderSeatingLayout(clubConfig, callbacks = {}) {
  initOrbitalSeating(clubConfig, callbacks);
}

/**
 * Mark a seat element as selected.
 * @param {HTMLElement} chairEl
 */
export function selectSeat(chairEl) {
  const prev = document.querySelector('.orbital-seat-node.orbital-seat-node--selected');
  if (prev) prev.classList.remove('orbital-seat-node--selected');
  if (chairEl) chairEl.classList.add('orbital-seat-node--selected');
}

/**
 * Convert seat to occupied booked avatar.
 * @param {HTMLElement} chairEl
 * @param {{ emoji: string, alias: string }} vettingData
 * @param {string} seatNum
 */
export function convertSeatToOccupied(chairEl, vettingData, seatNum) {
  const { emoji } = vettingData;
  chairEl.classList.remove('orbital-seat-node--available', 'orbital-seat-node--selected');
  chairEl.classList.add('orbital-seat-node--booked');
  chairEl.innerHTML = `
    <span class="seat-node-avatar">${emoji || '👤'}</span>
    <div class="chair-tooltip">
      <p class="tooltip-title">Position ${String(seatNum).padStart(2, '0')}</p>
      <p class="tooltip-time">[RESERVED MEMBER]</p>
  `;
}
