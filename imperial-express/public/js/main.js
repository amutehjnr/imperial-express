/* ============================================================
   Imperial Engineering Construction Limited — main.js
   ============================================================ */

// ── Navbar: hamburger toggle ──────────────────────────────────
const hamburger  = document.querySelector('.hamburger');
const navMobile  = document.querySelector('.nav-mobile');

if (hamburger && navMobile) {
  hamburger.addEventListener('click', () => {
    const expanded = hamburger.getAttribute('aria-expanded') === 'true';
    hamburger.setAttribute('aria-expanded', String(!expanded));
    navMobile.classList.toggle('open');
    hamburger.classList.toggle('open');
  });
}

// ── Scroll reveal ─────────────────────────────────────────────
const revealEls = document.querySelectorAll('.reveal');
if (revealEls.length) {
  const observer = new IntersectionObserver(
    (entries) => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } }),
    { threshold: 0.12 }
  );
  revealEls.forEach(el => observer.observe(el));
}

// ── Counter animation (hero stats) ───────────────────────────
const counters = document.querySelectorAll('[data-counter]');
if (counters.length) {
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el     = entry.target;
      const target = +el.dataset.counter;
      const step   = Math.ceil(target / 60);
      let current  = 0;
      const tick = () => {
        current = Math.min(current + step, target);
        el.textContent = current.toLocaleString();
        if (current < target) requestAnimationFrame(tick);
      };
      tick();
      counterObserver.unobserve(el);
    });
  }, { threshold: 0.5 });
  counters.forEach(c => counterObserver.observe(c));
}

// ── Equipment carousel (services page) ───────────────────────
const track    = document.querySelector('.carousel-track');
const slides   = document.querySelectorAll('.carousel-slide');
const dotsWrap = document.querySelector('.carousel-dots');
const prevBtn  = document.querySelector('.carousel-btn.prev');
const nextBtn  = document.querySelector('.carousel-btn.next');

if (track && slides.length) {
  let current = 0;

  // Build dots
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', `Slide ${i + 1}`);
    dot.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(dot);
  });

  const dots = () => dotsWrap.querySelectorAll('.dot');

  function goTo(idx) {
    current = (idx + slides.length) % slides.length;
    track.style.transform = `translateX(-${current * 100}%)`;
    dots().forEach((d, i) => d.classList.toggle('active', i === current));
  }

  prevBtn && prevBtn.addEventListener('click', () => goTo(current - 1));
  nextBtn && nextBtn.addEventListener('click', () => goTo(current + 1));

  // Auto-advance
  setInterval(() => goTo(current + 1), 4500);
}

// ── Contact Form Submission ───────────────────────────────────
const contactForm  = document.getElementById('contactForm');
const formSuccess  = document.getElementById('formSuccess');
const submitBtn    = contactForm && contactForm.querySelector('.form-submit');

if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Clear previous errors
    contactForm.querySelectorAll('.field-error').forEach(el => el.remove());
    contactForm.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));

    // Client-side validation
    const fields = {
      firstName: 'First name is required',
      lastName:  'Last name is required',
      email:     'A valid email address is required',
      message:   'Please describe your project',
    };

    let valid = true;

    for (const [id, errMsg] of Object.entries(fields)) {
      const input = contactForm.querySelector(`#${id}`);
      if (!input) continue;
      const val = input.value.trim();
      if (!val || (id === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val))) {
        input.classList.add('input-error');
        const err = document.createElement('span');
        err.className   = 'field-error';
        err.textContent = errMsg;
        input.parentNode.appendChild(err);
        valid = false;
      }
    }

    if (!valid) return;

    // Collect form data
    const data = Object.fromEntries(new FormData(contactForm).entries());

    // Show loading state on button
    const originalHTML = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg class="spin" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
      </svg>
      Sending…
    `;

    try {
      const res  = await fetch('/send-message', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(data),
      });
      const json = await res.json();

      if (json.success) {
        // Animate form out, success in
        contactForm.style.transition  = 'opacity .4s ease, transform .4s ease';
        contactForm.style.opacity     = '0';
        contactForm.style.transform   = 'translateY(-10px)';
        setTimeout(() => {
          contactForm.style.display = 'none';
          formSuccess.style.display = 'block';
          formSuccess.style.opacity = '0';
          formSuccess.style.transform = 'translateY(10px)';
          requestAnimationFrame(() => {
            formSuccess.style.transition = 'opacity .4s ease, transform .4s ease';
            formSuccess.style.opacity    = '1';
            formSuccess.style.transform  = 'translateY(0)';
          });
        }, 400);
      } else {
        showFormError(json.message || 'Something went wrong. Please try again.');
        resetButton(originalHTML);
      }
    } catch {
      showFormError('Network error. Please check your connection and try again.');
      resetButton(originalHTML);
    }
  });

  function resetButton(html) {
    submitBtn.disabled   = false;
    submitBtn.innerHTML  = html;
  }

  function showFormError(msg) {
    let banner = contactForm.querySelector('.form-error-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.className = 'form-error-banner';
      contactForm.insertBefore(banner, contactForm.firstChild);
    }
    banner.textContent = `⚠️  ${msg}`;
    banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // Remove error highlight on input
  contactForm.addEventListener('input', (e) => {
    if (e.target.classList.contains('input-error')) {
      e.target.classList.remove('input-error');
      const err = e.target.parentNode.querySelector('.field-error');
      if (err) err.remove();
    }
  });
}