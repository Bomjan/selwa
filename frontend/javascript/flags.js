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

  // Gradient background via canvas texture (top: dark teal → bottom: near-black)
  const bgC = document.createElement('canvas');
  bgC.width = 2; bgC.height = 512;
  const bgCtx = bgC.getContext('2d');
  const grad  = bgCtx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0,   '#0d1f2e');
  grad.addColorStop(0.5, '#091410');
  grad.addColorStop(1,   '#060e07');
  bgCtx.fillStyle = grad;
  bgCtx.fillRect(0, 0, 2, 512);
  scene.background = new THREE.CanvasTexture(bgC);

  scene.fog = new THREE.Fog(0x070d08, 30, 75);

  const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 200);
  camera.position.set(0, 2, 32);
  camera.lookAt(0, 3, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setSize(W, H);

  // ── Prayer flag colours — traditional 5 ───────────────────────────────────
  //  blue · cream · crimson · forest · saffron
  const PALETTE = [0x1e60c8, 0xd8cc9a, 0xc02222, 0x2a7e3a, 0xcc8c10];

  const FLAG_W = 2.6;
  const FLAG_H = 3.6;
  const SEG_X  = 8;
  const SEG_Y  = 12;

  // ── Diagonal strings — alternating direction, 4 depth layers ──────────────
  const STRINGS = [
    { from: [-24,  9.5,  4], to: [ 24, 3.5,  4], count: 9  },
    { from: [ 22,  8.5, -4], to: [-22, 2.5, -4], count: 8  },
    { from: [-26,  7.5,-12], to: [ 26, 1.5,-12], count: 10 },
    { from: [ 24,  7.0,-20], to: [-24, 1.0,-20], count: 11 },
  ];

  const flagData = [];

  STRINGS.forEach((str, si) => {
    const [x0, y0, z0] = str.from;
    const [x1, y1, z1] = str.to;
    const n = str.count;

    // Catenary rope
    const ropePts = [];
    for (let k = 0; k <= n * 6; k++) {
      const u = k / (n * 6);
      ropePts.push(new THREE.Vector3(
        x0 + u * (x1 - x0),
        y0 + u * (y1 - y0) + Math.sin(u * Math.PI) * -1.0,
        z0 + u * (z1 - z0)
      ));
    }
    scene.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(ropePts),
      new THREE.LineBasicMaterial({ color: 0x7a6040, opacity: 0.7, transparent: true })
    ));

    // Flags
    for (let fi = 0; fi < n; fi++) {
      const u  = n > 1 ? fi / (n - 1) : 0;
      const tx = x0 + u * (x1 - x0);
      const ty = y0 + u * (y1 - y0) + Math.sin(u * Math.PI) * -1.0;
      const tz = z0 + u * (z1 - z0);

      const geo = new THREE.PlaneGeometry(FLAG_W, FLAG_H, SEG_X, SEG_Y);
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(PALETTE[fi % PALETTE.length]),
        roughness: 0.58,
        metalness: 0.04,
        side: THREE.DoubleSide,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(tx, ty - FLAG_H / 2, tz);
      scene.add(mesh);

      flagData.push({
        geo,
        worldX: tx,
        phaseX: fi * 0.68 + si * 1.5,
        phaseT: Math.random() * Math.PI * 2,
        speed:  0.70 + Math.random() * 0.50,
        baseAmp: 0.50 + Math.random() * 0.35,
      });
    }
  });

  // ── Lighting ───────────────────────────────────────────────────────────────
  scene.add(new THREE.AmbientLight(0xffffff, 0.65));

  const sun = new THREE.DirectionalLight(0xffeebb, 1.6);
  sun.position.set(10, 25, 18);
  scene.add(sun);

  const sky = new THREE.DirectionalLight(0x88aac8, 0.5);
  sky.position.set(-10, 8, 6);
  scene.add(sky);

  const fill = new THREE.DirectionalLight(0xffffff, 0.2);
  fill.position.set(0, -5, 14);
  scene.add(fill);

  // ── Wind gust ─────────────────────────────────────────────────────────────
  let gustX     = -999;
  let gustDir   = 1;
  let gustTimer = 3.0;
  const DT      = 1 / 60;

  function tickGust() {
    gustTimer -= DT;
    if (gustTimer <= 0) {
      gustX     = gustDir > 0 ? -34 : 34;
      gustDir  *= -1;
      gustTimer = 4 + Math.random() * 3;
    }
    if (gustX > -990) {
      gustX += gustDir * 20 * DT;
      if (Math.abs(gustX) > 36) gustX = -999;
    }
  }

  function gustFactor(wx) {
    if (gustX < -990) return 0;
    const d = Math.abs(wx - gustX);
    return d < 7 ? (1 - d / 7) : 0;
  }

  // ── Mouse — gentle camera sway ─────────────────────────────────────────────
  let tgtX = 0, tgtY = 0, curX = 0, curY = 0;

  hero.addEventListener('mousemove', e => {
    const r = hero.getBoundingClientRect();
    tgtX = ((e.clientX - r.left) / r.width  - 0.5) * 2;
    tgtY = ((e.clientY - r.top)  / r.height - 0.5) * 2;
  }, { passive: true });
  hero.addEventListener('mouseleave', () => { tgtX = 0; tgtY = 0; }, { passive: true });

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
  let t = 0;

  function animate() {
    requestAnimationFrame(animate);
    t  += DT;
    tickGust();

    flagData.forEach(f => {
      const gust = gustFactor(f.worldX);
      const amp  = f.baseAmp * (1 + gust * 1.8);
      const spd  = f.speed   * (1 + gust * 0.7);
      const pos  = f.geo.attributes.position;

      for (let i = 0; i < pos.count; i++) {
        const lx = pos.getX(i);
        const ly = pos.getY(i);
        const yR = 1 - (ly + FLAG_H / 2) / FLAG_H; // 0=top 1=bottom
        const xN = (lx + FLAG_W / 2) / FLAG_W;     // 0=left 1=right

        const w1 = amp * yR * Math.sin(t * spd + xN * 3.8 + f.phaseX + f.phaseT);
        const w2 = amp * 0.2 * yR * Math.sin(t * spd * 2.3 + xN * 7.2 - f.phaseX);
        pos.setZ(i, w1 + w2);
      }

      pos.needsUpdate = true;
      f.geo.computeVertexNormals();
    });

    curX += (tgtX - curX) * 0.022;
    curY += (tgtY - curY) * 0.022;
    camera.position.x = curX * 3.5;
    camera.position.y = 2   - curY * 1.8;
    camera.lookAt(0, 3, 0);

    renderer.render(scene, camera);
  }

  animate();
})();
