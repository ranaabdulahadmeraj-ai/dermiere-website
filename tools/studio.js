// Offline render studio: builds one still-life subject per ?s= and renders it once.
// tools/render-stills.js screenshots the canvas into public/img/<slot>.png.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const q = new URLSearchParams(location.search);
const W = +q.get('w') || 1400, H = +q.get('h') || 1400, S = q.get('s') || 'laser';

const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.95;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap;

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.9;
const camera = new THREE.PerspectiveCamera(26, W / H, 0.1, 100);

// ---------- textures ----------
function canvasTex(w, h, draw, srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

const bgTones = {
  ivory: ['#f6f0e7', '#e6dccd'], sand: ['#f1e6d6', '#dccab2'], rose: ['#f3e5de', '#dfc7bc'], stone: ['#eeebe4', '#d6d0c5'],
};
function background(tone) {
  const [a, b] = bgTones[tone] || bgTones.ivory;
  return canvasTex(512, 512, (g, w, h) => {
    const grd = g.createRadialGradient(w * 0.45, h * 0.38, 10, w * 0.5, h * 0.5, w * 0.78);
    grd.addColorStop(0, a); grd.addColorStop(1, b);
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
  });
}

const travertine = canvasTex(1024, 1024, (g, w, h) => {
  g.fillStyle = '#e9dfd0'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 260; i++) { // soft horizontal veins
    const y = rnd() * h, t = 1 + rnd() * 5;
    g.fillStyle = `rgba(${170 + rnd() * 40},${150 + rnd() * 30},${120 + rnd() * 30},${0.04 + rnd() * 0.08})`;
    g.fillRect(0, y, w, t);
  }
  for (let i = 0; i < 900; i++) { // tiny pits
    g.fillStyle = `rgba(140,118,92,${0.08 + rnd() * 0.18})`;
    const x = rnd() * w, y = rnd() * h;
    g.beginPath(); g.ellipse(x, y, 1 + rnd() * 3, 0.6 + rnd() * 1.2, 0, 0, Math.PI * 2); g.fill();
  }
});
travertine.wrapS = travertine.wrapT = THREE.RepeatWrapping;

const contactTex = canvasTex(256, 256, (g, w, h) => {
  const grd = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  grd.addColorStop(0, 'rgba(60,40,25,0.55)'); grd.addColorStop(0.45, 'rgba(60,40,25,0.22)'); grd.addColorStop(1, 'rgba(60,40,25,0)');
  g.fillStyle = grd; g.fillRect(0, 0, w, h);
});

// ---------- materials ----------
const M = {
  glass: new THREE.MeshPhysicalMaterial({ color: 0xfff8ef, roughness: 0.03, transmission: 1, thickness: 0.35, ior: 1.5, clearcoat: 1, clearcoatRoughness: 0.03, attenuationColor: new THREE.Color(0xf3dcc0), attenuationDistance: 2.5, side: THREE.DoubleSide }),
  frosted: new THREE.MeshPhysicalMaterial({ color: 0xfbf3ea, roughness: 0.42, transmission: 1, thickness: 0.6, ior: 1.5, attenuationColor: new THREE.Color(0xe8d6c2), attenuationDistance: 1.2 }),
  gold: new THREE.MeshPhysicalMaterial({ color: 0xc9a46a, metalness: 1, roughness: 0.26, clearcoat: 0.4 }),
  brushed: new THREE.MeshPhysicalMaterial({ color: 0xd2b27e, metalness: 1, roughness: 0.42 }),
  ceramic: new THREE.MeshPhysicalMaterial({ color: 0xeee6db, roughness: 0.38, clearcoat: 0.5, clearcoatRoughness: 0.2 }),
  matte: new THREE.MeshStandardMaterial({ color: 0xece4d8, roughness: 0.9 }),
  stone: new THREE.MeshStandardMaterial({ color: 0xffffff, map: travertine, roughness: 0.82 }),
  stoneWarm: new THREE.MeshStandardMaterial({ color: 0xf2dfcc, map: travertine, roughness: 0.82 }),
  pearl: new THREE.MeshPhysicalMaterial({ color: 0xf7efe4, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08, sheen: 1, sheenColor: new THREE.Color(0xffe9d2), iridescence: 0.5, iridescenceIOR: 1.3 }),
  amber: new THREE.MeshPhysicalMaterial({ color: 0xc98a3f, roughness: 0.4, clearcoat: 0.3, clearcoatRoughness: 0.6, sheen: 0.4, sheenColor: new THREE.Color(0xf2c98c) }),
  plasma: new THREE.MeshPhysicalMaterial({ color: 0xe6b866, roughness: 0.15, clearcoat: 1, sheen: 0.5, sheenColor: new THREE.Color(0xfbe2a8) }),
  garnet: new THREE.MeshPhysicalMaterial({ color: 0x6e2722, roughness: 0.2, clearcoat: 1 }),
  rubber: new THREE.MeshPhysicalMaterial({ color: 0x2b2421, roughness: 0.55, sheen: 0.6, sheenColor: new THREE.Color(0x6b5a50) }),
  mirror: new THREE.MeshPhysicalMaterial({ color: 0xf4efe8, metalness: 1, roughness: 0.02 }),
  linen: new THREE.MeshPhysicalMaterial({ color: 0xf3ece2, roughness: 0.95, sheen: 1, sheenRoughness: 0.6, sheenColor: new THREE.Color(0xffffff) }),
  linenSand: new THREE.MeshPhysicalMaterial({ color: 0xe3d3bf, roughness: 0.95, sheen: 1, sheenRoughness: 0.6, sheenColor: new THREE.Color(0xfff4e6) }),
  clay: new THREE.MeshStandardMaterial({ color: 0xd8c3ab, roughness: 0.75 }),
  stem: new THREE.MeshStandardMaterial({ color: 0xb59670, roughness: 0.8 }),
};

// ---------- helpers ----------
const V2 = (pts) => pts.map(([x, y]) => new THREE.Vector2(x, y));
const lathe = (pts, mat, seg = 128) => mesh(new THREE.LatheGeometry(V2(pts), seg), mat);
function mesh(geo, mat, cast = true) { const m = new THREE.Mesh(geo, mat); m.castShadow = cast; return m; }
function at(obj, x = 0, y = 0, z = 0, ry = 0) { obj.position.set(x, y, z); obj.rotation.y = ry; return obj; }

// Round plinth with a softened edge, top surface at y = h
function plinth(r, h, mat = M.stone) {
  const b = Math.min(0.03, h / 4);
  const pts = [[0, 0], [r - b, 0], [r, b], [r, h - b], [r - b, h], [0, h]];
  const m = lathe(pts, mat);
  m.receiveShadow = true;
  return m;
}
function block(w, h, d, mat = M.stone, r = 0.03) { const m = mesh(new RoundedBoxGeometry(w, h, d, 4, r), mat); m.receiveShadow = true; return m; }
function contact(obj, x, z, r, y = 0.002, o = 1) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2), new THREE.MeshBasicMaterial({ map: contactTex, transparent: true, opacity: o, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); obj.add(m); return m;
}
function pearlAt(g, x, y, z, r = 0.07) { const p = mesh(new THREE.SphereGeometry(r, 48, 32), M.pearl); p.position.set(x, y + r, z); g.add(p); contact(g, x, z, r * 1.6, y + 0.001, 0.7); return p; }

function lights({ keyPos = [3, 5, 3.5], key = 2.4, rim = 1.3, area = 3 } = {}) {
  const k = new THREE.DirectionalLight(0xfff1e0, key);
  k.position.set(...keyPos); k.castShadow = true;
  k.shadow.mapSize.set(2048, 2048); k.shadow.radius = 14; k.shadow.blurSamples = 20; k.shadow.bias = -0.0004;
  Object.assign(k.shadow.camera, { left: -area, right: area, top: area, bottom: -area, near: 0.5, far: 20 });
  scene.add(k);
  const r = new THREE.DirectionalLight(0xffe0c0, rim); r.position.set(-4, 2.5, -3); scene.add(r);
  const f = new THREE.DirectionalLight(0xfff8f0, 0.5); f.position.set(-2, 1, 5); scene.add(f);
  scene.add(new THREE.HemisphereLight(0xfffaf3, 0xd9c8b4, 0.5));
}
function floor(opacity = 0.2) {
  const g = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity, color: 0x3a2a1c }));
  g.rotation.x = -Math.PI / 2; g.receiveShadow = true; scene.add(g);
}
function cam(pos, look, fov = 26) { camera.fov = fov; camera.position.set(...pos); camera.lookAt(...look); camera.updateProjectionMatrix(); }

// ---------- models ----------
function serumBottle(s = 1) {
  const g = new THREE.Group();
  g.add(lathe([[0, 0], [0.46, 0], [0.54, 0.03], [0.57, 0.1], [0.57, 1.02], [0.54, 1.14], [0.42, 1.26], [0.27, 1.33], [0.235, 1.37], [0.235, 1.47], [0, 1.47]], M.glass));
  g.add(lathe([[0, 0.05], [0.48, 0.05], [0.53, 0.09], [0.535, 0.14], [0.535, 0.72], [0, 0.72]], M.amber));
  const pip = mesh(new THREE.CylinderGeometry(0.045, 0.03, 1.4, 32, 1, true), M.glass); pip.position.y = 0.88; g.add(pip);
  const tip = mesh(new THREE.CylinderGeometry(0.03, 0.022, 0.55, 24), M.amber); tip.position.y = 0.45; g.add(tip);
  g.add(lathe([[0, 1.42], [0.27, 1.42], [0.285, 1.44], [0.285, 1.66], [0.27, 1.68], [0, 1.68]], M.gold));
  for (let i = 0; i < 3; i++) { const r = mesh(new THREE.TorusGeometry(0.286, 0.006, 8, 96), M.gold); r.rotation.x = Math.PI / 2; r.position.y = 1.48 + i * 0.07; g.add(r); }
  g.add(lathe([[0, 1.68], [0.2, 1.68], [0.205, 1.72], [0.17, 1.78], [0.16, 1.86], [0.175, 1.98], [0.17, 2.08], [0.12, 2.16], [0.05, 2.19], [0, 2.195]], M.rubber, 64));
  g.scale.setScalar(s);
  return g;
}

function creamJar(s = 1, lidMat = M.gold) {
  const g = new THREE.Group();
  g.add(lathe([[0, 0], [0.5, 0], [0.56, 0.04], [0.58, 0.12], [0.58, 0.5], [0.56, 0.54], [0.44, 0.56], [0.44, 0.6], [0, 0.6]], M.frosted));
  g.add(lathe([[0, 0.14], [0.4, 0.14], [0.42, 0.2], [0.42, 0.5], [0, 0.5]], M.ceramic)); // cream seen through frosted glass
  g.add(lathe([[0, 0.58], [0.575, 0.58], [0.59, 0.6], [0.59, 0.8], [0.575, 0.82], [0.5, 0.83], [0, 0.835]], lidMat));
  g.scale.setScalar(s);
  return g;
}

function tube(s = 1) { // squeeze tube, standing on its cap
  const g = new THREE.Group();
  const shape = [];
  for (let i = 0; i <= 24; i++) { const t = i / 24; shape.push([0.28 - t * 0.03, 0.22 + t * 1.25]); }
  g.add(lathe([[0, 0], [0.18, 0], [0.19, 0.02], [0.19, 0.22], [0, 0.22]], M.gold));
  const body = lathe([[0, 0.22], [0.2, 0.22], [0.27, 0.3], ...shape.slice(2), [0.18, 1.5], [0, 1.5]], M.ceramic);
  body.scale.z = 0.62; g.add(body);
  const crimp = block(0.5, 0.08, 0.06, M.ceramic, 0.02); crimp.position.y = 1.52; g.add(crimp);
  g.scale.setScalar(s);
  return g;
}

function helix(N = 26, R = 0.5, step = 0.43, rise = 0.11) {
  const g = new THREE.Group();
  const sphere = new THREE.SphereGeometry(0.075, 32, 24);
  const rod = new THREE.CylinderGeometry(0.014, 0.014, 1, 12);
  const taupe = new THREE.MeshStandardMaterial({ color: 0x9c8a7c, roughness: 0.5 });
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < N; i++) {
    const a = i * step, y = i * rise;
    const p1 = new THREE.Vector3(Math.cos(a) * R, y, Math.sin(a) * R);
    const p2 = new THREE.Vector3(-p1.x, y, -p1.z);
    [p1, p2].forEach((p) => { const b = mesh(sphere, M.pearl); b.position.copy(p); g.add(b); });
    const mid = p1.clone().add(p2).multiplyScalar(0.5);
    [[p1, M.gold], [p2, taupe]].forEach(([p, mat]) => {
      const dir = mid.clone().sub(p); const len = dir.length();
      const r = mesh(rod, mat); r.scale.set(1, len, 1);
      r.position.copy(p).add(dir.clone().multiplyScalar(0.5)); r.quaternion.setFromUnitVectors(up, dir.normalize()); g.add(r);
    });
  }
  [0, Math.PI].forEach((off) => {
    const pts = [];
    for (let i = 0; i <= (N - 1) * 4; i++) { const t = i / 4, a = t * step + off; pts.push(new THREE.Vector3(Math.cos(a) * R, t * rise, Math.sin(a) * R)); }
    g.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 400, 0.02, 10), M.gold));
  });
  return g;
}

function testTube(fill = 0.62, split = 0.4) {
  const g = new THREE.Group();
  const r = 0.11, h = 1.3, pts = [];
  for (let i = 0; i <= 12; i++) { const a = (i / 12) * Math.PI / 2; pts.push([Math.sin(a) * r, r - Math.cos(a) * r]); }
  pts.push([r, h], [r + 0.012, h + 0.01], [r + 0.012, h + 0.03], [0, h + 0.03]);
  g.add(lathe(pts, M.glass, 64));
  const ri = r - 0.012, inner = (top, bottom, mat) => {
    const p = [];
    for (let i = 0; i <= 12; i++) { const a = (i / 12) * Math.PI / 2; const y = r - Math.cos(a) * ri; if (y >= bottom) p.push([Math.sin(a) * ri, y]); }
    if (!p.length || p[0][1] > bottom + 1e-3) p.unshift([bottom <= 0.012 ? 0 : ri, Math.max(bottom, 0.012)]);
    p.unshift([0, Math.max(bottom, 0.012)]);
    p.push([ri, top], [0, top]);
    return lathe(p, mat, 48);
  };
  g.add(inner(h * split, 0.012, M.garnet));
  g.add(inner(h * fill, h * split + 0.002, M.plasma));
  const cap = lathe([[0, h - 0.06], [0.135, h - 0.06], [0.14, h - 0.04], [0.14, h + 0.16], [0.13, h + 0.18], [0, h + 0.18]], M.gold, 48);
  g.add(cap);
  return g;
}

function pen(len = 1.5) { // microneedling pen, lying down along x
  const g = new THREE.Group();
  const body = lathe([[0, 0], [0.07, 0], [0.1, 0.06], [0.11, 0.2], [0.11, len - 0.25], [0.095, len - 0.12], [0.06, len], [0, len]], M.ceramic, 64);
  g.add(body);
  const band = lathe([[0, len * 0.62], [0.112, len * 0.62], [0.112, len * 0.66], [0, len * 0.66]], M.gold, 64); g.add(band);
  const nose = lathe([[0, -0.18], [0.04, -0.18], [0.06, -0.1], [0.07, 0], [0, 0]], M.glass, 48); g.add(nose);
  g.rotation.z = -Math.PI / 2; g.position.y = 0.11;
  return g;
}

function laserHandpiece() {
  const g = new THREE.Group();
  // handle: tall softened column
  g.add(lathe([[0, 0], [0.2, 0], [0.24, 0.04], [0.25, 0.12], [0.22, 0.9], [0.2, 1.5], [0.22, 1.62], [0, 1.62]], M.ceramic));
  g.add(lathe([[0, 1.5], [0.215, 1.5], [0.225, 1.56], [0, 1.56]], M.gold));
  const grip = lathe([[0, 0.25], [0.2465, 0.25], [0.2425, 0.42], [0, 0.42]], M.brushed); g.add(grip);
  // head, angled forward
  const head = new THREE.Group();
  const shell = block(0.56, 0.46, 0.46, M.ceramic, 0.18); head.add(shell);
  const win = block(0.36, 0.06, 0.3, new THREE.MeshPhysicalMaterial({ color: 0xffd9c2, emissive: 0xff8a5c, emissiveIntensity: 1.4, roughness: 0.1, clearcoat: 1 }), 0.02);
  win.rotation.x = Math.PI / 2; win.position.set(0, 0, 0.25); head.add(win);
  const ring = block(0.42, 0.02, 0.36, M.gold, 0.01); ring.rotation.x = Math.PI / 2; ring.position.set(0, 0, 0.24); head.add(ring);
  head.position.set(0, 1.84, 0); g.add(head);
  return g;
}

function handMirror() {
  const g = new THREE.Group();
  const base = lathe([[0, 0], [0.42, 0], [0.45, 0.03], [0.45, 0.07], [0.4, 0.1], [0.06, 0.13], [0, 0.13]], M.gold); g.add(base);
  const stem = mesh(new THREE.CylinderGeometry(0.03, 0.035, 1.0, 32), M.gold); stem.position.y = 0.6; g.add(stem);
  const yoke = mesh(new THREE.TorusGeometry(0.66, 0.025, 16, 128, Math.PI), M.gold); yoke.rotation.z = Math.PI; yoke.position.y = 1.75; g.add(yoke);
  const glassHolder = new THREE.Group();
  const disc = mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.03, 128), M.mirror); disc.rotation.x = Math.PI / 2; glassHolder.add(disc);
  const back = mesh(new THREE.CylinderGeometry(0.63, 0.63, 0.03, 128), M.ceramic); back.rotation.x = Math.PI / 2; back.position.z = -0.03; glassHolder.add(back);
  const frame = mesh(new THREE.TorusGeometry(0.635, 0.035, 24, 160), M.gold); glassHolder.add(frame);
  glassHolder.position.y = 1.75; glassHolder.rotation.x = -0.18; g.add(glassHolder);
  // the yoke dips to the stem
  const join = mesh(new THREE.SphereGeometry(0.05, 24, 16), M.gold); join.position.y = 1.09; g.add(join);
  return g;
}

function vase(mat = M.clay) {
  const g = new THREE.Group();
  const pts = [];
  for (let i = 0; i <= 40; i++) { const t = i / 40; const r = 0.18 + Math.sin(t * Math.PI) * 0.32 - t * 0.06; pts.push([Math.max(r, 0.11), t * 1.3]); }
  g.add(lathe([[0, 0], ...pts, [0.1, 1.3], [0.08, 1.26], [0, 1.26]], mat));
  // dried stems
  const stemPts = [[0, 1.1, 0], [0.12, 1.9, 0.02], [0.32, 2.6, 0.05]];
  [[0, 0], [0.9, -0.25], [-0.7, 0.2]].forEach(([ry, lean], i) => {
    const s = new THREE.Group();
    const c = new THREE.CatmullRomCurve3(stemPts.map(([x, y, z]) => new THREE.Vector3(x * (1 + i * 0.4), y - i * 0.18, z)));
    s.add(mesh(new THREE.TubeGeometry(c, 40, 0.012, 8), M.stem));
    const top = c.getPoint(1);
    for (let k = 0; k < 9; k++) { // small seed heads
      const b = mesh(new THREE.SphereGeometry(0.035 + rnd() * 0.02, 12, 8), M.stem);
      b.position.set(top.x + (rnd() - 0.5) * 0.14, top.y + (rnd() - 0.3) * 0.16, top.z + (rnd() - 0.5) * 0.14); s.add(b);
    }
    s.rotation.y = ry; s.rotation.z = lean * 0.3; g.add(s);
  });
  return g;
}

function arch(w = 1.2, h = 2, thick = 0.18, depth = 0.35, mat = M.stone) {
  const s = new THREE.Shape();
  const r = w / 2;
  s.moveTo(-r, 0); s.lineTo(-r, h - r); s.absarc(0, h - r, r, Math.PI, 0, true); s.lineTo(r, 0); s.lineTo(-r, 0);
  const ir = r - thick, hole = new THREE.Path();
  hole.moveTo(-ir, 0.001); hole.lineTo(-ir, h - r); hole.absarc(0, h - r, ir, Math.PI, 0, true); hole.lineTo(ir, 0.001); hole.lineTo(-ir, 0.001);
  s.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 3, curveSegments: 64 });
  geo.translate(0, 0, -depth / 2);
  // planar UVs for the stone texture
  const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 0.4, uv.getY(i) * 0.4);
  const m = mesh(geo, mat); m.receiveShadow = true;
  return m;
}

function mapPin(s = 1) {
  const g = new THREE.Group();
  const pts = [];
  for (let i = 0; i <= 48; i++) { // teardrop: point at y=0, round head above
    const t = i / 48;
    const a = t * Math.PI;
    const y = 0.62 - Math.cos(a) * 0.38 + (1 - t) * 0;
    let x = Math.sin(a) * 0.38;
    if (t < 0.5) { const k = t / 0.5; x = Math.sin(a) * 0.38 * Math.pow(k, 0.55); }
    pts.push([x, t < 0.02 ? 0 : y - (t < 0.5 ? (0.5 - t) * 0.48 : 0)]);
  }
  pts[0] = [0, 0];
  pts.push([0, pts[pts.length - 1][1]]);
  g.add(lathe(pts, M.gold));
  const p = mesh(new THREE.SphereGeometry(0.16, 48, 32), M.pearl); p.position.set(0, 0.62, 0.3); g.add(p);
  g.scale.setScalar(s);
  return g;
}

function towel(w, d, h, mat) { return block(w, h, d, mat, h * 0.48); }

// ---------- subjects ----------
const subjects = {
  'treatment-laser-hair-removal'() {
    scene.background = background('rose');
    const g = new THREE.Group();
    g.add(plinth(0.95, 0.42)); contact(g, 0, 0, 1.3, 0.001, 0.6);
    const lp = laserHandpiece(); lp.position.y = 0.42; lp.rotation.y = -0.5; g.add(lp);
    contact(g, 0, 0, 0.45, 0.423, 0.9);
    const p2 = plinth(0.42, 0.18, M.stoneWarm); p2.position.set(1.15, 0, 0.55); g.add(p2); contact(g, 1.15, 0.55, 0.6, 0.001, 0.6);
    pearlAt(g, 1.1, 0.18, 0.5, 0.09); pearlAt(g, 1.28, 0.18, 0.62, 0.06);
    scene.add(g); lights(); floor();
    cam([0.4, 2.3, 8.8], [0.2, 1.05, 0]);
  },
  'treatment-prp-microneedling'() {
    scene.background = background('sand');
    const g = new THREE.Group();
    g.add(block(2.6, 0.22, 1.3)); g.children[0].position.y = 0.11; contact(g, 0, 0, 1.7, 0.001, 0.5);
    // rack
    const rack = new THREE.Group();
    const top = block(1.3, 0.03, 0.34, M.brushed, 0.012); top.position.y = 0.75; rack.add(top);
    const low = block(1.3, 0.03, 0.34, M.brushed, 0.012); low.position.y = 0.12; rack.add(low);
    [-0.66, 0.66].forEach((x) => { const leg = block(0.03, 0.75, 0.34, M.brushed, 0.012); leg.position.set(x, 0.375, 0); rack.add(leg); });
    [[-0.42, 0.66, 0.42], [0, 0.6, 0.38], [0.42, 0.7, 0.44]].forEach(([x, f, sp]) => { const t = testTube(f, sp); t.position.set(x, 0.135, 0); rack.add(t); });
    rack.position.set(-0.35, 0.22, -0.1); rack.rotation.y = 0.25; g.add(rack);
    const p = pen(1.25); p.position.set(0.1, 0.33, 0.42); p.rotation.y = 0.35; g.add(p);
    scene.add(g); lights({ area: 2.5 }); floor();
    cam([0.4, 2.6, 6.8], [0, 0.85, 0]);
  },
  'treatment-polynucleotide-under-eye'() {
    scene.background = background('ivory');
    const g = new THREE.Group();
    g.add(plinth(0.8, 0.3)); contact(g, 0, 0, 1.1, 0.001, 0.6);
    const h = helix(17); h.position.y = 0.42; h.rotation.y = 0.4; g.add(h);
    const ring = mesh(new THREE.TorusGeometry(0.62, 0.012, 16, 128), M.gold); ring.rotation.x = Math.PI / 2; ring.position.y = 0.31; g.add(ring);
    pearlAt(g, 0.95, 0, 0.6, 0.08); pearlAt(g, 1.12, 0, 0.42, 0.05);
    scene.add(g); lights(); floor();
    cam([0, 2.2, 8.6], [0, 1.15, 0]);
  },
  'treatment-acne-treatment'() {
    scene.background = background('stone');
    const g = new THREE.Group();
    const b = block(1.6, 0.5, 1.1); b.position.set(-0.2, 0.25, 0); g.add(b); contact(g, -0.2, 0, 1.2, 0.001, 0.55);
    const j = creamJar(1, M.ceramic); j.position.set(-0.35, 0.5, 0.05); g.add(j); contact(g, -0.35, 0.05, 0.75, 0.502, 0.8);
    const j2 = creamJar(0.6); j2.position.set(0.85, 0, 0.55); g.add(j2); contact(g, 0.85, 0.55, 0.5, 0.001, 0.8);
    // smooth river stones
    [[0.35, 0.5, 0.3, 0.13], [0.5, 0.5, 0.1, 0.09], [1.3, 0, 0.1, 0.16]].forEach(([x, y, z, r]) => {
      const s = mesh(new THREE.SphereGeometry(r, 48, 32), M.clay); s.scale.y = 0.45; s.position.set(x, y + r * 0.45, z); g.add(s); contact(g, x, z, r * 1.6, y + 0.002, 0.8);
    });
    scene.add(g); lights(); floor();
    cam([0.3, 2.4, 6.6], [0.15, 0.55, 0]);
  },
  'treatment-anti-aging'() {
    scene.background = background('sand');
    const g = new THREE.Group();
    g.add(plinth(0.72, 0.62)); contact(g, 0, 0, 1, 0.001, 0.6);
    const p2 = plinth(0.6, 0.24, M.stoneWarm); p2.position.set(1.05, 0, 0.6); g.add(p2); contact(g, 1.05, 0.6, 0.85, 0.001, 0.6);
    const b = serumBottle(0.8); b.position.y = 0.62; b.rotation.y = 0.5; g.add(b); contact(g, 0, 0, 0.6, 0.623, 0.9);
    [[0.95, 0.5, 0.075], [1.15, 0.72, 0.06], [1.22, 0.45, 0.05], [0.82, 0.78, 0.045]].forEach(([x, z, r]) => pearlAt(g, x, 0.24, z, r));
    pearlAt(g, -0.95, 0, 0.75, 0.09);
    scene.add(g); lights(); floor();
    cam([0.2, 2.2, 8.6], [0.15, 0.95, 0]);
  },
  'treatment-skin-consultation'() {
    scene.background = background('ivory');
    const g = new THREE.Group();
    const b = block(2.2, 0.16, 1.2); b.position.y = 0.08; g.add(b); contact(g, 0, 0, 1.5, 0.001, 0.45);
    const m = handMirror(); m.position.set(-0.25, 0.16, -0.1); m.rotation.y = 0.35; g.add(m); contact(g, -0.25, -0.1, 0.6, 0.162, 0.9);
    const t = tube(0.55); t.position.set(0.65, 0.16, 0.35); t.rotation.y = -0.4; g.add(t); contact(g, 0.65, 0.35, 0.3, 0.162, 0.9);
    pearlAt(g, 0.95, 0.16, 0.05, 0.06);
    scene.add(g); lights(); floor();
    cam([0.3, 2.4, 8.8], [0.1, 1.05, 0]);
  },
  'about-interior'() { // 16/10 architectural still life
    scene.background = background('ivory');
    const g = new THREE.Group();
    const a1 = arch(1.5, 2.6, 0.2, 0.4); a1.position.set(-1.4, 0, -0.6); g.add(a1);
    const a2 = arch(1.1, 1.9, 0.16, 0.3, M.stoneWarm); a2.position.set(1.6, 0, -0.9); g.add(a2);
    g.add(at(plinth(0.55, 0.9), -0.2, 0, 0.1)); contact(g, -0.2, 0.1, 0.8, 0.001, 0.6);
    g.add(at(plinth(0.45, 0.45, M.stoneWarm), 0.75, 0, 0.35)); contact(g, 0.75, 0.35, 0.65, 0.001, 0.6);
    const v = vase(); v.scale.setScalar(0.8); v.position.set(-0.2, 0.9, 0.1); g.add(v); contact(g, -0.2, 0.1, 0.4, 0.902, 0.8);
    const j = creamJar(0.55); j.position.set(0.75, 0.45, 0.35); g.add(j); contact(g, 0.75, 0.35, 0.4, 0.452, 0.8);
    pearlAt(g, 1.25, 0, 0.75, 0.08); pearlAt(g, 1.42, 0, 0.62, 0.05);
    scene.add(g); lights({ area: 4 }); floor(0.16);
    cam([0.4, 2.1, 7.8], [0.1, 1.3, 0]);
  },
  'about-reception'() {
    scene.background = background('sand');
    const g = new THREE.Group();
    const b1 = block(1.6, 0.5, 0.9); b1.position.y = 0.25; g.add(b1);
    const b2 = block(1.0, 0.36, 0.7, M.stoneWarm); b2.position.set(0.2, 0.68, 0); g.add(b2);
    contact(g, 0, 0, 1.2, 0.001, 0.55);
    const v = vase(); v.scale.setScalar(0.75); v.position.set(0.1, 0.86, 0); g.add(v); contact(g, 0.1, 0, 0.42, 0.862, 0.8);
    scene.add(g); lights(); floor();
    cam([0.3, 2.3, 7.8], [0.1, 1.45, 0]);
  },
  'about-treatment-room'() {
    scene.background = background('rose');
    const g = new THREE.Group();
    const b = block(1.8, 0.3, 1.1); b.position.y = 0.15; g.add(b); contact(g, 0, 0, 1.3, 0.001, 0.5);
    let y = 0.3; [[1.2, 0.8, M.linen], [1.15, 0.78, M.linenSand], [1.1, 0.76, M.linen]].forEach(([w, d, mat], i) => {
      const t = towel(w, d, 0.16, mat); t.position.set(-0.1 + i * 0.03, y + 0.08, 0); t.rotation.y = (i - 1) * 0.04; g.add(t); y += 0.16;
    });
    const dish = lathe([[0, 0], [0.24, 0], [0.32, 0.04], [0.36, 0.07], [0.35, 0.075], [0.3, 0.05], [0, 0.03]], M.gold);
    dish.position.set(-0.08, y, 0); g.add(dish);
    [[-0.12, 0.04], [0.02, -0.05], [-0.02, 0.1]].forEach(([x, z]) => { const p = mesh(new THREE.SphereGeometry(0.06, 40, 28), M.pearl); p.position.set(-0.08 + x, y + 0.09, z); g.add(p); });
    const r = mesh(new THREE.SphereGeometry(0.12, 48, 32), M.clay); r.scale.y = 0.5; r.position.set(0.7, 0.36, 0.3); g.add(r);
    scene.add(g); lights(); floor();
    cam([0.4, 2.6, 6.8], [0, 0.82, 0]);
  },
  'about-products'() {
    scene.background = background('stone');
    const g = new THREE.Group();
    const b = block(2.4, 0.2, 1.1); b.position.y = 0.1; g.add(b); contact(g, 0, 0, 1.6, 0.001, 0.45);
    const s = serumBottle(0.62); s.position.set(-0.55, 0.2, 0); s.rotation.y = 0.4; g.add(s); contact(g, -0.55, 0, 0.45, 0.202, 0.9);
    const t = tube(0.75); t.position.set(0.1, 0.2, -0.15); t.rotation.y = -0.3; g.add(t); contact(g, 0.1, -0.15, 0.35, 0.202, 0.9);
    const j = creamJar(0.55); j.position.set(0.68, 0.2, 0.2); g.add(j); contact(g, 0.68, 0.2, 0.42, 0.202, 0.9);
    scene.add(g); lights(); floor();
    cam([0.2, 2.2, 7.4], [0.05, 0.85, 0]);
  },
  'clinic-f10'() { clinic('f10', W / H); },
  'clinic-gulberg'() { clinic('gulberg', W / H); },
  'clinic-f10-wide'() { clinic('f10', W / H); },
  'clinic-gulberg-wide'() { clinic('gulberg', W / H); },
};

function clinic(kind, aspect) {
  scene.background = background(kind === 'f10' ? 'ivory' : 'sand');
  const g = new THREE.Group();
  if (kind === 'f10') { // a single tall arch, a plinth, the pin
    const a = arch(1.6, 2.7, 0.2, 0.4); a.position.set(-0.5, 0, -0.7); g.add(a);
    g.add(at(plinth(0.55, 0.5), 0.55, 0, 0.3)); contact(g, 0.55, 0.3, 0.8, 0.001, 0.6);
    const p = mapPin(0.9); p.position.set(0.55, 0.5, 0.3); p.rotation.y = -0.3; g.add(p); contact(g, 0.55, 0.3, 0.25, 0.502, 0.9);
  } else { // a colonnade of arches for The Palazzo
    for (let i = -2; i <= 2; i++) { const a = arch(1.0, 2.0, 0.14, 0.3, i % 2 ? M.stoneWarm : M.stone); a.position.set(i * 1.05, 0, -1.1); g.add(a); }
    g.add(at(plinth(0.5, 0.5, M.stoneWarm), 0.4, 0, 0.4)); contact(g, 0.4, 0.4, 0.75, 0.001, 0.6);
    const p = mapPin(0.9); p.position.set(0.4, 0.5, 0.4); p.rotation.y = -0.3; g.add(p); contact(g, 0.4, 0.4, 0.25, 0.502, 0.9);
  }
  pearlAt(g, -0.6, 0, 0.9, 0.08);
  scene.add(g); lights({ area: 4.5 }); floor(0.16);
  const wide = aspect > 1.8;
  cam(wide ? [0.3, 1.5, 6.0] : [0.4, 2.0, 7.4], [0.05, 1.0, 0], wide ? 24 : 26);
}

camera.aspect = W / H;
(subjects[S] || subjects.laser)();
renderer.render(scene, camera);
renderer.render(scene, camera); // second pass so transmission sees shadows and env
window.__done = true;
