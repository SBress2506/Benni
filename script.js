'use strict';

(function initStickyNav() {
  const nav = document.getElementById('nav');
  if (!nav) return;
  function onScroll() {
    if (window.scrollY > 40) nav.classList.add('nav--scrolled');
    else nav.classList.remove('nav--scrolled');
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
})();

(function initActiveNavLinks() {
  const sections = document.querySelectorAll('section[id], div[id]');
  const navLinks = document.querySelectorAll('.nav__link');
  if (!sections.length || !navLinks.length) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        navLinks.forEach((link) => {
          link.classList.remove('active');
          if (link.getAttribute('href') === '#' + entry.target.id) link.classList.add('active');
        });
      }
    });
  }, { rootMargin: '-30% 0px -60% 0px' });
  sections.forEach((section) => observer.observe(section));
})();

(function initSmoothScroll() {
  document.addEventListener('click', function (e) {
    const anchor = e.target.closest('a[href^="#"]');
    if (!anchor) return;
    const targetId = anchor.getAttribute('href');
    if (!targetId || targetId === '#') return;
    const target = document.querySelector(targetId);
    if (!target) return;
    e.preventDefault();
    const navHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height') || '72', 10);
    window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - navHeight, behavior: 'smooth' });
    closeMobileMenu();
  });
})();

const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
let menuOpen = false;

function openMobileMenu() {
  menuOpen = true;
  hamburger.classList.add('open');
  hamburger.setAttribute('aria-expanded', 'true');
  navLinks.classList.add('mobile-open');
  document.body.style.overflow = 'hidden';
}

function closeMobileMenu() {
  if (!menuOpen) return;
  menuOpen = false;
  hamburger.classList.remove('open');
  hamburger.setAttribute('aria-expanded', 'false');
  navLinks.classList.remove('mobile-open');
  document.body.style.overflow = '';
}

if (hamburger) {
  hamburger.addEventListener('click', function () {
    if (menuOpen) closeMobileMenu(); else openMobileMenu();
  });
}

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') { closeMobileMenu(); closeModal(); }
});

document.addEventListener('click', function (e) {
  if (menuOpen && !e.target.closest('#navLinks') && !e.target.closest('#hamburger')) closeMobileMenu();
});

(function initFadeIn() {
  const els = document.querySelectorAll('.fade-in');
  if (!els.length) return;
  if (!('IntersectionObserver' in window)) { els.forEach((el) => el.classList.add('visible')); return; }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); } });
  }, { rootMargin: '0px 0px -80px 0px', threshold: 0.1 });
  els.forEach((el) => observer.observe(el));
})();

const modalOverlay = document.getElementById('modalOverlay');
const modal = document.getElementById('modal');

function openModal(e) {
  if (e) e.preventDefault();
  if (!modalOverlay) return;
  modalOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
  setTimeout(() => { const f = modal.querySelector('select, input'); if (f) f.focus(); }, 300);
}

function closeModal() {
  if (!modalOverlay) return;
  modalOverlay.classList.remove('active');
  document.body.style.overflow = '';
  setTimeout(() => { const r = document.getElementById('modalResult'); if (r) r.classList.remove('visible'); }, 400);
}

if (modalOverlay) {
  modalOverlay.addEventListener('click', function (e) { if (e.target === modalOverlay) closeModal(); });
}

window.openModal = openModal;
window.closeModal = closeModal;

const BASE_RATES = { haftpflicht: 5.9, teilkasko: 18.5, vollkasko: 34.9 };
const FAHRZEUGTYP_FACTOR = { pkw: 1.0, kombi: 1.05, suv: 1.18, cabrio: 1.25, elektro: 1.12, motorrad: 0.9 };

function getAgeFactor(val) {
  if (!val) return 1.0;
  const age = new Date().getFullYear() - new Date(val).getFullYear();
  if (age < 20) return 2.4; if (age < 23) return 2.0; if (age < 26) return 1.6;
  if (age < 30) return 1.3; if (age < 50) return 1.0; if (age < 65) return 0.95;
  return 1.1;
}

function getBaujahrFactor(yr) {
  const age = new Date().getFullYear() - parseInt(yr, 10);
  if (age <= 1) return 1.3; if (age <= 3) return 1.15; if (age <= 6) return 1.0;
  if (age <= 10) return 0.9; if (age <= 15) return 0.8; return 0.65;
}

function getRegionalFactor(plz) {
  if (!plz || plz.length < 2) return 1.0;
  const p = parseInt(plz.substring(0, 2), 10);
  if ([10,12,13].includes(p)) return 1.15;
  if ([20,21,22].includes(p)) return 1.12;
  if ([80,81].includes(p)) return 1.18;
  if ([60,63,65].includes(p)) return 1.14;
  if ([40,41,42].includes(p)) return 1.10;
  if (p >= 18 && p <= 19) return 0.88;
  return 1.0;
}

function formatPrice(n) { return n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

function calculateBeitrag() {
  const fahrzeugtyp  = document.getElementById('fahrzeugtyp').value;
  const baujahr      = document.getElementById('baujahr').value;
  const plz          = document.getElementById('plz').value;
  const geburtsdatum = document.getElementById('geburtsdatum').value;
  const tarif        = document.getElementById('tarif').value;

  const errors = [];
  if (!fahrzeugtyp) errors.push('fahrzeugtyp');
  if (!baujahr) errors.push('baujahr');
  if (!plz || !/^\d{5}$/.test(plz)) errors.push('plz');
  if (!geburtsdatum) errors.push('geburtsdatum');
  if (!tarif) errors.push('tarif');

  if (errors.length) {
    errors.forEach((id) => {
      const f = document.getElementById(id);
      if (f) { f.style.borderColor = '#e53935'; f.addEventListener('input', () => { f.style.borderColor = ''; }, { once: true }); }
    });
    return;
  }

  const base = BASE_RATES[tarif] || 34.9;
  const typeFac = FAHRZEUGTYP_FACTOR[fahrzeugtyp] || 1.0;
  const monthly = base * typeFac * getAgeFactor(geburtsdatum) * getBaujahrFactor(baujahr) * getRegionalFactor(plz);
  const annual = monthly * 12 * 0.9;

  const tarifLabel = { haftpflicht: 'Kfz-Haftpflicht', teilkasko: 'Teilkasko', vollkasko: 'Vollkasko' }[tarif];
  document.getElementById('resultPrice').innerHTML = `€ ${formatPrice(monthly)} <span>/ Monat</span>`;
  document.getElementById('resultNote').textContent = `Tarif: ${tarifLabel} · Jahresbeitrag: € ${formatPrice(annual)} (10 % Jahresrabatt) · Unverbindlich.`;

  const resultBox = document.getElementById('modalResult');
  resultBox.classList.add('visible');
  setTimeout(() => resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
}

window.calculateBeitrag = calculateBeitrag;

(function initPlzInput() {
  const plzInput = document.getElementById('plz');
  if (!plzInput) return;
  plzInput.addEventListener('input', function () { this.value = this.value.replace(/\D/g, '').slice(0, 5); });
})();

(function initScrollHint() {
  const hint = document.querySelector('.hero__scroll-hint');
  if (!hint) return;
  window.addEventListener('scroll', () => {
    hint.style.opacity = window.scrollY > 80 ? '0' : '1';
  }, { passive: true });
})();

(function initFocusTrap() {
  if (!modal) return;
  const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  modal.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab' || !modalOverlay.classList.contains('active')) return;
    const focusable = Array.from(modal.querySelectorAll(FOCUSABLE)).filter((el) => !el.disabled && el.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last.focus(); } }
    else { if (document.activeElement === last) { e.preventDefault(); first.focus(); } }
  });
})();
