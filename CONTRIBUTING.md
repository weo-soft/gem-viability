# Contributing

Thanks for helping improve this project. This is a small static app (Vite + vanilla JS); keeping changes focused and tested makes review straightforward.

## Before you start

- Read [AGENTS.md](AGENTS.md) for stack, layout, commands, and quality expectations.
- Data contracts and UI behavior are summarized under [specs/001-gem-compatibility-viewer/](specs/001-gem-compatibility-viewer/).

## Development

```bash
npm install
npm run dev          # regenerates public/gems.json from skill-data/, then Vite
npm test
npm run lint
npm run format       # Prettier (optional before commit)
```

For changes that touch behavior or public contracts, run **`npm test && npm run lint`** before opening a PR.

## Pull requests

1. Fork the repository and create a branch from `main`.
2. Make focused commits with clear messages.
3. Open a PR against `main` and describe **what** changed and **why**.
4. Ensure the PR checklist (in the template) is satisfied.

## Guidelines

- **Compatibility and data loading** (`src/compatibility.js`, `src/data/loader.js`, generator): add or extend tests under [tests/unit/](tests/unit/).
- **`public/gems.json`**: do not edit by hand for routine updates; regenerate via `npm run dev`, `npm run build`, or `node scripts/generate-gems-json.js`.
- **`skill-data/`**: Lua comes from upstream-style game data; avoid “fixing” names or IDs unless you are deliberately syncing with a documented source (see [NOTICE](NOTICE)).
- **Dependencies**: prefer no new runtime dependencies; any addition should be justified (license, size, maintenance).

## Code of conduct

Participants are expected to follow the [Code of Conduct](CODE_OF_CONDUCT.md).
