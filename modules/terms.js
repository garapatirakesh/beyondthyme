/* modules/terms.js
 * Interactive controller for Terms & Conditions page.
 * Scroll progress bar, active TOC section tracking, real-time search, and PDF download.
 */

import { TERMS_CONFIG } from '../config/terms.config.js';

/**
 * Initialize Terms & Conditions page interactions.
 */
export function initTermsPage() {
  _initScrollProgress();
  _initTocObserver();
  _initSearchFilter();
  _initPdfPrinter();
}

// ── Top Scroll Progress Bar ──────────────────────────────────────────────────
function _initScrollProgress() {
  const progressBar = document.getElementById('termsProgressBar');
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
  const sections = document.querySelectorAll('.terms-card');
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
  const searchInput = document.getElementById('termsSearchInput');
  const termsCards = document.querySelectorAll('.terms-card');
  if (!searchInput || !termsCards.length) return;

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim().toLowerCase();

    termsCards.forEach((card) => {
      const text = card.innerText.toLowerCase();
      if (!query || text.includes(query)) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    });
  });
}

// ── Print / PDF Exporter ─────────────────────────────────────────────────────
function _initPdfPrinter() {
  const printBtn = document.getElementById('btnPrintTermsPDF');
  printBtn?.addEventListener('click', () => {
    window.print();
  });
}

// Automatically init if loaded on terms page
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTermsPage);
} else {
  initTermsPage();
}
