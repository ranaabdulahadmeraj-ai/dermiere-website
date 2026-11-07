// Build step for Vercel: copy the browser libraries into public/vendor so the CDN serves them.
// (Locally, server.js serves the same paths straight from node_modules.)
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const copies = [
  ['node_modules/three/build', 'public/vendor/three'],
  ['node_modules/three/examples/jsm/environments', 'public/vendor/three-addons/environments'],
  ['node_modules/three/examples/jsm/geometries', 'public/vendor/three-addons/geometries'],
  ['node_modules/gsap/dist', 'public/vendor/gsap'],
  ['node_modules/lenis/dist', 'public/vendor/lenis'],
];
for (const [from, to] of copies) {
  fs.cpSync(path.join(root, from), path.join(root, to), { recursive: true });
  console.log('copied', from, '->', to);
}
