(async function () {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const cfg = await fetch('/api/config').then((r) => r.json());
  const state = { step: 1, location: null, service: null, date: null, time: null };
  const params = new URLSearchParams(location.search);
  if (cfg.locations.some((l) => l.id === params.get('location'))) state.location = params.get('location');
  if (cfg.services.some((s) => s.id === params.get('service'))) state.service = params.get('service');

  const fmt12 = (t) => { const [h, m] = t.split(':').map(Number); return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`; };
  const fmtDate = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const loc = () => cfg.locations.find((l) => l.id === state.location);
  const svc = () => cfg.services.find((s) => s.id === state.service);

  // Step 1 & 2 choices
  function renderChoices(container, items, key, sub) {
    container.innerHTML = items.map((i) => `<button type="button" class="choice${state[key] === i.id ? ' selected' : ''}" data-id="${i.id}"><strong>${esc(i.name)}</strong><span>${esc(sub(i))}</span></button>`).join('');
    container.onclick = (e) => {
      const b = e.target.closest('.choice'); if (!b) return;
      state[key] = b.dataset.id;
      if (key === 'location') { state.time = null; }
      renderChoices(container, items, key, sub); update();
    };
  }
  renderChoices($('#locationChoices'), cfg.locations, 'location', (l) => l.address);
  renderChoices($('#serviceChoices'), cfg.services, 'service', (s) => s.blurb);

  // Step 3 dates
  function addDays(d, n) { const x = new Date(d + 'T00:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); }
  const days = [];
  for (let i = 0; i <= Math.min(cfg.hours.maxDaysAhead, 30); i++) days.push(addDays(cfg.today, i));
  function renderDates() {
    $('#dates').innerHTML = days.map((d) => {
      const dt = new Date(d + 'T00:00:00Z');
      const open = cfg.hours.openDays.includes(dt.getUTCDay());
      return `<button type="button" class="date-btn${state.date === d ? ' selected' : ''}" data-date="${d}" ${open ? '' : 'disabled title="Closed"'}>
        <small>${dt.toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' })}</small><b>${dt.getUTCDate()}</b><small>${dt.toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' })}</small></button>`;
    }).join('');
  }
  $('#dates').onclick = (e) => {
    const b = e.target.closest('.date-btn'); if (!b || b.disabled) return;
    state.date = b.dataset.date; state.time = null; renderDates(); loadSlots(); update();
  };

  async function loadSlots() {
    const box = $('#slots'); const msg = $('#slotMsg');
    if (!state.date || !state.location) { box.innerHTML = ''; msg.innerHTML = '<div class="alert info">Select a date to see available times.</div>'; return; }
    box.innerHTML = ''; msg.innerHTML = '<div class="alert info">Loading times&hellip;</div>';
    const r = await fetch(`/api/slots?location=${state.location}&date=${state.date}`).then((x) => x.json()).catch(() => null);
    if (!r) { msg.innerHTML = '<div class="alert err">Could not load times. Please try again.</div>'; return; }
    if (r.closed) { msg.innerHTML = `<div class="alert info">${esc(r.reason)}</div>`; return; }
    const free = r.slots.filter((s) => s.available).length;
    msg.innerHTML = free ? '' : '<div class="alert info">This day is fully booked. Please pick another date.</div>';
    box.innerHTML = r.slots.map((s) => `<button type="button" class="slot${state.time === s.time ? ' selected' : ''}" data-time="${s.time}" ${s.available ? '' : 'disabled'}>${fmt12(s.time)}</button>`).join('');
  }
  $('#slots').onclick = (e) => {
    const b = e.target.closest('.slot'); if (!b || b.disabled) return;
    state.time = b.dataset.time; $$('.slot').forEach((x) => x.classList.toggle('selected', x === b)); update();
  };

  // Navigation
  const valid = { 1: () => state.location, 2: () => state.service, 3: () => state.date && state.time, 4: () => true };
  function show(step) {
    state.step = step;
    $$('[data-panel]').forEach((p) => p.classList.toggle('hidden', p.dataset.panel !== String(step)));
    $$('#steps li').forEach((s) => {
      const n = +s.dataset.step;
      s.classList.toggle('active', n === step); s.classList.toggle('done', step === 'done' || n < step);
    });
    if (step === 3) { renderDates(); loadSlots(); }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    update();
  }
  function update() {
    $$('[data-panel] [data-next]').forEach((b) => { b.disabled = !valid[b.closest('[data-panel]').dataset.panel](); });
    $('#sumLocation').textContent = loc() ? loc().name : '—';
    $('#sumService').textContent = svc() ? svc().name : '—';
    $('#sumDate').textContent = state.date ? fmtDate(state.date) : '—';
    $('#sumTime').textContent = state.time ? fmt12(state.time) : '—';
  }
  document.addEventListener('click', (e) => {
    const n = e.target.closest('[data-next]'); const b = e.target.closest('[data-back]');
    if (n && !n.disabled) show(state.step + 1);
    if (b) show(state.step - 1);
  });

  // Submit
  $('#detailsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target; const msg = $('#formMsg'); const btn = $('#submitBtn');
    msg.innerHTML = '';
    if (f.name.value.trim().length < 2) { msg.innerHTML = '<div class="alert err">Please enter your name.</div>'; return; }
    const digits = f.phone.value.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 13) { msg.innerHTML = '<div class="alert err">Please enter a valid phone number, e.g. 0300-1234567.</div>'; return; }
    btn.disabled = true; btn.textContent = 'Booking…';
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location: state.location, service: state.service, date: state.date, time: state.time,
          name: f.name.value, phone: f.phone.value, email: f.email.value, notes: f.notes.value, website: f.website.value }),
      });
      const data = await res.json();
      if (!res.ok) {
        msg.innerHTML = `<div class="alert err">${esc(data.error || 'Something went wrong.')}</div>`;
        if (res.status === 409) { state.time = null; setTimeout(() => show(3), 1500); }
        return;
      }
      $('#refCode').textContent = data.ref;
      $('#doneText').textContent = `${svc().name} at ${loc().name} on ${fmtDate(state.date)} at ${fmt12(state.time)}.`;
      const text = `Hi Dermiére, I just booked online.\nRef: ${data.ref}\nName: ${data.name}\nTreatment: ${svc().name}\nClinic: ${loc().name}\nDate: ${fmtDate(state.date)}\nTime: ${fmt12(state.time)}`;
      $('#waConfirm').href = `https://wa.me/${cfg.clinic.whatsapp}?text=${encodeURIComponent(text)}`;
      $('#summary').classList.add('hidden');
      show('done');
    } catch {
      msg.innerHTML = '<div class="alert err">Network error. Please try again or call us.</div>';
    } finally { btn.disabled = false; btn.textContent = 'Confirm booking'; }
  });

  // Start at the first step that still needs input
  show(state.location ? (state.service ? 3 : 2) : 1);
})();
