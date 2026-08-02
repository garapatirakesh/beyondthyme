/* modules/watch3d.js
 * Ultra-Luxury 3D Mechanical Watch Visualizer (Rolex / Jacob & Co. inspired).
 * Features real local time clock hand rotation, skeleton gear mechanism,
 * sapphire crystal reflections, metallic gold materials (#D4AF37),
 * 3D mouse inertia tilt (max 6deg), and dynamic lighting.
 */

import { LUXURY_WATCH_CONFIG } from '../config/app.config.js';

let scene, camera, renderer;
let watchGroup, gearsGroup, handsGroup;
let hourHand, minuteHand, secondHand;
let targetTiltX = 0, targetTiltY = 0;
let currentTiltX = 0, currentTiltY = 0;
let isInitialized = false;

/**
 * Initialize 3D Luxury Watch Model.
 * @param {string} containerId
 */
export function initWatch3D(containerId = 'watch3DContainer') {
  const container = document.getElementById(containerId);
  if (!container || isInitialized) return;

  const THREE = window.THREE;
  if (!THREE) {
    console.warn('Three.js library not loaded yet.');
    return;
  }

  const width = container.clientWidth || 320;
  const height = container.clientHeight || 320;

  // Scene & Camera
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
  camera.position.set(0, 0, 13);

  // Renderer with anti-aliasing & shadows
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;

  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  // ── Lighting ──
  const ambientLight = new THREE.AmbientLight(0xfff8ee, 1.4);
  scene.add(ambientLight);

  const mainSpot = new THREE.SpotLight(0xffd79e, 3.5);
  mainSpot.position.set(12, 18, 14);
  mainSpot.angle = Math.PI / 4;
  mainSpot.penumbra = 0.5;
  mainSpot.castShadow = true;
  scene.add(mainSpot);

  const rimLight = new THREE.PointLight(0xd4af37, 4, 30);
  rimLight.position.set(-10, -10, 8);
  scene.add(rimLight);

  const coralLight = new THREE.PointLight(0xff5a2e, 2, 20);
  coralLight.position.set(8, -8, 6);
  scene.add(coralLight);

  // ── Main Watch Group ──
  watchGroup = new THREE.Group();

  // Gold Bezel Material (#D4AF37)
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.92,
    roughness: 0.18,
    emissive: 0x3d2905,
    emissiveIntensity: 0.2,
  });

  const darkGoldMat = new THREE.MeshStandardMaterial({
    color: 0x8a6220,
    metalness: 0.88,
    roughness: 0.3,
  });

  const darkDialMat = new THREE.MeshStandardMaterial({
    color: 0x080808,
    metalness: 0.4,
    roughness: 0.2,
  });

  // 1. Outer Bezel Ring (Fluted Gold Rim)
  const flutedRimGeo = new THREE.TorusGeometry(4.2, 0.38, 32, 120);
  const outerBezel = new THREE.Mesh(flutedRimGeo, goldMat);
  watchGroup.add(outerBezel);

  // Inner Bezel Inlay
  const innerRimGeo = new THREE.TorusGeometry(3.9, 0.12, 16, 90);
  const innerBezel = new THREE.Mesh(innerRimGeo, goldMat);
  innerBezel.position.z = 0.1;
  watchGroup.add(innerBezel);

  // 2. Dark Dial Face with Radial Texture
  const dialGeo = new THREE.CylinderGeometry(3.8, 3.8, 0.18, 64);
  const dialMesh = new THREE.Mesh(dialGeo, darkDialMat);
  dialMesh.rotation.x = Math.PI / 2;
  watchGroup.add(dialMesh);

  // 3. Hour Markers / Roman Numerals Ring (I - XII)
  const markerGroup = new THREE.Group();
  markerGroup.position.z = 0.12;
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const r = 3.3;
    const x = Math.sin(angle) * r;
    const y = Math.cos(angle) * r;

    const markerGeo = new THREE.BoxGeometry(0.12, 0.35, 0.08);
    const markerMesh = new THREE.Mesh(markerGeo, goldMat);
    markerMesh.position.set(x, y, 0);
    markerMesh.rotation.z = -angle;
    markerGroup.add(markerMesh);
  }
  watchGroup.add(markerGroup);

  // 4. Skeleton Mechanical Gears (Balance Wheel & Escapement)
  gearsGroup = new THREE.Group();
  gearsGroup.position.z = 0.14;

  const gear1 = _createGear(1.2, 14, darkGoldMat);
  gear1.position.set(-1.1, 0.7, 0);
  gearsGroup.add(gear1);

  const gear2 = _createGear(0.85, 10, goldMat);
  gear2.position.set(-0.35, 1.45, 0.02);
  gearsGroup.add(gear2);

  const gear3 = _createGear(1.5, 18, darkGoldMat);
  gear3.position.set(1.2, -0.9, 0);
  gearsGroup.add(gear3);

  // Balance Wheel (Spinning wheel)
  const balanceWheelGeo = new THREE.TorusGeometry(0.75, 0.06, 16, 48);
  const balanceWheel = new THREE.Mesh(balanceWheelGeo, goldMat);
  balanceWheel.position.set(0, -1.2, 0.04);
  gearsGroup.add(balanceWheel);

  watchGroup.add(gearsGroup);

  // 5. Clock Hands Group (Real Local Time)
  handsGroup = new THREE.Group();
  handsGroup.position.z = 0.28;

  const handMat = new THREE.MeshStandardMaterial({
    color: 0xf5e6b3,
    metalness: 0.95,
    roughness: 0.15,
  });

  const secMat = new THREE.MeshStandardMaterial({
    color: 0xff5a2e,
    metalness: 0.6,
    roughness: 0.2,
  });

  // Hour hand
  hourHand = _createLuxuryHand(2.1, 0.18, handMat);
  handsGroup.add(hourHand);

  // Minute hand
  minuteHand = _createLuxuryHand(3.1, 0.12, handMat);
  handsGroup.add(minuteHand);

  // Second hand
  secondHand = _createLuxuryHand(3.5, 0.04, secMat);
  handsGroup.add(secondHand);

  // Center Crown Cap
  const centerCapGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 32);
  const centerCap = new THREE.Mesh(centerCapGeo, goldMat);
  centerCap.rotation.x = Math.PI / 2;
  centerCap.position.z = 0.2;
  handsGroup.add(centerCap);

  watchGroup.add(handsGroup);

  // 6. Sapphire Crystal Glass Dome Reflection
  const crystalGeo = new THREE.SphereGeometry(3.9, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.3);
  const crystalMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.18,
    roughness: 0.05,
    metalness: 0.1,
    transmission: 0.9,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
  });
  const crystalMesh = new THREE.Mesh(crystalGeo, crystalMat);
  crystalMesh.rotation.x = Math.PI / 2;
  crystalMesh.position.z = 0.25;
  watchGroup.add(crystalMesh);

  scene.add(watchGroup);

  isInitialized = true;

  // ── Mouse Move 3D Tilt Listener ──
  const seatingContainer = document.querySelector('.seating-section') || document.body;
  seatingContainer.addEventListener('mousemove', (e) => {
    const rect = seatingContainer.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    const maxTiltRad = (LUXURY_WATCH_CONFIG.MAX_TILT_DEG * Math.PI) / 180;
    targetTiltX = -y * maxTiltRad * 2;
    targetTiltY = x * maxTiltRad * 2;
  });

  seatingContainer.addEventListener('mouseleave', () => {
    targetTiltX = 0;
    targetTiltY = 0;
  });

  // ── Animation Loop ──
  function animate() {
    requestAnimationFrame(animate);

    // Real Local Time Engine (JavaScript Date())
    const now = new Date();
    const ms   = now.getMilliseconds();
    const secs = now.getSeconds() + ms / 1000;
    const mins = now.getMinutes() + secs / 60;
    const hrs  = (now.getHours() % 12) + mins / 60;

    if (secondHand) secondHand.rotation.z = - (secs / 60) * Math.PI * 2;
    if (minuteHand) minuteHand.rotation.z = - (mins / 60) * Math.PI * 2;
    if (hourHand)   hourHand.rotation.z   = - (hrs / 12)  * Math.PI * 2;

    // Internal Skeleton Gear Rotations
    if (gearsGroup) {
      gearsGroup.children[0].rotation.z += 0.006;
      gearsGroup.children[1].rotation.z -= 0.01;
      gearsGroup.children[2].rotation.z += 0.004;
      gearsGroup.children[3].rotation.z += (Math.sin(Date.now() * 0.015) * 0.2); // Oscillation
    }

    // Smooth Mouse Tilt Damping (Inertia Physics)
    currentTiltX += (targetTiltX - currentTiltX) * LUXURY_WATCH_CONFIG.TILT_DAMPING;
    currentTiltY += (targetTiltY - currentTiltY) * LUXURY_WATCH_CONFIG.TILT_DAMPING;

    // Ambient Breathing Camera Motion
    const breathY = Math.sin(Date.now() * 0.001) * 0.04;
    watchGroup.rotation.x = currentTiltX + breathY;
    watchGroup.rotation.y = currentTiltY;

    renderer.render(scene, camera);
  }

  animate();

  // Resize Handler
  window.addEventListener('resize', () => {
    if (!container || !renderer || !camera) return;
    const w = container.clientWidth || 320;
    const h = container.clientHeight || 320;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
}

/**
 * Trigger center watch pulse animation on seat click.
 */
export function pulseWatch3D() {
  if (!watchGroup) return;
  let count = 0;
  const pulseInt = setInterval(() => {
    count++;
    if (gearsGroup) {
      gearsGroup.children.forEach(g => g.rotation.z += 0.12);
    }
    if (count > 20) clearInterval(pulseInt);
  }, 25);
}

function _createGear(radius, teethCount, material) {
  const THREE = window.THREE;
  const shape = new THREE.Shape();
  shape.absarc(0, 0, radius, 0, Math.PI * 2, false);

  const holePath = new THREE.Path();
  holePath.absarc(0, 0, radius * 0.45, 0, Math.PI * 2, true);
  shape.holes.push(holePath);

  const extrudeSettings = { depth: 0.12, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.02, bevelThickness: 0.02 };
  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  return new THREE.Mesh(geometry, material);
}

function _createLuxuryHand(length, width, material) {
  const THREE = window.THREE;
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, 0);
  shape.lineTo(width / 2, 0);
  shape.lineTo(width / 3, length * 0.75);
  shape.lineTo(0, length);
  shape.lineTo(-width / 3, length * 0.75);
  shape.closePath();

  const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.06, bevelEnabled: false });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.geometry.center();
  mesh.position.y = length / 2;

  const pivot = new THREE.Group();
  pivot.add(mesh);
  return pivot;
}
