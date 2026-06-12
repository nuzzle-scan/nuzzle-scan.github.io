# nuzzle-scan.github.io

Public landing page for **Nuzzle**, an open-source scanner and benchmark
for detecting behavioral backdoors in fine-tuned language models on the
Hugging Face ecosystem.

Live site: <https://nuzzle-ai.github.io>
Scanner repository: <https://github.com/nuzzle-ai/scanner>

---

## What this repo is

A single-page React + Vite + TypeScript site (strict mode), styled with
Tailwind v4 and animated with Framer Motion. Illustrations are
hand-coded inline SVG — no raster assets beyond a favicon and OG image.

The page is a research artifact (closer in spirit to the HELM,
SWE-bench, or MTEB leaderboards than to a startup landing). Tone is
rigorous and ML-native; visual identity is warm, sober, and
anti-cyber-cliché. See [`CLAUDE.md`](./CLAUDE.md) for the full
editorial and design rules before making any change.

## Local development

```bash
npm install
npm run dev      # dev server at http://localhost:5173

npm run build    # production build -> dist/
npm run preview  # preview the production build locally
```

## Structure

```
.
├── index.html                  # Vite entry point
├── src/
│   ├── main.tsx                 # App entry
│   ├── app/
│   │   ├── App.tsx              # Page assembly (sections § 00-07)
│   │   └── components/
│   │       ├── Header.tsx
│   │       ├── Hero.tsx
│   │       ├── ValidationSection.tsx
│   │       ├── WildSection.tsx
│   │       ├── MethodSection.tsx
│   │       ├── ScanSection.tsx
│   │       ├── CitationSection.tsx
│   │       ├── Footer.tsx
│   │       ├── shared.tsx       # FadeInUp, RiskBar, StatusPill
│   │       └── illustration/    # Hand-coded inline SVG (fox, forest scene)
│   └── styles/
│       ├── theme.css            # CSS variables (palette, typography)
│       └── index.css            # Global styles, Tailwind entry
├── .github/workflows/deploy.yml # Build + deploy to GitHub Pages
├── CLAUDE.md                     # Project rules for any contributor or AI assistant
└── README.md
```

## Deployment

Built and deployed to GitHub Pages via GitHub Actions
(`.github/workflows/deploy.yml`) on every push to `main`.

## License

- Code: MIT
- Page content (text, illustrations): CC-BY 4.0

## Contact

- General: <contact@nuzzle.ai>
- Responsible disclosure: <disclosure@nuzzle.ai>
