'use strict';

/**
 * Zajednička ponašanja za sve javne stranice:
 * - sticky header sjenka pri skrolu
 * - hamburger meni na mobilnom
 * - obilježavanje aktivnog linka u navigaciji
 * - "reveal" animacije pri skrolu (fade-in/slide-up)
 * - dinamičko postavljanje godine u footeru
 */
(function () {
  const header = document.querySelector('.site-header');
  const hamburger = document.querySelector('.hamburger');
  const mobileNav = document.querySelector('.mobile-nav');

  function onScroll() {
    if (!header) return;
    if (window.scrollY > 8) header.classList.add('is-scrolled');
    else header.classList.remove('is-scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      const willOpen = !mobileNav.classList.contains('is-open');
      mobileNav.classList.toggle('is-open', willOpen);
      hamburger.classList.toggle('is-active', willOpen);
      hamburger.setAttribute('aria-expanded', String(willOpen));
      document.body.style.overflow = willOpen ? 'hidden' : '';
    });
    mobileNav.querySelectorAll('a').forEach((a) =>
      a.addEventListener('click', () => {
        mobileNav.classList.remove('is-open');
        hamburger.classList.remove('is-active');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      })
    );
  }

  // Obilježi aktivan link u navigaciji na osnovu trenutne putanje.
  const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
  document.querySelectorAll('.main-nav a, .mobile-nav a').forEach((link) => {
    const linkPath = link.getAttribute('href');
    if (!linkPath) return;
    const normalized = linkPath.replace(/\/$/, '') || '/';
    if (normalized === currentPath) {
      link.setAttribute('aria-current', 'page');
    }
  });

  // Reveal animacije - suptilne, bez usporavanja stranice.
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealEls.forEach((el) => observer.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  document.querySelectorAll('[data-current-year]').forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  // Kartice/redovi vožnji (trip-card, timetable-card, redovi tabele) imaju
  // data-href atribut - klik bilo gdje na njima vodi na detalje vožnje,
  // ne samo na malo dugme "Detalji" (bitno za dodir na mobilnom).
  document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-href]');
    if (!target) return;
    if (e.target.closest('a')) return; // ne duplira klik ako je već kliknuto na link/dugme unutra
    const href = target.getAttribute('data-href');
    if (href) window.location.href = href;
  });
})();
