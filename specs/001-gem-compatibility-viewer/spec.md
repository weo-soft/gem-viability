# Feature Specification: Skill Gem Compatibility Viewer

**Feature Branch**: `001-gem-compatibility-viewer`  
**Created**: 2025-02-27  
**Status**: Draft  
**Input**: User description: "create a page that lets the user view and select all active and Support Skill Gems from Path of Exile. Showing what Support Skill gems are valid/can Support a active Skill Gem and viceversa, which active Skill Gem a Given Support Gem can Support. The Gems should be clustered by their primary Stat(Intelligence, Strength, Dexterity)/color(blue, red, green)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse Gems by Primary Stat (Priority: P1)

The user opens the page and sees all active and support skill gems from Path of Exile, grouped by primary attribute: Intelligence (blue), Strength (red), and Dexterity (green). They can scan each cluster to find gems by type (active vs support) and by color.

**Why this priority**: Core value is seeing the full gem catalog organized in a way that matches how players think about gems (by stat/color). Without this, selection and compatibility views have no context.

**Independent Test**: Open the page; confirm three stat-based clusters (Int/Str/Dex) are visible; confirm each cluster lists active and support gems; confirm visual distinction for blue/red/green (or equivalent). Delivers value as a standalone reference.

**Acceptance Scenarios**:

1. **Given** the user is on the gem viewer page, **When** the page loads, **Then** all active and support skill gems are displayed, grouped by primary stat (Intelligence, Strength, Dexterity).
2. **Given** gems are displayed, **When** the user looks at each group, **Then** each group is clearly associated with one primary stat and its color (blue for Int, red for Str, green for Dex).
3. **Given** the gem list is visible, **When** the user scans the list, **Then** active gems and support gems are distinguishable (e.g. by label, section, or filter).
4. **Given** the page is loaded, **When** the user scrolls or navigates, **Then** the clustering by primary stat remains clear and consistent.

---

### User Story 2 - Select Active Gem and See Valid Supports (Priority: P2)

The user selects an active skill gem and immediately sees which support skill gems are valid for that active gem (i.e. can be linked with it in-game). The list of valid supports is clear and easy to scan.

**Why this priority**: Answering “what can I support this with?” is the main use case for build planning. Depends on Story 1 for gem list and selection.

**Independent Test**: Select one active gem; confirm a list or panel of compatible support gems appears; confirm only support gems that are valid for that active are shown. Delivers value as a compatibility lookup from active → supports.

**Acceptance Scenarios**:

1. **Given** the user has the gem list in view, **When** they select an active skill gem, **Then** the UI shows which support skill gems are valid for that active gem.
2. **Given** an active gem is selected, **When** the valid supports are shown, **Then** only support gems that can support that active gem are listed (no invalid combinations).
3. **Given** valid supports are displayed, **When** the user reviews them, **Then** support gems remain identifiable by name and primary stat/color.
4. **Given** an active gem is selected, **When** the user changes selection to another active gem, **Then** the list of valid supports updates to match the new active gem.

---

### User Story 3 - Select Support Gem and See Supported Actives (Priority: P3)

The user selects a support skill gem and sees which active skill gems it can support. This is the reverse view of Story 2: “which actives can this support gem apply to?”

**Why this priority**: Completes the bidirectional compatibility view. Same data as Story 2, different direction of lookup.

**Independent Test**: Select one support gem; confirm a list or panel of compatible active gems appears; confirm only active gems that can be supported by that gem are shown. Delivers value as a compatibility lookup from support → actives.

**Acceptance Scenarios**:

1. **Given** the user has the gem list in view, **When** they select a support skill gem, **Then** the UI shows which active skill gems that support can be applied to.
2. **Given** a support gem is selected, **When** the compatible actives are shown, **Then** only active gems that are valid for that support are listed (no invalid combinations).
3. **Given** compatible actives are displayed, **When** the user reviews them, **Then** active gems remain identifiable by name and primary stat/color.
4. **Given** a support gem is selected, **When** the user changes selection to another support gem, **Then** the list of compatible actives updates to match the new support gem.

---

### Edge Cases

- What happens when the user selects a gem that has no compatible gems in the other category? Display an empty state or clear “none” message instead of a blank area.
- What happens when gem data is unavailable or fails to load? Show a clear error state and, if possible, a retry or fallback (e.g. cached data).
- What happens when the user has both an active and a support selected? Define behavior: e.g. show compatibility only for the last selected, or show whether the current pair is valid.
- What happens for gems that support or are supported by a very large number of gems? Ensure the list remains usable (e.g. scrollable, searchable, or grouped) without overwhelming the page.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST display all active and support skill gems from Path of Exile that are in scope (e.g. current league or defined dataset), so the user can view the full catalog.
- **FR-002**: The system MUST group or cluster gems by primary stat: Intelligence, Strength, and Dexterity, with clear visual association to blue, red, and green respectively.
- **FR-003**: The system MUST allow the user to select one active skill gem and MUST then display which support skill gems are valid for that active gem (can support it in-game).
- **FR-004**: The system MUST allow the user to select one support skill gem and MUST then display which active skill gems that support gem can support.
- **FR-005**: The system MUST use compatibility rules that match Path of Exile’s support/active linking rules (tag-based or equivalent), so that valid and invalid pairs are correct.
- **FR-006**: The system MUST distinguish active gems from support gems in the UI (e.g. labels, sections, or filters) so the user can tell them apart at a glance.
- **FR-007**: The system MUST update the compatibility view when the user changes the selected gem (active or support), so the displayed list always matches the current selection.
- **FR-008**: The system MUST handle empty compatibility results (e.g. no valid supports for an active, or no valid actives for a support) with a clear, non-misleading state (e.g. “No compatible supports” message).

### Key Entities

- **Active Skill Gem**: A gem that grants an active skill (e.g. spell, attack). Has a name, primary stat (Int/Str/Dex), and tags that determine which support gems can apply to it.
- **Support Skill Gem**: A gem that modifies linked active skills. Has a name, primary stat (Int/Str/Dex), and rules (e.g. tags) that define which active gems it can support.
- **Compatibility**: A relationship between an active gem and a support gem indicating that the support can be linked with that active. Derived from game rules (e.g. tag compatibility).
- **Primary Stat / Color**: Intelligence (blue), Strength (red), Dexterity (green). Used to cluster gems and to align with in-game gem coloring.

## Assumptions

- Gem data (names, primary stat, compatibility rules or outcomes) is available from a defined source (e.g. curated dataset or API) and is kept in sync with the intended game version or league.
- “All active and support skill gems” means the set included in that dataset (e.g. current league or standard); no requirement to support every historical variant unless specified.
- Compatibility is determined by official or community-accepted rules (e.g. tag-based support/active matching) and is represented in the data; the UI only displays and filters by that data.
- The page is a single view or flow: one page that supports browsing, selecting, and viewing compatibility in both directions (active→support and support→active).
- Visual “color” (blue/red/green) can be implemented as color, icons, labels, or a combination, as long as the mapping to Int/Str/Dex is clear.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can open the page and, within one minute, see all active and support gems clustered by primary stat (Int/Str/Dex) and color.
- **SC-002**: A user can select an active gem and see the list of valid support gems in under three seconds (from selection to displayed result).
- **SC-003**: A user can select a support gem and see the list of compatible active gems in under three seconds (from selection to displayed result).
- **SC-004**: Compatibility results match the game’s rules: when checked against a reference (e.g. wiki or game), no invalid pair is shown as valid and no valid pair is missing (accuracy target: 100% for the dataset in use).
- **SC-005**: Users can complete the primary task (find valid supports for an active, or valid actives for a support) without leaving the page or following external links for compatibility rules.
