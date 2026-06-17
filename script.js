/**
 * AutoSchutz – Main JavaScript
 * Handles: nav scroll, mobile menu, smooth scroll,
 *          IntersectionObserver fade-ins, modal + calculator
 */

'use strict';

/* ============================================================
   1. STICKY NAV — adds .nav--scrolled class on scroll
   ============================================================ */
(function initStickyNav() {
  const nav = document.getElementById('nav');
  if (!nav) return;

  let lastScroll = 0;
  const SCROLL_THRESHOLD = 40;

  function onScroll() {
    const currentScroll = window.scrollY;

    if (currentScroll > SCROLL_THRESHOLD) {
      nav.classList.add('nav--scrolled');
    } else {
      nav.classList.remove('nav--scrolled');
    }

    lastScroll = currentScroll;
  }

  // Run once on load in case page is already scrolled
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
})();


/* ============================================================
   2. ACTIVE NAV LINK — highlights link matching current section
   ============================================================ */
(function initActiveNavLinks() {
  const sections = document.querySelectorAll('section[id], div[id]');
  const navLinks = document.querySelectorAll('.nav__link');
  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          navLinks.forEach((link) => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + entry.target.id) {
              link.classList.add('active');
            }
          });
        }
      });
    },
    { rootMargin: '-30% 0px -60% 0px' }
  );

  sections.forEach((section) => observer.observe(section));
})();


/* ============================================================
   3. SMOOTH SCROLL — for all anchor links
   ============================================================ */
(function initSmoothScroll() {
  document.addEventListener('click', function (e) {
    const anchor = e.target.closest('a[href^="#"]');
    if (!anchor) return;

    const targetId = anchor.getAttribute('href');
    if (!targetId || targetId === '#') return;

    const target = document.querySelector(targetId);
    if (!target) return;

    e.preventDefault();

    const navHeight = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--nav-height') || '72',
      10
    );

    const targetTop = target.getBoundingClientRect().top + window.scrollY - navHeight;

    window.scrollTo({
      top: targetTop,
      behavior: 'smooth',
    });

    // Close mobile menu if open
    closeMobileMenu();
  });
})();


/* ============================================================
   4. MOBILE HAMBURGER MENU
   ============================================================ */
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
const navCta = document.getElementById('navCta');
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
    if (menuOpen) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  });
}

// Close menu on Escape key
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') {
    closeMobileMenu();
    closeModal();
  }
});

// Close menu on outside click
document.addEventListener('click', function (e) {
  if (menuOpen && !e.target.closest('#navLinks') && !e.target.closest('#hamburger')) {
    closeMobileMenu();
  }
});


/* ============================================================
   5. SCROLL-TRIGGERED FADE-IN ANIMATIONS
   ============================================================ */
(function initFadeInAnimations() {
  const fadeElements = document.querySelectorAll('.fade-in');
  if (!fadeElements.length) return;

  if (!('IntersectionObserver' in window)) {
    // Fallback: just show everything
    fadeElements.forEach((el) => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target); // animate once
        }
      });
    },
    {
      rootMargin: '0px 0px -80px 0px',
      threshold: 0.1,
    }
  );

  fadeElements.forEach((el) => observer.observe(el));
})();


/* ============================================================
   6. MODAL — open / close
   ============================================================ */
const modalOverlay = document.getElementById('modalOverlay');
const modal = document.getElementById('modal');

function openModal(e) {
  if (e) e.preventDefault();
  if (!modalOverlay) return;

  modalOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';

  // Focus first input inside modal
  setTimeout(() => {
    const firstInput = modal.querySelector('select, input');
    if (firstInput) firstInput.focus();
  }, 300);
}

function closeModal() {
  if (!modalOverlay) return;
  modalOverlay.classList.remove('active');
  document.body.style.overflow = '';

  // Reset result after transition
  setTimeout(() => {
    const result = document.getElementById('modalResult');
    if (result) result.classList.remove('visible');
  }, 400);
}

// Close modal when clicking backdrop
if (modalOverlay) {
  modalOverlay.addEventListener('click', function (e) {
    if (e.target === modalOverlay) {
      closeModal();
    }
  });
}

// Make functions available globally (called from onclick in HTML)
window.openModal = openModal;
window.closeModal = closeModal;


/* ============================================================
   7. BEITRAG BERECHNEN — fake insurance calculator
   ============================================================ */

/**
 * Base monthly rates (€) per Tarif
 */
const BASE_RATES = {
  haftpflicht: 5.9,
  teilkasko: 18.5,
  vollkasko: 34.9,
};

/**
 * Multipliers for vehicle type
 */
const FAHRZEUGTYP_FACTOR = {
  pkw: 1.0,
  kombi: 1.05,
  suv: 1.18,
  cabrio: 1.25,
  elektro: 1.12,
  motorrad: 0.9,
};

/**
 * Age factor based on driver's date of birth
 * Younger = higher premium
 */
function getAgeFactor(geburtsdatumValue) {
  if (!geburtsdatumValue) return 1.0;
  const birth = new Date(geburtsdatumValue);
  const today = new Date();
  const age = today.getFullYear() - birth.getFullYear();

  if (age < 20) return 2.4;
  if (age < 23) return 2.0;
  if (age < 26) return 1.6;
  if (age < 30) return 1.3;
  if (age < 50) return 1.0;
  if (age < 65) return 0.95;
  return 1.1; // over 65
}

/**
 * Vehicle age discount/surcharge
 */
function getBaujahrFactor(baujahr) {
  const year = parseInt(baujahr, 10);
  if (!year) return 1.0;
  const age = new Date().getFullYear() - year;

  if (age <= 1)  return 1.3;   // new car – higher value
  if (age <= 3)  return 1.15;
  if (age <= 6)  return 1.0;
  if (age <= 10) return 0.9;
  if (age <= 15) return 0.8;
  return 0.65; // older car
}

/**
 * PLZ-based regional factor (simplified zones)
 */
function getRegionalFactor(plz) {
  if (!plz || plz.length < 2) return 1.0;
  const prefix = parseInt(plz.substring(0, 2), 10);

  // Major city zones → higher
  if ([10, 12, 13].includes(prefix)) return 1.15; // Berlin
  if ([20, 21, 22].includes(prefix)) return 1.12; // Hamburg
  if ([80, 81].includes(prefix)) return 1.18;     // Munich
  if ([60, 63, 65].includes(prefix)) return 1.14; // Frankfurt
  if ([40, 41, 42].includes(prefix)) return 1.10; // Düsseldorf/NRW

  // Rural / lower-risk
  if (prefix >= 18 && prefix <= 19) return 0.88; // Mecklenburg
  if (prefix >= 95 && prefix <= 97) return 0.90; // Bayern rural
  if (prefix >= 99 && prefix <= 99) return 0.88; // Thüringen rural

  return 1.0;
}

function formatPrice(price) {
  return price.toLocaleString('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function calculateBeitrag() {
  const fahrzeugtyp  = document.getElementById('fahrzeugtyp').value;
  const baujahr      = document.getElementById('baujahr').value;
  const plz          = document.getElementById('plz').value;
  const geburtsdatum = document.getElementById('geburtsdatum').value;
  const tarif        = document.getElementById('tarif').value;

  // Simple validation
  const errors = [];
  if (!fahrzeugtyp)  errors.push('Fahrzeugtyp');
  if (!baujahr)      errors.push('Baujahr');
  if (!plz || !/^\d{5}$/.test(plz)) errors.push('gültige Postleitzahl (5 Ziffern)');
  if (!geburtsdatum) errors.push('Geburtsdatum');
  if (!tarif)        errors.push('Tarif');

  if (errors.length) {
    showValidationHint(errors);
    return;
  }

  // Calculate
  const base     = BASE_RATES[tarif] || 34.9;
  const typeFac  = FAHRZEUGTYP_FACTOR[fahrzeugtyp] || 1.0;
  const ageFac   = getAgeFactor(geburtsdatum);
  const yearFac  = getBaujahrFactor(baujahr);
  const regional = getRegionalFactor(plz);

  // Add a small pseudo-random variance (deterministic, based on PLZ)
  const plzSeed  = Array.from(plz).reduce((s, c) => s + parseInt(c, 10), 0);
  const variance = 1 + (plzSeed % 9 - 4) * 0.01; // ±4%

  const monthly = base * typeFac * ageFac * yearFac * regional * variance;
  const annual  = monthly * 12 * 0.9; // 10% annual discount

  // Display result
  const resultBox   = document.getElementById('modalResult');
  const resultPrice = document.getElementById('resultPrice');
  const resultNote  = document.getElementById('resultNote');

  const tarifLabel = {
    haftpflicht: 'Kfz-Haftpflicht',
    teilkasko: 'Teilkasko',
    vollkasko: 'Vollkasko',
  }[tarif] || tarif;

  resultPrice.innerHTML = `€ ${formatPrice(monthly)} <span>/ Monat</span>`;
  resultNote.textContent =
    `Tarif: ${tarifLabel} · Jahresbeitrag: € ${formatPrice(annual)} (10 % Jahresrabatt) · Unverbindlich, gültig für 14 Tage.`;

  resultBox.classList.add('visible');

  // Smooth scroll result into view
  setTimeout(() => {
    resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 100);
}

function showValidationHint(errors) {
  // Brief shake animation on the submit button + alert
  const btn = document.querySelector('.modal__footer .btn');
  if (btn) {
    btn.style.animation = 'none';
    btn.offsetHeight; // reflow
    btn.style.animation = 'shake 0.4s ease';
  }

  // Mark invalid fields
  const fields = {
    fahrzeugtyp:  document.getElementById('fahrzeugtyp'),
    baujahr:      document.getElementById('baujahr'),
    plz:          document.getElementById('plz'),
    geburtsdatum: document.getElementById('geburtsdatum'),
    tarif:        document.getElementById('tarif'),
  };

  Object.values(fields).forEach((f) => {
    if (f) f.style.borderColor = '';
  });

  if (!fields.fahrzeugtyp.value) highlightField(fields.fahrzeugtyp);
  if (!fields.baujahr.value)     highlightField(fields.baujahr);
  if (!fields.plz.value || !/^\d{5}$/.test(fields.plz.value)) highlightField(fields.plz);
  if (!fields.geburtsdatum.value) highlightField(fields.geburtsdatum);
  if (!fields.tarif.value)        highlightField(fields.tarif);

  // Focus first invalid
  const firstInvalid = document.querySelector('.form-control[aria-invalid="true"]');
  if (firstInvalid) firstInvalid.focus();
}

function highlightField(field) {
  if (!field) return;
  field.style.borderColor = '#e53935';
  field.setAttribute('aria-invalid', 'true');

  field.addEventListener('input', function resetField() {
    field.style.borderColor = '';
    field.removeAttribute('aria-invalid');
    field.removeEventListener('input', resetField);
  }, { once: true });
}

window.calculateBeitrag = calculateBeitrag;

// Inject shake keyframe into document
(function injectShakeKeyframe() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20%       { transform: translateX(-6px); }
      40%       { transform: translateX(6px); }
      60%       { transform: translateX(-4px); }
      80%       { transform: translateX(4px); }
    }
  `;
  document.head.appendChild(style);
})();


/* ============================================================
   8. KEYBOARD ACCESSIBILITY — trap focus inside modal
   ============================================================ */
(function initFocusTrap() {
  if (!modal) return;

  const FOCUSABLE =
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

  modal.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab') return;
    if (!modalOverlay.classList.contains('active')) return;

    const focusable = Array.from(modal.querySelectorAll(FOCUSABLE)).filter(
      (el) => !el.disabled && el.offsetParent !== null
    );
    if (!focusable.length) return;

    const first = focusable[0];
    const last  = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
})();


/* ============================================================
   9. PLZ INPUT — only allow digits
   ============================================================ */
(function initPlzInput() {
  const plzInput = document.getElementById('plz');
  if (!plzInput) return;

  plzInput.addEventListener('input', function () {
    this.value = this.value.replace(/\D/g, '').slice(0, 5);
  });
})();


/* ============================================================
   10. HERO SCROLL HINT — hide after user scrolls down
   ============================================================ */
(function initScrollHint() {
  const hint = document.querySelector('.hero__scroll-hint');
  if (!hint) return;

  function onScroll() {
    if (window.scrollY > 80) {
      hint.style.opacity = '0';
      hint.style.pointerEvents = 'none';
    } else {
      hint.style.opacity = '1';
      hint.style.pointerEvents = '';
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
})();


/* ============================================================
   11. NUMBER COUNT-UP ANIMATION (for .numbers section)
   ============================================================ */
(function initCountUp() {
  const numberItems = document.querySelectorAll('.number-item__value');
  if (!numberItems.length) return;

  function parseNumber(el) {
    // Extract digits only, keeping track of prefix/suffix
    const text = el.textContent.replace(/[^0-9.,]/g, '');
    return parseFloat(text.replace(',', '.')) || 0;
  }

  function animateValue(el, from, to, duration) {
    const start = performance.now();
    const originalHTML = el.innerHTML;

    // Detect suffix span if any
    const spanMatch = originalHTML.match(/<span>([^<]*)<\/span>/);
    const suffix = spanMatch ? `<span>${spanMatch[1]}</span>` : '';

    // Detect prefix span
    const prefixMatch = originalHTML.match(/^<span>([^<]*)<\/span>/);
    const prefix = prefixMatch ? `<span>${prefixMatch[1]}</span>` : '';

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(from + (to - from) * ease);

      if (prefix) {
        el.innerHTML = `${prefix}${current}${suffix}`;
      } else {
        el.innerHTML = `${current}${suffix}`;
      }

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    }

    requestAnimationFrame(tick);
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const el = entry.target;
        const target = parseNumber(el);
        if (target > 0) {
          animateValue(el, 0, target, 1600);
        }
        observer.unobserve(el);
      });
    },
    { threshold: 0.5 }
  );

  numberItems.forEach((el) => observer.observe(el));
})();
