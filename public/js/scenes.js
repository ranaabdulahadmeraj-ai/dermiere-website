// Dermiére 3D scenes (three.js). Each <figure data-scene="..."> gets one scene.
// Motion is slow and purposeful: a turntable you can also drag. It pauses off-screen
// and stays still for visitors who prefer reduced motion.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

function webglOK() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}

function setup(fig, build, opts = {}) {
  const canvas = fig.querySelector('canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(getComputedStyle(fig).backgroundColor || '#efe8de');
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  const { object, update, frame, spin = true } = build(scene, camera, fig);

  // Drag to turn, with gentle inertia
  let dragging = false, lastX = 0, velocity = 0, userAngle = 0;
  canvas.addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e) => { if (!dragging) return; const dx = e.clientX - lastX; lastX = e.clientX; velocity = dx * 0.006; userAngle += velocity; render(); });
  const end = () => { dragging = false; };
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);

  function resize() {
    const w = fig.clientWidth, h = fig.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    frame(camera, w / h);
    camera.updateProjectionMatrix();
    render();
  }
  new ResizeObserver(resize).observe(fig);

  let visible = true, last = performance.now(), auto = 0;
  function render() { object.rotation.y = (spin ? auto : 0) + userAngle; renderer.render(scene, camera); }
  function loop(now) {
    const dt = Math.min((now - last) / 1000, 0.05); last = now;
    if (visible) {
      if (!reduced) auto += dt * 0.22;
      if (!dragging) { userAngle += velocity; velocity *= 0.92; }
      update && update(dt, now / 1000);
      render();
    }
    requestAnimationFrame(loop);
  }
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; last = performance.now(); }).observe(fig);
  resize();
  if (reduced) { render(); } else requestAnimationFrame(loop);
  fig.classList.add('is-ready');
}

function addLights(scene, shadowY, shadows = true) {
  const key = new THREE.DirectionalLight(0xfff4e6, 2.2);
  key.position.set(2.5, 4, 3);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.radius = 6;
  key.shadow.camera.near = 0.5; key.shadow.camera.far = 12;
  Object.assign(key.shadow.camera, { left: -2, right: 2, top: 2, bottom: -2 });
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffe2c4, 1.2);
  rim.position.set(-3, 2, -2.5);
  scene.add(rim);
  scene.add(new THREE.HemisphereLight(0xfff8f0, 0xd9c8b4, 0.6));
  if (!shadows) return;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.ShadowMaterial({ opacity: 0.14 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = shadowY; ground.receiveShadow = true;
  scene.add(ground);
}

// ---------- Serum dropper bottle ----------
function bottle(scene, camera) {
  const group = new THREE.Group();
  const lathe = (pts, seg = 96) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg);

  const glass = new THREE.MeshPhysicalMaterial({
    color: 0xfff6ea, metalness: 0, roughness: 0.04, transmission: 1, thickness: 0.35, ior: 1.5,
    clearcoat: 1, clearcoatRoughness: 0.03, attenuationColor: new THREE.Color(0xf3dcc0), attenuationDistance: 2.5,
    side: THREE.DoubleSide,
  });
  const bodyPts = [[0, 0], [0.46, 0], [0.54, 0.03], [0.57, 0.1], [0.57, 1.02], [0.54, 1.14], [0.42, 1.26], [0.27, 1.33], [0.235, 1.37], [0.235, 1.47], [0, 1.47]];
  const body = new THREE.Mesh(lathe(bodyPts), glass);
  body.castShadow = true;
  group.add(body);

  const liquid = new THREE.Mesh(
    lathe([[0, 0.05], [0.48, 0.05], [0.53, 0.09], [0.535, 0.14], [0.535, 0.7], [0, 0.7]]),
    new THREE.MeshPhysicalMaterial({ color: 0xc98a3f, roughness: 0.4, clearcoat: 0.3, clearcoatRoughness: 0.6, sheen: 0.4, sheenColor: new THREE.Color(0xf2c98c) }),
  );
  group.add(liquid);

  const pipette = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.03, 1.4, 32, 1, true), glass);
  pipette.position.y = 0.88; group.add(pipette);
  const tipLiquid = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.022, 0.55, 24), new THREE.MeshStandardMaterial({ color: 0xc8904a, roughness: 0.2 }));
  tipLiquid.position.y = 0.45; group.add(tipLiquid);

  const gold = new THREE.MeshPhysicalMaterial({ color: 0xc9a46a, metalness: 1, roughness: 0.28, clearcoat: 0.4 });
  const collar = new THREE.Mesh(lathe([[0, 1.42], [0.27, 1.42], [0.285, 1.44], [0.285, 1.66], [0.27, 1.68], [0, 1.68]], 96), gold);
  collar.castShadow = true; group.add(collar);
  for (let i = 0; i < 3; i++) { // fine ridges on the collar
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.286, 0.006, 8, 96), gold);
    ring.rotation.x = Math.PI / 2; ring.position.y = 1.48 + i * 0.07; group.add(ring);
  }

  const rubber = new THREE.MeshPhysicalMaterial({ color: 0x2b2421, roughness: 0.55, sheen: 0.6, sheenColor: new THREE.Color(0x6b5a50) });
  const bulb = new THREE.Mesh(lathe([[0, 1.68], [0.2, 1.68], [0.205, 1.72], [0.17, 1.78], [0.16, 1.86], [0.175, 1.98], [0.17, 2.08], [0.12, 2.16], [0.05, 2.19], [0, 2.195]], 64), rubber);
  bulb.castShadow = true; group.add(bulb);

  group.position.y = -1.1;
  group.rotation.z = -0.03;
  scene.add(group);
  addLights(scene, -1.1);

  return {
    object: group,
    frame(cam, aspect) {
      const dist = aspect < 0.9 ? 6.4 : 5.8;
      cam.position.set(0, 0.7, dist);
      cam.lookAt(0, -0.05, 0);
    },
  };
}

// ---------- Polynucleotide (DNA) helix ----------
function helix(scene, camera) {
  const group = new THREE.Group();
  const pearl = new THREE.MeshPhysicalMaterial({ color: 0xf5ede2, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.1, sheen: 1, sheenColor: new THREE.Color(0xffe9d2), iridescence: 0.35, iridescenceIOR: 1.3 });
  const champagne = new THREE.MeshPhysicalMaterial({ color: 0xc9a46a, metalness: 1, roughness: 0.3 });
  const taupe = new THREE.MeshStandardMaterial({ color: 0x9c8a7c, roughness: 0.5 });

  const N = 30, R = 0.62, step = 0.43, rise = 0.12;
  const sphere = new THREE.SphereGeometry(0.085, 32, 24);
  const beads = new THREE.InstancedMesh(sphere, pearl, N * 2);
    const m = new THREE.Matrix4();
  const rod = new THREE.CylinderGeometry(0.016, 0.016, 1, 12);
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < N; i++) {
    const a = i * step, y = (i - (N - 1) / 2) * rise;
    const p1 = new THREE.Vector3(Math.cos(a) * R, y, Math.sin(a) * R);
    const p2 = new THREE.Vector3(Math.cos(a + Math.PI) * R, y, Math.sin(a + Math.PI) * R);
    beads.setMatrixAt(i * 2, m.makeTranslation(p1.x, p1.y, p1.z));
    beads.setMatrixAt(i * 2 + 1, m.makeTranslation(p2.x, p2.y, p2.z));
    // base pair: two half rods meeting in the middle
    const mid = p1.clone().add(p2).multiplyScalar(0.5);
    [[p1, champagne], [p2, taupe]].forEach(([p, mat]) => {
      const dir = mid.clone().sub(p); const len = dir.length();
      const r = new THREE.Mesh(rod, mat);
      r.scale.set(1, len, 1);
      r.position.copy(p).add(dir.clone().multiplyScalar(0.5));
      r.quaternion.setFromUnitVectors(up, dir.normalize());
      group.add(r);
    });
  }
  group.add(beads);
  // backbone curves
  [0, Math.PI].forEach((off) => {
    const pts = [];
    for (let i = 0; i <= (N - 1) * 4; i++) { const t = i / 4, a = t * step + off; pts.push(new THREE.Vector3(Math.cos(a) * R, (t - (N - 1) / 2) * rise, Math.sin(a) * R)); }
    group.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 400, 0.022, 10), champagne));
  });

  const holder = new THREE.Group();
  holder.add(group);
  holder.rotation.z = 0.32;
  scene.add(holder);
  addLights(scene, -2.4, false);
  return {
    object: group,
    frame(cam) { cam.position.set(0, 0, 9.2); cam.lookAt(0, 0, 0); },
  };
}


// ---------- Home hero: bottle on a travertine plinth, an arch behind, drifting pearls ----------
// Scrolling past the hero turns the bottle and lifts the camera slightly.
function stoneTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const g = c.getContext('2d'); let sd = 11; const r = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
  g.fillStyle = '#e9dfd0'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 140; i++) { g.fillStyle = `rgba(${170 + r() * 40},${150 + r() * 30},${120 + r() * 30},${0.04 + r() * 0.08})`; g.fillRect(0, r() * 512, 512, 1 + r() * 3); }
  for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(140,118,92,${0.08 + r() * 0.16})`; g.beginPath(); g.ellipse(r() * 512, r() * 512, 0.6 + r() * 1.6, 0.4 + r() * 0.7, 0, 0, 7); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
function hero(scene, camera, fig) {
  const stone = new THREE.MeshStandardMaterial({ map: stoneTexture(), roughness: 0.82 });
  const pearl = new THREE.MeshPhysicalMaterial({ color: 0xf7efe4, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08, sheen: 1, sheenColor: new THREE.Color(0xffe9d2), iridescence: 0.5, iridescenceIOR: 1.3 });
  const gold = new THREE.MeshPhysicalMaterial({ color: 0xc9a46a, metalness: 1, roughness: 0.26, clearcoat: 0.4 });
  const world = new THREE.Group(); world.position.y = -1.25; scene.add(world);

  // arch
  const w = 2.3, h = 3.5, th = 0.22, rr = w / 2, ir = rr - th;
  const shape = new THREE.Shape(); shape.moveTo(-rr, 0); shape.lineTo(-rr, h - rr); shape.absarc(0, h - rr, rr, Math.PI, 0, true); shape.lineTo(rr, 0); shape.lineTo(-rr, 0);
  const hole = new THREE.Path(); hole.moveTo(-ir, 0.001); hole.lineTo(-ir, h - rr); hole.absarc(0, h - rr, ir, Math.PI, 0, true); hole.lineTo(ir, 0.001); hole.lineTo(-ir, 0.001); shape.holes.push(hole);
  const ag = new THREE.ExtrudeGeometry(shape, { depth: 0.4, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015, bevelSegments: 3, curveSegments: 64 });
  const uv = ag.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 0.35, uv.getY(i) * 0.35);
  const archM = new THREE.Mesh(ag, stone); archM.position.set(0, 0, -1.1); archM.castShadow = archM.receiveShadow = true; world.add(archM);

  // plinth
  const pl = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [0.8, 0], [0.83, 0.03], [0.83, 0.52], [0.8, 0.55], [0, 0.55]].map(([x, y]) => new THREE.Vector2(x, y)), 96), stone);
  pl.castShadow = pl.receiveShadow = true; world.add(pl);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.832, 0.008, 12, 160), gold); ring.rotation.x = Math.PI / 2; ring.position.y = 0.45; world.add(ring);

  // bottle (reuse the serum bottle model, scaled)
  const tmp = new THREE.Scene();
  const b = bottle(tmp, camera).object; b.position.set(0, 0.55, 0); b.rotation.z = 0; b.scale.setScalar(0.82);
  tmp.children.filter((c) => c.isLight || c.isMesh).forEach((c) => tmp.remove(c));
  const spinner = new THREE.Group(); spinner.add(b); world.add(spinner);

  // pearls in a slow orbit
  const pearls = [];
  for (let i = 0; i < 7; i++) {
    const r = 0.05 + (i % 3) * 0.025;
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 40, 28), pearl); m.castShadow = true;
    pearls.push({ m, a: (i / 7) * Math.PI * 2, rad: 1.05 + (i % 2) * 0.35, y: 0.9 + (i * 0.37) % 1.6, sp: 0.12 + (i % 3) * 0.04 });
    world.add(m);
  }
  [[1.15, 0.6, 0.08], [1.32, 0.45, 0.05], [-1.2, 0.7, 0.07]].forEach(([x, z, r]) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 40, 28), pearl); m.position.set(x, r, z); m.castShadow = true; world.add(m); });

  addLights(scene, -1.25);
  scene.children.forEach((c) => { if (c.isDirectionalLight && c.castShadow) Object.assign(c.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3 }); });

  let p = 0, aspect = 1;
  const place = () => {
    const d = (aspect < 0.9 ? 9.4 : 8.6) - p * 0.8;
    camera.position.set(0.25 - p * 0.4, 0.75 + p * 0.9, d); camera.lookAt(0, 0.05 + p * 0.25, 0);
  };
  return {
    object: spinner, spin: true,
    frame(cam, a) { aspect = a; place(); },
    update(dt, t) {
      const r = fig.getBoundingClientRect();
      const target = Math.min(Math.max(-r.top / Math.max(r.height, 1), 0), 1);
      p += (target - p) * Math.min(dt * 6, 1);
      place();
      spinner.rotation.x = 0; b.rotation.y = p * Math.PI * 1.2;
      pearls.forEach((o) => { const a = o.a + t * o.sp; o.m.position.set(Math.cos(a) * o.rad, o.y + Math.sin(t * 0.8 + o.a) * 0.08 + p * 0.3, Math.sin(a) * o.rad); });
    },
  };
}

const builders = { bottle, helix, hero };
if (webglOK()) {
  document.querySelectorAll('figure[data-scene]').forEach((fig) => {
    const b = builders[fig.dataset.scene];
    if (b) try { setup(fig, b); } catch (e) { console.warn('3D scene unavailable', e); }
  });
}
