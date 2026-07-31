/* modules/dials.js
 * Concentric Circular Rotary Dials.
 * Replaces standard HTML input range sliders with drag-to-rotate SVG dials.
 */

import { playCalibrationTick } from './audio.js';

/**
 * Initializes a rotary dial on a target container.
 * @param {HTMLElement} container - Element to render the dial SVG into
 * @param {string} label - Dial title (e.g. "TIME")
 * @param {number} initialValue - Startup value (0 - 100)
 * @param {Function} onChange - Callback on value change: (value) => void
 * @returns {object} - { getValue, setValue }
 */
export function createRotaryDial(container, label, initialValue = 50, onChange) {
  if (!container) return null;

  let value = initialValue;
  let isDragging = false;
  let lastTickValue = initialValue;

  // Arc range: -135deg (0%) to 135deg (100%). Total span = 270 deg.
  const MIN_ANGLE = -135;
  const MAX_ANGLE = 135;

  // Create SVG structure
  container.innerHTML = `
    <div class="rotary-dial-wrapper">
      <div class="rotary-dial-label-mono">${label}</div>
      <div class="rotary-dial-graphic">
        <svg viewBox="0 0 100 100" class="rotary-svg">
          <!-- Background track arc -->
          <path d="M 25 80 A 38 38 0 1 1 75 80" class="dial-track"></path>
          <!-- Active fill arc -->
          <path d="M 25 80 A 38 38 0 1 1 75 80" class="dial-fill" id="dialFill"></path>
          <!-- Rotating central cap -->
          <circle cx="50" cy="50" r="30" class="dial-cap"></circle>
          <!-- Pointer marker indicator dot -->
          <circle cx="50" cy="18" r="4.5" class="dial-pointer" id="dialPointer"></circle>
        </svg>
        <div class="rotary-dial-value-display" id="dialValText">${initialValue}%</div>
      </div>
    </div>
  `;

  const svg = container.querySelector('.rotary-svg');
  const dialFill = container.querySelector('#dialFill');
  const dialPointer = container.querySelector('#dialPointer');
  const dialValText = container.querySelector('#dialValText');

  // Update SVG rotation & dasharray lengths
  function updateUI() {
    // Map value [0, 100] to angle [-135, 135]
    const angle = MIN_ANGLE + (value / 100) * (MAX_ANGLE - MIN_ANGLE);

    // Rotate pointer indicator
    if (dialPointer) {
      dialPointer.style.transformOrigin = '50px 50px';
      dialPointer.style.transform = `rotate(${angle}deg)`;
    }

    // Set dashoffset for active path segment
    // SVG path total length of arc 'M 25 80 A 38 38 0 1 1 75 80' is approx 179px
    const pathLength = 179;
    const offset = pathLength - (value / 100) * pathLength;
    if (dialFill) {
      dialFill.style.strokeDasharray = `${pathLength}`;
      dialFill.style.strokeDashoffset = `${offset}`;
    }

    if (dialValText) {
      dialValText.innerText = `${Math.round(value)}%`;
    }
  }

  // Convert coordinate position to angle relative to dial center (50, 50)
  function handleMove(clientX, clientY) {
    const rect = svg.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const dx = clientX - cx;
    const dy = clientY - cy;

    // Angle in degrees from top vertical (-90 deg in standard math space)
    let angleRad = Math.atan2(dy, dx);
    let angleDeg = angleRad * (180 / Math.PI) + 90;

    // Normalize angle to [-180, 180]
    if (angleDeg > 180) angleDeg -= 360;
    if (angleDeg < -180) angleDeg += 360;

    // Clamp angle to valid rotary arc path range
    let clampedAngle = angleDeg;
    if (clampedAngle < MIN_ANGLE) {
      clampedAngle = clampedAngle < (MIN_ANGLE - 45) ? MAX_ANGLE : MIN_ANGLE;
    }
    if (clampedAngle > MAX_ANGLE) {
      clampedAngle = clampedAngle > (MAX_ANGLE + 45) ? MIN_ANGLE : MAX_ANGLE;
    }

    // Map clamped angle back to value [0, 100]
    const newValue = ((clampedAngle - MIN_ANGLE) / (MAX_ANGLE - MIN_ANGLE)) * 100;
    value = Math.max(0, Math.min(100, newValue));

    // Synthesize physical clock tick click sound every 2% step adjustment
    if (Math.abs(value - lastTickValue) >= 2) {
      playCalibrationTick();
      lastTickValue = value;
    }

    updateUI();
    onChange?.(value);
  }

  // Event binders
  function onMouseDown(e) {
    isDragging = true;
    e.preventDefault();
    handleMove(e.clientX, e.clientY);

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  function onMouseMove(e) {
    if (!isDragging) return;
    handleMove(e.clientX, e.clientY);
  }

  function onMouseUp() {
    isDragging = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  }

  // Touch screen coordinates
  function onTouchStart(e) {
    isDragging = true;
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);

    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd);
  }

  function onTouchMove(e) {
    if (!isDragging) return;
    e.preventDefault(); // prevent viewport scroll while adjusting dials
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  }

  function onTouchEnd() {
    isDragging = false;
    document.removeEventListener('touchmove', onTouchMove);
    document.removeEventListener('touchend', onTouchEnd);
  }

  // Attach mouse + touch bindings
  svg.addEventListener('mousedown', onMouseDown);
  svg.addEventListener('touchstart', onTouchStart, { passive: true });

  updateUI();

  return {
    getValue: () => Math.round(value),
    setValue: (val) => {
      value = Math.max(0, Math.min(100, val));
      lastTickValue = value;
      updateUI();
    }
  };
}
