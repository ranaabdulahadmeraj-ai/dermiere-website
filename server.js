const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const config = require('./config');
const pages = require('./views/pages');
const { treatments, clinics } = require('./content');

const PORT = process.env.PORT || 3000;
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'change-me';

if (ADMIN_PASSWORD === 'change-me') {
  console.warn('WARNING: ADMIN_PASSWORD is not set. Using the default "change-me". Set it before going live.');
}

// ---------- Database (SQLite locally, Postgres when DATABASE_URL is set) ----------
const db = require('./db');

// ---------- Time helpers (clinic timezone) ----------
function nowInClinic() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: config.clinic.timezone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t).value;
  return { date: `${get('year')}-${get('month')}-${get('day')}`, minutes: +get('hour') * 60 + +get('minute') };
}
const toMin = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
const toHHMM = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
const weekday = (dateStr) => new Date(dateStr + 'T00:00:00Z').getUTCDay();

function allSlots() {
  const { open, close, slotMinutes } = config.hours;
  const out = [];
  for (let m = toMin(open); m + slotMinutes <= toMin(close); m += slotMinutes) out.push(toHHMM(m));
  return out;
}

// Returns null if the date is bookable, otherwise a reason.
function dateProblem(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(new Date(date + 'T00:00:00Z'))) return 'Invalid date.';
  const today = nowInClinic().date;
  if (date < today) return 'That date has passed.';
  if (date > addDays(today, config.hours.maxDaysAhead)) return `Bookings open up to ${config.hours.maxDaysAhead} days ahead.`;
  if (!config.hours.openDays.includes(weekday(date))) return 'The clinic is closed on Sundays.';
  return null;
}

async function slotsFor(location, date, q = db) {
  const rows = await q.all(`SELECT time, COUNT(*) AS n FROM appointments WHERE location = ? AND date = ? AND status != 'cancelled' GROUP BY time`, [location, date]);
  const taken = Object.fromEntries(rows.map((r) => [r.time, Number(r.n)]));
  const now = nowInClinic();
  return allSlots().map((time) => ({
    time,
    available: (taken[time] || 0) < config.hours.patientsPerSlot && !(date === now.date && toMin(time) <= now.minutes + 30),
  }));
}

// ---------- App ----------
const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use((req, res, next) => { res.set({ 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin', 'X-Frame-Options': 'SAMEORIGIN' }); next(); });
app.use(express.json({ limit: '20kb' }));
// Make sure the tables exist before any API call touches them
app.use('/api', (req, res, next) => db.ready.then(() => next(), next));
// Let async route errors reach the error handler
const aw = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Simple in-memory rate limit for booking submissions.
const hits = new Map();
function rateLimit(req, res, next) {
  const key = req.ip; const now = Date.now();
  const arr = (hits.get(key) || []).filter((t) => now - t < 60 * 60 * 1000);
  if (arr.length >= 10) return res.status(429).json({ error: 'Too many requests. Please call or WhatsApp us instead.' });
  arr.push(now); hits.set(key, arr); next();
}

app.get('/api/config', (req, res) => {
  res.json({ clinic: config.clinic, locations: config.locations, services: config.services, hours: config.hours, today: nowInClinic().date });
});

app.get('/api/slots', aw(async (req, res) => {
  const { location, date } = req.query;
  if (!config.locations.some((l) => l.id === location)) return res.status(400).json({ error: 'Unknown location.' });
  const problem = dateProblem(String(date || ''));
  if (problem) return res.json({ closed: true, reason: problem, slots: [] });
  res.json({ closed: false, slots: await slotsFor(location, date) });
}));

const clean = (v, max) => String(v ?? '').trim().slice(0, max);

app.post('/api/appointments', rateLimit, aw(async (req, res) => {
  const b = req.body || {};
  if (b.website) return res.status(400).json({ error: 'Invalid submission.' }); // honeypot
  const appt = {
    name: clean(b.name, 80), phone: clean(b.phone, 20), email: clean(b.email, 120),
    location: clean(b.location, 20), service: clean(b.service, 40),
    date: clean(b.date, 10), time: clean(b.time, 5), notes: clean(b.notes, 500),
  };
  if (appt.name.length < 2) return res.status(400).json({ error: 'Please enter your name.' });
  const digits = appt.phone.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 13) return res.status(400).json({ error: 'Please enter a valid phone number.' });
  if (appt.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(appt.email)) return res.status(400).json({ error: 'Please enter a valid email or leave it blank.' });
  if (!config.locations.some((l) => l.id === appt.location)) return res.status(400).json({ error: 'Please choose a location.' });
  if (!config.services.some((s) => s.id === appt.service)) return res.status(400).json({ error: 'Please choose a treatment.' });
  const problem = dateProblem(appt.date);
  if (problem) return res.status(400).json({ error: problem });

  // Check and insert inside one transaction so two people can't take the same slot.
  try {
    const out = await db.tx(async (q) => {
      const slot = (await slotsFor(appt.location, appt.date, q)).find((s) => s.time === appt.time);
      if (!slot) return { status: 400, body: { error: 'Please choose a valid time.' } };
      if (!slot.available) return { status: 409, body: { error: 'Sorry, that slot was just taken. Please pick another time.' } };
      const ref = 'DM-' + crypto.randomBytes(3).toString('hex').toUpperCase();
      await q.run(`INSERT INTO appointments (ref, name, phone, email, location, service, date, time, notes)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [ref, appt.name, appt.phone, appt.email || null, appt.location, appt.service, appt.date, appt.time, appt.notes || null]);
      return { status: 201, body: { ref, ...appt } };
    }, `slot:${appt.location}:${appt.date}`);
    if (out.status === 201) console.log(`New booking ${out.body.ref}: ${appt.name}, ${appt.service} at ${appt.location} on ${appt.date} ${appt.time}`);
    res.status(out.status).json(out.body);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong. Please call or WhatsApp us.' });
  }
}));

app.post('/api/contact', rateLimit, aw(async (req, res) => {
  const b = req.body || {};
  if (b.website) return res.status(400).json({ error: 'Invalid submission.' });
  const m = { name: clean(b.name, 80), phone: clean(b.phone, 20), email: clean(b.email, 120), topic: clean(b.topic, 60), message: clean(b.message, 1500) };
  if (m.name.length < 2) return res.status(400).json({ error: 'Please enter your name.' });
  const digits = m.phone.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 13) return res.status(400).json({ error: 'Please enter a valid phone number.' });
  if (m.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.email)) return res.status(400).json({ error: 'Please enter a valid email or leave it blank.' });
  if (m.message.length < 5) return res.status(400).json({ error: 'Please write a short message.' });
  await db.run('INSERT INTO messages (name, phone, email, topic, message) VALUES (?, ?, ?, ?, ?)', [m.name, m.phone, m.email || null, m.topic || null, m.message]);
  console.log(`New contact message from ${m.name} (${m.topic})`);
  res.status(201).json({ ok: true });
}));

// ---------- Admin (HTTP Basic auth) ----------
function safeEqual(a, b) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}
function requireAdmin(req, res, next) {
  const [scheme, encoded] = (req.headers.authorization || '').split(' ');
  if (scheme === 'Basic' && encoded) {
    const [user, ...rest] = Buffer.from(encoded, 'base64').toString().split(':');
    if (safeEqual(user, ADMIN_USER) && safeEqual(rest.join(':'), ADMIN_PASSWORD)) return next();
  }
  res.set('WWW-Authenticate', 'Basic realm="Dermiere Admin"').status(401).send('Authentication required');
}

app.get(['/admin', '/admin.html'], requireAdmin, (req, res) => res.sendFile(path.join(__dirname, 'private', 'admin.html')));

app.get('/api/admin/appointments', requireAdmin, aw(async (req, res) => {
  const where = []; const args = [];
  if (req.query.from) { where.push('date >= ?'); args.push(String(req.query.from)); }
  if (req.query.to) { where.push('date <= ?'); args.push(String(req.query.to)); }
  if (req.query.location) { where.push('location = ?'); args.push(String(req.query.location)); }
  if (req.query.status) { where.push('status = ?'); args.push(String(req.query.status)); }
  const sql = `SELECT * FROM appointments ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY date, time LIMIT 1000`;
  res.json({ appointments: await db.all(sql, args) });
}));

const STATUSES = ['pending', 'confirmed', 'completed', 'cancelled', 'no-show'];
app.patch('/api/admin/appointments/:id', requireAdmin, aw(async (req, res) => {
  const status = String(req.body?.status || '');
  if (!STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status.' });
  const r = await db.run('UPDATE appointments SET status = ? WHERE id = ?', [status, Number(req.params.id)]);
  if (!r.changes) return res.status(404).json({ error: 'Not found.' });
  res.json({ ok: true });
}));

app.get('/api/admin/messages', requireAdmin, aw(async (req, res) => {
  res.json({ messages: await db.all('SELECT * FROM messages ORDER BY id DESC LIMIT 500') });
}));
app.patch('/api/admin/messages/:id', requireAdmin, aw(async (req, res) => {
  const status = String(req.body?.status || '');
  if (!['new', 'replied', 'archived'].includes(status)) return res.status(400).json({ error: 'Invalid status.' });
  const r = await db.run('UPDATE messages SET status = ? WHERE id = ?', [status, Number(req.params.id)]);
  if (!r.changes) return res.status(404).json({ error: 'Not found.' });
  res.json({ ok: true });
}));

app.get('/api/admin/export.csv', requireAdmin, aw(async (req, res) => {
  const rows = await db.all('SELECT * FROM appointments ORDER BY date, time');
  const cols = ['ref', 'date', 'time', 'name', 'phone', 'email', 'location', 'service', 'status', 'notes', 'created_at'];
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  res.set('Content-Type', 'text/csv').set('Content-Disposition', 'attachment; filename="appointments.csv"');
  res.send([cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n'));
}));

// ---------- Website pages ----------
const html = (render) => (req, res) => res.type('html').send(render(req));
app.get('/', html(pages.home));
app.get('/about', html(pages.about));
app.get('/dr-anusha', html(pages.doctor));
app.get('/treatments', html(pages.treatmentsIndex));
app.get('/treatments/:slug', (req, res, next) => {
  const t = treatments.find((x) => x.slug === req.params.slug);
  return t ? res.type('html').send(pages.treatment(t)) : next();
});
app.get('/clinics', html(pages.clinicsIndex));
app.get('/clinics/:slug', (req, res, next) => {
  const c = clinics.find((x) => x.slug === req.params.slug);
  return c ? res.type('html').send(pages.clinic(c)) : next();
});
app.get(['/book', '/book.html'], html(pages.book));
app.get('/contact', html(pages.contact));
app.get('/faqs', html(pages.faqsPage));
app.get('/privacy', html(() => pages.legal({ kind: 'privacy' })));
app.get('/terms', html(() => pages.legal({ kind: 'terms' })));
app.get('/index.html', (req, res) => res.redirect(301, '/'));
app.get('/robots.txt', (req, res) => res.type('text').send('User-agent: *\nDisallow: /admin\nDisallow: /api/\n'));
app.get('/sitemap.xml', (req, res) => {
  const base = `${req.protocol}://${req.get('host')}`;
  const urls = ['/', '/about', '/dr-anusha', '/treatments', ...treatments.map((t) => '/treatments/' + t.slug), '/clinics', ...clinics.map((c) => '/clinics/' + c.slug), '/book', '/contact', '/faqs', '/privacy', '/terms'];
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((u) => `<url><loc>${base}${u}</loc></url>`).join('')}</urlset>`);
});

app.use('/vendor/three', express.static(path.join(__dirname, 'node_modules', 'three', 'build'), { maxAge: '30d' }));
app.use('/vendor/gsap', express.static(path.join(__dirname, 'node_modules', 'gsap', 'dist'), { maxAge: '30d' }));
app.use('/vendor/lenis', express.static(path.join(__dirname, 'node_modules', 'lenis', 'dist'), { maxAge: '30d' }));
app.use('/vendor/three-addons', express.static(path.join(__dirname, 'node_modules', 'three', 'examples', 'jsm'), { maxAge: '30d' }));
if (process.env.STUDIO === '1') { // offline render studio for still images, never on in production
  app.get('/__studio', (req, res) => res.sendFile(path.join(__dirname, 'tools', 'studio.html')));
  app.use('/__studio', express.static(path.join(__dirname, 'tools')));
}
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '7d' }));
app.use((req, res) => res.status(404).type('html').send(pages.notFound()));

app.use((err, req, res, next) => { console.error(err); res.status(500).json({ error: 'Something went wrong. Please call or WhatsApp us.' }); });

// Run as a normal server locally; on Vercel the app is exported and served by api/index.js
if (require.main === module) app.listen(PORT, () => console.log(`Dermiére running on http://localhost:${PORT} (${db.kind})`));
module.exports = app;
