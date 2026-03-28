# skill-support-compatibility-viewer — agent guidelines

Instructions for AI coding agents working in this repository. Cursor also loads `.cursor/rules/specify-rules.mdc`; keep this file and that rule set aligned when you change conventions.

## What this project is

A static web app (Vite) for browsing Path of Exile–style **skill** and **support** gems and seeing which supports match which actives (compatibility by `skillTypes`, `requireSkillTypes`, `excludeSkillTypes`, etc.). Source game data lives as Lua under `skill-data/`; the app consumes generated JSON.

## Stack

- **JavaScript (ES modules)**, HTML5, CSS3
- **Vite** for dev and build
- **No frontend framework** — keep dependencies minimal
- **Vitest** for unit tests, **ESLint** + **Prettier** for quality

## Repository layout

```text
index.html              # App shell
src/
  main.js, main.css     # Entry
  compatibility.js      # Core matching logic (test this)
  data/loader.js        # Loads gem JSON
  ui/                   # Clusters, selection, icons
scripts/
  generate-gems-json.js # Build step: skill-data/*.lua → public/gems.json
skill-data/             # *.lua source data (do not “fix” game data casually)
public/                 # Static assets; gems.json produced by script
tests/unit/             # Vitest tests
specs/001-gem-compatibility-viewer/  # Feature spec, contracts, quickstart
```

The older `backend/` / `frontend/` split in some docs is **not** the current layout; treat `src/` as the application source.

## Commands (run from repo root)

```bash
npm install
npm test && npm run lint    # Verify before finishing substantive JS changes
npm run dev                 # Regenerates gems JSON then Vite dev server
npm run build               # Production build to dist/
npm run format              # Prettier on src/ and tests/
```

GitHub Pages build uses `npm run build:gh-pages` (base path `/gem-viability/`).

## Data flow

1. `scripts/generate-gems-json.js` reads `skill-data/*.lua` and writes `public/gems.json` (also used in dev via `npm run dev`).
2. The app loads that JSON through `src/data/loader.js`.
3. Selection flows through `src/ui/` and calls `getSupportsForActive` / `getActivesForSupport` in `src/compatibility.js`.

If you change Lua shape or parsing, update the generator script and any tests; if you change the JSON contract, see `specs/001-gem-compatibility-viewer/contracts/data-shape.md`.

## Where to look

| Topic | Location |
|--------|-----------|
| Local dev & paths | `specs/001-gem-compatibility-viewer/quickstart.md` |
| UI behavior contract | `specs/001-gem-compatibility-viewer/contracts/ui-behavior.md` |
| Data shape | `specs/001-gem-compatibility-viewer/contracts/data-shape.md` |
| Constitution / quality bar | `.specify/memory/constitution.md` |

## Conventions for agents

- Prefer **small, focused diffs**; match existing style and patterns in `src/`.
- After logic changes in `src/compatibility.js` or data loading, extend or add tests under `tests/unit/`.
- Do not add heavy runtime dependencies without a strong reason (per project constitution).
- Regenerating or editing `public/gems.json` is usually done via the script, not by hand.

## Recent feature context

- **001-gem-compatibility-viewer**: Vite + vanilla JS viewer, gem JSON from Lua, cluster UI (Int/Str/Dex), compatibility panel for active ↔ support selection.

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
