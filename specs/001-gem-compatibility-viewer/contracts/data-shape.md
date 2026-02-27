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
  requireSkillTypes?: string[]  // for supports only
  excludeSkillTypes?: string[]  // for supports only
```

- Actives: `skillTypes` is the set of skill type identifiers. `requireSkillTypes` and `excludeSkillTypes` are absent or ignored.
- Supports: `requireSkillTypes` and `excludeSkillTypes` are the sets used for compatibility. `skillTypes` may be empty or unused.

Primary stat MUST map from Lua `color`: 1 → "str", 2 → "dex", 3 → "int".

## Compatibility API

The compatibility module MUST expose:

- **getSupportsForActive(activeId, gems)**  
  Returns: array of support gem ids that can support the given active (by id).  
  Rule: support S can support active A iff (1) S.requireSkillTypes is satisfied—when it contains "AND", the list is parsed as (OR-group) AND (OR-group) AND …; when it contains only "OR" or no operators, at least one type must match; empty passes—and (2) A.skillTypes ∩ (S.excludeSkillTypes minus operator tokens "OR"/"AND"/"NOT") is empty.

- **getActivesForSupport(supportId, gems)**  
  Returns: array of active gem ids that the given support can support.  
  Same rule, inverse direction.

Both functions MUST use only the provided `gems` array and the rule above; no external API or hidden state.

## Precomputed index (optional)

If the app precomputes compatibility for performance:

- **activeToSupports**: Map&lt;activeId, supportId[]&gt;
- **supportToActives**: Map&lt;supportId, activeId[]&gt;

These MUST satisfy: for every (activeId, supportId) in the relation, `getSupportsForActive(activeId, gems)` includes supportId and `getActivesForSupport(supportId, gems)` includes activeId.
