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

  const bgC = document.createElement('canvas');
  bgC.width = 2; bgC.height = 512;
  const bgCtx = bgC.getContext('2d');
  const grad  = bgCtx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0,   '#04080d');
  grad.addColorStop(0.5, '#060d0a');
  grad.addColorStop(1,   '#080c08');
  bgCtx.fillStyle = grad;
  bgCtx.fillRect(0, 0, 2, 512);
  scene.background = new THREE.CanvasTexture(bgC);
  scene.fog = new THREE.FogExp2(0x060a08, 0.016);

  const camera = new THREE.PerspectiveCamera(52, W / H, 0.1, 300);
  camera.position.set(0, 5, 30);
  camera.lookAt(0, 9, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setSize(W, H);

  // ── Mountains ──────────────────────────────────────────────────────────────
  const mGeo = new THREE.PlaneGeometry(160, 80, 48, 24);
  mGeo.rotateX(-Math.PI / 2);

  const posAttr = mGeo.attributes.position;
  const vCount  = posAttr.count;
  const baseY   = new Float32Array(vCount);

  function heightAt(x, z) {
    const r1 = Math.sin(x * 0.09 + 0.4) * 11;
    const r2 = Math.sin(x * 0.17 - 1.1) * 7;
    const r3 = Math.sin(x * 0.28 + z * 0.18) * 4;
    const r4 = Math.sin(x * 0.06 - z * 0.09) * 9;
    const dt = Math.sin(x * 0.42 + z * 0.35) * 1.8 + Math.cos(x * 0.55 - z * 0.48) * 1.2;
    return (r1 + r2 + r3 + r4 + dt) * (0.7 + Math.max(0, -z / 40) * 0.6);
  }

  const colAttr = new THREE.BufferAttribute(new Float32Array(vCount * 3), 3);
  for (let i = 0; i < vCount; i++) {
    const x = posAttr.getX(i);
    const z = posAttr.getZ(i);
    const y = heightAt(x, z);
    posAttr.setY(i, y);
    baseY[i] = y;
    const t = Math.max(0, Math.min(1, (y + 8) / 24));
    colAttr.setXYZ(i, 0.03 + t * 0.09, 0.05 + t * 0.19, 0.04 + t * 0.11);
  }
  mGeo.setAttribute('color', colAttr);

  const terrain = new THREE.Mesh(mGeo, new THREE.MeshStandardMaterial({
    vertexColors: true,
    flatShading: true,
    roughness: 1,
    metalness: 0,
  }));
  terrain.position.set(0, -6, -14);
  scene.add(terrain);

  // ── Stars ──────────────────────────────────────────────────────────────────
  const starPos = new Float32Array(280 * 3);
  for (let i = 0; i < 280; i++) {
    starPos[i * 3]     = (Math.random() - 0.5) * 220;
    starPos[i * 3 + 1] = Math.random() * 70 + 12;
    starPos[i * 3 + 2] = (Math.random() - 0.5) * 110 - 20;
  }
  const sGeo = new THREE.BufferGeometry();
  sGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  scene.add(new THREE.Points(sGeo, new THREE.PointsMaterial({
    color: 0xffffff, size: 0.18, opacity: 0.38, transparent: true,
  })));

  // ── Birds ──────────────────────────────────────────────────────────────────
  // Each bird: two wing triangles (left & right) sharing a body root.
  // Wing tips animate in Y (flap). Bird moves in X, wraps at ±BOUND.
  const BOUND = 38;

  const BIRD_DEFS = [
    { x: -20, y: 18.5, z: -7,  dir:  1, speed: 1.0, flapSpd: 2.8, flapAmp: 0.40, span: 1.7, phase: 0.0 },
    { x:   8, y: 20.5, z: -15, dir: -1, speed: 0.75, flapSpd: 2.4, flapAmp: 0.34, span: 1.4, phase: 1.3 },
    { x:  22, y: 17.5, z: -6,  dir:  1, speed: 1.15, flapSpd: 3.0, flapAmp: 0.42, span: 1.6, phase: 2.5 },
    { x:  -6, y: 22.0, z: -22, dir: -1, speed: 0.60, flapSpd: 2.1, flapAmp: 0.28, span: 1.2, phase: 0.7 },
  ];

  function makeBirdGeo(span) {
    // 6 vertices: left wing (root, tip, trailing) + right wing (root, tip, trailing)
    const v = new Float32Array([
      // left wing
       0,           0,    0,
      -span,        0,   -0.25,
      -span * 0.55, 0,    0.45,
      // right wing
       0,           0,    0,
       span,        0,   -0.25,
       span * 0.55, 0,    0.45,
    ]);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(v, 3));
    geo.setIndex([0, 2, 1,  3, 4, 5]);
    return geo;
  }

  const birdMat = new THREE.MeshBasicMaterial({
    color: 0x090e0c,
    side: THREE.DoubleSide,
  });

  const birds = BIRD_DEFS.map(def => {
    const geo  = makeBirdGeo(def.span);
    const mesh = new THREE.Mesh(geo, birdMat);
    mesh.position.set(def.x, def.y, def.z);
    // Face the direction of travel
    mesh.rotation.y = def.dir > 0 ? 0 : Math.PI;
    scene.add(mesh);
    return { mesh, geo, def };
  });

  // ── Lighting ───────────────────────────────────────────────────────────────
  scene.add(new THREE.AmbientLight(0xffffff, 0.18));

  const sun = new THREE.DirectionalLight(0x5a9e70, 1.3);
  sun.position.set(10, 40, 20);
  scene.add(sun);

  const rim = new THREE.DirectionalLight(0x1a3a28, 0.6);
  rim.position.set(-20, 10, -30);
  scene.add(rim);

  // ── Mouse ──────────────────────────────────────────────────────────────────
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
    t += 0.005;

    // Mountain breathing
    for (let i = 0; i < vCount; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);
      const w = Math.sin(t + x * 0.07 + z * 0.05) * 0.55
              + Math.sin(t * 0.6 - x * 0.04 + z * 0.09) * 0.30;
      posAttr.setY(i, baseY[i] + w);
    }
    posAttr.needsUpdate = true;

    // Birds
    birds.forEach(({ mesh, geo, def }) => {
      // Move
      mesh.position.x += def.dir * def.speed * 0.016;

      // Wrap
      if (mesh.position.x >  BOUND) mesh.position.x = -BOUND;
      if (mesh.position.x < -BOUND) mesh.position.x =  BOUND;

      // Gentle altitude drift
      mesh.position.y = def.y + Math.sin(t * 0.4 + def.phase) * 0.5;

      // Flap — animate wing tip Y (indices 1 and 4 in the position buffer)
      const pos = geo.attributes.position;
      const flapY = Math.sin(t * def.flapSpd * (Math.PI * 2) + def.phase) * def.flapAmp;
      // left tip (vertex 1)
      pos.setY(1, flapY);
      pos.setY(2, flapY * 0.45); // trailing edge follows partially
      // right tip (vertex 4)
      pos.setY(4, flapY);
      pos.setY(5, flapY * 0.45);
      pos.needsUpdate = true;

      // Slight bank into direction of travel
      mesh.rotation.z = def.dir * Math.sin(t * 0.3 + def.phase) * 0.08;
    });

    // Camera sway
    curX += (tgtX - curX) * 0.03;
    curY += (tgtY - curY) * 0.03;
    camera.position.x = curX * 5;
    camera.position.y = 5 - curY * 2.5;
    camera.lookAt(0, 9, 0);

    renderer.render(scene, camera);
  }

  animate();
})();
