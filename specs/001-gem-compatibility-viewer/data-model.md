# Data Model: Skill Gem Compatibility Viewer

**Branch**: 001-gem-compatibility-viewer  
**Date**: 2025-02-27

## Overview

Data is derived from existing `skill-data/*.lua` (Path of Building format). No separate database; models describe in-memory structures used by the app after loading/parsing.

## Entities

### Gem (unified view for active and support)

| Field        | Type     | Description |
|-------------|----------|-------------|
| id          | string   | Unique key (e.g. internal name from Lua: "Absolution", "SupportAddedChaosDamage") |
| name        | string   | Display name (e.g. "Added Chaos Damage") |
| kind        | "active" \| "support" | Discriminator |
| primaryStat | "int" \| "str" \| "dex" | Maps from Lua `color`: 3→int, 1→str, 2→dex |
| color       | number   | Raw from Lua: 1 = Str, 2 = Dex, 3 = Int (optional for display) |
| variant     | "normal" \| "transfigured" \| "vaal" \| "awakened" | Derived from PoE gem version: normal vs transfigured vs Vaal vs awakened |
| skillTypes  | string[] | Set of skill type identifiers (e.g. "Spell", "Attack", "Damage"). From active: `skillTypes`; from support: not used for display but required for compatibility. |
| description | string   | Optional; from Lua `description` |

**Validation**: id and name non-empty; kind one of the two literals; primaryStat one of the three; skillTypes array (may be empty for display-only).

### ActiveGem (extends Gem)

- **skillTypes** (required for compatibility): Set of tags from Lua `skillTypes` keys. Used to test whether a support’s `requireSkillTypes` and `excludeSkillTypes` are satisfied.
- No additional fields beyond Gem; `kind === "active"`.

### SupportGem (extends Gem)

- **requireSkillTypes**: string[] — order matters. May contain special tokens "OR" and "AND" (from Lua `SkillType.OR`, `SkillType.AND`). If **AND** is present: expression is (OR-group) AND (OR-group) AND … (e.g. Locus Mine: `(Projectile OR ThresholdJewelProjectile) AND (RangedAttack OR ThresholdJewelRangedAttack) AND Mineable`). If only **OR** or no special tokens: active must match AT LEAST ONE type (OR). If empty, requirement passes.
- **excludeSkillTypes**: string[] — active must have NONE of these. Tokens "OR", "AND", "NOT" are ignored when checking (they are structural in Lua).
- Source: Lua `requireSkillTypes` and `excludeSkillTypes` (converted to same string identifiers as active’s skillTypes).
- `kind === "support"`.

### Compatibility

Not a stored entity; derived at runtime or precomputed and stored as a mapping.

- **activeId → supportIds**: For each active gem id, the list of support gem ids that can support it.
- **supportId → activeIds**: For each support gem id, the list of active gem ids it can support.

**Rule**: Support S can support active A iff (1) S.requireSkillTypes is satisfied (see above: AND/OR expression or at least one match when no AND), and (2) A.skillTypes contains no type from S.excludeSkillTypes (operator tokens in excludeSkillTypes are ignored).

## State (UI)

- **selectedGem**: { id, kind } | null — currently selected active or support.
- **compatibilityResult**: { activeId?, supportId?, supportIds?: string[], activeIds?: string[] } — result of last compatibility lookup for the selected gem (either “valid supports” or “compatible actives”).
- **clusters**: Gems grouped by primaryStat (int/str/dex), each group split into actives and supports for display. Can be computed once from gem list.

## Source data (Lua) → app model

- **Actives**: From `act_int.lua`, `act_str.lua`, `act_dex.lua`. Each entry: `name`, `color`, `skillTypes` (table keys like `[SkillType.Spell] = true` → extract keys as type names).
- **Supports**: From `sup_int.lua`, `sup_dex.lua` (and `sup_str.lua` if present). Each entry: `name`, `color`, `support = true`, `requireSkillTypes`, `excludeSkillTypes`. Convert SkillType references to same string identifiers as actives.
- **SkillType mapping**: Lua uses e.g. `SkillType.Spell`. Parser or build script must map these to a canonical string set (e.g. "Spell", "Attack") so require/exclude and active skillTypes use the same set.

## Relationships

- One active can be supported by many supports (many-to-many).
- One support can support many actives (many-to-many).
- Relationship is fully defined by the compatibility rule above; no separate relation table required if we compute from gem arrays.
