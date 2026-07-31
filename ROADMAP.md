# Beyond Thyme — Product Roadmap & Feature Specification

> **Status**: Living document. Updated as features are discussed and confirmed.
> **Last updated**: 2026-07-31

---

## 1. Current State (Completed)

| Area | What is done |
|---|---|
| Frontend | Premium light theme (warm parchment, coral, gold) |
| Architecture | Fully modular — config/ + modules/ + thin app.js orchestrator |
| Club Selector | 4 interactive club cards rendered from config/clubs.js |
| Seating | 25-seat dynamic floorplan with avatar/alias system |
| Vetting | 3-step overlay (identity, dietary, avatar) |
| Menu | Eras of Flavor — 3 eras x 3 courses rendered from config/menu.js |
| Vault | Daily treasure hunt (X/Y coordinates), Amrit Yuga VIP unlock |
| Audio | Web Audio ambient hum + chimes, slider-calibrated |
| Guestbook | Timeline log with emoji alias system |
| Rules | .agents/AGENTS.md — 10 non-negotiable coding rules |
| Git | First commit pushed to github.com/garapatirakesh/beyondthyme |

---

## 2. Feature: Firebase-Powered Admin Panel

### 2.1 Why Firebase
- Free tier — Firestore + Auth + Hosting all on Spark plan (no cost to start)
- Real-time — Firestore updates live site instantly when admin saves
- Google Auth — team logs in with Gmail, no separate passwords to manage
- Static-friendly — works perfectly with Hostinger static hosting (reads via JS SDK)

### 2.2 Requirements Gathered
- Weekly updates (clubs run on a fixed day each week)
- 4 active clubs
- 9 dishes change per club, per event
- Auto-archive after dinner date/time passes + manual override
- Save in admin = instantly live on guest site
- Admin location: `beyondthyme.com/admin`
- One central contact for all clubs

---

## 3. Feature: Radical Re-imagining of Customer Vetting & Login

### 3.1 The Concept: "The Temporal Calibration Terminal"
We discard simple input fields and overlays. The login and data-collection process becomes a cinematic, premium retro-futuristic diagnostic sequence with immersive visuals and Web Audio API feedback.

### 3.2 Feature Mechanics

#### A. Zero-Password Gamified Authentication ("Login")
- **The Concept:** Guests do not use passwords. To return to the site and view, update, or cancel their ticket, they use their **Alias** + **Vibe Vector Coordinates** (e.g. 42-65-88).
- **The Login Flow:** 
  1. User enters their Alias.
  2. The system prompts them to adjust the vibe sliders/dials to match their initial calibration coordinates.
  3. When aligned, the system triggers a chime, grants access, and renders their custom ticket.
  4. Optionally, a magic link is emailed/WhatsApped as a fallback.

#### B. Radical RSVP & Information Collection Flow

**Phase 1: Terminal Boot & Sound Sync**
- Clicking a seat dims the lights and boots a mock vector scanner console.
- **Micro-animation:** A scan-line grid overlays the form while a low-frequency hum (55Hz) shifts into a high-resonance chime.
- The terminal prints text character-by-character: `INITIATING HANDSHAKE WITH SOUTH DELHI VILLA SECURE RECORDS...`

**Phase 2: Identity Extraction (Alias & Contact)**
- Sleek editorial input fields with floating typewriter effects. 
- Typing an alias prints it letter-by-letter in real-time onto a blank digital ticket template visible at the edge of the panel.

**Phase 3: Interactive Rotary Dials (Replacing standard Sliders)**
- We replace the standard flat sliders with **3 concentric circular dials** (time, social vector, flavor density) that guests can rotate manually using mouse drag or touch.
- Rotating a dial plays a ticking click sound (synthesized clock ticks).
- The Radar Vibe Canvas updates dynamically in the center of the dials.

**Phase 4: Symbol Alignment (Avatar)**
- A clean editorial watch-face layout. The selected temporal symbol rotates 360 degrees and embeds itself into the digital ticket watermark.

**Phase 5: The "Printout" Handshake**
- Upon completion, the console displays: `CALIBRATION COMPLETE. GENERATING COORDINATE PASS...`
- The ticket literally "slides out" from a slot at the top/bottom, accompanied by a realistic thermal printer sound (white noise sweep synthesized via Web Audio API).

---

## 4. Open Questions

- What Gmail addresses should be whitelisted for admin access?
- Should the Past Dinners archive be visible to guests on the main site, or admin-only?
- Should guests be able to join a waitlist notified when next week club goes live?
- Should vault coordinates (X/Y) also be manageable via admin panel, or keep auto-generated?

---

## 5. Technical Constraints (Non-Negotiable)

Defined in .agents/AGENTS.md — applies to all future work:
1. No hardcoding — all data in config/ or Firestore
2. No inline styles — all styling via CSS classes
3. No magic numbers — all constants in config/app.config.js
4. Module boundaries — one responsibility per file
5. ES Modules only — no var, no window.X
6. Light theme only — no dark mode
7. CSS custom properties for all colors
8. Semantic HTML
9. Config-driven rendering
10. Hostinger-compatible static output (npm run build)
