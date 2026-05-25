(function () {
  'use strict';

  if (typeof THREE === 'undefined') return;

  const canvas = document.getElementById('hero-canvas');
  const photo  = document.querySelector('.s-hero__bg');
  if (!canvas) return;

  // ── Only activate on large screens ─────────────────────────────────────────
  function isDesktop() { return window.innerWidth >= 1024; }

  function showPhoto() {
    canvas.style.display = 'none';
    if (photo) photo.style.display = '';
  }

  function showCanvas() {
    canvas.style.display = 'block';
    if (photo) photo.style.display = 'none';
  }

  if (!isDesktop()) { showPhoto(); return; }
  showCanvas();

  // ── Scene ──────────────────────────────────────────────────────────────────
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x090c0a);
  scene.fog = new THREE.FogExp2(0x090c0a, 0.018);

  const hero = canvas.parentElement;
  const W = hero.offsetWidth;
  const H = hero.offsetHeight;

  const camera = new THREE.PerspectiveCamera(52, W / H, 0.1, 300);
  camera.position.set(0, 5, 30);
  camera.lookAt(0, 9, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setSize(W, H);

  // ── Terrain geometry ───────────────────────────────────────────────────────
  const SEG_X = 48;
  const SEG_Z = 24;
  const geo = new THREE.PlaneGeometry(160, 80, SEG_X, SEG_Z);
  geo.rotateX(-Math.PI / 2);

  const posAttr = geo.attributes.position;
  const vCount  = posAttr.count;
  const baseY   = new Float32Array(vCount);

  // Layered sine waves — creates distinct ridges that read as mountains
  function heightAt(x, z) {
    const ridge1 = Math.sin(x * 0.09 + 0.4) * 11;
    const ridge2 = Math.sin(x * 0.17 - 1.1) * 7;
    const ridge3 = Math.sin(x * 0.28 + z * 0.18) * 4;
    const ridge4 = Math.sin(x * 0.06 - z * 0.09) * 9;
    const detail = Math.sin(x * 0.42 + z * 0.35) * 1.8
                 + Math.cos(x * 0.55 - z * 0.48) * 1.2;
    // Depth fade: peaks are taller far away, shorter near the camera (z > 0)
    const depthFade = Math.max(0, (-z / 40));
    return (ridge1 + ridge2 + ridge3 + ridge4 + detail) * (0.7 + depthFade * 0.6);
  }

  for (let i = 0; i < vCount; i++) {
    const x = posAttr.getX(i);
    const z = posAttr.getZ(i);
    const y = heightAt(x, z);
    posAttr.setY(i, y);
    baseY[i] = y;
  }

  // Vertex colors: height-mapped dark greens
  const colAttr = new THREE.BufferAttribute(new Float32Array(vCount * 3), 3);
  function colorAt(y) {
    // -10 → 0 → 20 → clamp
    const t = Math.max(0, Math.min(1, (y + 8) / 24));
    // Very dark valley (#0a0f0c) → forest peak (#2d5a3d)
    return [0.04 + t * 0.13, 0.06 + t * 0.27, 0.05 + t * 0.14];
  }
  for (let i = 0; i < vCount; i++) {
    const [r, g, b] = colorAt(posAttr.getY(i));
    colAttr.setXYZ(i, r, g, b);
  }
  geo.setAttribute('color', colAttr);

  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    flatShading: true,
    roughness: 1,
    metalness: 0,
  });

  const terrain = new THREE.Mesh(geo, mat);
  terrain.position.set(0, -6, -14);
  scene.add(terrain);

  // ── Lighting ───────────────────────────────────────────────────────────────
  scene.add(new THREE.AmbientLight(0xffffff, 0.2));

  const sun = new THREE.DirectionalLight(0x5a9e70, 1.6);
  sun.position.set(10, 40, 20);
  scene.add(sun);

  const rim = new THREE.DirectionalLight(0x1a3a28, 0.7);
  rim.position.set(-20, 10, -30);
  scene.add(rim);

  // Subtle top-down fill so peaks catch a hint of light
  const fill = new THREE.DirectionalLight(0x2d5a3d, 0.3);
  fill.position.set(0, 60, 0);
  scene.add(fill);

  // ── Stars (far-field particles) ────────────────────────────────────────────
  const starCount = 300;
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    starPositions[i * 3]     = (Math.random() - 0.5) * 200;
    starPositions[i * 3 + 1] = Math.random() * 60 + 10;
    starPositions[i * 3 + 2] = (Math.random() - 0.5) * 100 - 20;
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.22, opacity: 0.55, transparent: true });
  scene.add(new THREE.Points(starGeo, starMat));

  // ── Mouse tracking ─────────────────────────────────────────────────────────
  let targetX = 0, targetY = 0;
  let currentX = 0, currentY = 0;

  hero.addEventListener('mousemove', e => {
    const rect = hero.getBoundingClientRect();
    targetX = ((e.clientX - rect.left)  / rect.width  - 0.5) * 2;
    targetY = ((e.clientY - rect.top)   / rect.height - 0.5) * 2;
  }, { passive: true });

  hero.addEventListener('mouseleave', () => {
    targetX = 0;
    targetY = 0;
  }, { passive: true });

  // ── Resize ─────────────────────────────────────────────────────────────────
  window.addEventListener('resize', () => {
    if (!isDesktop()) { showPhoto(); return; }
    showCanvas();
    const w = hero.offsetWidth;
    const h = hero.offsetHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }, { passive: true });

  // ── Animate ────────────────────────────────────────────────────────────────
  let t = 0;

  function animate() {
    requestAnimationFrame(animate);
    t += 0.005;

    // Gentle vertex breathing — slow sine offset per vertex
    for (let i = 0; i < vCount; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);
      const wave = Math.sin(t + x * 0.07 + z * 0.05) * 0.55
                 + Math.sin(t * 0.6 - x * 0.04 + z * 0.09) * 0.3;
      posAttr.setY(i, baseY[i] + wave);
    }
    posAttr.needsUpdate = true;

    // Smooth mouse follow — subtle camera drift
    currentX += (targetX - currentX) * 0.03;
    currentY += (targetY - currentY) * 0.03;

    camera.position.x = currentX * 5;
    camera.position.y = 5 - currentY * 2.5;
    camera.lookAt(0, 9, 0);

    renderer.render(scene, camera);
  }

  animate();
})();
