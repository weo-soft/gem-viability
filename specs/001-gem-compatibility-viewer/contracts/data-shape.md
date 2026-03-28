# Data Shape Contract

**Feature**: 001-gem-compatibility-viewer  
**Consumers**: `src/data/loader.js`, `src/compatibility.js`, `src/ui/*`

## Loaded gem list

The module that loads or parses skill-data MUST expose a list of gems with at least:

```text
Gem:
  id: string
  name: string
  kind: "active" | "support"
  primaryStat: "int" | "str" | "dex"
  variant: "normal" | "transfigured" | "vaal" | "awakened"
  skillTypes: string[]          // for actives: tags from Lua skillTypes
  minionSkillTypes?: string[]   // for some actives: tags for the minion’s skill (see compatibility rules below)
  requireSkillTypes?: string[]  // for supports only
  excludeSkillTypes?: string[]  // for supports only
  requireSkillTypesAlternatives?: string[][]  // for supports: OR of alternative require lists (see compatibility module)
  ignoreMinionTypes?: boolean   // for supports: when true, minionSkillTypes are not merged into require matching
```

- Actives: `skillTypes` is the set of skill type identifiers. `minionSkillTypes` may be present for skills whose minion attacks have their own tags (e.g. Animate Weapon variants, Raise Zombie). `requireSkillTypes` / `excludeSkillTypes` on actives are absent or ignored.
- Supports: `requireSkillTypes` (or `requireSkillTypesAlternatives`) and `excludeSkillTypes` drive compatibility. `skillTypes` on supports may be empty or unused. `ignoreMinionTypes` opts out of merging `minionSkillTypes` into the type set used for **require** matching (see `src/compatibility.js`).

Primary stat MUST map from Lua `color`: 1 → "str", 2 → "dex", 3 → "int".

## Compatibility API

The compatibility module MUST expose:

- **getSupportsForActive(activeId, gems)**  
  Returns: array of support gem ids that can support the given active (by id).  
  Rule: support S can support active A iff (1) S’s require list is satisfied—using `requireSkillTypesAlternatives` if present (any alternative passes), else `requireSkillTypes`; matching uses a type set derived from A: `skillTypes` plus `minionSkillTypes` unless S.`ignoreMinionTypes` is true; parsing of `requireSkillTypes` / alternatives follows the same AND/OR rules as in code (when "AND" is present, (OR-group) AND …; otherwise at least one token matches)—and (2) **exclude** matching uses a type set from A: if A has `minionSkillTypes` and S does not set `ignoreMinionTypes`, only `minionSkillTypes` are used; otherwise `skillTypes`. No token in that set may appear in S.excludeSkillTypes except operator tokens "OR"/"AND"/"NOT", which are ignored for the membership check.

- **getActivesForSupport(supportId, gems)**  
  Returns: array of active gem ids that the given support can support.  
  Same rule as above, evaluated for each active with the fixed support S.

Both functions MUST use only the provided `gems` array and the rule above; no external API or hidden state.

## Precomputed index (optional)

If the app precomputes compatibility for performance:

- **activeToSupports**: Map&lt;activeId, supportId[]&gt;
- **supportToActives**: Map&lt;supportId, activeId[]&gt;

These MUST satisfy: for every (activeId, supportId) in the relation, `getSupportsForActive(activeId, gems)` includes supportId and `getActivesForSupport(supportId, gems)` includes activeId.
