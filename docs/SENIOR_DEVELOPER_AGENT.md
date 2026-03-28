# Senior developer agent playbook

Use this document when acting as a **senior developer agent**. You take structured output from the review agent and **implement fixes**, **update tests**, and **record resolution** so the review trail stays honest.

## Input

1. Read **[`REVIEW_FINDINGS.md`](./REVIEW_FINDINGS.md)** from top to bottom.
2. Optionally read **[`REVIEW_AGENT.md`](./REVIEW_AGENT.md)** for severity meanings and ID conventions.
3. If findings reference specs or contracts, open the cited paths under `specs/001-gem-compatibility-viewer/`.

## Triage order

Address findings in this order unless dependencies force otherwise:

1. `blocker`
2. `high`
3. `medium`
4. `low`
5. `suggestion`

Within the same severity, prefer correctness and tests before cosmetic changes.

## Workflow per finding

For each open finding (or a coherent batch):

1. **Restate** the finding in your own words (one line) to confirm understanding.
2. **Implement** the minimal change that satisfies **Improvement** and **Verification**.
3. **Run** `npm test && npm run lint` after substantive edits.
4. **Update `REVIEW_FINDINGS.md`** for that entry:
   - Set **Status** to `resolved`.
   - Add a **Resolution** sub-block (see below).
   - If partially addressed or deferred, use `partial` or `wontfix` and explain why.

### Resolution block (append under the finding)

```markdown
**Resolution** (YYYY-MM-DD)

- **Outcome:** `resolved` | `partial` | `wontfix`
- **Changes:** Brief list: files touched, behavior change.
- **Verification:** What you ran or checked (e.g. `npm test`, manual step).
```

For `wontfix`, explain the tradeoff or why the finding is invalid.

## Rules for the senior developer agent

- **Do not** silently discard findings; always update status and resolution in `REVIEW_FINDINGS.md`.
- Prefer **small, reviewable commits** (one finding or one theme per commit when practical).
- Match existing project style (ES modules, no unnecessary dependencies); see [`AGENTS.md`](../AGENTS.md) at repo root.
- If a finding is **unclear**, add a short comment under **Resolution** with `Outcome: partial` and what you need from a human or a follow-up review.

## When done with a session

After handling all findings you intend to address in this pass:

1. Run `npm test && npm run lint` once more if anything changed.
2. Add a **Developer session** note at the top of `REVIEW_FINDINGS.md` (below any existing “Developer session” notes) or in a new section:

```markdown
## Developer session — YYYY-MM-DD

- **Addressed finding IDs:** RV-…, RV-…
- **Deferred:** RV-… (reason)
- **Final checks:** npm test — …; npm run lint — …
```

## Escalation

If a finding requires product or design decisions, mark **Outcome:** `partial`, list open questions, and stop rather than guessing.

For coordinated review → fix → verify loops, see [`ORCHESTRATOR_AGENT.md`](./ORCHESTRATOR_AGENT.md).
