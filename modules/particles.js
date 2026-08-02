/* modules/particles.js
 * Dark Gold Particle & Ambient Light Canvas Engine.
 * Renders floating gold dust, light rays, and faint background Roman clock faces.
 */

let canvas, ctx;
let particles = [];
let animFrameId;
let isInitialized = false;

/**
 * Initialize particle canvas inside container.
 * @param {string} canvasId
 */
export function initGoldParticles(canvasId = 'goldParticleCanvas') {
  canvas = document.getElementById(canvasId);
  if (!canvas) return;
  ctx = canvas.getContext('2d');
  if (!ctx) return;

  _resizeCanvas();
  window.addEventListener('resize', _resizeCanvas);

  // Generate gold dust particles
  particles = [];
  const count = 65;
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.8 + 0.5,
      alpha: Math.random() * 0.6 + 0.2,
      speedY: Math.random() * 0.3 + 0.1,
      speedX: (Math.random() - 0.5) * 0.15,
      pulse: Math.random() * Math.PI * 2,
    });
  }

  isInitialized = true;
  _renderLoop();
}

function _resizeCanvas() {
  if (!canvas) return;
  const parent = canvas.parentElement;
  canvas.width = parent ? parent.clientWidth : window.innerWidth;
  canvas.height = parent ? parent.clientHeight : 700;
}

function _renderLoop() {
  if (!ctx || !canvas) return;
  animFrameId = requestAnimationFrame(_renderLoop);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const time = Date.now() * 0.001;

  // 1. Render Faint Corner Roman Clock Face Watermarks
  _drawCornerClock(ctx, 80, 80, 140, time * 0.05, 0.035);
  _drawCornerClock(ctx, canvas.width - 80, canvas.height - 80, 160, -time * 0.04, 0.035);

  // 2. Render Floating Gold Dust Particles
  particles.forEach(p => {
    p.y -= p.speedY;
    p.x += Math.sin(time + p.pulse) * p.speedX;

    if (p.y < 0) {
      p.y = canvas.height;
      p.x = Math.random() * canvas.width;
    }

    const currentAlpha = p.alpha + Math.sin(time * 2 + p.pulse) * 0.15;
    ctx.save();
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(212, 175, 55, ${Math.max(0.05, Math.min(1, currentAlpha))})`;
    ctx.shadowColor = 'rgba(212, 175, 55, 0.8)';
    ctx.shadowBlur = p.radius * 4;
    ctx.fill();
    ctx.restore();
  });
}

/**
 * Draw a subtle rotating Roman numeral clock outline.
 */
function _drawCornerClock(ctx, cx, cy, radius, angle, opacity) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.strokeStyle = `rgba(212, 175, 55, ${opacity})`;
  ctx.lineWidth = 1;

  // Outer ring
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Inner dashed ring
  ctx.beginPath();
  ctx.setLineDash([4, 6]);
  ctx.arc(0, 0, radius * 0.88, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Hour ticks
  for (let i = 0; i < 12; i++) {
    const tickAngle = (i / 12) * Math.PI * 2;
    const x1 = Math.cos(tickAngle) * (radius * 0.92);
    const y1 = Math.sin(tickAngle) * (radius * 0.92);
    const x2 = Math.cos(tickAngle) * (radius * 0.98);
    const y2 = Math.sin(tickAngle) * (radius * 0.98);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  ctx.restore();
}
