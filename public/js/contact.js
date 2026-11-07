(function () {
  const form = document.getElementById('contactForm');
  const msg = document.getElementById('contactMsg');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type=submit]');
    const data = Object.fromEntries(new FormData(form));
    const err = (t) => { msg.innerHTML = '<div class="alert err"></div>'; msg.firstChild.textContent = t; };
    if ((data.name || '').trim().length < 2) return err('Please enter your name.');
    const d = (data.phone || '').replace(/\D/g, '');
    if (d.length < 10 || d.length > 13) return err('Please enter a valid phone number, e.g. 0300-1234567.');
    if ((data.message || '').trim().length < 5) return err('Please write a short message.');
    btn.disabled = true;
    try {
      const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const out = await res.json();
      if (!res.ok) return err(out.error || 'Something went wrong.');
      form.reset();
      msg.innerHTML = '<div class="alert ok">Thank you. Your message has been sent and our team will be in touch soon.</div>';
    } catch { err('Network error. Please try again or WhatsApp us.'); }
    finally { btn.disabled = false; }
  });
})();
