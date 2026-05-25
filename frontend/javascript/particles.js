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
  const W = hero.offsetWidth;
  const H = hero.offsetHeight;

  // ── Scene ──────────────────────────────────────────────────────────────────
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x090c0a);

  const camera = new THREE.PerspectiveCamera(58, W / H, 0.1, 200);
  camera.position.set(0, 0, 36);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setSize(W, H);

  // ── Particles ──────────────────────────────────────────────────────────────
  const N    = 3200;
  const BNDX = 32;   // bounding box half-extents
  const BNDY = 22;
  const BNDZ = 18;

  const pos = new Float32Array(N * 3);
  const vel = new Float32Array(N * 3); // not stored separately — implicit via verlet-like

  // Randomise starting positions
  for (let i = 0; i < N; i++) {
    pos[i * 3]     = (Math.random() - 0.5) * BNDX * 2;
    pos[i * 3 + 1] = (Math.random() - 0.5) * BNDY * 2;
    pos[i * 3 + 2] = (Math.random() - 0.5) * BNDZ * 2;
    vel[i * 3]     = 0;
    vel[i * 3 + 1] = 0;
    vel[i * 3 + 2] = 0;
  }

  // Flow field — cheap layered sines that create organic, non-repeating streams
  function flow(x, y, z, t, out) {
    const s = 0.06; // spatial frequency
    out[0] =
      Math.sin(y * s * 1.3 + t * 0.28) * 0.7
    + Math.cos(z * s * 1.1 - t * 0.18) * 0.4
    + Math.sin((x + z) * s * 0.8 + t * 0.14) * 0.3;

    out[1] =
      Math.sin(z * s * 1.2 + t * 0.22) * 0.5
    + Math.cos(x * s * 0.9 + t * 0.31) * 0.4
    + Math.sin((y - x) * s * 0.7 - t * 0.19) * 0.25;

    out[2] =
      Math.sin(x * s * 1.1 - t * 0.25) * 0.4
    + Math.cos(y * s * 1.0 + t * 0.20) * 0.35;
  }

  // Per-particle vertex colors (static — depth-based green gradient)
  const colors = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const t = Math.random();
    // dim deep green → vivid forest green
    colors[i * 3]     = 0.04 + t * 0.12;
    colors[i * 3 + 1] = 0.10 + t * 0.30;
    colors[i * 3 + 2] = 0.05 + t * 0.14;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    vertexColors: true,
    size: 0.28,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const points = new THREE.Points(geo, mat);
  scene.add(points);

  // ── Mouse repulsion ────────────────────────────────────────────────────────
  // Project mouse onto the z=0 plane in world space
  let mx = 9999, my = 9999; // far off screen by default

  hero.addEventListener('mousemove', e => {
    const rect = hero.getBoundingClientRect();
    const ndcX = (e.clientX - rect.left)  / rect.width  * 2 - 1;
    const ndcY = -((e.clientY - rect.top) / rect.height * 2 - 1);
    // z=0 plane: world coords ≈ ndcX * fovFactor * aspect, ndcY * fovFactor
    const fovFactor = Math.tan((58 * Math.PI / 180) / 2) * 36; // camera.z=36
    mx = ndcX * fovFactor * (W / H);
    my = ndcY * fovFactor;
  }, { passive: true });

  hero.addEventListener('mouseleave', () => { mx = 9999; my = 9999; }, { passive: true });

  // ── Resize ─────────────────────────────────────────────────────────────────
  window.addEventListener('resize', () => {
    if (!isDesktop()) { showPhoto(); return; }
    showCanvas();
    const w = hero.offsetWidth, h = hero.offsetHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }, { passive: true });

  // ── Animate ────────────────────────────────────────────────────────────────
  const f = new Float32Array(3);
  const DT      = 0.016;
  const DRAG    = 0.96;
  const MOUSE_R = 5.5;
  const MOUSE_F = 0.9;

  let t = 0;

  function animate() {
    requestAnimationFrame(animate);
    t += DT;

    for (let i = 0; i < N; i++) {
      const xi = i * 3, yi = xi + 1, zi = xi + 2;
      const x = pos[xi], y = pos[yi], z = pos[zi];

      // Flow field acceleration
      flow(x, y, z, t, f);
      vel[xi] = vel[xi] * DRAG + f[0] * DT * 0.6;
      vel[yi] = vel[yi] * DRAG + f[1] * DT * 0.6;
      vel[zi] = vel[zi] * DRAG + f[2] * DT * 0.4;

      // Mouse repulsion (only in XY — z stays from flow)
      const dx = x - mx, dy = y - my;
      const d2 = dx * dx + dy * dy;
      if (d2 < MOUSE_R * MOUSE_R) {
        const d = Math.sqrt(d2) || 0.01;
        const s = (1 - d / MOUSE_R) * MOUSE_F / d;
        vel[xi] += dx * s * DT;
        vel[yi] += dy * s * DT;
      }

      // Integrate
      pos[xi] += vel[xi];
      pos[yi] += vel[yi];
      pos[zi] += vel[zi];

      // Wrap — particles re-enter from the opposite side
      if (pos[xi] >  BNDX) pos[xi] = -BNDX;
      if (pos[xi] < -BNDX) pos[xi] =  BNDX;
      if (pos[yi] >  BNDY) pos[yi] = -BNDY;
      if (pos[yi] < -BNDY) pos[yi] =  BNDY;
      if (pos[zi] >  BNDZ) pos[zi] = -BNDZ;
      if (pos[zi] < -BNDZ) pos[zi] =  BNDZ;
    }

    geo.attributes.position.needsUpdate = true;
    renderer.render(scene, camera);
  }

  animate();
})();
