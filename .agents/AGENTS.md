# Beyond Thyme — Agent Rules (AGENTS.md)
# These rules are NON-NEGOTIABLE for all AI agents working on this project.
# Violating any rule below is a BLOCKING error. Fix it before proceeding.

---

## RULE 1 — No Hardcoding (Zero Tolerance)

All data that could ever change must live in `config/`:

| Data type | Config file |
|---|---|
| Club names, locations, seat lists | `config/clubs.js` |
| Menu eras, course names, descriptions | `config/menu.js` |
| Seed guestbook entries | `config/guestbook.js` |
| Timing constants, audio frequencies, regex, magic numbers | `config/app.config.js` |

**NEVER** write a string like `"Vedic Fire"`, a number like `880`, or a regex like `/^[^\s@]+@/` directly in `app.js` or any module file. Import it from config.

---

## RULE 2 — No Inline Styles (Zero Tolerance)

The attribute `style=""` is **forbidden** in `index.html` and in any JS template literal that builds HTML strings.

Every visual property must be expressed as a **CSS class** in `index.css`.

If a new visual state is needed:
1. Define a new class in `index.css` using CSS custom properties from `:root`
2. Apply the class in HTML or JS via `classList.add()`

**BAD**: `element.style.color = '#ff5a2e';`
**GOOD**: `element.classList.add('text-coral');`

---

## RULE 3 — No Magic Numbers

All numeric literals must be named constants in `config/app.config.js`.

**BAD**: `setTimeout(fn, 3200)`
**GOOD**: `setTimeout(fn, DIAGNOSTIC_DELAYS_MS[4])`

**BAD**: `osc.frequency.setValueAtTime(880, ...)`
**GOOD**: `osc.frequency.setValueAtTime(AUDIO.BEACON_FREQ_HZ, ...)`

---

## RULE 4 — Module Boundaries (Single Responsibility)

Each module has exactly one responsibility. Cross-module calls must go through explicit imports.

| Module | Owns |
|---|---|
| `modules/cursor.js` | Custom cursor init + hover binding |
| `modules/audio.js` | All Web Audio API logic |
| `modules/terminal.js` | Terminal console output |
| `modules/countdown.js` | Countdown timer |
| `modules/seating.js` | Seat rendering + DOM manipulation |
| `modules/vault.js` | Treasure hunt coordinates + vault breaker |
| `modules/vetting.js` | Multi-step vetting overlay |
| `modules/renderer.js` | Data → DOM rendering (clubs, menu, guestbook) |
| `app.js` | Wiring only — no logic, imports everything |

Do not add business logic to `app.js`. Do not let one module directly call another without importing it.

---

## RULE 5 — ES Modules Only

All JS files use `import`/`export` syntax. No `var`, no `window.X = ...`, no global variable leakage.

`app.js` is loaded as `<script type="module" src="app.js">` — this is required.

---

## RULE 6 — Light Theme Only

The site uses a single warm parchment light theme. There is no dark mode. Do not add:
- Any `body.dark-mode` or `body.light-mode` class toggling
- Any `prefers-color-scheme: dark` media queries
- Any dark background color (`#0a0908`, `#1a1410`, etc.) outside the VIP and overlay panels

---

## RULE 7 — CSS Custom Properties for All Color Values

All colors are defined as custom properties in `:root` in `index.css`. Never use raw hex codes in JS.

**BAD**: `element.style.background = '#ff5a2e';`
**GOOD**: `element.style.background = 'var(--color-coral)';`
**BEST**: Use a CSS class (see Rule 2).

---

## RULE 8 — Semantic HTML

Use the correct HTML element for the job:

| Element | Use for |
|---|---|
| `<button>` | Interactive controls, club card toggles, form submits |
| `<a>` | Navigation links |
| `<form>` | User input groups |
| `<article>` | Menu cards, club cards |
| `<section>` | Page sections (hero, menu, seating, vault, community) |
| `<nav>` | Navigation |
| `<footer>` | Page footer |
| `<h1>`–`<h4>` | Heading hierarchy |

Do not use `<div>` where a semantic element applies.

---

## RULE 9 — Config-Driven Rendering

HTML files contain **structure only** — no data, no content that could change.

All user-visible text content that is domain-specific (club names, menu items, copy) must be:
1. Defined in a `config/` file
2. Injected into the DOM by a `modules/renderer.js` function

**Exceptions**: Static UI labels (navigation items, legend labels, button text) may remain in HTML.

---

## RULE 10 — Vite/Hostinger Compatibility

This project is a static site deployed to Hostinger. Always ensure:
- No server-side dependencies
- All imports use relative paths (e.g., `./config/clubs.js`)
- The production build command is `npm run build` → outputs to `dist/`
- Do not introduce Node.js-only APIs or `require()` calls

---

## RULE 11 — Strict Symmetry & Proportional Layout constraints (Zero Tolerance)

# Beyond Thyme — Agent Rules (AGENTS.md)
# These rules are NON-NEGOTIABLE for all AI agents working on this project.
# Violating any rule below is a BLOCKING error. Fix it before proceeding.

---

## RULE 1 — No Hardcoding (Zero Tolerance)

All data that could ever change must live in `config/`:

| Data type | Config file |
|---|---|
| Club names, locations, seat lists | `config/clubs.js` |
| Menu eras, course names, descriptions | `config/menu.js` |
| Seed guestbook entries | `config/guestbook.js` |
| Timing constants, audio frequencies, regex, magic numbers | `config/app.config.js` |

**NEVER** write a string like `"Vedic Fire"`, a number like `880`, or a regex like `/^[^\s@]+@/` directly in `app.js` or any module file. Import it from config.

---

## RULE 2 — No Inline Styles (Zero Tolerance)

The attribute `style=""` is **forbidden** in `index.html` and in any JS template literal that builds HTML strings.

Every visual property must be expressed as a **CSS class** in `index.css`.

If a new visual state is needed:
1. Define a new class in `index.css` using CSS custom properties from `:root`
2. Apply the class in HTML or JS via `classList.add()`

**BAD**: `element.style.color = '#ff5a2e';`
**GOOD**: `element.classList.add('text-coral');`

---

## RULE 3 — No Magic Numbers

All numeric literals must be named constants in `config/app.config.js`.

**BAD**: `setTimeout(fn, 3200)`
**GOOD**: `setTimeout(fn, DIAGNOSTIC_DELAYS_MS[4])`

**BAD**: `osc.frequency.setValueAtTime(880, ...)`
**GOOD**: `osc.frequency.setValueAtTime(AUDIO.BEACON_FREQ_HZ, ...)`

---

## RULE 4 — Module Boundaries (Single Responsibility)

Each module has exactly one responsibility. Cross-module calls must go through explicit imports.

| Module | Owns |
|---|---|
| `modules/cursor.js` | Custom cursor init + hover binding |
| `modules/audio.js` | All Web Audio API logic |
| `modules/terminal.js` | Terminal console output |
| `modules/countdown.js` | Countdown timer |
| `modules/seating.js` | Seat rendering + DOM manipulation |
| `modules/vault.js` | Treasure hunt coordinates + vault breaker |
| `modules/vetting.js` | Multi-step vetting overlay |
| `modules/renderer.js` | Data → DOM rendering (clubs, menu, guestbook) |
| `app.js` | Wiring only — no logic, imports everything |

Do not add business logic to `app.js`. Do not let one module directly call another without importing it.

---

## RULE 5 — ES Modules Only

All JS files use `import`/`export` syntax. No `var`, no `window.X = ...`, no global variable leakage.

`app.js` is loaded as `<script type="module" src="app.js">` — this is required.

---

## RULE 6 — Light Theme Only

The site uses a single warm parchment light theme. There is no dark mode. Do not add:
- Any `body.dark-mode` or `body.light-mode` class toggling
- Any `prefers-color-scheme: dark` media queries
- Any dark background color (`#0a0908`, `#1a1410`, etc.) outside the VIP and overlay panels

---

## RULE 7 — CSS Custom Properties for All Color Values

All colors are defined as custom properties in `:root` in `index.css`. Never use raw hex codes in JS.

**BAD**: `element.style.background = '#ff5a2e';`
**GOOD**: `element.style.background = 'var(--color-coral)';`
**BEST**: Use a CSS class (see Rule 2).

---

## RULE 8 — Semantic HTML

Use the correct HTML element for the job:

| Element | Use for |
|---|---|
| `<button>` | Interactive controls, club card toggles, form submits |
| `<a>` | Navigation links |
| `<form>` | User input groups |
| `<article>` | Menu cards, club cards |
| `<section>` | Page sections (hero, menu, seating, vault, community) |
| `<nav>` | Navigation |
| `<footer>` | Page footer |
| `<h1>`–`<h4>` | Heading hierarchy |

Do not use `<div>` where a semantic element applies.

---

## RULE 9 — Config-Driven Rendering

HTML files contain **structure only** — no data, no content that could change.

All user-visible text content that is domain-specific (club names, menu items, copy) must be:
1. Defined in a `config/` file
2. Injected into the DOM by a `modules/renderer.js` function

**Exceptions**: Static UI labels (navigation items, legend labels, button text) may remain in HTML.

---

## RULE 10 — Vite/Hostinger Compatibility

This project is a static site deployed to Hostinger. Always ensure:
- No server-side dependencies
- All imports use relative paths (e.g., `./config/clubs.js`)
- The production build command is `npm run build` → outputs to `dist/`
- Do not introduce Node.js-only APIs or `require()` calls

---

## RULE 11 — Strict Symmetry & Proportional Layout constraints (Zero Tolerance)

The entire website MUST follow strict symmetric visual patterns. Asymmetrical layouts (e.g., offset side-panels, misaligned footers, or unbalanced grids) are explicitly forbidden for primary sections. 

1. **Standardized Container Widths:** 
   The width of all primary layout containers (e.g., seating schematics, menus, and sections) MUST perfectly match the width of the top header (`.nav-container` / `.max-width-container`) and the primary "Time Card". 
2. **Centering is Mandatory:** 
   All primary containers must be perfectly centered on the page using `margin: 0 auto` or `justify-content: center`. 
3. **Symmetric Shrinking:**
   When scaling down for mobile or smaller viewports, elements must shrink symmetrically from the center (`transform-origin: top center` or flexbox centering). Left-biased or right-biased scaling is prohibited.

> **EXCEPTION**: The "Dark Timepiece" seating layout module is explicitly exempt from this rule. It is permitted to use an asymmetrical design (e.g., offset panels, 3D watch canvas) to maintain its intended aesthetic.
