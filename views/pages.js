const config = require('../config');
const { treatments, clinics, faqs } = require('../content');
const { layout, icon, photo, esc, pageHero, ctaBand, faqList, phoneLink, waLink, findImage } = require('./layout');

const P1 = config.clinic.phones[0];
const P2 = config.clinic.phones[1];
const mapEmbed = (q) => `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;
const mapLink = (q) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
const trIcon = { hair: 'sparkle', texture: 'layers', eyes: 'eye', acne: 'drop', ageing: 'leaf', all: 'user' };

const clinicSchema = {
  '@context': 'https://schema.org', '@type': 'MedicalClinic', name: config.clinic.name, medicalSpecialty: 'Dermatology',
  telephone: config.clinic.phones.map((p) => '+92' + p.replace(/\D/g, '').slice(1)),
  openingHours: 'Mo-Sa 12:00-18:00', sameAs: [`https://www.instagram.com/${config.clinic.instagram}/`],
  address: clinics.map((c) => ({ '@type': 'PostalAddress', streetAddress: c.address.replace(', Islamabad', ''), addressLocality: 'Islamabad', addressCountry: 'PK' })),
};

// 3D scenes render into these frames (public/js/scenes.js). A real photo, if added, takes precedence.
function scene(kind, label, fallbackImg, ratio) {
  if (findImage(fallbackImg)) return photo(fallbackImg, label, { ratio, eager: true });
  return `<figure class="scene" data-scene="${kind}" style="aspect-ratio:${ratio}" role="img" aria-label="${esc(label)}"><canvas></canvas></figure>`;
}
// Dr. Anusha's portrait, or an engraved monogram card until a real photo is added
function portrait(eager = false) {
  if (findImage('dr-anusha')) return photo('dr-anusha', 'Dr. Anusha Liaqat', { ratio: '4/5', eager });
  return `<figure class="monogram" style="aspect-ratio:4/5" role="img" aria-label="Dr. Anusha Liaqat">
    <span class="mono-ring"><span class="mono-letters">AL</span></span>
    <figcaption><span class="mono-name">Dr. Anusha Liaqat</span><span class="mono-role">Founder and lead doctor, Dermiére</span></figcaption>
  </figure>`;
}
const heroVisual = () => scene('hero', 'A glass serum dropper bottle on a travertine plinth beneath a stone arch, rendered in 3D', 'home-hero', '4/5');

// =================== HOME ===================
function home() {
  const body = `
<section class="hero">
  <div class="container hero-grid">
    <div class="hero-copy">
      <p class="kicker reveal">Dermatology and aesthetics in Islamabad</p>
      <h1 class="reveal">Considered skin care, led by <em>Dr. Anusha Liaqat</em></h1>
      <p class="lead reveal">Laser, PRP, polynucleotides, acne and anti-aging treatments, each planned after a proper assessment of your skin, at our clinics in F-10/1 and Gulberg Greens.</p>
      <div class="hero-actions reveal">
        <a class="btn btn-dark" href="/book">Book appointment ${icon('arrow')}</a>
        <a class="link-arrow" href="/treatments">Explore treatments ${icon('arrow')}</a>
      </div>
    </div>
    <div class="hero-media reveal">
      ${heroVisual()}
    </div>
  </div>
</section>
<section class="hero-band" aria-label="Clinic at a glance">
  <dl class="container hero-facts">
    <div><dt>Led by</dt><dd>Dr. Anusha Liaqat</dd></div>
    <div><dt>Clinics</dt><dd>F-10/1 &amp; Gulberg Greens</dd></div>
    <div><dt>Open</dt><dd>Mon – Sat, 12:00 – 6:00 PM</dd></div>
    <div><dt>Book</dt><dd><a href="/book">Online</a> or <a href="${waLink('Hi Dermiére, I would like to book an appointment.')}" target="_blank" rel="noopener">WhatsApp</a></dd></div>
  </dl>
</section>

<section class="marquee" aria-hidden="true"><div class="marquee-track">${[...treatments.map((t) => t.title), 'F-10/1', 'Gulberg Greens'].map((x) => `<span>${esc(x)}</span><i></i>`).join('')}</div></section>

<section class="statement">
  <div class="container narrow reveal">
    <p class="kicker">Welcome to Dermiére</p>
    <p class="statement-text">We believe great skin is the result of <em>expertise, patience and honest advice</em>, never trends. Every plan begins with listening, and every result should look like you, only more rested and radiant.</p>
    <a class="link-arrow" href="/about">Our philosophy ${icon('arrow')}</a>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="split-head reveal"><div><p class="kicker">Treatments</p><h2>Signature treatments</h2></div><p class="muted">Medical-grade, doctor-supervised treatments for the concerns our clients care about most.</p></div>
    <ol class="tr-list" data-previews>
      ${treatments.map((t, i) => `<li class="reveal"><a href="/treatments/${t.slug}"${findImage('treatment-' + t.slug) ? ` data-img="${findImage('treatment-' + t.slug)}"` : ''}>
        <span class="tr-num">${String(i + 1).padStart(2, '0')}</span>
        <span class="tr-name">${esc(t.title)}</span>
        <span class="tr-sum">${esc(t.summary)}</span>
        <span class="tr-go">${icon('arrow')}</span></a></li>`).join('')}
    </ol>
  </div>
</section>

<section class="section doctor-feature">
  <div class="container df-grid">
    <div class="reveal">${portrait()}</div>
    <div class="df-copy reveal">
      <p class="kicker">Meet your doctor</p>
      <h2>Dr. Anusha Liaqat</h2>
      <p class="quote">“My aim is simple: to give every patient honest advice and results that look completely natural.”</p>
      <p class="muted">Dr. Anusha founded Dermiére to bring a more thoughtful, medical approach to aesthetics in Islamabad. She personally assesses every patient and oversees every treatment plan.</p>
      <a class="btn btn-outline" href="/dr-anusha">Meet Dr. Anusha ${icon('arrow')}</a>
    </div>
  </div>
</section>

<section class="section pillars-sec">
  <div class="container">
    <div class="center-head reveal"><p class="kicker">The Dermiére experience</p><h2>Why clients choose us</h2></div>
    <div class="pillars">
      ${[['shield', 'Doctor-led care', 'Every plan is assessed and supervised by a qualified doctor, never a salesperson.'],
         ['leaf', 'Natural results', 'We enhance, never overdo. You should look refreshed, not changed.'],
         ['sparkle', 'Modern techniques', 'PRP, polynucleotides and advanced laser technology, chosen for safety and results.'],
         ['heart', 'Comfort & privacy', 'Calm, private clinics and comfort-first techniques at every step.']]
        .map(([ic, t, d]) => `<div class="pillar reveal">${icon(ic, 'ic-lg')}<h3>${t}</h3><p>${d}</p></div>`).join('')}
    </div>
  </div>
</section>

<section class="section journey">
  <div class="container">
    <div class="split-head reveal"><div><p class="kicker">Your journey</p><h2>From first visit to visible results</h2></div><a class="link-arrow" href="/treatments/skin-consultation">About consultations ${icon('arrow')}</a></div>
    <div class="steps-line" aria-hidden="true"><i></i></div>
    <div class="steps-row">
      ${[['Book', 'Choose your clinic and a time online, or message us on WhatsApp.'], ['Consult', 'Meet Dr. Anusha for an honest assessment of your skin.'], ['Treat', 'Begin a personalised plan at a pace that suits you.'], ['Glow', 'We review your progress and adjust your plan over time.']]
        .map(([t, d], i) => `<div class="step"><span class="step-n">0${i + 1}</span><h3>${t}</h3><p>${d}</p></div>`).join('')}
    </div>
  </div>
</section>

<section class="section clinics-duo">
  <div class="container">
    <div class="center-head reveal"><p class="kicker">Visit us</p><h2>Two clinics in Islamabad</h2></div>
    <div class="duo">
      ${clinics.map((c) => `<a class="duo-card reveal" href="/clinics/${c.slug}">
        ${photo(c.image, `A gold map pin marking the ${c.name} clinic`, { ratio: '3/2', tone: 'tone-stone' })}
        <div class="duo-body"><h3>${esc(c.short)}</h3><p>${esc(c.address)}</p><span class="link-arrow">View clinic ${icon('arrow')}</span></div></a>`).join('')}
    </div>
  </div>
</section>

<section class="section faq-teaser">
  <div class="container faq-grid">
    <div class="reveal"><p class="kicker">Questions</p><h2>Frequently asked</h2><p class="muted">Everything you need to know before your first visit.</p><a class="link-arrow" href="/faqs">All FAQs ${icon('arrow')}</a></div>
    <div class="reveal">${faqList([faqs[0].items[0], faqs[1].items[0], faqs[1].items[2], faqs[2].items[0]])}</div>
  </div>
</section>

<section class="insta">
  <div class="container insta-inner reveal">
    ${icon('instagram', 'ic-lg')}
    <p class="kicker">Follow our work</p>
    <h2>@${config.clinic.instagram}</h2>
    <p class="muted">Results, treatment insights and skin advice from Dr. Anusha.</p>
    <a class="btn btn-outline" href="https://www.instagram.com/${config.clinic.instagram}/" target="_blank" rel="noopener">Follow on Instagram</a>
  </div>
</section>
${ctaBand()}`;
  return layout({ title: '', description: 'Dermiére is a doctor-led dermatology and aesthetic clinic in Islamabad (F-10/1 and Gulberg Greens) led by Dr. Anusha Liaqat. Laser hair removal, PRP microneedling, polynucleotides, acne and anti-aging. Book online.', body, schema: clinicSchema, bodyClass: 'home', modules: ['/js/scenes.js?v=5'] });
}

// =================== ABOUT ===================
function about() {
  const body = `
${pageHero({ kicker: 'About Dermiére', title: 'Where medical expertise<br>meets <em>quiet luxury</em>', crumbs: [['About']] })}
<section class="section-tight">
  <div class="container about-intro">
    <div class="reveal">${photo('about-interior', 'Travertine arches with a ceramic vase and a cream jar', { ratio: '16/10', tone: 'tone-stone' })}</div>
    <div class="about-intro-copy reveal">
      <p class="dropcap">Dermiére was created with one belief: aesthetic care should be medical, honest and personal. Too often, skin treatments are sold rather than prescribed. We wanted to build something different, a clinic where every recommendation starts with a proper diagnosis and ends with results that look natural.</p>
      <p class="muted">Led by Dr. Anusha Liaqat, our clinics in F-10/1 and Gulberg Greens offer a calm, private space for dermatology and aesthetic treatments, from laser hair removal to regenerative skin therapies.</p>
    </div>
  </div>
</section>

<section class="section ivory-deep">
  <div class="container">
    <blockquote class="big-quote reveal">“Beautiful skin is never about perfection. It is about health, confidence and feeling at home in your own face.”<cite>Dr. Anusha Liaqat, Founder</cite></blockquote>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="split-head reveal"><div><p class="kicker">Our standard</p><h2>The Dermiére way</h2></div><p class="muted">Four principles guide every consultation, every treatment and every interaction at our clinics.</p></div>
    <div class="principles">
      ${[['Diagnosis before treatment', 'We never recommend a treatment until we understand your skin, your history and the cause of your concern.'],
         ['Honesty, always', 'If a treatment will not help you, we will tell you. Realistic expectations are part of good care.'],
         ['Natural results', 'Our goal is that people notice you look well, not that you have had something done.'],
         ['Safety and hygiene', 'Medical-grade products, sterile technique and doctor supervision as standard.']]
        .map(([t, d], i) => `<article class="principle reveal"><span class="pr-num">${['I', 'II', 'III', 'IV'][i]}</span><h3>${t}</h3><p>${d}</p></article>`).join('')}
    </div>
  </div>
</section>

<section class="section">
  <div class="container gallery-3">
    ${photo('about-reception', 'A clay vase of dried stems on stacked stone', { ratio: '3/4', tone: 'tone-sand' })}
    ${photo('about-treatment-room', 'Folded linen towels with a gold dish of pearls', { ratio: '3/4', tone: 'tone-rose', cls: 'offset' })}
    ${photo('about-products', 'A serum bottle, a tube and a cream jar', { ratio: '3/4', tone: 'tone-stone' })}
  </div>
</section>

<section class="section-tight">
  <div class="container numbers reveal">
    <div><strong>2</strong><span>Clinics in Islamabad</span></div>
    <div><strong>6</strong><span>Specialist treatment areas</span></div>
    <div><strong>6</strong><span>Days a week</span></div>
    <div><strong>1</strong><span>Doctor overseeing every plan</span></div>
  </div>
</section>
${ctaBand('Experience Dermiére for yourself')}`;
  return layout({ title: 'About Dermiére', description: 'About Dermiére Aesthetic & Wellness Clinic: doctor-led, honest and natural-looking dermatology and aesthetic care in Islamabad.', active: 'about', body });
}

// =================== DOCTOR ===================
function doctor() {
  const body = `
<section class="doc-hero">
  <div class="container doc-grid">
    <div class="doc-photo reveal">${portrait(true)}</div>
    <div class="doc-copy">
      <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><span aria-current="page">Dr. Anusha Liaqat</span></nav>
      <p class="kicker reveal">Founder &amp; Lead Doctor</p>
      <h1 class="reveal">Dr. Anusha Liaqat</h1>
      <p class="lead reveal">Founder of Dermiére Aesthetic &amp; Wellness Clinic, Islamabad.</p>
      <p class="reveal">Dr. Anusha leads Dermiére with a clear philosophy: every patient deserves a proper medical assessment, honest advice and results that look completely natural. She personally consults with patients and oversees every treatment plan across both clinics.</p>
      <p class="reveal muted">Her work focuses on medical and aesthetic dermatology, from acne and pigmentation to regenerative skin treatments and laser, combining clinical knowledge with an artist’s eye for balance and subtlety.</p>
      <div class="doc-actions reveal"><a class="btn btn-dark" href="/book?service=consultation">Book a consultation ${icon('arrow')}</a><a class="link-arrow" href="https://www.instagram.com/${config.clinic.instagram}/" target="_blank" rel="noopener">Follow on Instagram ${icon('arrow')}</a></div>
    </div>
  </div>
</section>

<section class="section ivory-deep">
  <div class="container narrow">
    <p class="kicker center reveal">Philosophy</p>
    <blockquote class="big-quote reveal">“I would rather tell a patient they do not need a treatment than sell them one they do not. Trust is the foundation of good skin care.”</blockquote>
  </div>
</section>

<section class="section">
  <div class="container doc-focus">
    <div class="reveal"><p class="kicker">Areas of focus</p><h2>Clinical interests</h2><p class="muted">Dr. Anusha’s practice brings together medical dermatology and advanced aesthetics.</p></div>
    <ul class="focus-list">
      ${[['Acne & acne scarring', '/treatments/acne-treatment'], ['Regenerative under-eye care', '/treatments/polynucleotide-under-eye'], ['PRP & collagen induction', '/treatments/prp-microneedling'], ['Laser hair removal', '/treatments/laser-hair-removal'], ['Skin ageing & prevention', '/treatments/anti-aging'], ['Skin assessment & planning', '/treatments/skin-consultation']]
        .map(([t, h]) => `<li class="reveal"><a href="${h}"><span>${t}</span>${icon('arrow')}</a></li>`).join('')}
    </ul>
  </div>
</section>

<section class="section">
  <div class="container approach">
    <div class="center-head reveal"><p class="kicker">Her approach</p><h2>What to expect from your consultation</h2></div>
    <div class="approach-grid">
      ${[['Time to listen', 'Consultations are unhurried, so every question is answered.'], ['Clear explanations', 'You will understand your skin and why a treatment is recommended.'], ['Personal plans', 'No two plans are the same, because no two faces are.'], ['Long-term care', 'Progress is reviewed and plans adjusted as your skin changes.']]
        .map(([t, d]) => `<div class="reveal">${icon('check', 'ic-gold')}<h3>${t}</h3><p>${d}</p></div>`).join('')}
    </div>
  </div>
</section>
${ctaBand('Book a consultation with Dr. Anusha', 'Unhurried, honest advice and a personalised plan for your skin.', 'consultation')}`;
  return layout({ title: 'Dr. Anusha Liaqat', description: 'Meet Dr. Anusha Liaqat, founder and lead doctor at Dermiére Aesthetic & Wellness Clinic, Islamabad.', active: 'doctor', body });
}

// =================== TREATMENTS INDEX ===================
function treatmentsIndex() {
  const filters = [['all', 'All'], ['hair', 'Unwanted hair'], ['texture', 'Texture & scars'], ['eyes', 'Under-eyes'], ['acne', 'Acne'], ['ageing', 'Ageing']];
  const body = `
${pageHero({ kicker: 'Treatments', title: 'Treatments, tailored<br>to <em>your skin</em>', lead: 'Explore our doctor-led treatments, or filter by the concern you would like to address.', crumbs: [['Treatments']] })}
<section class="section-tight">
  <div class="container">
    <div class="filters reveal" role="group" aria-label="Filter by concern">
      ${filters.map(([k, l], i) => `<button type="button" class="chip${i === 0 ? ' is-active' : ''}" data-filter="${k}" aria-pressed="${i === 0}">${l}</button>`).join('')}
    </div>
    <div class="tr-grid">
      ${treatments.map((t, i) => `<a class="tr-card reveal" href="/treatments/${t.slug}" data-concern="${t.concern}">
        ${photo('treatment-' + t.slug, t.title, { ratio: '4/3', tone: ['tone-rose', 'tone-sand', 'tone-stone'][i % 3] })}
        <div class="tr-card-body"><p class="kicker">${esc(t.kicker)}</p><h2>${esc(t.title)}</h2><p>${esc(t.summary)}</p><span class="link-arrow">Discover ${icon('arrow')}</span></div>
      </a>`).join('')}
    </div>
  </div>
</section>
<section class="section ivory-deep">
  <div class="container consult-banner reveal">
    ${icon('user', 'ic-xl')}
    <div><h2>Not sure where to start?</h2><p class="muted">A skin consultation with Dr. Anusha is the best first step. You will leave with a clear, personalised plan.</p></div>
    <a class="btn btn-dark" href="/book?service=consultation">Book a consultation ${icon('arrow')}</a>
  </div>
</section>
${ctaBand()}`;
  return layout({ title: 'Treatments', description: 'Explore treatments at Dermiére Islamabad: laser hair removal, PRP microneedling, polynucleotide under-eye, acne, anti-aging and skin consultations.', active: 'treatments', body });
}

// =================== TREATMENT DETAIL ===================
function treatmentLayoutSection(t) {
  switch (t.layout) {
    case 'areas':
      return `<section class="section"><div class="container"><div class="split-head reveal"><div><p class="kicker">Treatment areas</p><h2>Face &amp; body</h2></div><p class="muted">Almost any area can be treated. Larger areas simply take a little longer.</p></div>
        <div class="areas">${t.areas.map((a) => `<div class="area reveal">${icon('check', 'ic-gold')}<span>${a}</span></div>`).join('')}</div></div></section>`;
    case 'process':
      return `<section class="section ivory-deep"><div class="container"><div class="center-head reveal"><p class="kicker">The process</p><h2>How your treatment works</h2></div>
        <ol class="timeline">${t.steps.map(([s, d], i) => `<li class="reveal"><span class="tl-n">${i + 1}</span><div><h3>${s}</h3><p>${d}</p></div></li>`).join('')}</ol></div></section>
        <section class="section-tight"><div class="container"><p class="kicker center reveal">Helps with</p><div class="tags reveal">${t.concerns.map((c) => `<span>${c}</span>`).join('')}</div></div></section>`;
    case 'concerns':
      return `<section class="section"><div class="container split-media">
        <div>${scene('helix', 'A strand of DNA, the source of polynucleotides, rendered in 3D', 'treatment-' + t.slug + '-detail', '1/1')}</div>
        <div class="reveal"><p class="kicker">Concerns addressed</p><h2>Designed for delicate skin</h2><ul class="check-list">${t.concerns.map((c) => `<li>${icon('check', 'ic-gold')}${c}</li>`).join('')}</ul></div></div></section>`;
    case 'types':
      return `<section class="section ivory-deep"><div class="container"><div class="center-head reveal"><p class="kicker">What we treat</p><h2>Every stage of acne</h2></div>
        <div class="types">${t.types.map(([n, d], i) => `<article class="type reveal"><span class="pr-num">0${i + 1}</span><h3>${n}</h3><p>${d}</p></article>`).join('')}</div></div></section>`;
    case 'menu':
      return `<section class="section"><div class="container"><div class="split-head reveal"><div><p class="kicker">Treatment menu</p><h2>Ways we help skin age well</h2></div><p class="muted">Your plan may combine several of these, depending on your concerns.</p></div>
        <div class="menu-list">${t.menu.map(([n, d]) => `<div class="menu-item reveal"><h3>${n}</h3><span class="menu-dots" aria-hidden="true"></span><p>${d}</p></div>`).join('')}</div>
        <div class="tags reveal" style="margin-top:48px">${t.concerns.map((c) => `<span>${c}</span>`).join('')}</div></div></section>`;
    case 'expect':
      return `<section class="section ivory-deep"><div class="container expect-grid">
        <div class="reveal"><p class="kicker">What to bring</p><h2>Preparing for your consultation</h2><ul class="check-list">${t.bring.map((c) => `<li>${icon('check', 'ic-gold')}${c}</li>`).join('')}</ul></div>
        <div class="expect-card reveal"><p class="kicker">Your consultation</p>${t.facts.map(([k, v]) => `<div class="ec-row"><span>${k}</span><strong>${v}</strong></div>`).join('')}<a class="btn btn-dark btn-block" href="/book?service=consultation">Book now ${icon('arrow')}</a></div>
      </div></section>`;
    default: return '';
  }
}

function treatment(t) {
  const others = treatments.filter((x) => x.slug !== t.slug).slice(0, 3);
  const showSteps = !['process'].includes(t.layout);
  const body = `
<section class="tr-hero">
  <div class="container tr-hero-grid">
    <div class="tr-hero-copy">
      <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/treatments">Treatments</a><span>/</span><span aria-current="page">${esc(t.nav)}</span></nav>
      <p class="kicker reveal">${esc(t.kicker)}</p>
      <h1 class="reveal">${esc(t.title)}</h1>
      <p class="tagline reveal">${esc(t.tagline)}</p>
      <p class="lead reveal">${esc(t.summary)}</p>
      <div class="hero-actions reveal"><a class="btn btn-dark" href="/book?service=${t.booking}">Book this treatment ${icon('arrow')}</a><a class="link-arrow" href="${waLink(`Hi Dermiére, I would like to know more about ${t.title}.`)}" target="_blank" rel="noopener">Ask on WhatsApp ${icon('arrow')}</a></div>
    </div>
    <div class="reveal">${photo('treatment-' + t.slug, t.title, { ratio: '4/5', eager: true, tone: 'tone-rose' })}</div>
  </div>
</section>

<section class="facts-bar"><dl class="container facts">${t.facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl></section>

<section class="section">
  <div class="container tr-overview">
    <div class="reveal"><p class="kicker">Overview</p><h2>About the treatment</h2></div>
    <div class="reveal">${t.intro.map((p, i) => `<p class="${i === 0 ? 'lead-sm' : 'muted'}">${esc(p)}</p>`).join('')}
      <ul class="benefits">${t.benefits.map((b) => `<li>${icon('check', 'ic-gold')}<span>${esc(b)}</span></li>`).join('')}</ul></div>
  </div>
</section>

${treatmentLayoutSection(t)}

${showSteps ? `<section class="section"><div class="container"><div class="split-head reveal"><div><p class="kicker">Step by step</p><h2>Your treatment journey</h2></div></div>
  <div class="steps-row">${t.steps.map(([s, d], i) => `<div class="step"><span class="step-n">0${i + 1}</span><h3>${s}</h3><p>${d}</p></div>`).join('')}</div></div></section>` : ''}

<section class="section ${showSteps ? 'ivory-deep' : ''}">
  <div class="container faq-grid">
    <div class="reveal"><p class="kicker">Questions</p><h2>${esc(t.nav)} FAQs</h2><p class="muted">Have another question? <a href="/contact">Get in touch</a> or see <a href="/faqs">all FAQs</a>.</p></div>
    <div class="reveal">${faqList(t.faqs)}</div>
  </div>
</section>

<section class="section">
  <div class="container"><div class="split-head reveal"><div><p class="kicker">Explore more</p><h2>Related treatments</h2></div><a class="link-arrow" href="/treatments">All treatments ${icon('arrow')}</a></div>
  <div class="related">${others.map((o) => `<a class="rel reveal" href="/treatments/${o.slug}">${icon(trIcon[o.concern], 'ic-lg')}<h3>${esc(o.title)}</h3><p>${esc(o.tagline)}</p><span class="link-arrow">Discover ${icon('arrow')}</span></a>`).join('')}</div></div>
</section>
<p class="container disclaimer">Results vary from person to person. Session numbers and downtime are typical guides; your doctor will confirm what is right for you during consultation.</p>
${ctaBand(`Book ${esc(t.title)}`, 'Choose your clinic and a time that suits you. Our team will confirm on WhatsApp.', t.booking)}`;
  const schema = { '@context': 'https://schema.org', '@type': 'MedicalProcedure', name: t.title, description: t.summary,
    mainEntityOfPage: { '@type': 'FAQPage', mainEntity: t.faqs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) } };
  return layout({ title: t.title, description: `${t.title} in Islamabad at Dermiére. ${t.summary}`, active: 'treatments', body, schema, modules: t.layout === 'concerns' ? ['/js/scenes.js?v=5'] : [] });
}

// =================== CLINICS ===================
function clinicsIndex() {
  const body = `
${pageHero({ kicker: 'Our Clinics', title: 'Two addresses,<br>one <em>standard of care</em>', lead: 'Visit us in F-10/1 or Gulberg Greens. Both clinics offer the full range of Dermiére treatments.', crumbs: [['Our Clinics']] })}
<section class="section-tight">
  <div class="container">
    ${clinics.map((c, i) => `<article class="clinic-row ${i % 2 ? 'flip' : ''}">
      <div class="reveal">${photo(c.image, `A gold map pin marking the ${c.name} clinic`, { ratio: '3/2', tone: i ? 'tone-sand' : 'tone-stone' })}</div>
      <div class="clinic-row-copy reveal">
        <p class="kicker">Islamabad · 0${i + 1}</p><h2>${esc(c.short)}</h2>
        <p class="muted">${esc(c.intro)}</p>
        <ul class="info-list">
          <li>${icon('pin')}<span>${esc(c.address)}</span></li>
          <li>${icon('clock')}<span>Monday – Saturday, 12:00 PM – 6:00 PM</span></li>
          <li>${icon('phone')}<span><a href="${phoneLink(P1)}">${P1}</a> · <a href="${phoneLink(P2)}">${P2}</a></span></li>
        </ul>
        <div class="row-actions"><a class="btn btn-dark" href="/book?location=${c.id}">Book at ${esc(c.short)}</a><a class="link-arrow" href="/clinics/${c.slug}">Clinic details ${icon('arrow')}</a></div>
      </div>
    </article>`).join('')}
  </div>
</section>
<section class="section ivory-deep">
  <div class="container hours-wrap">
    <div class="reveal"><p class="kicker">Opening hours</p><h2>When to visit</h2><p class="muted">Both clinics keep the same hours. Appointments are recommended, and walk-ins are welcome when slots are free.</p></div>
    <table class="hours reveal"><tbody>
      ${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((d) => `<tr><th scope="row">${d}</th><td>${d === 'Sunday' ? 'Closed' : '12:00 PM – 6:00 PM'}</td></tr>`).join('')}
    </tbody></table>
  </div>
</section>
${ctaBand()}`;
  return layout({ title: 'Our Clinics', description: 'Dermiére clinics in Islamabad: Ahmed Faraz Road, F-10/1 and The Palazzo, Gulberg Greens. Open Monday to Saturday, 12 to 6 PM.', active: 'clinics', body, schema: clinicSchema });
}

function clinic(c) {
  const other = clinics.find((x) => x.slug !== c.slug);
  const body = `
<section class="clinic-hero">
  <div class="container">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/clinics">Our Clinics</a><span>/</span><span aria-current="page">${esc(c.short)}</span></nav>
    <div class="clinic-hero-head"><div><p class="kicker reveal">Dermiére Islamabad</p><h1 class="reveal">${esc(c.short)}</h1></div><p class="lead reveal">${esc(c.intro)}</p></div>
  </div>
  <div class="container reveal">${photo(c.image + '-wide', `Stone arches and a gold map pin for ${c.name}`, { ratio: '21/9', eager: true, tone: 'tone-stone', cls: 'wide' })}</div>
</section>

<section class="section">
  <div class="container clinic-detail">
    <div>
      <div class="reveal"><p class="kicker">Find us</p><h2>Location &amp; directions</h2></div>
      <div class="map reveal"><iframe title="Map of ${esc(c.name)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="${mapEmbed(c.mapQuery)}"></iframe></div>
      <div class="reveal"><p class="kicker" style="margin-top:40px">Convenient from</p><div class="tags left">${c.nearby.map((n) => `<span>${n}</span>`).join('')}</div></div>
    </div>
    <aside class="clinic-card reveal">
      <h3>${esc(c.name)}</h3>
      <ul class="info-list">
        <li>${icon('pin')}<span>${esc(c.address)}</span></li>
        <li>${icon('clock')}<span>Mon – Sat: 12:00 PM – 6:00 PM<br>Sunday: Closed</span></li>
        <li>${icon('phone')}<span><a href="${phoneLink(P1)}">${P1}</a><br><a href="${phoneLink(P2)}">${P2}</a></span></li>
        <li>${icon('whatsapp')}<span><a href="${waLink(`Hi Dermiére, I have a question about your ${c.short} clinic.`)}" target="_blank" rel="noopener">Message on WhatsApp</a></span></li>
      </ul>
      <a class="btn btn-dark btn-block" href="/book?location=${c.id}">Book at this clinic ${icon('arrow')}</a>
      <a class="btn btn-outline btn-block" href="${mapLink(c.mapQuery)}" target="_blank" rel="noopener">Get directions</a>
    </aside>
  </div>
</section>

<section class="section ivory-deep">
  <div class="container">
    <div class="split-head reveal"><div><p class="kicker">Available here</p><h2>Treatments at ${esc(c.short)}</h2></div><a class="link-arrow" href="/treatments">All treatments ${icon('arrow')}</a></div>
    <div class="mini-tr">${treatments.map((t) => `<a class="reveal" href="/treatments/${t.slug}">${icon(trIcon[t.concern])}<span>${esc(t.title)}</span>${icon('chevron', 'ic-sm')}</a>`).join('')}</div>
  </div>
</section>

<section class="section-tight">
  <div class="container other-clinic reveal">
    <div><p class="kicker">Also visit</p><h3>${esc(other.name)}</h3><p class="muted">${esc(other.address)}</p></div>
    <a class="link-arrow" href="/clinics/${other.slug}">View clinic ${icon('arrow')}</a>
  </div>
</section>
${ctaBand(`Book at ${esc(c.short)}`, 'Choose a treatment and a time that suits you.', '')}`;
  return layout({ title: `${c.name}`, description: `${c.name}, ${c.address}. Dermatology and aesthetic clinic open Monday to Saturday, 12 to 6 PM. Book online.`, active: 'clinics', body });
}

// =================== BOOKING ===================
function book() {
  const body = `
${pageHero({ kicker: 'Online Booking', title: 'Book your <em>appointment</em>', lead: 'Choose your clinic, treatment and a time that suits you. Our team will confirm your appointment on WhatsApp or by phone.', crumbs: [['Book Online']] })}
<section class="booking-sec">
  <div class="container booking-wrap">
    <div class="booking-main">
      <ol class="bk-steps" id="steps">
        <li data-step="1"><span>01</span>Clinic</li>
        <li data-step="2"><span>02</span>Treatment</li>
        <li data-step="3"><span>03</span>Date &amp; time</li>
        <li data-step="4"><span>04</span>Your details</li>
      </ol>
      <div class="panel">
        <div data-panel="1">
          <h2>Select a clinic</h2>
          <p class="muted">Both clinics are open Monday to Saturday, 12:00 PM to 6:00 PM.</p>
          <div class="choice-grid" id="locationChoices"></div>
          <div class="step-actions"><span></span><button class="btn btn-dark" data-next disabled>Continue ${icon('arrow')}</button></div>
        </div>
        <div data-panel="2" class="hidden">
          <h2>Select a treatment</h2>
          <p class="muted">Not sure? Choose Skin Consultation and Dr. Anusha will advise you.</p>
          <div class="choice-grid" id="serviceChoices"></div>
          <div class="step-actions"><button class="btn btn-outline" data-back>Back</button><button class="btn btn-dark" data-next disabled>Continue ${icon('arrow')}</button></div>
        </div>
        <div data-panel="3" class="hidden">
          <h2>Select a date &amp; time</h2>
          <div class="dates" id="dates" aria-label="Choose a date"></div>
          <p class="field-label">Available times</p>
          <div class="slots" id="slots" aria-live="polite"></div>
          <div id="slotMsg"></div>
          <div class="step-actions"><button class="btn btn-outline" data-back>Back</button><button class="btn btn-dark" data-next disabled>Continue ${icon('arrow')}</button></div>
        </div>
        <div data-panel="4" class="hidden">
          <h2>Your details</h2>
          <form id="detailsForm" novalidate>
            <div class="form-grid">
              <div class="field"><label for="name">Full name *</label><input id="name" name="name" autocomplete="name" required maxlength="80"></div>
              <div class="field"><label for="phone">Phone / WhatsApp *</label><input id="phone" name="phone" type="tel" autocomplete="tel" placeholder="03xx-xxxxxxx" required maxlength="20"></div>
              <div class="field full"><label for="email">Email <span class="opt">(optional)</span></label><input id="email" name="email" type="email" autocomplete="email" maxlength="120"></div>
              <div class="field full"><label for="notes">Anything we should know? <span class="opt">(optional)</span></label><textarea id="notes" name="notes" maxlength="500" placeholder="Skin concerns, area for laser, first visit, etc."></textarea></div>
              <input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
            </div>
            <p class="form-note">By booking you agree to our <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>.</p>
            <div id="formMsg" role="alert"></div>
            <div class="step-actions"><button type="button" class="btn btn-outline" data-back>Back</button><button type="submit" class="btn btn-dark" id="submitBtn">Confirm booking</button></div>
          </form>
        </div>
        <div data-panel="done" class="hidden">
          <div class="success">
            <div class="tick">${icon('check')}</div>
            <h2>Your appointment is requested</h2>
            <p class="muted">Your booking reference</p>
            <div class="ref" id="refCode"></div>
            <p id="doneText"></p>
            <p class="muted">Our team will confirm with you shortly. For a faster confirmation, send us your booking on WhatsApp.</p>
            <div class="btns"><a class="btn btn-wa" id="waConfirm" target="_blank" rel="noopener">${icon('whatsapp')} Send on WhatsApp</a><a class="btn btn-outline" href="/">Back to home</a></div>
          </div>
        </div>
      </div>
    </div>
    <aside class="summary" id="summary">
      <p class="kicker">Your booking</p>
      <dl>
        <dt>Clinic</dt><dd id="sumLocation">—</dd>
        <dt>Treatment</dt><dd id="sumService">—</dd>
        <dt>Date</dt><dd id="sumDate">—</dd>
        <dt>Time</dt><dd id="sumTime">—</dd>
      </dl>
      <div class="sum-help">${icon('phone')}<span>Prefer to talk? Call <a href="${phoneLink(P1)}">${P1}</a> or <a href="${phoneLink(P2)}">${P2}</a></span></div>
    </aside>
  </div>
</section>`;
  return layout({ title: 'Book an Appointment', description: 'Book your appointment online at Dermiére Aesthetic & Wellness Clinic, F-10/1 or Gulberg Greens, Islamabad.', active: 'book', body, scripts: ['/js/book.js?v=2'], bodyClass: 'page-book' });
}

// =================== CONTACT ===================
function contact() {
  const body = `
${pageHero({ kicker: 'Contact Us', title: 'We would love<br>to <em>hear from you</em>', lead: 'Questions about a treatment, pricing or your appointment? Send us a message, call, or WhatsApp us.', crumbs: [['Contact']] })}
<section class="section-tight">
  <div class="container contact-grid">
    <div class="contact-info reveal">
      <div class="ci-block"><p class="kicker">Call</p><a href="${phoneLink(P1)}">${P1}</a><a href="${phoneLink(P2)}">${P2}</a></div>
      <div class="ci-block"><p class="kicker">WhatsApp</p><a href="${waLink('Hi Dermiére, I have a question.')}" target="_blank" rel="noopener">Message us on WhatsApp</a></div>
      <div class="ci-block"><p class="kicker">Instagram</p><a href="https://www.instagram.com/${config.clinic.instagram}/" target="_blank" rel="noopener">@${config.clinic.instagram}</a></div>
      <div class="ci-block"><p class="kicker">Hours</p><p>Monday – Saturday<br>12:00 PM – 6:00 PM<br>Sunday closed</p></div>
    </div>
    <div class="contact-form-wrap reveal">
      <h2>Send a message</h2>
      <p class="muted">We usually reply within one working day.</p>
      <form id="contactForm" class="form-grid" novalidate>
        <div class="field"><label for="c-name">Full name *</label><input id="c-name" name="name" required maxlength="80" autocomplete="name"></div>
        <div class="field"><label for="c-phone">Phone / WhatsApp *</label><input id="c-phone" name="phone" type="tel" required maxlength="20" autocomplete="tel" placeholder="03xx-xxxxxxx"></div>
        <div class="field"><label for="c-email">Email <span class="opt">(optional)</span></label><input id="c-email" name="email" type="email" maxlength="120" autocomplete="email"></div>
        <div class="field"><label for="c-topic">Topic</label><select id="c-topic" name="topic"><option>General question</option>${treatments.map((t) => `<option>${esc(t.title)}</option>`).join('')}<option>Pricing</option><option>Existing appointment</option></select></div>
        <div class="field full"><label for="c-msg">Message *</label><textarea id="c-msg" name="message" required maxlength="1500"></textarea></div>
        <input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
        <div class="full"><div id="contactMsg" role="alert"></div><button class="btn btn-dark" type="submit">Send message ${icon('arrow')}</button></div>
      </form>
    </div>
  </div>
</section>
<section class="section">
  <div class="container duo">
    ${clinics.map((c) => `<div class="contact-map reveal"><div class="map"><iframe title="Map of ${esc(c.name)}" loading="lazy" src="${mapEmbed(c.mapQuery)}"></iframe></div><div class="cm-body"><h3>${esc(c.short)}</h3><p class="muted">${esc(c.address)}</p><a class="link-arrow" href="${mapLink(c.mapQuery)}" target="_blank" rel="noopener">Directions ${icon('arrow')}</a></div></div>`).join('')}
  </div>
</section>`;
  return layout({ title: 'Contact Us', description: 'Contact Dermiére Aesthetic & Wellness Clinic in Islamabad. Call 0304-6571349 or 0323-6062601, WhatsApp us or send a message.', active: 'contact', body, scripts: ['/js/contact.js?v=2'] });
}

// =================== FAQS ===================
function faqsPage() {
  const body = `
${pageHero({ kicker: 'FAQs', title: 'Frequently asked <em>questions</em>', lead: 'Answers to the questions we hear most. If yours is not here, we are always happy to help.', crumbs: [['FAQs']] })}
<section class="section-tight">
  <div class="container faq-page">
    <nav class="faq-nav reveal" aria-label="FAQ topics">${faqs.map((g, i) => `<a href="#faq-${i}">${esc(g.group)}</a>`).join('')}</nav>
    <div>${faqs.map((g, i) => `<div class="faq-group reveal" id="faq-${i}"><h2>${esc(g.group)}</h2>${faqList(g.items)}</div>`).join('')}
      <div class="faq-more reveal"><h3>Still have a question?</h3><p class="muted">Our team is happy to help on WhatsApp or by phone.</p><div class="row-actions"><a class="btn btn-dark" href="/contact">Contact us</a><a class="btn btn-wa" href="${waLink('Hi Dermiére, I have a question.')}" target="_blank" rel="noopener">${icon('whatsapp')} WhatsApp</a></div></div>
    </div>
  </div>
</section>`;
  const schema = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.flatMap((g) => g.items).map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) };
  return layout({ title: 'FAQs', description: 'Frequently asked questions about booking, treatments, pricing and aftercare at Dermiére Islamabad.', active: 'faqs', body, schema });
}

// =================== LEGAL ===================
function legal({ kind }) {
  const updated = '7 November 2026';
  const sections = kind === 'privacy' ? [
    ['Who we are', `${config.clinic.name} ("Dermiére", "we", "us") operates clinics at Ahmed Faraz Road, F-10/1 and The Palazzo, Gulberg Greens, Islamabad, Pakistan. This policy explains how we collect and use personal information through this website and our clinics.`],
    ['Information we collect', 'When you book an appointment or contact us, we collect your name, phone number, email address (if provided), your chosen clinic, treatment, date and time, and any notes you share. We may also collect basic technical information such as your IP address for security and to prevent misuse.'],
    ['How we use your information', 'We use your information to schedule and confirm appointments, contact you about your booking by phone or WhatsApp, respond to your enquiries, provide treatment, and keep appropriate clinical records. We do not sell your personal information.'],
    ['Health information', 'Information about your skin, health or treatments is sensitive. It is only accessed by our clinical and administrative team for the purpose of your care, and is kept confidential.'],
    ['WhatsApp and third parties', 'If you contact us through WhatsApp or Instagram, those messages are also subject to the privacy policies of those platforms. Maps on this website are provided by Google and may set their own cookies.'],
    ['How long we keep information', 'We keep booking and clinical records only as long as needed for your care and to meet legal and professional obligations.'],
    ['Security', 'We take reasonable technical and organisational measures to protect your information, including password-protected systems and limited staff access.'],
    ['Your rights', 'You may ask to see, correct or delete the personal information we hold about you, subject to any legal requirement to keep clinical records. Contact us using the details below.'],
    ['Contact', `For any privacy questions, call ${P1} or ${P2}, or message us on WhatsApp.`],
  ] : [
    ['About these terms', `These terms apply to your use of this website and to appointments booked with ${config.clinic.name}. By using the website or booking an appointment, you agree to them.`],
    ['Online bookings', 'An online booking is a request for an appointment. Your appointment is confirmed when our team contacts you by phone or WhatsApp. We may need to reschedule in exceptional circumstances, and will contact you if so.'],
    ['Cancellations and late arrivals', 'Please give at least 24 hours’ notice if you need to cancel or reschedule. If you arrive late, we may need to shorten or rebook your treatment so other clients are not delayed. Repeated missed appointments may require a deposit for future bookings.'],
    ['Consultations and suitability', 'Treatments are provided only where our doctor considers them safe and suitable. We may decline or postpone treatment based on your medical history or skin condition. Please disclose all relevant medical information, medicines and allergies.'],
    ['Results', 'Results vary between individuals and are not guaranteed. Information on this website is general and does not replace a personal consultation.'],
    ['Pricing and payment', 'Prices are confirmed before treatment begins. Package terms, where offered, will be explained at the time of purchase.'],
    ['Website content', 'Content on this website is for general information. We aim to keep it accurate and up to date but it may change without notice.'],
    ['Governing law', 'These terms are governed by the laws of Pakistan, and any disputes are subject to the courts of Islamabad.'],
    ['Contact', `Questions about these terms? Call ${P1} or ${P2}.`],
  ];
  const title = kind === 'privacy' ? 'Privacy Policy' : 'Terms &amp; Conditions';
  const body = `
${pageHero({ kicker: 'Legal', title, lead: `Last updated ${updated}`, crumbs: [[kind === 'privacy' ? 'Privacy Policy' : 'Terms & Conditions']] })}
<section class="section-tight">
  <div class="container legal">
    <nav class="legal-toc" aria-label="Contents"><p class="kicker">Contents</p>${sections.map(([h], i) => `<a href="#s${i + 1}">${i + 1}. ${h}</a>`).join('')}</nav>
    <article class="legal-body">${sections.map(([h, t], i) => `<section id="s${i + 1}"><h2><span>${i + 1}.</span> ${h}</h2><p>${esc(t)}</p></section>`).join('')}</article>
  </div>
</section>`;
  return layout({ title: kind === 'privacy' ? 'Privacy Policy' : 'Terms & Conditions', description: `${kind === 'privacy' ? 'Privacy policy' : 'Terms and conditions'} for Dermiére Aesthetic & Wellness Clinic, Islamabad.`, body });
}

function notFound() {
  const body = `<section class="nf"><div class="container narrow center"><p class="kicker">404</p><h1>This page could not be found</h1><p class="lead">The page may have moved. Try one of these instead.</p><div class="row-actions center-actions"><a class="btn btn-dark" href="/">Home</a><a class="btn btn-outline" href="/treatments">Treatments</a><a class="btn btn-outline" href="/book">Book online</a></div></div></section>`;
  return layout({ title: 'Page not found', description: 'Page not found', body });
}

module.exports = { home, about, doctor, treatmentsIndex, treatment, clinicsIndex, clinic, book, contact, faqsPage, legal, notFound };
