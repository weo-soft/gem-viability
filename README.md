# Skill Gem Compatibility Viewer

A small web app for **Path of Exile** players who want to browse **active** and **support** skill gems and see **which supports work with which skills** (and the other way around), using the same kind of type rules the game uses (`skillTypes`, requirements, exclusions, and so on).

**Live site:** [gem-viability.weosoft.org](https://gem-viability.weosoft.org/)

## What you can do

- Browse gems grouped by attribute cluster (Intelligence, Strength, Dexterity).
- Pick an **active** gem and see valid **support** gems.
- Pick a **support** gem and see which **active** gems it can apply to.

Everything runs in the browser; there is no server-side API.

## Requirements

- [Node.js](https://nodejs.org/) (LTS recommended) and npm

## Run it locally

```bash
git clone https://github.com/weo-soft/gem-viability.git
cd gem-viability
npm install
npm run dev
```

Then open the URL Vite prints (usually [http://localhost:5173](http://localhost:5173)). The dev script regenerates gem data from the Lua files under `skill-data/` before starting the server.

## Build for production

```bash
npm run build
```

Static output is written to `dist/`. You can serve that folder with any static file host.

For the GitHub Pages deployment in this repo, the project uses `npm run build:gh-pages` so asset paths match the `/gem-viability/` base path.

## Tests and lint

```bash
npm test
npm run lint
```

## Where things live

| What | Where |
|------|--------|
| Game-style gem definitions (Lua) | `skill-data/*.lua` |
| JSON built for the app | `public/gems.json` (generated; do not edit by hand for routine work) |
| App source | `src/` |
| Build script for JSON | `scripts/generate-gems-json.js` |
| Unit tests | `tests/unit/` |

More detail for contributors: 
Notes for AI assistants and automation: [AGENTS.md](AGENTS.md).

## License

This project’s application code and documentation are licensed under the [MIT License](LICENSE). Lua gem data under `skill-data/` (and generated `public/gems.json`) is attributed under the same terms as [Path of Building Community](https://github.com/PathOfBuildingCommunity/PathOfBuilding); see [NOTICE](NOTICE).

## Data and disclaimers

Gem data in `skill-data/` is derived from or aligned with **Path of Exile** content for tooling and learning. This project is an independent fan tool and is **not** affiliated with or endorsed by Grinding Gear Games. *Path of Exile* is a trademark of Grinding Gear Games.
