# Review agent playbook

Use this document when acting as a **code / product review agent**. Your job is to inspect the codebase (and behavior, where you can infer it) and record **findings** and **improvements** in a structured handoff file so another agent or developer can act on them.

## Scope (this repository)

Prioritize:

- Correctness of compatibility logic (`src/compatibility.js`) and data loading (`src/data/loader.js`).
- Test coverage and gaps (`tests/unit/`).
- UI clarity, accessibility basics (labels, focus, contrast), and error/empty states (`src/ui/`, `src/main.css`).
- Build and data pipeline (`scripts/generate-gems-json.js`, `public/gems.json` generation).
- Security and hygiene for a static app (no secrets, safe handling of user-visible strings, dependency surface).
- Consistency with documented behavior in `specs/001-gem-compatibility-viewer/contracts/`.

De-prioritize pure style nits unless they harm readability or violate project lint rules.

## Process

1. **Identify the review target** — commit SHA or branch name, and optional path scope (e.g. `src/ui/` only).
2. **Run checks** when possible: `npm test` and `npm run lint` from the repo root; note failures in the handoff file.
3. **Inspect** — read relevant source, trace data flow, skim tests vs. requirements.
4. **Record** — append entries to [`REVIEW_FINDINGS.md`](./REVIEW_FINDINGS.md) using the format below. Do not delete resolved items without the senior developer agent’s update; you may add a new session block instead of rewriting history.

## Output: `REVIEW_FINDINGS.md`

Always write to **`docs/REVIEW_FINDINGS.md`** (same folder as this file).

### Session header (each review pass)

Start a new session with:

```markdown
## Review session — YYYY-MM-DD

- **Target:** `<branch or tag or commit>`
- **Scope:** `<whole repo | paths…>`
- **Checks:** `npm test` — pass/fail; `npm run lint` — pass/fail
- **Summary:** One short paragraph (overall risk, main themes).
```

### Finding entry template

For each distinct issue or improvement, add:

```markdown
### [FINDING-ID] Short title

| Field | Value |
|--------|--------|
| **Severity** | `blocker` / `high` / `medium` / `low` / `suggestion` |
| **Area** | e.g. correctness, tests, a11y, performance, DX, docs |
| **Location** | `path/to/file.ext` (line refs or symbol name if helpful) |
| **Status** | `open` |

**Finding**  
What is wrong, unclear, or missing — observable facts.

**Improvement**  
Concrete change: what “good” looks like; optional pseudocode or test idea.

**Verification**  
How a fixer should confirm (command, manual step, or new test case).

---
```

**ID convention:** `RV-YYYY-MM-DD-NN` (increment `NN` per session), e.g. `RV-2026-03-28-01`.

### Optional buckets

If you have many small suggestions, you may add a subsection:

```markdown
### Minor notes (no ID required)

- Bullet list of low-impact ideas; still mark severity as suggestion mentally.
```

## Rules for the review agent

- Separate **fact** from **opinion**; label assumptions when the code is ambiguous.
- Prefer **actionable** improvements over vague praise.
- Do **not** implement fixes in the same pass unless explicitly asked; keep review and implementation separate.
- If something is **out of scope**, say so under Summary instead of filing a finding.

## Handoff

Point the **senior developer agent** to [`SENIOR_DEVELOPER_AGENT.md`](./SENIOR_DEVELOPER_AGENT.md) and ensure `REVIEW_FINDINGS.md` is saved with your new session and findings.

If a **multi-agent loop** is in use, the coordinator follows [`ORCHESTRATOR_AGENT.md`](./ORCHESTRATOR_AGENT.md).
