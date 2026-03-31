# Review findings (handoff)

Shared **handoff log** for multi-agent workflows. By default it lives at `docs/REVIEW_FINDINGS.md`; teams may use another path if the orchestrator declares it.

**Project overview and commands:** read **[`AGENTS.md`](../AGENTS.md)** at the repo root **before** any agent pass; it is the canonical structure and quality brief and should be attached or in context when sessions start.

| Role | Playbook | Writes here |
|------|-----------|-------------|
| **Review agent** | [REVIEW_AGENT.md](./REVIEW_AGENT.md) | **Review session** headers; **Finding** entries with `Status: open` |
| **Senior developer agent** | [SENIOR_DEVELOPER_AGENT.md](./SENIOR_DEVELOPER_AGENT.md) | **Resolution** blocks; **Status** → `resolved`, `partial`, or `wontfix`; optional **Developer session** notes |
| **Orchestrator agent** | [ORCHESTRATOR_AGENT.md](./ORCHESTRATOR_AGENT.md) | **Orchestrator run** summaries between rounds |

Append new content **below** this introduction; keep history—do not delete prior sessions unless a human explicitly archives the file.

---

<!-- New content starts below -->

## Orchestrator run — 2026-03-28 (planning)

- **Human goal:** Review application structure, code quality, refactoring and improvement potential across the whole app.
- **Scope:** Whole app (`src/`, `tests/`, `scripts/`, specs, entry HTML).
- **Severity policy:** Resolve `blocker`, `high`, and `medium`; `low` and `suggestion` optional.
- **Round:** 0 / max 5
- **Actions this round:** Intake recorded; starting structured review per `REVIEW_AGENT.md`.
- **Open findings remaining:** (pending Phase 2)
- **Next step:** Review session (Phase 2), then senior developer pass (Phase 3).

---

## Review session — 2026-03-28

- **Target:** `main` @ `e2990ac`
- **Scope:** Whole repo (viewer app, tests, data pipeline, contracts)
- **Checks:** `npm test` — pass; `npm run lint` — pass
- **Summary:** Compatibility core and tests are strong (including minion skill types and AND/OR require parsing). Main risks are accessibility (nested interactive control in cluster gem rows, search field labeling), a small DOM XSS hygiene issue in the error UI, contract doc drift vs. implemented minion-aware exclude/require typing, and duplicated variant-filter helpers between UI modules.

### [RV-2026-03-28-01] Contract omits minion-aware typing for compatibility

| Field | Value |
|--------|--------|
| **Severity** | `medium` |
| **Area** | docs |
| **Location** | `specs/001-gem-compatibility-viewer/contracts/data-shape.md` |
| **Status** | `resolved` |

**Finding**  
`data-shape.md` states exclude matching against active `skillTypes` only. `src/compatibility.js` uses `getActiveTypesForRequire` / `getActiveTypesForExclude` with `minionSkillTypes` and `ignoreMinionTypes`, which is correct for game-accurate behavior and covered by tests, but the written contract does not describe this.

**Improvement**  
Extend the contract: document `minionSkillTypes`, `ignoreMinionTypes`, and how require vs exclude choose type sets (aligned with JSDoc in `compatibility.js`).

**Verification**  
Read contract + `canSupport` / tests; ensure wording matches `tests/unit/compatibility.test.js` minion cases.

**Resolution** (2026-03-28)

- **Outcome:** `resolved`
- **Changes:** Updated `specs/001-gem-compatibility-viewer/contracts/data-shape.md` Gem shape and compatibility API bullets to document `minionSkillTypes`, `ignoreMinionTypes`, `requireSkillTypesAlternatives`, and require vs exclude type-set selection aligned with `src/compatibility.js`.
- **Verification:** Cross-checked against `canSupport` / `getActiveTypesForRequire` / `getActiveTypesForExclude` and existing minion tests.

---

### [RV-2026-03-28-02] Error UI interpolates message into `innerHTML`

| Field | Value |
|--------|--------|
| **Severity** | `medium` |
| **Area** | security / hygiene |
| **Location** | `src/main.js` (`showError`) |
| **Status** | `resolved` |

**Finding**  
`showError` sets `err.innerHTML` with the raw `message` string. Today messages come from `Error` / fetch failures, but this pattern is fragile if any path ever reflects untrusted text.

**Improvement**  
Build the error UI with `document.createElement` / `textContent` (or a single trusted template plus `textContent` for the message).

**Verification**  
Manual: trigger load failure; confirm message displays and no HTML injection from crafted text in a dev-only test if desired.

**Resolution** (2026-03-28)

- **Outcome:** `resolved`
- **Changes:** `showError` now builds the paragraph with `createElement` / `textContent` for the message fragment; `init` uses `app.replaceChildren()` instead of clearing via `innerHTML` for consistency.
- **Verification:** `npm test && npm run lint` — pass.

---

### [RV-2026-03-28-03] Search field has no accessible name

| Field | Value |
|--------|--------|
| **Severity** | `medium` |
| **Area** | a11y |
| **Location** | `src/main.js` (search `<input>`) |
| **Status** | `resolved` |

**Finding**  
The search input uses `placeholder` only. Screen readers need an associated label or `aria-label` / `aria-labelledby`.

**Improvement**  
Add `aria-label="Filter gems by name"` (or a visible `<label for=…>`).

**Verification**  
Axe or browser accessibility tree; keyboard focus announces the field purpose.

**Resolution** (2026-03-28)

- **Outcome:** `resolved`
- **Changes:** Set `aria-label="Filter gems by name"` on the search input in `src/main.js`.
- **Verification:** `npm test && npm run lint` — pass.

---

### [RV-2026-03-28-04] Wiki link nested inside gem `<button>` (nested interactive)

| Field | Value |
|--------|--------|
| **Severity** | `high` |
| **Area** | a11y |
| **Location** | `src/ui/clusters.js` (gem list buttons) |
| **Status** | `resolved` |

**Finding**  
Each cluster gem is a `<button>` that contains an `<a class="gem-wiki-link">`. Nested interactive elements violate HTML semantics and WCAG expectations; keyboard and AT users get confusing focus and activation behavior.

**Improvement**  
Restructure each list item so the wiki link is a sibling of the selection control (e.g. `<li>` containing `<button type="button">…</button>` and the wiki `<a>`), with layout preserved via CSS.

**Verification**  
Keyboard: Tab through gem row — selection and wiki open separately; HTML validator / axe nested-interactive rule; click behaviors unchanged.

**Resolution** (2026-03-28)

- **Outcome:** `resolved`
- **Changes:** Cluster gem rows use `<li class="gem-list-item">` with `<button class="gem-btn">` (icon, label, counts only) plus wiki `<a>` as sibling; added `.gem-list .gem-list-item` flex layout in `src/main.css`.
- **Verification:** `npm test && npm run lint` — pass; structure no longer nests `<a>` inside `<button>`.

---

### [RV-2026-03-28-05] Duplicated variant-filter logic in two UI modules

| Field | Value |
|--------|--------|
| **Severity** | `medium` |
| **Area** | DX / maintainability |
| **Location** | `src/ui/clusters.js`, `src/ui/selection.js` |
| **Status** | `resolved` |

**Finding**  
`filterIdsByVariantForActives`, `filterIdsByVariantForSupports`, and default filter objects / active-variant keys are duplicated. Drift could cause panel counts and cluster filtering to disagree.

**Improvement**  
Extract a small shared module (e.g. `src/ui/variant-filter-helpers.js`) used by both; keep a single source of truth.

**Verification**  
`npm test && npm run lint`; spot-check variant toggles vs panel lists.

**Resolution** (2026-03-28)

- **Outcome:** `resolved`
- **Changes:** Added `src/ui/variant-filter-helpers.js` with shared defaults, `isActiveVariant`, and id-list filters; `clusters.js` re-exports `isActiveVariant` for `main.js`; `selection.js` imports shared filters.
- **Verification:** `npm test && npm run lint` — pass.

---

### Minor notes (no ID required)

- **Suggestion:** Add a focused unit test for `requireSkillTypesAlternatives` in `compatibility.test.js` (logic exists in `compatibility.js` and generator).
- **Suggestion:** `deduplicateByIdentity` does repeated `gems.find` per id — consider a `Map` for large datasets (measure if needed).

---

## Developer session — 2026-03-28

- **Addressed finding IDs:** RV-2026-03-28-01, RV-2026-03-28-02, RV-2026-03-28-03, RV-2026-03-28-04, RV-2026-03-28-05
- **Deferred:** none
- **Final checks:** npm test — pass; npm run lint — pass

---

## Review session — 2026-03-28 (verification)

- **Target:** `main` @ `e2990ac` (fixes applied in working tree after initial review)
- **Scope:** Files touched by RV-2026-03-28-01 … 05 (`main.js`, `main.css`, `clusters.js`, `selection.js`, `variant-filter-helpers.js`, `specs/.../data-shape.md`)
- **Checks:** `npm test` — pass; `npm run lint` — pass
- **Summary:** No new blocker/high/medium issues identified in the changed areas. Cluster row structure removes nested interactive controls; error and search a11y/hygiene addressed; contract matches implementation; variant filtering is single-sourced. Optional suggestions from the initial review (alternatives unit test, `deduplicateByIdentity` Map) remain non-blocking per policy.

---

## Orchestrator run — 2026-03-28 (round 1 complete)

- **Human goal:** Review application structure, code quality, refactoring and improvement potential across the whole app.
- **Scope:** Whole app.
- **Severity policy:** Resolve `blocker`, `high`, `medium`; suggestions optional.
- **Round:** 1 / max 5
- **Actions this round:** Review session logged five findings (one high, four medium); senior developer resolved all in-policy items; verification review recorded; `npm test && npm run lint` green.
- **Open findings remaining:** none per policy (only optional suggestions under Minor notes).
- **Next step:** Stop — criteria met (`npm test && npm run lint` green; no in-policy open findings).

---

## Orchestrator run — 2026-03-31 (intake)

- **Human goal:** Review of application structure, code quality, refactoring and improvement potentials.
- **Scope:** Whole app.
- **Severity policy:** Resolve `blocker`, `high`, and `medium`; `low` and `suggestion` optional.
- **Quality gate:** `npm test && npm run lint` — (pending this run)
- **Round:** 0 / max 5
- **Actions this round:** Phase 1 intake; goal and policy restated; proceeding to structured review (`REVIEW_AGENT.md`).
- **Open findings remaining:** (pending Phase 2)
- **Next step:** Review session (Phase 2), then senior developer pass (Phase 3).

---

## Review session — 2026-03-31

- **Target:** `main` @ `b7b903b` (working tree: modified `src/compatibility.js`, `tests/unit/compatibility.test.js`)
- **Scope:** Whole app (`src/`, `tests/`, `scripts/`, `index.html`, specs, CI)
- **Checks:** `npm test` — pass; `npm run lint` — pass
- **Summary:** Architecture remains clear (loader → compatibility → UI). Compatibility logic and minion/exclude tests are thorough. `loader.js` JSDoc lags the published contract; `requireSkillTypesAlternatives` has no dedicated unit tests. **Cluster gem rows again nest the wiki anchor inside the selection `<button>`**, reintroducing nested interactives (a11y regression vs. prior handoff resolution).

### [RV-2026-03-31-01] Wiki link nested inside gem `<button>` (nested interactive)

| Field | Value |
|--------|--------|
| **Severity** | `high` |
| **Area** | a11y |
| **Location** | `src/ui/clusters.js` (active and support gem list rows) |
| **Status** | `resolved` |

**Finding**  
Each cluster gem row uses a `<button class="gem-btn">` that contains a `.gem-wiki-link` anchor. Nested interactive elements violate HTML semantics and WCAG; keyboard/AT behavior is unreliable compared to sibling button + link.

**Improvement**  
Restructure each list item: `<li class="gem-list-item">` containing `<button type="button">` (icon, label, counts only) and the wiki `<a>` as a **sibling**, with CSS flex to preserve layout. Keep `stopPropagation` on the wiki link click.

**Verification**  
Tab through rows: selection and wiki focus separately; `npm test && npm run lint`; visual parity with previous layout.

**Resolution** (2026-03-31)

- **Outcome:** `resolved`
- **Changes:** Active and support cluster rows use `<li class="gem-list-item">` with `<button class="gem-btn">` (icon, label, counts) and wiki link as sibling; `.gem-list .gem-list-item` flex layout in `src/main.css`.
- **Verification:** `npm test && npm run lint` — pass.

**Supersession** (2026-03-31)

- The sibling layout was **reverted** by product decision: the wiki `<a>` is **intentionally nested** inside the gem `<button>` again (compact chip UX; link uses `stopPropagation`). Documented in **`AGENTS.md`** (UI design decisions) and the `renderClusters` comment in **`src/ui/clusters.js`**. Future reviews should **not** re-open this as a nested-interactive defect unless stakeholders explicitly request a layout change.

---

### [RV-2026-03-31-02] `loadGems` JSDoc omits contract fields

| Field | Value |
|--------|--------|
| **Severity** | `medium` |
| **Area** | docs |
| **Location** | `src/data/loader.js` (`loadGems` `@returns`) |
| **Status** | `resolved` |

**Finding**  
`specs/001-gem-compatibility-viewer/contracts/data-shape.md` documents `minionSkillTypes`, `requireSkillTypesAlternatives`, `ignoreMinionTypes`, and variants. The `loadGems` JSDoc `@returns` line lists only a subset, so IDE hints and readers can misunderstand the loaded shape.

**Improvement**  
Align `@returns` (and a brief inline note if needed) with the contract’s `Gem` fields consumed downstream.

**Verification**  
Compare `loader.js` types to `data-shape.md` and `compatibility.js` expectations.

**Resolution** (2026-03-31)

- **Outcome:** `resolved`
- **Changes:** Expanded `loadGems` `@returns` typedef to include `variant`, `minionSkillTypes`, `requireSkillTypesAlternatives`, `ignoreMinionTypes`, `exceptional` aligned with `data-shape.md`.
- **Verification:** Cross-checked against contract and compatibility module.

---

### [RV-2026-03-31-03] No unit test for `requireSkillTypesAlternatives`

| Field | Value |
|--------|--------|
| **Severity** | `medium` |
| **Area** | tests |
| **Location** | `tests/unit/compatibility.test.js`, `src/compatibility.js` |
| **Status** | `resolved` |

**Finding**  
`canSupport` branches on `requireSkillTypesAlternatives` (OR of alternative require lists). Behavior is not covered by a focused unit test; regressions would be easy to miss.

**Improvement**  
Add at least one test where a support uses `requireSkillTypesAlternatives` with two disjoint alternatives and assert both matching actives include the support.

**Verification**  
`npm test`; test fails if alternatives branch is broken.

**Resolution** (2026-03-31)

- **Outcome:** `resolved`
- **Changes:** Added `uses requireSkillTypesAlternatives when present` test with disjoint `[['Spell'], ['Attack']]` alternatives covering Fireball and Cleave.
- **Verification:** `npm test && npm run lint` — pass.

---

### Minor notes (no ID required)

- **Suggestion:** `deduplicateByIdentity` uses `gems.find` per id — a `Map` by id would reduce repeated linear scans (measure if needed).
- **Suggestion:** Consider a `<main>` landmark and/or skip link for keyboard users (optional UX polish).

---

## Developer session — 2026-03-31

- **Addressed finding IDs:** RV-2026-03-31-01, RV-2026-03-31-02, RV-2026-03-31-03
- **Deferred:** none
- **Final checks:** `npm test` — pass; `npm run lint` — pass

---

## Review session — 2026-03-31 (verification)

- **Target:** `main` @ `b7b903b` with fixes applied (clusters, `main.css`, `loader.js`, `compatibility.test.js`)
- **Scope:** Files touched for RV-2026-03-31-01 … 03
- **Checks:** `npm test` — pass; `npm run lint` — pass
- **Summary:** Loader JSDoc matches the data contract; `requireSkillTypesAlternatives` is covered by a unit test. Cluster wiki link nesting was later **reaffirmed as intentional design** (see `AGENTS.md` and finding RV-2026-03-31-01 supersession). No new blocker/high/medium issues in the changed areas beyond that context. Optional suggestions (main landmark, `deduplicateByIdentity` Map) remain out of policy.

---

## Orchestrator run — 2026-03-31 (round 1 complete)

- **Human goal:** Review of application structure, code quality, refactoring and improvement potentials.
- **Scope:** Whole app.
- **Severity policy:** Resolve `blocker`, `high`, and `medium`; `low` and `suggestion` optional.
- **Quality gate:** `npm test && npm run lint` — pass
- **Round:** 1 / max 5
- **Actions this round:** Phase 1 intake; Phase 2 review logged three findings (one high, two medium); Phase 3 senior developer resolved all in-policy items; Phase 4 verification review recorded; quality gate green.
- **Open findings remaining:** none per policy (optional minor notes only).
- **Next step:** Stop — criteria met (`npm test && npm run lint` green; no in-policy open findings).

---

## Design note — cluster wiki link (2026-03-31)

- **Finding context:** RV-2026-03-31-01 addressed nested `<a>` inside `<button>`; the **sibling layout fix was reverted**.
- **Current rule:** The PoE wiki link stays **inside** the gem `<button>` **by design** (single compact chip; `stopPropagation` on the link for selection vs wiki). **Do not change** this for generic a11y “nested interactive” advice without an explicit product decision.
- **Authoritative references:** `AGENTS.md` → **UI design decisions**; module comment on `renderClusters` in `src/ui/clusters.js`.

---

