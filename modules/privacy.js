/* modules/privacy.js
 * Interactive controller for Privacy Policy page.
 * Scroll progress bar, active TOC section tracking, real-time search, and PDF download.
 */

import { PRIVACY_CONFIG } from '../config/privacy.config.js';

/**
 * Initialize Privacy Policy page interactions.
 */
export function initPrivacyPage() {
  _initScrollProgress();
  _initTocObserver();
  _initSearchFilter();
  _initPdfPrinter();
}

// ── Top Scroll Progress Bar ──────────────────────────────────────────────────
function _initScrollProgress() {
  const progressBar = document.getElementById('privacyProgressBar');
  if (!progressBar) return;

  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progressBar.style.width = `${Math.min(100, Math.max(0, scrollPercent))}%`;
  }, { passive: true });
}

// ── Sticky TOC Observer ──────────────────────────────────────────────────────
function _initTocObserver() {
  const tocLinks = document.querySelectorAll('.toc-link');
  const sections = document.querySelectorAll('.policy-card');
  if (!tocLinks.length || !sections.length) return;

  const observerOptions = {
    root: null,
    rootMargin: '-20% 0px -60% 0px',
    threshold: 0.1,
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        tocLinks.forEach((link) => {
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  }, observerOptions);

  sections.forEach((section) => observer.observe(section));
}

// ── Real-Time Search Filter ──────────────────────────────────────────────────
function _initSearchFilter() {
  const searchInput = document.getElementById('policySearchInput');
  const policyCards = document.querySelectorAll('.policy-card');
  if (!searchInput || !policyCards.length) return;

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim().toLowerCase();

    policyCards.forEach((card) => {
      const text = card.innerText.toLowerCase();
      if (!query) {
        card.style.display = 'block';
      } else if (text.includes(query)) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    });
  });
}

// ── Print / PDF Exporter ─────────────────────────────────────────────────────
function _initPdfPrinter() {
  const printBtn = document.getElementById('btnPrintPolicyPDF');
  printBtn?.addEventListener('click', () => {
    window.print();
  });
}

// Automatically init if loaded on privacy page
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPrivacyPage);
} else {
  initPrivacyPage();
}
