/* modules/watch3d.js
 * Ultra-Luxury 3D Mechanical Watch Visualizer (Calibre N-01 Skeleton Watch).
 * Ported 100% identically from C:\Users\arrab\watch (WatchModel.jsx & gearGeometry.js).
 * Features real local time continuous sweep hand rotation down to milliseconds,
 * glowing neon orange dial tube + halo, 4 skeleton gear wheels with ruby bearings,
 * fluted crown on right side, double-curved sapphire crystal glass, 4 sculpted lugs,
 * balance wheel oscillation, 3D mouse parallax tilt, and 360° drag rotation.
 */

import { LUXURY_WATCH_CONFIG } from '../config/app.config.js';

let scene, camera, renderer;
let watchGroup, gearsGroup, handsGroup, balanceWheelGroup;
let gearCenterMesh, gearUpperLeftMesh, gearUpperRightMesh, gearLowerLeftMesh;
let hourHandGroup, minuteHandGroup, secondHandGroup;
let glowRingMesh, innerLight;

let targetTiltX = 0, targetTiltY = 0;
let currentTiltX = 0, currentTiltY = 0;
let dragRotationX = 0, dragRotationY = 0;
let dragVelocityX = 0, dragVelocityY = 0;
let isDragging = false;
let previousMouseX = 0, previousMouseY = 0;
let isInitialized = false;

/**
 * Initialize 3D Watch Model matching C:\Users\arrab\watch.
 * @param {string} containerId
 */
export function initWatch3D(containerId = 'watch3DContainer') {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (isInitialized && renderer && renderer.domElement) {
    if (!container.contains(renderer.domElement)) {
      container.innerHTML = '';
      container.appendChild(renderer.domElement);
    }
    return;
  }

  const THREE = window.THREE;
  if (!THREE) {
    console.warn('Three.js library not loaded yet.');
    return;
  }

  const width = container.clientWidth || 800;
  const height = container.clientHeight || 580;

  // ── 1. Scene & Camera Setup ──
  scene = new THREE.Scene();
  
  // Perspective camera with FOV 42 framed to fit complete watch + crown (90-95% container fill)
  camera = new THREE.PerspectiveCamera(
    LUXURY_WATCH_CONFIG.CAMERA_FOV || 42,
    width / height,
    0.1,
    1000
  );
  camera.position.set(0, 0, LUXURY_WATCH_CONFIG.CAMERA_Z || 8.2);

  // WebGL Renderer with PBR tone mapping & soft shadows
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;

  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  // ── 2. Horology Lighting Setup (Matching WatchCanvas.jsx) ──
  const ambientLight = new THREE.AmbientLight(0x181820, 0.7);
  scene.add(ambientLight);

  const mainDirLight = new THREE.DirectionalLight(0xffffff, 1.8);
  mainDirLight.position.set(4, 5, 4);
  mainDirLight.castShadow = true;
  mainDirLight.shadow.mapSize.width = 1024;
  mainDirLight.shadow.mapSize.height = 1024;
  scene.add(mainDirLight);

  const orangeRimLight = new THREE.DirectionalLight(0xff6600, 1.2);
  orangeRimLight.position.set(-4, -3, 2);
  scene.add(orangeRimLight);

  // ── 3. Materials (100% Ported from C:\Users\arrab\watch WatchModel.jsx) ──
  const matCase = new THREE.MeshStandardMaterial({
    color: LUXURY_WATCH_CONFIG.COLOR_CASE || '#2a2d38',
    metalness: 0.95,
    roughness: 0.2,
  });

  const matBezelOuter = new THREE.MeshStandardMaterial({
    color: LUXURY_WATCH_CONFIG.COLOR_BEZEL_OUTER || '#404554',
    metalness: 0.96,
    roughness: 0.12,
  });

  const matBezelInner = new THREE.MeshStandardMaterial({
    color: LUXURY_WATCH_CONFIG.COLOR_BEZEL_INNER || '#1f222a',
    metalness: 0.95,
    roughness: 0.22,
  });

  const matCrown = new THREE.MeshStandardMaterial({
    color: LUXURY_WATCH_CONFIG.COLOR_CROWN_STEEL || '#343946',
    metalness: 0.95,
    roughness: 0.2,
  });

  const matGoldGear = new THREE.MeshStandardMaterial({
    color: LUXURY_WATCH_CONFIG.COLOR_GOLD_GEAR || '#d4af37',
    metalness: 0.92,
    roughness: 0.22,
  });

  const matRoseGoldGear = new THREE.MeshStandardMaterial({
    color: LUXURY_WATCH_CONFIG.COLOR_ROSE_GOLD_GEAR || '#b8707a',
    metalness: 0.9,
    roughness: 0.25,
  });

  const matCopperGear = new THREE.MeshStandardMaterial({
    color: LUXURY_WATCH_CONFIG.COLOR_COPPER_GEAR || '#b87333',
    metalness: 0.88,
    roughness: 0.28,
  });

  const matSteelGear = new THREE.MeshStandardMaterial({
    color: LUXURY_WATCH_CONFIG.COLOR_STEEL_GEAR || '#8a909d',
    metalness: 0.95,
    roughness: 0.18,
  });

  const matDarkPlate = new THREE.MeshStandardMaterial({
    color: LUXURY_WATCH_CONFIG.COLOR_DARK_PLATE || '#0d0e12',
    metalness: 0.5,
    roughness: 0.8,
  });

  const matNeonOrangeRing = new THREE.MeshStandardMaterial({
    color: LUXURY_WATCH_CONFIG.COLOR_NEON_ORANGE || '#ff5500',
    emissive: LUXURY_WATCH_CONFIG.COLOR_NEON_EMISSIVE || '#ff4400',
    emissiveIntensity: 4.5,
  });

  const matNeonOrangeHalo = new THREE.MeshStandardMaterial({
    color: LUXURY_WATCH_CONFIG.COLOR_NEON_HALO || '#ff6600',
    emissive: '#ff5500',
    emissiveIntensity: 2.8,
  });

  const matRubyJewel = new THREE.MeshPhysicalMaterial({
    color: LUXURY_WATCH_CONFIG.COLOR_RUBY_JEWEL || '#e6004c',
    roughness: 0.05,
    metalness: 0.1,
    transmission: 0.85,
    ior: 1.76,
  });

  const matScrewHead = new THREE.MeshStandardMaterial({
    color: LUXURY_WATCH_CONFIG.COLOR_SCREW_HEAD || '#c5c9d4',
    metalness: 0.95,
    roughness: 0.15,
  });

  const matSapphireGlass = new THREE.MeshPhysicalMaterial({
    color: '#ffffff',
    transparent: true,
    opacity: 0.06,
    roughness: 0.02,
    metalness: 0.1,
    transmission: 0.98,
    ior: 1.77,
    clearcoat: 1.0,
    clearcoatRoughness: 0.02,
  });

  const matHandFacet = new THREE.MeshStandardMaterial({
    color: LUXURY_WATCH_CONFIG.COLOR_HAND_FACET || '#f0f3fa',
    metalness: 0.98,
    roughness: 0.05,
  });

  const matSecondHand = new THREE.MeshStandardMaterial({
    color: LUXURY_WATCH_CONFIG.COLOR_SECOND_HAND || '#ff4400',
    emissive: '#ff5500',
    emissiveIntensity: 5.0,
    metalness: 0.9,
    roughness: 0.1,
  });

  const matMarkerBlock = new THREE.MeshStandardMaterial({
    color: LUXURY_WATCH_CONFIG.COLOR_MARKER_BLOCK || '#1a1c23',
    metalness: 0.92,
    roughness: 0.2,
  });

  const matMarkerHighlight = new THREE.MeshStandardMaterial({
    color: LUXURY_WATCH_CONFIG.COLOR_MARKER_HIGHLIGHT || '#6e7587',
    metalness: 0.95,
    roughness: 0.12,
  });

  const matTableSurface = new THREE.MeshStandardMaterial({
    color: '#060608',
    metalness: 0.2,
    roughness: 0.8,
  });

  // ── 4. Main Assembly Group ──
  watchGroup = new THREE.Group();
  watchGroup.position.set(0, 0, 0);
  watchGroup.scale.set(1.0, 1.0, 1.0);

  // Dark Horology Surface Plate (Matching WatchModel.jsx)
  const tableSurfaceGeo = new THREE.PlaneGeometry(30, 20);
  const tableSurfaceMesh = new THREE.Mesh(tableSurfaceGeo, matTableSurface);
  tableSurfaceMesh.position.set(0, 0, -1.5);
  tableSurfaceMesh.receiveShadow = true;
  watchGroup.add(tableSurfaceMesh);

  // Internal Orange Backlight & Contact Shadow Light
  innerLight = new THREE.PointLight(0xff5500, 3.5, 4.5);
  innerLight.position.set(0, 0, -0.3);
  watchGroup.add(innerLight);

  const contactLight = new THREE.PointLight(0xff4400, 2.5, 6.0);
  contactLight.position.set(0, -2.8, -0.8);
  watchGroup.add(contactLight);

  // Ambient Dust Sparkles (Matching WatchCanvas.jsx Sparkles component)
  const sparkleCount = 35;
  const sparkleGeo = new THREE.BufferGeometry();
  const sparklePos = new Float32Array(sparkleCount * 3);
  for (let i = 0; i < sparkleCount; i++) {
    sparklePos[i * 3]     = (Math.random() - 0.5) * 12;
    sparklePos[i * 3 + 1] = (Math.random() - 0.5) * 8;
    sparklePos[i * 3 + 2] = (Math.random() - 0.5) * 4;
  }
  sparkleGeo.setAttribute('position', new THREE.BufferAttribute(sparklePos, 3));
  const sparkleMat = new THREE.PointsMaterial({
    color: 0xff7700,
    size: 0.08,
    transparent: true,
    opacity: 0.35,
    blending: THREE.AdditiveBlending,
  });
  const sparkles = new THREE.Points(sparkleGeo, sparkleMat);
  watchGroup.add(sparkles);

  // A. Hollow Outer Casing Ring
  const torusCaseGeo = new THREE.TorusGeometry(3.15, 0.22, 32, 64);
  const meshCase = new THREE.Mesh(torusCaseGeo, matCase);
  meshCase.castShadow = true;
  meshCase.receiveShadow = true;
  watchGroup.add(meshCase);

  // B. Polished Outer Bezel Ring
  const torusBezelOuterGeo = new THREE.TorusGeometry(2.96, 0.14, 24, 64);
  const meshBezelOuter = new THREE.Mesh(torusBezelOuterGeo, matBezelOuter);
  meshBezelOuter.position.z = 0.18;
  meshBezelOuter.castShadow = true;
  watchGroup.add(meshBezelOuter);

  // C. Chamfered Inner Steel Rim
  const torusBezelInnerGeo = new THREE.TorusGeometry(2.78, 0.1, 24, 64);
  const meshBezelInner = new THREE.Mesh(torusBezelInnerGeo, matBezelInner);
  meshBezelInner.position.z = 0.22;
  meshBezelInner.castShadow = true;
  watchGroup.add(meshBezelInner);

  // D. 4 Sculpted Lugs
  const lugPositions = [
    [-2.3, 2.4, -0.05, Math.PI * 0.15],
    [2.3, 2.4, -0.05, -Math.PI * 0.15],
    [-2.3, -2.4, -0.05, Math.PI * 0.85],
    [2.3, -2.4, -0.05, -Math.PI * 0.85],
  ];
  lugPositions.forEach(([lx, ly, lz, lrot]) => {
    const lugGroup = new THREE.Group();
    lugGroup.position.set(lx, ly, lz);
    lugGroup.rotation.z = lrot;

    const lugGeo = new THREE.BoxGeometry(0.4, 1.15, 0.38);
    const lugMesh = new THREE.Mesh(lugGeo, matCase);
    lugMesh.castShadow = true;
    lugGroup.add(lugMesh);

    watchGroup.add(lugGroup);
  });

  // E. Winding Crown on Right Side (X = +3.35)
  const crownGroup = new THREE.Group();
  crownGroup.position.set(3.35, 0, 0);
  crownGroup.rotation.z = -Math.PI / 2;

  const crownGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.35, 32);
  const crownMesh = new THREE.Mesh(crownGeo, matCrown);
  crownGroup.add(crownMesh);

  // 16 Ridge teeth on crown perimeter
  for (let i = 0; i < 16; i++) {
    const angle = (i * Math.PI * 2) / 16;
    const ridgeGeo = new THREE.BoxGeometry(0.02, 0.32, 0.02);
    const ridgeMesh = new THREE.Mesh(ridgeGeo, matBezelOuter);
    ridgeMesh.position.set(Math.cos(angle) * 0.28, 0, Math.sin(angle) * 0.28);
    crownGroup.add(ridgeMesh);
  }
  watchGroup.add(crownGroup);

  // F. Glowing Neon Orange Tube & Halo
  const neonRingGeo = new THREE.TorusGeometry(2.62, 0.055, 16, 64);
  glowRingMesh = new THREE.Mesh(neonRingGeo, matNeonOrangeRing);
  glowRingMesh.position.z = 0.25;
  watchGroup.add(glowRingMesh);

  const neonHaloGeo = new THREE.TorusGeometry(2.6, 0.03, 16, 64);
  const haloMesh = new THREE.Mesh(neonHaloGeo, matNeonOrangeHalo);
  haloMesh.position.z = 0.23;
  watchGroup.add(haloMesh);

  // G. 12 Hour Markers (Indices)
  const markersGroup = new THREE.Group();
  markersGroup.position.z = 0.26;
  for (let i = 0; i < 12; i++) {
    const angle = (i * Math.PI * 2) / 12;
    const radius = 2.42;
    const isMajor = i % 3 === 0;

    const markerItem = new THREE.Group();
    markerItem.position.set(Math.sin(angle) * radius, Math.cos(angle) * radius, 0);
    markerItem.rotation.z = -angle;

    const blockGeo = new THREE.BoxGeometry(isMajor ? 0.11 : 0.065, isMajor ? 0.28 : 0.19, 0.05);
    const blockMesh = new THREE.Mesh(blockGeo, matMarkerBlock);
    markerItem.add(blockMesh);

    const highlightGeo = new THREE.BoxGeometry(isMajor ? 0.09 : 0.045, isMajor ? 0.26 : 0.17, 0.008);
    const highlightMesh = new THREE.Mesh(highlightGeo, matMarkerHighlight);
    highlightMesh.position.z = 0.028;
    markerItem.add(highlightMesh);

    markersGroup.add(markerItem);
  }
  watchGroup.add(markersGroup);

  // H. Skeleton Mechanical Movement
  gearsGroup = new THREE.Group();
  gearsGroup.position.z = -0.05;

  // Recessed Back Plate
  const backPlateGeo = new THREE.CircleGeometry(2.55, 64);
  const backPlateMesh = new THREE.Mesh(backPlateGeo, matDarkPlate);
  backPlateMesh.position.z = -0.3;
  gearsGroup.add(backPlateMesh);

  // 1. CENTER GOLD GEAR (34 Teeth)
  const gearCenterGeo = _createGearShape(34, 0.4, 1.4, 0.15, 0.25);
  gearCenterMesh = new THREE.Mesh(
    new THREE.ExtrudeGeometry(gearCenterGeo, { depth: 0.09, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.014, bevelThickness: 0.014 }),
    matGoldGear
  );
  gearCenterMesh.position.set(0, -0.3, -0.05);
  gearCenterMesh.castShadow = true;
  gearCenterMesh.receiveShadow = true;
  gearsGroup.add(gearCenterMesh);

  // 2. UPPER LEFT ROSE GOLD GEAR (24 Teeth)
  const gearUpperLeftGeo = _createGearShape(24, 0.25, 0.95, 0.15, 0.18);
  gearUpperLeftMesh = new THREE.Mesh(
    new THREE.ExtrudeGeometry(gearUpperLeftGeo, { depth: 0.09, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.014, bevelThickness: 0.014 }),
    matRoseGoldGear
  );
  gearUpperLeftMesh.position.set(-1.1, 0.7, -0.02);
  gearUpperLeftMesh.castShadow = true;
  gearUpperLeftMesh.receiveShadow = true;
  gearsGroup.add(gearUpperLeftMesh);

  // 3. UPPER RIGHT STEEL GEAR (22 Teeth)
  const gearUpperRightGeo = _createGearShape(22, 0.22, 0.85, 0.15, 0.16);
  gearUpperRightMesh = new THREE.Mesh(
    new THREE.ExtrudeGeometry(gearUpperRightGeo, { depth: 0.09, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.014, bevelThickness: 0.014 }),
    matSteelGear
  );
  gearUpperRightMesh.position.set(1.15, 0.75, -0.01);
  gearUpperRightMesh.castShadow = true;
  gearUpperRightMesh.receiveShadow = true;
  gearsGroup.add(gearUpperRightMesh);

  // 4. LOWER LEFT COPPER GEAR (18 Teeth)
  const gearLowerLeftGeo = _createGearShape(18, 0.18, 0.7, 0.15, 0.14);
  gearLowerLeftMesh = new THREE.Mesh(
    new THREE.ExtrudeGeometry(gearLowerLeftGeo, { depth: 0.09, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.014, bevelThickness: 0.014 }),
    matCopperGear
  );
  gearLowerLeftMesh.position.set(-1.05, -0.85, -0.04);
  gearLowerLeftMesh.castShadow = true;
  gearLowerLeftMesh.receiveShadow = true;
  gearsGroup.add(gearLowerLeftMesh);

  // Balance Wheel Unit
  balanceWheelGroup = new THREE.Group();
  balanceWheelGroup.position.set(-0.5, 0.85, 0.0);

  const balRingGeo = new THREE.TorusGeometry(0.42, 0.038, 16, 48);
  const balRingMesh = new THREE.Mesh(balRingGeo, matRoseGoldGear);
  balanceWheelGroup.add(balRingMesh);

  [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].forEach((angle) => {
    const spokeGeo = new THREE.BoxGeometry(0.84, 0.024, 0.024);
    const spokeMesh = new THREE.Mesh(spokeGeo, matRoseGoldGear);
    spokeMesh.rotation.z = angle;
    balanceWheelGroup.add(spokeMesh);
  });

  const balJewelGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.05, 16);
  const balJewelMesh = new THREE.Mesh(balJewelGeo, matRubyJewel);
  balJewelMesh.position.z = 0.02;
  balJewelMesh.rotation.x = Math.PI / 2;
  balanceWheelGroup.add(balJewelMesh);

  gearsGroup.add(balanceWheelGroup);

  // Slotted Screw Fasteners
  [[-0.85, 1.25, 0.04], [1.15, 1.2, 0.04], [1.25, -1.05, 0.04], [-1.15, -1.15, 0.04]].forEach(([sx, sy, sz]) => {
    const screwGroup = new THREE.Group();
    screwGroup.position.set(sx, sy, sz);

    const screwHeadGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.04, 16);
    const screwHeadMesh = new THREE.Mesh(screwHeadGeo, matScrewHead);
    screwHeadMesh.rotation.x = Math.PI / 2;
    screwGroup.add(screwHeadMesh);

    const slotGeo = new THREE.BoxGeometry(0.11, 0.018, 0.01);
    const slotMesh = new THREE.Mesh(slotGeo, matDarkPlate);
    slotMesh.position.z = 0.022;
    screwGroup.add(slotMesh);

    gearsGroup.add(screwGroup);
  });

  // Translucent Ruby Jewels on gear hubs
  [
    [0, -0.3, 0.05],
    [-1.1, 0.7, 0.06],
    [1.15, 0.75, 0.07],
    [-1.05, -0.85, 0.04],
  ].forEach(([jx, jy, jz]) => {
    const jewelGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.05, 16);
    const jewelMesh = new THREE.Mesh(jewelGeo, matRubyJewel);
    jewelMesh.position.set(jx, jy, jz);
    jewelMesh.rotation.x = Math.PI / 2;
    gearsGroup.add(jewelMesh);
  });

  watchGroup.add(gearsGroup);

  // I. Sapphire Glass Cover
  const sapphireGlassGeo = new THREE.CylinderGeometry(2.85, 2.85, 0.04, 64);
  const sapphireGlassMesh = new THREE.Mesh(sapphireGlassGeo, matSapphireGlass);
  sapphireGlassMesh.position.z = 0.38;
  sapphireGlassMesh.rotation.x = Math.PI / 2;
  watchGroup.add(sapphireGlassMesh);

  // J. Live Animated Watch Hands (Hour, Minute & Continuous Sweeping Second Hand)
  handsGroup = new THREE.Group();
  handsGroup.position.z = 0.36;

  // Center Pivot Stack Cap
  const capGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.12, 32);
  const capMesh = new THREE.Mesh(capGeo, matBezelOuter);
  capMesh.position.z = 0.08;
  capMesh.rotation.x = Math.PI / 2;
  handsGroup.add(capMesh);

  const sphereCapGeo = new THREE.SphereGeometry(0.07, 16, 16);
  const sphereCapMesh = new THREE.Mesh(sphereCapGeo, matSecondHand);
  sphereCapMesh.position.z = 0.15;
  handsGroup.add(sphereCapMesh);

  // Hour Hand
  hourHandGroup = new THREE.Group();
  hourHandGroup.position.z = 0.02;

  const hourBladeGeo = new THREE.BoxGeometry(0.09, 1.4, 0.035);
  const hourBladeMesh = new THREE.Mesh(hourBladeGeo, matHandFacet);
  hourBladeMesh.position.set(0, 0.7, 0);
  hourBladeMesh.castShadow = true;
  hourHandGroup.add(hourBladeMesh);

  const hourTipGeo = new THREE.BoxGeometry(0.12, 0.12, 0.035);
  const hourTipMesh = new THREE.Mesh(hourTipGeo, matHandFacet);
  hourTipMesh.position.set(0, 1.4, 0);
  hourTipMesh.rotation.z = Math.PI / 4;
  hourHandGroup.add(hourTipMesh);

  handsGroup.add(hourHandGroup);

  // Minute Hand
  minuteHandGroup = new THREE.Group();
  minuteHandGroup.position.z = 0.05;

  const minBladeGeo = new THREE.BoxGeometry(0.065, 2.3, 0.03);
  const minBladeMesh = new THREE.Mesh(minBladeGeo, matHandFacet);
  minBladeMesh.position.set(0, 1.15, 0);
  minBladeMesh.castShadow = true;
  minuteHandGroup.add(minBladeMesh);

  const minTipGeo = new THREE.ConeGeometry(0.035, 0.25, 16);
  const minTipMesh = new THREE.Mesh(minTipGeo, matHandFacet);
  minTipMesh.position.set(0, 2.3, 0);
  minTipMesh.rotation.x = Math.PI;
  minuteHandGroup.add(minTipMesh);

  handsGroup.add(minuteHandGroup);

  // Second Hand (Continuous Sweeping Neon Needle)
  secondHandGroup = new THREE.Group();
  secondHandGroup.position.z = 0.08;

  const secBladeGeo = new THREE.BoxGeometry(0.022, 2.5, 0.02);
  const secBladeMesh = new THREE.Mesh(secBladeGeo, matSecondHand);
  secBladeMesh.position.set(0, 1.25, 0);
  secBladeMesh.castShadow = true;
  secondHandGroup.add(secBladeMesh);

  const secWeightGeo = new THREE.TorusGeometry(0.09, 0.016, 16, 32);
  const secWeightMesh = new THREE.Mesh(secWeightGeo, matSecondHand);
  secWeightMesh.position.set(0, -0.45, 0);
  secondHandGroup.add(secWeightMesh);

  const secTipGeo = new THREE.ConeGeometry(0.04, 0.2, 16);
  const secTipMesh = new THREE.Mesh(secTipGeo, matSecondHand);
  secTipMesh.position.set(0, 2.45, 0);
  secTipMesh.rotation.x = Math.PI;
  secondHandGroup.add(secTipMesh);

  handsGroup.add(secondHandGroup);

  watchGroup.add(handsGroup);

  scene.add(watchGroup);
  isInitialized = true;

  // ── 5. Mouse Interaction Listeners (Parallax Mouse Tilt & Drag) ──
  const seatingSection = document.querySelector('.seating-section') || document.body;
  seatingSection.addEventListener('mousemove', (e) => {
    if (isDragging) return;
    const rect = seatingSection.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    const maxTilt = ((LUXURY_WATCH_CONFIG.MAX_TILT_DEG || 35) * Math.PI) / 180;
    targetTiltX = -y * maxTilt * 0.35;
    targetTiltY = x * maxTilt * 0.45;
  });

  seatingSection.addEventListener('mouseleave', () => {
    targetTiltX = 0;
    targetTiltY = 0;
  });

  const domCanvas = renderer.domElement;
  domCanvas.style.cursor = 'grab';

  const onDragStart = (clientX, clientY) => {
    isDragging = true;
    previousMouseX = clientX;
    previousMouseY = clientY;
    dragVelocityX = 0;
    dragVelocityY = 0;
    domCanvas.style.cursor = 'grabbing';
  };

  const onDragMove = (clientX, clientY) => {
    if (!isDragging) return;
    const deltaX = clientX - previousMouseX;
    const deltaY = clientY - previousMouseY;

    const sensitivity = LUXURY_WATCH_CONFIG.DRAG_SENSITIVITY || 0.008;
    dragVelocityX = deltaY * sensitivity;
    dragVelocityY = deltaX * sensitivity;

    dragRotationX += dragVelocityX;
    dragRotationY += dragVelocityY;

    previousMouseX = clientX;
    previousMouseY = clientY;
  };

  const onDragEnd = () => {
    if (!isDragging) return;
    isDragging = false;
    domCanvas.style.cursor = 'grab';
  };

  domCanvas.addEventListener('mousedown', (e) => onDragStart(e.clientX, e.clientY));
  window.addEventListener('mousemove', (e) => onDragMove(e.clientX, e.clientY));
  window.addEventListener('mouseup', onDragEnd);

  domCanvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      onDragStart(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (isDragging && e.touches.length === 1) {
      onDragMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });

  window.addEventListener('touchend', onDragEnd);

  // ── 6. Continuous 60 FPS Render & Animation Loop ──
  function animate() {
    requestAnimationFrame(animate);

    const now = new Date();
    const ms   = now.getMilliseconds();
    const secs = now.getSeconds() + ms / 1000;
    const mins = now.getMinutes() + secs / 60;
    const hrs  = (now.getHours() % 12) + mins / 60;

    // Synchronized live local time rotations for watch hands
    if (secondHandGroup) secondHandGroup.rotation.z = - (secs / 60) * Math.PI * 2;
    if (minuteHandGroup) minuteHandGroup.rotation.z = - (mins / 60) * Math.PI * 2;
    if (hourHandGroup)   hourHandGroup.rotation.z   = - (hrs / 12)  * Math.PI * 2;

    // Continuous Gear Mechanism Rotations (matching WatchModel.jsx speed ratios)
    const delta = 0.016; // ~60 FPS frame delta
    if (gearCenterMesh)     gearCenterMesh.rotation.z     += delta * 0.5 * 1.0 * 1;
    if (gearUpperLeftMesh)  gearUpperLeftMesh.rotation.z  += delta * 0.5 * 1.3 * -1;
    if (gearUpperRightMesh) gearUpperRightMesh.rotation.z += delta * 0.5 * 1.5 * -1;
    if (gearLowerLeftMesh)  gearLowerLeftMesh.rotation.z  += delta * 0.5 * 1.7 * -1;

    // Balance Wheel Oscillation
    if (balanceWheelGroup) {
      const time = Date.now() * 0.001;
      balanceWheelGroup.rotation.z = Math.sin(time * 10) * 0.95;
    }

    // Glowing Neon Tube Pulsing
    if (glowRingMesh) {
      const time = Date.now() * 0.001;
      glowRingMesh.material.emissiveIntensity = 4.5 + Math.sin(time * 2.0) * 0.5;
    }

    if (innerLight) {
      const time = Date.now() * 0.001;
      innerLight.intensity = 3.5 + Math.sin(time * 2.5) * 1.0;
    }

    // Damped Mouse Parallax Tilt
    const damping = LUXURY_WATCH_CONFIG.TILT_DAMPING || 0.08;
    currentTiltX += (targetTiltX - currentTiltX) * damping;
    currentTiltY += (targetTiltY - currentTiltY) * damping;

    // Drag Velocity Decay
    if (!isDragging) {
      dragRotationX += dragVelocityX;
      dragRotationY += dragVelocityY;
      dragVelocityX *= 0.94;
      dragVelocityY *= 0.94;
    }

    // Floating Breathing Motion & Combined 3D Rotation
    const time = Date.now() * 0.001;
    const breathY = Math.sin(time * 1.2) * 0.04;
    watchGroup.rotation.x = currentTiltX + dragRotationX;
    watchGroup.rotation.y = currentTiltY + dragRotationY;
    watchGroup.position.y = breathY;

    renderer.render(scene, camera);
  }

  animate();

  // Responsive Resize Handler
  window.addEventListener('resize', () => {
    if (!container || !renderer || !camera) return;
    const w = container.clientWidth || 800;
    const h = container.clientHeight || 580;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
}

/**
 * Trigger center watch gear acceleration pulse on user click.
 */
export function pulseWatch3D() {
  if (!watchGroup) return;
  let count = 0;
  const pulseInt = setInterval(() => {
    count++;
    if (gearCenterMesh) gearCenterMesh.rotation.z += 0.15;
    if (gearUpperLeftMesh) gearUpperLeftMesh.rotation.z -= 0.18;
    if (gearUpperRightMesh) gearUpperRightMesh.rotation.z -= 0.2;
    if (gearLowerLeftMesh) gearLowerLeftMesh.rotation.z -= 0.22;
    if (count > 20) clearInterval(pulseInt);
  }, 25);
}

/**
 * Procedural Spur Gear Shape Generator (Ported from C:\Users\arrab\watch\src\utils\gearGeometry.js).
 * @private
 */
function _createGearShape(teethCount = 20, innerRadius = 0.3, outerRadius = 1.0, toothHeight = 0.15, holeRadius = 0.15) {
  const THREE = window.THREE;
  const shape = new THREE.Shape();
  const step = (Math.PI * 2) / teethCount;
  const toothAngle = step * 0.25;

  for (let i = 0; i < teethCount; i++) {
    const angle = i * step;
    const a1 = angle;
    const a2 = angle + toothAngle;
    const a3 = angle + toothAngle * 2;
    const a4 = angle + toothAngle * 3;

    const rInner = outerRadius - toothHeight;
    const rOuter = outerRadius;

    if (i === 0) {
      shape.moveTo(Math.cos(a1) * rInner, Math.sin(a1) * rInner);
    } else {
      shape.lineTo(Math.cos(a1) * rInner, Math.sin(a1) * rInner);
    }

    shape.lineTo(Math.cos(a2) * rOuter, Math.sin(a2) * rOuter);
    shape.lineTo(Math.cos(a3) * rOuter, Math.sin(a3) * rOuter);
    shape.lineTo(Math.cos(a4) * rInner, Math.sin(a4) * rInner);
  }

  if (holeRadius > 0) {
    const holePath = new THREE.Path();
    holePath.absarc(0, 0, holeRadius, 0, Math.PI * 2, true);
    shape.holes.push(holePath);
  }

  if (innerRadius < outerRadius * 0.6 && teethCount > 12) {
    const spokeCount = Math.min(6, Math.floor(teethCount / 4));
    const spokeAngle = (Math.PI * 2) / spokeCount;
    const r1 = holeRadius + 0.1;
    const r2 = outerRadius - toothHeight - 0.12;

    for (let s = 0; s < spokeCount; s++) {
      const sa = s * spokeAngle + spokeAngle * 0.15;
      const sb = (s + 1) * spokeAngle - spokeAngle * 0.15;

      const spokePath = new THREE.Path();
      spokePath.moveTo(Math.cos(sa) * r1, Math.sin(sa) * r1);
      spokePath.lineTo(Math.cos(sa) * r2, Math.sin(sa) * r2);
      spokePath.lineTo(Math.cos(sb) * r2, Math.sin(sb) * r2);
      spokePath.lineTo(Math.cos(sb) * r1, Math.sin(sb) * r1);
      spokePath.closePath();
      shape.holes.push(spokePath);
    }
  }

  return shape;
}
