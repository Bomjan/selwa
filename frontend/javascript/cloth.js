(function () {
  'use strict';

  if (typeof THREE === 'undefined') return;

  const canvas = document.getElementById('hero-canvas');
  const photo  = document.querySelector('.s-hero__bg');
  if (!canvas) return;

  function isDesktop() { return window.innerWidth >= 1024; }
  function showPhoto()  { canvas.style.display = 'none'; if (photo) photo.style.display = ''; }
  function showCanvas() { canvas.style.display = 'block'; if (photo) photo.style.display = 'none'; }

  if (!isDesktop()) { showPhoto(); return; }
  showCanvas();

  const hero = canvas.parentElement;

  // ── Scene ──────────────────────────────────────────────────────────────────
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x090c0a);

  const W = hero.offsetWidth;
  const H = hero.offsetHeight;

  const camera = new THREE.PerspectiveCamera(52, W / H, 0.1, 200);
  camera.position.set(0, 1, 24);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setSize(W, H);

  // ── Cloth sim ─────────────────────────────────────────────────────────────
  const COLS    = 48;
  const ROWS    = 34;
  const WIDTH   = 38;   // world-unit span
  const HEIGHT  = 28;
  const GRAVITY = -0.038;
  const DAMPING = 0.992;
  const ITERS   = 5;

  const px = new Float32Array(COLS * ROWS);
  const py = new Float32Array(COLS * ROWS);
  const pz = new Float32Array(COLS * ROWS);
  const ox = new Float32Array(COLS * ROWS);
  const oy = new Float32Array(COLS * ROWS);
  const oz = new Float32Array(COLS * ROWS);
  const pin = new Uint8Array(COLS * ROWS);

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const i = r * COLS + c;
      const x = (c / (COLS - 1) - 0.5) * WIDTH;
      const y = (0.5 - r / (ROWS - 1)) * HEIGHT;
      px[i] = ox[i] = x;
      py[i] = oy[i] = y;
      pz[i] = oz[i] = 0;
      pin[i] = (r === 0) ? 1 : 0;
    }
  }

  const H_REST = WIDTH  / (COLS - 1);
  const V_REST = HEIGHT / (ROWS - 1);
  const D_REST = Math.hypot(H_REST, V_REST);

  function solveEdge(a, b, rest) {
    const dx = px[b] - px[a];
    const dy = py[b] - py[a];
    const dz = pz[b] - pz[a];
    const dist = Math.sqrt(dx*dx + dy*dy + dz*dz) || 1e-6;
    const corr = (dist - rest) / dist * 0.5;
    const cx = dx * corr, cy = dy * corr, cz = dz * corr;
    if (!pin[a]) { px[a] += cx; py[a] += cy; pz[a] += cz; }
    if (!pin[b]) { px[b] -= cx; py[b] -= cy; pz[b] -= cz; }
  }

  let simTime = 0;
  let windStr = 1.0; // current wind strength, slowly varies

  function stepCloth(baseWind) {
    simTime += 0.018;
    windStr += (Math.sin(simTime * 0.3) * 1.4 + Math.sin(simTime * 0.7) * 0.6 - windStr) * 0.02;

    for (let i = 0; i < COLS * ROWS; i++) {
      if (pin[i]) continue;
      const r = Math.floor(i / COLS);
      const c = i % COLS;

      const vx = (px[i] - ox[i]) * DAMPING;
      const vy = (py[i] - oy[i]) * DAMPING;
      const vz = (pz[i] - oz[i]) * DAMPING;

      // Wind — different frequency per row/col so it ripples, not waves uniformly
      const wz = baseWind * windStr * (
        Math.sin(simTime * 1.1 + r * 0.22) * 0.038
      + Math.sin(simTime * 0.7 + c * 0.18) * 0.024
      + Math.cos(simTime * 1.6 - r * 0.14) * 0.016
      );
      const wx = baseWind * windStr * Math.sin(simTime * 0.5 + r * 0.1) * 0.008;

      ox[i] = px[i]; oy[i] = py[i]; oz[i] = pz[i];
      px[i] += vx + wx;
      py[i] += vy + GRAVITY;
      pz[i] += vz + wz;
    }

    for (let k = 0; k < ITERS; k++) {
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const i = r * COLS + c;
          if (c < COLS - 1)          solveEdge(i, i + 1,        H_REST);
          if (r < ROWS - 1)          solveEdge(i, i + COLS,     V_REST);
          if (c < COLS-1 && r < ROWS-1) {
            solveEdge(i,     i + COLS + 1, D_REST);
            solveEdge(i + 1, i + COLS,     D_REST);
          }
        }
      }
    }
  }

  // ── Geometry ──────────────────────────────────────────────────────────────
  const vtx = new Float32Array(COLS * ROWS * 3);
  const geo  = new THREE.BufferGeometry();

  const idxArr = [];
  for (let r = 0; r < ROWS - 1; r++) {
    for (let c = 0; c < COLS - 1; c++) {
      const i = r * COLS + c;
      idxArr.push(i, i + COLS, i + 1,
                  i + 1, i + COLS, i + COLS + 1);
    }
  }
  geo.setIndex(idxArr);
  geo.setAttribute('position', new THREE.BufferAttribute(vtx, 3));

  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0x1c3d2a),
    roughness: 0.22,
    metalness: 0.18,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geo, mat);
  scene.add(mesh);

  function syncGeometry() {
    for (let i = 0; i < COLS * ROWS; i++) {
      vtx[i * 3]     = px[i];
      vtx[i * 3 + 1] = py[i];
      vtx[i * 3 + 2] = pz[i];
    }
    geo.attributes.position.needsUpdate = true;
    geo.computeVertexNormals();
  }

  // ── Lighting ──────────────────────────────────────────────────────────────
  scene.add(new THREE.AmbientLight(0xffffff, 0.12));

  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(10, 18, 14);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0x4a9b66, 1.0);
  rim.position.set(-14, 6, -10);
  scene.add(rim);

  const back = new THREE.DirectionalLight(0x2d5a3d, 0.5);
  back.position.set(0, -8, -12);
  scene.add(back);

  // ── Mouse ─────────────────────────────────────────────────────────────────
  let mx = 0.5, my = 0.5;

  hero.addEventListener('mousemove', e => {
    const r = hero.getBoundingClientRect();
    mx = (e.clientX - r.left) / r.width;
    my = (e.clientY - r.top)  / r.height;
  }, { passive: true });

  function applyMouse() {
    const cx = (mx - 0.5) * WIDTH;
    const cy = (0.5 - my) * HEIGHT;
    const radius = 4.5;

    for (let i = 0; i < COLS * ROWS; i++) {
      if (pin[i]) continue;
      const dx = px[i] - cx;
      const dy = py[i] - cy;
      const d2 = dx*dx + dy*dy;
      if (d2 < radius * radius) {
        const strength = (1 - Math.sqrt(d2) / radius) * 0.9;
        pz[i] += strength;
      }
    }
  }

  // Pre-settle so cloth starts draped, not flat
  for (let s = 0; s < 100; s++) stepCloth(0.6);

  // ── Resize ────────────────────────────────────────────────────────────────
  window.addEventListener('resize', () => {
    if (!isDesktop()) { showPhoto(); return; }
    showCanvas();
    const w = hero.offsetWidth, h = hero.offsetHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }, { passive: true });

  // ── Render loop ───────────────────────────────────────────────────────────
  function animate() {
    requestAnimationFrame(animate);
    applyMouse();
    stepCloth(1.0);
    syncGeometry();
    renderer.render(scene, camera);
  }

  animate();
})();
