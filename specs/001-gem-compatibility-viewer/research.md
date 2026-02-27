# Research: Skill Gem Compatibility Viewer

**Branch**: 001-gem-compatibility-viewer  
**Date**: 2025-02-27

## Decisions

### 1. Tech stack: Vite + vanilla HTML/CSS/JS

- **Decision**: Use Vite for dev server and build; no React/Vue/Svelte. Vanilla HTML, CSS, and JavaScript with minimal libraries.
- **Rationale**: User requirement for minimal libraries and vanilla stack. Vite provides fast HMR and simple ES module bundling without imposing a framework.
- **Alternatives considered**: Create React App / Vite+React (rejected: framework not desired); plain static files without bundler (rejected: no HMR, harder to structure modules).

### 2. Source of compatibility: skill-data/ Lua only

- **Decision**: Whether a support gem can support an active gem is determined solely from the existing `skill-data/` Lua files. Support gems have `requireSkillTypes` and `excludeSkillTypes`; active gems have `skillTypes`. A support can support an active iff the active matches at least one type in `requireSkillTypes` (or requireSkillTypes is empty) and none of the types in `excludeSkillTypes`.
- **Rationale**: User explicitly stated compatibility is determined by data in `@skill-data/` files. No external API or separate compatibility table.
- **Alternatives considered**: External PoE API (rejected: not in scope); hardcoded rules (rejected: must follow skill-data).

### 3. Lua → consumable data: parse at build or load

- **Decision**: Either (a) build-time script that parses Lua and emits JSON (e.g. `npm run build:data`), or (b) small Lua parser in JS run in browser to parse `skill-data/*.lua`. Prefer (a) if Lua parsing in JS is heavy; (b) if we want no build step for data.
- **Rationale**: Lua is not natively consumable in the browser. Build-time conversion keeps runtime simple and allows validation once. In-browser Lua parsing is possible via a small parser or subset parser but adds complexity; a Node script using a Lua parser or regex/heuristic extraction is simpler for PoB-style tables.
- **Alternatives considered**: Manual JSON copy (rejected: not maintainable); full Lua VM in browser (rejected: too heavy for “minimal libraries”).

### 4. Primary stat / color mapping

- **Decision**: Use `color` from skill-data: 1 = Strength (red), 2 = Dexterity (green), 3 = Intelligence (blue). Cluster gems by this value; display with matching colors.
- **Rationale**: File names (`act_str.lua`, `act_dex.lua`, `act_int.lua`, `sup_*`) and PoE convention align: Str=red, Dex=green, Int=blue. Lua `color = 1|2|3` matches this ordering in PoB.
- **Alternatives considered**: Derive from file name only (rejected: color is explicit in data); custom mapping (rejected: data already has color).

### 5. SkillType enum handling

- **Decision**: When parsing Lua we must map `SkillType.Spell`, `SkillType.Attack`, etc. to string or numeric identifiers. Use the same identifiers for both active `skillTypes` and support `requireSkillTypes`/`excludeSkillTypes` so compatibility is a simple set inclusion check.
- **Rationale**: PoB Lua references a global `SkillType` table. Parser or build script must either (1) parse the PoB SkillType definition, or (2) extract literal names (e.g. "Spell", "Attack") from the Lua and define a canonical list. Matching by string key is sufficient for compatibility logic.
- **Alternatives considered**: Numeric IDs only (rejected: need to obtain PoB’s ID mapping); ignore excludeSkillTypes (rejected: would show invalid pairs).

## Resolved items (from Technical Context)

- All “NEEDS CLARIFICATION” items resolved by user input and skill-data inspection: Vite + vanilla stack, compatibility from skill-data only, clustering by primary stat/color.
