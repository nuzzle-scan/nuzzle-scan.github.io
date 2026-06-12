# CLAUDE.md — instructions for AI assistants working in this repo

This file is read automatically by Claude Code (and other coding agents
following the convention) before any task. It is the source of truth
for design, copy, and engineering decisions on the **Nuzzle** landing
page.

For the full unabridged brief, see the project knowledge base in the
private design document. This file is the operational subset.

---

## What Nuzzle is

Nuzzle is an open-source scanner and public benchmark for detecting
**sleeper agents and behavioral backdoors** in fine-tuned language
models on Hugging Face. This repo (`nuzzle.github.io`) is the public
landing page — a research artifact, not a product page.

Two evaluation tracks must remain visually and semantically separated:

- **Validation (§ 02)** — declared-poisoned models, ground truth known.
  Detection rate is the metric.
- **Wild (§ 03)** — popular HF models scanned without ground truth.
  Produces a **risk score** (0–100), never a verdict.

---

## Hard rules

These rules are non-negotiable. If a requested change conflicts with
them, flag the conflict before proceeding.

### Tone and copy
- Direct, evidence-first, never aspirational.
- No marketing language. No "Launch your AI security journey today."
- No exclamation marks. Period.
- No "we believe", "we think", "we are excited to". Statements of fact only.
- Detection claims on third-party HF models are framed as
  *risk score* or *suspicion score* — never *verdict*, *poisoned*,
  *malicious*, *compromised*.

### Visual — hard NO list
- No red alerts, warning klaxons.
- No shield, padlock, or "security badge" icons. The fox does that job.
- No marketing CTA buttons. Text links only.
- No testimonials, "trusted by" logo wall, pricing.
- No emoji in the UI.

### Engineering
- **Stack: React + Vite + Tailwind v4 + Framer Motion** (`motion` package),
  TypeScript in strict mode. `npm run dev` for local work, `npm run build`
  produces `dist/`, deployed to GitHub Pages via
  `.github/workflows/deploy.yml`.
- **Keep dependencies minimal.** Current deps: `react`, `react-dom`,
  `motion`, `tailwindcss` + `@tailwindcss/vite`, `vite`,
  `@vitejs/plugin-react`. Do not reintroduce shadcn/radix/MUI or other
  component/UI frameworks without justification in a PR description.
- **Illustrations are hand-coded inline SVG/JSX**, in
  `src/app/components/illustration/`. No raster, no PNG, no external
  image assets except a favicon and OG image.
- **Visual iteration loop**: when changing illustrations or the hero
  scroll narrative, run `npm run dev` and capture screenshots with a
  headless browser at the relevant scroll positions and viewport widths
  — look at them before considering the change done. `rsvg-convert` is
  useful for quick static-shape iteration but does not resolve `var(--x)`
  CSS custom properties; substitute literal hex values from
  `src/styles/theme.css` for those previews.
- **Numbers in tables** use the monospace font and are decimal-aligned
  (`.num` class → `font-variant-numeric: tabular-nums`).
- **Graceful degradation** is mandatory: `useReducedMotion()` and viewport
  `<900px` fall back to the static end-state — the hero renders
  `ForestScene` with the forest already parted and the fox visible, no
  sticky scroll container or scroll-driven transforms. This is a
  React/Vite SPA and requires JavaScript; the fallback target is reduced
  motion and small viewports, not JS-disabled.

---

## Design system

### Color palette (CSS variables defined in `src/styles/theme.css`)

| Token | Hex | Usage |
|---|---|---|
| `--bg` | `#0E1F16` | Page background (deep forest) |
| `--bg-alt` | `#16301F` | Cards, zebra rows, panels |
| `--bg-deep` | `#080F0A` | Gradient ends (sky/ground), vignette, `pre.code`/`pre.bib` |
| `--ink` | `#F3EEDF` | Primary text (warm cream, never pure white) |
| `--muted` | `#92AE82` | Secondary text (sage-green) |
| `--fox` | `#D96A2C` | Fox accent — links, sort indicators, top-3 glyphs |
| `--fox-deep` | `#B5521E` | Fox shading |
| `--cream` | `#F6EFE0` | Fox belly/muzzle/tail-tip |
| `--green-deep` | `#1C3A26` | Foreground forest |
| `--green-mid` | `#2F5D3A` | Midground forest |
| `--sage` | `#7FA068` | Background forest |
| `--gold` / `--amber` / `--rust` | `#E8C87A` / `#E8832A` / `#C9501F` | Warm illustration accents (autumn trees, fox markings) |
| `--brown` | `#5C4530` | Tree trunks |
| `--rule` / `--rule-strong` | `rgba(243,238,223,.12)` / `.22` | Dividers, table rules |
| `--risk-low / med / high` | `#7FB35E / #E0AE4A / #E07A36` | Risk gradient |

Fox orange is reserved for interactive elements and small
illustrations. Greens/gold/amber/rust appear in illustration (forest
scene, fox markings); UI chrome stays cream/sage/fox.

Note: `pre.code`/`pre.bib` (§ 05/§ 06) use a literal `#1A1A1A`, not a
token — close to `--bg-deep` but fixed, so code/citation blocks keep
reading as a distinct "terminal" surface independent of palette tweaks.

### Typography

- **Headlines**: `Fraunces` → `Iowan Old Style` → `Georgia` → serif.
  **Never DM Sans/Inter for headlines.**
- **Body**: `DM Sans` → `IBM Plex Sans` → system sans. 16–17px, line-height 1.6+.
- **Monospace**: `JetBrains Mono` → `IBM Plex Mono` → `ui-monospace`.
  Used for code, CLI commands, model names, parameter counts, and **all
  numeric values in tables** (`.num` class).

### Illustration style — organic vector SVG (decided 2026-06-12, user choice)
All illustration is hand-coded inline SVG/JSX in
`src/app/components/illustration/`: flat organic shapes (ellipses,
rounded rects, bezier paths), no black outlines — shading via a second
fill layer (`opacity`) or a CSS `brightness()` filter on a lighter
duplicate. This supersedes the earlier pixel-art direction; do not
revert to it.

- **`FoxSVG.tsx`**: `FoxGroup` is the shared fox `<g>`
  (viewBox-space `0 0 380 260`) — tail, legs, body, head, ears, eye,
  nose. Reused, never redrawn, by:
  - `FoxSVG` — standalone full body.
  - `FoxHeadSVG` — cropped to the face (`viewBox="220 10 170 170"`),
    used for the header wordmark glyph and the § 02 validated-model rank
    marker.
  - `ForestScene`'s fox layer and the footer corner-fox (see below).
  - `walking` prop adds a subtle idle leg/tail CSS animation
    (`fox-stride-a/b`, `fox-tail-sway` in `theme.css`), disabled under
    `prefers-reduced-motion`.
- **`ForestScene.tsx`**: hero scene, `viewBox="0 0 1440 900"`. Sky/ground
  are gradients (`--bg-deep` → `--bg` → `--green-deep`). `Tree` is a
  shared helper with `pine`/`round`/`tall` variants, `color`, `scale`,
  and `opacity` props — three depth layers, each split into left/right
  `motion.g` groups for parallax: background (`--sage`, scale ~0.4–0.65,
  low opacity), midground (`--green-mid`/`--green-deep` + `--gold`/
  `--amber`/`--rust` accents, scale ~0.75–1.3), foreground (`--green-deep`/
  `--bg-deep`, scale ~1.5–3.0 — the largest "closing cluster" trees
  bracket the fox so the closed forest fully hides it).
- **Hero scroll narrative (§ 01)**: the fox sits in its own layer between
  the midground and foreground tree groups, **always fully opaque**. As
  `scrollYProgress` advances, the foreground (and mid/background) tree
  groups translate apart on the x-axis, PHYSICALLY uncovering the fox via
  z-order occlusion — **never an opacity fade-in**. After the reveal, the
  fox group translates off-frame to the right (`foxX`), with the
  `walking` idle animation for a stride feel.
- **Static fallback** (`<900px` or `useReducedMotion`): `Hero.tsx` renders
  `ForestScene` with fixed `STATIC_FOREST` x-values — the parted
  end-state, fox visible, no sticky container or scroll transforms.
- **Footer corner fox**: a cropped `FoxGroup` (`viewBox="112 50 268 210"`,
  excludes the tail to avoid a disconnected fragment) composited with one
  `Tree` (pine, `--green-deep`) drawn after it, so the tree occludes the
  fox's lower/left body — same "peeking from behind a tree" idea as the
  retired pixel corner-fox.

---

## Page structure

Single column, single page, scroll only. Sections (do not renumber),
each its own component under `src/app/components/`, assembled in
`src/app/App.tsx`:

- § 00 — Header (`Header.tsx`)
- § 01 — Hero (sticky cinematic scene, scroll-driven) (`Hero.tsx`)
- § 02 — Validation table (`ValidationSection.tsx`)
- § 03 — Risk scores in the wild, with disclosure note (`WildSection.tsx`)
- § 04 — Method (what / roadmap / what it does NOT do) (`MethodSection.tsx`)
- § 05 — Scan your model (Colab / local / programmatic) (`ScanSection.tsx`)
- § 06 — Citation (BibTeX) (`CitationSection.tsx`)
- § 07 — Footer (About / Resources / Contact + corner fox) (`Footer.tsx`)

Shared helpers in `shared.tsx`: `FadeInUp` (scroll-reveal, respects
`useReducedMotion`), `RiskBar` (§ 02/§ 03 risk-score track), `StatusPill`
(§ 02 verdict pill — POISONED / re-scan in progress, never used for § 03).

---

## Working preferences

When making changes:

1. Treat the brief above as the source of truth. Conflicts → flag first.
2. Prioritise (a) readability and editability of code,
   (b) minimal dependencies — no new deps without justification,
   (c) graceful degradation on mobile and `prefers-reduced-motion`.
3. For design and copy decisions, propose **one** strong recommendation
   with a brief justification, not a menu of options.
4. For technical questions, give the working solution first, then
   rationale and tradeoffs.
5. Honest pushback is preferred over excessive agreement. If a request
   is technically misguided or strategically weak, say so and explain
   why before proposing alternatives.
6. French scientific register when the user writes in French — soutenu,
   no colloquialisms.

---

## Reference points

The grammar of this page follows:

- crfm.stanford.edu/helm
- swebench.com
- paperswithcode.com (leaderboard pages, not the homepage)
- mlcommons.org/benchmarks
- huggingface.co/spaces/mteb/leaderboard

When in doubt about layout density, tone, or information hierarchy,
look at these. They are the reference grammar.
