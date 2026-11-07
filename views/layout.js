const fs = require('fs');
const path = require('path');
const config = require('../config');
const { treatments, clinics } = require('../content');

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---------- Icons (thin line, 24px grid) ----------
const P = {
  arrow: '<path d="M4 12h15M13 6l6 6-6 6"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="1"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="1"/><path d="m4 6.5 8 6 8-6"/>',
  instagram: '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".6" fill="currentColor"/>',
  whatsapp: '<path d="M4 20l1.2-4A8.5 8.5 0 1 1 8 18.8z"/><path d="M9 8.5c0 3.5 2.8 6.5 6.5 6.5l1-1.6-2-1-1 .8a4.5 4.5 0 0 1-2.4-2.4l.8-1-1-2z"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  menu: '<path d="M4 8h16M4 16h16"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  shield: '<path d="M12 3.5 5 6v5.5c0 4.5 3 7.8 7 9 4-1.2 7-4.5 7-9V6z"/><path d="m9 12 2 2 4-4"/>',
  leaf: '<path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14z"/><path d="M5 19 13 11"/>',
  sparkle: '<path d="M12 3v5M12 16v5M3 12h5M16 12h5M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/>',
  user: '<circle cx="12" cy="8" r="3.8"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/>',
  drop: '<path d="M12 3.5s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
  eye: '<path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>',
  heart: '<path d="M12 20s-8-4.8-8-10.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 2.5C20 15.2 12 20 12 20z"/>',
  layers: '<path d="m12 4 9 5-9 5-9-5z"/><path d="m3 14 9 5 9-5"/>',
  car: '<path d="M4 16v-4l2-5h12l2 5v4z"/><circle cx="7.5" cy="16.5" r="1.5"/><circle cx="16.5" cy="16.5" r="1.5"/>',
  chevron: '<path d="m9 6 6 6-6 6"/>',
};
const icon = (name, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">${P[name] || ''}</svg>`;

// ---------- Photography ----------
// Drop a photo named <name>.jpg (or .webp/.png) into public/img and it replaces the placeholder automatically.
const IMG_DIR = path.join(__dirname, '..', 'public', 'img');
function readCredits() {
  try { return JSON.parse(fs.readFileSync(path.join(IMG_DIR, 'photos', 'credits.json'), 'utf8')); } catch { return {}; }
}
function findImage(name) {
  for (const ext of ['jpg', 'jpeg', 'webp', 'png']) {
    if (fs.existsSync(path.join(IMG_DIR, 'photos', `${name}.${ext}`))) return `/img/photos/${name}.${ext}`;
  }
  for (const ext of ['webp', 'jpg', 'jpeg', 'png']) {
    if (fs.existsSync(path.join(IMG_DIR, `${name}.${ext}`))) return `/img/${name}.${ext}`;
  }
  return null;
}
function photo(name, alt, { ratio = '4/5', cls = '', eager = false, tone = '' } = {}) {
  const src = findImage(name);
  const real = src && src.startsWith('/img/photos/');
  const c = real ? readCredits()[name] : null;
  if (c && c.alt) alt = c.alt;
  const inner = src
    ? `<img src="${src}" alt="${esc(alt)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`
    : `<span class="ph-label">${esc(alt)}</span>`;
  return `<figure class="photo ${src ? '' : 'is-ph'} ${real ? 'is-real' : ''} ${tone} ${cls}" style="aspect-ratio:${ratio}">${inner}</figure>`;
}

// ---------- Shared bits ----------
const phoneLink = (p) => `tel:+92${p.replace(/\D/g, '').replace(/^0/, '')}`;
const waLink = (text) => `https://wa.me/${config.clinic.whatsapp}${text ? '?text=' + encodeURIComponent(text) : ''}`;

function pageHero({ kicker, title, lead, crumbs = [], align = '' }) {
  const bc = crumbs.length
    ? `<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a>${crumbs.map(([t, h]) => h ? `<span>/</span><a href="${h}">${esc(t)}</a>` : `<span>/</span><span aria-current="page">${esc(t)}</span>`).join('')}</nav>`
    : '';
  return `<header class="page-hero ${align}"><div class="container">${bc}<p class="kicker reveal">${esc(kicker)}</p><h1 class="reveal">${title}</h1>${lead ? `<p class="lead reveal">${lead}</p>` : ''}</div></header>`;
}

function ctaBand(title = 'Begin your skin journey', text = 'Book a consultation or treatment at either of our Islamabad clinics. It takes less than a minute.', service = '') {
  return `<section class="cta-band"><div class="container cta-inner reveal">
    <div><p class="kicker">Appointments</p><h2>${title}</h2><p>${text}</p></div>
    <div class="cta-actions"><a class="btn btn-light" href="/book${service ? '?service=' + service : ''}">Book online ${icon('arrow')}</a><a class="btn btn-outline-light" href="${waLink('Hi Dermiére, I would like to book an appointment.')}" target="_blank" rel="noopener">${icon('whatsapp')} WhatsApp us</a></div>
  </div></section>`;
}

function faqList(items) {
  return `<div class="accordion">${items.map(([q, a]) => `<details class="acc"><summary><span>${esc(q)}</span>${icon('plus', 'acc-ic')}</summary><div class="acc-body"><p>${esc(a)}</p></div></details>`).join('')}</div>`;
}

// ---------- Layout ----------
function header(active) {
  const is = (k) => (active === k ? ' aria-current="page"' : '');
  return `
<a class="skip" href="#main">Skip to content</a>
<div class="topbar"><div class="container topbar-inner">
  <span>${icon('clock')} Mon – Sat, 12:00 PM – 6:00 PM</span>
  <span class="tb-right"><a href="${phoneLink(config.clinic.phones[0])}">${icon('phone')} ${config.clinic.phones[0]}</a><a href="https://www.instagram.com/${config.clinic.instagram}/" target="_blank" rel="noopener">${icon('instagram')} @${config.clinic.instagram}</a></span>
</div></div>
<header class="site-header" id="siteHeader">
  <div class="container nav">
    <a href="/" class="brand" aria-label="Dermiére home"><span class="brand-name">Dermiére</span><span class="brand-sub">Aesthetic &amp; Wellness Clinic</span></a>
    <nav class="primary" id="primaryNav" aria-label="Main">
      <ul>
        <li><a href="/about"${is('about')}>About</a></li>
        <li><a href="/dr-anusha"${is('doctor')}>Dr. Anusha</a></li>
        <li class="has-menu"><a href="/treatments"${is('treatments')}>Treatments</a>
          <div class="mega"><div class="mega-inner">
            <div class="mega-col"><p class="kicker">Treatments</p>${treatments.map((t) => `<a href="/treatments/${t.slug}">${esc(t.nav)}</a>`).join('')}</div>
            <div class="mega-feature"><p class="kicker">New here?</p><p class="mega-title">Start with a skin consultation</p><a class="link-arrow" href="/treatments/skin-consultation">Learn more ${icon('arrow')}</a></div>
          </div></div>
        </li>
        <li class="has-menu"><a href="/clinics"${is('clinics')}>Our Clinics</a>
          <div class="mega mega-sm"><div class="mega-inner"><div class="mega-col">${clinics.map((c) => `<a href="/clinics/${c.slug}">${esc(c.short)}<small>${esc(c.address)}</small></a>`).join('')}</div></div></div>
        </li>
        <li><a href="/faqs"${is('faqs')}>FAQs</a></li>
        <li><a href="/contact"${is('contact')}>Contact</a></li>
      </ul>
      <a class="btn btn-dark nav-cta" href="/book">Book Appointment</a>
    </nav>
    <button class="nav-toggle" id="navToggle" aria-label="Open menu" aria-expanded="false" aria-controls="primaryNav">${icon('menu', 'i-open')}${icon('close', 'i-close')}</button>
  </div>
</header>`;
}

function footer() {
  const year = new Date().getFullYear();
  return `
<footer class="site-footer">
  <div class="container">
    <div class="footer-top">
      <div class="footer-brand">
        <a href="/" class="brand brand-light"><span class="brand-name">Dermiére</span><span class="brand-sub">Aesthetic &amp; Wellness Clinic</span></a>
        <p>Doctor-led dermatology and aesthetic care in Islamabad, led by Dr. Anusha Liaqat.</p>
        <div class="socials"><a href="https://www.instagram.com/${config.clinic.instagram}/" target="_blank" rel="noopener" aria-label="Instagram">${icon('instagram')}</a><a href="${waLink()}" target="_blank" rel="noopener" aria-label="WhatsApp">${icon('whatsapp')}</a><a href="${phoneLink(config.clinic.phones[0])}" aria-label="Call">${icon('phone')}</a></div>
      </div>
      <div><p class="f-head">Treatments</p>${treatments.map((t) => `<a href="/treatments/${t.slug}">${esc(t.nav)}</a>`).join('')}</div>
      <div><p class="f-head">Dermiére</p><a href="/about">About Dermiére</a><a href="/dr-anusha">Meet Dr. Anusha</a><a href="/clinics">Our Clinics</a><a href="/faqs">FAQs</a><a href="/contact">Contact Us</a><a href="/book">Book Online</a></div>
      <div><p class="f-head">Visit</p>${clinics.map((c) => `<a href="/clinics/${c.slug}" class="f-addr"><strong>${esc(c.short)}</strong>${esc(c.address)}</a>`).join('')}<p class="f-hours">Mon – Sat · 12:00 PM – 6:00 PM<br>Sunday closed</p></div>
    </div>
    <div class="footer-bottom">
      <span>© ${year} Dermiére Aesthetic &amp; Wellness Clinic. All rights reserved.</span>
      <span><a href="/privacy">Privacy Policy</a><a href="/terms">Terms &amp; Conditions</a></span>
    </div>
  </div>
</footer>
<a class="wa-float" href="${waLink('Hi Dermiére, I would like to ask about a treatment.')}" target="_blank" rel="noopener" aria-label="Chat with us on WhatsApp"><svg viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M16 3C9 3 3.3 8.6 3.3 15.6c0 2.2.6 4.4 1.7 6.3L3 29l7.3-1.9c1.8 1 3.8 1.5 5.8 1.5 7 0 12.7-5.6 12.7-12.6S23 3 16 3zm0 23.1c-1.9 0-3.7-.5-5.3-1.4l-.4-.2-4.3 1.1 1.2-4.2-.3-.4c-1-1.6-1.5-3.5-1.5-5.4 0-5.8 4.7-10.5 10.6-10.5s10.6 4.7 10.6 10.5S21.9 26.1 16 26.1zm5.8-7.9c-.3-.2-1.9-.9-2.2-1s-.5-.2-.7.2-.8 1-1 1.2-.4.2-.7.1c-.3-.2-1.3-.5-2.6-1.6-1-.9-1.6-1.9-1.8-2.2s0-.5.1-.6l.5-.6c.2-.2.2-.4.3-.6s0-.4 0-.6-.7-1.7-1-2.3c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4s-1.2 1.1-1.2 2.7 1.2 3.1 1.3 3.4c.2.2 2.3 3.5 5.6 4.9 2.8 1.1 3.3.9 3.9.8.6-.1 1.9-.8 2.2-1.5.3-.7.3-1.4.2-1.5-.1-.2-.3-.3-.6-.4z"/></svg></a>`;
}

function layout({ title, description, active = '', body, scripts = [], modules = [], schema = null, bodyClass = '' }) {
  const fullTitle = title ? `${title} | Dermiére Islamabad` : 'Dermiére Aesthetic & Wellness Clinic | Dermatologist in Islamabad';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description)}">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="website">
<meta name="theme-color" content="#f7f3ed">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Jost:wght@300;400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/site.css?v=6">
<script>if(!matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.classList.add('js-motion');setTimeout(function(){if(!window.__motion)document.documentElement.classList.remove('js-motion')},2500)}</script>
${schema ? `<script type="application/ld+json">${JSON.stringify(schema)}</script>` : ''}
</head>
<body class="${bodyClass}">
${header(active)}
<main id="main">
${body}
</main>
${footer()}
<script src="/js/site.js?v=5" defer></script>
<script src="/vendor/gsap/gsap.min.js" defer></script>
<script src="/vendor/gsap/ScrollTrigger.min.js" defer></script>
<script src="/vendor/gsap/SplitText.min.js" defer></script>
<script src="/vendor/lenis/lenis.min.js" defer></script>
<script src="/js/motion.js?v=6" defer></script>
${scripts.map((s) => `<script src="${s}" defer></script>`).join('\n')}
${modules.length ? `<script type="importmap">{"imports":{"three":"/vendor/three/three.module.min.js","three/addons/":"/vendor/three-addons/"}}</script>\n${modules.map((m) => `<script type="module" src="${m}"></script>`).join('\n')}` : ''}
</body>
</html>`;
}

module.exports = { layout, icon, photo, esc, pageHero, ctaBand, faqList, phoneLink, waLink, findImage };
