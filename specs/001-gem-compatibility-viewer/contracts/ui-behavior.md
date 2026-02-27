# UI Behavior Contract

**Feature**: 001-gem-compatibility-viewer  
**Scope**: Single page; no routing.

## Page structure

- **Gem clusters**: Three clusters (Intelligence, Strength, Dexterity) with distinct visual color (blue, red, green). Each cluster shows:
  - Active gems (list or grid)
  - Support gems (list or grid)
  - Clear labeling so "active" vs "support" is distinguishable (FR-006).

- **Selection**: User can select one gem (active or support) by click or keyboard. Selected gem is visually indicated.

- **Compatibility panel**: When an active gem is selected, the panel shows "Valid support gems" and the list of support gems that can support it. When a support gem is selected, the panel shows "Compatible active gems" and the list of active gems it can support. When no gem is selected, the panel shows neutral content (e.g. instruction or empty).

- **Empty state**: If the selected active has no valid supports (or selected support has no compatible actives), the panel MUST show an explicit empty state (e.g. "No compatible supports") (FR-008).

- **Update on selection change**: When the user selects a different gem, the compatibility panel MUST update immediately to show the result for the new selection (FR-007).

## Selection semantics

- Only one gem can be selected at a time. Selecting a new gem replaces the previous selection.
- Compatibility result always reflects the current selection (active → supports, or support → actives).

## Accessibility and consistency

- Keyboard navigation and focus management where applicable (constitution: UX consistency).
- Consistent terminology: "Active skill gem", "Support skill gem", "Valid supports", "Compatible actives".
- Error state: If gem data fails to load, show a clear error message and optional retry (per spec edge cases).
