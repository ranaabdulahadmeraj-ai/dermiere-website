// Dermiére motion layer: Lenis smooth scrolling + GSAP (ScrollTrigger, SplitText).
// Effects follow React Bits patterns (BlurText, ScrollReveal, Magnet, CountUp, ScrollVelocity),
// written for plain HTML. Everything is skipped for visitors who prefer reduced motion.
(function () {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !window.gsap || !window.ScrollTrigger) return;
  const { gsap } = window;
  gsap.registerPlugin(ScrollTrigger, window.SplitText);
  document.documentElement.classList.add('js-motion');
  window.__motion = true;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const ease = 'expo.out';

  // ---------- Lenis smooth scroll, driven by GSAP's ticker ----------
  let lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    window.__lenis = lenis;
    // in-page anchors scroll smoothly too
    document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
      const el = a.getAttribute('href').length > 1 && document.querySelector(a.getAttribute('href'));
      if (el) { e.preventDefault(); lenis.scrollTo(el, { offset: -100 }); }
    }));
    // pause while the mobile menu is open
    new MutationObserver(() => (document.body.classList.contains('nav-open') ? lenis.stop() : lenis.start()))
      .observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }

  // ---------- Header: tuck away on the way down, return on the way up ----------
  const header = document.getElementById('siteHeader');
  if (header) {
    let lastY = 0;
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate(self) {
        const y = self.scroll();
        const hide = y > 400 && y > lastY && !document.body.classList.contains('nav-open');
        header.classList.toggle('is-tucked', hide);
        lastY = y;
      },
    });
  }

  const split = (el, type) => (window.SplitText ? new SplitText(el, { type, mask: type.includes('lines') ? 'lines' : undefined, linesClass: 'sl', wordsClass: 'sw', charsClass: 'sc' }) : null);

  // ---------- Hero: BlurText-style headline, then the supporting lines ----------
  const heroSel = '.hero, .page-hero, .tr-hero, .doc-hero, .clinic-hero';
  document.querySelectorAll(heroSel).forEach((hero) => {
    const h1 = hero.querySelector('h1');
    const rest = [...hero.querySelectorAll('.reveal')].filter((el) => el !== h1 && !el.contains(h1));
    const tl = gsap.timeline({ delay: 0.1 });
    if (h1) {
      gsap.set(h1, { opacity: 1 });
      const s = split(h1, 'words');
      if (s) tl.from(s.words, { yPercent: 60, opacity: 0, filter: 'blur(12px)', duration: 1.3, ease, stagger: 0.06 });
    }
    tl.from(rest, { y: 24, opacity: 0, duration: 1.1, ease, stagger: 0.08, clearProps: 'transform' }, h1 ? '-=0.95' : 0);
    // media in the hero opens like a curtain
    hero.querySelectorAll('.photo, .scene, .monogram').forEach((m) => {
      tl.from(m, { clipPath: 'inset(12% 12% 12% 12%)', duration: 1.6, ease: 'power3.out', clearProps: 'clipPath' }, 0.15);
      const img = m.querySelector('img');
      if (img) tl.from(img, { scale: 1.18, duration: 2, ease: 'power3.out' }, 0.15);
    });
  });

  // ---------- Section headings: line-by-line rise from a mask ----------
  gsap.utils.toArray('main h2').forEach((h) => {
    if (h.closest(heroSel) || h.closest('.cta-band') || h.closest('.faq')) return;
    const s = split(h, 'lines');
    if (!s) return;
    gsap.from(s.lines, { yPercent: 110, duration: 1.2, ease, stagger: 0.1, scrollTrigger: { trigger: h, start: 'top 88%', once: true } });
  });

  // ---------- ScrollReveal: statement text brightens word by word as you scroll ----------
  gsap.utils.toArray('.statement-text, .big-quote').forEach((el) => {
    const s = split(el, 'words');
    if (!s) return;
    gsap.fromTo(s.words, { opacity: 0.14, filter: 'blur(3px)' }, {
      opacity: 1, filter: 'blur(0px)', ease: 'none', stagger: 0.05,
      scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 45%', scrub: true },
    });
  });

  // ---------- Images: 3D unfold as they arrive, plus gentle parallax ----------
  gsap.utils.toArray('main .photo, main .scene').forEach((fig) => {
    if (fig.closest(heroSel)) return;
    const img = fig.querySelector('img');
    gsap.from(fig, {
      rotationX: 14, y: 70, transformPerspective: 1400, transformOrigin: '50% 100%',
      clipPath: 'inset(0% 0% 100% 0%)', duration: 1.5, ease: 'power4.out', clearProps: 'clipPath',
      scrollTrigger: { trigger: fig, start: 'top 92%', once: true },
    });
    if (img) {
      gsap.fromTo(img, { scale: 1.16, yPercent: -4 }, { scale: 1.06, yPercent: 4, ease: 'none', scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: true } });
    }
  });

  // ---------- Everything else marked .reveal: soft rise in batches ----------
  const rest = gsap.utils.toArray('main .reveal').filter((el) => !el.closest(heroSel));
  gsap.set(rest, { opacity: 0, y: 28 });
  ScrollTrigger.batch(rest, {
    start: 'top 90%', once: true,
    onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1.1, ease, stagger: 0.09, clearProps: 'transform' }),
  });
  // cards and list rows arrive one after another
  ['.tr-list li', '.tr-card', '.principle', '.pillars > *', '.faq-group', '.clinic-card'].forEach((sel) => {
    const items = gsap.utils.toArray(sel).filter((el) => !el.classList.contains('reveal'));
    if (!items.length) return;
    gsap.set(items, { opacity: 0, y: 36 });
    ScrollTrigger.batch(items, { start: 'top 92%', once: true, onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1, ease, stagger: 0.08, clearProps: 'transform' }) });
  });

  // ---------- Hero media drifts slower than the page ----------
  document.querySelectorAll(heroSel).forEach((hero) => {
    const media = hero.querySelector('.hero-media, .doc-photo, .photo, .scene, .monogram');
    if (!media) return;
    gsap.to(media, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
  });

  // ---------- Journey: pinned on wide screens, a gold line draws through the four steps ----------
  const journey = document.querySelector('.journey');
  if (journey) {
    const steps = gsap.utils.toArray('.journey .step');
    const line = journey.querySelector('.steps-line i');
    ScrollTrigger.matchMedia({
      '(min-width: 901px)': () => {
        gsap.set(steps, { opacity: 0.22 });
        const tl = gsap.timeline({ scrollTrigger: { trigger: journey, start: 'top 72px', end: '+=1000', scrub: 0.6, pin: true, anticipatePin: 1 } });
        tl.fromTo(line, { scaleX: 0 }, { scaleX: 1, ease: 'none', duration: steps.length });
        steps.forEach((st, i) => tl.to(st, { opacity: 1, y: -6, duration: 0.6, ease: 'power2.out' }, i + 0.15));
      },
      '(max-width: 900px)': () => {
        gsap.set(line, { scaleX: 1 });
        gsap.set(steps, { opacity: 0, y: 28 });
        ScrollTrigger.batch(steps, { start: 'top 92%', once: true, onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1, ease, stagger: 0.08 }) });
      },
    });
  }

  // ---------- About gallery: three columns at three speeds ----------
  gsap.utils.toArray('.gallery-3 > *').forEach((el, i) => {
    gsap.fromTo(el, { y: [30, 90, 50][i % 3] }, { y: [-30, -90, -50][i % 3], ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  // ---------- CountUp ----------
  gsap.utils.toArray('.numbers strong').forEach((n) => {
    const end = parseFloat(n.textContent); if (isNaN(end)) return;
    const o = { v: 0 };
    gsap.to(o, { v: end, duration: 1.8, ease: 'power2.out', scrollTrigger: { trigger: n, start: 'top 90%', once: true }, onUpdate: () => { n.textContent = Math.round(o.v); } });
  });

  // ---------- ScrollVelocity marquee: drifts on its own, speeds up with your scroll ----------
  document.querySelectorAll('.marquee-track').forEach((track) => {
    track.innerHTML += track.innerHTML; // two copies for a seamless loop
    const loop = gsap.to(track, { xPercent: -50, duration: 40, ease: 'none', repeat: -1 });
    let boost = 0;
    ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (self) => { boost = Math.min(Math.abs(self.getVelocity()) / 600, 5) * Math.sign(self.getVelocity() || 1); } });
    gsap.ticker.add(() => { boost *= 0.92; loop.timeScale(1 + boost); });
  });

  if (!fine) return; // pointer effects below are for mouse and trackpad only

  // ---------- Magnet: buttons lean toward the cursor ----------
  document.querySelectorAll('.btn').forEach((b) => {
    const xTo = gsap.quickTo(b, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    const yTo = gsap.quickTo(b, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    b.addEventListener('pointermove', (e) => { const r = b.getBoundingClientRect(); xTo((e.clientX - r.left - r.width / 2) * 0.25); yTo((e.clientY - r.top - r.height / 2) * 0.35); });
    b.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
  });

  // ---------- Treatment list: a preview image follows the cursor ----------
  const list = document.querySelector('.tr-list[data-previews]');
  if (list) {
    const box = document.createElement('div');
    box.className = 'tr-preview'; box.setAttribute('aria-hidden', 'true');
    list.querySelectorAll('a[data-img]').forEach((a) => { const i = new Image(); i.src = a.dataset.img; i.alt = ''; i.dataset.for = a.dataset.img; box.appendChild(i); });
    document.body.appendChild(box);
    gsap.set(box, { xPercent: -50, yPercent: -50, scale: 0.6, opacity: 0 });
    const xTo = gsap.quickTo(box, 'x', { duration: 0.7, ease: 'power3.out' });
    const yTo = gsap.quickTo(box, 'y', { duration: 0.7, ease: 'power3.out' });
    const rTo = gsap.quickTo(box, 'rotation', { duration: 0.9, ease: 'power3.out' });
    let lx = 0;
    list.addEventListener('pointermove', (e) => { xTo(e.clientX); yTo(e.clientY); rTo(gsap.utils.clamp(-8, 8, (e.clientX - lx) * 0.6)); lx = e.clientX; });
    list.querySelectorAll('a[data-img]').forEach((a) => a.addEventListener('pointerenter', () => {
      box.querySelectorAll('img').forEach((i) => i.classList.toggle('on', i.dataset.for === a.dataset.img));
    }));
    list.addEventListener('pointerenter', (e) => { gsap.set(box, { x: e.clientX, y: e.clientY }); gsap.to(box, { scale: 1, opacity: 1, duration: 0.5, ease: 'power3.out' }); });
    list.addEventListener('pointerleave', () => gsap.to(box, { scale: 0.6, opacity: 0, duration: 0.4, ease: 'power3.in' }));
  }

  // ---------- 3D tilt: every photo turns toward the cursor, the image floats inside, light glints ----------
  document.querySelectorAll('.photo:not(.is-ph), .monogram').forEach((p) => {
    const img = p.querySelector('img');
    const glare = document.createElement('span'); glare.className = 'glare'; glare.setAttribute('aria-hidden', 'true'); p.appendChild(glare);
    const strength = p.closest(heroSel) ? 10 : 7;
    gsap.set(p, { transformPerspective: 1000, transformStyle: 'preserve-3d' });
    const rx = gsap.quickTo(p, 'rotationX', { duration: 0.7, ease: 'power3.out' });
    const ry = gsap.quickTo(p, 'rotationY', { duration: 0.7, ease: 'power3.out' });
    const ix = img ? gsap.quickTo(img, 'x', { duration: 0.9, ease: 'power3.out' }) : () => {};
    const iy = img ? gsap.quickTo(img, 'y', { duration: 0.9, ease: 'power3.out' }) : () => {};
    p.addEventListener('pointermove', (e) => {
      const r = p.getBoundingClientRect(); const u = (e.clientX - r.left) / r.width - 0.5; const v = (e.clientY - r.top) / r.height - 0.5;
      ry(u * strength); rx(-v * strength); ix(-u * 18); iy(-v * 18);
      p.style.setProperty('--gx', (u + 0.5) * 100 + '%'); p.style.setProperty('--gy', (v + 0.5) * 100 + '%');
      p.classList.add('is-tilting');
    });
    p.addEventListener('pointerleave', () => { rx(0); ry(0); ix(0); iy(0); p.classList.remove('is-tilting'); });
  });

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
