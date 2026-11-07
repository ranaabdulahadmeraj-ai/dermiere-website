(function () {
  const header = document.getElementById('siteHeader');
  const toggle = document.getElementById('navToggle');
  const onScroll = () => header && header.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  if (toggle) {
    toggle.addEventListener('click', () => {
      const open = !document.body.classList.contains('nav-open');
      document.documentElement.style.setProperty('--nav-top', header.getBoundingClientRect().bottom + 'px');
      document.body.classList.toggle('nav-open', open);
      toggle.setAttribute('aria-expanded', open);
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && document.body.classList.contains('nav-open')) toggle.click(); });
  }

  // Treatment filters
  const chips = document.querySelectorAll('[data-filter]');
  chips.forEach((c) => c.addEventListener('click', () => {
    const f = c.dataset.filter;
    chips.forEach((x) => { x.classList.toggle('is-active', x === c); x.setAttribute('aria-pressed', x === c); });
    document.querySelectorAll('.tr-card').forEach((card) => {
      card.classList.toggle('is-hidden', !(f === 'all' || card.dataset.concern === f || card.dataset.concern === 'all'));
    });
  }));
})();
