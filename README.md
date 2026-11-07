# Dermiére Aesthetic & Wellness Clinic: website + booking

A fast, mobile-friendly clinic website with built-in appointment booking and an admin view.

- **Website**: 18 server-rendered pages sharing one layout, navigation and footer:
  Home, About, Dr. Anusha, Treatments + 6 treatment pages, Our Clinics + 2 clinic pages, Book Online, Contact (with message form), FAQs, Privacy Policy, Terms & Conditions. Also a 404 page, `sitemap.xml`, `robots.txt` and schema.org markup for SEO.
- **Booking** (`/book`): patient picks clinic, treatment, date and a 30-minute slot (Mon–Sat, 12:00–6:00 PM, Pakistan time). Taken slots, Sundays and past times are blocked. Patients get a reference code and a one-tap "Send on WhatsApp" to the clinic.
- **Admin** (`/admin`, password protected): Appointments and Messages tabs; appointments by day, filter by clinic/status/date, change status (pending, confirmed, completed, cancelled, no-show), one-tap WhatsApp confirmation message to the patient, call link, CSV export.

## Run locally

Needs Node.js 22.13 or newer (uses the built-in SQLite, no database server).

```bash
npm install
ADMIN_PASSWORD=your-strong-password npm start
# open http://localhost:3000  and  http://localhost:3000/admin  (user: admin)
```

## Settings

| Variable | Default | Meaning |
| --- | --- | --- |
| `ADMIN_PASSWORD` | `change-me` | Admin password. **Always set this.** |
| `ADMIN_USER` | `admin` | Admin username |
| `PORT` | `3000` | Port |
| `DB_PATH` | `./data/dermiere.db` | Where bookings are stored. Point it at a persistent disk in production. |

## Editing the site

| What | Where |
| --- | --- |
| Booking settings: services, clinics, hours, slot length, patients per slot, phone numbers | `config.js` |
| Page text: treatments, clinic descriptions, FAQs | `content.js` |
| Page layouts | `views/pages.js` (pages) and `views/layout.js` (header, footer, icons) |
| Design (colours, fonts, spacing) | `public/css/site.css` (tokens at the top) |

### Adding photos

Every image slot shows a soft placeholder until you drop a photo into `public/img/` with the matching name (`.jpg`, `.webp` or `.png`). No code changes needed; restart not required.

| File name | Where it appears |
| --- | --- |
| `home-hero` | Home page hero (portrait, 4:5) |
| `dr-anusha` | Home doctor section and Dr. Anusha page (portrait, 4:5) |
| `about-interior`, `about-reception`, `about-treatment-room`, `about-products` | About page |
| `clinic-f10`, `clinic-gulberg` | Clinic cards (landscape, 3:2) |
| `clinic-f10-wide`, `clinic-gulberg-wide` | Clinic page banners (very wide, 21:9) |
| `treatment-laser-hair-removal`, `treatment-prp-microneedling`, `treatment-polynucleotide-under-eye`, `treatment-acne-treatment`, `treatment-anti-aging`, `treatment-skin-consultation` | Treatment cards and treatment page heroes (4:5) |
| `treatment-polynucleotide-under-eye-detail` | Under-eye page close-up (square) |

Use your own photography or properly licensed images, around 1600px on the long side, compressed (WebP is ideal).

## Deploy

Any host that runs Node and keeps a persistent disk works, for example Railway, Render (with a disk), Fly.io, or a small VPS (DigitalOcean, Hostinger VPS). Set `ADMIN_PASSWORD`, set `DB_PATH` to the persistent disk, and run `npm start`. Back up the `.db` file regularly (or use Export CSV).

Serverless hosts without a disk (Vercel, Netlify) are not suitable as-is because the database file would be lost.
