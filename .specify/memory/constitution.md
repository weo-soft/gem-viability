<!--
Sync Impact Report:
- Version change: (placeholder) → 1.0.0
- Modified principles: N/A (initial fill from template)
- Added sections: None
- Removed sections: One principle slot (template had 5, filled 4 per user request)
- Templates: plan-template.md ✅ (Constitution Check aligns with principles); spec-template.md ✅ (scope/requirements compatible); tasks-template.md ✅ (task types align); .specify/templates/commands/*.md N/A (directory does not exist)
- Follow-up TODOs: None
-->

# Skill Support Compatibility Viewer Constitution

## Core Principles

### I. Code Quality

Code MUST be maintainable, readable, and consistent. All contributions MUST:

- Follow project-wide style and formatting (linter/formatter config enforced).
- Use clear naming: identifiers MUST reflect purpose; avoid abbreviations unless domain-standard.
- Keep functions and modules focused: single responsibility; complexity MUST be justified.
- Remove dead code, commented-out blocks, and unused dependencies before merge.
- Document public APIs and non-obvious behavior; inline comments only where rationale is not obvious from code.

**Rationale**: Consistent quality reduces defects, speeds onboarding, and keeps the codebase predictable for long-term evolution.

### II. Testing Standards

Testing is mandatory for all user-facing and contract-changing work. The project MUST:

- Require automated tests for new behavior: unit tests for logic, integration tests for workflows and boundaries.
- Define clear test boundaries: unit tests MUST be fast and isolated; integration tests MAY touch I/O or external contracts.
- Keep tests deterministic: no flaky tests; time, randomness, and external services MUST be controlled or mocked.
- Treat test code as production code: same quality and review standards; tests MUST be readable and maintainable.
- Achieve and maintain coverage thresholds defined in the project (e.g., critical paths and public APIs covered).

**Rationale**: Reliable tests enable safe refactoring, document intended behavior, and catch regressions before release.

### III. User Experience Consistency

User-facing behavior and UI MUST be consistent and predictable. The project MUST:

- Apply a single design system or style guide for layout, components, and interaction patterns.
- Use consistent terminology, labels, and messaging across the product; errors and states MUST be communicated clearly.
- Ensure accessibility baseline: keyboard navigation, focus management, and semantic structure where applicable.
- Preserve consistent behavior across supported environments (browsers, screen sizes, or platforms as defined).
- Validate UX against user scenarios and acceptance criteria in feature specs before marking complete.

**Rationale**: Consistency reduces cognitive load, builds trust, and makes the product predictable for all users.

### IV. Performance Requirements

Performance is a non-functional requirement. The project MUST:

- Define and document performance targets (e.g., response time, throughput, resource limits) for critical paths.
- Measure and track performance where targets exist; regressions MUST be identified and addressed before release.
- Avoid obvious anti-patterns: unnecessary work on hot paths, unbounded growth, or blocking the main thread where it affects UX.
- Optimize only with evidence: profile or measure before optimizing; avoid premature optimization without data.
- Document any trade-offs between performance and other goals (e.g., simplicity, security) in design decisions.

**Rationale**: Predictable performance is part of usability and scalability; explicit targets and measurement keep the team aligned.

## Quality Gates & Constraints

- **Linting and formatting**: All code MUST pass the configured linter and formatter; CI MUST enforce this.
- **Tests**: New or changed behavior MUST be covered by automated tests; CI MUST run the test suite and block on failure.
- **Review**: All changes MUST be reviewed for compliance with this constitution; reviewers MUST verify principle alignment.
- **Documentation**: Public APIs, setup, and runbooks MUST be kept in sync with code; outdated docs MUST be updated or removed.
- **Dependencies**: New dependencies MUST be justified; security and license compliance MUST be checked.

## Development Workflow

- **Branching**: Feature work SHOULD use short-lived branches; main (or equivalent) MUST remain deployable.
- **Commits**: Commits SHOULD be logical units; messages MUST be clear and traceable to work items or specs where applicable.
- **Definition of done**: A change is done when it meets the spec, passes tests and lint, has been reviewed, and satisfies the relevant principles above.
- **Compliance**: PRs and reviews MUST confirm adherence to Code Quality, Testing Standards, UX Consistency, and Performance Requirements as applicable; violations require explicit justification and approval.

## Governance

This constitution supersedes ad-hoc practices for the Skill Support Compatibility Viewer project. All work MUST align with the principles and gates above unless an explicit exception is documented and approved.

- **Amendments**: Changes to this document require a version bump, updated Sync Impact Report (if using the speckit workflow), and communication to the team. Breaking principle changes are MAJOR; new principles or sections are MINOR; clarifications and typos are PATCH.
- **Versioning**: Constitution version follows semantic versioning (MAJOR.MINOR.PATCH) as stated in the footer.
- **Compliance**: Regular (e.g., per-PR or per-release) review MUST confirm that plans, specs, and tasks reference and satisfy these principles. Use the project’s plan and spec templates for constitution checks and quality gates.

**Version**: 1.0.0 | **Ratified**: 2025-02-27 | **Last Amended**: 2025-02-27
