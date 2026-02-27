# Implementation Plan: Skill Gem Compatibility Viewer

**Branch**: `001-gem-compatibility-viewer` | **Date**: 2025-02-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-gem-compatibility-viewer/spec.md`

## Summary

Single-page viewer for Path of Exile active and support skill gems: browse gems clustered by primary stat (Intelligence/Strength/Dexterity — blue/red/green), select an active to see valid supports, or select a support to see compatible actives. Compatibility is derived entirely from existing `skill-data/` Lua files (Path of Building format): support gems define `requireSkillTypes` and `excludeSkillTypes`; active gems define `skillTypes`; a support can support an active when the active matches at least one required type (or none are required) and none of the excluded types. Built with Vite, vanilla HTML/CSS/JS, minimal libraries.

## Technical Context

**Language/Version**: JavaScript (ES module), HTML5, CSS3  
**Primary Dependencies**: Vite (build/dev), minimal runtime deps (e.g. no framework; optional small lib for Lua parsing or use pre-built JSON from script)  
**Storage**: N/A (gem data loaded from `skill-data/*.lua` at build time or runtime; no persistence)  
**Testing**: Vitest or similar (vanilla JS), plus manual/browser tests for UI  
**Target Platform**: Modern browsers (ES module support); dev via Vite  
**Project Type**: Single-page web application (frontend-only)  
**Performance Goals**: Page load &lt; 3s; selection-to-result &lt; 3s (per spec SC-002, SC-003); list rendering and filtering without blocking main thread  
**Constraints**: Vanilla HTML/CSS/JS where possible; minimal libraries; compatibility logic MUST be driven by `skill-data/` only  
**Scale/Scope**: One page; hundreds of gems; compatibility computed client-side from parsed skill data

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Code Quality**: Linter/formatter (e.g. ESLint, Prettier) will be configured; clear naming; single responsibility; no dead code.
- **Testing Standards**: Unit tests for compatibility logic (tag matching); tests for data parsing if done in-app; UI/interaction testable manually or via lightweight automation.
- **User Experience Consistency**: Single design system (clusters by stat, clear active vs support, consistent selection feedback and empty states).
- **Performance Requirements**: Targets from spec (load, selection response); avoid blocking main thread; optimize only with evidence.

No violations. Complexity Tracking table left empty.

## Project Structure

### Documentation (this feature)

```text
specs/001-gem-compatibility-viewer/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (UI/data contracts)
└── tasks.md             # Phase 2 output (/speckit.tasks — not created by plan)
```

### Source Code (repository root)

```text
skill-data/              # Existing: act_int.lua, act_str.lua, act_dex.lua, sup_int.lua, sup_dex.lua, sup_str.lua
index.html               # Single entry page
src/
├── main.js              # App bootstrap, load data, wire UI
├── data/
│   └── loader.js        # Load/parse or fetch pre-built gem + compatibility data
├── compatibility.js     # Pure logic: given active/support + data, compute valid pairs
├── ui/
│   ├── clusters.js      # Render clusters by stat (Int/Str/Dex), active vs support
│   ├── selection.js     # Handle gem selection, show compatibility panel
│   └── empty-state.js   # "No compatible supports/actives" messaging
public/                  # Static assets if any
tests/
├── unit/
│   └── compatibility.test.js
└── integration/         # Optional: browser or E2E
```

**Structure Decision**: Single Vite project at repo root. Gem data stays in `skill-data/`; either (a) parse Lua at build time and emit JSON, or (b) parse Lua in browser via a small parser. Compatibility logic is pure JS and testable without DOM. UI is vanilla JS (no framework) with minimal structure (main, data, compatibility, ui).

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| (none)    | —          | —                                   |
