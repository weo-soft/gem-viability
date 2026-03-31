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
docs/                   # Agent playbooks (review, orchestrator, etc.)
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

If you change Lua shape or parsing, update the generator script, loader expectations, and tests so the pipeline stays consistent.

## Project constitution

The following principles and gates apply to all work on this repository.

### I. Code quality

Code must be maintainable, readable, and consistent:

- Follow project-wide style and formatting (linter/formatter config enforced).
- Use clear naming: identifiers should reflect purpose; avoid abbreviations unless domain-standard.
- Keep functions and modules focused: single responsibility; complexity must be justified.
- Remove dead code, commented-out blocks, and unused dependencies before merge.
- Document public APIs and non-obvious behavior; inline comments only where rationale is not obvious from code.

### II. Testing standards

Testing is mandatory for user-facing and contract-changing work:

- Require automated tests for new behavior: unit tests for logic; add integration-style tests when workflows or I/O boundaries need them.
- Keep unit tests fast and isolated; control or mock time, randomness, and external services so tests stay deterministic.
- Treat test code with the same quality bar as production code; keep tests readable.
- Cover critical paths and public APIs; extend tests when behavior changes.

### III. User experience consistency

User-facing behavior and UI must be consistent and predictable:

- Use a coherent layout, typography, and interaction patterns across the app.
- Use consistent terminology, labels, and messaging; communicate errors and empty states clearly.
- Meet an accessibility baseline: keyboard navigation, focus management, and semantic structure where applicable.
- Behavior should remain consistent across supported browsers and screen sizes.

### IV. Performance requirements

- Avoid unnecessary work on hot paths, unbounded growth, or blocking the main thread in ways that hurt UX.
- Optimize when justified by measurement or profiling, not by default.
- Document meaningful trade-offs between performance and simplicity (or other goals) when they matter.

### Quality gates and constraints

- **Linting and formatting**: All code must pass the configured linter and formatter; CI should enforce this.
- **Tests**: New or changed behavior must be covered by automated tests; CI must run the suite and block on failure.
- **Review**: Changes should be reviewed for alignment with this constitution.
- **Documentation**: README, setup steps, and public APIs must stay in sync with code; remove or update stale docs.
- **Dependencies**: New dependencies must be justified; check security and license implications.

### Development workflow

- **Branching**: Prefer short-lived branches; default branch should stay deployable.
- **Commits**: Prefer logical commits with clear messages traceable to the work.
- **Definition of done**: A change is done when it meets agreed requirements, passes tests and lint, has been reviewed as needed, and satisfies the principles above.

### Governance

This constitution supersedes ad-hoc practices for this project. Work must align with the principles and gates above unless an exception is documented and agreed.

- **Amendments**: Changes to these principles belong in this file; bump the version note below when you materially amend them.
- **Compliance**: Reviews and PRs should confirm adherence to code quality, testing, UX consistency, and performance expectations as applicable; violations need explicit justification.

**Constitution version**: 1.0.0 (carried from project ratification 2025-02-27; substance merged into `AGENTS.md` for a single source of truth)

## Conventions for agents

- Prefer **small, focused diffs**; match existing style and patterns in `src/`.
- After logic changes in `src/compatibility.js` or data loading, extend or add tests under `tests/unit/`.
- Do not add heavy runtime dependencies without a strong reason (see constitution).
- Regenerate `public/gems.json` via `scripts/generate-gems-json.js` (e.g. through `npm run dev` / `npm run build`), not by hand for routine work.

### UI design decisions (do not change without an explicit product decision)

- **Cluster gem rows (`src/ui/clusters.js`):** The PoE wiki link (`<a class="gem-wiki-link">`) is **intentionally nested inside** the gem `<button>` so each gem stays a single compact chip; the link uses `stopPropagation()` so activating the row for selection and opening the wiki remain separate. **Do not refactor** to a sibling button-plus-link layout to satisfy “nested interactive” lint rules unless stakeholders explicitly request that tradeoff.

## Recent feature context

- **Gem compatibility viewer**: Vite + vanilla JS viewer, gem JSON from Lua, cluster UI (Int/Str/Dex), compatibility panel for active ↔ support selection.

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
