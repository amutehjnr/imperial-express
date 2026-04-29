/* ============================================================
   IMPERIAL ENGINEERING CONSTRUCTION LIMITED
   main.js — client-side interactions
   ============================================================ */
(function () {
  'use strict';

  /* ── Navbar scroll shadow ── */
  const navbar = document.querySelector('.navbar');
  const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 60);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── Active nav link ── */
  const path = window.location.pathname;
  document.querySelectorAll('.nav-links a, .nav-mobile a').forEach(a => {
    const href = a.getAttribute('href') || '';
    const active =
      (path === '/'          && (href === '/'  || href === '/index.html')) ||
      (path === '/services'  && href === '/services') ||
      (path === '/contact'   && href === '/contact');
    if (active) a.classList.add('active');
  });

  /* ── Hamburger ── */
  const burger    = document.querySelector('.hamburger');
  const mobileNav = document.querySelector('.nav-mobile');
  if (burger && mobileNav) {
    burger.addEventListener('click', () => {
      burger.classList.toggle('open');
      mobileNav.classList.toggle('open');
      burger.setAttribute('aria-expanded', burger.classList.contains('open'));
    });
    mobileNav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        burger.classList.remove('open');
        mobileNav.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
    document.addEventListener('click', e => {
      if (!burger.contains(e.target) && !mobileNav.contains(e.target)) {
        burger.classList.remove('open');
        mobileNav.classList.remove('open');
      }
    });
  }

  /* ── Scroll reveal ── */
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
    }, { threshold: 0.12 });
    revealEls.forEach(el => obs.observe(el));
  }

  /* ── Counter animation ── */
  function animateCount(el, target, dur = 1800) {
    let start;
    const tick = ts => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.floor(ease * target);
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = target;
    };
    requestAnimationFrame(tick);
  }
  const counters = document.querySelectorAll('[data-counter]');
  if (counters.length) {
    const cObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          animateCount(e.target, parseInt(e.target.dataset.counter, 10));
          cObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(el => cObs.observe(el));
  }

  /* ── Contact form (AJAX to Express POST /send-message) ── */
  const form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const btn = form.querySelector('.form-submit');
      btn.disabled = true;
      btn.innerHTML = '<span>Sending…</span>';
      try {
        const res  = await fetch('/send-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(Object.fromEntries(new FormData(form)))
        });
        const data = await res.json();
        if (data.success) {
          form.style.display = 'none';
          document.getElementById('formSuccess').classList.add('show');
        } else {
          btn.disabled = false;
          btn.innerHTML = 'Try Again';
        }
      } catch {
        btn.disabled = false;
        btn.innerHTML = 'Try Again — Network Error';
      }
    });
  }

  /* ── Hero parallax (subtle) ── */
  const heroBg = document.querySelector('.hero-bg');
  if (heroBg) {
    window.addEventListener('scroll', () => {
      heroBg.style.transform = `translateY(${window.scrollY * 0.22}px)`;
    }, { passive: true });
  }

  /* ── Smooth anchor scroll ── */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const tgt = document.querySelector(a.getAttribute('href'));
      if (tgt) {
        e.preventDefault();
        const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'), 10) || 72;
        window.scrollTo({ top: tgt.getBoundingClientRect().top + window.scrollY - navH - 16, behavior: 'smooth' });
      }
    });
  });

})();

// Equipment Carousel
function initCarousel() {
  const track = document.querySelector('.carousel-track');
  const slides = document.querySelectorAll('.carousel-slide');
  const prevBtn = document.querySelector('.carousel-btn.prev');
  const nextBtn = document.querySelector('.carousel-btn.next');
  const dotsContainer = document.querySelector('.carousel-dots');
  
  if (!track || !slides.length) return;
  
  let currentIndex = 0;
  const slideCount = slides.length;
  
  // Create dots
  slides.forEach((_, i) => {
    const dot = document.createElement('div');
    dot.classList.add('carousel-dot');
    if (i === 0) dot.classList.add('active');
    dot.addEventListener('click', () => goToSlide(i));
    dotsContainer.appendChild(dot);
  });
  
  const dots = document.querySelectorAll('.carousel-dot');
  
  function updateDots() {
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === currentIndex);
    });
  }
  
  function goToSlide(index) {
    if (index < 0) index = 0;
    if (index >= slideCount) index = slideCount - 1;
    currentIndex = index;
    track.style.transform = `translateX(-${currentIndex * 100}%)`;
    updateDots();
  }
  
  function nextSlide() {
    if (currentIndex < slideCount - 1) {
      goToSlide(currentIndex + 1);
    } else {
      goToSlide(0);
    }
  }
  
  function prevSlide() {
    if (currentIndex > 0) {
      goToSlide(currentIndex - 1);
    } else {
      goToSlide(slideCount - 1);
    }
  }
  
  prevBtn.addEventListener('click', prevSlide);
  nextBtn.addEventListener('click', nextSlide);
  
  // Auto-play every 5 seconds
  let autoPlay = setInterval(nextSlide, 5000);
  
  // Pause auto-play on hover
  const carousel = document.querySelector('.equip-carousel');
  carousel.addEventListener('mouseenter', () => clearInterval(autoPlay));
  carousel.addEventListener('mouseleave', () => {
    autoPlay = setInterval(nextSlide, 5000);
  });
}

// Initialize carousel when DOM is loaded
document.addEventListener('DOMContentLoaded', initCarousel);
