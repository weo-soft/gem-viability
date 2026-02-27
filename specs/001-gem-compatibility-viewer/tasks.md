---
description: "Task list for Skill Gem Compatibility Viewer implementation"
---

# Tasks: Skill Gem Compatibility Viewer

**Input**: Design documents from `/specs/001-gem-compatibility-viewer/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story so each story can be implemented and tested independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Single Vite project: `index.html`, `src/`, `tests/`, `skill-data/` at repository root
- Paths match plan: `src/main.js`, `src/data/loader.js`, `src/compatibility.js`, `src/ui/clusters.js`, `src/ui/selection.js`, `src/ui/empty-state.js`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create project structure per plan: index.html, src/, src/data/, src/ui/, tests/, tests/unit/, public/ at repository root
- [x] T002 Initialize Vite project: package.json with vite, npm scripts (dev, build, test), and minimal dependencies
- [x] T003 [P] Configure ESLint and Prettier for JavaScript and ensure lint/format scripts run

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Data loading and compatibility logic MUST be in place before any user story UI

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Implement data loader in src/data/loader.js: load or parse skill-data/*.lua (or pre-built JSON from a build script) and expose a function that returns an array of gems with id, name, kind, primaryStat, skillTypes (actives) and requireSkillTypes/excludeSkillTypes (supports); map Lua color 1→str, 2→dex, 3→int per data-model.md
- [x] T005 Implement compatibility module in src/compatibility.js: export getSupportsForActive(activeId, gems) and getActivesForSupport(supportId, gems) per contracts/data-shape.md (active satisfies support iff active.skillTypes ⊇ support.requireSkillTypes and active.skillTypes ∩ support.excludeSkillTypes is empty)
- [x] T006 [P] Add unit tests in tests/unit/compatibility.test.js for getSupportsForActive and getActivesForSupport with fixture gems; use Vitest or similar

**Checkpoint**: Foundation ready — gem list and compatibility API available; user story implementation can begin

---

## Phase 3: User Story 1 - Browse Gems by Primary Stat (Priority: P1) 🎯 MVP

**Goal**: User sees all active and support gems grouped by Int/Str/Dex with blue/red/green; active vs support distinguishable.

**Independent Test**: Open the page; three clusters (Intelligence, Strength, Dexterity) visible with correct colors; each cluster lists active and support gems with clear labels.

### Implementation for User Story 1

- [x] T007 [US1] Create index.html with root container (e.g. #app) and script type="module" src="/src/main.js" for Vite
- [x] T008 [US1] Implement cluster rendering in src/ui/clusters.js: given gems array, group by primaryStat (int/str/dex), render three sections with blue (int), red (str), green (dex); within each section list active gems and support gems with distinct labels (e.g. "Active", "Support") per contracts/ui-behavior.md
- [x] T009 [US1] Wire app in src/main.js: call loader to get gems, pass to clusters and mount cluster DOM; ensure page loads and displays all gems in three stat-based clusters

**Checkpoint**: User Story 1 complete — user can browse all gems by primary stat and color; no selection yet

---

## Phase 4: User Story 2 - Select Active Gem and See Valid Supports (Priority: P2)

**Goal**: User selects an active gem and sees which support gems are valid for it in the compatibility panel.

**Independent Test**: Select one active gem; panel shows "Valid support gems" and the list of supports that can support it; only valid pairs shown; changing selection updates the panel.

### Implementation for User Story 2

- [x] T010 [US2] Implement selection in src/ui/selection.js: handle gem click (and keyboard where applicable); set selectedGem to { id, kind }; visually indicate selected gem; single selection only (new selection replaces previous)
- [x] T011 [US2] Wire compatibility panel in src/ui/selection.js or src/main.js: when selectedGem.kind is "active", call getSupportsForActive(selectedGem.id, gems) and display the support gems in the panel with label "Valid support gems"; when selectedGem changes, update panel immediately per FR-007
- [x] T012 [US2] Implement empty state in src/ui/empty-state.js: show "No compatible supports" when the valid-supports list is empty; show "No compatible actives" when the compatible-actives list is empty; use in compatibility panel per FR-008

**Checkpoint**: User Story 2 complete — selecting an active shows valid supports; empty state when none

---

## Phase 5: User Story 3 - Select Support Gem and See Supported Actives (Priority: P3)

**Goal**: User selects a support gem and sees which active gems it can support.

**Independent Test**: Select one support gem; panel shows "Compatible active gems" and the list of actives that support can apply to; only valid pairs; changing selection updates the panel.

### Implementation for User Story 3

- [x] T013 [US3] Wire compatibility panel for support selection: when selectedGem.kind is "support", call getActivesForSupport(selectedGem.id, gems) and display the active gems in the panel with label "Compatible active gems"; reuse same panel and empty-state component; ensure panel updates when selection changes to another support per FR-007

**Checkpoint**: User Story 3 complete — selecting a support shows compatible actives; full bidirectional compatibility view

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Error handling, consistency, and validation

- [x] T014 [P] Add error state in src/main.js or src/ui: when gem data fails to load, show a clear error message and optional retry (per spec edge cases and contracts/ui-behavior.md)
- [x] T015 Ensure keyboard navigation and focus management for gem list and selection where applicable (constitution: UX consistency)
- [x] T016 Code cleanup and run lint/format; remove dead code and ensure all paths have clear behavior
- [x] T017 Run quickstart.md validation: execute npm run dev, npm run build, npm test and confirm instructions in specs/001-gem-compatibility-viewer/quickstart.md are accurate

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Stories (Phase 3–5)**: Depend on Foundational; US2 and US3 depend on US1 (cluster UI hosts selectable gems)
- **Polish (Phase 6)**: Depends on completion of desired user stories

### User Story Dependencies

- **User Story 1 (P1)**: After Phase 2 — no dependency on US2/US3
- **User Story 2 (P2)**: After Phase 2 and US1 (selection and panel use cluster DOM and gems)
- **User Story 3 (P3)**: After Phase 2 and US1; shares selection and panel with US2 (same wiring, support direction)

### Within Each User Story

- US1: T007 (HTML) → T008 (clusters) → T009 (wire main)
- US2: T010 (selection) → T011 (panel active→supports) → T012 (empty state)
- US3: T013 (panel support→actives) reuses T010–T012

### Parallel Opportunities

- Phase 1: T003 [P] can run in parallel with T002 after T001
- Phase 2: T006 [P] can run in parallel with T005 after T004
- Phase 6: T014 [P] can run in parallel with T015–T017

---

## Parallel Example: Phase 2

```bash
# After T004 (loader) and T005 (compatibility) are done:
# Run unit tests in parallel with any remaining wiring:
Task: "Add unit tests in tests/unit/compatibility.test.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (data loader + compatibility + tests)
3. Complete Phase 3: User Story 1 (clusters, browse by stat)
4. **STOP and VALIDATE**: Open page, confirm three clusters and gem lists
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → loader and compatibility API ready
2. Add User Story 1 → browse gems by stat (MVP)
3. Add User Story 2 → select active, see valid supports
4. Add User Story 3 → select support, see compatible actives
5. Polish → error state, a11y, lint, quickstart check

### Parallel Team Strategy

- One developer: Phases 1 → 2 → 3 → 4 → 5 → 6 in order
- Multiple developers: After Phase 2, one can own US1 (clusters), another US2 (selection + panel); US3 is small addition to same panel

---

## Notes

- [P] tasks = different files or no blocking dependency
- [USn] label maps task to user story for traceability
- Each user story is independently testable per spec acceptance scenarios
- Compatibility logic (T005) must rely only on skill-data/ per plan; no external API
- Commit after each task or logical group; run lint before marking complete
