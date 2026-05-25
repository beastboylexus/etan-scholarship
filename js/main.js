/* ============================================
   Egbert Aung Kyaing Tan Trust Scholarship
   Main JS — lang toggle, nav, scroll, counters
   ============================================ */

(function () {
  'use strict';

  let config = null;
  let currentLang = 'en';

  // --- INIT ---
  async function init() {
    try {
      const res = await fetch('data/config.json');
      config = await res.json();
    } catch (e) {
      console.error('Failed to load config:', e);
      return;
    }

    // Detect saved language
    const saved = localStorage.getItem('eakt-lang');
    if (saved && config[saved]) currentLang = saved;

    applyLang(currentLang);
    setupNav();
    setupLangToggle();
    setupScrollAnimations();
    setupCounters();
    setupForms();
    setFooterYear();
  }

  // --- LANGUAGE ---
  function applyLang(lang) {
    currentLang = lang;
    localStorage.setItem('eakt-lang', lang);
    document.documentElement.setAttribute('data-lang', lang);
    document.documentElement.setAttribute('lang', lang);

    const data = config[lang];
    if (!data) return;

    // Update lang toggle label
    const toggleLabel = document.querySelector('.lang-toggle__label');
    if (toggleLabel) toggleLabel.textContent = lang === 'en' ? 'MY' : 'EN';

    // Text content via data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const val = getNested(data, key);
      if (val !== undefined) el.textContent = val;
    });

    // Placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const val = getNested(data, key);
      if (val !== undefined) el.placeholder = val;
    });

    // Lists (ul/ol items)
    document.querySelectorAll('[data-i18n-list]').forEach(el => {
      const key = el.getAttribute('data-i18n-list');
      const arr = getNested(data, key);
      if (Array.isArray(arr)) {
        el.innerHTML = arr.map(item => `<li>${item}</li>`).join('');
      }
    });

    // Steps
    document.querySelectorAll('[data-i18n-steps]').forEach(el => {
      const key = el.getAttribute('data-i18n-steps');
      const arr = getNested(data, key);
      if (Array.isArray(arr)) {
        el.innerHTML = arr.map(s =>
          `<li><span class="step-num">${s.num}</span> <span>${s.text}</span></li>`
        ).join('');
      }
    });

    // FAQ
    document.querySelectorAll('[data-i18n-faq]').forEach(el => {
      const key = el.getAttribute('data-i18n-faq');
      const arr = getNested(data, key);
      if (Array.isArray(arr)) {
        el.innerHTML = arr.map(f =>
          `<details class="faq__item"><summary>${f.q}</summary><p>${f.a}</p></details>`
        ).join('');
      }
    });

    // Select options
    document.querySelectorAll('[data-i18n-select]').forEach(el => {
      const key = el.getAttribute('data-i18n-select');
      const arr = getNested(data, key);
      if (Array.isArray(arr)) {
        el.innerHTML = arr.map(opt => `<option value="${opt}">${opt}</option>`).join('');
      }
    });

    // Icon cards (mission)
    document.querySelectorAll('[data-i18n-group]').forEach(el => {
      const prefix = el.getAttribute('data-i18n-group');
      el.querySelectorAll('[data-i18n]').forEach(child => {
        const key = child.getAttribute('data-i18n');
        const val = getNested(data, key);
        if (val !== undefined) child.textContent = val;
      });
    });

    // Stat values (preserve counters)
    const stats = getNested(data, 'support.stats');
    if (stats) {
      document.querySelectorAll('.stat').forEach((el, i) => {
        if (stats[i]) {
          const label = el.querySelector('.stat__label');
          if (label) label.textContent = stats[i].label;
        }
      });
    }
  }

  function getNested(obj, path) {
    return path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
  }

  // --- LANG TOGGLE ---
  function setupLangToggle() {
    const btn = document.getElementById('langToggle');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const next = currentLang === 'en' ? 'my' : 'en';
      applyLang(next);
    });
  }

  // --- NAV ---
  function setupNav() {
    const nav = document.getElementById('nav');
    const toggle = document.getElementById('navToggle');
    const menu = document.getElementById('navMenu');

    // Scroll state
    window.addEventListener('scroll', () => {
      nav.classList.toggle('nav--scrolled', window.scrollY > 20);
    }, { passive: true });

    // Mobile toggle
    if (toggle && menu) {
      toggle.addEventListener('click', () => {
        menu.classList.toggle('open');
        toggle.classList.toggle('active');
      });

      // Close on link click
      menu.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => {
          menu.classList.remove('open');
          toggle.classList.remove('active');
        });
      });
    }
  }

  // --- SCROLL ANIMATIONS ---
  function setupScrollAnimations() {
    // Add fade-in class to sections
    document.querySelectorAll('.section').forEach(s => {
      s.classList.add('fade-in');
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
  }

  // --- COUNTERS ---
  function setupCounters() {
    const counters = document.querySelectorAll('[data-counter]');
    if (!counters.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          animateCounter(e.target);
          observer.unobserve(e.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(c => observer.observe(c));
  }

  function animateCounter(el) {
    const target = parseInt(el.getAttribute('data-counter'), 10);
    const valueEl = el.querySelector('.stat__value');
    if (!valueEl || target === 0) return;

    const text = valueEl.textContent;
    const prefix = text.match(/^[^0-9]*/)?.[0] || '';
    const suffix = text.match(/[^0-9]*$/)?.[0] || '';

    let current = 0;
    const step = Math.max(1, Math.ceil(target / 40));
    const interval = setInterval(() => {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(interval);
      }
      valueEl.textContent = prefix + current + suffix;
    }, 30);
  }

  // --- FOOTER YEAR ---
  function setFooterYear() {
    const el = document.getElementById('year');
    if (el) el.textContent = new Date().getFullYear();
  }

  // --- FORMS ---
  function setupForms() {
    // Apply form
    const applyForm = document.getElementById('applyForm');
    const applySuccess = document.getElementById('applySuccess');
    if (applyForm && applySuccess) {
      applyForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(applyForm);
        const data = Object.fromEntries(fd.entries());
        console.log('Application submitted:', data);
        applyForm.style.display = 'none';
        applySuccess.style.display = 'block';
        applySuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }

    // Contact form
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
      contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(contactForm);
        const data = Object.fromEntries(fd.entries());
        console.log('Contact form submitted:', data);
        alert(currentLang === 'my'
          ? 'ကျေးဇူးတင်ပါသည်။ မကြာမီ ဆက်သွယ်ပါမည်။'
          : 'Thank you. We will be in touch soon.');
        contactForm.reset();
      });
    }
  }

  // --- GO ---
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();