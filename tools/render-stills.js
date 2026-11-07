// Renders the still-life images into public/img. Run: STUDIO=1 node server.js & node tools/render-stills.js [slot...]
const { chromium } = require('playwright');
const path = require('path');
const BASE = process.env.BASE || 'http://localhost:3000';
const slots = {
  'treatment-laser-hair-removal': [1400, 1400], 'treatment-prp-microneedling': [1400, 1400], 'treatment-polynucleotide-under-eye': [1400, 1400],
  'treatment-acne-treatment': [1400, 1400], 'treatment-anti-aging': [1400, 1400], 'treatment-skin-consultation': [1400, 1400],
  'about-interior': [1600, 1000], 'about-reception': [900, 1200], 'about-treatment-room': [900, 1200], 'about-products': [900, 1200],
  'clinic-f10': [1500, 1000], 'clinic-gulberg': [1500, 1000], 'clinic-f10-wide': [2100, 900], 'clinic-gulberg-wide': [2100, 900],
};
(async () => {
  const want = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(slots);
  const out = process.env.OUT || path.join(__dirname, '..', 'public', 'img');
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  for (const s of want) {
    const [w, h] = slots[s];
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    page.on('console', (m) => m.type() === 'error' && console.log(s, m.text()));
    page.on('pageerror', (e) => console.log(s, e.message));
    await page.goto(`${BASE}/__studio?s=${s}&w=${w}&h=${h}`, { waitUntil: 'load' });
    await page.waitForFunction(() => window.__done, null, { timeout: 120000 });
    await page.locator('canvas').screenshot({ path: path.join(out, s + '.png') });
    await page.close();
    console.log('rendered', s);
  }
  await browser.close();
})();
