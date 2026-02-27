# Quickstart: Skill Gem Compatibility Viewer

**Branch**: 001-gem-compatibility-viewer  
**Date**: 2025-02-27

## Prerequisites

- Node.js (LTS) and npm
- Repository with `skill-data/` Lua files present

## Setup

```bash
# From repository root
npm install
```

## Development

```bash
npm run dev
```

Opens the app (or points to the dev server URL, e.g. http://localhost:5173). Use the page to:

1. Browse gems by cluster (Int/Str/Dex — blue/red/green).
2. Select an active gem → see valid support gems.
3. Select a support gem → see compatible active gems.

## Build

```bash
npm run build
```

Output in `dist/` (or as configured by Vite). Serve with any static server.

## Tests

```bash
npm test
```

Runs unit tests (e.g. compatibility logic). Add integration/E2E as needed.

## Key paths

| Purpose              | Location |
|----------------------|----------|
| Gem data (source)     | `skill-data/*.lua` |
| App entry             | `index.html`, `src/main.js` |
| Data loading          | `src/data/loader.js` |
| Compatibility logic   | `src/compatibility.js` |
| UI (clusters, selection) | `src/ui/` |
| Unit tests            | `tests/unit/` |

## Data flow

1. Load/parse `skill-data/` (build-time script or runtime parser) → list of gems (active + support) with ids, names, primaryStat, skillTypes / requireSkillTypes / excludeSkillTypes.
2. On selection: call `getSupportsForActive(activeId, gems)` or `getActivesForSupport(supportId, gems)` and render the result in the compatibility panel.
3. Clusters are built once from the gem list grouped by primaryStat and kind (active vs support).

## Constitution alignment

- **Code quality**: Lint and format before commit; see `.specify/memory/constitution.md`.
- **Testing**: Compatibility logic covered by unit tests; UI testable manually or via lightweight automation.
- **UX**: Single design system; consistent labels and empty states (see [contracts/ui-behavior.md](./contracts/ui-behavior.md)).
- **Performance**: Load and selection response targets in spec; avoid blocking main thread.
